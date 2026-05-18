import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { notificar } from '../componentes/Notificacao.js';
import rotasEmGrafo from '../dados/rotasEmGrafo.js';
import './RotasFavoritasMotorista.css';

const CHAVE = 'gyro.driver.rotas_favoritas';

// Extrai todas as rotas únicas do grafo
const ROTAS_PREDEFINIDAS = Object.entries(rotasEmGrafo).flatMap(([origem, features]) =>
    features.map(f => ({ id: `${origem}→${f.properties.destino}`, origem, destino: f.properties.destino }))
);

function lerFavoritos() {
    try { const v = localStorage.getItem(CHAVE); return v ? JSON.parse(v) : []; }
    catch { return []; }
}
function salvarFavoritos(lista) { localStorage.setItem(CHAVE, JSON.stringify(lista)); }

function isFavorito(id) { return lerFavoritos().some(r => r.id === id); }

function favoritar(rota) {
    const lista = lerFavoritos();
    if (!lista.find(r => r.id === rota.id)) lista.push({ ...rota, addedAt: new Date().toISOString() });
    salvarFavoritos(lista);
}

function desfavoritar(id) {
    salvarFavoritos(lerFavoritos().filter(r => r.id !== id));
}

// ── Templates ────────────────────────────────────────────

function cardFavorito(rota) {
    return `
        <div class="rfm-card rfm-card--fav" data-id="${rota.id}">
            <div class="rfm-card-icon"><i class="fa-solid fa-star"></i></div>
            <div class="rfm-card-body">
                <div class="rfm-card-rota">
                    <span class="rfm-rota-ponto rfm-ponto-origem"></span>
                    <span class="rfm-rota-label">${rota.origem}</span>
                </div>
                <div class="rfm-card-rota">
                    <span class="rfm-rota-ponto rfm-ponto-destino"></span>
                    <span class="rfm-rota-label">${rota.destino}</span>
                </div>
            </div>
            <button class="rfm-btn-remove" data-rfm-remove="${rota.id}" title="Remover dos favoritos">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>`;
}

function cardPredefinida(rota, jaSalva) {
    return `
        <div class="rfm-card rfm-card--pred" data-id="${rota.id}">
            <div class="rfm-card-icon rfm-card-icon--muted"><i class="fa-solid fa-route"></i></div>
            <div class="rfm-card-body">
                <div class="rfm-card-rota">
                    <span class="rfm-rota-ponto rfm-ponto-origem"></span>
                    <span class="rfm-rota-label">${rota.origem}</span>
                </div>
                <div class="rfm-card-rota">
                    <span class="rfm-rota-ponto rfm-ponto-destino"></span>
                    <span class="rfm-rota-label">${rota.destino}</span>
                </div>
            </div>
            ${jaSalva
                ? `<span class="rfm-badge-saved"><i class="fa-solid fa-check"></i></span>`
                : `<button class="rfm-btn-add-fav" data-rfm-add="${rota.id}" title="Adicionar aos favoritos">
                       <i class="fa-solid fa-bookmark"></i>
                   </button>`
            }
        </div>`;
}

function secaoFavoritos(favoritos) {
    if (!favoritos.length) return `
        <div class="rfm-empty">
            <div class="rfm-empty-icon"><i class="fa-solid fa-star"></i></div>
            <p class="rfm-empty-title">Nenhuma rota favorita</p>
            <p class="rfm-empty-desc">Pesquisa abaixo e guarda as rotas que mais usas.</p>
        </div>`;
    return favoritos.map(cardFavorito).join('');
}

const POR_PAGINA = 10;

function paginacaoHTML(pagina, total) {
    const totalPags = Math.ceil(total / POR_PAGINA);
    if (totalPags <= 1) return '';
    const inicio = pagina * POR_PAGINA + 1;
    const fim    = Math.min((pagina + 1) * POR_PAGINA, total);
    return `
        <div class="rfm-pag">
            <button class="rfm-pag-btn" data-rfm-pag="prev" ${pagina === 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span class="rfm-pag-info">${inicio}–${fim} de ${total}</span>
            <button class="rfm-pag-btn" data-rfm-pag="next" ${pagina >= totalPags - 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>`;
}

function secaoResultados(texto, favoritos, pagina) {
    const fav = new Set(favoritos.map(r => r.id));
    const q   = texto.toLowerCase();
    const filtradas = q
        ? ROTAS_PREDEFINIDAS.filter(r =>
            r.origem.toLowerCase().includes(q) || r.destino.toLowerCase().includes(q))
        : ROTAS_PREDEFINIDAS;

    if (!filtradas.length) return `
        <div class="rfm-sem-resultado">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>Sem resultados para "${texto}"</span>
        </div>`;

    const pagAtual  = Math.min(pagina, Math.max(0, Math.ceil(filtradas.length / POR_PAGINA) - 1));
    const fatia     = filtradas.slice(pagAtual * POR_PAGINA, (pagAtual + 1) * POR_PAGINA);

    return fatia.map(r => cardPredefinida(r, fav.has(r.id))).join('')
        + paginacaoHTML(pagAtual, filtradas.length);
}

function montarPagina(favoritos, rotaAtual) {
    return `
        ${HeaderMotorista(rotaAtual)}
        <main class="rfm-shell">
            <div class="rfm-container">
                <div class="rfm-page-header">
                    <h1 class="rfm-title"><i class="fa-solid fa-route"></i>Rotas Favoritas</h1>
                    <span class="rfm-count" id="rfm-count">${favoritos.length} favorita${favoritos.length !== 1 ? 's' : ''}</span>
                </div>

                <!-- Info banner -->
                <div class="rfm-info-banner">
                    <i class="fa-solid fa-circle-info rfm-info-icon"></i>
                    <p class="rfm-info-text">
                        Só recebes notificações de corridas agendadas por passageiros cujo percurso
                        corresponda a uma das tuas rotas favoritas. Guarda as rotas que habitualmente
                        fazes para não perder oportunidades.
                    </p>
                </div>

                <!-- Favoritos -->
                <div class="rfm-section-label">As minhas favoritas</div>
                <div id="rfm-lista-fav">${secaoFavoritos(favoritos)}</div>

                <!-- Pesquisa -->
                <div class="rfm-section-label">Pesquisar rotas</div>
                <div class="rfm-search-wrap">
                    <i class="fa-solid fa-magnifying-glass rfm-search-icon"></i>
                    <input type="text" id="rfm-pesquisa" class="rfm-search-input"
                        placeholder="Pesquisar por origem ou destino…" autocomplete="off" />
                </div>

                <!-- Resultados -->
                <div id="rfm-lista-pred">${secaoResultados('', favoritos, 0)}</div>
            </div>
        </main>`;
}

// ── Componente ────────────────────────────────────────────

export default function RotasFavoritasMotorista(rotaAtual = '/motorista/rotas-favoritas') {
    let favoritos = lerFavoritos();
    let paginaAtual = 0;
    const html = montarPagina(favoritos, rotaAtual);

    let ouvintes = [];
    function on(el, ev, fn) {
        if (!el) return;
        el.addEventListener(ev, fn);
        ouvintes.push({ el, ev, fn });
    }

    function atualizarFavs() {
        favoritos = lerFavoritos();
        const el = document.getElementById('rfm-lista-fav');
        if (el) el.innerHTML = secaoFavoritos(favoritos);
        const cnt = document.getElementById('rfm-count');
        if (cnt) cnt.textContent = `${favoritos.length} favorita${favoritos.length !== 1 ? 's' : ''}`;
        bindRemove();
    }

    function atualizarResultados(resetarPagina = false) {
        if (resetarPagina) paginaAtual = 0;
        const q  = document.getElementById('rfm-pesquisa')?.value?.trim() ?? '';
        const el = document.getElementById('rfm-lista-pred');
        if (el) el.innerHTML = secaoResultados(q, favoritos, paginaAtual);
        bindAdd();
        bindPaginacao();
    }

    function bindPaginacao() {
        document.querySelectorAll('[data-rfm-pag]').forEach(btn => {
            on(btn, 'click', () => {
                if (btn.dataset.rfmPag === 'prev') paginaAtual = Math.max(0, paginaAtual - 1);
                else paginaAtual++;
                atualizarResultados();
                document.getElementById('rfm-lista-pred')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    function mostrarConfirmacaoRemover(btn) {
        const id   = btn.dataset.rfmRemove;
        const card = btn.closest('.rfm-card');
        if (!card) return;

        // Trocar botão por confirmação inline
        btn.replaceWith(criarConfirmacao(id, card));
    }

    function criarConfirmacao(id, card) {
        const wrap = document.createElement('div');
        wrap.className = 'rfm-confirm-wrap';
        wrap.innerHTML = `
            <span class="rfm-confirm-label">Remover?</span>
            <button class="rfm-confirm-sim">Sim</button>
            <button class="rfm-confirm-nao">Não</button>`;

        wrap.querySelector('.rfm-confirm-sim').addEventListener('click', () => {
            desfavoritar(id);
            notificar('Rota removida dos favoritos.', 'aviso');
            atualizarFavs();
            atualizarResultados();
        });

        wrap.querySelector('.rfm-confirm-nao').addEventListener('click', () => {
            // Restaurar botão original
            const btn = document.createElement('button');
            btn.className = 'rfm-btn-remove';
            btn.dataset.rfmRemove = id;
            btn.title = 'Remover dos favoritos';
            btn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
            wrap.replaceWith(btn);
            on(btn, 'click', () => mostrarConfirmacaoRemover(btn));
        });

        return wrap;
    }

    function bindRemove() {
        document.querySelectorAll('[data-rfm-remove]').forEach(btn => {
            on(btn, 'click', () => mostrarConfirmacaoRemover(btn));
        });
    }

    function bindAdd() {
        document.querySelectorAll('[data-rfm-add]').forEach(btn => {
            on(btn, 'click', () => {
                const rota = ROTAS_PREDEFINIDAS.find(r => r.id === btn.dataset.rfmAdd);
                if (!rota) return;
                favoritar(rota);
                notificar('Rota adicionada aos favoritos.', 'sucesso');
                atualizarFavs();
                atualizarResultados();
            });
        });
    }

    function init() {
        on(document.getElementById('rfm-pesquisa'), 'input', () => atualizarResultados(true));
        bindRemove();
        bindAdd();
        bindPaginacao();
    }

    function destroy() {
        ouvintes.forEach(({ el, ev, fn }) => el?.removeEventListener(ev, fn));
        ouvintes = [];
    }

    return { html, init, destroy };
}
