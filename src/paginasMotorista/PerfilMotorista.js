import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { obterUsuarioAtual, atualizarDadosConta, alterarSenha, atualizarAvatar, excluirUsuario } from '../dados/authStorage.js';
import { listarHistoricoDriver } from '../dados/corridaDriverStorage.js';
import { notificar } from '../componentes/Notificacao.js';
import './PerfilMotorista.css';

const MODAL_ID = 'pmot-delete-modal';

function obterIniciais(name = '') {
    return name.trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function formatarData(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return iso; }
}

function calcularEstatisticas() {
    const historico = listarHistoricoDriver();
    const concluidas = historico.filter(r => r.status === 'completed');
    const totalGanhos = concluidas.reduce((s, r) => s + (r.earningsRaw ?? 0), 0);
    const mediaAval = concluidas.length
        ? (concluidas.reduce((s, r) => s + (r.rating ?? 5), 0) / concluidas.length).toFixed(1)
        : '—';
    return {
        total: historico.length,
        concluidas: concluidas.length,
        ganhos: totalGanhos > 0 ? `Kz ${totalGanhos.toLocaleString('pt-AO')},00` : 'Kz 0,00',
        media: mediaAval,
    };
}

function montarConvidado(rotaAtual) {
    return `
        ${HeaderMotorista(rotaAtual)}
        <main class="pmot-shell">
            <div class="pmot-container">
                <div class="pmot-card" style="text-align:center;padding:2.5rem 1.5rem;gap:0.75rem;align-items:center;">
                    <div class="pmot-avatar" style="font-size:1.8rem;">?</div>
                    <p style="color:#7d8590;font-size:0.92rem;margin:0;">Precisas de iniciar sessão para ver o teu perfil.</p>
                    <a href="#/login" class="pmot-btn-danger" style="border-color:#58a6ff;color:#58a6ff;">
                        <i class="fa-solid fa-right-to-bracket"></i>Entrar
                    </a>
                </div>
            </div>
        </main>
    `;
}

function montarBiCard(documentData) {
    const c = documentData?.campos ?? {};

    const item = (icon, label, value) => `
        <div class="pmot-info-item">
            <div class="pmot-info-icon"><i class="fa-solid ${icon}"></i></div>
            <div class="pmot-info-content">
                <span class="pmot-info-label">${label}</span>
                <span class="pmot-info-value">${value || '—'}</span>
            </div>
        </div>`;

    return `
        <div class="pmot-card">
            <div class="pmot-card-label">
                <i class="fa-solid fa-id-card"></i>Bilhete de Identidade
                <span class="pmot-bi-verified"><i class="fa-solid fa-circle-check"></i> Verificado</span>
            </div>
            <div class="pmot-info-list">
                ${item('fa-id-card',           'Nº do Bilhete',      c.numero)}
                ${item('fa-cake-candles',       'Data de nascimento', c.nascimento)}
                ${item('fa-venus-mars',         'Género',             c.genero)}
                ${item('fa-heart',              'Estado civil',       c.estado)}
                ${item('fa-map-location-dot',   'Província',          c.provincia)}
                ${item('fa-calendar-check',     'Validade',           c.validade)}
            </div>
        </div>`;
}

function montarPagina(user, rotaAtual) {
    const initials = obterIniciais(user.name);
    const stats = calcularEstatisticas();

    return `
        ${HeaderMotorista(rotaAtual)}
        <main class="pmot-shell">
            <div class="pmot-container">

                <!-- Cabeçalho do perfil -->
                <div class="pmot-profile-card">
                    <label class="pmot-avatar-wrap" for="pmot-avatar-input" title="Alterar foto">
                        <div class="pmot-avatar" id="pmot-avatar">
                            ${user.avatar ? `<img src="${user.avatar}" alt="Foto" class="pmot-avatar-img" />` : initials}
                        </div>
                        <div class="pmot-avatar-overlay"><i class="fa-solid fa-camera"></i></div>
                        <input type="file" id="pmot-avatar-input" accept="image/*" class="pmot-avatar-input" />
                    </label>
                    <div class="pmot-profile-info">
                        <span class="pmot-profile-name">${user.name}</span>
                        <span class="pmot-profile-badge">
                            <i class="fa-solid fa-steering-wheel"></i>Motorista
                        </span>
                        <span class="pmot-profile-since">Membro desde ${formatarData(user.createdAt ?? null)}</span>
                    </div>
                </div>

                <!-- Estatísticas -->
                <div class="pmot-stats-row">
                    <div class="pmot-stat">
                        <span class="pmot-stat-num">${stats.concluidas}</span>
                        <span class="pmot-stat-lbl">Corridas</span>
                    </div>
                    <div class="pmot-stat">
                        <span class="pmot-stat-num">${stats.media}<i class="fa-solid fa-star pmot-star"></i></span>
                        <span class="pmot-stat-lbl">Avaliação</span>
                    </div>
                    <div class="pmot-stat pmot-stat-ganhos">
                        <span class="pmot-stat-num pmot-stat-ganhos-num">${stats.ganhos}</span>
                        <span class="pmot-stat-lbl">Ganhos totais</span>
                    </div>
                </div>

                <!-- Bilhete de Identidade -->
                ${montarBiCard(user.documentData)}

                <!-- Dados da conta -->
                <div class="pmot-card">
                    <div class="pmot-card-label">
                        <i class="fa-solid fa-lock"></i>Dados da conta
                    </div>

                    <!-- Email -->
                    <div class="pmot-row" id="pmot-row-email">
                        <div class="pmot-row-header">
                            <span class="pmot-row-label">E-mail</span>
                            <button type="button" class="pmot-edit-btn" data-field="email">
                                <i class="fa-solid fa-pen"></i>Editar
                            </button>
                        </div>
                        <div class="pmot-row-view" id="pmot-email-view">${user.email}</div>
                        <form class="pmot-inline-form" id="pmot-email-form" novalidate>
                            <input type="email" id="pmot-email" class="pmot-input" value="${user.email}" autocomplete="email" placeholder="Novo e-mail" />
                            <span class="pmot-error" id="pmot-email-error"></span>
                            <div class="pmot-form-btns">
                                <button type="button" class="pmot-btn-cancel" data-cancel="email">Cancelar</button>
                                <button type="submit" class="pmot-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                            </div>
                        </form>
                    </div>

                    <!-- Telefone -->
                    <div class="pmot-row" id="pmot-row-phone">
                        <div class="pmot-row-header">
                            <span class="pmot-row-label">Telefone</span>
                            <button type="button" class="pmot-edit-btn" data-field="phone">
                                <i class="fa-solid fa-pen"></i>Editar
                            </button>
                        </div>
                        <div class="pmot-row-view" id="pmot-phone-view">
                            ${user.phone || '<span style="color:#484f58">Não definido</span>'}
                        </div>
                        <form class="pmot-inline-form" id="pmot-phone-form" novalidate>
                            <input type="tel" id="pmot-phone" class="pmot-input" value="${user.phone || ''}" placeholder="+244 9XX XXX XXX" autocomplete="tel" />
                            <span class="pmot-error" id="pmot-phone-error"></span>
                            <div class="pmot-form-btns">
                                <button type="button" class="pmot-btn-cancel" data-cancel="phone">Cancelar</button>
                                <button type="submit" class="pmot-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                            </div>
                        </form>
                    </div>

                    <!-- Palavra-passe -->
                    <div class="pmot-row" id="pmot-row-password">
                        <div class="pmot-row-header">
                            <span class="pmot-row-label">Palavra-passe</span>
                            <button type="button" class="pmot-edit-btn" data-field="password">
                                <i class="fa-solid fa-pen"></i>Alterar
                            </button>
                        </div>
                        <div class="pmot-row-view" id="pmot-password-view">
                            <span class="pmot-password-dots">••••••••</span>
                        </div>
                        <form class="pmot-inline-form" id="pmot-password-form" novalidate>
                            <input type="password" id="pmot-password-current" class="pmot-input" placeholder="Senha atual" autocomplete="current-password" />
                            <input type="password" id="pmot-password-new" class="pmot-input" placeholder="Nova senha (mín. 6 caracteres)" autocomplete="new-password" />
                            <input type="password" id="pmot-password-confirm" class="pmot-input" placeholder="Confirmar nova senha" autocomplete="new-password" />
                            <span class="pmot-error" id="pmot-password-error"></span>
                            <div class="pmot-form-btns">
                                <button type="button" class="pmot-btn-cancel" data-cancel="password">Cancelar</button>
                                <button type="submit" class="pmot-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Zona de perigo -->
                <div class="pmot-danger-card">
                    <div class="pmot-danger-title">
                        <i class="fa-solid fa-triangle-exclamation"></i>Zona de perigo
                    </div>
                    <p class="pmot-danger-desc">
                        Apagar a conta é permanente. Todos os dados serão removidos e não poderás recuperar o acesso.
                    </p>
                    <button type="button" class="pmot-btn-danger" id="pmot-open-delete">
                        <i class="fa-solid fa-trash-can"></i>Apagar conta
                    </button>
                </div>

            </div>
        </main>

        <!-- Modal apagar conta -->
        <div class="pmot-modal-backdrop" id="${MODAL_ID}" role="dialog" aria-modal="true">
            <div class="pmot-modal">
                <div class="pmot-modal-icon"><i class="fa-solid fa-trash-can"></i></div>
                <h2 class="pmot-modal-title">Apagar conta?</h2>
                <p class="pmot-modal-desc">Esta ação é irreversível. Confirma a tua <strong style="color:#e6edf3;">senha</strong> para continuar.</p>
                <div>
                    <input type="password" id="pmot-confirm-password" class="pmot-input" placeholder="••••••" autocomplete="current-password" />
                    <span class="pmot-error" id="pmot-delete-error"></span>
                </div>
                <div class="pmot-modal-actions">
                    <button type="button" class="pmot-btn-cancel" id="pmot-cancel-delete">Cancelar</button>
                    <button type="button" class="pmot-btn-danger" id="pmot-confirm-delete">
                        <i class="fa-solid fa-trash-can"></i>Apagar
                    </button>
                </div>
            </div>
        </div>
    `;
}

export default function PerfilMotorista(rotaAtual = '/motorista/perfil') {
    let user = obterUsuarioAtual();
    const html = user ? montarPagina(user, rotaAtual) : montarConvidado(rotaAtual);

    let ouvintes = [];

    function on(el, ev, fn) {
        if (!el) return;
        el.addEventListener(ev, fn);
        ouvintes.push({ el, ev, fn });
    }

    function abrirCampo(field) {
        ['email', 'phone', 'password'].forEach(f => { if (f !== field) fecharCampo(f); });
        document.getElementById(`pmot-${field}-form`)?.classList.add('is-visible');
        document.getElementById(`pmot-${field}-view`)?.style?.setProperty('display', 'none');
        document.getElementById(`pmot-${field}-actions`)?.style?.setProperty('display', 'none');
        document.getElementById(`pmot-${field}`) ?.focus();
    }

    function fecharCampo(field) {
        const form = document.getElementById(`pmot-${field}-form`);
        const view = document.getElementById(`pmot-${field}-view`);
        const err  = document.getElementById(`pmot-${field}-error`);
        form?.classList.remove('is-visible');
        if (view) view.style.display = '';
        if (err)  { err.textContent = ''; err.classList.remove('is-visible'); }
        if (field === 'password') {
            ['pmot-password-current', 'pmot-password-new', 'pmot-password-confirm'].forEach(id => {
                const el = document.getElementById(id); if (el) el.value = '';
            });
        } else {
            const inp = document.getElementById(`pmot-${field}`);
            if (inp) inp.value = field === 'email' ? user.email : (user.phone || '');
        }
    }

    function mostrarErro(id, msg) {
        const el = document.getElementById(id);
        if (el) { el.textContent = msg; el.classList.add('is-visible'); }
    }

    function init() {
        if (!user) return;

        // Avatar
        on(document.getElementById('pmot-avatar-input'), 'change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.target.value = '';
            if (file.size > 2 * 1024 * 1024) { notificar('A imagem não pode ultrapassar 2 MB.', 'aviso'); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target.result;
                try {
                    user = atualizarAvatar({ email: user.email, avatar: base64 });
                    const el = document.getElementById('pmot-avatar');
                    if (el) el.innerHTML = `<img src="${base64}" alt="Foto" class="pmot-avatar-img" />`;
                } catch (err) { notificar(err.message, 'erro'); }
            };
            reader.readAsDataURL(file);
        });

        // Botões Editar
        document.querySelectorAll('[data-field]').forEach(btn => {
            on(btn, 'click', () => abrirCampo(btn.dataset.field));
        });

        // Botões Cancelar
        document.querySelectorAll('[data-cancel]').forEach(btn => {
            on(btn, 'click', () => fecharCampo(btn.dataset.cancel));
        });

        // Formulário Email
        on(document.getElementById('pmot-email-form'), 'submit', (e) => {
            e.preventDefault();
            const novoEmail = document.getElementById('pmot-email')?.value?.trim();
            if (!novoEmail) { mostrarErro('pmot-email-error', 'Introduz um e-mail válido.'); return; }
            try {
                user = atualizarDadosConta({ email: user.email, updates: { email: novoEmail } });
                const view = document.getElementById('pmot-email-view');
                if (view) view.textContent = user.email;
                fecharCampo('email');
                notificar('E-mail atualizado.', 'sucesso');
            } catch (err) { mostrarErro('pmot-email-error', err.message); }
        });

        // Formulário Telefone
        on(document.getElementById('pmot-phone-form'), 'submit', (e) => {
            e.preventDefault();
            const tel = document.getElementById('pmot-phone')?.value?.trim();
            try {
                user = atualizarDadosConta({ email: user.email, updates: { phone: tel || null } });
                const view = document.getElementById('pmot-phone-view');
                if (view) view.innerHTML = user.phone || '<span style="color:#484f58">Não definido</span>';
                fecharCampo('phone');
                notificar('Telefone atualizado.', 'sucesso');
            } catch (err) { mostrarErro('pmot-phone-error', err.message); }
        });

        // Formulário Palavra-passe
        on(document.getElementById('pmot-password-form'), 'submit', (e) => {
            e.preventDefault();
            const atual    = document.getElementById('pmot-password-current')?.value ?? '';
            const nova     = document.getElementById('pmot-password-new')?.value ?? '';
            const confirma = document.getElementById('pmot-password-confirm')?.value ?? '';
            if (nova !== confirma) { mostrarErro('pmot-password-error', 'As senhas não coincidem.'); return; }
            if (nova.length < 6)   { mostrarErro('pmot-password-error', 'A nova senha deve ter pelo menos 6 caracteres.'); return; }
            try {
                alterarSenha({ email: user.email, currentPassword: atual, newPassword: nova });
                fecharCampo('password');
                notificar('Palavra-passe alterada.', 'sucesso');
            } catch (err) { mostrarErro('pmot-password-error', err.message); }
        });

        // Modal apagar conta
        on(document.getElementById('pmot-open-delete'), 'click', () => {
            const modal = document.getElementById(MODAL_ID);
            const inp   = document.getElementById('pmot-confirm-password');
            const err   = document.getElementById('pmot-delete-error');
            if (inp) inp.value = '';
            if (err) { err.textContent = ''; err.classList.remove('is-visible'); }
            modal?.classList.add('is-visible');
            setTimeout(() => inp?.focus(), 60);
        });

        on(document.getElementById('pmot-cancel-delete'), 'click', () => {
            document.getElementById(MODAL_ID)?.classList.remove('is-visible');
        });

        on(document.getElementById(MODAL_ID), 'click', (e) => {
            if (e.target.id === MODAL_ID) document.getElementById(MODAL_ID)?.classList.remove('is-visible');
        });

        on(document.getElementById('pmot-confirm-delete'), 'click', () => {
            const inp = document.getElementById('pmot-confirm-password');
            const err = document.getElementById('pmot-delete-error');
            const btn = document.getElementById('pmot-confirm-delete');
            const pwd = inp?.value ?? '';
            if (!pwd) { mostrarErro('pmot-delete-error', 'Introduz a tua senha.'); inp?.focus(); return; }
            if (btn) btn.disabled = true;
            try {
                excluirUsuario({ email: user.email, password: pwd });
                window.location.hash = '#/login';
            } catch (ex) {
                mostrarErro('pmot-delete-error', ex.message);
                if (inp) { inp.value = ''; inp.focus(); }
                if (btn) btn.disabled = false;
            }
        });
    }

    function destroy() {
        ouvintes.forEach(({ el, ev, fn }) => el?.removeEventListener(ev, fn));
        ouvintes = [];
    }

    return { html, init, destroy };
}
