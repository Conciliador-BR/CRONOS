import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs } from "@/components/ui/tabs";
import { ClientManager } from "@/features/configuracoes/components/client-manager";
import { CompanyList } from "@/features/configuracoes/components/company-list";
import { getClients, getCompanyList } from "@/features/configuracoes/queries";

export const metadata: Metadata = { title: "Empresas e clientes" };

export default async function Page({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const [{ aba }, companies, clients] = await Promise.all([searchParams, getCompanyList(), getClients()]);

  return (
    <>
      <PageHeader
        title="Empresas e clientes"
        description="Cadastre empresas (CNPJ, endereço, ECs, contas e PDFs) e os clientes vinculados."
      />
      <Tabs
        label="Cadastros"
        defaultValue={aba === "clientes" ? "clientes" : "empresas"}
        items={[
          { value: "empresas", label: `Empresas (${companies.length})`, content: <CompanyList companies={companies} /> },
          { value: "clientes", label: `Clientes (${clients.length})`, content: <ClientManager clients={clients} /> },
        ]}
      />
    </>
  );
}
