import { z } from "zod";
import { HEX_COLOR } from "../shared/colors";

const id = z.uuid({ error: "Identificador inválido." });
const position = z.number().finite();
const color = z.string().regex(HEX_COLOR, { error: "Cor inválida." });

export const boardInputSchema = z.object({
  name: z.string().trim().min(1, { error: "Informe o nome do quadro." }).max(120, { error: "Até 120 caracteres." }),
  background: color,
});
export const boardUpdateSchema = boardInputSchema.extend({ id });

export const listCreateSchema = z.object({
  boardId: id,
  name: z.string().trim().min(1, { error: "Informe o nome da lista." }).max(120, { error: "Até 120 caracteres." }),
});
export const listRenameSchema = z.object({ id, boardId: id, name: listCreateSchema.shape.name });
export const listMoveSchema = z.object({ id, boardId: id, position });

export const labelCreateSchema = z.object({
  boardId: id,
  name: z.string().trim().max(60, { error: "Até 60 caracteres." }),
  color,
});
export const labelUpdateSchema = labelCreateSchema.extend({ id });

export const cardCreateSchema = z.object({
  boardId: id,
  listId: id,
  title: z.string().trim().min(1, { error: "Informe o título do cartão." }).max(300, { error: "Até 300 caracteres." }),
});

export const cardUpdateSchema = z.object({
  id,
  boardId: id,
  title: cardCreateSchema.shape.title.optional(),
  description: z.string().max(20000, { error: "Até 20.000 caracteres." }).optional(),
  dueAt: z.iso.datetime({ offset: true, error: "Data inválida." }).nullable().optional(),
  completed: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const cardMoveSchema = z.object({ id, boardId: id, listId: id, position });

export const cardTransferSchema = z.object({
  id,
  fromBoardId: id,
  toBoardId: id,
  toListId: id,
});

export const cardToggleSchema = z.object({ cardId: id, boardId: id, targetId: id, on: z.boolean() });

export const checklistCreateSchema = z.object({
  cardId: id,
  boardId: id,
  content: z.string().trim().min(1, { error: "Escreva o item." }).max(500, { error: "Até 500 caracteres." }),
});
export const checklistUpdateSchema = z.object({
  id,
  boardId: id,
  done: z.boolean().optional(),
  content: checklistCreateSchema.shape.content.optional(),
});

export const idWithBoardSchema = z.object({ id, boardId: id });
