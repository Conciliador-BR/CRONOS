import { describe, expect, it } from "vitest";
import {
  activeReminders,
  DAY_MS,
  describeReminder,
  dismissalExpiry,
  HOUR_MS,
  MINUTE_MS,
  nextChangeIn,
  parseDismissed,
  pendingToasts,
  reminderKey,
  reminderThreshold,
  type Reminder,
} from "./reminders";

// 26/10/2026 10:00 em Brasília (13:00 UTC).
const NOW = Date.parse("2026-10-26T13:00:00Z");
const at = (ms: number) => new Date(NOW + ms).toISOString();
const meeting = (id: string, startsIn: number, extra: Partial<Reminder> = {}): Reminder => ({
  id,
  kind: "reuniao",
  title: `Reunião ${id}`,
  startsAt: at(startsIn),
  allDay: false,
  href: "/operacional/agenda",
  ...extra,
});

describe("reminderThreshold", () => {
  it("1 hora quando começa em até 60 min", () => {
    expect(reminderThreshold(meeting("a", 30 * MINUTE_MS), NOW)).toBe("hour");
    expect(reminderThreshold(meeting("a", HOUR_MS), NOW)).toBe("hour");
  });
  it("1 dia quando começa entre 1 h e 24 h", () => {
    expect(reminderThreshold(meeting("a", HOUR_MS + 1), NOW)).toBe("day");
    expect(reminderThreshold(meeting("a", DAY_MS), NOW)).toBe("day");
  });
  it("nada antes de 24 h nem depois do início", () => {
    expect(reminderThreshold(meeting("a", DAY_MS + 1), NOW)).toBeNull();
    expect(reminderThreshold(meeting("a", 0), NOW)).toBeNull();
    expect(reminderThreshold(meeting("a", -MINUTE_MS), NOW)).toBeNull();
    expect(reminderThreshold(meeting("a", 0, { startsAt: "lixo" }), NOW)).toBeNull();
  });
  it("dia inteiro só tem o aviso de 1 dia", () => {
    expect(reminderThreshold(meeting("a", 30 * MINUTE_MS, { allDay: true }), NOW)).toBe("day");
  });
});

describe("activeReminders e pendingToasts", () => {
  const list = [meeting("tarde", 5 * HOUR_MS), meeting("logo", 20 * MINUTE_MS), meeting("longe", 2 * DAY_MS)];

  it("filtra pelos limiares e ordena pelo início", () => {
    const active = activeReminders(list, NOW);
    expect(active.map((item) => [item.reminder.id, item.threshold])).toEqual([
      ["logo", "hour"],
      ["tarde", "day"],
    ]);
  });

  it("esconde os dispensados; o limiar seguinte avisa de novo", () => {
    const dayKey = reminderKey(list[1], "day");
    const hourKey = reminderKey(list[1], "hour");
    const dismissed = new Set([hourKey]);
    expect(pendingToasts(list, NOW, dismissed).map((item) => item.reminder.id)).toEqual(["tarde"]);
    // Uma hora antes: a dispensa do aviso de 1 dia não cala o de 1 hora.
    expect(pendingToasts(list, NOW, new Set([dayKey])).map((item) => item.key)).toContain(hourKey);
  });

  it("reuniões vêm antes de tarefas nos avisos", () => {
    const task: Reminder = { ...meeting("t", 10 * MINUTE_MS), kind: "tarefa" };
    expect(pendingToasts([task, meeting("m", 3 * HOUR_MS)], NOW, new Set()).map((item) => item.reminder.kind)).toEqual([
      "reuniao",
      "tarefa",
    ]);
  });

  it("a chave muda se a reunião for remarcada", () => {
    expect(reminderKey(meeting("a", HOUR_MS), "hour")).not.toBe(reminderKey(meeting("a", 2 * HOUR_MS), "hour"));
  });
});

describe("nextChangeIn", () => {
  it("devolve o próximo limiar de qualquer lembrete", () => {
    expect(nextChangeIn([meeting("a", 3 * HOUR_MS)], NOW)).toBe(2 * HOUR_MS);
    expect(nextChangeIn([meeting("a", 30 * MINUTE_MS)], NOW)).toBe(30 * MINUTE_MS);
    expect(nextChangeIn([meeting("a", DAY_MS + 10 * MINUTE_MS)], NOW)).toBe(10 * MINUTE_MS);
    expect(nextChangeIn([meeting("a", -MINUTE_MS)], NOW)).toBeNull();
    expect(nextChangeIn([], NOW)).toBeNull();
  });
});

describe("describeReminder", () => {
  it("amanhã e hoje com horário de Brasília", () => {
    // 27/10 14:00 em Brasília = 17:00 UTC.
    const tomorrow = meeting("a", 0, { startsAt: "2026-10-27T17:00:00Z" });
    expect(describeReminder(tomorrow, "day", NOW).text).toBe("Reunião amanhã às 14:00");
    const today = meeting("b", 0, { startsAt: "2026-10-26T20:30:00Z" });
    expect(describeReminder(today, "day", NOW).text).toBe("Reunião hoje às 17:30");
  });
  it("tempo relativo no último limiar", () => {
    expect(describeReminder(meeting("a", HOUR_MS), "hour", NOW).text).toBe("Reunião em 1 hora");
    expect(describeReminder(meeting("a", 45 * MINUTE_MS), "hour", NOW).text).toBe("Reunião em 45 minutos");
  });
  it("tarefa e dia inteiro", () => {
    const task: Reminder = { ...meeting("t", 0, { startsAt: "2026-10-26T21:00:00Z" }), kind: "tarefa" };
    expect(describeReminder(task, "day", NOW).text).toBe("Tarefa vence hoje às 18:00");
    const allDay = meeting("d", 0, { startsAt: "2026-10-27T03:00:00Z", allDay: true });
    expect(describeReminder(allDay, "day", NOW).text).toBe("Reunião amanhã (dia inteiro)");
  });
});

describe("parseDismissed", () => {
  it("aceita só números futuros e ignora lixo", () => {
    expect(parseDismissed(JSON.stringify({ a: NOW + 1, b: NOW - 1, c: "x" }), NOW)).toEqual({ a: NOW + 1 });
    expect(parseDismissed("não é json", NOW)).toEqual({});
    expect(parseDismissed("[1,2]", NOW)).toEqual({});
    expect(parseDismissed(null, NOW)).toEqual({});
  });
  it("dispensa expira um dia depois do início", () => {
    expect(dismissalExpiry(meeting("a", HOUR_MS))).toBe(NOW + HOUR_MS + DAY_MS);
  });
});
