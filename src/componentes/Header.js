const _fecharMenu = `document.getElementById('hm-sidebar').classList.remove('hm-aberto');document.getElementById('hm-overlay').classList.remove('hm-aberto');`;
const _logout = `localStorage.removeItem('gyro.auth.current');${_fecharMenu}document.querySelector('.hm-btn-hamburger')?.classList.remove('hm-ativo');window.location.hash='#/login';`;

function escapeHtml(value = '') {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export default function Header(titulo, rotaAtual = '/') {
    const currentUser = JSON.parse(localStorage.getItem('gyro.auth.current') || 'null');
    const firstName = currentUser?.name ? escapeHtml(currentUser.name.split(' ')[0]) : '';
    const authSection = currentUser
        ? `
            <div class="hm-auth-box hm-auth-box-logged">
                <span class="hm-auth-user"><i class="fa-solid fa-user"></i> ${firstName}</span>
                <button class="hm-auth-btn hm-auth-btn-ghost" onclick="${_logout}">Sair</button>
            </div>
        `
        : `
            <div class="hm-auth-box">
                <a href="#/login" class="hm-auth-btn ${rotaAtual === '/login' ? 'hm-auth-btn-active' : ''}">Entrar</a>
                <a href="#/cadastro" class="hm-auth-btn hm-auth-btn-primary ${rotaAtual === '/cadastro' ? 'hm-auth-btn-active' : ''}">Criar conta</a>
            </div>
        `;

    return `
        <header>
            <nav class="hm-nav-top">
                <h1>${titulo}</h1>
                <div class="hm-nav-actions">
                    ${authSection}
                    <button
                        class="hm-btn-hamburger"
                        aria-label="Abrir menu"
                        onclick="document.getElementById('hm-sidebar').classList.toggle('hm-aberto');document.getElementById('hm-overlay').classList.toggle('hm-aberto');this.classList.toggle('hm-ativo');"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>
        </header>

        <div class="hm-overlay" id="hm-overlay" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"></div>

        <aside class="hm-sidebar" id="hm-sidebar">
            <div class="hm-sidebar-header">
                <span class="hm-sidebar-titulo">${titulo}</span>
                <button class="hm-btn-fechar" aria-label="Fechar menu" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <nav class="hm-sidebar-nav">
                <a href="#/" class="hm-link ${rotaAtual === '/' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Home</a>
                <a href="#/sobre" class="hm-link ${rotaAtual === '/sobre' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Sobre</a>
                <a href="#/login" class="hm-link ${rotaAtual === '/login' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Entrar</a>
                <a href="#/cadastro" class="hm-link ${rotaAtual === '/cadastro' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Criar conta</a>
                ${currentUser ? `<button class="hm-link hm-link-button" onclick="${_logout}">Sair</button>` : ''}
            </nav>
        </aside>
    `;
}