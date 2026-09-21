import Link from "next/link";
import { SPO_CONTEXTS } from "@/features/spo/lib/spoConfig";
import { APP_ROUTES } from "@/shared/config/routes";

export default function SpoOverviewView() {
  return (
    <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
      <h1 className="sr-only">SPO</h1>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
        Introducao SPO
      </p>

      <div className="mt-6 divide-y divide-[color:var(--shell-line)]">
        {SPO_CONTEXTS.map((context) => (
          <Link
            key={context.slug}
            href={`${APP_ROUTES.SPO}/${context.slug}`}
            className="group flex items-center justify-between gap-6 py-4 transition-transform duration-200 hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--shell-accent)]"
          >
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--shell-text)]">
                {context.label}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--shell-muted)]">
                {context.summary}
              </p>
            </div>

            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
              Detalhes →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
