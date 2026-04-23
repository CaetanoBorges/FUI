import Header from '../componentes/Header.js';
import ChamarCorrida from '../componentes/ChamarCorrida.js';
import { getActiveRide } from '../dados/corridaStorage.js';
import './Home.css';

let hmMap = null;
let hmMarker = null;
let hmGeoWatchId = null;
let hmMapLoaderEl = null;
let hmCorridaComponent = null;
let hmCorridaLifecycle = null;
let hmPrimeiroFix = true;
let hmCrResetHandler = null;
let hmActiveRideLayer = null;
let hmDriverMarker = null;
let hmDriverTickInterval = null;
const HM_FALLBACK_CENTER = [-14.235, -51.925];
let hmMapState = {
    center: HM_FALLBACK_CENTER,
    zoom: 13
};

function carregarCentroInicialAtual() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                hmMapState.center = [latitude, longitude];
                resolve();
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
}

function interpolarNoCaminho(coords, t) {
    if (!coords.length) return null;
    if (coords.length === 1) return coords[0];
    const clamp = Math.max(0, Math.min(1, t));
    let totalLen = 0;
    const lens = [];
    for (let i = 0; i < coords.length - 1; i++) {
        const d = Math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1]);
        lens.push(d);
        totalLen += d;
    }
    if (totalLen === 0) return coords[0];
    const alvo = clamp * totalLen;
    let acc = 0;
    for (let i = 0; i < lens.length; i++) {
        if (acc + lens[i] >= alvo) {
            const s = lens[i] === 0 ? 0 : (alvo - acc) / lens[i];
            return [
                coords[i][0] + s * (coords[i + 1][0] - coords[i][0]),
                coords[i][1] + s * (coords[i + 1][1] - coords[i][1]),
            ];
        }
        acc += lens[i];
    }
    return coords[coords.length - 1];
}

function obterCoordsRotaAtiva(ride) {
    const coords = [];
    if (!ride?.segments) return coords;
    ride.segments.forEach((seg, idx) => {
        if (!seg.geometry?.coordinates) return;
        const latLngs = seg.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        if (idx === 0) coords.push(...latLngs);
        else coords.push(...latLngs.slice(1));
    });
    return coords;
}

function posicaoMotorista(ride) {
    const now = Date.now();
    const ref = ride.scheduledAt
        ? new Date(ride.scheduledAt).getTime()
        : new Date(ride.createdAt).getTime();
    const elapsed = Math.max(0, now - ref);
    const T_SEARCH_END  = 12000;
    const T_ONWAY_END   = 30000;
    const T_BOARD_END   = 42000;
    const T_DONE        = 70000;
    const coords = obterCoordsRotaAtiva(ride);
    if (!coords.length) return null;
    const origem  = coords[0];
    const destino = coords[coords.length - 1];
    if (elapsed < T_SEARCH_END) return null;
    if (elapsed < T_ONWAY_END) {
        const t = (elapsed - T_SEARCH_END) / 18000;
        const sLat = origem[0] + 0.015;
        const sLng = origem[1] - 0.010;
        return [sLat + t * (origem[0] - sLat), sLng + t * (origem[1] - sLng)];
    }
    if (elapsed < T_BOARD_END) return origem;
    if (elapsed < T_DONE) return interpolarNoCaminho(coords, (elapsed - T_BOARD_END) / 28000);
    return destino;
}

function iconeMotorista() {
    return L.divIcon({
        html: `<div style="width:34px;height:34px;border-radius:50%;background:#f59e0b;color:#fff;border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 5px rgba(245,158,11,0.25),0 2px 10px rgba(0,0,0,0.28);font-size:14px;"><i class="fa-solid fa-car"></i></div>`,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -20],
    });
}

function iniciarMapaCorridaAtiva(ride) {
    if (!hmMap || !window.L) return;
    hmActiveRideLayer = L.layerGroup().addTo(hmMap);
    const allLatLngs = [];
    (ride.segments || []).forEach((seg, idx) => {
        if (!seg.geometry?.coordinates) return;
        const coords = seg.geometry.coordinates;
        const latLngs = coords.map(([lng, lat]) => [lat, lng]);
        L.polyline(latLngs, seg.style || { color: '#3b82f6', weight: 5, opacity: 0.85 }).addTo(hmActiveRideLayer);
        const origemCoord = [coords[0][1], coords[0][0]];
        const destCoord   = [coords[coords.length - 1][1], coords[coords.length - 1][0]];
        if (idx === 0) {
            const ico = L.divIcon({
                html: `<div class="cr-map-marker" style="background:#10b981"><i class="fa-solid fa-circle-play"></i></div>`,
                className: 'cr-map-marker-wrap', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -18],
            });
            L.marker(origemCoord, { icon: ico }).addTo(hmActiveRideLayer).bindPopup(`<b>Origem:</b> ${seg.origem}`);
            allLatLngs.push(origemCoord);
        }
        const isLast = idx === (ride.segments.length - 1);
        const icoD = L.divIcon({
            html: `<div class="cr-map-marker" style="background:${isLast ? '#e63946' : '#f59e0b'}"><i class="fa-solid ${isLast ? 'fa-flag-checkered' : 'fa-circle-dot'}"></i></div>`,
            className: 'cr-map-marker-wrap', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -18],
        });
        L.marker(destCoord, { icon: icoD }).addTo(hmActiveRideLayer).bindPopup(`<b>${isLast ? 'Destino' : 'Parada'}:</b> ${seg.destino}`);
        allLatLngs.push(destCoord);
    });
    if (allLatLngs.length) {
        const bounds = L.latLngBounds(allLatLngs);
        if (bounds.isValid()) hmMap.fitBounds(bounds, { padding: [60, 80] });
    }
    const driverPos = posicaoMotorista(ride);
    if (driverPos) {
        hmDriverMarker = L.marker(driverPos, { icon: iconeMotorista() })
            .addTo(hmMap)
            .bindPopup(`<b>${ride.driver?.name || 'Motorista'}</b><br>${ride.driver?.vehicleBrand || ''}`);
    }
    hmDriverTickInterval = setInterval(() => {
        const pos = posicaoMotorista(ride);
        if (!pos) return;
        if (!hmDriverMarker) {
            hmDriverMarker = L.marker(pos, { icon: iconeMotorista() })
                .addTo(hmMap)
                .bindPopup(`<b>${ride.driver?.name || 'Motorista'}</b><br>${ride.driver?.vehicleBrand || ''}`);
        } else {
            hmDriverMarker.setLatLng(pos);
        }
    }, 1000);
}

function html(rotaAtual = '/') {
    const corridaAtiva = getActiveRide();

    if (corridaAtiva) {
        hmCorridaComponent = null;
        return `
            ${Header('Home', rotaAtual)}
            <main class="home-main">
                <div class="home-map-wrapper">
                    <div id="home-map" class="home-map"></div>
                    <div id="loader-overlay" class="loader-overlay">
                        <div id="loader-spinner" class="loader-spinner"></div>
                    </div>
                    <div class="home-corrida-ativa-banner">
                        <div class="home-corrida-ativa-info">
                            <i class="fa-solid fa-car-side"></i>
                            <span>Corrida em andamento</span>
                        </div>
                        <a href="#/corrida-ativa" class="home-corrida-ativa-btn">
                            Ver detalhes <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </main>
        `;
    }

    hmCorridaComponent = ChamarCorrida();
    return `
        ${Header("Home", rotaAtual)}
        <main class="home-main">
            <div class="home-map-wrapper">
                <div id="home-map" class="home-map"></div>
                <div id="loader-overlay" class="loader-overlay">
                    <div id="loader-spinner" class="loader-spinner"></div>
                </div>
                ${hmCorridaComponent.html}
            </div>
        </main>
    `;
}

function setMapLoader(visible) {
    if (!hmMapLoaderEl) return;
    hmMapLoaderEl.style.opacity = visible ? '1' : '0';
    hmMapLoaderEl.style.pointerEvents = visible ? 'all' : 'none';
}

async function init() {
    const mapEl = document.getElementById('home-map');
    hmMapLoaderEl = document.getElementById('loader-overlay');
    if (!mapEl || !window.L || hmMap) return;

    await carregarCentroInicialAtual();
    if (hmMap) return;

    hmMap = L.map('home-map').setView(hmMapState.center, hmMapState.zoom);

    const hmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    setMapLoader(true);
    hmTileLayer.on('loading', () => setMapLoader(true));
    hmTileLayer.on('load', () => {
        setMapLoader(false);
        document.dispatchEvent(new CustomEvent('app:ready'));
    });
    hmTileLayer.addTo(hmMap);

    // Fallback: garante que o splash some mesmo se os tiles demorarem
    setTimeout(() => document.dispatchEvent(new CustomEvent('app:ready')), 5000);

    const corridaAtiva = getActiveRide();
    if (corridaAtiva) {
        iniciarMapaCorridaAtiva(corridaAtiva);
    } else {
        hmCorridaLifecycle = hmCorridaComponent?.init?.(hmMap) || null;

        hmCrResetHandler = () => {
            hmPrimeiroFix = true;
            if (hmMap) {
                const pos = hmMarker ? hmMarker.getLatLng() : null;
                const center = pos ? [pos.lat, pos.lng] : hmMapState.center;
                hmMap.setView(center, hmMap.getZoom(), { animate: true });
            }
        };
        document.addEventListener('cr:reset', hmCrResetHandler);
    }

    hmMap.on('moveend zoomend', () => {
        const center = hmMap.getCenter();
        hmMapState = {
            center: [center.lat, center.lng],
            zoom: hmMap.getZoom()
        };
    });

    if (navigator.geolocation) {
        hmGeoWatchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                hmMapState.center = [latitude, longitude];

                const userLatLng = [latitude, longitude];

                if (!hmMarker) {
                    const userIcon = L.divIcon({
                        html: `<div style="
                            width:28px;height:28px;
                            border-radius:50%;
                            background:#3b82f6;
                            color:#fff;
                            border:2px solid #fff;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            box-shadow:0 0 0 5px rgba(59,130,246,0.30),0 2px 8px rgba(0,0,0,0.25);
                            font-size:12px;
                        "><i class="fa-solid fa-location-crosshairs"></i></div>`,
                        className: '',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14],
                        popupAnchor: [0, -16],
                    });
                    hmMarker = L.marker(userLatLng, { icon: userIcon })
                        .addTo(hmMap)
                        .bindPopup('<b>Você está aqui</b>');
                } else {
                    hmMarker.setLatLng(userLatLng);
                }

                const rotaAtiva = (hmCorridaLifecycle?.isRotaAtiva?.() ?? false) || !!getActiveRide();
                if (hmMap && (hmPrimeiroFix || !rotaAtiva)) {
                    hmMap.setView(userLatLng, hmMap.getZoom(), { animate: true });
                }
                hmPrimeiroFix = false;
            },
            () => {
            }
        );
    }
}

export default function Home(rotaAtual = '/') {
    return {
        html: html(rotaAtual),
        init,
        destroy() {
            if (hmDriverTickInterval !== null) {
                clearInterval(hmDriverTickInterval);
                hmDriverTickInterval = null;
            }

            if (hmMap) {
                const center = hmMap.getCenter();
                hmMapState = {
                    center: [center.lat, center.lng],
                    zoom: hmMap.getZoom()
                };
                hmMap.remove();
                hmMap = null;
                hmMarker = null;
                hmMapLoaderEl = null;
                hmActiveRideLayer = null;
                hmDriverMarker = null;
            }

            if (hmCorridaLifecycle?.destroy) {
                hmCorridaLifecycle.destroy();
            }

            hmCorridaLifecycle = null;
            hmCorridaComponent = null;
            hmPrimeiroFix = true;

            if (hmCrResetHandler) {
                document.removeEventListener('cr:reset', hmCrResetHandler);
                hmCrResetHandler = null;
            }

            if (hmGeoWatchId !== null) {
                navigator.geolocation.clearWatch(hmGeoWatchId);
                hmGeoWatchId = null;
            }
        }
    };
}