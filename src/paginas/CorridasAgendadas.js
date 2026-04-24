import Header from '../componentes/Header.js';
import { listarCorridasAgendadas, cancelarCorridaAgendadaPorId, removerCorridaAgendadaPorId, inicializarAgendamentos } from '../dados/corridaStorage.js';
import './CorridasAgendadas.css';

let handlersCancelar = [];
let handlersVisualizar = [];
let handlersModalConfirmar = [];

const MODAL_ID = 'sched-confirm-modal';

const CANCEL_MOTIVOS = [
    'Mudei de planos',
    'Horário alterado',
    'Encontrei outra opção de transporte',
    'Errei no destino/origem',
    'Criei por engano',
    'Outro motivo',
];

function abrirModalCancelamento(rideId, rideSummary) {
    removerModalCancelamento();

    const motivosHtml = CANCEL_MOTIVOS.map(m => `
        <button type="button" class="sched-motivo-row" data-motivo="${m}">
            <span class="sched-motivo-radio"></span>
            <span>${m}</span>
        </button>
    `).join('');

    const backdrop = document.createElement('div');
    backdrop.id = MODAL_ID;
    backdrop.className = 'sched-modal-backdrop';
    backdrop.innerHTML = `
        <div class="sched-modal" role="dialog" aria-modal="true" aria-labelledby="sched-modal-title">
            <div class="sched-modal-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <h2 class="sched-modal-title" id="sched-modal-title">Cancelar corrida?</h2>
            <p class="sched-modal-desc">${rideSummary}</p>
            <div class="sched-motivos">${motivosHtml}</div>
            <textarea class="sched-motivo-textarea" id="sched-motivo-outro" placeholder="Descreva o motivo..." rows="3" style="display:none"></textarea>
            <div class="sched-modal-actions">
                <button type="button" class="sched-btn sched-btn-secondary" id="sched-modal-dismiss">Voltar</button>
                <button type="button" class="sched-btn sched-btn-danger" id="sched-modal-confirm" disabled>
                    <i class="fa-solid fa-ban"></i>Confirmar cancelamento
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('is-visible'));

    let motivoSelecionado = null;
    const confirmBtn = document.getElementById('sched-modal-confirm');
    const outroTextarea = document.getElementById('sched-motivo-outro');

    backdrop.querySelectorAll('.sched-motivo-row').forEach(btn => {
        btn.addEventListener('click', () => {
            backdrop.querySelectorAll('.sched-motivo-row').forEach(b => b.classList.remove('selected'));
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

    const fnFechar = () => removerModalCancelamento();
    const fnConfirmar = () => {
        const motivo = motivoSelecionado === 'Outro motivo'
            ? outroTextarea.value.trim()
            : motivoSelecionado;
        cancelarCorridaAgendadaPorId(rideId, motivo);
        removerModalCancelamento();
        rerenderizarLista();
    };
    const fnFundo = (e) => {
        if (e.target === backdrop) removerModalCancelamento();
    };

    document.getElementById('sched-modal-dismiss').addEventListener('click', fnFechar);
    confirmBtn.addEventListener('click', fnConfirmar);
    backdrop.addEventListener('click', fnFundo);

    handlersModalConfirmar = [
        { el: document.getElementById('sched-modal-dismiss'), fn: fnFechar, event: 'click' },
        { el: confirmBtn, fn: fnConfirmar, event: 'click' },
        { el: backdrop, fn: fnFundo, event: 'click' },
    ];
}

function removerModalCancelamento() {
    handlersModalConfirmar.forEach(({ el, fn, event }) => el?.removeEventListener(event, fn));
    handlersModalConfirmar = [];
    const el = document.getElementById(MODAL_ID);
    if (!el) return;
    el.classList.remove('is-visible');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
}

function formatarDataHora(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-AO', {
            day: '2-digit',
            month: 'short',
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

function obterOrigemDestino(ride) {
    if (Array.isArray(ride.stops) && ride.stops.length >= 2) {
        return { origin: ride.stops[0], dest: ride.stops[ride.stops.length - 1] };
    }
    if (typeof ride.routeSummary === 'string' && ride.routeSummary.includes('→')) {
        const parts = ride.routeSummary.split('→').map(s => s.trim());
        return { origin: parts[0], dest: parts[parts.length - 1] };
    }
    return { origin: ride.routeSummary || '—', dest: null };
}

function renderizarCard(ride) {
    const cancelada = estaCancelada(ride);
    const { origin, dest } = obterOrigemDestino(ride);
    const d = ride.driver;

    const blocoMotorista = d ? `
        <div class="sched-driver">
            <div class="sched-driver-avatar">${d.initials || '?'}</div>
            <div class="sched-driver-info">
                <span class="sched-driver-name">${d.name}</span>
                <span class="sched-driver-plate">${d.vehicleBrand} · ${d.vehicleColor} · ${d.plate}</span>
            </div>
            ${!cancelada ? `<a class="sched-driver-call" href="tel:${d.phone}" title="Ligar para ${d.name}"><i class="fa-solid fa-phone"></i></a>` : ''}
        </div>
    ` : '';

    return `
        <article class="sched-card${cancelada ? ' is-cancelada' : ''}" data-id="${ride.id}">
            <div class="sched-card-head">
                <span class="sched-card-datetime">
                    <i class="fa-solid fa-calendar-clock"></i>
                    ${formatarDataHora(ride.scheduledAt)}
                </span>
                <span class="sched-card-badge${cancelada ? ' is-cancelada' : ''}">
                    ${cancelada ? 'Cancelada' : 'Agendada'}
                </span>
            </div>

            <div class="sched-card-body">
                <div class="sched-route">
                    <span class="sched-route-origin">${origin}</span>
                    ${dest ? `<i class="fa-solid fa-arrow-right sched-route-arrow"></i><span class="sched-route-dest">${dest}</span>` : ''}
                </div>

                <div class="sched-meta">
                    <span class="sched-meta-item"><i class="fa-solid fa-car"></i>${ride.vehicleLabel || '—'}</span>
                    ${ride.estimatedDistance ? `<span class="sched-meta-item"><i class="fa-solid fa-route"></i>${ride.estimatedDistance}</span>` : ''}
                    ${ride.estimatedPrice ? `<span class="sched-meta-item"><i class="fa-solid fa-money-bill"></i>${ride.estimatedPrice}</span>` : ''}
                </div>

                ${blocoMotorista}
            </div>

            ${!cancelada ? `
                <div class="sched-card-foot">
                    <a href="#/corrida-agendada?id=${ride.id}" class="sched-btn sched-btn-secondary" data-view="${ride.id}">
                        <i class="fa-solid fa-eye"></i>Ver corrida
                    </a>
                    <button type="button" class="sched-btn sched-btn-danger" data-cancel="${ride.id}">
                        <i class="fa-solid fa-ban"></i>Cancelar
                    </button>
                </div>
            ` : `
                <div class="sched-card-foot">
                    <button type="button" class="sched-btn sched-btn-secondary" data-remove="${ride.id}">
                        <i class="fa-solid fa-trash"></i>Remover
                    </button>
                </div>
            `}
        </article>
    `;
}

function montarPagina(rides, rotaAtual) {
    const ativas = rides.filter(r => !estaCancelada(r));
    const rotulTotal = ativas.length === 1
        ? '1 corrida agendada'
        : `${ativas.length} corridas agendadas`;

    const conteudo = rides.length
        ? `<div class="sched-list">${rides.map(renderizarCard).join('')}</div>`
        : `
            <div class="sched-empty">
                <div class="sched-empty-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
                <h2>Nenhum agendamento</h2>
                <p>Não tens corridas agendadas. Agenda uma corrida na Home para vê-la aqui.</p>
                <a href="#/" class="sched-btn sched-btn-primary"><i class="fa-solid fa-house"></i>Ir para a Home</a>
            </div>
        `;

    return `
        ${Header('Agendamentos', rotaAtual, true)}
        <main class="sched-shell">
            <section class="sched-container">
                <div class="sched-page-header">
                    <span class="sched-eyebrow">Os meus agendamentos</span>
                    <h1 class="sched-title">Corridas agendadas</h1>
                    ${rides.length ? `<span class="sched-count">${rotulTotal}</span>` : ''}
                </div>
                <hr class="sched-divider">
                ${conteudo}
            </section>
        </main>
    `;
}

function rerenderizarLista() {
    const corridas = listarCorridasAgendadas();
    const listEl = document.querySelector('.sched-list');
    const containerEl = document.querySelector('.sched-container');

    if (!containerEl) return;

    if (!corridas.length) {
        containerEl.innerHTML = `
            <div class="sched-page-header">
                <span class="sched-eyebrow">Os meus agendamentos</span>
                <h1 class="sched-title">Corridas agendadas</h1>
            </div>
            <hr class="sched-divider">
            <div class="sched-empty">
                <div class="sched-empty-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
                <h2>Nenhum agendamento</h2>
                <p>Não tens corridas agendadas. Agenda uma corrida na Home para vê-la aqui.</p>
                <a href="#/" class="sched-btn sched-btn-primary"><i class="fa-solid fa-house"></i>Ir para a Home</a>
            </div>
        `;
        return;
    }

    if (!listEl) {
        const hr = containerEl.querySelector('.sched-divider');
        if (hr) {
            const div = document.createElement('div');
            div.className = 'sched-list';
            div.innerHTML = corridas.map(renderizarCard).join('');
            hr.after(div);
        }
    } else {
        listEl.innerHTML = corridas.map(renderizarCard).join('');
    }

    const countEl = containerEl.querySelector('.sched-count');
    const ativas = corridas.filter(r => !estaCancelada(r));
    const label = ativas.length === 1 ? '1 corrida agendada' : `${ativas.length} corridas agendadas`;
    if (countEl) countEl.textContent = label;

    anexarOuvintes();
}

function anexarOuvintes() {
    handlersCancelar.forEach(({ el, fn }) => el.removeEventListener('click', fn));
    handlersCancelar = [];
    handlersVisualizar.forEach(({ el, fn }) => el.removeEventListener('click', fn));
    handlersVisualizar = [];

    document.querySelectorAll('[data-cancel]').forEach(btn => {
        const fn = () => {
            const id = btn.dataset.cancel;
            const card = btn.closest('.sched-card');
            const routeEl = card?.querySelector('.sched-route-origin');
            const destEl = card?.querySelector('.sched-route-dest');
            const summary = destEl
                ? `${routeEl?.textContent} → ${destEl?.textContent}`
                : (routeEl?.textContent || 'Esta corrida será cancelada.');
            abrirModalCancelamento(id, summary);
        };
        btn.addEventListener('click', fn);
        handlersCancelar.push({ el: btn, fn });
    });

    document.querySelectorAll('[data-remove]').forEach(btn => {
        const fn = () => {
            const id = btn.dataset.remove;
            removerCorridaAgendadaPorId(id);
            rerenderizarLista();
        };
        btn.addEventListener('click', fn);
        handlersVisualizar.push({ el: btn, fn });
    });
}

export default function CorridasAgendadas(rotaAtual = '/corridas-agendadas') {
    inicializarAgendamentos();
    const corridas = listarCorridasAgendadas();

    return {
        html: montarPagina(corridas, rotaAtual),
        init() {
            anexarOuvintes();
        },
        destroy() {
            handlersCancelar.forEach(({ el, fn }) => el.removeEventListener('click', fn));
            handlersVisualizar.forEach(({ el, fn }) => el.removeEventListener('click', fn));
            handlersCancelar = [];
            handlersVisualizar = [];
            removerModalCancelamento();
        }
    };
}
