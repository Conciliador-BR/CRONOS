"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { failure, invalid, requireMember } from "../shared/action-utils";
import { CARD_IMAGE_MIME_TYPES, MAX_CARD_IMAGE_BYTES } from "../shared/files";
import { readImageFile } from "../shared/image-upload";
import type { ActionResult } from "../shared/result";
import {
  boardBackgroundPath,
  isBoardBackgroundPath,
  isListCoverPath,
  listCoverPath,
  isUserWallpaperPath,
  userWallpaperPath,
  WALLPAPERS_BUCKET,
} from "./backgrounds";
import type { ListCoverImage } from "./types";

const BOARDS_PATH = "/operacional/missoes";
const boardPath = (id: string) => `${BOARDS_PATH}/${id}`;
const boardIdSchema = z.uuid({ error: "Quadro inválido." });
const BOARD_NOT_FOUND = { ok: false, error: "Quadro não encontrado." } as const;

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Lê e valida a imagem (PNG, JPG ou WebP até 10 MB, assinatura dos bytes conferida). */
async function readWallpaper(formData: FormData) {
  return readImageFile(formData.get("file"), CARD_IMAGE_MIME_TYPES, MAX_CARD_IMAGE_BYTES, "PNG, JPG ou WebP");
}

/** Remove o arquivo antigo sem falhar a ação (a RLS pode negar, ex.: fundo enviado por outra pessoa). */
async function removeQuietly(supabase: Supabase, path: string | null | undefined, scope: string) {
  if (!path) return;
  const { error } = await supabase.storage.from(WALLPAPERS_BUCKET).remove([path]);
  if (error) logger.warn({ scope, name: error.name }, "arquivo antigo de fundo não foi removido");
}

async function getMyWallpaperPath(supabase: Supabase) {
  // A RLS só mostra a linha do próprio usuário.
  const { data } = await supabase.from("user_preferences").select("missions_wallpaper_path").maybeSingle();
  return data?.missions_wallpaper_path ?? null;
}

/** Papel de parede da página Missões (de cada usuário). FormData: file. */
export async function setMissionsWallpaper(formData: FormData): Promise<ActionResult> {
  const profile = await requireMember();
  const image = await readWallpaper(formData);
  if (!image.ok) return { ok: false, error: image.error, fieldErrors: { file: [image.error] } };
  const supabase = await createClient();
  const previous = await getMyWallpaperPath(supabase);

  const type = image.file.type.toLowerCase();
  const path = userWallpaperPath(profile.id, crypto.randomUUID(), type);
  const bucket = supabase.storage.from(WALLPAPERS_BUCKET);
  const { error: uploadError } = await bucket.upload(path, image.bytes, { contentType: type, upsert: false });
  if (uploadError) return failure("missoes.setMissionsWallpaper.upload", uploadError);
  const { error } = await supabase
    .from("user_preferences")
    .upsert({ profile_id: profile.id, missions_wallpaper_path: path }, { onConflict: "profile_id" });
  if (error) {
    await removeQuietly(supabase, path, "missoes.setMissionsWallpaper.rollback");
    return failure("missoes.setMissionsWallpaper", error);
  }
  if (previous && previous !== path && isUserWallpaperPath(previous, profile.id)) {
    await removeQuietly(supabase, previous, "missoes.setMissionsWallpaper.previous");
  }
  revalidatePath(BOARDS_PATH);
  return { ok: true };
}

export async function removeMissionsWallpaper(): Promise<ActionResult> {
  const profile = await requireMember();
  const supabase = await createClient();
  const previous = await getMyWallpaperPath(supabase);
  if (!previous) return { ok: true };
  const { error } = await supabase
    .from("user_preferences")
    .update({ missions_wallpaper_path: null })
    .eq("profile_id", profile.id);
  if (error) return failure("missoes.removeMissionsWallpaper", error);
  if (isUserWallpaperPath(previous, profile.id)) {
    await removeQuietly(supabase, previous, "missoes.removeMissionsWallpaper.storage");
  }
  revalidatePath(BOARDS_PATH);
  return { ok: true };
}

async function findBoard(supabase: Supabase, boardId: string) {
  const { data } = await supabase.from("boards").select("id, background_image_path").eq("id", boardId).maybeSingle();
  return data;
}

function revalidateBoard(boardId: string) {
  revalidatePath(BOARDS_PATH);
  revalidatePath(boardPath(boardId));
}

/** Imagem de fundo do quadro (colaborativo: qualquer membro). FormData: file. */
export async function setBoardBackground(boardId: unknown, formData: FormData): Promise<ActionResult> {
  await requireMember();
  const parsed = boardIdSchema.safeParse(boardId);
  if (!parsed.success) return invalid(parsed.error);
  const image = await readWallpaper(formData);
  if (!image.ok) return { ok: false, error: image.error, fieldErrors: { file: [image.error] } };
  const supabase = await createClient();
  const board = await findBoard(supabase, parsed.data);
  if (!board) return BOARD_NOT_FOUND;

  const type = image.file.type.toLowerCase();
  const path = boardBackgroundPath(board.id, crypto.randomUUID(), type);
  const bucket = supabase.storage.from(WALLPAPERS_BUCKET);
  const { error: uploadError } = await bucket.upload(path, image.bytes, { contentType: type, upsert: false });
  if (uploadError) return failure("missoes.setBoardBackground.upload", uploadError);
  const { data: updated, error } = await supabase
    .from("boards")
    .update({ background_image_path: path })
    .eq("id", board.id)
    .select("id");
  if (error || !updated?.length) {
    await removeQuietly(supabase, path, "missoes.setBoardBackground.rollback");
    return error ? failure("missoes.setBoardBackground", error) : BOARD_NOT_FOUND;
  }
  const previous = board.background_image_path;
  if (previous && previous !== path && isBoardBackgroundPath(previous, board.id)) {
    await removeQuietly(supabase, previous, "missoes.setBoardBackground.previous");
  }
  revalidateBoard(board.id);
  return { ok: true };
}

export async function removeBoardBackground(boardId: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = boardIdSchema.safeParse(boardId);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const board = await findBoard(supabase, parsed.data);
  if (!board) return BOARD_NOT_FOUND;
  const previous = board.background_image_path;
  if (!previous) return { ok: true };
  const { error } = await supabase.from("boards").update({ background_image_path: null }).eq("id", board.id);
  if (error) return failure("missoes.removeBoardBackground", error);
  if (isBoardBackgroundPath(previous, board.id)) {
    await removeQuietly(supabase, previous, "missoes.removeBoardBackground.storage");
  }
  revalidateBoard(board.id);
  return { ok: true };
}

const listIdSchema = z.uuid({ error: "Lista inválida." });
const LIST_NOT_FOUND = { ok: false, error: "Lista não encontrada." } as const;

async function findList(supabase: Supabase, listId: string) {
  const { data } = await supabase.from("board_lists").select("id, board_id, cover_path").eq("id", listId).maybeSingle();
  return data;
}

/** Capa no topo da lista (qualquer membro). FormData: file. Devolve a imagem assinada para mostrar já. */
export async function setListCover(listId: unknown, formData: FormData): Promise<ActionResult<{ cover: ListCoverImage }>> {
  await requireMember();
  const parsed = listIdSchema.safeParse(listId);
  if (!parsed.success) return invalid(parsed.error);
  const image = await readWallpaper(formData);
  if (!image.ok) return { ok: false, error: image.error, fieldErrors: { file: [image.error] } };
  const supabase = await createClient();
  const list = await findList(supabase, parsed.data);
  if (!list) return LIST_NOT_FOUND;

  const type = image.file.type.toLowerCase();
  const path = listCoverPath(list.board_id, crypto.randomUUID(), type);
  const bucket = supabase.storage.from(WALLPAPERS_BUCKET);
  const { error: uploadError } = await bucket.upload(path, image.bytes, { contentType: type, upsert: false });
  if (uploadError) return failure("missoes.setListCover.upload", uploadError);
  const { data: updated, error } = await supabase.from("board_lists").update({ cover_path: path, cover_position: 50 }).eq("id", list.id).select("id");
  if (error || !updated?.length) {
    await removeQuietly(supabase, path, "missoes.setListCover.rollback");
    return error ? failure("missoes.setListCover", error) : LIST_NOT_FOUND;
  }
  if (list.cover_path && list.cover_path !== path && isListCoverPath(list.cover_path, list.board_id)) {
    await removeQuietly(supabase, list.cover_path, "missoes.setListCover.previous");
  }
  const { data: signed } = await bucket.createSignedUrl(path, 3600);
  revalidateBoard(list.board_id);
  return { ok: true, cover: { path, url: signed?.signedUrl ?? "", position: 50 } };
}

export async function removeListCover(listId: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = listIdSchema.safeParse(listId);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const list = await findList(supabase, parsed.data);
  if (!list) return LIST_NOT_FOUND;
  if (!list.cover_path) return { ok: true };
  const { error } = await supabase.from("board_lists").update({ cover_path: null }).eq("id", list.id);
  if (error) return failure("missoes.removeListCover", error);
  if (isListCoverPath(list.cover_path, list.board_id)) {
    await removeQuietly(supabase, list.cover_path, "missoes.removeListCover.storage");
  }
  revalidateBoard(list.board_id);
  return { ok: true };
}

const coverPositionSchema = z.object({
  listId: listIdSchema,
  position: z.int({ error: "Posição inválida." }).min(0, { error: "Posição inválida." }).max(100, { error: "Posição inválida." }),
});

/** Enquadramento vertical da capa (0 = topo da foto, 100 = base). */
export async function setListCoverPosition(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = coverPositionSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("board_lists")
    .update({ cover_position: parsed.data.position })
    .eq("id", parsed.data.listId)
    .select("board_id");
  if (error) return failure("missoes.setListCoverPosition", error);
  if (!updated?.length) return LIST_NOT_FOUND;
  revalidateBoard(updated[0].board_id);
  return { ok: true };
}
