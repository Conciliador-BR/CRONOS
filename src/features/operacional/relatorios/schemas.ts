import { z } from "zod";
import { HEX_COLOR } from "../shared/colors";
import { PROPERTY_TYPES, STATUS_GROUPS } from "./types";

const id = z.uuid();
const sheetName = z.string().trim().min(1, "Informe o nome.").max(120, "No máximo 120 caracteres.");
const description = z.string().trim().max(500, "No máximo 500 caracteres.");
const propertyName = z.string().trim().min(1, "Informe o nome.").max(60, "No máximo 60 caracteres.");

export const sheetCreateSchema = z.object({ name: sheetName, description: description.optional() });
export const sheetUpdateSchema = z.object({ id, name: sheetName.optional(), description: description.optional() });

const optionSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, "Informe o nome da opção.").max(60, "No máximo 60 caracteres."),
  color: z.string().regex(HEX_COLOR, "Cor inválida."),
  group: z.enum(STATUS_GROUPS).optional(),
});

export const optionsSchema = z
  .array(optionSchema)
  .max(50, "No máximo 50 opções.")
  .min(1, "Inclua ao menos uma opção.")
  .refine(
    (options) => new Set(options.map((option) => option.name.toLowerCase())).size === options.length,
    "Os nomes das opções devem ser únicos.",
  )
  .refine((options) => new Set(options.map((option) => option.id)).size === options.length, "Opções repetidas.");

export const propertyCreateSchema = z.object({
  sheetId: id,
  name: propertyName,
  type: z.enum(PROPERTY_TYPES),
  autoAddCompanies: z.boolean().optional(),
});

export const propertyUpdateSchema = z.object({
  id,
  sheetId: id,
  name: propertyName.optional(),
  options: optionsSchema.optional(),
  width: z.number().int().min(80).max(640).optional(),
});

export const idWithSheetSchema = z.object({ id, sheetId: id });
export const sheetOnlySchema = z.object({ sheetId: id });
export const companySyncSchema = z.object({ sheetId: id, enabled: z.boolean() });

export const cellSetSchema = z.object({ sheetId: id, rowId: id, propertyId: id, value: z.unknown() });

export const cellFillSchema = z.object({ sheetId: id, rowIds: z.array(id).min(1).max(2000), propertyId: id, value: z.unknown() });

export const rowCompanySchema = z.object({ sheetId: id, rowId: id, companyId: id.nullable() });

export const reorderSchema = z.object({ sheetId: id, id, position: z.number().finite() });
