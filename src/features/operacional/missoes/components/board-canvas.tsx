"use client";

import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRef, useState } from "react";
import { moveList } from "../board-actions";
import { moveCard } from "../card-actions";
import { placeCard, type BoardState } from "../board-state";
import { moveItem, positionAtIndex } from "../../shared/position";
import { AddListForm } from "./add-list-form";
import { BODY_PREFIX, BoardColumn } from "./board-column";
import { useBoard } from "./board-context";
import { CardFace } from "./card-face";
import { announcements, screenReaderInstructions } from "./dnd-a11y";

type Active = { id: string; type: "card" | "list" } | null;

const collisionDetection: CollisionDetection = (args) => {
  const type = args.active.data.current?.type;
  if (type === "list") {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === "list"),
    });
  }
  const targets = args.droppableContainers.filter((c) => c.data.current?.type !== "list");
  const within = pointerWithin({ ...args, droppableContainers: targets });
  const cards = within.filter((hit) => !String(hit.id).startsWith(BODY_PREFIX));
  if (cards.length > 0) return closestCenter({ ...args, droppableContainers: targets.filter((c) => cards.some((h) => h.id === c.id)) });
  if (within.length > 0) return within;
  return closestCorners({ ...args, droppableContainers: targets });
};

function listOf(state: BoardState, id: string): string | undefined {
  if (id.startsWith(BODY_PREFIX)) return id.slice(BODY_PREFIX.length);
  if (state.columns[id]) return id;
  return state.cards[id]?.listId;
}

/** Quadro com listas horizontais, arrasto de listas e cartões (mouse, toque e teclado). */
export function BoardCanvas() {
  const { state, meta, actions } = useBoard();
  const [active, setActive] = useState<Active>(null);
  const snapshot = useRef<BoardState | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: [KeyboardCode.Space],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter],
      },
    }),
  );

  function onDragStart({ active: item }: DragStartEvent) {
    snapshot.current = state;
    setActive({ id: String(item.id), type: item.data.current?.type === "list" ? "list" : "card" });
  }

  function onDragOver({ active: item, over }: DragOverEvent) {
    if (!over || item.data.current?.type !== "card") return;
    const id = String(item.id);
    const from = state.cards[id]?.listId;
    const to = listOf(state, String(over.id));
    if (!from || !to || from === to) return;
    const overIndex = state.columns[to].indexOf(String(over.id));
    actions.setState((s) => placeCard(s, id, to, overIndex >= 0 ? overIndex : undefined));
  }

  function restore() {
    if (snapshot.current) actions.setState(snapshot.current);
  }

  function onDragEnd({ active: item, over }: DragEndEvent) {
    setActive(null);
    const before = snapshot.current;
    snapshot.current = null;
    if (!over || !before) {
      if (before) actions.setState(before);
      return;
    }
    const id = String(item.id);
    if (item.data.current?.type === "list") return dropList(id, String(over.id), before);
    dropCard(id, String(over.id), before);
  }

  function dropList(id: string, overId: string, before: BoardState) {
    const from = state.listOrder.indexOf(id);
    const to = state.listOrder.indexOf(overId);
    if (from < 0 || to < 0 || from === to) return;
    const order = moveItem(state.listOrder, from, to);
    const positions = order.filter((listId) => listId !== id).map((listId) => state.lists[listId].position);
    const position = positionAtIndex(positions, to);
    actions.setState({ ...state, listOrder: order, lists: { ...state.lists, [id]: { ...state.lists[id], position } } });
    void persist(() => moveList({ id, boardId: meta.boardId, position }), before);
  }

  function dropCard(id: string, overId: string, before: BoardState) {
    const listId = listOf(state, overId);
    if (!listId) return restore();
    const column = state.columns[listId];
    const from = column.indexOf(id);
    const overIndex = column.indexOf(overId);
    const to = overIndex >= 0 ? overIndex : column.length - 1;
    const order = from >= 0 && from !== to ? moveItem(column, from, to) : column;
    const index = order.indexOf(id);
    const positions = order.filter((cardId) => cardId !== id).map((cardId) => state.cards[cardId].position);
    const position = positionAtIndex(positions, index);
    const original = before.cards[id];
    const sameSpot = original?.listId === listId && before.columns[listId].indexOf(id) === index;
    const next: BoardState = {
      ...state,
      columns: { ...state.columns, [listId]: order },
      cards: { ...state.cards, [id]: { ...state.cards[id], listId, position: sameSpot ? original.position : position } },
    };
    actions.setState(next);
    if (sameSpot) return;
    void persist(() => moveCard({ id, boardId: meta.boardId, listId, position }), before);
  }

  async function persist(call: () => Promise<{ ok: boolean; error?: string }>, before: BoardState) {
    actions.reportError(null);
    try {
      const result = await call();
      if (result.ok) return;
      actions.setState(before);
      actions.reportError(result.error ?? "Não foi possível mover.");
    } catch {
      actions.setState(before);
      actions.reportError("Sem conexão com o servidor. O movimento foi desfeito.");
    }
  }

  const activeCard = active?.type === "card" ? state.cards[active.id] : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActive(null);
        restore();
        snapshot.current = null;
      }}
      accessibility={{ announcements, screenReaderInstructions }}
    >
      <div className="flex h-full items-start gap-3 overflow-x-auto overscroll-x-contain p-3 pb-4 [scrollbar-color:rgba(255,255,255,.3)_transparent]">
        <SortableContext items={state.listOrder} strategy={horizontalListSortingStrategy}>
          {state.listOrder.map((listId) => (
            <BoardColumn key={listId} listId={listId} />
          ))}
        </SortableContext>
        <AddListForm empty={state.listOrder.length === 0} />
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <CardFace
            card={activeCard}
            labels={activeCard.labelIds.flatMap((labelId) => meta.labelsById.get(labelId) ?? [])}
            assignees={activeCard.assigneeIds.flatMap((memberId) => meta.membersById.get(memberId) ?? [])}
            className="w-[256px] rotate-2 cursor-grabbing border-primary/60 shadow-xl"
          />
        ) : active?.type === "list" && state.lists[active.id] ? (
          <div className="w-[272px] rounded-xl bg-surface px-3 py-3 text-sm font-semibold shadow-xl ring-1 ring-primary/50">
            {state.lists[active.id].name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
