"use client";

import { useState } from "react";
import { KeyRound, Pencil, Target, UserPlus, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/format/money";
import { ROLE_LABELS } from "@/lib/nav";
import type { ActionResult } from "../action-result";
import type { EmployeeRow } from "../queries";
import { ActiveSwitch } from "./active-switch";
import { EmployeeFormModal } from "./employee-form-modal";
import { GoalModal, PasswordModal } from "./employee-small-modals";

const ROLE_VARIANT: Record<EmployeeRow["role"], BadgeVariant> = { admin: "primary", gestor: "warning", funcionario: "neutral" };

type Dialog =
  | { kind: "create" }
  | { kind: "edit" | "password" | "goal"; employee: EmployeeRow }
  | null;

type Props = {
  employees: EmployeeRow[];
  teams: { id: string; name: string }[];
  viewer: { id: string; isAdmin: boolean };
  canManageLogins: boolean;
  monthLabel: string;
};

/** Lista de funcionários com ações por papel: admin gerencia tudo; gestor define metas. */
export function EmployeeList({ employees, teams, viewer, canManageLogins, monthLabel }: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null);

  const close = () => setDialog(null);
  const saved = (message: string, warning?: string) => {
    setDialog(null);
    setNotice(warning ? { tone: "warning", text: `${message} ${warning}` } : { tone: "success", text: message });
  };
  const savedResult = (r: Extract<ActionResult, { ok: true }>) => saved(r.message ?? "Salvo.", r.warning);

  return (
    <div className="flex flex-col gap-4">
      {viewer.isAdmin ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{employees.length === 1 ? "1 pessoa" : `${employees.length} pessoas`}</p>
          <Button onClick={() => setDialog({ kind: "create" })} disabled={!canManageLogins}>
            <UserPlus aria-hidden />
            Novo funcionário
          </Button>
        </div>
      ) : null}
      <div aria-live="polite">{notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}</div>

      {employees.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum funcionário" description="Administradores cadastram funcionários com login." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {employees.map((e) => {
            const isSelf = e.id === viewer.id;
            return (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
                <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
                  <Avatar name={e.fullName} src={e.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {e.fullName}
                      {isSelf ? <span className="text-muted"> (você)</span> : null}
                    </p>
                    <p className="truncate text-xs text-muted">{[e.jobTitle, e.email].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Badge variant={ROLE_VARIANT[e.role]}>{ROLE_LABELS[e.role]}</Badge>
                  <Badge>{e.teamName ?? "Sem time"}</Badge>
                  <span className="tabular-nums">Comissão {String(e.commissionRate).replace(".", ",")}%</span>
                  <span className="tabular-nums">· Meta {e.goalCents === null ? "não definida" : formatCents(e.goalCents)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {viewer.isAdmin ? (
                    <ActiveSwitch
                      profileId={e.id}
                      name={e.fullName}
                      active={e.active}
                      disabled={isSelf}
                      onError={(text) => setNotice({ tone: "danger", text })}
                    />
                  ) : (
                    <Badge variant={e.active ? "success" : "neutral"}>{e.active ? "Ativo" : "Inativo"}</Badge>
                  )}
                  <Button variant="ghost" size="icon" aria-label={`Meta do mês de ${e.fullName}`} onClick={() => setDialog({ kind: "goal", employee: e })}>
                    <Target aria-hidden />
                  </Button>
                  {viewer.isAdmin ? (
                    <>
                      <Button variant="ghost" size="icon" aria-label={`Editar ${e.fullName}`} onClick={() => setDialog({ kind: "edit", employee: e })}>
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Redefinir senha de ${e.fullName}`}
                        disabled={!canManageLogins}
                        onClick={() => setDialog({ kind: "password", employee: e })}
                      >
                        <KeyRound aria-hidden />
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {dialog?.kind === "create" ? (
        <EmployeeFormModal employee={null} teams={teams} isSelf={false} onClose={close} onSaved={savedResult} />
      ) : null}
      {dialog?.kind === "edit" ? (
        <EmployeeFormModal
          employee={dialog.employee}
          teams={teams}
          isSelf={dialog.employee.id === viewer.id}
          onClose={close}
          onSaved={savedResult}
        />
      ) : null}
      {dialog?.kind === "password" ? <PasswordModal employee={dialog.employee} onClose={close} onSaved={(m) => saved(m)} /> : null}
      {dialog?.kind === "goal" ? (
        <GoalModal employee={dialog.employee} monthLabel={monthLabel} onClose={close} onSaved={(m) => saved(m)} />
      ) : null}
    </div>
  );
}
