const _fecharMenu = `document.getElementById('hm-sidebar').classList.remove('hm-aberto');document.getElementById('hm-overlay').classList.remove('hm-aberto');`;
const _sair = `localStorage.removeItem('gyro.auth.current');${_fecharMenu}document.querySelector('.hm-btn-hamburger')?.classList.remove('hm-ativo');window.location.hash='#/login';`;

export default function Header(_titulo, rotaAtual = '/', exibirLogo = false) {
    const usuarioAtual = JSON.parse(localStorage.getItem('gyro.auth.current') || 'null');
    const corridaAtual = JSON.parse(localStorage.getItem('gyro.ride.active') || 'null');

    return `
        <header class="hm-header-floating">
            <button
                class="hm-btn-hamburger"
                aria-label="Abrir menu"
                onclick="document.getElementById('hm-sidebar').classList.toggle('hm-aberto');document.getElementById('hm-overlay').classList.toggle('hm-aberto');this.classList.toggle('hm-ativo');"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>
            ${exibirLogo ? '<img class="hm-page-logo" src="/ico.svg" alt="Giro" />' : ''}
        </header>

        <div class="hm-overlay" id="hm-overlay" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"></div>

        <aside class="hm-sidebar" id="hm-sidebar">
            <nav class="hm-sidebar-nav">
                <a href="#/" class="hm-link ${rotaAtual === '/' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Home</a>
                <a href="#/sobre" class="hm-link ${rotaAtual === '/sobre' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Sobre</a>
                ${corridaAtual ? `<a href="#/corrida-ativa" class="hm-link ${rotaAtual === '/corrida-ativa' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Corrida ativa</a>` : ''}
                <a href="#/corridas-agendadas" class="hm-link ${rotaAtual === '/corridas-agendadas' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Agendamentos</a>
                <a href="#/historico" class="hm-link ${rotaAtual === '/historico' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Histórico</a>
                ${usuarioAtual ? `<a href="#/perfil" class="hm-link ${rotaAtual === '/perfil' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Perfil</a>` : ''}
                <a href="#/login" class="hm-link ${rotaAtual === '/login' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Entrar</a>
                <a href="#/cadastro" class="hm-link ${rotaAtual === '/cadastro' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">Criar conta</a>
                ${usuarioAtual ? `<button class="hm-link hm-link-button" onclick="${_sair}">Sair</button>` : ''}
            </nav>
        </aside>
    `;
}