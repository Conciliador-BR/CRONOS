import { afterEach, describe, expect, it, vi } from "vitest";
import { randomId } from "./random-id";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("randomId", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("usa crypto.randomUUID quando existe", () => expect(randomId()).toMatch(UUID_V4));
  it("funciona sem crypto.randomUUID (http pela rede local)", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: (array: Uint8Array) => real.getRandomValues(array) });
    const ids = new Set([randomId(), randomId()]);
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(ids.size).toBe(2);
  });
});
