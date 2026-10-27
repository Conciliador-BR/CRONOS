import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { MarketingView } from "@/features/marketing/components/marketing-view";
import { getMarketingLeads } from "@/features/marketing/queries";
import { getStageLabels } from "@/features/comercial/queries";

export const metadata: Metadata = { title: "Marketing" };

export default async function Page() {
  const [leads, stageLabels] = await Promise.all([getMarketingLeads(), getStageLabels()]);
  return (
    <>
      <PageHeader title="Marketing" description="Leads de origem marketing: volume por mês, conversão e quentes x frios." />
      <MarketingView leads={leads} now={new Date()} stageLabels={stageLabels} />
    </>
  );
}
