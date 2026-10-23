/** Links de vídeo das aulas: reconhece YouTube e Google Drive e monta o endereço do player. */

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID = /^[A-Za-z0-9_-]{10,200}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);

function parseHttps(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** ID do vídeo em links watch?v=, youtu.be/, /embed/, /shorts/, /live/ e /v/. */
export function parseYouTubeId(value: string): string | null {
  const url = parseHttps(value);
  if (!url) return null;
  const host = url.hostname.toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    const [, first, second] = url.pathname.split("/");
    if (first === "watch") id = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(first ?? "")) id = second ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** ID do arquivo em links /file/d/<id>/..., open?id=<id> e uc?id=<id>. Pastas não servem. */
export function parseDriveFileId(value: string): string | null {
  const url = parseHttps(value);
  if (!url || !DRIVE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  const fileIndex = parts.indexOf("file");
  if (fileIndex >= 0 && parts[fileIndex + 1] === "d") id = parts[fileIndex + 2] ?? null;
  else if (parts[0] === "open" || parts[0] === "uc") id = url.searchParams.get("id");
  return id && DRIVE_ID.test(id) ? id : null;
}

export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;
export const driveEmbedUrl = (id: string) => `https://drive.google.com/file/d/${id}/preview`;

export type LinkSource = "youtube" | "drive";

/** Endereço do iframe para a fonte informada, ou null se o link não for válido. */
export function getEmbedUrl(source: LinkSource, value: string): string | null {
  if (source === "youtube") {
    const id = parseYouTubeId(value);
    return id ? youtubeEmbedUrl(id) : null;
  }
  const id = parseDriveFileId(value);
  return id ? driveEmbedUrl(id) : null;
}

/** Descobre a fonte pelo link colado. */
export function detectLinkSource(value: string): LinkSource | null {
  if (parseYouTubeId(value)) return "youtube";
  if (parseDriveFileId(value)) return "drive";
  return null;
}
