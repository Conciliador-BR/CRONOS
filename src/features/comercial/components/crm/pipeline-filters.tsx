"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LEAD_SOURCES, LEAD_TEMPERATURES, SOURCE_LABELS, TEMPERATURE_LABELS, type LeadSource, type LeadTemperature } from "../../constants";
import { EMPTY_FILTERS, hasActiveFilters, type PipelineFilters } from "../../lib/pipeline";
import type { MemberOption } from "../../types";

type Props = {
  filters: PipelineFilters;
  onChange: (filters: PipelineFilters) => void;
  members: MemberOption[];
  visibleCount: number;
  totalCount: number;
};

export function PipelineFiltersBar({ filters, onChange, members, visibleCount, totalCount }: Props) {
  const active = hasActiveFilters(filters);
  const set = <K extends keyof PipelineFilters>(key: K, value: PipelineFilters[K]) => onChange({ ...filters, [key]: value });

  return (
    <div role="search" aria-label="Filtrar leads" className="flex flex-col gap-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,2fr)_repeat(3,minmax(9rem,1fr))_auto]">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            aria-label="Buscar por nome, empresa, contato ou indicador"
            placeholder="Buscar lead…"
            value={filters.query}
            onChange={(event) => set("query", event.target.value)}
            className="pl-9"
            autoComplete="off"
          />
        </div>
        <Select aria-label="Responsável" value={filters.ownerId} onChange={(event) => set("ownerId", event.target.value)}>
          <option value="">Todos os responsáveis</option>
          <option value="none">Sem responsável</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Temperatura"
          value={filters.temperature}
          onChange={(event) => set("temperature", event.target.value as LeadTemperature | "")}
        >
          <option value="">Quentes e frios</option>
          {LEAD_TEMPERATURES.map((value) => (
            <option key={value} value={value}>
              {TEMPERATURE_LABELS[value]}
            </option>
          ))}
        </Select>
        <Select aria-label="Origem" value={filters.source} onChange={(event) => set("source", event.target.value as LeadSource | "")}>
          <option value="">Todas as origens</option>
          {LEAD_SOURCES.map((value) => (
            <option key={value} value={value}>
              {SOURCE_LABELS[value]}
            </option>
          ))}
        </Select>
        {active ? (
          <Button variant="ghost" onClick={() => onChange(EMPTY_FILTERS)}>
            <X aria-hidden className="size-4" />
            Limpar
          </Button>
        ) : null}
      </div>
      <p aria-live="polite" className="text-xs text-muted">
        {active ? `${visibleCount} de ${totalCount} leads com estes filtros` : `${totalCount} leads no pipeline`}
      </p>
    </div>
  );
}
