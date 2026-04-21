const ACTIVE_RIDE_KEY = 'gyro.ride.active';

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
