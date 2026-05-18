import { registrarUsuario } from '../dados/authStorage.js';
import './Cadastro.css';

const CHAVE_SCAN = 'cadastro_scan_data';

function obterRotuloPerfil(role = 'passageiro') {
    return role === 'motorista' ? 'Motorista' : 'Passageiro';
}

function montarHtml(campos) {
    return `
        <main class="auth-shell auth-shell-scrollable cadastro-simple">
            <section class="auth-card">
                <div class="auth-login-brand" aria-label="Logo GIRO">
                    <div class="auth-login-logo"><img class="auth-logo-full" src="/giro.svg" alt="GIRO" /></div>
                </div>

                <div class="c2-progress-wrap">
                    <div class="c2-progress-track"><div class="c2-progress-fill"></div></div>
                    <span class="c2-progress-label">Etapa 2 de 2 — quase lá!</span>
                </div>

                <form class="auth-step-card is-active c2-form" id="cadastro-form">
                    <input type="hidden" name="name" value="${campos.nome || ''}" />

                    <div class="auth-step-header">
                        <span class="auth-step-number">2</span>
                        <div>
                            <h2>Confirmar &amp; criar conta</h2>
                            <p class="auth-step-description">Verifique os dados do seu Bilhete e finalize o cadastro.</p>
                        </div>
                    </div>

                    <div class="c2-bi-card">
                        <p class="c2-section-label">
                            <i class="fa-solid fa-id-card"></i> Bilhete de Identidade
                            <span class="c2-verified-badge"><i class="fa-solid fa-circle-check"></i> Verificado</span>
                        </p>
                        <div class="c2-bi-grid">
                            <div class="c2-bi-field c2-bi-full">
                                <span class="c2-bi-label">Nome completo</span>
                                <strong class="c2-bi-value">${campos.nome || '—'}</strong>
                            </div>
                            <div class="c2-bi-field">
                                <span class="c2-bi-label">N.º do Bilhete</span>
                                <strong class="c2-bi-value">${campos.numero || '—'}</strong>
                            </div>
                            <div class="c2-bi-field">
                                <span class="c2-bi-label">Nascimento</span>
                                <strong class="c2-bi-value">${campos.nascimento || '—'}</strong>
                            </div>
                            <div class="c2-bi-field">
                                <span class="c2-bi-label">Género</span>
                                <strong class="c2-bi-value">${campos.genero || '—'}</strong>
                            </div>
                            <div class="c2-bi-field">
                                <span class="c2-bi-label">Estado Civil</span>
                                <strong class="c2-bi-value">${campos.estado || '—'}</strong>
                            </div>
                            <div class="c2-bi-field">
                                <span class="c2-bi-label">Província</span>
                                <strong class="c2-bi-value">${campos.provincia || '—'}</strong>
                            </div>
                            <div class="c2-bi-field">
                                <span class="c2-bi-label">Validade</span>
                                <strong class="c2-bi-value">${campos.validade || '—'}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="c2-account-section">
                        <p class="c2-section-label"><i class="fa-solid fa-lock"></i> Dados da conta</p>
                        <label class="auth-field">
                            <span>E-mail</span>
                            <input type="email" name="email" id="cadastro-email"
                                   placeholder="seu@email.com" required autocomplete="email" />
                        </label>
                        <label class="auth-field">
                            <span>Senha</span>
                            <input type="password" name="password" id="cadastro-password"
                                   placeholder="Mínimo 6 caracteres" required autocomplete="new-password" />
                        </label>
                    </div>

                    <fieldset class="auth-choice-group c2-role-group">
                        <legend>Tipo de perfil</legend>
                        <label class="auth-choice-card">
                            <input type="radio" name="role" value="passageiro" checked />
                            <div class="auth-choice-content">
                                <strong><i class="fa-solid fa-user"></i>&ensp;Passageiro</strong>
                                <small>Solicite corridas e acompanhe o motorista em tempo real.</small>
                            </div>
                        </label>
                        <label class="auth-choice-card">
                            <input type="radio" name="role" value="motorista" />
                            <div class="auth-choice-content">
                                <strong><i class="fa-solid fa-car"></i>&ensp;Motorista</strong>
                                <small>Aceite corridas e gerencie seus ganhos.</small>
                            </div>
                        </label>
                    </fieldset>

                    <div id="cadastro-feedback" class="auth-alert" role="status" aria-live="polite"></div>

                    <div class="auth-actions-row">
                        <button type="button" class="auth-submit auth-submit-secondary auth-submit-inline" id="cadastro-back-button">
                            <i class="fa-solid fa-arrow-left"></i>&ensp;Voltar
                        </button>
                        <button type="submit" class="auth-submit auth-submit-inline c2-submit-btn" id="cadastro-submit-button">
                            Criar conta&ensp;<i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>

                    <p class="auth-helper">Já tem conta? <a href="#/login">Entrar agora</a></p>
                </form>
            </section>
        </main>
    `;
}

export default function CadastroEtapa2() {
    const rawScan = sessionStorage.getItem(CHAVE_SCAN);
    let scanData = null;

    if (rawScan) {
        try { scanData = JSON.parse(rawScan); } catch { scanData = null; }
    }

    if (!scanData?.scanId) {
        window.location.hash = '#/cadastro';
        return { html: '', init() {}, destroy() {} };
    }

    const campos = scanData.campos || {};
    let handlerEnviar = null;
    let handlerVoltar = null;
    let timerRedirecionamento = null;

    return {
        html: montarHtml(campos),
        init() {
            const form = document.getElementById('cadastro-form');
            if (!form) {
                document.dispatchEvent(new CustomEvent('app:ready'));
                return;
            }

            handlerVoltar = () => {
                window.location.hash = '#/cadastro';
            };
            document.getElementById('cadastro-back-button')?.addEventListener('click', handlerVoltar);

            handlerEnviar = (event) => {
                event.preventDefault();
                const feedback = document.getElementById('cadastro-feedback');
                const formData = new FormData(form);
                const name     = String(formData.get('name') || '');
                const email    = String(formData.get('email') || '');
                const role     = String(formData.get('role') || 'passageiro');
                const password = String(formData.get('password') || '');

                feedback.className = 'auth-alert';
                feedback.textContent = '';

                try {
                    const user = registrarUsuario({
                        name,
                        email,
                        password,
                        role,
                        documentData: {
                            scanId: scanData.scanId,
                            campos: scanData.campos,
                            extractedData: scanData.extractedData,
                            createdAt: new Date().toISOString()
                        }
                    });

                    sessionStorage.removeItem(CHAVE_SCAN);

                    feedback.className = 'auth-alert auth-alert-success';
                    feedback.textContent = `Conta criada com sucesso, ${user.name.split(' ')[0]}! Perfil: ${obterRotuloPerfil(user.role)}.`;

                    timerRedirecionamento = window.setTimeout(() => {
                        window.location.hash = '#/';
                    }, 900);
                } catch (error) {
                    feedback.className = 'auth-alert auth-alert-error';
                    feedback.textContent = error.message;
                }
            };

            form.addEventListener('submit', handlerEnviar);
            document.dispatchEvent(new CustomEvent('app:ready'));
        },
        destroy() {
            if (timerRedirecionamento) {
                clearTimeout(timerRedirecionamento);
                timerRedirecionamento = null;
            }

            const form = document.getElementById('cadastro-form');
            if (form && handlerEnviar) {
                form.removeEventListener('submit', handlerEnviar);
            }
            handlerEnviar = null;

            const backBtn = document.getElementById('cadastro-back-button');
            if (backBtn && handlerVoltar) {
                backBtn.removeEventListener('click', handlerVoltar);
            }
            handlerVoltar = null;
        }
    };
}
