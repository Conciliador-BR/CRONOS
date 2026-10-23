import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { buttonVariants } from "@/components/ui/button-variants";
import { CompleteToggle } from "@/features/operacional/cursos/components/complete-toggle";
import { CourseOutline } from "@/features/operacional/cursos/components/course-outline";
import { LessonPlayer } from "@/features/operacional/cursos/components/lesson-player";
import { ProgressBar } from "@/features/operacional/cursos/components/progress-bar";
import { courseProgress, flattenLessons, lessonNeighbors } from "@/features/operacional/cursos/progress";
import { getCourse, getVideoSignedUrl } from "@/features/operacional/cursos/queries";

export const metadata: Metadata = { title: "Aula · Cursos" };

export default async function Page(props: PageProps<"/operacional/cursos/[courseId]/aulas/[lessonId]">) {
  const { courseId, lessonId } = await props.params;
  if (!z.uuid().safeParse(courseId).success || !z.uuid().safeParse(lessonId).success) notFound();
  const course = await getCourse(courseId);
  const lesson = course ? flattenLessons(course.modules).find((item) => item.id === lessonId) : undefined;
  if (!course || !lesson) notFound();
  const signedUrl = lesson.source === "upload" && lesson.videoPath ? await getVideoSignedUrl(lesson.videoPath) : null;
  const { previous, next, index, total } = lessonNeighbors(course.modules, lesson.id);
  const progress = courseProgress(course.modules, course.completedIds);
  const base = `/operacional/cursos/${course.id}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Link href={base} className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
          <ArrowLeft aria-hidden />
          {course.title}
        </Link>
        <LessonPlayer lesson={lesson} signedUrl={signedUrl} />
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">
              Aula {index + 1} de {total}
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-balance">{lesson.title}</h1>
          </div>
          <CompleteToggle key={lesson.id} lessonId={lesson.id} completed={course.completedIds.includes(lesson.id)} />
        </div>
        {lesson.description ? <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{lesson.description}</p> : null}
        <nav aria-label="Navegação entre aulas" className="flex justify-between gap-2 border-t border-border pt-4">
          {previous ? (
            <Link href={`${base}/aulas/${previous.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <ChevronLeft aria-hidden />
              Anterior
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`${base}/aulas/${next.id}`} className={buttonVariants({ size: "sm" })}>
              Próxima aula
              <ChevronRight aria-hidden />
            </Link>
          ) : null}
        </nav>
      </div>
      <aside aria-label="Conteúdo do curso" className="flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 flex justify-between text-xs text-muted">
            <span>Seu progresso</span>
            <span className="tabular-nums">{progress.percent}%</span>
          </p>
          <ProgressBar percent={progress.percent} label="Progresso no curso" />
        </div>
        <CourseOutline courseId={course.id} modules={course.modules} completedIds={course.completedIds} currentLessonId={lesson.id} />
      </aside>
    </div>
  );
}
