import { Html5Qrcode } from 'html5-qrcode';
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
                                <h2>Escanear QR Code do Bilhete</h2>
                                <p class="auth-step-description">Aponte a câmera para o QR Code do seu Bilhete de Identidade para capturar os dados automaticamente.</p>
                            </div>
                        </div>

                        <div class="auth-upload-grid">
                            <button type="button" class="auth-upload-card" id="scan-qr-btn">
                                <span class="auth-upload-title"><i class="fa-solid fa-qrcode"></i> Escanear QR Code</span>
                            </button>
                        </div>

                        <div id="scan-feedback" class="auth-alert" role="status" aria-live="polite"></div>
                        <div id="scan-summary" class="auth-scan-summary" hidden></div>

                        <button type="submit" class="auth-submit" id="scan-submit-button">Avançar</button>
                    </form>


                    <form class="auth-step-card auth-step-hidden" id="cadastro-form" hidden aria-hidden="true">
                        <br><br><br><br><br>
                        <div class="auth-step-header">
                            <span class="auth-step-number">2</span>
                            <div>
                                <h2>Concluir cadastro</h2>
                                <p class="auth-step-description">Confirme os dados lidos e crie a sua conta.</p>
                            </div>
                        </div>

                        <div class="cadastro-campos-bi">
                            <label class="auth-field full-width">
                                <span>Nome</span>
                                <textarea name="name" id="cadastro-name" placeholder="Nome do bilhete" readonly required rows="1" class="cadastro-nome-textarea"></textarea>
                            </label>
                            <label class="auth-field">
                                <span>N.º do Bilhete</span>
                                <input type="text" name="numero_bilhete" id="cadastro-numero-bilhete" placeholder="—" readonly required />
                            </label>
                            <label class="auth-field">
                                <span>Província</span>
                                <input type="text" name="provincia_nascimento" id="cadastro-provincia-nascimento" placeholder="—" readonly required />
                            </label>
                            <label class="auth-field">
                                <span>Data de Nascimento</span>
                                <input type="text" name="data_nascimento" id="cadastro-data-nascimento" placeholder="—" readonly required />
                            </label>
                            <label class="auth-field">
                                <span>Gênero</span>
                                <input type="text" name="genero" id="cadastro-genero" placeholder="—" readonly required />
                            </label>
                            <label class="auth-field">
                                <span>Estado Civil</span>
                                <input type="text" name="estado_civil" id="cadastro-estado-civil" placeholder="—" readonly required />
                            </label>
                            <label class="auth-field">
                                <span>Validade do BI</span>
                                <input type="text" name="validade_bi" id="cadastro-validade-bi" placeholder="—" readonly required />
                            </label>
                        </div>

                        <div class="cadastro-sep">Dados da conta</div>

                        <label class="auth-field">
                            <span>E-mail</span>
                            <input type="email" name="email" id="cadastro-email" placeholder="Seu e-mail" required />
                        </label>
                        <label class="auth-field">
                            <span>Senha</span>
                            <input type="password" name="password" id="cadastro-password" placeholder="Mínimo 6 caracteres" required />
                        </label>
                        <div class="auth-field">
                            <span>Perfil</span>
                            <div class="auth-role-options">
                                <label class="auth-role-option"><input type="radio" name="role" value="passageiro" checked /> Passageiro</label>
                                <label class="auth-role-option"><input type="radio" name="role" value="motorista" /> Motorista</label>
                            </div>
                        </div>

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

    function processarQRCode(data) {
        console.log('QR Code lido:', data);
        let campos;
        try {
            campos = data.trim().startsWith('{') ? JSON.parse(data) : data.split(';');
        } catch {
            campos = data.split(';');
        }
        let nome, numero, provincia, nascimento, genero, estado, emissao, validade;
        if (Array.isArray(campos)) {
            [nome, numero, provincia, nascimento, genero, estado, emissao, validade] = campos;
        } else {
            nome = campos.nome;
            numero = campos.numero;
            provincia = campos.provincia;
            nascimento = campos.nascimento;
            genero = campos.genero;
            estado = campos.estado;
            emissao = campos.emissao;
            validade = campos.validade;
        }
        document.getElementById('cadastro-name').value = nome || '';
        document.getElementById('cadastro-numero-bilhete').value = numero || '';
        document.getElementById('cadastro-provincia-nascimento').value = provincia || '';
        document.getElementById('cadastro-data-nascimento').value = nascimento || '';
        document.getElementById('cadastro-genero').value = genero || '';
        document.getElementById('cadastro-estado-civil').value = estado || '';
        document.getElementById('cadastro-validade-bi').value = validade || '';

        // Auto-resize do textarea do nome
        const nomeTextarea = document.getElementById('cadastro-name');
        if (nomeTextarea) {
            nomeTextarea.style.height = 'auto';
            nomeTextarea.style.height = nomeTextarea.scrollHeight + 'px';
        }

        // Registar resultado para permitir avançar para o passo 2
        ultimoResultadoEscaneamento = {
            scanId: 'qr-' + Date.now(),
            extractedData: { name: nome, documentNumber: numero, birthDate: nascimento, validity: validade }
        };

        // Mostrar feedback de sucesso no passo 1
        const scanFeedbackEl = document.getElementById('scan-feedback');
        if (scanFeedbackEl) {
            scanFeedbackEl.className = 'auth-alert auth-alert-success';
            scanFeedbackEl.textContent = 'QR Code lido com sucesso! Clique em "Avançar" para continuar.';
        }
    }

    function iniciarLeitorQRCode() {
        // ── Overlay ──────────────────────────────────────────────────
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed; inset:0;
            background:rgba(0,0,0,0.93);
            display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            z-index:9999; padding:16px;
        `;

        const card = document.createElement('div');
        card.style.cssText = `
            display:flex; flex-direction:column;
            align-items:center; gap:12px;
            width:min(98vw,440px);
        `;

        const titulo = document.createElement('span');
        titulo.textContent = 'Aponte para o QR Code do Bilhete';
        titulo.style.cssText = `
            color:rgba(255,255,255,0.75);
            font-size:0.82em; text-align:center; letter-spacing:0.02em;
        `;

        const dica = document.createElement('span');
        dica.textContent = '👆 Toque na imagem para focar';
        dica.style.cssText = `
            color:#aa3bff; font-size:0.76em;
            text-align:center; opacity:0.9;
            margin-top:-4px;
        `;

        // ── Div que a html5-qrcode irá usar ──────────────────────────
        const scannerDiv = document.createElement('div');
        scannerDiv.id = 'html5-qrcode-scanner';
        scannerDiv.style.cssText = `
            width:100%; aspect-ratio:1;
            overflow:hidden; border-radius:16px;
            background:#000; position:relative;
            box-shadow:0 0 0 3px rgba(170,59,255,0.35), 0 8px 32px rgba(0,0,0,0.6);
        `;

        // ── Bloco de zoom ─────────────────────────────────────────────
        const zoomBloco = document.createElement('div');
        zoomBloco.style.cssText = `
            width:100%;
            background:rgba(255,255,255,0.06);
            border:1.5px solid rgba(170,59,255,0.5);
            border-radius:14px;
            padding:12px 16px;
            display:flex; align-items:center; gap:14px;
        `;

        const zoomIcon2 = document.createElement('div');
        zoomIcon2.textContent = '🔍';
        zoomIcon2.style.cssText = `
            font-size:1.7em; flex-shrink:0;
            filter:drop-shadow(0 0 6px rgba(170,59,255,0.8));
        `;

        const zoomSlider = document.createElement('input');
        zoomSlider.type = 'range';
        zoomSlider.min = '1'; zoomSlider.max = '4';
        zoomSlider.step = '0.05'; zoomSlider.value = '1';
        zoomSlider.style.cssText = `
            flex:1; accent-color:#aa3bff;
            height:6px; cursor:pointer;
            -webkit-appearance:none;
        `;

        const zoomValor = document.createElement('span');
        zoomValor.textContent = '1×';
        zoomValor.style.cssText = `
            color:#aa3bff; font-size:1em;
            font-weight:700; min-width:38px;
            text-align:right; flex-shrink:0;
            text-shadow:0 0 8px rgba(170,59,255,0.6);
        `;

        zoomBloco.appendChild(zoomIcon2);
        zoomBloco.appendChild(zoomSlider);
        zoomBloco.appendChild(zoomValor);

        // ── Fila inferior: lanterna + fechar ──────────────────────────
        const rodape = document.createElement('div');
        rodape.style.cssText = 'display:flex; gap:10px; width:100%;';

        const torchBtn = document.createElement('button');
        torchBtn.innerHTML = '🔦';
        torchBtn.title = 'Lanterna';
        torchBtn.style.cssText = `
            background:rgba(255,255,255,0.08); color:#fff;
            border:1.5px solid rgba(255,255,255,0.18); border-radius:10px;
            padding:10px 16px; font-size:1.1em; cursor:pointer;
            flex-shrink:0; display:none;
        `;
        let torchOn = false;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Fechar';
        closeBtn.style.cssText = `
            flex:1; background:rgba(170,59,255,0.85); color:#fff;
            border:none; border-radius:10px;
            padding:11px 0; font-size:0.95em; font-weight:600;
            cursor:pointer; letter-spacing:0.03em;
        `;

        rodape.appendChild(torchBtn);
        rodape.appendChild(closeBtn);

        // referência vazia para não quebrar código existente
        const controles = rodape;
        const zoomIcon = document.createElement('span');

        card.appendChild(titulo);
        card.appendChild(dica);
        card.appendChild(scannerDiv);
        card.appendChild(zoomBloco);
        card.appendChild(rodape);
        overlay.appendChild(card);
        closeBtn.onclick = encerrarLeitura;
        document.body.appendChild(overlay);

        // ── Iniciar câmera com máxima qualidade ───────────────────────
        const html5Qr = new Html5Qrcode('html5-qrcode-scanner');
        let scannerAtivo = false;

        const opcoesQr = {
            fps: 15,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        };

        const onSuccess = (decodedText) => {
            console.log('QR Code lido:', decodedText);
            encerrarLeitura();
            processarQRCode(decodedText);
        };

        const onError = () => {};

        // Após iniciar com sucesso: ajustar zoom, lanterna, foco e tap-to-focus
        const onCameraAtiva = () => {
            scannerAtivo = true;
            const videoEl = document.querySelector('#html5-qrcode-scanner video');
            const track = videoEl?.srcObject?.getVideoTracks()[0];
            if (!track) return;

            const caps = track.getCapabilities?.() || {};

            // ── Foco: macro tem prioridade para QR próximo ──────────
            const modosFoco = caps.focusMode || [];
            // macro = foco próximo; continuous = autofoco normal
            const melhorFoco = ['macro', 'continuous', 'auto'].find(m => modosFoco.includes(m));
            if (melhorFoco) {
                track.applyConstraints({ advanced: [{ focusMode: melhorFoco }] }).catch(() => {});
            }

            // ── Tap-to-focus: toque na área do scanner refoca ───────
            scannerDiv.style.cursor = 'crosshair';
            scannerDiv.addEventListener('click', () => {
                // Força refoco: manual por um instante → de volta ao melhor modo
                track.applyConstraints({ advanced: [{ focusMode: 'manual' }] })
                    .then(() => track.applyConstraints({ advanced: [{ focusMode: melhorFoco || 'continuous' }] }))
                    .catch(() => {});
                // Flash visual de feedback
                scannerDiv.style.outline = '3px solid #aa3bff';
                setTimeout(() => { scannerDiv.style.outline = 'none'; }, 400);
            });

            // ── Zoom dinâmico ────────────────────────────────────────
            // O bloco de zoom é sempre visível; atualiza range com valores reais da câmera
            const aplicarZoom = (track) => {
                const c = track.getCapabilities?.() || {};
                if (c.zoom) {
                    zoomSlider.min   = String(c.zoom.min);
                    zoomSlider.max   = String(c.zoom.max);
                    zoomSlider.step  = String(((c.zoom.max - c.zoom.min) / 40).toFixed(4));
                    zoomSlider.value = String(c.zoom.min);
                    zoomValor.textContent = Number(c.zoom.min).toFixed(1) + '×';
                }
            };
            aplicarZoom(track);
            setTimeout(() => aplicarZoom(track), 800);

            zoomSlider.addEventListener('input', () => {
                const v = parseFloat(zoomSlider.value);
                zoomValor.textContent = v.toFixed(1) + '×';
                track.applyConstraints({ advanced: [{ zoom: v }] }).catch(() => {});
            });

            // ── Lanterna ─────────────────────────────────────────────
            if (caps.torch) {
                torchBtn.style.display = 'block';
                torchBtn.addEventListener('click', () => {
                    torchOn = !torchOn;
                    track.applyConstraints({ advanced: [{ torch: torchOn }] }).catch(() => {});
                    torchBtn.style.background = torchOn ? '#ffcc00' : 'rgba(255,255,255,0.12)';
                    torchBtn.style.color      = torchOn ? '#000' : '#fff';
                });
            }
        };

        // Tentativa 1: câmara traseira + melhor resolução possível (sem min para permitir macro)
        html5Qr.start(
            { facingMode: { ideal: 'environment' } },
            {
                ...opcoesQr,
                videoConstraints: {
                    facingMode: { ideal: 'environment' },
                    width:  { ideal: 3840 },
                    height: { ideal: 3840 },
                    // Sem min — permite câmara reduzir resolução para focar perto
                    advanced: [{ focusMode: 'macro' }, { focusMode: 'continuous' }]
                }
            },
            onSuccess, onError
        ).then(onCameraAtiva).catch(() => {
            // Tentativa 2: fallback com constraints mínimas
            html5Qr.start(
                { facingMode: 'environment' },
                opcoesQr,
                onSuccess, onError
            ).then(onCameraAtiva).catch(err => {
                console.error('Erro ao iniciar câmera:', err);
                overlay.remove();
            });
        });

        function encerrarLeitura() {
            if (!scannerAtivo) { overlay.remove(); return; }
            html5Qr.stop().then(() => overlay.remove()).catch(() => overlay.remove());
        }
    }

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

            const scanQrBtn = document.getElementById('scan-qr-btn');
            if (scanQrBtn) {
                scanQrBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    iniciarLeitorQRCode();
                });
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

            cadastroHandlerEscanear = event => {
                event.preventDefault();

                scanFeedback.className = 'auth-alert';
                scanFeedback.textContent = '';

                if (!ultimoResultadoEscaneamento?.scanId) {
                    scanFeedback.className = 'auth-alert auth-alert-error';
                    scanFeedback.textContent = 'Escaneie o QR Code do bilhete antes de avançar.';
                    return;
                }

                const moved = toggleCadastroForm(true);
                if (moved) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
