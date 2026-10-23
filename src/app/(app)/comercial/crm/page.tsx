import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "CRM" };

export default function Page() {
  return (
    <PagePlaceholder
      title="CRM"
      description="Pipeline de leads: do lead recebido ao cliente fechado ou perdido."
    />
  );
}
