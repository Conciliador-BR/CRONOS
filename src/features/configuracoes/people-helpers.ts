import "server-only";
import { blobMatches } from "@/lib/file-signature";
import { logger } from "@/lib/logger";
import type { createClient } from "@/lib/supabase/server";
import { currentMonthStart } from "./form-utils";
import { AVATAR_TYPES, MAX_AVATAR_BYTES } from "./limits";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Foto opcional do FormData: null sem arquivo, string com erro, ou o arquivo válido. */
export function readAvatar(formData: FormData): File | null | string {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!Object.hasOwn(AVATAR_TYPES, file.type)) return "Use uma foto PNG, JPG ou WebP.";
  if (file.size > MAX_AVATAR_BYTES) return "A foto pode ter até 5 MB.";
  return file;
}

/** Envia a foto para avatars/<id>/avatar.<ext> e grava o caminho no perfil. */
export async function saveAvatar(supabase: Supabase, profileId: string, file: File) {
  const ext = AVATAR_TYPES[file.type as keyof typeof AVATAR_TYPES];
  const kind = ext === "jpg" ? "jpeg" : ext;
  if (!(await blobMatches(file, kind))) {
    logger.warn("configuracoes: foto com conteúdo diferente do tipo declarado");
    return false;
  }
  const path = `${profileId}/avatar.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    logger.error({ code: error.name }, "configuracoes: falha ao enviar foto");
    return false;
  }
  const { error: updateError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", profileId);
  if (updateError) {
    logger.error({ code: updateError.code }, "configuracoes: falha ao gravar foto no perfil");
    return false;
  }
  return true;
}

/** Define (ou remove, com null) a meta do mês corrente. */
export async function saveGoal(supabase: Supabase, profileId: string, goalCents: number | null) {
  const month = currentMonthStart();
  const { error } =
    goalCents === null
      ? await supabase.from("sales_goals").delete().eq("profile_id", profileId).eq("month", month)
      : await supabase
          .from("sales_goals")
          .upsert({ profile_id: profileId, month, goal_cents: goalCents }, { onConflict: "profile_id,month" });
  if (error) {
    logger.error({ code: error.code }, "configuracoes: falha ao salvar meta");
    return false;
  }
  return true;
}
