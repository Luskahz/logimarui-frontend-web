import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Typography } from "@/shared/ui/typography";
import { cn } from "@/lib/utils";

export function DtoPanel({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "gap-0 overflow-visible rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] py-0 text-[var(--shell-text)] shadow-none ring-0",
        className,
      )}
      {...props}
    />
  );
}

type DtoButtonProps = ComponentProps<typeof Button> & {
  tone?: "default" | "accent" | "danger";
};

export function DtoButton({
  className,
  tone = "default",
  ...props
}: DtoButtonProps) {
  const toneClass =
    tone === "accent"
      ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)] text-[var(--shell-accent)] hover:bg-[var(--shell-accent-soft)]"
      : tone === "danger"
        ? "border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)] text-[var(--shell-danger)] hover:bg-[var(--shell-danger-bg)]"
        : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] text-[var(--shell-text)] hover:border-[color:var(--shell-line-strong)] hover:bg-[var(--shell-surface-muted)]";

  return (
    <Button
      variant="outline"
      className={cn(
        "h-10 gap-2 rounded-2xl px-3.5 font-semibold shadow-none focus-visible:border-[color:var(--shell-accent)] focus-visible:ring-[var(--shell-accent-soft)]",
        toneClass,
        className,
      )}
      {...props}
    />
  );
}

export function DtoBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "danger";
}) {
  const toneClass =
    tone === "accent"
      ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)] text-[var(--shell-accent)]"
      : tone === "danger"
        ? "border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)] text-[var(--shell-danger)]"
        : "border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] text-[var(--shell-muted)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

export function DtoMetricCard({
  hint,
  label,
  tone = "default",
  value,
}: {
  hint?: ReactNode;
  label: ReactNode;
  tone?: "default" | "accent" | "danger";
  value: ReactNode;
}) {
  const valueClass =
    tone === "accent"
      ? "text-[var(--shell-accent)]"
      : tone === "danger"
        ? "text-[var(--shell-danger)]"
        : "text-[var(--shell-text)]";

  return (
    <article className="min-w-0 rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
      <Typography variant="mutedOverline">{label}</Typography>
      <p className={cn("mt-3 break-words text-2xl font-semibold", valueClass)}>
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-[var(--shell-muted)]">{hint}</p>
      ) : null}
    </article>
  );
}

export function DtoStatePanel({
  action,
  description,
  title,
  tone = "default",
}: {
  action?: ReactNode;
  description: ReactNode;
  title: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <DtoPanel
      className={cn(
        "p-6 sm:p-8",
        tone === "danger" &&
          "border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)]",
      )}
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          className={cn(
            "text-xl font-semibold text-[var(--shell-text)]",
            tone === "danger" && "text-[var(--shell-danger)]",
          )}
        >
          {title}
        </h2>
        <div className="mt-3 text-sm leading-7 text-[var(--shell-muted)]">
          {description}
        </div>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </DtoPanel>
  );
}

export function DtoDashboardSkeleton() {
  return (
    <div aria-label="Carregando Gerenciador de DTOs" className="space-y-4">
      <div className="h-44 animate-pulse rounded-[28px] bg-[var(--shell-surface-muted)]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-[22px] bg-[var(--shell-surface-muted)]"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-[28px] bg-[var(--shell-surface-muted)]"
          />
        ))}
      </div>
    </div>
  );
}

