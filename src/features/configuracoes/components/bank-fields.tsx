"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ACCOUNT_TYPE_LABELS } from "@/features/empresas/format";
import { useRows } from "./use-rows";

export type BankValue = { id?: string; bank: string; agency: string; account: string; accountType: string | null };

/** Lista dinâmica de contas bancárias (banco, agência, conta, tipo). */
export function BankFields({ initial, errors }: { initial: BankValue[]; errors?: Partial<Record<string, string[]>> }) {
  const { rows, add, remove } = useRows<BankValue>(initial, () => ({
    bank: "",
    agency: "",
    account: "",
    accountType: "corrente",
  }));
  const err = (index: number, field: string) => errors?.[`banks.${index}.${field}`];

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? <p className="text-sm text-muted">Nenhuma conta adicionada.</p> : null}
      <ul className="flex flex-col gap-3">
        {rows.map(({ key, value }, index) => (
          <li
            key={key}
            className="grid items-start gap-3 rounded-lg border border-border p-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr_auto]"
          >
            {value.id ? <input type="hidden" name={`banks.${index}.id`} value={value.id} /> : null}
            <Field id={`${key}-bank`} label="Banco" required error={err(index, "bank")}>
              <Input name={`banks.${index}.bank`} defaultValue={value.bank} maxLength={80} placeholder="Ex.: 341 · Itaú" autoComplete="off" />
            </Field>
            <Field id={`${key}-agency`} label="Agência" required error={err(index, "agency")}>
              <Input name={`banks.${index}.agency`} defaultValue={value.agency} maxLength={10} inputMode="numeric" autoComplete="off" />
            </Field>
            <Field id={`${key}-account`} label="Conta" required error={err(index, "account")}>
              <Input name={`banks.${index}.account`} defaultValue={value.account} maxLength={20} autoComplete="off" />
            </Field>
            <Field id={`${key}-type`} label="Tipo" required error={err(index, "accountType")}>
              <Select name={`banks.${index}.accountType`} defaultValue={value.accountType ?? "corrente"}>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              variant="ghost"
              size="icon"
              className="lg:mt-6"
              aria-label={`Remover conta ${index + 1}`}
              onClick={() => remove(key)}
            >
              <Trash2 aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <div>
        <Button variant="secondary" size="sm" onClick={add} disabled={rows.length >= 20}>
          <Plus aria-hidden />
          Adicionar conta
        </Button>
      </div>
    </div>
  );
}
