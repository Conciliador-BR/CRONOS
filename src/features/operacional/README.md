# Operacional

Missões (estilo Trello), Agenda (estilo Google Agenda), Documentações de API das adquirentes e Cursos (estilo Hotmart/Hubla). O layout com o botão ≡ fica em `src/app/(app)/operacional/layout.tsx`.

**Responsável:** Dev Operacional.

## Consultas reaproveitáveis (`queries.ts`)

Outros módulos (ex.: Início) importam só daqui. Assinaturas estáveis; mudanças são anunciadas neste README.

```ts
import { getUpcomingEvents, getMyOpenCards } from "@/features/operacional/queries";

getUpcomingEvents(limit: number): Promise<UpcomingEvent[]>
// Reuniões da equipe que ainda não terminaram, por início.
// { id, title, startsAt, endsAt, allDay, color, location, meetingUrl, href }  (href abre a agenda no dia)

getMyOpenCards(limit: number): Promise<MyOpenCard[]>
// Cartões atribuídos ao usuário logado, não arquivados e não concluídos; com prazo primeiro.
// { id, title, dueAt, boardId, boardName, listName, href }  (href abre o quadro)
```

`limit` é limitado a 1–50. Datas em ISO (UTC). Para exibir, use `formatShortDate`/`formatTime` de `shared/tz.ts` (fuso de Brasília), igual ao restante do módulo.

## Rotas

| Rota | Conteúdo |
|---|---|
| `/operacional/missoes` | Quadros (criar, renomear, cor e imagem de fundo, excluir) e papel de parede de cada usuário |
| `/operacional/missoes/[boardId]` | Listas e cartões com arrastar e soltar, concluir no cartão, fotos e capa, capa da lista (`list-cover.tsx`, `board_lists.cover_path`, bucket `wallpapers` em `boards/<id>/lists/`; "Ajustar posição" arrasta a foto ou usa as setas para enquadrar, salvo em `board_lists.cover_position` 0–100), imagem de fundo, mudar de quadro, arquivados |
| `/operacional/agenda?visao=mes\|semana\|dia&data=aaaa-mm-dd` | Agenda; o servidor busca só o período visível |
| `/operacional/documentacoes` | Grade de adquirentes (gestor cria, edita, reordena, envia logo) |
| `/operacional/documentacoes/[acquirerId]` | Documentos (envio, download, exclusão) e notas com salvamento automático |
| `/operacional/documentacoes/progresso` | Aba Progresso: pipeline com uma coluna por adquirente e todas as empresas; clique muda a etapa (Enviado para documentação → Assinado → Enviado para liberar → Automático); barras de % automático por adquirente e geral; logo da adquirente (gestor envia pelo ícone da coluna); cada empresa abre um detalhe com etapa, anotação, anexos (bucket `acquirer-docs`, pasta `progress/<adquirente>/<empresa>`, tabela `acquirer_progress_files`) e "Remover desta adquirente" (`removed`, restaurável no fim da coluna). Seleção em lote: a bolinha que aparece ao passar o mouse no card marca a empresa; com seleção, a coluna mostra "Selecionar todas", "Mudar etapa…" e a lixeira (remover, com confirmação), gravados numa só Server Action (`setAcquirerProgressBulk`). Migrations `20261030120000` e `20261030140000` |
| `/operacional/cursos` | Vitrine de cursos com progresso; gestor cria cursos |
| `/operacional/cursos/[courseId]` | Página do curso; `?modo=editar` abre o modo gestor (curso, módulos, aulas) |
| `/operacional/cursos/[courseId]/aulas/[lessonId]` | Player, "Marcar como concluída", anterior/próxima |
| `/operacional/relatorios` | Semana de relatório: tabelas no estilo Notion |
| `/operacional/relatorios/[sheetId]` | Painel de % concluído por Status, colunas tipadas, coluna Empresa com adição automática opcional |

## Estrutura

```
queries.ts                 API pública para outros módulos (server-only)
shared/                    Comum aos submódulos
  action-utils.ts          invalid(), failure() (log sem dados pessoais), requireManagerOrNull()
  result.ts                ActionResult<T> = { ok: true, ...T } | { ok: false, error, fieldErrors? }
  files.ts                 sanitizeFilename, buildStoragePath, isPathInFolder, limites, assinatura de imagem, checkCardImage (testado)
  image-upload.ts          Leitura/validação de imagem recebida por FormData (server-only)
  members.ts               Funcionários ativos com foto assinada
  position.ts              Posições double (ponto médio entre vizinhos) (testado)
  tz.ts                    Datas no fuso de Brasília (testado)
  colors.ts, color-picker.tsx
missoes/   agenda/   documentacoes/   cursos/
  queries.ts (server-only) · *-actions.ts ("use server") · schemas.ts (Zod) · types.ts · components/ · *.test.ts
```

## Decisões

- **Fuso de Brasília fixo (UTC−3, sem horário de verão).** Formatação e conversão de horários usam `shared/tz.ts`, então o HTML do servidor e o do navegador batem (sem erro de hidratação). Os formulários avisam "Horário de Brasília".
- **Missões:** estado do quadro normalizado no cliente (`board-state.ts`, testado) dentro de `BoardProvider` (`{ state, meta, ui, actions }`). Toda mudança é otimista e é desfeita se a Server Action falhar. Arrastar só grava a nova posição (sem revalidar a página); as demais ações revalidam e o estado volta a refletir o servidor. Sensores de ponteiro e teclado (Espaço pega, setas movem, Espaço/Enter solta, Esc cancela; Enter abre o cartão) com anúncios em português.
- **Agenda:** "dia inteiro" guarda fim exclusivo (meia-noite do dia seguinte). Editar e excluir: só quem criou ou gestor (botões escondidos; a ação confere antes e a RLS garante). Os convidados entram na mesma sessão de quem cria o evento, como a RLS de `event_attendees` exige.
- **Uploads grandes direto ao Storage:** documentos (até 50 MB) e vídeos (até 50 MB) usam `createSignedUploadUrl` em uma Server Action (depois de `requireMember`/`requireRole`). O caminho `<pasta>/<uuid>-<nome-saneado>` é gerado no servidor. Depois do envio, uma segunda ação confere pasta, tamanho e tipo reais (`storage.info`) antes de gravar a linha; se não passar, o arquivo é apagado. Logos e capas (até 2 MB) vão por FormData e passam pela checagem de tipo, tamanho e assinatura dos bytes.
- **Downloads:** URL assinada de 60 s com o nome original do arquivo (`download`).
- **Capas de curso:** bucket privado `course-covers` (migration `20261023190000_operacional_course_covers.sql`: imagens até 2 MB; membros leem, gestores enviam e removem).
- **Vídeos de aula:** `video.ts` (testado) só aceita links `https` do YouTube (watch, youtu.be, embed, shorts, live) e de arquivos do Drive (`/file/d/<id>`, `open?id=`, `uc?id=`). Os players são `youtube-nocookie.com/embed/<id>` e `drive.google.com/file/d/<id>/preview`.

- **Cartão (rosto):** a superfície de arrastar/abrir é um elemento atrás do visual; a bolinha "Marcar como concluída" (`card-complete-toggle.tsx`, `aria-pressed`) e o menu "…" (`card-quick-menu.tsx`, Popover API, setas/Home/End/Esc) ficam por cima e não iniciam arrasto. Concluir e arquivar usam `use-card-commands.ts` (otimista). "Mudar de quadro" no menu abre o modal com o seletor de quadro/lista já aberto (`openCard(id, "move")`).
- **Fotos dos cartões** (`attachment-actions.ts`, migration `20261026120000_feedback_cnae_filiais_fotos.sql`): bucket privado `card-images`, caminho `<card_id>/<uuid>.<ext>`. Envio por FormData (uma foto por chamada; o cliente envia várias em sequência) com tipo, tamanho (10 MB) e assinatura dos bytes conferidos no servidor. A primeira foto vira capa. As ações conferem que o cartão está no quadro e a foto no cartão antes de definir capa ou excluir; excluir apaga a linha (RLS: quem enviou ou gestor) e depois o arquivo. O quadro assina as capas em lote (`createSignedUrls`, 1 h) e conta as fotos de cada cartão; a lista completa só carrega ao abrir o cartão.
- **Fundos** (`background-actions.ts`, `backgrounds.ts` testado; migration `20261027180000_pipeline_stages_wallpapers.sql`): bucket privado `wallpapers`. O papel de parede da página é por usuário (`user_preferences.missions_wallpaper_path`, caminho `users/<auth.uid>/<uuid>.<ext>`); a imagem do quadro é colaborativa (`boards.background_image_path`, `boards/<board_id>/<uuid>.<ext>`). Envio por FormData com tipo, tamanho (10 MB) e assinatura dos bytes conferidos; o caminho é gerado no servidor e o arquivo anterior é apagado depois de gravar o novo (melhor esforço: se a RLS negar, por exemplo fundo enviado por outra pessoa sem ser gestor, fica um log `warn` e o arquivo sobra). As consultas assinam as URLs (1 h) em lote; no cliente `useStableImageUrl` mantém a mesma URL enquanto o caminho não muda, para a foto não ser baixada de novo a cada revalidação.
- **Lembretes:** o módulo `src/features/lembretes` lê `events`/`event_attendees` e `cards`/`card_assignees` diretamente (só leitura) para o sino da barra superior.
- **Semana de relatório** (`relatorios/`, rotas `/operacional/relatorios` e `/operacional/relatorios/[sheetId]`; migration `20261028120000_report_sheets.sql`): tabelas no estilo Notion. Modelo: `report_sheets` (tabela), `report_properties` (colunas tipadas; opções de select/multi_select/status em jsonb), `report_rows` (linhas, com `company_id` opcional) e `report_cells` (um valor jsonb por linha e coluna, com FKs compostas que garantem a mesma tabela). O servidor valida cada valor pelo tipo da coluna (`values.ts`, `cellValueSchema`) e a leitura é defensiva (`readCellValue`: valor corrompido ou opção apagada vira vazio). Colunas calculadas (ID, criado/editado em/por) não têm célula. A coluna Empresa liga a linha a uma empresa cadastrada e, se o usuário quiser, uma trigger em `companies` adiciona sozinha as empresas novas (`auto_add_companies`; `report_sync_companies` traz as já existentes). O painel de progresso (`progress.ts`, `computeOverallProgress`) mostra uma barra só para a semana: soma as células de todas as colunas Status nos grupos "A fazer", "Em andamento" e "Concluído"; célula sem valor ou com opção apagada conta como "A fazer". A coluna Empresa mostra "Matriz" ou "Filial 02, 03…" (`company-label.ts`: `branch_number` do cadastro ou, sem ele, a ordem do CNPJ) e a cidade/UF. "Concluído" no menu "+" é um atalho para uma Caixa de seleção com esse nome (não entra na barra); marcada, pinta a linha de verde-claro. A alça de preencher (quadradinho no canto da célula, `use-fill-handle.ts`) copia o valor para as linhas arrastadas numa só Server Action (`fillCells`); não vale para Empresa nem colunas calculadas. O ranking de Pessoas usa medalhas de ouro, prata e bronze. O cartão Pessoas (`computePeopleProgress`) ranqueia quem aparece em colunas Pessoa: cada célula de Status das linhas da pessoa é uma tarefa, e o % é concluídas ÷ tarefas. Excluir a tabela: só quem criou ou gestor (RLS). Endurecimento (`20261028130000_report_sheets_hardening.sql`): tipo e tabela da coluna são fixos, linha não muda de tabela, limite de 2000 linhas e 50 colunas por tabela (a trigger de empresas pula tabelas cheias) e excluir uma empresa apaga a linha dela.

## Pendências

- **Google Drive (TASKS 4.6):** listar os vídeos de uma pasta do Drive exige credenciais OAuth do Google no app. Por enquanto a aula aceita o link de um arquivo do Drive.
- Vídeo enviado e abandonado (formulário da aula cancelado depois do envio) fica no bucket sem dono. Ainda não há uma limpeza periódica.
- Reunião com vínculo opcional a um lead (`events.lead_id`) ainda não aparece no formulário.
- Reordenar módulos e aulas é feito pelos botões subir/descer (acessíveis por teclado), sem arrastar.
- Semana de relatório: colunas se arrastam pelo cabeçalho (`sortable-header.tsx`; teclado pela alça ⋮⋮) e linhas pela alça ⋮⋮ do começo da linha (`sortable-row.tsx`); falta largura de coluna (`width` já existe no servidor); tipos Arquivos e mídia, Relação, Rollup, Fórmula, Botão, Local e IA; visões salvas.
