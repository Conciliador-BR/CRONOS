"use client";

import { useRef, useState } from "react";
import { executeAction, proposeAction } from "@/features/agente/actions";
import type { AgentProposal } from "@/features/agente/types";

export type ProposalState =
  | { status: "pending" | "running" | "cancelled" }
  | { status: "done"; message: string; href?: string }
  | { status: "error"; message: string };

export type Entry =
  | { id: number; kind: "msg"; from: "admin" | "ai"; text: string }
  | { id: number; kind: "proposal"; proposal: AgentProposal; state: ProposalState };

type Input = { text: string } | { audio: Blob };

export function useAgentChat() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = useRef<Input | null>(null);
  const seq = useRef(0);

  const add = (e: Entry extends infer T ? (T extends Entry ? Omit<T, "id"> : never) : never) => setEntries((l) => [...l, { ...e, id: ++seq.current } as Entry]);

  async function run(input: Input) {
    last.current = input;
    const body = new FormData();
    if ("text" in input) body.set("text", input.text);
    else body.set("audio", input.audio, "audio.webm");
    setError(null);
    setThinking(true);
    try {
      const res = await proposeAction(body);
      if (!res.ok) return setError(res.error);
      if (res.transcript) add({ kind: "msg", from: "admin", text: res.transcript });
      add({ kind: "msg", from: "ai", text: res.reply });
      for (const proposal of res.proposals) add({ kind: "proposal", proposal, state: { status: "pending" } });
    } catch {
      setError("Não foi possível falar com o assistente. Tente de novo.");
    } finally {
      setThinking(false);
    }
  }

  function sendText(text: string) {
    add({ kind: "msg", from: "admin", text });
    setDraft("");
    void run({ text });
  }

  const patch = (id: number, state: ProposalState) =>
    setEntries((l) => l.map((e) => (e.id === id && e.kind === "proposal" ? { ...e, state } : e)));

  async function confirm(id: number) {
    const entry = entries.find((e) => e.id === id);
    if (entry?.kind !== "proposal") return;
    patch(id, { status: "running" });
    try {
      const res = await executeAction({ tool: entry.proposal.tool, args: entry.proposal.args });
      patch(id, res.ok ? { status: "done", message: res.message, href: res.href } : { status: "error", message: res.error });
    } catch {
      patch(id, { status: "error", message: "Não foi possível executar. Tente de novo." });
    }
  }

  /** Devolve o último pedido de texto ao campo e cancela as propostas pendentes. */
  function edit() {
    const text = [...entries].reverse().find((e) => e.kind === "msg" && e.from === "admin");
    if (text?.kind === "msg") setDraft(text.text);
    setEntries((l) =>
      l.map((e) => (e.kind === "proposal" && e.state.status === "pending" ? { ...e, state: { status: "cancelled" } } : e)),
    );
  }

  return {
    entries,
    draft,
    setDraft,
    thinking,
    error,
    sendText,
    sendAudio: (audio: Blob) => void run({ audio }),
    retry: () => last.current && void run(last.current),
    confirm,
    cancel: (id: number) => patch(id, { status: "cancelled" }),
    edit,
  };
}
