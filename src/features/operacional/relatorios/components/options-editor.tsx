"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ACCENT_COLORS } from "../../shared/colors";
import { newOptionId, STATUS_GROUP_LABELS } from "../options";
import { STATUS_GROUPS, type PropertyOption, type ReportProperty, type StatusGroup } from "../types";
import { OptionPill } from "./option-pill";
import { useSheetCommands } from "./use-sheet-commands";

/** Modal para adicionar, renomear, colorir, agrupar (Status) e remover opções de uma coluna. */
export function OptionsEditor({ property, onClose }: { property: ReportProperty; onClose: () => void }) {
  const commands = useSheetCommands();
  const isStatus = property.type === "status";
  const [options, setOptions] = useState<PropertyOption[]>(property.options);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function change(id: string, patch: Partial<PropertyOption>) {
    setOptions((current) => current.map((option) => (option.id === id ? { ...option, ...patch } : option)));
  }

  function add(event: FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    if (options.some((option) => option.name.toLowerCase() === name.toLowerCase())) {
      return setError("Já existe uma opção com esse nome.");
    }
    const color = ACCENT_COLORS[options.length % ACCENT_COLORS.length].value;
    setOptions((current) => [...current, { id: newOptionId(), name, color, ...(isStatus ? { group: "todo" as const } : {}) }]);
    setDraft("");
    setError(null);
  }

  async function save() {
    const cleaned = options.map((option) => ({ ...option, name: option.name.trim() }));
    if (cleaned.some((option) => !option.name)) return setError("Toda opção precisa de um nome.");
    if (saving) return;
    setSaving(true);
    const message = await commands.updateProperty(property.id, { options: cleaned }, false);
    setSaving(false);
    if (message) setError(message);
    else onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title={`Opções de “${property.name}”`}
      description={isStatus ? "O painel do topo conta as linhas em “Concluído” sobre o total." : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving} onClick={() => void save()}>
            Salvar opções
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {options.length === 0 ? <p className="text-sm text-muted">Nenhuma opção ainda.</p> : null}
        <ul className="flex flex-col gap-3">
          {options.map((option, index) => (
            <li key={option.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <OptionPill option={option} className="max-w-40" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto hover:text-danger"
                  aria-label={`Remover opção ${option.name}`}
                  onClick={() => setOptions((current) => current.filter((item) => item.id !== option.id))}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
                <Input
                  aria-label={`Nome da opção ${index + 1}`}
                  value={option.name}
                  maxLength={60}
                  onChange={(event) => change(option.id, { name: event.target.value })}
                  className="h-9"
                />
                <Select
                  aria-label={`Cor da opção ${option.name}`}
                  value={option.color}
                  onChange={(event) => change(option.id, { color: event.target.value })}
                  className="h-9"
                >
                  {ACCENT_COLORS.some((color) => color.value === option.color) ? null : (
                    <option value={option.color}>Cor atual</option>
                  )}
                  {ACCENT_COLORS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.name}
                    </option>
                  ))}
                </Select>
                {isStatus ? (
                  <Select
                    aria-label={`Grupo da opção ${option.name}`}
                    value={option.group ?? "todo"}
                    onChange={(event) => change(option.id, { group: event.target.value as StatusGroup })}
                    className="h-9"
                  >
                    {STATUS_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {STATUS_GROUP_LABELS[group]}
                      </option>
                    ))}
                  </Select>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={add} className="flex gap-2">
          <Input
            aria-label="Nova opção"
            placeholder="Nova opção"
            value={draft}
            maxLength={60}
            onChange={(event) => setDraft(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "options-error" : undefined}
            className="h-9"
          />
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            <Plus aria-hidden />
            Adicionar
          </Button>
        </form>
        {error ? (
          <p id="options-error" role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
