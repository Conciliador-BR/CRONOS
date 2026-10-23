"use client";

import { useState } from "react";
import { Target, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/format/money";
import type { MonthKey } from "../../lib/months";
import type { SellerPerformance } from "../../lib/performance";
import { EmployeeDetailModal } from "./employee-detail-modal";
import { GoalModal } from "./goal-modal";

type Props = {
  sellers: SellerPerformance[];
  month: MonthKey;
  canManage: boolean;
  allTime: Record<string, { wonCount: number; lostCount: number }>;
};

/** Grade "Equipe": foto, posição no ranking e nome; abre o card do funcionário. */
export function TeamGrid({ sellers, month, canManage, allTime }: Props) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const detail = sellers.find((s) => s.id === detailId) ?? null;
  const goal = sellers.find((s) => s.id === goalId) ?? null;

  if (sellers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum funcionário ativo"
        description="Funcionários cadastrados e ativos em Configurações aparecem aqui."
      />
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {sellers.map((seller) => (
          <li key={seller.id} className="flex flex-col rounded-xl border border-border bg-surface transition-colors hover:border-surface-3">
            <button
              type="button"
              onClick={() => setDetailId(seller.id)}
              className="flex flex-1 flex-col items-center gap-2 rounded-xl px-3 pt-4 pb-3 text-center"
              aria-label={`${seller.name}, ${seller.position}º no ranking. Ver desempenho`}
            >
              <span className="relative">
                <Avatar name={seller.name} src={seller.avatarUrl} size="xl" />
                <span className="absolute -right-1 -bottom-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-surface bg-primary px-1 text-xs font-semibold text-primary-fg tabular-nums">
                  {seller.position}º
                </span>
              </span>
              <span className="w-full truncate text-sm font-medium text-fg">{seller.name}</span>
              <span className="text-xs text-muted tabular-nums">{formatCents(seller.revenueCents)}</span>
            </button>
            {canManage ? (
              <div className="border-t border-border p-2">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setGoalId(seller.id)}>
                  <Target aria-hidden className="size-4" />
                  {seller.goalCents ? "Editar meta" : "Definir meta"}
                  <span className="sr-only"> de {seller.name}</span>
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <EmployeeDetailModal
        seller={detail}
        month={month}
        totals={detail ? allTime[detail.id] : undefined}
        onClose={() => setDetailId(null)}
      />
      {canManage ? <GoalModal key={goal?.id ?? "none"} seller={goal} month={month} onClose={() => setGoalId(null)} /> : null}
    </>
  );
}
