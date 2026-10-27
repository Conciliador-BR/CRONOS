"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { useState, type ComponentProps, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { deleteList, renameList } from "../board-actions";
import { removeList } from "../board-state";
import { useBoard } from "./board-context";

type HandleProps = Omit<ComponentProps<"button">, "ref" | "type"> & {
  handleRef: (node: HTMLElement | null) => void;
};

/** Nome da lista (clique para renomear), alça de arrasto e excluir. */
export function ListHeader({ listId, handle }: { listId: string; handle: HandleProps }) {
  const { state, meta, actions } = useBoard();
  const list = state.lists[listId];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(list?.name ?? "");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (!list) return null;
  const count = state.columns[listId]?.length ?? 0;
  const { handleRef, ...handleProps } = handle;

  function startEditing() {
    setDraft(list.name);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    const name = draft.trim();
    if (!name || name === list.name) return;
    void actions.mutate(
      (s) => ({ ...s, lists: { ...s.lists, [listId]: { ...s.lists[listId], name } } }),
      () => renameList({ id: listId, boardId: meta.boardId, name }),
    );
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") {
      event.stopPropagation();
      setDraft(list.name);
      setEditing(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    const ok = await actions.mutate((s) => removeList(s, listId), () => deleteList({ id: listId, boardId: meta.boardId }));
    setDeleting(false);
    if (ok) setConfirming(false);
  }

  return (
    <div className="flex items-center gap-1 px-1">
      <button
        ref={handleRef}
        type="button"
        aria-label={`Mover lista ${list.name}`}
        className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted hover:bg-surface-3 hover:text-fg active:cursor-grabbing"
        {...handleProps}
      >
        <GripVertical aria-hidden className="size-4" />
      </button>
      {editing ? (
        <input
          autoFocus
          aria-label="Nome da lista"
          value={draft}
          maxLength={120}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          className="h-8 min-w-0 flex-1 rounded-md border border-ring bg-surface px-2 text-sm font-semibold text-fg outline-none"
        />
      ) : (
        <h2 className="min-w-0 flex-1">
          <button
            type="button"
            onClick={startEditing}
            title="Renomear lista"
            className="w-full truncate rounded-md px-2 py-1 text-left text-sm font-semibold text-fg hover:bg-surface-3"
          >
            {list.name}
          </button>
        </h2>
      )}
      <span className="px-1 text-xs text-muted tabular-nums" aria-label={`${count} cartões`}>
        {count}
      </span>
      <Button variant="ghost" size="sm" className="size-8 px-0" aria-label={`Excluir lista ${list.name}`} onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden />
      </Button>
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        size="sm"
        title="Excluir lista?"
        description={`A lista "${list.name}" e ${count === 1 ? "o cartão nela" : `os ${count} cartões nela`} serão excluídos. Isso não pode ser desfeito.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>
              Excluir lista
            </Button>
          </>
        }
      />
    </div>
  );
}
