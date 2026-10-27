import { describe, expect, it } from "vitest";
import { dateToDayKey, dayKeyToDate, formatTime, isDayKey, wallParts, wallToIso } from "./tz";

describe("fuso de Brasília", () => {
  it("converte UTC para horário de parede", () => {
    expect(wallParts("2026-10-23T02:30:00Z")).toEqual({ dayKey: "2026-10-22", time: "23:30", minutes: 1410 });
    expect(wallParts("2026-10-23T15:00:00Z").time).toBe("12:00");
  });
  it("converte horário de parede para ISO UTC", () => {
    expect(wallToIso("2026-10-23", "14:00")).toBe("2026-10-23T17:00:00.000Z");
    expect(wallToIso("2026-12-31", "22:30")).toBe("2027-01-01T01:30:00.000Z");
    expect(() => wallToIso("2026-02-30", "10:00")).toThrow();
  });
  it("ida e volta", () => {
    const iso = wallToIso("2026-07-01", "08:15");
    expect(wallParts(iso)).toMatchObject({ dayKey: "2026-07-01", time: "08:15" });
    expect(formatTime(iso)).toBe("08:15");
  });
  it("valida e converte chaves de dia", () => {
    expect(isDayKey("2026-10-23")).toBe(true);
    expect(isDayKey("2026-13-01")).toBe(false);
    expect(dateToDayKey(dayKeyToDate("2026-03-09"))).toBe("2026-03-09");
  });
});
