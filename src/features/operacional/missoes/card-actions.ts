"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { failure, invalid, requireMember } from "../shared/action-utils";
import type { ActionResult } from "../shared/result";
import { positionAfterLast } from "../shared/position";
import {
  cardCreateSchema,
  cardMoveSchema,
  cardToggleSchema,
  cardTransferSchema,
  cardUpdateSchema,
  checklistCreateSchema,
  checklistUpdateSchema,
  idWithBoardSchema,
} from "./schemas";
import type { BoardCard, ChecklistItem } from "./types";

const boardPath = (id: string) => `/operacional/missoes/${id}`;
type Supabase = Awaited<ReturnType<typeof createClient>>;

async function lastCardPosition(supabase: Supabase, listId: string) {
  const { data } = await supabase
    .from("cards")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1);
  return positionAfterLast((data ?? []).map((row) => row.position));
}

export async function createCard(input: unknown): Promise<ActionResult<{ card: BoardCard }>> {
  await requireMember();
  const parsed = cardCreateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { boardId, listId, title } = parsed.data;
  const supabase = await createClient();
  const { data: list } = await supabase.from("board_lists").select("id").eq("id", listId).eq("board_id", boardId).maybeSingle();
  if (!list) return { ok: false, error: "Lista não encontrada neste quadro." };
  const position = await lastCardPosition(supabase, listId);
  const { data, error } = await supabase
    .from("cards")
    .insert({ board_id: boardId, list_id: listId, title, position })
    .select("id, list_id, title, position")
    .single();
  if (error) return failure("missoes.createCard", error);
  revalidatePath(boardPath(boardId));
  return {
    ok: true,
    card: {
      id: data.id,
      listId: data.list_id,
      title: data.title,
      position: data.position,
      description: "",
      dueAt: null,
      completed: false,
      labelIds: [],
      assigneeIds: [],
      checklist: [],
    },
  };
}

export async function updateCard(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = cardUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, boardId, title, description, dueAt, completed, archived } = parsed.data;
  const values: { title?: string; description?: string | null; due_at?: string | null; completed?: boolean; archived?: boolean } = {};
  if (title !== undefined) values.title = title;
  if (description !== undefined) values.description = description.trim() ? description : null;
  if (dueAt !== undefined) values.due_at = dueAt;
  if (completed !== undefined) values.completed = completed;
  if (archived !== undefined) values.archived = archived;
  const supabase = await createClient();
  const { error } = await supabase.from("cards").update(values).eq("id", id).eq("board_id", boardId);
  if (error) return failure("missoes.updateCard", error);
  revalidatePath(boardPath(boardId));
  return { ok: true };
}

/** Arrastar e soltar: grava lista e posição; a tela já mostra a mudança (sem revalidar). */
export async function moveCard(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = cardMoveSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, boardId, listId, position } = parsed.data;
  const supabase = await createClient();
  const { data: list } = await supabase.from("board_lists").select("id").eq("id", listId).eq("board_id", boardId).maybeSingle();
  if (!list) return { ok: false, error: "Lista não encontrada neste quadro." };
  const { error } = await supabase.from("cards").update({ list_id: listId, position }).eq("id", id).eq("board_id", boardId);
  if (error) return failure("missoes.moveCard", error);
  return { ok: true };
}

/** "Mover" para outro quadro: vai para o fim da lista escolhida; etiquetas são do quadro, então saem. */
export async function transferCard(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = cardTransferSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, fromBoardId, toBoardId, toListId } = parsed.data;
  const supabase = await createClient();
  const { data: list } = await supabase
    .from("board_lists")
    .select("id")
    .eq("id", toListId)
    .eq("board_id", toBoardId)
    .maybeSingle();
  if (!list) return { ok: false, error: "Lista de destino não encontrada." };
  const position = await lastCardPosition(supabase, toListId);
  const { error } = await supabase
    .from("cards")
    .update({ board_id: toBoardId, list_id: toListId, position })
    .eq("id", id)
    .eq("board_id", fromBoardId);
  if (error) return failure("missoes.transferCard", error);
  if (fromBoardId !== toBoardId) {
    const { error: labelsError } = await supabase.from("card_labels").delete().eq("card_id", id);
    if (labelsError) return failure("missoes.transferCard.labels", labelsError);
    revalidatePath(boardPath(toBoardId));
  }
  revalidatePath(boardPath(fromBoardId));
  return { ok: true };
}

export async function deleteCard(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = idWithBoardSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", parsed.data.id).eq("board_id", parsed.data.boardId);
  if (error) return failure("missoes.deleteCard", error);
  revalidatePath(boardPath(parsed.data.boardId));
  return { ok: true };
}

export async function toggleCardLabel(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = cardToggleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { cardId, boardId, targetId, on } = parsed.data;
  const supabase = await createClient();
  if (on) {
    const [{ data: card }, { data: label }] = await Promise.all([
      supabase.from("cards").select("id").eq("id", cardId).eq("board_id", boardId).maybeSingle(),
      supabase.from("labels").select("id").eq("id", targetId).eq("board_id", boardId).maybeSingle(),
    ]);
    if (!card || !label) return { ok: false, error: "Etiqueta ou cartão não pertence a este quadro." };
  }
  const { error } = on
    ? await supabase.from("card_labels").upsert({ card_id: cardId, label_id: targetId }, { ignoreDuplicates: true })
    : await supabase.from("card_labels").delete().eq("card_id", cardId).eq("label_id", targetId);
  if (error) return failure("missoes.toggleCardLabel", error);
  revalidatePath(boardPath(boardId));
  return { ok: true };
}

export async function toggleCardAssignee(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = cardToggleSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { cardId, boardId, targetId, on } = parsed.data;
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from("card_assignees").upsert({ card_id: cardId, profile_id: targetId }, { ignoreDuplicates: true })
    : await supabase.from("card_assignees").delete().eq("card_id", cardId).eq("profile_id", targetId);
  if (error) return failure("missoes.toggleCardAssignee", error);
  revalidatePath(boardPath(boardId));
  revalidatePath("/inicio");
  return { ok: true };
}

export async function addChecklistItem(input: unknown): Promise<ActionResult<{ item: ChecklistItem }>> {
  await requireMember();
  const parsed = checklistCreateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { cardId, boardId, content } = parsed.data;
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("card_checklist_items")
    .select("position")
    .eq("card_id", cardId)
    .order("position", { ascending: false })
    .limit(1);
  const { data, error } = await supabase
    .from("card_checklist_items")
    .insert({ card_id: cardId, content, position: positionAfterLast((last ?? []).map((row) => row.position)) })
    .select("id, content, done, position")
    .single();
  if (error) return failure("missoes.addChecklistItem", error);
  revalidatePath(boardPath(boardId));
  return { ok: true, item: data };
}

export async function updateChecklistItem(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = checklistUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, boardId, done, content } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("card_checklist_items")
    .update({ ...(done !== undefined ? { done } : {}), ...(content !== undefined ? { content } : {}) })
    .eq("id", id);
  if (error) return failure("missoes.updateChecklistItem", error);
  revalidatePath(boardPath(boardId));
  return { ok: true };
}

export async function deleteChecklistItem(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = idWithBoardSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("card_checklist_items").delete().eq("id", parsed.data.id);
  if (error) return failure("missoes.deleteChecklistItem", error);
  revalidatePath(boardPath(parsed.data.boardId));
  return { ok: true };
}
