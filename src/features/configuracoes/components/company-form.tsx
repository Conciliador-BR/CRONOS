"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCep } from "@/features/empresas/format";
import type { ActionResult } from "../action-result";
import { createCompany, updateCompany } from "../company-actions";
import type { CnpjPrefill } from "../lookup-parsers";
import type { ClientOption, CompanyFormData, MatrizOption } from "../queries";
import { AddressFields, type AddressValues } from "./address-fields";
import { BankFields } from "./bank-fields";
import { BranchFields } from "./branch-fields";
import { ClientPicker } from "./client-picker";
import { EcFields } from "./ec-fields";
import { IdentityFields } from "./identity-fields";
import { LocationFields } from "./location-fields";

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

/** Cadastro/edição de empresa com CNAE, matriz/filial, endereço, localização, ECs, contas e cliente. */
export function CompanyForm({
  company,
  clientOptions,
  matrizOptions,
}: {
  company: CompanyFormData | null;
  clientOptions: ClientOption[];
  matrizOptions: MatrizOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const errors = result && !result.ok ? result.fieldErrors : undefined;
  // O endereço é recriado (key) quando a busca pelo CNPJ traz um endereço novo.
  const [address, setAddress] = useState<{ key: number; values: AddressValues }>(() => ({
    key: 0,
    values: {
      cep: formatCep(company?.cep),
      street: company?.street ?? "",
      number: company?.number ?? "",
      complement: company?.complement ?? "",
      district: company?.district ?? "",
      city: company?.city ?? "",
      uf: company?.uf ?? "",
    },
  }));

  /** Mescla o endereço da BrasilAPI com o que já foi digitado (campo vazio na resposta não apaga). */
  function applyAddress(found: CnpjPrefill["address"]) {
    const data = formRef.current ? new FormData(formRef.current) : null;
    const current = (name: keyof AddressValues) => String(data?.get(name) ?? "");
    setAddress((prev) => ({
      key: prev.key + 1,
      values: {
        cep: formatCep(found.cep) || current("cep"),
        street: found.street || current("street"),
        number: found.number || current("number"),
        complement: found.complement || current("complement"),
        district: found.district || current("district"),
        city: found.city || current("city"),
        uf: found.uf || current("uf"),
      },
    }));
  }

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
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div ref={alertRef} tabIndex={-1} className="outline-none empty:hidden">
        {result && !result.ok ? (
          <Alert tone="danger" title="Não foi possível salvar">
            {result.error}
          </Alert>
        ) : null}
        {result?.ok ? <Alert tone="success">{result.message ?? "Salvo."}</Alert> : null}
      </div>

      <Section title="Dados da empresa">
        <IdentityFields
          initial={{
            cnpj: company?.cnpj ?? "",
            legalName: company?.legalName ?? "",
            tradeName: company?.tradeName ?? "",
            marketName: company?.marketName ?? "",
            cnae: company?.cnae ?? "",
            cnaeDescription: company?.cnaeDescription ?? "",
          }}
          errors={errors}
          autoFocus={!company}
          onAddressFound={applyAddress}
        />
      </Section>

      <Section title="Matriz ou filial" description="Filiais aparecem agrupadas sob a matriz.">
        <BranchFields
          options={matrizOptions}
          initialParentId={company?.parentCompanyId ?? null}
          branchCount={company?.branchCount ?? 0}
          errors={errors}
        />
      </Section>

      <Section title="Endereço" description="A UF e a localização posicionam o mercado no mapa.">
        <AddressFields key={address.key} errors={errors} initial={address.values} />
      </Section>

      <Section title="Localização no mapa" description="Opcional. Sem coordenadas, o mercado aparece perto do centro do estado.">
        <LocationFields
          initial={{ latitude: company?.latitude ?? null, longitude: company?.longitude ?? null }}
          initialUf={company?.uf ?? null}
          errors={errors}
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
