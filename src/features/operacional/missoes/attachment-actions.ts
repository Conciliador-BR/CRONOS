"use server";

import { revalidatePath } from "next/cache";
import { isManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { failure, invalid, requireMember } from "../shared/action-utils";
import { CARD_IMAGE_MIME_TYPES, displayFilename, imageExtension, MAX_CARD_IMAGE_BYTES } from "../shared/files";
import { readImageFile } from "../shared/image-upload";
import type { ActionResult } from "../shared/result";
import { CARD_IMAGES_BUCKET, signCardImages } from "./queries";
import { attachmentRefSchema, cardCoverSchema, cardRefSchema } from "./schemas";
import type { CardAttachment } from "./types";

const boardPath = (id: string) => `/operacional/missoes/${id}`;
type Supabase = Awaited<ReturnType<typeof createClient>>;
const NOT_FOUND = { ok: false, error: "Cartão não encontrado neste quadro." } as const;

async function findCard(supabase: Supabase, cardId: string, boardId: string) {
  const { data } = await supabase
    .from("cards")
    .select("id, cover_attachment_id")
    .eq("id", cardId)
    .eq("board_id", boardId)
    .maybeSingle();
  return data;
}

/** Fotos do cartão (mais recentes primeiro) com URLs assinadas em lote. */
export async function listCardAttachments(input: unknown): Promise<ActionResult<{ attachments: CardAttachment[] }>> {
  const profile = await requireMember();
  const parsed = cardRefSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  if (!(await findCard(supabase, parsed.data.cardId, parsed.data.boardId))) return NOT_FOUND;
  const { data, error } = await supabase
    .from("card_attachments")
    .select("id, storage_path, file_name, mime_type, size_bytes, created_by, created_at")
    .eq("card_id", parsed.data.cardId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return failure("missoes.listCardAttachments", error);
  const urls = await signCardImages((data ?? []).map((row) => row.storage_path));
  const manager = isManager(profile);
  return {
    ok: true,
    attachments: (data ?? []).map((row) => ({
      id: row.id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      url: urls.get(row.storage_path) ?? null,
      createdAt: row.created_at,
      canDelete: manager || row.created_by === profile.id,
    })),
  };
}

/**
 * Envia uma foto (PNG, JPG ou WebP até 10 MB; tipo, tamanho e assinatura dos bytes conferidos).
 * FormData: cardId, boardId, file. Caminho `<cardId>/<uuid>.<ext>`. A primeira foto vira capa.
 */
export async function uploadCardAttachment(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const profile = await requireMember();
  const parsed = cardRefSchema.safeParse({ cardId: formData.get("cardId"), boardId: formData.get("boardId") });
  if (!parsed.success) return invalid(parsed.error);
  const image = await readImageFile(formData.get("file"), CARD_IMAGE_MIME_TYPES, MAX_CARD_IMAGE_BYTES, "PNG, JPG ou WebP");
  if (!image.ok) return { ok: false, error: image.error, fieldErrors: { file: [image.error] } };
  const { cardId, boardId } = parsed.data;
  const supabase = await createClient();
  const card = await findCard(supabase, cardId, boardId);
  if (!card) return NOT_FOUND;

  const type = image.file.type.toLowerCase();
  const path = `${cardId}/${crypto.randomUUID()}.${imageExtension(type)}`;
  const bucket = supabase.storage.from(CARD_IMAGES_BUCKET);
  const { error: uploadError } = await bucket.upload(path, image.bytes, { contentType: type, upsert: false });
  if (uploadError) return failure("missoes.uploadCardAttachment", uploadError);
  const { data, error } = await supabase
    .from("card_attachments")
    .insert({
      card_id: cardId,
      storage_path: path,
      file_name: displayFilename(image.file.name).slice(0, 200),
      mime_type: type,
      size_bytes: image.file.size,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) {
    await bucket.remove([path]);
    return failure("missoes.uploadCardAttachment.insert", error);
  }
  if (!card.cover_attachment_id) {
    await supabase.from("cards").update({ cover_attachment_id: data.id }).eq("id", cardId).eq("board_id", boardId);
  }
  revalidatePath(boardPath(boardId));
  return { ok: true, id: data.id };
}

/** Define ou remove a capa; a foto precisa ser deste cartão. */
export async function setCardCover(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = cardCoverSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { cardId, boardId, attachmentId } = parsed.data;
  const supabase = await createClient();
  if (!(await findCard(supabase, cardId, boardId))) return NOT_FOUND;
  if (attachmentId) {
    const { data: attachment } = await supabase
      .from("card_attachments")
      .select("id")
      .eq("id", attachmentId)
      .eq("card_id", cardId)
      .maybeSingle();
    if (!attachment) return { ok: false, error: "Foto não encontrada neste cartão." };
  }
  const { error } = await supabase
    .from("cards")
    .update({ cover_attachment_id: attachmentId })
    .eq("id", cardId)
    .eq("board_id", boardId);
  if (error) return failure("missoes.setCardCover", error);
  revalidatePath(boardPath(boardId));
  return { ok: true };
}

/** Exclui a foto (quem enviou ou gestor, pela RLS) e o arquivo no Storage. Se era a capa, a capa sai. */
export async function deleteCardAttachment(input: unknown): Promise<ActionResult> {
  await requireMember();
  const parsed = attachmentRefSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, cardId, boardId } = parsed.data;
  const supabase = await createClient();
  if (!(await findCard(supabase, cardId, boardId))) return NOT_FOUND;
  const { data: attachment } = await supabase
    .from("card_attachments")
    .select("id, storage_path")
    .eq("id", id)
    .eq("card_id", cardId)
    .maybeSingle();
  if (!attachment) return { ok: false, error: "Foto não encontrada neste cartão." };
  const { data: deleted, error } = await supabase.from("card_attachments").delete().eq("id", id).select("id");
  if (error) return failure("missoes.deleteCardAttachment", error);
  if (!deleted?.length) return { ok: false, error: "Só quem enviou a foto ou um gestor pode excluí-la." };
  const { error: storageError } = await supabase.storage.from(CARD_IMAGES_BUCKET).remove([attachment.storage_path]);
  if (storageError) failure("missoes.deleteCardAttachment.storage", storageError);
  revalidatePath(boardPath(boardId));
  return { ok: true };
}
