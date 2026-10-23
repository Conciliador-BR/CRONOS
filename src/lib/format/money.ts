/** Valores monetários trafegam em centavos inteiros para evitar erro de ponto flutuante. */
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCents(cents: number | null | undefined) {
  return brl.format((cents ?? 0) / 100);
}

/** Converte texto digitado ("1.234,56", "R$ 10", "10.5") em centavos. Retorna null se inválido. */
export function parseBrlToCents(input: string): number | null {
  const cleaned = input.replace(/[R$\s]/g, "");
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(",")) normalized = cleaned.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [int, dec = ""] = normalized.split(".");
  return Number(int) * 100 + Number(dec.padEnd(2, "0"));
}
