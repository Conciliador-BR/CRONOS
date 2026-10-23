import { describe, expect, it } from "vitest";
import { wallToIso } from "../shared/tz";
import { eventsOnDay, getRange, getTitle, getVisibleDays, layoutDay, overlapsDay, parseDay, parseView, shiftDay } from "./calendar";

const ev = (id: string, day: string, start: string, end: string, allDay = false) => ({
  id,
  startsAt: wallToIso(day, start),
  endsAt: wallToIso(day, end),
  allDay,
});

describe("parâmetros", () => {
  it("valida visão e dia", () => {
    expect(parseView("mes")).toBe("month");
    expect(parseView("dia")).toBe("day");
    expect(parseView("x")).toBe("week");
    expect(parseView(undefined)).toBe("week");
    expect(parseDay("2026-10-23", "2000-01-01")).toBe("2026-10-23");
    expect(parseDay("23/10/2026", "2000-01-01")).toBe("2000-01-01");
  });
});

describe("dias visíveis e intervalo", () => {
  it("semana de domingo a sábado", () => {
    const days = getVisibleDays("week", "2026-10-23");
    expect(days[0]).toBe("2026-10-18");
    expect(days).toHaveLength(7);
  });
  it("mês em semanas completas", () => {
    const days = getVisibleDays("month", "2026-10-15");
    expect(days[0]).toBe("2026-09-27");
    expect(days.at(-1)).toBe("2026-10-31");
    expect(days.length % 7).toBe(0);
  });
  it("intervalo em UTC com fim exclusivo", () => {
    expect(getRange(["2026-10-23"])).toEqual({ from: "2026-10-23T03:00:00.000Z", to: "2026-10-24T03:00:00.000Z" });
  });
  it("navega por mês, semana e dia", () => {
    expect(shiftDay("month", "2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftDay("week", "2026-10-23", -1)).toBe("2026-10-16");
    expect(shiftDay("day", "2026-12-31", 1)).toBe("2027-01-01");
  });
  it("títulos em pt-BR", () => {
    expect(getTitle("month", "2026-10-23")).toBe("outubro de 2026");
    expect(getTitle("day", "2026-10-23")).toBe("sexta-feira, 23 de outubro de 2026");
    expect(getTitle("week", "2026-10-01")).toBe("set – out de 2026");
  });
});

describe("eventos no dia", () => {
  it("considera fim exclusivo e eventos que atravessam a meia-noite", () => {
    const allDay = { id: "a", startsAt: wallToIso("2026-10-23"), endsAt: wallToIso("2026-10-24"), allDay: true };
    expect(overlapsDay(allDay, "2026-10-23")).toBe(true);
    expect(overlapsDay(allDay, "2026-10-24")).toBe(false);
    const night = { id: "n", startsAt: wallToIso("2026-10-23", "22:00"), endsAt: wallToIso("2026-10-24", "02:00") };
    expect(overlapsDay(night, "2026-10-24")).toBe(true);
    const [first] = layoutDay([night], "2026-10-24");
    expect(first).toMatchObject({ top: 0, height: 120 });
  });
  it("ordena dia inteiro primeiro", () => {
    const list = eventsOnDay(
      [ev("t", "2026-10-23", "09:00", "10:00"), { ...ev("d", "2026-10-23", "00:00", "00:00"), endsAt: wallToIso("2026-10-24"), allDay: true }],
      "2026-10-23",
    );
    expect(list.map((e) => e.id)).toEqual(["d", "t"]);
  });
});

describe("layoutDay", () => {
  it("coloca eventos sobrepostos lado a lado", () => {
    const out = layoutDay(
      [ev("a", "2026-10-23", "09:00", "10:00"), ev("b", "2026-10-23", "09:30", "11:00"), ev("c", "2026-10-23", "10:00", "10:30"), ev("d", "2026-10-23", "14:00", "15:00")],
      "2026-10-23",
    );
    const byId = Object.fromEntries(out.map((p) => [p.event.id, p]));
    expect(byId.a).toMatchObject({ top: 540, height: 60, column: 0, columns: 2 });
    expect(byId.b).toMatchObject({ column: 1, columns: 2 });
    expect(byId.c).toMatchObject({ column: 0, columns: 2 });
    expect(byId.d).toMatchObject({ column: 0, columns: 1 });
  });
  it("garante altura mínima", () => {
    const [only] = layoutDay([ev("z", "2026-10-23", "09:00", "09:00")], "2026-10-23");
    expect(only.height).toBe(20);
  });
});
