"use client";

import { CheckCircle2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";
import { formatBytes, MAX_VIDEO_BYTES, VIDEO_MIME_TYPES } from "../../shared/files";
import { requestVideoUpload } from "../lesson-actions";
import type { VideoSource } from "../types";
import { getEmbedUrl } from "../video";

const SOURCES: { value: VideoSource; label: string }[] = [
  { value: "upload", label: "Enviar vídeo" },
  { value: "drive", label: "Google Drive" },
  { value: "youtube", label: "YouTube" },
];

export type VideoValue = { source: VideoSource; videoUrl: string; videoPath: string; fileLabel: string };

/** Origem do vídeo: envio direto ao Storage (URL assinada) ou link do Drive/YouTube. */
export function VideoSourceField({
  courseId,
  value,
  onChange,
  onUploading,
  errors,
}: {
  courseId: string;
  value: VideoValue;
  onChange: (value: VideoValue) => void;
  onUploading: (uploading: boolean) => void;
  errors: Record<string, string[] | undefined>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const embedOk = value.source !== "upload" && value.videoUrl ? Boolean(getEmbedUrl(value.source, value.videoUrl)) : false;

  async function upload(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!VIDEO_MIME_TYPES.includes(file.type as (typeof VIDEO_MIME_TYPES)[number])) return setUploadError("Use MP4, WebM ou MOV.");
    if (file.size > MAX_VIDEO_BYTES) return setUploadError("O vídeo pode ter até 50 MB. Para vídeos maiores, use um link do Drive ou YouTube.");
    setUploadError(null);
    setUploading(true);
    onUploading(true);
    const ticket = await requestVideoUpload({ courseId, fileName: file.name, size: file.size, contentType: file.type });
    if (!ticket.ok) {
      setUploading(false);
      onUploading(false);
      return setUploadError(ticket.error);
    }
    const { error } = await createClient().storage.from("course-videos").uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
    setUploading(false);
    onUploading(false);
    if (error) return setUploadError("Falha no envio. Tente de novo.");
    onChange({ ...value, videoPath: ticket.path, fileLabel: `${file.name} (${formatBytes(file.size)})` });
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-fg">Vídeo</legend>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map((source) => (
            <label
              key={source.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
            >
              <input
                type="radio"
                name="lesson-source"
                value={source.value}
                checked={value.source === source.value}
                onChange={() => onChange({ ...value, source: source.value })}
                className="accent-[var(--primary)]"
              />
              {source.label}
            </label>
          ))}
        </div>
      </fieldset>
      {value.source === "upload" ? (
        <div className="flex flex-col gap-1.5">
          <input ref={fileRef} type="file" accept={VIDEO_MIME_TYPES.join(",")} className="sr-only" tabIndex={-1} onChange={(e) => upload(e.target.files?.[0])} />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? null : <Upload aria-hidden />}
              {uploading ? "Enviando vídeo…" : value.videoPath ? "Trocar vídeo" : "Escolher vídeo"}
            </Button>
            {value.videoPath && !uploading ? (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <CheckCircle2 aria-hidden className="size-3.5" />
                {value.fileLabel || "Vídeo enviado"}
              </span>
            ) : null}
          </div>
          <p aria-live="polite" className={uploadError || errors.videoPath ? "text-xs font-medium text-danger" : "text-xs text-muted"}>
            {uploadError ?? errors.videoPath?.[0] ?? "MP4, WebM ou MOV até 50 MB (limite do plano gratuito)."}
          </p>
        </div>
      ) : (
        <Field
          id="lesson-video-url"
          label={value.source === "drive" ? "Link do Google Drive" : "Link do YouTube"}
          error={errors.videoUrl}
          hint={
            embedOk
              ? "Link reconhecido."
              : value.source === "drive"
                ? "Compartilhe o arquivo como “Qualquer pessoa com o link” e cole o endereço …/file/d/…"
                : "Ex.: https://youtu.be/… ou https://www.youtube.com/watch?v=…"
          }
        >
          <Input type="url" inputMode="url" value={value.videoUrl} onChange={(e) => onChange({ ...value, videoUrl: e.target.value })} placeholder="https://" />
        </Field>
      )}
    </div>
  );
}
