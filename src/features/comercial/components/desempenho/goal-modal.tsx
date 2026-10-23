"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { setSalesGoal } from "../../actions";
import { formatMonthLabel, type MonthKey } from "../../lib/months";
import type { SellerPerformance } from "../../lib/performance";

const FORM_ID = "meta-mensal";

type Props = { seller: SellerPerformance | null; month: MonthKey; onClose: () => void };

/** Define a meta do mês de um funcionário (admin/gestor). Valor 0 remove a meta. */
export function GoalModal({ seller, month, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string[] | undefined>();

  function close() {
    setError(null);
    setFieldError(undefined);
    onClose();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!seller) return;
    const goal = String(new FormData(event.currentTarget).get("goal") ?? "");
    startTransition(async () => {
      const result = await setSalesGoal({ profileId: seller.id, month, goal });
      if (result.ok) close();
      else {
        setError(result.error);
        setFieldError(result.fieldErrors?.goal);
      }
    });
  }

  return (
    <Modal
      open={seller !== null}
      onClose={close}
      closeOnBackdrop={false}
      size="sm"
      title="Meta mensal"
      description={seller ? `${seller.name} · ${formatMonthLabel(month)}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} loading={pending}>
            {pending ? "Salvando…" : "Salvar meta"}
          </Button>
        </>
      }
    >
      {seller ? (
        <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {error && !fieldError ? <Alert tone="danger">{error}</Alert> : null}
          <Field id="goal" label="Meta de faturamento (R$)" required error={fieldError} hint="Use 0 para remover a meta do mês.">
            <Input
              name="goal"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              defaultValue={seller.goalCents ? (seller.goalCents / 100).toFixed(2).replace(".", ",") : ""}
              placeholder="0,00"
            />
          </Field>
        </form>
      ) : null}
    </Modal>
  );
}
