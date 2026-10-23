import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { agendaHref, getTitle, shiftDay } from "../calendar";
import type { CalendarView } from "../types";

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

const PREV: Record<CalendarView, string> = { month: "Mês anterior", week: "Semana anterior", day: "Dia anterior" };
const NEXT: Record<CalendarView, string> = { month: "Próximo mês", week: "Próxima semana", day: "Próximo dia" };

/** Hoje, anterior/próximo, título do período e troca de visão (links: o servidor busca só o período). */
export function CalendarToolbar({
  view,
  day,
  today,
  action,
}: {
  view: CalendarView;
  day: string;
  today: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {action}
      <Link href={agendaHref(view, today)} className={buttonVariants({ variant: "secondary", size: "sm" })}>
        Hoje
      </Link>
      <div className="flex items-center">
        <Link
          href={agendaHref(view, shiftDay(view, day, -1))}
          aria-label={PREV[view]}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "size-8 px-0" })}
        >
          <ChevronLeft aria-hidden />
        </Link>
        <Link
          href={agendaHref(view, shiftDay(view, day, 1))}
          aria-label={NEXT[view]}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "size-8 px-0" })}
        >
          <ChevronRight aria-hidden />
        </Link>
      </div>
      <h2 className="min-w-0 flex-1 text-lg font-semibold first-letter:uppercase" aria-live="polite">
        {getTitle(view, day)}
      </h2>
      <nav aria-label="Visão da agenda" className="flex rounded-lg border border-border bg-surface p-0.5">
        {VIEWS.map((item) => (
          <Link
            key={item.value}
            href={agendaHref(item.value, day)}
            aria-current={item.value === view ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              item.value === view ? "bg-primary/20 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
