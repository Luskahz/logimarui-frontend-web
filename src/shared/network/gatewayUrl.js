const LOCAL_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);
const LOCAL_FRONTEND_GATEWAY_PORTS = {
  8091: "",
  8191: "81",
};

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function isNonDefaultHttpPort(port) {
  return Boolean(port) && port !== "80" && port !== "443";
}

function buildLocalGatewayOrigin(frontendPort) {
  const gatewayPort = LOCAL_FRONTEND_GATEWAY_PORTS[frontendPort];

  return gatewayPort ? `http://127.0.0.1:${gatewayPort}` : "http://127.0.0.1";
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

  const { hostname, port, protocol } = window.location;

  if (LOCAL_DEV_HOSTNAMES.has(hostname) && isNonDefaultHttpPort(port)) {
    return buildLocalGatewayOrigin(port);
  }

  if (!LOCAL_DEV_HOSTNAMES.has(hostname) && isNonDefaultHttpPort(port)) {
    return `${protocol}//${hostname}`;
  }

  return window.location.origin;
}

export function buildGatewayUrl(path) {
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${resolveGatewayBaseUrl()}${normalizedPath}`;
}
