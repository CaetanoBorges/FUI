import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { listarHistoricoDriver } from '../dados/corridaDriverStorage.js';
import './HistoricoDetalheMotorista.css';

function formatarData(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('pt-AO', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return iso; }
}

function renderizarRota(routeSummary) {
    if (!routeSummary) return `<p class="dmt-info-value">Rota não disponível</p>`;
    const partes = routeSummary.split('→').map(s => s.trim()).filter(Boolean);
    if (partes.length < 2) return `<p class="dmt-info-value">${routeSummary}</p>`;

    return `
        <div class="dmt-route">
            <div class="dmt-stop">
                <div class="dmt-stop-connector">
                    <div class="dmt-stop-dot origin"></div>
                    <div class="dmt-stop-line"></div>
                </div>
                <div>
                    <div class="dmt-stop-label">Origem</div>
                    <div class="dmt-stop-value">${partes[0]}</div>
                </div>
            </div>
            <div class="dmt-stop">
                <div class="dmt-stop-connector">
                    <div class="dmt-stop-dot dest"></div>
                    <div class="dmt-stop-line last"></div>
                </div>
                <div>
                    <div class="dmt-stop-label">Destino</div>
                    <div class="dmt-stop-value">${partes[partes.length - 1]}</div>
                </div>
            </div>
        </div>
    `;
}

function renderizarTagsAvaliacao(tags = []) {
    if (!tags.length) return '';
    return `
        <div class="dmt-tags">
            ${tags.map(t => `<span class="dmt-tag">${t}</span>`).join('')}
        </div>
    `;
}

function montarNaoEncontrado(rotaAtual) {
    return `
        ${HeaderMotorista(rotaAtual)}
        <main class="dmt-shell">
            <div class="dmt-container">
                <a href="#/motorista/historico" class="dmt-back"><i class="fa-solid fa-arrow-left"></i> Histórico</a>
                <div class="dmt-empty">
                    <div class="dmt-empty-icon"><i class="fa-solid fa-file-circle-question"></i></div>
                    <h2>Corrida não encontrada</h2>
                    <p>Este registo não existe ou foi removido.</p>
                    <a href="#/motorista/historico" class="dmt-btn-voltar"><i class="fa-solid fa-arrow-left"></i> Voltar ao histórico</a>
                </div>
            </div>
        </main>
    `;
}

export default function HistoricoDetalheMotorista(rotaAtual = '/motorista/historico/detalhe', params = {}) {
    const ride = listarHistoricoDriver().find(r => r.id === params.id);

    if (!ride) return montarNaoEncontrado(rotaAtual);

    const concluida = ride.status === 'completed';
    const statusLabel = concluida ? 'Concluída' : 'Cancelada';
    const statusIcone = concluida ? 'circle-check' : 'ban';

    const estrelas = ride.passengerRating
        ? [1, 2, 3, 4, 5].map(n =>
            `<i class="fa-solid fa-star dmt-star ${n <= ride.passengerRating ? 'ativo' : ''}"></i>`
          ).join('')
        : null;

    const html = `
        ${HeaderMotorista(rotaAtual)}
        <main class="dmt-shell">
            <div class="dmt-container">

                <a href="#/motorista/historico" class="dmt-back"><i class="fa-solid fa-arrow-left"></i> Histórico</a>

                <!-- Cabeçalho -->
                <div class="dmt-head">
                    <span class="dmt-eyebrow">Detalhe da corrida</span>
                    <h1 class="dmt-title">${ride.routeSummary ?? '—'}</h1>
                    <span class="dmt-badge ${concluida ? 'completed' : 'cancelled'}">
                        <i class="fa-solid fa-${statusIcone}"></i> ${statusLabel}
                    </span>
                </div>

                <!-- Rota -->
                <section class="dmt-section">
                    <h2 class="dmt-section-title"><i class="fa-solid fa-route"></i> Rota</h2>
                    ${renderizarRota(ride.routeSummary)}
                </section>

                <!-- Informações -->
                <section class="dmt-section">
                    <h2 class="dmt-section-title"><i class="fa-solid fa-circle-info"></i> Informações</h2>
                    <div class="dmt-info-grid">
                        <div class="dmt-info-row">
                            <span class="dmt-info-label">Data</span>
                            <span class="dmt-info-value">${formatarData(ride.createdAt)}</span>
                        </div>
                        <div class="dmt-info-row">
                            <span class="dmt-info-label">Distância</span>
                            <span class="dmt-info-value">${ride.estimatedDistance ?? '—'}</span>
                        </div>
                        <div class="dmt-info-row">
                            <span class="dmt-info-label">Duração</span>
                            <span class="dmt-info-value">${ride.duration ?? '—'}</span>
                        </div>
                        <div class="dmt-info-row">
                            <span class="dmt-info-label">Ganhos</span>
                            <span class="dmt-info-value dmt-earnings ${concluida ? '' : 'zero'}">${ride.earnings ?? '—'}</span>
                        </div>
                        ${ride.cancelMotivo ? `
                        <div class="dmt-info-row">
                            <span class="dmt-info-label">Motivo cancel.</span>
                            <span class="dmt-info-value dmt-cancel-reason">${ride.cancelMotivo}</span>
                        </div>` : ''}
                    </div>
                </section>

                <!-- Passageiro -->
                ${ride.passenger?.name ? `
                <section class="dmt-section">
                    <h2 class="dmt-section-title"><i class="fa-solid fa-user"></i> Passageiro</h2>
                    <div class="dmt-passenger-card">
                        <div class="dmt-passenger-avatar">${ride.passenger.initials ?? '?'}</div>
                        <div class="dmt-passenger-info">
                            <span class="dmt-passenger-name">${ride.passenger.name}</span>
                            ${ride.passenger.rating
                                ? `<span class="dmt-passenger-rating"><i class="fa-solid fa-star"></i> ${ride.passenger.rating}</span>`
                                : ''}
                        </div>
                    </div>
                </section>` : ''}

                <!-- Avaliação dada -->
                ${estrelas ? `
                <section class="dmt-section">
                    <h2 class="dmt-section-title"><i class="fa-solid fa-star"></i> A sua avaliação</h2>
                    <div class="dmt-avaliacao">
                        <div class="dmt-stars">${estrelas}</div>
                        ${renderizarTagsAvaliacao(ride.passengerTags ?? [])}
                        ${ride.passengerComment
                            ? `<p class="dmt-comment">"${ride.passengerComment}"</p>`
                            : ''}
                    </div>
                </section>` : ''}

                <a href="#/motorista/historico" class="dmt-btn-voltar">
                    <i class="fa-solid fa-arrow-left"></i> Voltar ao histórico
                </a>

            </div>
        </main>
    `;

    return { html, init() {} };
}
