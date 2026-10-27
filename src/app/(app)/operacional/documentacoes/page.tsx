import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { isManager, requireMember } from "@/lib/auth";
import { AcquirersGrid } from "@/features/operacional/documentacoes/components/acquirers-grid";
import { getAcquirers } from "@/features/operacional/documentacoes/queries";

export const metadata: Metadata = { title: "Documentações de API" };

export default async function Page() {
  const [profile, acquirers] = await Promise.all([requireMember(), getAcquirers()]);
  return (
    <>
      <PageHeader
        title="Documentações de API"
        description="Documentos e notas de integração de cada adquirente."
      />
      <AcquirersGrid acquirers={acquirers} canManage={isManager(profile)} />
    </>
  );
}
