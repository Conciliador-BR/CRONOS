import { z } from "zod";
import { MAX_VIDEO_BYTES, VIDEO_MIME_TYPES } from "../shared/files";
import { parseDriveFileId, parseYouTubeId } from "./video";

const id = z.uuid({ error: "Identificador inválido." });
const title = z.string().trim().min(1, { error: "Informe o título." }).max(200, { error: "Até 200 caracteres." });

export const courseInputSchema = z.object({
  title,
  description: z.string().trim().max(5000, { error: "Até 5.000 caracteres." }),
  published: z.boolean(),
});
export const courseUpdateSchema = courseInputSchema.extend({ id });

export const moduleCreateSchema = z.object({ courseId: id, title });
export const moduleRenameSchema = z.object({ id, title });
export const reorderSchema = z.object({ parentId: id, ids: z.array(id).min(1).max(500) });

export const lessonInputSchema = z
  .object({
    moduleId: id,
    title,
    description: z.string().trim().max(10000, { error: "Até 10.000 caracteres." }),
    source: z.enum(["upload", "drive", "youtube"], { error: "Escolha a origem do vídeo." }),
    videoUrl: z.string().trim().max(2000).optional(),
    videoPath: z.string().max(400).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.source === "youtube" && !parseYouTubeId(value.videoUrl ?? "")) {
      ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "Cole um link válido do YouTube (https://youtu.be/… ou youtube.com/watch?v=…)." });
    }
    if (value.source === "drive" && !parseDriveFileId(value.videoUrl ?? "")) {
      ctx.addIssue({ code: "custom", path: ["videoUrl"], message: "Cole o link de compartilhamento de um arquivo do Drive (…/file/d/…)." });
    }
    if (value.source === "upload" && !value.videoPath) {
      ctx.addIssue({ code: "custom", path: ["videoPath"], message: "Envie o arquivo de vídeo." });
    }
  });

export type LessonInput = z.infer<typeof lessonInputSchema>;

export const videoUploadSchema = z.object({
  courseId: id,
  fileName: z.string().trim().min(1).max(255),
  size: z.number().int().positive({ error: "Arquivo vazio." }).max(MAX_VIDEO_BYTES, { error: "O vídeo pode ter até 50 MB." }),
  contentType: z.enum(VIDEO_MIME_TYPES, { error: "Use MP4, WebM ou MOV." }),
});

export const progressSchema = z.object({ lessonId: id, completed: z.boolean() });
