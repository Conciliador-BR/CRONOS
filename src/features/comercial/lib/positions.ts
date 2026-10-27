/** Distância usada ao colocar um card antes do primeiro ou depois do último. */
export const POSITION_STEP = 1024;

/**
 * Posição fracionária entre dois vizinhos. Assim, mover um card altera só a linha dele
 * (a RLS permite alterar apenas leads próprios, então não dá para renumerar a coluna inteira).
 */
export function positionBetween(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return 0;
  if (before === undefined) return (after as number) - POSITION_STEP;
  if (after === undefined) return before + POSITION_STEP;
  return (before + after) / 2;
}

/** Posição para um item no índice `index` de uma lista já ordenada (sem o próprio item). */
export function positionAtIndex(sortedPositions: readonly number[], index: number): number {
  const clamped = Math.max(0, Math.min(index, sortedPositions.length));
  return positionBetween(sortedPositions[clamped - 1], sortedPositions[clamped]);
}
