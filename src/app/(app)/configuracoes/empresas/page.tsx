import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Empresas e clientes" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Empresas e clientes"
      description="Cadastro de empresas, ECs, contas bancárias, documentos e clientes vinculados."
    />
  );
}
