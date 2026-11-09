import { describe, expect, it } from "vitest";
import { branchLabel, branchOrder } from "./company-label";

describe("branchOrder/branchLabel", () => {
  it("matriz", () => expect(branchLabel(branchOrder(null, null, "12.345.678/0001-90"))).toBe("Matriz"));
  it("filial com número do cadastro", () => expect(branchLabel(branchOrder("m", 4, "12345678000190"))).toBe("Filial 04"));
  it("filial sem número usa o CNPJ", () => expect(branchLabel(branchOrder("m", null, "12.345.678/0003-10"))).toBe("Filial 03"));
  it("filial sem número e CNPJ /0001", () => expect(branchLabel(branchOrder("m", null, "12345678000190"))).toBe("Filial"));
});
