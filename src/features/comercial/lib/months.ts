/**
 * Meses no formato "AAAA-MM", sempre no fuso de São Paulo (sem horário de verão desde 2019,
 * portanto UTC−03:00). Um negócio fechado às 22h do dia 31 conta no mês local, não no UTC.
 */
export type MonthKey = `${number}-${string}`;

export const APP_TIME_ZONE = "America/Sao_Paulo";
const OFFSET = "-03:00";
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

const keyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && MONTH_RE.test(value);
}

/** Mês local (São Paulo) de uma data. */
export function toMonthKey(date: Date | string): MonthKey {
  const parts = keyFormatter.formatToParts(typeof date === "string" ? new Date(date) : date);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${year}-${month}` as MonthKey;
}

/** Lê `?mes=AAAA-MM`; valor ausente ou inválido cai no mês atual. */
export function parseMonthParam(value: unknown, now: Date = new Date()): MonthKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return isMonthKey(raw) ? raw : toMonthKey(now);
}

function split(key: MonthKey) {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const { year, month } = split(key);
  const index = year * 12 + (month - 1) + delta;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}` as MonthKey;
}

/** Os `count` meses terminando em `end` (inclusive), do mais antigo ao mais recente. */
export function lastMonths(end: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(end, i - (count - 1)));
}

/** Data do primeiro dia ("AAAA-MM-01"), formato da coluna `sales_goals.month`. */
export function monthStartDate(key: MonthKey) {
  return `${key}-01`;
}

/** Intervalo [start, end) do mês em ISO com o fuso de São Paulo, para filtrar timestamptz. */
export function monthBounds(key: MonthKey) {
  return {
    start: `${key}-01T00:00:00${OFFSET}`,
    end: `${shiftMonth(key, 1)}-01T00:00:00${OFFSET}`,
  };
}

const longLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

/** "outubro de 2026" (long) ou "out/26" (short). */
export function formatMonthLabel(key: MonthKey, style: "long" | "short" = "long") {
  const { year, month } = split(key);
  const date = new Date(Date.UTC(year, month - 1, 1));
  if (style === "long") return longLabel.format(date);
  return `${shortMonth.format(date).replace(".", "")}/${String(year).slice(2)}`;
}
