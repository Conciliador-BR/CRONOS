"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizes: Record<AvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

// Tons de azul/ciano para as iniciais, escolhidos de forma estável pelo nome.
const tones = [
  "bg-blue-600/25 text-blue-200",
  "bg-sky-500/20 text-sky-200",
  "bg-indigo-500/25 text-indigo-200",
  "bg-cyan-500/20 text-cyan-200",
  "bg-blue-400/20 text-blue-100",
];

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function toneFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

export type AvatarProps = {
  /** Nome completo: gera iniciais e o texto alternativo. */
  name: string;
  /** URL da foto (ex.: URL assinada do bucket avatars). Cai para iniciais se falhar. */
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ring-1 ring-border",
        sizes[size],
        showImage ? "bg-surface-2" : toneFor(name),
        className,
      )}
    >
      {showImage ? (
        // URLs assinadas do Supabase mudam a cada requisição; next/image exigiria remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={name}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <span role="img" aria-label={name}>
          <span aria-hidden>{getInitials(name)}</span>
        </span>
      )}
    </span>
  );
}
