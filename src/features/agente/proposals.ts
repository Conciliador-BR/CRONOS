import { formatCnpj, isValidCnpj, onlyDigits } from "@/lib/format/document";
import type { CnpjPrefill } from "@/features/configuracoes/lookup-parsers";
import type { CnpjLookupResult } from "@/features/configuracoes/lookup-actions";
import { BOARD_COLORS } from "@/features/operacional/shared/colors";
import { normalizeName, resolveBoard, resolveDestination, type BoardOption } from "./resolve";
import { MAX_LIST_CARDS, MAX_PROPOSALS, modelText } from "./schemas";
import type { AgentProposal } from "./types";

/** Chamada de função como o Gemini devolve (`response.functionCalls`). */
export type ModelCall = { name?: string; args?: Record<string, unknown> };

export type ProposalDeps = {
  boards: BoardOption[];
  lookupCnpj: (cnpj: string) => Promise<CnpjLookupResult>;
  companyExists: (cnpj: string) => Promise<boolean>;
  newId: () => string;
};

function cardProposal(args: ModelCall["args"], deps: ProposalDeps): AgentProposal {
  const titulo = modelText(args, "titulo", 300);
  const quadro = modelText(args, "quadro", 200);
  const lista = modelText(args, "lista", 200);
  const dest = resolveDestination(deps.boards, quadro, lista);
  const warnings = titulo ? dest.warnings : ["Diga o título do card.", ...dest.warnings];
  const { board, list } = dest;
  return {
    id: deps.newId(),
    tool: "criar_card",
    actionLabel: "Criar card",
    fields: [
      { label: "Título", value: titulo || "(sem título)" },
      { label: "Quadro", value: dest.board?.name ?? (quadro || "(não informado)") },
      { label: "Lista", value: dest.list?.name ?? (lista || "(não informada)") },
    ],
    warnings,
    args: titulo && board && list ? { boardId: board.id, listId: list.id, title: titulo } : {},
  };
}

function listProposal(args: ModelCall["args"], deps: ProposalDeps): AgentProposal {
  const quadro = modelText(args, "quadro", 200);
  const nome = modelText(args, "nome", 120);
  const rawCards: unknown[] = Array.isArray(args?.cards) ? args.cards : [];
  const cards = rawCards
    .filter((c): c is string => typeof c === "string")
    .map((c) => c.trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, MAX_LIST_CARDS);
  const { board, warnings } = resolveBoard(deps.boards, quadro);
  if (!nome) warnings.push("Diga o nome da lista.");
  return {
    id: deps.newId(),
    tool: "criar_lista",
    actionLabel: cards.length ? `Criar lista e ${cards.length} card(s)` : "Criar lista",
    fields: [
      { label: "Quadro", value: board?.name ?? (quadro || "(não informado)") },
      { label: "Lista nova", value: nome || "(não informada)" },
      ...(cards.length ? [{ label: "Cards", value: cards.join(", ") }] : []),
    ],
    warnings,
    args: board && nome ? { boardId: board.id, name: nome, cards } : {},
  };
}

function boardProposal(args: ModelCall["args"], deps: ProposalDeps): AgentProposal {
  const nome = modelText(args, "nome", 120);
  const warnings = nome ? [] : ["Diga o nome do quadro."];
  if (nome && deps.boards.some((board) => normalizeName(board.name) === normalizeName(nome))) {
    warnings.push("Já existe um quadro com este nome.");
  }
  return {
    id: deps.newId(),
    tool: "criar_quadro",
    actionLabel: "Criar quadro",
    fields: [{ label: "Nome do quadro", value: nome || "(não informado)" }],
    warnings,
    args: warnings.length ? {} : { name: nome, background: BOARD_COLORS[0].value },
  };
}

const companyFields = (cnpj: string, data: CnpjPrefill) => {
  const place = [data.address.city, data.address.uf].filter(Boolean).join("/");
  return [
    { label: "Razão social", value: data.legalName },
    { label: "CNPJ", value: formatCnpj(cnpj) },
    { label: "Cidade/UF", value: place || "(não informado)" },
    ...(data.situation ? [{ label: "Situação cadastral", value: data.situation }] : []),
  ];
};

async function companyProposal(args: ModelCall["args"], deps: ProposalDeps): Promise<AgentProposal> {
  const raw = modelText(args, "cnpj", 30);
  const cnpj = onlyDigits(raw);
  const base = { id: deps.newId(), tool: "cadastrar_empresa" as const, actionLabel: "Cadastrar empresa" };
  if (cnpj.length !== 14 || !isValidCnpj(cnpj)) {
    const warning = raw ? "CNPJ inválido (dígitos verificadores)." : "Diga o CNPJ da empresa.";
    return { ...base, fields: [{ label: "CNPJ", value: raw || "(não informado)" }], warnings: [warning], args: {} };
  }
  const [lookup, exists] = await Promise.all([deps.lookupCnpj(cnpj), deps.companyExists(cnpj)]);
  const warnings = exists ? ["Já existe uma empresa com este CNPJ."] : [];
  if (!lookup.ok) {
    return { ...base, fields: [{ label: "CNPJ", value: formatCnpj(cnpj) }], warnings: [...warnings, lookup.error], args: {} };
  }
  if (!lookup.data.address.uf) warnings.push("A base pública não trouxe a UF. Cadastre pela tela de Empresas.");
  return { ...base, fields: companyFields(cnpj, lookup.data), warnings, args: { cnpj } };
}

/** Converte as chamadas de função do modelo em propostas. Ferramenta fora da lista é ignorada. */
export async function buildProposals(calls: ModelCall[], deps: ProposalDeps) {
  const builders = {
    criar_card: cardProposal,
    criar_lista: listProposal,
    criar_quadro: boardProposal,
    cadastrar_empresa: companyProposal,
  } satisfies Record<AgentProposal["tool"], unknown>;
  const known = calls.filter((call) => Object.hasOwn(builders, call.name ?? ""));
  const proposals = await Promise.all(
    known.slice(0, MAX_PROPOSALS).map((call) => builders[call.name as keyof typeof builders](call.args, deps)),
  );
  return { proposals, ignored: calls.length - proposals.length };
}

/** Campos do formulário de empresa (ver readCompanyForm) a partir da consulta do CNPJ. */
export function companyFormData(cnpj: string, data: CnpjPrefill) {
  const form = new FormData();
  const values: Record<string, string> = {
    cnpj,
    legalName: data.legalName,
    tradeName: data.tradeName,
    cnae: data.cnae,
    cnaeDescription: data.cnaeDescription,
    ...data.address,
    companyType: "matriz",
    clientMode: "none",
  };
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}
