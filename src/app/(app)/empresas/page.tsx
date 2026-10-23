import type { Metadata } from "next";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { toUf } from "@/features/empresas/brazil-states";
import { CompanyDetailDrawer } from "@/features/empresas/components/company-detail-drawer";
import { EmpresasExplorer } from "@/features/empresas/components/empresas-explorer";
import { getCompanyDetail, getCompanySummaries } from "@/features/empresas/queries";

export const metadata: Metadata = { title: "Empresas" };

type SearchParams = Promise<{ uf?: string | string[]; empresa?: string | string[] }>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const uf = toUf(first(params.uf));
  const companyParam = z.uuid().safeParse(first(params.empresa));
  const companyId = companyParam.success ? companyParam.data : null;

  const [companies, detail] = await Promise.all([
    getCompanySummaries(),
    companyId ? getCompanyDetail(companyId) : Promise.resolve(null),
  ]);
  const missing = first(params.empresa) !== undefined && detail === null;

  return (
    <>
      <PageHeader
        title="Empresas"
        description="Estados atendidos em destaque. Escolha um estado para ver os mercados e abra um mercado para ver os dados do cliente."
      />
      {missing ? (
        <Alert tone="warning" title="Empresa não encontrada" className="mb-4">
          O link pode estar desatualizado ou a empresa foi excluída.
        </Alert>
      ) : null}
      <EmpresasExplorer companies={companies} initialUf={uf} activeCompanyId={detail?.company.id ?? null} />
      <CompanyDetailDrawer detail={detail} closeHref={uf ? `/empresas?uf=${uf}` : "/empresas"} />
    </>
  );
}
