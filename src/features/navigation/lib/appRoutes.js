export const APP_ROUTES = Object.freeze({
  ROOT: "/",
  HOME: "/home",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  PASSWORD_RECOVERY_RESET: "/password-recovery/reset",
  DPO: "/dpo",
  AUTHORIZATION_ROLES: "/app/roles",
  SERVER_MANAGER: "/servidor",
});

export function getRouteSegment(route) {
  return String(route || "")
    .replace(/^\/+/, "")
    .split("/")[0] || "";
}

export function matchesRoute(pathname, route) {
  const normalizedPathname = String(pathname || "");
  const normalizedRoute = String(route || "");

  if (!normalizedRoute) {
    return false;
  }

  return (
    normalizedPathname === normalizedRoute ||
    normalizedPathname.startsWith(`${normalizedRoute}/`)
  );
}
