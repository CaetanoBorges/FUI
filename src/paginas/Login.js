import { authenticateUser, getCurrentUser, logoutUser } from '../dados/authStorage.js';

let loginSubmitHandler = null;
let loginLogoutHandler = null;
let loginRedirectTimer = null;

function getRoleLabel(role = 'passageiro') {
    return role === 'motorista' ? 'Motorista' : 'Passageiro';
}

function buildLoggedState(user, rotaAtual) {
    const firstName = user.name.split(' ')[0];
    const roleLabel = getRoleLabel(user.role);

    return `
        <main class="auth-shell auth-shell-scrollable">
            <section class="auth-card auth-card-compact">
                <div class="auth-badge"><i class="fa-solid fa-circle-check"></i> Sessão ativa</div>
                <h1>Olá, ${firstName}.</h1>
                <p class="auth-subtitle">Perfil atual: <strong>${roleLabel}</strong>. Você já está conectado e pode continuar usando o app.</p>
                <div class="auth-inline-actions">
                    <a href="#/" class="auth-submit">Ir para a Home</a>
                    <button type="button" class="auth-submit auth-submit-secondary" id="logout-current-user">Sair</button>
                </div>
            </section>
        </main>
    `;
}

function buildLoginForm(rotaAtual) {
    return `
        <main class="auth-shell auth-shell-scrollable">
            <section class="auth-card">
                <form class="auth-form" id="login-form">
                    <div class="auth-login-brand" aria-label="Logo FUI">
                        <div class="auth-login-logo">F<span>UI</span></div>
                    </div>

                    <label class="auth-field">
                        <span>E-mail</span>
                        <input type="email" name="email" placeholder="voce@email.com" autocomplete="email" required />
                    </label>

                    <label class="auth-field">
                        <span>Senha</span>
                        <input type="password" name="password" placeholder="Digite sua senha" autocomplete="current-password" required />
                    </label>

                    <div id="login-feedback" class="auth-alert" role="status" aria-live="polite"></div>

                    <button type="submit" class="auth-submit">Entrar</button>

                    <p class="auth-helper">
                        Ainda não tem conta?
                        <a href="#/cadastro">Criar cadastro</a>
                    </p>
                </form>
            </section>
        </main>
    `;
}

export default function Login(rotaAtual = '/login') {
    const currentUser = getCurrentUser();

    return {
        html: currentUser ? buildLoggedState(currentUser, rotaAtual) : buildLoginForm(rotaAtual),
        init() {
            const logoutButton = document.getElementById('logout-current-user');
            if (logoutButton) {
                loginLogoutHandler = () => {
                    logoutUser();
                    window.location.hash = '#/login';
                };
                logoutButton.addEventListener('click', loginLogoutHandler);
            }

            const form = document.getElementById('login-form');
            if (!form) {
                document.dispatchEvent(new CustomEvent('app:ready'));
                return;
            }

            const feedback = document.getElementById('login-feedback');
            loginSubmitHandler = event => {
                event.preventDefault();

                const formData = new FormData(form);
                const email = String(formData.get('email') || '');
                const password = String(formData.get('password') || '');

                feedback.className = 'auth-alert';
                feedback.textContent = '';

                try {
                    const user = authenticateUser({ email, password });
                    feedback.classList.add('auth-alert-success');
                    feedback.textContent = `Bem-vindo, ${user.name.split(' ')[0]}! Perfil: ${getRoleLabel(user.role)}. Redirecionando...`;
                    form.reset();

                    loginRedirectTimer = window.setTimeout(() => {
                        window.location.hash = '#/';
                    }, 900);
                } catch (error) {
                    feedback.classList.add('auth-alert-error');
                    feedback.textContent = error.message;
                }
            };

            form.addEventListener('submit', loginSubmitHandler);
            document.dispatchEvent(new CustomEvent('app:ready'));
        },
        destroy() {
            if (loginRedirectTimer) {
                clearTimeout(loginRedirectTimer);
                loginRedirectTimer = null;
            }

            const form = document.getElementById('login-form');
            if (form && loginSubmitHandler) {
                form.removeEventListener('submit', loginSubmitHandler);
            }
            loginSubmitHandler = null;

            const logoutButton = document.getElementById('logout-current-user');
            if (logoutButton && loginLogoutHandler) {
                logoutButton.removeEventListener('click', loginLogoutHandler);
            }
            loginLogoutHandler = null;
        }
    };
}
