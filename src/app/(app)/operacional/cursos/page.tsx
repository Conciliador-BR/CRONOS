import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Cursos" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Cursos"
      description="Cursos internos com módulos, aulas em vídeo e acompanhamento de progresso."
    />
  );
}
