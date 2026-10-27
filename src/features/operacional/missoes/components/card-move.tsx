"use client";

import { ArrowRightLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { transferCard } from "../card-actions";
import { removeCard } from "../board-state";
import { useBoard } from "./board-context";
import { SectionTitle } from "./section-title";

/** "Mudar de quadro / lista" (vai para o fim da lista escolhida). `defaultOpen` vem do menu "…" do cartão. */
export function CardMove({ cardId, defaultOpen = false }: { cardId: string; defaultOpen?: boolean }) {
  const { state, meta, actions } = useBoard();
  const card = state.cards[cardId];
  const [open, setOpen] = useState(defaultOpen);
  const [boardId, setBoardId] = useState(meta.boardId);
  const destination = meta.destinations.find((board) => board.id === boardId);
  const [listId, setListId] = useState(card?.listId ?? "");
  const [pending, setPending] = useState(false);
  const boardSelectRef = useRef<HTMLSelectElement>(null);

  // Aberto pelo menu "…": foca o quadro depois que o modal assume o foco.
  useEffect(() => {
    if (!defaultOpen) return;
    const frame = requestAnimationFrame(() => boardSelectRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [defaultOpen]);

  if (!card) return null;

  async function move() {
    if (!listId) return;
    setPending(true);
    const sameBoard = boardId === meta.boardId;
    const ok = await actions.mutate(
      (s) => (sameBoard ? s : removeCard(s, cardId)),
      () => transferCard({ id: cardId, fromBoardId: meta.boardId, toBoardId: boardId, toListId: listId }),
    );
    setPending(false);
    if (ok) {
      setOpen(false);
      if (!sameBoard) actions.openCard(null);
    }
  }

  return (
    <section aria-labelledby="card-move-title">
      <SectionTitle id="card-move-title">Ações</SectionTitle>
      <Button variant="secondary" size="sm" className="w-full justify-start" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <ArrowRightLeft aria-hidden />
        Mudar de quadro / lista
      </Button>
      {open ? (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Quadro
            <Select
              ref={boardSelectRef}
              value={boardId}
              onChange={(event) => {
                setBoardId(event.target.value);
                setListId(meta.destinations.find((b) => b.id === event.target.value)?.lists[0]?.id ?? "");
              }}
              className="h-9"
            >
              {meta.destinations.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                  {board.id === meta.boardId ? " (atual)" : ""}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Lista
            <Select value={listId} onChange={(event) => setListId(event.target.value)} className="h-9" disabled={!destination?.lists.length}>
              {destination?.lists.length ? null : <option value="">Sem listas</option>}
              {destination?.lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </Select>
          </label>
          <Button size="sm" onClick={move} loading={pending} disabled={!listId}>
            Mover cartão
          </Button>
        </div>
      ) : null}
    </section>
  );
}
