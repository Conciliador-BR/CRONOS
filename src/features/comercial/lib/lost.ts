import type { LeadSource } from "../constants";
import { toMonthKey, type MonthKey } from "./months";

/** Lead em "Cliente perdido". `lostAt` = `leads.closed_at`, gravado pelo trigger ao entrar na etapa. */
export type LostDeal = {
  id: string;
  name: string;
  companyName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  source: LeadSource;
  reason: string;
  lostAt: string;
};

/**
 * Taxa de perda: perdidos ÷ (ganhos + perdidos), entre 0 e 1.
 * `null` quando nenhum negócio foi decidido (evita mostrar 0% sem base).
 */
export function lossRate(won: number, lost: number): number | null {
  const decided = won + lost;
  return decided > 0 ? lost / decided : null;
}

export type LostByOwner = Map<string, Map<MonthKey, number>>;

/** Agrupa as perdas por responsável e mês (São Paulo). Perdas sem responsável ficam de fora. */
export function countLostByOwner(lost: readonly LostDeal[]): LostByOwner {
  const result: LostByOwner = new Map();
  for (const deal of lost) {
    if (!deal.ownerId) continue;
    const key = toMonthKey(deal.lostAt);
    const months = result.get(deal.ownerId) ?? new Map<MonthKey, number>();
    months.set(key, (months.get(key) ?? 0) + 1);
    result.set(deal.ownerId, months);
  }
  return result;
}

/** Perdas do mês escolhido, da mais recente para a mais antiga (empate: nome). */
export function lostInMonth(lost: readonly LostDeal[], month: MonthKey): LostDeal[] {
  return lost
    .filter((deal) => toMonthKey(deal.lostAt) === month)
    .toSorted((a, b) => b.lostAt.localeCompare(a.lostAt) || a.name.localeCompare(b.name, "pt-BR"));
}
