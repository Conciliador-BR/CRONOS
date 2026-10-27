/** Fundos das Missões (papel de parede por usuário e imagem por quadro). Puro: cliente e servidor. */
import { imageExtension, isPathInFolder } from "../shared/files";

export const WALLPAPERS_BUCKET = "wallpapers";

/** Imagem guardada no Storage com URL assinada; `path` identifica a imagem entre renderizações. */
export type BackgroundImage = { path: string; url: string };

const userFolder = (userId: string) => `users/${userId}`;
const boardFolder = (boardId: string) => `boards/${boardId}`;

/** Caminho do papel de parede: `users/<auth.uid>/<uuid>.<ext>` (a RLS do bucket exige a pasta do próprio usuário). */
export function userWallpaperPath(userId: string, uuid: string, mimeType: string): string {
  return `${userFolder(userId)}/${uuid}.${imageExtension(mimeType)}`;
}

/** Caminho do fundo do quadro: `boards/<board_id>/<uuid>.<ext>`. */
export function boardBackgroundPath(boardId: string, uuid: string, mimeType: string): string {
  return `${boardFolder(boardId)}/${uuid}.${imageExtension(mimeType)}`;
}

/** Só apaga arquivo antigo que está mesmo na pasta esperada. */
export function isUserWallpaperPath(path: string, userId: string): boolean {
  return isPathInFolder(path, userFolder(userId));
}

export function isBoardBackgroundPath(path: string, boardId: string): boolean {
  return isPathInFolder(path, boardFolder(boardId));
}

/** `url("...")` seguro para CSS: só https, sem aspas, barras invertidas ou quebras de linha. */
export function cssImageUrl(url: string): string | null {
  if (!url.startsWith("https://")) return null;
  return `url("${url.replace(/["\\\n\r]/g, (char) => encodeURIComponent(char))}")`;
}

const DARK = "#05070d";

/**
 * Fundo do quadro. Sem imagem: degradê da cor. Com imagem: a foto é a última camada e a cor
 * vira um véu translúcido por cima (contraste do texto branco), com a cor sólida como reserva.
 */
export function boardBackdrop(color: string, imageUrl?: string | null): string {
  const image = imageUrl ? cssImageUrl(imageUrl) : null;
  if (!image) return `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 55%, ${DARK}))`;
  const tint = `linear-gradient(160deg, color-mix(in srgb, ${color} 35%, transparent), color-mix(in srgb, ${DARK} 55%, transparent))`;
  return `${tint}, ${image} center / cover no-repeat, ${color}`;
}

/** Papel de parede da página (preso à janela): escurece a foto para manter o contraste do texto. */
export function wallpaperBackdrop(imageUrl: string, { fixed = true }: { fixed?: boolean } = {}): string | null {
  const image = cssImageUrl(imageUrl);
  if (!image) return null;
  const attach = fixed ? " fixed" : "";
  return `linear-gradient(180deg, rgb(5 7 13 / 0.72), rgb(5 7 13 / 0.86))${attach}, ${image} center / cover no-repeat${attach}`;
}
