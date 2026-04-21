import Header from '../componentes/Header.js';
import { clearActiveRide, getActiveRide } from '../dados/corridaStorage.js';
import './CorridaAtiva.css';

let rideTickInterval = null;
let rideCancelHandler = null;
let ridePrimaryHandler = null;

const RIDE_FLOW = [
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

function formatRemaining(ms) {
    const safe = Math.max(0, ms);
    const totalSeconds = Math.floor(safe / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

function getRideStage(ride) {
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
            description: `A corrida está agendada para ${formatIso(ride.scheduledAt)}.`,
            progress: 8,
            progressLabel: `Partida em ${formatRemaining(remaining)}`,
            tone: 'warning',
            isFinished: false,
            isScheduled: true
        };
    }

    const referenceTime = scheduleTime || new Date(ride.createdAt).getTime();
    const elapsed = Math.max(0, now - referenceTime);
    const totalDuration = RIDE_FLOW.reduce((sum, stage) => sum + stage.durationMs, 0);
    let consumed = 0;

    for (const stage of RIDE_FLOW) {
        const stageEnd = consumed + stage.durationMs;
        if (elapsed < stageEnd) {
            const progress = Math.min(98, ((elapsed / totalDuration) * 100));
            return {
                key: stage.key,
                label: stage.label,
                description: stage.description,
                progress,
                progressLabel: stage.key === 'in_progress'
                    ? 'Aproximação ao destino em curso'
                    : 'Atualização automática da simulação',
                tone: stage.tone,
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

function getToneClass(tone = 'default') {
    if (tone === 'success') return 'is-success';
    if (tone === 'warning') return 'is-warning';
    if (tone === 'danger') return 'is-danger';
    return '';
}

function getRouteStops(ride) {
    if (Array.isArray(ride?.stops) && ride.stops.length) {
        return ride.stops;
    }

    if (typeof ride?.routeSummary === 'string' && ride.routeSummary.trim()) {
        return ride.routeSummary.split('→').map(item => item.trim()).filter(Boolean);
    }

    return [];
}

function renderRouteTable(ride) {
    const stops = getRouteStops(ride);
    if (!stops.length) {
        return `
            <table class="ride-table">
                <tbody>
                    <tr>
                        <th>Rota</th>
                        <td>Rota não disponível</td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    const rows = stops.map((stop, index) => {
        const label = index === 0
            ? 'Origem'
            : index === stops.length - 1
                ? 'Destino'
                : `Paragem ${index}`;

        return `
            <tr>
                <th>${label}</th>
                <td>${stop}</td>
            </tr>
        `;
    }).join('');

    return `
        <table class="ride-table">
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

function renderSummaryTable(ride) {
    const fields = [
        { label: 'Rota', value: ride.routeSummary || '—' },
        { label: 'Veículo', value: ride.vehicleLabel || '—' },
        { label: 'Partida', value: ride.whenLabel || '—' },
        { label: 'Distância estimada', value: ride.estimatedDistance || '—' },
        { label: 'Duração estimada', value: ride.estimatedDuration || '—' },
        { label: 'Preço estimado', value: ride.estimatedPrice || '—' }
    ];

    const rows = fields.map((field) => `
        <tr>
            <th>${field.label}</th>
            <td>${field.value}</td>
        </tr>
    `).join('');

    return `
        <table class="ride-table">
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

function buildEmptyState(rotaAtual) {
    return `
        ${Header('Corrida ativa', rotaAtual)}
        <main class="ride-shell">
            <section class="ride-container">
                <article class="ride-empty">
                    <div class="ride-empty-icon"><i class="fa-solid fa-route"></i></div>
                    <h1>Sem corrida ativa</h1>
                    <p>Ainda não existe nenhuma corrida guardada para simulação. Chame uma nova corrida na Home para ver todos os detalhes aqui.</p>
                    <div class="ride-actions">
                        <a href="#/" class="ride-btn ride-btn-primary"><i class="fa-solid fa-house"></i>Ir para a Home</a>
                    </div>
                </article>
            </section>
        </main>
    `;
}

function buildRidePage(ride, rotaAtual) {
    const stage = getRideStage(ride);

    return `
        ${Header('Corrida ativa', rotaAtual)}
        <main class="ride-shell">
            <section class="ride-container">
                <article class="ride-hero">
                    <span class="ride-kicker"><i class="fa-solid fa-bolt"></i>Corrida ativa</span>
                    <h1 class="ride-title">Acompanhe a simulação da sua corrida</h1>
                    <p class="ride-subtitle">Detalhes exibidos exatamente conforme os dados confirmados no componente de chamada.</p>

                    <div class="ride-status-pill ${getToneClass(stage.tone)}" id="ride-status-pill">
                        <i class="fa-solid fa-car-side"></i>
                        <span id="ride-status-label">${stage.label}</span>
                    </div>

                    <div class="ride-progress">
                        <div class="ride-progress-track">
                            <div class="ride-progress-bar" id="ride-progress-bar" style="width:${stage.progress}%"></div>
                        </div>
                        <div class="ride-progress-meta">
                            <strong id="ride-progress-description">${stage.description}</strong>
                            <span id="ride-progress-meta">${stage.progressLabel}</span>
                        </div>
                    </div>
                </article>

                <section class="ride-layout">
                    <article class="ride-card">
                        <h2 class="ride-section-title"><i class="fa-solid fa-route"></i>Rota da corrida</h2>
                        ${renderRouteTable(ride)}
                    </article>

                    <article class="ride-card">
                        <h2 class="ride-section-title"><i class="fa-solid fa-table-list"></i>Resumo confirmado</h2>
                        ${renderSummaryTable(ride)}

                        <div class="ride-actions">
                            <button type="button" class="ride-btn ride-btn-danger" id="ride-cancel-btn"><i class="fa-solid fa-ban"></i>Cancelar corrida</button>
                            <button type="button" class="ride-btn ride-btn-secondary" id="ride-primary-btn"><i class="fa-solid fa-house"></i>${stage.isFinished ? 'Limpar e voltar para a Home' : 'Voltar para a Home'}</button>
                        </div>
                    </article>
                </section>
            </section>
        </main>
    `;
}

function updateRideUi() {
    const ride = getActiveRide();
    if (!ride) return;

    const stage = getRideStage(ride);
    const statusPill = document.getElementById('ride-status-pill');
    const statusLabel = document.getElementById('ride-status-label');
    const progressBar = document.getElementById('ride-progress-bar');
    const progressDescription = document.getElementById('ride-progress-description');
    const progressMeta = document.getElementById('ride-progress-meta');
    const primaryButton = document.getElementById('ride-primary-btn');
    const cancelButton = document.getElementById('ride-cancel-btn');

    if (!statusPill || !statusLabel || !progressBar || !progressDescription || !progressMeta) {
        return;
    }

    statusPill.className = `ride-status-pill ${getToneClass(stage.tone)}`.trim();
    statusLabel.textContent = stage.label;
    progressBar.style.width = `${stage.progress}%`;
    progressDescription.textContent = stage.description;
    progressMeta.textContent = stage.progressLabel;

    if (primaryButton) {
        primaryButton.innerHTML = stage.isFinished
            ? '<i class="fa-solid fa-house"></i>Limpar e voltar para a Home'
            : '<i class="fa-solid fa-house"></i>Voltar para a Home';
    }

    if (cancelButton) {
        cancelButton.disabled = stage.isFinished;
        cancelButton.style.opacity = stage.isFinished ? '0.55' : '1';
        cancelButton.style.cursor = stage.isFinished ? 'not-allowed' : 'pointer';
    }
}

export default function CorridaAtiva(rotaAtual = '/corrida-ativa') {
    const ride = getActiveRide();

    return {
        html: ride ? buildRidePage(ride, rotaAtual) : buildEmptyState(rotaAtual),
        init() {
            if (!ride) return;

            updateRideUi();
            rideTickInterval = window.setInterval(updateRideUi, 1000);

            const cancelButton = document.getElementById('ride-cancel-btn');
            const primaryButton = document.getElementById('ride-primary-btn');

            rideCancelHandler = () => {
                const currentRide = getActiveRide();
                if (!currentRide) return;

                clearActiveRide();
                window.location.hash = '#/corrida-ativa';
            };

            ridePrimaryHandler = () => {
                const stage = getRideStage(getActiveRide());
                if (stage.isFinished) {
                    clearActiveRide();
                }
                window.location.hash = '#/';
            };

            cancelButton?.addEventListener('click', rideCancelHandler);
            primaryButton?.addEventListener('click', ridePrimaryHandler);
        },
        destroy() {
            if (rideTickInterval) {
                window.clearInterval(rideTickInterval);
                rideTickInterval = null;
            }

            const cancelButton = document.getElementById('ride-cancel-btn');
            const primaryButton = document.getElementById('ride-primary-btn');

            if (cancelButton && rideCancelHandler) {
                cancelButton.removeEventListener('click', rideCancelHandler);
            }

            if (primaryButton && ridePrimaryHandler) {
                primaryButton.removeEventListener('click', ridePrimaryHandler);
            }

            rideCancelHandler = null;
            ridePrimaryHandler = null;
        }
    };
}
