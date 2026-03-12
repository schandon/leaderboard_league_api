# API LoL

API REST desenvolvida em **TypeScript** com **Express**, **Prisma ORM**, **PostgreSQL**, **Zod** e autenticação via **JWT**.

## Tecnologias

| Tecnologia | Versão | Finalidade |
|---|---|---|
| TypeScript | ^5.9 | Linguagem principal |
| Express | ^5.2 | Framework HTTP |
| Prisma ORM | ^7.5 | ORM e migrations |
| PostgreSQL | 17.1 | Banco de dados |
| Zod | ^4.3 | Validação de schemas |
| bcryptjs | ^3.0 | Hash de senhas |
| jsonwebtoken | ^9.0 | Autenticação JWT |
| dotenv | ^17.3 | Variáveis de ambiente |

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) e Docker Compose

## Configuração e execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir o banco de dados

```bash
cd infra/postgres
docker compose up -d
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/lol?schema=public"
JWT_SECRET="sua-chave-secreta-aqui"
PORT=3000
```

### 4. Aplicar as migrations

```bash
npm run prisma:migrate
```

### 5. Popular o banco com dados iniciais

```bash
npx prisma db seed
```

> Cria as roles `ADMIN` e `USER` na tabela `roles`.

### 6. Iniciar o servidor em modo desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Inicia em modo watch (tsx) |
| `npm run build` | Compila para JavaScript |
| `npm run start` | Executa a build compilada |
| `npm run prisma:migrate` | Cria e aplica migrations |
| `npm run prisma:generate` | Regenera o client Prisma |
| `npx prisma db seed` | Popula roles iniciais (ADMIN, USER) |

## Estrutura do projeto

```
src/
├── app.ts                  # Configuração do Express
├── server.ts               # Entry point
├── controllers/
│   ├── userController.ts
│   └── accountController.ts
├── services/
│   ├── userService.ts
│   └── accountService.ts
├── schemas/
│   ├── userSchemas.ts      # Schemas Zod para User
│   └── accountSchemas.ts   # Schemas Zod para Account
├── routes/
│   ├── index.ts
│   ├── userRoutes.ts
│   └── accountRoutes.ts
├── middlewares/
│   ├── authMiddleware.ts   # Validação JWT
│   └── errorHandler.ts     # Tratamento global de erros
├── lib/
│   └── prisma.ts           # Instância do PrismaClient
└── types/
    └── express.d.ts        # Extensão de tipos do Express
```

## Banco de dados

### Models

#### User
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Chave primária |
| `email` | String (unique) | E-mail do usuário |
| `password` | String | Senha (hash bcrypt) |
| `name` | String | Nome do usuário |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data da última atualização |

#### Account
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Chave primária |
| `usernameRiot` | String | Nome de usuário no Riot Games |
| `tagRiot` | String | Tag Riot (ex.: `#BR1`) |
| `type` | Enum | `LOL`, `VALORANT`, `TFT`, `WILD_RIFT` |
| `status` | Enum | `ACTIVE`, `INACTIVE`, `BANNED` |
| `fkUser` | UUID | FK para `User.id` |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Data da última atualização |

#### Role
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Chave primária |
| `name` | Enum | `ADMIN`, `USER` (único) |

#### UserRole (tabela de ligação)
| Campo | Tipo | Descrição |
|---|---|---|
| `userId` | UUID | FK para `User.id` |
| `roleId` | UUID | FK para `Role.id` |

> Chave primária composta `(userId, roleId)`. Um usuário pode ter múltiplas roles; uma role pode ser atribuída a múltiplos usuários.

### Regras de integridade

- Um `User` pode ter 0 ou N `Accounts`; uma `Account` pertence a exatamente um `User`.
- `onDelete: Restrict` em `Account` — não é possível excluir um `User` que possua contas vinculadas.
- O campo `fkUser` **nunca pode ser alterado** após a criação (bloqueado no schema Zod de atualização).
- `onDelete: Cascade` em `UserRole` — ao excluir um `User` ou uma `Role`, os registros de ligação são removidos automaticamente.

### Consultando um usuário com suas roles

```typescript
const userWithRoles = await prisma.user.findUnique({
  where: { id: "user-uuid" },
  include: {
    roles: {
      include: {
        role: true,
      },
    },
  },
});

// Resultado:
// {
//   id: "...", name: "...", email: "...",
//   roles: [
//     { userId: "...", roleId: "...", role: { id: "...", name: "ADMIN" } }
//   ]
// }
```

## Endpoints

### Autenticação e Usuários

> Rotas públicas não exigem token. Rotas marcadas com `🔒` exigem `Authorization: Bearer <token>`.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/register` | — | Cadastrar usuário |
| `POST` | `/api/login` | — | Login (retorna JWT) |
| `GET` | `/api/users` | 🔒 | Listar todos os usuários |
| `GET` | `/api/users/:id` | 🔒 | Buscar usuário por ID |
| `PUT` | `/api/users/:id` | 🔒 | Atualizar nome ou senha |
| `DELETE` | `/api/users/:id` | 🔒 | Remover usuário |

### Contas Riot

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/accounts` | 🔒 | Vincular conta Riot a um usuário |
| `GET` | `/api/accounts` | 🔒 | Listar todas as contas |
| `GET` | `/api/accounts/:id` | 🔒 | Buscar conta por ID |
| `GET` | `/api/accounts/user/:userId` | 🔒 | Listar contas de um usuário |
| `PUT` | `/api/accounts/:id` | 🔒 | Atualizar dados da conta (exceto `fkUser`) |
| `DELETE` | `/api/accounts/:id` | 🔒 | Remover conta |

## Exemplos de requisição

### Cadastro de usuário

```http
POST /api/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
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

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Vincular conta Riot

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

## Tratamento de erros

| Código | Situação |
|---|---|
| `400` | Validação Zod falhou |
| `401` | Token ausente ou inválido |
| `404` | Recurso não encontrado |
| `409` | Conflito: e-mail duplicado ou tentativa de excluir usuário com contas vinculadas |
| `500` | Erro interno do servidor |
