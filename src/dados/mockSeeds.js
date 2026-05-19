/**
 * mockSeeds.js
 * Injeta utilizadores de teste em gyro.auth.users sem exigir documentData.
 * Executado uma vez no arranque da aplicação (main.js).
 */

const CHAVE_USUARIOS = 'gyro.auth.users';

const MOCK_USERS = [
    {
        id: 'mock-passageiro-001',
        name: 'Maria Andrade',
        email: 'passageiro@teste.com',
        password: '123456',
        role: 'passageiro',
        phone: '+244 923 000 001',
        avatar: null,
        emailVerified: true,
        phoneVerified: true,
        documentData: { scanId: 'mock-doc-passageiro', type: 'BI', number: '000000001LA041' },
        createdAt: '2026-01-10T08:00:00.000Z',
        _isMock: true,
    },
    {
        id: 'mock-motorista-001',
        name: 'António Silva',
        email: 'motorista@teste.com',
        password: '123456',
        role: 'motorista',
        phone: '+244 923 000 002',
        avatar: null,
        emailVerified: true,
        phoneVerified: true,
        documentData: { scanId: 'mock-doc-motorista', type: 'BI', number: '000000002LA041' },
        createdAt: '2026-01-10T08:05:00.000Z',
        subscriptionStart: '2026-01-10T08:05:00.000Z',
        subscriptionEnd: '2027-01-10T08:05:00.000Z',
        _isMock: true,
    },
];

export const CREDENCIAIS_MOCK = [
    { label: 'Passageiro', email: 'passageiro@teste.com', password: '123456', role: 'passageiro' },
    { label: 'Motorista',  email: 'motorista@teste.com',  password: '123456', role: 'motorista'  },
];

export function semeiarUtilizadoresMock() {
    try {
        const raw = localStorage.getItem(CHAVE_USUARIOS);
        const existentes = raw ? JSON.parse(raw) : [];

        const mockIds = new Set(MOCK_USERS.map(u => u.id));
        const semMocks = existentes.filter(u => !mockIds.has(u.id));

        localStorage.setItem(CHAVE_USUARIOS, JSON.stringify([...semMocks, ...MOCK_USERS]));
    } catch {
        // silêncio se localStorage estiver indisponível
    }
}
