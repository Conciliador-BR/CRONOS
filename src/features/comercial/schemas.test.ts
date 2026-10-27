import { describe, expect, it } from "vitest";
import { closeDealSchema, createLeadSchema, moveLeadSchema, renameStageSchema, salesGoalSchema } from "./schemas";

const base = { name: "Maria", source: "venda", temperature: "quente" };

describe("createLeadSchema", () => {
  it("normaliza campos opcionais vazios para null", () => {
    const parsed = createLeadSchema.parse({ ...base, companyName: "  ", email: "", ownerId: "" });
    expect(parsed).toMatchObject({ name: "Maria", companyName: null, email: null, ownerId: null, referrerName: null });
  });

  it("exige indicador quando a origem é indicação", () => {
    const result = createLeadSchema.safeParse({ ...base, source: "indicacao" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["referrerName"]);
    expect(createLeadSchema.safeParse({ ...base, source: "indicacao", referrerName: "João" }).success).toBe(true);
  });

  it("valida e-mail, nome e enums", () => {
    expect(createLeadSchema.safeParse({ ...base, email: "x@" }).success).toBe(false);
    expect(createLeadSchema.safeParse({ ...base, name: " " }).success).toBe(false);
    expect(createLeadSchema.safeParse({ ...base, temperature: "morno" }).success).toBe(false);
  });
});

describe("closeDealSchema", () => {
  it("converte o valor digitado em centavos", () => {
    expect(closeDealSchema.parse({ dealType: "consultoria_avancada", dealValue: "R$ 1.500,50" })).toEqual({
      dealType: "consultoria_avancada",
      dealValue: 150_050,
    });
  });
  it("recusa valor zero ou inválido", () => {
    expect(closeDealSchema.safeParse({ dealType: "somente_sistema", dealValue: "0" }).success).toBe(false);
    expect(closeDealSchema.safeParse({ dealType: "somente_sistema", dealValue: "abc" }).success).toBe(false);
  });
});

describe("moveLeadSchema", () => {
  it("aceita movimento simples", () => {
    const id = "6f1c2b9e-3c1a-4f7e-9a7d-2b8f0c1d2e3f";
    expect(moveLeadSchema.parse({ leadId: id, toStage: "follow_up", position: 10 })).toMatchObject({
      leadId: id,
      toStage: "follow_up",
      lostReason: null,
    });
    expect(moveLeadSchema.safeParse({ leadId: id, toStage: "x", position: 1 }).success).toBe(false);
  });
});

describe("salesGoalSchema", () => {
  it("aceita meta zero e mês válido", () => {
    const id = "6f1c2b9e-3c1a-4f7e-9a7d-2b8f0c1d2e3f";
    expect(salesGoalSchema.parse({ profileId: id, month: "2026-10", goal: "0" })).toEqual({
      profileId: id,
      month: "2026-10",
      goal: 0,
    });
    expect(salesGoalSchema.safeParse({ profileId: id, month: "2026-13", goal: "10" }).success).toBe(false);
  });
});

describe("renameStageSchema", () => {
  it("apara o nome e aceita até 40 caracteres", () => {
    expect(renameStageSchema.parse({ stage: "follow_up", label: "  Retorno  " })).toEqual({ stage: "follow_up", label: "Retorno" });
    expect(renameStageSchema.safeParse({ stage: "follow_up", label: "a".repeat(40) }).success).toBe(true);
  });

  it("recusa nome vazio, longo demais ou etapa inválida", () => {
    const empty = renameStageSchema.safeParse({ stage: "follow_up", label: "   " });
    expect(empty.success).toBe(false);
    expect(empty.error?.issues[0].message).toBe("Informe o nome da etapa.");
    expect(renameStageSchema.safeParse({ stage: "follow_up", label: "a".repeat(41) }).success).toBe(false);
    expect(renameStageSchema.safeParse({ stage: "nova_etapa", label: "Nova" }).success).toBe(false);
    expect(renameStageSchema.safeParse({ stage: "follow_up" }).success).toBe(false);
  });
});
