"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { DEAL_TYPES, DEAL_TYPE_LABELS, type DealType } from "../../constants";
import { closeDealSchema } from "../../schemas";
import type { PromptAnswer } from "./use-pipeline-dnd";

type Props = {
  open: boolean;
  leadName: string;
  onCancel: () => void;
  onConfirm: (answer: Extract<PromptAnswer, { kind: "fechado" }>) => void;
};

const FORM_ID = "fechar-negocio";

/** Pergunta tipo e valor ao soltar um lead em "Cliente fechado". Cancelar devolve o card. */
export function CloseDealModal({ open, leadName, onCancel, onConfirm }: Props) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      closeOnBackdrop={false}
      title="Cliente fechado"
      description={`Registre o negócio de ${leadName}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID}>
            Confirmar fechamento
          </Button>
        </>
      }
    >
      <CloseDealForm onConfirm={onConfirm} />
    </Modal>
  );
}

function CloseDealForm({ onConfirm }: Pick<Props, "onConfirm">) {
  const [errors, setErrors] = useState<{ dealType?: string[]; dealValue?: string[] }>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const raw = { dealType: data.get("dealType") ?? undefined, dealValue: String(data.get("dealValue") ?? "") };
    const parsed = closeDealSchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    onConfirm({
      kind: "fechado",
      dealType: parsed.data.dealType as DealType,
      dealValue: raw.dealValue,
      dealValueCents: parsed.data.dealValue,
    });
  }

  const typeError = errors.dealType?.[0];

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <fieldset aria-describedby={typeError ? "dealType-error" : undefined} className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-fg">
          Fechou em Consultoria avançada ou Somente o sistema?
          <span aria-hidden className="ml-0.5 text-danger">
            *
          </span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEAL_TYPES.map((type, index) => (
            <label
              key={type}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface px-3 text-sm",
                "transition-colors hover:border-surface-3 has-[:checked]:border-primary has-[:checked]:bg-primary/10",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
              )}
            >
              <input
                type="radio"
                name="dealType"
                value={type}
                required
                autoFocus={index === 0}
                className="size-4 accent-[var(--primary)]"
              />
              {DEAL_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
        {typeError ? (
          <p id="dealType-error" className="text-xs font-medium text-danger">
            {typeError}
          </p>
        ) : null}
      </fieldset>
      <Field id="dealValue" label="Valor do negócio (R$)" required error={errors.dealValue} hint="Ex.: 1.500,00">
        <Input name="dealValue" inputMode="decimal" autoComplete="off" placeholder="0,00" />
      </Field>
    </form>
  );
}
