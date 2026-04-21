import './AguardandoMotorista.css';
import { getActiveRide, clearActiveRide } from '../dados/corridaStorage.js';
import Header from '../componentes/Header.js';

/**
 * Página de espera — mapa em fundo (CartoDB dark tiles), rota desenhada,
 * carros falsos nas proximidades. Após SEARCH_DURATION mostra card do motorista.
 */

const SEARCH_DURATION  = 6000;  // ms da fase de busca
const RIDE_START_DELAY = 5000;  // ms após mostrar motorista → simula "motorista iniciou"
const ETA_MINUTOS      = 4;     // minutos simulados para chegada
const DEFAULT_CENTER  = [-15.7939, -47.8828]; // fallback Brasília Centro

// ── Ícones de rota (igual ao ChamarCorrida) ───────────────────────────────
function criarIconeRota(tipo) {
    const estilos = {
        origem:  { cor: '#10b981', icone: 'fa-circle-play' },
        parada:  { cor: '#f59e0b', icone: 'fa-circle-dot' },
        destino: { cor: '#e63946', icone: 'fa-flag-checkered' },
    };
    const { cor, icone } = estilos[tipo] || estilos.destino;
    const html = `<div class="wm-route-marker" style="background:${cor};color:#fff"><i class="fa-solid ${icone}"></i></div>`;
    return L.divIcon({ html, className: 'wm-marker-wrap', iconSize: [30, 30], iconAnchor: [15, 15] });
}

// ── Ícone de carro para motoristas ──────────────────────────────────────
function criarIconeCarro(cor = '#1f6feb') {
    const html = `<div class="wm-car-marker" style="background:${cor}"><i class="fa-solid fa-car"></i></div>`;
    return L.divIcon({ html, className: 'wm-marker-wrap', iconSize: [28, 28], iconAnchor: [14, 14] });
}

export default function AguardandoMotorista(rotaAtual = '/aguardando-motorista', query = {}) {
    const ride = getActiveRide();

    // ── HTML ──────────────────────────────────────────────────────────────
    const html = `
        ${Header('Aguardando', rotaAtual)}

        <div class="wait-shell">
            <div id="wait-map"></div>

            <div class="wait-overlay">

                <!-- FASE 1: buscando -->
                <div id="wait-phase-searching">
                    <div class="wait-search-head">
                        <div class="wait-pulse-wrap">
                            <div class="wait-pulse-ring"></div>
                            <div class="wait-pulse-ring"></div>
                            <div class="wait-pulse-ring"></div>
                            <div class="wait-pulse-icon">
                                <i class="fa-solid fa-car"></i>
                            </div>
                        </div>
                        <div class="wait-search-text">
                            <p class="wait-label">Gyro — Ride</p>
                            <p class="wait-title">Procurando motorista</p>
                            <div class="wait-dots"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                    <div class="wait-actions" style="margin-top:0.25rem;">
                        <button id="wait-btn-cancel-search" class="wait-btn wait-btn-danger">
                            <i class="fa-solid fa-xmark"></i> Cancelar corrida
                        </button>
                    </div>
                </div>

                <!-- FASE 2: motorista encontrado -->
                <div id="wait-phase-found" style="display:none;">

                    <div class="wait-found-head">
                        <div class="wait-found-icon">
                            <i class="fa-solid fa-circle-check"></i>
                        </div>
                        <div class="wait-search-text">
                            <p class="wait-label">Motorista confirmado</p>
                            <p class="wait-title">Motorista a caminho!</p>
                        </div>
                    </div>

                    ${ride?.driver ? `
                    <div class="wait-driver-card">
                        <div class="wait-driver-avatar">${ride.driver.initials ?? '?'}</div>
                        <div class="wait-driver-info">
                            <span class="wait-driver-name">${ride.driver.name ?? '—'}</span>
                            <span class="wait-driver-vehicle">${ride.driver.vehicleColor ?? ''} ${ride.driver.vehicleBrand ?? ''}</span>
                            <span class="wait-driver-plate">${ride.driver.plate ?? '—'}</span>
                        </div>
                        ${ride.driver.phone ? `
                        <a href="tel:${ride.driver.phone}" class="wait-driver-call" title="Ligar para motorista">
                            <i class="fa-solid fa-phone"></i>
                        </a>` : ''}
                    </div>
                    <div class="wait-eta">
                        <i class="fa-solid fa-location-dot"></i>
                        Chegada estimada em <strong>${ETA_MINUTOS} min</strong>
                    </div>` : ''}

                    <hr class="wait-divider">

                    <div id="wait-starting-msg" class="wait-eta" style="justify-content:center;">
                        <i class="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Aguardando o motorista iniciar a corrida&hellip;</span>
                    </div>

                    <div class="wait-actions">
                        <button id="wait-btn-cancel-found" class="wait-btn wait-btn-danger">
                            <i class="fa-solid fa-xmark"></i> Cancelar
                        </button>
                    </div>
                </div>

            </div><!-- /wait-overlay -->
        </div><!-- /wait-shell -->

        <!-- Modal de confirmação de cancelamento -->
        <div id="wait-cancel-modal" class="wait-modal-backdrop">
            <div class="wait-modal">
                <i class="fa-solid fa-triangle-exclamation wait-modal-icon"></i>
                <p class="wait-modal-title">Cancelar corrida?</p>
                <p class="wait-modal-desc">
                    Tem certeza que deseja cancelar? Você voltará para a tela inicial.
                </p>
                <div class="wait-modal-actions">
                    <button id="wait-modal-keep" class="wait-btn wait-btn-secondary">Manter</button>
                    <button id="wait-modal-confirm" class="wait-btn wait-btn-danger">Sim, cancelar</button>
                </div>
            </div>
        </div>
    `;

    // ── State ───────────────────────────────────────────────────────────
    let timers      = [];
    let mapInst     = null;
    let routeLayer  = null;
    let fakeLayer   = null;
    let driverLayer = null;

    // ── Helpers ─────────────────────────────────────────────────────────
    function qs(sel) { return document.querySelector(sel); }

    /** Retorna [lat, lng] do primeiro ponto da rota, ou o default. */
    function getOriginLatLng() {
        const seg = ride?.segments?.[0];
        if (seg?.geometry?.coordinates?.length) {
            const [lng, lat] = seg.geometry.coordinates[0];
            return [lat, lng];
        }
        return DEFAULT_CENTER;
    }

    // ── Mapa ─────────────────────────────────────────────────────────────
    function initMap() {
        if (!window.L) return;
        const mapEl = document.getElementById('wait-map');
        if (!mapEl) return;

        const center = getOriginLatLng();

        mapInst = L.map('wait-map', {
            zoomControl: false,
            attributionControl: false,
        }).setView(center, 14);

        // Tiles escuros (CartoDB Dark Matter — sem API key, gratuito)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(mapInst);

        drawRoute();
        addFakeDrivers();
    }

    /** Desenha a polyline + marcadores de origem/destino/parada. */
    function drawRoute() {
        if (!mapInst || !ride?.segments?.length) return;

        routeLayer = L.layerGroup().addTo(mapInst);
        const bounds = L.latLngBounds([]);

        ride.segments.forEach((seg, index) => {
            if (!seg.geometry?.coordinates?.length) return;

            const coords  = seg.geometry.coordinates;
            const latLngs = coords.map(([lng, lat]) => [lat, lng]);

            L.polyline(latLngs, {
                ...(seg.style || {}),
                color:   seg.style?.color   ?? '#58a6ff',
                weight:  seg.style?.weight  ?? 5,
                opacity: seg.style?.opacity ?? 0.85,
            }).addTo(routeLayer);

            const [firstLng, firstLat] = coords[0];
            const [lastLng,  lastLat]  = coords[coords.length - 1];

            bounds.extend([firstLat, firstLng]);
            bounds.extend([lastLat,  lastLng]);

            if (index === 0) {
                L.marker([firstLat, firstLng], { icon: criarIconeRota('origem') }).addTo(routeLayer);
            }

            const tipo = index === ride.segments.length - 1 ? 'destino' : 'parada';
            L.marker([lastLat, lastLng], { icon: criarIconeRota(tipo) }).addTo(routeLayer);
        });

        // padding[1] reserva espaço para o overlay inferior (~220px)
        if (bounds.isValid()) {
            mapInst.fitBounds(bounds, { paddingBottomRight: [0, 220], paddingTopLeft: [40, 40], maxZoom: 14 });
        }
    }

    /** Adiciona 4 marcadores de carro fictícios próximos à rota (fase de busca). */
    function addFakeDrivers() {
        if (!mapInst) return;

        const [clat, clng] = getOriginLatLng();

        // Offsets variados para simular carros nas proximidades
        const offsets = [
            [ 0.018, -0.010],
            [-0.014,  0.022],
            [ 0.006,  0.028],
            [-0.020, -0.018],
        ];

        fakeLayer = L.layerGroup().addTo(mapInst);
        offsets.forEach(([dlat, dlng]) => {
            L.marker([clat + dlat, clng + dlng], { icon: criarIconeCarro() }).addTo(fakeLayer);
        });
    }

    /** Volta o marcador do motorista designado próximo à origem. */
    function addDriverMarker() {
        if (!mapInst) return;

        const [lat, lng] = getOriginLatLng();
        driverLayer = L.layerGroup().addTo(mapInst);
        L.marker([lat + 0.006, lng - 0.004], { icon: criarIconeCarro('#3fb950') }).addTo(driverLayer);
    }

    // ── Transição das fases ───────────────────────────────────────────────
    function transitionToFound() {
        const phaseSearch = qs('#wait-phase-searching');
        const phaseFound  = qs('#wait-phase-found');
        if (!phaseSearch || !phaseFound) return;

        phaseSearch.style.transition = 'opacity 0.3s ease';
        phaseSearch.style.opacity    = '0';

        timers.push(setTimeout(() => {
            phaseSearch.style.display = 'none';
            phaseFound.style.display  = '';
            phaseFound.style.opacity  = '0';
            phaseFound.style.transition = 'opacity 0.3s ease';

            requestAnimationFrame(() => { phaseFound.style.opacity = '1'; });

            // Troca marcadores no mapa
            if (fakeLayer) { fakeLayer.clearLayers(); }
            addDriverMarker();

            // Simula o motorista iniciando a corrida após RIDE_START_DELAY
            timers.push(setTimeout(() => {
                window.location.hash = '#/corrida-ativa';
            }, RIDE_START_DELAY));
        }, 300));
    }

    // ── Modal de cancelamento ─────────────────────────────────────────────
    function openCancelModal() {
        const backdrop = qs('#wait-cancel-modal');
        if (!backdrop) return;
        backdrop.style.display = 'flex';
        requestAnimationFrame(() => backdrop.classList.add('is-visible'));
    }

    function closeCancelModal() {
        const backdrop = qs('#wait-cancel-modal');
        if (!backdrop) return;
        backdrop.classList.remove('is-visible');
        timers.push(setTimeout(() => { backdrop.style.display = 'none'; }, 260));
    }

    function confirmCancel() {
        clearActiveRide();
        window.location.hash = '#/';
    }

    // ── init / destroy ────────────────────────────────────────────────────
    function init() {
        // Oculta modal inicialmente
        const backdrop = qs('#wait-cancel-modal');
        if (backdrop) backdrop.style.display = 'none';

        // Inicializa mapa
        initMap();

        // Fase 1 → Fase 2 após SEARCH_DURATION
        timers.push(setTimeout(transitionToFound, SEARCH_DURATION));

        // Botões cancelar
        qs('#wait-btn-cancel-search')?.addEventListener('click', openCancelModal);
        qs('#wait-btn-cancel-found')?.addEventListener('click',  openCancelModal);

        // Modal: manter / confirmar
        qs('#wait-modal-keep')?.addEventListener('click', closeCancelModal);
        qs('#wait-modal-confirm')?.addEventListener('click', confirmCancel);

        backdrop?.addEventListener('click', (e) => {
            if (e.target === backdrop) closeCancelModal();
        });
    }

    function destroy() {
        timers.forEach(clearTimeout);
        timers = [];
        if (mapInst) {
            mapInst.remove();
            mapInst = null;
        }
    }

    return { html, init, destroy };
}
