# Comercial

Desempenho (dashboard e ranking), CRM (pipeline de leads com arrastar e soltar) e Insights (origens, conversão, motivos de perda). As abas ficam em `src/app/(app)/comercial/layout.tsx`.

**Responsável:** Dev sênior chefe.

## Dados

`leads`, `lead_stage_history` (preenchida por trigger ao mudar `stage`), `pipeline_stage_labels` (nomes exibidos das etapas), `sales_goals`, `profiles`, `teams` e a view `seller_performance`. Valores em centavos (`deal_value_cents`, `goal_cents`). Desempenho, Insights, Marketing e Início leem as mesmas tabelas; toda mutação chama `revalidatePath` para `/comercial/*`, `/marketing` e `/inicio`.

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

Rótulos e enums prontos para a interface: `constants.ts` (`SOURCE_LABELS`, `STAGE_LABELS`, `TEMPERATURE_LABELS`, `DEAL_TYPE_LABELS`). Os nomes das etapas são editáveis: para mostrá-los, use `getStageLabels(): Promise<Record<PipelineStage, string>>` (com `cache()`; etapa sem linha ou falha de leitura cai em `STAGE_LABELS`, que fica só como padrão). Formatação: `lib/format.ts` (`formatPercent`, `formatDate`) e `lib/months.ts` (`formatMonthLabel`, `lastMonths`, `toMonthKey`).

## Estrutura

```
src/features/comercial/
  constants.ts            Etapas, origens, temperaturas, tipos de negócio e rótulos
  types.ts                PipelineLead, MemberOption, StageHistoryEntry, ActionResult
  schemas.ts              Zod: lead (novo/edição), mover, fechar, perder, meta
  actions.ts              createLead, updateLead, moveLead, deleteLead (gestor), loadLeadHistory, setSalesGoal (gestor),
                          renameStage (gestor)
  queries.ts              getPipelineData, getActiveMembers, getStageLabels, getLeadHistory, getLeadSourceStats, getOpenLeadsCount
  performance-queries.ts  getPerformanceData(month)
  insights-queries.ts     getInsightsData(period)
  lib/                    Lógica pura com testes Vitest: meses, posições, ranking/comissão/meta, perdas (`lost.ts`),
                          transição de etapa, estatísticas de origem/indicadores/motivos, filtros do pipeline
  components/crm/         Quadro (dnd-kit), título da coluna renomeável, cards, modais de fechar/perder, novo lead, gaveta do lead
  components/shared/      Selos do lead e contexto dos nomes das etapas (`useStageLabels`)
  components/desempenho/  Seletor de mês, KPIs, ranking, meta x realizado, clientes perdidos, equipe, card do funcionário,
                          gráficos (faturamento x meta; fechados x perdidos)
  components/insights/    Filtro de período, origens, temperatura, indicadores, motivos de perda
```

## Regras do pipeline

- Posição fracionária (`lib/positions.ts`): mover um card grava só a linha dele (a RLS só deixa alterar leads próprios).
- `planStageMove` (`lib/stage-transition.ts`) monta a atualização: fechar exige tipo e valor e limpa o motivo; perder exige motivo e limpa o negócio; voltar para etapa aberta limpa os dois. `closed_at` é gravado pelo trigger.
- UI otimista: o card muda na hora e volta se o servidor recusar. Cancelar o modal de fechar/perder devolve o card.
- Arrastar: mouse (6 px), toque (segurar 200 ms) e teclado (alça ⋮⋮ + Espaço, setas, Espaço/Esc), com anúncios em português.
- Só o responsável, quem criou ou um gestor arrastam e editam o lead (o card dos outros fica só para leitura).
- Nomes das etapas: admin/gestor veem um lápis ("Renomear etapa") no título da coluna. Enter ou sair do campo salva, Esc cancela; o nome muda na hora e volta se o servidor recusar, com o erro ao lado do campo. Só o nome exibido muda (`renameStage` grava `pipeline_stage_labels`); regras de fechado/perdido, histórico e relatórios seguem pela etapa. O quadro passa os nomes por `StageLabelsProvider` (colunas, selos, histórico, modais e anúncios do arraste); Desempenho, Insights e Marketing recebem os nomes por prop.

## Regras gerais

- Páginas em `src/app/(app)/comercial` são finas: leem com as consultas e renderizam `components/`.
- Componentes cliente nunca importam `queries.ts`, `*-queries.ts`, `@/lib/auth` ou `@/lib/supabase/server`.
- Toda Server Action chama `requireMember()` (ou `requireRole(["admin", "gestor"])` para metas e exclusão), valida com Zod e devolve `{ ok: true } | { ok: false, error, fieldErrors? }`. Erros vão para o logger sem dados pessoais.
- Leituras paginam de 1.000 em 1.000 (`fetchAllRows`), o limite do PostgREST.
- Cores do gráfico em `components/desempenho/chart-colors.ts` (token `primary`, ciano da meta e laranja dos perdidos, validados para o fundo escuro).
