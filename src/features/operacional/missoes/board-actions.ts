"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { failure, invalid, requireMember } from "../shared/action-utils";
import type { ActionResult } from "../shared/result";
import { positionAfterLast } from "../shared/position";
import {
  boardInputSchema,
  boardUpdateSchema,
  idWithBoardSchema,
  labelCreateSchema,
  labelUpdateSchema,
  listCreateSchema,
  listMoveSchema,
  listRenameSchema,
} from "./schemas";
import { z } from "zod";
import type { BoardLabel, BoardList } from "./types";

const BOARDS_PATH = "/operacional/missoes";
const boardPath = (id: string) => `${BOARDS_PATH}/${id}`;

export async function createBoard(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireMember();
  const parsed = boardInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: last } = await supabase.from("boards").select("position").order("position", { ascending: false }).limit(1);
  const { data, error } = await supabase
    .from("boards")
    .insert({ ...parsed.data, position: positionAfterLast((last ?? []).map((row) => row.position)) })
    .select("id")
    .single();
  if (error) return failure("missoes.createBoard", error);
  revalidatePath(BOARDS_PATH);
  return { ok: true, id: data.id };
}

export async function updateBoard(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = boardUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("boards").update(values).eq("id", id);
  if (error) return failure("missoes.updateBoard", error);
  revalidatePath(BOARDS_PATH);
  revalidatePath(boardPath(id));
  return { ok: true };
}

export async function deleteBoard(id: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("boards").delete().eq("id", parsed.data);
  if (error) return failure("missoes.deleteBoard", error);
  revalidatePath(BOARDS_PATH);
  return { ok: true };
}

export async function createList(input: unknown): Promise<ActionResult<{ list: BoardList }>> {
  await requireMember();
  const parsed = listCreateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { boardId, name } = parsed.data;
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("board_lists")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: false })
    .limit(1);
  const { data, error } = await supabase
    .from("board_lists")
    .insert({ board_id: boardId, name, position: positionAfterLast((last ?? []).map((row) => row.position)) })
    .select("id, name, position")
    .single();
  if (error) return failure("missoes.createList", error);
  revalidatePath(boardPath(boardId));
  return { ok: true, list: data };
}

export async function renameList(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = listRenameSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("board_lists")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id)
    .eq("board_id", parsed.data.boardId);
  if (error) return failure("missoes.renameList", error);
  revalidatePath(boardPath(parsed.data.boardId));
  return { ok: true };
}

/** Reordenação por arrasto: só grava a nova posição (a tela já mostra a mudança). */
export async function moveList(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = listMoveSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("board_lists")
    .update({ position: parsed.data.position })
    .eq("id", parsed.data.id)
    .eq("board_id", parsed.data.boardId);
  if (error) return failure("missoes.moveList", error);
  return { ok: true };
}

export async function deleteList(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = idWithBoardSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase
    .from("board_lists")
    .delete()
    .eq("id", parsed.data.id)
    .eq("board_id", parsed.data.boardId);
  if (error) return failure("missoes.deleteList", error);
  revalidatePath(boardPath(parsed.data.boardId));
  return { ok: true };
}

export async function createLabel(input: unknown): Promise<ActionResult<{ label: BoardLabel }>> {
  await requireMember();
  const parsed = labelCreateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { boardId, name, color } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("labels")
    .insert({ board_id: boardId, name, color })
    .select("id, name, color")
    .single();
  if (error) return failure("missoes.createLabel", error);
  revalidatePath(boardPath(boardId));
  return { ok: true, label: data };
}

export async function updateLabel(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = labelUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, boardId, name, color } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("labels").update({ name, color }).eq("id", id).eq("board_id", boardId);
  if (error) return failure("missoes.updateLabel", error);
  revalidatePath(boardPath(boardId));
  return { ok: true };
}

export async function deleteLabel(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = idWithBoardSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("labels").delete().eq("id", parsed.data.id).eq("board_id", parsed.data.boardId);
  if (error) return failure("missoes.deleteLabel", error);
  revalidatePath(boardPath(parsed.data.boardId));
  return { ok: true };
}
