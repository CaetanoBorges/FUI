const CHAVE_CORRIDA_DRIVER_ATIVA = 'gyro.ride.driver.active';
const CHAVE_HISTORICO_DRIVER     = 'gyro.rides.driver.history';

function lerJson(chave, padrao) {
    try {
        const valor = localStorage.getItem(chave);
        return valor ? JSON.parse(valor) : padrao;
    } catch {
        return padrao;
    }
}

function escreverJson(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}

export function obterCorridaDriverAtiva() {
    return lerJson(CHAVE_CORRIDA_DRIVER_ATIVA, null);
}

export function salvarCorridaDriverAtiva(corrida) {
    escreverJson(CHAVE_CORRIDA_DRIVER_ATIVA, corrida);
    return corrida;
}

export function limparCorridaDriverAtiva() {
    localStorage.removeItem(CHAVE_CORRIDA_DRIVER_ATIVA);
}

export function listarHistoricoDriver() {
    return lerJson(CHAVE_HISTORICO_DRIVER, [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function salvarCorridaDriverNoHistorico(corrida) {
    const lista = lerJson(CHAVE_HISTORICO_DRIVER, []).filter(c => c.id !== corrida.id);
    escreverJson(CHAVE_HISTORICO_DRIVER, [corrida, ...lista]);
}

function criarData(diasOffset, hora = 9, minuto = 0) {
    const d = new Date('2026-05-10T00:00:00');
    d.setDate(d.getDate() + diasOffset);
    d.setHours(hora, minuto, 0, 0);
    return d.toISOString();
}

const SEED_HISTORICO_DRIVER = [
    {
        id: 'DR-SEED-001',
        createdAt: criarData(-1, 8, 15),
        status: 'completed',
        passenger: { name: 'Ana Ferreira', initials: 'AF', rating: 4.8 },
        routeSummary: 'Rocha Pinto → Talatona',
        estimatedDistance: '9,2 km',
        earnings: 'Kz 950,00',
        earningsRaw: 950,
        duration: '22 min',
    },
    {
        id: 'DR-SEED-002',
        createdAt: criarData(-1, 11, 40),
        status: 'completed',
        passenger: { name: 'João Cardoso', initials: 'JC', rating: 4.5 },
        routeSummary: 'Viana → Aeroporto 4 de Fevereiro',
        estimatedDistance: '18,7 km',
        earnings: 'Kz 1.850,00',
        earningsRaw: 1850,
        duration: '34 min',
    },
    {
        id: 'DR-SEED-003',
        createdAt: criarData(-2, 14, 5),
        status: 'cancelled',
        passenger: { name: 'Maria Costa', initials: 'MC', rating: 3.9 },
        routeSummary: 'Benfica → Cacuaco',
        estimatedDistance: '14,1 km',
        earnings: 'Kz 0,00',
        earningsRaw: 0,
        duration: null,
    },
    {
        id: 'DR-SEED-004',
        createdAt: criarData(-3, 9, 0),
        status: 'completed',
        passenger: { name: 'Pedro Lopes', initials: 'PL', rating: 5.0 },
        routeSummary: 'Rangel → Miramar',
        estimatedDistance: '6,3 km',
        earnings: 'Kz 680,00',
        earningsRaw: 680,
        duration: '18 min',
    },
    {
        id: 'DR-SEED-005',
        createdAt: criarData(-3, 16, 50),
        status: 'completed',
        passenger: { name: 'Sofia Nunes', initials: 'SN', rating: 4.7 },
        routeSummary: 'Sambizanga → Ingombota',
        estimatedDistance: '5,8 km',
        earnings: 'Kz 620,00',
        earningsRaw: 620,
        duration: '15 min',
    },
    {
        id: 'DR-SEED-006',
        createdAt: criarData(-5, 7, 30),
        status: 'completed',
        passenger: { name: 'Rui Teixeira', initials: 'RT', rating: 4.9 },
        routeSummary: 'Patriota → Alvalade',
        estimatedDistance: '11,4 km',
        earnings: 'Kz 1.100,00',
        earningsRaw: 1100,
        duration: '25 min',
    },
    {
        id: 'DR-SEED-007',
        createdAt: criarData(-6, 13, 20),
        status: 'completed',
        passenger: { name: 'Fernanda Dias', initials: 'FD', rating: 4.6 },
        routeSummary: 'Cazenga → Maianga',
        estimatedDistance: '7,9 km',
        earnings: 'Kz 810,00',
        earningsRaw: 810,
        duration: '20 min',
    },
];

const CHAVE_PENDENTE_REVIEW = 'gyro.ride.driver.pending_review';

export function salvarCorridaDriverPendenteReview(corrida) {
    localStorage.setItem(CHAVE_PENDENTE_REVIEW, JSON.stringify(corrida));
}

export function obterCorridaDriverPendenteReview() {
    try {
        const v = localStorage.getItem(CHAVE_PENDENTE_REVIEW);
        return v ? JSON.parse(v) : null;
    } catch { return null; }
}

export function limparCorridaDriverPendenteReview() {
    localStorage.removeItem(CHAVE_PENDENTE_REVIEW);
}

export function inicializarHistoricoDriver() {
    const existente = lerJson(CHAVE_HISTORICO_DRIVER, []);
    if (existente.length > 0) return;
    escreverJson(CHAVE_HISTORICO_DRIVER, SEED_HISTORICO_DRIVER);
}
