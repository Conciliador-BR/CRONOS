import { describe, expect, it } from "vitest";
import { formatDue, getDueStatus } from "./due";

const now = new Date("2026-10-23T12:00:00Z");

describe("getDueStatus", () => {
  it("prioriza concluída", () => {
    expect(getDueStatus("2026-01-01T00:00:00Z", true, now)).toBe("completed");
  });
  it("classifica atraso e proximidade", () => {
    expect(getDueStatus("2026-10-23T11:59:00Z", false, now)).toBe("overdue");
    expect(getDueStatus("2026-10-24T11:00:00Z", false, now)).toBe("soon");
    expect(getDueStatus("2026-10-30T11:00:00Z", false, now)).toBe("upcoming");
  });
});

describe("formatDue", () => {
  it("mostra hora só quando definida", () => {
    expect(formatDue("2026-10-25T03:00:00Z", now)).toMatch(/^25 de out/);
    expect(formatDue("2026-10-25T03:00:00Z", now)).not.toContain(":");
    expect(formatDue("2026-10-25T17:30:00Z", now)).toContain("14:30");
  });
  it("inclui o ano quando é outro ano", () => {
    expect(formatDue("2027-01-05T15:00:00Z", now)).toContain("2027");
  });
});
