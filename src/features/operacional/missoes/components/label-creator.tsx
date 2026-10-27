"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCENT_COLORS } from "../../shared/colors";
import { ColorPicker } from "../../shared/color-picker";
import { createLabel } from "../board-actions";
import { useBoard } from "./board-context";

/** Cria etiqueta do quadro (nome + cor). */
export function LabelCreator({ onCreated }: { onCreated: (labelId: string) => void }) {
  const { meta, actions } = useBoard();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(ACCENT_COLORS[0].value);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await createLabel({ boardId: meta.boardId, name, color });
    setPending(false);
    if (!result.ok) return actions.reportError(result.error);
    actions.setState((s) => (s.labels.some((l) => l.id === result.label.id) ? s : { ...s, labels: [...s.labels, result.label] }));
    setName("");
    setOpen(false);
    onCreated(result.label.id);
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" className="w-full" onClick={() => setOpen(true)}>
        Criar uma nova etiqueta
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-t border-border pt-3">
      <div
        className="h-8 truncate rounded px-2 text-sm leading-8 font-medium text-white"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        {name || "Prévia"}
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium text-fg">
        Nome
        <Input autoFocus value={name} maxLength={60} onChange={(event) => setName(event.target.value)} />
      </label>
      <ColorPicker name="label-color" label="Cor" colors={ACCENT_COLORS} value={color} onChange={setColor} />
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={pending}>
          Criar
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
