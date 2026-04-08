// Grafo de rotas: cada origem mapeia para um array de GeoJSON Features (LineString + estilo em properties)
const rotasEmGrafo = {
    Centro: [
        {
            type: 'Feature',
            properties: {
                destino: 'Aeroporto',
                style: { color: '#e63946', weight: 5, opacity: 0.85, dashArray: null }
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-47.8828, -15.7939],
                    [-47.9182, -15.8703]
                ]
            }
        },
        {
            type: 'Feature',
            properties: {
                destino: 'Universidade',
                style: { color: '#2a9d8f', weight: 5, opacity: 0.85, dashArray: '8 4' }
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-47.8828, -15.7939],
                    [-47.8713, -15.7636]
                ]
            }
        }
    ],
    Rodovia: [
        {
            type: 'Feature',
            properties: {
                destino: 'Universidade',
                style: { color: '#2a9d8f', weight: 5, opacity: 0.85, dashArray: '8 4' }
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-47.8919, -15.7985],
                    [-47.8713, -15.7636]
                ]
            }
        },
        {
            type: 'Feature',
            properties: {
                destino: 'Hospital',
                style: { color: '#f4a261', weight: 5, opacity: 0.85, dashArray: null }
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-47.8919, -15.7985],
                    [-47.8822, -15.7942]
                ]
            }
        }
    ],
    Shopping: [
        {
            type: 'Feature',
            properties: {
                destino: 'Hospital',
                style: { color: '#f4a261', weight: 5, opacity: 0.85, dashArray: null }
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-47.9564, -15.8319],
                    [-47.8822, -15.7942],
                    
                ]
            }
        },
        {
            type: 'Feature',
            properties: {
                destino: 'Aeroporto',
                style: { color: '#e63946', weight: 5, opacity: 0.85, dashArray: '8 4' }
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [-47.9564, -15.8319],
                    [-47.9182, -15.8703]
                ]
            }
        }
    ]
};

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
    if (!feature) return null;
    const coords = feature.geometry.coordinates;
    let distancia = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        distancia += haversineKm(coords[i], coords[i + 1]);
    }
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
                    box-shadow: 0 8px 24px rgba(0,0,0,0.13);
                    font-size: 0.9rem;
                    z-index: 9999;
                    font-family: inherit;
                }
                .cr-sheet .ts-dropdown .option { padding: 10px 14px; transition: background 0.12s; }
                .cr-sheet .ts-dropdown .option:hover,
                .cr-sheet .ts-dropdown .option.active { background: #eff6ff; color: #0f3460; }
                .cr-sheet .ts-dropdown .option.selected { background: #dbeafe; color: #1e40af; font-weight: 600; }

                .cr-sheet .ts-wrapper.disabled .ts-control { opacity: 0.45; cursor: not-allowed; }

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
            </style>

            <section class="cr-sheet" id="cr-sheet">

                <!-- INDICADOR DE PROGRESSO -->
                <div class="cr-steps">
                    <div class="cr-step-dot ativo" id="cr-dot-1">1</div>
                    <div class="cr-step-line" id="cr-line-1"></div>
                    <div class="cr-step-dot" id="cr-dot-2">2</div>
                    <div class="cr-step-line" id="cr-line-2"></div>
                    <div class="cr-step-dot" id="cr-dot-3">&#10003;</div>
                </div>

                <!-- STEP 1: ROTA -->
                <div class="cr-step ativo" id="cr-step-1">
                    <div>
                        <div class="cr-titulo">Para onde vamos?</div>
                    </div>

                    <div class="cr-rota-wrap">
                        <div class="cr-rota-row">
                            <div class="cr-rota-bullet origem"></div>
                            <input type="text" id="cr-origem-input" list="cr-origem-list"
                                placeholder="Selecione a origem..." autocomplete="off"
                                class="cr-datalist-input">
                            <datalist id="cr-origem-list">
                                ${Object.keys(rotasEmGrafo).map((o) => `<option value="${o}"></option>`).join('')}
                            </datalist>
                        </div>
                        <div class="cr-rota-row">
                            <div class="cr-rota-bullet destino"></div>
                            <input type="text" id="cr-destino-input" list="cr-destino-list"
                                placeholder="Selecione o destino..." autocomplete="off"
                                class="cr-datalist-input" disabled>
                            <datalist id="cr-destino-list"></datalist>
                        </div>
                    </div>

                    <div class="cr-footer">
                        <button class="cr-btn-next" id="cr-next-1" disabled>Proximo &#8594;</button>
                    </div>
                </div>

                <!-- STEP 2: DETALHES -->
                <div class="cr-step" id="cr-step-2">

                    <div class="cr-field">
                        <span class="cr-label">Veiculo</span>
                        <div class="cr-toggle" id="cr-veiculo-group">
                            <button data-v="carro" class="cr-on">&#x1F697; Carro</button>
                            <button data-v="moto">&#x1F3CD;&#xFE0F; Moto</button>
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
                            <button data-q="agora" class="cr-on">&#x26A1; Agora</button>
                            <button data-q="agendar">&#x1F4C5; Agendar</button>
                        </div>
                    </div>

                    <div class="cr-field" id="cr-agendar-field" style="display:none">
                        <span class="cr-label">Data e hora</span>
                        <input type="text" id="cr-datetime" placeholder="Selecione data e hora..." readonly />
                    </div>

                    <div class="cr-footer">
                        <button class="cr-btn-back" id="cr-back-2">&#8592;</button>
                        <button class="cr-btn-next" id="cr-next-2">Ver resumo &#8594;</button>
                    </div>
                </div>

                <!-- STEP 3: CONFIRMAR -->
                <div class="cr-step" id="cr-step-3">

                    <div class="cr-resumo">
                        <div class="cr-resumo-row">
                            <span class="cr-resumo-icon">&#x1F4CD;</span>
                            <div>
                                <div class="cr-resumo-chave">Rota</div>
                                <div class="cr-resumo-val" id="cr-res-rota">--</div>
                            </div>
                        </div>
                        <div class="cr-resumo-row">
                            <span class="cr-resumo-icon" id="cr-res-v-icon">&#x1F697;</span>
                            <div>
                                <div class="cr-resumo-chave">Veiculo</div>
                                <div class="cr-resumo-val" id="cr-res-veiculo">--</div>
                            </div>
                        </div>
                        <div class="cr-resumo-row">
                            <span class="cr-resumo-icon">&#x1F550;</span>
                            <div>
                                <div class="cr-resumo-chave">Partida</div>
                                <div class="cr-resumo-val" id="cr-res-quando">Agora</div>
                            </div>
                        </div>
                    </div>

                    <div class="cr-preco-card">
                        <div>
                            <div class="cr-preco-card-dist" id="cr-preco-dist">&#x1F4CD; -- km</div>
                            <div class="cr-preco-card-tempo" id="cr-preco-tempo">&#x23F1;&#xFE0F; --:--:--</div>
                        </div>
                        <div class="cr-preco-card-right">
                            <div class="cr-preco-card-label">Preco estimado</div>
                            <span class="cr-preco-card-valor" id="cr-preco-valor">Kz --</span>
                        </div>
                    </div>

                    <div class="cr-footer">
                        <button class="cr-btn-back" id="cr-back-3">&#8592;</button>
                        <button class="cr-btn-confirmar" id="cr-confirmar">&#10003; Confirmar corrida</button>
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
        function irPara(n) {
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
        }

        // ── Inputs com Datalist — Origem / Destino ────────────────────────
        const origemInput  = document.getElementById('cr-origem-input');
        const destinoInput = document.getElementById('cr-destino-input');

        // Recria o <datalist> do destino no body para garantir que o browser
        // re-associa as novas opções do grafo sem cache do elemento anterior
        function refreshDestinoList(features) {
            const old = document.getElementById('cr-destino-list');
            if (old) old.remove();
            const dl = document.createElement('datalist');
            dl.id = 'cr-destino-list';
            features.forEach((f) => {
                const opt = document.createElement('option');
                opt.value = f.properties.destino;
                dl.appendChild(opt);
            });
            document.body.appendChild(dl);
            destinoInput.removeAttribute('list');
            requestAnimationFrame(() => destinoInput.setAttribute('list', 'cr-destino-list'));
        }


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
            minDate: 'today',
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
        const next1 = document.getElementById('cr-next-1');
        function atualizarBotaoConfirmarCorrida() {
            const btnConfirmar = document.getElementById('cr-confirmar');
            if (!btnConfirmar) return;
            btnConfirmar.textContent = quandoAtual === 'agendar'
                ? '📅 Confirmar agendamento'
                : '✓ Confirmar corrida';
        }

        function confirmarCorridaFinal() {
            exibirRota();

            if (quandoAtual === 'agendar') {
                const dataAgendada = fp && fp.selectedDates.length > 0
                    ? fp.formatDate(fp.selectedDates[0], 'd/m/Y H:i')
                    : 'data não informada';
                window.alert(`Agendamento confirmado para ${dataAgendada}.`);
                return;
            }

            window.alert('Corrida confirmada para agora.');
        }

        document.getElementById('cr-confirmar').addEventListener('click', confirmarCorridaFinal);
        function validarStep1() {
            const arestas = rotasEmGrafo[origemInput.value] || [];
            const destinoValido = arestas.some((f) => f.properties.destino === destinoInput.value);
            next1.disabled = !(arestas.length > 0 && destinoValido);
        }

        // Ao mudar a origem, recalculamos os destinos disponíveis no grafo
        function handleOrigem() {
            const arestas = rotasEmGrafo[origemInput.value] || [];
            destinoInput.value = '';
            layer.clearLayers();
            if (arestas.length) {
                refreshDestinoList(arestas);
                destinoInput.disabled = false;
            } else {
                const old = document.getElementById('cr-destino-list');
                if (old) old.remove();
                destinoInput.removeAttribute('list');
                destinoInput.disabled = true;
            }
            validarStep1();
        }
        origemInput.addEventListener('input',  handleOrigem);
        origemInput.addEventListener('change', handleOrigem);

        // Ao mudar o destino, validamos o par (origem, destino) no grafo e exibimos a rota
        function handleDestino() {
            validarStep1();
            exibirRota();
        }
        destinoInput.addEventListener('input',  handleDestino);
        destinoInput.addEventListener('change', handleDestino);

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
            confirmarDatetimeBtn.textContent = 'Confirmar data e hora';
            confirmarDatetimeBtn.addEventListener('click', () => {
                if (!(fp && fp.selectedDates.length > 0)) return;
                dataHoraConfirmada = true;
                atualizarBotaoDataHora();
                validarStep2();
                fp.close();
            });

            wrap.appendChild(confirmarDatetimeBtn);
            fp.calendarContainer.appendChild(wrap);
        }

        function atualizarBotaoDataHora() {
            if (!confirmarDatetimeBtn) return;

            if (quandoAtual !== 'agendar') {
                confirmarDatetimeBtn.disabled = true;
                confirmarDatetimeBtn.classList.remove('confirmado');
                confirmarDatetimeBtn.textContent = 'Confirmar data e hora';
                return;
            }

            const temDataSelecionada = fp && fp.selectedDates.length > 0;
            confirmarDatetimeBtn.disabled = !temDataSelecionada;
            confirmarDatetimeBtn.classList.toggle('confirmado', dataHoraConfirmada && temDataSelecionada);
            confirmarDatetimeBtn.textContent = dataHoraConfirmada && temDataSelecionada
                ? '✓ Data e hora confirmadas'
                : 'Confirmar data e hora';
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
        document.getElementById('cr-confirmar').addEventListener('click', exibirRota);

        // â”€â”€ Preenche o resumo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        function preencherResumo() {
            const origem  = origemInput.value;
            const destino = destinoInput.value;
            const feature = (rotasEmGrafo[origem] || []).find((f) => f.properties.destino === destino);
            const pessoas = pessoasAtual;

            document.getElementById('cr-res-rota').textContent = `${origem} â†’ ${destino}`;

            const icon = veiculoAtual === 'moto' ? 'ðŸï¸' : 'ðŸš—';
            const desc = veiculoAtual === 'moto'
                ? 'Moto'
                : `Carro Â· ${pessoas} passageiro${pessoas > 1 ? 's' : ''}`;
            document.getElementById('cr-res-v-icon').textContent = icon;
            document.getElementById('cr-res-veiculo').textContent = desc;

            if (quandoAtual === 'agora') {
                document.getElementById('cr-res-quando').textContent = 'Agora';
            } else {
                const val = fp && fp.selectedDates.length > 0
                    ? fp.formatDate(fp.selectedDates[0], 'd/m/Y H:i')
                    : 'â€”';
                document.getElementById('cr-res-quando').textContent = val;
            }

            if (feature) {
                const preco = calcularPreco(feature, veiculoAtual, pessoas);
                document.getElementById('cr-preco-valor').textContent = `Kz ${preco.total.replace('.', ',')}`;
                document.getElementById('cr-preco-dist').textContent  = `📍 ${preco.distancia} km`;
                document.getElementById('cr-preco-tempo').textContent = `⏱️ ${preco.tempo}`;
            }
        }

        // â”€â”€ Exibe a rota no mapa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        function exibirRota() {
            const origem  = origemInput.value;
            const destino = destinoInput.value;
            const feature = (rotasEmGrafo[origem] || []).find((f) => f.properties.destino === destino);
            if (!feature) return;

            layer.clearLayers();

            const linhaLayer   = L.geoJSON(feature, { style: () => feature.properties.style }).addTo(layer);
            const coords       = feature.geometry.coordinates;
            const origemCoord  = [coords[0][1], coords[0][0]];
            const destinoCoord = [coords[coords.length - 1][1], coords[coords.length - 1][0]];

            L.marker(origemCoord).addTo(layer).bindPopup(`<b>Origem:</b> ${origem}`);
            L.marker(destinoCoord).addTo(layer).bindPopup(`<b>Destino:</b> ${destino}`);
            map.fitBounds(linhaLayer.getBounds(), { padding: [60, 180] });
        }

        return {
            destroy() {
                if (fp) fp.destroy();
                if (layer) { layer.remove(); layer = null; }
            }
        };
    }

    return { html: html(), init };
}
