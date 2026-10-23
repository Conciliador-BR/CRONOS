import { onlyDigits } from "@/lib/format/document";
import { toUf, type Uf } from "./brazil-states";

/** Dados mínimos de uma empresa para o mapa, a lista do estado e a busca. */
export type CompanySummary = {
  id: string;
  uf: string;
  city: string | null;
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  marketName: string | null;
  clientName: string | null;
};

/** Nome exibido do mercado: nome do mercado, senão nome fantasia, senão razão social. */
export function marketLabel(c: Pick<CompanySummary, "marketName" | "tradeName" | "legalName">) {
  return c.marketName?.trim() || c.tradeName?.trim() || c.legalName;
}

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

/** Agrupa por UF (ignora UF inválida) e ordena cada grupo pelo nome do mercado. */
export function groupByUf(companies: readonly CompanySummary[]) {
  const groups = new Map<Uf, CompanySummary[]>();
  for (const company of companies) {
    const uf = toUf(company.uf);
    if (!uf) continue;
    const list = groups.get(uf);
    if (list) list.push(company);
    else groups.set(uf, [company]);
  }
  for (const list of groups.values()) list.sort((a, b) => collator.compare(marketLabel(a), marketLabel(b)));
  return groups;
}

/** Tons de azul do mais claro de intensidade (poucas empresas) ao mais forte. */
export const MAP_FILL_STEPS = ["#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"] as const;
export const MAP_EMPTY_FILL = "#1c2333";

/** Índice da faixa de cor (0..steps-1) ou -1 quando não há empresas. */
export function bucketIndex(count: number, max: number, steps: number = MAP_FILL_STEPS.length) {
  if (count <= 0 || max <= 0) return -1;
  const ratio = Math.min(count, max) / max;
  return Math.min(steps - 1, Math.max(0, Math.ceil(ratio * steps) - 1));
}

export function fillFor(count: number, max: number) {
  const index = bucketIndex(count, max);
  return index < 0 ? MAP_EMPTY_FILL : MAP_FILL_STEPS[index];
}

export type LegendItem = { color: string; label: string };

/** Faixas da legenda que realmente aparecem para o máximo atual. */
export function legendFor(max: number): LegendItem[] {
  const steps = MAP_FILL_STEPS.length;
  const items: LegendItem[] = [];
  for (let i = 0; i < steps; i++) {
    // Menor e maior contagem que caem na faixa i.
    const low = Math.floor((i * max) / steps) + 1;
    const high = Math.floor(((i + 1) * max) / steps);
    if (low > high) continue;
    items.push({ color: MAP_FILL_STEPS[i], label: low === high ? String(low) : `${low}–${high}` });
  }
  return items;
}

export function companiesLabel(count: number) {
  return count === 1 ? "1 empresa" : `${count} empresas`;
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Busca por mercado, nome fantasia, razão social, cidade, cliente ou CNPJ (com ou sem máscara). */
export function searchCompanies(companies: readonly CompanySummary[], query: string) {
  const text = normalize(query);
  if (!text) return [];
  const digits = onlyDigits(query);
  return companies.filter((c) => {
    if (digits.length >= 3 && c.cnpj.includes(digits)) return true;
    const haystack = [c.marketName, c.tradeName, c.legalName, c.city, c.clientName, c.uf]
      .filter(Boolean)
      .join(" | ");
    return normalize(haystack).includes(text);
  });
}
