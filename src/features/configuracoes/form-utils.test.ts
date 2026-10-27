import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  currentMonthStart,
  isValidCpf,
  issuesToFieldErrors,
  parsePercent,
  readRows,
  sanitizeFileName,
  text,
} from "./form-utils";

describe("text", () => {
  it("apara e devolve vazio para ausentes", () => {
    const fd = new FormData();
    fd.set("a", "  oi ");
    expect(text(fd, "a")).toBe("oi");
    expect(text(fd, "b")).toBe("");
  });
});

describe("readRows", () => {
  it("lê linhas por índice, em ordem, e descarta linhas vazias", () => {
    const fd = new FormData();
    fd.set("ecs.10.acquirer", "Stone");
    fd.set("ecs.10.ecNumber", "123");
    fd.set("ecs.2.id", "abc");
    fd.set("ecs.2.acquirer", " Cielo ");
    fd.set("ecs.2.ecNumber", "999");
    fd.set("ecs.3.acquirer", "");
    fd.set("ecs.3.ecNumber", " ");
    fd.set("ecs.4.hack", "x");
    fd.set("banks.0.bank", "Itaú");
    expect(readRows(fd, "ecs", ["acquirer", "ecNumber"] as const)).toEqual([
      { id: "abc", acquirer: "Cielo", ecNumber: "999" },
      { id: undefined, acquirer: "Stone", ecNumber: "123" },
    ]);
  });
  it("ignora linha só com campos não significativos preenchidos", () => {
    const fd = new FormData();
    fd.set("banks.0.bank", "");
    fd.set("banks.0.accountType", "corrente");
    expect(readRows(fd, "banks", ["bank", "accountType"] as const, ["bank"])).toEqual([]);
  });
});

describe("issuesToFieldErrors", () => {
  it("usa o caminho com ponto", () => {
    const schema = z.object({ rows: z.array(z.object({ a: z.string().min(1, { error: "obrigatório" }) })) });
    const parsed = schema.safeParse({ rows: [{ a: "x" }, { a: "" }] });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(issuesToFieldErrors(parsed.error)).toEqual({ "rows.1.a": ["obrigatório"] });
  });
});

describe("isValidCpf", () => {
  it("aceita CPF válido com ou sem máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });
  it("recusa dígito errado, repetidos e tamanho errado", () => {
    expect(isValidCpf("52998224724")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
});

describe("parsePercent", () => {
  it("aceita vírgula e ponto", () => {
    expect(parsePercent("5")).toBe(5);
    expect(parsePercent("5,5")).toBe(5.5);
    expect(parsePercent("12.25%")).toBe(12.25);
  });
  it("recusa inválidos", () => {
    expect(parsePercent("")).toBeNull();
    expect(parsePercent("abc")).toBeNull();
    expect(parsePercent("1,234")).toBeNull();
  });
});

describe("currentMonthStart", () => {
  it("usa o fuso de São Paulo", () => {
    // 01/11 02:00 UTC ainda é 31/10 em São Paulo (UTC-3).
    expect(currentMonthStart(new Date("2026-11-01T02:00:00Z"))).toBe("2026-10-01");
    expect(currentMonthStart(new Date("2026-11-01T04:00:00Z"))).toBe("2026-11-01");
  });
});

describe("sanitizeFileName", () => {
  it("remove acentos, extensão e caracteres especiais", () => {
    expect(sanitizeFileName("Contrato Social (versão 2).PDF")).toBe("contrato-social-versao-2");
    expect(sanitizeFileName("../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeFileName("###.pdf")).toBe("documento");
  });
});
