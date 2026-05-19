# API REST — Contratos de Endpoints

> **Projeto:** GYRO Ride  
> **Base URL (dev):** `http://localhost:3001`  
> **Base URL (prod):** domínio raiz (sem prefixo extra)  
> **Prefixo global:** `/api`  
> **Formato:** JSON (`Content-Type: application/json`) exceto onde indicado  
> **Autenticação:** Bearer token JWT no header `Authorization: Bearer <token>`  
> **Atualizado:** 19 mai 2026

---

## Índice

1. [Convenções](#1-convenções)
2. [Autenticação](#2-autenticação)
3. [OCR / Bilhete de Identidade](#3-ocr--bilhete-de-identidade)
4. [Corridas — Passageiro](#4-corridas--passageiro)
5. [Corridas — Motorista](#5-corridas--motorista)
6. [Veículo do Motorista](#6-veículo-do-motorista)
7. [Rotas Favoritas](#7-rotas-favoritas)
8. [Grafo de Rotas / Estimativa](#8-grafo-de-rotas--estimativa)
9. [Avaliações](#9-avaliações)
10. [Ganhos](#10-ganhos)
11. [Subscrição](#11-subscrição)
12. [Notificações](#12-notificações)
13. [Códigos de Erro](#13-códigos-de-erro)

---

## 1. Convenções

- Datas e horários: **ISO 8601** (`2026-05-19T10:30:00.000Z`), sempre UTC.
- Valores monetários: devolvidos como `number` (Kwanzas, 2 casas decimais) **e** como `string` formatada (`"Kz 1.250,00"`). O campo numérico tem sufixo `Raw`.
- Distâncias: devolvidas como `number` (km, 1 casa decimal) **e** como `string` formatada (`"12,4 km"`).
- Duração: `string` no formato `"HH:MM:SS"` para estimativas; `string` humanizada (`"22 min"`) para exibição no histórico.
- IDs de corrida: `string` prefixada (`"CR-"` passageiro, `"DR-"` motorista) gerada pelo servidor.
- IDs de utilizador: `string` UUID v4 gerada pelo servidor (não timestamp).
- Campos opcionais são marcados com `?`.
- Respostas de erro seguem sempre `{ "error": "mensagem legível" }`.

---

## 2. Autenticação

### `POST /api/auth/register`

Cria uma nova conta. Requer dados do BI escaneado (obtidos via `/api/ocr/bilhete`).  
**Não requer autenticação.**

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "passageiro | motorista",
  "documentData": {
    "scanId": "string",
    "campos": {
      "nome": "string",
      "numero": "string",
      "provincia": "string",
      "nascimento": "string",
      "genero": "string",
      "estado": "string",
      "validade": "string"
    },
    "extractedData": {
      "name": "string",
      "documentNumber": "string",
      "birthDate": "string",
      "validity": "string"
    }
  }
}
```

**Validações:**
- `name`, `email`, `password` obrigatórios e não vazios.
- `password` mínimo 6 caracteres.
- `email` único (sem duplicatas).
- `documentData.scanId` obrigatório (garante que o BI foi escaneado).
- `role` deve ser `"passageiro"` ou `"motorista"`; qualquer outro valor é normalizado para `"passageiro"`.

**Response `201`:**
```json
{
  "user": { /* objeto Session — ver modelo em api-modelos.md */ },
  "token": "string (JWT)"
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `400` | `"Preencha todos os campos."` |
| `400` | `"A senha deve ter pelo menos 6 caracteres."` |
| `400` | `"Escaneie o bilhete antes de concluir o cadastro."` |
| `409` | `"Este e-mail já está cadastrado."` |

---

### `POST /api/auth/login`

**Não requer autenticação.**

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200`:**
```json
{
  "user": { /* objeto Session */ },
  "token": "string (JWT)"
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `400` | `"Informe e-mail e senha."` |
| `401` | `"E-mail ou senha inválidos."` |

---

### `POST /api/auth/logout`

Invalida o token no servidor (blacklist ou revogação de refresh token).  
**Requer autenticação.**

**Response `204`:** sem body.

---

### `GET /api/auth/me`

Devolve os dados da sessão atual.  
**Requer autenticação.**

**Response `200`:**
```json
{
  "user": { /* objeto Session */ }
}
```

---

### `PATCH /api/auth/account`

Atualiza email e/ou telefone do utilizador autenticado.  
**Requer autenticação.**

**Request body:**
```json
{
  "email": "string?",
  "phone": "string?"
}
```

- Se `email` mudar, `emailVerified` é resetado para `false`.
- Se `phone` mudar, `phoneVerified` é resetado para `false`.

**Response `200`:**
```json
{
  "user": { /* objeto Session atualizado */ }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `409` | `"Este e-mail já está em uso."` |

---

### `PATCH /api/auth/verify`

Marca email ou telefone como verificado (chamado após fluxo de OTP/link).  
**Requer autenticação.**

**Request body:**
```json
{
  "campo": "email | phone"
}
```

**Response `200`:**
```json
{
  "user": { /* objeto Session atualizado */ }
}
```

---

## 3. OCR / Bilhete de Identidade

### `POST /api/ocr/bilhete`

Processa as imagens do BI e extrai os dados por OCR.  
**Content-Type:** `multipart/form-data`  
**Não requer autenticação** (pode ser chamado antes do registo).

**Form fields:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `frontImage` | `File` (imagem) | sim | Frente do BI |
| `backImage` | `File` (imagem) | sim | Verso do BI |

**Response `200`:**
```json
{
  "scanId": "string",
  "campos": {
    "nome": "string",
    "numero": "string",
    "provincia": "string",
    "nascimento": "string (DD/MM/YYYY)",
    "genero": "string",
    "estado": "string",
    "validade": "string (DD/MM/YYYY)"
  },
  "extractedData": {
    "name": "string",
    "documentNumber": "string",
    "birthDate": "string (DD/MM/YYYY)",
    "validity": "string (DD/MM/YYYY)"
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `422` | `"Não foi possível processar o bilhete agora."` |
| `503` | `"Serviço OCR indisponível."` |

> **Nota de implementação:** o campo `scanId` serve como prova de que o OCR foi concluído. O registo só é aceite se `documentData.scanId` estiver presente.

---

## 4. Corridas — Passageiro

### `POST /api/rides`

Cria uma corrida imediata (`when: "agora"`) ou agendada (`when: "agendar"`).  
**Requer autenticação** — role `passageiro`.

**Request body:**
```json
{
  "when": "agora | agendar",
  "scheduledAt": "string (ISO 8601)? — obrigatório se when='agendar'",
  "stops": ["string"],
  "passengers": "number (1–4)",
  "vehicle": "carro | moto",
  "segments": [
    {
      "geometry": {
        "type": "LineString",
        "coordinates": [["number (lng)", "number (lat)"]]
      },
      "properties": {
        "origem": "string",
        "destino": "string"
      }
    }
  ]
}
```

**Response `201` — corrida imediata:**
```json
{
  "ride": {
    "id": "string",
    "createdAt": "string (ISO 8601)",
    "status": "searching",
    "when": "agora",
    "whenLabel": "Agora",
    "routeSummary": "string",
    "passengers": "number",
    "vehicle": "carro | moto",
    "vehicleLabel": "string",
    "estimatedPrice": "string",
    "estimatedPriceRaw": "number",
    "estimatedDistance": "string",
    "estimatedDistanceRaw": "number",
    "estimatedDuration": "string (HH:MM:SS)",
    "stops": ["string"],
    "segments": [ /* GeoJSON LineString features */ ],
    "driver": null
  }
}
```

**Response `201` — corrida agendada:**
```json
{
  "ride": {
    /* mesmos campos acima */
    "status": "pending",
    "when": "agendar",
    "whenLabel": "string (ex: '22/04/2026 08:30')",
    "scheduledAt": "string (ISO 8601)"
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `400` | `"Informe pelo menos 2 paragens."` |
| `400` | `"scheduledAt é obrigatório para corridas agendadas."` |
| `400` | `"Data agendada deve ser no futuro."` |
| `422` | `"Rota não encontrada no grafo."` |

---

### `GET /api/rides/active`

Devolve a corrida ativa do passageiro autenticado.  
**Requer autenticação** — role `passageiro`.

**Response `200`:**
```json
{
  "ride": { /* objeto Ride completo */ }
}
```

**Response `200` — sem corrida ativa:**
```json
{
  "ride": null
}
```

---

### `DELETE /api/rides/active`

Cancela a corrida ativa (fase de busca ou em andamento).  
**Requer autenticação** — role `passageiro`.

**Request body:** *(opcional)*
```json
{
  "cancelReason": "string?"
}
```

**Response `200`:**
```json
{
  "ride": {
    /* corrida com status: "cancelled" */
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `404` | `"Nenhuma corrida ativa encontrada."` |

---

### `GET /api/rides/scheduled`

Lista todas as corridas agendadas do passageiro (ordenadas por `scheduledAt` decrescente).  
**Requer autenticação** — role `passageiro`.

**Response `200`:**
```json
{
  "rides": [ /* Array<RideScheduled> */ ]
}
```

---

### `GET /api/rides/scheduled/:id`

Detalhe de uma corrida agendada.  
**Requer autenticação** — role `passageiro`.

**Response `200`:**
```json
{
  "ride": { /* objeto RideScheduled completo */ }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `404` | `"Corrida não encontrada."` |
| `403` | `"Acesso negado."` |

---

### `DELETE /api/rides/scheduled/:id`

Cancela uma corrida agendada.  
**Requer autenticação** — role `passageiro`.

**Request body:**
```json
{
  "cancelReason": "string?"
}
```

**Response `200`:**
```json
{
  "ride": {
    /* corrida com status: "cancelled", cancelReason: "string | null" */
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `404` | `"Corrida não encontrada."` |
| `409` | `"Corrida já cancelada."` |
| `409` | `"Corrida já concluída."` |

---

### `GET /api/rides/history`

Histórico de corridas do passageiro (ordenado por `createdAt` decrescente).  
**Requer autenticação** — role `passageiro`.

**Query params opcionais:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `status` | `"completed" \| "cancelled"` | Filtrar por status |
| `limit` | `number` | Número máximo de resultados (padrão: 50) |
| `offset` | `number` | Paginação |

**Response `200`:**
```json
{
  "rides": [ /* Array<RideHistory> */ ],
  "total": "number"
}
```

---

## 5. Corridas — Motorista

### `GET /api/driver/rides/requests`

Devolve o próximo pedido de corrida disponível para o motorista (polling ou SSE).  
**Requer autenticação** — role `motorista`.

> **Nota:** em produção, considerar Server-Sent Events (`GET /api/driver/rides/stream`) em vez de polling.

**Response `200` — pedido disponível:**
```json
{
  "request": {
    "id": "string",
    "passenger": {
      "name": "string",
      "initials": "string",
      "rating": "number",
      "phone": "string"
    },
    "pickup": "string",
    "destination": "string",
    "distance": "string",
    "duration": "string",
    "price": "string",
    "priceRaw": "number",
    "distPickup": "string",
    "expiresAt": "string (ISO 8601)"
  }
}
```

**Response `200` — sem pedidos:**
```json
{
  "request": null
}
```

---

### `POST /api/driver/rides/requests/:id/accept`

Aceita um pedido de corrida. Cria a corrida com `status: "pending_pickup"`.  
**Requer autenticação** — role `motorista`.

**Response `201`:**
```json
{
  "ride": {
    "id": "string",
    "createdAt": "string (ISO 8601)",
    "status": "pending_pickup",
    "passenger": {
      "name": "string",
      "initials": "string",
      "rating": "number",
      "phone": "string"
    },
    "pickup": "string",
    "destination": "string",
    "routeSummary": "string",
    "estimatedDistance": "string",
    "estimatedDistanceRaw": "number",
    "price": "string",
    "priceRaw": "number",
    "duration": "string"
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `404` | `"Pedido não encontrado ou expirado."` |
| `409` | `"Já existe uma corrida ativa."` |

---

### `POST /api/driver/rides/requests/:id/reject`

Rejeita um pedido. Nenhuma corrida é criada.  
**Requer autenticação** — role `motorista`.

**Response `204`:** sem body.

---

### `GET /api/driver/rides/active`

Devolve a corrida ativa do motorista.  
**Requer autenticação** — role `motorista`.

**Response `200`:**
```json
{
  "ride": { /* objeto DriverRide ou null */ }
}
```

---

### `PATCH /api/driver/rides/active/status`

Avança o status da corrida ativa.  
**Requer autenticação** — role `motorista`.

**Request body:**
```json
{
  "status": "in_progress | completed"
}
```

Transições válidas:
- `pending_pickup` → `in_progress` (passageiro a bordo)
- `in_progress` → `completed` (corrida concluída)

**Response `200`:**
```json
{
  "ride": { /* objeto DriverRide com novo status */ }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `400` | `"Transição de status inválida."` |
| `404` | `"Nenhuma corrida ativa."` |

---

### `DELETE /api/driver/rides/active`

Cancela a corrida ativa do motorista.  
**Requer autenticação** — role `motorista`.

**Request body:**
```json
{
  "cancelReason": "string"
}
```

Motivos válidos (enumerados no front-end):
- `"Passageiro não apareceu"`
- `"Passageiro pediu para cancelar"`
- `"Problema com o veículo"`
- `"Emergência pessoal"`
- `"Endereço inacessível"`
- `"Outro motivo"` *(acompanhado de `cancelReasonDetail: string`)*

**Response `200`:**
```json
{
  "ride": {
    /* objeto DriverRide com status: "cancelled" */
  }
}
```

---

### `GET /api/driver/rides/history`

Histórico de corridas do motorista (ordenado por `createdAt` decrescente).  
**Requer autenticação** — role `motorista`.

**Query params opcionais:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `status` | `"completed" \| "cancelled"` | Filtrar por status |
| `limit` | `number` | Padrão: 50 |
| `offset` | `number` | Paginação |

**Response `200`:**
```json
{
  "rides": [ /* Array<DriverRideHistory> */ ],
  "total": "number"
}
```

---

### `GET /api/driver/rides/history/:id`

Detalhe de uma corrida do histórico do motorista.  
**Requer autenticação** — role `motorista`.

**Response `200`:**
```json
{
  "ride": { /* objeto DriverRideHistory completo */ }
}
```

---

### `GET /api/driver/rides/scheduled`

Lista corridas agendadas atribuídas ao motorista.  
**Requer autenticação** — role `motorista`.

**Response `200`:**
```json
{
  "rides": [ /* Array<RideScheduled com campos do motorista */ ]
}
```

---

## 6. Veículo do Motorista

### `GET /api/driver/vehicle`

Devolve os dados do veículo registado.  
**Requer autenticação** — role `motorista`.

**Response `200`:**
```json
{
  "vehicle": { /* objeto Vehicle ou null */ }
}
```

---

### `PUT /api/driver/vehicle`

Cria ou substitui os dados do veículo (upsert). Campos de secção só podem ser editados 1× a cada 48 h após o primeiro save.  
**Requer autenticação** — role `motorista`.

**Request body:**
```json
{
  "marca": "string",
  "modelo": "string",
  "ano": "string",
  "matricula": "string",
  "cor": "string",
  "categoria": "Carro | Moto",
  "lugares": "1 | 2 | 3 | 4",
  "seguro": "string",
  "licenca": "string"
}
```

**Response `200`:**
```json
{
  "vehicle": {
    /* todos os campos acima */
    "updatedAt": "string (ISO 8601)"
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `400` | `"Campo obrigatório em falta: <campo>."` |
| `423` | `"Campo bloqueado. Próxima edição disponível em <N>h."` |

---

## 7. Rotas Favoritas

### `GET /api/driver/routes/favorites`

Lista rotas favoritas do motorista.  
**Requer autenticação** — role `motorista`.

**Response `200`:**
```json
{
  "favorites": [
    {
      "id": "string (ex: 'Centro→Aeroporto')",
      "origem": "string",
      "destino": "string",
      "addedAt": "string (ISO 8601)"
    }
  ]
}
```

---

### `POST /api/driver/routes/favorites`

Adiciona uma rota aos favoritos.  
**Requer autenticação** — role `motorista`.

**Request body:**
```json
{
  "id": "string",
  "origem": "string",
  "destino": "string"
}
```

**Response `201`:**
```json
{
  "favorite": {
    "id": "string",
    "origem": "string",
    "destino": "string",
    "addedAt": "string (ISO 8601)"
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `409` | `"Rota já adicionada aos favoritos."` |

---

### `DELETE /api/driver/routes/favorites/:id`

Remove uma rota dos favoritos.  
**Requer autenticação** — role `motorista`.

**Response `204`:** sem body.

---

## 8. Grafo de Rotas / Estimativa

### `GET /api/routes/graph`

Devolve o grafo completo de rotas disponíveis no sistema (usado pelo componente `ChamarCorrida`).  
**Requer autenticação.**

**Response `200`:**
```json
{
  "graph": {
    "Centro": [
      {
        "type": "Feature",
        "properties": {
          "destino": "string",
          "style": {
            "color": "string (hex)",
            "weight": "number",
            "opacity": "number",
            "dashArray": "string | null"
          }
        },
        "geometry": {
          "type": "LineString",
          "coordinates": [["number (lng)", "number (lat)"]]
        }
      }
    ]
  }
}
```

---

### `POST /api/rides/estimate`

Calcula preço estimado, distância e duração para uma rota sem criar corrida.  
**Requer autenticação.**

**Request body:**
```json
{
  "stops": ["string"],
  "vehicle": "carro | moto",
  "passengers": "number (1–4)"
}
```

**Response `200`:**
```json
{
  "estimatedPrice": "string (ex: 'Kz 1.250,00')",
  "estimatedPriceRaw": "number",
  "estimatedDistance": "string (ex: '12,4 km')",
  "estimatedDistanceRaw": "number",
  "estimatedDuration": "string (HH:MM:SS)",
  "vehicleLabel": "string (ex: 'Carro • 2 passageiros')"
}
```

**Fórmula de preço:**
- Taxa base: `carro = 3,00 Kz/km`, `moto = 2,00 Kz/km`
- Taxa por km: `carro = 2,50`, `moto = 1,80`
- Taxa extra por passageiro adicional (carro): `+1,00 Kz × (passageiros - 1)`
- Velocidade média: `carro = 26 km/h`, `moto = 32 km/h`

---

## 9. Avaliações

### `POST /api/rides/:id/review`

Passageiro avalia a corrida (e indiretamente o motorista).  
**Requer autenticação** — role `passageiro`.

**Request body:**
```json
{
  "rating": "number (1–5, inteiro)",
  "tags": ["string"],
  "comment": "string? (máx 300 chars)"
}
```

Tags válidas (positivas): `"Pontual"`, `"Educado"`, `"Carro limpo"`, `"Boa conversa"`, `"Direção suave"`  
Tags válidas (negativas): `"Atrasado"`, `"Rota errada"`, `"Carro sujo"`, `"Condução perigosa"`, `"Grosseiro"`

**Response `201`:**
```json
{
  "review": {
    "rideId": "string",
    "rating": "number",
    "tags": ["string"],
    "comment": "string | null",
    "createdAt": "string (ISO 8601)"
  }
}
```

**Erros:**
| Status | Mensagem |
|--------|----------|
| `400` | `"A avaliação é obrigatória (1–5 estrelas)."` |
| `404` | `"Corrida não encontrada."` |
| `409` | `"Esta corrida já foi avaliada."` |
| `422` | `"A corrida não está concluída."` |

---

### `POST /api/driver/rides/:id/review`

Motorista avalia o passageiro após a corrida.  
**Requer autenticação** — role `motorista`.

**Request body:** *(igual ao endpoint acima)*

**Response `201`:** *(igual ao endpoint acima)*

---

## 10. Ganhos

### `GET /api/driver/earnings`

Resumo financeiro do motorista.  
**Requer autenticação** — role `motorista`.

**Response `200`:**
```json
{
  "summary": {
    "week": {
      "total": "number",
      "totalFormatted": "string",
      "ridesCount": "number",
      "periodStart": "string (ISO 8601)"
    },
    "month": {
      "total": "number",
      "totalFormatted": "string",
      "ridesCount": "number",
      "periodStart": "string (ISO 8601)"
    },
    "allTime": {
      "total": "number",
      "totalFormatted": "string",
      "ridesCount": "number"
    },
    "completionRate": "number (0–100, percentagem)"
  },
  "recentRides": [ /* últimas 5 corridas concluídas — Array<DriverRideHistory> */ ]
}
```

---

## 11. Subscrição

### `GET /api/driver/subscription`

Devolve os dados de subscrição do motorista.  
**Requer autenticação** — role `motorista`.

**Response `200`:**
```json
{
  "subscription": {
    "active": "boolean",
    "start": "string (ISO 8601) | null",
    "end": "string (ISO 8601) | null",
    "plan": "string | null"
  }
}
```

---

### `POST /api/driver/subscription`

Cria ou renova a subscrição do motorista (pós-pagamento).  
**Requer autenticação** — role `motorista`.

**Request body:**
```json
{
  "plan": "string",
  "paymentToken": "string"
}
```

**Response `201`:**
```json
{
  "subscription": {
    "active": true,
    "start": "string (ISO 8601)",
    "end": "string (ISO 8601)",
    "plan": "string"
  }
}
```

---

## 12. Notificações

### `GET /api/notifications`

Lista notificações do utilizador autenticado (ordenadas por `createdAt` decrescente).  
**Requer autenticação.**

**Response `200`:**
```json
{
  "notifications": [
    {
      "id": "string",
      "type": "string",
      "title": "string",
      "message": "string",
      "read": "boolean",
      "createdAt": "string (ISO 8601)"
    }
  ],
  "unreadCount": "number"
}
```

---

### `PATCH /api/notifications/:id/read`

Marca uma notificação como lida.  
**Requer autenticação.**

**Response `200`:**
```json
{
  "notification": { /* notificação atualizada com read: true */ }
}
```

---

### `PATCH /api/notifications/read-all`

Marca todas as notificações como lidas.  
**Requer autenticação.**

**Response `200`:**
```json
{
  "updated": "number"
}
```

---

## 13. Códigos de Erro

| Status HTTP | Significado |
|-------------|-------------|
| `400` | Dados inválidos ou em falta |
| `401` | Não autenticado (token ausente ou expirado) |
| `403` | Autenticado mas sem permissão (role errado ou recurso alheio) |
| `404` | Recurso não encontrado |
| `409` | Conflito de estado (duplicata, transição inválida) |
| `422` | Entidade não processável (dados semanticamente inválidos) |
| `423` | Recurso bloqueado temporariamente |
| `500` | Erro interno do servidor |
| `503` | Serviço externo indisponível (ex: OCR) |

**Formato de erro padrão:**
```json
{
  "error": "Mensagem legível para o utilizador",
  "code": "MACHINE_READABLE_CODE (opcional)"
}
```
