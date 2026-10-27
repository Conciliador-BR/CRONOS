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
- Lint: `pnpm lint` (presets do Next + regras locais `eslint-rules/`: 350 linhas, sem `console`, sem cliente Supabase de servidor em `.tsx`/`src/components`)
- Lint tipado (promises): `pnpm lint:typed`
- Self-check das regras locais: `pnpm lint:rules`
- Tipos: `pnpm typecheck`
- Testes: `pnpm test`
- Build: `pnpm build`
- Verificar tudo: `pnpm check` (não publica, não conecta em produção, não aplica migrations)
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

## Continuidade

- Separe observação, suposição, decisão e evidência. Defina critério de aceite e checks antes de implementar; correção de bug começa reproduzindo e termina com teste de regressão quando viável.
- Um bloqueio para só o que depende dele; continue o resto autorizado. Respeite pausas e limites; não repita tentativa idêntica sem evidência nova.
- Trabalho que atravessa sessões ganha handoff curto no `TASKS.md` (modelo: objetivo, estado verificado, evidência, pendências, bloqueios, próxima ação). Ao retomar, confira arquivos, Git e checks antes de confiar no handoff.
- Quando uma regra recorrente falhar, corrija a causa no teste, na regra de lint ou no documento responsável, não repita a instrução em outro arquivo.

## Ferramentas (detalhes e estado em `docs/setup.md`)

- Plugins do projeto (`.claude/settings.json`): Superpowers (processo proporcional ao escopo), Ponytail (padrão `full`) (menor mudança completa), Caveman (conversa concisa em português; código, docs e commits em texto normal), Context7 (docs atuais: resolva a biblioteca e consulte um conceito por vez; nunca envie segredos ou código privado; sem Context7, use `node_modules/next/dist/docs` e fontes oficiais).
- RTK: com hook nativo ativo, use comandos normais (sem duplo prefixo); `rtk proxy <cmd>` para saída completa.
- Graphify: `graphify-out/graph.json` local (só código, sem LLM). Confirme no código o que o grafo sugerir; registre se estiver desatualizado.
- Modelos: preserve o cliente, o modelo principal e a autenticação. Subagentes usam o modelo mais leve capaz de cumprir os critérios (busca e inventário leves; segurança, RLS, migrations e revisão crítica com mais capacidade).

## Skills do projeto (`.claude/skills/`, lock em `skills-lock.json`)

- `vercel-react-best-practices`, `vercel-composition-patterns`: ao escrever ou revisar React/Next.
- `web-design-guidelines`: revisão de interface e acessibilidade. `writing-guidelines`: revisão de documentação.
- `supabase-postgres-best-practices`: antes de schema, SQL, RLS ou migrations.
- `next-dev-loop`: conferir no `pnpm dev` (rotas, erros, navegador) depois de mudar páginas; exige `agent-browser` no PATH. `next-bundle-optimizer`: auditoria de bundle só com pedido.
- `differential-review`: diffs sensíveis (auth, RLS, Storage, service role). Revisão de base: `docs/prompts/security-review.md`.
- `vercel-react-view-transitions`: só quando pedirem animações. `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize`: só com pedido explícito de publicação/otimização na Vercel.
- `find-skills`: quando faltar uma capacidade concreta. Skill instalada não autoriza publicar, migrar ou adicionar dependência.

## Delegação

- Um escritor por arquivo; revisores só leem. O coordenador cuida de `package.json`, lockfile, migrations e integração.
- Cada tarefa delegada recebe objetivo, arquivos permitidos, critérios de aceite e checks.
- O coordenador confere o diff e roda os checks antes de aceitar o resultado. Revisão independente para mudanças não triviais, com escopo pelo risco.
- Sem push blockers, hooks de Git ou exigência de branch/worktree.
