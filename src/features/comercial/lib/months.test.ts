import { describe, expect, it } from "vitest";
import {
  formatMonthLabel,
  isMonthKey,
  lastMonths,
  monthBounds,
  monthStartDate,
  parseMonthParam,
  shiftMonth,
  toMonthKey,
} from "./months";

describe("months", () => {
  it("valida chaves AAAA-MM", () => {
    expect(isMonthKey("2026-10")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("2026-1")).toBe(false);
    expect(isMonthKey(undefined)).toBe(false);
  });

  it("usa o fuso de São Paulo", () => {
    // 31/10 às 22h em São Paulo = 01/11 01h UTC.
    expect(toMonthKey("2026-11-01T01:00:00Z")).toBe("2026-10");
    expect(toMonthKey("2026-11-01T03:00:00Z")).toBe("2026-11");
  });

  it("lê o parâmetro da URL com fallback", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    expect(parseMonthParam("2026-03", now)).toBe("2026-03");
    expect(parseMonthParam(["2025-12"], now)).toBe("2025-12");
    expect(parseMonthParam("xx", now)).toBe("2026-10");
    expect(parseMonthParam(undefined, now)).toBe("2026-10");
  });

  it("desloca e lista meses atravessando o ano", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-05", -17)).toBe("2024-12");
    expect(lastMonths("2026-02", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("gera limites e datas do mês", () => {
    expect(monthStartDate("2026-10")).toBe("2026-10-01");
    expect(monthBounds("2026-12")).toEqual({
      start: "2026-12-01T00:00:00-03:00",
      end: "2027-01-01T00:00:00-03:00",
    });
  });

  it("formata rótulos em português", () => {
    expect(formatMonthLabel("2026-10")).toBe("outubro de 2026");
    expect(formatMonthLabel("2026-10", "short")).toBe("out/26");
  });
});
