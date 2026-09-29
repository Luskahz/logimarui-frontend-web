import { authApi, clearAuthSession, getOrCreateDeviceId, readAuthSession } from "@/features/auth";
import { buildGatewayUrl } from "@/shared/network/gatewayUrl";
import type { Indicator, JourneyItem, JourneyQuery, JourneyResponse, PeriodResponse } from "../model/types";

export function buildJourneyPath(query: JourneyQuery): string {
  const params = new URLSearchParams({ from: query.from, to: query.to, expurge: query.expurge });
  if (query.indicator !== "tr") params.set("mode", query.mode);
  if (query.map.trim()) params.set("map", query.map.trim());
  if (query.employeeCode.trim()) params.set("employeeCode", query.employeeCode.trim());
  if (query.role !== "all") params.set("role", query.role);
  return `/api/v1/journey/${query.indicator}?${params.toString()}`;
}

/** Validates the envelope before UI code receives the typed contract. */
export function normalizeJourneyResponse<T extends JourneyItem>(value: unknown, indicator?: Indicator): PeriodResponse<T> {
  if (!value || typeof value !== "object") throw new Error("Resposta de Jornada inválida.");
  const payload = value as Record<string, unknown>;
  if (typeof payload.from !== "string" || typeof payload.to !== "string" ||
      (payload.snapshotAt !== null && typeof payload.snapshotAt !== "string") ||
      !Array.isArray(payload.items)) throw new Error("Resposta de Jornada inválida.");
  for (const item of payload.items) {
    if (!item || typeof item !== "object" || !("context" in item) ||
        !item.context || typeof item.context !== "object" ||
        !("map" in item.context) || !("employeeCode" in item.context) ||
        !("expurge" in item) || !item.expurge || typeof item.expurge !== "object" ||
        !("snapshotAt" in item) ||
        (indicator !== undefined && (!(indicator in item) ||
          !item[indicator] || typeof item[indicator] !== "object"))) {
      throw new Error("Linha de Jornada inválida.");
    }
  }
  return payload as unknown as PeriodResponse<T>;
}

async function request(query: JourneyQuery, signal?: AbortSignal, retry = true): Promise<JourneyResponse> {
  const session = readAuthSession();
  if (!session?.accessToken) throw new Error("Sessão autenticada não encontrada. Entre novamente.");
  let response: Response;
  try {
    response = await fetch(buildGatewayUrl(buildJourneyPath(query)), {
      signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
        "X-Device-Id": getOrCreateDeviceId(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("Não foi possível conectar ao serviço de Jornada.");
  }
  if (response.status === 401 && retry) {
    await authApi.refresh();
    return request(query, signal, false);
  }
  if (response.status === 401) {
    clearAuthSession();
    throw new Error("Sua sessão expirou. Entre novamente.");
  }
  if (!response.ok) {
    throw new Error(`Não foi possível consultar a Jornada (${response.status}).`);
  }
  return normalizeJourneyResponse<JourneyItem>(await response.json(), query.indicator) as JourneyResponse;
}

export const journeyApi = {
  get(query: JourneyQuery, signal?: AbortSignal) {
    return request(query, signal);
  },
};
