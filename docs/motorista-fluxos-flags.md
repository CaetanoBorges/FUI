# Documentação — Perfil Motorista

> **Projeto:** FUI (Vanilla JS SPA · Vite · Leaflet · localStorage)
> **Atualizado:** 18 mai 2026

---

## Índice

1. [Arquitetura geral](#1-arquitetura-geral)
2. [Flags de localStorage](#2-flags-de-localstorage)
3. [Fluxos do motorista](#3-fluxos-do-motorista)
   - 3.1 [Entrar online e receber pedido](#31-entrar-online-e-receber-pedido)
   - 3.2 [Corrida ativa — fase embarque](#32-corrida-ativa--fase-embarque)
   - 3.3 [Corrida ativa — fase viagem](#33-corrida-ativa--fase-viagem)
   - 3.4 [Cancelamento pelo motorista](#34-cancelamento-pelo-motorista)
   - 3.5 [Avaliação do passageiro](#35-avaliação-do-passageiro)
4. [Estrutura de dados](#4-estrutura-de-dados)
5. [Rotas do router](#5-rotas-do-router)
6. [Ficheiros relevantes](#6-ficheiros-relevantes)

---

## 1. Arquitetura geral

O perfil motorista é uma SPA com roteamento por hash (`#/motorista/...`). Todos os estados são persistidos em `localStorage` via três chaves exclusivas. O perfil de passageiro e motorista **partilham** as páginas de Login e Cadastro — não existem duplicações.

```
Login / Cadastro (partilhado)
        │
        ▼
  #/motorista  ──────────────────────────────────────────┐
  HomeMotorista                                          │
  (toggle online/offline, mapa, recepção de pedido)     │
        │                                                │
  aceita pedido                                          │
        │                                                │
        ▼                                                │
  #/motorista/corrida-ativa                              │
  CorridaAtivaMotorista                                  │
  fase: embarque → viagem                                │
        │                          cancela               │
        │───────────────────────────────────────────────►│
        │                                                │
  conclui corrida                                        │
        │                                                │
        ▼                                                │
  #/motorista/avaliacao-passageiro                       │
  AvaliacaoPassageiro                                    │
        │                                                │
  envia avaliação ─────────────────────────────────────►┘
```

---

## 2. Flags de localStorage

Todas as chaves são geridas por `src/dados/corridaDriverStorage.js`.

| Chave | Tipo | Ciclo de vida | Função |
|-------|------|--------------|--------|
| `gyro.ride.driver.active` | `object \| null` | Criada ao aceitar um pedido; removida ao concluir ou cancelar | Corrida em andamento do motorista |
| `gyro.rides.driver.history` | `array` | Persistente; seed de 7 corridas carregada na 1.ª visita ao histórico | Histórico completo de corridas (concluídas e canceladas) |
| `gyro.ride.driver.pending_review` | `object \| null` | Criada ao concluir corrida; removida ao enviar avaliação | Ponte entre `CorridaAtivaMotorista` → `AvaliacaoPassageiro` |

### Transições de estado da flag `gyro.ride.driver.active`

```
null
  │  aceitar pedido (HomeMotorista)
  ▼
{ status: 'pending_pickup', ... }   ← fase embarque
  │  clicar "Passageiro a bordo" (CorridaAtivaMotorista)
  ▼
{ status: 'in_progress', ... }      ← fase viagem
  │
  ├─ clicar "Concluir corrida" ──► null  (limparCorridaDriverAtiva)
  └─ clicar "Cancelar" ──────────► null  (limparCorridaDriverAtiva)
```

---

## 3. Fluxos do motorista

### 3.1 Entrar online e receber pedido

**Página:** `#/motorista` — `HomeMotorista.js`

1. Motorista abre a app → mapa Leaflet centrado em Luanda.
2. O botão de toggle inicia em **offline** (`hdOnline = false`).
3. Ao activar o toggle → `hdOnline = true` → `atualizarStatusUI()` mostra o ponto verde e o texto "À procura de corridas…".
4. `agendarPedido()` dispara um `setTimeout` aleatório entre **6 s e 12 s**.
5. Após o timeout → `mostrarPedido(pedido)` apresenta o card deslizante:
   - Timer visual de **20 segundos** (barra de progresso regressiva).
   - Se expirar sem resposta → card ocultado, novo ciclo `agendarPedido()`.
6. **Aceitar pedido:**
   - Cria objeto de corrida com `status: 'pending_pickup'`.
   - Chama `salvarCorridaDriverAtiva(corrida)` → escreve em `gyro.ride.driver.active`.
   - Navega para `#/motorista/corrida-ativa`.
7. **Rejeitar pedido:**
   - Oculta card, aguarda novo ciclo.
8. Se `obterCorridaDriverAtiva()` retornar valor ao carregar a página → banner de aviso mostrado com link para `#/motorista/corrida-ativa`.

---

### 3.2 Corrida ativa — fase embarque

**Página:** `#/motorista/corrida-ativa` — `CorridaAtivaMotorista.js`

Condição de entrada: `corrida.status === 'pending_pickup'`

1. Mapa com marcador do motorista (ícone verde) e marcador de pickup (ícone verde escuro).
2. Polyline verde a ligar as posições.
3. Geolocalização activa (`watchPosition`) → marcador actualizado em tempo real.
4. Timer incremental iniciado com `setInterval(1 s)`.
5. Botão principal: **"Passageiro a bordo"**
   - `corrida.status = 'in_progress'`
   - `salvarCorridaDriverAtiva(corrida)` actualiza a flag.
   - `window.location.hash = '#/motorista/corrida-ativa'` → re-renderiza na fase viagem.

---

### 3.3 Corrida ativa — fase viagem

**Página:** `#/motorista/corrida-ativa` — `CorridaAtivaMotorista.js`

Condição de entrada: `corrida.status === 'in_progress'`

1. Mapa com marcador do motorista + marcador de destino (ícone vermelho).
2. Polyline azul a ligar as posições.
3. Timer continua incrementando.
4. Botão principal: **"Concluir corrida"**
   - Cria objeto `corridaConcluida` com dados da corrida, duração real e `status: 'completed'`.
   - `salvarCorridaDriverNoHistorico(corridaConcluida)` → adiciona ao histórico.
   - `salvarCorridaDriverPendenteReview(corridaConcluida)` → escreve em `gyro.ride.driver.pending_review`.
   - `limparCorridaDriverAtiva()` → remove `gyro.ride.driver.active`.
   - Navega para `#/motorista/avaliacao-passageiro`.

---

### 3.4 Cancelamento pelo motorista

**Disponível em ambas as fases** (embarque e viagem) via botão "Cancelar corrida".

1. `abrirModalCancelamento()` monta um bottom-sheet com 6 motivos:
   - Passageiro não apareceu
   - Passageiro pediu para cancelar
   - Problema com o veículo
   - Emergência pessoal
   - Endereço inacessível
   - Outro motivo *(activa textarea livre)*
2. Botão "Confirmar" fica desactivado até seleccionar um motivo.
3. Ao confirmar:
   - Cria `corridaCancelada` com `status: 'cancelled'`, motivo e duração até ao momento.
   - `salvarCorridaDriverNoHistorico(corridaCancelada)` → regista no histórico.
   - `limparCorridaDriverAtiva()` → remove `gyro.ride.driver.active`.
   - Navega para `#/motorista`.
4. **Nota:** corrida cancelada **não passa** por `gyro.ride.driver.pending_review` — não há avaliação de passageiro em cancelamentos.

---

### 3.5 Avaliação do passageiro

**Página:** `#/motorista/avaliacao-passageiro` — `AvaliacaoPassageiro.js`

1. Lê `gyro.ride.driver.pending_review` via `obterCorridaDriverPendenteReview()`.
2. Se `null` → apresenta estado vazio ("Nada a avaliar") com link para `#/motorista`.
3. Campos do formulário:
   - **Estrelas 1–5** (obrigatório para activar o botão Enviar).
   - **Tags** positivas/negativas (opcional, multi-selecção):
     - Positivas: Pontual, Educado, Comunicativo, Sem bagagem extra, Tranquilo
     - Negativas: Atrasado, Grosseiro, Bagagem excessiva, Comportamento inadequado, Cancelou tarde
   - **Comentário** textarea livre opcional (máx. 300 caracteres).
4. Ao enviar:
   - Cria `corridaFinal` com nota, tags e comentário.
   - `salvarCorridaDriverNoHistorico(corridaFinal)` → actualiza registo no histórico (substitui pelo `id`).
   - `limparCorridaDriverPendenteReview()` → remove `gyro.ride.driver.pending_review`.
   - `limparCorridaDriverAtiva()` → garante limpeza de `gyro.ride.driver.active`.
   - Navega para `#/motorista`.

---

## 4. Estrutura de dados

### Objeto `corrida` em `gyro.ride.driver.active`

```js
{
  id: 'REQ-1747555200000',         // timestamp-based
  status: 'pending_pickup',        // 'pending_pickup' | 'in_progress'
  passenger: {
    name: 'Ana Ferreira',
    initials: 'AF',
    rating: 4.8
  },
  pickup: 'Rocha Pinto, Luanda',
  destination: 'Talatona, Luanda',
  distance: '9,2 km',
  duration: '22 min',              // estimativa inicial
  price: 'Kz 950,00',
  distPickup: '1,2 km',
}
```

### Objeto `corrida` no histórico (`gyro.rides.driver.history[]`)

```js
{
  id: 'REQ-1747555200000',
  createdAt: '2026-05-18T09:15:00.000Z',
  status: 'completed',             // 'completed' | 'cancelled'
  passenger: {
    name: 'Ana Ferreira',
    initials: 'AF',
    rating: 4.8
  },
  routeSummary: 'Rocha Pinto → Talatona',
  estimatedDistance: '9,2 km',
  earnings: 'Kz 950,00',
  earningsRaw: 950,                // número para cálculos
  duration: '03:41',              // tempo real da corrida (mm:ss) ou null em cancelamentos
  // campos adicionados após avaliação:
  passengerRating: 5,
  passengerTags: ['Pontual', 'Educado'],
  passengerComment: 'Ótima viagem.',
  // em cancelamentos:
  cancelMotivo: 'Passageiro não apareceu'
}
```

### Objeto em `gyro.ride.driver.pending_review`

Idêntico ao objeto de corrida concluída acima, **sem** os campos de avaliação (adicionados depois).

---

## 5. Rotas do router

Registadas em `src/main.js`:

| Hash | Componente | Descrição |
|------|-----------|-----------|
| `#/motorista` | `HomeMotorista` | Dashboard com mapa e recepção de pedidos |
| `#/motorista/corrida-ativa` | `CorridaAtivaMotorista` | Gestão da corrida em andamento |
| `#/motorista/historico` | `HistoricoCorridasMotorista` | Histórico de corridas com filtros |
| `#/motorista/ganhos` | `GanhosMotorista` | Dashboard de ganhos (semana / mês / total) |
| `#/motorista/avaliacao-passageiro` | `AvaliacaoPassageiro` | Avaliação obrigatória do passageiro |
| `#/login` | `Login` | Partilhado com passageiro |
| `#/cadastro` | `CadastroEtapa1` | Partilhado com passageiro |
| `#/perfil` | `Perfil` | Partilhado com passageiro |
| `#/sobre` | `Sobre` | Partilhado com passageiro |

---

## 6. Ficheiros relevantes

```
src/
├── dados/
│   └── corridaDriverStorage.js     ← toda a camada de dados do motorista
├── componentes/
│   └── HeaderMotorista.js          ← menu/sidebar do motorista
└── paginasMotorista/
    ├── HomeMotorista.js / .css
    ├── CorridaAtivaMotorista.js / .css
    ├── HistoricoCorridasMotorista.js / .css
    ├── AvaliacaoPassageiro.js / .css
    └── GanhosMotorista.js / .css
```
