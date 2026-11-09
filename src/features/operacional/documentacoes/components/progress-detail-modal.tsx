"use client";

import { Check, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PROGRESS_COLORS, PROGRESS_LABELS, PROGRESS_STATUSES, type ProgressStatus } from "../progress";
import type { ProgressCompany, ProgressEntry } from "../progress-queries";
import type { AcquirerSummary } from "../types";
import type { EntryPatch } from "./progress-board";
import { ProgressFiles } from "./progress-files";

const OPTIONS = [null, ...PROGRESS_STATUSES] as const;

/** Detalhe de uma empresa numa adquirente: etapa, anotação, anexos e "remover desta adquirente". */
export function ProgressDetailModal({
  acquirer,
  company,
  entry,
  onPatch,
  onClose,
}: {
  acquirer: AcquirerSummary;
  company: ProgressCompany;
  entry: ProgressEntry;
  onPatch: (change: EntryPatch, save?: boolean) => Promise<string | null>;
  onClose: () => void;
}) {
  const [note, setNote] = useState(entry.note);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const current = entry.status ?? null;

  async function saveNote() {
    setSaving(true);
    setSaved(false);
    const message = await onPatch({ note: note.trim() });
    setSaving(false);
    if (message) return setError(message);
    setError(null);
    setSaved(true);
  }

  async function remove() {
    const message = await onPatch({ removed: true });
    if (message) return setError(message);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={company.name} description={`${company.detail} · ${acquirer.name}`}>
      <div className="flex flex-col gap-5">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">Etapa</legend>
          <div role="radiogroup" aria-label="Etapa" className="flex flex-col gap-1">
            {OPTIONS.map((option) => {
              const checked = option === current;
              return (
                <button
                  key={option ?? "nao_iniciado"}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => {
                    if (!checked) void onPatch({ status: (option ?? undefined) as ProgressStatus | undefined });
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-ring",
                    checked ? "border-primary bg-primary/10 text-fg" : "border-border text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-2.5 shrink-0 rounded-full", !option && "bg-surface-3")}
                    style={option ? { backgroundColor: PROGRESS_COLORS[option] } : undefined}
                  />
                  <span className="flex-1">{PROGRESS_LABELS[option ?? "nao_iniciado"]}</span>
                  {checked ? <Check aria-hidden className="size-4 text-ring" /> : null}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="progress-note" className="text-sm font-medium text-fg">
            Anotação
          </label>
          <Textarea
            id="progress-note"
            rows={4}
            maxLength={5000}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setSaved(false);
            }}
            placeholder="Escreva algo sobre esta empresa nesta adquirente…"
          />
          <div className="flex items-center gap-3">
            <Button size="sm" loading={saving} disabled={note.trim() === entry.note} onClick={() => void saveNote()}>
              Salvar anotação
            </Button>
            {saved ? (
              <span role="status" className="text-xs text-muted">
                Anotação salva.
              </span>
            ) : null}
          </div>
        </div>

        <ProgressFiles acquirerId={acquirer.id} companyId={company.id} onCount={(files) => void onPatch({ files }, false)} />

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {confirmRemove ? (
            <>
              <p className="w-full text-sm text-muted">
                Tirar {company.name} da coluna {acquirer.name}? Dá para restaurar no fim da coluna.
              </p>
              <Button variant="danger" size="sm" onClick={() => void remove()}>
                Remover desta adquirente
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" className="text-danger" onClick={() => setConfirmRemove(true)}>
              <Trash2 aria-hidden />
              Remover desta adquirente
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
