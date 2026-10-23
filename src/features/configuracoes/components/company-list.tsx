import Link from "next/link";
import { Building2, ChevronRight, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCnpj } from "@/lib/format/document";
import { marketLabel } from "@/features/empresas/map-utils";
import type { CompanyListItem } from "../queries";

const NEW_HREF = "/configuracoes/empresas/nova";

/** Lista das empresas cadastradas com atalho para edição. */
export function CompanyList({ companies }: { companies: CompanyListItem[] }) {
  if (companies.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Nenhuma empresa cadastrada"
        description="Cadastre a primeira empresa para ela aparecer no mapa."
        action={
          <Link href={NEW_HREF} className={buttonVariants()}>
            <Plus aria-hidden />
            Nova empresa
          </Link>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {companies.length === 1 ? "1 empresa" : `${companies.length} empresas`}
        </p>
        <Link href={NEW_HREF} className={buttonVariants()}>
          <Plus aria-hidden />
          Nova empresa
        </Link>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {companies.map((c) => (
          <li key={c.id}>
            <Link
              href={`/configuracoes/empresas/${c.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-offset-[-2px]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{marketLabel(c)}</p>
                <p className="truncate text-xs text-muted">
                  <span className="tabular-nums">{formatCnpj(c.cnpj)}</span> · {c.legalName}
                </p>
              </div>
              <div className="hidden min-w-0 text-right text-xs text-muted sm:block">
                <p>{c.city ? `${c.city}/${c.uf}` : c.uf}</p>
                <p className="truncate">
                  {c.clientName ?? "Sem cliente"} · {c.ecCount === 1 ? "1 EC" : `${c.ecCount} ECs`}
                </p>
              </div>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
