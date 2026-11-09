import { describe, expect, it } from "vitest";
import { DEFAULT_STATUS_OPTIONS } from "./options";
import { cellValueSchema, readCellValue, toEmptyAsNull } from "./values";
import type { PropertyOption } from "./types";

const opts: PropertyOption[] = [
  { id: "a", name: "A", color: "#2563eb" },
  { id: "b", name: "B", color: "#22c55e" },
];
const ok = (type: Parameters<typeof cellValueSchema>[0], value: unknown, o = opts) =>
  cellValueSchema(type, o).safeParse(value);

describe("cellValueSchema", () => {
  it("aceita null para limpar", () => {
    for (const type of ["text", "number", "checkbox", "date", "url", "email", "phone", "select", "status", "multi_select", "person"] as const) {
      expect(ok(type, null).success).toBe(true);
    }
  });
  it("text: trim, vazio vira null e limite", () => {
    expect(ok("text", "  oi ").data).toBe("oi");
    expect(ok("text", "   ").data).toBeNull();
    expect(ok("text", "x".repeat(2001)).success).toBe(false);
  });
  it("number finito", () => {
    expect(ok("number", 3.5).success).toBe(true);
    expect(ok("number", Number.NaN).success).toBe(false);
    expect(ok("number", Infinity).success).toBe(false);
    expect(ok("number", "3").success).toBe(false);
  });
  it("date válida", () => {
    expect(ok("date", "2026-02-28").success).toBe(true);
    expect(ok("date", "2026-02-30").success).toBe(false);
    expect(ok("date", "28/02/2026").success).toBe(false);
  });
  it("url só http/https", () => {
    expect(ok("url", "https://exemplo.com/x").success).toBe(true);
    expect(ok("url", "javascript:alert(1)").success).toBe(false);
    expect(ok("url", "ftp://x.com").success).toBe(false);
  });
  it("email e telefone", () => {
    expect(ok("email", "a@b.com").success).toBe(true);
    expect(ok("email", "nao-email").success).toBe(false);
    expect(ok("phone", "+55 (11) 99999-0000").success).toBe(true);
    expect(ok("phone", "abc").success).toBe(false);
    expect(ok("phone", "1".repeat(31)).success).toBe(false);
  });
  it("select/status exigem opção existente", () => {
    expect(ok("select", "a").success).toBe(true);
    expect(ok("select", "zzz").success).toBe(false);
    expect(ok("status", "concluido", DEFAULT_STATUS_OPTIONS).success).toBe(true);
  });
  it("multi_select: únicos, existentes e limite", () => {
    expect(ok("multi_select", ["a", "b"]).success).toBe(true);
    expect(ok("multi_select", ["a", "a"]).success).toBe(false);
    expect(ok("multi_select", ["a", "x"]).success).toBe(false);
  });
  it("person: uuids únicos, máx. 10", () => {
    const id = "6f1c2a3e-1b2c-4d5e-8f90-1234567890ab";
    expect(ok("person", [id]).success).toBe(true);
    expect(ok("person", [id, id]).success).toBe(false);
    expect(ok("person", ["x"]).success).toBe(false);
  });
  it("rejeita company e calculadas", () => {
    for (const type of ["company", "id", "created_time", "last_edited_time", "created_by", "last_edited_by"] as const) {
      expect(ok(type, "x").success).toBe(false);
      expect(ok(type, null).success).toBe(false);
    }
  });
});

describe("readCellValue", () => {
  it("valor corrompido vira null", () => {
    expect(readCellValue("number", "7", opts)).toBeNull();
    expect(readCellValue("date", "2026-02-30", opts)).toBeNull();
    expect(readCellValue("checkbox", 1, opts)).toBeNull();
    expect(readCellValue("multi_select", [1], opts)).toBeNull();
    expect(readCellValue("company", "x", opts)).toBeNull();
  });
  it("opção apagada é descartada", () => {
    expect(readCellValue("select", "apagada", opts)).toBeNull();
    expect(readCellValue("multi_select", ["a", "apagada"], opts)).toEqual(["a"]);
    expect(readCellValue("multi_select", ["apagada"], opts)).toBeNull();
  });
  it("valores válidos passam", () => {
    expect(readCellValue("text", "oi", opts)).toBe("oi");
    expect(readCellValue("number", 0, opts)).toBe(0);
    expect(readCellValue("checkbox", false, opts)).toBe(false);
  });
});

describe("toEmptyAsNull", () => {
  it("vazio vira null", () => {
    expect(toEmptyAsNull("  ")).toBeNull();
    expect(toEmptyAsNull(" a ")).toBe("a");
  });
});
