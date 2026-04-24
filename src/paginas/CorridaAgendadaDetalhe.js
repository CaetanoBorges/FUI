import Header from '../componentes/Header.js';
import { listarCorridasAgendadas, cancelarCorridaAgendadaPorId } from '../dados/corridaStorage.js';
import './CorridaAgendadaDetalhe.css';

let handlerBtnCancelar = null;
let handlersModal = [];

const MODAL_ID = 'detail-confirm-modal';

const CANCEL_MOTIVOS = [
    'Mudei de planos',
    'Horário alterado',
    'Encontrei outra opção de transporte',
    'Errei no destino/origem',
    'Criei por engano',
    'Outro motivo',
];

function formatarDataHora(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('pt-AO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return iso;
    }
}

function estaCancelada(ride) {
    return ride.status === 'cancelled';
}

function obterParadas(ride) {
    if (Array.isArray(ride.stops) && ride.stops.length) return ride.stops;
    if (typeof ride.routeSummary === 'string' && ride.routeSummary.includes('→')) {
        return ride.routeSummary.split('→').map(s => s.trim()).filter(Boolean);
    }
    return ride.routeSummary ? [ride.routeSummary] : [];
}

function renderizarRota(ride) {
    const paradas = obterParadas(ride);
    if (!paradas.length) return `<p class="detail-info-value">Rota não disponível</p>`;

    return `<div class="detail-route">${paradas.map((stop, i) => `
        <div class="detail-stop">
            <div class="detail-stop-connector">
                <div class="detail-stop-dot"></div>
                <div class="detail-stop-line"></div>
            </div>
            <div>
                <div class="detail-stop-label">${i === 0 ? 'Origem' : i === paradas.length - 1 ? 'Destino' : `Paragem ${i}`}</div>
                <div class="detail-stop-value">${stop}</div>
            </div>
        </div>
    `).join('')}</div>`;
}

function renderizarInfo(ride) {
    const campos = [
        { label: 'Data e hora', value: formatarDataHora(ride.scheduledAt) },
        { label: 'Veículo', value: ride.vehicleLabel || '—' },
        { label: 'Passageiros', value: ride.passengers ?? '—' },
        { label: 'Distância', value: ride.estimatedDistance || '—' },
        { label: 'Duração', value: ride.estimatedDuration || '—' },
        { label: 'Preço', value: ride.estimatedPrice || '—' },
    ];

    return `<div class="detail-info">${campos.map(({ label, value }) => `
        <div class="detail-info-row">
            <span class="detail-info-label">${label}</span>
            <span class="detail-info-value">${value}</span>
        </div>
    `).join('')}</div>`;
}

function renderizarMotorista(d, cancelada) {
    if (!d) return '';
    return `
        <div class="detail-driver">
            <div class="detail-driver-avatar">${d.initials || '?'}</div>
            <div class="detail-driver-info">
                <span class="detail-driver-name">${d.name}</span>
                <span class="detail-driver-vehicle">${d.vehicleBrand} · ${d.vehicleColor}</span>
                <span class="detail-driver-plate">${d.plate}</span>
            </div>
            ${!cancelada ? `<a class="detail-driver-call" href="tel:${d.phone}" titulo="Ligar para ${d.name}"><i class="fa-solid fa-phone"></i></a>` : ''}
        </div>
    `;
}

function montarNaoEncontrado(rotaAtual) {
    return `
        ${Header('Agendamento', rotaAtual, true)}
        <main class="detail-shell">
            <section class="detail-container">
                <a href="#/corridas-agendadas" class="detail-back"><i class="fa-solid fa-arrow-left"></i>Agendamentos</a>
                <div class="detail-not-found">
                    <div class="detail-not-found-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
                    <h2>Corrida não encontrada</h2>
                    <p>O agendamento que procuras não existe ou foi removido.</p>
                    <a href="#/corridas-agendadas" class="detail-btn detail-btn-secondary"><i class="fa-solid fa-arrow-left"></i>Voltar aos agendamentos</a>
                </div>
            </section>
        </main>
    `;
}

function montarPagina(ride, rotaAtual) {
    const cancelada = estaCancelada(ride);
    const paradas = obterParadas(ride);
    const origem = paradas[0] || '—';
    const destino = paradas[paradas.length - 1] || '—';
    const titulo = paradas.length >= 2 ? `${origem} → ${destino}` : origem;

    return `
        ${Header('Agendamento', rotaAtual, true)}
        <main class="detail-shell">
            <section class="detail-container">

                <a href="#/corridas-agendadas" class="detail-back">
                    <i class="fa-solid fa-arrow-left"></i>Agendamentos
                </a>

                <div class="detail-page-header">
                    <span class="detail-eyebrow">Corrida agendada</span>
                    <h1 class="detail-titulo">${titulo}</h1>
                    <span class="detail-badge${cancelada ? ' is-cancelada' : ''}">
                        <i class="fa-solid fa-${cancelada ? 'ban' : 'calendar-clock'}"></i>
                        ${cancelada ? 'Cancelada' : formatarDataHora(ride.scheduledAt)}
                    </span>
                </div>

                <hr class="detail-divider">

                <div>
                    <p class="detail-section-label">Rota</p>
                    ${renderizarRota(ride)}
                </div>

                <hr class="detail-divider">

                <div>
                    <p class="detail-section-label">Detalhes</p>
                    ${renderizarInfo(ride)}
                </div>

                ${ride.driver ? `
                    <hr class="detail-divider">
                    <div>
                        <p class="detail-section-label">Motorista</p>
                        ${renderizarMotorista(ride.driver, cancelada)}
                    </div>
                ` : ''}

                <div class="detail-actions">
                    <a href="#/corridas-agendadas" class="detail-btn detail-btn-secondary">
                        <i class="fa-solid fa-arrow-left"></i>Voltar
                    </a>
                    ${!cancelada ? `
                        <button type="button" class="detail-btn detail-btn-danger" id="detail-cancel-btn">
                            <i class="fa-solid fa-ban"></i>Cancelar corrida
                        </button>
                    ` : ''}
                </div>

            </section>
        </main>
    `;
}

function abrirModal(rideId, rideSummary) {
    removerModal();

    const backdrop = document.createElement('div');
    backdrop.id = MODAL_ID;
    backdrop.className = 'detail-modal-backdrop';
    const motivosHtml = CANCEL_MOTIVOS.map((m, i) => `
        <button type="button" class="detail-motivo-row" data-motivo="${m}" data-index="${i}">
            <span class="detail-motivo-radio"></span>
            <span>${m}</span>
        </button>
    `).join('');

    backdrop.innerHTML = `
        <div class="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-modal-titulo">
            <div class="detail-modal-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <h2 class="detail-modal-titulo" id="detail-modal-titulo">Cancelar corrida?</h2>
            <p class="detail-modal-desc">${rideSummary}</p>
            <div class="detail-motivos">${motivosHtml}</div>
            <textarea class="detail-motivo-textarea" id="detail-motivo-outro" placeholder="Descreva o motivo..." rows="3" style="display:none"></textarea>
            <div class="detail-modal-actions">
                <button type="button" class="detail-btn detail-btn-secondary" id="detail-modal-dismiss">Voltar</button>
                <button type="button" class="detail-btn detail-btn-danger" id="detail-modal-confirm" disabled>
                    <i class="fa-solid fa-ban"></i>Confirmar cancelamento
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('is-visible'));

    let motivoSelecionado = null;
    const confirmBtn = document.getElementById('detail-modal-confirm');
    const outroTextarea = document.getElementById('detail-motivo-outro');

    backdrop.querySelectorAll('.detail-motivo-row').forEach(btn => {
        btn.addEventListener('click', () => {
            backdrop.querySelectorAll('.detail-motivo-row').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            motivoSelecionado = btn.dataset.motivo;
            const isOutro = motivoSelecionado === 'Outro motivo';
            outroTextarea.style.display = isOutro ? 'block' : 'none';
            confirmBtn.disabled = isOutro ? !outroTextarea.value.trim() : false;
        });
    });

    outroTextarea.addEventListener('input', () => {
        confirmBtn.disabled = !outroTextarea.value.trim();
    });

    const fnFechar = () => removerModal();
    const fnConfirmar = () => {
        const motivo = motivoSelecionado === 'Outro motivo'
            ? outroTextarea.value.trim()
            : motivoSelecionado;
        cancelarCorridaAgendadaPorId(rideId, motivo);
        removerModal();
        // Força re-renderização mesmo que o hash não mude
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    };
    const fnFundo = (e) => { if (e.target === backdrop) removerModal(); };

    document.getElementById('detail-modal-dismiss').addEventListener('click', fnFechar);
    confirmBtn.addEventListener('click', fnConfirmar);
    backdrop.addEventListener('click', fnFundo);

    handlersModal = [
        { el: document.getElementById('detail-modal-dismiss'), fn: fnFechar, event: 'click' },
        { el: confirmBtn, fn: fnConfirmar, event: 'click' },
        { el: backdrop, fn: fnFundo, event: 'click' },
    ];
}

function removerModal() {
    handlersModal.forEach(({ el, fn, event }) => el?.removeEventListener(event, fn));
    handlersModal = [];
    const el = document.getElementById(MODAL_ID);
    if (!el) return;
    el.classList.remove('is-visible');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
}

export default function CorridaAgendadaDetalhe(rotaAtual = '/corrida-agendada', query = {}) {
    const id = query.id;
    const ride = id ? listarCorridasAgendadas().find(r => r.id === id) : null;

    return {
        html: ride ? montarPagina(ride, rotaAtual) : montarNaoEncontrado(rotaAtual),
        init() {
            if (!ride) return;

            const cancelBtn = document.getElementById('detail-cancel-btn');
            if (!cancelBtn) return;

            const paradas = obterParadas(ride);
            const resumo = paradas.length >= 2
                ? `${paradas[0]} → ${paradas[paradas.length - 1]}`
                : (paradas[0] || 'Esta corrida será cancelada.');

            handlerBtnCancelar = () => abrirModal(ride.id, resumo);
            cancelBtn.addEventListener('click', handlerBtnCancelar);
        },
        destroy() {
            const cancelBtn = document.getElementById('detail-cancel-btn');
            if (cancelBtn && handlerBtnCancelar) {
                cancelBtn.removeEventListener('click', handlerBtnCancelar);
            }
            handlerBtnCancelar = null;
            removerModal();
        }
    };
}
