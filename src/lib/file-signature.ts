/** Confere a assinatura (magic bytes) do arquivo, sem confiar no tipo declarado pelo navegador. */
export type SignatureKind = "pdf" | "png" | "jpeg" | "webp";

export function matchesSignature(bytes: Uint8Array, kind: SignatureKind) {
  const starts = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  switch (kind) {
    case "pdf":
      return starts([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    case "png":
      return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "jpeg":
      return starts([0xff, 0xd8, 0xff]);
    case "webp":
      return starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8); // RIFF....WEBP
  }
}

export async function blobMatches(blob: Blob, kind: SignatureKind) {
  return matchesSignature(new Uint8Array(await blob.slice(0, 12).arrayBuffer()), kind);
}
