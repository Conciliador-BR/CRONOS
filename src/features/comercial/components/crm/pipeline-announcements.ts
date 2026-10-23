import type { Announcements, ScreenReaderInstructions } from "@dnd-kit/core";
import { STAGE_LABELS } from "../../constants";
import { findStage, type Columns } from "../../lib/pipeline";

export const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "Para mover o lead, pressione Espaço ou Enter. Use as setas para cima e para baixo para mudar a ordem e " +
    "para a esquerda e direita para trocar de coluna. Pressione Espaço ou Enter de novo para soltar, ou Esc para cancelar.",
};

/** Anúncios em português para leitores de tela. `getColumns` lê o estado mais recente. */
export function createAnnouncements(getColumns: () => Columns): Announcements {
  function nameOf(id: string | number) {
    const columns = getColumns();
    const stage = findStage(columns, String(id));
    return (stage && columns[stage].find((lead) => lead.id === String(id))?.name) || "Lead";
  }

  function placeOf(id: string | number) {
    const columns = getColumns();
    const stage = findStage(columns, String(id));
    if (!stage) return null;
    const list = columns[stage];
    const index = list.findIndex((lead) => lead.id === String(id));
    return { column: STAGE_LABELS[stage], position: index + 1, total: list.length };
  }

  function describe(activeId: string | number) {
    const place = placeOf(activeId);
    return place ? `coluna ${place.column}, posição ${place.position} de ${place.total}` : "";
  }

  return {
    onDragStart: ({ active }) => `${nameOf(active.id)} selecionado. Está na ${describe(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} agora na ${describe(active.id)}.` : `${nameOf(active.id)} fora de uma coluna.`,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} solto na ${describe(active.id)}.` : `${nameOf(active.id)} solto fora das colunas.`,
    onDragCancel: ({ active }) => `Movimento cancelado. ${nameOf(active.id)} voltou para a posição original.`,
  };
}
