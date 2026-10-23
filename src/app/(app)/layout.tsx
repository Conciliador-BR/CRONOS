import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireMember } from "@/lib/auth";

/** Área logada: exige membro ativo e monta o shell (menu lateral + topo). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireMember();

  return (
    <AppShell user={{ name: profile.full_name, email: profile.email, role: profile.role }}>
      {children}
    </AppShell>
  );
}
