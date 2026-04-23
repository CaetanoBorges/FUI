const ACTIVE_RIDE_KEY    = 'gyro.ride.active';
const SCHEDULED_LIST_KEY = 'gyro.rides.scheduled';
const HISTORY_KEY        = 'gyro.rides.history';

function readJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getActiveRide() {
    return readJson(ACTIVE_RIDE_KEY, null);
}

export function saveActiveRide(ride) {
    writeJson(ACTIVE_RIDE_KEY, ride);
    return ride;
}

export function clearActiveRide() {
    localStorage.removeItem(ACTIVE_RIDE_KEY);
}

export function listRideHistory() {
    const list = readJson(HISTORY_KEY, []);
    return list.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function saveRideToHistory(ride) {
    const list = readJson(HISTORY_KEY, []).filter(r => r.id !== ride.id);
    writeJson(HISTORY_KEY, [ride, ...list]);
}

export function seedRideHistory() {
    const existing = readJson(HISTORY_KEY, []);
    if (existing.length > 0) return;
    writeJson(HISTORY_KEY, SEED_HISTORY);
}

export function listScheduledRides() {
    const list = readJson(SCHEDULED_LIST_KEY, []);
    return list.slice().sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
}

export function saveScheduledRide(ride) {
    const list = listScheduledRides().filter(r => r.id !== ride.id);
    writeJson(SCHEDULED_LIST_KEY, [ride, ...list]);
}

export function removeScheduledRideById(id) {
    const list = listScheduledRides().filter(r => r.id !== id);
    writeJson(SCHEDULED_LIST_KEY, list);
}

export function cancelScheduledRideById(id, cancelReason = null) {
    const list = listScheduledRides().map(r =>
        r.id === id ? { ...r, status: 'cancelled', ...(cancelReason ? { cancelReason } : {}) } : r
    );
    writeJson(SCHEDULED_LIST_KEY, list);
}

function makeDate(daysFromNow, hour = 9, minute = 0) {
    const d = new Date('2026-04-21T00:00:00');
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}

const SEED_RIDES = [
    {
        id: 'CR-SEED-001',
        createdAt: makeDate(-13),
        status: 'active',
        when: 'agendar',
        whenLabel: '22/04/2026 08:30',
        scheduledAt: makeDate(1, 8, 30),
        routeSummary: 'Aeroporto Internacional 4 de Fevereiro → Sambizanga',
        passengers: 2,
        vehicle: 'carro',
        vehicleLabel: 'Carro • 2 passageiros',
        estimatedPrice: 'Kz 1.250,00',
        estimatedDistance: '12,4 km',
        estimatedDuration: '00:28:00',
        stops: ['Aeroporto Internacional 4 de Fevereiro', 'Sambizanga'],
        driver: { name: 'Carlos Mendes', phone: '+244923456789', vehicleBrand: 'Toyota Corolla', vehicleColor: 'Branco', plate: 'LD-45-67-BC', initials: 'CM' }
    },
    {
        id: 'CR-SEED-002',
        createdAt: makeDate(-10),
        status: 'active',
        when: 'agendar',
        whenLabel: '24/04/2026 14:00',
        scheduledAt: makeDate(3, 14, 0),
        routeSummary: 'Ingombota → Talatona',
        passengers: 1,
        vehicle: 'moto',
        vehicleLabel: 'Moto',
        estimatedPrice: 'Kz 620,00',
        estimatedDistance: '8,7 km',
        estimatedDuration: '00:18:00',
        stops: ['Ingombota', 'Talatona'],
        driver: { name: 'Manuel da Silva', phone: '+244912345678', vehicleBrand: 'Honda CB300', vehicleColor: 'Vermelho', plate: 'LD-12-34-AB', initials: 'MS' }
    },
    {
        id: 'CR-SEED-003',
        createdAt: makeDate(-8),
        status: 'active',
        when: 'agendar',
        whenLabel: '26/04/2026 07:15',
        scheduledAt: makeDate(5, 7, 15),
        routeSummary: 'Viana → Miramar → Kilamba',
        passengers: 3,
        vehicle: 'carro',
        vehicleLabel: 'Carro • 3 passageiros',
        estimatedPrice: 'Kz 1.890,00',
        estimatedDistance: '21,3 km',
        estimatedDuration: '00:46:00',
        stops: ['Viana', 'Miramar', 'Kilamba'],
        driver: { name: 'António Ferreira', phone: '+244934567890', vehicleBrand: 'Hyundai Accent', vehicleColor: 'Cinzento', plate: 'BG-78-90-CD', initials: 'AF' }
    },
    {
        id: 'CR-SEED-004',
        createdAt: makeDate(-5),
        status: 'active',
        when: 'agendar',
        whenLabel: '28/04/2026 16:45',
        scheduledAt: makeDate(7, 16, 45),
        routeSummary: 'Maianga → Cacuaco',
        passengers: 2,
        vehicle: 'carro',
        vehicleLabel: 'Carro • 2 passageiros',
        estimatedPrice: 'Kz 980,00',
        estimatedDistance: '9,1 km',
        estimatedDuration: '00:22:00',
        stops: ['Maianga', 'Cacuaco'],
        driver: { name: 'João Baptista', phone: '+244945678901', vehicleBrand: 'Volkswagen Polo', vehicleColor: 'Prata', plate: 'HU-23-45-EF', initials: 'JB' }
    },
    {
        id: 'CR-SEED-005',
        createdAt: makeDate(-3),
        status: 'cancelled',
        when: 'agendar',
        whenLabel: '01/05/2026 10:00',
        scheduledAt: makeDate(10, 10, 0),
        routeSummary: 'Rangel → Samba',
        passengers: 1,
        vehicle: 'moto',
        vehicleLabel: 'Moto',
        estimatedPrice: 'Kz 410,00',
        estimatedDistance: '5,2 km',
        estimatedDuration: '00:12:00',
        stops: ['Rangel', 'Samba'],
        driver: { name: 'Pedro Domingos', phone: '+244956789012', vehicleBrand: 'Yamaha Factor', vehicleColor: 'Preto', plate: 'LD-99-11-GH', initials: 'PD' }
    },
    {
        id: 'CR-SEED-006',
        createdAt: makeDate(-1),
        status: 'active',
        when: 'agendar',
        whenLabel: '05/05/2026 09:00',
        scheduledAt: makeDate(14, 9, 0),
        routeSummary: 'Luanda Sul → Aeroporto Internacional 4 de Fevereiro',
        passengers: 4,
        vehicle: 'carro',
        vehicleLabel: 'Carro • 4 passageiros',
        estimatedPrice: 'Kz 2.340,00',
        estimatedDistance: '27,8 km',
        estimatedDuration: '01:02:00',
        stops: ['Luanda Sul', 'Aeroporto Internacional 4 de Fevereiro'],
        driver: { name: 'Armando Lopes', phone: '+244967890123', vehicleBrand: 'Kia Morning', vehicleColor: 'Branco', plate: 'LU-56-78-IJ', initials: 'AL' }
    }
];

function makePast(daysAgo, hour = 10, minute = 0) {
    const d = new Date('2026-04-21T00:00:00');
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}

const SEED_HISTORY = [
    {
        id: 'CR-HIST-001',
        createdAt: makePast(1, 8, 15),
        status: 'completed',
        when: 'agora',
        whenLabel: 'Agora',
        routeSummary: 'Centro → Aeroporto Internacional 4 de Fevereiro',
        passengers: 2,
        vehicle: 'carro',
        vehicleLabel: 'Carro • 2 passageiros',
        estimatedPrice: 'Kz 1.100,00',
        estimatedDistance: '14,2 km',
        estimatedDuration: '00:32:00',
        stops: ['Centro', 'Aeroporto Internacional 4 de Fevereiro'],
        driver: { name: 'Carlos Mendes', phone: '+244923456789', vehicleBrand: 'Toyota Corolla', vehicleColor: 'Branco', plate: 'LD-45-67-BC', initials: 'CM' }
    },
    {
        id: 'CR-HIST-002',
        createdAt: makePast(3, 14, 40),
        status: 'completed',
        when: 'agora',
        whenLabel: 'Agora',
        routeSummary: 'Sambizanga → Shopping Belas',
        passengers: 1,
        vehicle: 'moto',
        vehicleLabel: 'Moto',
        estimatedPrice: 'Kz 540,00',
        estimatedDistance: '7,1 km',
        estimatedDuration: '00:16:00',
        stops: ['Sambizanga', 'Shopping Belas'],
        driver: { name: 'Rui Costa', phone: '+244978901234', vehicleBrand: 'Mitsubishi Lancer', vehicleColor: 'Branco', plate: 'MA-34-56-KL', initials: 'RC' }
    },
    {
        id: 'CR-HIST-003',
        createdAt: makePast(5, 9, 0),
        status: 'cancelled',
        when: 'agora',
        whenLabel: 'Agora',
        routeSummary: 'Maianga → Talatona',
        passengers: 3,
        vehicle: 'carro',
        vehicleLabel: 'Carro • 3 passageiros',
        estimatedPrice: 'Kz 1.680,00',
        estimatedDistance: '19,4 km',
        estimatedDuration: '00:42:00',
        stops: ['Maianga', 'Talatona'],
        driver: { name: 'João Baptista', phone: '+244945678901', vehicleBrand: 'Volkswagen Polo', vehicleColor: 'Prata', plate: 'HU-23-45-EF', initials: 'JB' }
    },
    {
        id: 'CR-HIST-004',
        createdAt: makePast(8, 17, 20),
        status: 'completed',
        when: 'agora',
        whenLabel: 'Agora',
        routeSummary: 'Viana → Miramar',
        passengers: 1,
        vehicle: 'moto',
        vehicleLabel: 'Moto',
        estimatedPrice: 'Kz 390,00',
        estimatedDistance: '4,8 km',
        estimatedDuration: '00:11:00',
        stops: ['Viana', 'Miramar'],
        driver: { name: 'Pedro Domingos', phone: '+244956789012', vehicleBrand: 'Nissan Tiida', vehicleColor: 'Azul', plate: 'LD-99-11-GH', initials: 'PD' }
    },
    {
        id: 'CR-HIST-005',
        createdAt: makePast(12, 11, 5),
        status: 'completed',
        when: 'agora',
        whenLabel: 'Agora',
        routeSummary: 'Kilamba → Ingombota → Centro',
        passengers: 2,
        vehicle: 'carro',
        vehicleLabel: 'Carro • 2 passageiros',
        estimatedPrice: 'Kz 2.050,00',
        estimatedDistance: '23,7 km',
        estimatedDuration: '00:51:00',
        stops: ['Kilamba', 'Ingombota', 'Centro'],
        driver: { name: 'Manuel da Silva', phone: '+244912345678', vehicleBrand: 'Hyundai Accent', vehicleColor: 'Preto', plate: 'LD-12-34-AB', initials: 'MS' }
    },
    {
        id: 'CR-HIST-006',
        createdAt: makePast(20, 7, 45),
        status: 'cancelled',
        when: 'agora',
        whenLabel: 'Agora',
        routeSummary: 'Cacuaco → Luanda Sul',
        passengers: 1,
        vehicle: 'moto',
        vehicleLabel: 'Moto',
        estimatedPrice: 'Kz 720,00',
        estimatedDistance: '10,3 km',
        estimatedDuration: '00:21:00',
        stops: ['Cacuaco', 'Luanda Sul'],
        driver: { name: 'António Ferreira', phone: '+244934567890', vehicleBrand: 'Honda Civic', vehicleColor: 'Cinzento', plate: 'BG-78-90-CD', initials: 'AF' }
    }
];

export function seedScheduledRides() {
    const existing = readJson(SCHEDULED_LIST_KEY, []);
    if (existing.length > 0) return;
    writeJson(SCHEDULED_LIST_KEY, SEED_RIDES);
}
