"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { ActionResult } from "../action-result";
import { resetEmployeePassword, setEmployeeGoal } from "../employee-actions";
import type { EmployeeRow } from "../queries";
import { centsToInput } from "./money-input";

type Props = { employee: EmployeeRow; onClose: () => void; onSaved: (message: string) => void };

function useSubmit(action: (formData: FormData) => Promise<ActionResult>, onSaved: (message: string) => void) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = await action(formData);
      if (next.ok) onSaved(next.message ?? "Salvo.");
      else setResult(next);
    });
  }
  const failure = result && !result.ok ? result : null;
  return { pending, onSubmit, failure };
}

function Footer({ formId, pending, label, onClose }: { formId: string; pending: boolean; label: string; onClose: () => void }) {
  return (
    <>
      <Button variant="secondary" onClick={onClose} disabled={pending}>
        Cancelar
      </Button>
      <Button type="submit" form={formId} loading={pending}>
        {pending ? "Salvando…" : label}
      </Button>
    </>
  );
}

/** Admin define nova senha para o funcionário. */
export function PasswordModal({ employee, onClose, onSaved }: Props) {
  const { pending, onSubmit, failure } = useSubmit((fd) => resetEmployeePassword(employee.id, fd), onSaved);
  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      size="sm"
      title="Redefinir senha"
      description={`Nova senha de acesso de ${employee.fullName}.`}
      footer={<Footer formId="password-form" pending={pending} label="Redefinir senha" onClose={onClose} />}
    >
      <form id="password-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {failure && !failure.fieldErrors ? <Alert tone="danger">{failure.error}</Alert> : null}
        <Field id="reset-password" label="Nova senha" required error={failure?.fieldErrors?.password} hint="Mínimo de 8 caracteres.">
          <Input name="password" type="password" autoComplete="new-password" minLength={8} autoFocus />
        </Field>
      </form>
    </Modal>
  );
}

/** Admin ou gestor define a meta do mês corrente. */
export function GoalModal({ employee, monthLabel, onClose, onSaved }: Props & { monthLabel: string }) {
  const { pending, onSubmit, failure } = useSubmit((fd) => setEmployeeGoal(employee.id, fd), onSaved);
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Meta do mês"
      description={`${employee.fullName} · ${monthLabel}`}
      footer={<Footer formId="goal-form" pending={pending} label="Salvar meta" onClose={onClose} />}
    >
      <form id="goal-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {failure && !failure.fieldErrors ? <Alert tone="danger">{failure.error}</Alert> : null}
        <Field id="goal-value" label="Meta (R$)" error={failure?.fieldErrors?.goal} hint="Deixe vazio para remover a meta.">
          <Input name="goal" inputMode="decimal" defaultValue={centsToInput(employee.goalCents)} placeholder="0,00" autoFocus />
        </Field>
      </form>
    </Modal>
  );
}
