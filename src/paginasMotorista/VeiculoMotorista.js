import HeaderMotorista from '../componentes/HeaderMotorista.js';
import { obterUsuarioAtual } from '../dados/authStorage.js';
import { notificar } from '../componentes/Notificacao.js';
import './VeiculoMotorista.css';

const CHAVE = 'gyro.driver.veiculo';

const CATEGORIAS = ['Carro', 'Moto'];
const CORES = ['Branco', 'Preto', 'Cinzento', 'Prateado', 'Azul', 'Vermelho', 'Verde', 'Amarelo', 'Laranja', 'Outro'];
const LUGARES = ['1', '2', '3', '4'];

const SECOES = {
    identificacao: ['marca', 'modelo', 'ano', 'matricula'],
    detalhes:      ['cor', 'categoria', 'lugares'],
    documentos:    ['seguro', 'licenca'],
};
const LIMITE_MS = 48 * 3600 * 1000;

function secaoDoCampo(field) {
    return Object.keys(SECOES).find(s => SECOES[s].includes(field));
}

function isBloqueado(ts) {
    if (!ts) return false;
    return (Date.now() - new Date(ts).getTime()) > LIMITE_MS;
}

function tempoDesde(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins  = Math.floor(diff / 60000);
    if (mins < 60)  return `${mins} min`;
    const horas = Math.floor(diff / 3600000);
    if (horas < 24) return `${horas}h`;
    return `${Math.floor(horas / 24)}d`;
}

function horasRestantes(ts) {
    const elapsed = Date.now() - new Date(ts).getTime();
    return Math.max(0, Math.ceil((LIMITE_MS - elapsed) / 3600000));
}

function lerVeiculo() {
    try { const v = localStorage.getItem(CHAVE); return v ? JSON.parse(v) : null; }
    catch { return null; }
}
function guardarVeiculo(obj) { localStorage.setItem(CHAVE, JSON.stringify(obj)); }

function opcoesSelect(lista, selecionado) {
    return lista.map(o => `<option value="${o}" ${o === selecionado ? 'selected' : ''}>${o}</option>`).join('');
}

function iconePorCategoria(cat) {
    const mapa = { 'Moto': 'fa-motorcycle' };
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

function montarCampo(id, label, valor, tipo = 'text', placeholder = '', locked = false) {
    return `
        <div class="vmt-row">
            <div class="vmt-row-header">
                <span class="vmt-row-label">${label}</span>
                ${locked ? '' : `<button type="button" class="vmt-edit-btn" data-vmt-field="${id}">
                    <i class="fa-solid fa-pen"></i>Editar
                </button>`}
            </div>
            <div class="vmt-row-view" id="vmt-view-${id}">${valor || '<span style="color:#484f58">Não definido</span>'}</div>
            ${locked ? '' : `<form class="vmt-inline-form" id="vmt-form-${id}" novalidate>
                <input type="${tipo}" id="vmt-input-${id}" class="vmt-input"
                    value="${valor || ''}" placeholder="${placeholder}" />
                <div class="vmt-form-btns">
                    <button type="button" class="vmt-btn-cancel" data-vmt-cancel="${id}">Cancelar</button>
                    <button type="submit" class="vmt-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                </div>
            </form>`}
        </div>`;
}

function montarCampoSelect(id, label, opcoes, selecionado, locked = false) {
    return `
        <div class="vmt-row">
            <div class="vmt-row-header">
                <span class="vmt-row-label">${label}</span>
                ${locked ? '' : `<button type="button" class="vmt-edit-btn" data-vmt-field="${id}">
                    <i class="fa-solid fa-pen"></i>Editar
                </button>`}
            </div>
            <div class="vmt-row-view" id="vmt-view-${id}">${selecionado || '<span style="color:#484f58">Não definido</span>'}</div>
            ${locked ? '' : `<form class="vmt-inline-form" id="vmt-form-${id}" novalidate>
                <select id="vmt-input-${id}" class="vmt-input vmt-select">
                    ${opcoesSelect(opcoes, selecionado)}
                </select>
                <div class="vmt-form-btns">
                    <button type="button" class="vmt-btn-cancel" data-vmt-cancel="${id}">Cancelar</button>
                    <button type="submit" class="vmt-btn-confirm"><i class="fa-solid fa-check"></i>Guardar</button>
                </div>
            </form>`}
        </div>`;
}

function formatarData(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function labelSecao(icone, nome, ts) {
    if (!ts) return `<div class="vmt-card-label"><i class="fa-solid ${icone}"></i>${nome}</div>`;
    const bloq = isBloqueado(ts);
    const data = formatarData(ts);
    const badge = bloq
        ? `<span class="vmt-ts vmt-ts--lock"><i class="fa-solid fa-lock"></i>Bloqueado · ${data}</span>`
        : `<span class="vmt-ts vmt-ts--ok"><i class="fa-solid fa-clock"></i>${data} · editável por mais ${horasRestantes(ts)}h</span>`;
    return `<div class="vmt-card-label"><span><i class="fa-solid ${icone}"></i>${nome}</span>${badge}</div>`;
}

function montarPagina(rotaAtual) {
    const veiculo = lerVeiculo();
    const v = veiculo || {};
    const tsI = v._ts_identificacao;
    const tsD = v._ts_detalhes;
    const tsDoc = v._ts_documentos;
    const lI   = isBloqueado(tsI);
    const lD   = isBloqueado(tsD);
    const lDoc = isBloqueado(tsDoc);

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
                    ${labelSecao('fa-id-card', 'Identificação', tsI)}
                    ${montarCampo('marca',     'Marca',     v.marca,     'text', 'Ex: Toyota', lI)}
                    ${montarCampo('modelo',    'Modelo',    v.modelo,    'text', 'Ex: Corolla', lI)}
                    ${montarCampo('ano',       'Ano',       v.ano,       'number', 'Ex: 2020', lI)}
                    ${montarCampo('matricula', 'Matrícula', v.matricula, 'text', 'Ex: LD-12-34-AB', lI)}
                </div>

                <div class="vmt-card">
                    ${labelSecao('fa-palette', 'Detalhes', tsD)}
                    ${montarCampoSelect('cor',       'Cor',           CORES,      v.cor       || '',      lD)}
                    ${montarCampoSelect('categoria', 'Categoria',     CATEGORIAS, v.categoria || 'Carro', lD)}
                    ${montarCampoSelect('lugares',   'Nº de lugares', LUGARES,    v.lugares   || '4',    lD)}
                </div>

                <!-- Documentos -->
                <div class="vmt-card">
                    ${labelSecao('fa-file-shield', 'Documentos', tsDoc)}
                    ${montarCampo('seguro',  'Apólice de seguro',   v.seguro,  'text', 'Nº da apólice', lDoc)}
                    ${montarCampo('licenca', 'Licença de condução', v.licenca, 'text', 'Nº da licença', lDoc)}
                </div>
            </div>
        </main>`;
}

export default function VeiculoMotorista(rotaAtual = '/motorista/veiculo') {
    const html = montarPagina(rotaAtual);
    let ouvintes = [];
    const tsInstances = {};  // TomSelect instances por campo

    function on(el, ev, fn) {
        if (!el) return;
        el.addEventListener(ev, fn);
        ouvintes.push({ el, ev, fn });
    }

    const CAMPOS = ['marca', 'modelo', 'ano', 'matricula', 'cor', 'categoria', 'lugares', 'seguro', 'licenca'];
    const SELECT_CAMPOS = ['cor', 'categoria', 'lugares'];
    const DEFAULTS = { categoria: 'Carro', lugares: '4' };

    function abrirCampo(field) {
        const veiculo = lerVeiculo() || {};
        // Lugares bloqueado se categoria for Moto
        if (field === 'lugares' && veiculo.categoria === 'Moto') {
            notificar('Em motos o número de lugares é sempre 1.', 'info');
            return;
        }
        // Bloquear se a secção já passou as 48h
        const secao = secaoDoCampo(field);
        if (secao && isBloqueado(veiculo[`_ts_${secao}`])) {
            notificar('Esta secção já não pode ser editada (48h ultrapassadas).', 'erro');
            return;
        }
        CAMPOS.forEach(f => { if (f !== field) fecharCampo(f); });
        document.getElementById(`vmt-form-${field}`)?.classList.add('is-visible');
        document.getElementById(`vmt-view-${field}`)?.style.setProperty('display', 'none');

        if (SELECT_CAMPOS.includes(field)) {
            // Destruir instância anterior se existir
            tsInstances[field]?.destroy();
            const el = document.getElementById(`vmt-input-${field}`);
            if (el && window.TomSelect) {
                tsInstances[field] = new window.TomSelect(el, {
                    create: false,
                    maxOptions: null,
                    controlInput: null,  // sem campo de pesquisa (listas curtas)
                    dropdownParent: 'body',
                });
            }
        } else {
            document.getElementById(`vmt-input-${field}`)?.focus();
        }
    }

    function fecharCampo(field) {
        const form = document.getElementById(`vmt-form-${field}`);
        const view = document.getElementById(`vmt-view-${field}`);
        form?.classList.remove('is-visible');
        if (view) view.style.display = '';
        // Destruir TomSelect antes de repor valor (evita conflitos)
        if (SELECT_CAMPOS.includes(field) && tsInstances[field]) {
            tsInstances[field].destroy();
            delete tsInstances[field];
        }
        const inp = document.getElementById(`vmt-input-${field}`);
        if (inp) {
            const veiculo = lerVeiculo() || {};
            inp.value = veiculo[field] || DEFAULTS[field] || '';
        }
    }

    function guardarCampo(field) {
        // Ler valor: TomSelect ou input normal
        const val = tsInstances[field]
            ? (tsInstances[field].getValue() || DEFAULTS[field] || '')
            : (document.getElementById(`vmt-input-${field}`)?.value?.trim() || DEFAULTS[field] || '');
        const veiculo = lerVeiculo() || {};
        veiculo[field] = val || undefined;

        // Registar timestamp da secção na primeira gravação
        const secao = secaoDoCampo(field);
        if (secao && !veiculo[`_ts_${secao}`]) {
            veiculo[`_ts_${secao}`] = new Date().toISOString();
        }

        // Moto → lugares fixo em 1
        if (field === 'categoria' && val === 'Moto') {
            veiculo.lugares = '1';
            const lugaresView = document.getElementById('vmt-view-lugares');
            if (lugaresView) lugaresView.innerHTML = '1';
            const lugaresInp = document.getElementById('vmt-input-lugares');
            if (lugaresInp) lugaresInp.value = '1';
        }

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
        Object.values(tsInstances).forEach(ts => ts.destroy());
    }

    return { html, init, destroy };
}
