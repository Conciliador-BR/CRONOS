import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Insights" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Insights"
      description="De onde chegam os leads, conversão por origem e motivos de perda."
    />
  );
}
