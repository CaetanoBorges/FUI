import { scanBilhete } from '../dados/documentScannerApi.js';
import { obterUsuarioAtual, deslogarUsuario, registrarUsuario } from '../dados/authStorage.js';
import './Cadastro.css';

function obterRotuloPerfil(role = 'passageiro') {
    return role === 'motorista' ? 'Motorista' : 'Passageiro';
}

function obterRotuloValor(value) {
    return value ? value : 'Não identificado automaticamente';
}

function eArquivoImagem(file) {
    return file instanceof File && file.size > 0 && file.type.startsWith('image/');
}

function montarResumoEscaneamento(scanResult) {
    const data = scanResult?.extractedData || {};
    const savedFiles = scanResult?.savedFiles || {};

    return `
        <div class="auth-scan-summary-box">
            <div class="auth-scan-summary-grid">
                <article class="auth-summary-item">
                    <span class="auth-summary-label">Nome encontrado</span>
                    <strong class="auth-summary-value">${obterRotuloValor(data.name)}</strong>
                </article>
                <article class="auth-summary-item">
                    <span class="auth-summary-label">Documento</span>
                    <strong class="auth-summary-value">${obterRotuloValor(data.documentNumber)}</strong>
                </article>
                <article class="auth-summary-item">
                    <span class="auth-summary-label">Nascimento</span>
                    <strong class="auth-summary-value">${obterRotuloValor(data.birthDate)}</strong>
                </article>
                <article class="auth-summary-item">
                    <span class="auth-summary-label">Validade</span>
                    <strong class="auth-summary-value">${obterRotuloValor(data.validity)}</strong>
                </article>
            </div>
            <p class="auth-note">Arquivos salvos no backend: ${savedFiles.frontImage || '-'} e ${savedFiles.backImage || '-'}.</p>
        </div>
    `;
}

function montarEstadoLogado(user, rotaAtual) {
    const firstName = user.name.split(' ')[0];
    const roleLabel = obterRotuloPerfil(user.role);

    return `
        <main class="auth-shell auth-shell-scrollable cadastro-simple">
            <section class="auth-card auth-card-compact">
                <div class="auth-login-brand" aria-label="Logo GYRO">
                    <div class="auth-login-logo"><img class="auth-logo-full" src="/logo-gyro-road.svg" alt="GYRO" /></div>
                </div>
                <div class="auth-badge"><i class="fa-solid fa-user-check"></i> Conta pronta</div>
                <h1>${firstName}, sua conta já está ativa.</h1>
                <p class="auth-subtitle">Perfil selecionado: <strong>${roleLabel}</strong>. Se quiser, você já pode voltar para a tela principal e continuar.</p>
                <div class="auth-inline-actions">
                    <a href="#/" class="auth-submit">Voltar para a Home</a>
                    <button type="button" class="auth-submit auth-submit-secondary" id="logout-new-user">Sair</button>
                </div>
            </section>
        </main>
    `;
}

function montarFormularioCadastro(rotaAtual) {
    return `
        <main class="auth-shell auth-shell-scrollable cadastro-simple">
            <section class="auth-card">
                <div class="auth-login-brand" aria-label="Logo GIRO">
                    <div class="auth-login-logo"><img class="auth-logo-full" src="/giro.svg" alt="GIRO" /></div>
                    </div>

                <div class="auth-form auth-form-stack">
                    

                    <form class="auth-step-card is-active" id="cadastro-scan-form">
                        <div class="auth-step-header">
                            <span class="auth-step-number">1</span>
                            <div>
                                <h2>Escanear bilhete</h2>
                                <p class="auth-step-description">Tire ou envie uma foto nítida da frente e do verso do BI.</p>
                            </div>
                        </div>

                        <div class="auth-upload-grid">
                            <label class="auth-upload-card">
                                <span class="auth-upload-title"><i class="fa-solid fa-camera"></i> Frente do bilhete</span>
                                <input type="file" name="frontImage" accept="image/*" capture="environment" required />
                            </label>

                            <label class="auth-upload-card">
                                <span class="auth-upload-title"><i class="fa-solid fa-camera-rotate"></i> Verso do bilhete</span>
                                <input type="file" name="backImage" accept="image/*" capture="environment" required />
                            </label>
                        </div>

                        <div id="scan-feedback" class="auth-alert" role="status" aria-live="polite"></div>
                        <div id="scan-summary" class="auth-scan-summary" hidden></div>

                        <button type="submit" class="auth-submit" id="scan-submit-button">Avançar</button>
                    </form>

                    <form class="auth-step-card auth-step-hidden" id="cadastro-form" hidden aria-hidden="true">
                        <div class="auth-step-header">
                            <span class="auth-step-number">2</span>
                            <div>
                                <h2>Concluir cadastro</h2>
                                <p class="auth-step-description">Confirme o nome lido, informe e-mail, escolha o perfil e crie sua senha.</p>
                            </div>
                        </div>

                        <label class="auth-field">
                            <span>Nome</span>
                            <input type="text" name="name" id="cadastro-name" placeholder="Será preenchido pelo OCR" autocomplete="name" required disabled />
                        </label>

                        <label class="auth-field">
                            <span>E-mail</span>
                            <input type="email" name="email" placeholder="voce@email.com" autocomplete="email" required disabled />
                        </label>

                        <fieldset class="auth-choice-group">
                            <legend>Como você vai usar o app?</legend>

                            <label class="auth-choice-card">
                                <input type="radio" name="role" value="passageiro" checked disabled />
                                <span class="auth-choice-content">
                                    <strong>Passageiro</strong>
                                    <small>Para pedir caronas e acompanhar corridas.</small>
                                </span>
                            </label>

                            <label class="auth-choice-card">
                                <input type="radio" name="role" value="motorista" disabled />
                                <span class="auth-choice-content">
                                    <strong>Motorista</strong>
                                    <small>Para oferecer viagens e receber chamados.</small>
                                </span>
                            </label>
                        </fieldset>

                        <label class="auth-field">
                            <span>Senha</span>
                            <input type="password" name="password" placeholder="Crie uma senha" autocomplete="new-password" minlength="6" required disabled />
                        </label>

                        <div id="cadastro-feedback" class="auth-alert" role="status" aria-live="polite"></div>

                        <div class="auth-actions-row">
                            <button type="button" class="auth-submit auth-submit-secondary auth-submit-inline" id="cadastro-back-button">Voltar</button>
                            <button type="submit" class="auth-submit auth-submit-inline" id="cadastro-submit-button" disabled>Criar conta</button>
                        </div>

                        <p class="auth-helper">
                            Já tem conta?
                            <a href="#/login">Entrar agora</a>
                        </p>
                    </form>
                </div>
            </section>
        </main>
    `;
}

export default function Cadastro(rotaAtual = '/cadastro') {
    const currentUser = obterUsuarioAtual();
    let cadastroHandlerEnviar = null;
    let cadastroHandlerEscanear = null;
    let cadastroHandlerSair = null;
    let cadastroHandlerVoltar = null;
    let cadastroTimerRedirecionamento = null;
    let ultimoResultadoEscaneamento = null;

    return {
        html: currentUser ? montarEstadoLogado(currentUser, rotaAtual) : montarFormularioCadastro(rotaAtual),
        init() {
            const logoutButton = document.getElementById('logout-new-user');
            if (logoutButton) {
                cadastroHandlerSair = () => {
                    deslogarUsuario();
                    window.location.hash = '#/cadastro';
                };
                logoutButton.addEventListener('click', cadastroHandlerSair);
            }

            const form = document.getElementById('cadastro-form');
            const scanForm = document.getElementById('cadastro-scan-form');
            if (!form || !scanForm) {
                document.dispatchEvent(new CustomEvent('app:ready'));
                return;
            }

            const nameInput = document.getElementById('cadastro-name');
            const feedback = document.getElementById('cadastro-feedback');
            const scanFeedback = document.getElementById('scan-feedback');
            const scanSummary = document.getElementById('scan-summary');
            const scanSubmitButton = document.getElementById('scan-submit-button');
            const cadastroSubmitButton = document.getElementById('cadastro-submit-button');
            const cadastroBackButton = document.getElementById('cadastro-back-button');
            const wizard = document.getElementById('cadastro-wizard');
            const scanCard = document.getElementById('cadastro-scan-form');
            const wizardSteps = Array.from(document.querySelectorAll('[data-step-indicator]'));
            const secondWizardStep = document.querySelector('[data-step-indicator="2"]');

            const playStepAnimation = stepElement => {
                if (!stepElement) return;
                stepElement.classList.remove('auth-step-enter');
                void stepElement.offsetWidth;
                stepElement.classList.add('auth-step-enter');
            };

            const setWizardStep = step => {
                wizard?.setAttribute('data-step', String(step));

                wizardSteps.forEach(stepElement => {
                    const currentStep = Number(stepElement.getAttribute('data-step-indicator'));
                    stepElement.classList.toggle('is-active', currentStep === step);
                    stepElement.classList.toggle('is-complete', currentStep < step);
                });

                if (scanCard) {
                    scanCard.classList.toggle('is-active', step === 1);
                    scanCard.classList.toggle('is-complete', step > 1);
                }

                form.classList.toggle('is-active', step === 2);
            };

            const notifyMissingBilhete = () => {
                scanFeedback.className = 'auth-alert auth-alert-error';
                scanFeedback.textContent = 'Insira e escaneie o bilhete antes de avançar para o passo 2.';
                scanForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };

            const toggleCadastroForm = enabled => {
                if (enabled && !ultimoResultadoEscaneamento?.scanId) {
                    setWizardStep(1);
                    notifyMissingBilhete();
                    return false;
                }

                scanForm.hidden = enabled;
                scanForm.setAttribute('aria-hidden', String(enabled));
                scanForm.classList.toggle('auth-step-hidden', enabled);

                form.hidden = !enabled;
                form.setAttribute('aria-hidden', String(!enabled));
                form.classList.toggle('auth-step-hidden', !enabled);

                if (secondWizardStep) {
                    secondWizardStep.hidden = !enabled;
                    secondWizardStep.setAttribute('aria-hidden', String(!enabled));
                    secondWizardStep.classList.toggle('auth-step-hidden', !enabled);
                }

                form.querySelectorAll('input').forEach(input => {
                    input.disabled = !enabled;
                });
                cadastroSubmitButton.disabled = !enabled;
                setWizardStep(enabled ? 2 : 1);
                playStepAnimation(enabled ? form : scanForm);
                return true;
            };

            toggleCadastroForm(false);

            cadastroHandlerVoltar = () => {
                toggleCadastroForm(false);
                feedback.className = 'auth-alert';
                feedback.textContent = '';
                scanCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };

            if (cadastroBackButton) {
                cadastroBackButton.addEventListener('click', cadastroHandlerVoltar);
            }

            cadastroHandlerEscanear = async event => {
                event.preventDefault();

                const scanFormData = new FormData(scanForm);
                const frontImage = scanFormData.get('frontImage');
                const backImage = scanFormData.get('backImage');

                scanFeedback.className = 'auth-alert';
                scanFeedback.textContent = '';
                feedback.className = 'auth-alert';
                feedback.textContent = '';

                if (!(frontImage instanceof File) || frontImage.size === 0 || !(backImage instanceof File) || backImage.size === 0) {
                    scanFeedback.classList.add('auth-alert-error');
                    scanFeedback.textContent = 'Envie as imagens da frente e do verso do bilhete.';
                    return;
                }

                if (!eArquivoImagem(frontImage) || !eArquivoImagem(backImage)) {
                    scanFeedback.classList.add('auth-alert-error');
                    scanFeedback.textContent = 'Os arquivos do bilhete devem ser somente imagens.';
                    return;
                }

                scanSubmitButton.disabled = true;
                scanFeedback.classList.add('auth-alert-info');
                scanFeedback.textContent = 'Processando OCR e salvando arquivos no backend...';

                try {
                    ultimoResultadoEscaneamento = await scanBilhete({ frontImage, backImage });
                    scanFeedback.className = 'auth-alert auth-alert-success';
                    scanFeedback.textContent = 'Bilhete lido com sucesso. Revise os dados abaixo e conclua o cadastro.';
                    scanSummary.hidden = false;
                    scanSummary.innerHTML = montarResumoEscaneamento(ultimoResultadoEscaneamento);
                    nameInput.value = ultimoResultadoEscaneamento.extractedData?.name || '';
                    const movedToStepTwo = toggleCadastroForm(true);
                    if (movedToStepTwo) {
                        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } catch (error) {
                    ultimoResultadoEscaneamento = null;
                    scanSummary.hidden = true;
                    scanSummary.innerHTML = '';
                    toggleCadastroForm(false);
                    scanFeedback.className = 'auth-alert auth-alert-error';
                    scanFeedback.textContent = error.message;
                } finally {
                    scanSubmitButton.disabled = false;
                }
            };

            cadastroHandlerEnviar = event => {
                event.preventDefault();

                if (!ultimoResultadoEscaneamento?.scanId) {
                    feedback.className = 'auth-alert auth-alert-error';
                    feedback.textContent = 'Escaneie o bilhete antes de criar a conta.';
                    return;
                }

                const formData = new FormData(form);
                const name = String(formData.get('name') || '');
                const email = String(formData.get('email') || '');
                const role = String(formData.get('role') || 'passageiro');
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
                            scanId: ultimoResultadoEscaneamento.scanId,
                            savedFiles: ultimoResultadoEscaneamento.savedFiles,
                            extractedData: ultimoResultadoEscaneamento.extractedData,
                            createdAt: new Date().toISOString()
                        }
                    });
                    feedback.classList.add('auth-alert-success');
                    feedback.textContent = `Conta criada com sucesso, ${user.name.split(' ')[0]}! Perfil: ${obterRotuloPerfil(user.role)}.`;
                    form.reset();
                    scanForm.reset();
                    toggleCadastroForm(false);
                    scanSummary.hidden = true;
                    scanSummary.innerHTML = '';
                    ultimoResultadoEscaneamento = null;

                    const defaultRoleOption = form.querySelector('input[name="role"][value="passageiro"]');
                    if (defaultRoleOption) {
                        defaultRoleOption.checked = true;
                    }

                    cadastroTimerRedirecionamento = window.setTimeout(() => {
                        window.location.hash = '#/';
                    }, 900);
                } catch (error) {
                    feedback.classList.add('auth-alert-error');
                    feedback.textContent = error.message;
                }
            };

            scanForm.addEventListener('submit', cadastroHandlerEscanear);
            form.addEventListener('submit', cadastroHandlerEnviar);
            document.dispatchEvent(new CustomEvent('app:ready'));
        },
        destroy() {
            if (cadastroTimerRedirecionamento) {
                clearTimeout(cadastroTimerRedirecionamento);
                cadastroTimerRedirecionamento = null;
            }

            const form = document.getElementById('cadastro-form');
            if (form && cadastroHandlerEnviar) {
                form.removeEventListener('submit', cadastroHandlerEnviar);
            }
            cadastroHandlerEnviar = null;

            const scanForm = document.getElementById('cadastro-scan-form');
            if (scanForm && cadastroHandlerEscanear) {
                scanForm.removeEventListener('submit', cadastroHandlerEscanear);
            }
            cadastroHandlerEscanear = null;

            const logoutButton = document.getElementById('logout-new-user');
            if (logoutButton && cadastroHandlerSair) {
                logoutButton.removeEventListener('click', cadastroHandlerSair);
            }
            cadastroHandlerSair = null;

            const cadastroBackButton = document.getElementById('cadastro-back-button');
            if (cadastroBackButton && cadastroHandlerVoltar) {
                cadastroBackButton.removeEventListener('click', cadastroHandlerVoltar);
            }
            cadastroHandlerVoltar = null;
        }
    };
}
