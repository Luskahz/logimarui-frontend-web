import {
  clearAuthSession,
  getOrCreateDeviceId,
  readAuthSession,
} from "@/features/auth/lib/authSession";
import { authApi } from "@/features/auth/lib/authApi";
import { buildGatewayUrl } from "@/shared/network/gatewayUrl";
import type {
  InvoiceItem,
  Occurrence,
  OrderSummary,
  PagedResponse,
  ReturnAlertContext,
} from "@/features/dpo/lib/cmeTypes";

interface RequestOptions {
  body?: unknown;
  method?: "GET" | "POST";
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

  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(payload: unknown, response: Response): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const errorPayload = payload as Record<string, unknown>;

    for (const candidate of [
      errorPayload.message,
      errorPayload.mensagem,
      errorPayload.detail,
      errorPayload.error,
      errorPayload.title,
    ]) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }

  return `Não foi possível concluir a solicitação (${response.status}).`;
}

async function request<T>(
  path: string,
  {
    body,
    method = "GET",
    retryOnAuthFailure = true,
    signal,
  }: RequestOptions = {},
): Promise<T> {
  const session = readAuthSession();

  if (!session?.accessToken) {
    throw new Error("Sessão autenticada não encontrada. Entre novamente.");
  }

  let response: Response;

  try {
    response = await fetch(buildGatewayUrl(path), {
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

    throw new Error("Não foi possível conectar ao serviço de ocorrências.");
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && retryOnAuthFailure) {
      await authApi.refresh();
      return request<T>(path, {
        body,
        method,
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

function encodeId(value: number): string {
  return encodeURIComponent(String(value));
}

export const cmeOccurrenceApi = {
  getCustomerOrders(customerId: number, signal?: AbortSignal) {
    return request<PagedResponse<OrderSummary>>(
      `/api/v1/customers/${encodeId(customerId)}/orders?page=0&size=20&sort=deliveryDate,desc`,
      { signal },
    );
  },

  getInvoiceItems(invoiceNumber: number, signal?: AbortSignal) {
    return request<PagedResponse<InvoiceItem>>(
      `/api/v1/invoices/${encodeId(invoiceNumber)}/items?page=0&size=100&sort=productCode,asc`,
      { signal },
    );
  },

  getReturnContext(
    customerId: number,
    invoiceNumber: number,
    signal?: AbortSignal,
  ) {
    return request<ReturnAlertContext>(
      `/api/v1/customers/${encodeId(customerId)}/invoices/${encodeId(invoiceNumber)}/return-context`,
      { signal },
    );
  },

  searchOccurrences(
    customerId: number,
    invoiceNumber: number,
    signal?: AbortSignal,
  ) {
    const search = new URLSearchParams({
      customerId: String(customerId),
      invoiceNumber: String(invoiceNumber),
      type: "RETURN",
      page: "0",
      size: "20",
      sort: "createdAt,desc",
    });

    return request<PagedResponse<Occurrence>>(
      `/api/v2/occurrences?${search.toString()}`,
      { signal },
    );
  },

  createReturn(customerId: number, invoiceNumber: number) {
    return request<Occurrence>("/api/v2/occurrences/returns", {
      method: "POST",
      body: { customerId, invoiceNumber },
    });
  },

  confirmReturn(occurrenceId: number) {
    return request<Occurrence>(
      `/api/v2/occurrences/${encodeId(occurrenceId)}/confirm-return`,
      { method: "POST" },
    );
  },

  revertOccurrence(occurrenceId: number) {
    return request<Occurrence>(
      `/api/v2/occurrences/${encodeId(occurrenceId)}/revert`,
      { method: "POST" },
    );
  },
};
