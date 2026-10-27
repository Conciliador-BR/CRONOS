"use client";

import { Suspense, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { formatCents } from "@/lib/format/money";
import { DEAL_TYPE_LABELS, SOURCE_LABELS } from "../../constants";
import { deleteLead } from "../../actions";
import { formatDate } from "../../lib/format";
import type { DataResult, MemberOption, PipelineLead, StageHistoryEntry } from "../../types";
import { SourceBadge, StageBadge, TemperatureBadge } from "../shared/lead-badges";
import { LeadEditForm } from "./lead-edit-form";
import { LeadHistory } from "./lead-history";

type Props = {
  lead: PipelineLead | null;
  members: MemberOption[];
  membersById: Map<string, MemberOption>;
  canEdit: boolean;
  canDelete: boolean;
  historyPromise: Promise<DataResult<StageHistoryEntry[]>> | null;
  onClose: () => void;
};

/** Gaveta com os dados do lead, edição e histórico de etapas. */
export function LeadDrawer({ lead, members, membersById, canEdit, canDelete, historyPromise, onClose }: Props) {
  return (
    <Drawer
      open={lead !== null}
      onClose={onClose}
      size="lg"
      title={lead?.name ?? "Lead"}
      description={lead?.companyName ?? undefined}
    >
      {lead ? (
        <div className="flex flex-col gap-6">
          <LeadSummary lead={lead} owner={lead.ownerId ? membersById.get(lead.ownerId) : undefined} />
          <section aria-labelledby="lead-dados" className="flex flex-col gap-3">
            <h3 id="lead-dados" className="text-sm font-semibold text-fg">
              Dados do lead
            </h3>
            {canEdit ? (
              <LeadEditForm key={`${lead.id}-${lead.stageId}`} lead={lead} members={members} />
            ) : (
              <ReadOnlyDetails lead={lead} />
            )}
          </section>
          <section aria-labelledby="lead-historico" className="flex flex-col gap-3">
            <h3 id="lead-historico" className="text-sm font-semibold text-fg">
              Histórico de etapas
            </h3>
            {historyPromise ? (
              <Suspense fallback={<Spinner label="Carregando histórico…" />}>
                <LeadHistory promise={historyPromise} />
              </Suspense>
            ) : null}
          </section>
          {canDelete ? <DeleteLead key={lead.id} lead={lead} onDeleted={onClose} /> : null}
        </div>
      ) : null}
    </Drawer>
  );
}

function LeadSummary({ lead, owner }: { lead: PipelineLead; owner: MemberOption | undefined }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2/50 p-4 text-sm">
      <div className="flex flex-wrap gap-1.5">
        <StageBadge stageId={lead.stageId} stage={lead.stage} />
        <TemperatureBadge temperature={lead.temperature} />
        <SourceBadge source={lead.source} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt className="text-muted">Responsável</dt>
        <dd>{owner?.name ?? "Sem responsável"}</dd>
        <dt className="text-muted">Criado em</dt>
        <dd>{formatDate(lead.createdAt)}</dd>
        {lead.stage === "cliente_fechado" ? (
          <>
            <dt className="text-muted">Negócio</dt>
            <dd>
              {lead.dealType ? DEAL_TYPE_LABELS[lead.dealType] : "—"} ·{" "}
              <span className="font-medium text-success tabular-nums">{formatCents(lead.dealValueCents)}</span>
            </dd>
            <dt className="text-muted">Fechado em</dt>
            <dd>{formatDate(lead.closedAt)}</dd>
          </>
        ) : null}
        {lead.stage === "cliente_perdido" ? (
          <>
            <dt className="text-muted">Perdido em</dt>
            <dd>{formatDate(lead.closedAt)}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}

function ReadOnlyDetails({ lead }: { lead: PipelineLead }) {
  const rows: [string, string | null][] = [
    ["E-mail", lead.email],
    ["Telefone", lead.phone],
    ["Origem", SOURCE_LABELS[lead.source]],
    ["Indicador", lead.referrerName],
    ["Descrição", lead.description],
    ["Motivo da perda", lead.lostReason],
  ];
  return (
    <>
      <Alert tone="info">Só o responsável, quem criou o lead ou um gestor podem editar.</Alert>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted">{label}</dt>
              <dd className="break-words whitespace-pre-line">{value}</dd>
            </div>
          ))}
      </dl>
    </>
  );
}

function DeleteLead({ lead, onDeleted }: { lead: PipelineLead; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    startTransition(async () => {
      const result = await deleteLead(lead.id);
      if (result.ok) onDeleted();
      else setError(result.error);
    });
  }

  return (
    <section aria-label="Excluir lead" className="flex flex-col gap-3 border-t border-border pt-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {confirming ? (
        <div className="flex flex-col gap-3 rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
          <p>Excluir {lead.name} apaga o lead e o histórico dele. Não dá para desfazer.</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={remove} loading={pending}>
              {pending ? "Excluindo…" : "Excluir definitivamente"}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button variant="ghost" size="sm" className="text-danger" onClick={() => setConfirming(true)}>
            <Trash2 aria-hidden className="size-4" />
            Excluir lead
          </Button>
        </div>
      )}
    </section>
  );
}
