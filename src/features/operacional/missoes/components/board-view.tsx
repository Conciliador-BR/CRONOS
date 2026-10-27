"use client";

import { Alert } from "@/components/ui/alert";
import { boardBackdrop } from "../backgrounds";
import type { BoardData } from "../types";
import { BoardCanvas } from "./board-canvas";
import { BoardProvider, useBoard } from "./board-context";
import { BoardSwitcher } from "./board-switcher";
import { BoardHeader } from "./board-header";
import { CardDetailModal } from "./card-detail-modal";
import type { ArchivedCard } from "./archived-cards";
import { useStableImageUrl } from "./use-stable-image";

/** Tela do quadro: foto/cor de fundo (última camada), cabeçalho, listas arrastáveis e modal do cartão. */
export function BoardView({ data, archived }: { data: BoardData; archived: ArchivedCard[] }) {
  const imageUrl = useStableImageUrl(data.board.image);
  return (
    <BoardProvider data={data}>
      <div
        className="relative flex h-[calc(100dvh-11rem)] min-h-[440px] flex-col overflow-hidden rounded-xl ring-1 ring-border"
        style={{ background: boardBackdrop(data.board.background, imageUrl) }}
      >
        <BoardHeader board={data.board} archived={archived} />
        <BoardError />
        <div className="min-h-0 flex-1">
          <BoardCanvas />
        </div>
        <BoardSwitcher currentId={data.board.id} boards={data.destinations} />
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
