"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { deleteStage } from "../../stage-actions";
import { deletionTargets, isPendingStage, type StageColumn } from "../../lib/stages";

const FORM_ID = "excluir-etapa";

type Props = {
  /** Coluna a excluir; null fecha o modal. */
  stage: StageColumn | null;
  stages: StageColumn[];
  /** Leads na coluna (sem filtros). */
  leadCount: number;
  onClose: () => void;
  onDeleted: (message: string) => void;
};

/** Confirma a exclusão de uma coluna aberta e, se ela tiver leads, pede para onde eles vão. */
export function DeleteStageModal({ stage, stages, leadCount, onClose, onDeleted }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <Modal
      open={stage !== null}
      onClose={onClose}
      closeOnBackdrop={false}
      title={stage ? `Excluir a etapa ${stage.label}?` : "Excluir etapa"}
      description="A coluna sai do pipeline de todos. O histórico dos leads continua."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} variant="danger" loading={pending}>
            {pending ? "Excluindo…" : "Excluir etapa"}
          </Button>
        </>
      }
    >
      {stage ? (
        <DeleteStageForm
          key={stage.id}
          stage={stage}
          targets={deletionTargets(stages, stage.id).filter((s) => !isPendingStage(s.id))}
          leadCount={leadCount}
          startTransition={startTransition}
          onDeleted={onDeleted}
        />
      ) : null}
    </Modal>
  );
}

type FormProps = {
  stage: StageColumn;
  targets: StageColumn[];
  leadCount: number;
  startTransition: ReturnType<typeof useTransition>[1];
  onDeleted: (message: string) => void;
};

function DeleteStageForm({ stage, targets, leadCount, startTransition, onDeleted }: FormProps) {
  const [moveTo, setMoveTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const leadsText = leadCount === 1 ? "O lead desta etapa vai" : `Os ${leadCount} leads desta etapa vão`;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (leadCount > 0 && !moveTo) {
      setFieldError("Escolha para qual etapa os leads vão.");
      return;
    }
    setFieldError(undefined);
    setError(null);
    startTransition(async () => {
      const result = await deleteStage({ id: stage.id, moveLeadsTo: leadCount > 0 ? moveTo : undefined });
      if (result.ok) {
        const target = targets.find((s) => s.id === moveTo);
        onDeleted(
          leadCount > 0 && target
            ? `Etapa ${stage.label} excluída. ${leadCount === 1 ? "O lead foi" : `Os ${leadCount} leads foram`} para ${target.label}.`
            : `Etapa ${stage.label} excluída.`,
        );
        return;
      }
      const message = result.fieldErrors?.moveLeadsTo?.[0];
      if (message) setFieldError(message);
      else setError(result.error);
    });
  }

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {leadCount === 0 ? (
        <p className="text-sm text-fg">Esta etapa está vazia. Excluir não move nenhum lead.</p>
      ) : (
        <Field id="excluir-etapa-destino" label={`${leadsText} para…`} required error={fieldError}>
          <Select
            name="moveLeadsTo"
            value={moveTo}
            onChange={(event) => setMoveTo(event.target.value)}
            placeholder="Selecione a etapa"
            autoFocus
          >
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </form>
  );
}
