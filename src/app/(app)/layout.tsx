import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AgentLauncher } from "@/features/agente/components/agent-launcher";
import { getMyReminders } from "@/features/lembretes/queries";
import { requireMember } from "@/lib/auth";

/** Área logada: exige membro ativo e monta o shell (menu lateral + topo). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await requireMember();
  // Sem await: o sino de lembretes resolve em streaming, a página não espera.
  const reminders = getMyReminders();

  return (
    <AppShell user={{ name: profile.full_name, email: profile.email, role: profile.role }} reminders={reminders}>
      {children}
      {/* Só admin: o agente fica disponível em todas as páginas logadas. */}
      {profile.role === "admin" ? <AgentLauncher /> : null}
    </AppShell>
  );
}
