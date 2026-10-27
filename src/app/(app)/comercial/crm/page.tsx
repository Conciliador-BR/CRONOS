import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PipelineBoard } from "@/features/comercial/components/crm/pipeline-board";
import { terminalLabels } from "@/features/comercial/lib/stages";
import { getPipelineData } from "@/features/comercial/queries";

export const metadata: Metadata = { title: "CRM" };

export default async function Page() {
  const { leads, members, currentUserId, canManage, stages } = await getPipelineData();
  const first = stages.find((stage) => stage.kind === "aberto")?.label ?? "a primeira etapa";
  const { fechado, perdido } = terminalLabels(stages);
  return (
    <>
      <PageHeader
        title="CRM"
        description={`Pipeline de leads: arraste os cards de ${first} até ${fechado} ou ${perdido}.`}
      />
      <PipelineBoard
        leads={leads}
        members={members}
        currentUserId={currentUserId}
        canManage={canManage}
        stages={stages}
      />
    </>
  );
}
