import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Missões" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Missões"
      description="Quadros, listas e cartões das missões da equipe, no estilo Trello."
    />
  );
}
