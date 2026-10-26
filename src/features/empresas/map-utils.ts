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
  /** Coordenadas exatas do mercado (6 casas); null quando ainda não foi localizado. */
  latitude: number | null;
  longitude: number | null;
  /** Matriz desta empresa, quando ela é filial. */
  parentId: string | null;
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
