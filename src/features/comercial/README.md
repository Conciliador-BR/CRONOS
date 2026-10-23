# Comercial

Desempenho (dashboard e ranking), CRM (pipeline de leads com arrastar e soltar) e Insights (origens, conversão, motivos de perda). As abas já existem em `src/app/(app)/comercial/layout.tsx`.

**Responsável:** Dev sênior chefe.

## Dados

`leads`, `lead_stage_history` (preenchida por trigger ao mudar `stage`), `sales_goals`, `profiles`, `teams` e a view `seller_performance`. Valores em centavos (`deal_value_cents`).

## Estrutura esperada

```
src/features/comercial/
  components/     UI do módulo (Server Components por padrão; "use client" só onde há interação)
  actions.ts      Server Actions ("use server"): validam com Zod, chamam requireMember/requireRole antes de escrever
  queries.ts      Leituras no servidor (import "server-only"; createClient de @/lib/supabase/server)
  schemas.ts      Schemas Zod compartilhados por formulários e ações
  *.test.ts       Testes Vitest de lógica pura (cálculos, transformações, regras)
```

## Regras

- As páginas em `src/app/(app)/comercial` ficam finas: leem com `queries.ts` e renderizam `components/`.
- Componentes cliente nunca importam `queries.ts`, `@/lib/auth`, `@/lib/supabase/server` ou `@/lib/supabase/admin`.
- Toda Server Action começa com `requireMember()` ou `requireRole([...])` e valida a entrada com Zod antes de tocar no banco. A RLS é a proteção real; a checagem na ação dá mensagem clara e evita trabalho inútil.
- Dinheiro em centavos (`number` inteiro) com `@/lib/format/money`.
- Arquivos até 350 linhas; um escritor por arquivo (ver `TASKS.md`).
