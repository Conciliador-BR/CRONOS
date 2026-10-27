"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCpfCnpj } from "@/features/empresas/format";

export type ClientValues = {
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type ClientFieldsProps = {
  /** Prefixo dos nomes no FormData (ex.: "client.") e dos ids. */
  prefix?: string;
  idPrefix: string;
  initial?: ClientValues | null;
  errors?: Partial<Record<string, string[]>>;
  autoFocus?: boolean;
};

/** Campos do cliente: nome, CPF/CNPJ (com máscara), e-mail, telefone e observações. */
export function ClientFields({ prefix = "", idPrefix, initial, errors, autoFocus }: ClientFieldsProps) {
  const [document, setDocument] = useState(formatCpfCnpj(initial?.document));
  const err = (name: string) => errors?.[`${prefix}${name}`];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id={`${idPrefix}-name`} label="Nome do cliente" required error={err("name")} className="sm:col-span-2">
        <Input name={`${prefix}name`} defaultValue={initial?.name ?? ""} autoComplete="off" maxLength={160} autoFocus={autoFocus} />
      </Field>
      <Field id={`${idPrefix}-document`} label="CPF ou CNPJ" error={err("document")}>
        <Input
          name={`${prefix}document`}
          value={document}
          onChange={(e) => setDocument(formatCpfCnpj(e.target.value))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
        />
      </Field>
      <Field id={`${idPrefix}-phone`} label="Telefone" error={err("phone")}>
        <Input name={`${prefix}phone`} type="tel" defaultValue={initial?.phone ?? ""} autoComplete="off" maxLength={30} placeholder="(11) 99999-0000" />
      </Field>
      <Field id={`${idPrefix}-email`} label="E-mail" error={err("email")} className="sm:col-span-2">
        <Input
          name={`${prefix}email`}
          type="email"
          defaultValue={initial?.email ?? ""}
          autoComplete="off"
          spellCheck={false}
          maxLength={160}
          placeholder="cliente@empresa.com.br"
        />
      </Field>
      <Field id={`${idPrefix}-notes`} label="Observações" error={err("notes")} className="sm:col-span-2">
        <Textarea name={`${prefix}notes`} defaultValue={initial?.notes ?? ""} rows={3} maxLength={5000} />
      </Field>
    </div>
  );
}
