"use client";

import { createContext, use, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { ActionResult } from "../../shared/result";
import type { Member } from "../../shared/types";
import { buildBoardState, type BoardState } from "../board-state";
import type { BoardData, BoardDestination, BoardLabel } from "../types";

type BoardMeta = {
  boardId: string;
  members: Member[];
  membersById: Map<string, Member>;
  labelsById: Map<string, BoardLabel>;
  destinations: BoardDestination[];
};

type BoardActions = {
  setState: Dispatch<SetStateAction<BoardState>>;
  /** Aplica a mudança na hora e desfaz se a ação no servidor falhar. */
  mutate: (change: (state: BoardState) => BoardState, call: () => Promise<ActionResult>) => Promise<boolean>;
  reportError: (message: string | null) => void;
  /** Abre o cartão; "move" já abre o seletor "Mudar de quadro / lista". */
  openCard: (id: string | null, focus?: CardFocus) => void;
};

export type CardFocus = "move";

type BoardContextValue = {
  state: BoardState;
  meta: BoardMeta;
  ui: { openCardId: string | null; openCardFocus: CardFocus | null; error: string | null };
  actions: BoardActions;
};

const BoardContext = createContext<BoardContextValue | null>(null);

export function useBoard() {
  const value = use(BoardContext);
  if (!value) throw new Error("useBoard fora do BoardProvider");
  return value;
}

/** Único lugar que sabe como o estado do quadro é guardado e sincronizado com o servidor. */
export function BoardProvider({ data, children }: { data: BoardData; children: ReactNode }) {
  const [source, setSource] = useState(data);
  const [state, setState] = useState(() => buildBoardState(data));
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [openCardFocus, setOpenCardFocus] = useState<CardFocus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dados novos do servidor (revalidação) substituem o estado otimista.
  if (data !== source) {
    setSource(data);
    setState(buildBoardState(data));
  }

  async function mutate(change: (state: BoardState) => BoardState, call: () => Promise<ActionResult>) {
    let snapshot: BoardState | undefined;
    setState((current) => {
      snapshot ??= current;
      return change(current);
    });
    setError(null);
    try {
      const result = await call();
      if (result.ok) return true;
      if (snapshot) setState(snapshot);
      setError(result.error);
    } catch {
      if (snapshot) setState(snapshot);
      setError("Sem conexão com o servidor. A mudança foi desfeita.");
    }
    return false;
  }

  const meta: BoardMeta = {
    boardId: data.board.id,
    members: data.members,
    membersById: new Map(data.members.map((member) => [member.id, member])),
    labelsById: new Map(state.labels.map((label) => [label.id, label])),
    destinations: data.destinations,
  };

  return (
    <BoardContext
      value={{
        state,
        meta,
        ui: { openCardId, openCardFocus, error },
        actions: {
          setState,
          mutate,
          reportError: setError,
          openCard: (id, focus) => {
            setOpenCardId(id);
            setOpenCardFocus(id && focus ? focus : null);
          },
        },
      }}
    >
      {children}
    </BoardContext>
  );
}
