import { iconeBellHtml } from './NotificacaoCentro.js';

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
            ${iconeBellHtml()}
        </header>

        <div class="hm-overlay" id="hm-overlay" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"></div>

        <aside class="hm-sidebar" id="hm-sidebar">
            <nav class="hm-sidebar-nav">
                <a href="#/" class="hm-link ${rotaAtual === '/' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"><i class="fa-solid fa-house" style="margin-right:.4rem;opacity:.7;"></i>Home</a>
                ${corridaAtual ? `<a href="#/corrida-ativa" class="hm-link hm-link-corrida-ativa ${rotaAtual === '/corrida-ativa' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"><i class="fa-solid fa-route" style="margin-right:.4rem;opacity:.7;"></i>Corrida ativa<span class="hm-badge-ativa"></span></a>` : ''}
                <a href="#/corridas-agendadas" class="hm-link ${rotaAtual === '/corridas-agendadas' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"><i class="fa-solid fa-calendar-check" style="margin-right:.4rem;opacity:.7;"></i>Agendamentos</a>
                <a href="#/historico" class="hm-link ${rotaAtual === '/historico' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"><i class="fa-solid fa-clock-rotate-left" style="margin-right:.4rem;opacity:.7;"></i>Histórico</a>
                ${usuarioAtual ? `<a href="#/perfil" class="hm-link ${rotaAtual === '/perfil' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"><i class="fa-solid fa-user" style="margin-right:.4rem;opacity:.7;"></i>Perfil</a>` : ''}
                ${!usuarioAtual ? `<a href="#/login" class="hm-link ${rotaAtual === '/login' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"><i class="fa-solid fa-right-to-bracket" style="margin-right:.4rem;opacity:.7;"></i>Entrar</a>` : ''}
                <a href="#/sobre" class="hm-link ${rotaAtual === '/sobre' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"><i class="fa-solid fa-circle-info" style="margin-right:.4rem;opacity:.7;"></i>Sobre</a>
                ${!usuarioAtual ? `<a href="#/cadastro" class="hm-link ${rotaAtual === '/cadastro' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');"><i class="fa-solid fa-user-plus" style="margin-right:.4rem;opacity:.7;"></i>Criar conta</a>` : ''}
                ${usuarioAtual ? `<button class="hm-link hm-link-button" onclick="${_sair}"><i class="fa-solid fa-right-from-bracket" style="margin-right:.4rem;opacity:.7;"></i>Sair</button>` : ''}
            </nav>
        </aside>
    `;
}