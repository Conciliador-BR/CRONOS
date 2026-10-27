"use client";

import { ArrowLeft, Palette } from "lucide-react";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { updateBoard } from "../board-actions";
import type { BoardInfo } from "../types";
import { ArchivedCards, type ArchivedCard } from "./archived-cards";
import { useBoard } from "./board-context";
import { BoardFormModal } from "./board-form-modal";

export function BoardHeader({ board, archived }: { board: BoardInfo; archived: ArchivedCard[] }) {
  const { actions } = useBoard();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(board.name);
  const [shown, setShown] = useState(board.name);
  const [settings, setSettings] = useState(false);
  const [prevName, setPrevName] = useState(board.name);
  if (board.name !== prevName) {
    setPrevName(board.name);
    setShown(board.name);
    setName(board.name);
  }

  async function commit() {
    setEditing(false);
    const value = name.trim();
    if (!value || value === shown) return setName(shown);
    const previous = shown;
    setShown(value);
    const result = await updateBoard({ id: board.id, name: value, background: board.background });
    if (!result.ok) {
      setShown(previous);
      setName(previous);
      actions.reportError(result.error);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      setName(shown);
      setEditing(false);
    }
  }

  return (
    <header className="flex flex-wrap items-center gap-2 bg-black/30 px-3 py-2 backdrop-blur-sm">
      <Link
        href="/operacional/missoes"
        aria-label="Voltar para os quadros"
        className="grid size-9 place-items-center rounded-md text-white/80 hover:bg-white/15 hover:text-white"
      >
        <ArrowLeft aria-hidden className="size-4" />
      </Link>
      {editing ? (
        <input
          autoFocus
          aria-label="Nome do quadro"
          value={name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          className="h-9 min-w-0 rounded-md border border-ring bg-surface px-2 text-lg font-bold text-fg outline-none"
        />
      ) : (
        <h1 className="min-w-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Renomear quadro"
            className="max-w-[60vw] truncate rounded-md px-2 py-1 text-lg font-bold text-white hover:bg-white/15"
          >
            {shown}
          </button>
        </h1>
      )}
      <div className="ml-auto flex items-center gap-1">
        <ArchivedCards boardId={board.id} cards={archived} />
        <Button variant="ghost" size="sm" className="text-white/85 hover:bg-white/15 hover:text-white" onClick={() => setSettings(true)}>
          <Palette aria-hidden />
          Quadro e fundo
        </Button>
      </div>
      <BoardFormModal
        key={`${board.name}-${board.background}`}
        open={settings}
        onClose={() => setSettings(false)}
        board={board}
      />
    </header>
  );
}
