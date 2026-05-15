import './style.css';
import './componentes/Notificacao.css';
import './componentes/NotificacaoCentro.css';
import { inicializarCentroNotificacoes } from './componentes/NotificacaoCentro.js';
import Home from './paginas/Home.js';
import Sobre from './paginas/Sobre.js';
import Login from './paginas/Login.js';
import CadastroEtapa1 from './paginas/CadastroEtapa1.js';
import CadastroEtapa2 from './paginas/CadastroEtapa2.js';
import CorridaAtiva from './paginas/CorridaAtiva.js';
import CorridasAgendadas from './paginas/CorridasAgendadas.js';
import CorridaAgendadaDetalhe from './paginas/CorridaAgendadaDetalhe.js';
import AguardandoMotorista from './paginas/AguardandoMotorista.js';
import HistoricoCorridas from './paginas/HistoricoCorridas.js';
import AvaliacaoCorrida from './paginas/AvaliacaoCorrida.js';
import Perfil from './paginas/Perfil.js';

const raiz = document.getElementById('render');
let resultadoPaginaAtual = null;

const rotas = {
	'/': Home,
	'/sobre': Sobre,
	'/login': Login,
	'/cadastro': CadastroEtapa1,
	'/cadastro/etapa1': CadastroEtapa1,
	'/cadastro/etapa2': CadastroEtapa2,
	'/corrida-ativa': CorridaAtiva,
	'/aguardando-motorista': AguardandoMotorista,
	'/corridas-agendadas': CorridasAgendadas,
	'/corrida-agendada': CorridaAgendadaDetalhe,
	'/historico': HistoricoCorridas,
	'/perfil': Perfil,
	'/avaliacao': AvaliacaoCorrida
};

function obterCaminhoAtual() {
	const hash = window.location.hash || '#/';
	const completo = hash.replace('#', '');
	return completo.split('?')[0];
}

function obterQueryAtual() {
	const hash = window.location.hash || '#/';
	const completo = hash.replace('#', '');
	const indiceQuery = completo.indexOf('?');
	if (indiceQuery === -1) return {};
	return Object.fromEntries(new URLSearchParams(completo.slice(indiceQuery + 1)));
}

function renderizarRota() {
	if (resultadoPaginaAtual && typeof resultadoPaginaAtual.destroy === 'function') {
		resultadoPaginaAtual.destroy();
	}

	const caminho = obterCaminhoAtual();
	const parametros = obterQueryAtual();
	const Pagina = rotas[caminho] || Home;
	const resultado = Pagina(caminho, parametros);
	resultadoPaginaAtual = resultado;

	if (resultado && typeof resultado === 'object' && resultado.html) {
		raiz.innerHTML = resultado.html;
		resultado.init?.();
	} else {
		raiz.innerHTML = resultado;
	}

	inicializarCentroNotificacoes();

	window.scrollTo(0, 0);

	if (caminho !== '/') {
		document.dispatchEvent(new CustomEvent('app:ready'));
	}
}

function ativarFullscreen() {
	const el = document.documentElement;
	if (el.requestFullscreen) el.requestFullscreen();
	else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
	else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
	document.removeEventListener('click', ativarFullscreen);
	document.removeEventListener('touchstart', ativarFullscreen);
}
document.addEventListener('click', ativarFullscreen, { once: true });
document.addEventListener('touchstart', ativarFullscreen, { once: true });

window.addEventListener('hashchange', renderizarRota);
window.addEventListener('load', () => {
	// Prepara as promessas antes do renderRoute para não perder o evento
	const animacaoConcluida = new Promise(resolve => setTimeout(resolve, 1600));
	const paginaConcluida = new Promise(resolve =>
		document.addEventListener('app:ready', resolve, { once: true })
	);

	if (!window.location.hash) {
		window.location.hash = '#/';
	}
	renderizarRota();

	const splash = document.getElementById('splash');
	if (splash) {
		Promise.all([animacaoConcluida, paginaConcluida]).then(() => {
			splash.classList.add('hidden');
			splash.addEventListener('transitionend', () => splash.remove(), { once: true });
		});
	}
});