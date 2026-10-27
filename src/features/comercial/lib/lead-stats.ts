import { LEAD_SOURCES, type LeadSource, type LeadTemperature, type PipelineStage } from "../constants";
import { toMonthKey, type MonthKey } from "./months";
import { keywordsOf, normalizeText } from "./text";

/** Conversão = fechados ÷ total. 0 quando não há leads. */
export function conversionRate(won: number, total: number): number {
  return total > 0 ? won / total : 0;
}

export type StatsLead = {
  source: LeadSource;
  temperature: LeadTemperature;
  stage: PipelineStage;
  createdAt: string;
};

export type Counts = { total: number; won: number; lost: number; open: number; quente: number; frio: number };

export type SourceStats = Counts & {
  source: LeadSource;
  /** Fatia do total de leads (0–1). */
  share: number;
  /** Fechados ÷ total da origem (0–1). */
  conversionRate: number;
};

export type MonthStats = Counts & {
  month: MonthKey;
  conversionRate: number;
  sources: Record<LeadSource, Counts>;
};

export type LeadSourceStats = Counts & {
  conversionRate: number;
  /** Sempre as quatro origens, na ordem de LEAD_SOURCES. */
  bySource: SourceStats[];
  /** Meses com leads (pelo `created_at`, fuso de São Paulo), do mais antigo ao mais recente. */
  byMonth: MonthStats[];
};

function emptyCounts(): Counts {
  return { total: 0, won: 0, lost: 0, open: 0, quente: 0, frio: 0 };
}

function emptyBySource(): Record<LeadSource, Counts> {
  return { marketing: emptyCounts(), venda: emptyCounts(), indicacao: emptyCounts(), outro: emptyCounts() };
}

function add(counts: Counts, lead: StatsLead) {
  counts.total += 1;
  if (lead.stage === "cliente_fechado") counts.won += 1;
  else if (lead.stage === "cliente_perdido") counts.lost += 1;
  else counts.open += 1;
  counts[lead.temperature] += 1;
}

/** Contagens por origem, temperatura e mês. Base de Insights, Marketing e Início. */
export function computeLeadSourceStats(leads: readonly StatsLead[]): LeadSourceStats {
  const totals = emptyCounts();
  const sources = emptyBySource();
  const months = new Map<MonthKey, { counts: Counts; sources: Record<LeadSource, Counts> }>();

  for (const lead of leads) {
    add(totals, lead);
    add(sources[lead.source], lead);
    const key = toMonthKey(lead.createdAt);
    let month = months.get(key);
    if (!month) {
      month = { counts: emptyCounts(), sources: emptyBySource() };
      months.set(key, month);
    }
    add(month.counts, lead);
    add(month.sources[lead.source], lead);
  }

  return {
    ...totals,
    conversionRate: conversionRate(totals.won, totals.total),
    bySource: LEAD_SOURCES.map((source) => ({
      source,
      ...sources[source],
      share: totals.total > 0 ? sources[source].total / totals.total : 0,
      conversionRate: conversionRate(sources[source].won, sources[source].total),
    })),
    byMonth: [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({
        month,
        ...value.counts,
        conversionRate: conversionRate(value.counts.won, value.counts.total),
        sources: value.sources,
      })),
  };
}

export type ReferrerLead = { referrerName: string | null; stage: PipelineStage; dealValueCents: number | null };

export type ReferrerStats = {
  name: string;
  leads: number;
  won: number;
  revenueCents: number;
  conversionRate: number;
  position: number;
};

/**
 * Ranking de indicadores. Nomes iguais sem diferença de caixa, acento ou espaços são o mesmo
 * indicador; exibe a grafia mais frequente. Ordena por fechados, depois por leads.
 */
export function rankReferrers(leads: readonly ReferrerLead[]): ReferrerStats[] {
  const groups = new Map<string, { spellings: Map<string, number>; leads: number; won: number; revenueCents: number }>();
  for (const lead of leads) {
    const raw = lead.referrerName?.trim().replace(/\s+/g, " ");
    if (!raw) continue;
    const key = normalizeText(raw);
    if (!key) continue;
    let group = groups.get(key);
    if (!group) {
      group = { spellings: new Map(), leads: 0, won: 0, revenueCents: 0 };
      groups.set(key, group);
    }
    group.spellings.set(raw, (group.spellings.get(raw) ?? 0) + 1);
    group.leads += 1;
    if (lead.stage === "cliente_fechado") {
      group.won += 1;
      group.revenueCents += lead.dealValueCents ?? 0;
    }
  }

  const rows = [...groups.values()].map((group) => {
    const name = [...group.spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    return {
      name,
      leads: group.leads,
      won: group.won,
      revenueCents: group.revenueCents,
      conversionRate: conversionRate(group.won, group.leads),
    };
  });
  rows.sort((a, b) => b.won - a.won || b.leads - a.leads || a.name.localeCompare(b.name, "pt-BR"));

  let position = 0;
  return rows.map((row, index) => {
    const prev = rows[index - 1];
    if (!prev || prev.won !== row.won || prev.leads !== row.leads) position = index + 1;
    return { ...row, position };
  });
}

export type ReasonGroup = { text: string; count: number };
export type KeywordGroup = { word: string; count: number };

/**
 * Agrupa motivos de perda: `phrases` junta textos iguais (ignorando caixa, acento e pontuação);
 * `keywords` conta em quantos motivos cada palavra relevante aparece.
 */
export function groupLostReasons(reasons: readonly string[], limit = 8): { phrases: ReasonGroup[]; keywords: KeywordGroup[] } {
  const phrases = new Map<string, { text: string; count: number }>();
  const keywords = new Map<string, number>();

  for (const reason of reasons) {
    const text = reason.trim().replace(/\s+/g, " ");
    const key = normalizeText(text);
    if (!key) continue;
    const phrase = phrases.get(key);
    if (phrase) phrase.count += 1;
    else phrases.set(key, { text, count: 1 });
    for (const word of new Set(keywordsOf(text))) keywords.set(word, (keywords.get(word) ?? 0) + 1);
  }

  return {
    phrases: [...phrases.values()]
      .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text, "pt-BR"))
      .slice(0, limit),
    keywords: [...keywords.entries()]
      .map(([word, count]) => ({ word, count }))
      .filter((k) => k.count > 1)
      .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, "pt-BR"))
      .slice(0, limit),
  };
}
