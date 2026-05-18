import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { listarHistoricoDriver, inicializarHistoricoDriver } from '../dados/corridaDriverStorage.js';
import './HistoricoCorridasMotorista.css';

function formatarData(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('pt-AO', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function rotuloStatus(status) {
    if (status === 'completed') return 'Concluída';
    if (status === 'cancelled') return 'Cancelada';
    return status;
}

function renderizarCard(ride) {
    const st = ride.status === 'cancelled' ? 'cancelled' : 'completed';
    return `
        <a class="hmd-hist-card ${st}" href="#/motorista/historico/detalhe?id=${encodeURIComponent(ride.id)}">
            <div class="hmd-hist-card-top">
                <div class="hmd-hist-status-dot ${st}"></div>
                <div class="hmd-hist-main">
                    <div class="hmd-hist-route">${ride.routeSummary ?? '—'}</div>
                    <div class="hmd-hist-meta">
                        <span><i class="fa-solid fa-calendar"></i>${formatarData(ride.createdAt)}</span>
                        ${ride.estimatedDistance ? `<span><i class="fa-solid fa-location-dot"></i>${ride.estimatedDistance}</span>` : ''}
                        ${ride.duration ? `<span><i class="fa-solid fa-clock"></i>${ride.duration}</span>` : ''}
                    </div>
                </div>
                <span class="hmd-hist-badge ${st}">${rotuloStatus(ride.status)}</span>
            </div>

            <div class="hmd-hist-sep"></div>

            <div class="hmd-hist-card-bottom">
                <div class="hmd-hist-passenger">
                    <div class="hmd-hist-passenger-avatar">${ride.passenger?.initials ?? '?'}</div>
                    <div class="hmd-hist-passenger-info">
                        <span class="hmd-hist-passenger-name">${ride.passenger?.name ?? '—'}</span>
                        ${ride.passenger?.rating ? `<span class="hmd-hist-passenger-rating"><i class="fa-solid fa-star"></i>${ride.passenger.rating}</span>` : ''}
                    </div>
                </div>
                <div class="hmd-hist-card-bottom-right">
                    <div class="hmd-hist-earning ${st === 'cancelled' ? 'zero' : ''}">
                        ${ride.earnings ?? '—'}
                    </div>
                    <span class="hmd-hist-ver-detalhes">
                        <i class="fa-solid fa-chevron-right"></i>
                    </span>
                </div>
            </div>
        </a>
    `;
}

export default function HistoricoCorridasMotorista(rotaAtual = '/motorista/historico') {
    inicializarHistoricoDriver();

    const todas = listarHistoricoDriver();
    let filtroAtivo = 'todas';

    function renderLista(filtro) {
        const lista = filtro === 'todas'
            ? todas
            : todas.filter(r => r.status === filtro);

        if (!lista.length) {
            return `<p class="hmd-hist-empty">Nenhuma corrida encontrada.</p>`;
        }
        return lista.map(renderizarCard).join('');
    }

    const html = `
        ${HeaderMotorista(rotaAtual)}
        <main class="hmd-hist-shell">
            <div class="hmd-hist-container">
                <div class="hmd-hist-head">
                    <span class="hmd-hist-eyebrow">As minhas corridas</span>
                    <h1 class="hmd-hist-title">Histórico</h1>
                    <p class="hmd-hist-subtitle">${todas.length} corrida${todas.length !== 1 ? 's' : ''} registada${todas.length !== 1 ? 's' : ''}</p>
                </div>

                <div class="hmd-hist-filter-row">
                    <button class="hmd-hist-filter-btn is-active" data-filtro="todas">Todas</button>
                    <button class="hmd-hist-filter-btn" data-filtro="completed">Concluídas</button>
                    <button class="hmd-hist-filter-btn" data-filtro="cancelled">Canceladas</button>
                </div>

                <hr class="hmd-hist-divider">

                <div id="hmd-hist-lista">
                    ${renderLista('todas')}
                </div>
            </div>
        </main>
    `;

    function init() {
        document.querySelectorAll('.hmd-hist-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.hmd-hist-filter-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                filtroAtivo = btn.dataset.filtro;
                const lista = document.getElementById('hmd-hist-lista');
                if (lista) lista.innerHTML = renderLista(filtroAtivo);
            });
        });
    }

    return { html, init };
}
