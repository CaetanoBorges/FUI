import { Html5Qrcode } from 'html5-qrcode';
import { obterUsuarioAtual, deslogarUsuario } from '../dados/authStorage.js';
import './Cadastro.css';

const CHAVE_SCAN = 'cadastro_scan_data';

function montarEstadoLogado(user) {
    const firstName = user.name.split(' ')[0];
    const roleLabel = user.role === 'motorista' ? 'Motorista' : 'Passageiro';

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

function montarHtml() {
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

                        <button type="submit" class="auth-submit" id="scan-submit-button">Avançar</button>
                    </form>
                </div>
            </section>
        </main>
    `;
}

export default function CadastroEtapa1() {
    const currentUser = obterUsuarioAtual();
    let handlerSair = null;
    let handlerScan = null;
    let handlerAvancar = null;
    let ultimoResultadoEscaneamento = null;

    function processarQRCode(data) {
        // Regras de leitura: processar linhas de BAIXO para CIMA
        // Índice a partir do fim (0 = última linha):
        //   0 → ignorar
        //   1 → ignorar
        //   2 → validade do bilhete
        //   3 → ignorar (data de emissão)
        //   4 → estado civil
        //   5 → género
        //   6 → data de nascimento
        //   7 → local de nascença (província)
        //   8 → número de identificação
        //   9+ → linhas do nome completo (revertidas para ordem natural)

        const linhas = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const inv = [...linhas].reverse(); // índice 0 = linha mais em baixo

        const validade   = inv[2] || '';
        const estadoCivil = inv[4] || '';
        const genero     = inv[5] || '';
        const nascimento = inv[6] || '';
        const provincia  = inv[7] || '';
        const numero     = inv[8] || '';
        // as restantes linhas (índice 9+), revertidas, formam o nome completo
        const nomeLinhas = inv.slice(9).reverse();
        const nome       = nomeLinhas.join(' ').trim();

        ultimoResultadoEscaneamento = {
            scanId: 'qr-' + Date.now(),
            campos: { nome, numero, provincia, nascimento, genero, estado: estadoCivil, validade },
            extractedData: { name: nome, documentNumber: numero, birthDate: nascimento, validity: validade }
        };

        const scanFeedbackEl = document.getElementById('scan-feedback');
        if (scanFeedbackEl) {
            scanFeedbackEl.className = 'auth-alert auth-alert-success';
            scanFeedbackEl.textContent = 'QR Code lido com sucesso! Clique em "Avançar" para continuar.';
        }
    }

    function iniciarLeitorQRCode() {
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

        const scannerDiv = document.createElement('div');
        scannerDiv.id = 'html5-qrcode-scanner';
        scannerDiv.style.cssText = `
            width:100%; aspect-ratio:1;
            overflow:hidden; border-radius:16px;
            background:#000; position:relative;
            box-shadow:0 0 0 3px rgba(170,59,255,0.35), 0 8px 32px rgba(0,0,0,0.6);
        `;

        const zoomBloco = document.createElement('div');
        zoomBloco.style.cssText = `
            width:100%;
            background:rgba(255,255,255,0.06);
            border:1.5px solid rgba(170,59,255,0.5);
            border-radius:14px;
            padding:12px 16px;
            display:flex; align-items:center; gap:14px;
        `;

        const zoomIcon = document.createElement('div');
        zoomIcon.textContent = '🔍';
        zoomIcon.style.cssText = `font-size:1.7em; flex-shrink:0; filter:drop-shadow(0 0 6px rgba(170,59,255,0.8));`;

        const zoomSlider = document.createElement('input');
        zoomSlider.type = 'range';
        zoomSlider.min = '1'; zoomSlider.max = '4';
        zoomSlider.step = '0.05'; zoomSlider.value = '1';
        zoomSlider.style.cssText = `flex:1; accent-color:#aa3bff; height:6px; cursor:pointer; -webkit-appearance:none;`;

        const zoomValor = document.createElement('span');
        zoomValor.textContent = '1×';
        zoomValor.style.cssText = `color:#aa3bff; font-size:1em; font-weight:700; min-width:38px; text-align:right; flex-shrink:0; text-shadow:0 0 8px rgba(170,59,255,0.6);`;

        zoomBloco.appendChild(zoomIcon);
        zoomBloco.appendChild(zoomSlider);
        zoomBloco.appendChild(zoomValor);

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

        card.appendChild(titulo);
        card.appendChild(dica);
        card.appendChild(scannerDiv);
        card.appendChild(zoomBloco);
        card.appendChild(rodape);
        overlay.appendChild(card);
        closeBtn.onclick = encerrarLeitura;
        document.body.appendChild(overlay);

        const html5Qr = new Html5Qrcode('html5-qrcode-scanner');
        let scannerAtivo = false;

        const opcoesQr = {
            fps: 15,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        };

        const onSuccess = (decodedText) => {
            encerrarLeitura();
            processarQRCode(decodedText);
        };
        const onError = () => {};

        const onCameraAtiva = () => {
            scannerAtivo = true;
            const videoEl = document.querySelector('#html5-qrcode-scanner video');
            const track = videoEl?.srcObject?.getVideoTracks()[0];
            if (!track) return;

            const caps = track.getCapabilities?.() || {};
            const modosFoco = caps.focusMode || [];
            const melhorFoco = ['macro', 'continuous', 'auto'].find(m => modosFoco.includes(m));
            if (melhorFoco) {
                track.applyConstraints({ advanced: [{ focusMode: melhorFoco }] }).catch(() => {});
            }

            scannerDiv.style.cursor = 'crosshair';
            scannerDiv.addEventListener('click', () => {
                track.applyConstraints({ advanced: [{ focusMode: 'manual' }] })
                    .then(() => track.applyConstraints({ advanced: [{ focusMode: melhorFoco || 'continuous' }] }))
                    .catch(() => {});
                scannerDiv.style.outline = '3px solid #aa3bff';
                setTimeout(() => { scannerDiv.style.outline = 'none'; }, 400);
            });

            const aplicarZoom = (t) => {
                const c = t.getCapabilities?.() || {};
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

        html5Qr.start(
            { facingMode: { ideal: 'environment' } },
            {
                ...opcoesQr,
                videoConstraints: {
                    facingMode: { ideal: 'environment' },
                    width:  { ideal: 3840 },
                    height: { ideal: 3840 },
                    advanced: [{ focusMode: 'macro' }, { focusMode: 'continuous' }]
                }
            },
            onSuccess, onError
        ).then(onCameraAtiva).catch(() => {
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

    return {
        html: currentUser ? montarEstadoLogado(currentUser) : montarHtml(),
        init() {
            const logoutButton = document.getElementById('logout-new-user');
            if (logoutButton) {
                handlerSair = () => {
                    deslogarUsuario();
                    window.location.hash = '#/cadastro';
                };
                logoutButton.addEventListener('click', handlerSair);
                document.dispatchEvent(new CustomEvent('app:ready'));
                return;
            }

            const scanForm = document.getElementById('cadastro-scan-form');
            if (!scanForm) {
                document.dispatchEvent(new CustomEvent('app:ready'));
                return;
            }

            const scanQrBtn = document.getElementById('scan-qr-btn');
            if (scanQrBtn) {
                handlerScan = (e) => {
                    e.preventDefault();
                    iniciarLeitorQRCode();
                };
                scanQrBtn.addEventListener('click', handlerScan);
            }

            handlerAvancar = (event) => {
                event.preventDefault();
                const scanFeedback = document.getElementById('scan-feedback');

                if (!ultimoResultadoEscaneamento?.scanId) {
                    scanFeedback.className = 'auth-alert auth-alert-error';
                    scanFeedback.textContent = 'Escaneie o QR Code do bilhete antes de avançar.';
                    return;
                }

                sessionStorage.setItem(CHAVE_SCAN, JSON.stringify(ultimoResultadoEscaneamento));
                window.location.hash = '#/cadastro/etapa2';
            };

            scanForm.addEventListener('submit', handlerAvancar);
            document.dispatchEvent(new CustomEvent('app:ready'));
        },
        destroy() {
            const logoutButton = document.getElementById('logout-new-user');
            if (logoutButton && handlerSair) {
                logoutButton.removeEventListener('click', handlerSair);
            }
            handlerSair = null;

            const scanQrBtn = document.getElementById('scan-qr-btn');
            if (scanQrBtn && handlerScan) {
                scanQrBtn.removeEventListener('click', handlerScan);
            }
            handlerScan = null;

            const scanForm = document.getElementById('cadastro-scan-form');
            if (scanForm && handlerAvancar) {
                scanForm.removeEventListener('submit', handlerAvancar);
            }
            handlerAvancar = null;
        }
    };
}
