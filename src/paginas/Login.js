import { autenticarUsuario, obterUsuarioAtual, deslogarUsuario } from '../dados/authStorage.js';
import './Login.css';

let loginHandlerEnviar = null;
let loginHandlerSair = null;
let loginTimerRedirecionamento = null;

function obterRotuloPerfil(role = 'passageiro') {
    return role === 'motorista' ? 'Motorista' : 'Passageiro';
}

function montarEstadoLogado(user, rotaAtual) {
    const primeiroNome = (user.name || user.email || 'Utilizador').split(' ')[0];
    const rotuloPerfil = obterRotuloPerfil(user.role);

    return `
        <main class="auth-shell auth-shell-scrollable">
            <section class="auth-card auth-card-compact">
                <div class="auth-login-brand" aria-label="Logo GIRO">
                    <div class="auth-login-logo"><img class="auth-logo-full" src="/giro.svg" alt="GIRO" /></div>
                </div>
                <div class="auth-badge"><i class="fa-solid fa-circle-check"></i> Sessão ativa</div>
                <h1>Olá, ${primeiroNome}.</h1>
                <p class="auth-subtitle">Perfil atual: <strong>${rotuloPerfil}</strong>. Você já está conectado e pode continuar usando o app.</p>
                <div class="auth-inline-actions">
                    <a href="#/" class="auth-submit">Ir para a Home</a>
                    <button type="button" class="auth-submit auth-submit-secondary" id="logout-current-user">Sair</button>
                </div>
            </section>
        </main>
    `;
}

function montarFormularioLogin(rotaAtual) {
    return `
        <main class="auth-shell auth-shell-scrollable">
            <section class="auth-card">
                <form class="auth-form" id="login-formulario">
                    <div class="auth-login-brand" aria-label="Logo GIRO">
                        <div class="auth-login-logo"><img class="auth-logo-full" src="/giro.svg" alt="GIRO" /></div>
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
    const usuarioAtual = obterUsuarioAtual();

    return {
        html: usuarioAtual ? montarEstadoLogado(usuarioAtual, rotaAtual) : montarFormularioLogin(rotaAtual),
        init() {
            const botaoSair = document.getElementById('logout-current-user');
            if (botaoSair) {
                loginHandlerSair = () => {
                    deslogarUsuario();
                    window.location.hash = '#/login';
                };
                botaoSair.addEventListener('click', loginHandlerSair);
            }

            const formulario = document.getElementById('login-formulario');
            if (!formulario) {
                document.dispatchEvent(new CustomEvent('app:ready'));
                return;
            }

            const feedback = document.getElementById('login-feedback');
            loginHandlerEnviar = event => {
                event.preventDefault();

                const formData = new FormData(formulario);
                const email = String(formData.get('email') || '');
                const password = String(formData.get('password') || '');

                feedback.className = 'auth-alert';
                feedback.textContent = '';

                try {
                    const user = autenticarUsuario({ email, password });
                    feedback.classList.add('auth-alert-success');
                    feedback.textContent = `Bem-vindo, ${user.name.split(' ')[0]}! Perfil: ${obterRotuloPerfil(user.role)}. Redirecionando...`;
                    formulario.reset();

                    loginTimerRedirecionamento = window.setTimeout(() => {
                        window.location.hash = '#/';
                    }, 900);
                } catch (error) {
                    feedback.classList.add('auth-alert-error');
                    feedback.textContent = error.message;
                }
            };

            formulario.addEventListener('submit', loginHandlerEnviar);
            document.dispatchEvent(new CustomEvent('app:ready'));
        },
        destroy() {
            if (loginTimerRedirecionamento) {
                clearTimeout(loginTimerRedirecionamento);
                loginTimerRedirecionamento = null;
            }

            const formulario = document.getElementById('login-formulario');
            if (formulario && loginHandlerEnviar) {
                formulario.removeEventListener('submit', loginHandlerEnviar);
            }
            loginHandlerEnviar = null;

            const botaoSair = document.getElementById('logout-current-user');
            if (botaoSair && loginHandlerSair) {
                botaoSair.removeEventListener('click', loginHandlerSair);
            }
            loginHandlerSair = null;
        }
    };
}
