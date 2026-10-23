import { describe, expect, it } from "vitest";
import { parsePeriodParam, periodStart } from "./periods";

describe("periods", () => {
  it("lê o parâmetro com padrão de 90 dias", () => {
    expect(parsePeriodParam("30d")).toBe("30d");
    expect(parsePeriodParam(["tudo"])).toBe("tudo");
    expect(parsePeriodParam("abc")).toBe("90d");
    expect(parsePeriodParam(undefined)).toBe("90d");
  });

  it("calcula o início do período", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    expect(periodStart("30d", now)).toBe("2026-09-23T12:00:00.000Z");
    expect(periodStart("12m", now)).toBe("2025-10-23T12:00:00.000Z");
    expect(periodStart("tudo", now)).toBeUndefined();
  });
});
