# Flags do Storage — Referência de Testes

  

Todas as chaves usadas pelo app para controlar estado e UI.

 
| Chave | Tipo | O que controla na UI |
|-------|------|----------------------|
| `gyro.auth.users` | localStorage | dados do Perfil, autenticação |
| `gyro.auth.current` | localStorage | menu (Perfil/Sair vs Entrar/Criar conta), página Perfil |
| `gyro.ride.active` | localStorage | link "Corrida ativa" no menu, CorridaAtiva |
| `gyro.rides.scheduled` | localStorage | página Agendamentos |
| `gyro.rides.history` | localStorage | página Histórico |
| `cadastro_scan_data` | sessionStorage | dados pré-preenchidos na Etapa 2 do cadastro |

---

  

## Tabela resumo — tipos de dados

  
| Chave | Storage | Tipo raiz | Campos relevantes | Tipo dos campos |
|-------|---------|-----------|-------------------|------------------|
| `gyro.auth.users` | local | `Array<Object>` | `id` | `number` |
| | | | `name` | `string` |
| | | | `email` | `string` |
| | | | `password` | `string` |
| | | | `role` | `"passageiro"` \| `"motorista"` |
| | | | `createdAt` | `string` (ISO 8601) |
| | | | `documentData.scanId` | `string` |
| | | | `documentData.campos.nome` | `string` |
| | | | `documentData.campos.numero` | `string` |
| | | | `documentData.campos.provincia` | `string` |
| | | | `documentData.campos.nascimento` | `string` (DD/MM/YYYY) |
| | | | `documentData.campos.genero` | `string` |
| | | | `documentData.campos.estado` | `string` |
| | | | `documentData.campos.validade` | `string` (DD/MM/YYYY) |
| `gyro.auth.current` | local | `Object` \| `null` | `id` | `number` |
| | | | `name` | `string` |
| | | | `email` | `string` |
| | | | `role` | `"passageiro"` \| `"motorista"` |
| | | | `createdAt` | `string` (ISO 8601) |
| | | | `documentData.scanId` | `string` |
| | | | `documentData.campos.nome` | `string` |
| | | | `documentData.campos.numero` | `string` |
| | | | `documentData.campos.provincia` | `string` |
| | | | `documentData.campos.nascimento` | `string` (DD/MM/YYYY) |
| | | | `documentData.campos.genero` | `string` |
| | | | `documentData.campos.estado` | `string` |
| | | | `documentData.campos.validade` | `string` (DD/MM/YYYY) |
| `gyro.ride.active` | local | `Object` \| `null` | `id` | `string` |
| | | | `status` | `"active"` |
| | | | `routeSummary` | `string` |
| | | | `passengers` | `number` |
| | | | `vehicle` | `"carro"` \| `"moto"` |
| | | | `vehicleLabel` | `string` |
| | | | `estimatedPrice` | `string` |
| | | | `estimatedDistance` | `string` |
| | | | `estimatedDuration` | `string` (HH:MM:SS) |
| | | | `stops` | `Array<string>` |
| | | | `driver.name` | `string` |
| | | | `driver.phone` | `string` |
| | | | `driver.vehicleBrand` | `string` |
| | | | `driver.vehicleColor` | `string` |
| | | | `driver.plate` | `string` |
| | | | `driver.initials` | `string` |
| | | | `createdAt` | `string` (ISO 8601) |
| `gyro.rides.scheduled` | local | `Array<Object>` | `id` | `string` |
| | | | `status` | `"active"` \| `"cancelled"` |
| | | | `cancelReason` | `string` \| ausente |
| | | | `scheduledAt` | `string` (ISO 8601) |
| | | | `routeSummary` | `string` |
| | | | `stops` | `Array<string>` |
| | | | `driver` | `Object` (igual a `gyro.ride.active.driver`) |
| `gyro.rides.history` | local | `Array<Object>` | `id` | `string` |
| | | | `status` | `"completed"` \| `"cancelled"` |
| | | | `createdAt` | `string` (ISO 8601) |
| | | | `routeSummary` | `string` |
| | | | `stops` | `Array<string>` |
| | | | `driver` | `Object` (igual a `gyro.ride.active.driver`) |
| `cadastro_scan_data` | session | `Object` \| `null` | `scanId` | `string` |
| | | | `campos` | `Object` (mesmos campos de `documentData.campos`) |
| | | | `extractedData.name` | `string` |
| | | | `extractedData.documentNumber` | `string` |
| | | | `extractedData.birthDate` | `string` |
| | | | `extractedData.validity` | `string` |

  

---

  

## localStorage

  

### `gyro.auth.users`

Array com todos os utilizadores cadastrados.

Controla: autenticação, perfil, exclusão de conta.

  

```json

[

{

"id": 1747123456789,

"name": "Ana Sousa",

"email": "ana@teste.com",

"password": "123456",

"role": "passageiro",

"createdAt": "2026-05-14T10:00:00.000Z",

"documentData": {

"scanId": "qr-1747123456789",

"campos": {

"nome": "Ana Sousa",

"numero": "001234567LA041",

"provincia": "Luanda",

"nascimento": "01/01/1995",

"genero": "Feminino",

"estado": "Solteiro(a)",

"validade": "31/12/2030"

},

"extractedData": {

"name": "Ana Sousa",

"documentNumber": "001234567LA041",

"birthDate": "01/01/1995",

"validity": "31/12/2030"

}

}

}

]

```

  

>  **UI afetada:** página de Perfil (dados do bilhete), autenticação em Login.

  

---

  

### `gyro.auth.current`

Objeto com a sessão do utilizador autenticado. `null` = não autenticado.

Controla: links do menu (Perfil / Sair vs Entrar / Criar conta), conteúdo da página de Perfil.

  

```json
{
  "id": 1747123456789,
  "name": "Ana Sousa",
  "email": "ana@teste.com",
  "role": "passageiro",
  "createdAt": "2026-05-14T10:00:00.000Z",
  "documentData": {
    "scanId": "qr-1747123456789",
    "campos": {
      "nome": "Ana Sousa",
      "numero": "001234567LA041",
      "provincia": "Luanda",
      "nascimento": "01/01/1995",
      "genero": "Feminino",
      "estado": "Solteiro(a)",
      "validade": "31/12/2030"
    },
    "extractedData": {
      "name": "Ana Sousa",
      "documentNumber": "001234567LA041",
      "birthDate": "01/01/1995",
      "validity": "31/12/2030"
    }
  }
}
```
```

  

>  `role` aceita `"passageiro"` ou `"motorista"`.

>  **Para simular logout:** apagar esta chave.

  

---

  

### `gyro.ride.active`

Objeto da corrida em curso. `null` = sem corrida ativa.

Controla: link "Corrida ativa" no menu, página CorridaAtiva, AguardandoMotorista.

  

```json

{

"id": "CR-001",

"status": "active",

"routeSummary": "Ingombota → Talatona",

"passengers": 2,

"vehicle": "carro",

"vehicleLabel": "Carro • 2 passageiros",

"estimatedPrice": "Kz 1.250,00",

"estimatedDistance": "12,4 km",

"estimatedDuration": "00:28:00",

"stops": ["Ingombota", "Talatona"],

"driver": {

"name": "Carlos Mendes",

"phone": "+244923456789",

"vehicleBrand": "Toyota Corolla",

"vehicleColor": "Branco",

"plate": "LD-45-67-BC",

"initials": "CM"

},

"createdAt": "2026-05-14T10:00:00.000Z"

}

```

  

>  **Para simular fim de corrida:** apagar esta chave.

  

---

  

### `gyro.rides.scheduled`

Array de corridas agendadas.

Controla: página CorridasAgendadas e CorridaAgendadaDetalhe.

  

>  `status` aceita: `"active"` | `"cancelled"`.

> Se estiver vazio ou ausente, a página carrega dados de semente automaticamente.

  

```json

[

{

"id": "CR-SEED-001",

"createdAt": "2026-04-08T00:00:00.000Z",

"status": "active",

"when": "agendar",

"whenLabel": "22/04/2026 08:30",

"scheduledAt": "2026-04-22T08:30:00.000Z",

"routeSummary": "Aeroporto Internacional 4 de Fevereiro → Sambizanga",

"passengers": 2,

"vehicle": "carro",

"vehicleLabel": "Carro • 2 passageiros",

"estimatedPrice": "Kz 1.250,00",

"estimatedDistance": "12,4 km",

"estimatedDuration": "00:28:00",

"stops": ["Aeroporto Internacional 4 de Fevereiro", "Sambizanga"],

"driver": {

"name": "Carlos Mendes",

"phone": "+244923456789",

"vehicleBrand": "Toyota Corolla",

"vehicleColor": "Branco",

"plate": "LD-45-67-BC",

"initials": "CM"

}

},

{

"id": "CR-SEED-005",

"createdAt": "2026-04-18T00:00:00.000Z",

"status": "cancelled",

"cancelReason": "Mudança de planos",

"when": "agendar",

"whenLabel": "01/05/2026 10:00",

"scheduledAt": "2026-05-01T10:00:00.000Z",

"routeSummary": "Rangel → Samba",

"passengers": 1,

"vehicle": "moto",

"vehicleLabel": "Moto",

"estimatedPrice": "Kz 410,00",

"estimatedDistance": "5,2 km",

"estimatedDuration": "00:12:00",

"stops": ["Rangel", "Samba"],

"driver": {

"name": "Pedro Domingos",

"phone": "+244956789012",

"vehicleBrand": "Yamaha Factor",

"vehicleColor": "Preto",

"plate": "LD-99-11-GH",

"initials": "PD"

}

}

]

```

  

---

  

### `gyro.rides.history`

Array do histórico de corridas.

Controla: página HistoricoCorridas.

  

>  `status` aceita: `"completed"` | `"cancelled"`.

> Se estiver vazio ou ausente, a página carrega dados de semente automaticamente.

  

```json

[

{

"id": "CR-HIST-001",

"createdAt": "2026-04-20T08:15:00.000Z",

"status": "completed",

"when": "agora",

"whenLabel": "Agora",

"routeSummary": "Centro → Aeroporto Internacional 4 de Fevereiro",

"passengers": 2,

"vehicle": "carro",

"vehicleLabel": "Carro • 2 passageiros",

"estimatedPrice": "Kz 1.100,00",

"estimatedDistance": "14,2 km",

"estimatedDuration": "00:32:00",

"stops": ["Centro", "Aeroporto Internacional 4 de Fevereiro"],

"driver": {

"name": "Carlos Mendes",

"phone": "+244923456789",

"vehicleBrand": "Toyota Corolla",

"vehicleColor": "Branco",

"plate": "LD-45-67-BC",

"initials": "CM"

}

},

{

"id": "CR-HIST-003",

"createdAt": "2026-04-16T09:00:00.000Z",

"status": "cancelled",

"when": "agora",

"whenLabel": "Agora",

"routeSummary": "Maianga → Talatona",

"passengers": 3,

"vehicle": "carro",

"vehicleLabel": "Carro • 3 passageiros",

"estimatedPrice": "Kz 1.680,00",

"estimatedDistance": "19,4 km",

"estimatedDuration": "00:42:00",

"stops": ["Maianga", "Talatona"],

"driver": {

"name": "João Baptista",

"phone": "+244945678901",

"vehicleBrand": "Volkswagen Polo",

"vehicleColor": "Prata",

"plate": "HU-23-45-EF",

"initials": "JB"

}

}

]

```

  

---

  

## sessionStorage

  

### `cadastro_scan_data`

Dados do QR Code escaneado na Etapa 1 do cadastro. Apagado após conclusão.

Controla: preenchimento automático dos campos na Etapa 2.

  

```json

{

"scanId": "qr-1747123456789",

"campos": {

"nome": "Ana Sousa",

"numero": "001234567LA041",

"provincia": "Luanda",

"nascimento": "01/01/1995",

"genero": "Feminino",

"estado": "Solteiro(a)",

"validade": "31/12/2030"

},

"extractedData": {

"name": "Ana Sousa",

"documentNumber": "001234567LA041",

"birthDate": "01/01/1995",

"validity": "31/12/2030"

}

}

```

  

>  **Para saltar o scan no teste:** inserir esta chave manualmente antes de aceder a `#/cadastro/etapa2`.

  

---

  

## Snippets rápidos para a Consola do Browser

  

```js

// Ver sessão atual

JSON.parse(localStorage.getItem('gyro.auth.current'))

  

// Fazer login manual (utilizador já deve existir em gyro.auth.users)

localStorage.setItem('gyro.auth.current', JSON.stringify({ id: 1747123456789, name: "Ana Sousa", email: "ana@teste.com", role: "passageiro", createdAt: "2026-05-14T10:00:00.000Z", documentData: { scanId: "qr-test", campos: { nome: "Ana Sousa", numero: "001234567LA041", provincia: "Luanda", nascimento: "01/01/1995", genero: "Feminino", estado: "Solteiro(a)", validade: "31/12/2030" }, extractedData: { name: "Ana Sousa", documentNumber: "001234567LA041", birthDate: "01/01/1995", validity: "31/12/2030" } } }))

  

// Fazer logout

localStorage.removeItem('gyro.auth.current')

  

// Ver todos os utilizadores

JSON.parse(localStorage.getItem('gyro.auth.users'))

  

// Limpar todos os utilizadores

localStorage.removeItem('gyro.auth.users')

  

// Simular corrida ativa (cole o objeto completo do exemplo acima)

localStorage.setItem('gyro.ride.active', JSON.stringify({ id:  "CR-001", status:  "active", routeSummary:  "Ingombota → Talatona", /* ... */ }))

  

// Remover corrida ativa

localStorage.removeItem('gyro.ride.active')

  

// Resetar agendamentos (força reload dos dados de semente)

localStorage.removeItem('gyro.rides.scheduled')

  

// Resetar histórico (força reload dos dados de semente)

localStorage.removeItem('gyro.rides.history')

  

// Injetar scan do bilhete para saltar Etapa 1 do cadastro

sessionStorage.setItem('cadastro_scan_data', JSON.stringify({ scanId:  "qr-test", campos: { nome:  "Ana Sousa", numero:  "001234567LA041", provincia:  "Luanda", nascimento:  "01/01/1995", genero:  "Feminino", estado:  "Solteiro(a)", validade:  "31/12/2030" }, extractedData: { name:  "Ana Sousa", documentNumber:  "001234567LA041", birthDate:  "01/01/1995", validity:  "31/12/2030" } }))

```
