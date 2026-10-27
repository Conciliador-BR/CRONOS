import { describe, expect, it } from "vitest";
import { courseProgress, lessonNeighbors, nextLessonId, progressPercent } from "./progress";
import type { CourseModule, Lesson } from "./types";

const lesson = (id: string, position: number): Lesson => ({
  id,
  moduleId: "m",
  title: id,
  description: "",
  source: "youtube",
  videoUrl: "https://youtu.be/dQw4w9WgXcQ",
  videoPath: null,
  position,
});

const modules: CourseModule[] = [
  { id: "m2", title: "Dois", position: 2, lessons: [lesson("c", 1)] },
  { id: "m1", title: "Um", position: 1, lessons: [lesson("b", 2), lesson("a", 1)] },
];

describe("progresso do curso", () => {
  it("calcula porcentagem", () => {
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(0, 0)).toBe(0);
    expect(progressPercent(5, 3)).toBe(100);
    expect(courseProgress(modules, ["a", "x"])).toEqual({ done: 1, total: 3, percent: 33 });
  });
  it("acha a próxima aula na ordem dos módulos", () => {
    expect(nextLessonId(modules, [])).toBe("a");
    expect(nextLessonId(modules, ["a", "b"])).toBe("c");
    expect(nextLessonId(modules, ["a", "b", "c"])).toBe("a");
    expect(nextLessonId([], [])).toBeNull();
  });
  it("acha anterior e próxima atravessando módulos", () => {
    const { previous, next, index } = lessonNeighbors(modules, "b");
    expect(previous?.id).toBe("a");
    expect(next?.id).toBe("c");
    expect(index).toBe(1);
    expect(lessonNeighbors(modules, "a").previous).toBeNull();
    expect(lessonNeighbors(modules, "c").next).toBeNull();
  });
});
