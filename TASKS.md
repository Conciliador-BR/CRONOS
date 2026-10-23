# CRONOS — Plano de tarefas

CRM interno que une **Trello** (missões), **Google Agenda** (reuniões), **Notion** (documentações e notas), **Hotmart/Hubla** (cursos) e **HubSpot** (pipeline comercial). Identidade visual **preto e azul**.

Este documento divide o pedido original em épicos, tarefas e responsáveis. Status: `[ ]` a fazer, `[~]` em andamento, `[x]` feito, `[!]` bloqueado (motivo ao lado).

## Equipe de agentes

| Papel | Responsabilidade | Arquivos que escreve |
|---|---|---|
| **Coordenador** | Plano, banco de dados, integração, verificação final, PR | `TASKS.md`, `supabase/migrations/`, `package.json`, lockfile, configs |
| **Dev sênior chefe** | Módulo Comercial (pipeline, desempenho, insights) e revisão técnica dos demais módulos | `src/features/comercial/`, `src/app/(app)/comercial/` |
| **Dev Operacional** | Missões (Trello), Agenda, Documentações de API, Cursos | `src/features/operacional/`, `src/app/(app)/operacional/` |
| **Dev Empresas & Configurações** | Mapa do Brasil, cadastro de empresas/clientes, funcionários e logins, Início, Marketing | `src/features/{empresas,configuracoes,inicio,marketing}/`, rotas correspondentes |
| **Componentização / árvore** | Árvore do projeto, shell do app (menu lateral, topo), rotas base, convenções, `docs/architecture.md` | `src/components/layout/`, `src/app/(app)/layout.tsx`, `docs/architecture.md`, `src/lib/supabase/database.types.ts` |
| **Designer** | Tokens visuais, biblioteca de componentes de UI, página de apresentação, login, `docs/design.md` | `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/`, `src/app/page.tsx`, `src/app/login/`, `src/app/primeiro-acesso/` |
| **Segurança** | Revisão de RLS, Server Actions, uploads, segredos; relatório e correções | `docs/security.md`, correções pontuais combinadas com o dono do arquivo |

Regra: **um escritor por arquivo**. Revisores só leem; correções voltam para o dono.

## Ondas de execução

1. **Fundação** (coordenador): Next.js 16, Supabase Auth/SSR, proxy de sessão, schema + RLS + storage aplicados.
2. **Base visual e estrutura** (paralelo): Designer ‖ Componentização.
3. **Módulos** (paralelo): Dev chefe (Comercial) ‖ Dev Operacional ‖ Dev Empresas & Configurações.
4. **Segurança e revisão**: Segurança revisa tudo; dev chefe revisa integração.
5. **Verificação e entrega** (coordenador): lint, tipos, testes, build, navegação real, PR.

---

## Épico 0 — Fundação (Coordenador)

- [x] Projeto Supabase `cronos` (sa-east-1) criado
- [x] Next.js 16 (App Router, TypeScript, Tailwind 4, ESLint, `src/`, `@/*`), pnpm
- [x] Clientes Supabase (servidor, navegador, admin) e `src/proxy.ts` renovando sessão e protegendo rotas
- [x] `src/lib/auth.ts`: `getCurrentProfile`, `requireMember`, `requireRole`
- [x] Schema inicial com RLS em todas as tabelas (`supabase/migrations/20261023180000_init_schema.sql`)
- [x] Buckets privados: `company-docs`, `acquirer-docs`, `course-videos`, `avatars`, `acquirer-logos`
- [x] Utilitários testados: dinheiro em centavos (`lib/format/money.ts`), CNPJ (`lib/format/document.ts`)
- [x] Skills do toolkit instaladas em `.claude/skills/`

## Épico 1 — Apresentação, login e início

- [ ] **1.1 Página de apresentação** (`/`) — Designer. Hero, módulos do CRM (Empresas, Operacional, Comercial, Marketing), chamada para login. Preto e azul, responsiva.
- [ ] **1.2 Login** (`/login`) — Designer. E-mail e senha via Supabase Auth, erros ao lado dos campos, estado de carregamento, redireciono para `next` ou `/inicio`. Mensagem para conta inativa (`?erro=inativo`).
- [ ] **1.3 Primeiro acesso** (`/primeiro-acesso`) — Designer. Disponível enquanto não existe admin ativo; o banco só promove a admin e-mails da lista privada `private.bootstrap_admins`, após confirmação do e-mail.
- [ ] **1.4 Shell do app** — Componentização. Menu lateral com Início, Empresas, Operacional, Comercial, Marketing, Configurações; topo com usuário e sair; colapsa no celular.
- [ ] **1.5 Página inicial** (`/inicio`) — Dev Empresas. Atalhos para os módulos e resumo (empresas cadastradas, leads abertos, próximas reuniões, missões atribuídas a mim).

## Épico 2 — Empresas

- [ ] **2.1 Mapa do Brasil** (`/empresas`) — estados com empresas cadastradas em destaque azul (intensidade pela quantidade), demais em cinza escuro. Fonte do SVG: `@svg-maps/brazil`.
- [ ] **2.2 Card do estado** — ao clicar no estado, abrir card listando os **mercados** (nome do mercado / nome fantasia) atendidos naquele estado.
- [ ] **2.3 Detalhe do cliente** — ao clicar no mercado, abrir as informações cadastradas: CNPJ, endereço, ECs, cliente vinculado; dados bancários e PDFs só para admin/gestor (RLS já restringe).

## Épico 3 — Configurações

- [ ] **3.1 Cadastro de empresas** (`/configuracoes/empresas`) — CNPJ (com validação), razão social, nome fantasia, nome do mercado, endereço completo (CEP, logradouro, número, complemento, bairro, cidade, UF), múltiplos números de EC por adquirente, múltiplas contas (banco, agência, conta, tipo), anexar PDF (bucket `company-docs`, até 20 MB), vincular ou cadastrar cliente.
- [ ] **3.2 Cadastro de cliente** — nome, CPF/CNPJ, e-mail, telefone, observações; pode ser criado no mesmo fluxo da empresa.
- [ ] **3.3 Funcionários** (`/configuracoes/funcionarios`) — admin cadastra nome, e-mail, senha inicial, telefone, cargo, time, papel (admin/gestor/funcionário), % de comissão, meta mensal e foto. Cria o login no Supabase Auth (service role, só no servidor). Ativar/desativar acesso.
- [ ] **3.4 Times** — CRUD simples de times usado em funcionários e no desempenho.

## Épico 4 — Operacional

Menu de 3 traços (ícone hambúrguer, "≡") no canto superior esquerdo abre o menu de subpáginas.

- [ ] **4.1 Layout operacional** — botão ≡ no topo esquerdo, gaveta com: Missões, Agenda, Documentações de API, Cursos.
- [ ] **4.2 Missões (Trello)** — quadros; listas (colunas) criáveis/renomeáveis/arrastáveis; cartões arrastáveis entre listas e dentro da lista (`@dnd-kit`); etiquetas coloridas; data de entrega com destaque de atraso; responsáveis (funcionários); checklist; descrição; mover cartão para outro quadro; arquivar.
- [ ] **4.3 Agenda (Google Agenda)** — visões mês/semana/dia, criar reunião clicando no horário, título, descrição, local, link da reunião, cor, convidados (funcionários), editar e excluir (criador ou gestor). Vínculo opcional com lead.
- [ ] **4.4 Documentações de API** — grade de cards de adquirentes (com logo; as logos chegam depois — usar iniciais/cor até lá); gestor adiciona/edita/reordena cards e envia logo. Ao abrir um card: anexar documentos, baixar cópias (URL assinada), bloco de notas tipo Notion (várias notas, título + texto, salvamento automático).
- [ ] **4.5 Cursos (Hotmart/Hubla)** — vitrine de cursos com capa; curso > módulos > aulas; player de vídeo; marcar aula como concluída e progresso; gestor cria cursos e envia vídeos (bucket `course-videos`, até 50 MB por arquivo no plano free) ou cola link do Google Drive/YouTube (embed).
- [!] **4.6 Google Drive** — listar vídeos de uma pasta do Drive exige credencial OAuth do Google no app. Nesta entrega a aula aceita link do Drive (embed `/preview`). Integração com listagem de pasta fica pendente de credenciais.

## Épico 5 — Comercial

- [ ] **5.1 Desempenho** (`/comercial/desempenho`) — dashboard: faturamento (soma de negócios fechados), pessoas trabalhando (funcionários ativos), ranking de vendas, meta x realizado por funcionário. Filtro por mês.
- [ ] **5.2 Administração de funcionários no desempenho** — grade de cards com foto, posição no ranking e nome embaixo.
- [ ] **5.3 Card do funcionário** — ao clicar: nome, time, clientes convertidos, valor em comissão, datas de conversão, lugar no ranking, desempenho mês a mês com gráfico (`recharts`).
- [ ] **5.4 Pipeline CRM** (`/comercial/crm`) — colunas: Lead recebido, Diagnóstico feito, Reunião marcada, Follow up, Cliente fechado, Cliente perdido. Arrastar leads entre colunas.
- [ ] **5.5 Ao soltar em "Cliente fechado"** — perguntar: fechou em **Consultoria avançada** ou **Somente o sistema**, e o **valor do negócio em R$**. Cancelar devolve o card.
- [ ] **5.6 Ao soltar em "Cliente perdido"** — perguntar **por que o cliente não fechou** (texto obrigatório).
- [ ] **5.7 Novo lead** — nome, empresa, contato, **origem** (marketing, venda, indicação, outro), **nome do indicador** quando indicação, **quente/frio**, descrição, **responsável** (funcionário).
- [ ] **5.8 Insights** (`/comercial/insights`) — de onde chegam os leads (por origem e por indicador), taxa de conversão por origem, motivos de perda (lista e agrupamento), tudo lido do mesmo pipeline.
- [ ] **5.9 Vínculo** — Desempenho e Insights leem as mesmas tabelas (`leads`, `lead_stage_history`, view `seller_performance`); mudanças no pipeline refletem na hora.

## Épico 6 — Marketing

- [ ] **6.1 Página Marketing** (`/marketing`) — o pedido não detalha esta página. Entrega inicial: leads de origem marketing (volume por mês, conversão, quentes x frios) reaproveitando as consultas do Comercial. Escopo completo a definir com o Mateus.

## Épico 7 — Segurança

- [ ] **7.1** Revisar RLS de todas as tabelas e buckets com testes SQL simulando admin, gestor, funcionário, inativo e anônimo.
- [ ] **7.2** Revisar Server Actions: validação Zod, `requireRole` antes de qualquer escrita privilegiada, nenhum uso de service role fora de ações de admin.
- [ ] **7.3** Uploads: tipo e tamanho validados, nomes de arquivo saneados, caminhos gerados no servidor, downloads por URL assinada de curta duração.
- [ ] **7.4** Segredos: service role só no servidor (`server-only`), nada em `NEXT_PUBLIC_*` além de URL e publishable key, logs sem dados pessoais.
- [ ] **7.5** Rodar os advisors do Supabase e registrar o resultado em `docs/security.md`.
- [ ] **7.6** Recomendação de configuração: desativar cadastro público no Supabase Auth depois do primeiro acesso.

## Épico 8 — Qualidade e documentação

- [ ] **8.1** `pnpm check` (lint, tipos, testes, build) verde.
- [ ] **8.2** Testes Vitest para regras de negócio (dinheiro, CNPJ, validações do pipeline, cálculos de ranking/comissão).
- [ ] **8.3** Documentos do toolkit: `PRODUCT.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/architecture.md`, `docs/design.md`, `docs/onboarding.md`, `docs/quality.md`, `docs/setup.md`.
- [ ] **8.4** Navegar o app localmente (Playwright) nas páginas públicas e registrar evidência.

## Pendências que dependem do Mateus

- **Logos das adquirentes**: serão enviadas depois; os cards já aceitam upload de logo.
- **`SUPABASE_SERVICE_ROLE_KEY`**: necessária para criar logins de funcionários. Copiar do painel do Supabase (Project Settings → API Keys) para `.env.local` / variáveis da hospedagem.
- **Google Drive**: credenciais OAuth caso queira listar pastas do Drive dentro de Cursos.
- **Marketing**: detalhar o que a página deve conter.
