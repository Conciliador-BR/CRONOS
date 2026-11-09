"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentProposal } from "@/features/agente/types";
import type { ProposalState } from "./use-agent-chat";

type Props = {
  proposal: AgentProposal;
  state: ProposalState;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: () => void;
};

export function ProposalCard({ proposal, state, onConfirm, onCancel, onEdit }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const blocked = proposal.warnings.length > 0;

  useEffect(() => {
    // Com avisos o Confirmar fica desabilitado e não recebe foco.
    if (!blocked) confirmRef.current?.focus();
  }, [blocked]);

  if (state.status === "cancelled") return <p className="text-xs text-muted">Proposta cancelada</p>;
  if (state.status === "done") {
    return (
      <Alert tone="success" title={state.message}>
        {state.href ? (
          <Link href={state.href} className="font-medium text-ring underline underline-offset-2">
            Abrir
          </Link>
        ) : null}
      </Alert>
    );
  }
  const running = state.status === "running";

  return (
    <Card className="border-primary/40">
      <CardHeader className="gap-2">
        <Badge variant="primary" className="self-start">
          {proposal.actionLabel}
        </Badge>
        <CardTitle as="h3" className="text-sm">
          Confirme antes de executar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {proposal.fields.map((f) => (
            <div key={f.label} className="contents">
              <dt className="text-muted">{f.label}</dt>
              <dd className="break-words text-fg">{f.value}</dd>
            </div>
          ))}
        </dl>
        {proposal.warnings.map((w) => (
          <Alert key={w} tone="warning">
            {w}
          </Alert>
        ))}
        {state.status === "error" ? <Alert tone="danger">{state.message}</Alert> : null}
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit} disabled={running}>
          Editar
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={running}>
          Cancelar
        </Button>
        <Button ref={confirmRef} size="sm" onClick={onConfirm} loading={running} disabled={blocked}>
          {state.status === "error" ? "Tentar de novo" : proposal.actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
