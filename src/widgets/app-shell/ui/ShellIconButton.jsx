export default function ShellIconButton({
  active = false,
  children,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5 hover:border-[color:var(--shell-text)] hover:text-[var(--shell-text)] ${
        active
          ? "border-[color:var(--shell-contrast)] bg-[var(--shell-contrast)] text-[var(--shell-contrast-ink)]"
          : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] text-[var(--shell-muted)]"
      }`}
    >
      {children}
    </button>
  );
}
