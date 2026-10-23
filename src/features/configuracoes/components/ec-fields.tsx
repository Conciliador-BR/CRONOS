"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRows } from "./use-rows";

export type EcValue = { id?: string; acquirer: string; ecNumber: string };

/** Lista dinâmica de ECs (adquirente + número). */
export function EcFields({ initial, errors }: { initial: EcValue[]; errors?: Partial<Record<string, string[]>> }) {
  const { rows, add, remove } = useRows<EcValue>(initial, () => ({ acquirer: "", ecNumber: "" }));

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? <p className="text-sm text-muted">Nenhum EC adicionado.</p> : null}
      <ul className="flex flex-col gap-3">
        {rows.map(({ key, value }, index) => (
          <li key={key} className="grid items-start gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
            {value.id ? <input type="hidden" name={`ecs.${index}.id`} value={value.id} /> : null}
            <Field id={`${key}-acquirer`} label="Adquirente" required error={errors?.[`ecs.${index}.acquirer`]}>
              <Input
                name={`ecs.${index}.acquirer`}
                defaultValue={value.acquirer}
                maxLength={80}
                placeholder="Ex.: Cielo, Stone, Rede"
                autoComplete="off"
              />
            </Field>
            <Field id={`${key}-ec`} label="Número do EC" required error={errors?.[`ecs.${index}.ecNumber`]}>
              <Input name={`ecs.${index}.ecNumber`} defaultValue={value.ecNumber} maxLength={40} autoComplete="off" spellCheck={false} />
            </Field>
            <Button
              variant="ghost"
              size="icon"
              className="sm:mt-6"
              aria-label={`Remover EC ${index + 1}`}
              onClick={() => remove(key)}
            >
              <Trash2 aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      <div>
        <Button variant="secondary" size="sm" onClick={add} disabled={rows.length >= 50}>
          <Plus aria-hidden />
          Adicionar EC
        </Button>
      </div>
    </div>
  );
}
