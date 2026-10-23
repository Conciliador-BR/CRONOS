import { z } from "zod";
import { HEX_COLOR } from "../shared/colors";
import { MAX_DOCUMENT_BYTES } from "../shared/files";

const id = z.uuid({ error: "Identificador inválido." });

export const acquirerInputSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe o nome." }).max(80, { error: "Até 80 caracteres." }),
  color: z.string().regex(HEX_COLOR, { error: "Cor inválida." }),
});
export const acquirerUpdateSchema = acquirerInputSchema.extend({ id });
export const acquirerMoveSchema = z.object({ id, position: z.number().finite() });

export const documentRequestSchema = z.object({
  acquirerId: id,
  fileName: z.string().trim().min(1, { error: "Arquivo sem nome." }).max(255, { error: "Nome muito longo." }),
  size: z
    .number()
    .int()
    .positive({ error: "Arquivo vazio." })
    .max(MAX_DOCUMENT_BYTES, { error: "O arquivo pode ter até 50 MB." }),
});

export const documentRegisterSchema = z.object({
  acquirerId: id,
  path: z.string().min(1).max(400),
  fileName: documentRequestSchema.shape.fileName,
});

export const noteUpdateSchema = z.object({
  id,
  title: z.string().max(200, { error: "Até 200 caracteres." }),
  content: z.string().max(100000, { error: "A nota passou do limite de 100 mil caracteres." }),
});
