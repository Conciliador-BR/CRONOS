"use client";

import { Check, ImageUp, Paperclip, StickyNote } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { countProgress, PROGRESS_COLORS, PROGRESS_LABELS, type ProgressStatus } from "../progress";
import type { ProgressCompany, ProgressEntry } from "../progress-queries";
import type { AcquirerSummary } from "../types";
import { AcquirerLogo } from "./acquirer-logo";
import { ProgressBar } from "./progress-bar";
import { ProgressSelectionBar } from "./progress-selection-bar";

/**
 * Coluna de uma adquirente: logo, % automático e as empresas (clique abre o detalhe).
 * A bolinha de cada card seleciona; com seleção, o clique no card marca/desmarca e aparecem as ações em lote.
 */
export function ProgressColumn({
  acquirer,
  companies,
  entryOf,
  matches,
  canManage,
  onEditAcquirer,
  onOpen,
  onRestore,
  onBulk,
}: {
  acquirer: AcquirerSummary;
  companies: ProgressCompany[];
  entryOf: (companyId: string) => ProgressEntry;
  matches: (name: string, detail: string) => boolean;
  canManage: boolean;
  onEditAcquirer: () => void;
  onOpen: (companyId: string) => void;
  onRestore: (companyId: string) => void;
  onBulk: (companyIds: string[], change: { status?: ProgressStatus; removed?: boolean }) => Promise<string | null>;
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const active = companies.filter((company) => !entryOf(company.id).removed);
  const removed = companies.filter((company) => entryOf(company.id).removed);
  const counts = countProgress(active.map((company) => entryOf(company.id).status));
  const shown = active.filter((company) => matches(company.name, company.detail));
  // Só age nas ativas: uma selecionada que saiu da lista (removida) não entra no lote.
  const picked = active.filter((company) => selected.has(company.id)).map((company) => company.id);
  const selecting = picked.length > 0;
  const allSelected = shown.length > 0 && shown.every((company) => selected.has(company.id));

  function toggle(companyId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(companyId)) next.add(companyId);
      return next;
    });
  }

  function bulk(change: { status?: ProgressStatus; removed?: boolean }) {
    setSelected(new Set());
    void onBulk(picked, change);
  }

  return (
    <li className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-border bg-surface-2/40 p-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AcquirerLogo name={acquirer.name} color={acquirer.color} logoUrl={acquirer.logoUrl} className="size-9 shrink-0 rounded-lg p-1 text-xs" />
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{acquirer.name}</h3>
          <span className="text-sm font-semibold text-fg tabular-nums">{counts.percent}%</span>
          {canManage ? (
            <button
              type="button"
              onClick={onEditAcquirer}
              aria-label={`${acquirer.logoUrl ? "Trocar" : "Enviar"} logo de ${acquirer.name}`}
              title={acquirer.logoUrl ? "Trocar logo" : "Enviar logo"}
              className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface-3 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
            >
              <ImageUp aria-hidden className="size-4" />
            </button>
          ) : null}
        </div>
        <ProgressBar label={acquirer.name} counts={counts} size="sm" />
        <p className="text-xs text-muted">
          {counts.automatico} de {counts.total} automáticas
        </p>
      </div>

      {selecting ? (
        <ProgressSelectionBar
          count={picked.length}
          allSelected={allSelected}
          onToggleAll={() => setSelected(allSelected ? new Set() : new Set(shown.map((company) => company.id)))}
          onClear={() => setSelected(new Set())}
          onStatus={(status) => bulk({ status: status ?? undefined })}
          onRemove={() => bulk({ removed: true })}
        />
      ) : null}

      <ul aria-label={`Empresas em ${acquirer.name}`} className="flex max-h-[60dvh] flex-col gap-2 overflow-y-auto pr-1">
        {shown.map((company) => {
          const entry = entryOf(company.id);
          const label = PROGRESS_LABELS[entry.status ?? "nao_iniciado"];
          const isSelected = selected.has(company.id);
          return (
            <li key={company.id} className="group relative">
              <button
                type="button"
                onClick={() => (selecting ? toggle(company.id) : onOpen(company.id))}
                aria-label={`${company.name}, ${company.detail}, em ${acquirer.name}: ${label}${entry.note ? ", com anotação" : ""}${entry.files ? `, ${entry.files} anexos` : ""}. ${selecting ? (isSelected ? "Desmarcar" : "Selecionar") : "Abrir"}`}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-lg border bg-surface py-2 pr-9 pl-3 text-left hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring",
                  isSelected ? "border-ring" : "border-border",
                )}
              >
                <span className="truncate text-sm font-medium text-fg">{company.name}</span>
                <span className="truncate text-xs text-muted">{company.detail}</span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-fg">
                    <span
                      aria-hidden
                      className={cn("size-2 shrink-0 rounded-full", !entry.status && "bg-surface-3")}
                      style={entry.status ? { backgroundColor: PROGRESS_COLORS[entry.status] } : undefined}
                    />
                    <span className="truncate">{label}</span>
                  </span>
                  {entry.note ? <StickyNote aria-hidden className="size-3.5 shrink-0 text-muted" /> : null}
                  {entry.files ? (
                    <span aria-hidden className="flex items-center gap-0.5 text-xs text-muted">
                      <Paperclip className="size-3.5" />
                      {entry.files}
                    </span>
                  ) : null}
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggle(company.id)}
                aria-pressed={isSelected}
                aria-label={`Selecionar ${company.name}`}
                title={isSelected ? "Desmarcar" : "Selecionar"}
                className={cn(
                  "absolute top-2 right-2 grid size-5 place-items-center rounded-full border focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring",
                  isSelected ? "border-ring bg-ring text-white" : "border-muted bg-surface hover:border-fg",
                  selecting ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-coarse:opacity-100",
                )}
              >
                {isSelected ? <Check aria-hidden className="size-3.5" /> : null}
              </button>
            </li>
          );
        })}
        {shown.length === 0 ? <li className="px-1 text-xs text-muted">Nenhuma empresa encontrada.</li> : null}
      </ul>

      {removed.length > 0 ? (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer rounded px-1 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring">
            Removidas desta adquirente ({removed.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {removed.map((company) => (
              <li key={company.id} className="flex items-center justify-between gap-2 px-1">
                <span className="min-w-0 truncate">{company.name}</span>
                <button
                  type="button"
                  onClick={() => onRestore(company.id)}
                  aria-label={`Restaurar ${company.name} em ${acquirer.name}`}
                  className="shrink-0 rounded px-1.5 py-0.5 text-ring hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Restaurar
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </li>
  );
}
