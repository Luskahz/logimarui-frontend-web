import {
  clearAuthSession,
  getOrCreateDeviceId,
  readAuthSession,
  saveAuthSession,
} from "@/features/auth/lib/authSession";
import {
  buildTestAuthProfile,
  buildTestAuthTokens,
  isTestAccessToken,
  isTestAuthSession,
} from "@/features/auth/lib/testAuth";

const DEFAULT_LOCAL_API_ORIGIN = "http://127.0.0.1";
const LOCAL_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

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

function buildForbiddenMessage(path) {
  if (path === "/auth/register") {
    return "Cadastro recusado pelo servico de autenticacao. Verifique se o CPF informado esta autorizado para criacao de acesso.";
  }

  if (/^\/auth\/employees\/\d+\/name$/.test(path)) {
    return "Nao foi possivel validar o dado informado para cadastro.";
  }

  return "A solicitacao foi recusada pelo servico de autenticacao.";
}

function buildStoredTestProfile(session) {
  return session?.profile || buildTestAuthProfile();
}

async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    authenticated = false,
    accessToken,
    retryOnAuthFailure = authenticated && !accessToken,
  } = options;
  const headers = {
    Accept: "application/json",
    "X-Device-Id": getOrCreateDeviceId(),
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const storedSession =
    authenticated && !accessToken ? readAuthSession() : null;
  const tokenToUse = accessToken || storedSession?.accessToken;

  if (authenticated && tokenToUse) {
    headers.Authorization = `Bearer ${tokenToUse}`;
  }

  let response;

  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Nao foi possivel conectar ao core-api de autenticacao.");
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    if (authenticated && response.status === 401 && retryOnAuthFailure) {
      await refreshSession();
      return request(path, {
        ...options,
        accessToken: undefined,
        retryOnAuthFailure: false,
      });
    }

    if (response.status === 403 && !payload) {
      throw new Error(buildForbiddenMessage(path));
    }

    throw new Error(extractErrorMessage(payload, response));
  }

  return payload;
}

export async function refreshSession() {
  const session = readAuthSession();

  if (isTestAuthSession(session)) {
    return saveAuthSession(buildTestAuthTokens(), buildStoredTestProfile(session));
  }

  if (!session?.refreshToken) {
    clearAuthSession();
    throw new Error("Sua sessao expirou. Entre novamente.");
  }

  try {
    const tokens = await request("/auth/refresh", {
      method: "POST",
      body: {
        refreshToken: session.refreshToken,
      },
      retryOnAuthFailure: false,
    });

    return saveAuthSession(tokens, session.profile);
  } catch (error) {
    clearAuthSession();
    throw error;
  }
}

export const authApi = {
  login(payload) {
    return request("/auth/login", {
      method: "POST",
      body: payload,
    });
  },
  register(payload) {
    return request("/auth/register", {
      method: "POST",
      body: payload,
    });
  },
  forgotPassword(payload) {
    return request("/auth/forgot-password", {
      method: "POST",
      body: payload,
    });
  },
  me({ accessToken } = {}) {
    const storedSession = readAuthSession();

    if (isTestAuthSession(storedSession) || isTestAccessToken(accessToken)) {
      return Promise.resolve(buildStoredTestProfile(storedSession));
    }

    return request("/auth/me", {
      authenticated: true,
      accessToken,
      retryOnAuthFailure: !accessToken,
    });
  },
  logout() {
    if (isTestAuthSession(readAuthSession())) {
      return Promise.resolve(null);
    }

    return request("/auth/logout", {
      method: "POST",
      authenticated: true,
    });
  },
  refresh() {
    return refreshSession();
  },
  employeeName(employeeId) {
    return request(`/auth/employees/${employeeId}/name`);
  },
};
