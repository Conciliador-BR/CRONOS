import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Funcionários" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Funcionários"
      description="Cadastro de funcionários, logins, papéis, comissões e metas."
    />
  );
}
