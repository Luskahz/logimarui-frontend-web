"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import AppHeader from "@/shared/app-shell/components/AppHeader";
import AppSidebar from "@/shared/app-shell/components/AppSidebar";
import ShellLoadingState from "@/shared/app-shell/components/ShellLoadingState";
import { useShellStore } from "@/shared/app-shell/store/useShellStore";
import { useUiTheme } from "@/shared/ui/theme/hooks/useUiTheme";

function canAccessNavigationItem(item, authorities) {
  if (
    !Array.isArray(item.requiredAuthorities) ||
    item.requiredAuthorities.length === 0
  ) {
    return true;
  }

  return item.requiredAuthorities.every((authority) =>
    authorities.includes(authority),
  );
}

export default function AuthenticatedShell({
  authorities = [],
  breadcrumbs = [],
  children,
  contentClassName,
  homeHref = "/",
  isLoggingOut = false,
  mainClassName,
  navigationItems = [],
  onLogout,
  serviceItems = [],
  sessionStatus,
  user = {},
}) {
  const pathname = usePathname() || "/";
  const { isDark, toggleTheme } = useUiTheme();
  const activeSidebarPanel = useShellStore((state) => state.activeSidebarPanel);
  const closePanels = useShellStore((state) => state.closePanels);
  const headerHidden = useShellStore((state) => state.headerHidden);
  const profileMenuOpen = useShellStore((state) => state.profileMenuOpen);
  const setHeaderHidden = useShellStore((state) => state.setHeaderHidden);
  const sidebarOpen = useShellStore((state) => state.sidebarOpen);
  const toggleProfileMenu = useShellStore((state) => state.toggleProfileMenu);
  const toggleSidebar = useShellStore((state) => state.toggleSidebar);
  const toggleSidebarPanel = useShellStore((state) => state.toggleSidebarPanel);
  const lastScrollYRef = useRef(0);

  const visibleNavigationItems = useMemo(
    () =>
      navigationItems.filter((item) =>
        canAccessNavigationItem(item, authorities),
      ),
    [authorities, navigationItems],
  );
  const showHeader = !headerHidden || sidebarOpen || profileMenuOpen;
  const overlayZClass = sidebarOpen ? "z-[55]" : "z-30";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current;
      const scrollDelta = currentScrollY - previousScrollY;

      if (currentScrollY <= 24) {
        setHeaderHidden(false);
      } else if (scrollDelta > 8) {
        setHeaderHidden(true);
      } else if (scrollDelta < -8) {
        setHeaderHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [setHeaderHidden]);

  if (sessionStatus === "loading") {
    return <ShellLoadingState />;
  }

  return (
    <div className="home-shell">
      {sidebarOpen || profileMenuOpen ? (
        <button
          type="button"
          aria-label="Fechar paineis"
          onClick={closePanels}
          className={`fixed inset-0 bg-[var(--shell-overlay)] backdrop-blur-[1px] ${overlayZClass}`}
        />
      ) : null}

      <AppHeader
        avatarLabel={user.avatarLabel}
        avatarUrl={user.avatarUrl}
        breadcrumbs={breadcrumbs}
        homeHref={homeHref}
        isDark={isDark}
        isLoggingOut={isLoggingOut}
        onClosePanels={closePanels}
        onLogout={onLogout}
        onToggleProfileMenu={toggleProfileMenu}
        onToggleSidebar={toggleSidebar}
        onToggleTheme={toggleTheme}
        profileHeading={user.profileHeading}
        profileMenuOpen={profileMenuOpen}
        roleSummary={user.roleSummary}
        show={showHeader}
        sidebarOpen={sidebarOpen}
      />

      {sidebarOpen ? (
        <AppSidebar
          activeSidebarPanel={activeSidebarPanel}
          items={visibleNavigationItems}
          onClose={closePanels}
          onNavigate={closePanels}
          onTogglePanel={toggleSidebarPanel}
          pathname={pathname}
          serviceItems={serviceItems}
        />
      ) : null}

      <main className={mainClassName}>
        <div className={contentClassName}>{children}</div>
      </main>
    </div>
  );
}
