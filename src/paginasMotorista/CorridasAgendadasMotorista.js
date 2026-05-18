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
    const mk = (offset, h, m, origem, destino, passageiro, valor) => ({
        id: `SCHED-${Date.now()}-${offset}`,
        scheduledAt: new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, h, m).toISOString(),
        passenger: { name: passageiro, initials: passageiro.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() },
        origin: origem,
        destination: destino,
        estimatedDistance: `${(4 + offset * 1.3).toFixed(1)} km`,
        earnings: `Kz ${valor},00`,
        earningsRaw: valor,
        status: 'pending',
    });
    escreverJson(CHAVE, [
        mk(2,  8, 30, 'Aeroporto Internacional', 'Belas Shopping',     'Carlos Mendes',  1200),
        mk(3, 10,  0, 'Marginal de Luanda',       'Talatona',           'Sofia Nunes',     850),
        mk(5, 14, 15, 'Rocha Pinto',              'Viana Centro',       'Pedro Lopes',     700),
        mk(7,  7, 45, 'Mutamba',                  'Aeroporto Internacional', 'Ana Ferreira', 1350),
    ]);
}

function montarVazio() {
    return `
        <div class="cam-empty">
            <div class="cam-empty-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
            <p class="cam-empty-title">Sem corridas agendadas</p>
            <p class="cam-empty-desc">Quando um passageiro agendar uma corrida contigo, ela aparecerá aqui.</p>
        </div>`;
}

function montarCard(corrida) {
    const futuro = isFuturo(corrida.scheduledAt);
    const statusClass = corrida.status === 'accepted' ? 'cam-status-accepted'
        : corrida.status === 'rejected' ? 'cam-status-rejected'
        : 'cam-status-pending';
    const statusLabel = corrida.status === 'accepted' ? 'Aceite'
        : corrida.status === 'rejected' ? 'Recusada'
        : 'Pendente';

    const acoes = (corrida.status === 'pending' && futuro) ? `
        <div class="cam-card-actions">
            <button class="cam-btn-reject" data-id="${corrida.id}">
                <i class="fa-solid fa-xmark"></i>Recusar
            </button>
            <button class="cam-btn-accept" data-id="${corrida.id}">
                <i class="fa-solid fa-check"></i>Aceitar
            </button>
        </div>` : '';

    return `
        <div class="cam-card ${corrida.status === 'rejected' ? 'cam-card-rejected' : ''}">
            <div class="cam-card-top">
                <div class="cam-avatar">${corrida.passenger.initials}</div>
                <div class="cam-card-info">
                    <span class="cam-passenger-name">${corrida.passenger.name}</span>
                    <span class="cam-datetime"><i class="fa-solid fa-calendar-days"></i>${formatarDataHora(corrida.scheduledAt)}</span>
                </div>
                <span class="cam-status-badge ${statusClass}">${statusLabel}</span>
            </div>
            <div class="cam-card-route">
                <div class="cam-route-dot cam-route-dot-origin"></div>
                <div class="cam-route-labels">
                    <span class="cam-route-label">${corrida.origin}</span>
                    <span class="cam-route-sep"></span>
                    <span class="cam-route-label">${corrida.destination}</span>
                </div>
                <div class="cam-route-dot cam-route-dot-dest"></div>
            </div>
            <div class="cam-card-footer">
                <span class="cam-distance"><i class="fa-solid fa-road"></i>${corrida.estimatedDistance}</span>
                <span class="cam-earnings">${corrida.earnings}</span>
            </div>
            ${acoes}
        </div>`;
}

function montarPagina(corridas, rotaAtual) {
    const futuras  = corridas.filter(c => isFuturo(c.scheduledAt) && c.status !== 'rejected');
    const passadas = corridas.filter(c => !isFuturo(c.scheduledAt) || c.status === 'rejected');

    const secaoFuturas = futuras.length
        ? futuras.map(montarCard).join('')
        : montarVazio();

    const secaoPassadas = passadas.length ? `
        <div class="cam-section-label">Concluídas / Recusadas</div>
        ${passadas.map(montarCard).join('')}` : '';

    return `
        ${HeaderMotorista(rotaAtual)}
        <main class="cam-shell">
            <div class="cam-container">
                <div class="cam-page-header">
                    <h1 class="cam-title"><i class="fa-solid fa-calendar-check"></i>Corridas Agendadas</h1>
                    <span class="cam-count">${futuras.length} pendente${futuras.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="cam-section-label">Próximas</div>
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
        const raiz = document.querySelector('.cam-shell');
        if (raiz) {
            raiz.closest('main').outerHTML; // noop — re-render
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
    }

    function init() {
        document.querySelectorAll('.cam-btn-accept').forEach(btn => {
            on(btn, 'click', () => {
                atualizarStatus(btn.dataset.id, 'accepted');
                notificar('Corrida aceite com sucesso.', 'sucesso');
            });
        });
        document.querySelectorAll('.cam-btn-reject').forEach(btn => {
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
