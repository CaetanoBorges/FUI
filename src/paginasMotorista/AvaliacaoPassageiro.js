import HeaderMotorista from '../componentes/HeaderMotorista.js';
import {
    limparCorridaDriverAtiva,
    salvarCorridaDriverNoHistorico,
    obterCorridaDriverPendenteReview,
    limparCorridaDriverPendenteReview,
} from '../dados/corridaDriverStorage.js';
import './AvaliacaoPassageiro.css';

const TEXTOS_NOTA = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

const TAGS_POSITIVAS = ['Pontual', 'Educado', 'Comunicativo', 'Sem bagagem extra', 'Tranquilo'];
const TAGS_NEGATIVAS = ['Atrasado', 'Grosseiro', 'Bagagem excessiva', 'Comportamento inadequado', 'Cancelou tarde'];

let apNota = 0;
let apTagsSelecionadas = new Set();
let apHandlerEnviar = null;
let apCorrida = null;

function montarEstadoVazio(rotaAtual) {
    return `
        ${HeaderMotorista(rotaAtual)}
        <main class="ap-shell">
            <div class="ap-container">
                <div class="ap-empty">
                    <div class="ap-empty-icon"><i class="fa-solid fa-star-half-stroke"></i></div>
                    <h1>Nada a avaliar</h1>
                    <p>Não há nenhuma corrida concluída a aguardar avaliação.</p>
                    <a href="#/motorista" class="ap-btn-home"><i class="fa-solid fa-house"></i> Voltar ao início</a>
                </div>
            </div>
        </main>
    `;
}

export default function AvaliacaoPassageiro(rotaAtual = '/motorista/avaliacao-passageiro') {
    // Tenta obter a corrida que acabou de ser concluída
    apCorrida = obterCorridaDriverPendenteReview();

    // Se não existe corrida pendente de review, apresenta estado vazio
    if (!apCorrida) {
        return montarEstadoVazio(rotaAtual);
    }

    const passageiro = apCorrida.passenger || {};
    const tagsHtml = [...TAGS_POSITIVAS, ...TAGS_NEGATIVAS].map(t =>
        `<button type="button" class="ap-tag" data-tag="${t}">${t}</button>`
    ).join('');

    const html = `
        ${HeaderMotorista(rotaAtual)}
        <main class="ap-shell">
            <div class="ap-container">

                <div class="ap-header">
                    <div class="ap-icon"><i class="fa-solid fa-flag-checkered"></i></div>
                    <h1 class="ap-title">Corrida concluída!</h1>
                    <p class="ap-subtitle">Como foi a experiência com este passageiro? A sua avaliação é importante para a qualidade do serviço.</p>
                    <span class="ap-obrigatorio"><i class="fa-solid fa-lock"></i> Avaliação obrigatória</span>
                </div>

                ${passageiro.name ? `
                <div class="ap-passenger-card">
                    <div class="ap-passenger-avatar">${passageiro.initials ?? '?'}</div>
                    <div class="ap-passenger-info">
                        <span class="ap-passenger-name">${passageiro.name}</span>
                        <span class="ap-passenger-route">${apCorrida.pickup ?? ''} → ${apCorrida.destination ?? ''}</span>
                    </div>
                    <div class="ap-passenger-earnings">${apCorrida.earnings ?? ''}</div>
                </div>` : ''}

                <div class="ap-stars-section">
                    <span class="ap-stars-label">Nota do passageiro</span>
                    <div class="ap-stars" id="ap-stars">
                        ${[1,2,3,4,5].map(n => `<button type="button" class="ap-star" data-nota="${n}" aria-label="Nota ${n}"><i class="fa-solid fa-star"></i></button>`).join('')}
                    </div>
                    <span class="ap-stars-text" id="ap-stars-text"></span>
                </div>

                <div class="ap-tags-section">
                    <span class="ap-tags-label">O que se destacou?</span>
                    <div class="ap-tags" id="ap-tags">${tagsHtml}</div>
                </div>

                <div class="ap-comment-section">
                    <label class="ap-comment-label" for="ap-comment">Comentário (opcional)</label>
                    <textarea id="ap-comment" class="ap-comment-textarea" placeholder="Algum detalhe que queira partilhar sobre a corrida..." maxlength="300" rows="3"></textarea>
                </div>

                <button type="button" class="ap-btn-enviar" id="ap-btn-enviar" disabled>
                    <i class="fa-solid fa-paper-plane"></i> Enviar avaliação
                </button>

            </div>
        </main>
    `;

    function init() {
        apNota = 0;
        apTagsSelecionadas = new Set();

        // Estrelas
        document.getElementById('ap-stars')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.ap-star');
            if (!btn) return;
            apNota = parseInt(btn.dataset.nota, 10);

            document.querySelectorAll('.ap-star').forEach((s, i) => {
                s.classList.toggle('ativo', i < apNota);
            });

            const textoEl = document.getElementById('ap-stars-text');
            if (textoEl) textoEl.textContent = TEXTOS_NOTA[apNota] ?? '';

            validar();
        });

        // Tags
        document.getElementById('ap-tags')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.ap-tag');
            if (!btn) return;
            const tag = btn.dataset.tag;
            if (apTagsSelecionadas.has(tag)) {
                apTagsSelecionadas.delete(tag);
                btn.classList.remove('ativo');
            } else {
                apTagsSelecionadas.add(tag);
                btn.classList.add('ativo');
            }
        });

        function validar() {
            const btn = document.getElementById('ap-btn-enviar');
            if (btn) btn.disabled = apNota === 0;
        }

        const btnEnviar = document.getElementById('ap-btn-enviar');
        apHandlerEnviar = () => {
            const comentario = document.getElementById('ap-comment')?.value?.trim() ?? '';
            const corridaFinal = {
                ...apCorrida,
                passengerRating: apNota,
                passengerTags: [...apTagsSelecionadas],
                passengerComment: comentario || null,
            };
            salvarCorridaDriverNoHistorico(corridaFinal);
            limparCorridaDriverPendenteReview();
            limparCorridaDriverAtiva();
            window.location.hash = '#/motorista';
        };
        btnEnviar?.addEventListener('click', apHandlerEnviar);
    }

    function destroy() {
        const btnEnviar = document.getElementById('ap-btn-enviar');
        if (apHandlerEnviar) { btnEnviar?.removeEventListener('click', apHandlerEnviar); apHandlerEnviar = null; }
        apCorrida = null;
    }

    return { html, init, destroy };
}
