"use client";

import { Check, Search } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { CompanyOption } from "../../types";
import { useSheet } from "../sheet-context";
import { menuItemClass, useAnchoredPopover } from "../use-anchored-popover";
import { cellTriggerClass } from "./cell-styles";

const LIMIT = 50;

/** "Matriz · Goiânia/GO": diferencia matriz e filiais que têm o mesmo nome. */
export function companyDetail(company: CompanyOption) {
  return `${company.kind} · ${company.city ? `${company.city}/${company.uf}` : company.uf}`;
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Coluna Empresa: combobox com busca nas empresas cadastradas (nome + UF). */
export function CompanyCell({
  companyId,
  label,
  onCommit,
}: {
  companyId: string | null;
  label: string;
  onCommit: (companyId: string | null) => void;
}) {
  const { meta } = useSheet();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { triggerRef, triggerProps, popoverProps, close } = useAnchoredPopover({
    width: 340,
    focusSelector: "input",
    onClose: () => {
      setQuery("");
      setActive(0);
    },
  });
  const company = companyId ? meta.companiesById.get(companyId) : undefined;

  const search = normalize(query.trim());
  const matches = meta.companies.filter((item) => normalize(`${item.name} ${companyDetail(item)}`).includes(search));
  const shown = matches.slice(0, LIMIT);
  const activeIndex = Math.min(active, Math.max(0, shown.length - 1));

  function pick(id: string | null) {
    close();
    if (id !== companyId) onCommit(id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (shown.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + step + shown.length) % shown.length;
      setActive(next);
      document.getElementById(`${listId}-${shown[next].id}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && shown[activeIndex]) {
      event.preventDefault();
      pick(shown[activeIndex].id);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        {...triggerProps}
        aria-haspopup="dialog"
        aria-label={`${label}: ${company ? `${company.name}, ${companyDetail(company)}` : "nenhuma empresa"}`}
        className={cn(cellTriggerClass, "font-medium")}
      >
        {company ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate">{company.name}</span>
            <span className="shrink-0 text-xs font-normal text-muted">{companyDetail(company)}</span>
          </span>
        ) : (
          <span className="text-muted/60">Escolher empresa</span>
        )}
      </button>
      <div {...popoverProps} role="dialog" aria-label={`Escolher empresa: ${label}`}>
        <div className="relative mb-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={shown[activeIndex] ? `${listId}-${shown[activeIndex].id}` : undefined}
            aria-label="Buscar empresa"
            placeholder="Buscar empresa…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="h-8 w-full rounded-md border border-border bg-surface-2 pr-2 pl-8 text-sm text-fg placeholder:text-muted/70 focus-visible:border-ring focus-visible:outline-none"
          />
        </div>
        <ul id={listId} role="listbox" aria-label="Empresas" className="flex flex-col">
          {shown.map((item, index) => (
            <li
              key={item.id}
              id={`${listId}-${item.id}`}
              role="option"
              aria-selected={item.id === companyId}
              onClick={() => pick(item.id)}
              onMouseEnter={() => setActive(index)}
              className={cn(menuItemClass, "cursor-pointer", index === activeIndex && "bg-surface-3")}
            >
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <span className="shrink-0 text-xs text-muted">{companyDetail(item)}</span>
              {item.id === companyId ? <Check aria-hidden className="size-4 shrink-0 text-ring" /> : null}
            </li>
          ))}
        </ul>
        {shown.length === 0 ? <p className="px-2.5 py-2 text-sm text-muted">Nenhuma empresa encontrada.</p> : null}
        {matches.length > LIMIT ? (
          <p className="px-2.5 py-1 text-xs text-muted">Mostrando {LIMIT} de {matches.length}. Refine a busca.</p>
        ) : null}
        {companyId ? (
          <button type="button" onClick={() => pick(null)} className={cn(menuItemClass, "mt-1 border-t border-border text-muted")}>
            Remover empresa
          </button>
        ) : null}
      </div>
    </>
  );
}
