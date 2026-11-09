const NUMBER_FORMAT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 20 });

export function formatPtBrNumber(value: number): string {
  return NUMBER_FORMAT.format(value);
}

/** Número em pt-BR: ponto é milhar e vírgula é decimal ("1.234" = 1234; "1.234,5" = 1234,5). */
export function parsePtBrNumber(text: string): number | null {
  const clean = text.replace(/\s/g, "");
  if (!/^[-+]?[\d.]*(,\d*)?$/.test(clean) || !/\d/.test(clean)) return null;
  const number = Number(clean.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(number) ? number : null;
}
