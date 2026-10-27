"use client";

import { useState, useTransition } from "react";
import { SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCnpj, onlyDigits } from "@/lib/format/document";
import { formatCnae } from "@/features/empresas/cnae";
import { lookupCnpj } from "../lookup-actions";
import type { CnpjPrefill } from "../lookup-parsers";

type Errors = Partial<Record<string, string[]>>;

export type IdentityValues = {
  cnpj: string;
  legalName: string;
  tradeName: string;
  marketName: string;
  cnae: string;
  cnaeDescription: string;
};

type Lookup = { kind: "idle" } | { kind: "ok"; message: string } | { kind: "error"; message: string };

/** CNPJ (com busca na BrasilAPI), nomes e CNAE. A busca só preenche; o usuário revisa e salva. */
export function IdentityFields({
  initial,
  errors,
  autoFocus,
  onAddressFound,
}: {
  initial: IdentityValues;
  errors?: Errors;
  autoFocus?: boolean;
  onAddressFound: (address: CnpjPrefill["address"]) => void;
}) {
  const [values, setValues] = useState(() => ({ ...initial, cnpj: formatCnpj(initial.cnpj), cnae: formatCnae(initial.cnae) }));
  const [lookup, setLookup] = useState<Lookup>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const set = (name: keyof IdentityValues) => (value: string) => setValues((v) => ({ ...v, [name]: value }));
  const cnpjComplete = onlyDigits(values.cnpj).length === 14;

  function search() {
    setLookup({ kind: "idle" });
    startTransition(async () => {
      const result = await lookupCnpj(values.cnpj);
      if (!result.ok) {
        setLookup({ kind: "error", message: result.error });
        return;
      }
      const d = result.data;
      setValues((v) => ({
        ...v,
        legalName: d.legalName || v.legalName,
        tradeName: d.tradeName || v.tradeName,
        cnae: d.cnae ? formatCnae(d.cnae) : v.cnae,
        cnaeDescription: d.cnaeDescription || v.cnaeDescription,
      }));
      onAddressFound(d.address);
      const situation = d.situation ? ` Atenção: situação cadastral ${d.situation.toLowerCase()}.` : "";
      setLookup({ kind: "ok", message: `Dados preenchidos pela BrasilAPI. Confira antes de salvar.${situation}` });
    });
  }

  const cnpjHint =
    lookup.kind === "ok" ? lookup.message : "Com o CNPJ completo, “Buscar” preenche nomes, CNAE e endereço.";
  const cnpjError = errors?.cnpj ?? (lookup.kind === "error" ? lookup.message : undefined);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <Field id="company-cnpj" label="CNPJ" required error={cnpjError} hint={<span aria-live="polite">{cnpjHint}</span>} className="min-w-0 flex-1">
            <Input
              name="cnpj"
              value={values.cnpj}
              onChange={(e) => {
                set("cnpj")(formatCnpj(e.target.value));
                if (lookup.kind !== "idle") setLookup({ kind: "idle" });
              }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="00.000.000/0000-00"
              autoFocus={autoFocus}
            />
          </Field>
          <Button
            variant="secondary"
            onClick={search}
            loading={pending}
            disabled={!cnpjComplete}
            className="shrink-0 self-start sm:mt-[26px]"
            aria-describedby="company-cnpj-hint"
          >
            {pending ? "Buscando…" : (
              <>
                <SearchCheck aria-hidden />
                Buscar pelo CNPJ
              </>
            )}
          </Button>
        </div>
      </div>
      <Field id="company-market" label="Nome do mercado" error={errors?.marketName} hint="Aparece no mapa de Empresas.">
        <Input name="marketName" defaultValue={initial.marketName} maxLength={200} autoComplete="off" />
      </Field>
      <Field id="company-legal" label="Razão social" required error={errors?.legalName}>
        <Input name="legalName" value={values.legalName} onChange={(e) => set("legalName")(e.target.value)} maxLength={200} autoComplete="off" />
      </Field>
      <Field id="company-trade" label="Nome fantasia" error={errors?.tradeName}>
        <Input name="tradeName" value={values.tradeName} onChange={(e) => set("tradeName")(e.target.value)} maxLength={200} autoComplete="off" />
      </Field>
      <Field id="company-cnae" label="CNAE principal" error={errors?.cnae} hint="7 dígitos, ex.: 4711-3/02 (supermercados).">
        <Input
          name="cnae"
          value={values.cnae}
          onChange={(e) => set("cnae")(formatCnae(e.target.value))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0000-0/00"
          className="font-mono tabular-nums"
        />
      </Field>
      <Field id="company-cnae-desc" label="Descrição do CNAE" error={errors?.cnaeDescription} className="sm:col-span-2">
        <Input
          name="cnaeDescription"
          value={values.cnaeDescription}
          onChange={(e) => set("cnaeDescription")(e.target.value)}
          maxLength={200}
          autoComplete="off"
          placeholder="Comércio varejista de mercadorias em geral…"
        />
      </Field>
    </div>
  );
}
