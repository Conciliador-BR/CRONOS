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
};

/** Lista de mercados; cada item abre o detalhe do cliente. */
export function MarketList({ companies, withUf, pendingId, activeId, onOpen }: MarketListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {companies.map((company) => {
        const place = [company.city, withUf ? company.uf : null].filter(Boolean).join(" · ");
        return (
          <li key={company.id}>
            <button
              type="button"
              onClick={() => onOpen(company.id)}
              aria-current={activeId === company.id ? "true" : undefined}
              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2 aria-[current=true]:bg-primary/15"
            >
              <Store aria-hidden className="size-4 shrink-0 text-ring" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{marketLabel(company)}</span>
                <span className="block truncate text-xs text-muted">{place || "Cidade não informada"}</span>
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
