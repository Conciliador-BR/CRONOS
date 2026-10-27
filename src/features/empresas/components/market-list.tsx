"use client";

import { ChevronRight, Store } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { marketLabel, type CompanySummary } from "../map-utils";

type MarketListProps = {
  companies: readonly CompanySummary[];
  /** Mostra a UF ao lado da cidade (resultados de busca, que misturam estados). */
  withUf?: boolean;
  pendingId: string | null;
  activeId: string | null;
  onOpen: (id: string) => void;
  /** Nome da matriz por id, para mostrar "Filial de X". */
  parentNames?: ReadonlyMap<string, string>;
};

/** Lista de mercados; cada item abre o detalhe do cliente. */
export function MarketList({ companies, withUf, pendingId, activeId, onOpen, parentNames }: MarketListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {companies.map((company) => {
        const place = [company.city, withUf ? company.uf : null].filter(Boolean).join(" · ");
        const parent = company.parentId ? parentNames?.get(company.parentId) : undefined;
        const located = company.latitude !== null && company.longitude !== null;
        return (
          <li key={company.id}>
            <button
              type="button"
              onClick={() => onOpen(company.id)}
              aria-current={activeId === company.id ? "true" : undefined}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2 aria-[current=true]:bg-primary/15"
            >
              <Store aria-hidden className={located ? "size-4 shrink-0 text-ring" : "size-4 shrink-0 text-muted"} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{marketLabel(company)}</span>
                <span className="block truncate text-xs text-muted">
                  {place || "Cidade não informada"}
                  {parent ? ` · Filial de ${parent}` : ""}
                  {located ? "" : " · local aproximado"}
                </span>
              </span>
              {pendingId === company.id ? (
                <Spinner label="Abrindo…" />
              ) : (
                <ChevronRight aria-hidden className="size-4 shrink-0 text-muted group-hover:text-fg" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
