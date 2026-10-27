"use client";

import { use } from "react";
import { ArrowRight } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { formatDateTime } from "../../lib/format";
import type { DataResult, StageHistoryEntry } from "../../types";
import { useStages } from "../shared/stages-context";

/** Linha do tempo das etapas. Recebe a promessa criada ao abrir a gaveta (use + Suspense). */
export function LeadHistory({ promise }: { promise: Promise<DataResult<StageHistoryEntry[]>> }) {
  const result = use(promise);
  const { labelOf } = useStages();
  if (!result.ok) return <Alert tone="danger">{result.error}</Alert>;
  if (result.data.length === 0) return <p className="text-sm text-muted">Sem movimentações registradas.</p>;

  return (
    <ol className="flex flex-col gap-3 border-l border-border pl-4">
      {result.data.map((entry) => (
        <li key={entry.id} className="relative text-sm">
          <span aria-hidden className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-primary ring-4 ring-surface" />
          <p className="flex flex-wrap items-center gap-1.5 text-fg">
            {entry.fromStage ? (
              <>
                <span>{labelOf(entry.fromStageId, entry.fromStage)}</span>
                <ArrowRight aria-label="para" className="size-3.5 text-muted" />
              </>
            ) : (
              <span className="text-muted">Criado em</span>
            )}
            <span className="font-medium">{labelOf(entry.toStageId, entry.toStage)}</span>
          </p>
          <p className="text-xs text-muted">
            <time dateTime={entry.changedAt}>{formatDateTime(entry.changedAt)}</time>
            {entry.changedByName ? ` · ${entry.changedByName}` : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
