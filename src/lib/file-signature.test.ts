import { describe, expect, it } from "vitest";
import { blobMatches, matchesSignature } from "./file-signature";

const bytes = (...b: number[]) => new Uint8Array(b);

describe("matchesSignature", () => {
  it("reconhece PDF, PNG, JPEG e WebP", () => {
    expect(matchesSignature(new TextEncoder().encode("%PDF-1.7"), "pdf")).toBe(true);
    expect(matchesSignature(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), "png")).toBe(true);
    expect(matchesSignature(bytes(0xff, 0xd8, 0xff, 0xe0), "jpeg")).toBe(true);
    expect(matchesSignature(new TextEncoder().encode("RIFF\0\0\0\0WEBP"), "webp")).toBe(true);
  });
  it("rejeita conteúdo de outro tipo", () => {
    expect(matchesSignature(new TextEncoder().encode("<html>"), "pdf")).toBe(false);
    expect(matchesSignature(new TextEncoder().encode("RIFF\0\0\0\0WAVE"), "webp")).toBe(false);
    expect(matchesSignature(bytes(), "jpeg")).toBe(false);
  });
});

it("blobMatches lê só o início do arquivo", async () => {
  expect(await blobMatches(new Blob(["%PDF-1.4 resto"]), "pdf")).toBe(true);
  expect(await blobMatches(new Blob(["GIF89a"]), "png")).toBe(false);
});
