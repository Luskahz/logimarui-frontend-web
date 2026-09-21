export type SpoContext = {
  slug: string;
  label: string;
  description: string;
  summary: string;
};

export const SPO_CONTEXTS: readonly SpoContext[] = [
  {
    slug: "financeiro",
    label: "Financeiro",
    description:
      "Contexto para organizar as ferramentas financeiras conforme forem disponibilizadas.",
    summary:
      "Organize e acesse as ferramentas financeiras da operacao em um unico contexto.",
  },
];

export const SPO_CONTEXT_MAP = Object.fromEntries(
  SPO_CONTEXTS.map((context) => [context.slug, context]),
) as Record<string, SpoContext>;

export function getSpoContextBySlug(slug: string): SpoContext | null {
  return SPO_CONTEXT_MAP[slug] ?? null;
}
