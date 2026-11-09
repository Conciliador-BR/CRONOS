/** Quadro e listas que o admin enxerga (a RLS decide), só com nome e ID. */
export type BoardOption = { id: string; name: string; lists: { id: string; name: string }[] };

/** Compara nomes sem acento, caixa ou espaços repetidos. */
export const normalizeName = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Nome exato (normalizado) primeiro; senão, quem contém o texto pedido. */
function match<T extends { name: string }>(items: T[], wanted: string): T[] {
  const key = normalizeName(wanted);
  if (!key) return [];
  const exact = items.filter((item) => normalizeName(item.name) === key);
  return exact.length ? exact : items.filter((item) => normalizeName(item.name).includes(key));
}

const names = (items: { name: string }[]) => items.map((item) => `"${item.name}"`).join(", ");

export type Destination = {
  board?: { id: string; name: string };
  list?: { id: string; name: string };
  warnings: string[];
};

/** Resolve só o quadro pelo nome. Ausente, inexistente ou ambíguo vira aviso. */
export function resolveBoard(boards: BoardOption[], boardName: string): { board?: BoardOption; warnings: string[] } {
  if (!boardName) return { warnings: ["Diga em qual quadro."] };
  const boardHits = match(boards, boardName);
  if (boardHits.length === 0) return { warnings: [`Quadro "${boardName}" não encontrado.`] };
  if (boardHits.length > 1) {
    return { warnings: [`Mais de um quadro corresponde a "${boardName}": ${names(boardHits)}. Diga qual.`] };
  }
  return { board: boardHits[0], warnings: [] };
}

/** Resolve nome do quadro e da lista para IDs. Ausente, inexistente ou ambíguo vira aviso. */
export function resolveDestination(boards: BoardOption[], boardName: string, listName: string): Destination {
  if (!boardName) return { warnings: ["Diga em qual quadro criar o card."] };
  const found = resolveBoard(boards, boardName);
  if (!found.board) return { warnings: found.warnings };
  const { lists, ...board } = found.board;
  if (!listName) return { board, warnings: [`Diga em qual lista do quadro "${board.name}".`] };
  const listHits = match(lists, listName);
  if (listHits.length === 0) {
    return { board, warnings: [`Lista "${listName}" não encontrada no quadro "${board.name}".`] };
  }
  if (listHits.length > 1) {
    return { board, warnings: [`Mais de uma lista corresponde a "${listName}": ${names(listHits)}. Diga qual.`] };
  }
  return { board, list: listHits[0], warnings: [] };
}
