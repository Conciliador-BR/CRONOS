import type { Member } from "../shared/types";

export type BoardSummary = {
  id: string;
  name: string;
  background: string;
  listCount: number;
  cardCount: number;
};

export type BoardLabel = { id: string; name: string; color: string };

export type ChecklistItem = { id: string; content: string; done: boolean; position: number };

export type BoardList = { id: string; name: string; position: number };

export type BoardCard = {
  id: string;
  listId: string;
  title: string;
  description: string;
  dueAt: string | null;
  completed: boolean;
  position: number;
  labelIds: string[];
  assigneeIds: string[];
  checklist: ChecklistItem[];
};

/** Quadros e listas para "Mover" o cartão. */
export type BoardDestination = { id: string; name: string; lists: { id: string; name: string }[] };

export type BoardData = {
  board: { id: string; name: string; background: string };
  lists: BoardList[];
  cards: BoardCard[];
  labels: BoardLabel[];
  members: Member[];
  destinations: BoardDestination[];
};
