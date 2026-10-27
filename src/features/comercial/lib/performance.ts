import type { DealType } from "../constants";
import { countLostByOwner, lossRate, lostInMonth, type LostDeal } from "./lost";
import { lastMonths, monthStartDate, toMonthKey, type MonthKey } from "./months";
import { averageTicketCents, commissionCents, goalProgress, rankSellers, type GoalProgress } from "./ranking";

export type PerformanceMember = {
  id: string;
  name: string;
  teamName: string | null;
  commissionRate: number;
  avatarUrl: string | null;
};

export type ClosedDeal = {
  id: string;
  name: string;
  companyName: string | null;
  ownerId: string | null;
  dealType: DealType | null;
  dealValueCents: number;
  closedAt: string;
};

export type GoalRow = { profileId: string; month: string; goalCents: number };

export type MonthlyPoint = {
  month: MonthKey;
  revenueCents: number;
  goalCents: number | null;
  wonCount: number;
  lostCount: number;
};

export type Conversion = Pick<ClosedDeal, "id" | "name" | "companyName" | "dealType" | "dealValueCents" | "closedAt">;

export type SellerPerformance = PerformanceMember & {
  position: number;
  revenueCents: number;
  wonCount: number;
  /** Clientes perdidos no mês escolhido. */
  lostCount: number;
  /** Perdidos ÷ (ganhos + perdidos) no mês; null sem negócios decididos. */
  lossRate: number | null;
  commissionCents: number;
  goalCents: number | null;
  progress: GoalProgress;
  /** Últimos 12 meses terminando no mês escolhido. */
  monthly: MonthlyPoint[];
  /** Todos os clientes convertidos (fechados), do mais recente ao mais antigo. */
  conversions: Conversion[];
  totalRevenueCents: number;
  totalCommissionCents: number;
};

export type PerformanceKpis = {
  revenueCents: number;
  activeMembers: number;
  dealsClosed: number;
  averageTicketCents: number;
  lostCount: number;
  lossRate: number | null;
};

export type PerformanceSummary = {
  month: MonthKey;
  kpis: PerformanceKpis;
  sellers: SellerPerformance[];
  /** Clientes perdidos no mês (inclusive de quem saiu da equipe), do mais recente ao mais antigo. */
  lostClients: LostDeal[];
};

/**
 * Desempenho do mês: KPIs, ranking por receita, meta x realizado e série de 12 meses.
 * O faturamento soma todos os negócios fechados no mês (inclusive de quem saiu da equipe);
 * o ranking considera só funcionários ativos. Perdas (`lost`) seguem a mesma regra, pela data em que o lead foi perdido.
 */
export function buildPerformance(input: {
  month: MonthKey;
  members: readonly PerformanceMember[];
  deals: readonly ClosedDeal[];
  goals: readonly GoalRow[];
  lost?: readonly LostDeal[];
  historyMonths?: number;
}): PerformanceSummary {
  const { month, members, deals, goals } = input;
  const lost = input.lost ?? [];
  const lostByOwner = countLostByOwner(lost);
  const lostClients = lostInMonth(lost, month);
  const window = lastMonths(month, input.historyMonths ?? 12);
  const windowSet = new Set<string>(window);

  const goalByKey = new Map<string, number>();
  for (const goal of goals) goalByKey.set(`${goal.profileId}|${goal.month.slice(0, 7)}`, goal.goalCents);

  type Acc = { monthly: Map<MonthKey, { revenue: number; won: number }>; conversions: Conversion[]; total: number };
  const byOwner = new Map<string, Acc>();
  for (const member of members) byOwner.set(member.id, { monthly: new Map(), conversions: [], total: 0 });

  let revenueCents = 0;
  let dealsClosed = 0;
  for (const deal of deals) {
    const key = toMonthKey(deal.closedAt);
    if (key === month) {
      revenueCents += deal.dealValueCents;
      dealsClosed += 1;
    }
    const acc = deal.ownerId ? byOwner.get(deal.ownerId) : undefined;
    if (!acc) continue;
    acc.total += deal.dealValueCents;
    acc.conversions.push({
      id: deal.id,
      name: deal.name,
      companyName: deal.companyName,
      dealType: deal.dealType,
      dealValueCents: deal.dealValueCents,
      closedAt: deal.closedAt,
    });
    if (windowSet.has(key)) {
      const point = acc.monthly.get(key) ?? { revenue: 0, won: 0 };
      point.revenue += deal.dealValueCents;
      point.won += 1;
      acc.monthly.set(key, point);
    }
  }

  const rows = members.map((member) => {
    const acc = byOwner.get(member.id) as Acc;
    const current = acc.monthly.get(month) ?? { revenue: 0, won: 0 };
    const goalCents = goalByKey.get(`${member.id}|${month}`) ?? null;
    const lostMonths = lostByOwner.get(member.id);
    const lostCount = lostMonths?.get(month) ?? 0;
    return {
      ...member,
      revenueCents: current.revenue,
      wonCount: current.won,
      lostCount,
      lossRate: lossRate(current.won, lostCount),
      commissionCents: commissionCents(current.revenue, member.commissionRate),
      goalCents,
      progress: goalProgress(current.revenue, goalCents),
      monthly: window.map((m) => ({
        month: m,
        revenueCents: acc.monthly.get(m)?.revenue ?? 0,
        wonCount: acc.monthly.get(m)?.won ?? 0,
        lostCount: lostMonths?.get(m) ?? 0,
        goalCents: goalByKey.get(`${member.id}|${m}`) ?? null,
      })),
      conversions: acc.conversions.toSorted((a, b) => b.closedAt.localeCompare(a.closedAt)),
      totalRevenueCents: acc.total,
      totalCommissionCents: commissionCents(acc.total, member.commissionRate),
    };
  });

  return {
    month,
    kpis: {
      revenueCents,
      activeMembers: members.length,
      dealsClosed,
      averageTicketCents: averageTicketCents(revenueCents, dealsClosed),
      lostCount: lostClients.length,
      lossRate: lossRate(dealsClosed, lostClients.length),
    },
    sellers: rankSellers(rows),
    lostClients,
  };
}

/** Primeiro dia do mês mais antigo da janela, para filtrar `sales_goals.month`. */
export function goalWindowStart(month: MonthKey, historyMonths = 12) {
  return monthStartDate(lastMonths(month, historyMonths)[0]);
}
