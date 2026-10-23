# CRONOS

## Problema e objetivo

A equipe usa ferramentas separadas para tarefas (Trello), reuniões (Google Agenda), documentação (Notion), treinamento (Hotmart/Hubla) e vendas (HubSpot). Isso espalha informação e impede uma visão única de clientes, operação e resultado comercial. O CRONOS reúne tudo em um CRM interno, com identidade visual preto e azul.

## Público e papéis

- **Admin**: configura o sistema, cadastra empresas, clientes e funcionários (com login), define comissão e metas.
- **Gestor**: igual ao admin para cadastros e metas, mas não altera papéis nem ativa contas.
- **Funcionário**: usa Operacional e Comercial; vê empresas sem dados bancários.
- Conta **inativa** (criada fora do fluxo do admin) não acessa nada.

## Fluxos da primeira versão

1. Apresentação → login → página inicial com atalhos.
2. Empresas: mapa do Brasil com estados atendidos → card com mercados do estado → informações do cliente.
3. Configurações: cadastrar empresa (CNPJ, ECs, contas bancárias, PDF, endereço) e cliente; cadastrar funcionário com login.
4. Operacional (menu ≡ no canto superior esquerdo): Missões estilo Trello, Agenda estilo Google Agenda, Documentações de API por adquirente (anexos + bloco de notas), Cursos estilo Hotmart/Hubla.
5. Comercial: pipeline (lead recebido → diagnóstico → reunião → follow up → fechado/perdido) com perguntas ao fechar/perder; Desempenho (faturamento, equipe, ranking, metas, card do funcionário com gráfico); Insights (origem dos leads, indicadores, motivos de perda).

## MVP

Todos os fluxos acima. Detalhamento e responsáveis em [TASKS.md](TASKS.md).

## Fora do escopo agora

- Listagem de pastas do Google Drive dentro de Cursos (precisa de credencial OAuth do Google). Aulas aceitam link do Drive.
- Conteúdo detalhado da página Marketing (entrega inicial usa os leads de origem marketing).
- Notificações por e-mail/WhatsApp, multiempresa (multi-tenant) e app mobile.

## Requisitos

- Interface em português do Brasil, responsiva, acessível por teclado, contraste adequado no tema escuro.
- Valores em reais armazenados em centavos inteiros.
- CNPJ validado pelos dígitos verificadores; UF obrigatória para posicionar no mapa.
- Fechar negócio exige tipo (consultoria avançada ou somente sistema) e valor; perder exige motivo. O banco garante essas regras com `check`.
- Indicação exige nome do indicador.
- Arquivos privados, baixados por URL assinada.

## Restrições e decisões técnicas

- Next.js 16 (App Router), TypeScript estrito, Tailwind 4, pnpm.
- **Supabase** (Postgres + Auth + Storage) em vez do padrão Drizzle do toolkit: o produto precisa de login por funcionário, upload de arquivos e autorização por linha (RLS). Migrations em SQL versionado em `supabase/migrations/`.
- Projeto Supabase `cronos` (ref `cnwflsucwedbmfltbeht`, sa-east-1, plano free: arquivos até 50 MB).

## Suposições e decisões pendentes

- Suposição: o primeiro usuário criado é o dono (admin). Reversível pelo painel.
- Suposição: todos os funcionários veem o pipeline inteiro (necessário para ranking e insights); só dono do lead, criador ou gestor altera.
- Pendente: chave `SUPABASE_SERVICE_ROLE_KEY` para criar logins de funcionários.
- Pendente: logos das adquirentes (enviadas depois pelo Mateus).

## Critérios de aceite

- Usuário sem login é redirecionado para `/login` em qualquer rota interna.
- Funcionário comum não vê dados bancários nem PDFs de empresas, nem acessa Configurações.
- Arrastar lead para "Cliente fechado" só conclui após informar tipo e valor; para "Cliente perdido", após informar o motivo.
- Desempenho e Insights refletem o pipeline sem cadastro duplicado.
- Estado com empresa cadastrada aparece destacado no mapa e lista os mercados ao clicar.

## Manutenção

Atualize este documento quando objetivo, escopo, restrições ou critérios mudarem. Decisões técnicas detalhadas ficam em `docs/architecture.md` e evidências em `docs/setup.md`.
