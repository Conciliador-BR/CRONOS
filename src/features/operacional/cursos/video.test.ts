import { describe, expect, it } from "vitest";
import { detectLinkSource, getEmbedUrl, parseDriveFileId, parseYouTubeId } from "./video";

describe("parseYouTubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=x", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ?feature=share", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("%s", (url, id) => {
    expect(parseYouTubeId(url)).toBe(id);
  });
  it("recusa links inválidos ou inseguros", () => {
    expect(parseYouTubeId("http://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeId("https://evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeId("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeId("https://www.youtube.com/watch?v=curto")).toBeNull();
    expect(parseYouTubeId("https://www.youtube.com/@canal")).toBeNull();
    expect(parseYouTubeId("javascript:alert(1)")).toBeNull();
    expect(parseYouTubeId("não é link")).toBeNull();
  });
});

describe("parseDriveFileId", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";
  it.each([
    [`https://drive.google.com/file/d/${id}/view?usp=sharing`, id],
    [`https://drive.google.com/file/d/${id}/preview`, id],
    [`https://drive.google.com/file/d/${id}`, id],
    [`https://drive.google.com/open?id=${id}`, id],
    [`https://drive.google.com/uc?id=${id}&export=download`, id],
    [`https://drive.google.com/u/0/file/d/${id}/view`, id],
    [`https://docs.google.com/file/d/${id}/edit`, id],
  ])("%s", (url, expected) => {
    expect(parseDriveFileId(url)).toBe(expected);
  });
  it("recusa pastas, outros domínios e http", () => {
    expect(parseDriveFileId(`https://drive.google.com/drive/folders/${id}`)).toBeNull();
    expect(parseDriveFileId(`https://drive.google.evil.com/file/d/${id}/view`)).toBeNull();
    expect(parseDriveFileId(`http://drive.google.com/file/d/${id}/view`)).toBeNull();
    expect(parseDriveFileId("https://drive.google.com/file/d/<script>/view")).toBeNull();
  });
});

describe("getEmbedUrl e detectLinkSource", () => {
  it("monta os players", () => {
    expect(getEmbedUrl("youtube", "https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(getEmbedUrl("drive", "https://drive.google.com/file/d/1AbCdEfGhIjK/view")).toBe(
      "https://drive.google.com/file/d/1AbCdEfGhIjK/preview",
    );
    expect(getEmbedUrl("drive", "https://youtu.be/dQw4w9WgXcQ")).toBeNull();
  });
  it("detecta a fonte", () => {
    expect(detectLinkSource("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
    expect(detectLinkSource("https://drive.google.com/file/d/1AbCdEfGhIjK/view")).toBe("drive");
    expect(detectLinkSource("https://vimeo.com/1")).toBeNull();
  });
});
