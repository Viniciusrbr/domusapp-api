# Domus API

> Backend do **Domus** — um Progressive Web App para gerenciar tarefas domésticas recorrentes em várias casas.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)

<!-- Opcional: link para a documentação da API em produção -->
<!-- **Documentação da API:** https://sua-url-de-deploy/docs -->

## Sobre

O Domus ajuda famílias a acompanhar tarefas domésticas recorrentes — limpeza, manutenção, contas — com agenda de recorrência fixa, histórico de execuções e suporte a uma pessoa pertencendo a várias casas. Este repositório contém a API REST; o cliente web fica em [`domus-web`](https://github.com/Viniciusrbr/domusapp-web).

## Funcionalidades

- **Autenticação** — cadastro, login, access tokens JWT com refresh tokens rotativos, recuperação de senha.
- **Múltiplas casas** — um usuário pode ter várias casas, cada uma com suas próprias tarefas, categorias e histórico.
- **Tarefas recorrentes** — cadências por dia/semana/mês em grade fixa, marcação de conclusão e histórico de execuções por tarefa.
- **Categorias** — agrupamento de tarefas dentro de uma casa.
- **Colaboração (em andamento)** — links de convite, papéis de membro (owner/admin/member), transferência de propriedade.

## Stack

Node.js · TypeScript · Fastify 5 · Prisma 7 · PostgreSQL · Zod 4 · JWT (`@fastify/jwt`) · Vitest · Biome · OpenAPI/Scalar

## Arquitetura e decisões principais

Os pontos que eu destacaria para quem for revisar o código:

- **Clean Architecture com injeção de dependência.** Controllers → use cases → interfaces de repositório → implementações. As regras de negócio vivem nos use cases e são cobertas por testes unitários rápidos usando **repositórios in-memory**, então o domínio é testado sem tocar no banco.
- **Motor de recorrência orientado ao domínio.** Tarefas recorrentes ficam em uma **grade fixa ancorada na data de início**. A próxima ocorrência sempre avança a partir da data *agendada*, nunca da data real de conclusão — assim, atrasar não desloca silenciosamente a cadência. É um módulo puro e coberto por testes unitários.
- **Correto em relação a fuso horário por construção.** Instantes (timestamps) são armazenados em UTC; datas de recorrência são armazenadas como datas de calendário puras. O status da tarefa (*vence hoje* / *atrasada*) é derivado em relação ao dia local de quem está visualizando, o que evita o clássico erro de um dia para usuários em regiões diferentes.
- **Autorização multi-tenant.** As casas usam uma tabela de junção `Membership`; uma primitiva reutilizável de membership/papel autoriza cada requisição, e a criação de uma casa **provisiona o dono atomicamente em uma única transação** — sem casas órfãs sem dono.
- **Sessões seguras.** Senhas são hasheadas; access tokens JWT de vida curta são combinados com **refresh tokens rotativos persistidos (com hash) no banco**.
- **API autodocumentada.** Os mesmos schemas Zod alimentam a validação em runtime *e* a geração automática da documentação OpenAPI, servida por uma UI Scalar em `/docs`.

## Estrutura do projeto

```
src/
  controllers/<recurso>/   # handlers HTTP, schemas Zod, registro de rotas
  use-cases/               # regras de negócio (+ errors, factories)
  repositories/            # interfaces + implementações Prisma e in-memory
  middlewares/             # verifyJwt, verificação de papéis
  lib/                     # client do Prisma, helpers compartilhados
  utils/                   # utilitários de domínio (ex.: recorrência)
  env/                     # validação de variáveis de ambiente (Zod)
  test/                    # testes unitários e e2e
prisma/                    # schema + migrations
```

## Como rodar

**Pré-requisitos:** Node.js 20+, pnpm e uma instância do PostgreSQL (ou Docker).

```bash
# 1. Instalar dependências
pnpm install

# 2. Ambiente
cp .env.example .env   # preencha DATABASE_URL e JWT_SECRET

# 3. Banco de dados
pnpm db:migrate        # executa as migrations do Prisma
pnpm db:generate       # gera o client do Prisma

# 4. Executar
pnpm dev               # http://localhost:8000  (docs em /docs)
```

### Variáveis de ambiente

Validadas com Zod em [src/env/index.ts](src/env/index.ts) — a aplicação não sobe se alguma estiver inválida.

| Variável | Obrigatória | Padrão | Descrição |
|---|---|---|---|
| `DATABASE_URL` | sim | — | String de conexão do PostgreSQL |
| `JWT_SECRET` | sim | — | Segredo usado para assinar os JWTs |
| `PORT` | não | `8000` | Porta HTTP |
| `NODE_ENV` | não | `dev` | `dev` \| `test` \| `production` |
| `API_BASE_URL` | não | `http://localhost:8000` | URL pública da API |
| `WEB_APP_URL` | não | `http://localhost:3000` | Base do app cliente, usada no link de reset de senha |
| `CORS_ORIGINS` | não | `http://localhost:3000` | Origens permitidas no CORS, separadas por vírgula |

## Documentação da API

Com o servidor rodando, a referência interativa (Scalar) fica em [http://localhost:8000/docs](http://localhost:8000/docs). Ela é gerada a partir dos mesmos schemas Zod usados na validação, então nunca fica dessincronizada dos handlers.

Grupos de rotas disponíveis:

| Recurso | Rotas |
|---|---|
| Usuários | cadastro, login, refresh token, logout, perfil, atualização de perfil, esqueci/reset de senha |
| Casas | criar, listar, atualizar, remover |
| Categorias | criar, listar, atualizar, remover |
| Tarefas | criar, listar, atualizar, remover, concluir, histórico de execuções |

## Testes

```bash
pnpm test              # testes unitários (Vitest, repositórios in-memory)
pnpm test:watch        # unitários em modo watch
pnpm test:e2e          # testes ponta a ponta (banco de teste real)
pnpm test:e2e:watch    # e2e em modo watch
```

As regras de negócio — em especial o motor de recorrência e a autorização — são a prioridade da cobertura unitária.

## Scripts úteis

| Script | O que faz |
|---|---|
| `pnpm dev` | Sobe a API em modo watch (`tsx`) |
| `pnpm build` | Gera o build de produção em `build/` (`tsup`) |
| `pnpm start` | Executa o build de produção |
| `pnpm check` | Lint + format com Biome (com correção automática) |
| `pnpm db:studio` | Abre o Prisma Studio |

## Roadmap

- [ ] Lembretes e notificações por WhatsApp/e-mail
- [ ] Estatísticas da casa (distribuição de carga por membro)
- [ ] Sugestões de tarefas/frequência assistidas por IA

Cliente web: [`domus-web`](https://github.com/Viniciusrbr/domusapp-web)

<!-- ## Licença -->
<!-- MIT — veja LICENSE -->
