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
| `/operacional/missoes` | Quadros (criar, renomear, cor de fundo, excluir) |
| `/operacional/missoes/[boardId]` | Listas e cartões com arrastar e soltar, detalhes do cartão, arquivados |
| `/operacional/agenda?visao=mes\|semana\|dia&data=aaaa-mm-dd` | Agenda; o servidor busca só o período visível |
| `/operacional/documentacoes` | Grade de adquirentes (gestor cria, edita, reordena, envia logo) |
| `/operacional/documentacoes/[acquirerId]` | Documentos (envio, download, exclusão) e notas com salvamento automático |
| `/operacional/cursos` | Vitrine de cursos com progresso; gestor cria cursos |
| `/operacional/cursos/[courseId]` | Página do curso; `?modo=editar` abre o modo gestor (curso, módulos, aulas) |
| `/operacional/cursos/[courseId]/aulas/[lessonId]` | Player, "Marcar como concluída", anterior/próxima |

## Estrutura

```
queries.ts                 API pública para outros módulos (server-only)
shared/                    Comum aos submódulos
  action-utils.ts          invalid(), failure() (log sem dados pessoais), requireManagerOrNull()
  result.ts                ActionResult<T> = { ok: true, ...T } | { ok: false, error, fieldErrors? }
  files.ts                 sanitizeFilename, buildStoragePath, isPathInFolder, limites, assinatura de imagem (testado)
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

## Pendências

- **Google Drive (TASKS 4.6):** listar os vídeos de uma pasta do Drive exige credenciais OAuth do Google no app. Por enquanto a aula aceita o link de um arquivo do Drive.
- Vídeo enviado e abandonado (formulário da aula cancelado depois do envio) fica no bucket sem dono. Ainda não há uma limpeza periódica.
- Reunião com vínculo opcional a um lead (`events.lead_id`) ainda não aparece no formulário.
- Reordenar módulos e aulas é feito pelos botões subir/descer (acessíveis por teclado), sem arrastar.
