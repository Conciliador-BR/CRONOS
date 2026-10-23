import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { TeamManager } from "@/features/configuracoes/components/team-manager";
import { getTeams } from "@/features/configuracoes/queries";

export const metadata: Metadata = { title: "Times" };

export default async function Page() {
  const teams = await getTeams();
  return (
    <>
      <PageHeader title="Times" description="Times usados no cadastro de funcionários e no desempenho comercial." />
      <TeamManager teams={teams} />
    </>
  );
}
