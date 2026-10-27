import { VideoOff } from "lucide-react";
import { getEmbedUrl } from "../video";
import type { Lesson } from "../types";

/** Player da aula: vídeo enviado (URL assinada) ou iframe do YouTube/Drive. */
export function LessonPlayer({ lesson, signedUrl }: { lesson: Lesson; signedUrl: string | null }) {
  const embed = lesson.source !== "upload" && lesson.videoUrl ? getEmbedUrl(lesson.source, lesson.videoUrl) : null;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-border">
      {lesson.source === "upload" && signedUrl ? (
        <video key={lesson.id} src={signedUrl} controls preload="metadata" playsInline className="size-full" aria-label={`Vídeo: ${lesson.title}`}>
          Seu navegador não reproduz este vídeo.
        </video>
      ) : embed ? (
        <iframe
          key={lesson.id}
          src={embed}
          title={`Vídeo: ${lesson.title}`}
          className="size-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted">
          <VideoOff aria-hidden className="size-8" />
          Vídeo indisponível. Avise um gestor.
        </div>
      )}
    </div>
  );
}
