import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Início" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Início"
      description="Atalhos para os módulos e resumo do dia: empresas cadastradas, leads abertos, próximas reuniões e suas missões."
    />
  );
}
