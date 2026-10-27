"use client";

import { useState } from "react";
import type { BackgroundImage } from "../backgrounds";

/**
 * Mantém a mesma URL assinada enquanto a imagem (caminho) não muda. Cada renderização no
 * servidor assina de novo (token novo); sem isso o navegador baixaria a foto a cada revalidação.
 */
export function useStableImageUrl(image: BackgroundImage | null): string | null {
  const [kept, setKept] = useState(image);
  if ((image?.path ?? null) !== (kept?.path ?? null)) {
    setKept(image);
    return image?.url ?? null;
  }
  return kept?.url ?? null;
}
