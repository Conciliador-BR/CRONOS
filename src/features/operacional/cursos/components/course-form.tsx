"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { COVER_MIME_TYPES, MAX_COVER_BYTES } from "../../shared/files";
import { createCourse, removeCourseCover, updateCourse, uploadCourseCover } from "../course-actions";
import { CourseCover } from "./course-cover";

type Course = { id: string; title: string; description: string; published: boolean; coverUrl: string | null; hasCover: boolean };
type Errors = Record<string, string[] | undefined>;

/** Dados do curso: título, descrição, publicação e capa. Cria ou edita. */
export function CourseForm({ course, onDone, formId }: { course?: Course; onDone?: () => void; formId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [published, setPublished] = useState(course?.published ?? false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(course?.coverUrl ?? null);
  const [removeCover, setRemoveCover] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function pick(next: File | undefined) {
    if (!next) return;
    if (!COVER_MIME_TYPES.includes(next.type as (typeof COVER_MIME_TYPES)[number])) return setErrors({ file: ["Use PNG, JPG ou WebP."] });
    if (next.size > MAX_COVER_BYTES) return setErrors({ file: ["A capa pode ter até 2 MB."] });
    setErrors({});
    setFile(next);
    setRemoveCover(false);
    setPreview(URL.createObjectURL(next));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setFormError(null);
    const values = { title, description, published };
    const result = course ? await updateCourse({ id: course.id, ...values }) : await createCourse(values);
    if (!result.ok) {
      setPending(false);
      setErrors(result.fieldErrors ?? {});
      return setFormError(result.error);
    }
    const id = course?.id ?? ("id" in result && typeof result.id === "string" ? result.id : "");
    if (file) {
      const data = new FormData();
      data.set("courseId", id);
      data.set("file", file);
      const uploaded = await uploadCourseCover(data);
      if (!uploaded.ok) setFormError(`O curso foi salvo, mas a capa não: ${uploaded.error}`);
      else setFile(null);
    } else if (removeCover && course?.hasCover) {
      await removeCourseCover(id);
    }
    setPending(false);
    setErrors({});
    setSaved(true);
    onDone?.();
    if (!course) router.push(`/operacional/cursos/${id}?modo=editar`);
  }

  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-2">
          <CourseCover id={course?.id ?? "novo"} title={title || "Novo curso"} coverUrl={removeCover ? null : preview} className="rounded-lg" />
          <input ref={fileRef} type="file" accept={COVER_MIME_TYPES.join(",")} className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-1">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlus aria-hidden />
              {preview && !removeCover ? "Trocar capa" : "Enviar capa"}
            </Button>
            {preview && !removeCover ? (
              <Button variant="ghost" size="sm" aria-label="Remover capa" onClick={() => { setRemoveCover(true); setFile(null); }}>
                <Trash2 aria-hidden />
              </Button>
            ) : null}
          </div>
          <p className={errors.file ? "text-xs font-medium text-danger" : "text-xs text-muted"}>
            {errors.file?.[0] ?? "PNG, JPG ou WebP até 2 MB (16:9)."}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Field id={`${formId}-title`} label="Título" required error={errors.title}>
            <Input maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field id={`${formId}-description`} label="Descrição" error={errors.description}>
            <Textarea rows={4} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="size-4 accent-[var(--primary)]" />
            Publicado (visível para todos os funcionários)
          </label>
        </div>
      </div>
      {formError ? <Alert tone="danger">{formError}</Alert> : null}
      {saved && !formError ? <Alert tone="success">Curso salvo.</Alert> : null}
      {course ? (
        <div>
          <Button type="submit" loading={pending}>{pending ? "Salvando…" : "Salvar curso"}</Button>
        </div>
      ) : null}
    </form>
  );
}
