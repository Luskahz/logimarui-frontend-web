export function formatDuration(totalSeconds) {
  const normalizedSeconds = Math.max(Math.floor(Number(totalSeconds) || 0), 0);

  if (normalizedSeconds === 0) {
    return "0s";
  }

  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const seconds = normalizedSeconds % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
}

export function formatRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    return "Sem perfis retornados";
  }

  return roles.join(", ");
}
