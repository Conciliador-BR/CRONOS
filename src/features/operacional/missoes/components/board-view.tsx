"use client";

import { Alert } from "@/components/ui/alert";
import type { BoardData } from "../types";
import { BoardCanvas } from "./board-canvas";
import { BoardProvider, useBoard } from "./board-context";
import { BoardHeader } from "./board-header";
import { CardDetailModal } from "./card-detail-modal";
import type { ArchivedCard } from "./archived-cards";

/** Tela do quadro: cabeçalho, listas arrastáveis e modal do cartão. */
export function BoardView({ data, archived }: { data: BoardData; archived: ArchivedCard[] }) {
  return (
    <BoardProvider data={data}>
      <div
        className="flex h-[calc(100dvh-11rem)] min-h-[440px] flex-col overflow-hidden rounded-xl ring-1 ring-border"
        style={{ background: `linear-gradient(160deg, ${data.board.background}, color-mix(in srgb, ${data.board.background} 55%, #05070d))` }}
      >
        <BoardHeader board={data.board} archived={archived} />
        <BoardError />
        <div className="min-h-0 flex-1">
          <BoardCanvas />
        </div>
      </div>
      <CardDetailModal />
    </BoardProvider>
  );
}

function BoardError() {
  const { ui, actions } = useBoard();
  if (!ui.error) return null;
  return (
    <div className="px-3 pt-3">
      <Alert tone="danger" title="A mudança não foi salva">
        <span>{ui.error} </span>
        <button type="button" className="underline" onClick={() => actions.reportError(null)}>
          Fechar aviso
        </button>
      </Alert>
    </div>
  );
}
