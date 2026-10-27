/** Comissão em centavos: receita × taxa (%), arredondada ao centavo. */
export function commissionCents(revenueCents: number, ratePercent: number): number {
  if (!Number.isFinite(revenueCents) || !Number.isFinite(ratePercent) || revenueCents <= 0 || ratePercent <= 0) {
    return 0;
  }
  return Math.round((revenueCents * ratePercent) / 100);
}

export function averageTicketCents(revenueCents: number, deals: number): number {
  return deals > 0 ? Math.round(revenueCents / deals) : 0;
}

export type RankInput = { id: string; name: string; revenueCents: number; wonCount: number };

/**
 * Ordena por receita, depois por negócios fechados, depois por nome. Empates em receita e
 * negócios dividem a posição (1, 2, 2, 4).
 */
export function rankSellers<T extends RankInput>(rows: readonly T[]): (T & { position: number })[] {
  const sorted = rows.toSorted(
    (a, b) =>
      b.revenueCents - a.revenueCents || b.wonCount - a.wonCount || a.name.localeCompare(b.name, "pt-BR"),
  );
  let position = 0;
  return sorted.map((row, index) => {
    const prev = sorted[index - 1];
    if (!prev || prev.revenueCents !== row.revenueCents || prev.wonCount !== row.wonCount) position = index + 1;
    return { ...row, position };
  });
}

export type GoalProgress = {
  /** Realizado ÷ meta (pode passar de 1). null sem meta. */
  ratio: number | null;
  /** Percentual inteiro para exibir (pode passar de 100). */
  percent: number | null;
  /** Percentual limitado a 0–100 para a barra. */
  barPercent: number;
  status: "sem_meta" | "abaixo" | "atingida";
};

export function goalProgress(realizedCents: number, goalCents: number | null | undefined): GoalProgress {
  if (!goalCents || goalCents <= 0) return { ratio: null, percent: null, barPercent: 0, status: "sem_meta" };
  const ratio = Math.max(0, realizedCents) / goalCents;
  return {
    ratio,
    percent: Math.floor(ratio * 100),
    barPercent: Math.min(100, Math.round(ratio * 100)),
    status: ratio >= 1 ? "atingida" : "abaixo",
  };
}
