import {
  ChevronRightIcon,
  LogoutIcon,
  MoonIcon,
} from "@/widgets/app-shell/ui/ShellIcons";

function Avatar({
  imageUrl,
  label,
  sizeClassName = "h-11 w-11",
  textClassName = "text-sm",
}) {
  if (imageUrl) {
    return (
      <span
        className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-[var(--shell-surface-muted)] ${sizeClassName}`}
      >
        {/* Origem da foto ainda e dinamica; manter img evita acoplar next/image a hosts nao definidos. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[var(--shell-contrast)] font-semibold text-[var(--shell-contrast-ink)] ${sizeClassName} ${textClassName}`}
    >
      {label}
    </span>
  );
}

function MenuActionButton({
  children,
  disabled = false,
  label,
  onClick,
  tone = "default",
  trailing,
}) {
  const toneClass =
    tone === "danger"
      ? "text-[var(--shell-danger)] hover:bg-[var(--shell-danger-bg)]"
      : "text-[var(--shell-text)] hover:bg-[var(--shell-surface-muted)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${toneClass}`}
    >
      <span className="inline-flex items-center gap-3">
        {children}
        {label}
      </span>
      {trailing}
    </button>
  );
}

export function ProfileAvatar({ imageUrl, label }) {
  return <Avatar imageUrl={imageUrl} label={label} />;
}

export default function ProfileMenu({
  avatarLabel,
  avatarUrl,
  isDark,
  isLoggingOut,
  onLogout,
  onToggleTheme,
  profileHeading,
  roleSummary,
}) {
  return (
    <div className="absolute right-0 z-40 mt-3 w-[min(88vw,340px)] rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-4 shadow-[0_24px_80px_rgba(20,32,43,0.18)]">
      <div className="rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4">
        <div className="flex items-center gap-3">
          <Avatar
            imageUrl={avatarUrl}
            label={avatarLabel}
            sizeClassName="h-12 w-12"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--shell-text)]">
              {profileHeading}
            </p>
            <p className="mt-1 text-sm text-[var(--shell-muted)]">
              {roleSummary || "Perfil autenticado"}
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-[color:var(--shell-line)] pt-4">
          <MenuActionButton
            onClick={onToggleTheme}
            label={isDark ? "Usar modo claro" : "Ativar modo escuro"}
            trailing={
              <span className="rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                {isDark ? "Escuro" : "Claro"}
              </span>
            }
          >
            <MoonIcon />
          </MenuActionButton>

          <div className="mt-4 border-t border-[color:var(--shell-line)] pt-4">
            <MenuActionButton
              onClick={onLogout}
              disabled={isLoggingOut}
              label={isLoggingOut ? "Saindo..." : "Sair"}
              tone="danger"
              trailing={<ChevronRightIcon />}
            >
              <LogoutIcon />
            </MenuActionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
