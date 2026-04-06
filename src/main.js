import './style.css';
import Home from './paginas/Home.js';
import Sobre from './paginas/Sobre.js';

const root = document.getElementById('render');
let currentPageResult = null;

const routes = {
	'/': Home,
	'/sobre': Sobre
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
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('load', () => {
	if (!window.location.hash) {
		window.location.hash = '#/';
	}
	renderRoute();
});