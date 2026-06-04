export function formatDateTime(value) {
  if (!value) {
    return "Nao registrado";
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  return new Date(timestamp).toLocaleString("pt-BR");
}

export function formatSummaryValue(summary, key) {
  return Number(summary?.[key] || 0);
}
