import type { CourseModule } from "./types";

export function progressPercent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(done, total) / total) * 100);
}

/** Aulas na ordem do curso (módulos e aulas por posição). */
export function flattenLessons(modules: readonly CourseModule[]) {
  return modules
    .toSorted((a, b) => a.position - b.position)
    .flatMap((module) => module.lessons.toSorted((a, b) => a.position - b.position));
}

export function courseProgress(modules: readonly CourseModule[], completedIds: readonly string[]) {
  const lessons = flattenLessons(modules);
  const completed = new Set(completedIds);
  const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
  return { done, total: lessons.length, percent: progressPercent(done, lessons.length) };
}

/** Próxima aula a assistir: a primeira não concluída (ou a primeira, se todas concluídas). */
export function nextLessonId(modules: readonly CourseModule[], completedIds: readonly string[]): string | null {
  const lessons = flattenLessons(modules);
  const completed = new Set(completedIds);
  return (lessons.find((lesson) => !completed.has(lesson.id)) ?? lessons[0])?.id ?? null;
}

export function lessonNeighbors(modules: readonly CourseModule[], lessonId: string) {
  const lessons = flattenLessons(modules);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  return {
    previous: index > 0 ? lessons[index - 1] : null,
    next: index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null,
    index,
    total: lessons.length,
  };
}
