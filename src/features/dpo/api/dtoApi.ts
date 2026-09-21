import {
  authApi,
  clearAuthSession,
  getOrCreateDeviceId,
  readAuthSession,
} from "@/features/auth";
import { buildGatewayUrl } from "@/shared/network/gatewayUrl";
import type {
  DtoConfigurationUpdate,
  DtoFormDetail,
  DtoFormConfiguration,
  DtoFormsResponse,
  DtoRefreshJob,
  DtoRefreshRequest,
  DtoPlanningItem,
  DtoPlanningPayload,
  DtoPlanningResponse,
  DtoTrackingContext,
  WorkforceFilterCatalog,
  WorkforceTrackingFilter,
  WorkforceTrackingFilterPayload,
} from "@/features/dpo/model/dtoTypes";

interface DtoRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  retryOnAuthFailure?: boolean;
  signal?: AbortSignal;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const rawText = await response.text();
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function extractErrorMessage(
  payload: unknown,
  response: Response,
  resourceLabel: string,
): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const errorPayload = payload as Record<string, unknown>;
    const candidates = [
      errorPayload.message,
      errorPayload.mensagem,
      errorPayload.error,
      errorPayload.detail,
      errorPayload.title,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }

  return `Não foi possível consultar ${resourceLabel} (${response.status}).`;
}

async function request<T>(
  apiPrefix: string,
  resourceLabel: string,
  path: string,
  {
    method = "GET",
    body,
    retryOnAuthFailure = true,
    signal,
  }: DtoRequestOptions = {},
): Promise<T> {
  const session = readAuthSession();

  if (!session?.accessToken) {
    throw new Error("Sessão autenticada não encontrada. Entre novamente.");
  }

  let response: Response;

  try {
    response = await fetch(buildGatewayUrl(`${apiPrefix}${path}`), {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${session.accessToken}`,
        "X-Device-Id": getOrCreateDeviceId(),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new Error(`Não foi possível conectar ao serviço de ${resourceLabel}.`);
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && retryOnAuthFailure) {
      await authApi.refresh();
      return request<T>(apiPrefix, resourceLabel, path, {
        method,
        body,
        retryOnAuthFailure: false,
        signal,
      });
    }

    if (response.status === 401) {
      clearAuthSession();
      throw new Error("Sua sessão expirou. Entre novamente.");
    }

    throw new Error(extractErrorMessage(payload, response, resourceLabel));
  }

  return payload as T;
}

export function createDtoApi(apiPrefix: string, resourceLabel: string) {
  return {
  listForms(signal?: AbortSignal) {
    return request<DtoFormsResponse>(apiPrefix, resourceLabel, "/forms", { signal });
  },
  refreshForms(signal?: AbortSignal) {
    return request<DtoFormsResponse>(apiPrefix, resourceLabel, "/forms/refresh", {
      method: "POST",
      signal,
    });
  },
  getForm(formId: string, signal?: AbortSignal) {
    return request<DtoFormDetail>(apiPrefix, resourceLabel, `/forms/${encodeURIComponent(formId)}`, {
      signal,
    });
  },
  startFormRefresh(
    formId: string,
    period: DtoRefreshRequest,
    signal?: AbortSignal,
  ) {
    return request<DtoRefreshJob>(apiPrefix, resourceLabel,
      `/forms/${encodeURIComponent(formId)}/refresh`,
      { method: "POST", body: period, signal },
    );
  },
  checkFormRefresh(formId: string, jobId: string, signal?: AbortSignal) {
    return request<DtoRefreshJob>(apiPrefix, resourceLabel,
      `/forms/${encodeURIComponent(formId)}/refresh/${encodeURIComponent(jobId)}`,
      { signal },
    );
  },
  getConfiguration(formId: string, signal?: AbortSignal) {
    return request<DtoFormConfiguration>(apiPrefix, resourceLabel,
      `/forms/${encodeURIComponent(formId)}/configuration`,
      { signal },
    );
  },
  getTrackingContext(
    formId: string,
    filters?: { workforceFilterId?: string; workforceLocation?: string },
    signal?: AbortSignal,
  ) {
    const query = new URLSearchParams();
    if (filters?.workforceFilterId) query.set("workforce_filter_id", filters.workforceFilterId);
    if (filters?.workforceLocation) query.set("workforce_location", filters.workforceLocation);
    const suffix = query.size ? `?${query.toString()}` : "";
    return request<DtoTrackingContext>(apiPrefix, resourceLabel,
      `/forms/${encodeURIComponent(formId)}/tracking-context${suffix}`,
      { signal },
    );
  },
  getPlanning(formId: string, signal?: AbortSignal) {
    return request<DtoPlanningResponse>(apiPrefix, resourceLabel,
      `/forms/${encodeURIComponent(formId)}/planning`, { signal },
    );
  },
  createPlanning(
    formId: string,
    payload: DtoPlanningPayload,
    signal?: AbortSignal,
  ) {
    return request<DtoPlanningItem>(apiPrefix, resourceLabel,
      `/forms/${encodeURIComponent(formId)}/planning`,
      { method: "POST", body: payload, signal },
    );
  },
  updatePlanning(
    formId: string,
    itemId: string,
    payload: DtoPlanningPayload,
    signal?: AbortSignal,
  ) {
    return request<DtoPlanningItem>(apiPrefix, resourceLabel,
      `/forms/${encodeURIComponent(formId)}/planning/${encodeURIComponent(itemId)}`,
      { method: "PUT", body: payload, signal },
    );
  },
  deletePlanning(formId: string, itemId: string, signal?: AbortSignal) {
    return request<DtoPlanningItem>(apiPrefix, resourceLabel,
      `/forms/${encodeURIComponent(formId)}/planning/${encodeURIComponent(itemId)}`,
      { method: "DELETE", signal },
    );
  },
  getWorkforceFilterCatalog(signal?: AbortSignal) {
    return request<WorkforceFilterCatalog>(
      "/api/savi/api/v1/tracking-filters", "filtros de acompanhamento", "/catalog", { signal },
    );
  },
  listWorkforceFilters(signal?: AbortSignal) {
    return request<WorkforceTrackingFilter[]>(
      "/api/savi/api/v1/tracking-filters", "filtros de acompanhamento", "", { signal },
    );
  },
  createWorkforceFilter(payload: WorkforceTrackingFilterPayload, signal?: AbortSignal) {
    return request<WorkforceTrackingFilter>(
      "/api/savi/api/v1/tracking-filters", "filtros de acompanhamento", "", { method: "POST", body: payload, signal },
    );
  },
  updateWorkforceFilter(
    filterId: string,
    payload: WorkforceTrackingFilterPayload,
    signal?: AbortSignal,
  ) {
    return request<WorkforceTrackingFilter>(
      "/api/savi/api/v1/tracking-filters", "filtros de acompanhamento", `/${encodeURIComponent(filterId)}`,
      { method: "PUT", body: payload, signal },
    );
  },
  deleteWorkforceFilter(filterId: string, creationPassword: string, signal?: AbortSignal) {
    return request<WorkforceTrackingFilter>(
      "/api/savi/api/v1/tracking-filters", "filtros de acompanhamento", `/${encodeURIComponent(filterId)}`,
      { method: "DELETE", body: { creation_password: creationPassword }, signal },
    );
  },
  updateConfiguration(
    formId: string,
    update: DtoConfigurationUpdate,
    signal?: AbortSignal,
  ) {
    return request<DtoFormConfiguration>(apiPrefix, resourceLabel,
      `/forms/${encodeURIComponent(formId)}/configuration`,
      { method: "PUT", body: update, signal },
    );
  },
  };
}

export type DtoApi = ReturnType<typeof createDtoApi>;

export const dtoApi = createDtoApi("/api/savi/api/v1/dtos", "DTOs");
export const blitzApi = createDtoApi("/api/savi/api/v1/blitz", "Blitz");
export const securityTemplatesApi = createDtoApi(
  "/api/savi/api/v1/gabaritos-seguranca",
  "Gabaritos de Segurança",
);
