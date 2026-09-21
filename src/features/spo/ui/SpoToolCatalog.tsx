import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSpoToolsForContext } from "@/features/spo/lib/spoToolConfig";

type SpoToolCatalogProps = {
  contextSlug: string;
};

export default function SpoToolCatalog({ contextSlug }: SpoToolCatalogProps) {
  const tools = getSpoToolsForContext(contextSlug);

  return (
    <section
      aria-labelledby="spo-tool-catalog-title"
      className="mt-6 rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4 sm:p-5"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
          Ferramentas disponiveis
        </p>
        <h2
          id="spo-tool-catalog-title"
          className="mt-2 text-xl font-semibold text-[var(--shell-text)]"
        >
          Catalogo do contexto
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--shell-muted)]">
          As ferramentas ficam reunidas aqui conforme forem disponibilizadas.
        </p>
      </div>

      {!tools.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-[var(--shell-text)]">
            Nenhuma ferramenta cadastrada ainda.
          </p>
          <p className="mt-1 text-sm text-[var(--shell-muted)]">
            Novas ferramentas aparecerao aqui conforme forem disponibilizadas.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--shell-line-strong)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--shell-accent)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--shell-text)]">
                  {tool.label}
                </h3>
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[var(--shell-muted)] transition group-hover:text-[var(--shell-text)]"
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
