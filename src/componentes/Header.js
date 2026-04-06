const _fecharMenu = `document.getElementById('hm-sidebar').classList.remove('hm-aberto');document.getElementById('hm-overlay').classList.remove('hm-aberto');`;

export default function Header(titulo, rotaAtual = '/') {
    return `
        <header>
            <nav class="hm-nav-top">
                <h1>${titulo}</h1>
                <button
                    class="hm-btn-hamburger"
                    aria-label="Abrir menu"
                    onclick="document.getElementById('hm-sidebar').classList.toggle('hm-aberto');document.getElementById('hm-overlay').classList.toggle('hm-aberto');this.classList.toggle('hm-ativo');"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </nav>
        </header>

        <div class="hm-overlay" id="hm-overlay" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"></div>

        <aside class="hm-sidebar" id="hm-sidebar">
            <div class="hm-sidebar-header">
                <span class="hm-sidebar-titulo">${titulo}</span>
                <button class="hm-btn-fechar" aria-label="Fechar menu" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">&#x2715;</button>
            </div>
            <nav class="hm-sidebar-nav">
                <a href="#/" class="hm-link ${rotaAtual === '/' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Home</a>
                <a href="#/sobre" class="hm-link ${rotaAtual === '/sobre' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Sobre</a>
            </nav>
        </aside>
    `;
}