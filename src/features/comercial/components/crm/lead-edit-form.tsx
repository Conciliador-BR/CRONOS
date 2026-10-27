"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEAL_TYPES, DEAL_TYPE_LABELS } from "../../constants";
import { updateLead } from "../../actions";
import type { UpdateLeadInput } from "../../schemas";
import type { MemberOption, PipelineLead } from "../../types";
import { LeadFormFields, readForm, type FieldErrors } from "./lead-form-fields";

function centsToInput(cents: number | null) {
  return cents ? (cents / 100).toFixed(2).replace(".", ",") : "";
}

/** Edição do lead na gaveta. Em fechado/perdido também edita tipo, valor ou motivo. */
export function LeadEditForm({ lead, members }: { lead: PipelineLead; members: MemberOption[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { ...readForm(event.currentTarget), id: lead.id };
    setSaved(false);
    startTransition(async () => {
      const result = await updateLead(values as unknown as UpdateLeadInput);
      if (result.ok) {
        setError(null);
        setFieldErrors({});
        setSaved(true);
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  const prefix = `lead-${lead.id}`;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {saved && !pending ? <Alert tone="success">Alterações salvas.</Alert> : null}
      <LeadFormFields idPrefix={prefix} members={members} errors={fieldErrors} defaults={lead} />
      {lead.stage === "cliente_fechado" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${prefix}-dealType`} label="Tipo de negócio" required error={fieldErrors.dealType}>
            <Select name="dealType" defaultValue={lead.dealType ?? ""} placeholder="Selecione…">
              {DEAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DEAL_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`${prefix}-dealValue`} label="Valor do negócio (R$)" required error={fieldErrors.dealValue}>
            <Input name="dealValue" inputMode="decimal" defaultValue={centsToInput(lead.dealValueCents)} autoComplete="off" />
          </Field>
        </div>
      ) : null}
      {lead.stage === "cliente_perdido" ? (
        <Field id={`${prefix}-lostReason`} label="Por que o cliente não fechou?" required error={fieldErrors.lostReason}>
          <Textarea name="lostReason" defaultValue={lead.lostReason ?? ""} rows={3} maxLength={2000} />
        </Field>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
