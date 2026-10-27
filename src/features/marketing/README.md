# Marketing

Página Marketing (`/marketing`). Entrega inicial: leads de origem marketing (volume por mês, conversão, quentes x frios). Escopo completo a definir.

**Responsável:** Dev Empresas & Configurações.

## Dados

`leads` com `source = 'marketing'`. Reaproveite as consultas de `src/features/comercial/queries.ts` em vez de duplicar.

## Estrutura esperada

```
src/features/marketing/
  components/     UI do módulo (Server Components por padrão; "use client" só onde há interação)
  actions.ts      Server Actions ("use server"): validam com Zod, chamam requireMember/requireRole antes de escrever
  queries.ts      Leituras no servidor (import "server-only"; createClient de @/lib/supabase/server)
  schemas.ts      Schemas Zod compartilhados por formulários e ações
  *.test.ts       Testes Vitest de lógica pura (cálculos, transformações, regras)
```

## Regras

- As páginas em `src/app/(app)/marketing` ficam finas: leem com `queries.ts` e renderizam `components/`.
- Componentes cliente nunca importam `queries.ts`, `@/lib/auth`, `@/lib/supabase/server` ou `@/lib/supabase/admin`.
- Toda Server Action começa com `requireMember()` ou `requireRole([...])` e valida a entrada com Zod antes de tocar no banco. A RLS é a proteção real; a checagem na ação dá mensagem clara e evita trabalho inútil.
- Dinheiro em centavos (`number` inteiro) com `@/lib/format/money`.
- Arquivos até 350 linhas; um escritor por arquivo (ver `TASKS.md`).

## Implementado

- Entrega inicial: total, conversão (fechados ÷ total), faturamento, quentes x frios, leads por mês (6 meses, fuso de São Paulo) e últimos leads. Consulta própria em `queries.ts`; métricas puras testadas em `metrics.test.ts`. Página marcada como "em evolução".
