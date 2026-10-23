"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatCnpj } from "@/lib/format/document";
import { formatCep } from "@/features/empresas/format";
import type { ActionResult } from "../action-result";
import { createCompany, updateCompany } from "../company-actions";
import type { ClientOption, CompanyFormData } from "../queries";
import { AddressFields } from "./address-fields";
import { BankFields } from "./bank-fields";
import { ClientPicker } from "./client-picker";
import { EcFields } from "./ec-fields";

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Cadastro/edição de empresa com endereço, ECs, contas e cliente. */
export function CompanyForm({ company, clientOptions }: { company: CompanyFormData | null; clientOptions: ClientOption[] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [cnpj, setCnpj] = useState(formatCnpj(company?.cnpj ?? ""));
  const alertRef = useRef<HTMLDivElement>(null);
  const errors = result && !result.ok ? result.fieldErrors : undefined;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = company ? await updateCompany(company.id, formData) : await createCompany(formData);
      setResult(next);
      requestAnimationFrame(() => alertRef.current?.focus());
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div ref={alertRef} tabIndex={-1} className="outline-none empty:hidden">
        {result && !result.ok ? (
          <Alert tone="danger" title="Não foi possível salvar">
            {result.error}
          </Alert>
        ) : null}
        {result?.ok ? <Alert tone="success">{result.message ?? "Salvo."}</Alert> : null}
      </div>

      <Section title="Dados da empresa">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="company-cnpj" label="CNPJ" required error={errors?.cnpj}>
            <Input
              name="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpj(e.target.value))}
              inputMode="numeric"
              autoComplete="off"
              placeholder="00.000.000/0000-00"
              autoFocus={!company}
            />
          </Field>
          <Field id="company-market" label="Nome do mercado" error={errors?.marketName} hint="Aparece no mapa de Empresas.">
            <Input name="marketName" defaultValue={company?.marketName ?? ""} maxLength={200} autoComplete="off" />
          </Field>
          <Field id="company-legal" label="Razão social" required error={errors?.legalName}>
            <Input name="legalName" defaultValue={company?.legalName ?? ""} maxLength={200} autoComplete="off" />
          </Field>
          <Field id="company-trade" label="Nome fantasia" error={errors?.tradeName}>
            <Input name="tradeName" defaultValue={company?.tradeName ?? ""} maxLength={200} autoComplete="off" />
          </Field>
        </div>
      </Section>

      <Section title="Endereço" description="A UF posiciona a empresa no mapa.">
        <AddressFields
          errors={errors}
          initial={{
            cep: formatCep(company?.cep),
            street: company?.street ?? "",
            number: company?.number ?? "",
            complement: company?.complement ?? "",
            district: company?.district ?? "",
            city: company?.city ?? "",
            uf: company?.uf ?? "",
          }}
        />
      </Section>

      <Section title="ECs por adquirente" description="Um estabelecimento pode ter vários números de EC.">
        <EcFields initial={company?.ecs ?? []} errors={errors} />
      </Section>

      <Section title="Contas bancárias" description="Visíveis só para administradores e gestores.">
        <BankFields initial={company?.banks ?? []} errors={errors} />
      </Section>

      <Section title="Cliente">
        <ClientPicker options={clientOptions} initialClientId={company?.clientId ?? null} errors={errors} />
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href="/configuracoes/empresas" className={buttonVariants({ variant: "secondary" })}>
          Voltar
        </Link>
        <Button type="submit" loading={pending}>
          {pending ? "Salvando…" : (
            <>
              <Save aria-hidden />
              {company ? "Salvar alterações" : "Cadastrar empresa"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
