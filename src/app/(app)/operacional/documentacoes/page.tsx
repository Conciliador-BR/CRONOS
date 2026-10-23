import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Documentações de API" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Documentações de API"
      description="Documentos e notas de integração de cada adquirente."
    />
  );
}
