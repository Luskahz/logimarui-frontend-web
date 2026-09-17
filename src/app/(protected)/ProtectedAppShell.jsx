"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  APP_SERVICE_ITEMS,
  APP_SIDEBAR_ITEMS,
  buildAppBreadcrumbs,
  resolveAppShellLayout,
} from "@/app/_config/navigation";
import { APP_ROUTES } from "@/app/_config/routes";
import { useAuthenticatedSession } from "@/features/auth/hooks/useAuthenticatedSession";
import { formatRoles } from "@/features/auth/lib/authFormatters";
import {
  buildAvatarLabel,
  resolveAuthorities,
  resolveAvatarUrl,
  resolveProfileName,
} from "@/features/auth/lib/sessionView";
import AuthenticatedShell from "@/widgets/app-shell/ui/AuthenticatedShell";

export default function ProtectedAppShell({ children }) {
  const pathname = usePathname();
  const { isLoggingOut, logout, profile, roles, status } =
    useAuthenticatedSession();

  const authorities = useMemo(() => resolveAuthorities(profile), [profile]);
  const breadcrumbs = useMemo(
    () => buildAppBreadcrumbs(pathname),
    [pathname],
  );
  const layout = useMemo(() => resolveAppShellLayout(pathname), [pathname]);
  const user = useMemo(
    () => ({
      avatarLabel: buildAvatarLabel(profile),
      avatarUrl: resolveAvatarUrl(profile),
      profileHeading: resolveProfileName(profile),
      roleSummary: formatRoles(roles),
    }),
    [profile, roles],
  );

  return (
    <AuthenticatedShell
      authorities={authorities}
      breadcrumbs={breadcrumbs}
      contentClassName={layout.contentClassName}
      homeHref={APP_ROUTES.HOME}
      isLoggingOut={isLoggingOut}
      mainClassName={layout.mainClassName}
      navigationItems={APP_SIDEBAR_ITEMS}
      onLogout={logout}
      serviceItems={APP_SERVICE_ITEMS}
      sessionStatus={status}
      user={user}
    >
      {children}
    </AuthenticatedShell>
  );
}
