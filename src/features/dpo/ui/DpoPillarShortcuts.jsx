import Link from "next/link";

export default function DpoPillarShortcuts({
  items,
  title = "Acessos do pilar",
}) {
  if (!items?.length) {
    return null;
  }

  return (
    <section
      aria-labelledby="dpo-pillar-shortcuts-title"
      className="w-full rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4"
    >
      <p
        id="dpo-pillar-shortcuts-title"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]"
      >
        {title}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[color:var(--shell-line-strong)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--shell-accent)]"
          >
            <span className="text-sm font-semibold text-[var(--shell-text)]">
              {item.label}
            </span>
            <span
              aria-hidden="true"
              className="text-lg text-[var(--shell-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--shell-text)]"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
