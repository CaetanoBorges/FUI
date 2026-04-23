import './style.css';
import Home from './paginas/Home.js';
import Sobre from './paginas/Sobre.js';
import Login from './paginas/Login.js';
import Cadastro from './paginas/Cadastro.js';
import CorridaAtiva from './paginas/CorridaAtiva.js';
import CorridasAgendadas from './paginas/CorridasAgendadas.js';
import CorridaAgendadaDetalhe from './paginas/CorridaAgendadaDetalhe.js';
import AguardandoMotorista from './paginas/AguardandoMotorista.js';
import HistoricoCorridas from './paginas/HistoricoCorridas.js';
import AvaliacaoCorrida from './paginas/AvaliacaoCorrida.js';
import Perfil from './paginas/Perfil.js';

const root = document.getElementById('render');
let currentPageResult = null;

const routes = {
	'/': Home,
	'/sobre': Sobre,
	'/login': Login,
	'/cadastro': Cadastro,
	'/corrida-ativa': CorridaAtiva,
	'/aguardando-motorista': AguardandoMotorista,
	'/corridas-agendadas': CorridasAgendadas,
	'/corrida-agendada': CorridaAgendadaDetalhe,
	'/historico': HistoricoCorridas,
	'/perfil': Perfil,
	'/avaliacao': AvaliacaoCorrida
};

function getCurrentPath() {
	const hash = window.location.hash || '#/';
	const full = hash.replace('#', '');
	return full.split('?')[0];
}

function getCurrentQuery() {
	const hash = window.location.hash || '#/';
	const full = hash.replace('#', '');
	const qIndex = full.indexOf('?');
	if (qIndex === -1) return {};
	return Object.fromEntries(new URLSearchParams(full.slice(qIndex + 1)));
}

function renderRoute() {
	if (currentPageResult && typeof currentPageResult.destroy === 'function') {
		currentPageResult.destroy();
	}

	const path = getCurrentPath();
	const query = getCurrentQuery();
	const Page = routes[path] || Home;
	const result = Page(path, query);
	currentPageResult = result;

	if (result && typeof result === 'object' && result.html) {
		root.innerHTML = result.html;
		result.init?.();
	} else {
		root.innerHTML = result;
	}

	window.scrollTo(0, 0);

	if (path !== '/') {
		document.dispatchEvent(new CustomEvent('app:ready'));
	}
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('load', () => {
	// Prepara as promessas antes do renderRoute para não perder o evento
	const animDone = new Promise(resolve => setTimeout(resolve, 1600));
	const pageDone = new Promise(resolve =>
		document.addEventListener('app:ready', resolve, { once: true })
	);

	if (!window.location.hash) {
		window.location.hash = '#/';
	}
	renderRoute();

	const splash = document.getElementById('splash');
	if (splash) {
		Promise.all([animDone, pageDone]).then(() => {
			splash.classList.add('hidden');
			splash.addEventListener('transitionend', () => splash.remove(), { once: true });
		});
	}
});