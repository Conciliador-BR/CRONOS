import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SectionTabs } from "@/components/layout/section-tabs";
import { isManager, requireMember } from "@/lib/auth";
import { CONFIGURACOES_NAV } from "@/lib/nav";

/**
 * Configurações: só admin e gestor. Este redirecionamento é conveniência de navegação;
 * a proteção real fica nas Server Actions (requireRole) e na RLS.
 */
export default async function ConfiguracoesLayout({ children }: { children: ReactNode }) {
  const profile = await requireMember();
  if (!isManager(profile)) redirect("/inicio");

  return (
    <>
      <div className="mb-6">
        <SectionTabs label="Configurações" items={CONFIGURACOES_NAV} />
      </div>
      {children}
    </>
  );
}
