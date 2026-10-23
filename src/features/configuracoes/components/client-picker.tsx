"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { formatCpfCnpj } from "@/features/empresas/format";
import { cn } from "@/lib/utils";
import type { ClientOption } from "../queries";
import { ClientFields } from "./client-fields";

type Mode = "none" | "existing" | "new";

const MODES: { value: Mode; label: string }[] = [
  { value: "existing", label: "Cliente existente" },
  { value: "new", label: "Cadastrar novo cliente" },
  { value: "none", label: "Sem cliente" },
];

/** Vincula um cliente existente, cadastra um novo no mesmo envio ou deixa sem cliente. */
export function ClientPicker({
  options,
  initialClientId,
  errors,
}: {
  options: ClientOption[];
  initialClientId: string | null;
  errors?: Partial<Record<string, string[]>>;
}) {
  const [mode, setMode] = useState<Mode>(initialClientId ? "existing" : options.length ? "existing" : "new");

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="sr-only">Como vincular o cliente</legend>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring",
                mode === m.value ? "border-primary bg-primary/15 text-fg" : "border-border text-muted hover:bg-surface-2",
              )}
            >
              <input
                type="radio"
                name="clientMode"
                value={m.value}
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
                className="accent-primary"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      {mode === "existing" ? (
        options.length === 0 ? (
          <p className="text-sm text-muted">Nenhum cliente cadastrado ainda. Escolha “Cadastrar novo cliente”.</p>
        ) : (
          <Field id="company-client" label="Cliente" required error={errors?.clientId}>
            <Select name="clientId" defaultValue={initialClientId ?? ""} placeholder="Selecione o cliente…">
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.document ? ` · ${formatCpfCnpj(c.document)}` : ""}
                </option>
              ))}
            </Select>
          </Field>
        )
      ) : null}

      {mode === "new" ? <ClientFields prefix="client." idPrefix="new-client" errors={errors} /> : null}
      {mode === "none" ? <p className="text-sm text-muted">A empresa ficará sem cliente vinculado.</p> : null}
    </div>
  );
}
