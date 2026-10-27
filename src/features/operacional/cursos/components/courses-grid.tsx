import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { progressPercent } from "../progress";
import type { CourseCard } from "../types";
import { CourseCover } from "./course-cover";
import { ProgressBar } from "./progress-bar";

/** Vitrine de cursos (capa, módulos/aulas e progresso). */
export function CoursesGrid({ courses, canManage }: { courses: CourseCard[]; canManage: boolean }) {
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Nenhum curso disponível"
        description={canManage ? "Crie o primeiro curso em “Novo curso”." : "Quando um gestor publicar um curso, ele aparece aqui."}
      />
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {courses.map((course) => {
        const percent = progressPercent(course.completedCount, course.lessonCount);
        return (
          <li key={course.id}>
            <Link
              href={`/operacional/cursos/${course.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 motion-reduce:hover:translate-y-0"
            >
              <CourseCover id={course.id} title={course.title} coverUrl={course.coverUrl} />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start gap-2">
                  <h2 className="line-clamp-2 flex-1 font-semibold text-fg">{course.title}</h2>
                  {course.published ? null : <Badge variant="warning">Rascunho</Badge>}
                </div>
                {course.description ? <p className="line-clamp-2 text-sm text-muted">{course.description}</p> : null}
                <p className="mt-auto text-xs text-muted">
                  {course.moduleCount} {course.moduleCount === 1 ? "módulo" : "módulos"} · {course.lessonCount}{" "}
                  {course.lessonCount === 1 ? "aula" : "aulas"}
                </p>
                <div className="flex items-center gap-2">
                  <ProgressBar percent={percent} label={`Progresso em ${course.title}`} className="flex-1" />
                  <span className="w-10 text-right text-xs text-muted tabular-nums">{percent}%</span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
