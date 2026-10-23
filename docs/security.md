# Segurança do CRONOS

Revisão de segurança baseada em evidências. Este documento registra escopo, método, testes, achados e o que ainda falta. Ausência de achados num ponto significa só que nada foi comprovado no escopo examinado, não que o sistema seja seguro.

## Fase 1 — banco de dados (RLS, funções, triggers, Storage)

- **Data:** 2026-10-23.
- **Projeto:** Supabase `cronos` (ref `cnwflsucwedbmfltbeht`). Nenhum outro projeto da conta foi acessado.
- **Escopo:** `supabase/migrations/*.sql` (schema inicial, `cronos_needs_setup`, `operacional_course_covers`) e o estado real do banco: políticas RLS de `public` e `storage.objects`, funções, triggers, grants, view `seller_performance` e buckets. Código da aplicação ficou para a fase 2; só `src/app/primeiro-acesso/actions.ts` e o uso de `avatar_path` foram lidos para avaliar dois achados.
- **Fora do escopo:** configurações do painel de Auth (não acessíveis por SQL), Edge Functions (não há), logs e dados reais (o banco estava vazio).

### Método

1. Leitura de `PRODUCT.md`, `docs/architecture.md`, das migrations e de `docs/prompts/security-review.md`, com a skill `supabase-postgres-best-practices` (`references/security-*.md`).
2. `get_advisors` (segurança e desempenho) antes e depois da correção.
3. Inventário por SQL: RLS habilitado por tabela, ACL de cada função, `search_path`, `security definer`, grants de `anon`/`authenticated`, opções da view e políticas de Storage.
4. **Testes de comportamento** com `execute_sql`, um bloco por rodada, sempre dentro de `begin; … rollback;`. O bloco cria usuários falsos em `auth.users` (o trigger `handle_new_user` cria os perfis), dados de exemplo e linhas em `storage.objects`; depois simula cada papel com `set local role` (`anon`/`authenticated`) e `request.jwt.claims` (`sub`). O resultado sai numa exceção final, o que garante o rollback. Depois de cada rodada foi conferido que `auth.users`, `profiles`, `leads`, `companies` e `storage.objects` continuam com 0 linhas.
5. Correções numa migration nova e aditiva (`20261023200000_security_hardening.sql`), seguidas de nova rodada completa.

Rodadas: **antes da correção, 100 verificações, 96 passaram e 4 falharam** (as 4 sondas de achados). **Depois da correção, 111 verificações, todas passaram** (as 100 iniciais com as 4 sondas corrigidas, e 11 novas para os ajustes).

### Modelo de ameaça (resumo)

| Item | Descrição |
|---|---|
| Ativos | Dados bancários e PDFs de empresas, pipeline comercial (valores, comissão), cadastro de pessoas (e-mail, telefone, comissão), papéis de acesso, arquivos privados |
| Atacantes | (a) qualquer pessoa na internet com a URL do projeto e a chave publicável (pública no bundle); (b) conta criada por cadastro público (inativa); (c) funcionário ativo tentando ver dados bancários, escalar papel ou mexer em números de outros; (d) gestor tentando agir como admin |
| Entradas | PostgREST (`/rest/v1`, tabelas e RPC), Storage API, Auth (`/auth/v1/signup`), Server Actions (fase 2) |
| Fronteiras | `anon` → `authenticated` inativo → membro ativo (`funcionario`) → `gestor` → `admin` → service role (só servidor) |
| Proteções existentes | RLS em todas as 26 tabelas; funções `is_member`/`is_manager`/`has_role` com `search_path = ''`; trigger `guard_profile_update`; papel só a partir de `raw_app_meta_data` (gravável só pelo service role); buckets privados |

### Testes executados

Resultado final (depois da migration). "erro 42501" é recusa por RLS ou privilégio; "erro P0001" é a exceção do trigger de perfil; "0 linhas" é RLS filtrando em silêncio.

| # | Cenário | Esperado | Observado | Resultado |
|---|---|---|---|---|
| 1 | Primeiro usuário criado | admin ativo | admin ativo | Passou (regra substituída por S-05: agora só e-mail confirmado de `private.bootstrap_admins` vira admin) |
| 2 | Convidado com `app_metadata.cronos_role = gestor` | gestor ativo | gestor ativo | Passou |
| 3 | Convidado sem papel | funcionário ativo | funcionário ativo | Passou |
| 4 | Cadastro sem convite | funcionário inativo | funcionário inativo | Passou |
| 5 | Cadastro com `cronos_invited`/`cronos_role=admin` em **user_metadata** | inativo, sem escalar | funcionário inativo | Passou |
| 6 | anon lê `companies`, `profiles`, `leads`, `seller_performance` | recusado | erro 42501 (antes: 0 linhas) | Passou |
| 7 | anon insere cliente | recusado | erro 42501 | Passou |
| 8 | anon chama `is_member`/`has_role` | recusado | erro 42501 | Passou |
| 9 | anon chama `cronos_needs_setup` | só um booleano | `false` | Passou |
| 10 | anon lista `storage.objects` | nada | 0 linhas | Passou |
| 11 | Inativo lê perfis | só o próprio | 1 linha | Passou |
| 12 | Inativo lê empresas/leads | nada | 0 linhas | Passou |
| 13 | Inativo cria lead/evento, envia avatar | recusado | erro 42501 | Passou |
| 14 | Inativo se ativa | recusado | erro P0001 | Passou |
| 15 | Funcionário lê empresas, clientes, ECs | permitido | 1 linha cada | Passou |
| 16 | Funcionário lê `company_bank_accounts`/`company_documents` | nada | 0 linhas | Passou |
| 17 | Funcionário cria/edita/apaga empresa; cria cliente, time, meta; edita metas | recusado | erro 42501 ou 0 linhas | Passou |
| 18 | Funcionário muda o próprio papel, status, comissão, time, e-mail | recusado | erro P0001 (5 casos) | Passou |
| 19 | Funcionário muda o próprio nome / o perfil de outro | permitido / nada | 1 linha / 0 linhas | Passou |
| 20 | Funcionário cria lead com `created_by` = si (explícito e padrão) | permitido | 1 linha cada | Passou |
| 21 | Funcionário cria lead em nome de outro | recusado | erro 42501 | Passou |
| 22 | Funcionário edita lead alheio / próprio | nada / permitido | 0 / 1 linha | Passou |
| 23 | Funcionário apaga lead próprio | nada | 0 linhas | Passou |
| 24 | Fechar sem tipo/valor; perder com motivo em branco; indicação sem indicador | `check` recusa | erro 23514 (3 casos) | Passou |
| 25 | Indicação com indicador; fechar com tipo e valor | permitido | 1 linha cada | Passou |
| 26 | `closed_at` e `lead_stage_history` após fechar | data preenchida; histórico inserção + mudança com autor | conforme esperado | Passou |
| 27 | Funcionário insere direto no histórico | recusado | erro 42501 | Passou |
| 28 | `seller_performance` para funcionário | uma linha por membro ativo | 4 | Passou |
| 29 | Funcionário cria evento próprio / em nome de outro | permitido / recusado | 1 linha / erro 42501 | Passou |
| 30 | Funcionário edita ou apaga evento alheio | nada | 0 linhas | Passou |
| 31 | Funcionário vê cursos, módulos, aulas | só publicados | 1 de 2 | Passou |
| 32 | Funcionário cria curso | recusado | erro 42501 | Passou |
| 33 | Progresso de aula: ver/gravar de outro; gravar o próprio | nada, recusado / permitido | 0 linhas, erro 42501 / 1 linha | Passou |
| 34 | Storage, funcionário: ler `company-docs`; gravar `company-docs`, `course-videos`, `acquirer-logos`, `course-covers` | nada / recusado | 0 linhas / erro 42501 | Passou |
| 35 | Storage, funcionário: avatar na própria pasta / na de outro | permitido / recusado | 1 linha / erro 42501 | Passou |
| 36 | Storage, funcionário: renomear avatar alheio / mover o próprio para pasta alheia | nada / recusado | 0 linhas / erro 42501 | Passou |
| 37 | Storage, funcionário: gravar `acquirer-docs` | permitido | 1 linha | Passou |
| 38 | **S-02** Funcionário troca `created_by` do próprio lead | recusado | erro 42501 (antes: permitido) | Passou |
| 39 | **S-02** Funcionário retroage `closed_at` sem mudar etapa | data mantida | mantida (antes: gravava 2020) | Passou |
| 40 | **S-02** Funcionário cria lead perdido com `closed_at`/`created_at` antigos | datas de agora | agora | Passou |
| 41 | **S-02** Funcionário retroage `created_at` | recusado | erro 42501 | Passou |
| 42 | Dono repassa `owner_id` do lead | permitido | 1 linha | Passou |
| 43 | **S-03** Criador passa o evento para outra pessoa (`created_by`) | recusado | erro 42501 (antes: permitido) | Passou |
| 44 | **S-04** Funcionário inclui participante em evento alheio | recusado | erro 42501 (antes: permitido) | Passou |
| 45 | **S-04** Criador inclui participantes; funcionário os vê | permitido | 1 linha cada; 2 visíveis | Passou |
| 46 | **S-04** Funcionário remove participante alheio / sai do evento | nada / permitido | 0 / 1 linha | Passou |
| 47 | Criador edita o próprio evento | permitido | 1 linha | Passou |
| 48 | Gestor lê contas bancárias e documentos; cria empresa e meta | permitido | 1 linha cada | Passou |
| 49 | Gestor muda papel de outro / ativa conta inativa | nada | 0 linhas | Passou |
| 50 | Gestor muda o próprio papel | recusado | erro P0001 | Passou |
| 51 | Gestor edita evento alheio, inclui participante, corrige `created_by`/`closed_at` de lead, apaga lead | permitido | 1 linha cada | Passou |
| 52 | Gestor vê cursos não publicados | todos | 2 | Passou |
| 53 | Storage, gestor: ler/gravar `company-docs`; avatar de outro | permitido / recusado | 1 linha, 1 linha / erro 42501 | Passou |
| 54 | Admin muda papel e comissão de outro; desativa funcionário; envia avatar de outro | permitido | 1 linha cada | Passou |
| 55 | Funcionário desativado lê empresas | nada | 0 linhas | Passou |
| 56 | Avatar com `avatar_path` arbitrário | aceito (risco aceito R-03) | 1 linha | Aceito |
| 57 | Funcionário lê objeto de `course-videos` de curso não publicado | aceito (risco aceito R-04) | 1 linha | Aceito |

### Inventário estático

- **RLS:** habilitado nas 26 tabelas de `public`. Nenhuma tabela sem política relevante.
- **`search_path`:** todas as 9 funções de `public` usam `set search_path = ''` e nomes qualificados.
- **`security definer`:** `is_member`, `has_role`, `is_manager` (leem `profiles` sem recursão de RLS), `handle_new_user` e `log_lead_stage` (gravam em tabelas sem política de escrita), `cronos_needs_setup` (anon precisa saber se `profiles` está vazia). `track_lead_stage` não precisava e virou `security invoker`. Todas verificam o usuário por `auth.uid()` ou não recebem identidade de fora.
- **ACL de funções (depois):** funções de trigger executáveis só por `postgres`/`service_role`; helpers só por `authenticated`/`service_role`; `cronos_needs_setup` também por `anon`.
- **View `seller_performance`:** `security_invoker = true`, então respeita a RLS de quem consulta. Depois da migration, `anon` não tem grant nela (teste 6).
- **Grants:** antes, `anon` e `authenticated` tinham `ALL` (inclusive `TRUNCATE`, que ignora RLS) em todas as tabelas, padrão do Supabase. A RLS bloqueava `anon` na prática e a API não emite `TRUNCATE`, mas era superfície desnecessária. Depois: `anon` sem nenhum grant em `public`; `authenticated` com `SELECT, INSERT, UPDATE, DELETE`. Privilégios padrão ajustados para tabelas e funções futuras criadas por `postgres`.
- **`cronos_needs_setup`:** `select not exists (select 1 from public.profiles)`; devolve só um booleano, sem parâmetros (teste 9).

### Advisors

| Advisor | Nível | Avaliação |
|---|---|---|
| `anon_security_definer_function_executable`: `cronos_needs_setup` | WARN | Intencional: a página `/primeiro-acesso` precisa saber se há usuários antes do login. Vaza só um booleano. Aceito (R-02). |
| `authenticated_security_definer_function_executable`: `is_member`, `has_role`, `is_manager`, `cronos_needs_setup` | WARN | Aceito (R-01). Ver justificativa abaixo. |
| `multiple_permissive_policies` (10 tabelas) | WARN (desempenho) | Políticas `*_select` + `*_write for all` somam duas checagens no SELECT. Custo pequeno no volume de um CRM interno. Recomendação, sem mudança agora. |
| `unused_index` (36) | INFO | Banco vazio; os índices cobrem FKs e filtros de RLS. Ignorado. |

**Por que os helpers ficam em `public` (R-01).** Mover para um schema `private` não exposto tiraria o aviso, mas exigiria recriar 58 políticas (44 em `public` e 14 em Storage) com `drop policy`, e as políticas continuariam precisando de `EXECUTE` para `authenticated`. O ganho é pequeno: as três funções não recebem identidade de fora, olham só a linha do próprio chamador (`auth.uid()`) e devolvem um booleano que o usuário já deduz lendo o próprio perfil (permitido por `profiles_select`). Não há vazamento nem efeito colateral. Risco aceito; reavaliar se alguma função passar a receber um id de usuário como parâmetro.

### Achados

| ID | Título | Severidade | Status |
|---|---|---|---|
| S-01 | Grants amplos para `anon` e `TRUNCATE` para `authenticated` | Baixa (defesa em profundidade) | Corrigido |
| S-02 | Não gestor reescreve autoria e datas do lead | Média | Corrigido |
| S-03 | Criador repassa o evento (`created_by`) a outra pessoa | Baixa | Corrigido |
| S-04 | Qualquer membro altera participantes de qualquer evento | Média | Corrigido |
| S-05 | Janela do primeiro acesso: o primeiro cadastro público vira admin | Alta enquanto o banco estiver vazio | Corrigido (migration `20261023201000_owner_bootstrap.sql`) |

**S-01 — Grants amplos.** Evidência: `information_schema.role_table_grants` listava 189 privilégios de `anon` em `public` (todas as tabelas e a view, inclusive `TRUNCATE`, `TRIGGER` e `REFERENCES`) e `TRUNCATE` para `authenticated`. A RLS impedia leitura (teste 6 antes: 0 linhas), então não havia vazamento comprovado; o risco era uma tabela futura criada sem RLS ficar aberta a anônimos. Correção: `revoke all … from anon`, `revoke truncate, references, trigger … from authenticated` e os mesmos ajustes em `alter default privileges`. Validação: 0 grants de `anon`; teste 6 agora retorna erro 42501.

**S-02 — Autoria e datas do lead.** Pré-requisito: funcionário ativo, dono ou criador do lead. A política `leads_update` só exigia `is_member()` no `with check`, e o trigger aceitava qualquer `closed_at` informado. Evidência (rodada 1): `update leads set created_by = <outro>` em lead próprio retornou 1 linha; `closed_at` podia ser escolhido (por exemplo, 2020). Impacto: distorce "quem cadastrou" em Insights, permite empurrar um fechamento para outro mês (meta/comissão por período) e retroagir `created_at`. Correção: `track_lead_stage` passou a recusar mudança de `created_by`/`created_at` por quem não é gestor, a gravar `now()` como `closed_at` na transição para fechado/perdido e a manter `closed_at` fora de transição; gestor, admin e service role mantêm o comportamento antigo (para importar histórico). O código atual (`stage-transition.ts`) já envia `closed_at: null` e não é afetado. Validação: testes 38–42 e 51.

**S-03 — Repasse de evento.** `events_modify` checava criador ou gestor no `using`, mas só `is_member()` no `with check`. Evidência: `update events set created_by = <outro>` retornou 1 linha. Correção: `with check` igual ao `using`. Validação: teste 43.

**S-04 — Participantes de eventos.** A política `event_attendees_member` (`for all`, só `is_member()`) deixava qualquer membro incluir ou remover participantes de evento alheio, contra a regra "edita o criador ou gestor". Evidência: inserção em evento alheio retornou 1 linha. Correção sem `drop policy`: a política existente passou a exigir criador do evento ou gestor; novas políticas `event_attendees_select` (todos os membros leem) e `event_attendees_leave` (cada um apaga a própria participação). Validação: testes 44–46 e 51. **Impacto no código:** a ação da Agenda deve incluir participantes com o cliente do próprio criador (ou de um gestor), depois de criar o evento.

**S-05 — Janela do primeiro acesso.** *Corrigido pelo coordenador em 2026-10-23: o repositório é público, então a promoção passou a exigir e-mail confirmado presente em `private.bootstrap_admins` (schema sem acesso pela API). Teste em transação revertida: e-mail da lista confirmado virou admin ativo; outro e-mail confirmado, mesmo com `cronos_invited` em user_metadata, ficou funcionário inativo. Texto original abaixo.* `handle_new_user` promove a admin o primeiro registro de `auth.users`, venha de onde vier. `/primeiro-acesso` usa `supabase.auth.signUp` com a chave publicável, então o cadastro público precisa estar ligado até o dono entrar. Enquanto `profiles` estiver vazia (estado em 2026-10-23), qualquer pessoa com a URL do projeto e a chave publicável (ambas públicas no bundle) pode chamar `/auth/v1/signup` antes do dono e virar admin; `cronos_needs_setup` revela que a janela está aberta. Depois do primeiro usuário, cadastros públicos nascem inativos e não acessam nada (testes 4, 5 e 11–14). Contramedida: fazer o primeiro acesso logo depois do deploy e então desligar o cadastro público (ver recomendações). Alternativa sem janela: criar o dono pelo painel do Supabase (Authentication → Add user), que também cai no trigger e vira admin.

### Riscos aceitos

| ID | Risco | Motivo |
|---|---|---|
| R-01 | `is_member`, `has_role`, `is_manager` chamáveis por RPC | Só respondem sobre o próprio chamador; mover exigiria recriar 58 políticas sem ganho real (ver Advisors) |
| R-02 | `cronos_needs_setup` chamável por `anon` | Necessário para `/primeiro-acesso`; devolve só um booleano |
| R-03 | `profiles.avatar_path` aceita qualquer texto do próprio usuário | O app assina o caminho só no bucket `avatars` com o cliente do usuário (`features/operacional/shared/members.ts`, `features/comercial/queries.ts`), então um caminho de outro bucket não resolve. Reavaliar na fase 2 se alguma assinatura passar a usar o service role |
| R-04 | Objetos de `course-videos`/`course-covers` de cursos não publicados são legíveis por membros que saibam o caminho | Só gestor envia; caminhos não são listados ao funcionário (aulas de curso não publicado ficam ocultas pela RLS); conteúdo interno de treinamento |
| R-05 | Todos os membros veem o pipeline, as metas e, em `profiles`/`seller_performance`, e-mail, telefone e comissão dos colegas | Decisão de produto (ranking e insights). Se a comissão tiver de ser privada, criar uma view sem `commission_rate` para funcionários |
| R-06 | Dono ou criador pode repassar `owner_id` do lead, inclusive para si | Necessário para repasse de leads; não há histórico de dono. Se virar problema, registrar trocas de `owner_id` como em `lead_stage_history` |
| R-07 | Conta inativa edita os próprios campos pessoais (nome, telefone, cargo, avatar) | Sem acesso a dados de terceiros; inofensivo |
| R-08 | `acquirer-logos` aceita `image/svg+xml` | Só gestor envia; o arquivo é servido no domínio do Supabase, fora da origem do app. Preferir PNG/WebP |
| R-09 | Admin pode remover o próprio papel de admin e deixar o sistema sem admin | Operacional, reversível pelo painel |

### Recomendações para o painel do Supabase

1. **Desligar o cadastro público logo depois do primeiro acesso:** Authentication → Sign In / Providers → desligar "Allow new users to sign up". Funcionários continuam sendo criados pelo admin (service role, `app_metadata.cronos_invited`). Isso fecha a janela S-05 e evita contas inativas de terceiros.
2. **URLs de redirecionamento:** em Authentication → URL Configuration, definir o Site URL de produção e incluir `<site>/auth/callback` (e `http://localhost:3000/auth/callback` para desenvolvimento) em Redirect URLs. Sem isso, a confirmação de e-mail do primeiro acesso não volta para o app.
3. **Confirmação de e-mail ligada** e, se possível, SMTP próprio (o SMTP padrão tem limite baixo de envio).
4. **Proteção contra senhas vazadas** (Authentication → Passwords → "Prevent use of leaked passwords", disponível em planos pagos) e política de senha mínima de 8 caracteres com letras e números, coerente com o formulário.
5. **Rate limits de Auth** nos valores padrão ou mais restritos; considerar CAPTCHA (hCaptcha/Turnstile) no login se o app ficar exposto na internet.
6. **MFA (TOTP)** para contas admin quando o fluxo existir no app.
7. **Chave service role** só no servidor (`SUPABASE_SERVICE_ROLE_KEY`, nunca `NEXT_PUBLIC_*`); trocar a chave se ela vazar.
8. Rodar `get_advisors` (segurança) depois de cada migration; os únicos avisos esperados são R-01 e R-02.

### Para quem mantém

- Nova tabela em `public`: habilitar RLS na mesma migration e dar grants explícitos a `authenticated` (anon não recebe mais nada por padrão).
- Nova função `security definer`: `set search_path = ''`, checar `auth.uid()` dentro e revogar `EXECUTE` de `public, anon`.
- Para reproduzir os testes: criar usuários e dados dentro de `begin; … rollback;`, simular o papel com `set local role authenticated` e `set_config('request.jwt.claims', json_build_object('sub', '<uuid>', 'role', 'authenticated')::text, true)`, e conferir depois que `auth.users` e `profiles` continuam vazias.

## Fase 2 — código da aplicação

- **Data:** 2026-10-23. **Modo:** revisão do repositório no commit `d89a1ca` (branch `claude/cronos-foundation`). Os arquivos do escopo não têm alterações locais; as alterações não commitadas do repositório são todas do módulo Operacional, fora do escopo.
- **Escopo:** `src/lib/**`, `src/proxy.ts`, `src/app/{login,primeiro-acesso,auth}/**`, `src/app/(app)/**` (menos `operacional`), `src/features/{comercial,empresas,configuracoes,inicio,marketing}/**`, `src/components/**` (só para importações de servidor em componentes cliente) e `next.config.ts`.
- **Fora do escopo (pendente):** `src/features/operacional/**` e `src/app/(app)/operacional/**`, ainda em escrita. Nessa revisão, conferir participantes da Agenda (S-04), `meeting_url` como `href`, uploads de `acquirer-docs` e `course-videos`.
- **Método:** leitura manual de cada Server Action, route handler, consulta e componente cliente do escopo, e buscas direcionadas (`"use server"`, `"use client"` com importações de servidor, `createAdminClient`, `createSignedUrl*`, `dangerouslySetInnerHTML`, `href={…}`, `window.location`, `NEXT_PUBLIC_*`). Valores de `.env.local` não foram lidos (só os nomes; o arquivo é ignorado pelo Git e a chave service role está vazia). `pnpm exec tsc --noEmit` passou. Não rodei `next dev`/`build` nem testes dinâmicos contra o app; os achados abaixo vêm de análise estática, apoiada pelos testes de RLS da fase 1.
- **Referência:** OWASP ASVS 5.0 usada só como lista de cobertura, sem citar requisitos.

### Conferido sem achado

| Controle | Evidência |
|---|---|
| Toda Server Action começa com `requireMember`/`requireRole` e valida com Zod | `comercial/actions.ts` (6 ações), `configuracoes/{employee,company,client,team,document}-actions.ts`, `empresas/actions.ts`. Algumas validam o id antes da sessão (`deleteLead`, `setSalesGoal`, `loadLeadHistory`), sem efeito colateral. `login` e `createFirstAdmin` são públicas por natureza e validam com Zod |
| Service role só depois de `requireRole(["admin"])` | `employee-actions.ts:35-62` (`createUser`, e `deleteUser` só para desfazer um cadastro pela metade) e `:157-162` (`updateUserById` para senha). Nenhum outro uso de `createAdminClient` |
| Componente cliente sem módulo de servidor | Nenhum arquivo `"use client"` do escopo importa `@/lib/auth`, `supabase/server`, `supabase/admin`, `lib/env`, `lib/logger`, `queries` ou helpers `server-only`. Todos os `queries.ts` começam com `import "server-only"` |
| Redirecionamento aberto | `login/safe-next.ts` aceita só `/caminho` e recusa `//`, `/\` e caracteres de controle; usado em `login/actions.ts:47`, `login/page.tsx:18` e `auth/callback/route.ts:12`. O proxy grava em `next` só o `pathname` |
| IDOR em linhas filhas de empresa | `company-children.ts:67-79`: ids vindos do navegador só são atualizados se já pertencem à empresa, e todo `update`/`delete` filtra também por `company_id`. Os arrays têm teto (`company-schemas.ts:81-82`) |
| Upload de PDF | Caminho gerado no servidor (`document-actions.ts:47`, `<empresa>/<uuid>-<nome-sanitizado>.pdf`), token de envio assinado, registro só depois de conferir tamanho e tipo no Storage (`:74-80`) e o caminho contra `PATH_PATTERN` e o prefixo da empresa |
| Validade das URLs assinadas | PDF: 60 s com `download` (`empresas/actions.ts:26`); avatares: 1 h (`comercial/queries.ts:17`, `configuracoes/queries.ts:204`) |
| Dados restritos para funcionário | `empresas/queries.ts:76-89,119` só consulta contas e PDFs quando é gestor; a RLS também bloqueia (fase 1, testes 16 e 34). Páginas de Configurações chamam `requireRole` nas consultas (`configuracoes/queries.ts`) |
| XSS | Nenhum `dangerouslySetInnerHTML` no escopo. Nenhum `href` montado com dado do usuário (e-mail e telefone de lead/cliente são exibidos como texto). Links externos fixos usam `rel="noreferrer"` |
| Mensagens e logs | Erros ao usuário são genéricos; o log registra `code`/`message` do Postgres ou do Storage, sem payload nem dados pessoais. O Pino redige senha, token, cookie e authorization. `error.tsx` mostra só o `digest` |
| Variáveis de ambiente | Só `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` são públicas; `SUPABASE_SERVICE_ROLE_KEY` é lida só em `lib/env.ts` (`server-only`). `.env.local` é ignorado pelo Git; só `.env.example` (sem valores) é versionado |
| Sessão | O proxy renova a sessão com `getClaims()` e manda anônimos para `/login`; `requireMember` confere `active` a cada requisição, então desativar alguém corta o acesso na próxima requisição mesmo com JWT válido |

### Achados

| ID | Título | Severidade | Status |
|---|---|---|---|
| P2-01 | Textos do primeiro acesso prometem admin a qualquer cadastro | Baixa | Corrigido (f4e03b8) |
| P2-02 | Sem cabeçalhos de segurança (clickjacking, nosniff) | Baixa | Corrigido (f4e03b8) |
| P2-03 | Logout por POST sem checar a origem (CSRF de logout) | Baixa | Corrigido (f4e03b8) |
| P2-04 | Conteúdo de PDF e avatar não conferido pelos bytes | Baixa | Corrigido (f4e03b8) |
| P2-05 | Redefinir senha não encerra sessões abertas | Baixa | Mitigado: a interface orienta desativar o acesso para desconectar |
| P2-06 | `emailRedirectTo` montado a partir do cabeçalho `Origin` | Informativa | Aceito (Supabase só aceita Redirect URLs da lista) |

**P2-01 — Textos do primeiro acesso (Baixa, confirmado).** Depois de S-05, só um e-mail confirmado de `private.bootstrap_admins` vira admin, mas a interface diz o contrário: `src/app/primeiro-acesso/page.tsx:17` ("Crie a conta do administrador. Ela terá acesso total…"), `setup-form.tsx:75` (botão "Criar administrador"), `src/app/login/page.tsx:31` (link "Criar o administrador") e o comentário desatualizado de `needs-setup.ts:5` ("não existe nenhum usuário"). Cenário: enquanto não há admin ativo, qualquer visitante (ou o dono com um e-mail digitado errado) cria a conta achando que é admin, confirma o e-mail e recebe "Seu acesso ainda não foi liberado", sem explicação. Não há escalada, mas o texto engana e gera contas inativas. Correção: descrição "Use o e-mail autorizado do responsável pelo CRONOS. Outros cadastros ficam aguardando liberação."; botão "Criar conta"; link "Primeiro acesso do responsável"; no estado `verify`, avisar que o acesso de admin só vale para o e-mail autorizado; comentário: "true enquanto não houver admin ativo".

**P2-02 — Cabeçalhos de segurança (Baixa, confirmado por leitura).** `next.config.ts` não define `headers()`, então nenhuma resposta envia `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options` ou `Referrer-Policy`. Cenário: um site externo carrega `/configuracoes/funcionarios` num iframe invisível e induz um admin logado a clicar no interruptor de acesso ou em "Excluir" (clickjacking). Os diálogos de confirmação dificultam, mas não impedem. Correção em `next.config.ts`: `async headers() { return [{ source: "/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }, { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }] }]; }`. Uma CSP completa (scripts) pode vir depois, com nonce.

**P2-03 — CSRF de logout (Baixa, confirmado por leitura).** `src/app/auth/signout/route.ts:6-11` encerra a sessão em qualquer POST. Route handlers não têm a checagem de origem das Server Actions. Cenário: uma página externa com `<form method="post" action="https://<site>/auth/signout">` enviado automaticamente desloga quem a abre. O impacto é só incômodo. Correção: no início do handler, `const origin = request.headers.get("origin"); if (origin && origin !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });` (ou trocar por uma Server Action).

**P2-04 — Conteúdo dos arquivos (Baixa, precisa de validação).** O PDF é enviado com `contentType: "application/pdf"` fixo no navegador (`company-documents.tsx:33`), e o servidor confere só o `contentType` gravado no Storage (`document-actions.ts:76-77`), que é o declarado pelo cliente. No avatar, `people-helpers.ts:13` confia em `file.type`. Pré-requisito: ser gestor (PDF) ou admin (avatar), então o risco é baixo. Impacto: um arquivo que não é PDF (por exemplo, HTML) fica registrado como documento. Ele é servido pelo domínio do Storage, com `download`, fora da origem do app. Correção: em `registerCompanyDocument`, baixar o objeto (até 20 MB) ou os primeiros bytes e exigir que comece com `%PDF-`; em `readAvatar`, ler `await file.slice(0, 12).arrayBuffer()` e conferir a assinatura de PNG (`89 50 4E 47`), JPEG (`FF D8 FF`) ou WebP (`RIFF....WEBP`).

**P2-05 — Sessões após redefinir senha (Baixa, precisa de validação).** `resetEmployeePassword` (`employee-actions.ts:156-169`) troca a senha com `updateUserById`, mas sessões e refresh tokens existentes continuam valendo. Se a senha foi redefinida porque vazou, quem já entrou continua logado. Desativar a conta (`setEmployeeActive`) corta o acesso de verdade, porque `requireMember` e a RLS conferem `active`. Correção: orientar na interface "para expulsar alguém, desative o acesso", ou criar uma função `security definer` só para admin que apague `auth.sessions` do usuário (`delete from auth.sessions where user_id = $1`, com `has_role(['admin'])`) e chamá-la depois da troca de senha.

**P2-06 — `emailRedirectTo` a partir de `Origin` (Informativa).** `primeiro-acesso/actions.ts:46,53` monta o link de confirmação com o cabeçalho `Origin`. Só quem faz o próprio cadastro controla esse valor, o Next confere `Origin` contra o host nas Server Actions e o Supabase só aceita destinos da lista de Redirect URLs. Endurecimento: usar uma variável de servidor (`SITE_URL`) validada em `lib/env.ts`.

### Observações (sem ação agora)

- `getLeadSourceStats`, `getOpenLeadsCount` e `getLeadHistory` (`comercial/queries.ts`) não chamam `requireMember` e dependem da RLS e dos chamadores (páginas sob o layout `(app)` e `loadLeadHistory`). Se alguma for usada fora desse contexto, adicionar a checagem.
- `next.config.ts` libera o otimizador de imagens para `…/storage/v1/object/sign/**`. Ele só busca URLs assinadas que o servidor já gerou; o cache fica atrelado à URL com token.
- `requireRole` lança `Error("Acesso negado")`; em produção o Next substitui a mensagem por um `digest`, sem vazar detalhes.

### Próxima validação

- Revisar o módulo Operacional quando estiver pronto (itens em "Fora do escopo").
- Depois de corrigir P2-02 e P2-03, conferir os cabeçalhos com `curl -I` no ambiente local e um POST de outra origem em `/auth/signout`.
