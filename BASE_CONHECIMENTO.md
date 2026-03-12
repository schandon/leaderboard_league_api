# Base de Conhecimento — Leaderboard League API

> Documento gerado em 12/03/2026. Última atualização: 12/03/2026 (integração Riot API). Contém toda a documentação técnica do projeto.

---

## 1. Visão Geral

API REST para gerenciamento de usuários e contas Riot Games (League of Legends, Valorant, TFT, Wild Rift). Possui autenticação JWT, sistema de roles (ADMIN/USER), CRUD completo de usuários e contas, rastreamento histórico de ranks competitivos via snapshots e sincronização automática de ranks via integração com a Riot API.

---

## 2. Stack Tecnológica

| Tecnologia | Versão | Finalidade |
|---|---|---|
| TypeScript | ^5.9.3 | Linguagem principal |
| Node.js | 20+ | Runtime |
| Express | ^5.2.1 | Framework HTTP |
| Prisma ORM | ^7.5.0 | ORM, migrations e client |
| @prisma/adapter-pg | ^7.5.0 | Adaptador PostgreSQL para Prisma |
| pg | ^8.20.0 | Driver nativo PostgreSQL |
| PostgreSQL | 17.1-alpine | Banco de dados (via Docker) |
| Zod | ^4.3.6 | Validação de schemas |
| bcryptjs | ^3.0.3 | Hash de senhas |
| jsonwebtoken | ^9.0.3 | Autenticação JWT |
| dotenv | ^17.3.1 | Variáveis de ambiente |
| node-cron | ^4.2.1 | Agendamento de tarefas (cron job) |
| tsx | ^4.21.0 | Execução TypeScript em dev (watch mode) |
| Docker Compose | — | Container do PostgreSQL |

---

## 3. Estrutura do Projeto

```
leaderboard_league_api/
├── .env                           # Variáveis de ambiente (gitignored)
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── prisma.config.ts               # Configuração do Prisma (datasource, seed)
├── README.md
├── BASE_CONHECIMENTO.md           # Este arquivo
│
├── infra/
│   └── postgres/
│       ├── .env                   # Variáveis do Docker Compose
│       └── docker-compose.yml     # Container PostgreSQL
│
├── prisma/
│   ├── schema.prisma              # Schema do banco de dados
│   ├── seed.ts                    # Seed: cria roles ADMIN e USER
│   └── migrations/                # Histórico de migrations
│       ├── migration_lock.toml
│       ├── 20260311164451_start_lol_db/
│       ├── 20260311222000_add_account_and_updated_at/
│       ├── 20260311223217_add_account_and_updated_at/
│       └── 20260312010520_add_roles_system/
│
├── src/
│   ├── server.ts                      # Entry point: carrega .env, inicia servidor e cron job
│   ├── app.ts                         # Configura Express (JSON, rotas, error handler)
│   ├── controllers/
│   │   ├── userController.ts          # Handlers de usuário (register, login, CRUD)
│   │   ├── accountController.ts       # Handlers de conta Riot (CRUD)
│   │   └── accountRankController.ts   # Handlers de snapshots de rank
│   ├── services/
│   │   ├── userService.ts             # Lógica de negócio de usuários
│   │   ├── accountService.ts          # Lógica de negócio de contas
│   │   ├── accountRankService.ts      # Lógica de negócio de snapshots de rank
│   │   └── riotApiService.ts          # Consultas à Riot API (summoner, league entries)
│   ├── schemas/
│   │   ├── userSchemas.ts             # Schemas Zod para User
│   │   ├── accountSchemas.ts          # Schemas Zod para Account
│   │   └── accountRankSchemas.ts      # Schemas Zod para AccountRank
│   ├── routes/
│   │   ├── index.ts                   # Agrupa todas as rotas
│   │   ├── userRoutes.ts              # Rotas de usuário
│   │   ├── accountRoutes.ts           # Rotas de conta
│   │   └── accountRankRoutes.ts       # Rotas de snapshots de rank
│   ├── middlewares/
│   │   ├── authMiddleware.ts          # Validação JWT e extração de userId
│   │   └── errorHandler.ts            # Tratamento global de erros
│   ├── lib/
│   │   ├── prisma.ts                  # Instância do PrismaClient com adapter pg
│   │   └── riotFetch.ts               # Fetch wrapper com retry/exponential backoff (rate limit)
│   ├── errors/
│   │   └── riotApiError.ts            # Classe RiotApiError com mapeamento de status HTTP
│   ├── types/
│   │   ├── express.d.ts               # Extensão: Request.userId
│   │   └── riot.ts                    # Interfaces RiotSummoner e RiotLeagueEntry
│   ├── jobs/
│   │   └── syncRanks.ts               # Cron job de sincronização de ranks (a cada 30 min)
│   └── generated/
│       └── prisma/                    # Client gerado pelo Prisma (gitignored)
│
└── dist/                          # Build compilada (gitignored)
```

---

## 4. Configuração

### 4.1 Variáveis de Ambiente (`.env` na raiz)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |
| `PORT` | Porta do servidor Express (padrão: 3000) |
| `RIOT_API_KEY` | Chave de API da Riot Games (`RGAPI-...`) |
| `RIOT_DEFAULT_REGION` | Região padrão para chamadas à Riot API (padrão: `br1`) |

### 4.2 TypeScript (`tsconfig.json`)

- **target**: ES2020
- **module**: commonjs
- **strict**: true
- **outDir**: `./dist`
- **rootDir**: `./src`
- Features: esModuleInterop, sourceMap, declaration, declarationMap

### 4.3 Prisma (`prisma.config.ts`)

Usa `defineConfig` do Prisma para apontar o schema, o seed (`tsx prisma/seed.ts`) e o datasource via `DATABASE_URL`.

### 4.4 Git Ignore

Arquivos ignorados: `node_modules/`, `dist/`, `src/generated/`, `.env`, `PROMPT.md`.

---

## 5. Scripts NPM

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `tsx watch src/server.ts` | Inicia em modo watch (hot reload) |
| `build` | `tsc` | Compila TypeScript para JavaScript em `dist/` |
| `start` | `node dist/server.js` | Executa a build compilada |
| `prisma:migrate` | `prisma migrate dev` | Cria e aplica migrations |
| `prisma:generate` | `prisma generate` | Regenera o Prisma Client |
| seed | `tsx prisma/seed.ts` | Popula roles iniciais (via `npx prisma db seed`) |

---

## 7. Banco de Dados

### 7.1 Schema Prisma (`prisma/schema.prisma`)

#### Enums

| Enum | Valores |
|---|---|
| `RoleName` | `ADMIN`, `USER` |
| `AccountType` | `LOL`, `VALORANT`, `TFT`, `WILD_RIFT` |
| `AccountStatus` | `ACTIVE`, `INACTIVE`, `BANNED` |

#### Model User (tabela `users`)

| Campo | Tipo | Atributos | Descrição |
|---|---|---|---|
| `id` | String | `@id @default(uuid())` | PK |
| `email` | String | `@unique` | E-mail único |
| `password` | String | — | Senha (hash bcrypt) |
| `name` | String | — | Nome do usuário |
| `createdAt` | DateTime | `@default(now())` | Data de criação |
| `updatedAt` | DateTime | `@updatedAt` | Última atualização |

Relações: `accounts` (1:N com Account), `roles` (N:N via UserRole).

#### Model Role (tabela `roles`)

| Campo | Tipo | Atributos | Descrição |
|---|---|---|---|
| `id` | String | `@id @default(uuid())` | PK |
| `name` | RoleName | `@unique` | Nome da role |

Relação: `users` (N:N via UserRole).

#### Model UserRole (tabela `user_roles`)

| Campo | Tipo | Atributos | Descrição |
|---|---|---|---|
| `userId` | String | `@map("user_id")` | FK → User.id |
| `roleId` | String | `@map("role_id")` | FK → Role.id |

- PK composta: `(userId, roleId)`
- `onDelete: Cascade` em ambas as FKs

#### Model Account (tabela `accounts`)

| Campo | Tipo | Atributos | Descrição |
|---|---|---|---|
| `id` | String | `@id @default(uuid())` | PK |
| `usernameRiot` | String | `@map("username_riot")` | Nome no Riot Games |
| `tagRiot` | String | `@map("tag_riot")` | Tag Riot (ex.: BR1) |
| `puuid` | String | `@unique` | Identificador universal da Riot API (para histórico de partidas) |
| `gameName` | String | `@map("game_name")` | Nome de exibição atualizado do jogador |
| `type` | AccountType | — | Tipo do jogo |
| `status` | AccountStatus | — | Status da conta |
| `fkUser` | String | `@map("fk_user")` | FK → User.id |
| `createdAt` | DateTime | `@default(now())` | Data de criação |
| `updatedAt` | DateTime | `@updatedAt` | Última atualização |

- `onDelete: Restrict` — não é possível excluir um User que tenha contas vinculadas.
- Relação: `ranks` (1:N com AccountRank).

#### Model AccountRank (tabela `account_ranks`)

| Campo | Tipo | Atributos | Descrição |
|---|---|---|---|
| `id` | String | `@id @default(uuid())` | PK |
| `tier` | String | — | Divisão (ex.: "DIAMOND") |
| `rank` | String | — | Subdivisão (ex.: "I") |
| `leaguePoints` | Int | `@map("league_points")` | PDL do jogador |
| `wins` | Int | — | Vitórias acumuladas |
| `losses` | Int | — | Derrotas acumuladas |
| `fkAccount` | String | `@map("fk_account")` | FK → Account.id |
| `createdAt` | DateTime | `@default(now())` | Data do snapshot |

- `onDelete: Cascade` — ao excluir uma Account, todos os seus snapshots são removidos.
- Índice composto: `@@index([fkAccount, createdAt(sort: Desc)])` — otimiza consultas de séries temporais (buscar rank mais recente ou histórico de evolução de uma conta).

### 7.2 Regras de Integridade

- Um **User** pode ter 0..N **Accounts**; uma **Account** pertence a exatamente 1 **User**.
- Uma **Account** pode ter 0..N **AccountRanks**; um **AccountRank** pertence a exatamente 1 **Account**.
- O campo `fkUser` **nunca pode ser alterado** após a criação (bloqueado no schema Zod de update).
- **onDelete: Restrict** em Account → não permite excluir User com contas vinculadas.
- **onDelete: Cascade** em UserRole → ao excluir User ou Role, os registros de ligação são removidos.
- **onDelete: Cascade** em AccountRank → ao excluir uma Account, todos os seus snapshots de rank são removidos.
- **AccountRank é imutável** — não há endpoint de update ou delete; serve exclusivamente como log histórico.

### 7.3 Migrations

| Migration | Data | Descrição |
|---|---|---|
| `start_lol_db` | 11/03/2026 | Cria tabela `users` (id, email, password, name, created_at) |
| `add_account_and_updated_at` | 11/03/2026 | Adiciona `updated_at` em `users`; cria enums `AccountType`/`AccountStatus` e tabela `accounts` |
| `add_account_and_updated_at` (2) | 11/03/2026 | Remove DEFAULT de `users.updated_at` (Prisma controla via `@updatedAt`) |
| `add_roles_system` | 12/03/2026 | Cria enum `RoleName`, tabelas `roles` e `user_roles` com FKs cascade |
| `add_puuid_gamename_and_account_ranks` | 12/03/2026 | Adiciona `puuid` e `game_name` em `accounts`; cria tabela `account_ranks` com índice composto |

### 7.4 Seed (`prisma/seed.ts`)

Usa `upsert` para criar as roles `ADMIN` e `USER` de forma idempotente.

---

## 8. Arquitetura da Aplicação

### Fluxo de uma requisição

```
Request → Express (app.ts)
  → Route (routes/)
    → [authMiddleware] (se rota protegida)
    → Controller (controllers/)
      → Schema Zod (schemas/) — validação
      → Service (services/) — lógica de negócio
        → Prisma Client (lib/prisma.ts) — acesso ao banco
  → Response (JSON)
  → [errorHandler] (em caso de erro)
```

### Camadas

| Camada | Responsabilidade |
|---|---|
| **Routes** | Define endpoints HTTP e aplica middlewares |
| **Controllers** | Recebe request, valida body via Zod, chama service, retorna response |
| **Services** | Contém lógica de negócio, interage com Prisma |
| **Schemas (Zod)** | Define e valida formato dos dados de entrada |
| **Middlewares** | Auth (JWT) e error handler global |
| **Lib** | Instância compartilhada do PrismaClient |

---

## 9. Autenticação

- **Registro**: hash da senha com bcryptjs (10 salt rounds), cria User no banco.
- **Login**: compara senha com hash armazenado; gera JWT com payload `{ userId }`, expiração de **1 dia**.
- **Middleware**: extrai token do header `Authorization: Bearer <token>`, verifica com `jwt.verify`, injeta `req.userId`.
- **JWT_SECRET**: lido de `process.env.JWT_SECRET`, fallback `"fallback-secret"`.

---

## 10. Validação (Schemas Zod)

### userSchemas.ts

| Schema | Campos | Regras |
|---|---|---|
| `registerSchema` | name, email, password | name min 1, email válido, password min 6 |
| `loginSchema` | email, password | email válido, password min 1 |
| `updateUserSchema` | name?, password? | Ambos opcionais; mesmas regras quando presentes |

### accountSchemas.ts

| Schema | Campos | Regras |
|---|---|---|
| `createAccountSchema` | usernameRiot, tagRiot, puuid, gameName, type, status, fkUser | Strings min 1, enums válidos, fkUser UUID |
| `updateAccountSchema` | usernameRiot?, tagRiot?, puuid?, gameName?, type?, status? | Todos opcionais; **fkUser omitido** (não pode ser alterado) |

### accountRankSchemas.ts

| Schema | Campos | Regras |
|---|---|---|
| `createAccountRankSchema` | tier, rank, leaguePoints, wins, losses, fkAccount | Strings min 1; leaguePoints/wins/losses: int nonnegative; fkAccount UUID |

---

## 11. Tratamento de Erros (`errorHandler.ts`)

| Tipo de Erro | Status | Mensagem |
|---|---|---|
| `ZodError` | 400 | Lista de erros por campo |
| Prisma `P2002` | 409 | Registro duplicado (constraint única violada) |
| Prisma `P2025` | 404 | Registro não encontrado |
| Prisma `P2003` | 409 | Não é possível excluir: existem registros vinculados |
| Erro com `statusCode` | statusCode | Mensagem do erro |
| Erro genérico | 500 | "Erro interno do servidor" (loga no console) |

---

## 12. Endpoints da API

Base URL: `http://localhost:3000/api`

### 12.1 Rotas Públicas

| Método | Rota | Descrição | Body |
|---|---|---|---|
| `POST` | `/api/register` | Cadastrar usuário | `{ name, email, password }` |
| `POST` | `/api/login` | Login (retorna JWT) | `{ email, password }` |

### 12.2 Rotas de Usuário (protegidas — `Authorization: Bearer <token>`)

| Método | Rota | Descrição | Body |
|---|---|---|---|
| `GET` | `/api/users` | Listar todos os usuários | — |
| `GET` | `/api/users/:id` | Buscar usuário por ID | — |
| `PUT` | `/api/users/:id` | Atualizar nome ou senha | `{ name?, password? }` |
| `DELETE` | `/api/users/:id` | Remover usuário | — |

### 12.3 Rotas de Conta Riot (protegidas — `Authorization: Bearer <token>`)

| Método | Rota | Descrição | Body |
|---|---|---|---|
| `POST` | `/api/accounts` | Vincular conta Riot | `{ usernameRiot, tagRiot, puuid, gameName, type, status, fkUser }` |
| `GET` | `/api/accounts` | Listar todas as contas | — |
| `GET` | `/api/accounts/:id` | Buscar conta por ID | — |
| `GET` | `/api/accounts/user/:userId` | Listar contas de um usuário | — |
| `PUT` | `/api/accounts/:id` | Atualizar conta (exceto fkUser) | `{ usernameRiot?, tagRiot?, puuid?, gameName?, type?, status? }` |
| `DELETE` | `/api/accounts/:id` | Remover conta | — |

### 12.4 Rotas de Rank (protegidas — `Authorization: Bearer <token>`)

| Método | Rota | Descrição | Body |
|---|---|---|---|
| `POST` | `/api/account-ranks` | Criar snapshot de rank | `{ tier, rank, leaguePoints, wins, losses, fkAccount }` |
| `GET` | `/api/account-ranks/account/:accountId` | Listar histórico de ranks da conta (ordem desc) | — |
| `GET` | `/api/account-ranks/account/:accountId/latest` | Buscar snapshot mais recente da conta | — |

### 12.5 Respostas HTTP

| Código | Situação |
|---|---|
| `200` | Sucesso (GET, PUT, POST login) |
| `201` | Recurso criado (POST register, POST accounts) |
| `204` | Recurso removido (DELETE) |
| `400` | Validação Zod falhou |
| `401` | Token ausente, inválido ou credenciais incorretas |
| `404` | Recurso não encontrado |
| `409` | Conflito (e-mail duplicado, registros vinculados) |
| `500` | Erro interno do servidor |

---

## 13. Exemplos de Requisição

### Cadastro

```http
POST /api/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Resposta (201):**
```json
{
  "id": "uuid",
  "email": "joao@email.com",
  "name": "João Silva",
  "createdAt": "2026-03-12T...",
  "updatedAt": "2026-03-12T..."
}
```

### Login

```http
POST /api/login
Content-Type: application/json

{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Resposta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Vincular Conta Riot

```http
POST /api/accounts
Authorization: Bearer <token>
Content-Type: application/json

{
  "usernameRiot": "Faker",
  "tagRiot": "KR1",
  "type": "LOL",
  "status": "ACTIVE",
  "fkUser": "uuid-do-usuario"
}
```

### Listar Contas de um Usuário

```http
GET /api/accounts/user/uuid-do-usuario
Authorization: Bearer <token>
```

---

## 14. Código-fonte Detalhado

### 14.1 Entry Point (`src/server.ts`)

Carrega variáveis de ambiente via `dotenv/config`, importa o app Express e inicia o servidor na porta configurada.

### 14.2 App Express (`src/app.ts`)

Configura: `express.json()` → rotas em `/api` → error handler global.

### 14.3 Entry Point atualizado (`src/server.ts`)

Além de carregar variáveis de ambiente e iniciar o Express, agora chama `startSyncJob()` após o servidor subir para registrar o cron job de sincronização de ranks.

### 14.3 Prisma Client (`src/lib/prisma.ts`)

Usa `@prisma/adapter-pg` com o driver `pg` nativo. A connection string vem de `DATABASE_URL`.

### 14.4 Auth Middleware (`src/middlewares/authMiddleware.ts`)

Verifica header `Authorization: Bearer <token>`. Decodifica com `jwt.verify`. Injeta `req.userId` (tipo extendido em `types/express.d.ts`).

### 14.5 Error Handler (`src/middlewares/errorHandler.ts`)

Trata erros em ordem: ZodError → PrismaClientKnownRequestError (P2002, P2025, P2003) → erro com statusCode customizado → erro 500 genérico.

### 14.6 User Service (`src/services/userService.ts`)

- **register**: verifica e-mail duplicado, hash da senha, cria User.
- **login**: busca por e-mail, compara senha, gera JWT (1d).
- **findAll / findById**: retorna dados sem senha (via `userSelect`).
- **update**: re-hash da senha se informada, atualiza User.
- **remove**: verifica existência, deleta User (falha se houver contas vinculadas).

### 14.7 Account Service (`src/services/accountService.ts`)

- **create**: verifica se o User existe, cria Account (inclui `puuid` e `gameName`).
- **findAll / findById / findByUserId**: consultas com `accountSelect` (inclui `puuid` e `gameName`).
- **update**: verifica existência, atualiza (sem permitir alterar `fkUser`).
- **remove**: verifica existência, deleta Account.

### 14.8 AccountRank Service (`src/services/accountRankService.ts`)

- **create**: verifica se a Account existe, cria snapshot de rank.
- **findByAccountId**: retorna todos os snapshots de uma conta ordenados por `createdAt desc`.
- **findLatestByAccountId**: retorna apenas o snapshot mais recente; lança 404 se não houver nenhum.

### 14.9 Controllers

Padrão: recebe `req`/`res` → valida body com schema Zod (`parse`) → chama service → retorna JSON com status adequado.

- **accountRankController**: `create` (201), `findByAccountId` (200), `findLatestByAccountId` (200).

---

## 16. Integração com a Riot API

### 16.1 Tipos (`src/types/riot.ts`)

Interfaces TypeScript sem `any` para as respostas da API oficial:

| Interface | Campos principais | Endpoint de origem |
|---|---|---|
| `RiotSummoner` | `id` (summonerId), `accountId`, `puuid`, `profileIconId`, `revisionDate`, `summonerLevel` | `GET /lol/summoner/v4/summoners/by-puuid/{puuid}` |
| `RiotLeagueEntry` | `leagueId`, `summonerId`, `queueType`, `tier`, `rank`, `leaguePoints`, `wins`, `losses`, `hotStreak`, `veteran`, `freshBlood`, `inactive` | `GET /lol/league/v4/entries/by-summoner/{summonerId}` |

### 16.2 Erros Customizados (`src/errors/riotApiError.ts`)

Classe `RiotApiError extends Error` com propriedades:

- `riotStatusCode` — código HTTP original da Riot
- `statusCode` — código HTTP interno (compatível com o `errorHandler.ts`)

Mapeamento de status:

| HTTP Riot | `statusCode` interno | Significado |
|---|---|---|
| 400 | 400 | Requisição inválida |
| 401 / 403 | 502 | Chave inválida / sem permissão |
| 404 | 404 | Recurso não encontrado |
| 429 | 429 | Rate limit excedido |
| 500 / 503 | 502 | Servidor da Riot indisponível |

### 16.3 Fetch Wrapper (`src/lib/riotFetch.ts`)

Função `riotFetch<T>(url: string): Promise<T>` que encapsula `fetch` com:

- Header `X-Riot-Token` injetado automaticamente via `process.env.RIOT_API_KEY`
- **Retry com Exponential Backoff** em HTTP 429:
  - Lê o header `Retry-After` da resposta (segundos); converte para ms
  - Fallback: `BASE_BACKOFF_MS (1000ms) * 2^attempt` com jitter de até 30%
  - Máximo de 3 tentativas (`MAX_RETRIES = 3`)
- Erros não recuperáveis (4xx exceto 429, 5xx) são lançados imediatamente sem retry
- Log de cada tentativa (`[RiotFetch]`)

**Evolução futura (cache Redis):** endpoints de dados estáticos (versões do jogo, campeões, itens) devem ser cacheados via `ioredis` com TTL configurável para evitar chamadas redundantes a cada sincronização.

### 16.4 Riot API Service (`src/services/riotApiService.ts`)

| Função | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `getSummonerByPuuid` | `puuid`, `region?` | `Promise<RiotSummoner>` | Busca dados do invocador pelo PUUID |
| `getLeagueEntriesBySummonerId` | `summonerId`, `region?` | `Promise<RiotLeagueEntry[]>` | Lista todas as filas ranqueadas do invocador |
| `getRankedSoloDuo` | `summonerId`, `region?` | `Promise<RiotLeagueEntry \| null>` | Retorna apenas a entrada de `RANKED_SOLO_5x5` (ou `null` se unranked) |

A região padrão é lida de `process.env.RIOT_DEFAULT_REGION` com fallback `"br1"`.

### 16.5 Cron Job de Sincronização (`src/jobs/syncRanks.ts`)

Dependência: `node-cron ^4.2.1`.

**Agendamento:** `*/30 * * * *` — executa a cada 30 minutos.

**Funções exportadas:**

- `startSyncJob()` — registra o cron job; chamado em `server.ts` após o servidor subir
- `runSyncRanks()` — lógica principal de sincronização (também pode ser chamada manualmente)

**Fluxo de execução:**

1. Busca todas as `Account` com `status = ACTIVE` e `type = LOL` no banco
2. Para cada conta (processamento **sequencial** com delay de 1200ms entre chamadas):
   - Chama `getSummonerByPuuid(puuid)` para obter o `summonerId`
   - Chama `getRankedSoloDuo(summonerId)` para obter o rank Solo/Duo atual
   - Se a conta não possui ranking, ignora e avança
   - Busca o snapshot mais recente (`findLatestByAccountId`)
   - Compara `tier`, `rank`, `leaguePoints`, `wins` e `losses`
   - Se houver diferença (ou se for o primeiro snapshot), cria novo registro via `accountRankService.create`
3. Erros por conta são tratados individualmente — uma falha não interrompe as demais
4. Loga início, resultado por conta, e resumo final (total processado / atualizado / erros / duração)

**Gestão de rate limit:**
- Delay fixo de 1200ms entre contas respeita o limite de chaves de desenvolvimento da Riot (20 req/s, 100 req/2min)
- O `riotFetch` trata automaticamente respostas 429 com backoff antes de propagar erro

**Evolução futura:** substituir o loop sequencial por uma fila **BullMQ** (baseada em Redis) com rate limiting embutido e retry automático por job, permitindo escalar para grandes volumes de contas sem gargalo.

---

## 15. O que ainda não existe no projeto

- Testes automatizados (unit, integration, e2e)
- CI/CD (GitHub Actions, etc.)
- Linter / Formatter (ESLint, Prettier)
- Dockerfile para a API (existe apenas para o banco)
- Documentação via Swagger / OpenAPI
- Rate limiting / CORS configurado
- Logging estruturado (Winston, Pino)
- Atribuição automática de role ao registrar usuário
- Middleware de autorização por role (admin-only, etc.)
- Paginação nos endpoints de listagem
- Cache Redis para dados estáticos da Riot API (versões do jogo, campeões, itens)
- Fila de processamento (BullMQ) para escalar sincronização de ranks em massa
- Endpoint para deletar snapshots de rank individualmente (por design, AccountRank é imutável)
