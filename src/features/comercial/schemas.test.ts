import { describe, expect, it } from "vitest";
import {
  closeDealSchema,
  createLeadSchema,
  createStageSchema,
  deleteStageSchema,
  moveLeadSchema,
  moveStageSchema,
  renameStageSchema,
  salesGoalSchema,
} from "./schemas";

const STAGE_ID = "0b6f7f0e-8d1a-4c2b-9e3f-1a2b3c4d5e6f";
const OTHER_STAGE_ID = "1c7a8b9d-2e3f-4a5b-8c6d-7e8f9a0b1c2d";

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
    expect(moveLeadSchema.parse({ leadId: id, toStageId: STAGE_ID, position: 10 })).toMatchObject({
      leadId: id,
      toStageId: STAGE_ID,
      lostReason: null,
    });
    expect(moveLeadSchema.safeParse({ leadId: id, toStageId: "follow_up", position: 1 }).success).toBe(false);
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
    expect(renameStageSchema.parse({ id: STAGE_ID, label: "  Retorno  " })).toEqual({ id: STAGE_ID, label: "Retorno" });
    expect(renameStageSchema.safeParse({ id: STAGE_ID, label: "a".repeat(40) }).success).toBe(true);
  });

  it("recusa nome vazio, longo demais ou etapa inválida", () => {
    const empty = renameStageSchema.safeParse({ id: STAGE_ID, label: "   " });
    expect(empty.success).toBe(false);
    expect(empty.error?.issues[0].message).toBe("Informe o nome da etapa.");
    expect(renameStageSchema.safeParse({ id: STAGE_ID, label: "a".repeat(41) }).success).toBe(false);
    expect(renameStageSchema.safeParse({ id: "follow_up", label: "Nova" }).success).toBe(false);
    expect(renameStageSchema.safeParse({ id: STAGE_ID }).success).toBe(false);
  });
});

describe("schemas de colunas", () => {
  it("cria com nome aparado e afterId opcional", () => {
    expect(createStageSchema.parse({ label: " Proposta " })).toEqual({ label: "Proposta" });
    expect(createStageSchema.safeParse({ label: "Proposta", afterId: "x" }).success).toBe(false);
  });

  it("move só com posição finita", () => {
    expect(moveStageSchema.safeParse({ id: STAGE_ID, position: 1.5 }).success).toBe(true);
    expect(moveStageSchema.safeParse({ id: STAGE_ID, position: Number.POSITIVE_INFINITY }).success).toBe(false);
  });

  it("exclui com destino opcional, nunca a própria coluna", () => {
    expect(deleteStageSchema.parse({ id: STAGE_ID, moveLeadsTo: "" })).toEqual({ id: STAGE_ID, moveLeadsTo: null });
    expect(deleteStageSchema.parse({ id: STAGE_ID, moveLeadsTo: OTHER_STAGE_ID }).moveLeadsTo).toBe(OTHER_STAGE_ID);
    const same = deleteStageSchema.safeParse({ id: STAGE_ID, moveLeadsTo: STAGE_ID });
    expect(same.success).toBe(false);
    expect(same.error?.issues[0].path).toEqual(["moveLeadsTo"]);
    expect(deleteStageSchema.safeParse({ id: STAGE_ID, moveLeadsTo: "nope" }).success).toBe(false);
  });
});
