import type { BoardCard, BoardData, BoardLabel, BoardList } from "./types";

/** Estado normalizado do quadro no cliente: ordem das listas e ids de cartões por lista. */
export type BoardState = {
  listOrder: string[];
  lists: Record<string, BoardList>;
  columns: Record<string, string[]>;
  cards: Record<string, BoardCard>;
  labels: BoardLabel[];
};

export function buildBoardState(data: Pick<BoardData, "lists" | "cards" | "labels">): BoardState {
  const lists: Record<string, BoardList> = {};
  const columns: Record<string, string[]> = {};
  const listOrder = data.lists.toSorted((a, b) => a.position - b.position).map((list) => {
    lists[list.id] = list;
    columns[list.id] = [];
    return list.id;
  });
  const cards: Record<string, BoardCard> = {};
  for (const card of data.cards.toSorted((a, b) => a.position - b.position)) {
    if (!columns[card.listId]) continue;
    cards[card.id] = card;
    columns[card.listId].push(card.id);
  }
  return { listOrder, lists, columns, cards, labels: data.labels };
}

export function patchCard(state: BoardState, id: string, patch: Partial<BoardCard>): BoardState {
  const card = state.cards[id];
  if (!card) return state;
  return { ...state, cards: { ...state.cards, [id]: { ...card, ...patch } } };
}

export function removeCard(state: BoardState, id: string): BoardState {
  const card = state.cards[id];
  if (!card) return state;
  const cards = { ...state.cards };
  delete cards[id];
  return {
    ...state,
    cards,
    columns: { ...state.columns, [card.listId]: state.columns[card.listId].filter((cardId) => cardId !== id) },
  };
}

export function appendCard(state: BoardState, card: BoardCard): BoardState {
  const column = state.columns[card.listId];
  if (!column) return state;
  return {
    ...state,
    cards: { ...state.cards, [card.id]: card },
    columns: { ...state.columns, [card.listId]: [...column, card.id] },
  };
}

/** Coloca o cartão em outra lista (índice opcional; padrão: fim). */
export function placeCard(state: BoardState, id: string, listId: string, index?: number): BoardState {
  const card = state.cards[id];
  const target = state.columns[listId];
  if (!card || !target) return state;
  const columns = { ...state.columns, [card.listId]: state.columns[card.listId].filter((cardId) => cardId !== id) };
  const next = columns[listId].filter((cardId) => cardId !== id);
  next.splice(index === undefined ? next.length : Math.max(0, Math.min(index, next.length)), 0, id);
  columns[listId] = next;
  return { ...state, columns, cards: { ...state.cards, [id]: { ...card, listId } } };
}

export function removeList(state: BoardState, id: string): BoardState {
  const cards = { ...state.cards };
  for (const cardId of state.columns[id] ?? []) delete cards[cardId];
  const lists = { ...state.lists };
  delete lists[id];
  const columns = { ...state.columns };
  delete columns[id];
  return { ...state, cards, lists, columns, listOrder: state.listOrder.filter((listId) => listId !== id) };
}
