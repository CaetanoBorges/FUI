import { iconeBellHtml } from './NotificacaoCentro.js';
import './Header.css';

const _fecharMenu = `document.getElementById('hm-sidebar').classList.remove('hm-aberto');document.getElementById('hm-overlay').classList.remove('hm-aberto');`;
const _sair = `localStorage.removeItem('gyro.auth.current');${_fecharMenu}document.querySelector('.hm-btn-hamburger')?.classList.remove('hm-ativo');window.location.hash='#/login';`;

export default function HeaderMotorista(rotaAtual = '/motorista') {
    const usuarioAtual = JSON.parse(localStorage.getItem('gyro.auth.current') || 'null');
    const corridaAtual = JSON.parse(localStorage.getItem('gyro.ride.driver.active') || 'null');

    const formatarData = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const subInicio = usuarioAtual?.subscriptionStart;
    const subFim    = usuarioAtual?.subscriptionEnd;
    const subAtiva  = subFim ? new Date(subFim) >= new Date() : false;

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
                ${usuarioAtual?.role === 'motorista' ? `
                <div class="hm-subscricao ${subAtiva ? 'hm-subscricao-ativa' : 'hm-subscricao-expirada'}">
                    <div class="hm-subscricao-titulo">
                        <i class="fa-solid fa-id-card" style="margin-right:.4rem;"></i>Subscrição
                        <span class="hm-subscricao-badge">${subAtiva ? 'Ativa' : 'Expirada'}</span>
                    </div>
                    <div class="hm-subscricao-linha">
                        <span class="hm-subscricao-label">Desde</span>
                        <span class="hm-subscricao-valor">${formatarData(subInicio)}</span>
                    </div>
                    <div class="hm-subscricao-linha">
                        <span class="hm-subscricao-label">Válida até</span>
                        <span class="hm-subscricao-valor">${formatarData(subFim)}</span>
                    </div>
                </div>` : ''}
                <a href="#/motorista" class="hm-link ${rotaAtual === '/motorista' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-house" style="margin-right:.4rem;opacity:.7;"></i>Home
                </a>
                <a href="#/motorista/sobre" class="hm-link ${rotaAtual === '/motorista/sobre' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-circle-info" style="margin-right:.4rem;opacity:.7;"></i>Sobre
                </a>
                ${corridaAtual ? `
                <a href="#/motorista/corrida-ativa" class="hm-link hm-link-corrida-ativa ${rotaAtual === '/motorista/corrida-ativa' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-route" style="margin-right:.4rem;opacity:.7;"></i>Corrida ativa
                    <span class="hm-badge-ativa"></span>
                </a>` : ''}
                <a href="#/motorista/historico" class="hm-link ${rotaAtual === '/motorista/historico' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-clock-rotate-left" style="margin-right:.4rem;opacity:.7;"></i>Histórico
                </a>
                <a href="#/motorista/ganhos" class="hm-link ${rotaAtual === '/motorista/ganhos' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-wallet" style="margin-right:.4rem;opacity:.7;"></i>Ganhos
                </a>
                <a href="#/motorista/corridas-agendadas" class="hm-link ${rotaAtual === '/motorista/corridas-agendadas' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-calendar-check" style="margin-right:.4rem;opacity:.7;"></i>Agendadas
                </a>
                <a href="#/motorista/veiculo" class="hm-link ${rotaAtual === '/motorista/veiculo' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-car" style="margin-right:.4rem;opacity:.7;"></i>Meu Veículo
                </a>
                <a href="#/motorista/rotas-favoritas" class="hm-link ${rotaAtual === '/motorista/rotas-favoritas' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-route" style="margin-right:.4rem;opacity:.7;"></i>Rotas Favoritas
                </a>
                ${usuarioAtual ? `
                <a href="#/motorista/perfil" class="hm-link ${rotaAtual === '/motorista/perfil' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-user" style="margin-right:.4rem;opacity:.7;"></i>Perfil
                </a>` : ''}
                ${!usuarioAtual ? `
                <a href="#/login" class="hm-link ${rotaAtual === '/login' ? 'hm-ativo' : ''}" onclick="${_fecharMenu}document.querySelector('.hm-btn-hamburger').classList.remove('hm-ativo');">
                    <i class="fa-solid fa-right-to-bracket" style="margin-right:.4rem;opacity:.7;"></i>Entrar
                </a>` : ''}
                ${usuarioAtual ? `<button class="hm-link hm-link-button" onclick="${_sair}">
                    <i class="fa-solid fa-right-from-bracket" style="margin-right:.4rem;opacity:.7;"></i>Sair
                </button>` : ''}
            </nav>
        </aside>
    `;
}
