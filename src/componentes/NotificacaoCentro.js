const CHAVE = 'gyro.notifications';
const MODAL_ID = 'nc-modal';
const BELL_ID = 'nc-bell-btn';

// ── Persistência ───────────────────────────────────────────────────────────
function lerNotificacoes() {
    try {
        const raw = localStorage.getItem(CHAVE);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return [];
    }
}

function escreverNotificacoes(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
}

// ── Dados semente ──────────────────────────────────────────────────────────
function criarSemente() {
    const agora = Date.now();
    return [
        {
            id: 'notif-seed-1',
            createdAt: new Date(agora - 12 * 60 * 1000).toISOString(),
            tipo: 'confirmado',
            titulo: 'Agendamento confirmado',
            corpo: 'Carlos Mendes aceitou a tua corrida para Sambizanga.',
            lida: false,
            link: '#/corridas-agendadas',
        },
        {
            id: 'notif-seed-2',
            createdAt: new Date(agora - 2 * 60 * 60 * 1000).toISOString(),
            tipo: 'aviso',
            titulo: 'Corrida prestes a iniciar',
            corpo: 'A tua corrida de Ingombota → Talatona começa em 30 minutos.',
            lida: false,
            link: '#/corridas-agendadas',
        },
        {
            id: 'notif-seed-3',
            createdAt: new Date(agora - 1 * 24 * 60 * 60 * 1000).toISOString(),
            tipo: 'geral',
            titulo: 'Corrida concluída',
            corpo: 'A tua viagem de Centro → Aeroporto foi concluída. Avalia a experiência!',
            lida: true,
            link: '#/historico',
        },
    ];
}

function garantirSemente() {
    if (lerNotificacoes() === null) {
        escreverNotificacoes(criarSemente());
    }
}

// ── API pública ────────────────────────────────────────────────────────────
export function listarNotificacoes() {
    return lerNotificacoes() ?? [];
}

export function contarNaoLidas() {
    return listarNotificacoes().filter(n => !n.lida).length;
}

export function marcarTodasLidas() {
    const lista = listarNotificacoes().map(n => ({ ...n, lida: true }));
    escreverNotificacoes(lista);
}

export function adicionarNotificacao(titulo, corpo, tipo = 'geral', link = null) {
    const nova = {
        id: `notif-${Date.now()}`,
        createdAt: new Date().toISOString(),
        tipo,
        titulo,
        corpo,
        lida: false,
        link,
    };
    const lista = [nova, ...listarNotificacoes()];
    escreverNotificacoes(lista);
    atualizarBadge();
}

// ── HTML do sino (embed no Header) ────────────────────────────────────────
export function iconeBellHtml() {
    garantirSemente();
    const count = contarNaoLidas();
    return `
        <button class="nc-bell-btn" id="${BELL_ID}" aria-label="Notificações">
            <i class="fa-solid fa-bell"></i>
            ${count > 0 ? `<span class="nc-bell-badge">${count > 9 ? '9+' : count}</span>` : ''}
        </button>
    `;
}

// ── Formatação de tempo relativo ───────────────────────────────────────────
function formatarTempo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1)  return 'Agora mesmo';
    if (min < 60) return `Há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `Há ${h}h`;
    const d = Math.floor(h / 24);
    if (d === 1)  return 'Ontem';
    return `Há ${d} dias`;
}

// ── Ícone por tipo ─────────────────────────────────────────────────────────
const ICONES_TIPO = {
    confirmado: 'circle-check',
    aviso:      'triangle-exclamation',
    cancelado:  'circle-xmark',
    geral:      'bell',
};

// ── Renderização do item ───────────────────────────────────────────────────
function renderItem(n) {
    const icone = ICONES_TIPO[n.tipo] ?? 'bell';
    return `
        <div class="nc-item${n.lida ? '' : ' nc-item--nova'}" data-id="${n.id}">
            <div class="nc-item-icon nc-icon--${n.tipo}">
                <i class="fa-solid fa-${icone}"></i>
            </div>
            <div class="nc-item-body">
                <p class="nc-item-titulo">${n.titulo}</p>
                <p class="nc-item-corpo">${n.corpo}</p>
                <span class="nc-item-tempo">${formatarTempo(n.createdAt)}</span>
            </div>
            ${n.link ? `<a href="${n.link}" class="nc-item-ver" onclick="document.getElementById('${MODAL_ID}')?.remove()">Ver</a>` : ''}
        </div>
    `;
}

// ── Modal ──────────────────────────────────────────────────────────────────
function abrirModal() {
    if (document.getElementById(MODAL_ID)) return;

    const notifs = listarNotificacoes();
    const naoLidas = notifs.filter(n => !n.lida).length;

    const backdrop = document.createElement('div');
    backdrop.id = MODAL_ID;
    backdrop.className = 'nc-backdrop';

    const listaHtml = notifs.length
        ? notifs.map(renderItem).join('')
        : `<div class="nc-empty">
               <i class="fa-solid fa-bell-slash"></i>
               <p>Sem notificações</p>
           </div>`;

    backdrop.innerHTML = `
        <div class="nc-panel" role="dialog" aria-modal="true" aria-label="Notificações">
            <div class="nc-panel-drag"></div>
            <div class="nc-panel-head">
                <h2 class="nc-panel-titulo">Notificações</h2>
                <div class="nc-panel-acoes">
                    ${naoLidas > 0 ? `<button class="nc-btn-lidas" id="nc-btn-lidas">Marcar como lidas</button>` : ''}
                    <button class="nc-btn-fechar" id="nc-fechar" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div class="nc-lista">${listaHtml}</div>
        </div>
    `;

    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('nc-visivel'));

    // Fechar ao clicar no backdrop
    backdrop.addEventListener('click', e => {
        if (e.target === backdrop) fecharModal();
    });
    document.getElementById('nc-fechar').addEventListener('click', fecharModal);

    // Marcar todas como lidas
    document.getElementById('nc-btn-lidas')?.addEventListener('click', () => {
        marcarTodasLidas();
        atualizarBadge();
        // re-renderizar lista sem fechar
        const painel = backdrop.querySelector('.nc-lista');
        painel.innerHTML = listarNotificacoes().map(renderItem).join('');
        backdrop.querySelector('.nc-btn-lidas')?.remove();
    });

    // Navegação por item – fechar modal ao clicar em "Ver"
    backdrop.querySelectorAll('.nc-item-ver').forEach(a => {
        a.addEventListener('click', () => fecharModal());
    });
}

function fecharModal() {
    const el = document.getElementById(MODAL_ID);
    if (!el) return;
    el.classList.remove('nc-visivel');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
}

// ── Atualiza badge no DOM ──────────────────────────────────────────────────
function atualizarBadge() {
    const btn = document.getElementById(BELL_ID);
    if (!btn) return;
    const count = contarNaoLidas();
    let badge = btn.querySelector('.nc-bell-badge');
    if (count > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'nc-bell-badge';
            btn.appendChild(badge);
        }
        badge.textContent = count > 9 ? '9+' : count;
    } else {
        badge?.remove();
    }
}

// ── Inicialização (chamar após cada render do Header) ──────────────────────
export function inicializarCentroNotificacoes() {
    garantirSemente();
    const btn = document.getElementById(BELL_ID);
    if (!btn) return;
    btn.addEventListener('click', abrirModal);
}
