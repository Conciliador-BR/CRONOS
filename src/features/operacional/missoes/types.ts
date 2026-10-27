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
  /** Foto de capa (uma das anexadas) e URL assinada para exibir no cartão. */
  coverAttachmentId: string | null;
  coverUrl: string | null;
  attachmentCount: number;
};

/** Foto anexada ao cartão, com URL assinada (1 h). */
export type CardAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
  createdAt: string;
  /** Quem enviou ou gestor pode excluir (a RLS confirma). */
  canDelete: boolean;
};

/** Quadros e listas para "Mover" o cartão. */
export type BoardDestination = {
  id: string;
  name: string;
  background: string;
  lists: { id: string; name: string }[];
};

export type BoardData = {
  board: { id: string; name: string; background: string };
  lists: BoardList[];
  cards: BoardCard[];
  labels: BoardLabel[];
  members: Member[];
  destinations: BoardDestination[];
};
