import { describe, expect, it } from "vitest";
import {
  buildStoragePath,
  displayFilename,
  formatBytes,
  isAllowedMime,
  isPathInFolder,
  matchesImageSignature,
  sanitizeFilename,
} from "./files";

describe("sanitizeFilename", () => {
  it("remove acentos, espaços e caracteres perigosos", () => {
    expect(sanitizeFilename("Documentação da API (v2).pdf")).toBe("documentacao-da-api-v2.pdf");
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("C:\\Users\\a\\Relatório final.docx")).toBe("relatorio-final.docx");
  });
  it("não começa com ponto nem fica vazio", () => {
    expect(sanitizeFilename(".env")).toBe("env");
    expect(sanitizeFilename("???")).toBe("arquivo");
    expect(sanitizeFilename("")).toBe("arquivo");
  });
  it("limita o tamanho preservando a extensão", () => {
    const out = sanitizeFilename(`${"a".repeat(300)}.pdf`);
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out.endsWith(".pdf")).toBe(true);
  });
});

describe("displayFilename", () => {
  it("tira caminho e caracteres de controle", () => {
    expect(displayFilename("pasta/Contrato\u0007.pdf")).toBe("Contrato.pdf");
    expect(displayFilename("   ")).toBe("arquivo");
  });
});

describe("formatBytes", () => {
  it("formata em pt-BR", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1536)).toBe("1,5 KB");
    expect(formatBytes(50 * 1024 * 1024)).toBe("50 MB");
  });
});

describe("caminhos", () => {
  it("monta caminho com uuid e nome saneado", () => {
    expect(buildStoragePath("abc", "123", "Meu arquivo.PDF")).toBe("abc/123-meu-arquivo.pdf");
  });
  it("valida a pasta do caminho", () => {
    expect(isPathInFolder("abc/123-x.pdf", "abc")).toBe(true);
    expect(isPathInFolder("abcd/123-x.pdf", "abc")).toBe(false);
    expect(isPathInFolder("abc/../x.pdf", "abc")).toBe(false);
    expect(isPathInFolder("abc/sub/x.pdf", "abc")).toBe(false);
  });
  it("valida MIME", () => {
    expect(isAllowedMime("IMAGE/PNG", ["image/png"])).toBe(true);
    expect(isAllowedMime("text/html", ["image/png"])).toBe(false);
  });
});

describe("matchesImageSignature", () => {
  it("reconhece PNG, JPEG e WebP", () => {
    expect(matchesImageSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(matchesImageSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg")).toBe(true);
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(matchesImageSignature(webp, "image/webp")).toBe(true);
  });
  it("recusa conteúdo trocado e SVG com script", () => {
    expect(matchesImageSignature(new TextEncoder().encode("<html>"), "image/png")).toBe(false);
    expect(matchesImageSignature(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), "image/svg+xml")).toBe(true);
    expect(matchesImageSignature(new TextEncoder().encode("<svg><script>alert(1)</script></svg>"), "image/svg+xml")).toBe(false);
  });
});
