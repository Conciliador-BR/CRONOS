"use client";

import { Medal } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { computePeopleProgress } from "../progress";
import { useSheet } from "./sheet-context";

const MEDALS = [
  { label: "medalha de ouro", className: "text-[#eab308]" },
  { label: "medalha de prata", className: "text-[#94a3b8]" },
  { label: "medalha de bronze", className: "text-[#c2410c]" },
];

/** Ranking de desempenho: % das tarefas (células de Status) concluídas nas linhas de cada pessoa. */
export function PeopleProgressCard() {
  const { state, meta } = useSheet();
  const people = computePeopleProgress(state.properties, state.rows);
  if (people.length === 0) return null;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <h3 className="text-sm font-medium text-fg">Pessoas</h3>
        <p className="text-xs text-muted">Tarefas de Status concluídas nas linhas de cada pessoa</p>
      </div>
      <ol className="flex max-h-64 flex-col gap-2.5 overflow-y-auto">
        {people.map((person, index) => {
          const name = meta.membersById.get(person.personId)?.name ?? "Pessoa removida";
          const summary = `${person.done} de ${person.total} concluídas`;
          return (
            <li key={person.personId} className="flex items-center gap-3">
              <span className="flex w-6 shrink-0 justify-center text-xs text-muted tabular-nums">
                {MEDALS[index] ? (
                  <Medal role="img" aria-label={`${index + 1}º, ${MEDALS[index].label}`} className={`size-5 ${MEDALS[index].className}`} />
                ) : (
                  `${index + 1}º`
                )}
              </span>
              <Avatar name={name} src={meta.membersById.get(person.personId)?.avatarUrl} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm text-fg">{name}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {summary} · {person.rows} {person.rows === 1 ? "linha" : "linhas"}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={name}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={person.percent}
                  aria-valuetext={`${person.percent}%: ${summary}, ${person.doing} em andamento, ${person.todo} a fazer`}
                  className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-surface-2"
                >
                  <span className="h-full bg-success" style={{ width: `${(person.done / person.total) * 100}%` }} />
                  <span className="h-full bg-primary" style={{ width: `${(person.doing / person.total) * 100}%` }} />
                </div>
              </div>
              <span className="w-11 text-right text-sm font-semibold text-fg tabular-nums">{person.percent}%</span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
