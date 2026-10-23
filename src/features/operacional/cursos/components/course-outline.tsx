import { CheckCircle2, ChevronDown, Circle, PlayCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CourseModule } from "../types";

/** Módulos em acordeão (details/summary nativo) com a lista de aulas. */
export function CourseOutline({
  courseId,
  modules,
  completedIds,
  currentLessonId,
}: {
  courseId: string;
  modules: CourseModule[];
  completedIds: string[];
  currentLessonId?: string;
}) {
  const completed = new Set(completedIds);
  if (modules.length === 0) return <p className="text-sm text-muted">Este curso ainda não tem módulos.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {modules.map((module, index) => {
        const done = module.lessons.filter((lesson) => completed.has(lesson.id)).length;
        const containsCurrent = module.lessons.some((lesson) => lesson.id === currentLessonId);
        return (
          <li key={module.id}>
            <details open={currentLessonId ? containsCurrent : index === 0} className="group rounded-xl border border-border bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-3 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted">Módulo {index + 1}</span>
                  <span className="block font-medium text-fg">{module.title}</span>
                </span>
                <span className="text-xs text-muted tabular-nums">
                  {done}/{module.lessons.length}
                </span>
                <ChevronDown aria-hidden className="size-4 text-muted transition-transform group-open:rotate-180" />
              </summary>
              {module.lessons.length === 0 ? (
                <p className="px-4 pb-3 text-sm text-muted">Sem aulas ainda.</p>
              ) : (
                <ol className="border-t border-border py-1">
                  {module.lessons.map((lesson) => {
                    const current = lesson.id === currentLessonId;
                    const isDone = completed.has(lesson.id);
                    const Icon = isDone ? CheckCircle2 : current ? PlayCircle : Circle;
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/operacional/cursos/${courseId}/aulas/${lesson.id}`}
                          aria-current={current ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                            current ? "bg-primary/15 text-fg shadow-[inset_3px_0_0_var(--primary)]" : "text-muted hover:bg-surface-2 hover:text-fg",
                          )}
                        >
                          <Icon aria-hidden className={cn("size-4 shrink-0", isDone ? "text-success" : current ? "text-ring" : "")} />
                          <span className="min-w-0 flex-1">{lesson.title}</span>
                          {isDone ? <span className="sr-only">(concluída)</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </details>
          </li>
        );
      })}
    </ol>
  );
}
