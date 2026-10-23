"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, MapPinned, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { UF_NAMES, type Uf } from "../brazil-states";
import { companiesLabel, groupByUf, searchCompanies, type CompanySummary } from "../map-utils";
import { BrazilMap } from "./brazil-map";
import { MapLegend } from "./map-legend";
import { MarketList } from "./market-list";

type ExplorerProps = {
  companies: CompanySummary[];
  initialUf: Uf | null;
  activeCompanyId: string | null;
};

/** Mapa + painel lateral (resumo, mercados do estado ou resultados da busca). */
export function EmpresasExplorer({ companies, initialUf, activeCompanyId }: ExplorerProps) {
  const router = useRouter();
  const [selectedUf, setSelectedUf] = useState<Uf | null>(initialUf);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const groups = useMemo(() => groupByUf(companies), [companies]);
  const counts = useMemo(() => {
    const result: Partial<Record<Uf, number>> = {};
    for (const [uf, list] of groups) result[uf] = list.length;
    return result;
  }, [groups]);
  const ranking = useMemo(
    () => [...groups.entries()].map(([uf, list]) => ({ uf, count: list.length })).sort((a, b) => b.count - a.count),
    [groups],
  );
  const max = ranking[0]?.count ?? 0;
  const results = useMemo(() => searchCompanies(companies, deferredQuery), [companies, deferredQuery]);

  function selectUf(uf: Uf | null) {
    setSelectedUf(uf);
    // Mantém a UF na URL sem nova requisição (permite compartilhar o link).
    window.history.replaceState(null, "", uf ? `/empresas?uf=${uf}` : "/empresas");
  }

  function openCompany(company: CompanySummary) {
    const uf = selectedUf ?? company.uf;
    setPendingId(company.id);
    startTransition(() => {
      router.push(`/empresas?uf=${uf}&empresa=${company.id}`, { scroll: false });
    });
  }

  const byId = (id: string) => companies.find((c) => c.id === id);
  const onOpen = (id: string) => {
    const company = byId(id);
    if (company) openCompany(company);
  };
  const shownPendingId = isPending ? pendingId : null;
  const stateCompanies = selectedUf ? (groups.get(selectedUf) ?? []) : [];
  const searching = deferredQuery.trim().length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
      <Card className="flex flex-col gap-4 p-4 sm:p-6">
        <BrazilMap counts={counts} max={max} selectedUf={selectedUf} onSelect={selectUf} />
        <MapLegend max={max} />
        <p className="text-[11px] text-muted">
          Mapa:{" "}
          <a
            className="underline underline-offset-2 hover:text-fg"
            href="https://github.com/VictorCazanave/svg-maps/tree/master/packages/brazil"
            target="_blank"
            rel="noreferrer"
          >
            @svg-maps/brazil
          </a>{" "}
          (Victor Cazanave), baseado em{" "}
          <a className="underline underline-offset-2 hover:text-fg" href="https://mapsvg.com/maps/brazil" target="_blank" rel="noreferrer">
            MapSVG
          </a>
          , licença{" "}
          <a
            className="underline underline-offset-2 hover:text-fg"
            href="https://creativecommons.org/licenses/by/4.0/deed.pt-br"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          . Cores e interação adaptadas.
        </p>
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

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <dt className="text-xs text-muted">Empresas cadastradas</dt>
            <dd className="text-2xl font-semibold text-fg tabular-nums">{companies.length}</dd>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <dt className="text-xs text-muted">Estados atendidos</dt>
            <dd className="text-2xl font-semibold text-fg tabular-nums">{groups.size}</dd>
          </div>
        </dl>

        <p className="sr-only" aria-live="polite">
          {searching
            ? `${companiesLabel(results.length)} encontradas`
            : selectedUf
              ? `${UF_NAMES[selectedUf]}: ${companiesLabel(stateCompanies.length)}`
              : ""}
        </p>
        <Card>
          {searching ? (
            <>
              <CardHeader>
                <CardTitle as="h2">Resultados da busca</CardTitle>
                <p className="text-sm text-muted">{companiesLabel(results.length)}</p>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <EmptyState icon={SearchX} title="Nada encontrado" description="Tente outro nome, cidade ou CNPJ." />
                ) : (
                  <MarketList companies={results} withUf pendingId={shownPendingId} activeId={activeCompanyId} onOpen={onOpen} />
                )}
              </CardContent>
            </>
          ) : selectedUf ? (
            <>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle as="h2">{UF_NAMES[selectedUf]}</CardTitle>
                    <p className="text-sm text-muted">Mercados atendidos · {companiesLabel(stateCompanies.length)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => selectUf(null)}>
                    <ArrowLeft aria-hidden />
                    Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stateCompanies.length === 0 ? (
                  <EmptyState
                    icon={MapPinned}
                    title="Nenhum mercado neste estado"
                    description="Empresas cadastradas em Configurações aparecem aqui."
                  />
                ) : (
                  <MarketList
                    companies={stateCompanies}
                    pendingId={shownPendingId}
                    activeId={activeCompanyId}
                    onOpen={onOpen}
                  />
                )}
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle as="h2">Estados atendidos</CardTitle>
                <p className="text-sm text-muted">Clique num estado no mapa ou na lista para ver os mercados.</p>
              </CardHeader>
              <CardContent>
                {ranking.length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    title="Nenhuma empresa cadastrada"
                    description="Administradores e gestores cadastram empresas em Configurações → Empresas."
                  />
                ) : (
                  <ul className="flex flex-col gap-1">
                    {ranking.map(({ uf, count }) => (
                      <li key={uf}>
                        <button
                          type="button"
                          onClick={() => selectUf(uf)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2"
                        >
                          <span className="text-fg">{UF_NAMES[uf]}</span>
                          <span className="text-muted tabular-nums">{companiesLabel(count)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
