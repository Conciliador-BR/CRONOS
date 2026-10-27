import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { HomeView } from "@/features/inicio/components/home-view";
import { getHomeSummary } from "@/features/inicio/queries";
import { firstName, greeting } from "@/features/inicio/summary";
import { isManager, requireMember } from "@/lib/auth";

export const metadata: Metadata = { title: "Início" };

export default async function Page() {
  const [profile, summary] = await Promise.all([requireMember(), getHomeSummary()]);
  const name = firstName(profile.full_name);

  return (
    <>
      <PageHeader title={name ? `${greeting()}, ${name}` : greeting()} description="Seu resumo do dia e atalhos para os módulos do CRONOS." />
      <HomeView summary={summary} manager={isManager(profile)} />
    </>
  );
}
