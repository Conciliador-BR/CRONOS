"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { Member } from "../../shared/types";

/** Lista de funcionários com caixas de seleção e busca. */
export function AttendeePicker({
  members,
  value,
  onChange,
}: {
  members: Member[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = new Set(value);
  const term = query.trim().toLocaleLowerCase("pt-BR");
  const options = term ? members.filter((m) => m.name.toLocaleLowerCase("pt-BR").includes(term)) : members;

  function toggle(id: string) {
    onChange(selected.has(id) ? value.filter((item) => item !== id) : [...value, id]);
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium text-fg">
        Convidados <span className="font-normal text-muted">({value.length})</span>
      </legend>
      <Input
        aria-label="Buscar convidados"
        placeholder="Buscar funcionários"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-9"
      />
      <ul className="flex max-h-44 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border p-1">
        {options.length === 0 ? <li className="p-2 text-sm text-muted">Nenhum funcionário encontrado.</li> : null}
        {options.map((member) => (
          <li key={member.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-sm hover:bg-surface-2">
              <input
                type="checkbox"
                checked={selected.has(member.id)}
                onChange={() => toggle(member.id)}
                className="size-4 accent-[var(--primary)]"
              />
              <Avatar name={member.name} src={member.avatarUrl} size="xs" />
              <span className="truncate">{member.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
