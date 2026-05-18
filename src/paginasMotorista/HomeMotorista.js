import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { obterCorridaDriverAtiva, salvarCorridaDriverAtiva } from '../dados/corridaDriverStorage.js';
import './HomeMotorista.css';

const CENTRO_PADRAO = [-8.839, 13.289]; // Luanda

let hdMapa = null;
let hdMarcador = null;
let hdIdGeo = null;
let hdOnline = false;
let hdTimeoutPedido = null;
let hdTimerPedido = null;
let hdHandlerToggle = null;
let hdHandlerAceitar = null;
let hdHandlerRejeitar = null;

const PEDIDOS_SIMULADOS = [
    {
        passenger: { name: 'Ana Ferreira', initials: 'AF', rating: 4.8, phone: '+244 923 456 789' },
        pickup: 'Rocha Pinto, Luanda',
        destination: 'Talatona, Luanda',
        distance: '9,2 km',
        duration: '22 min',
        price: 'Kz 950,00',
        distPickup: '1,2 km',
    },
    {
        passenger: { name: 'Carlos Mendes', initials: 'CM', rating: 4.5, phone: '+244 912 345 678' },
        pickup: 'Viana, Luanda',
        destination: 'Aeroporto 4 de Fevereiro',
        distance: '18,7 km',
        duration: '34 min',
        price: 'Kz 1.850,00',
        distPickup: '2,4 km',
    },
    {
        passenger: { name: 'Sofia Nunes', initials: 'SN', rating: 5.0, phone: '+244 934 567 890' },
        pickup: 'Sambizanga',
        destination: 'Ingombota',
        distance: '5,8 km',
        duration: '15 min',
        price: 'Kz 620,00',
        distPickup: '0,8 km',
    },
    {
        passenger: { name: 'Pedro Lopes', initials: 'PL', rating: 4.3, phone: '+244 945 678 901' },
        pickup: 'Rangel, Luanda',
        destination: 'Miramar',
        distance: '6,3 km',
        duration: '18 min',
        price: 'Kz 680,00',
        distPickup: '1,5 km',
    },
];

function obterPedidoAleatorio() {
    return { ...PEDIDOS_SIMULADOS[Math.floor(Math.random() * PEDIDOS_SIMULADOS.length)], id: `REQ-${Date.now()}` };
}

function criarIconeVeiculo() {
    const html = `<div style="background:#3fb950;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 0 0 6px rgba(63,185,80,.2),0 2px 8px rgba(0,0,0,.4);border:2px solid rgba(255,255,255,.25);"><i class="fa-solid fa-car"></i></div>`;
    return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
}

export default function HomeMotorista(rotaAtual = '/motorista') {
    const corridaExistente = obterCorridaDriverAtiva();

    const html = `
        ${HeaderMotorista(rotaAtual)}
        <main class="hmd-shell">
            <div id="hmd-map"></div>

            ${corridaExistente ? `
            <div class="hmd-banner-ativa">
                <div class="hmd-banner-info">
                    <i class="fa-solid fa-route"></i>
                    <span>Corrida em andamento</span>
                </div>
                <a href="#/motorista/corrida-ativa" class="hmd-banner-btn">Ver corrida</a>
            </div>` : ''}

            <div class="hmd-bottom-panel">
                <div class="hmd-status-row">
                    <div class="hmd-status-info">
                        <span class="hmd-status-dot" id="hmd-status-dot"></span>
                        <span class="hmd-status-label" id="hmd-status-label">Offline</span>
                    </div>
                    <button class="hmd-toggle-btn" id="hmd-toggle-btn" aria-label="Alternar online/offline">
                        <span class="hmd-toggle-track">
                            <span class="hmd-toggle-thumb"></span>
                        </span>
                        <span class="hmd-toggle-text" id="hmd-toggle-text">Ficar online</span>
                    </button>
                </div>

                <div class="hmd-waiting" id="hmd-waiting" style="display:none;">
                    <div class="hmd-waiting-icon"><i class="fa-solid fa-satellite-dish"></i></div>
                    <div class="hmd-waiting-info">
                        <p class="hmd-waiting-title">A aguardar pedidos</p>
                        <div class="hmd-waiting-dots"><span></span><span></span><span></span></div>
                    </div>
                </div>

                <div class="hmd-offline-msg" id="hmd-offline-msg">
                    <i class="fa-solid fa-moon"></i>
                    <p>Ative o modo <strong>online</strong> para começar a receber pedidos de corrida.</p>
                </div>
            </div>

            <!-- Overlay de pedido -->
            <div class="hmd-request-overlay" id="hmd-request-overlay" style="display:none;" role="dialog" aria-modal="true" aria-label="Novo pedido de corrida">
                <div class="hmd-request-card" id="hmd-request-card">
                    <div class="hmd-req-pulse"></div>
                    <div class="hmd-req-label">Novo pedido de corrida</div>

                    <div class="hmd-req-header">
                        <div class="hmd-req-avatar" id="hmd-req-avatar"></div>
                        <div class="hmd-req-passenger-info">
                            <span class="hmd-req-name" id="hmd-req-name"></span>
                            <span class="hmd-req-rating">
                                <i class="fa-solid fa-star"></i>
                                <span id="hmd-req-rating"></span>
                            </span>
                        </div>
                        <div class="hmd-req-price" id="hmd-req-price"></div>
                    </div>

                    <a class="hmd-req-phone" id="hmd-req-phone" href="tel:">
                        <i class="fa-solid fa-phone"></i>
                        <span id="hmd-req-phone-num"></span>
                        <span class="hmd-req-phone-call-btn" title="Ligar">
                            <i class="fa-solid fa-phone-volume"></i>
                        </span>
                    </a>

                    <div class="hmd-req-route">
                        <div class="hmd-req-stop">
                            <span class="hmd-req-dot pickup"></span>
                            <div>
                                <span class="hmd-req-stop-label">Embarque</span>
                                <span class="hmd-req-stop-addr" id="hmd-req-pickup"></span>
                            </div>
                        </div>
                        <div class="hmd-req-connector"></div>
                        <div class="hmd-req-stop">
                            <span class="hmd-req-dot dest"></span>
                            <div>
                                <span class="hmd-req-stop-label">Destino</span>
                                <span class="hmd-req-stop-addr" id="hmd-req-dest"></span>
                            </div>
                        </div>
                    </div>

                    <div class="hmd-req-meta">
                        <span><i class="fa-solid fa-location-dot"></i><span id="hmd-req-dist"></span></span>
                        <span><i class="fa-solid fa-clock"></i><span id="hmd-req-dur"></span></span>
                        <span><i class="fa-solid fa-car-side"></i><span id="hmd-req-dist-pickup"></span> até si</span>
                    </div>

                    <div class="hmd-req-timer-bar-wrap">
                        <div class="hmd-req-timer-bar" id="hmd-req-timer-bar"></div>
                    </div>

                    <div class="hmd-req-actions">
                        <button class="hmd-req-btn-rejeitar" id="hmd-req-rejeitar">
                            <i class="fa-solid fa-xmark"></i> Rejeitar
                        </button>
                        <button class="hmd-req-btn-aceitar" id="hmd-req-aceitar">
                            <i class="fa-solid fa-check"></i> Aceitar
                        </button>
                    </div>
                </div>
            </div>
        </main>
    `;

    function init() {
        hdMapa = L.map('hmd-map', { zoomControl: false, attributionControl: false }).setView(CENTRO_PADRAO, 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(hdMapa);

        if (navigator.geolocation) {
            hdIdGeo = navigator.geolocation.watchPosition(
                (pos) => {
                    const latlng = [pos.coords.latitude, pos.coords.longitude];
                    if (!hdMarcador) {
                        hdMarcador = L.marker(latlng, { icon: criarIconeVeiculo() }).addTo(hdMapa);
                        hdMapa.setView(latlng, 15);
                    } else {
                        hdMarcador.setLatLng(latlng);
                    }
                },
                () => {
                    if (!hdMarcador) {
                        hdMarcador = L.marker(CENTRO_PADRAO, { icon: criarIconeVeiculo() }).addTo(hdMapa);
                    }
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            hdMarcador = L.marker(CENTRO_PADRAO, { icon: criarIconeVeiculo() }).addTo(hdMapa);
        }

        const toggleBtn = document.getElementById('hmd-toggle-btn');
        hdHandlerToggle = () => {
            hdOnline = !hdOnline;
            atualizarStatusUI();
            if (hdOnline) {
                agendarPedido();
            } else {
                if (hdTimeoutPedido) clearTimeout(hdTimeoutPedido);
                if (hdTimerPedido) clearTimeout(hdTimerPedido);
                ocultarPedido();
            }
        };
        toggleBtn?.addEventListener('click', hdHandlerToggle);
    }

    function atualizarStatusUI() {
        const dot       = document.getElementById('hmd-status-dot');
        const label     = document.getElementById('hmd-status-label');
        const waiting   = document.getElementById('hmd-waiting');
        const offlineMsg = document.getElementById('hmd-offline-msg');
        const toggle    = document.getElementById('hmd-toggle-btn');
        const toggleText = document.getElementById('hmd-toggle-text');

        if (hdOnline) {
            dot?.classList.add('online');
            if (label) label.textContent = 'Online';
            if (waiting) waiting.style.display = 'flex';
            if (offlineMsg) offlineMsg.style.display = 'none';
            toggle?.classList.add('is-on');
            if (toggleText) toggleText.textContent = 'Ficar offline';
        } else {
            dot?.classList.remove('online');
            if (label) label.textContent = 'Offline';
            if (waiting) waiting.style.display = 'none';
            if (offlineMsg) offlineMsg.style.display = 'flex';
            toggle?.classList.remove('is-on');
            if (toggleText) toggleText.textContent = 'Ficar online';
        }
    }

    function agendarPedido() {
        const delay = 6000 + Math.random() * 6000;
        hdTimeoutPedido = setTimeout(() => {
            if (hdOnline) mostrarPedido(obterPedidoAleatorio());
        }, delay);
    }

    function mostrarPedido(pedido) {
        const overlay = document.getElementById('hmd-request-overlay');
        if (!overlay) return;

        document.getElementById('hmd-req-avatar').textContent = pedido.passenger.initials;
        document.getElementById('hmd-req-name').textContent = pedido.passenger.name;
        document.getElementById('hmd-req-rating').textContent = pedido.passenger.rating;
        document.getElementById('hmd-req-price').textContent = pedido.price;
        const phoneEl = document.getElementById('hmd-req-phone');
        const phoneNumEl = document.getElementById('hmd-req-phone-num');
        if (phoneEl && phoneNumEl) {
            phoneNumEl.textContent = pedido.passenger.phone ?? '';
            phoneEl.href = `tel:${(pedido.passenger.phone ?? '').replace(/\s/g, '')}`;
        }
        document.getElementById('hmd-req-pickup').textContent = pedido.pickup;
        document.getElementById('hmd-req-dest').textContent = pedido.destination;
        document.getElementById('hmd-req-dist').textContent = pedido.distance;
        document.getElementById('hmd-req-dur').textContent = pedido.duration;
        document.getElementById('hmd-req-dist-pickup').textContent = pedido.distPickup;

        overlay.style.display = 'flex';
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('visible')));

        const timerBar = document.getElementById('hmd-req-timer-bar');
        if (timerBar) {
            timerBar.style.transition = 'none';
            timerBar.style.width = '100%';
            requestAnimationFrame(() => requestAnimationFrame(() => {
                timerBar.style.transition = 'width 20s linear';
                timerBar.style.width = '0%';
            }));
        }

        hdTimerPedido = setTimeout(() => {
            ocultarPedido();
            if (hdOnline) agendarPedido();
        }, 20000);

        const btnAceitar = document.getElementById('hmd-req-aceitar');
        hdHandlerAceitar = () => {
            clearTimeout(hdTimerPedido);
            const corrida = {
                id: pedido.id,
                createdAt: new Date().toISOString(),
                status: 'pending_pickup',
                passenger: pedido.passenger,
                pickup: pedido.pickup,
                destination: pedido.destination,
                estimatedDistance: pedido.distance,
                estimatedPrice: pedido.price,
                estimatedDuration: pedido.duration,
            };
            salvarCorridaDriverAtiva(corrida);
            ocultarPedido();
            window.location.hash = '#/motorista/corrida-ativa';
        };
        btnAceitar?.addEventListener('click', hdHandlerAceitar);

        const btnRejeitar = document.getElementById('hmd-req-rejeitar');
        hdHandlerRejeitar = () => {
            clearTimeout(hdTimerPedido);
            ocultarPedido();
            if (hdOnline) agendarPedido();
        };
        btnRejeitar?.addEventListener('click', hdHandlerRejeitar);
    }

    function ocultarPedido() {
        const overlay = document.getElementById('hmd-request-overlay');
        if (!overlay) return;
        overlay.classList.remove('visible');
        setTimeout(() => { if (overlay) overlay.style.display = 'none'; }, 300);
        const btnAceitar = document.getElementById('hmd-req-aceitar');
        const btnRejeitar = document.getElementById('hmd-req-rejeitar');
        if (hdHandlerAceitar) { btnAceitar?.removeEventListener('click', hdHandlerAceitar); hdHandlerAceitar = null; }
        if (hdHandlerRejeitar) { btnRejeitar?.removeEventListener('click', hdHandlerRejeitar); hdHandlerRejeitar = null; }
    }

    function destroy() {
        if (hdIdGeo) navigator.geolocation.clearWatch(hdIdGeo);
        if (hdTimeoutPedido) clearTimeout(hdTimeoutPedido);
        if (hdTimerPedido) clearTimeout(hdTimerPedido);
        if (hdMapa) { hdMapa.remove(); hdMapa = null; }
        const toggleBtn = document.getElementById('hmd-toggle-btn');
        if (hdHandlerToggle) { toggleBtn?.removeEventListener('click', hdHandlerToggle); hdHandlerToggle = null; }
        hdOnline = false;
        hdMarcador = null;
        hdIdGeo = null;
    }

    return { html, init, destroy };
}
