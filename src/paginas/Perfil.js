import Header from '../componentes/Header.js';
import { obterUsuarioAtual, atualizarDadosConta, marcarComoVerificado, alterarSenha, atualizarAvatar, excluirUsuario } from '../dados/authStorage.js';
import { notificar } from '../componentes/Notificacao.js';
import './Perfil.css';

const MODAL_ID = 'perfil-delete-modal';

function obterIniciais(name = '') {
    return name
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
}

function obterRotuloPerfil(role = '') {
    return role === 'motorista' ? 'Motorista' : 'Passageiro';
}

function renderBadgeVerificado() {
    return `<span class="perfil-verificado-badge"><i class="fa-solid fa-circle-check"></i>Verificado</span>`;
}

function renderBtnVerificar(field) {
    return `<button type="button" class="perfil-verificar-btn" data-verify="${field}"><i class="fa-solid fa-shield-halved"></i>Verificar</button>`;
}

function formatarData(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('pt-AO', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    } catch {
        return iso;
    }
}

function montarPaginaConvidado(rotaAtual) {
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

function montarPagina(user, rotaAtual) {
    const initials = obterIniciais(user.name);
    const roleLabel = obterRotuloPerfil(user.role);
    const campos = user.documentData?.campos ?? {};

    return `
        ${Header('Perfil', rotaAtual, true)}
        <main class="perfil-shell">
            <div class="perfil-container">

                <div class="perfil-page-header">
                    <span class="perfil-eyebrow">A minha conta</span>
                    <h1 class="perfil-title">Perfil</h1>
                </div>

                <!-- Card: identidade (dados do bilhete) -->
                <div class="perfil-card">
                    <div class="perfil-card-top">
                        <label class="perfil-avatar-wrap" for="perfil-avatar-input" title="Alterar foto de perfil">
                            <div class="perfil-avatar" id="perfil-avatar">
                                ${user.avatar
                                    ? `<img src="${user.avatar}" alt="Foto de perfil" class="perfil-avatar-img" />`
                                    : initials}
                            </div>
                            <div class="perfil-avatar-overlay"><i class="fa-solid fa-camera"></i></div>
                            <input type="file" id="perfil-avatar-input" accept="image/*" class="perfil-avatar-input" />
                        </label>
                        <div class="perfil-name-block">
                            <span class="perfil-name">${user.name}</span>
                            <span class="perfil-role-badge">
                                <i class="fa-solid ${user.role === 'motorista' ? 'fa-steering-wheel' : 'fa-user'}"></i>
                                ${roleLabel}
                            </span>
                        </div>
                    </div>

                    <div class="perfil-card-section-label">
                        <i class="fa-solid fa-id-card"></i>Bilhete de Identidade
                    </div>

                    <div class="perfil-info-list">
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-id-card"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Nº do Bilhete</span>
                                <span class="perfil-info-value">${campos.numero || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-cake-candles"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Data de nascimento</span>
                                <span class="perfil-info-value">${campos.nascimento || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-venus-mars"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Género</span>
                                <span class="perfil-info-value">${campos.genero || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-heart"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Estado civil</span>
                                <span class="perfil-info-value">${campos.estado || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-map-location-dot"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Província</span>
                                <span class="perfil-info-value">${campos.provincia || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-calendar-check"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Validade</span>
                                <span class="perfil-info-value">${campos.validade || '—'}</span>
                            </div>
                        </div>
                        <div class="perfil-info-item">
                            <div class="perfil-info-icon"><i class="fa-solid fa-shield-halved"></i></div>
                            <div class="perfil-info-content">
                                <span class="perfil-info-label">Tipo de conta</span>
                                <span class="perfil-info-value">${roleLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card: dados da conta -->
                <div class="perfil-card">
                    <div class="perfil-card-section-label">
                        <i class="fa-solid fa-lock"></i>Dados da conta
                    </div>
                    <div class="perfil-conta-row" id="perfil-row-email">
                        <div class="perfil-conta-row-header">
                            <span class="perfil-info-label">E-mail</span>
                            <div class="perfil-conta-row-actions" id="perfil-email-actions">
                                ${user.emailVerified ? renderBadgeVerificado() : renderBtnVerificar('email')}
                                <button type="button" class="perfil-edit-btn" data-field="email"><i class="fa-solid fa-pen"></i>Editar</button>
                            </div>
                        </div>
                        <div class="perfil-conta-row-view" id="perfil-email-view">${user.email}</div>
                        <form class="perfil-conta-inline-form" id="perfil-email-form" novalidate>
                            <input type="email" id="perfil-email" class="perfil-conta-input" value="${user.email}" autocomplete="email" />
                            <span class="perfil-modal-error" id="perfil-email-error"></span>
                            <div class="perfil-conta-btns">
                                <button type="button" class="perfil-modal-btn-cancel" data-cancel="email">Cancelar</button>
                                <button type="submit" class="perfil-modal-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                            </div>
                        </form>
                        <form class="perfil-conta-inline-form" id="perfil-email-verify-form" novalidate>
                            <p class="perfil-verify-hint">Insira o código enviado para <strong id="perfil-email-verify-dest">${user.email}</strong></p>
                            <input type="text" inputmode="numeric" maxlength="6" id="perfil-email-code" class="perfil-conta-input" placeholder="000 000" autocomplete="one-time-code" />
                            <span class="perfil-modal-error" id="perfil-email-verify-error"></span>
                            <div class="perfil-conta-btns">
                                <button type="button" class="perfil-modal-btn-cancel" data-cancel-verify="email">Cancelar</button>
                                <button type="submit" class="perfil-modal-btn-confirm"><i class="fa-solid fa-check"></i>Confirmar</button>
                            </div>
                        </form>
                    </div>
                    <div class="perfil-conta-row" id="perfil-row-phone">
                        <div class="perfil-conta-row-header">
                            <span class="perfil-info-label">Telefone</span>
                            <div class="perfil-conta-row-actions" id="perfil-phone-actions">
                                ${user.phone ? (user.phoneVerified ? renderBadgeVerificado() : renderBtnVerificar('phone')) : ''}
                                <button type="button" class="perfil-edit-btn" data-field="phone"><i class="fa-solid fa-pen"></i>Editar</button>
                            </div>
                        </div>
                        <div class="perfil-conta-row-view" id="perfil-phone-view">${user.phone || '<span style="color:#484f58">Não definido</span>'}</div>
                        <form class="perfil-conta-inline-form" id="perfil-phone-form" novalidate>
                            <input type="tel" id="perfil-phone" class="perfil-conta-input" value="${user.phone || ''}" placeholder="+244 9XX XXX XXX" autocomplete="tel" />
                            <span class="perfil-modal-error" id="perfil-phone-error"></span>
                            <div class="perfil-conta-btns">
                                <button type="button" class="perfil-modal-btn-cancel" data-cancel="phone">Cancelar</button>
                                <button type="submit" class="perfil-modal-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                            </div>
                        </form>
                        <form class="perfil-conta-inline-form" id="perfil-phone-verify-form" novalidate>
                            <p class="perfil-verify-hint">Insira o código enviado para <strong id="perfil-phone-verify-dest">${user.phone || ''}</strong></p>
                            <input type="text" inputmode="numeric" maxlength="6" id="perfil-phone-code" class="perfil-conta-input" placeholder="000 000" autocomplete="one-time-code" />
                            <span class="perfil-modal-error" id="perfil-phone-verify-error"></span>
                            <div class="perfil-conta-btns">
                                <button type="button" class="perfil-modal-btn-cancel" data-cancel-verify="phone">Cancelar</button>
                                <button type="submit" class="perfil-modal-btn-confirm"><i class="fa-solid fa-check"></i>Confirmar</button>
                            </div>
                        </form>
                    </div>
                    <div class="perfil-conta-row" id="perfil-row-password">
                        <div class="perfil-conta-row-header">
                            <span class="perfil-info-label">Palavra-passe</span>
                            <button type="button" class="perfil-edit-btn" data-field="password">
                                <i class="fa-solid fa-pen"></i>Alterar
                            </button>
                        </div>
                        <div class="perfil-conta-row-view" id="perfil-password-view">
                            <span class="perfil-password-dots">••••••••</span>
                        </div>
                        <form class="perfil-conta-inline-form" id="perfil-password-form" novalidate>
                            <input type="password" id="perfil-password-current" class="perfil-conta-input" placeholder="Senha atual" autocomplete="current-password" />
                            <input type="password" id="perfil-password-new" class="perfil-conta-input" placeholder="Nova senha (mín. 6 caracteres)" autocomplete="new-password" />
                            <input type="password" id="perfil-password-confirm" class="perfil-conta-input" placeholder="Confirmar nova senha" autocomplete="new-password" />
                            <span class="perfil-modal-error" id="perfil-password-error"></span>
                            <div class="perfil-conta-btns">
                                <button type="button" class="perfil-modal-btn-cancel" data-cancel="password">Cancelar</button>
                                <button type="submit" class="perfil-modal-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                            </div>
                        </form>
                    </div>
                    <div class="perfil-meta">
                        Membro desde ${formatarData(user.createdAt ?? null)}
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
    let user = obterUsuarioAtual();
    const html = user ? montarPagina(user, rotaAtual) : montarPaginaConvidado(rotaAtual);

    let ouvintes = [];

    function adicionarOuvinte(el, event, fn) {
        if (!el) return;
        el.addEventListener(event, fn);
        ouvintes.push({ el, event, fn });
    }

    function abrirModal() {
        const modal = document.getElementById(MODAL_ID);
        const input = document.getElementById('perfil-confirm-password');
        const error = document.getElementById('perfil-delete-error');
        if (!modal) return;
        if (input) input.value = '';
        if (error) { error.textContent = ''; error.classList.remove('is-visible'); }
        modal.classList.add('is-visible');
        setTimeout(() => input?.focus(), 60);
    }

    function fecharModal() {
        const modal = document.getElementById(MODAL_ID);
        if (modal) modal.classList.remove('is-visible');
    }

    function processarExclusao() {
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
            excluirUsuario({ email: user.email, password });
            window.location.hash = '#/login';
        } catch (err) {
            if (errorEl) { errorEl.textContent = err.message; errorEl.classList.add('is-visible'); }
            if (input) { input.value = ''; input.focus(); }
            if (confirmBtn) confirmBtn.disabled = false;
        }
    }

    function processarAvatar(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        if (file.size > 2 * 1024 * 1024) {
            notificar('A imagem não pode ultrapassar 2 MB.', 'aviso');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target.result;
            try {
                user = atualizarAvatar({ email: user.email, avatar: base64 });
                const avatarEl = document.getElementById('perfil-avatar');
                if (avatarEl) avatarEl.innerHTML = `<img src="${base64}" alt="Foto de perfil" class="perfil-avatar-img" />`;
            } catch (err) {
                notificar(err.message, 'erro');
            }
        };
        reader.readAsDataURL(file);
    }

    function processarCliqueExterno(e) {
        if (e.target.id === MODAL_ID) fecharModal();
    }

    function abrirCampo(field) {
        ['email', 'phone'].forEach(f => {
            fecharVerificacao(f);
            if (f !== field) fecharCampo(f);
        });
        const form    = document.getElementById(`perfil-${field}-form`);
        const view    = document.getElementById(`perfil-${field}-view`);
        const actions = document.getElementById(`perfil-${field}-actions`);
        if (form)    form.classList.add('is-visible');
        if (view)    view.style.display = 'none';
        if (actions) actions.style.display = 'none';
        document.getElementById(`perfil-${field}`)?.focus();
    }

    function fecharCampo(field) {
        const form    = document.getElementById(`perfil-${field}-form`);
        const view    = document.getElementById(`perfil-${field}-view`);
        const actions = document.getElementById(`perfil-${field}-actions`);
        const errorEl = document.getElementById(`perfil-${field}-error`);
        const input   = document.getElementById(`perfil-${field}`);
        if (form)    form.classList.remove('is-visible');
        if (view)    view.style.display = '';
        if (actions) actions.style.display = '';
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('is-visible'); }
        if (field === 'password') {
            ['perfil-password-current', 'perfil-password-new', 'perfil-password-confirm'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        } else if (input) {
            input.value = field === 'email' ? user.email : (user.phone || '');
        }
    }

    function abrirVerificacao(field) {
        ['email', 'phone'].forEach(f => {
            fecharCampo(f);
            if (f !== field) fecharVerificacao(f);
        });
        const form    = document.getElementById(`perfil-${field}-verify-form`);
        const view    = document.getElementById(`perfil-${field}-view`);
        const actions = document.getElementById(`perfil-${field}-actions`);
        if (form)    form.classList.add('is-visible');
        if (view)    view.style.display = 'none';
        if (actions) actions.style.display = 'none';
        document.getElementById(`perfil-${field}-code`)?.focus();
    }

    function fecharVerificacao(field) {
        const form    = document.getElementById(`perfil-${field}-verify-form`);
        const view    = document.getElementById(`perfil-${field}-view`);
        const actions = document.getElementById(`perfil-${field}-actions`);
        const errorEl = document.getElementById(`perfil-${field}-verify-error`);
        const input   = document.getElementById(`perfil-${field}-code`);
        if (form)    form.classList.remove('is-visible');
        if (view)    view.style.display = '';
        if (actions) actions.style.display = '';
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('is-visible'); }
        if (input)   input.value = '';
    }

    function atualizarActionsBadge(field) {
        const actions = document.getElementById(`perfil-${field}-actions`);
        if (!actions) return;
        const isVerified = field === 'email' ? user.emailVerified : user.phoneVerified;
        const hasValue   = field === 'email' ? !!user.email : !!user.phone;
        actions.querySelector('.perfil-verificado-badge')?.remove();
        actions.querySelector('.perfil-verificar-btn')?.remove();
        if (!hasValue) return;
        if (isVerified) {
            const span = document.createElement('span');
            span.className = 'perfil-verificado-badge';
            span.innerHTML = '<i class="fa-solid fa-circle-check"></i>Verificado';
            actions.prepend(span);
        } else {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'perfil-verificar-btn';
            btn.dataset.verify = field;
            btn.innerHTML = '<i class="fa-solid fa-shield-halved"></i>Verificar';
            adicionarOuvinte(btn, 'click', () => abrirVerificacao(field));
            actions.prepend(btn);
        }
    }

    function processarVerificacao(field, e) {
        e.preventDefault();
        const input   = document.getElementById(`perfil-${field}-code`);
        const errorEl = document.getElementById(`perfil-${field}-verify-error`);
        const saveBtn = e.submitter;
        const codigo  = (input?.value ?? '').replace(/\s/g, '');

        if (!/^\d{6}$/.test(codigo)) {
            if (errorEl) { errorEl.textContent = 'Introduz o código de 6 dígitos.'; errorEl.classList.add('is-visible'); }
            input?.focus();
            return;
        }

        if (saveBtn) saveBtn.disabled = true;
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('is-visible'); }

        try {
            user = marcarComoVerificado({ email: user.email, campo: field });
            atualizarActionsBadge(field);
            fecharVerificacao(field);
        } catch (err) {
            if (errorEl) { errorEl.textContent = err.message; errorEl.classList.add('is-visible'); }
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    function guardarEmail(e) {
        e.preventDefault();
        const input   = document.getElementById('perfil-email');
        const errorEl = document.getElementById('perfil-email-error');
        const saveBtn = e.submitter;
        const novoEmail = (input?.value ?? '').trim();

        if (!novoEmail) {
            if (errorEl) { errorEl.textContent = 'O e-mail não pode ficar vazio.'; errorEl.classList.add('is-visible'); }
            input?.focus();
            return;
        }

        if (saveBtn) saveBtn.disabled = true;
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('is-visible'); }

        try {
            user = atualizarDadosConta({ emailAtual: user.email, novoEmail, telefone: user.phone || '' });
            document.getElementById('perfil-email-view').textContent = user.email;
            const destEmail = document.getElementById('perfil-email-verify-dest');
            if (destEmail) destEmail.textContent = user.email;
            atualizarActionsBadge('email');
            fecharCampo('email');
        } catch (err) {
            if (errorEl) { errorEl.textContent = err.message; errorEl.classList.add('is-visible'); }
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    function guardarSenha(e) {
        e.preventDefault();
        const currentInput  = document.getElementById('perfil-password-current');
        const newInput      = document.getElementById('perfil-password-new');
        const confirmInput  = document.getElementById('perfil-password-confirm');
        const errorEl       = document.getElementById('perfil-password-error');
        const saveBtn       = e.submitter;

        const senhaAtual   = currentInput?.value ?? '';
        const novaSenha    = (newInput?.value ?? '').trim();
        const confirmSenha = (confirmInput?.value ?? '').trim();

        const mostrarErro = (msg) => {
            if (errorEl) { errorEl.textContent = msg; errorEl.classList.add('is-visible'); }
            if (saveBtn) saveBtn.disabled = false;
        };

        if (!senhaAtual) return mostrarErro('Introduz a senha atual.');
        if (!novaSenha)  return mostrarErro('Introduz a nova senha.');
        if (novaSenha.length < 6) return mostrarErro('A nova senha deve ter pelo menos 6 caracteres.');
        if (novaSenha !== confirmSenha) return mostrarErro('As senhas não coincidem.');

        if (saveBtn) saveBtn.disabled = true;
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('is-visible'); }

        try {
            alterarSenha({ email: user.email, senhaAtual, novaSenha });
            fecharCampo('password');
        } catch (err) {
            mostrarErro(err.message);
        }
    }

    function guardarTelefone(e) {
        e.preventDefault();
        const input   = document.getElementById('perfil-phone');
        const errorEl = document.getElementById('perfil-phone-error');
        const saveBtn = e.submitter;
        const novoTelefone = (input?.value ?? '').trim();

        if (saveBtn) saveBtn.disabled = true;
        if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('is-visible'); }

        try {
            user = atualizarDadosConta({ emailAtual: user.email, novoEmail: user.email, telefone: novoTelefone });
            const view = document.getElementById('perfil-phone-view');
            if (view) view.innerHTML = user.phone || '<span style="color:#484f58">Não definido</span>';
            const destPhone = document.getElementById('perfil-phone-verify-dest');
            if (destPhone) destPhone.textContent = user.phone || '';
            atualizarActionsBadge('phone');
            fecharCampo('phone');
        } catch (err) {
            if (errorEl) { errorEl.textContent = err.message; errorEl.classList.add('is-visible'); }
        } finally {
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    function processarTecla(e) {
        if (e.key === 'Escape') fecharModal();
        if (e.key === 'Enter' && document.getElementById(MODAL_ID)?.classList.contains('is-visible')) {
            processarExclusao();
        }
    }

    return {
        html,
        init() {
            if (!user) return;

            adicionarOuvinte(document.getElementById('perfil-open-delete'), 'click', abrirModal);
            adicionarOuvinte(document.getElementById('perfil-cancel-delete'), 'click', fecharModal);
            adicionarOuvinte(document.getElementById('perfil-confirm-delete'), 'click', processarExclusao);
            adicionarOuvinte(document.getElementById(MODAL_ID), 'click', processarCliqueExterno);
            adicionarOuvinte(document, 'keydown', processarTecla);

            // edição individual por campo
            document.querySelectorAll('[data-field]').forEach(btn =>
                adicionarOuvinte(btn, 'click', () => abrirCampo(btn.dataset.field))
            );
            document.querySelectorAll('[data-cancel]').forEach(btn =>
                adicionarOuvinte(btn, 'click', () => fecharCampo(btn.dataset.cancel))
            );
            document.querySelectorAll('[data-cancel-verify]').forEach(btn =>
                adicionarOuvinte(btn, 'click', () => fecharVerificacao(btn.dataset.cancelVerify))
            );
            document.querySelectorAll('[data-verify]').forEach(btn =>
                adicionarOuvinte(btn, 'click', () => abrirVerificacao(btn.dataset.verify))
            );
            adicionarOuvinte(document.getElementById('perfil-email-form'), 'submit', guardarEmail);
            adicionarOuvinte(document.getElementById('perfil-phone-form'), 'submit', guardarTelefone);
            adicionarOuvinte(document.getElementById('perfil-email-verify-form'), 'submit', (e) => processarVerificacao('email', e));
            adicionarOuvinte(document.getElementById('perfil-phone-verify-form'), 'submit', (e) => processarVerificacao('phone', e));
            adicionarOuvinte(document.getElementById('perfil-password-form'), 'submit', guardarSenha);
            adicionarOuvinte(document.getElementById('perfil-avatar-input'), 'change', processarAvatar);
        },
        destroy() {
            ouvintes.forEach(({ el, event, fn }) => el?.removeEventListener(event, fn));
            ouvintes = [];
        }
    };
}
