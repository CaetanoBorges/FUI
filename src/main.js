import './style.css';
import Home from './paginas/Home.js';
import Sobre from './paginas/Sobre.js';
import Login from './paginas/Login.js';
import Cadastro from './paginas/Cadastro.js';

const root = document.getElementById('render');
let currentPageResult = null;

const routes = {
	'/': Home,
	'/sobre': Sobre,
	'/login': Login,
	'/cadastro': Cadastro
};

function getCurrentPath() {
	const hash = window.location.hash || '#/';
	return hash.replace('#', '');
}

function renderRoute() {
	if (currentPageResult && typeof currentPageResult.destroy === 'function') {
		currentPageResult.destroy();
	}

	const path = getCurrentPath();
	const Page = routes[path] || Home;
	const result = Page(path);
	currentPageResult = result;

	if (result && typeof result === 'object' && result.html) {
		root.innerHTML = result.html;
		result.init?.();
	} else {
		root.innerHTML = result;
	}

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