import type { DealType, LeadSource, LeadTemperature, PipelineStage } from "./constants";

/** Resultado padrão das Server Actions do Comercial. */
export type ActionError = { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
export type ActionResult = { ok: true } | ActionError;
/** Igual a ActionResult, para ações que devolvem dados. */
export type DataResult<T> = { ok: true; data: T } | ActionError;

/** Lead como o pipeline e a gaveta de detalhes usam (serializável). */
export type PipelineLead = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  referrerName: string | null;
  temperature: LeadTemperature;
  description: string | null;
  ownerId: string | null;
  createdBy: string | null;
  stage: PipelineStage;
  position: number;
  dealType: DealType | null;
  dealValueCents: number | null;
  lostReason: string | null;
  closedAt: string | null;
  createdAt: string;
};

/** Funcionário ativo para selects e avatares. `avatarUrl` é URL assinada (1 h). */
export type MemberOption = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type StageHistoryEntry = {
  id: string;
  fromStage: PipelineStage | null;
  toStage: PipelineStage;
  changedByName: string | null;
  changedAt: string;
};
