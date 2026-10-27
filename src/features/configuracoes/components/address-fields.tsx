"use client";

import { useRef, useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { UFS, UF_NAMES, toUf } from "@/features/empresas/brazil-states";
import { formatCep } from "@/features/empresas/format";

export type AddressValues = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  uf: string;
};

type ViaCep = { erro?: boolean | string; logradouro?: string; bairro?: string; localidade?: string; uf?: string };

type CepStatus = { kind: "idle" | "loading" | "ok" } | { kind: "error"; message: string };

/** Endereço com preenchimento opcional pelo ViaCEP (consultado no navegador ao completar 8 dígitos). */
export function AddressFields({ initial, errors }: { initial: AddressValues; errors?: Partial<Record<string, string[]>> }) {
  const [values, setValues] = useState(initial);
  const [status, setStatus] = useState<CepStatus>({ kind: "idle" });
  const lastLookup = useRef<string | null>(null);

  const set = (name: keyof AddressValues) => (value: string) => setValues((v) => ({ ...v, [name]: value }));

  async function lookup(cep: string) {
    if (lastLookup.current === cep) return;
    lastLookup.current = cep;
    setStatus({ kind: "loading" });
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = (await response.json()) as ViaCep;
      if (!response.ok || data.erro) {
        setStatus({ kind: "error", message: "CEP não encontrado. Preencha o endereço manualmente." });
        return;
      }
      setValues((v) => ({
        ...v,
        street: data.logradouro || v.street,
        district: data.bairro || v.district,
        city: data.localidade || v.city,
        uf: toUf(data.uf) ?? v.uf,
      }));
      setStatus({ kind: "ok" });
    } catch {
      setStatus({ kind: "error", message: "Não foi possível consultar o CEP agora. Preencha manualmente." });
    }
  }

  function onCepChange(raw: string) {
    const formatted = formatCep(raw);
    set("cep")(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) void lookup(digits);
    else if (status.kind !== "idle") setStatus({ kind: "idle" });
  }

  const hint =
    status.kind === "loading" ? (
      <span className="inline-flex items-center gap-1.5">
        <Spinner /> Buscando endereço…
      </span>
    ) : status.kind === "error" ? (
      status.message
    ) : status.kind === "ok" ? (
      "Endereço preenchido pelo CEP. Confira e complete."
    ) : (
      "Digite os 8 dígitos para preencher o endereço."
    );

  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Field id="company-cep" label="CEP" error={errors?.cep} hint={<span aria-live="polite">{hint}</span>} className="sm:col-span-2">
        <Input
          name="cep"
          value={values.cep}
          onChange={(e) => onCepChange(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="00000-000"
        />
      </Field>
      <Field id="company-street" label="Logradouro" error={errors?.street} className="sm:col-span-4">
        <Input name="street" value={values.street} onChange={(e) => set("street")(e.target.value)} maxLength={200} autoComplete="off" />
      </Field>
      <Field id="company-number" label="Número" error={errors?.number} className="sm:col-span-2">
        <Input name="number" value={values.number} onChange={(e) => set("number")(e.target.value)} maxLength={20} autoComplete="off" />
      </Field>
      <Field id="company-complement" label="Complemento" error={errors?.complement} className="sm:col-span-4">
        <Input
          name="complement"
          value={values.complement}
          onChange={(e) => set("complement")(e.target.value)}
          maxLength={120}
          autoComplete="off"
        />
      </Field>
      <Field id="company-district" label="Bairro" error={errors?.district} className="sm:col-span-2">
        <Input name="district" value={values.district} onChange={(e) => set("district")(e.target.value)} maxLength={120} autoComplete="off" />
      </Field>
      <Field id="company-city" label="Cidade" error={errors?.city} className="sm:col-span-2">
        <Input name="city" value={values.city} onChange={(e) => set("city")(e.target.value)} maxLength={120} autoComplete="off" />
      </Field>
      <Field id="company-uf" label="UF" required error={errors?.uf} className="sm:col-span-2">
        <Select name="uf" value={values.uf} onChange={(e) => set("uf")(e.target.value)} placeholder="Selecione…">
          {UFS.map((uf) => (
            <option key={uf} value={uf}>
              {uf} · {UF_NAMES[uf]}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
