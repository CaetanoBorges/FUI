import Header from '../componentes/Header.js';
import { limparCorridaAtiva, obterCorridaAtiva, salvarCorridaAtiva, salvarCorridaNoHistorico } from '../dados/corridaStorage.js';
import './CorridaAtiva.css';

let intervaloCorrida = null; 
let handlerCancelar = null;
let handlerPrincipal = null;
let concluidaAutomaticamente = false;
let elementoModalCancelar = null;

const CANCEL_MOTIVOS = [
    'Mudei de planos',
    'Demorou muito a aceitar',
    'Encontrei outra opção de transporte',
    'Errei no destino',
    'Motorista não apareceu',
    'Outro motivo',
];

function abrirModalCancelamento(onConfirm) {
    if (elementoModalCancelar) return;

    const motivosHtml = CANCEL_MOTIVOS.map((m, i) => `
        <div class="ride-cancel-motivo" data-idx="${i}" role="radio" aria-checked="false" tabindex="0">
            <span class="ride-cancel-motivo-radio"></span>
            <span class="ride-cancel-motivo-label">${m}</span>
        </div>
    `).join('');

    const el = document.createElement('div');
    el.className = 'ride-cancel-overlay';
    el.innerHTML = `
        <div class="ride-cancel-sheet" role="dialog" aria-modal="true" aria-label="Confirmar cancelamento">
            <div class="ride-cancel-sheet-header">
                <div class="ride-cancel-sheet-title"><i class="fa-solid fa-ban"></i> Cancelar corrida</div>
                <p class="ride-cancel-sheet-sub">Selecione o motivo do cancelamento. Esta informação é importante para melhorarmos o serviço.</p>
            </div>
            <div class="ride-cancel-motivos" id="rcc-motivos">${motivosHtml}</div>
            <div class="ride-cancel-outro-wrap" id="rcc-outro-wrap" style="display:none">
                <span class="ride-cancel-outro-label">Descreva o motivo</span>
                <textarea class="ride-cancel-textarea" id="rcc-outro-texto" placeholder="Escreva o motivo do cancelamento..." maxlength="200"></textarea>
            </div>
            <div class="ride-cancel-actions">
                <button type="button" class="ride-cancel-btn-voltar" id="rcc-voltar">Voltar</button>
                <button type="button" class="ride-cancel-btn-confirmar" id="rcc-confirmar" disabled>
                    <i class="fa-solid fa-ban"></i> Confirmar cancelamento
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(el);
    elementoModalCancelar = el;

    // Animar entrada
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));

    let motivoSelecionado = null;
    const OUTRO_IDX = CANCEL_MOTIVOS.length - 1;

    function fechar() {
        el.classList.remove('visible');
        el.addEventListener('transitionend', () => { el.remove(); elementoModalCancelar = null; }, { once: true });
    }

    function validar() {
        const btnConfirmar = document.getElementById('rcc-confirmar');
        if (!btnConfirmar) return;
        const outroTexto = document.getElementById('rcc-outro-texto')?.value?.trim() || '';
        const outroValido = motivoSelecionado !== OUTRO_IDX || outroTexto.length > 0;
        btnConfirmar.disabled = motivoSelecionado === null || !outroValido;
    }

    el.querySelector('#rcc-motivos').addEventListener('click', (e) => {
        const item = e.target.closest('.ride-cancel-motivo');
        if (!item) return;
        motivoSelecionado = parseInt(item.dataset.idx, 10);
        el.querySelectorAll('.ride-cancel-motivo').forEach(m => {
            const sel = parseInt(m.dataset.idx, 10) === motivoSelecionado;
            m.classList.toggle('selected', sel);
            m.setAttribute('aria-checked', sel ? 'true' : 'false');
        });
        const outroWrap = document.getElementById('rcc-outro-wrap');
        if (outroWrap) outroWrap.style.display = motivoSelecionado === OUTRO_IDX ? '' : 'none';
        validar();
    });

    document.getElementById('rcc-outro-texto')?.addEventListener('input', validar);

    document.getElementById('rcc-voltar').addEventListener('click', fechar);

    // Fechar ao clicar no fundo
    el.addEventListener('click', (e) => { if (e.target === el) fechar(); });

    document.getElementById('rcc-confirmar').addEventListener('click', () => {
        if (motivoSelecionado === null) return;
        const outroTexto = document.getElementById('rcc-outro-texto')?.value?.trim() || '';
        const motivoLabel = motivoSelecionado === OUTRO_IDX
            ? (outroTexto || 'Outro motivo')
            : CANCEL_MOTIVOS[motivoSelecionado];
        fechar();
        onConfirm(motivoLabel);
    });
}

const FLUXO_CORRIDA = [
    {
        key: 'searching',
        label: 'Procurando motorista',
        description: 'Estamos a procurar o motorista mais próximo para a sua rota.',
        durationMs: 12000,
        tone: 'default'
    },
    {
        key: 'driver_on_way',
        label: 'Motorista a caminho',
        description: 'A corrida foi aceite e o motorista já está a dirigir-se ao ponto de partida.',
        durationMs: 18000,
        tone: 'default'
    },
    {
        key: 'boarding',
        label: 'Embarque em andamento',
        description: 'O motorista chegou ao ponto combinado. Prepare-se para iniciar a viagem.',
        durationMs: 12000,
        tone: 'warning'
    },
    {
        key: 'in_progress',
        label: 'Corrida em andamento',
        description: 'A viagem está em curso até ao destino selecionado pelo passageiro.',
        durationMs: 28000,
        tone: 'default'
    }
];

function formatarIso(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('pt-AO', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return iso;
    }
}

function formatarRestante(ms) {
    const safe = Math.max(0, ms);
    const totalSeconds = Math.floor(safe / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

function obterEtapaCorrida(ride) {
    if (!ride) {
        return {
            key: 'missing',
            label: 'Sem corrida ativa',
            description: 'Nenhuma corrida ativa foi encontrada.',
            progress: 0,
            progressLabel: 'Sem progresso',
            tone: 'default',
            isFinished: false,
            isScheduled: false
        };
    }

    if (ride.status === 'cancelled') {
        return {
            key: 'cancelled',
            label: 'Corrida cancelada',
            description: 'A corrida foi cancelada pelo passageiro.',
            progress: 100,
            progressLabel: 'Cancelada',
            tone: 'danger',
            isFinished: true,
            isScheduled: false
        };
    }

    const now = Date.now();
    const scheduleTime = ride.scheduledAt ? new Date(ride.scheduledAt).getTime() : null;

    if (scheduleTime && now < scheduleTime) {
        const remaining = scheduleTime - now;
        return {
            key: 'scheduled',
            label: 'Corrida agendada',
            description: `A corrida está agendada para ${formatarIso(ride.scheduledAt)}.`,
            progress: 8,
            progressLabel: `Partida em ${formatarRestante(remaining)}`,
            tone: 'warning',
            isFinished: false,
            isScheduled: true
        };
    }

    const referenceTime = scheduleTime || new Date(ride.createdAt).getTime();
    const elapsed = Math.max(0, now - referenceTime);
    const totalDuration = FLUXO_CORRIDA.reduce((sum, etapa) => sum + etapa.durationMs, 0);
    let consumed = 0;

    for (const etapa of FLUXO_CORRIDA) {
        const stageEnd = consumed + etapa.durationMs;
        if (elapsed < stageEnd) {
            const progress = Math.min(98, ((elapsed / totalDuration) * 100));
            return {
                key: etapa.key,
                label: etapa.label,
                description: etapa.description,
                progress,
                progressLabel: etapa.key === 'in_progress'
                    ? 'Aproximação ao destino em curso'
                    : 'Atualização automática da simulação',
                tone: etapa.tone,
                isFinished: false,
                isScheduled: false
            };
        }
        consumed = stageEnd;
    }

    return {
        key: 'completed',
        label: 'Corrida concluída',
        description: 'A simulação indica que o passageiro já chegou ao destino final.',
        progress: 100,
        progressLabel: 'Viagem concluída',
        tone: 'success',
        isFinished: true,
        isScheduled: false
    };
}

function obterClasseTom(tone = 'default') {
    if (tone === 'success') return 'is-success';
    if (tone === 'warning') return 'is-warning';
    if (tone === 'danger') return 'is-danger';
    return '';
}

const ETAPAS_COM_MOTORISTA = new Set(['driver_on_way', 'boarding', 'in_progress', 'completed']);

function renderizarCardMotorista(ride) {
    const d = ride?.driver;
    if (!d) return '';

    return `
        <div class="ride-driver-card" id="ride-driver-card" hidden>
            <div class="ride-driver-avatar">${d.initials || '?'}</div>
            <div class="ride-driver-info">
                <span class="ride-driver-name">${d.name}</span>
                <span class="ride-driver-vehicle">${d.vehicleBrand} &middot; ${d.vehicleColor}</span>
                <span class="ride-driver-plate">${d.plate}</span>
            </div>
            <a class="ride-driver-call" href="tel:${d.phone}" title="Ligar para ${d.name}" aria-label="Ligar para ${d.name}">
                <i class="fa-solid fa-phone"></i>
            </a>
        </div>
    `;
}

function obterParadasRota(ride) {
    if (Array.isArray(ride?.stops) && ride.stops.length) {
        return ride.stops;
    }

    if (typeof ride?.routeSummary === 'string' && ride.routeSummary.trim()) {
        return ride.routeSummary.split('→').map(item => item.trim()).filter(Boolean);
    }

    return [];
}

function renderizarRotaMinima(ride) {
    const stops = obterParadasRota(ride);
    if (!stops.length) {
        return `
            <div class="ride-details">
                <div class="ride-detail-row">
                    <span class="ride-detail-label">Rota</span>
                    <span class="ride-detail-value">Não disponível</span>
                </div>
            </div>
        `;
    }

    const items = stops.map((stop, index) => {
        const label = index === 0
            ? 'Origem'
            : index === stops.length - 1
                ? 'Destino'
                : `Paragem ${index}`;

        return `
            <div class="ride-stop">
                <div class="ride-stop-connector">
                    <div class="ride-stop-dot"></div>
                    <div class="ride-stop-line"></div>
                </div>
                <div>
                    <div class="ride-stop-label">${label}</div>
                    <div class="ride-stop-value">${stop}</div>
                </div>
            </div>
        `;
    }).join('');

    return `<div class="ride-route">${items}</div>`;
}

function renderizarDetalhesMinimos(ride) {
    const fields = [
        { label: 'Veículo', value: ride.vehicleLabel || '' },
        { label: 'Partida', value: ride.whenLabel || '' },
        { label: 'Distância', value: ride.estimatedDistance || '' },
        { label: 'Duração', value: ride.estimatedDuration || '' },
        { label: 'Preço', value: ride.estimatedPrice || '' }
    ].filter(f => f.value);

    if (!fields.length) return '';

    const rows = fields.map(({ label, value }) => `
        <div class="ride-detail-row">
            <span class="ride-detail-label">${label}</span>
            <span class="ride-detail-value">${value}</span>
        </div>
    `).join('');

    return `<div class="ride-details">${rows}</div>`;
}

function montarEstadoVazio(rotaAtual) {
    return `
        ${Header('Corrida ativa', rotaAtual, true)}
        <main class="ride-shell">
            <section class="ride-container">
                <div class="ride-empty">
                    <div class="ride-empty-icon"><i class="fa-solid fa-route"></i></div>
                    <h1>Sem corrida ativa</h1>
                    <p>Nenhuma corrida foi encontrada. Chame uma corrida na Home para ver os detalhes aqui.</p>
                    <div class="ride-actions">
                        <a href="#/" class="ride-btn ride-btn-primary"><i class="fa-solid fa-house"></i>Ir para a Home</a>
                    </div>
                </div>
            </section>
        </main>
    `;
}

function montarPaginaCorrida(ride, rotaAtual) {
    const etapa = obterEtapaCorrida(ride);
    const toneClass = obterClasseTom(etapa.tone);

    return `
        ${Header('Corrida ativa', rotaAtual, true)}
        <main class="ride-shell">
            <section class="ride-container">
                <div class="ride-status-block">
                    <span class="ride-etapa-label">Corrida ativa</span>
                    <h1 class="ride-etapa-title${toneClass ? ' ' + toneClass : ''}" id="ride-etapa-title">${etapa.label}</h1>
                    <p class="ride-etapa-desc" id="ride-etapa-desc">${etapa.description}</p>
                    <div class="ride-progress">
                        <div class="ride-progress-track">
                            <div class="ride-progress-bar${toneClass ? ' ' + toneClass : ''}" id="ride-progress-bar" style="width:${etapa.progress}%"></div>
                        </div>
                        <span class="ride-progress-meta" id="ride-progress-meta">${etapa.progressLabel}</span>
                    </div>
                </div>

                ${renderizarCardMotorista(ride)}

                <hr class="ride-divider">

                ${renderizarRotaMinima(ride)}

                <hr class="ride-divider">

                ${renderizarDetalhesMinimos(ride)}

                <div class="ride-actions">
                    <button type="button" class="ride-btn ride-btn-danger" id="ride-cancel-btn"><i class="fa-solid fa-ban"></i>Cancelar</button>
                    <button type="button" class="ride-btn ride-btn-secondary" id="ride-primary-btn"><i class="fa-solid fa-house"></i>${etapa.isFinished ? 'Limpar e voltar' : 'Voltar para Home'}</button>
                </div>
            </section>
        </main>
    `;
}

function atualizarInterfaceCorrida() {
    const corrida = obterCorridaAtiva();
    if (!ride) return;

    const etapa = obterEtapaCorrida(ride);
    const tituloEtapa = document.getElementById('ride-etapa-title');
    const descEtapa = document.getElementById('ride-etapa-desc');
    const barraProgresso = document.getElementById('ride-progress-bar');
    const metaProgresso = document.getElementById('ride-progress-meta');
    const botaoPrincipal = document.getElementById('ride-primary-btn');
    const botaoCancelar = document.getElementById('ride-cancel-btn');

    if (!tituloEtapa || !barraProgresso || !metaProgresso) return;

    const toneClass = obterClasseTom(etapa.tone);

    tituloEtapa.className = `ride-etapa-title${toneClass ? ' ' + toneClass : ''}`;
    tituloEtapa.textContent = etapa.label;

    if (descEtapa) descEtapa.textContent = etapa.description;

    barraProgresso.className = `ride-progress-bar${toneClass ? ' ' + toneClass : ''}`;
    barraProgresso.style.width = `${etapa.progress}%`;
    metaProgresso.textContent = etapa.progressLabel;

    const cardMotorista = document.getElementById('ride-driver-card');
    if (cardMotorista) {
        if (ETAPAS_COM_MOTORISTA.has(etapa.key)) {
            cardMotorista.removeAttribute('hidden');
        } else {
            cardMotorista.setAttribute('hidden', '');
        }
    }

    if (botaoPrincipal) {
        botaoPrincipal.innerHTML = etapa.isFinished
            ? '<i class="fa-solid fa-house"></i>Limpar e voltar'
            : '<i class="fa-solid fa-house"></i>Voltar para Home';
    }

    if (botaoCancelar) {
        botaoCancelar.disabled = etapa.isFinished;
        botaoCancelar.style.opacity = etapa.isFinished ? '0.4' : '1';
        botaoCancelar.style.cursor = etapa.isFinished ? 'not-allowed' : 'pointer';
    }

    // Auto-complete: quando a corrida termina, marca como pendente de avaliação e redireciona
    if (etapa.key === 'completed' && !concluidaAutomaticamente) {
        concluidaAutomaticamente = true;
        if (tituloEtapa) {
            tituloEtapa.textContent = 'Corrida concluída!';
        }
        setTimeout(() => {
            const current = obterCorridaAtiva();
            if (current) {
                salvarCorridaAtiva({ ...current, status: 'completed', _pendingRating: true });
            }
            window.location.hash = '#/avaliacao';
        }, 3000);
    }
}

export default function CorridaAtiva(rotaAtual = '/corrida-ativa') {
    const corrida = obterCorridaAtiva();

    return {
        html: corrida ? montarPaginaCorrida(corrida, rotaAtual) : montarEstadoVazio(rotaAtual),
        init() {
            if (!corrida) return;

            atualizarInterfaceCorrida();
            intervaloCorrida = window.setInterval(atualizarInterfaceCorrida, 1000);

            const botaoCancelar = document.getElementById('ride-cancel-btn');
            const botaoPrincipal = document.getElementById('ride-primary-btn');

            handlerCancelar = () => {
                const corridaAtual = obterCorridaAtiva();
                if (!corridaAtual) return;

                abrirModalCancelamento((motivo) => {
                    const corridaAtualLocal = obterCorridaAtiva();
                    if (!corridaAtualLocal) return;
                    salvarCorridaNoHistorico({ ...corridaAtualLocal, status: 'cancelled', cancelReason: motivo });
                    limparCorridaAtiva();
                    window.location.hash = '#/';
                });
            };

            handlerPrincipal = () => {
                const corridaAtual = obterCorridaAtiva();
                const etapa = obterEtapaCorrida(corridaAtual);
                if (etapa.isFinished && corridaAtual) {
                    salvarCorridaAtiva({ ...corridaAtual, status: 'completed', _pendingRating: true });
                    window.location.hash = '#/avaliacao';
                } else {
                    window.location.hash = '#/';
                }
            };

            botaoCancelar?.addEventListener('click', handlerCancelar);
            botaoPrincipal?.addEventListener('click', handlerPrincipal);
        },
        destroy() {
            if (elementoModalCancelar) {
                elementoModalCancelar.remove();
                elementoModalCancelar = null;
            }

            if (intervaloCorrida) {
                window.clearInterval(intervaloCorrida);
                intervaloCorrida = null;
            }

            concluidaAutomaticamente = false;

            const botaoCancelar = document.getElementById('ride-cancel-btn');
            const botaoPrincipal = document.getElementById('ride-primary-btn');

            if (botaoCancelar && handlerCancelar) {
                botaoCancelar.removeEventListener('click', handlerCancelar);
            }

            if (botaoPrincipal && handlerPrincipal) {
                botaoPrincipal.removeEventListener('click', handlerPrincipal);
            }

            handlerCancelar = null;
            handlerPrincipal = null;
        }
    };
}
