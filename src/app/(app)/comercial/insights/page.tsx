import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { LostReasons } from "@/features/comercial/components/insights/lost-reasons";
import { PeriodFilter } from "@/features/comercial/components/insights/period-filter";
import { ReferrerRanking } from "@/features/comercial/components/insights/referrer-ranking";
import { InsightsKpis, SourceBreakdown, TemperatureSplit } from "@/features/comercial/components/insights/source-breakdown";
import { getInsightsData } from "@/features/comercial/insights-queries";
import { PERIOD_LABELS, parsePeriodParam } from "@/features/comercial/lib/periods";
import { getStageLabels } from "@/features/comercial/queries";

export const metadata: Metadata = { title: "Insights" };

export default async function Page({ searchParams }: PageProps<"/comercial/insights">) {
  const period = parsePeriodParam((await searchParams).periodo);
  const [data, stageLabels] = await Promise.all([getInsightsData(period), getStageLabels()]);

  return (
    <>
      <PageHeader
        title="Insights"
        description={`Origem dos leads, indicadores e motivos de perda · ${PERIOD_LABELS[period].toLowerCase()}.`}
      />
      <div className="flex flex-col gap-6">
        <PeriodFilter period={period} basePath="/comercial/insights" />
        <InsightsKpis stats={data.sources} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <SourceBreakdown stats={data.sources} />
          <TemperatureSplit stats={data.sources} />
        </div>
        <ReferrerRanking referrers={data.referrers} />
        <LostReasons lost={data.lost} groups={data.reasonGroups} lostStageLabel={stageLabels.cliente_perdido} />
      </div>
    </>
  );
}
