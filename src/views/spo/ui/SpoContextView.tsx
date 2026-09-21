import type { SpoContext } from "@/features/spo/lib/spoConfig";
import SpoToolCatalog from "@/features/spo/ui/SpoToolCatalog";

type SpoContextViewProps = {
  context: SpoContext;
};

export default function SpoContextView({ context }: SpoContextViewProps) {
  return (
    <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
        Contexto SPO
      </p>
      <h1 className="mt-3 font-serif text-3xl text-[var(--shell-text)] sm:text-4xl">
        {context.label}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--shell-muted)]">
        {context.description}
      </p>

      <SpoToolCatalog contextSlug={context.slug} />
    </section>
  );
}
