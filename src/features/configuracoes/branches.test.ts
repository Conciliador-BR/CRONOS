import { describe, expect, it } from "vitest";
import { groupBranches } from "./branches";

describe("groupBranches", () => {
  it("põe as filiais sob a matriz e mantém a ordem", () => {
    const groups = groupBranches([
      { id: "a", parentId: null },
      { id: "b", parentId: "c" },
      { id: "c", parentId: null },
      { id: "d", parentId: "a" },
      { id: "e", parentId: "c" },
    ]);
    expect(groups.map((g) => [g.company.id, g.branches.map((b) => b.id), g.orphan])).toEqual([
      ["a", ["d"], false],
      ["c", ["b", "e"], false],
    ]);
  });
  it("filial sem a matriz na lista aparece sozinha, marcada", () => {
    const groups = groupBranches([{ id: "x", parentId: "fora" }]);
    expect(groups).toEqual([{ company: { id: "x", parentId: "fora" }, branches: [], orphan: true }]);
  });
});
