import Header from '../componentes/Header.js';
import { listRideHistory, seedRideHistory } from '../dados/corridaStorage.js';
import './HistoricoCorridas.css';

/** Formata ISO para data/hora legível */
function formatDate(iso) {
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

function statusLabel(status) {
    if (status === 'completed') return 'Concluída';
    if (status === 'cancelled') return 'Cancelada';
    return status;
}

function renderCard(ride) {
    const st = ride.status === 'cancelled' ? 'cancelled' : 'completed';
    const driverHtml = ride.driver ? `
        <div class="hist-card-sep"></div>
        <div class="hist-card-driver">
            <div class="hist-driver-avatar">${ride.driver.initials ?? '?'}</div>
            <span class="hist-driver-name">${ride.driver.name}</span>
            ${ride.driver.plate ? `<span class="hist-driver-plate">${ride.driver.plate}</span>` : ''}
        </div>` : '';

    return `
        <article class="hist-card">
            <div class="hist-card-top">
                <div class="hist-status-dot ${st}"></div>
                <div class="hist-card-main">
                    <div class="hist-route" title="${ride.routeSummary ?? ''}">${ride.routeSummary ?? '—'}</div>
                    <div class="hist-meta">
                        <span><i class="fa-solid fa-calendar-days"></i>${formatDate(ride.createdAt)}</span>
                        ${ride.estimatedDistance ? `<span><i class="fa-solid fa-location-dot"></i>${ride.estimatedDistance}</span>` : ''}
                        ${ride.estimatedPrice   ? `<span><i class="fa-solid fa-money-bill-wave"></i>${ride.estimatedPrice}</span>` : ''}
                    </div>
                </div>
                <span class="hist-badge ${st}">${statusLabel(ride.status)}</span>
            </div>
            ${driverHtml}
        </article>
    `;
}

export default function HistoricoCorridas(rotaAtual = '/historico') {
    seedRideHistory();

    const allRides    = listRideHistory();
    let activeFilter  = 'all';

    // ── HTML ─────────────────────────────────────────────────────────────
    const html = `
        ${Header('Histórico', rotaAtual, true)}
        <main class="hist-shell">
            <div class="hist-container">
                <div class="hist-head">
                    <p class="hist-eyebrow">Gyro — Ride</p>
                    <h1 class="hist-title">Histórico de corridas</h1>
                    <p class="hist-subtitle">${allRides.length} corrida${allRides.length !== 1 ? 's' : ''} realizadas</p>
                </div>

                <div class="hist-filter-row">
                    <button class="hist-filter-btn is-active" data-filter="all">Todas</button>
                    <button class="hist-filter-btn" data-filter="completed"><i class="fa-solid fa-circle-check"></i> Concluídas</button>
                    <button class="hist-filter-btn" data-filter="cancelled"><i class="fa-solid fa-ban"></i> Canceladas</button>
                </div>

                <hr class="hist-divider">

                <div class="hist-list" id="hist-list">
                    ${renderList(allRides)}
                </div>
            </div>
        </main>
    `;

    // ── Helpers ──────────────────────────────────────────────────────────
    function getFiltered(filter) {
        if (filter === 'completed') return allRides.filter(r => r.status === 'completed');
        if (filter === 'cancelled') return allRides.filter(r => r.status === 'cancelled');
        return allRides;
    }

    function renderList(rides) {
        if (!rides.length) {
            return `
                <div class="hist-empty">
                    <div class="hist-empty-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
                    <h2>Sem corridas</h2>
                    <p>Nenhuma corrida encontrada para este filtro.</p>
                    <a href="#/" class="hist-btn hist-btn-primary">
                        <i class="fa-solid fa-house"></i> Pedir uma corrida
                    </a>
                </div>`;
        }
        return rides.map(renderCard).join('');
    }

    // ── init / destroy ────────────────────────────────────────────────────
    let filterHandlers = [];

    function init() {
        const filterRow = document.querySelector('.hist-filter-row');
        if (!filterRow) return;

        const handler = (e) => {
            const btn = e.target.closest('[data-filter]');
            if (!btn) return;

            activeFilter = btn.dataset.filter;

            filterRow.querySelectorAll('.hist-filter-btn').forEach(b =>
                b.classList.toggle('is-active', b === btn));

            const list = document.getElementById('hist-list');
            if (list) list.innerHTML = renderList(getFiltered(activeFilter));
        };

        filterRow.addEventListener('click', handler);
        filterHandlers.push(() => filterRow.removeEventListener('click', handler));
    }

    function destroy() {
        filterHandlers.forEach(fn => fn());
        filterHandlers = [];
    }

    return { html, init, destroy };
}
