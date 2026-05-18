import HeaderMotorista from '../componentes/HeaderMotorista.js';
import {
    obterCorridaDriverAtiva,
    salvarCorridaDriverAtiva,
    limparCorridaDriverAtiva,
    salvarCorridaDriverNoHistorico,
    salvarCorridaDriverPendenteReview,
} from '../dados/corridaDriverStorage.js';
import './CorridaAtivaMotorista.css';

const CENTRO_PADRAO = [-8.839, 13.289];

let camMapa = null;
let camIdGeo = null;
let camMarcadorDriver = null;
let camCamada = null;
let camTimer = null;
let camSegundos = 0;
let camHandlers = [];
let camModalEl = null;

const CANCEL_MOTIVOS = [
    'Passageiro não apareceu',
    'Passageiro pediu para cancelar',
    'Problema com o veículo',
    'Emergência pessoal',
    'Endereço inacessível',
    'Outro motivo',
];

function criarIconeDriver() {
    return L.divIcon({
        html: `<div style="background:#3fb950;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 0 0 6px rgba(63,185,80,.2),0 2px 8px rgba(0,0,0,.4);border:2px solid rgba(255,255,255,.25);"><i class="fa-solid fa-car"></i></div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
}

function criarIconePonto(tipo) {
    const estilos = {
        pickup:  { cor: '#10b981', icone: 'fa-circle-play' },
        destino: { cor: '#e63946', icone: 'fa-flag-checkered' },
    };
    const { cor, icone } = estilos[tipo];
    return L.divIcon({
        html: `<div style="background:${cor};color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:0.85rem;box-shadow:0 2px 8px rgba(0,0,0,.4);"><i class="fa-solid ${icone}"></i></div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
}

function formatarTempo(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
}

function abrirModalCancelamento(onConfirm) {
    if (camModalEl) return;
    const motivosHtml = CANCEL_MOTIVOS.map((m, i) => `
        <div class="cam-motivo" data-idx="${i}" role="radio" aria-checked="false" tabindex="0">
            <span class="cam-motivo-radio"></span>
            <span>${m}</span>
        </div>`).join('');

    const el = document.createElement('div');
    el.className = 'cam-modal-overlay';
    el.innerHTML = `
        <div class="cam-modal" role="dialog" aria-modal="true" aria-label="Cancelar corrida">
            <div class="cam-modal-icon"><i class="fa-solid fa-ban"></i></div>
            <h2 class="cam-modal-title">Cancelar corrida?</h2>
            <p class="cam-modal-sub">Selecione o motivo do cancelamento.</p>
            <div class="cam-motivos" id="cam-motivos">${motivosHtml}</div>
            <textarea class="cam-outro-textarea" id="cam-outro-texto" placeholder="Descreva o motivo..." maxlength="200" style="display:none;"></textarea>
            <div class="cam-modal-actions">
                <button class="cam-btn-voltar" id="cam-modal-voltar">Voltar</button>
                <button class="cam-btn-confirmar" id="cam-modal-confirmar" disabled>
                    <i class="fa-solid fa-ban"></i> Confirmar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(el);
    camModalEl = el;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('visible')));

    let selecionado = null;
    const OUTRO_IDX = CANCEL_MOTIVOS.length - 1;

    function fechar() {
        el.classList.remove('visible');
        el.addEventListener('transitionend', () => { el.remove(); camModalEl = null; }, { once: true });
    }

    function validar() {
        const btn = document.getElementById('cam-modal-confirmar');
        if (!btn) return;
        const outroOk = selecionado !== OUTRO_IDX || (document.getElementById('cam-outro-texto')?.value?.trim().length > 0);
        btn.disabled = selecionado === null || !outroOk;
    }

    el.querySelector('#cam-motivos').addEventListener('click', (e) => {
        const item = e.target.closest('.cam-motivo');
        if (!item) return;
        selecionado = parseInt(item.dataset.idx, 10);
        el.querySelectorAll('.cam-motivo').forEach(m => {
            const sel = parseInt(m.dataset.idx, 10) === selecionado;
            m.classList.toggle('selected', sel);
            m.setAttribute('aria-checked', sel ? 'true' : 'false');
        });
        const outroWrap = document.getElementById('cam-outro-texto');
        if (outroWrap) outroWrap.style.display = selecionado === OUTRO_IDX ? 'block' : 'none';
        validar();
    });

    document.getElementById('cam-outro-texto')?.addEventListener('input', validar);
    document.getElementById('cam-modal-voltar')?.addEventListener('click', fechar);
    document.getElementById('cam-modal-confirmar')?.addEventListener('click', () => {
        const motivo = selecionado === OUTRO_IDX
            ? (document.getElementById('cam-outro-texto')?.value?.trim() || CANCEL_MOTIVOS[OUTRO_IDX])
            : CANCEL_MOTIVOS[selecionado];
        fechar();
        onConfirm(motivo);
    });
}

export default function CorridaAtivaMotorista(rotaAtual = '/motorista/corrida-ativa') {
    const corrida = obterCorridaDriverAtiva();

    if (!corrida) {
        return `
            ${HeaderMotorista(rotaAtual)}
            <main class="cam-shell">
                <div class="cam-container">
                    <div class="cam-empty">
                        <div class="cam-empty-icon"><i class="fa-solid fa-route"></i></div>
                        <h1>Sem corrida ativa</h1>
                        <p>Não há nenhuma corrida em andamento.</p>
                        <a href="#/motorista" class="cam-btn-voltar-home"><i class="fa-solid fa-house"></i> Voltar ao início</a>
                    </div>
                </div>
            </main>
        `;
    }

    const fase = corrida.status === 'in_progress' ? 'viagem' : 'embarque';
    const destLbl = fase === 'embarque' ? corrida.pickup : corrida.destination;
    const faseLabel = fase === 'embarque' ? 'A caminho do passageiro' : 'Em viagem';
    const faseSublabel = fase === 'embarque' ? `Embarque: ${corrida.pickup}` : `Destino: ${corrida.destination}`;
    const btnPrincipalLabel = fase === 'embarque' ? 'Passageiro a bordo' : 'Concluir corrida';
    const btnPrincipalIcon = fase === 'embarque' ? 'fa-user-check' : 'fa-flag-checkered';

    const html = `
        ${HeaderMotorista(rotaAtual)}
        <main class="cam-shell">
            <div id="cam-map"></div>

            <div class="cam-bottom-card">
                <!-- Fase indicator -->
                <div class="cam-fase-row">
                    <div class="cam-fase-dot ${fase}"></div>
                    <div class="cam-fase-info">
                        <span class="cam-fase-label">${faseLabel}</span>
                        <span class="cam-fase-sub">${faseSublabel}</span>
                    </div>
                    <div class="cam-timer" id="cam-timer">00:00</div>
                </div>

                <!-- Passageiro -->
                <div class="cam-passenger-row">
                    <div class="cam-passenger-avatar">${corrida.passenger?.initials ?? '?'}</div>
                    <div class="cam-passenger-info">
                        <span class="cam-passenger-name">${corrida.passenger?.name ?? 'Passageiro'}</span>
                        <span class="cam-passenger-route">${corrida.pickup} → ${corrida.destination}</span>
                    </div>
                    <div class="cam-ride-price">${corrida.estimatedPrice ?? ''}</div>
                </div>

                <!-- Meta -->
                <div class="cam-meta-row">
                    ${corrida.estimatedDistance ? `<span><i class="fa-solid fa-location-dot"></i>${corrida.estimatedDistance}</span>` : ''}
                    ${corrida.estimatedDuration ? `<span><i class="fa-solid fa-clock"></i>${corrida.estimatedDuration}</span>` : ''}
                </div>

                <!-- Botões -->
                <div class="cam-actions">
                    <button class="cam-btn-cancelar" id="cam-btn-cancelar">
                        <i class="fa-solid fa-ban"></i> Cancelar
                    </button>
                    <button class="cam-btn-principal" id="cam-btn-principal">
                        <i class="fa-solid ${btnPrincipalIcon}"></i> ${btnPrincipalLabel}
                    </button>
                </div>
            </div>
        </main>
    `;

    function init() {
        // Mapa
        camMapa = L.map('cam-map', { zoomControl: false, attributionControl: false }).setView(CENTRO_PADRAO, 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(camMapa);

        camCamada = L.layerGroup().addTo(camMapa);

        // Posicionar marcadores simulados
        const driverPos = CENTRO_PADRAO;
        const pickupPos = [CENTRO_PADRAO[0] + 0.012, CENTRO_PADRAO[1] - 0.015];
        const destPos   = [CENTRO_PADRAO[0] - 0.018, CENTRO_PADRAO[1] + 0.022];

        camMarcadorDriver = L.marker(driverPos, { icon: criarIconeDriver() }).addTo(camCamada);
        L.marker(pickupPos, { icon: criarIconePonto('pickup') }).addTo(camCamada);
        L.marker(destPos,   { icon: criarIconePonto('destino') }).addTo(camCamada);

        const rotaCoords = fase === 'embarque'
            ? [driverPos, pickupPos]
            : [driverPos, destPos];

        L.polyline(rotaCoords, { color: '#3fb950', weight: 5, opacity: 0.8, dashArray: fase === 'embarque' ? '10,8' : null }).addTo(camCamada);
        const bounds = L.latLngBounds(rotaCoords);
        if (bounds.isValid()) camMapa.fitBounds(bounds, { padding: [80, 80] });

        // Geolocalização
        if (navigator.geolocation) {
            camIdGeo = navigator.geolocation.watchPosition(
                (pos) => {
                    const ll = [pos.coords.latitude, pos.coords.longitude];
                    camMarcadorDriver?.setLatLng(ll);
                },
                () => {},
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }

        // Timer
        camSegundos = 0;
        camTimer = setInterval(() => {
            camSegundos++;
            const el = document.getElementById('cam-timer');
            if (el) el.textContent = formatarTempo(camSegundos);
        }, 1000);

        // Botão principal
        const btnPrincipal = document.getElementById('cam-btn-principal');
        const hPrincipal = () => {
            if (corrida.status === 'pending_pickup') {
                // Avançar para fase de viagem
                corrida.status = 'in_progress';
                salvarCorridaDriverAtiva(corrida);
                // Forçar re-render mesmo que o hash já seja /motorista/corrida-ativa
                if (window.location.hash === '#/motorista/corrida-ativa') {
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                } else {
                    window.location.hash = '#/motorista/corrida-ativa';
                }
            } else {
                // Concluir corrida
                const corridaConcluida = {
                    ...corrida,
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    duration: formatarTempo(camSegundos),
                    earningsRaw: parseFloat((corrida.estimatedPrice ?? 'Kz 0').replace(/[^\d,]/g, '').replace(',', '.')) || 0,
                    earnings: corrida.estimatedPrice ?? 'Kz 0,00',
                };
                salvarCorridaDriverNoHistorico(corridaConcluida);
                salvarCorridaDriverPendenteReview(corridaConcluida);
                limparCorridaDriverAtiva();
                window.location.hash = '#/motorista/avaliacao-passageiro';
            }
        };
        btnPrincipal?.addEventListener('click', hPrincipal);
        camHandlers.push([btnPrincipal, 'click', hPrincipal]);

        // Botão cancelar
        const btnCancelar = document.getElementById('cam-btn-cancelar');
        const hCancelar = () => {
            abrirModalCancelamento((motivo) => {
                const corridaCancelada = {
                    ...corrida,
                    status: 'cancelled',
                    cancelReason: motivo,
                    completedAt: new Date().toISOString(),
                    earnings: 'Kz 0,00',
                    earningsRaw: 0,
                };
                salvarCorridaDriverNoHistorico(corridaCancelada);
                limparCorridaDriverAtiva();
                window.location.hash = '#/motorista';
            });
        };
        btnCancelar?.addEventListener('click', hCancelar);
        camHandlers.push([btnCancelar, 'click', hCancelar]);
    }

    function destroy() {
        if (camIdGeo) navigator.geolocation.clearWatch(camIdGeo);
        if (camTimer) clearInterval(camTimer);
        if (camMapa) { camMapa.remove(); camMapa = null; }
        camHandlers.forEach(([el, ev, fn]) => el?.removeEventListener(ev, fn));
        camHandlers = [];
        camMarcadorDriver = null;
        camCamada = null;
        camModalEl = null;
    }

    return { html, init, destroy };
}
