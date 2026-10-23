import type { Announcements, Active, Over, ScreenReaderInstructions } from "@dnd-kit/core";

type Data = { type?: string; title?: string; listId?: string } | undefined;

function name(item: Active | Over) {
  const data = item.data.current as Data;
  const title = data?.title ?? "item";
  return data?.type === "list" ? `a lista "${title}"` : `o cartão "${title}"`;
}

function place(over: Over) {
  const data = over.data.current as Data;
  if (data?.type === "list-body") return `na lista "${data.title ?? ""}"`;
  if (data?.type === "list") return `na posição da lista "${data.title ?? ""}"`;
  return `junto ao cartão "${data?.title ?? ""}"`;
}

export const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "Para pegar, pressione Espaço. Use as setas para mover entre posições e listas. " +
    "Pressione Espaço ou Enter para soltar, ou Esc para cancelar. Enter abre o cartão.",
};

export const announcements: Announcements = {
  onDragStart: ({ active }) => `Você pegou ${name(active)}.`,
  onDragOver: ({ active, over }) =>
    over ? `${capitalize(name(active))} está ${place(over)}.` : `${capitalize(name(active))} não está sobre uma área válida.`,
  onDragEnd: ({ active, over }) =>
    over ? `${capitalize(name(active))} foi solto ${place(over)}.` : `${capitalize(name(active))} foi solto.`,
  onDragCancel: ({ active }) => `Movimento cancelado. ${capitalize(name(active))} voltou ao lugar.`,
};

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
