import { onlyDigits } from "@/lib/format/document";

/** CNAE (subclasse, 7 dígitos) na máscara 0000-0/00, também enquanto digita. */
export function formatCnae(value: string | null | undefined) {
  const d = onlyDigits(value ?? "").slice(0, 7);
  if (d.length <= 4) return d;
  if (d.length === 5) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 5)}/${d.slice(5)}`;
}

/** CNAE em 7 dígitos a partir de número ou texto (ex.: 4711302 da BrasilAPI); null se inválido. */
export function normalizeCnae(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const d = onlyDigits(String(value));
  if (d.length < 6 || d.length > 7) return null;
  return d.padStart(7, "0");
}
