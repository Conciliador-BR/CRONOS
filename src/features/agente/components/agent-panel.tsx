"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { Sparkles, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Composer } from "./composer";
import { ProposalCard } from "./proposal-card";
import type { useAgentChat } from "./use-agent-chat";

const EXAMPLES = [
  "Criar um card chamado Revisar contrato na missão Comercial",
  "Cadastrar a empresa Padaria Estrela, CNPJ 12.345.678/0001-90",
];
const FOCUSABLE = "button:not([disabled]), a[href], textarea:not([disabled]), input:not([disabled])";

type Props = { chat: ReturnType<typeof useAgentChat>; onClose: () => void };

export function AgentPanel({ chat, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("textarea")?.focus();
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [chat.entries.length, chat.thinking, chat.error]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      return onClose();
    }
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const lastEl = items[items.length - 1];
    if (!first || !lastEl) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      lastEl.focus();
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      ref={panel}
      id="agent-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="agent-title"
      onKeyDown={onKeyDown}
      className={cn(
        "fixed z-40 flex flex-col border border-border bg-surface shadow-2xl animate-pop-in",
        "inset-x-0 bottom-0 h-[85dvh] rounded-t-xl",
        "sm:inset-x-auto sm:right-4 sm:bottom-20 sm:h-[min(36rem,calc(100dvh-7rem))] sm:w-[min(26rem,calc(100vw-2rem))] sm:rounded-xl",
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 id="agent-title" className="text-sm font-semibold text-fg">
          Delegar missão
        </h2>
        <Button variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label="Fechar">
          <X aria-hidden />
        </Button>
      </header>

      <div role="log" aria-live="polite" aria-label="Conversa" className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {chat.entries.length === 0 && !chat.thinking ? (
          <EmptyState
            icon={Sparkles}
            title="O que você quer delegar?"
            description="Escreva ou grave um pedido. Você confirma antes de qualquer coisa ser criada."
            action={
              <div className="flex flex-col gap-2">
                {EXAMPLES.map((ex) => (
                  <Button
                    key={ex}
                    variant="secondary"
                    size="sm"
                    className="h-auto whitespace-normal py-1.5 text-left"
                    onClick={() => chat.setDraft(ex)}
                  >
                    {ex}
                  </Button>
                ))}
              </div>
            }
          />
        ) : null}
        {chat.entries.map((e) =>
          e.kind === "msg" ? (
            <p
              key={e.id}
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                e.from === "ai" ? "self-start bg-surface-2 text-fg" : "self-end border border-primary/30 bg-primary/15 text-fg",
              )}
            >
              {e.text}
            </p>
          ) : (
            <ProposalCard
              key={e.id}
              proposal={e.proposal}
              state={e.state}
              onConfirm={() => void chat.confirm(e.id)}
              onCancel={() => chat.cancel(e.id)}
              onEdit={chat.edit}
            />
          ),
        )}
        {chat.thinking ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Spinner label="Pensando" /> Pensando…
          </p>
        ) : null}
        {chat.error ? (
          <Alert tone="danger" title="Algo deu errado">
            <p>{chat.error}</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={chat.retry}>
              Tentar de novo
            </Button>
          </Alert>
        ) : null}
        <div ref={end} />
      </div>

      <Composer draft={chat.draft} onDraft={chat.setDraft} onSend={chat.sendText} onAudio={chat.sendAudio} busy={chat.thinking} />
    </div>
  );
}
