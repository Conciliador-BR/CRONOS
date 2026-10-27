# Comercial

Desempenho (dashboard e ranking), CRM (pipeline de leads com arrastar e soltar) e Insights (origens, conversão, motivos de perda). As abas ficam em `src/app/(app)/comercial/layout.tsx`.

**Responsável:** Dev sênior chefe.

## Dados

`pipeline_stages` (colunas do pipeline: nome, posição e tipo `aberto`/`fechado`/`perdido`), `leads` (`stage_id` aponta para a coluna; o enum `stage` é derivado pelo trigger `leads_sync_stage`), `lead_stage_history` (preenchida por trigger ao mudar de coluna, com `from_stage_id`/`to_stage_id`), `sales_goals`, `profiles`, `teams` e a view `seller_performance`. Valores em centavos (`deal_value_cents`, `goal_cents`). Desempenho, Insights, Marketing e Início leem as mesmas tabelas; toda mutação chama `revalidatePath` para `/comercial/*`, `/marketing` e `/inicio`.

Clientes perdidos (Desempenho): leads em `cliente_perdido` com `closed_at` no mês (o trigger grava `closed_at` ao entrar na etapa; é a mesma data que Insights usa). Taxa de perda = perdidos ÷ (fechados + perdidos), `null` (exibido "—") sem negócios decididos. Não há valor estimado de lead no schema (`deal_value_cents` só existe em fechados), então não mostramos valor perdido. A lista linka para `/comercial/crm?lead=<id>`, que abre a gaveta do lead e limpa o parâmetro.

Meses são contados no fuso de São Paulo (UTC−03:00): um negócio fechado às 22h do dia 31 conta naquele mês.

## Consultas para outros módulos (`queries.ts`, server-only)

Assinaturas estáveis. Importe só em Server Components ou Server Actions.

```ts
import { getLeadSourceStats, getOpenLeadsCount, type LeadSourceStats } from "@/features/comercial/queries";

type LeadStatsRange = { from?: Date | string; to?: Date | string }; // por created_at; `to` exclusivo

getLeadSourceStats(range?: LeadStatsRange): Promise<LeadSourceStats>
getOpenLeadsCount(): Promise<number> // leads fora de "Cliente fechado" e "Cliente perdido"
```

`LeadSourceStats` (de `lib/lead-stats.ts`):

```ts
type Counts = { total; won; lost; open; quente; frio }            // números inteiros
LeadSourceStats = Counts & {
  conversionRate: number                                          // won ÷ total (0–1)
  bySource: (Counts & { source; share; conversionRate })[]        // sempre as 4 origens, ordem de LEAD_SOURCES
  byMonth: (Counts & { month: "AAAA-MM"; conversionRate; sources: Record<LeadSource, Counts> })[]
}
```

Exemplo para Marketing: `stats.bySource.find(s => s.source === "marketing")` e `stats.byMonth.map(m => m.sources.marketing)`.

Rótulos e enums prontos para a interface: `constants.ts` (`SOURCE_LABELS`, `STAGE_LABELS`, `TEMPERATURE_LABELS`, `DEAL_TYPE_LABELS`). As etapas são linhas editáveis: use `getPipelineStages(): Promise<StageColumn[]>` (com `cache()`, em ordem) ou `getTerminalStageLabels()` para os nomes atuais de fechado/perdido. `STAGE_LABELS` fica só como reserva (coluna excluída no histórico). Leads continuam com o enum `stage` derivado da coluna, então "fechado/perdido/aberto" segue valendo nas consultas por `stage`. Formatação: `lib/format.ts` (`formatPercent`, `formatDate`) e `lib/months.ts` (`formatMonthLabel`, `lastMonths`, `toMonthKey`).

## Estrutura

```
src/features/comercial/
  constants.ts            Etapas, origens, temperaturas, tipos de negócio e rótulos
  types.ts                PipelineLead, MemberOption, StageHistoryEntry, ActionResult
  schemas.ts              Zod: lead (novo/edição), mover, fechar, perder, meta, colunas (criar, renomear, mover, excluir)
  actions.ts              createLead, updateLead, moveLead, deleteLead (gestor), loadLeadHistory, setSalesGoal (gestor)
  stage-actions.ts        createStage, renameStage, moveStage, deleteStage (gestor)
  action-helpers.ts       Erros amigáveis, revalidação e checagem de gestor (server-only)
  queries.ts              getPipelineData, getPipelineStages, getTerminalStageLabels, getActiveMembers, getLeadHistory,
                          getLeadSourceStats, getOpenLeadsCount
  performance-queries.ts  getPerformanceData(month)
  insights-queries.ts     getInsightsData(period)
  lib/                    Lógica pura com testes Vitest: meses, posições, ranking/comissão/meta, perdas (`lost.ts`),
                          transição de etapa, colunas (`stages.ts`: posições, exclusão, nomes), estatísticas de origem/indicadores/motivos, filtros do pipeline
  components/crm/         Quadro (dnd-kit), coluna com menu ⋯, "+ Nova etapa", modal de excluir etapa, cards, modais de
                          fechar/perder, novo lead, gaveta do lead
  components/shared/      Selos do lead e contexto das colunas (`useStages`: `labelOf`, `terminal`, `firstOpen`)
  components/desempenho/  Seletor de mês, KPIs, ranking, meta x realizado, clientes perdidos, equipe, card do funcionário,
                          gráficos (faturamento x meta; fechados x perdidos)
  components/insights/    Filtro de período, origens, temperatura, indicadores, motivos de perda
```

## Regras do pipeline

- Posição fracionária (`lib/positions.ts`): mover um card grava só a linha dele (a RLS só deixa alterar leads próprios).
- `planStageMove` (`lib/stage-transition.ts`) monta a atualização pelo **tipo** da coluna de destino (lido do banco): fechar exige tipo e valor e limpa o motivo; perder exige motivo e limpa o negócio; ir para coluna aberta limpa os dois. Grava `stage_id`; o enum `stage` e `closed_at` são gravados pelos triggers.
- UI otimista: o card muda na hora e volta se o servidor recusar. Cancelar o modal de fechar/perder devolve o card.
- Arrastar: mouse (6 px), toque (segurar 200 ms) e teclado (alça ⋮⋮ + Espaço, setas, Espaço/Esc), com anúncios em português.
- Só o responsável, quem criou ou um gestor arrastam e editam o lead (o card dos outros fica só para leitura).
- Colunas (só admin/gestor; funcionário não vê controles): "+ Nova etapa" fica antes da primeira coluna de fechado/perdido, com o nome digitado ali mesmo (Enter cria, Esc cancela). O menu ⋯ de cada coluna tem Renomear (campo no título: Enter ou sair salva, Esc cancela), Mover para a esquerda/direita (posição fracionária entre as vizinhas) e Excluir etapa. Criar, renomear e mover são otimistas e voltam se o servidor recusar.
- Excluir etapa abre um modal: se a coluna tiver leads, é preciso escolher outra coluna **aberta** para eles ("Os N leads desta etapa vão para…"); `deleteStage` move os leads (o histórico registra) e depois apaga a coluna. Fechado e perdido podem ser renomeados e movidos, mas não excluídos; o banco também impede apagar a última coluna aberta. Se a exclusão falhar depois de mover os leads, eles ficam na coluna de destino e a coluna continua (dá para tentar de novo).
- Lead novo entra no topo da primeira coluna aberta. O quadro passa as colunas por `StagesProvider` (colunas, selos, histórico, modais e anúncios do arraste); Desempenho, Insights e Marketing recebem os nomes por prop. `pipeline_stage_labels` ficou obsoleta (não é mais lida nem gravada).

## Regras gerais

- Páginas em `src/app/(app)/comercial` são finas: leem com as consultas e renderizam `components/`.
- Componentes cliente nunca importam `queries.ts`, `*-queries.ts`, `@/lib/auth` ou `@/lib/supabase/server`.
- Toda Server Action chama `requireMember()` (ou `requireRole(["admin", "gestor"])` para metas, exclusão e colunas), valida com Zod e devolve `{ ok: true } | { ok: false, error, fieldErrors? }`. Erros vão para o logger sem dados pessoais.
- Leituras paginam de 1.000 em 1.000 (`fetchAllRows`), o limite do PostgREST.
- Cores do gráfico em `components/desempenho/chart-colors.ts` (token `primary`, ciano da meta e laranja dos perdidos, validados para o fundo escuro).
