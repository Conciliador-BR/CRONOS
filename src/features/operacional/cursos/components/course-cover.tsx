import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "linear-gradient(135deg, #1d4ed8, #0b1020 75%)",
  "linear-gradient(135deg, #0e7490, #0b1020 75%)",
  "linear-gradient(135deg, #6d28d9, #0b1020 75%)",
  "linear-gradient(135deg, #2563eb, #38bdf8 120%)",
  "linear-gradient(135deg, #1e3a8a, #0e7490 120%)",
];

function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

/** Capa 16:9 do curso; sem imagem, gradiente azul estável pelo id. */
export function CourseCover({ id, title, coverUrl, className }: { id: string; title: string; coverUrl: string | null; className?: string }) {
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-surface-2", className)}>
      {coverUrl ? (
        // URL assinada do Storage; next/image precisaria de otimização remota a cada requisição.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <div className="flex size-full items-end p-4" style={{ background: gradientFor(id) }}>
          <PlayCircle aria-hidden className="absolute top-1/2 left-1/2 size-12 -translate-1/2 text-white/30" />
          <span className="line-clamp-2 text-lg font-bold text-white/90 text-balance">{title}</span>
        </div>
      )}
    </div>
  );
}
