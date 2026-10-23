# Operacional

Missões (estilo Trello), Agenda (estilo Google Agenda), Documentações de API das adquirentes e Cursos (estilo Hotmart/Hubla). O layout com o botão ≡ já existe em `src/app/(app)/operacional/layout.tsx`.

**Responsável:** Dev Operacional.

## Dados

Missões: `boards`, `board_lists`, `cards`, `labels`, `card_labels`, `card_assignees`, `card_checklist_items`. Agenda: `events`, `event_attendees`. Documentações: `acquirers`, `acquirer_documents`, `acquirer_notes`; buckets `acquirer-docs`, `acquirer-logos`. Cursos: `courses`, `course_modules`, `lessons`, `lesson_progress`; bucket `course-videos`.

Sugestão: subpastas por submódulo (`missoes/`, `agenda/`, `documentacoes/`, `cursos/`), cada uma com a mesma estrutura abaixo.

## Estrutura esperada

```
src/features/operacional/
  components/     UI do módulo (Server Components por padrão; "use client" só onde há interação)
  actions.ts      Server Actions ("use server"): validam com Zod, chamam requireMember/requireRole antes de escrever
  queries.ts      Leituras no servidor (import "server-only"; createClient de @/lib/supabase/server)
  schemas.ts      Schemas Zod compartilhados por formulários e ações
  *.test.ts       Testes Vitest de lógica pura (cálculos, transformações, regras)
```

## Regras

- As páginas em `src/app/(app)/operacional` ficam finas: leem com `queries.ts` e renderizam `components/`.
- Componentes cliente nunca importam `queries.ts`, `@/lib/auth`, `@/lib/supabase/server` ou `@/lib/supabase/admin`.
- Toda Server Action começa com `requireMember()` ou `requireRole([...])` e valida a entrada com Zod antes de tocar no banco. A RLS é a proteção real; a checagem na ação dá mensagem clara e evita trabalho inútil.
- Dinheiro em centavos (`number` inteiro) com `@/lib/format/money`.
- Arquivos até 350 linhas; um escritor por arquivo (ver `TASKS.md`).
