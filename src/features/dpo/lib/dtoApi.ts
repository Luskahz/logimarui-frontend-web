import {
  clearAuthSession,
  getOrCreateDeviceId,
  readAuthSession,
} from "@/features/auth/lib/authSession";
import { authApi } from "@/features/auth/lib/authApi";
import { buildGatewayUrl } from "@/shared/network/gatewayUrl";
import type {
  DtoConfigurationUpdate,
  DtoFormDetail,
  DtoFormConfiguration,
  DtoFormsResponse,
  DtoRefreshJob,
  DtoRefreshRequest,
} from "@/features/dpo/lib/dtoTypes";

const DTO_API_PREFIX = "/api/savi/api/v1/dtos";

interface DtoRequestOptions {
  method?: "GET" | "POST" | "PUT";
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

function extractErrorMessage(payload: unknown, response: Response): string {
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

  return `Não foi possível consultar as DTOs (${response.status}).`;
}

async function request<T>(
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
    response = await fetch(buildGatewayUrl(`${DTO_API_PREFIX}${path}`), {
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

    throw new Error("Não foi possível conectar ao serviço de DTOs.");
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && retryOnAuthFailure) {
      await authApi.refresh();
      return request<T>(path, {
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

    throw new Error(extractErrorMessage(payload, response));
  }

  return payload as T;
}

export const dtoApi = {
  listForms(signal?: AbortSignal) {
    return request<DtoFormsResponse>("/forms", { signal });
  },
  refreshForms(signal?: AbortSignal) {
    return request<DtoFormsResponse>("/forms/refresh", {
      method: "POST",
      signal,
    });
  },
  getForm(formId: string, signal?: AbortSignal) {
    return request<DtoFormDetail>(`/forms/${encodeURIComponent(formId)}`, {
      signal,
    });
  },
  startFormRefresh(
    formId: string,
    period: DtoRefreshRequest,
    signal?: AbortSignal,
  ) {
    return request<DtoRefreshJob>(
      `/forms/${encodeURIComponent(formId)}/refresh`,
      { method: "POST", body: period, signal },
    );
  },
  checkFormRefresh(formId: string, jobId: string, signal?: AbortSignal) {
    return request<DtoRefreshJob>(
      `/forms/${encodeURIComponent(formId)}/refresh/${encodeURIComponent(jobId)}`,
      { signal },
    );
  },
  getConfiguration(formId: string, signal?: AbortSignal) {
    return request<DtoFormConfiguration>(
      `/forms/${encodeURIComponent(formId)}/configuration`,
      { signal },
    );
  },
  updateConfiguration(
    formId: string,
    update: DtoConfigurationUpdate,
    signal?: AbortSignal,
  ) {
    return request<DtoFormConfiguration>(
      `/forms/${encodeURIComponent(formId)}/configuration`,
      { method: "PUT", body: update, signal },
    );
  },
};
