import { formatShortDate, formatTime, wallParts } from "../shared/tz";

export type DueStatus = "completed" | "overdue" | "soon" | "upcoming";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Concluída (verde), atrasada (vermelho), vence em 24 h (âmbar) ou futura. */
export function getDueStatus(dueAt: string, completed: boolean, now: Date = new Date()): DueStatus {
  if (completed) return "completed";
  const diff = new Date(dueAt).getTime() - now.getTime();
  if (diff < 0) return "overdue";
  if (diff <= DAY_MS) return "soon";
  return "upcoming";
}

export const DUE_STATUS_LABEL: Record<DueStatus, string> = {
  completed: "concluída",
  overdue: "atrasada",
  soon: "vence em breve",
  upcoming: "no prazo",
};

/** "23 de out." ou "23 de out., 14:00" quando há horário diferente de 00:00. */
export function formatDue(dueAt: string, now: Date = new Date()): string {
  const date = formatShortDate(dueAt, now);
  const { time } = wallParts(dueAt);
  return time === "00:00" ? date : `${date}, ${formatTime(dueAt)}`;
}
