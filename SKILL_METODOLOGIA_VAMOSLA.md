# Skill: Metodologia de Desenvolvimento Frontend (padrão VamosLa)

## Objetivo
Reaplicar em outros projetos o mesmo modelo de **frontend Vite (SPA com hash routing)**, com organização simples, escalável e fácil de manter.

---

## Metodologia JavaScript usada neste projeto

Este projeto usa uma combinação de padrões JS simples e consistentes:

1. **ES Modules (ESM)**
   - Projeto configurado com `"type": "module"`.
   - Importação/exportação nativa com `import` e `export`.
   - Organização por módulos pequenos e coesos.

2. **Vanilla JS modular (sem framework de UI)**
   - Não usa React/Vue/Angular.
   - Componentes e páginas são funções JavaScript que retornam HTML e comportamento.

3. **SPA com hash routing**
   - Navegação por `window.location.hash`.
   - Tabela de rotas no `main.js`.
   - Re-render controlado por mudança de rota, sem recarregar a página inteira.

4. **Padrão funcional com lifecycle**
   - Cada página segue o contrato `html + init + destroy`.
   - `init()` monta eventos/integrações.
   - `destroy()` desmonta tudo para evitar vazamentos.

5. **Arquitetura orientada a domínio no frontend**
   - `paginas` para fluxo de navegação.
   - `componentes` para blocos reutilizáveis.
   - `dados` para storage, serviços e normalização.

6. **Comunicação por eventos quando necessário**
   - Uso de eventos customizados (ex.: `CustomEvent`) para sincronizar partes da UI sem acoplamento excessivo.

---

## Bibliotecas frontend padrão deste projeto

Além de Vanilla JS, este projeto adota as bibliotecas abaixo no frontend:

1. **Select avançado: Tom Select**
   - Uso: busca e seleção rica em campos de rota/opções.
   - Referência global em runtime: `window.TomSelect`.
   - Convenção: inicializar no `init()` e destruir no `destroy()`.

2. **Calendário/data e hora: Flatpickr**
   - Uso: seleção de data/hora para agendamento.
   - Referência global em runtime: `window.flatpickr`.
   - Localização: `flatpickr.l10ns.pt` (pt).
   - Convenção: criar no `init()` e chamar `destroy()` no cleanup.

3. **Ícones: Font Awesome Free**
   - Uso: ícones de ação e status na UI.
   - Prefixo padrão no projeto: `fa-solid` + ícone (`fa-car`, `fa-clock`, etc.).
   - Regra: usar somente o pacote **free** (sem ícones Pro).

4. **Carregamento de dependências**
   - Padrão atual do projeto: bibliotecas carregadas via CDN no `index.html`.
   - Em componentes, validar dependências antes de iniciar (`if (!window.TomSelect || !window.flatpickr) return;`).

---

## 1) Princípios da metodologia

1. **Separação clara por camadas (frontend)**
   - `src/paginas`: telas/rotas.
   - `src/componentes`: blocos reutilizáveis de UI/comportamento.
   - `src/dados`: storage local, serviços de frontend e utilitários de domínio.

2. **Baixa complexidade e alta legibilidade**
   - Cada arquivo tem uma responsabilidade principal.
   - Evitar abstrações prematuras.
   - Preferir funções explícitas e nomes descritivos.

3. **Fluxo orientado a lifecycle**
   - Cada página retorna `html`, `init()` e opcionalmente `destroy()`.
   - `init` liga eventos e inicializa recursos.
   - `destroy` limpa listeners, timers, mapas, watchers e estado transitório.

4. **UX resiliente**
   - Sempre prever loading, erro e fallback.
   - Não travar a interface por dependências externas (mapa, geolocalização, scanner etc.).

---

## 2) Estrutura padrão para novos projetos

```txt
meu-projeto/
  package.json
  src/
    main.js
    style.css
    componentes/
    paginas/
    dados/
  public/
  index.html
```

---

## 3) Contrato de página (obrigatório)

Toda página deve seguir este formato:

```js
import './MinhaPagina.css';

export default function MinhaPagina(rotaAtual = '/') {
  function html() {
    return `<main>...</main>`;
  }

  function init() {
    // listeners, binds, setup de plugins e estado inicial
  }

  function destroy() {
    // cleanup completo
  }

  return {
    html: html(),
    init,
    destroy
  };
}
```

### 3.1) Regra de CSS para páginas

Nas páginas, o CSS pode seguir **um destes dois padrões válidos**:

1. **Arquivo separado com o mesmo nome da página**
   - Exemplo: `Home.js` + `Home.css`
   - Padrão recomendado quando a página tem estilo próprio e reutilizável.
   - Importação no topo do módulo: `import './Home.css';`

2. **CSS dentro da própria página**
   - Usado quando o estilo é muito local ou depende fortemente da estrutura daquela página.
   - Normalmente aplicado com bloco `<style>` dentro do HTML retornado.

Regra prática:
- Se o CSS crescer, reutilizar ou precisar de manutenção isolada, usar arquivo separado com o mesmo nome.
- Se o CSS for muito pequeno e totalmente acoplado à página, pode ficar dentro do módulo.

**Regra de ouro:** se criou recurso em `init`, precisa limpar em `destroy`.

---

## 4) Contrato de componente (explícito)

Neste projeto existem **dois contratos válidos para componentes**.

### 4.1) Componente simples/presentacional

Usado quando o componente apenas monta HTML e não precisa de lifecycle próprio.

```js
import './MeuComponente.css';

export default function MeuComponente(props = {}) {
   return `
      <section class="meu-componente">
         <h2>${props.titulo ?? 'Título'}</h2>
      </section>
   `;
}
```

Responsabilidades:
- Receber dados por parâmetros.
- Retornar apenas uma string HTML.
- Não manter estado complexo interno.
- Não criar dependências que exijam cleanup próprio.

### 4.2) Componente interativo/com lifecycle

Usado quando o componente precisa de plugins, listeners, mapa, calendário, selects ou estado interno.

```js
import './MeuComponente.css';

export default function MeuComponente() {
   function html() {
      return `
         <section class="meu-componente">
            <div id="meu-alvo"></div>
         </section>
      `;
   }

   function init(contexto) {
      // bind de eventos, plugins, mapa, selects, calendário etc.

      return {
         destroy() {
            // cleanup completo do componente
         }
      };
   }

   return {
      html: html(),
      init
   };
}
```

Responsabilidades:
- Expor `html` e `init` quando houver comportamento complexo.
- Receber dependências externas por parâmetro em `init(contexto)` quando necessário.
- Retornar um lifecycle interno com `destroy()` quando o componente criar recursos próprios.
- Destruir plugins e listeners criados no componente.
- Evitar acoplamento direto desnecessário com outras páginas.

### 4.2.1) Regra de CSS para componentes

Nos componentes, o CSS também pode seguir **um destes dois padrões válidos**:

1. **Arquivo separado com o mesmo nome do componente**
   - Exemplo: `Header.js` + `Header.css`
   - Recomendado para componentes reutilizáveis.
   - Importação no topo do módulo: `import './Header.css';`

2. **CSS dentro do próprio componente**
   - Permitido quando o estilo é extremamente local ao componente.
   - Exemplo comum: componente complexo que injeta `<style>` dentro do HTML retornado.

Regra prática:
- Componentes reutilizáveis devem preferir arquivo CSS separado com o mesmo nome.
- Componentes muito específicos podem manter CSS interno, desde que isso não dificulte manutenção.

### 4.3) Regra de uso dentro das páginas

Quando a página usar componente interativo:
- A página renderiza `componente.html` dentro do seu HTML.
- A página chama `componente.init(...)` no próprio `init()`.
- O retorno de `componente.init(...)` deve ser guardado pela página.
- A página chama `destroy()` desse lifecycle no próprio `destroy()`.

Exemplo:

```js
import MeuComponente from '../componentes/MeuComponente.js';

export default function MinhaPagina() {
   let componente = null;
   let componenteLifecycle = null;

   function html() {
      componente = MeuComponente();

      return `
         <main>
            ${componente.html}
         </main>
      `;
   }

   function init() {
      componenteLifecycle = componente?.init?.();
   }

   function destroy() {
      componenteLifecycle?.destroy?.();
   }

   return {
      html: html(),
      init,
      destroy
   };
}
```

**Regra de ouro dos componentes:** componente simples retorna HTML; componente complexo retorna `html + init`; e todo recurso criado precisa de cleanup explícito.

---

## 5) Contrato de roteamento (SPA)

O roteamento por hash deve seguir este contrato explícito em `src/main.js`:

```js
import Home from './paginas/Home.js';
import Sobre from './paginas/Sobre.js';

const root = document.getElementById('render');
let currentPageResult = null;

const routes = {
   '/': Home,
   '/sobre': Sobre
};

function getCurrentPath() {
   const hash = window.location.hash || '#/';
   return hash.replace('#', '');
}

function renderRoute() {
   if (currentPageResult && typeof currentPageResult.destroy === 'function') {
      currentPageResult.destroy();
   }

   const path = getCurrentPath();
   const Page = routes[path] || Home;
   const result = Page(path);
   currentPageResult = result;

   if (result && typeof result === 'object' && result.html) {
      root.innerHTML = result.html;
      result.init?.();
   } else {
      root.innerHTML = result;
   }
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('load', () => {
   if (!window.location.hash) {
      window.location.hash = '#/';
   }

   renderRoute();
});
```

Responsabilidades obrigatórias do contrato:
- Definir um objeto `routes` com o mapeamento `path -> Page`.
- Implementar `getCurrentPath()` para ler a rota atual a partir do hash.
- Implementar `renderRoute()` como função central de troca de tela.
- Destruir a página anterior antes de renderizar a próxima.
- Renderizar `result.html` quando a página retornar objeto com lifecycle.
- Executar `result.init?.()` após inserir o HTML no DOM.
- Aplicar fallback para rota padrão quando a rota não existir.
- Garantir hash inicial (`#/`) ao carregar a aplicação.

Checklist de roteamento:
- [ ] Rota inválida cai em página padrão.
- [ ] Navegação não acumula listeners.
- [ ] Estado da página anterior não “vaza”.

---

## 6) Camada de dados no frontend (obrigatório)

Tudo que for acesso a dados no front deve ficar em `src/dados/*`.

Padrão recomendado:
- Arquivo por domínio (`authStorage.js`, `geoService.js`, `formUtils.js`, etc.).
- Funções retornam dado normalizado para UI.
- Erros com mensagem amigável para exibição.
- Configurações centralizadas em constantes.

Exemplo de convenção:
- `authStorage.js`: leitura/escrita de sessão no `localStorage`.
- `rotasEmGrafo.js`: fonte de dados de rota consumida por componentes.
- `selectService.js`: configuração e helpers para Tom Select.
- `dateTimeService.js`: configuração de calendário com Flatpickr.

---

## 7) Fluxo de desenvolvimento por feature (frontend)

1. **Definir escopo mínimo (MVP da feature)**
   - Qual problema resolve?
   - Qual resultado visível na tela?

2. **Desenhar impacto por camada**
   - Página afetada (`src/paginas`).
   - Componentes novos/alterados (`src/componentes`).
   - Dados locais/serviços (`src/dados`).

3. **Implementar em ordem**
   - UI estática -> comportamento -> integração de dados -> estados de erro/loading.

4. **Garantir cleanup e resiliência**
   - Revisar `destroy()`.
   - Testar rota trocando de tela várias vezes.

5. **Validar execução local**
   - Front: `npm run dev`

6. **Finalizar com checklist de entrega**
   - Sem erro no console.
   - Fluxo principal funcionando.
   - Mensagens de erro claras para usuário.

---

## 8) Definition of Done (DoD)

Uma feature só está pronta quando:
- [ ] Está alinhada com a estrutura por camadas.
- [ ] Segue contrato `html/init/destroy` quando aplicável.
- [ ] Não cria vazamento de listener/timer/watch.
- [ ] Tem tratamento de erro e loading no frontend.
- [ ] Mantém consistência visual e de navegação.
- [ ] Código legível para manutenção por outro dev.

---

## 9) Aplicar esta metodologia em projetos já existentes

Sim, esta metodologia pode ser aplicada a um projeto já existente **sem alterar o aspeto visual nem a funcionalidade**, desde que a adoção seja feita como **refatoração estrutural**.

### 9.1) O que pode mudar internamente

- Organização dos ficheiros.
- Separação entre `paginas`, `componentes` e `dados`.
- Padronização de lifecycle com `init()` e `destroy()`.
- Centralização do hash routing.
- Isolamento de lógica em módulos mais pequenos.

### 9.2) O que deve permanecer igual

- HTML final renderizado para o utilizador.
- Classes CSS já existentes.
- Aparência visual.
- Fluxo de navegação.
- Funcionalidades e comportamento esperado.

### 9.3) Regra principal da migração

Migrar **sem redesign**.

Ou seja:
- não alterar markup sem necessidade;
- não renomear classes CSS sem motivo;
- não trocar comportamento que já funciona;
- não reescrever tudo de uma só vez.

### 9.4) Estratégia recomendada

Fazer a migração de forma **incremental**:

1. Mapear a estrutura atual.
2. Identificar páginas, blocos reutilizáveis e módulos de dados.
3. Mover uma parte de cada vez para `paginas`, `componentes` e `dados`.
4. Preservar o mesmo HTML e as mesmas classes CSS.
5. Introduzir `init()` e `destroy()` apenas onde fizer sentido.
6. Validar cada tela antes de avançar para a próxima.

### 9.5) Checklist de migração segura

- [ ] O aspeto visual continua igual.
- [ ] As classes CSS antigas foram preservadas.
- [ ] O fluxo funcional continua igual.
- [ ] Eventos antigos continuam a disparar corretamente.
- [ ] Não foram criados regressões no console.
- [ ] A nova estrutura ficou mais organizada sem mudar a experiência final.

### 9.6) Resultado esperado

O projeto mantém a mesma experiência para o utilizador, mas fica internamente mais organizado, mais previsível e mais fácil de evoluir.

---

## 10) Template rápido para iniciar outro projeto

Use este roteiro:

1. Criar base Vite.
2. Replicar pastas: `paginas`, `componentes`, `dados`.
3. Implementar `main.js` com hash routing e lifecycle.
4. Criar 2 páginas iniciais (ex.: Home e Sobre) usando contrato padrão.
5. Criar 1 módulo de dados local (`src/dados`) com normalização e tratamento de erro.
6. Ligar scripts no `package.json` (`dev`, `build`, `preview`).

---

## 11) Prompt pronto (para IA/Copilot)

> “Aplique a metodologia frontend VamosLa neste projeto: mantenha separação em `paginas`, `componentes` e `dados`; use SPA com hash routing; garanta lifecycle com `init`/`destroy`; centralize dados e serviços em `src/dados`; implemente tratamento de loading/erro no frontend. Faça mudanças mínimas, sem adicionar complexidade desnecessária.”

---

## Resultado esperado

Com essa skill, você mantém um padrão consistente de frontend entre projetos: **arquitetura simples, previsível e escalável**, com foco em manutenção fácil e evolução por features.