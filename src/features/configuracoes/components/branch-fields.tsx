"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MatrizOption } from "../queries";

type CompanyType = "matriz" | "filial";

const TYPES: { value: CompanyType; label: string; hint: string }[] = [
  { value: "matriz", label: "Matriz", hint: "Empresa principal (pode ter filiais)." },
  { value: "filial", label: "Filial", hint: "Unidade ligada a uma matriz." },
];

/** Tipo da empresa e, para filial, a escolha da matriz (só um nível: matriz → filiais). */
export function BranchFields({
  options,
  initialParentId,
  branchCount,
  errors,
}: {
  options: MatrizOption[];
  initialParentId: string | null;
  /** Filiais já ligadas a esta empresa: se houver, ela não pode virar filial. */
  branchCount: number;
  errors?: Partial<Record<string, string[]>>;
}) {
  const [type, setType] = useState<CompanyType>(initialParentId ? "filial" : "matriz");
  const filialBlocked = branchCount > 0;

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Tipo</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => {
            const disabled = t.value === "filial" && filialBlocked && type !== "filial";
            return (
              <label
                key={t.value}
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                  type === t.value ? "border-primary bg-primary/15 text-fg" : "border-border text-muted hover:bg-surface-2",
                  disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                )}
              >
                <input
                  type="radio"
                  name="companyType"
                  value={t.value}
                  checked={type === t.value}
                  disabled={disabled}
                  onChange={() => setType(t.value)}
                  className="accent-primary"
                />
                {t.label}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">
          {filialBlocked
            ? `Esta empresa é matriz de ${branchCount === 1 ? "1 filial" : `${branchCount} filiais`}, por isso não pode virar filial.`
            : TYPES.find((t) => t.value === type)?.hint}
        </p>
      </fieldset>

      {type === "filial" ? (
        options.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma matriz disponível. Cadastre a matriz primeiro.</p>
        ) : (
          <Field id="company-parent" label="Matriz" required error={errors?.parentCompanyId}>
            <Select name="parentCompanyId" defaultValue={initialParentId ?? ""} placeholder="Selecione a matriz…">
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label} · {o.city ? `${o.city}/${o.uf}` : o.uf}
                </option>
              ))}
            </Select>
          </Field>
        )
      ) : errors?.parentCompanyId ? (
        <p className="text-xs font-medium text-danger">{errors.parentCompanyId[0]}</p>
      ) : null}
    </div>
  );
}
