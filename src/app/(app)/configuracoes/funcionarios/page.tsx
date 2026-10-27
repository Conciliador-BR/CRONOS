import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmployeeList } from "@/features/configuracoes/components/employee-list";
import { getEmployees, getTeams } from "@/features/configuracoes/queries";
import { requireRole } from "@/lib/auth";
import { hasServiceRoleKey } from "@/lib/env";

export const metadata: Metadata = { title: "Funcionários" };

const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function Page() {
  const viewer = await requireRole(["admin", "gestor"]);
  const isAdmin = viewer.role === "admin";
  const canManageLogins = hasServiceRoleKey();
  const [{ month, employees }, teams] = await Promise.all([getEmployees(), getTeams()]);
  const monthLabel = monthFormat.format(new Date(`${month}T00:00:00Z`));

  return (
    <>
      <PageHeader
        title="Funcionários"
        description={
          isAdmin
            ? "Cadastre funcionários com login, papel, time, comissão, meta e foto."
            : "Veja a equipe e defina as metas do mês. Logins e papéis são gerenciados pelo administrador."
        }
      />
      {isAdmin && !canManageLogins ? (
        <Alert tone="warning" title="Criação de logins indisponível" className="mb-4">
          Configure a variável <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> no servidor (Supabase → Project
          Settings → API Keys) para criar funcionários e redefinir senhas. As demais edições continuam funcionando.
        </Alert>
      ) : null}
      <EmployeeList
        employees={employees}
        teams={teams.map(({ id, name }) => ({ id, name }))}
        viewer={{ id: viewer.id, isAdmin }}
        canManageLogins={canManageLogins}
        monthLabel={monthLabel}
      />
    </>
  );
}
