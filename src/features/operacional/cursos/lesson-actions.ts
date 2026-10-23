"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { failure, forbidden, invalid, requireManagerOrNull, requireMember } from "../shared/action-utils";
import { buildStoragePath, isPathInFolder, MAX_VIDEO_BYTES, VIDEO_MIME_TYPES } from "../shared/files";
import { POSITION_STEP, positionAfterLast } from "../shared/position";
import type { ActionResult } from "../shared/result";
import { lessonInputSchema, progressSchema, reorderSchema, videoUploadSchema, type LessonInput } from "./schemas";

const BUCKET = "course-videos";
type Supabase = Awaited<ReturnType<typeof createClient>>;

function revalidateCourse(courseId: string) {
  revalidatePath("/operacional/cursos");
  revalidatePath(`/operacional/cursos/${courseId}`, "layout");
}

async function courseOfModule(supabase: Supabase, moduleId: string) {
  const { data } = await supabase.from("course_modules").select("course_id").eq("id", moduleId).maybeSingle();
  return data?.course_id ?? null;
}

/** 1º passo do envio de vídeo: URL assinada para <courseId>/<uuid>-<nome>; o navegador envia direto. */
export async function requestVideoUpload(input: unknown): Promise<ActionResult<{ path: string; token: string }>> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = videoUploadSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("id").eq("id", parsed.data.courseId).maybeSingle();
  if (!course) return { ok: false, error: "Curso não encontrado." };
  const path = buildStoragePath(course.id, crypto.randomUUID(), parsed.data.fileName);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) return failure("cursos.requestVideoUpload", error);
  return { ok: true, path: data.path, token: data.token };
}

/** Confere vídeo enviado: pasta do curso, tamanho e tipo reais no Storage. */
async function verifyVideo(supabase: Supabase, courseId: string, path: string): Promise<string | null> {
  if (!isPathInFolder(path, courseId)) return "Caminho de vídeo inválido.";
  const { data, error } = await supabase.storage.from(BUCKET).info(path);
  if (error || !data) return "O vídeo não chegou ao armazenamento. Envie de novo.";
  const size = Number(data.size ?? 0);
  const type = String(data.contentType ?? "").toLowerCase();
  if (!size || size > MAX_VIDEO_BYTES || !VIDEO_MIME_TYPES.includes(type as (typeof VIDEO_MIME_TYPES)[number])) {
    await supabase.storage.from(BUCKET).remove([path]);
    return "Vídeo inválido: use MP4, WebM ou MOV até 50 MB.";
  }
  return null;
}

function toRow(values: LessonInput) {
  const upload = values.source === "upload";
  return {
    title: values.title,
    description: values.description || null,
    source: values.source,
    video_path: upload ? (values.videoPath ?? null) : null,
    video_url: upload ? null : (values.videoUrl?.trim() ?? null),
  };
}

export async function createLesson(input: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = lessonInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const courseId = await courseOfModule(supabase, parsed.data.moduleId);
  if (!courseId) return { ok: false, error: "Módulo não encontrado." };
  if (parsed.data.source === "upload") {
    const problem = await verifyVideo(supabase, courseId, parsed.data.videoPath ?? "");
    if (problem) return { ok: false, error: problem, fieldErrors: { videoPath: [problem] } };
  }
  const { data: last } = await supabase
    .from("lessons")
    .select("position")
    .eq("module_id", parsed.data.moduleId)
    .order("position", { ascending: false })
    .limit(1);
  const { error } = await supabase.from("lessons").insert({
    ...toRow(parsed.data),
    module_id: parsed.data.moduleId,
    position: positionAfterLast((last ?? []).map((row) => row.position)),
  });
  if (error) return failure("cursos.createLesson", error);
  revalidateCourse(courseId);
  return { ok: true };
}

export async function updateLesson(lessonId: unknown, input: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsedId = z.uuid().safeParse(lessonId);
  if (!parsedId.success) return invalid(parsedId.error);
  const parsed = lessonInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: current } = await supabase.from("lessons").select("module_id, video_path").eq("id", parsedId.data).maybeSingle();
  if (!current) return { ok: false, error: "Aula não encontrada." };
  const courseId = await courseOfModule(supabase, current.module_id);
  if (!courseId) return { ok: false, error: "Módulo não encontrado." };
  const row = toRow(parsed.data);
  if (row.video_path && row.video_path !== current.video_path) {
    const problem = await verifyVideo(supabase, courseId, row.video_path);
    if (problem) return { ok: false, error: problem, fieldErrors: { videoPath: [problem] } };
  }
  const { error } = await supabase.from("lessons").update(row).eq("id", parsedId.data);
  if (error) return failure("cursos.updateLesson", error);
  if (current.video_path && current.video_path !== row.video_path) {
    await supabase.storage.from(BUCKET).remove([current.video_path]);
  }
  revalidateCourse(courseId);
  return { ok: true };
}

export async function deleteLesson(lessonId: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = z.uuid().safeParse(lessonId);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const { data: lesson } = await supabase.from("lessons").select("module_id, video_path").eq("id", parsed.data).maybeSingle();
  if (!lesson) return { ok: false, error: "Aula não encontrada." };
  const courseId = await courseOfModule(supabase, lesson.module_id);
  const { error } = await supabase.from("lessons").delete().eq("id", parsed.data);
  if (error) return failure("cursos.deleteLesson", error);
  if (lesson.video_path) await supabase.storage.from(BUCKET).remove([lesson.video_path]);
  if (courseId) revalidateCourse(courseId);
  return { ok: true };
}

export async function reorderLessons(input: unknown): Promise<ActionResult> {
  if (!(await requireManagerOrNull())) return forbidden;
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createClient();
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase.from("lessons").update({ position: (index + 1) * POSITION_STEP }).eq("id", id).eq("module_id", parsed.data.parentId),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return failure("cursos.reorderLessons", failed.error);
  const courseId = await courseOfModule(supabase, parsed.data.parentId);
  if (courseId) revalidateCourse(courseId);
  return { ok: true };
}

/** "Marcar como concluída" (ou desmarcar) para o usuário atual. */
export async function setLessonCompleted(input: unknown): Promise<ActionResult> {
  const profile = await requireMember();
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { lessonId, completed } = parsed.data;
  const supabase = await createClient();
  const { error } = completed
    ? await supabase.from("lesson_progress").upsert({ lesson_id: lessonId, profile_id: profile.id }, { ignoreDuplicates: true })
    : await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId).eq("profile_id", profile.id);
  if (error) return failure("cursos.setLessonCompleted", error);
  const { data: lesson } = await supabase.from("lessons").select("module_id").eq("id", lessonId).maybeSingle();
  const courseId = lesson ? await courseOfModule(supabase, lesson.module_id) : null;
  if (courseId) revalidateCourse(courseId);
  return { ok: true };
}
