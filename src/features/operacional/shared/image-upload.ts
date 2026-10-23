import "server-only";
import { matchesImageSignature } from "./files";

/** Valida arquivo de imagem recebido por FormData no servidor. */
export async function readImageFile(
  value: FormDataEntryValue | null,
  allowed: readonly string[],
  maxBytes: number,
  formatsLabel = "PNG, JPG, WebP ou SVG",
): Promise<{ ok: true; file: File; bytes: Uint8Array } | { ok: false; error: string }> {
  if (!(value instanceof File) || value.size === 0) return { ok: false, error: "Escolha uma imagem." };
  if (value.size > maxBytes) return { ok: false, error: `A imagem pode ter até ${Math.round(maxBytes / 1024 / 1024)} MB.` };
  const type = value.type.toLowerCase();
  if (!allowed.includes(type)) return { ok: false, error: `Formato não aceito. Use ${formatsLabel}.` };
  const bytes = new Uint8Array(await value.arrayBuffer());
  if (!matchesImageSignature(bytes, type)) return { ok: false, error: "O arquivo não parece ser uma imagem válida." };
  return { ok: true, file: value, bytes };
}
