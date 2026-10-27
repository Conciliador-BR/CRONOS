import Link from "next/link";
import { cn } from "@/lib/utils";
import { PERIODS, PERIOD_LABELS, type Period } from "../../lib/periods";

/** Filtro de período por links (?periodo=…), funciona sem JavaScript. */
export function PeriodFilter({ period, basePath }: { period: Period; basePath: string }) {
  return (
    <nav aria-label="Período" className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
      {PERIODS.map((value) => {
        const active = value === period;
        return (
          <Link
            key={value}
            href={`${basePath}?periodo=${value}`}
            aria-current={active ? "page" : undefined}
            scroll={false}
            className={cn(
              "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {PERIOD_LABELS[value]}
          </Link>
        );
      })}
    </nav>
  );
}
