import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyDocuments } from "@/features/configuracoes/components/company-documents";
import { CompanyForm } from "@/features/configuracoes/components/company-form";
import { DeleteCompanyButton } from "@/features/configuracoes/components/delete-company-button";
import { getClientOptions, getCompanyForEdit, getMatrizOptions } from "@/features/configuracoes/queries";
import { marketLabel } from "@/features/empresas/map-utils";

export const metadata: Metadata = { title: "Editar empresa" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ criada?: string }>;
}) {
  const [{ id }, { criada }] = await Promise.all([params, searchParams]);
  if (!z.uuid().safeParse(id).success) notFound();
  const [company, clientOptions, matrizOptions] = await Promise.all([
    getCompanyForEdit(id),
    getClientOptions(),
    getMatrizOptions(id),
  ]);
  if (!company) notFound();
  const name = marketLabel(company);

  return (
    <>
      <PageHeader title={name} description="Edite os dados, CNAE, matriz/filial, localização, ECs, contas, cliente e PDFs da empresa.">
        <DeleteCompanyButton companyId={company.id} name={name} />
      </PageHeader>
      {criada ? (
        <Alert tone="success" title="Empresa cadastrada" className="mb-6">
          Agora você pode anexar os PDFs abaixo.
        </Alert>
      ) : null}
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Documentos (PDF)</CardTitle>
            <CardDescription>Visíveis e baixáveis só por administradores e gestores.</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyDocuments companyId={company.id} documents={company.documents} />
          </CardContent>
        </Card>
        <CompanyForm company={company} clientOptions={clientOptions} matrizOptions={matrizOptions} />
      </div>
    </>
  );
}
