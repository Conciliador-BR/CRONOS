import { ArrowLeft, Pencil, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { isManager, requireMember } from "@/lib/auth";
import { CourseAdmin } from "@/features/operacional/cursos/components/course-admin";
import { CourseCover } from "@/features/operacional/cursos/components/course-cover";
import { CourseOutline } from "@/features/operacional/cursos/components/course-outline";
import { ProgressBar } from "@/features/operacional/cursos/components/progress-bar";
import { courseProgress, nextLessonId } from "@/features/operacional/cursos/progress";
import { getCourse } from "@/features/operacional/cursos/queries";

export const metadata: Metadata = { title: "Curso · Cursos" };

export default async function Page(props: PageProps<"/operacional/cursos/[courseId]">) {
  const [{ courseId }, searchParams] = await Promise.all([props.params, props.searchParams]);
  if (!z.uuid().safeParse(courseId).success) notFound();
  const [profile, course] = await Promise.all([requireMember(), getCourse(courseId)]);
  if (!course) notFound();
  const manager = isManager(profile);
  const editing = manager && searchParams.modo === "editar";
  const progress = courseProgress(course.modules, course.completedIds);
  const next = nextLessonId(course.modules, course.completedIds);
  const base = `/operacional/cursos/${course.id}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/operacional/cursos" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft aria-hidden />
          Cursos
        </Link>
        {manager ? (
          <Link href={editing ? base : `${base}?modo=editar`} className={buttonVariants({ variant: "secondary", size: "sm", className: "ml-auto" })}>
            {editing ? <PlayCircle aria-hidden /> : <Pencil aria-hidden />}
            {editing ? "Ver como aluno" : "Gerenciar curso"}
          </Link>
        ) : null}
      </div>
      {editing ? (
        <>
          <h1 className="mb-6 text-2xl font-semibold tracking-tight">Gerenciar: {course.title}</h1>
          <CourseAdmin course={course} />
        </>
      ) : (
        <>
          <section className="mb-8 grid gap-6 overflow-hidden rounded-2xl border border-border bg-surface md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <CourseCover id={course.id} title={course.title} coverUrl={course.coverUrl} />
            <div className="flex flex-col gap-3 p-5 md:py-6 md:pr-6 md:pl-0">
              <div className="flex items-start gap-2">
                <h1 className="flex-1 text-2xl font-semibold tracking-tight text-balance">{course.title}</h1>
                {course.published ? null : <Badge variant="warning">Rascunho</Badge>}
              </div>
              {course.description ? <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{course.description}</p> : null}
              <div className="mt-auto flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>
                    {progress.done} de {progress.total} aulas concluídas
                  </span>
                  <span className="tabular-nums">{progress.percent}%</span>
                </div>
                <ProgressBar percent={progress.percent} label="Progresso no curso" />
                {next ? (
                  <Link href={`${base}/aulas/${next}`} className={buttonVariants({ className: "mt-2 self-start" })}>
                    <PlayCircle aria-hidden />
                    {progress.done === 0 ? "Começar curso" : progress.done === progress.total ? "Rever curso" : "Continuar"}
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
          <h2 className="mb-3 text-base font-semibold">Conteúdo do curso</h2>
          <CourseOutline courseId={course.id} modules={course.modules} completedIds={course.completedIds} />
        </>
      )}
    </>
  );
}
