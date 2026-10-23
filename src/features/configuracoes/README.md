# Configurações

Cadastros administrativos (`/configuracoes/*`, só admin/gestor): empresas e clientes, funcionários (com criação de login) e times.

**Responsável:** Dev Empresas & Configurações.

## Dados

`companies`, `company_ec_numbers`, `company_bank_accounts`, `company_documents`, `clients`, `profiles`, `teams`, `sales_goals`; buckets `company-docs` e `avatars`. Criar login de funcionário usa `createAdminClient()` (service role) **somente** dentro de ação que já chamou `requireRole(["admin"])`.

## Estrutura esperada

```
src/features/configuracoes/
  components/     UI do módulo (Server Components por padrão; "use client" só onde há interação)
  actions.ts      Server Actions ("use server"): validam com Zod, chamam requireMember/requireRole antes de escrever
  queries.ts      Leituras no servidor (import "server-only"; createClient de @/lib/supabase/server)
  schemas.ts      Schemas Zod compartilhados por formulários e ações
  *.test.ts       Testes Vitest de lógica pura (cálculos, transformações, regras)
```

## Regras

- As páginas em `src/app/(app)/configuracoes` ficam finas: leem com `queries.ts` e renderizam `components/`.
- Componentes cliente nunca importam `queries.ts`, `@/lib/auth`, `@/lib/supabase/server` ou `@/lib/supabase/admin`.
- Toda Server Action começa com `requireMember()` ou `requireRole([...])` e valida a entrada com Zod antes de tocar no banco. A RLS é a proteção real; a checagem na ação dá mensagem clara e evita trabalho inútil.
- Dinheiro em centavos (`number` inteiro) com `@/lib/format/money`.
- Arquivos até 350 linhas; um escritor por arquivo (ver `TASKS.md`).
