import type { ReportProperty, ReportRow, StatusGroup, StatusProgress } from "./types";

export type PersonProgress = {
  personId: string;
  /** Linhas em que a pessoa aparece em alguma coluna Pessoa. */
  rows: number;
  total: number;
  todo: number;
  doing: number;
  done: number;
  percent: number;
};

/**
 * Desempenho por pessoa: cada célula de Status das linhas dela é uma tarefa
 * (linha com 6 colunas Status = 6 tarefas). Ordenado do maior % para o menor.
 */
export function computePeopleProgress(
  properties: readonly ReportProperty[],
  rows: readonly Pick<ReportRow, "values">[],
): PersonProgress[] {
  const people = properties.filter((property) => property.type === "person");
  const statuses = properties
    .filter((property) => property.type === "status")
    .map((property) => ({
      id: property.id,
      groups: new Map(property.options.map((option) => [option.id, option.group ?? "todo"])),
    }));
  if (people.length === 0 || statuses.length === 0) return [];

  const byPerson = new Map<string, PersonProgress>();
  for (const row of rows) {
    const ids = new Set(people.flatMap((property) => row.values[property.id] ?? []).filter((id) => typeof id === "string"));
    for (const personId of ids) {
      const entry = byPerson.get(personId) ?? { personId, rows: 0, total: 0, todo: 0, doing: 0, done: 0, percent: 0 };
      entry.rows += 1;
      for (const status of statuses) {
        const value = row.values[status.id];
        const group: StatusGroup = typeof value === "string" ? (status.groups.get(value) ?? "todo") : "todo";
        entry[group] += 1;
        entry.total += 1;
      }
      byPerson.set(personId, entry);
    }
  }
  return [...byPerson.values()]
    .map((entry) => ({ ...entry, percent: Math.round((entry.done / entry.total) * 100) }))
    .sort((a, b) => b.percent - a.percent || b.done - a.done);
}

/** Contagem por grupo de cada propriedade Status. Sem valor ou opção apagada = "a fazer". */
export function computeStatusProgress(
  properties: readonly ReportProperty[],
  rows: readonly Pick<ReportRow, "values">[],
): StatusProgress[] {
  return properties
    .filter((property) => property.type === "status")
    .map((property) => {
      const groups = new Map(property.options.map((option) => [option.id, option.group ?? "todo"]));
      const counts = { todo: 0, doing: 0, done: 0 };
      for (const row of rows) {
        const value = row.values[property.id];
        const group = typeof value === "string" ? (groups.get(value) ?? "todo") : "todo";
        counts[group] += 1;
      }
      const total = rows.length;
      return {
        propertyId: property.id,
        name: property.name,
        total,
        ...counts,
        percent: total === 0 ? 0 : Math.round((counts.done / total) * 100),
      };
    });
}

/** Uma barra só para a semana: soma as células de todas as colunas Status. Null sem coluna Status. */
export function computeOverallProgress(
  properties: readonly ReportProperty[],
  rows: readonly Pick<ReportRow, "values">[],
): (Omit<StatusProgress, "propertyId" | "name"> & { columns: number }) | null {
  const columns = computeStatusProgress(properties, rows);
  if (columns.length === 0) return null;
  const sum = (key: "total" | "todo" | "doing" | "done") => columns.reduce((acc, column) => acc + column[key], 0);
  const total = sum("total");
  const done = sum("done");
  return {
    columns: columns.length,
    total,
    todo: sum("todo"),
    doing: sum("doing"),
    done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
