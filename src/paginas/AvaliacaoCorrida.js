import Header from '../componentes/Header.js';
import { obterCorridaAtiva, limparCorridaAtiva, salvarCorridaNoHistorico } from '../dados/corridaStorage.js';
import './AvaliacaoCorrida.css';

const TEXTOS_NOTA = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

const TAGS_POSITIVAS = ['Pontual', 'Educado', 'Carro limpo', 'Boa conversa', 'Direção suave'];
const TAGS_NEGATIVAS = ['Atrasado', 'Rota errada', 'Carro sujo', 'Condução perigosa', 'Grosseiro'];

let avCorrida = null;
let avNota = 0;
let avTagsSelecionadas = new Set();
let avHandlerEnviar = null;

function montarEstadoVazio(rotaAtual) {
    return `
        ${Header('Avaliação', rotaAtual, true)}
        <main class="av-shell">
            <div class="av-container">
                <div class="av-empty">
                    <div class="av-empty-icon"><i class="fa-solid fa-star-half-stroke"></i></div>
                    <h1>Nada a avaliar</h1>
                    <p>Não há nenhuma corrida concluída aguardando avaliação.</p>
                    <a href="#/" class="av-btn-voltar"><i class="fa-solid fa-house"></i> Ir para a Home</a>
                </div>
            </div>
        </main>
    `;
}

function montarPagina(corrida, rotaAtual) {
    const motorista = corrida.driver || {};
    const tagsHtml = [...TAGS_POSITIVAS, ...TAGS_NEGATIVAS].map(t =>
        `<button type="button" class="av-tag" data-tag="${t}">${t}</button>`
    ).join('');

    return `
        ${Header('Avaliar corrida', rotaAtual, true)}
        <main class="av-shell">
            <div class="av-container">

                <div class="av-header">
                    <div class="av-icon"><i class="fa-solid fa-flag-checkered"></i></div>
                    <h1 class="av-title">Corrida concluída!</h1>
                    <p class="av-subtitle">Como foi a sua experiência? A avaliação ajuda a manter a qualidade do serviço.</p>
                    <span class="av-obrigatorio"><i class="fa-solid fa-lock"></i> Avaliação obrigatória</span>
                </div>

                ${motorista.name ? `
                <div class="av-driver-card">
                    <div class="av-driver-avatar">${motorista.initials || '?'}</div>
                    <div class="av-driver-info">
                        <span class="av-driver-name">${motorista.name}</span>
                        <span class="av-driver-vehicle">${motorista.vehicleBrand || ''} · ${motorista.vehicleColor || ''} · ${motorista.plate || ''}</span>
                    </div>
                </div>` : ''}

                <div class="av-stars-section">
                    <span class="av-stars-label">Nota da corrida</span>
                    <div class="av-stars" id="av-stars">
                        ${[1,2,3,4,5].map(i =>
                            `<span class="av-star" data-value="${i}" role="button" aria-label="${i} estrela${i > 1 ? 's' : ''}">★</span>`
                        ).join('')}
                    </div>
                    <span class="av-stars-texto" id="av-stars-texto">Toque numa estrela para avaliar</span>
                </div>

                <div class="av-comentario-section">
                    <span class="av-comentario-label">Tags rápidas</span>
                    <div class="av-tags" id="av-tags">${tagsHtml}</div>
                </div>

                <div class="av-comentario-section">
                    <label class="av-comentario-label" for="av-comentario">Comentário (opcional)</label>
                    <textarea
                        id="av-comentario"
                        class="av-textarea"
                        placeholder="Conte como foi a viagem..."
                        maxlength="300"
                    ></textarea>
                </div>

                <button type="button" class="av-btn-enviar" id="av-btn-enviar" disabled>
                    <i class="fa-solid fa-paper-plane"></i> Enviar avaliação
                </button>

            </div>
        </main>
    `;
}

function atualizarEstrelas() {
    document.querySelectorAll('#av-stars .av-star').forEach(s => {
        const v = parseInt(s.dataset.value, 10);
        s.classList.toggle('filled', v <= avNota);
    });
    const textoEl = document.getElementById('av-stars-texto');
    if (textoEl) textoEl.textContent = avNota ? TEXTOS_NOTA[avNota] : 'Toque numa estrela para avaliar';
    const btn = document.getElementById('av-btn-enviar');
    if (btn) btn.disabled = avNota === 0;
}

export default function AvaliacaoCorrida(rotaAtual = '/avaliacao') {
    avCorrida = obterCorridaAtiva();

    // Só mostra se a corrida está marcada como "pendente de avaliação"
    if (!avCorrida || avCorrida._pendingRating !== true) {
        avCorrida = null;
    }

    return {
        html: avCorrida ? montarPagina(avCorrida, rotaAtual) : montarEstadoVazio(rotaAtual),
        init() {
            if (!avCorrida) return;

            avNota = 0;
            avTagsSelecionadas = new Set();
            atualizarEstrelas();

            // Impede o botão "voltar" de contornar a avaliação obrigatória
            history.replaceState({ avaliacao: true }, '');
            const onPopState = () => {
                history.pushState({ avaliacao: true }, '');
            };
            window.addEventListener('popstate', onPopState);
            // guarda para remover no destroy
            avCorrida.__popstateHandler = onPopState;

            // ── Estrelas ──
            const starsEl = document.getElementById('av-stars');
            if (starsEl) {
                starsEl.addEventListener('mouseover', (e) => {
                    const star = e.target.closest('.av-star');
                    if (!star) return;
                    const hv = parseInt(star.dataset.value, 10);
                    document.querySelectorAll('#av-stars .av-star').forEach(s => {
                        const v = parseInt(s.dataset.value, 10);
                        s.classList.toggle('filled', v <= avNota);
                        s.classList.toggle('hovered', v <= hv);
                    });
                });
                starsEl.addEventListener('mouseleave', () => {
                    document.querySelectorAll('#av-stars .av-star').forEach(s => {
                        s.classList.remove('hovered');
                    });
                    atualizarEstrelas();
                });
                starsEl.addEventListener('click', (e) => {
                    const star = e.target.closest('.av-star');
                    if (!star) return;
                    avNota = parseInt(star.dataset.value, 10);
                    atualizarEstrelas();
                });
            }

            // ── Tags ──
            const tagsEl = document.getElementById('av-tags');
            if (tagsEl) {
                tagsEl.addEventListener('click', (e) => {
                    const tag = e.target.closest('.av-tag');
                    if (!tag) return;
                    const val = tag.dataset.tag;
                    if (avTagsSelecionadas.has(val)) {
                        avTagsSelecionadas.delete(val);
                        tag.classList.remove('av-tag-on');
                    } else {
                        avTagsSelecionadas.add(val);
                        tag.classList.add('av-tag-on');
                    }
                });
            }

            // ── Enviar ──
            const btnEnviar = document.getElementById('av-btn-enviar');
            avHandlerEnviar = () => {
                if (avNota === 0) return;

                btnEnviar.disabled = true;
                btnEnviar.classList.add('av-enviando');
                btnEnviar.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> A enviar...';

                const comentario = document.getElementById('av-comentario')?.value?.trim() || '';
                const rideComAvaliacao = {
                    ...avCorrida,
                    _pendingRating: false,
                    status: 'completed',
                    rating: {
                        nota: avNota,
                        texto: TEXTOS_NOTA[avNota],
                        tags: [...avTagsSelecionadas],
                        comentario,
                        avaliadoEm: new Date().toISOString()
                    }
                };

                salvarCorridaNoHistorico(rideComAvaliacao);
                limparCorridaAtiva();
                avCorrida = null;

                setTimeout(() => {
                    window.location.hash = '#/historico';
                }, 800);
            };
            btnEnviar?.addEventListener('click', avHandlerEnviar);
        },
        destroy() {
            if (avCorrida?.__popstateHandler) {
                window.removeEventListener('popstate', avCorrida.__popstateHandler);
            }
            const btnEnviar = document.getElementById('av-btn-enviar');
            if (btnEnviar && avHandlerEnviar) {
                btnEnviar.removeEventListener('click', avHandlerEnviar);
                avHandlerEnviar = null;
            }
        }
    };
}
