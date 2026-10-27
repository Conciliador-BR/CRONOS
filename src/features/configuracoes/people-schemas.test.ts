import { describe, expect, it } from "vitest";
import { employeeCreateSchema, employeeUpdateSchema, goalField, readEmployeeForm, teamSchema } from "./people-schemas";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("employeeCreateSchema", () => {
  const base = {
    fullName: " Ana Souza ",
    email: "ANA@Empresa.com",
    password: "segredo123",
    role: "funcionario",
    commissionRate: "5,5",
    goal: "15.000,00",
  };
  it("normaliza e converte comissão e meta", () => {
    const parsed = employeeCreateSchema.safeParse(readEmployeeForm(form(base)));
    expect(parsed.success).toBe(true);
    if (parsed.success)
      expect(parsed.data).toMatchObject({
        fullName: "Ana Souza",
        email: "ana@empresa.com",
        commissionRate: 5.5,
        goal: 1_500_000,
        teamId: null,
        phone: null,
      });
  });
  it("recusa senha curta, papel inválido e comissão acima de 100", () => {
    const parsed = employeeCreateSchema.safeParse(
      readEmployeeForm(form({ ...base, password: "123", role: "dono", commissionRate: "120" })),
    );
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const paths = parsed.error.issues.map((i) => i.path.join("."));
      expect(paths).toEqual(expect.arrayContaining(["password", "role", "commissionRate"]));
    }
  });
  it("comissão vazia vale 0 e meta vazia é null", () => {
    const parsed = employeeUpdateSchema.safeParse(
      readEmployeeForm(form({ fullName: "B", role: "gestor", commissionRate: "", goal: "" })),
    );
    expect(parsed.success && parsed.data).toMatchObject({ commissionRate: 0, goal: null });
  });
});

describe("goalField e teamSchema", () => {
  it("meta inválida gera erro", () => {
    expect(goalField.safeParse("abc").success).toBe(false);
    expect(goalField.safeParse("R$ 1.234,56").data).toBe(123456);
  });
  it("nome do time obrigatório", () => {
    expect(teamSchema.safeParse({ name: "  " }).success).toBe(false);
    expect(teamSchema.safeParse({ name: " Vendas " }).data).toEqual({ name: "Vendas" });
  });
});
