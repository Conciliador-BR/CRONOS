import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Marketing" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Marketing"
      description="Leads de origem marketing: volume por mês, conversão e quentes x frios."
    />
  );
}
