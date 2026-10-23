"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { loseLeadSchema } from "../../schemas";
import type { PromptAnswer } from "./use-pipeline-dnd";

type Props = {
  open: boolean;
  leadName: string;
  onCancel: () => void;
  onConfirm: (answer: Extract<PromptAnswer, { kind: "perdido" }>) => void;
};

const FORM_ID = "perder-lead";

/** Pede o motivo ao soltar um lead em "Cliente perdido". Cancelar devolve o card. */
export function LoseLeadModal({ open, leadName, onCancel, onConfirm }: Props) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      closeOnBackdrop={false}
      title="Cliente perdido"
      description={`O motivo de ${leadName} aparece em Insights.`}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} variant="danger">
            Marcar como perdido
          </Button>
        </>
      }
    >
      <LoseLeadForm onConfirm={onConfirm} />
    </Modal>
  );
}

function LoseLeadForm({ onConfirm }: Pick<Props, "onConfirm">) {
  const [error, setError] = useState<string | undefined>();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = loseLeadSchema.safeParse({ lostReason: String(new FormData(event.currentTarget).get("lostReason") ?? "") });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    onConfirm({ kind: "perdido", lostReason: parsed.data.lostReason });
  }

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate>
      <Field id="lostReason" label="Por que o cliente não fechou?" required error={error}>
        <Textarea name="lostReason" rows={4} maxLength={2000} autoFocus placeholder="Ex.: achou o preço alto, fechou com concorrente…" />
      </Field>
    </form>
  );
}
