# arquitetura.md — Padrões de Arquitetura do Projeto

Este projeto segue Clean Architecture. Stack: Fastify + Zod + Prisma + TypeScript + Biome + Vitest para testes.

Sempre que for implementar uma nova feature/task, siga EXATAMENTE a estrutura e a ordem de camadas abaixo. Não pule camadas (ex: controller não deve acessar o Prisma diretamente).

## Camadas (nessa ordem de dependência)

```
Controller → Use Case → Repository (interface) → Repository (implementação: Prisma | In-Memory)
```

### 1. `src/repositories/<recurso>-repository.ts`
Interface TypeScript pura, sem lógica. Define o contrato que qualquer implementação deve seguir.

```ts
import type { Gym, Prisma } from '@/generated/client'

export interface GymsRepository {
  findById(id: string): Promise<Gym | null>
  create(data: Prisma.GymCreateInput): Promise<Gym>
}
```

### 2. `src/repositories/prisma/prisma-<recurso>-repository.ts`
Implementação real usando Prisma. Implementa a interface acima.

### 3. `src/repositories/in-memory/in-memory-<recurso>-repository.ts`
Implementação em memória (array `public items: X[] = []`), usada SOMENTE nos testes unitários de use-case. Deve implementar a interface também.

### 4. `src/use-cases/<nome-da-acao>.ts`
Classe com um construtor recebendo a(s) repository(ies) por injeção de dependência, e um método `execute`. Toda regra de negócio mora aqui — nunca no controller.

```ts
export class CreateGymUseCase {
  constructor(private gymsRepository: GymsRepository) {}

  async execute({ title, ... }: CreateGymUseCaseRequest): Promise<CreateGymUseCaseResponse> {
    // regra de negócio, validações de domínio, chamadas ao repositório
  }
}
```

Erros de domínio (regra de negócio violada) vivem em `src/use-cases/errors/<nome>-error.ts`, cada um estendendo `Error`:

```ts
export class ResourceNotFoundError extends Error {
  constructor() {
    super('Resource not found.')
  }
}
```

### 5. `src/use-cases/factories/make-<nome-da-acao>-use-case.ts`
Função fábrica que monta o use case com a implementação REAL (Prisma) do repositório. É isso que o controller chama — nunca instancie o use case direto no controller.

```ts
export function makeCreateGymUseCase() {
  const gymsRepository = new PrismaGymsRepository()
  return new CreateGymUseCase(gymsRepository)
}
```

### 6. `src/controllers/<recurso>/schemas.ts`
Schemas Zod para body/query/params/response desse recurso, e os `type` inferidos via `z.infer`. Um arquivo de schemas por recurso (não por rota).

### 7. `src/controllers/<recurso>/<acao>.ts`
Handler HTTP puro: extrai dados de `request`, chama a factory do use case, trata erros de domínio convertendo para status HTTP, devolve `reply`. Nada de lógica de negócio aqui.

```ts
export async function create(request: FastifyRequest<{ Body: CreateGymBody }>, reply: FastifyReply) {
  const { title, description, phone, latitude, longitude } = request.body
  const createGymUseCase = makeCreateGymUseCase()
  await createGymUseCase.execute({ title, description, phone, latitude, longitude })
  return reply.status(201).send()
}
```

### 8. `src/controllers/<recurso>/route.ts` (ou `routes.ts`)
Registra as rotas Fastify usando `withTypeProvider<ZodTypeProvider>()`, referenciando os schemas Zod para validação/serialização automática e documentação Swagger (`operationId`, `tags`, `summary`). Middlewares de autenticação/autorização (`verifyJwt`, `verifyUserRole`) são aplicados aqui via `onRequest`.

## Outras convenções

- **Nomenclatura de arquivo**: kebab-case (`create-gym.ts`, `prisma-gyms-repository.ts`). Classes em PascalCase, funções/variáveis em camelCase.
- **Alias de import**: `@/*` aponta para `src/*` (configurar em `tsconfig.json` + resolver do Vitest).
- **Erros HTTP**: erros de validação de schema viram 400 automaticamente (via `fastify-type-provider-zod`); erros de domínio (`use-cases/errors/*`) devem ser capturados no controller ou no error handler global do `app.ts` e mapeados para o status correto; qualquer coisa não tratada vira 500.
- **Env vars**: validadas com Zod em `src/env/index.ts`, usando `safeParse` e lançando erro se inválido — nunca acessar `process.env` diretamente fora desse arquivo.
- **Middlewares**: ficam em `src/middlewares/`, recebem `(request, reply)` e são plugados via `onRequest` na rota ou no plugin do recurso.
- **Prisma**: client singleton em `src/lib/prisma.ts`; nunca instanciar `PrismaClient` em outro lugar.
- **Documentação**: toda rota registra `operationId`, `tags` e `summary` no schema Fastify para alimentar o Swagger/Scalar automaticamente — não criar documentação manual separada.

## Testes (Vitest)

Dois tipos de teste, separados por pasta:

- `src/test/use-cases/<nome>.test.ts` — testes unitários do use case, usando SEMPRE a implementação In-Memory do repositório (nunca o Prisma real).
- `src/test/e2e/controllers/<recurso>/<acao>.test.ts` — testes de ponta a ponta, batendo na `app` real via `supertest`, banco de dados real (test env).

Trocar a sintaxe de Jest por Vitest:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository'
import { CreateGymUseCase } from '@/use-cases/create-gyms'

let gymsRepository: InMemoryGymsRepository
let sut: CreateGymUseCase

describe('Create Gym Use Case', () => {
  beforeEach(() => {
    gymsRepository = new InMemoryGymsRepository()
    sut = new CreateGymUseCase(gymsRepository)
  })

  it('should be able to create a gym', async () => {
    const { gym } = await sut.execute({
      title: 'JavaScript Gym',
      description: null,
      phone: null,
      latitude: -27.2092052,
      longitude: -49.6401091,
    })

    expect(gym.id).toEqual(expect.any(String))
  })
})
```

Config sugerida (`vitest.config.ts`), separando unit e e2e:

```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environmentMatchGlobs: [['src/test/e2e/**', 'node']],
    exclude: ['node_modules', 'build'],
  },
})
```

(Pode-se usar `vitest.config.ts` + `vitest.e2e.config.ts` com `projects`/`workspace` do Vitest, ou um único config com `include`/`exclude` por pasta — decidir conforme a necessidade de setup de banco diferente para e2e.)

Helpers de teste (ex: `createAndAuthenticateUser`) ficam em `src/utils/test/`.

## Fluxo ao implementar uma nova task

Ao receber um pedido do tipo "crie a funcionalidade X", seguir esta ordem:

1. Repository interface (se recurso novo) + implementações Prisma e In-Memory.
2. Use case + (se aplicável) novo erro de domínio em `use-cases/errors/`.
3. Teste unitário do use case (Vitest, in-memory repo) — cobrindo caso de sucesso e principais regras de negócio/erros.
4. Factory do use case.
5. Schemas Zod do recurso/rota.
6. Controller (handler).
7. Registro da rota com schema Zod + tags/summary/operationId.
8. Teste e2e do endpoint.
9. Rodar lint/format (Biome) antes de considerar a task concluída.