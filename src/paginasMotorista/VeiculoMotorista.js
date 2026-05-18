import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { obterUsuarioAtual } from '../dados/authStorage.js';
import { notificar } from '../componentes/Notificacao.js';
import './VeiculoMotorista.css';

const CHAVE = 'gyro.driver.veiculo';

const CATEGORIAS = ['Económico', 'Conforto', 'SUV', 'Executivo', 'Moto'];
const CORES = ['Branco', 'Preto', 'Cinzento', 'Prateado', 'Azul', 'Vermelho', 'Verde', 'Amarelo', 'Laranja', 'Outro'];

function lerVeiculo() {
    try { const v = localStorage.getItem(CHAVE); return v ? JSON.parse(v) : null; }
    catch { return null; }
}
function guardarVeiculo(obj) { localStorage.setItem(CHAVE, JSON.stringify(obj)); }

function opcoesSelect(lista, selecionado) {
    return lista.map(o => `<option value="${o}" ${o === selecionado ? 'selected' : ''}>${o}</option>`).join('');
}

function iconePorCategoria(cat) {
    const mapa = { 'Moto': 'fa-motorcycle', 'SUV': 'fa-truck-pickup', 'Executivo': 'fa-star' };
    return mapa[cat] || 'fa-car';
}

function montarCardVeiculo(v) {
    if (!v) return `
        <div class="vmt-empty">
            <div class="vmt-empty-icon"><i class="fa-solid fa-car-side"></i></div>
            <p class="vmt-empty-title">Nenhum veículo registado</p>
            <p class="vmt-empty-desc">Adiciona o teu veículo para começar a aceitar corridas.</p>
        </div>`;

    const cat = v.categoria || 'Económico';
    return `
        <div class="vmt-veiculo-card">
            <div class="vmt-veiculo-icon"><i class="fa-solid ${iconePorCategoria(cat)}"></i></div>
            <div class="vmt-veiculo-info">
                <span class="vmt-veiculo-nome">${v.marca} ${v.modelo}</span>
                <span class="vmt-veiculo-mat">${v.matricula || '—'}</span>
            </div>
            <span class="vmt-veiculo-cat">${cat}</span>
        </div>`;
}

function montarCampo(id, label, valor, tipo = 'text', placeholder = '') {
    return `
        <div class="vmt-row">
            <div class="vmt-row-header">
                <span class="vmt-row-label">${label}</span>
                <button type="button" class="vmt-edit-btn" data-vmt-field="${id}">
                    <i class="fa-solid fa-pen"></i>Editar
                </button>
            </div>
            <div class="vmt-row-view" id="vmt-view-${id}">${valor || '<span style="color:#484f58">Não definido</span>'}</div>
            <form class="vmt-inline-form" id="vmt-form-${id}" novalidate>
                <input type="${tipo}" id="vmt-input-${id}" class="vmt-input"
                    value="${valor || ''}" placeholder="${placeholder}" />
                <div class="vmt-form-btns">
                    <button type="button" class="vmt-btn-cancel" data-vmt-cancel="${id}">Cancelar</button>
                    <button type="submit" class="vmt-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                </div>
            </form>
        </div>`;
}

function montarCampoSelect(id, label, opcoes, selecionado) {
    return `
        <div class="vmt-row">
            <div class="vmt-row-header">
                <span class="vmt-row-label">${label}</span>
                <button type="button" class="vmt-edit-btn" data-vmt-field="${id}">
                    <i class="fa-solid fa-pen"></i>Editar
                </button>
            </div>
            <div class="vmt-row-view" id="vmt-view-${id}">${selecionado || '<span style="color:#484f58">Não definido</span>'}</div>
            <form class="vmt-inline-form" id="vmt-form-${id}" novalidate>
                <select id="vmt-input-${id}" class="vmt-input vmt-select">
                    ${opcoesSelect(opcoes, selecionado)}
                </select>
                <div class="vmt-form-btns">
                    <button type="button" class="vmt-btn-cancel" data-vmt-cancel="${id}">Cancelar</button>
                    <button type="submit" class="vmt-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                </div>
            </form>
        </div>`;
}

function montarPagina(rotaAtual) {
    const veiculo = lerVeiculo();
    const v = veiculo || {};

    return `
        ${HeaderMotorista(rotaAtual)}
        <main class="vmt-shell">
            <div class="vmt-container">
                <div class="vmt-page-header">
                    <h1 class="vmt-title"><i class="fa-solid fa-car"></i>Meu Veículo</h1>
                </div>

                <!-- Card resumo -->
                <div id="vmt-resumo">${montarCardVeiculo(veiculo)}</div>

                <!-- Dados do veículo -->
                <div class="vmt-card">
                    <div class="vmt-card-label"><i class="fa-solid fa-id-card"></i>Identificação</div>
                    ${montarCampo('marca',     'Marca',     v.marca,     'text', 'Ex: Toyota')}
                    ${montarCampo('modelo',    'Modelo',    v.modelo,    'text', 'Ex: Corolla')}
                    ${montarCampo('ano',       'Ano',       v.ano,       'number', 'Ex: 2020')}
                    ${montarCampo('matricula', 'Matrícula', v.matricula, 'text', 'Ex: LD-12-34-AB')}
                </div>

                <div class="vmt-card">
                    <div class="vmt-card-label"><i class="fa-solid fa-palette"></i>Detalhes</div>
                    ${montarCampoSelect('cor',       'Cor',       CORES,       v.cor       || '')}
                    ${montarCampoSelect('categoria', 'Categoria', CATEGORIAS,  v.categoria || '')}
                    ${montarCampo('lugares', 'Nº de lugares', v.lugares, 'number', 'Ex: 4')}
                </div>

                <!-- Documentos -->
                <div class="vmt-card">
                    <div class="vmt-card-label"><i class="fa-solid fa-file-shield"></i>Documentos</div>
                    ${montarCampo('seguro',  'Apólice de seguro', v.seguro,  'text', 'Nº da apólice')}
                    ${montarCampo('licenca', 'Licença de condução', v.licenca, 'text', 'Nº da licença')}
                </div>
            </div>
        </main>`;
}

export default function VeiculoMotorista(rotaAtual = '/motorista/veiculo') {
    const html = montarPagina(rotaAtual);
    let ouvintes = [];

    function on(el, ev, fn) {
        if (!el) return;
        el.addEventListener(ev, fn);
        ouvintes.push({ el, ev, fn });
    }

    const CAMPOS = ['marca', 'modelo', 'ano', 'matricula', 'cor', 'categoria', 'lugares', 'seguro', 'licenca'];

    function abrirCampo(field) {
        CAMPOS.forEach(f => { if (f !== field) fecharCampo(f); });
        document.getElementById(`vmt-form-${field}`)?.classList.add('is-visible');
        document.getElementById(`vmt-view-${field}`)?.style.setProperty('display', 'none');
        document.getElementById(`vmt-input-${field}`)?.focus();
    }

    function fecharCampo(field) {
        const form = document.getElementById(`vmt-form-${field}`);
        const view = document.getElementById(`vmt-view-${field}`);
        form?.classList.remove('is-visible');
        if (view) view.style.display = '';
        const inp = document.getElementById(`vmt-input-${field}`);
        if (inp) {
            const veiculo = lerVeiculo() || {};
            inp.value = veiculo[field] || '';
        }
    }

    function guardarCampo(field) {
        const inp = document.getElementById(`vmt-input-${field}`);
        const val = inp?.value?.trim() || '';
        const veiculo = lerVeiculo() || {};
        veiculo[field] = val || undefined;
        guardarVeiculo(veiculo);

        const view = document.getElementById(`vmt-view-${field}`);
        if (view) view.innerHTML = val || '<span style="color:#484f58">Não definido</span>';
        fecharCampo(field);
        notificar('Dados guardados.', 'sucesso');

        // Atualizar resumo
        const resumo = document.getElementById('vmt-resumo');
        if (resumo) resumo.innerHTML = montarCardVeiculo(lerVeiculo());
    }

    function init() {
        document.querySelectorAll('[data-vmt-field]').forEach(btn => {
            on(btn, 'click', () => abrirCampo(btn.dataset.vmtField));
        });
        document.querySelectorAll('[data-vmt-cancel]').forEach(btn => {
            on(btn, 'click', () => fecharCampo(btn.dataset.vmtCancel));
        });
        CAMPOS.forEach(field => {
            on(document.getElementById(`vmt-form-${field}`), 'submit', (e) => {
                e.preventDefault();
                guardarCampo(field);
            });
        });
    }

    function destroy() {
        ouvintes.forEach(({ el, ev, fn }) => el?.removeEventListener(ev, fn));
        ouvintes = [];
    }

    return { html, init, destroy };
}
