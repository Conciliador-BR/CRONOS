# Qualidade

## Comandos

| Comando | O que prova |
|---|---|
| `pnpm lint` | ESLint com presets oficiais do Next (core-web-vitals + TypeScript) |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` (rotas tipadas e TypeScript estrito) |
| `pnpm test` | Vitest em Node para regras puras (dinheiro, CNPJ, regras do pipeline, cálculos) |
| `pnpm build` | Build de produção do Next |
| `pnpm check` | Tudo acima, em sequência. Rode antes de abrir PR |

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

## Revisão de segurança

- Prompt reutilizável: [`docs/prompts/security-review.md`](prompts/security-review.md) (bloco "Prompt" do toolkit, revisão 790a895). Modo repositório por padrão; modo diff para PRs sensíveis.
- Relatório privado e redigido, fora do repositório; resumo de achados e decisões em `docs/security.md`.
- Rode também os advisors do Supabase (segurança e performance) após cada migration.
- Skill `differential-review` não está instalada; usamos rastreamento manual como alternativa explícita.

## Melhoria do harness

Método nativo inspirado no Harness2 (toolkit `docs/tools/23-harness2.md`, prompt 15): quando uma instrução falhar de forma observável, compare uma variação descartável contra a atual com os mesmos checks, adote só o que melhorar a evidência e registre em `docs/setup.md`. Sem falha concreta, as instruções atuais ficam como estão.

## Dependências e entrega

Rode `pnpm audit --prod` e `pnpm audit` antes de releases; registre avisos sem correção disponível. Checks são comandos explícitos: sem git hooks ou bloqueios de push.
