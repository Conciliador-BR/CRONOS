import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { forgetDisplayUrl, signDisplayUrls } = await import("./signed-urls");

function fakeClient() {
  let n = 0;
  const createSignedUrls = vi.fn(async (paths: string[]) => ({
    data: paths.map((path) => ({ path, signedUrl: `https://x/${path}?token=${++n}`, error: null })),
    error: null,
  }));
  const client = { storage: { from: () => ({ createSignedUrls }) } };
  return { client: client as unknown as Parameters<typeof signDisplayUrls>[0], createSignedUrls };
}

describe("signDisplayUrls", () => {
  it("reaproveita a mesma URL e só assina caminhos novos", async () => {
    const { client, createSignedUrls } = fakeClient();
    const first = await signDisplayUrls(client, "b1", ["a.png"]);
    const second = await signDisplayUrls(client, "b1", ["a.png", "b.png"]);
    expect(second.get("a.png")).toBe(first.get("a.png"));
    expect(createSignedUrls).toHaveBeenCalledTimes(2);
    expect(createSignedUrls).toHaveBeenLastCalledWith(["b.png"], expect.any(Number));
    expect(await signDisplayUrls(client, "b1", [])).toEqual(new Map());
  });

  it("assina de novo depois de esquecer o caminho", async () => {
    const { client } = fakeClient();
    const first = await signDisplayUrls(client, "b2", ["a.png"]);
    forgetDisplayUrl("b2", "a.png");
    const second = await signDisplayUrls(client, "b2", ["a.png"]);
    expect(second.get("a.png")).not.toBe(first.get("a.png"));
  });
});
