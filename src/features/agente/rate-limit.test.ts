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
});
