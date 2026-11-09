import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireRole: vi.fn(),
  createCard: vi.fn(),
  createCompany: vi.fn(),
  lookupCnpj: vi.fn(),
  findBoardList: vi.fn(),
  interpret: vi.fn(),
  transcribe: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireRole: mocks.requireRole, getCurrentProfile: async () => null }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/features/operacional/missoes/card-actions", () => ({ createCard: mocks.createCard }));
vi.mock("@/features/configuracoes/company-actions", () => ({ createCompany: mocks.createCompany }));
vi.mock("@/features/configuracoes/lookup-actions", () => ({ lookupCnpj: mocks.lookupCnpj }));
vi.mock("./queries", () => ({
  findBoardList: mocks.findBoardList,
  getAgentBoards: vi.fn(async () => []),
  companyExists: vi.fn(async () => false),
}));
vi.mock("./gemini", () => ({ UNAVAILABLE: "Agente indisponível: configure GEMINI_API_KEY", interpret: mocks.interpret, transcribe: mocks.transcribe }));

const { executeAction, proposeAction } = await import("./actions");

const BOARD = "11111111-1111-4111-8111-111111111111";
const LIST = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  mocks.requireRole.mockResolvedValue({ role: "admin" });
  vi.stubEnv("GEMINI_API_KEY", "teste");
});

describe("executeAction", () => {
  it("nega quem não é admin", async () => {
    mocks.requireRole.mockRejectedValue(new Error("Acesso negado"));
    expect(await executeAction({ tool: "criar_card", args: {} })).toEqual({ ok: false, error: "Acesso negado." });
  });

  it("recusa ferramenta desconhecida", async () => {
    const result = await executeAction({ tool: "apagar_tudo" as never, args: {} });
    expect(result).toEqual({ ok: false, error: "Proposta inválida: Ferramenta desconhecida." });
  });

  it("recusa args inválidos ou com campos extras sem gravar", async () => {
    const bad = await executeAction({ tool: "criar_card", args: { boardId: "x", listId: LIST, title: "T" } });
    const extra = await executeAction({ tool: "criar_card", args: { boardId: BOARD, listId: LIST, title: "T", archived: true } });
    expect(bad.ok).toBe(false);
    expect(extra.ok).toBe(false);
    expect(mocks.createCard).not.toHaveBeenCalled();
  });

  it("recusa CNPJ com dígito verificador errado sem consultar nem gravar", async () => {
    const result = await executeAction({ tool: "cadastrar_empresa", args: { cnpj: "11222333000180" } });
    expect(result).toEqual({ ok: false, error: "Proposta inválida: CNPJ inválido (dígitos verificadores)." });
    expect(mocks.lookupCnpj).not.toHaveBeenCalled();
    expect(mocks.createCompany).not.toHaveBeenCalled();
  });

  it("confere quadro/lista no banco antes de criar o card", async () => {
    mocks.findBoardList.mockResolvedValueOnce(null);
    const args = { boardId: BOARD, listId: LIST, title: "Ligar" };
    expect((await executeAction({ tool: "criar_card", args })).ok).toBe(false);
    expect(mocks.createCard).not.toHaveBeenCalled();

    mocks.findBoardList.mockResolvedValueOnce({ boardName: "Operações", listName: "A fazer" });
    mocks.createCard.mockResolvedValueOnce({ ok: true, card: {} });
    expect(await executeAction({ tool: "criar_card", args })).toEqual({
      ok: true,
      message: 'Card "Ligar" criado em Operações › A fazer.',
      href: `/operacional/missoes/${BOARD}`,
    });
  });
});

describe("proposeAction", () => {
  it("sem chave devolve erro em português", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const form = new FormData();
    form.set("text", "criar card");
    expect(await proposeAction(form)).toEqual({ ok: false, error: "Agente indisponível: configure GEMINI_API_KEY" });
  });

  it("limita o tamanho do texto sem chamar o provedor", async () => {
    const form = new FormData();
    form.set("text", "a".repeat(2001));
    expect((await proposeAction(form)).ok).toBe(false);
    expect(mocks.interpret).not.toHaveBeenCalled();
  });

  it("pedido fora das ferramentas volta sem propostas e com resposta", async () => {
    mocks.interpret.mockResolvedValueOnce({ ok: true, data: { calls: [], reply: "Só crio cards e empresas." } });
    const form = new FormData();
    form.set("text", "qual a previsão do tempo?");
    expect(await proposeAction(form)).toEqual({ ok: true, transcript: undefined, reply: "Só crio cards e empresas.", proposals: [] });
  });

  it("áudio com assinatura errada é recusado sem transcrever", async () => {
    const form = new FormData();
    form.set("audio", new Blob([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], { type: "audio/webm" }));
    expect((await proposeAction(form)).ok).toBe(false);
    expect(mocks.transcribe).not.toHaveBeenCalled();
  });
});
