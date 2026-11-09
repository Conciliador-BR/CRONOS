import { z } from "zod";
import { isComputedType } from "./options";
import type { CellValue, PropertyOption, PropertyType } from "./types";

/** String vazia (ou só espaços) vira null: limpar a célula. */
export function toEmptyAsNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const PHONE_RE = /^[0-9+()\s.-]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidDate(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const uniqueArray = (item: z.ZodType<string>, max: number) =>
  z
    .array(item)
    .max(max, `No máximo ${max} itens.`)
    .refine((items) => new Set(items).size === items.length, "Itens repetidos.");

/** Valida a entrada de uma célula; null limpa. company e calculadas são rejeitadas. */
export function cellValueSchema(
  type: PropertyType,
  options: readonly PropertyOption[] = [],
): z.ZodType<CellValue | null> {
  const ids = new Set(options.map((option) => option.id));
  const optionId = z.string().refine((id) => ids.has(id), "Opção inexistente.");
  let schema: z.ZodType<CellValue | null>;
  switch (type) {
    case "text":
      schema = z.string().max(2000, "No máximo 2000 caracteres.").transform(toEmptyAsNull);
      break;
    case "number":
      schema = z.number().finite("Número inválido.");
      break;
    case "checkbox":
      schema = z.boolean();
      break;
    case "date":
      schema = z.string().refine(isValidDate, "Data inválida.");
      break;
    case "url":
      schema = z
        .string()
        .max(2000)
        .transform(toEmptyAsNull)
        .refine((v) => v === null || isHttpUrl(v), "Informe um link http ou https.");
      break;
    case "email":
      schema = z
        .string()
        .max(254)
        .transform(toEmptyAsNull)
        .refine((v) => v === null || z.email().safeParse(v).success, "E-mail inválido.");
      break;
    case "phone":
      schema = z
        .string()
        .max(30, "Telefone muito longo.")
        .transform(toEmptyAsNull)
        .refine((v) => v === null || PHONE_RE.test(v), "Telefone inválido.");
      break;
    case "select":
    case "status":
      schema = optionId;
      break;
    case "multi_select":
      schema = uniqueArray(optionId, 20);
      break;
    case "person":
      schema = uniqueArray(z.uuid(), 10);
      break;
    default:
      return z.never({ error: isComputedType(type) ? "Coluna calculada." : "Coluna sem células." });
  }
  return z.union([z.null(), schema]);
}

function stringArray(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || !raw.every((item) => typeof item === "string")) return null;
  return [...new Set(raw as string[])];
}

/** Leitura defensiva: valor malformado vira null; opções apagadas são descartadas. */
export function readCellValue(type: PropertyType, raw: unknown, options: readonly PropertyOption[] = []): CellValue | null {
  if (raw === null || raw === undefined) return null;
  const ids = new Set(options.map((option) => option.id));
  switch (type) {
    case "text":
    case "url":
    case "phone":
    case "email":
      return typeof raw === "string" && raw !== "" ? raw : null;
    case "number":
      return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    case "checkbox":
      return typeof raw === "boolean" ? raw : null;
    case "date":
      return typeof raw === "string" && isValidDate(raw) ? raw : null;
    case "select":
    case "status":
      return typeof raw === "string" && ids.has(raw) ? raw : null;
    case "multi_select": {
      const list = stringArray(raw)?.filter((id) => ids.has(id));
      return list && list.length > 0 ? list : null;
    }
    case "person": {
      const list = stringArray(raw)?.filter((id) => UUID_RE.test(id));
      return list && list.length > 0 ? list : null;
    }
    default:
      return null;
  }
}
