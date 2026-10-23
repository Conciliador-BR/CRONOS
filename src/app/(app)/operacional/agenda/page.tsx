import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Agenda" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Agenda"
      description="Reuniões e compromissos da equipe nas visões de mês, semana e dia."
    />
  );
}
