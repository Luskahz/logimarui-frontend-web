const LOCAL_FRONTEND_GATEWAY_PORTS = {
  8091: "",
  8191: "81",
};

function trimTrailingSlash(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function buildMappedGatewayOrigin(protocol, hostname, frontendPort) {
  const gatewayPort = LOCAL_FRONTEND_GATEWAY_PORTS[frontendPort];

  if (gatewayPort === undefined) {
    return "";
  }

  return `${protocol}//${hostname}${gatewayPort ? `:${gatewayPort}` : ""}`;
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
  const mappedGatewayOrigin = buildMappedGatewayOrigin(
    protocol,
    hostname,
    port,
  );

  if (mappedGatewayOrigin) {
    return mappedGatewayOrigin;
  }

  return window.location.origin;
}

export function buildGatewayUrl(path) {
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${resolveGatewayBaseUrl()}${normalizedPath}`;
}
