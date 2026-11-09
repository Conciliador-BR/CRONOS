import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { isManager, requireMember } from "@/lib/auth";
import { ProgressBoard } from "@/features/operacional/documentacoes/components/progress-board";
import { getProgressBoard } from "@/features/operacional/documentacoes/progress-queries";

export const metadata: Metadata = { title: "Progresso · Documentações de API" };

export default async function Page() {
  const [profile, data] = await Promise.all([requireMember(), getProgressBoard()]);
  return (
    <>
      <PageHeader title="Progresso" description="Em que etapa cada empresa está em cada adquirente. Clique na empresa para mudar a etapa." />
      <ProgressBoard {...data} canManage={isManager(profile)} />
    </>
  );
}
