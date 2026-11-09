/** Contrato entre a interface do chat "Delegar missão" e as Server Actions do agente. */

/** Ferramentas que o agente pode propor. Lista fixa: a IA nunca escolhe fora dela. */
export type AgentTool = "criar_card" | "criar_lista" | "criar_quadro" | "cadastrar_empresa";

/** Ação proposta pela IA e ainda não executada. */
export type AgentProposal = {
  /** Identificador opaco para executar exatamente esta proposta. */
  id: string;
  tool: AgentTool;
  /** Verbo do botão de confirmar, ex.: "Criar card". */
  actionLabel: string;
  /** Valores exatos que serão gravados, já resolvidos (nomes, não IDs). */
  fields: { label: string; value: string }[];
  /** Ambiguidades ou dados faltando. Com avisos, a interface não deixa confirmar. */
  warnings: string[];
  /** Argumentos validados para executar; a interface só devolve, não edita. */
  args: Record<string, unknown>;
};

export type ProposeResult =
  | { ok: true; transcript?: string; reply: string; proposals: AgentProposal[] }
  | { ok: false; error: string };

export type ExecuteResult =
  | { ok: true; message: string; href?: string }
  | { ok: false; error: string };
