"use client";

import { ImageIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { removeMissionsWallpaper, setMissionsWallpaper } from "../background-actions";
import { wallpaperBackdrop, type BackgroundImage } from "../backgrounds";
import { BackgroundPicker } from "./background-picker";
import { useStableImageUrl } from "./use-stable-image";

/**
 * Área da página Missões com o papel de parede do usuário como última camada: ocupa todo o
 * conteúdo (sangra até as bordas do <main>), presa à janela e escurecida para o texto.
 */
export function MissionsBackdrop({ image, children }: { image: BackgroundImage | null; children: ReactNode }) {
  const url = useStableImageUrl(image);
  const background = url ? wallpaperBackdrop(url) : null;
  return (
    <div
      className="-mx-4 -my-6 min-h-[calc(100dvh-3.5rem)] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      style={background ? { background } : undefined}
    >
      {children}
    </div>
  );
}

/** Botão "Papel de parede" do cabeçalho: escolher, trocar ou remover a imagem (só para você). */
export function WallpaperButton({ image }: { image: BackgroundImage | null }) {
  const [open, setOpen] = useState(false);
  const url = useStableImageUrl(image);
  const preview = url ? wallpaperBackdrop(url, { fixed: false }) : null;

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <ImageIcon aria-hidden />
        Papel de parede
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Papel de parede"
        description="A imagem aparece no fundo da página Missões só para você."
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div
            aria-hidden
            className="grid h-32 place-items-center rounded-lg bg-surface-2 text-sm text-muted ring-1 ring-border"
            style={preview ? { background: preview } : undefined}
          >
            {preview ? null : "Sem papel de parede"}
          </div>
          <BackgroundPicker
            label="Imagem de fundo da página"
            hasImage={Boolean(image)}
            onUpload={(file) => {
              const form = new FormData();
              form.set("file", file);
              return setMissionsWallpaper(form);
            }}
            onRemove={() => removeMissionsWallpaper()}
          />
        </div>
      </Modal>
    </>
  );
}
