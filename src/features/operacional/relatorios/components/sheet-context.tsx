"use client";

import { createContext, use, useRef, useState, type ReactNode } from "react";
import type { ActionResult } from "../../shared/result";
import type { Member } from "../../shared/types";
import type { CompanyOption, ReportProperty, ReportRow, ReportSheet, ReportSheetData } from "../types";

export type SheetState = { sheet: ReportSheet; properties: ReportProperty[]; rows: ReportRow[] };

type Change = (state: SheetState) => SheetState;

/** Exclusão aguardando confirmação (o modal fica fora da linha/coluna, que some ao excluir). */
export type PendingDelete = { kind: "row" | "property"; id: string; label: string };

type SheetMeta = {
  sheetId: string;
  members: Member[];
  membersById: Map<string, Member>;
  companies: CompanyOption[];
  companiesById: Map<string, CompanyOption>;
};

type SheetActions = {
  /**
   * Aplica a mudança na hora e chama o servidor. Se falhar, só ESTA mudança é desfeita
   * (as outras em andamento continuam). Devolve a mensagem de erro, ou null se deu certo.
   * `report: false` não mostra o aviso geral (quem chamou mostra o erro no próprio modal).
   */
  mutate: (change: Change, call: () => Promise<ActionResult>, report?: boolean) => Promise<string | null>;
  /** Muda o estado confirmado sem chamar o servidor (ex.: aplicar o retorno de uma ação). */
  apply: (change: Change) => void;
  reportError: (message: string | null) => void;
  askDelete: (target: PendingDelete | null) => void;
};

type SheetContextValue = {
  state: SheetState;
  meta: SheetMeta;
  ui: { error: string | null; pendingDelete: PendingDelete | null };
  actions: SheetActions;
};

const SheetContext = createContext<SheetContextValue | null>(null);

export function useSheet() {
  const value = use(SheetContext);
  if (!value) throw new Error("useSheet fora do SheetProvider");
  return value;
}

function toState(data: ReportSheetData): SheetState {
  return { sheet: data.sheet, properties: data.properties, rows: data.rows };
}

const OFFLINE = "Sem conexão com o servidor. A mudança foi desfeita.";

/**
 * Único lugar que sabe como o estado da tabela é guardado e sincronizado com o servidor.
 * Estado exibido = estado confirmado + mudanças pendentes reaplicadas em ordem. Dados novos do
 * servidor viram o estado confirmado, e as mudanças ainda em voo são reaplicadas por cima.
 */
export function SheetProvider({ data, children }: { data: ReportSheetData; children: ReactNode }) {
  const [source, setSource] = useState(data);
  const [confirmed, setConfirmed] = useState(() => toState(data));
  const [pending, setPending] = useState<{ id: number; change: Change }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const nextId = useRef(0);

  if (data !== source) {
    setSource(data);
    setConfirmed(toState(data));
  }

  const state = pending.reduce((current, item) => item.change(current), confirmed);

  async function mutate(change: Change, call: () => Promise<ActionResult>, report = true) {
    const id = ++nextId.current;
    setPending((current) => [...current, { id, change }]);
    if (report) setError(null);
    let message: string | null;
    try {
      const result = await call();
      message = result.ok ? null : result.error;
    } catch {
      message = OFFLINE;
    }
    if (message === null) setConfirmed(change);
    setPending((current) => current.filter((item) => item.id !== id));
    if (message && report) setError(message);
    return message;
  }

  const meta: SheetMeta = {
    sheetId: data.sheet.id,
    members: data.members,
    membersById: new Map(data.members.map((member) => [member.id, member])),
    companies: data.companies,
    companiesById: new Map(data.companies.map((company) => [company.id, company])),
  };

  return (
    <SheetContext
      value={{
        state,
        meta,
        ui: { error, pendingDelete },
        actions: { mutate, apply: setConfirmed, reportError: setError, askDelete: setPendingDelete },
      }}
    >
      {children}
    </SheetContext>
  );
}
