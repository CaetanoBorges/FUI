import rotasEmGrafo from '../dados/rotasEmGrafo.js';
import { saveActiveRide, saveScheduledRide } from '../dados/corridaStorage.js';

// ── Ícones customizados para os marcadores do mapa ──────────────────────
function criarIcone(tipo) {
    const estilos = {
        origem:  { cor: '#10b981', icone: 'fa-circle-play' },
        parada:  { cor: '#f59e0b', icone: 'fa-circle-dot' },
        destino: { cor: '#e63946', icone: 'fa-flag-checkered' },
    };
    const { cor, icone } = estilos[tipo] || estilos.destino;
    const html = `<div class="cr-map-marker" style="background:${cor}"><i class="fa-solid ${icone}"></i></div>`;
    return L.divIcon({
        html,
        className: 'cr-map-marker-wrap',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -18],
    });
}

function haversineKm([lon1, lat1], [lon2, lat2]) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatarDuracaoHMS(totalSegundos) {
    const segundosNormalizados = Math.max(0, Math.round(totalSegundos));
    const horas = Math.floor(segundosNormalizados / 3600);
    const minutos = Math.floor((segundosNormalizados % 3600) / 60);
    const segundos = segundosNormalizados % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function calcularPreco(feature, veiculo, pessoas) {
    const trechos = Array.isArray(feature)
        ? feature.filter(Boolean)
        : [feature].filter(Boolean);

    if (!trechos.length) return null;

    let distancia = 0;

    trechos.forEach((trecho) => {
        const coords = trecho.geometry.coordinates;
        for (let i = 0; i < coords.length - 1; i++) {
            distancia += haversineKm(coords[i], coords[i + 1]);
        }
    });

    const taxaBase = veiculo === 'moto' ? 2.00 : 3.00;
    const taxaKm  = veiculo === 'moto' ? 1.80 : 2.50;
    const taxaPessoa = veiculo === 'carro' ? Math.max(0, (pessoas - 1)) * 1.00 : 0;
    const total = taxaBase + distancia * taxaKm + taxaPessoa;
    const velocidadeMediaKmH = veiculo === 'moto' ? 32 : 26;
    const tempoSegundos = (distancia / velocidadeMediaKmH) * 3600;

    return {
        total: total.toFixed(2),
        distancia: distancia.toFixed(1),
        tempo: formatarDuracaoHMS(tempoSegundos)
    };
}

const MOCK_DRIVERS = [
    { name: 'Carlos Mendes',    phone: '+244923456789', vehicleBrand: 'Toyota Corolla',    vehicleColor: 'Branco',  plate: 'LD-45-67-BC' },
    { name: 'Manuel da Silva',  phone: '+244912345678', vehicleBrand: 'Hyundai Accent',    vehicleColor: 'Preto',   plate: 'LD-12-34-AB' },
    { name: 'António Ferreira', phone: '+244934567890', vehicleBrand: 'Honda Civic',       vehicleColor: 'Cinzento',plate: 'BG-78-90-CD' },
    { name: 'João Baptista',    phone: '+244945678901', vehicleBrand: 'Volkswagen Polo',   vehicleColor: 'Prata',   plate: 'HU-23-45-EF' },
    { name: 'Pedro Domingos',   phone: '+244956789012', vehicleBrand: 'Nissan Tiida',      vehicleColor: 'Azul',    plate: 'LD-99-11-GH' },
    { name: 'Armando Lopes',    phone: '+244967890123', vehicleBrand: 'Kia Morning',       vehicleColor: 'Vermelho',plate: 'LU-56-78-IJ' },
    { name: 'Rui Costa',        phone: '+244978901234', vehicleBrand: 'Mitsubishi Lancer', vehicleColor: 'Branco',  plate: 'MA-34-56-KL' },
];

function pickDriver() {
    const d = MOCK_DRIVERS[Date.now() % MOCK_DRIVERS.length];
    return {
        name: d.name,
        phone: d.phone,
        vehicleBrand: d.vehicleBrand,
        vehicleColor: d.vehicleColor,
        plate: d.plate,
        initials: d.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    };
}

export default function ChamarCorrida() {
    let layer = null;

    function html() {
        return `
            <style>
                /* BOTTOM SHEET */
                .cr-sheet {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 600;
                    backdrop-filter: blur(9px);
                    -webkit-backdrop-filter: blur(22px);
                    border: 1px solid rgba(255, 255, 255, 0.55);
                    border-radius: 22px 22px 0 0;
                    padding: 10px;
                    width: 100%;
                    box-shadow:
                        0 2px 0 rgba(0,0,0,0.03),
                        0 12px 48px rgba(0,0,0,0.16),
                        0 2px 8px rgba(0,0,0,0.06);
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    font-family: 'Inter', system-ui, sans-serif;
                }

                /* STEP INDICATOR */
                .cr-steps {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 10px;
                }

                .cr-step-dot {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.72rem;
                    font-weight: 700;
                    border: 2px solid rgba(229,231,235,0.8);
                    background: rgba(255,255,255,0.6);
                    color: #9ca3af;
                    transition: all 0.28s cubic-bezier(.4,0,.2,1);
                    flex-shrink: 0;
                }
                .cr-step-dot.ativo {
                    border-color: #0f3460;
                    background: #0f3460;
                    color: #fff;
                    box-shadow: 0 0 0 5px rgba(15,52,96,0.12);
                }
                .cr-step-dot.feito {
                    border-color: #10b981;
                    background: #10b981;
                    color: #fff;
                    font-size: 0.8rem;
                }

                .cr-step-line {
                    flex: 1;
                    height: 2px;
                    background: rgba(229,231,235,0.9);
                    margin: 0 6px;
                    transition: background 0.3s;
                    max-width: 56px;
                }
                .cr-step-line.feita { background: #10b981; }

                /* STEP CONTENT */
                .cr-step {
                    display: none;
                    flex-direction: column;
                    gap: 14px;
                    animation: cr-slide-in 0.24s cubic-bezier(.4,0,.2,1);
                }
                .cr-step.ativo { display: flex; }

                @keyframes cr-slide-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* HEADER */
                .cr-titulo {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #0f1729;
                }
                .cr-sub {
                    font-size: 0.8rem;
                    color: rgba(107,114,128,0.9);
                    margin-top: 2px;
                }

                /* LABEL + FIELD */
                .cr-field { display: flex; flex-direction: column; gap: 5px; }

                .cr-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                }

                /* ROTA PICKER */
                .cr-rota-wrap {
                    background: rgba(248,250,255,0.55);
                    border: 1.5px solid rgba(229,231,235,0.8);
                    border-radius: 14px;
                    overflow: visible;
                    position: relative;
                }

                .cr-rota-row {
                    display: flex;
                    align-items: center;
                    padding: 4px 10px 4px 14px;
                    gap: 10px;
                    min-height: 52px;
                }
                .cr-rota-row:first-child { border-radius: 12px 12px 0 0; }
                .cr-rota-row:last-child  { border-radius: 0 0 12px 12px; }
                .cr-rota-row:not(:last-child) {
                    border-bottom: 1.5px solid rgba(229,231,235,0.8);
                }

                .cr-rota-bullet {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .cr-rota-bullet.origem  { background: #10b981; }
                .cr-rota-bullet.destino { background: #e63946; }

                .cr-datalist-input {
                    flex: 1;
                    border: none;
                    background: transparent;
                    font-size: 0.9rem;
                    font-family: inherit;
                    color: #0f1729;
                    outline: none;
                    padding: 6px 4px;
                    min-width: 0;
                    width: 100%;
                }
                .cr-datalist-input::placeholder { color: #9ca3af; }
                .cr-datalist-input:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                    color: #6b7280;
                }

                /* TOGGLE GROUP (pill) */
                .cr-toggle {
                    display: flex;
                    background: rgba(243,244,246,0.7);
                    border: 1px solid rgba(229,231,235,0.6);
                    border-radius: 11px;
                    padding: 3px;
                    gap: 3px;
                }
                .cr-toggle button {
                    flex: 1;
                    border: none;
                    background: transparent;
                    color: #6b7280;
                    padding: 8px 0;
                    font-size: 0.88rem;
                    font-weight: 600;
                    cursor: pointer;
                    border-radius: 9px;
                    transition: all 0.18s;
                    font-family: inherit;
                    white-space: nowrap;
                }
                .cr-toggle button.cr-on {
                    background: rgba(255,255,255,0.92);
                    color: #0f3460;
                    box-shadow: 0 1px 6px rgba(0,0,0,0.1);
                }

                /* TOM SELECT — linhas de rota (sem borda) */
                .cr-sheet .ts-wrapper { min-height: 0; }
                .cr-rota-row .ts-wrapper { flex: 1; }

                .cr-sheet .ts-control {
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    padding: 6px 4px !important;
                    font-size: 0.9rem;
                    background: transparent !important;
                    min-height: 0 !important;
                    font-family: inherit;
                    color: #0f1729;
                }

                /* TOM SELECT — campo de pessoas (com borda) */
                .cr-field .ts-control {
                    border: 1.5px solid rgba(229,231,235,0.75) !important;
                    background: rgba(255,255,255,0.7) !important;
                    border-radius: 11px !important;
                    padding: 8px 12px !important;
                    min-height: 40px !important;
                }
                .cr-field .ts-control:focus-within {
                    border-color: #0f3460 !important;
                    box-shadow: 0 0 0 3px rgba(15,52,96,0.1) !important;
                    background: rgba(255,255,255,0.9) !important;
                }

                .cr-sheet .ts-dropdown {
                    border-radius: 12px;
                    border: 1.5px solid #e5e7eb;
                    box-shadow: 0 -8px 24px rgba(0,0,0,0.13);
                    font-size: 0.9rem;
                    z-index: 9999;
                    font-family: inherit;
                    top: auto !important;
                    bottom: 100% !important;
                    margin-top: 0 !important;
                    margin-bottom: 4px !important;
                }
                .cr-sheet .ts-dropdown .option { padding: 10px 14px; transition: background 0.12s; }
                .cr-sheet .ts-dropdown .option:hover,
                .cr-sheet .ts-dropdown .option.active { background: #eff6ff; color: #0f3460; }
                .cr-sheet .ts-dropdown .option.selected { background: #dbeafe; color: #1e40af; font-weight: 600; }

                .cr-sheet .ts-wrapper.disabled .ts-control { opacity: 0.45; cursor: not-allowed; }

                .cr-subopcao {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 12px;
                    border-radius: 14px;
                    background: rgba(248,250,255,0.6);
                    border: 1.5px solid rgba(219,234,254,0.8);
                }

                .cr-info {
                    font-size: 0.8rem;
                    color: #6b7280;
                    line-height: 1.45;
                }

                /* ROTA SEARCH — opcoes personalizadas */
                .cr-ts-rota-opt {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 6px;
                    width: 100%;
                    overflow: hidden;
                }
                .cr-ts-lado {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    min-width: 0;
                    flex: 1;
                }
                .cr-ts-lado.direito { justify-content: flex-end; }
                .cr-ts-label {
                    font-size: 0.88rem;
                    color: #1d51ca;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    min-width: 0;
                }
                .cr-ts-label.bold { font-weight: 600; }
                .cr-ts-bullet {
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .cr-ts-origem  { background: #10b981; }
                .cr-ts-destino { background: #e63946; }
                .cr-ts-sep { color: #d1d5db; font-size: 0.75rem; flex-shrink: 0; padding: 0 2px; }
                .cr-ts-rota-nome { font-size: 0.88rem; color: #0f1729; }

                /* FLATPICKR */
                .cr-sheet .flatpickr-input {
                    width: 100%;
                    border: 1.5px solid rgba(229,231,235,0.75);
                    border-radius: 11px;
                    padding: 9px 12px;
                    font-size: 0.88rem;
                    font-family: inherit; 
                    color: #0f1729;
                    outline: none;
                    cursor: pointer;
                    transition: border-color 0.18s, box-shadow 0.18s;
                    background: rgba(255,255,255,0.7);
                    box-sizing: border-box;
                }
                .cr-sheet .flatpickr-input:focus {
                    border-color: #0f3460;
                    box-shadow: 0 0 0 3px rgba(15,52,96,0.1);
                    background: rgba(255,255,255,0.92);
                }
                .flatpickr-calendar {
                    font-family: 'Inter', system-ui, sans-serif !important;
                    border-radius: 14px !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
                    border: 1px solid #e5e7eb !important;
                    z-index: 9999 !important;
                    width: 95% !important;
                }
                .flatpickr-day.selected, .flatpickr-day.selected:hover {
                    background: #0f3460 !important; border-color: #0f3460 !important;
                }
                .flatpickr-day:hover { background: #eff6ff !important; color: #0f3460 !important; }
                .flatpickr-day.today { border-color: #0f3460 !important; }
                .flatpickr-months .flatpickr-month,
                .flatpickr-current-month { background: #0f3460 !important; color: #fff !important; }
                .flatpickr-months .flatpickr-prev-month,
                .flatpickr-months .flatpickr-next-month { fill: #fff !important; color: #fff !important; }
                .flatpickr-weekday { color: #6b7280 !important; font-weight: 600 !important; }
                .flatpickr-time input { font-family: inherit !important; }

                /* RESUMO (step 3) */
                .cr-resumo {
                    background: rgba(248,250,255,0.6);
                    border: 1.5px solid rgba(219,234,254,0.7);
                    border-radius: 14px;
                    overflow: hidden;
                }
                .cr-resumo-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 5px;
                }
                .cr-resumo-row:not(:last-child) { border-bottom: 1px solid rgba(229,231,235,0.7); }
                .cr-resumo-icon { font-size: 1.1rem; width: 30px; text-align: center; flex-shrink: 0; }
                .cr-resumo-chave {
                    font-size: 0.68rem;
                    font-weight: 700;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                }
                .cr-resumo-val { font-size: 0.9rem; font-weight: 600; color: #0f1729; margin-top: 1px; }

                .cr-preco-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 18px;
                    background: linear-gradient(135deg, #0f3460, #16213e);
                    border-radius: 14px;
                    color: #fff;
                }
                .cr-preco-card-right {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }
                .cr-preco-card-label { font-size: 0.78rem; font-weight: 600; opacity: 0.75; }
                .cr-preco-card-dist  { font-size: 0.72rem; opacity: 0.6; margin-top: 2px; }
                .cr-preco-card-tempo { font-size: 0.72rem; opacity: 0.6; margin-top: 2px; }
                .cr-preco-card-valor { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px; }

                /* BOTOES */
                .cr-footer { display: flex; gap: 8px; margin-top: 2px; }

                .cr-btn-back {
                    width: 44px;
                    height: 44px;
                    border-radius: 11px;
                    border: 1.5px solid rgba(229,231,235,0.7);
                    background: rgba(255,255,255,0.6);
                    color: #374151;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: background 0.15s, border-color 0.15s;
                }
                .cr-btn-back:hover { background: rgba(243,244,246,0.85); border-color: #d1d5db; }

                .cr-btn-next {
                    flex: 1;
                    height: 44px;
                    border: none;
                    border-radius: 11px;
                    background: #0f3460;
                    color: #fff;
                    font-size: 0.92rem;
                    font-weight: 700;
                    cursor: pointer;
                    font-family: inherit;
                    transition: background 0.18s;
                    letter-spacing: 0.01em;
                }
                .cr-btn-next:hover:not(:disabled) { background: #16213e; }
                .cr-btn-next:disabled { background: rgba(209,213,219,0.7); cursor: not-allowed; color: #9ca3af; }

                .cr-btn-datahora {
                    width: 100%;
                    height: 40px;
                    border: none;
                    border-radius: 10px;
                    background: #0f3460;
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    font-family: inherit;
                    transition: background 0.18s;
                    margin-top: 8px;
                }
                .cr-btn-datahora:hover:not(:disabled) { background: #16213e; }
                .cr-btn-datahora:disabled { background: rgba(209,213,219,0.7); cursor: not-allowed; color: #9ca3af; }
                .cr-btn-datahora.confirmado { background: #059669; }

                .cr-fp-confirm-wrap {
                    padding: 8px;
                    border-top: 1px solid rgba(229,231,235,0.85);
                    background: #fff;
                }

                .cr-btn-confirmar {
                    flex: 1;
                    height: 48px;
                    border: none;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: #fff;
                    font-size: 0.98rem;
                    font-weight: 700;
                    cursor: pointer;
                    font-family: inherit;
                    transition: opacity 0.18s, transform 0.12s;
                    box-shadow: 0 4px 16px rgba(16,185,129,0.35);
                    letter-spacing: 0.01em;
                }
                .cr-btn-confirmar:hover { opacity: 0.9; transform: translateY(-1px); }
                .cr-btn-confirmar:active { transform: translateY(0); }

                /* TOAST NOTIFICATION */
                .cr-toast {
                    position: fixed;
                    bottom: 42%;
                    left: 50%;
                    transform: translateX(-50%) translateY(6px);
                    background: #dc2626;
                    color: #fff;
                    padding: 9px 16px;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    opacity: 0;
                    transition: opacity 0.25s, transform 0.25s;
                    z-index: 10000;
                    pointer-events: none;
                    box-shadow: 0 4px 16px rgba(220,38,38,0.28);
                    max-width: 90%;
                    text-align: center;
                    white-space: normal;
                }
                .cr-toast.cr-toast-visible {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }

                .cr-fa { margin-right: 6px; }
                .cr-resumo-icon i { font-size: 1.05rem; }

                /* MARCADORES DO MAPA */
                .cr-map-marker-wrap { background: none !important; border: none !important; }
                .cr-map-marker {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    border: 2px solid #fff;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.28);
                    font-size: 0.82rem;
                }
            </style>

            <section class="cr-sheet" id="cr-sheet">

                <!-- INDICADOR DE PROGRESSO -->
                <div class="cr-steps">
                    <div class="cr-step-dot ativo" id="cr-dot-1">1</div>
                    <div class="cr-step-line" id="cr-line-1"></div>
                    <div class="cr-step-dot" id="cr-dot-2">2</div>
                    <div class="cr-step-line" id="cr-line-2"></div>
                    <div class="cr-step-dot" id="cr-dot-3"><i class="fa-solid fa-check"></i></div>
                </div>

                <!-- STEP 1: ROTA -->
                <div class="cr-step ativo" id="cr-step-1">
                    <div>
                        <div class="cr-titulo">Para onde vamos?</div>
                    </div>

                    <div class="cr-field">
                        <span class="cr-label">Pesquisar rota</span>
                        <select id="cr-rota-search" placeholder="Ex: Centro → Aeroporto..."></select>
                    </div>

                    <div class="cr-field" id="cr-continuar-field" style="display:none">
                        <span class="cr-label">Continuar apos o destino?</span>
                        <div class="cr-subopcao">
                            <div class="cr-toggle" id="cr-continuar-group">
                                <button type="button" data-c="nao" class="cr-on">Nao</button>
                                <button type="button" data-c="sim">Sim</button>
                            </div>

                            <div class="cr-field" id="cr-continuacao-rota-field" style="display:none">
                                <span class="cr-label">Proxima rota</span>
                                <select id="cr-rota-continuacao" placeholder="Selecione a proxima rota..."></select>
                            </div>

                            <div class="cr-info" id="cr-continuacao-info" style="display:none"></div>
                        </div>
                    </div>

                    <div class="cr-footer">
                        <button class="cr-btn-back" id="cr-reset-1" title="Limpar seleção"><i class="fa-solid fa-rotate-left"></i></button>
                        <button class="cr-btn-next" id="cr-next-1" disabled>Proximo <i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </div>

                <!-- STEP 2: DETALHES -->
                <div class="cr-step" id="cr-step-2">

                    <div class="cr-field">
                        <span class="cr-label">Veiculo</span>
                        <div class="cr-toggle" id="cr-veiculo-group">
                            <button data-v="carro" class="cr-on"><i class="fa-solid fa-car cr-fa"></i>Carro</button>
                            <button data-v="moto"><i class="fa-solid fa-motorcycle cr-fa"></i>Moto</button>
                        </div>
                    </div>

                    <div class="cr-field" id="cr-pessoas-field">
                        <span class="cr-label">Passageiros</span>
                        <div class="cr-toggle" id="cr-pessoas-group">
                            <button data-p="1" class="cr-on">1</button>
                            <button data-p="2">2</button>
                            <button data-p="3">3</button>
                            <button data-p="4">4</button>
                        </div>
                    </div>

                    <div class="cr-field">
                        <span class="cr-label">Quando</span>
                        <div class="cr-toggle" id="cr-quando-group">
                            <button data-q="agora" class="cr-on"><i class="fa-solid fa-bolt cr-fa"></i>Agora</button>
                            <button data-q="agendar"><i class="fa-solid fa-calendar-days cr-fa"></i>Agendar</button>
                        </div>
                    </div>

                    <div class="cr-field" id="cr-agendar-field" style="display:none">
                        <span class="cr-label">Data e hora</span>
                        <input type="text" id="cr-datetime" placeholder="Selecione data e hora..." readonly />
                    </div>

                    <div class="cr-footer">
                        <button class="cr-btn-back" id="cr-back-2"><i class="fa-solid fa-arrow-left"></i></button>
                        <button class="cr-btn-next" id="cr-next-2">Ver resumo <i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </div>

                <!-- STEP 3: CONFIRMAR -->
                <div class="cr-step" id="cr-step-3">

                    <div class="cr-resumo">
                        <div class="cr-resumo-row">
                            <span class="cr-resumo-icon"><i class="fa-solid fa-route"></i></span>
                            <div>
                                <div class="cr-resumo-chave">Rota</div>
                                <div class="cr-resumo-val" id="cr-res-rota">--</div>
                            </div>
                        </div>
                        <div class="cr-resumo-row">
                            <span class="cr-resumo-icon" id="cr-res-v-icon"><i class="fa-solid fa-car"></i></span>
                            <div>
                                <div class="cr-resumo-chave">Veiculo</div>
                                <div class="cr-resumo-val" id="cr-res-veiculo">--</div>
                            </div>
                        </div>
                        <div class="cr-resumo-row">
                            <span class="cr-resumo-icon"><i class="fa-solid fa-clock"></i></span>
                            <div>
                                <div class="cr-resumo-chave">Partida</div>
                                <div class="cr-resumo-val" id="cr-res-quando">Agora</div>
                            </div>
                        </div>
                    </div>

                    <div class="cr-preco-card">
                        <div>
                            <div class="cr-preco-card-dist" id="cr-preco-dist"><i class="fa-solid fa-location-dot cr-fa"></i>-- km</div>
                            <div class="cr-preco-card-tempo" id="cr-preco-tempo"><i class="fa-solid fa-stopwatch cr-fa"></i>--:--:--</div>
                        </div>
                        <div class="cr-preco-card-right">
                            <div class="cr-preco-card-label">Preco estimado</div>
                            <span class="cr-preco-card-valor" id="cr-preco-valor">Kz --</span>
                        </div>
                    </div>

                    <div class="cr-footer">
                        <button class="cr-btn-back" id="cr-back-3"><i class="fa-solid fa-arrow-left"></i></button>
                        <button class="cr-btn-confirmar" id="cr-confirmar"><i class="fa-solid fa-check cr-fa"></i>Confirmar corrida</button>
                    </div>
                </div>

            </section>
        `;
    }

    function init(map) {
        if (!map || !window.L || !window.TomSelect || !window.flatpickr) return;

        layer = L.layerGroup().addTo(map);

        let stepAtual    = 1;
        let veiculoAtual = 'carro';
        let quandoAtual  = 'agora';
        let fp           = null;
        let pessoasAtual = 1;
        let dataHoraConfirmada = false;
        let confirmarDatetimeBtn = null;
        function mostrarNotificacao(msg) {
            const existente = document.getElementById('cr-toast');
            if (existente) existente.remove();
            const toast = document.createElement('div');
            toast.id = 'cr-toast';
            toast.className = 'cr-toast';
            toast.textContent = msg;
            document.body.appendChild(toast);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => toast.classList.add('cr-toast-visible'));
            });
            setTimeout(() => {
                toast.classList.remove('cr-toast-visible');
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }

        function irPara(n, viaPopstate = false) {
            document.getElementById(`cr-step-${stepAtual}`).classList.remove('ativo');
            stepAtual = n;
            document.getElementById(`cr-step-${n}`).classList.add('ativo');

            [1, 2, 3].forEach((i) => {
                const dot = document.getElementById(`cr-dot-${i}`);
                dot.classList.remove('ativo', 'feito');
                if (i < stepAtual)   dot.classList.add('feito');
                if (i === stepAtual) dot.classList.add('ativo');
            });
            [1, 2].forEach((i) => {
                document.getElementById(`cr-line-${i}`).classList.toggle('feita', i < stepAtual);
            });

            // Empurra estado no histórico ao avançar (não ao voltar via popstate)
            if (!viaPopstate && n > 1) {
                history.pushState({ crStep: n }, '');
            }
        }

        // Estado base no histórico para interceptar o botão voltar no step 1
        history.pushState({ crStep: 1 }, '');

        function onPopState() {
            if (stepAtual > 1) {
                irPara(stepAtual - 1, true);
            } else if (rotaSelecionada !== null) {
                // Step 1 com rota selecionada: reset e reempurra o estado base
                resetarStep1();
                history.pushState({ crStep: 1 }, '');
            }
        }
        window.addEventListener('popstate', onPopState);

        // ── TomSelect — pesquisa de rota unificada ─────────────────────────
        let rotaSelecionada = null; // { origem, destino, feature }
        let rotaContinuidade = null;
        let continuarAposDestino = false;

        const next1 = document.getElementById('cr-next-1');
        const continuarField = document.getElementById('cr-continuar-field');
        const continuarGroup = document.getElementById('cr-continuar-group');
        const continuacaoRotaField = document.getElementById('cr-continuacao-rota-field');
        const continuacaoInfo = document.getElementById('cr-continuacao-info');

        // Monta todas as combinações origem → destino do grafo
        const todasRotas = [];
        Object.entries(rotasEmGrafo).forEach(([origem, arestas]) => {
            arestas.forEach((feature) => {
                todasRotas.push({
                    value: `${origem}|||${feature.properties.destino}`,
                    origem,
                    destino: feature.properties.destino,
                    feature,
                });
            });
        });

        function renderizarOpcaoRota(item) {
            return `<div class="cr-ts-rota-opt">
                <div class="cr-ts-lado">
                    <span class="cr-ts-bullet cr-ts-origem"></span>
                    <span class="cr-ts-label bold">${item.origem}</span>
                </div>
                <span class="cr-ts-sep">|</span>
                <div class="cr-ts-lado direito">
                    <span class="cr-ts-label">${item.destino}</span>
                    <span class="cr-ts-bullet cr-ts-destino"></span>
                </div>
            </div>`;
        }

        function obterRotasConectadas() {
            if (!rotaSelecionada?.destino) return [];
            return todasRotas.filter((rota) => rota.origem === rotaSelecionada.destino);
        }

        function obterTrechosSelecionados() {
            return [rotaSelecionada, rotaContinuidade].filter(Boolean);
        }

        function montarResumoRota() {
            const trechos = obterTrechosSelecionados();
            if (!trechos.length) return '--';

            const pontos = [trechos[0].origem, ...trechos.map((trecho) => trecho.destino)];
            return pontos.join(' → ');
        }

        function resetarStep1() {
            rotaSelecionada = null;
            rotaContinuidade = null;
            continuarAposDestino = false;

            tsRota.clear(true);
            tsRotaContinuidade.clear(true);
            tsRotaContinuidade.clearOptions();
            tsRotaContinuidade.disable();

            layer.clearLayers();

            // Reset toggle "Continuar após o destino?" para "Não"
            document.querySelectorAll('#cr-continuar-group button').forEach((btn) => {
                btn.classList.toggle('cr-on', btn.dataset.c === 'nao');
            });

            atualizarCampoContinuidade();

            document.dispatchEvent(new CustomEvent('cr:reset'));
        }

        function atualizarBotaoStep1() {
            const possuiConectadas = obterRotasConectadas().length > 0;
            const precisaEscolherContinuidade = continuarAposDestino && possuiConectadas;
            next1.disabled = !rotaSelecionada || (precisaEscolherContinuidade && !rotaContinuidade);
        }

        function atualizarCampoContinuidade() {
            const rotasConectadas = obterRotasConectadas();

            continuarField.style.display = rotaSelecionada ? '' : 'none';
            continuacaoInfo.style.display = 'none';
            continuacaoInfo.textContent = '';

            if (!rotaSelecionada || !continuarAposDestino) {
                continuacaoRotaField.style.display = 'none';
                atualizarBotaoStep1();
                return;
            }

            if (!rotasConectadas.length) {
                continuacaoRotaField.style.display = 'none';
                continuacaoInfo.style.display = '';
                continuacaoInfo.textContent = 'Nao existem rotas cadastradas saindo deste destino.';
                atualizarBotaoStep1();
                return;
            }

            continuacaoRotaField.style.display = '';
            continuacaoInfo.style.display = '';
            continuacaoInfo.textContent = `Mostrando apenas rotas com partida em ${rotaSelecionada.destino}.`;
            atualizarBotaoStep1();
        }

        const tsRota = new TomSelect('#cr-rota-search', {
            options: todasRotas,
            valueField: 'value',
            labelField: 'value',
            searchField: ['origem', 'destino'],
            placeholder: 'Ex: Centro → Aeroporto...',
            maxOptions: 20,
            render: {
                option: renderizarOpcaoRota,
                item: renderizarOpcaoRota,
            },
            onChange(value) {
                const item = todasRotas.find((r) => r.value === value);
                rotaSelecionada = item || null;
                rotaContinuidade = null;
                layer.clearLayers();
                if (tsRotaContinuidade) {
                    tsRotaContinuidade.clear(true);
                    tsRotaContinuidade.clearOptions();

                    const rotasConectadas = obterRotasConectadas();
                    if (rotasConectadas.length) {
                        tsRotaContinuidade.addOptions(rotasConectadas);
                        tsRotaContinuidade.enable();
                    } else {
                        tsRotaContinuidade.disable();
                    }
                    tsRotaContinuidade.refreshOptions(false);
                }

                atualizarCampoContinuidade();
                if (rotaSelecionada) exibirRota();
            },
        });

        const tsRotaContinuidade = new TomSelect('#cr-rota-continuacao', {
            options: [],
            valueField: 'value',
            labelField: 'value',
            searchField: ['origem', 'destino'],
            placeholder: 'Selecione a proxima rota...',
            maxOptions: 10,
            render: {
                option: renderizarOpcaoRota,
                item: renderizarOpcaoRota,
            },
            onChange(value) {
                const item = obterRotasConectadas().find((rota) => rota.value === value);
                rotaContinuidade = item || null;
                atualizarBotaoStep1();
                exibirRota();
            },
        });

        tsRotaContinuidade.disable();

        continuarGroup.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-c]');
            if (!btn) return;

            continuarAposDestino = btn.dataset.c === 'sim';
            document.querySelectorAll('#cr-continuar-group button').forEach((button) =>
                button.classList.toggle('cr-on', button === btn));

            rotaContinuidade = null;
            tsRotaContinuidade.clear(true);
            atualizarCampoContinuidade();
            exibirRota();
        });


        document.getElementById('cr-pessoas-group').addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-p]');
            if (!btn) return;
            pessoasAtual = parseInt(btn.dataset.p, 10);
            document.querySelectorAll('#cr-pessoas-group button').forEach((b) =>
                b.classList.toggle('cr-on', b === btn));
        });

        fp = flatpickr('#cr-datetime', {
            enableTime: true,
            dateFormat: 'd/m/Y H:i',
            minDate: new Date(),
            maxDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            time_24hr: true,
            locale: flatpickr.l10ns.pt,
            disableMobile: true,
            onReady() {
                montarBotaoNoCalendario();
                atualizarBotaoDataHora();
            },
            onOpen() {
                montarBotaoNoCalendario();
                atualizarBotaoDataHora();
            },
            onChange() {
                dataHoraConfirmada = false;
                atualizarBotaoDataHora();
                validarStep2();
            },
        });

        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // STEP 1
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        function atualizarBotaoConfirmarCorrida() {
            const btnConfirmar = document.getElementById('cr-confirmar');
            if (!btnConfirmar) return;
            btnConfirmar.innerHTML = quandoAtual === 'agendar'
                ? '<i class="fa-solid fa-calendar-check cr-fa"></i>Confirmar agendamento'
                : '<i class="fa-solid fa-check cr-fa"></i>Confirmar corrida';
        }

        function montarPayloadCorrida() {
            if (!rotaSelecionada) return null;

            const trechos = obterTrechosSelecionados();
            const passageiros = veiculoAtual === 'moto' ? 1 : pessoasAtual;
            const preco = calcularPreco(trechos.map((trecho) => trecho.feature), veiculoAtual, passageiros);
            const dataSelecionada = fp && fp.selectedDates.length > 0 ? fp.selectedDates[0] : null;
            const whenLabel = quandoAtual === 'agendar' && dataSelecionada
                ? fp.formatDate(dataSelecionada, 'd/m/Y H:i')
                : 'Agora';

            return {
                id: `CR-${Date.now()}`,
                createdAt: new Date().toISOString(),
                status: 'active',
                when: quandoAtual,
                whenLabel,
                scheduledAt: quandoAtual === 'agendar' && dataSelecionada ? dataSelecionada.toISOString() : null,
                routeSummary: montarResumoRota(),
                continueAfterDestination: continuarAposDestino,
                passengers: passageiros,
                vehicle: veiculoAtual,
                vehicleLabel: veiculoAtual === 'moto'
                    ? 'Moto'
                    : `Carro • ${passageiros} passageiro${passageiros > 1 ? 's' : ''}`,
                estimatedPrice: preco ? `Kz ${preco.total.replace('.', ',')}` : 'Kz --',
                estimatedDistance: preco ? `${preco.distancia} km` : '-- km',
                estimatedDuration: preco ? preco.tempo : '--:--:--',
                stops: [trechos[0]?.origem, ...trechos.map((trecho) => trecho.destino)].filter(Boolean),
                segments: trechos.map((trecho, index) => ({
                    id: `${index + 1}`,
                    origem: trecho.origem,
                    destino: trecho.destino,
                    geometry: trecho.feature?.geometry ?? null,
                    style: trecho.feature?.properties?.style ?? null
                })),
                driver: pickDriver()
            };
        }

        function confirmarCorridaFinal() {
            exibirRota();

            const payload = montarPayloadCorrida();
            if (!payload) return;

            saveActiveRide(payload);

            if (payload.when === 'agendar') {
                saveScheduledRide(payload);
            }

            window.location.hash = '#/aguardando-motorista';
        }

        document.getElementById('cr-confirmar').addEventListener('click', confirmarCorridaFinal);

        document.getElementById('cr-reset-1').addEventListener('click', resetarStep1);

        next1.addEventListener('click', () => irPara(2));

        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // STEP 2
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const back2        = document.getElementById('cr-back-2');
        const next2        = document.getElementById('cr-next-2');
        const pessoasField = document.getElementById('cr-pessoas-field');
        const agendarField = document.getElementById('cr-agendar-field');

        function montarBotaoNoCalendario() {
            if (!fp || !fp.calendarContainer) return;

            const existente = fp.calendarContainer.querySelector('#cr-confirmar-datetime-popup');
            if (existente) {
                confirmarDatetimeBtn = existente;
                return;
            }

            const wrap = document.createElement('div');
            wrap.className = 'cr-fp-confirm-wrap';

            confirmarDatetimeBtn = document.createElement('button');
            confirmarDatetimeBtn.type = 'button';
            confirmarDatetimeBtn.id = 'cr-confirmar-datetime-popup';
            confirmarDatetimeBtn.className = 'cr-btn-datahora';
            confirmarDatetimeBtn.disabled = true;
            confirmarDatetimeBtn.innerHTML = '<i class="fa-solid fa-clock cr-fa"></i>Confirmar data e hora';
            confirmarDatetimeBtn.addEventListener('click', () => {
                if (!(fp && fp.selectedDates.length > 0)) return;
                const selecionada = fp.selectedDates[0];
                const agora = new Date();
                const minValido = new Date(agora.getTime() + 60 * 60 * 1000);
                const maxValido = new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000);
                if (selecionada < minValido) {
                    mostrarNotificacao('O agendamento deve ser com no mínimo 1 hora de antecedência.');
                    return;
                }
                if (selecionada > maxValido) {
                    mostrarNotificacao('O agendamento deve ser para no máximo os próximos 2 dias.');
                    return;
                }
                dataHoraConfirmada = true;
                atualizarBotaoDataHora();
                validarStep2();
                fp.close();
            });

            wrap.appendChild(confirmarDatetimeBtn);
            fp.calendarContainer.appendChild(wrap);

            fp.calendarContainer.addEventListener('mousedown', (e) => {
                const dia = e.target.closest('.flatpickr-day.flatpickr-disabled');
                if (!dia) return;
                const allDays = Array.from(fp.calendarContainer.querySelectorAll('.flatpickr-day'));
                const todayIdx = allDays.findIndex((d) => d.classList.contains('today'));
                const diaIdx = allDays.indexOf(dia);
                if (todayIdx !== -1 && diaIdx < todayIdx) {
                    mostrarNotificacao('Não é possível agendar para datas passadas.');
                } else {
                    mostrarNotificacao('O agendamento deve ser para no máximo os próximos 2 dias.');
                }
            }, true);
        }

        function atualizarBotaoDataHora() {
            if (!confirmarDatetimeBtn) return;

            if (quandoAtual !== 'agendar') {
                confirmarDatetimeBtn.disabled = true;
                confirmarDatetimeBtn.classList.remove('confirmado');
                confirmarDatetimeBtn.innerHTML = '<i class="fa-solid fa-clock cr-fa"></i>Confirmar data e hora';
                return;
            }

            const temDataSelecionada = fp && fp.selectedDates.length > 0;
            confirmarDatetimeBtn.disabled = !temDataSelecionada;
            confirmarDatetimeBtn.classList.toggle('confirmado', dataHoraConfirmada && temDataSelecionada);
            confirmarDatetimeBtn.innerHTML = dataHoraConfirmada && temDataSelecionada
                ? '<i class="fa-solid fa-circle-check cr-fa"></i>Data e hora confirmadas'
                : '<i class="fa-solid fa-clock cr-fa"></i>Confirmar data e hora';
        }

        function validarStep2() {
            next2.disabled = quandoAtual === 'agendar' && !dataHoraConfirmada;
        }

        document.getElementById('cr-veiculo-group').addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-v]');
            if (!btn) return;
            veiculoAtual = btn.dataset.v;
            document.querySelectorAll('#cr-veiculo-group button').forEach((b) =>
                b.classList.toggle('cr-on', b === btn));
            pessoasField.style.display = veiculoAtual === 'moto' ? 'none' : '';
            if (veiculoAtual === 'moto') {
                pessoasAtual = 1;
                document.querySelectorAll('#cr-pessoas-group button').forEach((b) =>
                    b.classList.toggle('cr-on', b.dataset.p === '1'));
            }
        });

        document.getElementById('cr-quando-group').addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-q]');
            if (!btn) return;
            quandoAtual = btn.dataset.q;
            dataHoraConfirmada = false;
            document.querySelectorAll('#cr-quando-group button').forEach((b) =>
                b.classList.toggle('cr-on', b === btn));
            agendarField.style.display = quandoAtual === 'agendar' ? '' : 'none';
            if (quandoAtual === 'agendar' && fp) fp.open();
            atualizarBotaoDataHora();
            validarStep2();
            atualizarBotaoConfirmarCorrida();
        });

        back2.addEventListener('click', () => irPara(1));
        next2.addEventListener('click', () => {
            preencherResumo();
            atualizarBotaoConfirmarCorrida();
            irPara(3);
        });

        atualizarBotaoDataHora();
        atualizarBotaoConfirmarCorrida();

        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // STEP 3
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        document.getElementById('cr-back-3').addEventListener('click', () => irPara(2));

        // â”€â”€ Preenche o resumo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        function preencherResumo() {
            if (!rotaSelecionada) return;
            const trechos = obterTrechosSelecionados();
            const pessoas = pessoasAtual;

            document.getElementById('cr-res-rota').textContent = montarResumoRota();

            const icon = veiculoAtual === 'moto' ? 'fa-motorcycle' : 'fa-car';
            const desc = veiculoAtual === 'moto'
                ? 'Moto'
                : `Carro • ${pessoas} passageiro${pessoas > 1 ? 's' : ''}`;
            document.getElementById('cr-res-v-icon').innerHTML = `<i class="fa-solid ${icon}"></i>`;
            document.getElementById('cr-res-veiculo').textContent = desc;

            if (quandoAtual === 'agora') {
                document.getElementById('cr-res-quando').textContent = 'Agora';
            } else {
                const val = fp && fp.selectedDates.length > 0
                    ? fp.formatDate(fp.selectedDates[0], 'd/m/Y H:i')
                    : 'â€”';
                document.getElementById('cr-res-quando').textContent = val;
            }

            if (trechos.length) {
                const preco = calcularPreco(trechos.map((trecho) => trecho.feature), veiculoAtual, pessoas);
                document.getElementById('cr-preco-valor').textContent = `Kz ${preco.total.replace('.', ',')}`;
                document.getElementById('cr-preco-dist').innerHTML  = `<i class="fa-solid fa-location-dot cr-fa"></i>${preco.distancia} km`;
                document.getElementById('cr-preco-tempo').innerHTML = `<i class="fa-solid fa-stopwatch cr-fa"></i>${preco.tempo}`;
            }
        }

        // â”€â”€ Exibe a rota no mapa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        function exibirRota() {
            if (!rotaSelecionada) return;
            const trechos = obterTrechosSelecionados();

            layer.clearLayers();

            const bounds = L.latLngBounds([]);

            trechos.forEach((trecho, index) => {
                const { origem, destino, feature } = trecho;
                const coords = feature.geometry.coordinates;
                const origemCoord = [coords[0][1], coords[0][0]];
                const destinoCoord = [coords[coords.length - 1][1], coords[coords.length - 1][0]];
                const latLngs = coords.map(([lng, lat]) => [lat, lng]);

                L.polyline(latLngs, feature.properties.style || {}).addTo(layer);
                bounds.extend(origemCoord);
                bounds.extend(destinoCoord);

                if (index === 0) {
                    L.marker(origemCoord, { icon: criarIcone('origem') })
                        .addTo(layer)
                        .bindPopup(`<b>Origem:</b> ${origem}`);
                }

                const tipoDestino = index === trechos.length - 1 ? 'destino' : 'parada';
                const labelDestino = tipoDestino === 'destino' ? 'Destino' : 'Parada';
                L.marker(destinoCoord, { icon: criarIcone(tipoDestino) })
                    .addTo(layer)
                    .bindPopup(`<b>${labelDestino}:</b> ${destino}`);
            });

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [60, 180] });
            }
        }

        return {
            isRotaAtiva() {
                return rotaSelecionada !== null;
            },
            destroy() {
                window.removeEventListener('popstate', onPopState);
                if (fp) fp.destroy();
                if (tsRota) tsRota.destroy();
                if (layer) { layer.remove(); layer = null; }
            }
        };
    }

    return { html: html(), init };
}
