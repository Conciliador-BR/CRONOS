import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { KpiTiles } from "@/features/comercial/components/desempenho/kpi-tiles";
import { LostClients } from "@/features/comercial/components/desempenho/lost-clients";
import { MonthSelector } from "@/features/comercial/components/desempenho/month-selector";
import { GoalsOverview, SellerRanking } from "@/features/comercial/components/desempenho/ranking-and-goals";
import { TeamGrid } from "@/features/comercial/components/desempenho/team-grid";
import { formatMonthLabel, parseMonthParam, toMonthKey } from "@/features/comercial/lib/months";
import { getPerformanceData } from "@/features/comercial/performance-queries";
import { getTerminalStageLabels } from "@/features/comercial/queries";

export const metadata: Metadata = { title: "Desempenho" };

export default async function Page({ searchParams }: PageProps<"/comercial/desempenho">) {
  const month = parseMonthParam((await searchParams).mes);
  const [data, stageLabels] = await Promise.all([getPerformanceData(month), getTerminalStageLabels()]);
  const monthLabel = formatMonthLabel(month);

  return (
    <>
      <PageHeader title="Desempenho" description={`Faturamento, ranking, metas e clientes perdidos da equipe em ${monthLabel}.`}>
        <MonthSelector month={month} currentMonth={toMonthKey(new Date())} basePath="/comercial/desempenho" />
      </PageHeader>
      <div className="flex flex-col gap-6">
        <KpiTiles kpis={data.kpis} monthLabel={monthLabel} />
        <div className="grid gap-6 lg:grid-cols-2">
          <SellerRanking sellers={data.sellers} monthLabel={monthLabel} />
          <GoalsOverview sellers={data.sellers} monthLabel={monthLabel} />
        </div>
        <LostClients lost={data.lostClients} monthLabel={monthLabel} lostStageLabel={stageLabels.perdido} />
        <section aria-labelledby="equipe" className="flex flex-col gap-3">
          <div>
            <h2 id="equipe" className="text-lg font-semibold">
              Equipe
            </h2>
            <p className="text-sm text-muted">
              Clique em um funcionário para ver clientes convertidos e perdidos, comissão e desempenho mês a mês.
            </p>
          </div>
          <TeamGrid sellers={data.sellers} month={month} canManage={data.canManage} allTime={data.allTime} />
        </section>
      </div>
    </>
  );
}
