/**
 * Datas do Operacional no fuso de Brasília (sem horário de verão desde 2019, UTC-3 fixo).
 * Usar um fuso fixo deixa a renderização no servidor igual à do navegador.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";
export const APP_UTC_OFFSET = "-03:00";
const OFFSET_MS = -3 * 60 * 60 * 1000;

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type WallParts = {
  /** yyyy-MM-dd no fuso de Brasília. */
  dayKey: string;
  /** HH:mm no fuso de Brasília. */
  time: string;
  /** Minutos desde 00:00. */
  minutes: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

export function wallParts(value: string | Date): WallParts {
  const wall = new Date(new Date(value).getTime() + OFFSET_MS);
  const dayKey = `${wall.getUTCFullYear()}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}`;
  const hours = wall.getUTCHours();
  const minutes = wall.getUTCMinutes();
  return { dayKey, time: `${pad(hours)}:${pad(minutes)}`, minutes: hours * 60 + minutes };
}

export function isDayKey(value: string): boolean {
  const match = DAY_KEY.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCDate() === Number(match[3]) && date.getUTCMonth() === Number(match[2]) - 1;
}

export function isTime(value: string): boolean {
  return TIME.test(value);
}

/** Data + hora de parede (Brasília) para ISO em UTC. */
export function wallToIso(dayKey: string, time = "00:00"): string {
  if (!isDayKey(dayKey) || !isTime(time)) throw new Error("Data ou hora inválida");
  return new Date(`${dayKey}T${time}:00${APP_UTC_OFFSET}`).toISOString();
}

/** Dia (yyyy-MM-dd) como Date local à meia-noite, para usar com date-fns. */
export function dayKeyToDate(dayKey: string): Date {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Date local (de date-fns) para yyyy-MM-dd. */
export function dateToDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): string {
  return wallParts(now).dayKey;
}

const timeFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const shortDateFormat = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIME_ZONE, day: "numeric", month: "short" });
const shortDateYearFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});
const longDateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatTime(value: string | Date): string {
  return timeFormat.format(new Date(value));
}

/** "23 de out." (ano só quando difere do ano de referência). */
export function formatShortDate(value: string | Date, now: Date = new Date()): string {
  const date = new Date(value);
  const sameYear = wallParts(date).dayKey.slice(0, 4) === wallParts(now).dayKey.slice(0, 4);
  return (sameYear ? shortDateFormat : shortDateYearFormat).format(date);
}

export function formatLongDate(value: string | Date): string {
  return longDateFormat.format(new Date(value));
}
