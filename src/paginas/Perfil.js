import Header from '../componentes/Header.js';
import { getCurrentUser, deleteUser } from '../dados/authStorage.js';
import './Perfil.css';

const MODAL_ID = 'perfil-delete-modal';

function getInitials(name = '') {
    return name
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
}

function getRoleLabel(role = '') {
    return role === 'motorista' ? 'Motorista' : 'Passageiro';
}

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('pt-AO', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    } catch {
        return iso;
    }
}

function buildGuestPage(rotaAtual) {
    return `
        ${Header('Perfil', rotaAtual, true)}
        <main class="perfil-shell">
            <div class="perfil-container">
                <div class="perfil-page-header">
                    <span class="perfil-eyebrow">A minha conta</span>
                    <h1 class="perfil-title">Perfil</h1>
                </div>
                <div class="perfil-card">
                    <div class="perfil-card-top" style="justify-content:center;flex-direction:column;text-align:center;gap:0.75rem;padding:2.5rem 1.5rem;">
                        <div class="perfil-avatar" style="margin:0 auto;font-size:1.8rem;">?</div>
                        <p style="color:#7d8590;font-size:0.92rem;margin:0;">Precisas de iniciar sessão para ver o teu perfil.</p>
                        <a href="#/login" class="perfil-btn-delete" style="align-self:center;border-color:#58a6ff;color:#58a6ff;">
                            <i class="fa-solid fa-right-to-bracket"></i>Entrar
                        </a>
                    </div>
                </div>
            </div>
        </main>
    `;
}

function buildPage(user, rotaAtual) {
    const initials = getInitials(user.name);
    const roleLabel = getRoleLabel(user.role);

    return `
        ${Header('Perfil', rotaAtual, true)}
        <main class="perfil-shell">
            <div class="perfil-container">

                <div class="perfil-page-header">
                    <span class="perfil-eyebrow">A minha conta</span>
                    <h1 class="perfil-title">Perfil</h1>
                </div>

                <div class="perfil-card">
                    <div class="perfil-card-top">
                        <div class="perfil-avatar">${initials}</div>
                        <div class="perfil-name-block">
                            <span class="perfil-name">${user.name}</span>
                            <span class="perfil-role-badge">
                                <i class="fa-solid ${user.role === 'motorista' ? 'fa-steering-wheel' : 'fa-user'}"></i>
                                ${roleLabel}
                            </span>
                        </div>
                    </div>

                    <div class="perfil-info-list">
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-envelope"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">E-mail</span>
                                <span class="perfil-info-value">${user.email}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-phone"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Telefone</span>
                                <span class="perfil-info-value">${user.phone || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-id-card"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Nº de identificação</span>
                                <span class="perfil-info-value">${user.idNumber || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-cake-candles"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Data de nascimento</span>
                                <span class="perfil-info-value">${user.birthdate ? formatDate(user.birthdate) : '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-venus-mars"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Género</span>
                                <span class="perfil-info-value">${user.gender || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-map-location-dot"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Província</span>
                                <span class="perfil-info-value">${user.province || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-location-dot"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Município</span>
                                <span class="perfil-info-value">${user.municipality || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-shield-halved"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Tipo de conta</span>
                                <span class="perfil-info-value">${roleLabel}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-calendar-plus"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Membro desde</span>
                                <span class="perfil-info-value">${formatDate(user.createdAt ?? null)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Zona de perigo -->
                <div class="perfil-danger-card">
                    <div class="perfil-danger-title">
                        <i class="fa-solid fa-triangle-exclamation"></i>Zona de perigo
                    </div>
                    <p class="perfil-danger-desc">
                        Apagar a conta é permanente. Todos os dados associados serão removidos e não poderás recuperar o acesso.
                    </p>
                    <button type="button" class="perfil-btn-delete" id="perfil-open-delete">
                        <i class="fa-solid fa-trash-can"></i>Apagar conta
                    </button>
                </div>

            </div>
        </main>

        <!-- Modal de confirmação -->
        <div class="perfil-modal-backdrop" id="${MODAL_ID}" role="dialog" aria-modal="true" aria-labelledby="perfil-modal-title">
            <div class="perfil-modal">
                <div class="perfil-modal-icon"><i class="fa-solid fa-trash-can"></i></div>
                <h2 class="perfil-modal-title" id="perfil-modal-title">Apagar conta?</h2>
                <p class="perfil-modal-desc">
                    Esta ação é irreversível. Confirma a tua <strong style="color:#e6edf3;">senha</strong> para continuar.
                </p>
                <div>
                    <label class="perfil-modal-label" for="perfil-confirm-password">Senha</label>
                    <input
                        type="password"
                        id="perfil-confirm-password"
                        class="perfil-modal-input"
                        placeholder="••••••"
                        autocomplete="current-password"
                    />
                    <span class="perfil-modal-error" id="perfil-delete-error"></span>
                </div>
                <div class="perfil-modal-actions">
                    <button type="button" class="perfil-modal-btn-cancel" id="perfil-cancel-delete">Cancelar</button>
                    <button type="button" class="perfil-modal-btn-confirm" id="perfil-confirm-delete">
                        <i class="fa-solid fa-trash-can"></i>Apagar
                    </button>
                </div>
            </div>
        </div>
    `;
}

export default function Perfil(rotaAtual = '/perfil') {
    const user = getCurrentUser();
    const html = user ? buildPage(user, rotaAtual) : buildGuestPage(rotaAtual);

    let handlers = [];

    function addHandler(el, event, fn) {
        if (!el) return;
        el.addEventListener(event, fn);
        handlers.push({ el, event, fn });
    }

    function openModal() {
        const modal = document.getElementById(MODAL_ID);
        const input = document.getElementById('perfil-confirm-password');
        const error = document.getElementById('perfil-delete-error');
        if (!modal) return;
        if (input) input.value = '';
        if (error) { error.textContent = ''; error.classList.remove('is-visible'); }
        modal.classList.add('is-visible');
        setTimeout(() => input?.focus(), 60);
    }

    function closeModal() {
        const modal = document.getElementById(MODAL_ID);
        if (modal) modal.classList.remove('is-visible');
    }

    function handleConfirmDelete() {
        const input = document.getElementById('perfil-confirm-password');
        const errorEl = document.getElementById('perfil-delete-error');
        const confirmBtn = document.getElementById('perfil-confirm-delete');
        const password = input?.value ?? '';

        if (!password) {
            if (errorEl) { errorEl.textContent = 'Introduz a tua senha.'; errorEl.classList.add('is-visible'); }
            input?.focus();
            return;
        }

        if (confirmBtn) confirmBtn.disabled = true;

        try {
            deleteUser({ email: user.email, password });
            window.location.hash = '#/login';
        } catch (err) {
            if (errorEl) { errorEl.textContent = err.message; errorEl.classList.add('is-visible'); }
            if (input) { input.value = ''; input.focus(); }
            if (confirmBtn) confirmBtn.disabled = false;
        }
    }

    function handleBackdropClick(e) {
        if (e.target.id === MODAL_ID) closeModal();
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'Enter' && document.getElementById(MODAL_ID)?.classList.contains('is-visible')) {
            handleConfirmDelete();
        }
    }

    return {
        html,
        init() {
            if (!user) return;

            addHandler(document.getElementById('perfil-open-delete'), 'click', openModal);
            addHandler(document.getElementById('perfil-cancel-delete'), 'click', closeModal);
            addHandler(document.getElementById('perfil-confirm-delete'), 'click', handleConfirmDelete);
            addHandler(document.getElementById(MODAL_ID), 'click', handleBackdropClick);
            addHandler(document, 'keydown', handleKeyDown);
        },
        destroy() {
            handlers.forEach(({ el, event, fn }) => el?.removeEventListener(event, fn));
            handlers = [];
        }
    };
}
