import Header from '../componentes/Header.js';
import ChamarCorrida from '../componentes/ChamarCorrida.js';
import './Home.css';

let hmMap = null;
let hmMarker = null;
let hmGeoWatchId = null;
let hmMapLoaderEl = null;
let hmCorridaComponent = null;
let hmCorridaLifecycle = null;
let hmPrimeiroFix = true;
let hmCrResetHandler = null;
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

function html(rotaAtual = '/') {
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

                const rotaAtiva = hmCorridaLifecycle?.isRotaAtiva?.() ?? false;
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