import { describe, expect, it } from "vitest";
import {
  boardBackdrop,
  boardBackgroundPath,
  cssImageUrl,
  isBoardBackgroundPath,
  isUserWallpaperPath,
  userWallpaperPath,
  wallpaperBackdrop,
} from "./backgrounds";

const USER = "11111111-1111-4111-8111-111111111111";
const BOARD = "22222222-2222-4222-8222-222222222222";
const UUID = "33333333-3333-4333-8333-333333333333";
const URL = "https://x.supabase.co/storage/v1/object/sign/wallpapers/a.png?token=abc";

describe("caminhos no Storage", () => {
  it("monta a pasta do usuário e do quadro com a extensão do tipo", () => {
    expect(userWallpaperPath(USER, UUID, "image/jpeg")).toBe(`users/${USER}/${UUID}.jpg`);
    expect(boardBackgroundPath(BOARD, UUID, "IMAGE/PNG")).toBe(`boards/${BOARD}/${UUID}.png`);
    expect(boardBackgroundPath(BOARD, UUID, "image/webp")).toBe(`boards/${BOARD}/${UUID}.webp`);
  });

  it("só aceita arquivos da pasta certa", () => {
    expect(isUserWallpaperPath(`users/${USER}/${UUID}.png`, USER)).toBe(true);
    expect(isUserWallpaperPath(`users/${BOARD}/${UUID}.png`, USER)).toBe(false);
    expect(isUserWallpaperPath(`users/${USER}/../x.png`, USER)).toBe(false);
    expect(isBoardBackgroundPath(`boards/${BOARD}/${UUID}.png`, BOARD)).toBe(true);
    expect(isBoardBackgroundPath(`users/${BOARD}/${UUID}.png`, BOARD)).toBe(false);
    expect(isBoardBackgroundPath(`boards/${BOARD}/a/b.png`, BOARD)).toBe(false);
  });
});

describe("CSS do fundo", () => {
  it("aceita só https e escapa aspas", () => {
    expect(cssImageUrl("javascript:alert(1)")).toBeNull();
    expect(cssImageUrl("http://x/a.png")).toBeNull();
    expect(cssImageUrl('https://x/a"b.png')).toBe('url("https://x/a%22b.png")');
  });

  it("quadro sem imagem usa o degradê da cor", () => {
    expect(boardBackdrop("#1d4ed8")).toBe("linear-gradient(160deg, #1d4ed8, color-mix(in srgb, #1d4ed8 55%, #05070d))");
    expect(boardBackdrop("#1d4ed8", "ftp://x")).not.toContain("url(");
  });

  it("quadro com imagem: véu da cor por cima, foto embaixo e cor como reserva", () => {
    const css = boardBackdrop("#1d4ed8", URL);
    expect(css.indexOf("linear-gradient")).toBeLessThan(css.indexOf("url("));
    expect(css).toContain(`url("${URL}") center / cover no-repeat`);
    expect(css.endsWith(", #1d4ed8")).toBe(true);
  });

  it("papel de parede fica preso à janela e escurecido", () => {
    expect(wallpaperBackdrop(URL)).toMatch(/^linear-gradient\(.+\) fixed, url\(".+"\) center \/ cover no-repeat fixed$/);
    expect(wallpaperBackdrop(URL, { fixed: false })).not.toContain("fixed");
    expect(wallpaperBackdrop("data:image/png;base64,AAA")).toBeNull();
  });
});
