import { describe, expect, it } from "vitest";
import { DEFAULT_STATUS_OPTIONS } from "./options";
import { computeOverallProgress, computePeopleProgress, computeStatusProgress } from "./progress";
import type { ReportProperty, ReportRow } from "./types";

const status: ReportProperty = { id: "p1", name: "Status", type: "status", options: DEFAULT_STATUS_OPTIONS, position: 1, width: null };
const text: ReportProperty = { id: "p2", name: "Nota", type: "text", options: [], position: 2, width: null };
const row = (value?: string): { values: Record<string, string> } => ({ values: value ? { p1: value } : {} });

describe("computeStatusProgress", () => {
  it("10 concluídos de 20 = 50%", () => {
    const rows = [...Array(10).fill(row("concluido")), ...Array(5).fill(row("em-andamento")), ...Array(5).fill(row())];
    expect(computeStatusProgress([text, status], rows)).toEqual([
      { propertyId: "p1", name: "Status", total: 20, todo: 5, doing: 5, done: 10, percent: 50 },
    ]);
  });
  it("opção removida conta como a fazer", () => {
    const [result] = computeStatusProgress([status], [row("apagada"), row("concluido")]);
    expect(result).toMatchObject({ todo: 1, done: 1, percent: 50 });
  });
  it("sem linhas = 0%", () => {
    expect(computeStatusProgress([status], [])[0]).toMatchObject({ total: 0, percent: 0 });
  });
  it("por pessoa: cada Status da linha é uma tarefa, ranking por %", () => {
    const status2: ReportProperty = { ...status, id: "p3", name: "Pix" };
    const person: ReportProperty = { id: "pp", name: "Responsável", type: "person", options: [], position: 4, width: null };
    const rows: Pick<ReportRow, "values">[] = [
      { values: { pp: ["ana"], p1: "concluido", p3: "concluido" } },
      { values: { pp: ["ana", "bia"], p1: "concluido", p3: "em-andamento" } },
      { values: { pp: ["bia"] } },
      { values: { p1: "concluido" } },
    ];
    expect(computePeopleProgress([status, status2, person], rows)).toEqual([
      { personId: "ana", rows: 2, total: 4, todo: 0, doing: 1, done: 3, percent: 75 },
      { personId: "bia", rows: 2, total: 4, todo: 2, doing: 1, done: 1, percent: 25 },
    ]);
    expect(computePeopleProgress([status], rows)).toEqual([]);
  });
  it("barra única soma todas as colunas Status", () => {
    const pix: ReportProperty = { ...status, id: "p3", name: "Pix" };
    const rows: Pick<ReportRow, "values">[] = [{ values: { p1: "concluido", p3: "concluido" } }, { values: { p1: "em-andamento" } }];
    expect(computeOverallProgress([status, pix, text], rows)).toEqual({ columns: 2, total: 4, todo: 1, doing: 1, done: 2, percent: 50 });
    expect(computeOverallProgress([text], rows)).toBeNull();
  });
  it("arredonda", () => {
    const [result] = computeStatusProgress([status], [row("concluido"), row(), row()]);
    expect(result.percent).toBe(33);
  });
});
