"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { failure, forbidden, invalid, requireManagerOrNull } from "../shared/action-utils";
import { buildStoragePath, COVER_MIME_TYPES, MAX_COVER_BYTES } from "../shared/files";
import { readImageFile } from "../shared/image-upload";
import { POSITION_STEP, positionAfterLast } from "../shared/position";
import type { ActionResult } from "../shared/result";
import { courseInputSchema, courseUpdateSchema, moduleCreateSchema, moduleRenameSchema, reorderSchema } from "./schemas";

const LIST_PATH = "/operacional/cursos";
/** Revalida o curso e as páginas de aula abaixo dele. */
function revalidateCourse(courseId: string) {
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${courseId}`, "layout");
}

export async function createCourse(input: unknown): Promise<ActionResult<{ id: string }>> {
  const profile = await requireManagerOrNull();
  if (!profile) return forbidden;
  const parsed = courseInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({ ...parsed.data, description: parsed.data.description || null, created_by: profile.id })
    .select("id")
    .single();
  if (error) return failure("cursos.createCourse", error);
  revalidatePath(LIST_PATH);
  return { ok: true, id: data.id };
}

export async function updateCourse(input: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = courseUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("courses").update({ ...values, description: values.description || null }).eq("id", id);
  if (error) return failure("cursos.updateCourse", error);
  revalidateCourse(id);
  return { ok: true };
}

/** Exclui o curso com módulos, aulas, progresso, vídeos enviados e capa. */
export async function deleteCourse(id: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("cover_path, course_modules(lessons(video_path))")
    .eq("id", parsed.data)
    .maybeSingle();
  const { error } = await supabase.from("courses").delete().eq("id", parsed.data);
  if (error) return failure("cursos.deleteCourse", error);
  const videos = (course?.course_modules ?? []).flatMap((m) => m.lessons.flatMap((l) => (l.video_path ? [l.video_path] : [])));
  if (videos.length) await supabase.storage.from("course-videos").remove(videos);
  if (course?.cover_path) await supabase.storage.from("course-covers").remove([course.cover_path]);
  revalidatePath(LIST_PATH);
  return { ok: true };
}

/** Capa do curso (PNG, JPG ou WebP até 2 MB). FormData: courseId, file. */
export async function uploadCourseCover(formData: FormData): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsedId = z.uuid().safeParse(formData.get("courseId"));
  if (!parsedId.success) return invalid(parsedId.error);
  const image = await readImageFile(formData.get("file"), COVER_MIME_TYPES, MAX_COVER_BYTES, "PNG, JPG ou WebP");
  if (!image.ok) return { ok: false, error: image.error, fieldErrors: { file: [image.error] } };
  const courseId = parsedId.data;
  const supabase = await createClient();
  const { data: current } = await supabase.from("courses").select("cover_path").eq("id", courseId).maybeSingle();
  if (!current) return { ok: false, error: "Curso não encontrado." };
  const path = buildStoragePath(courseId, crypto.randomUUID(), image.file.name);
  const { error: uploadError } = await supabase.storage
    .from("course-covers")
    .upload(path, image.bytes, { contentType: image.file.type, upsert: false });
  if (uploadError) return failure("cursos.uploadCover", uploadError);
  const { error } = await supabase.from("courses").update({ cover_path: path }).eq("id", courseId);
  if (error) {
    await supabase.storage.from("course-covers").remove([path]);
    return failure("cursos.uploadCover.update", error);
  }
  if (current.cover_path) await supabase.storage.from("course-covers").remove([current.cover_path]);
  revalidateCourse(courseId);
  return { ok: true };
}

export async function removeCourseCover(courseId: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = z.uuid().safeParse(courseId);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: current } = await supabase.from("courses").select("cover_path").eq("id", parsed.data).maybeSingle();
  const { error } = await supabase.from("courses").update({ cover_path: null }).eq("id", parsed.data);
  if (error) return failure("cursos.removeCover", error);
  if (current?.cover_path) await supabase.storage.from("course-covers").remove([current.cover_path]);
  revalidateCourse(parsed.data);
  return { ok: true };
}

export async function createModule(input: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = moduleCreateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("course_modules")
    .select("position")
    .eq("course_id", parsed.data.courseId)
    .order("position", { ascending: false })
    .limit(1);
  const { error } = await supabase.from("course_modules").insert({
    course_id: parsed.data.courseId,
    title: parsed.data.title,
    position: positionAfterLast((last ?? []).map((row) => row.position)),
  });
  if (error) return failure("cursos.createModule", error);
  revalidateCourse(parsed.data.courseId);
  return { ok: true };
}

export async function renameModule(input: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = moduleRenameSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_modules")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.id)
    .select("course_id")
    .single();
  if (error) return failure("cursos.renameModule", error);
  revalidateCourse(data.course_id);
  return { ok: true };
}

export async function deleteModule(id: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: module } = await supabase
    .from("course_modules")
    .select("course_id, lessons(video_path)")
    .eq("id", parsed.data)
    .maybeSingle();
  if (!module) return { ok: false, error: "Módulo não encontrado." };
  const { error } = await supabase.from("course_modules").delete().eq("id", parsed.data);
  if (error) return failure("cursos.deleteModule", error);
  const videos = module.lessons.flatMap((lesson) => (lesson.video_path ? [lesson.video_path] : []));
  if (videos.length) await supabase.storage.from("course-videos").remove(videos);
  revalidateCourse(module.course_id);
  return { ok: true };
}

/** Grava a nova ordem dos módulos de um curso (ids na ordem desejada). */
export async function reorderModules(input: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const results = await Promise.all(
    parsed.data.ids.map((moduleId, index) =>
      supabase
        .from("course_modules")
        .update({ position: (index + 1) * POSITION_STEP })
        .eq("id", moduleId)
        .eq("course_id", parsed.data.parentId),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return failure("cursos.reorderModules", failed.error);
  revalidateCourse(parsed.data.parentId);
  return { ok: true };
}
