"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentPanel } from "./agent-panel";
import { useAgentChat } from "./use-agent-chat";

/** Botão flutuante + painel não modal do chat "Delegar missão". Só admin (decidido na página). */
export function AgentLauncher() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const chat = useAgentChat();

  function close() {
    setOpen(false);
    button.current?.focus();
  }

  return (
    <>
      {open ? <AgentPanel chat={chat} onClose={close} /> : null}
      <Button
        ref={button}
        className="fixed right-4 bottom-4 z-40 size-14 rounded-full lg:w-auto lg:px-5"
        aria-label="Delegar missão"
        aria-expanded={open}
        aria-controls="agent-panel"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Sparkles aria-hidden className="size-5" />
        <span className="hidden lg:inline">Delegar missão</span>
      </Button>
    </>
  );
}
