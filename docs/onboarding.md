# Preparação local

## Pré-requisitos

- Node.js 22 (testado com 22.22) e pnpm 10 (`packageManager` em `package.json`).
- Acesso ao projeto Supabase `cronos` (ref `ctrnutyicmuhnehauqcb`) para obter chaves.

## Primeira execução

```bash
pnpm install
cp .env.example .env.local   # URL e publishable key já vêm preenchidas
pnpm dev                     # http://localhost:3000
```

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

`pnpm check` roda lint, tipos, testes e build. Testes unitários não precisam de credenciais; o build precisa só das variáveis públicas.

## Agentes

Leia [AGENTS.md](../AGENTS.md). [CLAUDE.md](../CLAUDE.md) importa as mesmas instruções. Skills locais e integrações em [setup.md](setup.md).
