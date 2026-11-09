import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { overLimit } = await import("./rate-limit");

describe("overLimit", () => {
  it("libera 10 pedidos por minuto e bloqueia o 11º; a janela expira", () => {
    const t = 1_000_000;
    for (let i = 0; i < 10; i++) expect(overLimit("u1", t + i)).toBe(false);
    expect(overLimit("u1", t + 10)).toBe(true);
    expect(overLimit("u2", t + 10)).toBe(false);
    expect(overLimit("u1", t + 70_000)).toBe(false);
  });

  it("aceita limite e janela próprios (login: 5 em 15 min)", () => {
    const t = 2_000_000;
    const win = 15 * 60_000;
    for (let i = 0; i < 5; i++) expect(overLimit("login:a@b.c", t + i, 5, win)).toBe(false);
    expect(overLimit("login:a@b.c", t + 10, 5, win)).toBe(true);
    expect(overLimit("login:a@b.c", t + win + 10, 5, win)).toBe(false);
  });
});
