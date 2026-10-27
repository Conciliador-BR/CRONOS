"use client";

import { useDeferredValue, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UF_NAMES, toUf, type Uf } from "../brazil-states";
import { companiesToGeoJson } from "../geo";
import { companiesLabel, groupByUf, marketLabel, searchCompanies, type CompanySummary } from "../map-utils";
import { CompanyMap, type MapCommand } from "./company-map";
import { ExplorerPanel } from "./explorer-panel";

type ExplorerProps = {
  companies: CompanySummary[];
  initialUf: Uf | null;
  activeCompanyId: string | null;
};

type CommandInput = MapCommand extends infer C ? (C extends unknown ? Omit<C, "key"> : never) : never;

/** Mapa (MapLibre) + painel lateral (busca, resumo e mercados do estado). */
export function EmpresasExplorer({ companies, initialUf, activeCompanyId }: ExplorerProps) {
  const router = useRouter();
  const [selectedUf, setSelectedUf] = useState<Uf | null>(initialUf);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [command, setCommand] = useState<MapCommand | null>(null);
  const commandKey = useRef(0);

  const groups = useMemo(() => groupByUf(companies), [companies]);
  const ranking = useMemo(
    () => [...groups.entries()].map(([uf, list]) => ({ uf, count: list.length })).sort((a, b) => b.count - a.count),
    [groups],
  );
  const results = useMemo(() => searchCompanies(companies, deferredQuery), [companies, deferredQuery]);
  const geo = useMemo(() => companiesToGeoJson(companies), [companies]);
  const byId = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const parentNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const c of companies) if (c.parentId && byId.has(c.parentId)) names.set(c.parentId, marketLabel(byId.get(c.parentId)!));
    return names;
  }, [companies, byId]);

  function send(next: CommandInput) {
    commandKey.current += 1;
    setCommand({ ...next, key: commandKey.current } as MapCommand);
  }

  function selectUf(uf: Uf | null) {
    setSelectedUf(uf);
    // Mantém a UF na URL sem nova requisição (permite compartilhar o link).
    window.history.replaceState(null, "", uf ? `/empresas?uf=${uf}` : "/empresas");
    send(uf ? { kind: "uf", uf } : { kind: "brazil" });
  }

  function openCompany(company: CompanySummary) {
    const uf = toUf(company.uf) ?? selectedUf;
    if (uf && uf !== selectedUf) setSelectedUf(uf);
    setPendingId(company.id);
    startTransition(() => {
      router.push(`/empresas?${uf ? `uf=${uf}&` : ""}empresa=${company.id}`, { scroll: false });
    });
  }

  /** Clique no pino: o mapa já está no lugar, só abre o card. */
  function openFromMap(id: string) {
    const company = byId.get(id);
    if (company) openCompany(company);
  }

  /** Clique na lista: voa até o pino e abre o card. */
  function openFromList(id: string) {
    const company = byId.get(id);
    if (!company) return;
    send({ kind: "company", id });
    openCompany(company);
  }

  const stateCompanies = selectedUf ? (groups.get(selectedUf) ?? []) : [];
  const searching = deferredQuery.trim().length > 0;
  const exact = companies.length - geo.approximateCount - geo.unplaced.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
      <Card className="flex min-w-0 flex-col gap-3 p-3 sm:p-4">
        <CompanyMap
          collection={geo.collection}
          initialUf={initialUf}
          selectedUf={selectedUf}
          activeCompanyId={activeCompanyId}
          command={command}
          onSelectUf={(uf) => selectUf(uf)}
          onOpenCompany={openFromMap}
        />
        <div className="flex flex-col gap-2 px-1 text-xs text-muted">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label="Legenda do mapa">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-ring shadow-[0_0_8px_2px_rgb(56_189_248/0.6)]" />
              Local exato
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full border-2 border-ring" />
              Local aproximado (sem coordenadas)
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-fg">
                3
              </span>
              Grupo: clique para aproximar
            </li>
          </ul>
          <p>Role o mouse ou use + e − para aproximar até a rua. Clique num estado para entrar nele.</p>
          {geo.approximateCount > 0 ? (
            <p>
              {companiesLabel(geo.approximateCount)} sem coordenadas {geo.approximateCount === 1 ? "aparece" : "aparecem"} perto
              do centro do estado. Em Configurações → Empresas, use “Localizar no mapa”.
            </p>
          ) : null}
          {geo.unplaced.length > 0 ? <p>{companiesLabel(geo.unplaced.length)} sem localização (UF inválida).</p> : null}
        </div>
      </Card>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            aria-label="Buscar empresa"
            placeholder="Buscar mercado, cidade, cliente ou CNPJ…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <dl className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-surface px-3 py-3">
            <dt className="text-xs text-muted">Empresas</dt>
            <dd className="text-2xl font-semibold text-fg tabular-nums">{companies.length}</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface px-3 py-3">
            <dt className="text-xs text-muted">Estados</dt>
            <dd className="text-2xl font-semibold text-fg tabular-nums">{groups.size}</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface px-3 py-3">
            <dt className="text-xs text-muted">No local exato</dt>
            <dd className="text-2xl font-semibold text-fg tabular-nums">{exact}</dd>
          </div>
        </dl>

        <p className="sr-only" aria-live="polite">
          {searching
            ? `${companiesLabel(results.length)} encontradas`
            : selectedUf
              ? `${UF_NAMES[selectedUf]}: ${companiesLabel(stateCompanies.length)}`
              : ""}
        </p>
        <ExplorerPanel
          searching={searching}
          results={results}
          selectedUf={selectedUf}
          stateCompanies={stateCompanies}
          ranking={ranking}
          pendingId={isPending ? pendingId : null}
          activeId={activeCompanyId}
          parentNames={parentNames}
          onOpen={openFromList}
          onSelectUf={(uf) => selectUf(uf)}
          onClearUf={() => selectUf(null)}
        />
      </div>
    </div>
  );
}
