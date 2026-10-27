import { format, formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";

const percent0 = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const percent1 = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("pt-BR");

/** 0,256 → "25,6%". */
export function formatPercent(ratio: number, digits: 0 | 1 = 0) {
  return (digits === 0 ? percent0 : percent1).format(Number.isFinite(ratio) ? ratio : 0);
}

export function formatInteger(value: number) {
  return integer.format(value);
}

/** "23/10/2026". */
export function formatDate(iso: string | null | undefined) {
  return iso ? format(new Date(iso), "dd/MM/yyyy", { locale: ptBR }) : "—";
}

/** "23/10/2026 às 14:05". */
export function formatDateTime(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

/** "há 3 dias". */
export function formatRelative(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { locale: ptBR, addSuffix: true });
}

/** Valor compacto para eixos de gráfico: R$ 1,2 mil, R$ 3 mi. */
const compactBrl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});
export function formatCentsCompact(cents: number) {
  return compactBrl.format(cents / 100);
}
