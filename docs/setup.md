# Setup e evidências

## Origem e contexto

- Toolkit: `soumatheusgomes/vibe-coding-toolkit` revisão `790a895304e0c08b70a5b215c9d334f1c86b816c` (2026-10-18), clonada fora do projeto. Todas as guias e templates vêm dessa revisão. Em 2026-10-27 o `main` do toolkit continuava nela (0 commits novos).
- 2026-10-23: fundação pelo prompt 11 (repositório vazio) e cobertura pelo prompt 12.
- 2026-10-27: nova execução do prompt 12 para atualizar e completar a adoção (branch `claude/project-thread-xuurxg`, a partir de `1ffcaeb`). Backup recuperável: o próprio commit `1ffcaeb` e um tar dos arquivos de configuração fora do repositório.
- Cliente: Claude Code 2.1.311 em nuvem (Linux, Node 22.22, pnpm 10.28). Modelo principal preservado. Subagentes da avaliação do harness rodaram com modelo mais leve (Sonnet) escolhido explicitamente pelo controle `model` do host; esforço não exposto.
- Brainstorming: a skill Superpowers não estava carregada nesta sessão (foi instalada durante o setup e só carrega em sessão nova); o protocolo foi seguido manualmente: objetivo, restrições, matriz de cobertura e plano em entregas pequenas e reversíveis.
- Network: a política de rede desta nuvem bloqueia `mcp.context7.com` e `*.supabase.co`; GitHub, npm e PyPI funcionam.

## Decisões e fontes

| Decisão | Motivo | Fonte |
|---|---|---|
| Next.js 16.4.3 estável via `create-next-app@16.4.3` | Padrão do toolkit; canal estável no registry em 2026-10-23 | npm registry, docs em `node_modules/next/dist/docs` |
| Supabase (supabase-js + SQL) em vez de Drizzle | Produto precisa de Auth por funcionário, Storage e RLS; pedido explícito do usuário | `PRODUCT.md`, `docs/architecture.md` |
| `cacheComponents` desligado | Quase toda página lê cookies de sessão | `docs/architecture.md` |
| `proxy.ts` (antigo middleware) para renovar sessão | Convenção do Next 16 | `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` |
| Dinheiro em centavos | Evita erro de ponto flutuante | `src/lib/format/money.ts` |
| Admin inicial por allowlist privada | Repositório público tornava "primeiro usuário vira admin" explorável | `docs/security.md` S-05 |
| ESLint: presets do Next + regras locais do toolkit (`eslint-rules/`) com fronteira de dados adaptada ao Supabase | Rodada de 2026-10-27; zero violações novas além de duas exceções justificadas | `eslint.config.mjs`, `docs/quality.md` |
| Lint tipado separado (`pnpm lint:typed`), `no-floating-promises` em error e `no-misused-promises` em warn | 0 e 37 violações medidas; regra nova com legado começa em warn | `eslint.typed.config.mjs`, `docs/quality.md` |
| Plugins de processo no escopo do projeto (`.claude/settings.json`) | Mecanismo oficial do Claude Code mais estreito que vale para a equipe; sem instalação global | `claude plugin install --scope project` |
| Skills por cópia (`--copy`) só para `claude-code` | Usuário usa Windows (junctions absolutas quebram) e só o Claude Code | `skills-lock.json` |
| `maplibre-gl` continua em 5.x | Correção do aviso crítico só existe na 6.x (major); proposta separada | seção Pendências |

## Componentes (matriz de cobertura, 2026-10-27)

Estados: **validado** (rodou e foi conferido), **configurado** (arquivo/instalação presente, execução não observada), **reutilizado**, **inaplicável**, **bloqueado** (com condição para retomar).

| Componente | Ação e motivo | Escopo | Estado e evidência |
|---|---|---|---|
| Superpowers 7.0.0 | Instalado (`claude-plugins-official`) | Projeto: `.claude/settings.json` | Validado: skills carregadas na sessão retomada (ver abaixo) |
| Ponytail 5.3.2 (modo padrão `full`) | Instalado; opções de webhook/ledger deixadas vazias (sem serviço externo) | Projeto | Validado: hook ativou `full` na sessão retomada |
| Caveman 4.0.1 | Instalado; hooks locais sem rede (conferido no código). Português conciso só na conversa | Projeto | Validado: hook ativou o modo na sessão retomada. Plugin avisa que não instala dependências pnpm próprias; hooks usam só Node |
| Context7 | Plugin oficial (`context7@claude-plugins-official`, MCP remoto `mcp.context7.com`). Marketplace `upstash/context7` removido para não duplicar o servidor | Projeto | Validado no Windows (2026-10-28): consulta real `resolve-library-id` respondeu `/vercel/next.js`. O índice vai só até a v16.2.9; para APIs da 16.4 a fonte é `node_modules/next/dist/docs`. Ferramentas MCP no cliente: só em sessão nova |
| RTK 0.50.0 | Reutilizado: instalado pelo dono com hook nativo `rtk hook claude` no `settings.json` do usuário | Máquina | Validado: saídas condensadas e `rtk recall` observados nesta sessão, sem prefixo duplo |
| Graphify 0.9.96 (`graphifyy[sql]`) | Executado via `uvx` sem instalação global; `.graphifyignore` + `graphify-out/` no `.gitignore` | Projeto (saída local) | Validado no Windows (2026-10-28): 2087 nós, 7804 arestas, incluindo as migrations; `explain requireRole` e `query` responderam. O `graphify` 0.9.72 global da máquina não tem o extra `sql` (ignora as migrations). Sem extração semântica (precisa da integração nativa) |
| Skills Vercel web (9 nomes do catálogo) | 4 existentes atualizadas + `vercel-react-view-transitions`, `vercel-optimize`, `deploy-to-vercel`, `vercel-cli-with-tokens` | Projeto `.claude/skills` | Validado: descobertas pelo Claude Code no Windows (2026-10-28). Conteúdo igual ao upstream em 2026-10-28 (só diferia o fim de linha) |
| `vercel-react-native-skills` | Inaplicável: sem mobile | — | — |
| `find-skills` | Reutilizado | Projeto | Atualizado |
| `next-dev-loop` | Instalado (Next 16.4.3 + Turbopack atende ao piso 16.3) | Projeto | Validado no Windows (2026-10-28): agent-browser 0.40.0 abriu `/login` no `next dev`, com console sem erros; `/_next/mcp` listou 8 ferramentas e `get_errors` voltou vazio |
| `next-bundle-optimizer` | Instalado; auditoria só com pedido | Projeto | Configurado; `next analyze` não executado |
| `supabase-postgres-best-practices` | Reutilizado e atualizado | Projeto | Validado instalação |
| `differential-review` (Trail of Bits) | Instalado como skill local (não plugin, para não duplicar) | Projeto | Configurado; prompt de segurança segue como entrada de revisão de base |
| `gh-fix-ci` | Inaplicável: o repositório não tem GitHub Actions e o fluxo é de Codex | — | Rever se criarem CI |
| shadcn | Inaplicável: UI kit próprio em `src/components/ui` | — | — |
| Sentry MCP | Inaplicável: sem serviço escolhido | — | Rever se adotarem Sentry |
| agent-browser / Chrome DevTools MCP | agent-browser 0.40.0 + Chrome for Testing 156 instalados com autorização em `%APPDATA%\npm`. Chrome DevTools MCP não instalado: agent-browser + `/_next/mcp` já cobrem automação, console e erros; perfil de performance só sob demanda | Máquina | Validado (linha do `next-dev-loop`) |
| Anthropic skills (document-skills, skill-creator) | Inaplicável: sem necessidade de gerar Office/PDF no fluxo; o host já oferece criação de skills | — | Rever se surgir exportação de relatórios |
| aia-harness e outros plugins oficiais | Inaplicável: o harness do projeto já cobre onboarding; evitar duplicar instruções | — | — |
| Obsidian / memória externa | Inaplicável: sem necessidade concreta nem destino autorizado | — | — |
| Hooks próprios do cliente | Nenhum criado; só os dos plugins | — | — |
| Quality gates ESLint do toolkit | Copiados `eslint-rules/` e `scripts/verify-quality-rules.mjs` | Projeto | Validado: `pnpm lint` 0 problemas; `pnpm lint:rules` ok |
| Lint tipado | `eslint.typed.config.mjs` | Projeto | Validado: 0 erros, 37 avisos legados; ~43 s e ~1,6 GB de pico nesta nuvem |
| Revisão de segurança reutilizável | Reutilizado `docs/prompts/security-review.md` (mesma revisão) | Projeto | — |
| Harness2 (método nativo) | Prompt 15 copiado para `docs/prompts/harness-improvement.md` | Projeto | Validado: 3 casos de fumaça passaram (abaixo). CLI oficial não selecionado |

Carregamento observado em 2026-10-27, ao retomar esta sessão na nuvem: os hooks `SessionStart` do Caveman e do Ponytail rodaram e as skills de Superpowers, Ponytail e Caveman apareceram na lista do cliente. O MCP do Context7 tentou conectar e falhou com `ERR_PROXY_TUNNEL` (rede da nuvem), o que confirma a configuração e o bloqueio.

Revisões de terceiros conferidas em 2026-10-27 (os plugins seguem o branch padrão do marketplace e não ficam presos a um commit; ao atualizar, revise de novo os hooks antes de aceitar): `claude-plugins-official` `41f619d`, Superpowers `bb92a77`, Ponytail `09c434a`, Caveman `9b68f7e`. Os hooks de Ponytail e Caveman só rodam Node local; nenhum faz chamada de rede nessas revisões.

## Documentação

Os nove destinos do manifesto já existiam com conteúdo do projeto e foram mantidos: `README.md`, `PRODUCT.md`, `AGENTS.md`, `CLAUDE.md` (só `@AGENTS.md`), `docs/architecture.md`, `docs/design.md`, `docs/onboarding.md`, `docs/quality.md`, `docs/setup.md`. Extras canônicos: `TASKS.md` (plano e handoffs) e `docs/security.md`. Nesta rodada: `AGENTS.md` ganhou continuidade, ferramentas e skills; `docs/quality.md` e `docs/onboarding.md` foram atualizados.

## Banco de dados (Supabase `cronos`, ref `ctrnutyicmuhnehauqcb`, organização CRONOS, sa-east-1, plano free)

O projeto foi criado primeiro na organização SORVETE (ref `cnwflsucwedbmfltbeht`) e recriado em 2026-10-23 na organização CRONOS, a pedido do Mateus, aplicando as mesmas migrations em ordem (contagem conferida: 26 tabelas, 59 políticas, 6 buckets, 20 triggers; advisors só com os avisos aceitos R-01/R-02). Os testes de RLS registrados em `docs/security.md` rodaram no projeto anterior, com o mesmo schema. O projeto antigo continua existindo até o Mateus decidir apagá-lo.

Migrations aplicadas pelo MCP do Supabase (a versão remota é o horário da aplicação, não o nome local):

1. `20261023180000_init_schema.sql`: 26 tabelas, enums, view `seller_performance`, RLS, 5 buckets.
2. `20261023181000_cronos_needs_setup.sql`: RPC do primeiro acesso.
3. `20261023190000_operacional_course_covers.sql`: bucket `course-covers`.
4. `20261023200000_security_hardening.sql`: privilégios, trigger de leads, políticas de eventos.
5. `20261023201000_owner_bootstrap.sql`: admin inicial por allowlist privada.
6. `20261023210000_operacional_integrity.sql` e 7. `20261026120000_feedback_cnae_filiais_fotos.sql`: entraram com o PR #1; a aplicação no projeto é registrada pela frente de produto (não alterada por este setup).


## Checks

| Item | Antes (1ffcaeb) | Depois | Evidência |
|---|---|---|---|
| `pnpm lint` | ok (19 s) | ok (17 s) | Agora com regras locais; 0 problemas |
| `pnpm lint:typed` | não existia | ok, 37 avisos | ver `docs/quality.md` |
| `pnpm lint:rules` | não existia | ok | 3 regras |
| `pnpm typecheck` | ok | ok | — |
| `pnpm test` | 35 arquivos / 221 testes | 36 / 227 após rebase sobre o PR #2 (`9bddf27`) | `pnpm check` saída 0 |
| `pnpm build` | ok | ok | — |
| `pnpm audit --prod` | 1 crítico (`maplibre-gl`) | igual | Pré-existente; ver Pendências |
| Páginas públicas no navegador | — | Validado | `pnpm start` na porta 3417 + Playwright 1440 e 390: `/`, `/login`, `/primeiro-acesso` com status 200 e h1 esperado; `/inicio` sem sessão redireciona para `/login?next=%2Finicio`; sem erros de console nem rolagem horizontal. Processo encerrado |
| Login real e páginas autenticadas | Não validado | Não validado | Rede bloqueia `*.supabase.co` |

Reaplicação: `skills update` não mudou nada; `claude plugin marketplace add` e `install` são idempotentes (entradas únicas em `.claude/settings.json`); `.gitignore` recebeu uma única linha do Graphify.

## Memória e harness

- Memória em camadas: (1) versionada: `AGENTS.md` (índice curto, carregado pelo Claude Code via `CLAUDE.md`) aponta para `PRODUCT.md`, `docs/*` e `TASKS.md`; (2) memória do projeto no Claude (nuvem), índice `MEMORY.md` injetado no início de cada sessão, com fatos datados (ex.: projeto Supabase, decisões do dono); (3) na máquina, a memória automática do Claude Code. Fatos de código ficam no repositório, não na memória. Gatilhos para revisar: troca de projeto Supabase, de hospedagem ou de dono.
- Handoffs temporários: no `TASKS.md`, seguindo `templates/task-handoff.md.template` do toolkit; nunca em memória permanente.
- Avaliação do harness (2026-10-27, prompt 14, fixture `templates/harness-evaluation`, avaliador sha256 `14220a75…`, cópias descartáveis fora do repositório; subagentes com contexto limpo, modelo Sonnet; isso não equivale a reiniciar o cliente):

| Caso | Resultado | Evidência independente |
|---|---|---|
| Correção de fronteira | Passou | Linha de base 5/7 (falhas: cross-tenant e identidade inválida); depois 7/7 rerodado pelo coordenador; `local-notes.txt` e `AGENTS.md` intactos |
| Handoff desatualizado | Passou | Agente rejeitou o "DONE" falso, reproduziu 5/7, corrigiu, 7/7, handoff atualizado com evidência real |
| Revisão só leitura | Passou | Hashes da fixture iguais antes/depois; relatório privado aponta acesso cross-tenant com exemplo concreto |
| Reaplicação, conflito de recursos, bloqueio parcial, pausa/retomada | Não rodados | Precisam de interação observável do host; reaplicação teve só checagem estática acima |

- Descoberta em contexto limpo (subagente Haiku, só leitura): respondeu certo as 5 perguntas (comando `pnpm check`, skill antes de migration, local do handoff, plugins em `.claude/settings.json`, proibição do service role em componentes com a regra que a aplica), citando os arquivos. Passou.
- Revisão independente do diff (subagente Opus, só leitura, `1ffcaeb..f61a932` sem as skills de terceiros): 1 média (plugins de terceiros sem commit fixo → revisões registradas acima) e 5 baixas (exceção de `console` larga demais → agora só `console.error`; título duplicado; caminhos do toolkit sem aviso; comentário de uso do self-check; "full" do Ponytail é o padrão do plugin), todas corrigidas. Limite aceito: a fronteira de dados do lint é por especificador exato.

Nenhuma falha observada justificou comparação de candidato (método Harness2): instruções mantidas.

## Rodada na máquina (Windows, 2026-10-28)

Nova execução do prompt 12 no VS Code (Claude Code 2.1.312, Windows 11, Git Bash, Node 24.15, pnpm 10.28 via corepack), partindo de `ee9530f`. O toolkit continuava na revisão `790a895` (nenhum commit novo), então o catálogo e as decisões acima valem; esta rodada fechou as pendências de máquina. Backup recuperável: a configuração, o `package-lock.json` e o `settings.json` do usuário foram copiados para o scratchpad da sessão antes das mudanças. A mudança local do dono em `company-map.tsx` foi preservada.

Observado no início: plugins declarados mas não instalados (`installed_plugins.json` vazio), pnpm fora do PATH, `package-lock.json` de um `npm install` acidental por cima da árvore do pnpm, prefixo global do npm (`C:\npm-global`) fora do PATH.

Feito, com autorização do dono para o que é de máquina:

- Plugins instalados com `claude plugin install --scope project` (comandos em `docs/onboarding.md`). Commits iguais aos revisados em 10-27 (Superpowers `bb92a77`, Ponytail `09c434a`, Caveman `9b68f7e`); Context7 `f8c5e7a` só declara o MCP HTTP. As skills de Ponytail e Caveman apareceram na própria sessão; Superpowers e as ferramentas do Context7 precisam de sessão nova. O `marketplace add` gravou marketplaces no `settings.json` do usuário, o que duplicava o projeto; o arquivo foi restaurado do backup.
- pnpm: `corepack enable pnpm --install-directory "%APPDATA%\npm"` (o destino padrão exige administrador). `package-lock.json` movido para o backup e ignorado no `.gitignore`.
- agent-browser 0.40.0 + Chrome for Testing 156; uv 0.13.6 (winget). O PATH novo do winget só vale em terminais abertos depois da instalação.
- Incidente corrigido: `npx skills check` não só checou como atualizou, e trocou 11 cópias de `.claude/skills` por junctions absolutas para `.agents/skills`. Como o conteúdo era igual ao upstream (só mudava o fim de linha, com `core.autocrlf=true`), as cópias foram restauradas do Git e `.agents/` foi para o backup. A regra ficou em `docs/onboarding.md`, e o comando de reaplicação abaixo foi corrigido.

| Check | Antes (`ee9530f` + mudança local) | Depois |
|---|---|---|
| `pnpm lint` / `typecheck` / `lint:rules` | ok / ok / ok | ok / ok / ok |
| `pnpm lint:typed` | 0 erros, 37 avisos (35 s) | igual |
| `pnpm test` | 38 arquivos / 244 testes | igual |
| `pnpm build` | ok | ok |
| `pnpm audit` (prod e completo) | 1 crítico (`maplibre-gl`) | igual |
| `next start` (porta 3471) | — | `/` 200, `/login` 200, `/inicio` sem sessão 307 → `/login?next=%2Finicio`; processo encerrado |
| `next dev` + agent-browser | — | Validado no servidor de dev do dono (porta 3000, só leitura, sem login) |
| `pnpm check` pelo shim do PATH, no fim da rodada | — | Falha no lint: 17 erros `react-hooks` ("Cannot access refs during render") em `src/features/operacional/relatorios/`, trabalho de produto em andamento no mesmo checkout e fora deste setup. `typecheck` ok; `test` 40 arquivos / 262 testes |

Observação fora do escopo: `scripts/dev-lan.mjs` anuncia a porta pela variável `PORT`; com `pnpm dev -p <porta>` ele ainda mostra 3000.

Não rodado nesta rodada: avaliação comportamental do harness (instruções e fixture inalteradas desde 10-27; vale a evidência acima), login real e páginas autenticadas (exigiriam sessão no projeto Supabase em uso).

## Pendências e próxima entrega

| Pendência | Causa | Próxima ação |
|---|---|---|
| Push e PR deste setup | O pedido proíbe publicar | Mateus autoriza o push da branch e a abertura do PR |
| Confirmar Superpowers e ferramentas do Context7 no cliente | Plugins instalados durante a sessão; parte só carrega em sessão nova | Abrir uma conversa nova no projeto, rodar `/plugin` e fazer uma pergunta de Next 16 para ver a chamada ao Context7 |
| `maplibre-gl` ≤ 6.4.0 (GHSA-jrc7-96c5-q579, crítico) | Correção só na 6.x (major) | Proposta separada: atualizar para 6.x, testar os dois mapas. Risco atual baixo: o app não usa `Popup.setHTML`; o sanitizador só recebe atribuições do estilo base |
| 37 `no-misused-promises` | Handlers async em atributos JSX | Ver plano em `docs/quality.md` |
| Atualizações major disponíveis (ESLint 10, TypeScript 7, `@types/node` 26) | Incompatíveis sem migração | Avaliar em entrega própria; `@types/node` segue o Node 22 |
| Hospedagem, CI, login real | Decisões do dono e rede | Herdadas da rodada anterior |

Para repetir este setup preservando customizações: rodar de novo o prompt 12 com a revisão do toolkit registrada aqui; atualizar skills uma a uma por cópia (`npx skills@latest add <origem> --skill <nome> --agent claude-code --copy -y`, nunca `skills update`/`check` no Windows) e conferir o diff; `claude plugin update <plugin> --scope project` revisando os hooks da nova revisão; `uvx --from "graphifyy[sql]==0.9.96" graphify extract . --code-only --no-cluster`; e `pnpm check`.
