# API REST — Modelos de Dados

> **Projeto:** GYRO Ride  
> **Referência complementar:** `api-endpoints.md`  
> **Atualizado:** 19 mai 2026

Todos os tipos, schemas e exemplos reais dos objetos trocados entre o front-end e a API.

---

## Índice

1. [Session (utilizador autenticado)](#1-session)
2. [DocumentData (dados do BI)](#2-documentdata)
3. [Ride — Passageiro (corrida ativa / agendada / histórico)](#3-ride--passageiro)
4. [DriverRide — Motorista (corrida ativa)](#4-driverride--motorista)
5. [DriverRideHistory — Histórico do motorista](#5-driverridehistory)
6. [RideRequest — Pedido recebido pelo motorista](#6-riderequest)
7. [Driver (objeto embutido nas corridas do passageiro)](#7-driver)
8. [Passenger (objeto embutido nas corridas do motorista)](#8-passenger)
9. [Vehicle](#9-vehicle)
10. [FavoriteRoute](#10-favoriteroute)
11. [Review (avaliação)](#11-review)
12. [Notification](#12-notification)
13. [Enumerações e constantes](#13-enumerações-e-constantes)
14. [Exemplos JSON completos](#14-exemplos-json-completos)

---

## 1. Session

Objeto devolvido em `/api/auth/login`, `/api/auth/register` e `/api/auth/me`.  
Também armazenado localmente em `gyro.auth.current`.

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `id` | `string` (UUID v4) | não | Identificador único do utilizador |
| `name` | `string` | não | Nome completo |
| `email` | `string` | não | E-mail (normalizado em lowercase) |
| `phone` | `string \| null` | sim | Telemóvel com DDI (`+244 923 000 001`) |
| `role` | `"passageiro" \| "motorista"` | não | Perfil do utilizador |
| `createdAt` | `string` (ISO 8601) | não | Data de criação da conta |
| `documentData` | `DocumentData \| null` | sim | Dados do BI escaneado |
| `emailVerified` | `boolean` | não | E-mail verificado por link/OTP |
| `phoneVerified` | `boolean` | não | Telemóvel verificado por SMS/OTP |
| `avatar` | `string \| null` | sim | URL do avatar |
| `subscriptionStart` | `string \| null` (ISO 8601) | sim | Início da subscrição (só motoristas) |
| `subscriptionEnd` | `string \| null` (ISO 8601) | sim | Fim da subscrição (só motoristas) |

> **Nota:** o campo `password` **nunca** é devolvido pela API.

---

## 2. DocumentData

Dados extraídos do Bilhete de Identidade angolano por OCR.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `scanId` | `string` | ID único do scan (`"qr-<timestamp>"` ou UUID) |
| `campos.nome` | `string` | Nome completo conforme no BI |
| `campos.numero` | `string` | Número do BI (ex: `"001234567LA041"`) |
| `campos.provincia` | `string` | Província de emissão (ex: `"Luanda"`) |
| `campos.nascimento` | `string` | Data de nascimento `DD/MM/YYYY` |
| `campos.genero` | `string` | `"Masculino"` \| `"Feminino"` |
| `campos.estado` | `string` | Estado civil (ex: `"Solteiro(a)"`) |
| `campos.validade` | `string` | Validade do BI `DD/MM/YYYY` |
| `extractedData.name` | `string` | Nome normalizado para uso no sistema |
| `extractedData.documentNumber` | `string` | Número do BI normalizado |
| `extractedData.birthDate` | `string` | Data de nascimento `DD/MM/YYYY` |
| `extractedData.validity` | `string` | Validade `DD/MM/YYYY` |

---

## 3. Ride — Passageiro

Representa qualquer corrida do lado do passageiro (imediata, agendada ou histórico).  
Chaves localStorage: `gyro.ride.active`, `gyro.rides.scheduled`, `gyro.rides.history`.

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `id` | `string` | não | Ex: `"CR-SEED-001"` |
| `createdAt` | `string` (ISO 8601) | não | Momento em que a corrida foi criada |
| `status` | `RideStatus` | não | Estado atual — ver enumeração §13 |
| `when` | `"agora" \| "agendar"` | não | Tipo de corrida |
| `whenLabel` | `string` | não | Texto exibido (`"Agora"` ou `"22/04/2026 08:30"`) |
| `scheduledAt` | `string \| null` (ISO 8601) | sim | Data/hora agendada (só se `when = "agendar"`) |
| `routeSummary` | `string` | não | Ex: `"Aeroporto 4 de Fevereiro → Sambizanga"` |
| `passengers` | `number` (1–4) | não | Número de passageiros |
| `vehicle` | `"carro" \| "moto"` | não | Tipo de veículo |
| `vehicleLabel` | `string` | não | Ex: `"Carro • 2 passageiros"` |
| `estimatedPrice` | `string` | não | Ex: `"Kz 1.250,00"` |
| `estimatedPriceRaw` | `number` | não | Ex: `1250.00` |
| `estimatedDistance` | `string` | não | Ex: `"12,4 km"` |
| `estimatedDistanceRaw` | `number` | não | Ex: `12.4` |
| `estimatedDuration` | `string` | não | Ex: `"00:28:00"` |
| `stops` | `string[]` | não | Ex: `["Aeroporto 4 de Fevereiro", "Sambizanga"]` |
| `segments` | `GeoFeature[]` | não | GeoJSON LineString de cada trecho |
| `driver` | `Driver \| null` | sim | Preenchido quando motorista confirmado |
| `cancelReason` | `string \| null` | sim | Motivo de cancelamento |

### RideStatus (passageiro)

| Valor | Descrição |
|-------|-----------|
| `"searching"` | A procurar motorista (corrida imediata recém-criada) |
| `"confirmed"` | Motorista atribuído e confirmado |
| `"pending"` | Agendada aguardando confirmação de motorista |
| `"in_progress"` | Corrida em andamento (passageiro a bordo) |
| `"completed"` | Concluída com sucesso |
| `"cancelled"` | Cancelada pelo passageiro ou motorista |

---

## 4. DriverRide — Motorista

Corrida ativa do lado do motorista.  
Chave localStorage: `gyro.ride.driver.active`.

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `id` | `string` | não | Mesmo `id` da corrida do passageiro |
| `createdAt` | `string` (ISO 8601) | não | Momento em que o pedido foi aceite |
| `status` | `DriverRideStatus` | não | Ver enumeração §13 |
| `passenger` | `Passenger` | não | Dados do passageiro |
| `pickup` | `string` | não | Endereço de recolha |
| `destination` | `string` | não | Endereço de destino |
| `routeSummary` | `string` | não | Resumo textual da rota |
| `estimatedDistance` | `string` | não | Ex: `"9,2 km"` |
| `estimatedDistanceRaw` | `number` | não | Ex: `9.2` |
| `price` | `string` | não | Valor a receber (formatado) |
| `priceRaw` | `number` | não | Valor numérico |
| `distPickup` | `string` | não | Distância do motorista ao ponto de recolha |
| `duration` | `string \| null` | sim | Duração real quando concluída (`"22 min"`) |
| `cancelReason` | `string \| null` | sim | Motivo de cancelamento |

### DriverRideStatus

| Valor | Descrição |
|-------|-----------|
| `"pending_pickup"` | Motorista a caminho do passageiro (fase embarque) |
| `"in_progress"` | Passageiro a bordo, corrida em andamento |
| `"completed"` | Corrida concluída |
| `"cancelled"` | Cancelada pelo motorista |

---

## 5. DriverRideHistory

Objeto no histórico do motorista (e em `gyro.ride.driver.pending_review` temporariamente).  
Chave localStorage: `gyro.rides.driver.history`.

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `id` | `string` | não | Ex: `"DR-SEED-001"` |
| `createdAt` | `string` (ISO 8601) | não | Momento da corrida |
| `status` | `"completed" \| "cancelled"` | não | Resultado final |
| `passenger` | `Passenger` | não | Dados do passageiro |
| `routeSummary` | `string` | não | Ex: `"Rocha Pinto → Talatona"` |
| `estimatedDistance` | `string` | não | Ex: `"9,2 km"` |
| `earnings` | `string` | não | Ex: `"Kz 950,00"` |
| `earningsRaw` | `number` | não | Ex: `950.00` (0 se cancelada) |
| `duration` | `string \| null` | sim | Ex: `"22 min"` (null se cancelada) |
| `cancelReason` | `string \| null` | sim | Preenchido se cancelada |

---

## 6. RideRequest

Pedido de corrida apresentado ao motorista antes de aceitar/rejeitar.

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `id` | `string` | não | ID temporário do pedido (`"REQ-<timestamp>"`) |
| `passenger` | `Passenger` | não | Dados do passageiro solicitante |
| `pickup` | `string` | não | Endereço de recolha |
| `destination` | `string` | não | Endereço de destino |
| `distance` | `string` | não | Ex: `"9,2 km"` |
| `duration` | `string` | não | Ex: `"22 min"` |
| `price` | `string` | não | Ex: `"Kz 950,00"` |
| `priceRaw` | `number` | não | Ex: `950.00` |
| `distPickup` | `string` | não | Ex: `"1,2 km"` do motorista ao passageiro |
| `expiresAt` | `string` (ISO 8601) | não | O pedido expira após 20 s sem resposta |

---

## 7. Driver

Objeto embutido nas corridas do passageiro quando o motorista é confirmado.

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `name` | `string` | não | Nome completo do motorista |
| `phone` | `string` | não | Telemóvel com DDI |
| `vehicleBrand` | `string` | não | Ex: `"Toyota Corolla"` |
| `vehicleColor` | `string` | não | Ex: `"Branco"` |
| `plate` | `string` | não | Matrícula (`"LD-45-67-BC"`) |
| `initials` | `string` | não | Iniciais para avatar (`"CM"`) |

---

## 8. Passenger

Objeto embutido nas corridas do motorista.

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `name` | `string` | não | Nome completo do passageiro |
| `initials` | `string` | não | Iniciais para avatar (`"AF"`) |
| `rating` | `number` (1.0–5.0) | não | Avaliação média histórica |
| `phone` | `string` | não | Telemóvel com DDI |

---

## 9. Vehicle

Veículo registado pelo motorista. Chave localStorage: `gyro.driver.veiculo`.

| Campo | Tipo | Nulo? | Restrição de edição | Descrição |
|-------|------|-------|---------------------|-----------|
| `marca` | `string` | não | Bloqueado 48 h após save | Marca (ex: `"Toyota"`) |
| `modelo` | `string` | não | Bloqueado 48 h após save | Modelo (ex: `"Corolla"`) |
| `ano` | `string` | não | Bloqueado 48 h após save | Ano de fabrico (ex: `"2020"`) |
| `matricula` | `string` | não | Bloqueado 48 h após save | Matrícula (ex: `"LD-45-67-BC"`) |
| `cor` | `string` | não | Livre | Um de: `Branco`, `Preto`, `Cinzento`, `Prateado`, `Azul`, `Vermelho`, `Verde`, `Amarelo`, `Laranja`, `Outro` |
| `categoria` | `"Carro" \| "Moto"` | não | Bloqueado 48 h após save | Tipo do veículo |
| `lugares` | `"1" \| "2" \| "3" \| "4"` | não | Livre | Capacidade de passageiros |
| `seguro` | `string` | não | Livre | Número da apólice de seguro |
| `licenca` | `string` | não | Livre | Número da carta de condução |
| `updatedAt` | `string` (ISO 8601) | sim | — | Timestamp da última atualização |

> **Regra de bloqueio:** os campos da secção `identificacao` (`marca`, `modelo`, `ano`, `matricula`) e `categoria` ficam bloqueados para edição por **48 horas** após o primeiro save. A API deve retornar `423` com `"Próxima edição disponível em <N>h."` se tentar editar dentro desse período.

---

## 10. FavoriteRoute

Rota favorita do motorista. Chave localStorage: `gyro.driver.rotas_favoritas`.

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `id` | `string` | não | Formato `"<origem>→<destino>"` (ex: `"Centro→Aeroporto"`) |
| `origem` | `string` | não | Nome do nó de origem no grafo |
| `destino` | `string` | não | Nome do nó de destino no grafo |
| `addedAt` | `string` (ISO 8601) | não | Data em que foi adicionada |

---

## 11. Review

Avaliação submetida após uma corrida.

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `rideId` | `string` | não | ID da corrida avaliada |
| `authorId` | `string` | não | ID do utilizador que avaliou |
| `authorRole` | `"passageiro" \| "motorista"` | não | Quem avaliou |
| `rating` | `number` (1–5, inteiro) | não | Nota de 1 a 5 estrelas |
| `tags` | `string[]` | não | Tags selecionadas (pode ser `[]`) |
| `comment` | `string \| null` | sim | Comentário livre (máx 300 chars) |
| `createdAt` | `string` (ISO 8601) | não | Data de submissão |

---

## 12. Notification

| Campo | Tipo | Nulo? | Descrição |
|-------|------|-------|-----------|
| `id` | `string` | não | ID único da notificação |
| `userId` | `string` | não | Destinatário |
| `type` | `string` | não | Ex: `"ride_confirmed"`, `"ride_cancelled"`, `"payment"` |
| `title` | `string` | não | Título curto |
| `message` | `string` | não | Corpo da mensagem |
| `read` | `boolean` | não | `false` por padrão |
| `createdAt` | `string` (ISO 8601) | não | Data de criação |

---

## 13. Enumerações e Constantes

### Roles de utilizador
```
"passageiro"  —  pode solicitar corridas
"motorista"   —  pode receber e conduzir corridas
```

### Status de corrida — passageiro
```
"searching"    →  a procurar motorista
"confirmed"    →  motorista atribuído
"pending"      →  agendada sem motorista ainda
"in_progress"  →  corrida ativa (passageiro a bordo)
"completed"    →  concluída
"cancelled"    →  cancelada
```

### Status de corrida — motorista
```
"pending_pickup"  →  a caminho do passageiro
"in_progress"     →  passageiro a bordo
"completed"       →  concluída
"cancelled"       →  cancelada pelo motorista
```

### Tipos de veículo
```
"carro"  —  taxa base 3,00 Kz + 2,50 Kz/km + 1,00 Kz por passageiro extra
"moto"   —  taxa base 2,00 Kz + 1,80 Kz/km (sem taxa por passageiro)
```

### Motivos de cancelamento (motorista)
```
"Passageiro não apareceu"
"Passageiro pediu para cancelar"
"Problema com o veículo"
"Emergência pessoal"
"Endereço inacessível"
"Outro motivo"            →  acompanhado de cancelReasonDetail: string livre
```

### Tags de avaliação
```
Positivas: "Pontual", "Educado", "Carro limpo", "Boa conversa", "Direção suave"
Negativas: "Atrasado", "Rota errada", "Carro sujo", "Condução perigosa", "Grosseiro"
```

### Categorias de veículo (VeiculoMotorista)
```
"Carro" | "Moto"
```

### Cores de veículo disponíveis
```
"Branco" | "Preto" | "Cinzento" | "Prateado" | "Azul" | "Vermelho" | "Verde" | "Amarelo" | "Laranja" | "Outro"
```

---

## 14. Exemplos JSON Completos

### Session — motorista

```json
{
  "id": "mock-motorista-001",
  "name": "António Silva",
  "email": "motorista@teste.com",
  "phone": "+244 923 000 002",
  "role": "motorista",
  "createdAt": "2026-01-10T08:05:00.000Z",
  "documentData": {
    "scanId": "mock-doc-motorista",
    "campos": {
      "nome": "António Silva",
      "numero": "000000002LA041",
      "provincia": "Luanda",
      "nascimento": "15/03/1990",
      "genero": "Masculino",
      "estado": "Solteiro(a)",
      "validade": "31/12/2031"
    },
    "extractedData": {
      "name": "António Silva",
      "documentNumber": "000000002LA041",
      "birthDate": "15/03/1990",
      "validity": "31/12/2031"
    }
  },
  "emailVerified": true,
  "phoneVerified": true,
  "avatar": null,
  "subscriptionStart": "2026-01-10T08:05:00.000Z",
  "subscriptionEnd": "2027-01-10T08:05:00.000Z"
}
```

---

### Ride — corrida agendada confirmada (passageiro)

```json
{
  "id": "CR-SEED-001",
  "createdAt": "2026-04-08T09:00:00.000Z",
  "status": "confirmed",
  "when": "agendar",
  "whenLabel": "22/04/2026 08:30",
  "scheduledAt": "2026-04-22T08:30:00.000Z",
  "routeSummary": "Aeroporto Internacional 4 de Fevereiro → Sambizanga",
  "passengers": 2,
  "vehicle": "carro",
  "vehicleLabel": "Carro • 2 passageiros",
  "estimatedPrice": "Kz 1.250,00",
  "estimatedPriceRaw": 1250.00,
  "estimatedDistance": "12,4 km",
  "estimatedDistanceRaw": 12.4,
  "estimatedDuration": "00:28:00",
  "stops": ["Aeroporto Internacional 4 de Fevereiro", "Sambizanga"],
  "segments": [],
  "driver": {
    "name": "Carlos Mendes",
    "phone": "+244923456789",
    "vehicleBrand": "Toyota Corolla",
    "vehicleColor": "Branco",
    "plate": "LD-45-67-BC",
    "initials": "CM"
  },
  "cancelReason": null
}
```

---

### DriverRideHistory — corrida concluída

```json
{
  "id": "DR-SEED-001",
  "createdAt": "2026-05-09T08:15:00.000Z",
  "status": "completed",
  "passenger": {
    "name": "Ana Ferreira",
    "initials": "AF",
    "rating": 4.8,
    "phone": "+244 923 456 789"
  },
  "routeSummary": "Rocha Pinto → Talatona",
  "estimatedDistance": "9,2 km",
  "earnings": "Kz 950,00",
  "earningsRaw": 950.00,
  "duration": "22 min",
  "cancelReason": null
}
```

---

### RideRequest — pedido recebido pelo motorista

```json
{
  "id": "REQ-1747123456789",
  "passenger": {
    "name": "Ana Ferreira",
    "initials": "AF",
    "rating": 4.8,
    "phone": "+244 923 456 789"
  },
  "pickup": "Rocha Pinto, Luanda",
  "destination": "Talatona, Luanda",
  "distance": "9,2 km",
  "duration": "22 min",
  "price": "Kz 950,00",
  "priceRaw": 950.00,
  "distPickup": "1,2 km",
  "expiresAt": "2026-05-19T10:30:20.000Z"
}
```

---

### Vehicle — veículo do motorista

```json
{
  "marca": "Toyota",
  "modelo": "Corolla",
  "ano": "2020",
  "matricula": "LD-45-67-BC",
  "cor": "Branco",
  "categoria": "Carro",
  "lugares": "4",
  "seguro": "AXA-2026-001234",
  "licenca": "LD-123456",
  "updatedAt": "2026-01-10T08:05:00.000Z"
}
```

---

### Earnings summary — ganhos do motorista

```json
{
  "summary": {
    "week": {
      "total": 2570.00,
      "totalFormatted": "Kz 2.570,00",
      "ridesCount": 3,
      "periodStart": "2026-05-18T00:00:00.000Z"
    },
    "month": {
      "total": 8100.00,
      "totalFormatted": "Kz 8.100,00",
      "ridesCount": 10,
      "periodStart": "2026-05-01T00:00:00.000Z"
    },
    "allTime": {
      "total": 28350.00,
      "totalFormatted": "Kz 28.350,00",
      "ridesCount": 34
    },
    "completionRate": 86
  },
  "recentRides": []
}
```
