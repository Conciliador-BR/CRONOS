import { formatDistanceStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatShortDate, formatTime, wallParts } from "@/features/operacional/shared/tz";

/**
 * Lembretes de reunião (e de prazo de tarefa): regras puras, usadas no cliente.
 * Limiares: "falta 1 dia" (começa em até 24 h) e "falta 1 hora" (começa em até 60 min).
 */

export type ReminderKind = "reuniao" | "tarefa";

export type Reminder = {
  id: string;
  kind: ReminderKind;
  title: string;
  /** Início da reunião ou prazo da tarefa (ISO, UTC). */
  startsAt: string;
  allDay: boolean;
  href: string;
};

export type Threshold = "day" | "hour";
export type ActiveReminder = { reminder: Reminder; threshold: Threshold; key: string };

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
/** O servidor busca 25 h à frente para o limiar de 24 h disparar sem esperar a próxima consulta. */
export const LOOKAHEAD_MS = 25 * HOUR_MS;
/** Dispensas guardadas no navegador. */
export const DISMISSED_STORAGE_KEY = "cronos:lembretes:dispensados";

const startOf = (reminder: Reminder) => new Date(reminder.startsAt).getTime();

/** Limiar atingido agora; null se já começou ou falta mais de 24 h. Dia inteiro só tem o de 1 dia. */
export function reminderThreshold(reminder: Reminder, now: number): Threshold | null {
  const diff = startOf(reminder) - now;
  if (!Number.isFinite(diff) || diff <= 0) return null;
  if (!reminder.allDay && diff <= HOUR_MS) return "hour";
  if (diff <= DAY_MS) return "day";
  return null;
}

/** Chave da dispensa: muda se o limiar ou o horário mudarem (reunião remarcada avisa de novo). */
export function reminderKey(reminder: Reminder, threshold: Threshold): string {
  return `${reminder.kind}:${reminder.id}:${threshold}:${reminder.startsAt}`;
}

/** Lembretes com limiar atingido, por início. */
export function activeReminders(reminders: Reminder[], now: number): ActiveReminder[] {
  return reminders
    .flatMap((reminder) => {
      const threshold = reminderThreshold(reminder, now);
      return threshold ? [{ reminder, threshold, key: reminderKey(reminder, threshold) }] : [];
    })
    .toSorted((a, b) => startOf(a.reminder) - startOf(b.reminder) || (a.reminder.kind === "reuniao" ? -1 : 1));
}

/** Avisos (toasts) ainda não dispensados. Reuniões antes de tarefas. */
export function pendingToasts(reminders: Reminder[], now: number, dismissed: ReadonlySet<string>): ActiveReminder[] {
  return activeReminders(reminders, now)
    .filter((item) => !dismissed.has(item.key))
    .toSorted((a, b) => (a.reminder.kind === b.reminder.kind ? 0 : a.reminder.kind === "reuniao" ? -1 : 1));
}

/** Milissegundos até o próximo limiar (24 h, 1 h ou início) de qualquer lembrete; null se nenhum. */
export function nextChangeIn(reminders: Reminder[], now: number): number | null {
  let next: number | null = null;
  for (const reminder of reminders) {
    const start = startOf(reminder);
    for (const at of [start - DAY_MS, start - HOUR_MS, start]) {
      if (at > now && (next === null || at < next)) next = at;
    }
  }
  return next === null ? null : next - now;
}

export const THRESHOLD_LABEL: Record<Threshold, string> = { day: "Falta 1 dia", hour: "Falta 1 hora" };

/** "Reunião amanhã às 14:00", "Reunião em 45 minutos", "Tarefa vence hoje às 18:00". */
export function describeReminder(reminder: Reminder, threshold: Threshold, now: number) {
  const noun = reminder.kind === "reuniao" ? "Reunião" : "Tarefa vence";
  const start = new Date(reminder.startsAt);
  const relative = formatDistanceStrict(start, now, { locale: ptBR, addSuffix: true });
  if (threshold === "hour") return { text: `${noun} ${relative}`, relative };
  const day = wallParts(start).dayKey;
  const dayWord =
    day === wallParts(new Date(now)).dayKey ? "hoje" : day === wallParts(new Date(now + DAY_MS)).dayKey ? "amanhã" : `em ${formatShortDate(start, new Date(now))}`;
  const when = reminder.allDay ? `${dayWord} (dia inteiro)` : `${dayWord} às ${formatTime(start)}`;
  return { text: `${noun} ${when}`, relative };
}

/** Mantém só dispensas válidas ({ chave: expira em ms }) e ainda não vencidas. */
export function pruneDismissed(value: Record<string, unknown>, now: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, expires] of Object.entries(value)) {
    if (typeof expires === "number" && expires > now && key.length <= 200) out[key] = expires;
  }
  return out;
}

/** Lê as dispensas guardadas, descartando as vencidas e lixo. */
export function parseDismissed(raw: string | null, now: number): Record<string, number> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return pruneDismissed(value as Record<string, unknown>, now);
  } catch {
    return {};
  }
}

/** Dispensa vale até 1 dia depois do início (depois disso a chave não reaparece). */
export function dismissalExpiry(reminder: Reminder): number {
  return startOf(reminder) + DAY_MS;
}
