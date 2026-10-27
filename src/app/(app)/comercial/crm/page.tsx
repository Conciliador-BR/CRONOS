import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PipelineBoard } from "@/features/comercial/components/crm/pipeline-board";
import { getPipelineData } from "@/features/comercial/queries";

export const metadata: Metadata = { title: "CRM" };

export default async function Page() {
  const { leads, members, currentUserId, canManage, stageLabels } = await getPipelineData();
  return (
    <>
      <PageHeader
        title="CRM"
        description={`Pipeline de leads: arraste os cards de ${stageLabels.lead_recebido} até ${stageLabels.cliente_fechado} ou ${stageLabels.cliente_perdido}.`}
      />
      <PipelineBoard
        leads={leads}
        members={members}
        currentUserId={currentUserId}
        canManage={canManage}
        stageLabels={stageLabels}
      />
    </>
  );
}
