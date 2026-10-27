"use client";

import { Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { boardBackdrop } from "../backgrounds";
import type { BoardSummary } from "../types";
import { BoardFormModal } from "./board-form-modal";

/** Área de trabalho: quadros como blocos (cor ou foto de fundo) e "Criar novo quadro". */
export function BoardsGrid({ boards }: { boards: BoardSummary[] }) {
  const [creating, setCreating] = useState(false);
  // Guarda o id: depois de trocar a imagem, o modal mostra o quadro já revalidado.
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = boards.find((board) => board.id === editingId) ?? null;

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {boards.map((board) => (
          <li key={board.id} className="group relative">
            <Link
              href={`/operacional/missoes/${board.id}`}
              className="flex h-28 flex-col justify-between rounded-xl p-3 text-white shadow-md shadow-black/40 ring-1 ring-white/10 transition [text-shadow:0_1px_2px_rgb(0_0_0/0.6)] hover:brightness-110"
              style={{ background: boardBackdrop(board.background, board.image?.url) }}
            >
              <span className="line-clamp-2 pr-8 font-semibold break-words">{board.name}</span>
              <span className="text-xs text-white/80">
                {board.listCount} {board.listCount === 1 ? "lista" : "listas"} · {board.cardCount}{" "}
                {board.cardCount === 1 ? "cartão" : "cartões"}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setEditingId(board.id)}
              aria-label={`Configurar quadro ${board.name}`}
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-md bg-black/30 text-white opacity-80 hover:bg-black/50 hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Settings2 aria-hidden className="size-4" />
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface text-sm text-muted transition-colors hover:border-primary/60 hover:bg-surface-2 hover:text-fg"
          >
            <Plus aria-hidden className="size-5" />
            Criar novo quadro
          </button>
        </li>
      </ul>
      {creating ? <BoardFormModal open onClose={() => setCreating(false)} /> : null}
      {editing ? <BoardFormModal key={editing.id} open board={editing} onClose={() => setEditingId(null)} /> : null}
    </>
  );
}
