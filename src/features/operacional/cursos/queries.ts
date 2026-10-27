import "server-only";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CourseCard, CourseDetail, CourseModule, Lesson } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function signCovers(supabase: Supabase, paths: string[]) {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data } = await supabase.storage.from("course-covers").createSignedUrls(paths, 3600);
  for (const item of data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  return urls;
}

async function myCompletedIds(supabase: Supabase): Promise<Set<string>> {
  const profile = await getCurrentProfile();
  if (!profile) return new Set();
  const { data } = await supabase.from("lesson_progress").select("lesson_id").eq("profile_id", profile.id);
  return new Set((data ?? []).map((row) => row.lesson_id));
}

/** Vitrine: membros veem publicados; gestores veem também rascunhos (RLS decide). */
export async function getCourses(): Promise<CourseCard[]> {
  const supabase = await createClient();
  const [{ data, error }, completed] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description, published, cover_path, created_at, course_modules(id, lessons(id))")
      .order("created_at", { ascending: false }),
    myCompletedIds(supabase),
  ]);
  if (error) throw new Error("Falha ao carregar cursos");
  const rows = data ?? [];
  const urls = await signCovers(supabase, rows.flatMap((row) => (row.cover_path ? [row.cover_path] : [])));
  return rows.map((row) => {
    const lessonIds = row.course_modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? "",
      published: row.published,
      coverUrl: row.cover_path ? (urls.get(row.cover_path) ?? null) : null,
      moduleCount: row.course_modules.length,
      lessonCount: lessonIds.length,
      completedCount: lessonIds.filter((id) => completed.has(id)).length,
    };
  });
}

export async function getCourse(courseId: string): Promise<CourseDetail | null> {
  const supabase = await createClient();
  const [{ data, error }, completed] = await Promise.all([
    supabase
      .from("courses")
      .select(
        "id, title, description, published, cover_path, course_modules(id, title, position, lessons(id, module_id, title, description, source, video_url, video_path, position))",
      )
      .eq("id", courseId)
      .maybeSingle(),
    myCompletedIds(supabase),
  ]);
  if (error) throw new Error("Falha ao carregar o curso");
  if (!data) return null;
  const urls = await signCovers(supabase, data.cover_path ? [data.cover_path] : []);
  const modules: CourseModule[] = data.course_modules
    .toSorted((a, b) => a.position - b.position)
    .map((module) => ({
      id: module.id,
      title: module.title,
      position: module.position,
      lessons: module.lessons
        .toSorted((a, b) => a.position - b.position)
        .map(
          (lesson): Lesson => ({
            id: lesson.id,
            moduleId: lesson.module_id,
            title: lesson.title,
            description: lesson.description ?? "",
            source: lesson.source,
            videoUrl: lesson.video_url,
            videoPath: lesson.video_path,
            position: lesson.position,
          }),
        ),
    }));
  const lessonIds = new Set(modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)));
  return {
    id: data.id,
    title: data.title,
    description: data.description ?? "",
    published: data.published,
    coverUrl: data.cover_path ? (urls.get(data.cover_path) ?? null) : null,
    hasCover: Boolean(data.cover_path),
    modules,
    completedIds: [...completed].filter((id) => lessonIds.has(id)),
  };
}

/** URL assinada (3 h) para vídeo enviado ao bucket course-videos. */
export async function getVideoSignedUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage.from("course-videos").createSignedUrl(path, 3 * 60 * 60);
  return data?.signedUrl ?? null;
}
