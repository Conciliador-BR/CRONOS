"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toggleCardAssignee } from "../card-actions";
import { patchCard } from "../board-state";
import { useBoard } from "./board-context";
import { SectionTitle } from "./section-title";

/** Responsáveis: delegar a missão a funcionários ativos. */
export function CardMembers({ cardId }: { cardId: string }) {
  const { state, meta, actions } = useBoard();
  const card = state.cards[cardId];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  if (!card) return null;
  const selected = new Set(card.assigneeIds);
  const term = query.trim().toLocaleLowerCase("pt-BR");
  const options = term ? meta.members.filter((m) => m.name.toLocaleLowerCase("pt-BR").includes(term)) : meta.members;

  function toggle(memberId: string) {
    const on = !selected.has(memberId);
    const assigneeIds = on ? [...card.assigneeIds, memberId] : card.assigneeIds.filter((id) => id !== memberId);
    void actions.mutate(
      (s) => patchCard(s, cardId, { assigneeIds }),
      () => toggleCardAssignee({ cardId, boardId: meta.boardId, targetId: memberId, on }),
    );
  }

  return (
    <section aria-labelledby="card-members-title" className="min-w-0">
      <SectionTitle id="card-members-title">Membros</SectionTitle>
      <div className="flex flex-wrap items-center gap-1">
        {card.assigneeIds.map((memberId) => {
          const member = meta.membersById.get(memberId);
          return member ? <Avatar key={memberId} name={member.name} src={member.avatarUrl} size="sm" /> : null;
        })}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="card-members-picker"
          aria-label="Escolher membros"
          onClick={() => setOpen((value) => !value)}
          className="grid size-8 place-items-center rounded-full bg-surface-2 text-muted hover:bg-surface-3 hover:text-fg"
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
      {open ? (
        <div id="card-members-picker" className="mt-2 w-72 max-w-full rounded-lg border border-border bg-surface-2 p-3">
          <Input
            autoFocus
            aria-label="Buscar membros"
            placeholder="Buscar funcionários"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mb-2 h-9"
          />
          {options.length === 0 ? <p className="text-sm text-muted">Nenhum funcionário encontrado.</p> : null}
          <ul className="flex max-h-60 flex-col gap-0.5 overflow-y-auto">
            {options.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selected.has(member.id)}
                  onClick={() => toggle(member.id)}
                  className="flex w-full items-center gap-2 rounded-md p-1.5 text-left text-sm hover:bg-surface-3"
                >
                  <Avatar name={member.name} src={member.avatarUrl} size="xs" />
                  <span className="min-w-0 flex-1 truncate">{member.name}</span>
                  {selected.has(member.id) ? <Check aria-hidden className="size-4 text-ring" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
