"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { formatMonthLabel, lastMonths, shiftMonth, type MonthKey } from "../../lib/months";

type Props = { month: MonthKey; currentMonth: MonthKey; basePath: string };

/** Seletor de mês (?mes=AAAA-MM): anterior, lista dos últimos 24 meses e próximo. */
export function MonthSelector({ month, currentMonth, basePath }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const options = lastMonths(currentMonth, 24).reverse();
  if (!options.includes(month)) options.push(month);
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const href = (key: MonthKey) => `${basePath}?mes=${key}`;
  const iconButton = buttonVariants({ variant: "secondary", size: "icon" });

  return (
    <div className="flex items-center gap-2">
      <Link href={href(prev)} className={iconButton} aria-label={`Mês anterior: ${formatMonthLabel(prev)}`} scroll={false}>
        <ChevronLeft aria-hidden className="size-4" />
      </Link>
      <Select
        aria-label="Mês"
        value={month}
        onChange={(event) => startTransition(() => router.push(href(event.target.value as MonthKey), { scroll: false }))}
        className="w-48 capitalize"
      >
        {options.map((key) => (
          <option key={key} value={key}>
            {formatMonthLabel(key)}
          </option>
        ))}
      </Select>
      {month < currentMonth ? (
        <Link href={href(next)} className={iconButton} aria-label={`Próximo mês: ${formatMonthLabel(next)}`} scroll={false}>
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span aria-hidden className={`${iconButton} pointer-events-none opacity-40`}>
          <ChevronRight className="size-4" />
        </span>
      )}
      {pending ? <Spinner label="Carregando mês…" /> : null}
    </div>
  );
}
