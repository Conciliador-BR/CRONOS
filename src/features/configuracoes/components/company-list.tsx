import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, ChevronRight, CornerDownRight, MapPinOff, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCnpj } from "@/lib/format/document";
import { cn } from "@/lib/utils";
import { formatCnae } from "@/features/empresas/cnae";
import { marketLabel } from "@/features/empresas/map-utils";
import { groupBranches } from "../branches";
import type { CompanyListItem } from "../queries";

const NEW_HREF = "/configuracoes/empresas/nova";

function Row({ company: c, badge, nested }: { company: CompanyListItem; badge?: ReactNode; nested?: boolean }) {
  return (
    <Link
      href={`/configuracoes/empresas/${c.id}`}
      className={cn(
        "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-offset-[-2px]",
        nested && "bg-bg/40 pl-6 sm:pl-10",
      )}
    >
      {nested ? <CornerDownRight aria-hidden className="size-4 shrink-0 text-muted" /> : null}
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-fg">{marketLabel(c)}</span>
          {badge}
          {c.located ? null : (
            <span className="inline-flex items-center gap-1 text-xs text-muted" title="Sem coordenadas no mapa">
              <MapPinOff aria-hidden className="size-3.5" />
              <span className="sr-only sm:not-sr-only">sem localização</span>
            </span>
          )}
        </p>
        <p className="truncate text-xs text-muted">
          <span className="tabular-nums">{formatCnpj(c.cnpj)}</span> · {c.legalName}
          {c.cnae ? <span className="tabular-nums"> · CNAE {formatCnae(c.cnae)}</span> : null}
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
  );
}

/** Lista das empresas cadastradas, com as filiais agrupadas sob a matriz. */
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
  const groups = groupBranches(companies);
  const names = new Map(companies.map((c) => [c.id, marketLabel(c)]));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{companies.length === 1 ? "1 empresa" : `${companies.length} empresas`}</p>
        <Link href={NEW_HREF} className={buttonVariants()}>
          <Plus aria-hidden />
          Nova empresa
        </Link>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {groups.map(({ company, branches, orphan }) => (
          <li key={company.id}>
            <Row
              company={company}
              badge={
                branches.length ? (
                  <Badge variant="primary">Matriz · {branches.length === 1 ? "1 filial" : `${branches.length} filiais`}</Badge>
                ) : orphan ? (
                  <Badge>Filial de {names.get(company.parentId ?? "") ?? "outra empresa"}</Badge>
                ) : null
              }
            />
            {branches.length ? (
              <ul aria-label={`Filiais de ${marketLabel(company)}`} className="divide-y divide-border border-t border-border">
                {branches.map((b) => (
                  <li key={b.id}>
                    <Row company={b} nested badge={<Badge>Filial</Badge>} />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
