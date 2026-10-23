import { describe, expect, it } from "vitest";
import { getInitials, getMainNav, isActivePath } from "./nav";

describe("isActivePath", () => {
  it("marca a rota e suas subrotas", () => {
    expect(isActivePath("/comercial", "/comercial")).toBe(true);
    expect(isActivePath("/comercial/crm", "/comercial")).toBe(true);
  });

  it("não confunde prefixos parecidos", () => {
    expect(isActivePath("/comercialx", "/comercial")).toBe(false);
    expect(isActivePath("/inicio", "/comercial")).toBe(false);
  });
});

describe("getMainNav", () => {
  it("esconde Configurações de funcionário", () => {
    const labels = getMainNav("funcionario").map((i) => i.label);
    expect(labels).not.toContain("Configurações");
    expect(labels).toContain("Início");
  });

  it("mostra Configurações para admin e gestor", () => {
    expect(getMainNav("admin").map((i) => i.label)).toContain("Configurações");
    expect(getMainNav("gestor").map((i) => i.label)).toContain("Configurações");
  });
});

describe("getInitials", () => {
  it("usa primeiro e último nome", () => {
    expect(getInitials("Mateus da Silva")).toBe("MS");
  });

  it("aceita nome único e vazio", () => {
    expect(getInitials("ana")).toBe("A");
    expect(getInitials("   ")).toBe("?");
  });
});
