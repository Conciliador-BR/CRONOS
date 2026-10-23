"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_SOURCES, LEAD_TEMPERATURES, SOURCE_LABELS, TEMPERATURE_LABELS, type LeadSource } from "../../constants";
import type { MemberOption, PipelineLead } from "../../types";

export type FieldErrors = Record<string, string[] | undefined>;

type Props = {
  /** Prefixo dos ids (dois formulários podem coexistir na página). */
  idPrefix: string;
  members: MemberOption[];
  errors: FieldErrors;
  defaults?: Partial<PipelineLead>;
  disabled?: boolean;
  autoFocus?: boolean;
};

/** Campos do lead (novo e edição). O nome do indicador só aparece, e é obrigatório, para Indicação. */
export function LeadFormFields({ idPrefix, members, errors, defaults, disabled, autoFocus }: Props) {
  const [source, setSource] = useState<LeadSource | "">(defaults?.source ?? "");
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
      <Field id={id("name")} label="Nome" required error={errors.name} className="sm:col-span-2">
        <Input name="name" defaultValue={defaults?.name} maxLength={160} autoComplete="off" autoFocus={autoFocus} />
      </Field>
      <Field id={id("companyName")} label="Empresa" error={errors.companyName}>
        <Input name="companyName" defaultValue={defaults?.companyName ?? ""} maxLength={200} autoComplete="off" />
      </Field>
      <Field id={id("ownerId")} label="Responsável" error={errors.ownerId}>
        <Select name="ownerId" defaultValue={defaults?.ownerId ?? ""} placeholder="Sem responsável">
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={id("email")} label="E-mail" error={errors.email}>
        <Input name="email" type="email" defaultValue={defaults?.email ?? ""} maxLength={160} autoComplete="off" spellCheck={false} />
      </Field>
      <Field id={id("phone")} label="Telefone" error={errors.phone}>
        <Input name="phone" type="tel" defaultValue={defaults?.phone ?? ""} maxLength={30} autoComplete="off" />
      </Field>
      <Field id={id("source")} label="Origem" required error={errors.source}>
        <Select
          name="source"
          value={source}
          onChange={(event) => setSource(event.target.value as LeadSource | "")}
          placeholder="Selecione…"
        >
          {LEAD_SOURCES.map((value) => (
            <option key={value} value={value}>
              {SOURCE_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={id("temperature")} label="Temperatura" required error={errors.temperature}>
        <Select name="temperature" defaultValue={defaults?.temperature ?? ""} placeholder="Selecione…">
          {LEAD_TEMPERATURES.map((value) => (
            <option key={value} value={value}>
              {TEMPERATURE_LABELS[value]}
            </option>
          ))}
        </Select>
      </Field>
      {source === "indicacao" ? (
        <Field id={id("referrerName")} label="Nome do indicador" required error={errors.referrerName} className="sm:col-span-2">
          <Input name="referrerName" defaultValue={defaults?.referrerName ?? ""} maxLength={160} autoComplete="off" />
        </Field>
      ) : null}
      <Field id={id("description")} label="Descrição" error={errors.description} className="sm:col-span-2">
        <Textarea name="description" defaultValue={defaults?.description ?? ""} rows={3} maxLength={5000} />
      </Field>
    </fieldset>
  );
}

/** Lê os campos do formulário como strings (o Zod no servidor valida). */
export function readForm(form: HTMLFormElement): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of new FormData(form)) if (typeof value === "string") values[key] = value;
  return values;
}
