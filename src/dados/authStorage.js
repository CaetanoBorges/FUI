const USERS_KEY = 'fui.auth.users';
const SESSION_KEY = 'fui.auth.current';

const DEFAULT_ROLE = 'passageiro';

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

function normalizeEmail(email = '') {
    return email.trim().toLowerCase();
}

function normalizeRole(role = '') {
    return role === 'motorista' ? 'motorista' : DEFAULT_ROLE;
}

function buildSession(user) {
    return {
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role)
    };
}

export function getUsers() {
    return readJson(USERS_KEY, []);
}

export function getCurrentUser() {
    return readJson(SESSION_KEY, null);
}

export function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
}

export function registerUser({ name, email, password, role, documentData }) {
    const normalizedName = name.trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password.trim();
    const normalizedRole = normalizeRole(role);

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
        throw new Error('Preencha todos os campos.');
    }

    if (!documentData?.scanId) {
        throw new Error('Escaneie o bilhete antes de concluir o cadastro.');
    }

    if (normalizedPassword.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    const users = getUsers();
    const exists = users.some(user => user.email === normalizedEmail);

    if (exists) {
        throw new Error('Este e-mail já está cadastrado.');
    }

    const user = {
        id: Date.now(),
        name: normalizedName,
        email: normalizedEmail,
        password: normalizedPassword,
        role: normalizedRole,
        documentData,
        createdAt: new Date().toISOString()
    };

    users.push(user);
    writeJson(USERS_KEY, users);
    writeJson(SESSION_KEY, buildSession(user));

    return buildSession(user);
}

export function authenticateUser({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
        throw new Error('Informe e-mail e senha.');
    }

    const user = getUsers().find(
        savedUser => savedUser.email === normalizedEmail && savedUser.password === normalizedPassword
    );

    if (!user) {
        throw new Error('E-mail ou senha inválidos.');
    }

    const session = buildSession(user);
    writeJson(SESSION_KEY, session);
    return session;
}
