"use server";

import { unstable_rethrow } from "next/navigation";
// shortcut: helpers internos do Next para ler o redirect de createCompany; trocar se a API pública expuser isso.
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getURLFromRedirectError } from "next/dist/client/components/redirect";
import { getCurrentProfile, requireRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createCompany } from "@/features/configuracoes/company-actions";
import { lookupCnpj } from "@/features/configuracoes/lookup-actions";
import { createBoard, createList } from "@/features/operacional/missoes/board-actions";
import { createCard } from "@/features/operacional/missoes/card-actions";
import { UNAVAILABLE, interpret, transcribe } from "./gemini";
import { overLimit } from "@/lib/rate-limit";
import { buildProposals, companyFormData } from "./proposals";
import { companyExists, findBoardList, getAgentBoards } from "./queries";
import { MAX_AUDIO_BYTES, MAX_TEXT, audioType, executeInputSchema, type ExecuteInput } from "./schemas";
import type { AgentTool, ExecuteResult, ProposeResult } from "./types";

const FALLBACK_REPLY =
  "Não encontrei um pedido que eu consiga executar. Posso criar cards nos quadros de Missões ou cadastrar empresas pelo CNPJ.";

/** Só admin. Redirecionamentos de login seguem; "Acesso negado" vira mensagem. */
async function denied(): Promise<string | null> {
  try {
    await requireRole(["admin"]);
    return null;
  } catch (error) {
    unstable_rethrow(error);
    return "Acesso negado.";
  }
}

/** Texto do pedido: digitado, ou transcrito do áudio (validado por tipo, tamanho e assinatura). */
async function readRequest(formData: FormData): Promise<{ ok: true; text: string; transcript?: string } | { ok: false; error: string }> {
  const audio = formData.get("audio");
  if (audio instanceof Blob && audio.size > 0) {
    if (audio.size > MAX_AUDIO_BYTES) return { ok: false, error: "Áudio grande demais. Grave até 2 minutos." };
    const mimeType = audioType(audio.type, new Uint8Array(await audio.slice(0, 12).arrayBuffer()));
    if (!mimeType) return { ok: false, error: "Formato de áudio não aceito. Use WebM, OGG ou MP4." };
    const base64 = Buffer.from(await audio.arrayBuffer()).toString("base64");
    const result = await transcribe({ base64, mimeType });
    if (!result.ok) return result;
    return { ok: true, text: result.data.slice(0, MAX_TEXT), transcript: result.data };
  }
  const text = formData.get("text");
  const value = typeof text === "string" ? text.trim() : "";
  if (!value) return { ok: false, error: "Escreva ou grave o pedido." };
  if (value.length > MAX_TEXT) return { ok: false, error: `Pedido longo demais: até ${MAX_TEXT} caracteres.` };
  return { ok: true, text: value };
}

/** Passo 1: a IA interpreta o pedido e devolve propostas. Nada é gravado aqui. */
export async function proposeAction(formData: FormData): Promise<ProposeResult> {
  const error = await denied();
  if (error) return { ok: false, error };
  if (!process.env.GEMINI_API_KEY) return { ok: false, error: UNAVAILABLE };
  const profile = await getCurrentProfile();
  if (profile && overLimit(profile.id)) return { ok: false, error: "Muitos pedidos seguidos. Aguarde um minuto e tente de novo." };

  const request = await readRequest(formData);
  if (!request.ok) return request;
  const boards = await getAgentBoards().catch(() => []);
  const result = await interpret(request.text, boards);
  if (!result.ok) return result;

  const { proposals, ignored } = await buildProposals(result.data.calls, {
    boards,
    lookupCnpj,
    companyExists,
    newId: () => crypto.randomUUID(),
  });
  logger.info(
    {
      scope: "agente.propose",
      input: request.transcript === undefined ? "texto" : "audio",
      chars: request.text.length,
      tools: proposals.map((p) => p.tool),
      warnings: proposals.reduce((sum, p) => sum + p.warnings.length, 0),
      ignored,
    },
    "agente: proposta gerada",
  );
  const reply = result.data.reply || (proposals.length ? "Confira e confirme cada ação." : FALLBACK_REPLY);
  return { ok: true, transcript: request.transcript, reply, proposals };
}

async function runCreateCard(args: Extract<ExecuteInput, { tool: "criar_card" }>["args"]): Promise<ExecuteResult> {
  const place = await findBoardList(args.boardId, args.listId);
  if (!place) return { ok: false, error: "Quadro ou lista não encontrado. Peça de novo ao agente." };
  const result = await createCard(args);
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    message: `Card "${args.title}" criado em ${place.boardName} › ${place.listName}.`,
    href: `/operacional/missoes/${args.boardId}`,
  };
}

async function runCreateList(args: Extract<ExecuteInput, { tool: "criar_lista" }>["args"]): Promise<ExecuteResult> {
  const created = await createList({ boardId: args.boardId, name: args.name });
  if (!created.ok) return { ok: false, error: created.error };
  // Em ordem, para os cards ficarem na sequência pedida.
  for (const [index, title] of args.cards.entries()) {
    const card = await createCard({ boardId: args.boardId, listId: created.list.id, title });
    if (!card.ok) {
      return { ok: false, error: `Lista "${args.name}" criada, mas só ${index} de ${args.cards.length} card(s): ${card.error}` };
    }
  }
  const extra = args.cards.length ? ` com ${args.cards.length} card(s)` : "";
  return { ok: true, message: `Lista "${args.name}" criada${extra}.`, href: `/operacional/missoes/${args.boardId}` };
}

async function runCreateBoard(args: Extract<ExecuteInput, { tool: "criar_quadro" }>["args"]): Promise<ExecuteResult> {
  const result = await createBoard(args);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, message: `Quadro "${args.name}" criado.`, href: `/operacional/missoes/${result.id}` };
}

async function runCreateCompany(cnpj: string): Promise<ExecuteResult> {
  // Reconsulta a base pública: os dados gravados não vêm do cliente.
  const lookup = await lookupCnpj(cnpj);
  if (!lookup.ok) return { ok: false, error: lookup.error };
  const message = `Empresa "${lookup.data.legalName}" cadastrada.`;
  try {
    const result = await createCompany(companyFormData(cnpj, lookup.data));
    if (result.ok) return { ok: true, message, href: "/configuracoes/empresas" };
    const fieldError = Object.values(result.fieldErrors ?? {}).flat()[0];
    return { ok: false, error: fieldError ?? result.error };
  } catch (error) {
    // createCompany termina com redirect para a empresa criada.
    // Só o redirect de sucesso conta; qualquer outro (login, erro) segue normalmente.
    const href = isRedirectError(error) ? getURLFromRedirectError(error) : null;
    if (href?.startsWith("/configuracoes/empresas/")) return { ok: true, message, href };
    throw error;
  }
}

/** Passo 2: executa uma proposta confirmada. A entrada vem do cliente: tudo é revalidado. */
export async function executeAction(input: { tool: AgentTool; args: Record<string, unknown> }): Promise<ExecuteResult> {
  const error = await denied();
  if (error) return { ok: false, error };
  const parsed = executeInputSchema.safeParse(input);
  if (!parsed.success) {
    // Só mensagens nossas (pt-BR); as padrão do Zod vêm em inglês.
    const issue = parsed.error.issues[0];
    const ours = issue && (issue.code === "custom" || issue.path[0] === "tool");
    return { ok: false, error: ours ? `Proposta inválida: ${issue.message}` : "Proposta inválida. Peça de novo ao agente." };
  }
  const { data } = parsed;
  logger.info({ scope: "agente.execute", tool: data.tool }, "agente: executando ação confirmada");
  if (data.tool === "criar_card") return runCreateCard(data.args);
  if (data.tool === "criar_lista") return runCreateList(data.args);
  if (data.tool === "criar_quadro") return runCreateBoard(data.args);
  return runCreateCompany(data.args.cnpj);
}
