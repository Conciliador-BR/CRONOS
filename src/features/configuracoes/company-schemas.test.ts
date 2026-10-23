import { describe, expect, it } from "vitest";
import { clientSchema, companySchema, readCompanyForm } from "./company-schemas";
import { issuesToFieldErrors } from "./form-utils";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const valid = {
  cnpj: "11.222.333/0001-81",
  legalName: " Mercado Exemplo Ltda ",
  tradeName: "",
  marketName: "Super Exemplo",
  cep: "01310-100",
  uf: "sp",
  clientMode: "none",
};

describe("companySchema", () => {
  it("normaliza CNPJ, CEP, UF e campos vazios", () => {
    const parsed = companySchema.safeParse(readCompanyForm(form(valid)));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toMatchObject({
      cnpj: "11222333000181",
      legalName: "Mercado Exemplo Ltda",
      tradeName: null,
      cep: "01310100",
      uf: "SP",
      clientId: null,
      newClient: null,
      ecs: [],
      banks: [],
    });
  });

  it("recusa CNPJ com dígito errado e UF ausente", () => {
    const parsed = companySchema.safeParse(readCompanyForm(form({ ...valid, cnpj: "11222333000182", uf: "" })));
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const errors = issuesToFieldErrors(parsed.error);
    expect(errors.cnpj?.[0]).toMatch(/inválido/);
    expect(errors.uf).toBeDefined();
  });

  it("valida linhas de EC e contas e aponta o índice do erro", () => {
    const parsed = companySchema.safeParse(
      readCompanyForm(
        form({
          ...valid,
          "ecs.0.acquirer": "Cielo",
          "ecs.0.ecNumber": "",
          "banks.0.bank": "Itaú",
          "banks.0.agency": "0001",
          "banks.0.account": "12345-6",
          "banks.0.accountType": "salario",
        }),
      ),
    );
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const errors = issuesToFieldErrors(parsed.error);
    expect(Object.keys(errors).sort()).toEqual(["banks.0.accountType", "ecs.0.ecNumber"]);
  });

  it("exige cliente existente válido ou dados do novo cliente", () => {
    const existing = companySchema.safeParse(readCompanyForm(form({ ...valid, clientMode: "existing" })));
    expect(existing.success).toBe(false);
    if (!existing.success) expect(issuesToFieldErrors(existing.error).clientId).toBeDefined();

    const created = companySchema.safeParse(
      readCompanyForm(form({ ...valid, clientMode: "new", "client.name": "Ana", "client.document": "529.982.247-25" })),
    );
    expect(created.success).toBe(true);
    if (created.success) expect(created.data.newClient).toMatchObject({ name: "Ana", document: "52998224725" });

    const bad = companySchema.safeParse(readCompanyForm(form({ ...valid, clientMode: "new", "client.name": "" })));
    expect(bad.success).toBe(false);
    if (!bad.success) expect(issuesToFieldErrors(bad.error)["client.name"]).toBeDefined();
  });
});

describe("clientSchema", () => {
  it("aceita CNPJ, normaliza e-mail e recusa documento inválido", () => {
    const ok = clientSchema.safeParse({ name: "X", document: "11.222.333/0001-81", email: "A@B.COM", phone: "", notes: "" });
    expect(ok.success && ok.data).toMatchObject({ document: "11222333000181", email: "a@b.com", phone: null });
    const bad = clientSchema.safeParse({ name: "X", document: "123", email: "x", phone: "", notes: "" });
    expect(bad.success).toBe(false);
  });
});
