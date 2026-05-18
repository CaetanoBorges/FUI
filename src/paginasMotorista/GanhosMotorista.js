import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { listarHistoricoDriver, inicializarHistoricoDriver } from '../dados/corridaDriverStorage.js';
import './GanhosMotorista.css';

function formatarMoeda(valor) {
    return `Kz ${valor.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function obterInicioSemana() {
    const d = new Date();
    const dia = d.getDay();
    const diff = (dia === 0 ? -6 : 1 - dia); // segunda-feira
    const inicio = new Date(d);
    inicio.setDate(d.getDate() + diff);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

function obterInicioMes() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function GanhosMotorista(rotaAtual = '/motorista/ganhos') {
    inicializarHistoricoDriver();

    const todasCorridas = listarHistoricoDriver();
    const concluidas = todasCorridas.filter(r => r.status === 'completed');

    const inicioSemana = obterInicioSemana();
    const inicioMes    = obterInicioMes();

    const corridasSemana = concluidas.filter(r => new Date(r.createdAt) >= inicioSemana);
    const corridasMes    = concluidas.filter(r => new Date(r.createdAt) >= inicioMes);

    const ganhosSemana = corridasSemana.reduce((acc, r) => acc + (r.earningsRaw ?? 0), 0);
    const ganhosMes    = corridasMes.reduce((acc, r) => acc + (r.earningsRaw ?? 0), 0);
    const ganhosTotal  = concluidas.reduce((acc, r) => acc + (r.earningsRaw ?? 0), 0);

    const taxaConc = todasCorridas.length > 0
        ? Math.round((concluidas.length / todasCorridas.length) * 100)
        : 0;

    // Últimas 5 corridas concluídas
    const ultimas = concluidas.slice(0, 5);

    const ultimasHtml = ultimas.length > 0
        ? ultimas.map(r => `
            <div class="gm-item">
                <div class="gm-item-avatar">${r.passenger?.initials ?? '?'}</div>
                <div class="gm-item-info">
                    <span class="gm-item-route">${r.routeSummary ?? '—'}</span>
                    <span class="gm-item-meta">${r.estimatedDistance ?? ''} ${r.duration ? `· ${r.duration}` : ''}</span>
                </div>
                <div class="gm-item-earning">${r.earnings ?? '—'}</div>
            </div>
        `).join('')
        : `<p class="gm-empty-list">Sem corridas concluídas ainda.</p>`;

    const html = `
        ${HeaderMotorista(rotaAtual)}
        <main class="gm-shell">
            <div class="gm-container">

                <div class="gm-head">
                    <span class="gm-eyebrow">Resumo financeiro</span>
                    <h1 class="gm-title">Ganhos</h1>
                </div>

                <!-- Cards principais -->
                <div class="gm-cards-grid">
                    <div class="gm-card gm-card-semana">
                        <div class="gm-card-icon"><i class="fa-solid fa-calendar-week"></i></div>
                        <div class="gm-card-info">
                            <span class="gm-card-label">Esta semana</span>
                            <span class="gm-card-value">${formatarMoeda(ganhosSemana)}</span>
                            <span class="gm-card-sub">${corridasSemana.length} corrida${corridasSemana.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    <div class="gm-card gm-card-mes">
                        <div class="gm-card-icon"><i class="fa-solid fa-calendar"></i></div>
                        <div class="gm-card-info">
                            <span class="gm-card-label">Este mês</span>
                            <span class="gm-card-value">${formatarMoeda(ganhosMes)}</span>
                            <span class="gm-card-sub">${corridasMes.length} corrida${corridasMes.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="gm-stats-row">
                    <div class="gm-stat">
                        <span class="gm-stat-value">${formatarMoeda(ganhosTotal)}</span>
                        <span class="gm-stat-label">Total acumulado</span>
                    </div>
                    <div class="gm-stat-sep"></div>
                    <div class="gm-stat">
                        <span class="gm-stat-value">${concluidas.length}</span>
                        <span class="gm-stat-label">Corridas concluídas</span>
                    </div>
                    <div class="gm-stat-sep"></div>
                    <div class="gm-stat">
                        <span class="gm-stat-value">${taxaConc}%</span>
                        <span class="gm-stat-label">Taxa de conclusão</span>
                    </div>
                </div>

                <!-- Últimas corridas -->
                <div class="gm-recentes">
                    <h2 class="gm-recentes-title">Últimas corridas</h2>
                    <div class="gm-items-list">
                        ${ultimasHtml}
                    </div>
                    ${concluidas.length > 5 ? `
                    <a href="#/motorista/historico" class="gm-ver-mais">
                        <i class="fa-solid fa-clock-rotate-left"></i> Ver histórico completo
                    </a>` : ''}
                </div>

            </div>
        </main>
    `;

    return html;
}
