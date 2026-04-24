import './AguardandoMotorista.css';
import { obterCorridaAtiva, limparCorridaAtiva } from '../dados/corridaStorage.js';
import Header from '../componentes/Header.js';

/**
 * Página de espera — mapa em fundo (CartoDB dark tiles), rota desenhada,
 * carros falsos nas proximidades. Após DURACAO_BUSCA mostra card do motorista.
 */

const DURACAO_BUSCA  = 6000;  // ms da fase de busca
const ATRASO_INICIO_CORRIDA = 5000;  // ms após mostrar motorista → simula "motorista iniciou"
const ETA_MINUTOS      = 4;     // minutos simulados para chegada
const CENTRO_PADRAO  = [-15.7939, -47.8828]; // fallback Brasília Centro

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
    const corrida = obterCorridaAtiva();

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

                    ${corrida?.driver ? `
                    <div class="wait-driver-card">
                        <div class="wait-driver-avatar">${corrida.driver.initials ?? '?'}</div>
                        <div class="wait-driver-info">
                            <span class="wait-driver-name">${corrida.driver.name ?? '—'}</span>
                            <span class="wait-driver-vehicle">${corrida.driver.vehicleColor ?? ''} ${corrida.driver.vehicleBrand ?? ''}</span>
                            <span class="wait-driver-plate">${corrida.driver.plate ?? '—'}</span>
                        </div>
                        ${corrida.driver.phone ? `
                        <a href="tel:${corrida.driver.phone}" class="wait-driver-call" title="Ligar para motorista">
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
    let temporizadores      = [];
    let instanciaMapa     = null;
    let camadaRota  = null;
    let camadaFicticia   = null;
    let camadaMotorista = null;

    // ── Helpers ─────────────────────────────────────────────────────────
    function sel(sel) { return document.querySelector(sel); }

    /** Retorna [lat, lng] do primeiro ponto da rota, ou o default. */
    function obterLatLngOrigem() {
        const seg = corrida?.segments?.[0];
        if (seg?.geometry?.coordinates?.length) {
            const [lng, lat] = seg.geometry.coordinates[0];
            return [lat, lng];
        }
        return CENTRO_PADRAO;
    }

    // ── Mapa ─────────────────────────────────────────────────────────────
    function inicializarMapa() {
        if (!window.L) return;
        const mapEl = document.getElementById('wait-map');
        if (!mapEl) return;

        const center = obterLatLngOrigem();

        instanciaMapa = L.map('wait-map', {
            zoomControl: false,
            attributionControl: false,
        }).setView(center, 14);

        // Tiles escuros (CartoDB Dark Matter — sem API key, gratuito)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(instanciaMapa);

        desenharRota();
        adicionarMotoristasFantasma();
    }

    /** Desenha a polyline + marcadores de origem/destino/parada. */
    function desenharRota() {
        if (!instanciaMapa || !corrida?.segments?.length) return;

        camadaRota = L.layerGroup().addTo(instanciaMapa);
        const bounds = L.latLngBounds([]);

        corrida.segments.forEach((seg, index) => {
            if (!seg.geometry?.coordinates?.length) return;

            const coords  = seg.geometry.coordinates;
            const latLngs = coords.map(([lng, lat]) => [lat, lng]);

            L.polyline(latLngs, {
                ...(seg.style || {}),
                color:   seg.style?.color   ?? '#58a6ff',
                weight:  seg.style?.weight  ?? 5,
                opacity: seg.style?.opacity ?? 0.85,
            }).addTo(camadaRota);

            const [firstLng, firstLat] = coords[0];
            const [lastLng,  lastLat]  = coords[coords.length - 1];

            bounds.extend([firstLat, firstLng]);
            bounds.extend([lastLat,  lastLng]);

            if (index === 0) {
                L.marker([firstLat, firstLng], { icon: criarIconeRota('origem') }).addTo(camadaRota);
            }

            const tipo = index === corrida.segments.length - 1 ? 'destino' : 'parada';
            L.marker([lastLat, lastLng], { icon: criarIconeRota(tipo) }).addTo(camadaRota);
        });

        // padding[1] reserva espaço para o overlay inferior (~220px)
        if (bounds.isValid()) {
            instanciaMapa.fitBounds(bounds, { paddingBottomRight: [0, 220], paddingTopLeft: [40, 40], maxZoom: 14 });
        }
    }

    /** Adiciona 4 marcadores de carro fictícios próximos à rota (fase de busca). */
    function adicionarMotoristasFantasma() {
        if (!instanciaMapa) return;

        const [clat, clng] = obterLatLngOrigem();

        // Offsets variados para simular carros nas proximidades
        const offsets = [
            [ 0.018, -0.010],
            [-0.014,  0.022],
            [ 0.006,  0.028],
            [-0.020, -0.018],
        ];

        camadaFicticia = L.layerGroup().addTo(instanciaMapa);
        offsets.forEach(([dlat, dlng]) => {
            L.marker([clat + dlat, clng + dlng], { icon: criarIconeCarro() }).addTo(camadaFicticia);
        });
    }

    /** Volta o marcador do motorista designado próximo à origem. */
    function adicionarMarcadorMotorista() {
        if (!instanciaMapa) return;

        const [lat, lng] = obterLatLngOrigem();
        camadaMotorista = L.layerGroup().addTo(instanciaMapa);
        L.marker([lat + 0.006, lng - 0.004], { icon: criarIconeCarro('#3fb950') }).addTo(camadaMotorista);
    }

    // ── Transição das fases ───────────────────────────────────────────────
    function transicionarParaEncontrado() {
        const phaseSearch = sel('#wait-phase-searching');
        const phaseFound  = sel('#wait-phase-found');
        if (!phaseSearch || !phaseFound) return;

        phaseSearch.style.transition = 'opacity 0.3s ease';
        phaseSearch.style.opacity    = '0';

        temporizadores.push(setTimeout(() => {
            phaseSearch.style.display = 'none';
            phaseFound.style.display  = '';
            phaseFound.style.opacity  = '0';
            phaseFound.style.transition = 'opacity 0.3s ease';

            requestAnimationFrame(() => { phaseFound.style.opacity = '1'; });

            // Troca marcadores no mapa
            if (camadaFicticia) { camadaFicticia.clearLayers(); }
            adicionarMarcadorMotorista();

            // Simula o motorista iniciando a corrida após ATRASO_INICIO_CORRIDA
            temporizadores.push(setTimeout(() => {
                window.location.hash = '#/corrida-ativa';
            }, ATRASO_INICIO_CORRIDA));
        }, 300));
    }

    // ── Modal de cancelamento ─────────────────────────────────────────────
    function abrirModalCancelamento() {
        const backdrop = sel('#wait-cancel-modal');
        if (!backdrop) return;
        backdrop.style.display = 'flex';
        requestAnimationFrame(() => backdrop.classList.add('is-visible'));
    }

    function fecharModalCancelamento() {
        const backdrop = sel('#wait-cancel-modal');
        if (!backdrop) return;
        backdrop.classList.remove('is-visible');
        temporizadores.push(setTimeout(() => { backdrop.style.display = 'none'; }, 260));
    }

    function confirmarCancelamento() {
        limparCorridaAtiva();
        window.location.hash = '#/';
    }

    // ── init / destroy ────────────────────────────────────────────────────
    function init() {
        // Oculta modal inicialmente
        const backdrop = sel('#wait-cancel-modal');
        if (backdrop) backdrop.style.display = 'none';

        // Inicializa mapa
        inicializarMapa();

        // Fase 1 → Fase 2 após DURACAO_BUSCA
        temporizadores.push(setTimeout(transicionarParaEncontrado, DURACAO_BUSCA));

        // Botões cancelar
        sel('#wait-btn-cancel-search')?.addEventListener('click', abrirModalCancelamento);
        sel('#wait-btn-cancel-found')?.addEventListener('click',  abrirModalCancelamento);

        // Modal: manter / confirmar
        sel('#wait-modal-keep')?.addEventListener('click', fecharModalCancelamento);
        sel('#wait-modal-confirm')?.addEventListener('click', confirmarCancelamento);

        backdrop?.addEventListener('click', (e) => {
            if (e.target === backdrop) fecharModalCancelamento();
        });
    }

    function destroy() {
        temporizadores.forEach(clearTimeout);
        temporizadores = [];
        if (instanciaMapa) {
            instanciaMapa.remove();
            instanciaMapa = null;
        }
    }

    return { html, init, destroy };
}
