export type SpoToolDefinition = {
  id: string;
  contextSlug: string;
  href: string;
  label: string;
  description: string;
};

export const SPO_TOOL_DEFINITIONS: readonly SpoToolDefinition[] = [];

export function getSpoToolsForContext(contextSlug: string): SpoToolDefinition[] {
  return SPO_TOOL_DEFINITIONS.filter(
    (tool) => tool.contextSlug === contextSlug,
  );
}
