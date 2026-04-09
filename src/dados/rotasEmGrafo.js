function criarFeature(destino, style, coordinates) {
    return {
        type: 'Feature',
        properties: {
            destino,
            style: { ...style }
        },
        geometry: {
            type: 'LineString',
            coordinates
        }
    };
}

function rotaJaExiste(lista, destino) {
    return (lista || []).some((feature) => feature.properties.destino === destino);
}

function adicionarRota(grafo, origem, destino, style, coordinates) {
    if (!grafo[origem]) {
        grafo[origem] = [];
    }

    if (rotaJaExiste(grafo[origem], destino)) return;

    grafo[origem].push(criarFeature(destino, style, coordinates));
}

function registrarRotaIdaVolta(grafo, trecho) {
    const { origem, destino, style, coordinates } = trecho;

    adicionarRota(grafo, origem, destino, style, coordinates);
    adicionarRota(grafo, destino, origem, style, [...coordinates].reverse());
}

const trechosBase = [
    {
        origem: 'Centro',
        destino: 'Aeroporto',
        style: { color: '#e63946', weight: 5, opacity: 0.85, dashArray: null },
        coordinates: [
            [-47.8828, -15.7939],
            [-47.9182, -15.8703]
        ]
    },
    {
        origem: 'Centro',
        destino: 'Universidade',
        style: { color: '#2a9d8f', weight: 5, opacity: 0.85, dashArray: '8 4' },
        coordinates: [
            [-47.8828, -15.7939],
            [-47.8713, -15.7636]
        ]
    },
    {
        origem: 'Centro',
        destino: 'Hospital',
        style: { color: '#f4a261', weight: 5, opacity: 0.85, dashArray: null },
        coordinates: [
            [-47.8828, -15.7939],
            [-47.8822, -15.7942]
        ]
    },
    {
        origem: 'Centro',
        destino: 'Rodovia',
        style: { color: '#457b9d', weight: 5, opacity: 0.85, dashArray: '6 4' },
        coordinates: [
            [-47.8828, -15.7939],
            [-47.8919, -15.7985]
        ]
    },
    {
        origem: 'Rodovia',
        destino: 'Universidade',
        style: { color: '#2a9d8f', weight: 5, opacity: 0.85, dashArray: '8 4' },
        coordinates: [
            [-47.8919, -15.7985],
            [-47.8713, -15.7636]
        ]
    },
    {
        origem: 'Rodovia',
        destino: 'Hospital',
        style: { color: '#f4a261', weight: 5, opacity: 0.85, dashArray: null },
        coordinates: [
            [-47.8919, -15.7985],
            [-47.8822, -15.7942]
        ]
    },
    {
        origem: 'Rodovia',
        destino: 'Shopping',
        style: { color: '#1d3557', weight: 5, opacity: 0.85, dashArray: '10 4' },
        coordinates: [
            [-47.8919, -15.7985],
            [-47.9564, -15.8319]
        ]
    },
    {
        origem: 'Shopping',
        destino: 'Hospital',
        style: { color: '#f4a261', weight: 5, opacity: 0.85, dashArray: null },
        coordinates: [
            [-47.9564, -15.8319],
            [-47.8822, -15.7942]
        ]
    },
    {
        origem: 'Shopping',
        destino: 'Aeroporto',
        style: { color: '#e63946', weight: 5, opacity: 0.85, dashArray: '8 4' },
        coordinates: [
            [-47.9564, -15.8319],
            [-47.9182, -15.8703]
        ]
    },
    {
        origem: 'Shopping',
        destino: 'Centro',
        style: { color: '#6d597a', weight: 5, opacity: 0.85, dashArray: '6 3' },
        coordinates: [
            [-47.9564, -15.8319],
            [-47.8828, -15.7939]
        ]
    },
    {
        origem: 'Aeroporto',
        destino: 'Hospital',
        style: { color: '#ff7b00', weight: 5, opacity: 0.85, dashArray: '5 5' },
        coordinates: [
            [-47.9182, -15.8703],
            [-47.8822, -15.7942]
        ]
    },
    {
        origem: 'Universidade',
        destino: 'Parque',
        style: { color: '#06d6a0', weight: 5, opacity: 0.85, dashArray: null },
        coordinates: [
            [-47.8713, -15.7636],
            [-47.9055, -15.7854]
        ]
    },
    {
        origem: 'Parque',
        destino: 'Centro',
        style: { color: '#118ab2', weight: 5, opacity: 0.85, dashArray: '4 4' },
        coordinates: [
            [-47.9055, -15.7854],
            [-47.8828, -15.7939]
        ]
    }
];

const rotasEmGrafo = trechosBase.reduce((grafo, trecho) => {
    registrarRotaIdaVolta(grafo, trecho);
    return grafo;
}, {});

export default rotasEmGrafo;
