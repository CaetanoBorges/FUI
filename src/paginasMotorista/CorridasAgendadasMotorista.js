import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { notificar } from '../componentes/Notificacao.js';
import './CorridasAgendadasMotorista.css';

const CHAVE = 'gyro.rides.driver.scheduled';

function lerJson(chave, padrao) {
    try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; }
    catch { return padrao; }
}
function escreverJson(chave, val) { localStorage.setItem(chave, JSON.stringify(val)); }

function listar() {
    return lerJson(CHAVE, []).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
}

function formatarDataHora(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        const dia  = d.toLocaleDateString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short' });
        const hora = d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
        return `${dia} · ${hora}`;
    } catch { return iso; }
}

function isFuturo(iso) {
    return new Date(iso) > new Date();
}

function semeiarMock() {
    if (lerJson(CHAVE, null) !== null) return;
    const base = new Date('2026-05-20T00:00:00');
    const mk = (offset, h, m, origem, destino, passageiro, telefone, valor) => ({
        id: `SCHED-${Date.now()}-${offset}`,
        scheduledAt: new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, h, m).toISOString(),
        passenger: { name: passageiro, phone: telefone, initials: passageiro.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() },
        origin: origem,
        destination: destino,
        estimatedDistance: `${(4 + offset * 1.3).toFixed(1)} km`,
        earnings: `Kz ${valor},00`,
        earningsRaw: valor,
        status: 'pending',
    });
    escreverJson(CHAVE, [
        mk(2,  8, 30, 'Aeroporto Internacional', 'Belas Shopping',     'Carlos Mendes',  '+244 923 456 789', 1200),
        mk(3, 10,  0, 'Marginal de Luanda',       'Talatona',           'Sofia Nunes',    '+244 912 345 678',  850),
        mk(5, 14, 15, 'Rocha Pinto',              'Viana Centro',       'Pedro Lopes',    '+244 934 567 890',  700),
        mk(7,  7, 45, 'Mutamba',                  'Aeroporto Internacional', 'Ana Ferreira', '+244 941 234 567', 1350),
    ]);
}

function montarVazio() {
    return `
        <div class="cagm-empty">
            <div class="cagm-empty-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
            <p class="cagm-empty-title">Sem corridas agendadas</p>
            <p class="cagm-empty-desc">Quando um passageiro agendar uma corrida contigo, ela aparecerá aqui.</p>
        </div>`;
}

function montarCard(corrida) {
    const futuro = isFuturo(corrida.scheduledAt);
    const statusClass = corrida.status === 'accepted' ? 'cagm-status-accepted'
        : corrida.status === 'rejected' ? 'cagm-status-rejected'
        : 'cagm-status-pending';
    const statusLabel = corrida.status === 'accepted' ? 'Aceite'
        : corrida.status === 'rejected' ? 'Recusada'
        : 'Pendente';

    const acoes = (corrida.status === 'pending' && futuro) ? `
        <div class="cagm-card-actions">
            <button class="cagm-btn-reject" data-id="${corrida.id}">
                <i class="fa-solid fa-xmark"></i>Recusar
            </button>
            <button class="cagm-btn-accept" data-id="${corrida.id}">
                <i class="fa-solid fa-check"></i>Aceitar
            </button>
        </div>` : '';

    return `
        <div class="cagm-card ${corrida.status === 'rejected' ? 'cagm-card-rejected' : ''}">
            <div class="cagm-card-top">
                <div class="cagm-avatar">${corrida.passenger.initials}</div>
                <div class="cagm-card-info">
                    <span class="cagm-passenger-name">${corrida.passenger.name}</span>
                    <span class="cagm-datetime"><i class="fa-solid fa-calendar-days"></i>${formatarDataHora(corrida.scheduledAt)}</span>
                    ${corrida.status === 'pending' && corrida.passenger.phone ? `<a class="cagm-passenger-phone" href="tel:${corrida.passenger.phone.replace(/\s/g,'')}"><i class="fa-solid fa-phone"></i>${corrida.passenger.phone}</a>` : ''}
                </div>
                <span class="cagm-status-badge ${statusClass}">${statusLabel}</span>
            </div>
            <div class="cagm-card-route">
                <div class="cagm-route-dot cagm-route-dot-origin"></div>
                <div class="cagm-route-labels">
                    <span class="cagm-route-label">${corrida.origin}</span>
                    <span class="cagm-route-sep"></span>
                    <span class="cagm-route-label">${corrida.destination}</span>
                </div>
                <div class="cagm-route-dot cagm-route-dot-dest"></div>
            </div>
            <div class="cagm-card-footer">
                <span class="cagm-distance"><i class="fa-solid fa-road"></i>${corrida.estimatedDistance}</span>
                <span class="cagm-earnings">${corrida.earnings}</span>
            </div>
            ${acoes}
        </div>`;
}

function montarPagina(corridas, rotaAtual) {
    const futuras   = corridas.filter(c => isFuturo(c.scheduledAt) && c.status !== 'rejected');
    const pendentes  = futuras.filter(c => c.status === 'pending');
    const passadas   = corridas.filter(c => !isFuturo(c.scheduledAt) || c.status === 'rejected');

    const secaoFuturas = futuras.length
        ? futuras.map(montarCard).join('')
        : montarVazio();

    const secaoPassadas = passadas.length ? `
        <div class="cagm-section-label">Concluídas / Recusadas</div>
        ${passadas.map(montarCard).join('')}` : '';

    return `
        ${HeaderMotorista(rotaAtual)}
        <main class="cagm-shell">
            <div class="cagm-container">
                <div class="cagm-page-header">
                    <h1 class="cagm-title"><i class="fa-solid fa-calendar-check"></i>Corridas Agendadas</h1>
                    <span class="cagm-count">${pendentes.length} pendente${pendentes.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="cagm-section-label">Próximas</div>
                ${secaoFuturas}
                ${secaoPassadas}
            </div>
        </main>`;
}

export default function CorridasAgendadasMotorista(rotaAtual = '/motorista/corridas-agendadas') {
    semeiarMock();
    let corridas = listar();
    const html = montarPagina(corridas, rotaAtual);

    let ouvintes = [];
    function on(el, ev, fn) {
        if (!el) return;
        el.addEventListener(ev, fn);
        ouvintes.push({ el, ev, fn });
    }

    function atualizarStatus(id, novoStatus) {
        const dados = lerJson(CHAVE, []);
        const idx = dados.findIndex(c => c.id === id);
        if (idx === -1) return;
        dados[idx].status = novoStatus;
        escreverJson(CHAVE, dados);
        corridas = listar();
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    }

    function init() {
        document.querySelectorAll('.cagm-btn-accept').forEach(btn => {
            on(btn, 'click', () => {
                atualizarStatus(btn.dataset.id, 'accepted');
                notificar('Corrida aceite com sucesso.', 'sucesso');
            });
        });
        document.querySelectorAll('.cagm-btn-reject').forEach(btn => {
            on(btn, 'click', () => {
                atualizarStatus(btn.dataset.id, 'rejected');
                notificar('Corrida recusada.', 'aviso');
            });
        });
    }

    function destroy() {
        ouvintes.forEach(({ el, ev, fn }) => el?.removeEventListener(ev, fn));
        ouvintes = [];
    }

    return { html, init, destroy };
}
