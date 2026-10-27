"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { ActionResult } from "../action-result";
import type { TeamRow } from "../queries";
import { deleteTeam, saveTeam } from "../team-actions";
import { ConfirmDialog } from "./confirm-dialog";

const membersLabel = (n: number) => (n === 1 ? "1 membro" : `${n} membros`);

/** Times: criar, renomear e excluir, com a contagem de membros. */
export function TeamManager({ teams }: { teams: TeamRow[] }) {
  const [editing, setEditing] = useState<{ team: TeamRow | null } | null>(null);
  const [toDelete, setToDelete] = useState<TeamRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{teams.length === 1 ? "1 time" : `${teams.length} times`}</p>
        <Button onClick={() => setEditing({ team: null })}>
          <Plus aria-hidden />
          Novo time
        </Button>
      </div>
      <div aria-live="polite">{notice ? <Alert tone="success">{notice}</Alert> : null}</div>

      {teams.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Nenhum time cadastrado"
          description="Times organizam os funcionários e o desempenho comercial."
          action={
            <Button onClick={() => setEditing({ team: null })}>
              <Plus aria-hidden />
              Criar o primeiro time
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-ring">
                <UsersRound aria-hidden className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{t.name}</p>
                <p className="text-xs text-muted tabular-nums">{membersLabel(t.memberCount)}</p>
              </div>
              <Button variant="ghost" size="icon" aria-label={`Renomear ${t.name}`} onClick={() => setEditing({ team: t })}>
                <Pencil aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Excluir ${t.name}`} onClick={() => setToDelete(t)}>
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <TeamModal
          team={editing.team}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Excluir time?"
        description={
          toDelete?.memberCount
            ? `${membersLabel(toDelete.memberCount)} de “${toDelete.name}” ficarão sem time.`
            : `“${toDelete?.name ?? ""}” será excluído.`
        }
        confirmLabel="Excluir time"
        pendingLabel="Excluindo…"
        onConfirm={async () => {
          const result = await deleteTeam(toDelete!.id);
          if (result.ok) setNotice(result.message ?? "Time excluído.");
          return result;
        }}
      />
    </div>
  );
}

function TeamModal({ team, onClose, onSaved }: { team: TeamRow | null; onClose: () => void; onSaved: (m: string) => void }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = await saveTeam(team?.id ?? null, formData);
      if (next.ok) onSaved(next.message ?? "Time salvo.");
      else setResult(next);
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={team ? "Renomear time" : "Novo time"}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="team-form" loading={pending}>
            {pending ? "Salvando…" : "Salvar time"}
          </Button>
        </>
      }
    >
      <form id="team-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {result && !result.ok && !result.fieldErrors ? <Alert tone="danger">{result.error}</Alert> : null}
        <Field id="team-name" label="Nome do time" required error={result && !result.ok ? result.fieldErrors?.name : undefined}>
          <Input name="name" defaultValue={team?.name ?? ""} maxLength={80} autoComplete="off" autoFocus />
        </Field>
      </form>
    </Modal>
  );
}
