# Arquitetura do CRONOS

CRM interno em Next.js 16 (App Router, React 19, TypeScript estrito, Tailwind 4) com Supabase (Auth, Postgres com RLS, Storage) via `@supabase/ssr`. Interface em pt-BR, identidade preto e azul.

## Árvore

```
src/
  proxy.ts                         Renova a sessão em toda requisição e manda anônimos para /login
  app/
    layout.tsx                     Layout raiz (fontes, globals.css)            [Designer]
    page.tsx                       Apresentação pública (/)                      [Designer]
    login/  primeiro-acesso/       Login e criação do admin inicial              [Designer]
    auth/callback  auth/signout    Rotas de sessão (POST /auth/signout)          [Designer]
    (app)/                         Grupo de rotas logadas (não aparece na URL)
      layout.tsx                   requireMember() + <AppShell>
      loading.tsx  error.tsx       Esqueleto e erro amigável (sem stack)
      inicio/                      /inicio
      empresas/                    /empresas
      operacional/
        layout.tsx                 Botão ≡ (canto superior esquerdo) + gaveta de subpáginas
        page.tsx                   redireciona para /operacional/missoes
        missoes/ agenda/ documentacoes/ cursos/
      comercial/
        layout.tsx                 Abas Desempenho | CRM | Insights
        page.tsx                   redireciona para /comercial/desempenho
        desempenho/ crm/ insights/
      marketing/                   /marketing
      configuracoes/
        layout.tsx                 Só admin/gestor (senão /inicio) + abas
        page.tsx                   redireciona para /configuracoes/empresas
        empresas/ funcionarios/ times/
  components/
    ui/                            Biblioteca visual (botões, campos, cards…)   [Designer]
    layout/                        Shell do app                                  [Componentização]
      app-shell.tsx                <AppShell user> : provider + sidebar + topo + <main>
      shell-context.tsx            <ShellProvider>, useShell() {state, actions}
      sidebar.tsx                  Menu lateral (recolhível no desktop, gaveta no celular)
      mobile-menu-button.tsx       Botão que abre a gaveta no celular
      top-bar.tsx                  Nome, papel, iniciais, botão Sair (form POST)
      section-tabs.tsx             <SectionTabs label items> abas por rota
      operacional-menu.tsx         <OperacionalMenu title items> botão ≡ + gaveta
      page-header.tsx              <PageHeader>, <PagePlaceholder>
      drawer-a11y.ts               Esc, trap de Tab, foco ao abrir/fechar
  features/<módulo>/               Lógica de cada módulo (ver README de cada pasta)
    components/  actions.ts  queries.ts  schemas.ts  *.test.ts
  lib/
    auth.ts                        getCurrentProfile, requireMember, requireRole, isManager (server-only)
    nav.ts                         Itens de navegação (fonte única), papéis, isActivePath
    env.ts  public-env.ts          Variáveis de ambiente validadas com Zod
    logger.ts                      Pino (servidor)
    format/                        Dinheiro em centavos, CPF/CNPJ (testados)
    supabase/
      server.ts                    Cliente por requisição (RLS se aplica)
      browser.ts                   Cliente do navegador (publishable key)
      admin.ts                     Service role (server-only; só ações de admin)
      proxy.ts                     Lógica de sessão usada por src/proxy.ts
      database.types.ts            Tipos gerados do banco (não editar à mão)
supabase/migrations/               SQL versionado (schema, RLS, storage, funções)
docs/                              Arquitetura, design, segurança, qualidade
```

## Camadas e fronteiras

```
apresentação (src/app, components/)  ->  features/<módulo>  ->  lib/supabase, lib/auth  ->  Postgres (RLS)
```

- **Páginas finas.** `page.tsx` só chama `features/<módulo>/queries.ts`, passa dados serializáveis para `features/<módulo>/components/` e nada mais.
- **Cliente nunca importa servidor.** Componentes com `"use client"` não importam `@/lib/auth`, `@/lib/supabase/server`, `@/lib/supabase/admin`, `@/lib/env` nem `queries.ts`. Esses módulos têm `import "server-only"` para que o build falhe se isso acontecer. Mutações do cliente passam por Server Actions (`actions.ts`).
- **Service role só em ações de admin.** `createAdminClient()` ignora RLS; só é usado dentro de Server Action que já chamou `requireRole(["admin"])` (ex.: criar login de funcionário).
- **Módulos não se importam em ciclo.** Um módulo pode reaproveitar `queries.ts` de outro (Marketing lê consultas do Comercial; Início lê contagens de vários), nunca `components/` internos.
- **Navegação em um lugar.** Rotas e rótulos do menu, abas e gaveta vêm de `src/lib/nav.ts`.
- **Componentes de layout** seguem composição: o estado do shell fica só no `ShellProvider` (`{ state, actions }`), e os layouts passam listas de links (`NavLink[]`, serializáveis) em vez de flags.

## Autenticação e autorização

1. **Proxy** (`src/proxy.ts` → `lib/supabase/proxy.ts`): em toda requisição renova os cookies de sessão com `getClaims()`. Anônimo em rota não pública vai para `/login?next=…`; logado em `/login` vai para `/inicio`. Públicas: `/`, `/login`, `/primeiro-acesso`, `/auth/*`.
2. **Layout `(app)`**: `requireMember()` lê o perfil (uma consulta por requisição via `React.cache`). Sem perfil → `/login`; inativo → `/login?erro=inativo`.
3. **Configurações**: o layout redireciona quem não é admin/gestor para `/inicio`. É conveniência de navegação, não segurança.
4. **Server Actions**: começam com `requireMember()` ou `requireRole([...])` e validam a entrada com Zod.
5. **RLS é a proteção real.** Toda tabela tem RLS; funções `is_member()`, `is_manager()`, `has_role()` (security definer) checam perfil ativo e papel. Mesmo que uma ação esqueça uma checagem, o banco recusa.
6. **Primeiro acesso**: `cronos_needs_setup()` diz se ainda não há admin ativo; o trigger `handle_new_user` cria o perfil, promove a admin apenas e-mails confirmados que estejam em `private.bootstrap_admins` (migration `20261023201000_owner_bootstrap.sql`; também via trigger `on_auth_user_confirmed`) e deixa inativo qualquer cadastro que não tenha sido convidado por um admin (`cronos_invited` no app metadata). `guard_profile_update` impede funcionário de mudar o próprio papel, status, time, comissão ou e-mail.

Papéis (`app_role`): `admin`, `gestor`, `funcionario`.

## Modelo de dados por módulo

| Módulo | Tabelas | Regras de acesso (RLS) |
|---|---|---|
| Pessoas | `profiles`, `teams`, `sales_goals` | Membros leem; perfil edita a si (campos pessoais); admin edita qualquer um; gestor escreve times e metas |
| Empresas / Configurações | `clients`, `companies`, `company_ec_numbers`, `company_bank_accounts`, `company_documents` | Membros leem clientes, empresas e ECs; contas bancárias e documentos só gestor; escrita só gestor |
| Operacional · Missões | `boards`, `board_lists`, `cards`, `labels`, `card_labels`, `card_assignees`, `card_checklist_items` | Colaborativo: qualquer membro lê e escreve |
| Operacional · Agenda | `events`, `event_attendees` | Todos leem; cria quem é membro (como `created_by`); edita/exclui o criador ou gestor |
| Operacional · Documentações | `acquirers`, `acquirer_documents`, `acquirer_notes` | Membros leem, anexam e escrevem notas; cards de adquirente só gestor |
| Operacional · Cursos | `courses`, `course_modules`, `lessons`, `lesson_progress` | Membros veem cursos publicados; gestor gerencia; progresso é de cada um |
| Comercial / Marketing | `leads`, `lead_stage_history`, view `seller_performance` | Todos leem (ranking/insights); cria membro; altera dono, criador ou gestor; exclui gestor. Histórico de etapa preenchido por trigger |

Enums: `pipeline_stage` (lead_recebido → diagnostico_feito → reuniao_marcada → follow_up → cliente_fechado | cliente_perdido), `lead_source` (marketing, venda, indicacao, outro), `lead_temperature` (quente, frio), `deal_type` (consultoria_avancada, somente_sistema), `video_source` (upload, drive, youtube).

Tipos TypeScript: `src/lib/supabase/database.types.ts`, gerado do banco. Regere depois de cada migration (MCP `generate_typescript_types` ou `supabase gen types typescript`).

## Storage

Todos os buckets são privados; download por URL assinada de curta duração, caminho gerado no servidor.

| Bucket | Conteúdo | Limite | Acesso |
|---|---|---|---|
| `company-docs` | PDFs de empresas | 20 MB, só PDF | Gestor |
| `acquirer-docs` | Documentos de adquirentes | 50 MB | Membros |
| `acquirer-logos` | Logos das adquirentes | 2 MB, imagens | Membros leem; gestor envia |
| `course-videos` | Vídeos das aulas | 50 MB, mp4/webm/mov | Membros leem; gestor envia |
| `avatars` | Fotos de perfil | 5 MB, imagens | Membros leem; dono (ou admin) envia |

## Decisões

- **Supabase JS + migrations SQL em vez do Drizzle padrão do toolkit.** O produto depende de Supabase Auth (logins dos funcionários), Storage (PDFs, vídeos, logos) e RLS como camada principal de autorização; escrever políticas e funções em SQL versionado e consumir com o cliente tipado mantém tudo num lugar só.
- **`cacheComponents` desligado.** Quase toda página lê o cookie de sessão para montar o shell e respeitar RLS, então quase nada seria estático; ativar exigiria `Suspense` em volta de cada leitura sem ganho real.
- **Dinheiro em centavos** (`integer`/`number` inteiro: `deal_value_cents`, `goal_cents`, `revenue_cents`) e formatação só na borda (`lib/format/money.ts`). Evita erro de ponto flutuante em somas e comissões.
- **Grupo de rotas `(app)`** para compartilhar o shell e a checagem de sessão sem mudar as URLs.
- **Redirecionamento em `page.tsx`** das seções (`/operacional`, `/comercial`, `/configuracoes`) para a primeira subpágina, mantendo o item do menu lateral apontando para a raiz da seção.

## Convenções

- Arquivos até **350 linhas**; quebre em componentes ou helpers antes disso.
- **Um escritor por arquivo** (tabela de donos em `TASKS.md`); revisores só leem e devolvem correções ao dono.
- Nomes de arquivo em kebab-case; componentes em PascalCase; textos de interface em pt-BR.
- Cores só pelos tokens de `globals.css` (`bg`, `surface`, `surface-2`, `surface-3`, `border`, `fg`, `muted`, `primary`, `primary-hover`, `primary-fg`, `accent`, `success`, `warning`, `danger`, `ring`).
- Server Components por padrão; `"use client"` só no menor componente interativo.
- Validação Zod em toda entrada; erros mostrados ao usuário sem stack.
- Testes Vitest ao lado do arquivo (`*.test.ts`) para lógica pura.
