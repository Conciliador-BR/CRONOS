import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { dateToDayKey, dayKeyToDate, isDayKey, wallParts, wallToIso } from "../shared/tz";
import type { CalendarView } from "./types";

export const WEEK_STARTS_ON = 0; // domingo, como o Google Agenda em pt-BR
export const MINUTES_PER_DAY = 24 * 60;

/** Valores da visão na URL (?visao=mes|semana|dia). */
export const VIEW_PARAM: Record<CalendarView, string> = { month: "mes", week: "semana", day: "dia" };

export function parseView(value: unknown): CalendarView {
  const entry = Object.entries(VIEW_PARAM).find(([, param]) => param === value);
  return (entry?.[0] as CalendarView | undefined) ?? "week";
}

export function agendaHref(view: CalendarView, dayKey: string): string {
  return `/operacional/agenda?visao=${VIEW_PARAM[view]}&data=${dayKey}`;
}

export function parseDay(value: unknown, fallback: string): string {
  return typeof value === "string" && isDayKey(value) ? value : fallback;
}

export function addDaysToKey(dayKey: string, amount: number): string {
  return dateToDayKey(addDays(dayKeyToDate(dayKey), amount));
}

/** Dias visíveis: mês em semanas completas, semana de domingo a sábado ou um dia. */
export function getVisibleDays(view: CalendarView, dayKey: string): string[] {
  const date = dayKeyToDate(dayKey);
  if (view === "day") return [dayKey];
  const start = view === "month" ? startOfWeek(startOfMonth(date), { weekStartsOn: WEEK_STARTS_ON }) : startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  const end = view === "month" ? endOfWeek(endOfMonth(date), { weekStartsOn: WEEK_STARTS_ON }) : endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
  const days: string[] = [];
  for (let current = start; current <= end; current = addDays(current, 1)) days.push(dateToDayKey(current));
  return days;
}

/** Intervalo [from, to) em ISO para buscar só os eventos visíveis. */
export function getRange(days: readonly string[]): { from: string; to: string } {
  return { from: wallToIso(days[0]), to: wallToIso(addDaysToKey(days[days.length - 1], 1)) };
}

export function shiftDay(view: CalendarView, dayKey: string, direction: 1 | -1): string {
  const date = dayKeyToDate(dayKey);
  if (view === "month") return dateToDayKey(addMonths(date, direction));
  if (view === "week") return dateToDayKey(addWeeks(date, direction));
  return dateToDayKey(addDays(date, direction));
}

export function getTitle(view: CalendarView, dayKey: string): string {
  const date = dayKeyToDate(dayKey);
  if (view === "month") return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  if (view === "day") return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const days = getVisibleDays("week", dayKey);
  const first = dayKeyToDate(days[0]);
  const last = dayKeyToDate(days[6]);
  if (first.getMonth() === last.getMonth()) return format(last, "MMMM 'de' yyyy", { locale: ptBR });
  if (first.getFullYear() === last.getFullYear()) {
    return `${format(first, "MMM", { locale: ptBR })} – ${format(last, "MMM 'de' yyyy", { locale: ptBR })}`;
  }
  return `${format(first, "MMM 'de' yyyy", { locale: ptBR })} – ${format(last, "MMM 'de' yyyy", { locale: ptBR })}`;
}

type Span = { id: string; startsAt: string; endsAt: string; allDay?: boolean };

/** O evento ocupa alguma parte do dia? (fim exclusivo; eventos de duração zero contam no início). */
export function overlapsDay(event: Span, dayKey: string): boolean {
  const dayStart = new Date(wallToIso(dayKey)).getTime();
  const dayEnd = new Date(wallToIso(addDaysToKey(dayKey, 1))).getTime();
  const start = new Date(event.startsAt).getTime();
  const end = Math.max(new Date(event.endsAt).getTime(), start + 1);
  return start < dayEnd && end > dayStart;
}

export type PositionedEvent<T extends Span> = {
  event: T;
  /** Minutos desde 00:00 do dia (recortado ao dia). */
  top: number;
  height: number;
  column: number;
  columns: number;
};

/** Distribui eventos com horário num dia em colunas quando se sobrepõem (como o Google Agenda). */
export function layoutDay<T extends Span>(events: readonly T[], dayKey: string, minHeight = 20): PositionedEvent<T>[] {
  const nextDay = addDaysToKey(dayKey, 1);
  const items = events
    .filter((event) => !event.allDay && overlapsDay(event, dayKey))
    .map((event) => {
      const start = wallParts(event.startsAt);
      const end = wallParts(event.endsAt);
      const top = start.dayKey < dayKey ? 0 : start.minutes;
      const bottom = end.dayKey > dayKey || (end.dayKey === nextDay && end.minutes === 0) ? MINUTES_PER_DAY : end.minutes;
      return { event, top, bottom: Math.max(bottom, top + minHeight) };
    })
    .toSorted((a, b) => a.top - b.top || b.bottom - a.bottom);

  const result: PositionedEvent<T>[] = [];
  let cluster: { item: (typeof items)[number]; column: number }[] = [];
  let columnsEnd: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const { item, column } of cluster) {
      result.push({ event: item.event, top: item.top, height: item.bottom - item.top, column, columns: columnsEnd.length });
    }
    cluster = [];
    columnsEnd = [];
  };

  for (const item of items) {
    if (item.top >= clusterEnd) flush();
    let column = columnsEnd.findIndex((end) => end <= item.top);
    if (column === -1) {
      column = columnsEnd.length;
      columnsEnd.push(item.bottom);
    } else {
      columnsEnd[column] = item.bottom;
    }
    cluster.push({ item, column });
    clusterEnd = Math.max(clusterEnd, item.bottom);
  }
  flush();
  return result;
}

/** Eventos do dia para a visão mês: dia inteiro primeiro, depois por horário. */
export function eventsOnDay<T extends Span>(events: readonly T[], dayKey: string): T[] {
  return events
    .filter((event) => overlapsDay(event, dayKey))
    .toSorted((a, b) => Number(Boolean(b.allDay)) - Number(Boolean(a.allDay)) || a.startsAt.localeCompare(b.startsAt));
}

export function weekdayLabel(dayKey: string, style: "short" | "long" = "short"): string {
  return format(dayKeyToDate(dayKey), style === "short" ? "EEE" : "EEEE", { locale: ptBR }).replace(".", "");
}

export function dayNumber(dayKey: string): number {
  return Number(dayKey.slice(8, 10));
}
