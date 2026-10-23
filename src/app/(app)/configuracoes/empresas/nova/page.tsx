import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { CompanyForm } from "@/features/configuracoes/components/company-form";
import { getClientOptions } from "@/features/configuracoes/queries";

export const metadata: Metadata = { title: "Nova empresa" };

export default async function Page() {
  const clientOptions = await getClientOptions();
  return (
    <>
      <PageHeader title="Nova empresa" description="Campos com * são obrigatórios." />
      <Alert tone="info" className="mb-6">
        Os PDFs da empresa são anexados logo depois de salvar o cadastro.
      </Alert>
      <CompanyForm company={null} clientOptions={clientOptions} />
    </>
  );
}
