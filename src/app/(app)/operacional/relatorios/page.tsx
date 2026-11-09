import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SheetsGrid } from "@/features/operacional/relatorios/components/sheets-grid";
import { getReportSheets } from "@/features/operacional/relatorios/queries";

export const metadata: Metadata = { title: "Semana de relatório" };

export default async function Page() {
  const sheets = await getReportSheets();
  return (
    <>
      <PageHeader
        title="Semana de relatório"
        description="Tabelas de acompanhamento por empresa, com status, responsáveis, prazos e progresso."
      />
      <SheetsGrid sheets={sheets} />
    </>
  );
}
