/**
 * Sistema de notificações toast.
 * Uso: notificar('Mensagem')  — info por defeito
 *       notificar('Mensagem', 'erro')
 *       notificar('Mensagem', 'sucesso')
 *       notificar('Mensagem', 'aviso')
 */

const CONTAINER_ID = 'gyro-notif-container';
const DURACAO_MS   = 4000;
const SAIDA_MS     = 350;

const ICONES = {
    sucesso : 'fa-solid fa-circle-check',
    erro    : 'fa-solid fa-circle-xmark',
    aviso   : 'fa-solid fa-triangle-exclamation',
    info    : 'fa-solid fa-circle-info',
};

function obterContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(container);
    }
    return container;
}

export function notificar(mensagem, tipo = 'info') {
    const container = obterContainer();
    const item = document.createElement('div');
    item.className = `gyro-notif gyro-notif--${tipo}`;
    item.setAttribute('role', 'alert');
    item.innerHTML = `
        <i class="${ICONES[tipo] ?? ICONES.info} gyro-notif__icon"></i>
        <span class="gyro-notif__msg">${mensagem}</span>
        <button type="button" class="gyro-notif__close" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
    `;

    item.querySelector('.gyro-notif__close').addEventListener('click', () => remover(item));
    container.appendChild(item);

    // força reflow para activar transição de entrada
    // eslint-disable-next-line no-unused-expressions
    item.offsetHeight;
    item.classList.add('gyro-notif--visible');

    const timer = setTimeout(() => remover(item), DURACAO_MS);
    item._timer = timer;
}

function remover(item) {
    clearTimeout(item._timer);
    item.classList.remove('gyro-notif--visible');
    item.classList.add('gyro-notif--saindo');
    setTimeout(() => item.remove(), SAIDA_MS);
}
