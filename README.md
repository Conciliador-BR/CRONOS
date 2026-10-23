# CRONOS

CRM interno que une missões no estilo Trello, agenda de reuniões, documentação de APIs por adquirente, cursos em vídeo e pipeline comercial com desempenho e insights. Identidade visual preta e azul, interface em português.

## Rodar localmente

```bash
pnpm install
cp .env.example .env.local
pnpm dev   # http://localhost:3000
```

Detalhes de ambiente, primeiro acesso e banco: [docs/onboarding.md](docs/onboarding.md).

## Verificar

```bash
pnpm check   # lint + tipos + testes + build
```

## Mapa dos documentos

| Documento | Conteúdo |
|---|---|
| [PRODUCT.md](PRODUCT.md) | Problema, papéis, escopo, critérios de aceite |
| [TASKS.md](TASKS.md) | Plano de tarefas por épico e responsáveis |
| [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) | Regras para agentes de IA |
| [docs/architecture.md](docs/architecture.md) | Estrutura, fronteiras, modelo de dados, decisões |
| [docs/design.md](docs/design.md) | Tokens visuais, componentes, acessibilidade |
| [docs/onboarding.md](docs/onboarding.md) | Preparação local e primeiro acesso |
| [docs/quality.md](docs/quality.md) | Checks e estratégia de testes |
| [docs/security.md](docs/security.md) | Revisão de segurança, testes de RLS, riscos aceitos |
| [docs/setup.md](docs/setup.md) | Evidências do setup com o vibe-coding-toolkit |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase (Postgres, Auth, Storage) · Zod · dnd-kit · Recharts · Vitest.
