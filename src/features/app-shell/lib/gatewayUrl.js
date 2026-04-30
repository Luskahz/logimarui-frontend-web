const DEFAULT_LOCAL_GATEWAY_ORIGIN = "http://127.0.0.1";
const LOCAL_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function isNonDefaultHttpPort(port) {
  return Boolean(port) && port !== "80" && port !== "443";
}

export function resolveGatewayBaseUrl() {
  const configuredOrigin = trimTrailingSlash(
    process.env.NEXT_PUBLIC_GATEWAY_URL ||
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

  const { hostname, origin, port, protocol } = window.location;
  const isLoopbackHost = LOCAL_DEV_HOSTNAMES.has(hostname);

  if (isLoopbackHost && isNonDefaultHttpPort(port)) {
    return DEFAULT_LOCAL_GATEWAY_ORIGIN;
  }

  if (!isLoopbackHost && isNonDefaultHttpPort(port)) {
    return `${protocol}//${hostname}`;
  }

  return origin;
}

export function buildGatewayUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveGatewayBaseUrl()}${normalizedPath}`;
}
