import type { z } from "zod";
import { onlyDigits } from "@/lib/format/document";

/** Texto do FormData, sem espaços nas pontas ("" quando ausente ou arquivo). */
export function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Lê linhas repetidas nomeadas como `prefixo.<índice>.<campo>` (ex.: ecs.0.acquirer),
 * na ordem dos índices. Linhas com todos os campos significativos vazios são ignoradas.
 */
export function readRows<F extends string>(
  formData: FormData,
  prefix: string,
  fields: readonly F[],
  /** Campos que contam para decidir se a linha está vazia (ex.: ignora um select com padrão). */
  significant: readonly F[] = fields,
) {
  const pattern = new RegExp(`^${prefix}\\.(\\d+)\\.(\\w+)$`);
  const rows = new Map<number, Record<string, string>>();
  for (const [key, value] of formData.entries()) {
    const match = pattern.exec(key);
    if (!match || typeof value !== "string") continue;
    const [, index, field] = match;
    if (field !== "id" && !(fields as readonly string[]).includes(field)) continue;
    const row = rows.get(Number(index)) ?? {};
    row[field] = value.trim();
    rows.set(Number(index), row);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => significant.some((f) => (row[f] ?? "") !== ""))
    .map((row) => {
      const out = { id: row.id || undefined } as { id?: string } & Record<F, string>;
      for (const f of fields) (out as Record<string, string>)[f] = row[f] ?? "";
      return out;
    });
}

/** Erros do Zod por caminho com ponto ("ecs.0.acquirer"); erros sem caminho vão em "_form". */
export function issuesToFieldErrors(error: z.ZodError) {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

/** Valida CPF pelos dígitos verificadores. */
export function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

/** "5", "5,5" ou "5.25" em número; null se inválido. */
export function parsePercent(input: string): number | null {
  const normalized = input.replace("%", "").replace(",", ".").trim();
  if (!normalized) return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalized)) return null;
  return Number(normalized);
}

/** Primeiro dia do mês corrente no fuso de São Paulo, como "AAAA-MM-01". */
export function currentMonthStart(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}-01`;
}

/** Nome de arquivo seguro para o Storage: sem acentos, só [a-z0-9-_], até 80 caracteres. */
export function sanitizeFileName(name: string) {
  const base = name.replace(/\.[^./\\]*$/, "");
  const clean = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return clean || "documento";
}
