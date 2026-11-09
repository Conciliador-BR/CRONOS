import { describe, expect, it } from "vitest";
import { countProgress } from "./progress";

describe("countProgress", () => {
  it("automático conta como concluído; vazio = não iniciado", () => {
    expect(countProgress(["automatico", "assinado", undefined, "automatico"])).toEqual({
      nao_iniciado: 1,
      enviado_documentacao: 0,
      assinado: 1,
      enviado_liberar: 0,
      automatico: 2,
      total: 4,
      percent: 50,
    });
  });
  it("sem empresas = 0%", () => expect(countProgress([]).percent).toBe(0));
});
