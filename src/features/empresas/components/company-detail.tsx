import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, ChevronRight, FileText, Landmark, Lock } from "lucide-react";
import { formatCnpj } from "@/lib/format/document";
import { cn } from "@/lib/utils";
import { formatCnae } from "../cnae";
import { accountTypeLabel, formatAddress, formatBytes, formatCpfCnpj } from "../format";
import type { CompanyDetail as Detail, RelatedCompany } from "../queries";
import { DocumentDownloadButton } from "./document-download-button";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {children}
    </section>
  );
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-sm break-words text-fg">{value || <span className="text-muted">Não informado</span>}</dd>
    </div>
  );
}

function RelatedLink({ company }: { company: RelatedCompany }) {
  return (
    <Link
      href={`/empresas?uf=${company.uf}&empresa=${company.id}`}
      replace
      scroll={false}
      className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-surface-2"
    >
      <Building2 aria-hidden className="size-4 shrink-0 text-ring" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-fg">{company.name}</span>
        <span className="block truncate text-xs text-muted">{company.city ? `${company.city}/${company.uf}` : company.uf}</span>
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-muted group-hover:text-fg" />
    </Link>
  );
}

const coordFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 6, maximumFractionDigits: 6 });

/** Informações cadastradas da empresa e do cliente. Dados restritos só aparecem para admin/gestor. */
export function CompanyDetail({ detail, className }: { detail: Detail; className?: string }) {
  const { company, ecs, client, restricted, parent, branches } = detail;
  const located = company.latitude !== null && company.longitude !== null;
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <Section title="Empresa">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Item label="CNPJ" value={<span className="tabular-nums">{formatCnpj(company.cnpj)}</span>} />
          <Item label="Mercado" value={company.marketName} />
          <Item label="Razão social" value={company.legalName} />
          <Item label="Nome fantasia" value={company.tradeName} />
          <div className="sm:col-span-2">
            <Item
              label="CNAE principal"
              value={
                company.cnae ? (
                  <>
                    <span className="font-mono tabular-nums">{formatCnae(company.cnae)}</span>
                    {company.cnaeDescription ? <span className="text-muted"> · {company.cnaeDescription}</span> : null}
                  </>
                ) : null
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Item label="Endereço" value={formatAddress(company)} />
          </div>
          <div className="sm:col-span-2">
            <Item
              label="Localização no mapa"
              value={
                located ? (
                  <span className="tabular-nums">
                    {coordFormat.format(company.latitude!)}, {coordFormat.format(company.longitude!)}
                  </span>
                ) : (
                  <span className="text-muted">Aproximada (sem coordenadas cadastradas)</span>
                )
              }
            />
          </div>
        </dl>
      </Section>

      {parent ? (
        <Section title="Matriz">
          <RelatedLink company={parent} />
        </Section>
      ) : null}
      {branches.length > 0 ? (
        <Section title={branches.length === 1 ? "1 filial" : `${branches.length} filiais`}>
          <ul className="flex flex-col gap-2">
            {branches.map((b) => (
              <li key={b.id}>
                <RelatedLink company={b} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="ECs por adquirente">
        {ecs.length === 0 ? (
          <p className="text-sm text-muted">Nenhum EC cadastrado.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {ecs.map((ec) => (
              <li key={ec.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-medium text-fg">{ec.acquirer}</span>
                <span className="font-mono text-muted tabular-nums">{ec.ecNumber}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Cliente vinculado">
        {client ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Item label="Nome" value={client.name} />
            <Item label="CPF/CNPJ" value={client.document ? formatCpfCnpj(client.document) : null} />
            <Item label="E-mail" value={client.email} />
            <Item label="Telefone" value={client.phone} />
            <div className="sm:col-span-2">
              <Item label="Observações" value={client.notes ? <span className="whitespace-pre-line">{client.notes}</span> : null} />
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted">Nenhum cliente vinculado a esta empresa.</p>
        )}
      </Section>

      {restricted ? (
        <>
          <Section title="Contas bancárias">
            {restricted.bankAccounts.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma conta cadastrada.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {restricted.bankAccounts.map((b) => (
                  <li key={b.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2">
                    <Landmark aria-hidden className="mt-0.5 size-4 shrink-0 text-ring" />
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-fg">{b.bank}</p>
                      <p className="text-muted tabular-nums">
                        Agência {b.agency} · Conta {b.account} · {accountTypeLabel(b.accountType)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Documentos (PDF)">
            {restricted.documents.length === 0 ? (
              <p className="text-sm text-muted">Nenhum PDF anexado.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {restricted.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <FileText aria-hidden className="size-4 shrink-0 text-ring" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium text-fg" title={d.fileName}>
                        {d.fileName}
                      </p>
                      <p className="text-xs text-muted">
                        {formatBytes(d.sizeBytes)} · {dateFormat.format(new Date(d.createdAt))}
                      </p>
                    </div>
                    <DocumentDownloadButton documentId={d.id} fileName={d.fileName} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      ) : (
        <p className="flex items-center gap-2 text-xs text-muted">
          <Lock aria-hidden className="size-3.5" />
          Dados bancários e documentos ficam visíveis só para administradores e gestores.
        </p>
      )}
    </div>
  );
}
