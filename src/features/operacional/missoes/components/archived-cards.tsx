"use client";

import { Archive, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { updateCard } from "../card-actions";

export type ArchivedCard = { id: string; title: string; archivedAt: string };

/** Itens arquivados do quadro, com "Restaurar". */
export function ArchivedCards({ boardId, cards }: { boardId: string; cards: ArchivedCard[] }) {
  const [open, setOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function restore(id: string) {
    setPendingId(id);
    const result = await updateCard({ id, boardId, archived: false });
    setPendingId(null);
    setError(result.ok ? null : result.error);
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="text-white/85 hover:bg-white/15 hover:text-white" onClick={() => setOpen(true)}>
        <Archive aria-hidden />
        <span className="hidden sm:inline">Arquivados</span>
        <span className="sr-only sm:hidden">Itens arquivados</span>
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Itens arquivados" description="Cartões arquivados deste quadro.">
        {error ? <p className="mb-3 text-sm font-medium text-danger">{error}</p> : null}
        {cards.length === 0 ? (
          <EmptyState icon={Archive} title="Nenhum cartão arquivado" description="Cartões arquivados aparecem aqui." />
        ) : (
          <ul className="flex flex-col gap-2">
            {cards.map((card) => (
              <li key={card.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
                <span className="min-w-0 flex-1 text-sm break-words">{card.title}</span>
                <Button variant="secondary" size="sm" loading={pendingId === card.id} onClick={() => restore(card.id)}>
                  <RotateCcw aria-hidden />
                  Restaurar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Drawer>
    </>
  );
}
