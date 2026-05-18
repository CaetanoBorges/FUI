import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { notificar } from '../componentes/Notificacao.js';
import './RotasFavoritasMotorista.css';

const CHAVE = 'gyro.driver.rotas_favoritas';

function lerJson(chave, padrao) {
    try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; }
    catch { return padrao; }
}
function escreverJson(chave, val) { localStorage.setItem(chave, JSON.stringify(val)); }

function listar() {
    return lerJson(CHAVE, []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function adicionar({ nome, origem, destino }) {
    const lista = lerJson(CHAVE, []);
    lista.push({ id: `RF-${Date.now()}`, nome, origem, destino, createdAt: new Date().toISOString() });
    escreverJson(CHAVE, lista);
}

function remover(id) {
    const lista = lerJson(CHAVE, []).filter(r => r.id !== id);
    escreverJson(CHAVE, lista);
}

function montarCard(rota) {
    return `
        <div class="rfm-card" data-id="${rota.id}">
            <div class="rfm-card-icon"><i class="fa-solid fa-map-pin"></i></div>
            <div class="rfm-card-body">
                <span class="rfm-card-nome">${rota.nome}</span>
                <div class="rfm-card-rota">
                    <span class="rfm-rota-ponto rfm-ponto-origem"></span>
                    <span class="rfm-rota-label">${rota.origem}</span>
                </div>
                <div class="rfm-card-rota">
                    <span class="rfm-rota-ponto rfm-ponto-destino"></span>
                    <span class="rfm-rota-label">${rota.destino}</span>
                </div>
            </div>
            <button class="rfm-btn-remove" data-rfm-remove="${rota.id}" title="Remover rota">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>`;
}

function montarVazio() {
    return `
        <div class="rfm-empty">
            <div class="rfm-empty-icon"><i class="fa-solid fa-route"></i></div>
            <p class="rfm-empty-title">Sem rotas favoritas</p>
            <p class="rfm-empty-desc">Guarda os percursos que fazes com mais frequência para os encontrar rapidamente.</p>
        </div>`;
}

function montarLista(rotas) {
    if (!rotas.length) return montarVazio();
    return rotas.map(montarCard).join('');
}

function montarPagina(rotas, rotaAtual) {
    return `
        ${HeaderMotorista(rotaAtual)}
        <main class="rfm-shell">
            <div class="rfm-container">
                <div class="rfm-page-header">
                    <h1 class="rfm-title"><i class="fa-solid fa-route"></i>Rotas Favoritas</h1>
                    <span class="rfm-count">${rotas.length} rota${rotas.length !== 1 ? 's' : ''}</span>
                </div>

                <!-- Formulário adicionar -->
                <div class="rfm-add-card">
                    <div class="rfm-add-header">
                        <i class="fa-solid fa-plus"></i>Adicionar rota
                    </div>
                    <form class="rfm-add-form" id="rfm-add-form" novalidate>
                        <input type="text" id="rfm-nome"    class="rfm-input" placeholder="Nome da rota (ex: Casa → Trabalho)" maxlength="60" />
                        <input type="text" id="rfm-origem"  class="rfm-input" placeholder="Origem" maxlength="80" />
                        <input type="text" id="rfm-destino" class="rfm-input" placeholder="Destino" maxlength="80" />
                        <span class="rfm-add-error" id="rfm-add-error"></span>
                        <button type="submit" class="rfm-btn-add">
                            <i class="fa-solid fa-bookmark"></i>Guardar rota
                        </button>
                    </form>
                </div>

                <!-- Lista -->
                <div id="rfm-lista">
                    ${montarLista(rotas)}
                </div>
            </div>
        </main>`;
}

export default function RotasFavoritasMotorista(rotaAtual = '/motorista/rotas-favoritas') {
    let rotas = listar();
    const html = montarPagina(rotas, rotaAtual);

    let ouvintes = [];
    function on(el, ev, fn) {
        if (!el) return;
        el.addEventListener(ev, fn);
        ouvintes.push({ el, ev, fn });
    }

    function reRenderLista() {
        rotas = listar();
        const lista = document.getElementById('rfm-lista');
        if (lista) lista.innerHTML = montarLista(rotas);
        const count = document.querySelector('.rfm-count');
        if (count) count.textContent = `${rotas.length} rota${rotas.length !== 1 ? 's' : ''}`;
        // Re-bind remove buttons after re-render
        bindRemove();
    }

    function bindRemove() {
        document.querySelectorAll('[data-rfm-remove]').forEach(btn => {
            on(btn, 'click', () => {
                remover(btn.dataset.rfmRemove);
                notificar('Rota removida.', 'aviso');
                reRenderLista();
            });
        });
    }

    function init() {
        // Formulário adicionar
        on(document.getElementById('rfm-add-form'), 'submit', (e) => {
            e.preventDefault();
            const nome    = document.getElementById('rfm-nome')?.value?.trim();
            const origem  = document.getElementById('rfm-origem')?.value?.trim();
            const destino = document.getElementById('rfm-destino')?.value?.trim();
            const err     = document.getElementById('rfm-add-error');

            if (!nome || !origem || !destino) {
                if (err) { err.textContent = 'Preenche todos os campos.'; err.classList.add('is-visible'); }
                return;
            }
            if (err) { err.textContent = ''; err.classList.remove('is-visible'); }

            adicionar({ nome, origem, destino });
            notificar('Rota guardada.', 'sucesso');

            // Limpar formulário
            ['rfm-nome', 'rfm-origem', 'rfm-destino'].forEach(id => {
                const el = document.getElementById(id); if (el) el.value = '';
            });

            reRenderLista();
        });

        bindRemove();
    }

    function destroy() {
        ouvintes.forEach(({ el, ev, fn }) => el?.removeEventListener(ev, fn));
        ouvintes = [];
    }

    return { html, init, destroy };
}
