# Setup e evidências

## Origem e contexto

- Data: 2026-10-23. Toolkit: `soumatheusgomes/vibe-coding-toolkit` revisão `790a895304e0c08b70a5b215c9d334f1c86b816c` (clonada em diretório temporário fora do projeto).
- Pedido: executar o bloco "Prompt" do `docs/prompts/12-existing-project-setup.md` começando pelo brainstorming. O repositório estava **vazio**; o próprio prompt 12 direciona projetos novos ao prompt 11, então a fundação seguiu o prompt 11 e a cobertura/registro seguiu o 12.
- Cliente: Claude Code em ambiente de nuvem (Linux, Node 22.22, pnpm 10.28). Modelo principal preservado; subagentes herdaram o modelo da sessão (o host não expôs seleção de modelo mais leve). Delegação autorizada explicitamente pelo usuário.
- Brainstorming: feito pelo coordenador sem a skill Superpowers (não instalada no host), seguindo o protocolo de entendimento → decisões reversíveis registradas em `PRODUCT.md` → plano em `TASKS.md`.

## Decisões e fontes

| Decisão | Motivo | Fonte |
|---|---|---|
| Next.js 16.4.3 estável via `create-next-app@16.4.3` | Padrão do toolkit; canal estável no registry em 2026-10-23 | npm registry, docs em `node_modules/next/dist/docs` |
| Supabase (supabase-js + SQL) em vez de Drizzle | Produto precisa de Auth por funcionário, Storage e RLS; pedido explícito do usuário | `PRODUCT.md`, `docs/architecture.md` |
| `cacheComponents` desligado | Quase toda página lê cookies de sessão | `docs/architecture.md` |
| `proxy.ts` (antigo middleware) para renovar sessão | Convenção do Next 16 | `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` |
| Dinheiro em centavos | Evita erro de ponto flutuante | `src/lib/format/money.ts` |
| Admin inicial por allowlist privada | Repositório público tornava "primeiro usuário vira admin" explorável | `docs/security.md` S-05 |
| ESLint: presets oficiais do Next; regras locais do toolkit (`eslint-rules/`) não copiadas nesta entrega | Escopo priorizou produto; adoção gradual pendente | `docs/quality.md` |

## Componentes (matriz de cobertura)

| Componente | Ação e motivo | Escopo | Estado e evidência |
|---|---|---|---|
| Next.js foundation | Instalado (prompt 11) | Projeto | Validado: `pnpm build` ok |
| Zod, server-only, Pino, clsx/tailwind-merge, Vitest | Instalados | Projeto | Validado: 177 testes passando |
| Drizzle ORM + pg | Inaplicável: Supabase escolhido | — | Registrado em `PRODUCT.md` |
| `vercel-react-best-practices`, `vercel-composition-patterns`, `web-design-guidelines`, `writing-guidelines` | Instalados (`npx skills add vercel-labs/agent-skills`) | Projeto `.claude/skills` + `skills-lock.json` | Instalado e usado pelos agentes; descoberta em sessão nova não observada |
| `find-skills` | Instalado (`vercel-labs/skills`) | Projeto | Instalado |
| `vercel-react-view-transitions`, `vercel-optimize`, `deploy-to-vercel`, `vercel-cli-with-tokens` | Não instalados: sem hospedagem Vercel definida nem pedido de transições | — | Pendente de decisão de hospedagem |
| `supabase-postgres-best-practices` | Instalado | Projeto | Usado na revisão de RLS |
| `next-dev-loop`, `next-bundle-optimizer` | Não instalados: exigem agent-browser/analyzer; validação feita com Playwright direto | — | Pendente |
| `gh-fix-ci` | Inaplicável: sem GitHub Actions ainda | — | — |
| `differential-review` | Não instalado; revisão manual registrada | — | Fallback explícito em `docs/quality.md` |
| shadcn/ui | Inaplicável: UI kit próprio em `src/components/ui` | — | — |
| Sentry MCP | Inaplicável: sem serviço escolhido | — | — |
| Superpowers, Ponytail, Caveman, RTK, Graphify, Context7 | Não disponíveis neste host de nuvem; sem instalação global autorizada | Máquina | Pendente de preparação da máquina (`docs/03-environment-setup.md` do toolkit) |
| Chrome DevTools MCP / agent-browser | Substituídos por Playwright + Chromium pré-instalados | Host | Validado nas páginas públicas |
| Memória | `AGENTS.md`/`CLAUDE.md` + memória do projeto no host | Projeto | Carregamento em sessão limpa não observado |
| Revisão de segurança reutilizável | Copiado o bloco Prompt para `docs/prompts/security-review.md` | Projeto | Usado nas fases 1 e 2 |
| Harness2 (método nativo) | Adotado como procedimento em `docs/quality.md` | Projeto | Sem falha observada que justificasse comparação |

## Banco de dados (Supabase `cronos`, ref `cnwflsucwedbmfltbeht`, sa-east-1, plano free)

Migrations aplicadas pelo MCP do Supabase (a versão remota é o horário da aplicação, não o nome local):

1. `20261023180000_init_schema.sql`: 26 tabelas, enums, view `seller_performance`, RLS, 5 buckets.
2. `20261023181000_cronos_needs_setup.sql`: RPC do primeiro acesso.
3. `20261023190000_operacional_course_covers.sql`: bucket `course-covers`.
4. `20261023200000_security_hardening.sql`: privilégios, trigger de leads, políticas de eventos.
5. `20261023201000_owner_bootstrap.sql`: admin inicial por allowlist privada.

## Checks

| Item | Estado | Evidência |
|---|---|---|
| `pnpm check` (lint, typecheck, test, build) | Validado | Saída 0; 29 arquivos / 177 testes |
| `pnpm audit --prod` | Validado | Nenhuma vulnerabilidade conhecida |
| RLS e storage | Validado | 111 checagens em transações revertidas (`docs/security.md`) |
| Advisors do Supabase | Validado | Só os avisos aceitos R-01/R-02 |
| Páginas públicas no navegador (`/`, `/login`, `/primeiro-acesso`) | Validado parcialmente | Playwright desktop 1440 e mobile 390: sem erros de console, sem rolagem horizontal; cabeçalhos `X-Frame-Options`/CSP presentes |
| Login real e páginas autenticadas | **Não validado** | A rede deste ambiente bloqueia `*.supabase.co` (proxy 403); criar conta de teste no banco não foi autorizado. Validar após o primeiro acesso do dono |

## Pendências e próxima entrega

- Primeiro acesso do dono e configuração do Supabase Auth (ver `docs/security.md`): desligar cadastro público depois, adicionar `<site>/auth/callback` às Redirect URLs.
- `SUPABASE_SERVICE_ROLE_KEY` no ambiente para criar logins.
- Hospedagem (ex.: Vercel) e CI com `pnpm check`.
- Logos das adquirentes; detalhamento da página Marketing; integração Google Drive (OAuth).
- Adoção gradual das regras ESLint do toolkit e lint tipado.
