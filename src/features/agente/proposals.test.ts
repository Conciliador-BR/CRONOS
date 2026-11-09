import { describe, expect, it, vi } from "vitest";
import { companySchema, readCompanyForm } from "@/features/configuracoes/company-schemas";
import type { CnpjPrefill } from "@/features/configuracoes/lookup-parsers";
import { buildProposals, companyFormData, type ProposalDeps } from "./proposals";
import { resolveDestination, type BoardOption } from "./resolve";
import { audioType } from "./schemas";

const B1 = "11111111-1111-4111-8111-111111111111";
const B2 = "22222222-2222-4222-8222-222222222222";
const L1 = "33333333-3333-4333-8333-333333333333";
const L2 = "44444444-4444-4444-8444-444444444444";
const L3 = "55555555-5555-4555-8555-555555555555";

const boards: BoardOption[] = [
  { id: B1, name: "Operações", lists: [{ id: L1, name: "A fazer" }, { id: L2, name: "Fazendo" }] },
  { id: B2, name: "Operações Sul", lists: [{ id: L3, name: "A fazer" }] },
];

const VALID_CNPJ = "11222333000181";
const prefill: CnpjPrefill = {
  legalName: "EMPRESA TESTE LTDA",
  tradeName: "",
  cnae: "4711302",
  cnaeDescription: "Comércio varejista",
  situation: null,
  address: { cep: "01001000", street: "Praça da Sé", number: "1", complement: "", district: "Sé", city: "São Paulo", uf: "SP" },
};

function deps(over: Partial<ProposalDeps> = {}): ProposalDeps {
  let n = 0;
  return {
    boards,
    lookupCnpj: vi.fn(async () => ({ ok: true as const, data: prefill })),
    companyExists: vi.fn(async () => false),
    newId: () => `p${++n}`,
    ...over,
  };
}

describe("resolveDestination", () => {
  it("prefere o nome exato, sem acento nem caixa", () => {
    const dest = resolveDestination(boards, "operacoes", "a FAZER");
    expect(dest).toEqual({ board: { id: B1, name: "Operações" }, list: { id: L1, name: "A fazer" }, warnings: [] });
  });

  it("aponta ambiguidade quando o trecho casa com mais de um", () => {
    const dest = resolveDestination(boards, "Oper", "A fazer");
    expect(dest.board).toBeUndefined();
    expect(dest.warnings[0]).toContain("Mais de um quadro");
    expect(resolveDestination(boards, "Operações", "faz").warnings[0]).toContain("Mais de uma lista");
  });

  it("avisa quadro ou lista inexistente ou ausente", () => {
    expect(resolveDestination(boards, "Financeiro", "A fazer").warnings[0]).toBe('Quadro "Financeiro" não encontrado.');
    expect(resolveDestination(boards, "Operações Sul", "Feito").warnings[0]).toContain("não encontrada");
    expect(resolveDestination(boards, "", "").warnings).toHaveLength(1);
  });
});

describe("buildProposals", () => {
  it("mapeia criar_card para IDs resolvidos e nomes nos campos", async () => {
    const { proposals } = await buildProposals(
      [{ name: "criar_card", args: { titulo: "Ligar para cliente", quadro: "Operações Sul", lista: "a fazer" } }],
      deps(),
    );
    expect(proposals).toEqual([
      {
        id: "p1",
        tool: "criar_card",
        actionLabel: "Criar card",
        fields: [
          { label: "Título", value: "Ligar para cliente" },
          { label: "Quadro", value: "Operações Sul" },
          { label: "Lista", value: "A fazer" },
        ],
        warnings: [],
        args: { boardId: B2, listId: L3, title: "Ligar para cliente" },
      },
    ]);
  });

  it("criar_card ambíguo ou sem título fica sem args e com aviso", async () => {
    const { proposals } = await buildProposals([{ name: "criar_card", args: { quadro: "Oper", lista: 3 } }], deps());
    expect(proposals[0].args).toEqual({});
    expect(proposals[0].warnings).toEqual(["Diga o título do card.", expect.stringContaining("Mais de um quadro")]);
  });

  it("cadastrar_empresa consulta o CNPJ e mostra razão social, CNPJ formatado e cidade/UF", async () => {
    const d = deps();
    const { proposals } = await buildProposals([{ name: "cadastrar_empresa", args: { cnpj: "11.222.333/0001-81" } }], d);
    expect(d.lookupCnpj).toHaveBeenCalledWith(VALID_CNPJ);
    expect(proposals[0].fields).toEqual([
      { label: "Razão social", value: "EMPRESA TESTE LTDA" },
      { label: "CNPJ", value: "11.222.333/0001-81" },
      { label: "Cidade/UF", value: "São Paulo/SP" },
    ]);
    expect(proposals[0]).toMatchObject({ warnings: [], args: { cnpj: VALID_CNPJ } });
  });

  it("CNPJ inválido não consulta a base; duplicado e falha da consulta viram aviso", async () => {
    const d = deps();
    const invalid = await buildProposals([{ name: "cadastrar_empresa", args: { cnpj: "11222333000180" } }], d);
    expect(invalid.proposals[0]).toMatchObject({ warnings: ["CNPJ inválido (dígitos verificadores)."], args: {} });
    expect(d.lookupCnpj).not.toHaveBeenCalled();

    const failing = deps({
      companyExists: vi.fn(async () => true),
      lookupCnpj: vi.fn(async () => ({ ok: false as const, error: "CNPJ não encontrado." })),
    });
    const dup = await buildProposals([{ name: "cadastrar_empresa", args: { cnpj: VALID_CNPJ } }], failing);
    expect(dup.proposals[0].warnings).toEqual(["Já existe uma empresa com este CNPJ.", "CNPJ não encontrado."]);
  });

  it("ignora ferramentas fora da lista fixa", async () => {
    const result = await buildProposals([{ name: "apagar_tudo", args: {} }, { name: undefined }], deps());
    expect(result).toEqual({ proposals: [], ignored: 2 });
  });
});

describe("companyFormData", () => {
  it("gera um formulário aceito pelo schema de empresa", () => {
    const parsed = companySchema.safeParse(readCompanyForm(companyFormData(VALID_CNPJ, prefill)));
    expect(parsed.success).toBe(true);
    expect(parsed.data).toMatchObject({ cnpj: VALID_CNPJ, legalName: "EMPRESA TESTE LTDA", uf: "SP", clientMode: "none" });
  });
});

describe("audioType", () => {
  const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]);
  it("aceita tipo declarado só com a assinatura certa", () => {
    expect(audioType("audio/webm;codecs=opus", webm)).toBe("audio/webm");
    expect(audioType("audio/ogg", webm)).toBeNull();
    expect(audioType("audio/mp4", new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70]))).toBe("audio/mp4");
    expect(audioType("video/webm", webm)).toBeNull();
  });
});

describe("criar_quadro", () => {
  it("propõe o quadro com a cor padrão", async () => {
    const { proposals } = await buildProposals([{ name: "criar_quadro", args: { nome: "Financeiro" } }], deps());
    expect(proposals[0]).toMatchObject({ tool: "criar_quadro", warnings: [], args: { name: "Financeiro", background: "#0b1220" } });
  });

  it("avisa quando o nome falta ou já existe", async () => {
    const { proposals } = await buildProposals(
      [{ name: "criar_quadro", args: {} }, { name: "criar_quadro", args: { nome: "operacoes" } }],
      deps(),
    );
    expect(proposals[0].warnings).toEqual(["Diga o nome do quadro."]);
    expect(proposals[1].warnings).toEqual(["Já existe um quadro com este nome."]);
    expect(proposals.every((p) => Object.keys(p.args).length === 0)).toBe(true);
  });
});

describe("criar_lista", () => {
  it("propõe a lista no quadro resolvido, com os cards pedidos", async () => {
    const { proposals } = await buildProposals(
      [{ name: "criar_lista", args: { quadro: "Operações", nome: "Revisão", cards: ["guigui", 3, " "] } }],
      deps(),
    );
    expect(proposals[0]).toMatchObject({
      tool: "criar_lista",
      actionLabel: "Criar lista e 1 card(s)",
      warnings: [],
      args: { boardId: B1, name: "Revisão", cards: ["guigui"] },
    });
  });

  it("bloqueia sem quadro válido ou sem nome", async () => {
    const { proposals } = await buildProposals([{ name: "criar_lista", args: { quadro: "Nada" } }], deps());
    expect(proposals[0].warnings).toEqual(['Quadro "Nada" não encontrado.', "Diga o nome da lista."]);
    expect(proposals[0].args).toEqual({});
  });
});
