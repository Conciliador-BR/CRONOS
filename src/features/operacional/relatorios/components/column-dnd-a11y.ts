import type { Active, Announcements, Over, ScreenReaderInstructions } from "@dnd-kit/core";

const column = (item: Active | Over) => `"${(item.data.current as { title?: string } | undefined)?.title ?? ""}"`;

export const columnInstructions: ScreenReaderInstructions = {
  draggable: "Para mover a coluna, pressione Espaço, use as setas e pressione Espaço para soltar. Esc cancela.",
};

export const columnAnnouncements: Announcements = {
  onDragStart: ({ active }) => `Você pegou a coluna ${column(active)}.`,
  onDragOver: ({ active, over }) =>
    over ? `A coluna ${column(active)} está no lugar da coluna ${column(over)}.` : `A coluna ${column(active)} está fora da tabela.`,
  onDragEnd: ({ active, over }) =>
    over ? `A coluna ${column(active)} foi solta no lugar da coluna ${column(over)}.` : `A coluna ${column(active)} foi solta.`,
  onDragCancel: ({ active }) => `Movimento cancelado. A coluna ${column(active)} voltou ao lugar.`,
};

export const rowInstructions: ScreenReaderInstructions = {
  draggable: "Para mover a linha, pressione Espaço, use as setas para cima e para baixo e pressione Espaço para soltar. Esc cancela.",
};

export const rowAnnouncements: Announcements = {
  onDragStart: ({ active }) => `Você pegou a linha ${column(active)}.`,
  onDragOver: ({ active, over }) =>
    over ? `A linha ${column(active)} está no lugar da linha ${column(over)}.` : `A linha ${column(active)} está fora da tabela.`,
  onDragEnd: ({ active, over }) =>
    over ? `A linha ${column(active)} foi solta no lugar da linha ${column(over)}.` : `A linha ${column(active)} foi solta.`,
  onDragCancel: ({ active }) => `Movimento cancelado. A linha ${column(active)} voltou ao lugar.`,
};
