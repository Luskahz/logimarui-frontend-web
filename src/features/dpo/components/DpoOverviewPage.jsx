import Link from "next/link";
import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import DpoHouse from "@/features/dpo/components/DpoHouse";
import { DPO_INTRO_SUMMARY } from "@/features/dpo/lib/dpoConfig";

export default function DpoOverviewPage() {
  return (
    <AuthenticatedShell>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
            Introducao DPO
          </p>

          <div className="mt-6 divide-y divide-[color:var(--shell-line)]">
            {DPO_INTRO_SUMMARY.map((item) => (
              <Link
                key={item.slug}
                href={`/dpo/${item.slug}`}
                className="group flex items-center justify-between gap-6 py-4 transition-transform duration-200 hover:scale-[1.01]"
              >
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-[var(--shell-text)]">
                    {item.label}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[var(--shell-muted)]">
                    {item.summary}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                  detalhes →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <DpoHouse activeSlug="dpo" />
        </aside>
      </div>
    </AuthenticatedShell>
  );
}
