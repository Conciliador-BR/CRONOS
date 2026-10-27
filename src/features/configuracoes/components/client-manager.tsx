"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { formatCpfCnpj } from "@/features/empresas/format";
import type { ActionResult } from "../action-result";
import { deleteClient, saveClient } from "../client-actions";
import type { ClientRow } from "../queries";
import { ClientFields } from "./client-fields";
import { ConfirmDialog } from "./confirm-dialog";

type Editing = { client: ClientRow | null } | null;

/** Clientes: listar, cadastrar, editar e excluir. */
export function ClientManager({ clients }: { clients: ClientRow[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<ClientRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{clients.length === 1 ? "1 cliente" : `${clients.length} clientes`}</p>
        <Button onClick={() => setEditing({ client: null })}>
          <Plus aria-hidden />
          Novo cliente
        </Button>
      </div>
      <div aria-live="polite">{notice ? <Alert tone="success">{notice}</Alert> : null}</div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado"
          description="Cadastre aqui ou direto no formulário da empresa."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{c.name}</p>
                <p className="truncate text-xs text-muted">
                  {[c.document ? formatCpfCnpj(c.document) : null, c.email, c.phone].filter(Boolean).join(" · ") ||
                    "Sem contato informado"}
                </p>
              </div>
              <span className="hidden text-xs text-muted sm:inline">
                {c.companyCount === 1 ? "1 empresa" : `${c.companyCount} empresas`}
              </span>
              <Button variant="ghost" size="icon" aria-label={`Editar ${c.name}`} onClick={() => setEditing({ client: c })}>
                <Pencil aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" aria-label={`Excluir ${c.name}`} onClick={() => setToDelete(c)}>
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <ClientModal
          client={editing.client}
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
        title="Excluir cliente?"
        description={
          toDelete?.companyCount
            ? `“${toDelete.name}” está vinculado a ${toDelete.companyCount} empresa(s), que ficarão sem cliente.`
            : `“${toDelete?.name ?? ""}” será excluído.`
        }
        confirmLabel="Excluir cliente"
        pendingLabel="Excluindo…"
        onConfirm={async () => {
          const result = await deleteClient(toDelete!.id);
          if (result.ok) setNotice(result.message ?? "Cliente excluído.");
          return result;
        }}
      />
    </div>
  );
}

function ClientModal({
  client,
  onClose,
  onSaved,
}: {
  client: ClientRow | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const formId = client ? `client-form-${client.id}` : "client-form-new";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = await saveClient(client?.id ?? null, formData);
      if (next.ok) onSaved(next.message ?? "Cliente salvo.");
      else setResult(next);
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title={client ? "Editar cliente" : "Novo cliente"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {pending ? "Salvando…" : "Salvar cliente"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {result && !result.ok ? <Alert tone="danger">{result.error}</Alert> : null}
        <ClientFields idPrefix={formId} initial={client} errors={result && !result.ok ? result.fieldErrors : undefined} autoFocus />
      </form>
    </Modal>
  );
}
