# Centro de Notificações — `NotificacaoCentro`

## Visão geral

O **Centro de Notificações** é um componente independente que fornece:

- Um **botão sino** fixo no canto superior direito do header, com **badge** de contagem de não lidas.
- Um **modal bottom-sheet** que lista todas as notificações do utilizador.
- Uma **API pública** para adicionar e consultar notificações a partir de qualquer parte da aplicação.
- **Persistência** em `localStorage`, garantindo que as notificações sobrevivem a recarregamentos de página.

---

## Ficheiros

| Ficheiro | Papel |
|---|---|
| `src/componentes/NotificacaoCentro.js` | Lógica, API pública, renderização do sino e do modal |
| `src/componentes/NotificacaoCentro.css` | Estilos do botão sino, badge, backdrop e painel |

---

## Princípio de funcionamento

```
Primeira visita
      │
      ▼
garantirSemente()
  └─ localStorage vazio? → escreve 3 notificações semente
      │
      ▼
iconeBellHtml()          ← chamado dentro de Header()
  └─ lê contarNaoLidas()
  └─ retorna HTML do botão <button id="nc-bell-btn">
      │
      ▼
Header() injeta o HTML no DOM
      │
      ▼
inicializarCentroNotificacoes()   ← chamado em main.js após cada render
  └─ obtém #nc-bell-btn do DOM
  └─ anexa listener: clique → abrirModal()
      │
      ▼
Utilizador clica no sino
      │
      ▼
abrirModal()
  └─ lê listarNotificacoes()
  └─ cria <div id="nc-modal"> e appenda ao <body>
  └─ requestAnimationFrame → adiciona .nc-visivel (animação CSS)
  └─ anexa listeners: fechar, marcar lidas, navegar por "Ver"
      │
      ▼
Utilizador clica "Marcar como lidas"
  └─ marcarTodasLidas() → atualiza localStorage
  └─ atualizarBadge()  → remove ou atualiza o <span.nc-bell-badge>
  └─ re-renderiza a lista sem fechar o modal
      │
      ▼
Utilizador fecha o modal (X, backdrop ou link "Ver")
  └─ fecharModal()
      └─ remove .nc-visivel → CSS aplica transição de saída
      └─ transitionend → el.remove() (limpa o DOM)
```

---

## Estrutura de dados — Notificação

Cada notificação é um objecto JS guardado em `localStorage` sob a chave `gyro.notifications`.

```js
{
  id:        string,   // "notif-<timestamp>" ou "notif-seed-N" (dados semente)
  createdAt: string,   // ISO 8601 — ex: "2026-05-15T10:30:00.000Z"
  tipo:      string,   // ver tipos abaixo
  titulo:    string,   // texto curto, exibido em negrito
  corpo:     string,   // descrição da notificação
  lida:      boolean,  // false = não lida (destaca com barra azul lateral)
  link:      string | null  // hash de navegação — ex: "#/corridas-agendadas"
}
```

### Tipos disponíveis

| Tipo | Ícone (Font Awesome) | Cor |
|---|---|---|
| `confirmado` | `fa-circle-check` | Verde `#3fb950` |
| `aviso` | `fa-triangle-exclamation` | Amarelo `#e3b341` |
| `cancelado` | `fa-circle-xmark` | Vermelho `#f85149` |
| `geral` | `fa-bell` | Azul `#58a6ff` |

---

## API pública

### `iconeBellHtml()`

Retorna a string HTML do botão sino para ser embebida no `Header`.  
Chama `garantirSemente()` internamente — garante que o `localStorage` tem dados na primeira visita.

```js
import { iconeBellHtml } from './NotificacaoCentro.js';

// Usado dentro de Header.js:
`<header>
    ${iconeBellHtml()}
</header>`
```

**Retorna:** `string` — HTML do `<button id="nc-bell-btn">` com badge opcional.

---

### `inicializarCentroNotificacoes()`

Localiza o botão `#nc-bell-btn` no DOM e anexa o listener de clique que abre o modal.  
Deve ser chamada **depois de cada render de página**, porque o Header é reinjectado no DOM em cada navegação.

```js
import { inicializarCentroNotificacoes } from './NotificacaoCentro.js';

// Em main.js, após renderizarRota():
inicializarCentroNotificacoes();
```

> Se o botão não existir no DOM (ex.: página sem Header), a função sai silenciosamente sem erro.

---

### `adicionarNotificacao(titulo, corpo, tipo?, link?)`

Adiciona uma nova notificação não lida e actualiza o badge no DOM imediatamente.

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `titulo` | `string` | ✓ | Título curto da notificação |
| `corpo` | `string` | ✓ | Descrição detalhada |
| `tipo` | `string` | — | `'confirmado'` \| `'aviso'` \| `'cancelado'` \| `'geral'` (default) |
| `link` | `string \| null` | — | Hash de navegação — ex: `'#/corridas-agendadas'` |

```js
import { adicionarNotificacao } from '../componentes/NotificacaoCentro.js';

// Exemplo: motorista aceitou corrida agendada
adicionarNotificacao(
    'Agendamento confirmado',
    'Manuel da Silva aceitou a tua corrida para Talatona.',
    'confirmado',
    '#/corridas-agendadas'
);

// Exemplo: aviso sem link de navegação
adicionarNotificacao(
    'Corrida prestes a iniciar',
    'A tua corrida começa em 15 minutos.',
    'aviso'
);
```

---

### `listarNotificacoes()`

Retorna o array completo de notificações (lidas e não lidas), ordenado do mais recente para o mais antigo.

```js
import { listarNotificacoes } from '../componentes/NotificacaoCentro.js';

const todas = listarNotificacoes();
// [ { id, createdAt, tipo, titulo, corpo, lida, link }, ... ]
```

---

### `contarNaoLidas()`

Retorna o número de notificações com `lida: false`.

```js
import { contarNaoLidas } from '../componentes/NotificacaoCentro.js';

const total = contarNaoLidas(); // ex: 2
```

---

### `marcarTodasLidas()`

Define `lida: true` em todas as notificações e persiste no `localStorage`.  
Não actualiza o badge automaticamente — chamar `atualizarBadge()` se necessário  
(dentro do modal isso é feito internamente).

```js
import { marcarTodasLidas } from '../componentes/NotificacaoCentro.js';

marcarTodasLidas();
```

---

## Integração com o Header

O `Header.js` importa `iconeBellHtml()` e inclui-o dentro do `<header>`:

```
<header class="hm-header-floating">
    [hamburger — esquerda]    [logo — centro]    [sino — direita]
</header>
```

O layout do header após a integração:

| Posição | Elemento | CSS |
|---|---|---|
| Esquerda | Botão hamburger | `position: absolute; left: 1rem` |
| Centro | Logo da app (`ico.svg`) | `position: absolute; left: 50%; transform: translateX(-50%)` |
| Direita | Botão sino | `position: absolute; right: 1rem` |

---

## Fluxo de inicialização em `main.js`

```js
import './componentes/NotificacaoCentro.css';
import { inicializarCentroNotificacoes } from './componentes/NotificacaoCentro.js';

function renderizarRota() {
    // ... render do HTML da página (inclui Header → inclui sino) ...
    raiz.innerHTML = resultado;

    inicializarCentroNotificacoes(); // ← anexa listener após o HTML estar no DOM
}
```

---

## Dados semente

Na **primeira visita** (quando `gyro.notifications` não existe no `localStorage`), o componente cria automaticamente 3 notificações de exemplo:

| # | Tipo | Estado | Descrição |
|---|---|---|---|
| 1 | `confirmado` | Não lida | "Carlos Mendes aceitou a tua corrida para Sambizanga." |
| 2 | `aviso` | Não lida | "A tua corrida de Ingombota → Talatona começa em 30 minutos." |
| 3 | `geral` | Lida | "A tua viagem de Centro → Aeroporto foi concluída." |

Para repor os dados semente (útil em desenvolvimento), basta remover a chave do `localStorage`:

```js
localStorage.removeItem('gyro.notifications');
```

---

## Comportamento do modal

1. **Abertura** — clique no sino cria o `<div id="nc-modal">` no `<body>` e aplica `.nc-visivel` via `requestAnimationFrame` para disparar a transição CSS de entrada (slide-up).
2. **Idempotência** — se o modal já estiver aberto, `abrirModal()` retorna sem criar duplicados.
3. **Fechar** — disponível por três formas: botão ×, clicar fora do painel (no backdrop) ou clicar em "Ver" num item.
4. **Saída animada** — `fecharModal()` remove `.nc-visivel` e aguarda o evento `transitionend` antes de remover o elemento do DOM.
5. **Marcar como lidas** — actualiza o `localStorage`, re-renderiza a lista *in-place* e remove o próprio botão, tudo sem fechar o modal.
6. **Navegação** — o botão "Ver" de cada item é um `<a href>` com o hash de destino; ao clicar fecha o modal e o router SPA trata da navegação.

---

## Formato de tempo relativo

A função interna `formatarTempo(iso)` converte `createdAt` num texto legível:

| Diferença | Texto exibido |
|---|---|
| < 1 minuto | `Agora mesmo` |
| 1 – 59 minutos | `Há N min` |
| 1 – 23 horas | `Há Nh` |
| 24 horas | `Ontem` |
| > 1 dia | `Há N dias` |

---

## Persistência — chave localStorage

| Chave | Valor |
|---|---|
| `gyro.notifications` | `JSON.stringify(Notificacao[])` |

A leitura é protegida com `try/catch`: se o valor armazenado estiver corrompido, a função `lerNotificacoes()` devolve `[]` em vez de lançar erro.
