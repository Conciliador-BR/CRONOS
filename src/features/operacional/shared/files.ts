/** Utilitários puros de arquivos (nomes, tamanhos, tipos). Usados no cliente e no servidor. */

export const MB = 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 50 * MB;
export const MAX_LOGO_BYTES = 2 * MB;
export const MAX_COVER_BYTES = 2 * MB;
export const MAX_VIDEO_BYTES = 50 * MB;
export const MAX_CARD_IMAGE_BYTES = 10 * MB;

// SVG fica de fora: pode carregar script se aberto direto pela URL assinada.
export const LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const COVER_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const CARD_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

const DIACRITICS = /[\u0300-\u036f]/g;
const UNSAFE = /[^a-zA-Z0-9._-]+/g;

/**
 * Nome seguro para caminho no Storage: sem acentos, espaços ou barras,
 * sem pontos no início, até 100 caracteres preservando a extensão.
 */
export function sanitizeFilename(name: string, maxLength = 100): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  let clean = base
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(UNSAFE, "-")
    .replace(/-{2,}/g, "-")
    .replace(/-+\./g, ".")
    .replace(/^[-.]+/, "")
    .replace(/-+$/, "")
    .toLowerCase();
  if (!clean || clean === ".") clean = "arquivo";
  if (clean.length <= maxLength) return clean;
  const dot = clean.lastIndexOf(".");
  const ext = dot > 0 && clean.length - dot <= 10 ? clean.slice(dot) : "";
  return clean.slice(0, maxLength - ext.length).replace(/[-.]+$/, "") + ext;
}

/** Nome exibido/baixado: tira caminho e caracteres de controle, limita a 255. */
export function displayFilename(name: string): string {
  const base = (name.split(/[\\/]/).pop() ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return (base || "arquivo").slice(0, 255);
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[unit]}`;
}

export function isAllowedMime(type: string, allowed: readonly string[]): boolean {
  return allowed.includes(type.toLowerCase());
}

/** Caminho gerado no servidor: <pasta>/<uuid>-<nome-saneado>. */
export function buildStoragePath(folder: string, uuid: string, filename: string): string {
  return `${folder}/${uuid}-${sanitizeFilename(filename)}`;
}

const IMAGE_EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

/** Extensão para o caminho no Storage a partir do tipo (já validado). */
export function imageExtension(type: string): string {
  return IMAGE_EXTENSIONS[type.toLowerCase()] ?? "bin";
}

/** Checagem rápida no navegador antes de enviar uma foto de cartão (o servidor confere de novo). */
export function checkCardImage(file: { type: string; size: number }): string | null {
  if (!isAllowedMime(file.type, CARD_IMAGE_MIME_TYPES)) return "formato não aceito. Use PNG, JPG ou WebP.";
  if (file.size <= 0) return "arquivo vazio.";
  if (file.size > MAX_CARD_IMAGE_BYTES) return "a imagem pode ter até 10 MB.";
  return null;
}

/** Garante que o caminho pertence à pasta esperada e não tenta sair dela. */
export function isPathInFolder(path: string, folder: string): boolean {
  if (!path.startsWith(`${folder}/`)) return false;
  const rest = path.slice(folder.length + 1);
  return rest.length > 0 && !rest.includes("/") && !rest.includes("..");
}

/**
 * Confere a assinatura dos bytes iniciais com o tipo declarado (PNG, JPEG, WebP, SVG).
 * Evita aceitar outro conteúdo renomeado como imagem.
 */
export function matchesImageSignature(bytes: Uint8Array, type: string): boolean {
  const starts = (...sig: number[]) => sig.every((value, index) => bytes[index] === value);
  switch (type.toLowerCase()) {
    case "image/png":
      return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "image/jpeg":
      return starts(0xff, 0xd8, 0xff);
    case "image/webp":
      return starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    default:
      return false;
  }
}
