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
        <article class="hist-card" data-id="${ride.id}" role="button" tabindex="0" aria-label="Ver detalhes da corrida">
            <div class="hist-card-top">
                <div class="hist-status-dot ${st}"></div>
                <div class="hist-card-main">
                    <div class="hist-route" title="${ride.routeSummary ?? ''}">${ride.routeSummary ?? '—'}</div>
                    <div class="hist-meta">
                        <span><i class="fa-solid fa-circle-play"></i>${formatDate(ride.scheduledAt || ride.createdAt)}</span>
                        ${ride.status === 'completed' ? `<span><i class="fa-solid fa-flag-checkered"></i>${formatDate(new Date(new Date(ride.scheduledAt || ride.createdAt).getTime() + 70000).toISOString())}</span>` : ''}
                        ${ride.estimatedDistance ? `<span><i class="fa-solid fa-location-dot"></i>${ride.estimatedDistance}</span>` : ''}
                        ${ride.estimatedPrice   ? `<span><i class="fa-solid fa-money-bill-wave"></i>${ride.estimatedPrice}</span>` : ''}
                    </div>
                </div>
                <span class="hist-badge ${st}">${statusLabel(ride.status)}</span>
            </div>
            ${driverHtml}
            <div class="hist-card-footer">
                <span class="hist-card-details-link"><i class="fa-solid fa-circle-info"></i> Ver detalhes</span>
            </div>
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

    // ── Modal de detalhes ─────────────────────────────────────────────────
    let detailModalEl = null;

    function horaChegada(ride) {
        if (ride.status !== 'completed') return null;
        // Calculamos a hora de chegada: createdAt + soma dos stages
        const TOTAL_FLOW_MS = 12000 + 18000 + 12000 + 28000; // 70 s
        const ref = ride.scheduledAt
            ? new Date(ride.scheduledAt).getTime()
            : new Date(ride.createdAt).getTime();
        return new Date(ref + TOTAL_FLOW_MS).toISOString();
    }

    function buildModal(ride) {
        const st = ride.status === 'cancelled' ? 'cancelled' : 'completed';
        const d  = ride.driver || {};

        // ── Rota ──
        const stops = Array.isArray(ride.stops) && ride.stops.length
            ? ride.stops
            : (typeof ride.routeSummary === 'string'
                ? ride.routeSummary.split('→').map(s => s.trim()).filter(Boolean)
                : []);

        const stopsHtml = stops.map((stop, i) => {
            const label = i === 0 ? 'Origem' : i === stops.length - 1 ? 'Destino' : `Paragem ${i}`;
            return `<div class="hm-stop">
                <div class="hm-stop-connector">
                    <div class="hm-stop-dot ${i === 0 ? 'origem' : i === stops.length - 1 ? 'destino' : 'parada'}"></div>
                    <div class="hm-stop-line"></div>
                </div>
                <div class="hm-stop-text">
                    <span class="hm-stop-label">${label}</span>
                    <span class="hm-stop-value">${stop}</span>
                </div>
            </div>`;
        }).join('');

        // ── Dados principais ──
        const rows = [
            { icon: 'fa-calendar-plus',    label: 'Pedido em',       value: formatDate(ride.createdAt) },
            ride.scheduledAt
                ? { icon: 'fa-calendar-clock', label: 'Agendado para', value: formatDate(ride.scheduledAt) }
                : null,
            ride.status === 'completed'
                ? { icon: 'fa-flag-checkered',  label: 'Chegada',         value: formatDate(horaChegada(ride)) }
                : null,
            ride.estimatedDistance
                ? { icon: 'fa-location-dot',    label: 'Distância',       value: ride.estimatedDistance }
                : null,
            ride.estimatedDuration
                ? { icon: 'fa-stopwatch',        label: 'Duração',         value: ride.estimatedDuration }
                : null,
            ride.vehicleLabel
                ? { icon: 'fa-car',              label: 'Veículo',          value: ride.vehicleLabel }
                : null,
            ride.estimatedPrice
                ? { icon: 'fa-money-bill-wave',  label: 'Preço',            value: ride.estimatedPrice }
                : null,
            ride.status === 'cancelled' && ride.cancelReason
                ? { icon: 'fa-ban',              label: 'Motivo cancelamento', value: ride.cancelReason }
                : null,
        ].filter(Boolean);

        const rowsHtml = rows.map(r => `
            <div class="hm-row">
                <span class="hm-row-icon"><i class="fa-solid ${r.icon}"></i></span>
                <span class="hm-row-label">${r.label}</span>
                <span class="hm-row-value">${r.value}</span>
            </div>`).join('');

        // ── Motorista ──
        const driverHtml = d.name ? `
            <div class="hm-section-title">Motorista</div>
            <div class="hm-driver">
                <div class="hm-driver-avatar">${d.initials || '?'}</div>
                <div class="hm-driver-info">
                    <span class="hm-driver-name">${d.name}</span>
                    <span class="hm-driver-sub">${d.vehicleBrand || ''} · ${d.vehicleColor || ''}</span>
                </div>
                ${d.plate ? `<span class="hm-driver-plate">${d.plate}</span>` : ''}
            </div>` : '';

        // ── Avaliação ──
        const r = ride.rating;
        const ratingHtml = r ? `
            <div class="hm-section-title">Avaliação</div>
            <div class="hm-rating">
                <div class="hm-rating-stars">${[1,2,3,4,5].map(n =>
                    `<span class="hm-star${n <= r.nota ? ' filled' : ''}">&#9733;</span>`).join('')}
                </div>
                <span class="hm-rating-texto">${r.texto || ''}</span>
                ${r.tags?.length ? `<div class="hm-rating-tags">${r.tags.map(t => `<span class="hm-rtag">${t}</span>`).join('')}</div>` : ''}
                ${r.comentario ? `<p class="hm-rating-comment">“${r.comentario}”</p>` : ''}
            </div>` : '';

        return `
            <div class="hist-modal-overlay" id="hm-overlay" role="dialog" aria-modal="true" aria-label="Detalhes da corrida">
                <div class="hm-sheet">
                    <div class="hm-sheet-handle"></div>

                    <div class="hm-sheet-header">
                        <div>
                            <div class="hm-sheet-eyebrow">Corrida</div>
                            <div class="hm-sheet-route">${ride.routeSummary || '—'}</div>
                        </div>
                        <span class="hist-badge ${st}">${statusLabel(ride.status)}</span>
                    </div>

                    <div class="hm-body">
                        ${stops.length ? `<div class="hm-section-title">Trajeto</div><div class="hm-stops">${stopsHtml}</div>` : ''}

                        <div class="hm-section-title">Informações</div>
                        <div class="hm-rows">${rowsHtml}</div>

                        ${driverHtml}
                        ${ratingHtml}
                    </div>

                    <div class="hm-sheet-footer">
                        <button type="button" class="hm-btn-fechar" id="hm-btn-fechar">
                            <i class="fa-solid fa-xmark"></i> Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function abrirModal(ride) {
        if (detailModalEl) return;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = buildModal(ride);
        detailModalEl = wrapper.firstElementChild;
        document.body.appendChild(detailModalEl);
        requestAnimationFrame(() => requestAnimationFrame(() => detailModalEl.classList.add('visible')));

        function fechar() {
            detailModalEl.classList.remove('visible');
            detailModalEl.addEventListener('transitionend', () => {
                detailModalEl?.remove();
                detailModalEl = null;
            }, { once: true });
        }

        document.getElementById('hm-btn-fechar')?.addEventListener('click', fechar);
        detailModalEl.addEventListener('click', (e) => { if (e.target === detailModalEl) fechar(); });

        // Fechar com Escape
        const onKey = (e) => { if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', onKey); } };
        document.addEventListener('keydown', onKey);
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

        // Abrir modal ao clicar num card
        const listEl = document.getElementById('hist-list');
        const cardHandler = (e) => {
            const card = e.target.closest('.hist-card[data-id]');
            if (!card) return;
            const id = card.dataset.id;
            const ride = allRides.find(r => r.id === id);
            if (ride) abrirModal(ride);
        };
        listEl?.addEventListener('click', cardHandler);
        listEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') cardHandler(e); });
        filterHandlers.push(() => listEl?.removeEventListener('click', cardHandler));
    }

    function destroy() {
        filterHandlers.forEach(fn => fn());
        filterHandlers = [];
        if (detailModalEl) {
            detailModalEl.remove();
            detailModalEl = null;
        }
    }

    return { html, init, destroy };
}
