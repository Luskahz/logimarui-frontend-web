const LOCAL_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
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

  return window.location.origin;
}

export function buildGatewayUrl(path) {
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${resolveGatewayBaseUrl()}${normalizedPath}`;
}