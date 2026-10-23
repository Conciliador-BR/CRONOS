import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Times" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Times"
      description="Times usados no cadastro de funcionários e no desempenho comercial."
    />
  );
}
