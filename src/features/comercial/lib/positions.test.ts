import { describe, expect, it } from "vitest";
import { POSITION_STEP, positionAtIndex, positionBetween } from "./positions";

describe("positionBetween", () => {
  it("cobre lista vazia, início, fim e meio", () => {
    expect(positionBetween(undefined, undefined)).toBe(0);
    expect(positionBetween(undefined, 10)).toBe(10 - POSITION_STEP);
    expect(positionBetween(10, undefined)).toBe(10 + POSITION_STEP);
    expect(positionBetween(10, 20)).toBe(15);
  });
});

describe("positionAtIndex", () => {
  const list = [0, 1024, 2048];
  it("posiciona no índice pedido", () => {
    expect(positionAtIndex(list, 0)).toBe(-POSITION_STEP);
    expect(positionAtIndex(list, 1)).toBe(512);
    expect(positionAtIndex(list, 3)).toBe(2048 + POSITION_STEP);
  });
  it("limita índices fora da lista", () => {
    expect(positionAtIndex(list, 99)).toBe(2048 + POSITION_STEP);
    expect(positionAtIndex(list, -5)).toBe(-POSITION_STEP);
    expect(positionAtIndex([], 0)).toBe(0);
  });
});
