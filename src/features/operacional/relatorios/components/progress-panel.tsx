"use client";

import { computeOverallProgress } from "../progress";
import { PeopleProgressCard } from "./people-progress-card";
import { useSheet } from "./sheet-context";

const SEGMENTS = [
  { key: "done", label: "concluídas", className: "bg-success" },
  { key: "doing", label: "em andamento", className: "bg-primary" },
  { key: "todo", label: "a fazer", className: "bg-surface-3" },
] as const;

/**
 * Uma barra só para a semana: soma todas as colunas Status (cada célula é uma tarefa).
 * Recalcula do estado otimista (muda na hora).
 */
export function ProgressPanel() {
  const { state } = useSheet();
  const item = computeOverallProgress(state.properties, state.rows);
  if (!item) return null;
  const summary = `${item.done} de ${item.total} tarefas concluídas`;
  const columns = item.columns === 1 ? "1 coluna Status" : `${item.columns} colunas Status`;

  return (
    <section aria-labelledby="report-progress-title" className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="report-progress-title" className="truncate text-sm font-medium text-fg">
              Concluído na semana
            </h2>
            <p className="text-xs text-muted">
              {summary} · {columns}
            </p>
          </div>
          <p className="text-3xl font-semibold text-fg tabular-nums">{item.percent}%</p>
        </div>
        <div
          role="progressbar"
          aria-label="Concluído na semana"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={item.percent}
          aria-valuetext={`${item.percent}%: ${summary}, ${item.doing} em andamento, ${item.todo} a fazer`}
          className="flex h-2 overflow-hidden rounded-full bg-surface-2"
        >
          {item.total > 0
            ? SEGMENTS.map((segment) =>
                item[segment.key] > 0 ? (
                  <span
                    key={segment.key}
                    className={`${segment.className} h-full transition-[width] motion-reduce:transition-none`}
                    style={{ width: `${(item[segment.key] / item.total) * 100}%` }}
                  />
                ) : null,
              )
            : null}
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted" aria-hidden>
          {SEGMENTS.map((segment) => (
            <li key={segment.key} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${segment.className}`} />
              {item[segment.key]} {segment.label}
            </li>
          ))}
        </ul>
      </article>
      <PeopleProgressCard />
    </section>
  );
}
