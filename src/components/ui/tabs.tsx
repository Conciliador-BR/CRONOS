"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  value: string;
  label: ReactNode;
  /** Conteúdo do painel. Omita para usar as abas só como seletor (controlado). */
  content?: ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  /** Nome acessível da lista de abas. */
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
};

/** Abas acessíveis (padrão WAI-ARIA): setas, Home/End, ativação automática. */
export function Tabs({
  items,
  label,
  value,
  defaultValue,
  onValueChange,
  className,
  listClassName,
}: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const current = value ?? internal;
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const enabled = items.filter((item) => !item.disabled);

  function select(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = enabled.findIndex((item) => item.value === current);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % enabled.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = enabled.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = enabled[nextIndex].value;
    select(next);
    tabRefs.current.get(next)?.focus();
  }

  const active = items.find((item) => item.value === current);

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn(
          "flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]",
          listClassName,
        )}
      >
        {items.map((item) => {
          const selected = item.value === current;
          return (
            <button
              key={item.value}
              ref={(node) => {
                if (node) tabRefs.current.set(item.value, node);
                else tabRefs.current.delete(item.value);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={item.content !== undefined ? `${baseId}-panel-${item.value}` : undefined}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.value)}
              className={cn(
                "relative -mb-px inline-flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
                "focus-visible:outline-offset-[-2px] disabled:opacity-40",
                selected
                  ? "border-primary text-fg"
                  : "border-transparent text-muted hover:border-surface-3 hover:text-fg",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active && active.content !== undefined ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.value}`}
          aria-labelledby={`${baseId}-tab-${active.value}`}
          tabIndex={0}
          className="pt-4 focus-visible:outline-offset-4"
        >
          {active.content}
        </div>
      ) : null}
    </div>
  );
}
