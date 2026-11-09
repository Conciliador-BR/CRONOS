"use client";

import { Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PROGRESS_LABELS, PROGRESS_STATUSES, type ProgressStatus } from "../progress";

/** Ações em lote das empresas selecionadas numa coluna: mudar etapa ou remover da adquirente. */
export function ProgressSelectionBar({
  count,
  allSelected,
  onToggleAll,
  onClear,
  onStatus,
  onRemove,
}: {
  count: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onClear: () => void;
  onStatus: (status: ProgressStatus | null) => void;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const plural = count === 1 ? "empresa" : "empresas";

  return (
    <div role="region" aria-label="Ações em lote" className="flex flex-col gap-2 rounded-lg border border-ring/40 bg-surface p-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-fg tabular-nums" aria-live="polite">
          {count} {count === 1 ? "selecionada" : "selecionadas"}
        </span>
        <button
          type="button"
          onClick={onToggleAll}
          className="rounded px-1.5 py-0.5 text-ring hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {allSelected ? "Desmarcar todas" : "Selecionar todas"}
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label="Cancelar seleção"
          title="Cancelar seleção"
          className="ml-auto grid size-6 place-items-center rounded text-muted hover:bg-surface-3 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      {confirming ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="min-w-0 flex-1 text-fg">
            Remover {count} {plural} desta adquirente?
          </span>
          <Button size="sm" variant="danger" onClick={onRemove}>
            Remover
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Não
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Select
              aria-label={`Mudar etapa de ${count} ${plural}`}
              value=""
              placeholder="Mudar etapa…"
              onChange={(event) => onStatus(event.target.value === "nao_iniciado" ? null : (event.target.value as ProgressStatus))}
              className="h-8 text-xs"
            >
              <option value="nao_iniciado">{PROGRESS_LABELS.nao_iniciado}</option>
              {PROGRESS_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PROGRESS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Remover ${count} ${plural} desta adquirente`}
            title="Remover desta adquirente"
            className="grid size-8 shrink-0 place-items-center rounded-md text-danger hover:bg-surface-3 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
