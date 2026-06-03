import { clearAuthSession, getOrCreateDeviceId, readAuthSession } from "@/features/auth/lib/authSession";
import { authApi } from "@/features/auth/lib/authApi";

const DEFAULT_LOCAL_API_ORIGIN = "http://127.0.0.1";
const LOCAL_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const AUTHORIZATION_BASE_PATH = "/authorization";

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function isNonDefaultHttpPort(port) {
  return Boolean(port) && port !== "80" && port !== "443";
}

function resolveApiBaseUrl() {
  const configuredOrigin = trimTrailingSlash(
    process.env.NEXT_PUBLIC_CORE_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL,
  );

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (typeof window === "undefined") {
    return "";
  }

  const { hostname, origin, port } = window.location;
  const isLoopbackHost = LOCAL_DEV_HOSTNAMES.has(hostname);

  if (isLoopbackHost && isNonDefaultHttpPort(port)) {
    return DEFAULT_LOCAL_API_ORIGIN;
  }

  if (!isLoopbackHost && isNonDefaultHttpPort(port)) {
    return `${window.location.protocol}//${hostname}`;
  }

  return origin;
}

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiBaseUrl()}${normalizedPath}`;
}

async function parseResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? text : null;
}

function extractErrorMessage(body, response) {
  if (typeof body === "string" && body.trim()) {
    return body;
  }

  if (body && typeof body === "object") {
    const candidates = [
      body.mensagem,
      body.message,
      body.error,
      body.detail,
      body.title,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }

  return `Nao foi possivel concluir a solicitacao (${response.status}).`;
}

async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    retryOnAuthFailure = true,
  } = options;

  const session = readAuthSession();

  if (!session?.accessToken) {
    throw new Error("Sessao autenticada nao encontrada. Entre novamente.");
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${session.accessToken}`,
    "X-Device-Id": getOrCreateDeviceId(),
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new Error("Nao foi possivel conectar ao core-api de autorizacao.");
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && retryOnAuthFailure) {
      await authApi.refresh();
      return request(path, {
        ...options,
        retryOnAuthFailure: false,
      });
    }

    if (response.status === 401) {
      clearAuthSession();
      throw new Error("Sua sessao expirou. Entre novamente.");
    }

    throw new Error(extractErrorMessage(payload, response));
  }

  return payload;
}

export const authorizationApi = {
  findAllRoles() {
    return request(`${AUTHORIZATION_BASE_PATH}/roles`);
  },
  createRole(payload) {
    return request(`${AUTHORIZATION_BASE_PATH}/roles`, {
      method: "POST",
      body: payload,
    });
  },
  updateRole(roleId, payload) {
    return request(`${AUTHORIZATION_BASE_PATH}/roles/${roleId}`, {
      method: "PUT",
      body: payload,
    });
  },
  activateRole(roleId) {
    return request(`${AUTHORIZATION_BASE_PATH}/roles/${roleId}/activate`, {
      method: "PATCH",
    });
  },
  deactivateRole(roleId) {
    return request(`${AUTHORIZATION_BASE_PATH}/roles/${roleId}/deactivate`, {
      method: "PATCH",
    });
  },
  deleteRole(roleId) {
    return request(`${AUTHORIZATION_BASE_PATH}/roles/${roleId}`, {
      method: "DELETE",
    });
  },
  findAllPermissions() {
    return request(`${AUTHORIZATION_BASE_PATH}/permissions`);
  },
  findPermissionsByRole(roleId) {
    return request(`${AUTHORIZATION_BASE_PATH}/roles/${roleId}/permissions`);
  },
  assignPermissionToRole(roleId, permissionId) {
    return request(`${AUTHORIZATION_BASE_PATH}/roles/${roleId}/permissions/${permissionId}`, {
      method: "POST",
    });
  },
  removePermissionFromRole(roleId, permissionId) {
    return request(`${AUTHORIZATION_BASE_PATH}/roles/${roleId}/permissions/${permissionId}`, {
      method: "DELETE",
    });
  },
  findRolesByUser(userId) {
    return request(`${AUTHORIZATION_BASE_PATH}/users/${userId}/roles`);
  },
  replaceUserRoles(userId, roleIds) {
    return request(`${AUTHORIZATION_BASE_PATH}/users/${userId}/roles`, {
      method: "PUT",
      body: { roleIds },
    });
  },
};
