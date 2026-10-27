/**
 * Posições como números de ponto flutuante: inserir entre dois vizinhos usa o
 * ponto médio, então mover um item só atualiza uma linha no banco.
 */
export const POSITION_STEP = 1024;

export function positionBetween(before?: number | null, after?: number | null): number {
  const hasBefore = typeof before === "number" && Number.isFinite(before);
  const hasAfter = typeof after === "number" && Number.isFinite(after);
  if (hasBefore && hasAfter) return (before + after) / 2;
  if (hasBefore) return before + POSITION_STEP;
  if (hasAfter) return after - POSITION_STEP;
  return POSITION_STEP;
}

/**
 * Posição para ocupar `index` numa sequência ordenada de posições que NÃO inclui o item movido.
 */
export function positionAtIndex(positions: readonly number[], index: number): number {
  const clamped = Math.max(0, Math.min(index, positions.length));
  return positionBetween(positions[clamped - 1], positions[clamped]);
}

/** Próxima posição no fim de uma lista. */
export function positionAfterLast(positions: readonly number[]): number {
  let max: number | undefined;
  for (const value of positions) if (max === undefined || value > max) max = value;
  return positionBetween(max, undefined);
}

/** Move um elemento de um índice para outro (imutável). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item);
  return next;
}
