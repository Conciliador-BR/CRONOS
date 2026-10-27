# Início

Página inicial após o login (`/inicio`). Atalhos para os módulos e resumo: empresas cadastradas, leads abertos, próximas reuniões e missões atribuídas ao usuário.

**Responsável:** Dev Empresas & Configurações.

## Dados

Só leitura; reaproveita contagens de `companies`, `leads`, `events`/`event_attendees` e `cards`/`card_assignees`. Prefira chamar consultas dos outros módulos em paralelo (`Promise.all`) em vez de duplicar SQL.

## Estrutura esperada

```
src/features/inicio/
  components/     UI do módulo (Server Components por padrão; "use client" só onde há interação)
  actions.ts      Server Actions ("use server"): validam com Zod, chamam requireMember/requireRole antes de escrever
  queries.ts      Leituras no servidor (import "server-only"; createClient de @/lib/supabase/server)
  schemas.ts      Schemas Zod compartilhados por formulários e ações
  *.test.ts       Testes Vitest de lógica pura (cálculos, transformações, regras)
```

## Regras

- As páginas em `src/app/(app)/inicio` ficam finas: leem com `queries.ts` e renderizam `components/`.
- Componentes cliente nunca importam `queries.ts`, `@/lib/auth`, `@/lib/supabase/server` ou `@/lib/supabase/admin`.
- Toda Server Action começa com `requireMember()` ou `requireRole([...])` e valida a entrada com Zod antes de tocar no banco. A RLS é a proteção real; a checagem na ação dá mensagem clara e evita trabalho inútil.
- Dinheiro em centavos (`number` inteiro) com `@/lib/format/money`.
- Arquivos até 350 linhas; um escritor por arquivo (ver `TASKS.md`).

## Implementado

- Saudação pelo horário de São Paulo, cards de resumo e atalhos (`components/home-view.tsx`).
- Consultas próprias em `queries.ts` (empresas/UFs, leads abertos, reuniões em que sou criador ou convidado, missões abertas atribuídas a mim) para não depender dos módulos em paralelo; se uma parte falhar, o card mostra "indisponível". Pode migrar para as consultas de Comercial/Operacional depois.
