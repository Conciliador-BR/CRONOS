/** Paletas usadas em quadros, etiquetas, eventos e adquirentes. */

export type PaletteColor = { value: string; name: string };

export const BOARD_COLORS: readonly PaletteColor[] = [
  { value: "#0b1220", name: "Noite" },
  { value: "#1e3a8a", name: "Azul-marinho" },
  { value: "#1d4ed8", name: "Azul" },
  { value: "#0e7490", name: "Ciano" },
  { value: "#047857", name: "Verde" },
  { value: "#6d28d9", name: "Roxo" },
  { value: "#b45309", name: "Âmbar" },
  { value: "#be123c", name: "Vermelho" },
  { value: "#334155", name: "Cinza" },
];

export const ACCENT_COLORS: readonly PaletteColor[] = [
  { value: "#2563eb", name: "Azul" },
  { value: "#38bdf8", name: "Céu" },
  { value: "#22c55e", name: "Verde" },
  { value: "#eab308", name: "Amarelo" },
  { value: "#f97316", name: "Laranja" },
  { value: "#ef4444", name: "Vermelho" },
  { value: "#a855f7", name: "Roxo" },
  { value: "#ec4899", name: "Rosa" },
  { value: "#14b8a6", name: "Turquesa" },
  { value: "#64748b", name: "Cinza" },
];

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function colorName(value: string, palette: readonly PaletteColor[] = ACCENT_COLORS): string {
  return palette.find((color) => color.value.toLowerCase() === value.toLowerCase())?.name ?? value;
}
