import { describe, expect, it } from "vitest";
import { STAGE_LABELS } from "../constants";
import { mergeStageLabels } from "./stage-labels";

describe("mergeStageLabels", () => {
  it("usa os nomes padrão sem linhas ou quando a leitura falha", () => {
    expect(mergeStageLabels(null)).toEqual(STAGE_LABELS);
    expect(mergeStageLabels(undefined)).toEqual(STAGE_LABELS);
    expect(mergeStageLabels([])).toEqual(STAGE_LABELS);
  });

  it("aplica os nomes salvos e completa as etapas que faltam", () => {
    const labels = mergeStageLabels([
      { stage: "follow_up", label: "  Retorno  " },
      { stage: "cliente_fechado", label: "Ganho" },
    ]);
    expect(labels.follow_up).toBe("Retorno");
    expect(labels.cliente_fechado).toBe("Ganho");
    expect(labels.lead_recebido).toBe(STAGE_LABELS.lead_recebido);
    expect(Object.keys(labels).sort()).toEqual(Object.keys(STAGE_LABELS).sort());
  });

  it("ignora nome vazio e etapa desconhecida", () => {
    const labels = mergeStageLabels([
      { stage: "reuniao_marcada", label: "   " },
      { stage: "diagnostico_feito", label: null },
      { stage: "etapa_nova", label: "Nova" },
    ]);
    expect(labels).toEqual(STAGE_LABELS);
    expect(labels).not.toHaveProperty("etapa_nova");
  });

  it("não altera o objeto padrão", () => {
    mergeStageLabels([{ stage: "lead_recebido", label: "Entrada" }]);
    expect(STAGE_LABELS.lead_recebido).toBe("Lead recebido");
  });
});
