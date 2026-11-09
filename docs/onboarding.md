# Preparação local

## Pré-requisitos

- Node.js 22 (testado com 22.22; `pnpm check` também passa com 24.15 no Windows) e pnpm 10 (`packageManager` em `package.json`).
- Acesso ao projeto Supabase `cronos` (ref `ctrnutyicmuhnehauqcb`) para obter chaves.

## Primeira execução

```bash
pnpm install
cp .env.example .env.local   # URL e publishable key já vêm preenchidas
pnpm dev                     # http://localhost:3000
```

### Abrir em outro aparelho da mesma rede

`pnpm dev` (ou `npm run dev`) imprime antes do Next os endereços da rede local, como `http://192.168.0.15:3000`. Quem estiver no mesmo Wi-Fi abre esse endereço. O `next.config.ts` libera só faixas privadas (`192.168.*.*`, `10.*.*.*`, `172.16-31.*.*`) em `allowedDevOrigins`; isso vale apenas para o `next dev`. O "Network" que o próprio Next mostra pode ser um adaptador virtual; use a lista do CRONOS. Na primeira vez, o Windows pergunta se o Node.js pode usar a rede: permita em **redes privadas** (não marque redes públicas).

Variáveis:

| Variável | Onde obter | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | já no `.env.example` | cliente Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | já no `.env.example` | cliente Supabase (pública por design) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys (secret) | só servidor; criar logins de funcionários |
| `LOG_LEVEL` | opcional | nível do Pino |

Nunca versione `.env.local` nem cole a service role em chats ou issues.

## Primeiro acesso

1. Abra `/primeiro-acesso` e crie sua conta com o e-mail do dono. Só e-mails cadastrados na tabela privada `private.bootstrap_admins` (preenchida direto no banco, fora do repositório) viram admin, e só depois de confirmar o e-mail. Para trocar o dono: `insert into private.bootstrap_admins values ('<email-em-minusculas>');` no SQL Editor.
2. Confirme o e-mail se o Supabase pedir.
3. Em Configurações → Funcionários, crie os logins da equipe (requer a service role).
4. Recomendado: no painel do Supabase, Authentication → Sign In / Providers, desative "Allow new users to sign up". Contas criadas fora do fluxo do admin nascem inativas e não acessam nada, mas desativar evita lixo.

## Banco de dados

- Schema versionado em `supabase/migrations/*.sql`, aplicado no projeto `cronos` via Supabase MCP (`apply_migration`) ou `supabase db push` com o CLI vinculado.
- Mudanças são sempre uma nova migration aditiva, revisada antes de aplicar. Depois, regenere `src/lib/supabase/database.types.ts`.
- Não use o projeto de produção para testes destrutivos.

## Verificar

`pnpm check` roda lint, tipos, lint tipado, self-check das regras, testes e build. Testes unitários não precisam de credenciais; o build precisa só das variáveis públicas.

## Agentes

Leia [AGENTS.md](../AGENTS.md). [CLAUDE.md](../CLAUDE.md) importa as mesmas instruções. Skills locais e integrações em [setup.md](setup.md).

Depois de puxar mudanças, rode `pnpm install` de novo se `package.json` ou `pnpm-lock.yaml` mudaram.

### Na máquina (Windows, uma vez)

As skills vêm no repositório (`.claude/skills`). Os plugins (Superpowers, Ponytail, Caveman, Context7) estão declarados em `.claude/settings.json`, mas só carregam depois de instalados na máquina. Pela extensão do VS Code, que não põe `claude` no PATH, use o binário dela:

```powershell
$claude = (Get-ChildItem "$env:USERPROFILE\.vscode\extensions\anthropic.claude-code-*\resources\native-binary\claude.exe" | Select-Object -Last 1).FullName
& $claude plugin marketplace add DietrichGebert/ponytail
& $claude plugin marketplace add JuliusBrussee/caveman
foreach ($p in 'superpowers@claude-plugins-official','context7@claude-plugins-official','ponytail@ponytail','caveman@caveman') { & $claude plugin install $p --scope project }
```

O `marketplace add` também grava os marketplaces no `settings.json` do usuário. Isso duplica o que o projeto declara; pode remover essa entrada sem afetar a instalação. Confira com `/plugin` e `/skills` numa conversa nova.

Ferramentas de máquina, cada uma com efeito fora do projeto. Nesta máquina, o prefixo global do npm (`C:\npm-global`) não está no PATH, e o `corepack enable` sem destino exige administrador (Node em `Program Files`). Por isso os comandos abaixo usam `%APPDATA%\npm`, que já está no PATH:

| Ferramenta | Comando (PowerShell) | Efeito |
|---|---|---|
| pnpm | `corepack enable pnpm --install-directory "$env:APPDATA\npm"` | Shim que respeita o `packageManager` (pnpm 10.28). Sem ele, use `corepack pnpm <comando>` |
| RTK | `winget install rtk-ai.rtk` e depois `rtk init -g` | Instala o binário e registra o hook no `settings.json` do usuário do Claude Code |
| Graphify | `winget install astral-sh.uv` e `uvx --from "graphifyy[sql]==0.9.96" graphify extract . --code-only --no-cluster` | Sem o extra `sql`, as migrations ficam fora do grafo; saída em `graphify-out/` (ignorado pelo Git) |
| agent-browser | `npm i -g --prefix "$env:APPDATA\npm" agent-browser` e `agent-browser install` | CLI + Chrome for Testing, usado pela skill `next-dev-loop` |

Não rode `graphify install` nem hooks de Git: o projeto não usa atualização automática do grafo.

Não rode `npx skills update` nem `npx skills check` no Windows: os dois trocam as cópias de `.claude/skills` por junctions absolutas para `.agents/skills` (fora do Git). Para atualizar uma skill, reinstale-a por cópia: `npx skills@latest add <origem> --skill <nome> --agent claude-code --copy -y` (origens em `skills-lock.json`), e depois confira o diff.
