"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { createLesson, updateLesson } from "../lesson-actions";
import type { Lesson } from "../types";
import { VideoSourceField, type VideoValue } from "./video-source-field";

/** Nova aula / editar aula. */
export function LessonFormModal({
  courseId,
  moduleId,
  lesson,
  onClose,
}: {
  courseId: string;
  moduleId: string;
  lesson?: Lesson;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [video, setVideo] = useState<VideoValue>({
    source: lesson?.source ?? "youtube",
    videoUrl: lesson?.videoUrl ?? "",
    videoPath: lesson?.videoPath ?? "",
    fileLabel: lesson?.videoPath ? "Vídeo atual" : "",
  });
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (uploading) return;
    setPending(true);
    const input = {
      moduleId,
      title,
      description,
      source: video.source,
      videoUrl: video.source === "upload" ? undefined : video.videoUrl,
      videoPath: video.source === "upload" ? video.videoPath || undefined : undefined,
    };
    const result = lesson ? await updateLesson(lesson.id, input) : await createLesson(input);
    setPending(false);
    if (result.ok) return onClose();
    setErrors(result.fieldErrors ?? {});
    setFormError(result.error);
  }

  return (
    <Modal
      open
      onClose={onClose}
      closeOnBackdrop={false}
      size="lg"
      title={lesson ? "Editar aula" : "Nova aula"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="lesson-form" loading={pending} disabled={uploading}>
            {pending ? "Salvando…" : "Salvar aula"}
          </Button>
        </>
      }
    >
      <form id="lesson-form" onSubmit={submit} className="flex flex-col gap-4">
        <Field id="lesson-title" label="Título" required error={errors.title}>
          <Input autoFocus maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field id="lesson-description" label="Descrição" error={errors.description}>
          <Textarea rows={3} maxLength={10000} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <VideoSourceField courseId={courseId} value={video} onChange={setVideo} onUploading={setUploading} errors={errors} />
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
      </form>
    </Modal>
  );
}
