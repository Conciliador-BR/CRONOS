/** Regras puras do resumo da página inicial. */

export type UpcomingEvent = { id: string; title: string; startsAt: string; allDay: boolean };
export type MyCard = { id: string; title: string; dueAt: string | null };

/** Junta eventos de várias fontes sem repetir e ordena por início. */
export function mergeEvents(...lists: UpcomingEvent[][]) {
  const byId = new Map<string, UpcomingEvent>();
  for (const list of lists) for (const e of list) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Missões com prazo primeiro (mais próximo antes), depois as sem prazo. */
export function sortCards(cards: MyCard[]) {
  return [...cards].sort((a, b) => {
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}

export function countDistinct(values: readonly string[]) {
  return new Set(values.map((v) => v.toUpperCase())).size;
}

/** Saudação pela hora em São Paulo. */
export function greeting(now: Date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(now),
  );
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "";
}
