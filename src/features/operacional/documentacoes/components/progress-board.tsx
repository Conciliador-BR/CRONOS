"use client";

import { Search, SquareKanban } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { countProgress } from "../progress";
import { setAcquirerProgress, setAcquirerProgressBulk } from "../progress-actions";
import type { ActionResult } from "../../shared/result";
import type { ProgressBoardData, ProgressEntry } from "../progress-queries";
import type { AcquirerSummary } from "../types";
import { AcquirerFormModal } from "./acquirer-form-modal";
import { ProgressBar, ProgressLegend } from "./progress-bar";
import { ProgressColumn } from "./progress-column";
import { ProgressDetailModal } from "./progress-detail-modal";

export const progressKey = (acquirerId: string, companyId: string) => `${acquirerId}:${companyId}`;
export const EMPTY_ENTRY: ProgressEntry = { note: "", removed: false, files: 0 };
export type EntryPatch = Partial<Pick<ProgressEntry, "status" | "note" | "removed" | "files">>;

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Pipeline da aba Progresso: uma coluna por adquirente, com todas as empresas cadastradas
 * (menos as removidas daquela adquirente). Mudanças são otimistas; se o servidor recusar, voltam.
 */
export function ProgressBoard({ acquirers, companies, entries: initial, canManage }: ProgressBoardData & { canManage: boolean }) {
  const [entries, setEntries] = useState(initial);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<{ acquirerId: string; companyId: string } | null>(null);
  const [editing, setEditing] = useState<AcquirerSummary | null>(null);

  if (acquirers.length === 0 || companies.length === 0) {
    return (
      <EmptyState
        icon={SquareKanban}
        title={acquirers.length === 0 ? "Nenhuma adquirente cadastrada" : "Nenhuma empresa cadastrada"}
        description="O pipeline mostra cada empresa cadastrada em cada adquirente da aba Adquirentes."
      />
    );
  }

  const entryOf = (acquirerId: string, companyId: string) => entries[progressKey(acquirerId, companyId)] ?? EMPTY_ENTRY;
  const visible = (acquirerId: string) => companies.filter((company) => !entryOf(acquirerId, company.id).removed);
  const overall = countProgress(acquirers.flatMap((acquirer) => visible(acquirer.id).map((company) => entryOf(acquirer.id, company.id).status)));
  const search = normalize(query.trim());
  const matches = (name: string, detail: string) => !search || normalize(`${name} ${detail}`).includes(search);

  /** Muda o estado local na hora; `save` (se houver) grava e desfaz em caso de erro. */
  function patch(acquirerId: string, companyId: string, change: EntryPatch, save = true) {
    // "files" é só contagem local; status ausente no objeto = não mexe, undefined = Não iniciado (null).
    const status = "status" in change ? { status: change.status ?? null } : {};
    const send = save
      ? () => setAcquirerProgress({ acquirerId, companyId, note: change.note, removed: change.removed, ...status })
      : null;
    return apply(acquirerId, [companyId], change, send);
  }

  /** Mesma mudança (etapa ou remover) em várias empresas de uma adquirente. */
  function patchMany(acquirerId: string, companyIds: string[], change: Pick<EntryPatch, "status" | "removed">) {
    const status = "status" in change ? { status: change.status ?? null } : {};
    return apply(acquirerId, companyIds, change, () =>
      setAcquirerProgressBulk({ acquirerId, companyIds, removed: change.removed, ...status }),
    );
  }

  function apply(acquirerId: string, companyIds: string[], change: EntryPatch, save: (() => Promise<ActionResult>) | null) {
    const ids = companyIds.map((companyId) => progressKey(acquirerId, companyId));
    const previous = Object.fromEntries(ids.map((id) => [id, entries[id]]));
    setEntries((current) => ({
      ...current,
      ...Object.fromEntries(ids.map((id) => [id, { ...(current[id] ?? EMPTY_ENTRY), ...change }])),
    }));
    if (!save) return Promise.resolve(null);
    setError(null);
    return save()
      .catch(() => null)
      .then((result) => {
        if (result?.ok) return null;
        setEntries((current) => {
          const next = { ...current };
          for (const id of ids) {
            if (previous[id]) next[id] = previous[id];
            else delete next[id];
          }
          return next;
        });
        const message = result?.error ?? "Sem conexão com o servidor. Tente novamente.";
        setError(message);
        return message;
      });
  }

  const openAcquirer = open ? acquirers.find((acquirer) => acquirer.id === open.acquirerId) : undefined;
  const openCompany = open ? companies.find((company) => company.id === open.companyId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="progress-overall" className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="progress-overall" className="text-sm font-medium text-fg">
              Integrações automáticas
            </h2>
            <p className="text-xs text-muted">
              {overall.automatico} de {overall.total} · {companies.length} empresas em {acquirers.length} adquirentes
            </p>
          </div>
          <p className="text-3xl font-semibold text-fg tabular-nums">{overall.percent}%</p>
        </div>
        <ProgressBar label="Integrações automáticas" counts={overall} />
        <ProgressLegend counts={overall} />
      </section>

      <div className="relative max-w-sm">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <Input
          type="search"
          aria-label="Buscar empresa"
          placeholder="Buscar empresa ou cidade…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-9"
        />
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <ol aria-label="Adquirentes" className="flex gap-3 overflow-x-auto pb-2">
        {acquirers.map((acquirer) => (
          <ProgressColumn
            key={acquirer.id}
            acquirer={acquirer}
            companies={companies}
            entryOf={(companyId) => entryOf(acquirer.id, companyId)}
            matches={matches}
            canManage={canManage}
            onEditAcquirer={() => setEditing(acquirer)}
            onOpen={(companyId) => setOpen({ acquirerId: acquirer.id, companyId })}
            onRestore={(companyId) => void patch(acquirer.id, companyId, { removed: false })}
            onBulk={(companyIds, change) => patchMany(acquirer.id, companyIds, change)}
          />
        ))}
      </ol>

      {open && openAcquirer && openCompany ? (
        <ProgressDetailModal
          acquirer={openAcquirer}
          company={openCompany}
          entry={entryOf(open.acquirerId, open.companyId)}
          onPatch={(change, save) => patch(open.acquirerId, open.companyId, change, save)}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {editing ? <AcquirerFormModal acquirer={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
