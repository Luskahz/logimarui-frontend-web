"use client";

import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import ExtratorSectionNav from "@/features/extrator-manager/components/ExtratorSectionNav";

export function ExtratorActionButton({
  children,
  disabled = false,
  onClick,
  tone = "default",
  type = "button",
}) {
  const toneClass =
    tone === "accent"
      ? "border-[color:var(--shell-accent)] text-[var(--shell-accent)] hover:bg-[var(--shell-accent-soft)]"
      : tone === "danger"
        ? "border-[color:var(--shell-danger)] text-[var(--shell-danger)] hover:bg-[var(--shell-danger-bg)]"
        : "border-[color:var(--shell-line)] text-[var(--shell-text)] hover:border-[color:var(--shell-line-strong)] hover:bg-[var(--shell-surface-muted)]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center rounded-2xl border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function ExtratorSectionCard({
  actions,
  bodyClassName = "",
  children,
  className = "",
  eyebrow,
  title,
}) {
  return (
    <section
      className={`rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--shell-accent)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-xl font-semibold text-[var(--shell-text)]">
            {title}
          </h2>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className={`mt-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function ExtratorMetricCard({ hint, label, tone = "default", value }) {
  const valueClass =
    tone === "accent"
      ? "text-[var(--shell-accent)]"
      : tone === "danger"
        ? "text-[var(--shell-danger)]"
        : "text-[var(--shell-text)]";

  return (
    <article className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
        {label}
      </p>
      <p className={`mt-3 text-lg font-semibold ${valueClass}`}>{value}</p>
      {hint ? (
        <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
          {hint}
        </p>
      ) : null}
    </article>
  );
}

export function ExtratorCompactMetric({ label, tone = "default", value }) {
  const valueClass =
    tone === "accent"
      ? "text-[var(--shell-accent)]"
      : tone === "danger"
        ? "text-[var(--shell-danger)]"
        : "text-[var(--shell-text)]";

  return (
    <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
        {label}
      </p>
      <p className={`mt-2 text-lg font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function ExtratorPageHeader({
  actions,
  activeTab,
  description,
  error,
  eyebrow,
  onTabChange,
  title,
}) {
  return (
    <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className={`${eyebrow ? "mt-3 " : ""}font-serif text-3xl text-[var(--shell-text)] sm:text-4xl`}>
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-sm leading-7 text-[var(--shell-muted)]">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      <ExtratorSectionNav
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {error ? (
        <div className="mt-6 rounded-2xl border border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)] px-4 py-4 text-sm text-[var(--shell-danger)]">
          {error}
        </div>
      ) : null}
    </section>
  );
}

export default function ExtratorPageShell({
  actions,
  activeTab,
  children,
  description,
  error,
  eyebrow,
  headerAfter,
  onTabChange,
  title,
}) {
  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <ExtratorPageHeader
          actions={actions}
          activeTab={activeTab}
          description={description}
          error={error}
          eyebrow={eyebrow}
          onTabChange={onTabChange}
          title={title}
        />
        {headerAfter}
        {children}
      </div>
    </AuthenticatedShell>
  );
}
