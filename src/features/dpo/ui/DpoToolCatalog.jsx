import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  DPO_TOOL_SCOPES,
  getDpoToolsForPillar,
} from "@/features/dpo/lib/dpoConfig";

const SCOPE_ORDER = [
  DPO_TOOL_SCOPES.PILLAR,
  DPO_TOOL_SCOPES.BLOCK,
  DPO_TOOL_SCOPES.ITEM,
];

const SCOPE_LABELS = {
  [DPO_TOOL_SCOPES.PILLAR]: "Ferramentas gerais do pilar",
  [DPO_TOOL_SCOPES.BLOCK]: "Ferramentas por bloco",
  [DPO_TOOL_SCOPES.ITEM]: "Ferramentas por item",
};

function groupTools(tools) {
  return SCOPE_ORDER.flatMap((scope) => {
    const scopedTools = tools.filter((tool) => tool.scope === scope);
    if (!scopedTools.length) return [];

    return [{ scope, tools: scopedTools }];
  });
}

export default function DpoToolCatalog({ pillarSlug }) {
  const tools = getDpoToolsForPillar(pillarSlug);
  const groups = groupTools(tools);

  return (
    <section
      aria-labelledby="dpo-tool-catalog-title"
      className="mt-6 rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4 sm:p-5"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
          Ferramentas disponíveis
        </p>
        <h2 id="dpo-tool-catalog-title" className="mt-2 text-xl font-semibold text-[var(--shell-text)]">
          Conteúdo deste pilar
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--shell-muted)]">
          As ferramentas aparecem conforme são implementadas e sempre informam
          se pertencem ao pilar, a um bloco ou a um item específico.
        </p>
      </div>

      {!groups.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-[var(--shell-text)]">
            Nenhuma ferramenta cadastrada ainda.
          </p>
          <p className="mt-1 text-sm text-[var(--shell-muted)]">
            Este pilar ficará vazio até uma ferramenta ser associada a ele.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <div key={group.scope}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
                  {SCOPE_LABELS[group.scope]}
                </h3>
                <span className="text-xs text-[var(--shell-muted)]">
                  {group.tools.length} ferramenta{group.tools.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {group.tools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="group rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--shell-line-strong)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--shell-accent)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--shell-accent)]">
                          {tool.locationLabel}
                        </p>
                        <h4 className="mt-2 text-base font-semibold text-[var(--shell-text)]">
                          {tool.label}
                        </h4>
                      </div>
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
