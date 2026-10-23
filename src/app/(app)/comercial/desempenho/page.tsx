import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Desempenho" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Desempenho"
      description="Faturamento, ranking de vendas e meta x realizado por funcionário."
    />
  );
}
