"use client";

import { Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { Member } from "../../../shared/types";
import type { CellValue } from "../../types";
import { useSheet } from "../sheet-context";
import { menuItemClass, onRovingKeyDown, useAnchoredPopover } from "../use-anchored-popover";
import { cellTriggerClass } from "./cell-styles";

/** Pessoas (membros da equipe) com avatar; várias por célula. */
export function PersonCell({
  value,
  label,
  onCommit,
}: {
  value: CellValue | null;
  label: string;
  onCommit: (value: CellValue | null) => void;
}) {
  const { meta } = useSheet();
  const { triggerRef, triggerProps, popoverProps } = useAnchoredPopover({ width: 260, focusSelector: ['[role="option"][aria-selected="true"]', '[role="option"]'] });
  const selected = Array.isArray(value) ? value : [];
  const people = selected.map((id) => meta.membersById.get(id)).filter((member): member is Member => Boolean(member));

  function toggle(id: string) {
    const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    onCommit(next.length ? next : null);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        {...triggerProps}
        aria-haspopup="listbox"
        aria-label={`${label}: ${people.map((member) => member.name).join(", ") || "vazio"}`}
        className={cellTriggerClass}
      >
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          {people.map((member) => (
            <span key={member.id} className="flex min-w-0 items-center gap-1.5">
              <Avatar name={member.name} src={member.avatarUrl} size="xs" />
              {people.length === 1 ? <span className="truncate">{member.name}</span> : null}
            </span>
          ))}
        </span>
      </button>
      <div {...popoverProps} onKeyDown={(event) => onRovingKeyDown(event)}>
        <div role="listbox" aria-label={label} aria-multiselectable>
          {meta.members.map((member) => {
            const isSelected = selected.includes(member.id);
            return (
              <div
                key={member.id}
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                onClick={() => toggle(member.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggle(member.id);
                  }
                }}
                className={`${menuItemClass} cursor-pointer`}
              >
                <Avatar name={member.name} src={member.avatarUrl} size="xs" />
                <span className="truncate">{member.name}</span>
                {isSelected ? <Check aria-hidden className="ml-auto size-4 shrink-0 text-ring" /> : null}
              </div>
            );
          })}
        </div>
        {meta.members.length === 0 ? <p className="px-2.5 py-2 text-sm text-muted">Nenhum membro ativo.</p> : null}
      </div>
    </>
  );
}
