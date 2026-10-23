import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Empresas" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Empresas"
      description="Mapa do Brasil com os estados atendidos; clique num estado para ver os mercados e os dados de cada cliente."
    />
  );
}
