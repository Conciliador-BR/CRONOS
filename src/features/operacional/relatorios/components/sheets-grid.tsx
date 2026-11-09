"use client";

import { Plus, Table2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { deleteSheet } from "../sheet-actions";
import type { ReportSheetSummary } from "../types";
import { SheetFormModal } from "./sheet-form-modal";
import { useReturnFocus } from "./use-anchored-popover";

/** Tabelas de relatório como cartões, "Nova tabela" e exclusão (quem pode). */
export function SheetsGrid({ sheets }: { sheets: ReportSheetSummary[] }) {
  const [creating, setCreating] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleting = sheets.find((sheet) => sheet.id === deletingId) ?? null;
  const returnFocus = useReturnFocus();

  function openCreate(name: string) {
    returnFocus.capture();
    setCreating(name);
  }

  async function remove() {
    if (!deleting) return;
    setPending(true);
    try {
      const result = await deleteSheet(deleting.id);
      if (!result.ok) return setError(result.error);
      setDeletingId(null);
    } catch {
      setError("Sem conexão com o servidor. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {sheets.length === 0 ? (
        <EmptyState
          icon={Table2}
          title="Nenhuma tabela ainda"
          description="Crie a “Semana de relatório” para acompanhar o status de cada empresa: vendas, recebimentos, Pix e conferência no banco."
          action={
            <Button onClick={() => openCreate("Semana de relatório")}>
              <Plus aria-hidden />
              Criar “Semana de relatório”
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sheets.map((sheet) => (
            <li key={sheet.id} className="group relative">
              <Link
                href={`/operacional/relatorios/${sheet.id}`}
                className="flex h-28 flex-col justify-between rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary/60 hover:bg-surface-2"
              >
                <span className="flex min-w-0 flex-col gap-0.5 pr-8">
                  <span className="truncate font-semibold text-fg">{sheet.name}</span>
                  {sheet.description ? <span className="line-clamp-2 text-xs text-muted">{sheet.description}</span> : null}
                </span>
                <span className="text-xs text-muted">
                  {sheet.rowCount} {sheet.rowCount === 1 ? "linha" : "linhas"}
                </span>
              </Link>
              {sheet.canDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setDeletingId(sheet.id);
                  }}
                  aria-label={`Excluir tabela ${sheet.name}`}
                  className="absolute top-2 right-2 grid size-8 place-items-center rounded-md text-muted opacity-80 hover:bg-surface-3 hover:text-danger hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              ) : null}
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => openCreate("")}
              className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface text-sm text-muted transition-colors hover:border-primary/60 hover:bg-surface-2 hover:text-fg"
            >
              <Plus aria-hidden className="size-5" />
              Nova tabela
            </button>
          </li>
        </ul>
      )}
      {creating !== null ? <SheetFormModal defaultName={creating} onClose={() => {
            setCreating(null);
            returnFocus.restore();
          }} /> : null}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeletingId(null)}
        size="sm"
        title={`Excluir “${deleting?.name ?? ""}”?`}
        description="Todas as colunas, linhas e valores serão excluídos. Isso não pode ser desfeito."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={pending} onClick={() => void remove()}>
              Excluir tabela
            </Button>
          </>
        }
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </Modal>
    </>
  );
}
