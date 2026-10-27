import { describe, expect, it } from "vitest";
import { moveItem, positionAfterLast, positionAtIndex, positionBetween, POSITION_STEP } from "./position";

describe("positionBetween", () => {
  it("usa o ponto médio entre vizinhos", () => {
    expect(positionBetween(1024, 2048)).toBe(1536);
  });
  it("trata pontas e lista vazia", () => {
    expect(positionBetween(undefined, undefined)).toBe(POSITION_STEP);
    expect(positionBetween(2048, undefined)).toBe(2048 + POSITION_STEP);
    expect(positionBetween(undefined, 1024)).toBe(0);
    expect(positionBetween(null, 10)).toBe(10 - POSITION_STEP);
  });
});

describe("positionAtIndex", () => {
  const positions = [1024, 2048, 3072];
  it("insere no início, meio e fim", () => {
    expect(positionAtIndex(positions, 0)).toBe(0);
    expect(positionAtIndex(positions, 1)).toBe(1536);
    expect(positionAtIndex(positions, 3)).toBe(3072 + POSITION_STEP);
  });
  it("limita índices fora da faixa", () => {
    expect(positionAtIndex(positions, 99)).toBe(3072 + POSITION_STEP);
    expect(positionAtIndex(positions, -5)).toBe(0);
    expect(positionAtIndex([], 0)).toBe(POSITION_STEP);
  });
  it("mantém a ordem após muitas inserções no mesmo lugar", () => {
    let low = 0;
    const high = 1;
    for (let i = 0; i < 40; i++) {
      const mid = positionBetween(low, high);
      expect(mid).toBeGreaterThan(low);
      expect(mid).toBeLessThan(high);
      low = mid;
    }
  });
});

describe("positionAfterLast e moveItem", () => {
  it("vai para depois do maior", () => {
    expect(positionAfterLast([5, 3000, 10])).toBe(3000 + POSITION_STEP);
    expect(positionAfterLast([])).toBe(POSITION_STEP);
  });
  it("move sem mutar", () => {
    const list = ["a", "b", "c", "d"];
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(list).toEqual(["a", "b", "c", "d"]);
  });
});
