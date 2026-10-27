# Qualidade

## Comandos

| Comando | O que prova |
|---|---|
| `pnpm lint` | ESLint com presets do Next (core-web-vitals + TypeScript) e regras locais `eslint-rules/` do toolkit |
| `pnpm lint:typed` | Lint tipado separado (`eslint.typed.config.mjs`): promises flutuantes e mal usadas |
| `pnpm lint:rules` | Self-check das regras locais com o `RuleTester` do ESLint |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` (rotas tipadas e TypeScript estrito) |
| `pnpm test` | Vitest em Node para regras puras (dinheiro, CNPJ, regras do pipeline, cálculos) |
| `pnpm build` | Build de produção do Next |
| `pnpm check` | Lint, tipos, lint tipado, self-check, testes e build, em sequência. Rode antes de abrir PR. Não publica nem toca no banco |

## Regras locais (`eslint-rules/`, toolkit 790a895)

| Regra | Severidade | Alcance | Exceções justificadas |
|---|---|---|---|
| `quality/max-lines` (350) | error | todo código; testes e arquivos só de tipos ficam fora | `src/lib/supabase/database.types.ts` (gerado) |
| `quality/no-direct-console` | error | `src/**` exceto testes | `src/app/**/error.tsx` e `global-error.tsx` (error boundary do cliente; o servidor já registra com `digest`) |
| `quality/no-direct-data-access` | error | `.tsx` e `src/components/**` não importam `createClient`/`createAdminClient` de `@/lib/supabase/server` ou `/admin` | nenhuma. Rotas e actions em `src/app/**/*.ts` podem usar o cliente de servidor |

Medição em 2026-10-27, antes de ligar: 1 `console` (exceção acima), 1 arquivo gerado, 0 importações de dados indevidas. A regra não substitui `requireRole` nem RLS.

## Lint tipado

- `@typescript-eslint/no-floating-promises`: error, 0 violações.
- `@typescript-eslint/no-misused-promises`: **warn**, 37 violações legadas em 2026-10-27, todas em componentes cliente de `src/features/operacional/**` e `src/features/empresas/components/map-markers.ts` (handlers `async` passados a `onClick`/`onSubmit`/callbacks). Plano: ao tocar cada arquivo, tratar o erro do handler (ex.: `onClick={() => void salvar()}` com `try/catch` e mensagem ao lado do campo) e rodar `pnpm lint:typed`; promover a `error` quando a contagem chegar a zero. Não usar supressões amplas.
- Custo medido nesta nuvem: ~43 s e ~1,6 GB de pico de memória (o `pnpm lint` rápido leva ~17 s). Por isso fica em comando separado.

## Regras base

- TypeScript estrito; arquivos até 350 linhas.
- Validação com Zod em toda entrada (formulários, Server Actions) e no ambiente (`lib/env*.ts`).
- Logger Pino só no servidor, com redação de segredos; erros públicos sem stack.
- Apresentação não acessa o banco diretamente: páginas chamam `features/*/queries.ts` e `actions.ts`.
- Autorização em duas camadas: `requireMember`/`requireRole` nas ações e RLS no banco.

## Estratégia de testes

- Unidade (Vitest): funções puras e regras de negócio. Não testamos código que só repete a implementação.
- Banco: políticas RLS verificadas com SQL simulando papéis (`set local role authenticated` + `request.jwt.claims`) dentro de transação revertida. Registro em `docs/security.md`.
- Interface: navegação real com Playwright (Chromium pré-instalado) nas páginas públicas; fluxos autenticados dependem de uma conta de teste.
- Ainda não há suíte E2E nem CI; quando houver, use os mesmos comandos de `pnpm check`.
- Runtime: com `pnpm dev` rodando e `agent-browser` instalado, a skill `next-dev-loop` faz o preflight (`/_next/mcp`: `get_compilation_issues`, `get_routes`) e exercita a página. Sem isso, Playwright nas páginas públicas. Bundle: `next-bundle-optimizer` só com pedido, comparando snapshots `next analyze` separados.
- SQL: `supabase-postgres-best-practices` antes de migrations; `EXPLAIN ANALYZE` só em banco descartável ou autorizado.

## Revisão de segurança

- Prompt reutilizável: [`docs/prompts/security-review.md`](prompts/security-review.md) (bloco "Prompt" do toolkit, revisão 790a895). Modo repositório por padrão; modo diff para PRs sensíveis.
- Relatório privado e redigido, fora do repositório; resumo de achados e decisões em `docs/security.md`.
- Rode também os advisors do Supabase (segurança e performance) após cada migration.
- Diffs sensíveis (auth, RLS, Storage, service role): skill `differential-review` com intervalo base..head explícito e relatório fora do repositório. Sem ela, rastreamento manual declarado.

## Avaliação e melhoria do harness

- Avaliar (prompt 14 do toolkit, mesma revisão): depois de mudar instruções, skills, plugins ou orquestração, rode os casos de fumaça em cópias descartáveis de `templates/harness-evaluation/` (fronteira, handoff desatualizado, revisão só leitura) com `scripts/validate-harness.mjs` fora do alcance do agente. Resultados em `docs/setup.md`.
- Melhorar: [`docs/prompts/harness-improvement.md`](prompts/harness-improvement.md) (bloco do prompt 15). Método nativo inspirado no Harness2, sem rodar o framework: com uma falha observada, uma comparação de candidato com os mesmos checks; adote só o que a evidência sustentar. Sem falha concreta, nada muda. CLI oficial e benchmarks pagos exigem autorização à parte.
- Lição registrada em 2026-10-27: nenhum caso falhou; sem mudança de instruções. Revalidar ao trocar de cliente, modelo ou plugins.

## Dependências e entrega

Rode `pnpm audit --prod` e `pnpm audit` antes de releases; registre avisos sem correção compatível. Em 2026-10-27: 1 crítico em `maplibre-gl` (correção só na 6.x, ver `docs/setup.md`). Checks são comandos explícitos: sem git hooks ou bloqueios de push.
