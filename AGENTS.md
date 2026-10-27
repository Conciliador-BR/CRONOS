<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CRONOS

CRM interno (pt-BR) que une missões estilo Trello, agenda, documentação de APIs, cursos e pipeline comercial. Identidade preto e azul.

## Produto e stack

- Escopo: `PRODUCT.md`. Plano e responsáveis: `TASKS.md`.
- Stack: Next.js 16.4 (App Router, `src/`, `@/*`), React 19, TypeScript estrito, Tailwind 4, Supabase (Postgres, Auth, Storage) via `@supabase/ssr`, Zod 4, Pino, Vitest, `@dnd-kit`, `recharts`. Node 22, pnpm 10.
- Estrutura e decisões: `docs/architecture.md`. Interface: `docs/design.md`. Evidências do setup: `docs/setup.md`.

## Comandos

- Instalar: `pnpm install`
- Desenvolver: `pnpm dev`
- Lint: `pnpm lint`
- Tipos: `pnpm typecheck`
- Testes: `pnpm test`
- Build: `pnpm build`
- Verificar tudo: `pnpm check`
- Tipos do banco: regenerar `src/lib/supabase/database.types.ts` (Supabase MCP `generate_typescript_types` ou `supabase gen types`) após cada migration.

## Regras do projeto

- Leia o código e as instruções relevantes antes de editar. Faça a menor mudança completa e reutilize componentes de `src/components/ui`.
- Páginas em `src/app` são finas; lógica fica em `src/features/<módulo>/` (`queries.ts` server-only, `actions.ts` com `"use server"`, `schemas.ts` Zod, `components/`).
- Toda escrita passa por Server Action com validação Zod e `requireMember`/`requireRole` de `@/lib/auth`. RLS no banco é a barreira final; nunca a desative.
- `createAdminClient` (service role) só em ações de admin, depois de `requireRole(["admin"])`. Nada secreto em `NEXT_PUBLIC_*`.
- Dinheiro em centavos (`lib/format/money.ts`). Datas em `timestamptz`.
- Schema muda só por nova migration em `supabase/migrations/` (aditiva, revisada), aplicada no projeto `cronos` (`ctrnutyicmuhnehauqcb`). Não reescreva migrations aplicadas.
- Arquivos até 350 linhas. Interface em português, acessível (teclado, foco visível, contraste, erros ao lado do campo).
- Atualize o documento responsável junto com a mudança (produto, arquitetura, design, qualidade, setup).
- Publicar, enviar mensagens a terceiros, gerar custo ou ação destrutiva exigem autorização.

## Skills do projeto (`.claude/skills/`)

- `vercel-react-best-practices`, `vercel-composition-patterns`: ao escrever ou revisar React/Next.
- `web-design-guidelines`: revisão de interface e acessibilidade.
- `writing-guidelines`: revisão de documentação.
- `supabase-postgres-best-practices`: antes de schema, SQL, RLS ou migrations.
- `find-skills`: quando faltar uma capacidade concreta.
- Revisão de segurança: `docs/quality.md` descreve o prompt reutilizável.

## Delegação

- Um escritor por arquivo; revisores só leem. O coordenador cuida de `package.json`, lockfile, migrations e integração.
- Cada tarefa delegada recebe objetivo, arquivos permitidos, critérios de aceite e checks.
