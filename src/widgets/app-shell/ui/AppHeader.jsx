import Link from "next/link";
import AppBreadcrumbs from "@/widgets/app-shell/ui/AppBreadcrumbs";
import ProfileMenu, {
  ProfileAvatar,
} from "@/widgets/app-shell/ui/ProfileMenu";
import ShellIconButton from "@/widgets/app-shell/ui/ShellIconButton";
import {
  MenuIcon,
  SearchIcon,
} from "@/widgets/app-shell/ui/ShellIcons";

export default function AppHeader({
  avatarLabel,
  avatarUrl,
  breadcrumbs,
  homeHref,
  isDark,
  isLoggingOut,
  onClosePanels,
  onLogout,
  onToggleProfileMenu,
  onToggleSidebar,
  onToggleTheme,
  profileHeading,
  profileMenuOpen,
  roleSummary,
  show,
  sidebarOpen,
}) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-4 py-4 transition-transform duration-300 sm:px-6 ${
        show ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] px-4 py-4 shadow-[0_18px_60px_rgba(20,32,43,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <ShellIconButton
              active={sidebarOpen}
              label="Abrir menu lateral"
              onClick={onToggleSidebar}
            >
              <MenuIcon />
            </ShellIconButton>

            <Link
              href={homeHref}
              onClick={onClosePanels}
              className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-2 transition hover:border-[color:var(--shell-line-strong)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--shell-muted)]">
                Logimarui
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--shell-text)]">
                Home operacional
              </p>
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-3 lg:flex">
            <AppBreadcrumbs items={breadcrumbs} onNavigate={onClosePanels} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ShellIconButton label="Busca">
              <SearchIcon />
            </ShellIconButton>

            <div className="relative">
              <button
                type="button"
                onClick={onToggleProfileMenu}
                aria-label="Abrir menu de perfil"
                className="rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-1.5 text-left transition hover:border-[color:var(--shell-text)]"
              >
                <ProfileAvatar imageUrl={avatarUrl} label={avatarLabel} />
              </button>

              {profileMenuOpen ? (
                <ProfileMenu
                  avatarLabel={avatarLabel}
                  avatarUrl={avatarUrl}
                  isDark={isDark}
                  isLoggingOut={isLoggingOut}
                  onLogout={onLogout}
                  onToggleTheme={onToggleTheme}
                  profileHeading={profileHeading}
                  roleSummary={roleSummary}
                />
              ) : null}
            </div>
          </div>

          <div className="w-full lg:hidden">
            <AppBreadcrumbs
              items={breadcrumbs}
              mobile
              onNavigate={onClosePanels}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
