import './style.css';
import './componentes/Notificacao.css';
import './componentes/NotificacaoCentro.css';
import { inicializarCentroNotificacoes } from './componentes/NotificacaoCentro.js';
import { semeiarUtilizadoresMock } from './dados/mockSeeds.js';

semeiarUtilizadoresMock();
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
import HomeMotorista from './paginasMotorista/HomeMotorista.js';
import SobreMotorista from './paginasMotorista/SobreMotorista.js';
import PerfilMotorista from './paginasMotorista/PerfilMotorista.js';
import CorridaAtivaMotorista from './paginasMotorista/CorridaAtivaMotorista.js';
import HistoricoCorridasMotorista from './paginasMotorista/HistoricoCorridasMotorista.js';
import HistoricoDetalheMotorista from './paginasMotorista/HistoricoDetalheMotorista.js';
import AvaliacaoPassageiro from './paginasMotorista/AvaliacaoPassageiro.js';
import GanhosMotorista from './paginasMotorista/GanhosMotorista.js';
import CorridasAgendadasMotorista from './paginasMotorista/CorridasAgendadasMotorista.js';
import VeiculoMotorista from './paginasMotorista/VeiculoMotorista.js';
import RotasFavoritasMotorista from './paginasMotorista/RotasFavoritasMotorista.js';

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
	'/avaliacao': AvaliacaoCorrida,
	// ── Motorista ──
	'/motorista': HomeMotorista,
	'/motorista/sobre': SobreMotorista,
	'/motorista/perfil': PerfilMotorista,
	'/motorista/corrida-ativa': CorridaAtivaMotorista,
	'/motorista/historico': HistoricoCorridasMotorista,
	'/motorista/historico/detalhe': HistoricoDetalheMotorista,
	'/motorista/avaliacao-passageiro': AvaliacaoPassageiro,
	'/motorista/ganhos': GanhosMotorista,
	'/motorista/corridas-agendadas': CorridasAgendadasMotorista,
	'/motorista/veiculo': VeiculoMotorista,
	'/motorista/rotas-favoritas': RotasFavoritasMotorista,
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

const ROTAS_PUBLICAS = new Set(['/login', '/cadastro', '/cadastro/etapa1', '/cadastro/etapa2']);

// Rotas exclusivas — apenas /login e /cadastro são partilhadas
const ROTAS_SO_PASSAGEIRO = new Set(['/', '/sobre', '/perfil', '/corrida-ativa', '/aguardando-motorista', '/corridas-agendadas', '/corrida-agendada', '/historico', '/avaliacao']);
const ROTAS_SO_MOTORISTA  = new Set(['/motorista', '/motorista/sobre', '/motorista/perfil', '/motorista/corrida-ativa', '/motorista/historico', '/motorista/historico/detalhe', '/motorista/avaliacao-passageiro', '/motorista/ganhos']);

function renderizarRota() {
	if (resultadoPaginaAtual && typeof resultadoPaginaAtual.destroy === 'function') {
		resultadoPaginaAtual.destroy();
	}

	const caminho = obterCaminhoAtual();

	// Guarda de autenticação
	const sessaoRaw = localStorage.getItem('gyro.auth.current');
	if (!sessaoRaw && !ROTAS_PUBLICAS.has(caminho)) {
		window.location.replace('#/login');
		return;
	}

	// Guarda de perfil
	if (sessaoRaw) {
		const role = JSON.parse(sessaoRaw)?.role;
		if (role === 'motorista' && ROTAS_SO_PASSAGEIRO.has(caminho)) {
			window.location.replace('#/motorista');
			return;
		}
		if (role === 'passageiro' && ROTAS_SO_MOTORISTA.has(caminho)) {
			window.location.replace('#/');
			return;
		}
	}

	const parametros = obterQueryAtual();
	const sessao = sessaoRaw ? JSON.parse(sessaoRaw) : null;
	const paginaFallback = sessao?.role === 'motorista' ? HomeMotorista : Home;
	const Pagina = rotas[caminho] || paginaFallback;
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