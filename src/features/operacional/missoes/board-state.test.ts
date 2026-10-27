import { describe, expect, it } from "vitest";
import { appendCard, buildBoardState, placeCard, removeCard, removeList } from "./board-state";
import type { BoardCard } from "./types";

const card = (id: string, listId: string, position: number): BoardCard => ({
  id,
  listId,
  position,
  title: id,
  description: "",
  dueAt: null,
  completed: false,
  labelIds: [],
  assigneeIds: [],
  checklist: [],
  coverAttachmentId: null,
  coverUrl: null,
  attachmentCount: 0,
});

const base = buildBoardState({
  lists: [
    { id: "b", name: "B", position: 2 },
    { id: "a", name: "A", position: 1 },
  ],
  cards: [card("c2", "a", 20), card("c1", "a", 10), card("c3", "b", 5), card("x", "missing", 1)],
  labels: [],
});

describe("board state", () => {
  it("ordena listas e cartões por posição e ignora cartões órfãos", () => {
    expect(base.listOrder).toEqual(["a", "b"]);
    expect(base.columns).toEqual({ a: ["c1", "c2"], b: ["c3"] });
    expect(base.cards.x).toBeUndefined();
  });
  it("move cartão entre listas", () => {
    const next = placeCard(base, "c1", "b", 0);
    expect(next.columns).toEqual({ a: ["c2"], b: ["c1", "c3"] });
    expect(next.cards.c1.listId).toBe("b");
    expect(base.columns.a).toEqual(["c1", "c2"]);
  });
  it("adiciona e remove", () => {
    const added = appendCard(base, card("c4", "b", 9));
    expect(added.columns.b).toEqual(["c3", "c4"]);
    expect(removeCard(added, "c3").columns.b).toEqual(["c4"]);
    const noA = removeList(base, "a");
    expect(noA.listOrder).toEqual(["b"]);
    expect(noA.cards.c1).toBeUndefined();
  });
});
