"use client";

import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import DpoHouse from "@/features/dpo/components/DpoHouse";
import DpoToolCatalog from "@/features/dpo/components/DpoToolCatalog";

export default function DpoPillarPage({
  pillar,
}) {
  return (
    <AuthenticatedShell>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
            Pilar DPO
          </p>
          <h1 className="mt-3 font-serif text-3xl text-[var(--shell-text)] sm:text-4xl">
            {pillar.label}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--shell-muted)]">
            {pillar.description} As ferramentas entram nesta página conforme
            são implementadas e permanecem organizadas pela localização no DPO.
          </p>

          <DpoToolCatalog pillarSlug={pillar.slug} />
        </section>

        <aside className="space-y-4">
          <DpoHouse activeSlug={pillar.slug} />
        </aside>
      </div>
    </AuthenticatedShell>
  );
}
