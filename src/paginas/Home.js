import Header from '../componentes/Header.js';
import ChamarCorrida from '../componentes/ChamarCorrida.js';

let hmMap = null;
let hmMarker = null;
let hmGeoWatchId = null;
let hmMapLoaderEl = null;
let hmCorridaComponent = null;
let hmCorridaLifecycle = null;
const HM_FALLBACK_CENTER = [-14.235, -51.925];
let hmMapState = {
    center: HM_FALLBACK_CENTER,
    zoom: 4
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
        <style>
            @keyframes loader-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .loader-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.75);
                backdrop-filter: blur(1px);
                z-index: 500;
                transition: opacity 0.2s ease;
            }

            .loader-spinner {
                width: 44px;
                height: 44px;
                border: 4px solid rgba(15, 52, 96, 0.2);
                border-top-color: #0f3460;
                border-radius: 50%;
                animation: loader-spin 1s linear infinite;
            }
        </style>
        <main>
            <div style="
                position: relative;
                width: 100%;
                max-width: 900px;
                height: 92vh;
                overflow: hidden;
                box-shadow: 0 4px 24px rgba(0,0,0,0.18);
            ">
                <div id="home-map" style="width: 100%; height: 100vh;"></div>
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
    hmTileLayer.on('load', () => setMapLoader(false));
    hmTileLayer.addTo(hmMap);

    hmCorridaLifecycle = hmCorridaComponent?.init?.(hmMap) || null;

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

                if (!hmMarker) {
                    hmMarker = L.marker([latitude, longitude])
                        .addTo(hmMap)
                        .bindPopup('<b>Você está aqui</b>');
                } else {
                    hmMarker.setLatLng([latitude, longitude]);
                }

                if (hmMap) {
                    hmMap.setView([latitude, longitude], hmMap.getZoom(), { animate: true });
                }
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

            if (hmGeoWatchId !== null) {
                navigator.geolocation.clearWatch(hmGeoWatchId);
                hmGeoWatchId = null;
            }
        }
    };
}