/** Centavos para o texto do campo ("1500,00"); vazio quando null. */
export function centsToInput(cents: number | null) {
  if (cents === null) return "";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
