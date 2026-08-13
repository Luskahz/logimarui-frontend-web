const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const BRAZILIAN_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const SAVI_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;
const ISO_DATE_TIME_WITH_ZONE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})$/i;

function buildValidatedLocalDate({
  day,
  hour = 0,
    millisecond = 0,
  minute = 0,
  month,
  second = 0,
  year,
}: {
  day: number;
  hour?: number;
  millisecond?: number;
  minute?: number;
  month: number;
  second?: number;
  year: number;
}): Date | null {
  const parsed = new Date(0);
  parsed.setFullYear(year, month - 1, day);
  parsed.setHours(hour, minute, second, millisecond);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute ||
    parsed.getSeconds() !== second ||
    parsed.getMilliseconds() !== millisecond
  ) {
    return null;
  }

  return parsed;
}

export function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function parseDtoDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return null;
  }

  const dateOnlyMatch = normalized.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return buildValidatedLocalDate({
      year: Number(year),
      month: Number(month),
      day: Number(day),
    });
  }

  const brazilianMatch = normalized.match(BRAZILIAN_DATE_PATTERN);
  if (brazilianMatch) {
    const [, day, month, year] = brazilianMatch;
    return buildValidatedLocalDate({
      year: Number(year),
      month: Number(month),
      day: Number(day),
    });
  }

  const saviDateTimeMatch = normalized.match(SAVI_DATE_TIME_PATTERN);
  if (saviDateTimeMatch) {
    const [, year, month, day, hour, minute, second = "0", milliseconds = "0"] =
      saviDateTimeMatch;
    return buildValidatedLocalDate({
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      second: Number(second),
      millisecond: Number(milliseconds.slice(0, 3).padEnd(3, "0")),
    });
  }

  const isoWithZoneMatch = normalized.match(ISO_DATE_TIME_WITH_ZONE_PATTERN);
  if (isoWithZoneMatch) {
    const [, year, month, day, hour, minute, second = "0", fraction = "", zone] =
      isoWithZoneMatch;
    const millisecond = Number(fraction.slice(0, 3).padEnd(3, "0"));
    const validatedComponents = buildValidatedLocalDate({
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      second: Number(second),
      millisecond,
    });
    if (!validatedComponents) {
      return null;
    }

    const normalizedZone = zone.length === 5 && zone !== "Z"
      ? `${zone.slice(0, 3)}:${zone.slice(3)}`
      : zone;
    const normalizedFraction = fraction
      ? `.${fraction.slice(0, 3).padEnd(3, "0")}`
      : "";
    const parsed = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}${normalizedFraction}${normalizedZone}`,
    );
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function formatDtoDate(
  value: unknown,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const parsed = parseDtoDate(value);
  if (!parsed) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(parsed);
}

export function formatDtoDateTime(value: unknown): string {
  return formatDtoDate(value, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDtoNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatDtoPercentage(
  value: number | null | undefined,
  fractionDigits = 1,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)}%`;
}

export function formatPercentagePointDelta(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)} p.p.`;
}

export function formatDtoValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
