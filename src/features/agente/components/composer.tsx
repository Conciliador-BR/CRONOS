"use client";

import { Mic, SendHorizontal } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceRecorder } from "./use-voice-recorder";

const MAX_CHARS = 2000;

type Props = {
  draft: string;
  onDraft: (v: string) => void;
  onSend: (text: string) => void;
  onAudio: (audio: Blob) => void;
  busy: boolean;
};

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function Composer({ draft, onDraft, onSend, onAudio, busy }: Props) {
  const voice = useVoiceRecorder(onAudio);
  const text = draft.trim();
  const tooLong = draft.length > MAX_CHARS;
  const canSend = !!text && !tooLong && !busy;

  if (voice.state === "recording") {
    return (
      <div className="flex flex-col gap-2 border-t border-border p-3">
        <p className="flex items-center gap-2 text-sm text-fg" role="status">
          <span aria-hidden className="size-2.5 rounded-full bg-danger motion-safe:animate-pulse" />
          Gravando <span className="tabular-nums text-muted">{mmss(voice.seconds)}</span>
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => voice.stop(false)}>
            Cancelar gravação
          </Button>
          <Button size="sm" onClick={() => voice.stop(true)}>
            Parar e enviar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border p-3">
      {voice.state === "denied" ? (
        <Alert tone="warning">Sem acesso ao microfone. Libere a permissão no navegador ou escreva o pedido.</Alert>
      ) : null}
      <Field
        id="agent-text"
        label={<span className="sr-only">Pedido para o assistente</span>}
        error={tooLong ? `Máximo de ${MAX_CHARS} caracteres (${draft.length}).` : undefined}
      >
        <Textarea
          rows={2}
          value={draft}
          placeholder="Ex.: criar card Revisar contrato na missão Comercial"
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSend(text);
            }
          }}
          className="max-h-32 min-h-14 resize-none"
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => void voice.start()} disabled={busy}>
          <Mic aria-hidden />
          Gravar
        </Button>
        <Button size="sm" onClick={() => onSend(text)} disabled={!canSend}>
          <SendHorizontal aria-hidden />
          Enviar
        </Button>
      </div>
    </div>
  );
}
