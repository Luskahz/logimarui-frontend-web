export const FILTER_ALL_VALUE = "__all__";

export function toBooleanLabel(value) {
  return value ? "Ativo" : "Pausado";
}

export function normalizeOption(option) {
  if (typeof option === "string") {
    return { id: option, label: option };
  }

  return {
    id: String(option?.id ?? option?.value ?? ""),
    label: String(option?.label ?? option?.id ?? option?.value ?? ""),
  };
}

export function getOptionLabel(options, value, fallback = "") {
  const normalizedValue = String(value ?? "");
  return (
    (options || [])
      .map(normalizeOption)
      .find((option) => option.id === normalizedValue)?.label ||
    fallback ||
    normalizedValue
  );
}

export function formatCountLabel(total, singular, plural) {
  const numericTotal = Number(total || 0);
  return `${numericTotal} ${numericTotal === 1 ? singular : plural}`;
}
