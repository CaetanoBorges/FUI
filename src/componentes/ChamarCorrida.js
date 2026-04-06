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
    Rodoviária: [
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

export default function ChamarCorrida() {
    let layer = null;

    function html() {
        return `
            <style>
                .corrida-card {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    z-index: 600;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 10px;
                    padding: 14px;
                    width: 290px;
                    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .corrida-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1a1a2e;
                }

                .corrida-label {
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 2px;
                }

                .corrida-field {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                /* Tom Select overrides para o tema do card */
                .corrida-card .ts-wrapper {
                    min-height: 38px;
                }

                .corrida-card .ts-control {
                    border-radius: 8px;
                    border: 1px solid #d1d5db;
                    padding: 7px 10px;
                    font-size: 0.9rem;
                    background: #fff;
                    min-height: 38px;
                    cursor: pointer;
                }

                .corrida-card .ts-control:focus-within {
                    border-color: #0f3460;
                    box-shadow: 0 0 0 3px rgba(15, 52, 96, 0.12);
                }

                .corrida-card .ts-wrapper.disabled .ts-control {
                    background: #f3f4f6;
                    color: #9ca3af;
                    cursor: not-allowed;
                }

                .corrida-card .ts-dropdown {
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                    font-size: 0.9rem;
                    z-index: 700;
                }

                .corrida-card .ts-dropdown .option {
                    padding: 9px 12px;
                    transition: background 0.15s;
                }

                .corrida-card .ts-dropdown .option:hover,
                .corrida-card .ts-dropdown .option.active {
                    background: #eff6ff;
                    color: #0f3460;
                }

                .corrida-card .ts-dropdown .option.selected {
                    background: #dbeafe;
                    color: #1e40af;
                    font-weight: 600;
                }

                .corrida-btn {
                    width: 100%;
                    border: none;
                    border-radius: 8px;
                    background: #0f3460;
                    color: #fff;
                    padding: 10px;
                    font-size: 0.95rem;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }

                .corrida-btn:hover:not(:disabled) {
                    background: #16213e;
                }

                .corrida-btn:disabled {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                .corrida-status {
                    font-size: 0.82rem;
                    color: #374151;
                    min-height: 18px;
                }
            </style>

            <section class="corrida-card" id="corrida-card">
                <span class="corrida-title">Chamar corrida</span>

                <div class="corrida-field">
                    <span class="corrida-label">Origem</span>
                    <select id="corrida-origem-select" placeholder="Selecione a origem...">
                        <option value="">Selecione a origem...</option>
                        ${Object.keys(rotasEmGrafo).map((o) => `<option value="${o}">${o}</option>`).join('')}
                    </select>
                </div>

                <div class="corrida-field">
                    <span class="corrida-label">Destino</span>
                    <select id="corrida-destino-select" placeholder="Selecione o destino..." disabled>
                        <option value="">Selecione o destino...</option>
                    </select>
                </div>

                <button id="corrida-btn" class="corrida-btn" disabled>Solicitar corrida</button>
                <p id="corrida-status" class="corrida-status"></p>
            </section>
        `;
    }

    function init(map) {
        if (!map || !window.L || !window.TomSelect) return;

        const button = document.getElementById('corrida-btn');
        const status = document.getElementById('corrida-status');
        if (!button || !status) return;

        layer = L.layerGroup().addTo(map);

        const tsOrigem = new TomSelect('#corrida-origem-select', {
            create: false,
            placeholder: 'Selecione a origem...',
            allowEmptyOption: false,
            onInitialize() { this.clear(); }
        });

        const tsDestino = new TomSelect('#corrida-destino-select', {
            create: false,
            placeholder: 'Selecione o destino...',
            allowEmptyOption: false,
            onInitialize() { this.clear(); }
        });
        tsDestino.disable();

        tsOrigem.on('change', (origem) => {
            const features = rotasEmGrafo[origem] || [];

            tsDestino.clear();
            tsDestino.clearOptions();
            tsDestino.addOptions(
                features.map((f) => ({ value: f.properties.destino, text: f.properties.destino }))
            );
            tsDestino.refreshOptions(false);

            if (features.length > 0) {
                tsDestino.enable();
            } else {
                tsDestino.disable();
            }

            button.disabled = true;
            status.textContent = '';
            layer.clearLayers();
        });

        tsDestino.on('change', (destino) => {
            const origem = tsOrigem.getValue();
            const features = rotasEmGrafo[origem] || [];
            const valido = destino && features.some((f) => f.properties.destino === destino);
            button.disabled = !valido;
        });

        const solicitar = () => {
            const origem = tsOrigem.getValue();
            const destino = tsDestino.getValue();
            const feature = (rotasEmGrafo[origem] || []).find((f) => f.properties.destino === destino);
            if (!feature) return;

            layer.clearLayers();

            const linhaLayer = L.geoJSON(feature, {
                style: () => feature.properties.style
            }).addTo(layer);

            const coords = feature.geometry.coordinates;
            const origemCoord = [coords[0][1], coords[0][0]];
            const destinoCoord = [coords[coords.length - 1][1], coords[coords.length - 1][0]];

            L.marker(origemCoord).addTo(layer).bindPopup(`<b>Origem:</b> ${origem}`);
            L.marker(destinoCoord).addTo(layer).bindPopup(`<b>Destino:</b> ${destino}`);

            map.fitBounds(linhaLayer.getBounds(), { padding: [40, 40] });
            status.textContent = `Corrida solicitada: ${origem} → ${destino}`;
        };

        button.addEventListener('click', solicitar);

        return {
            destroy() {
                button.removeEventListener('click', solicitar);
                tsOrigem.destroy();
                tsDestino.destroy();
                if (layer) {
                    layer.remove();
                    layer = null;
                }
            }
        };
    }

    return {
        html: html(),
        init
    };
}
