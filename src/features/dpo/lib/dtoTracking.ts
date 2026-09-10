import { normalizeSearchText, parseDtoDate } from "@/features/dpo/lib/dtoFormatters";
import type {
  DtoFormDetail,
  DtoTrackedCollaborator,
  DtoTrackingStatus,
  DtoTrackingSummary,
} from "@/features/dpo/lib/dtoTypes";

const DAY_IN_MS = 86_400_000;

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

export function extractTrackingNames(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(extractTrackingNames);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["name", "nome", "label", "value", "valor"]) {
      if (key in record) return extractTrackingNames(record[key]);
    }
    return Object.values(record).flatMap(extractTrackingNames);
  }

  const text = String(value).trim();
  if (!text) return [];
  if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
    try {
      return extractTrackingNames(JSON.parse(text));
    } catch {
      // Mantém o valor textual quando o conteúdo apenas se parece com JSON.
    }
  }
  return text
    .split(/\r?\n|;|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueNames(values: string[]): Map<string, string> {
  const names = new Map<string, string>();
  values.forEach((value) => {
    const key = normalizeSearchText(value);
    if (key && !names.has(key)) names.set(key, value.trim());
  });
  return names;
}

function statusRank(status: DtoTrackingStatus): number {
  return { never: 0, overdue: 1, dueSoon: 2, current: 3 }[status];
}

export function computeDtoTracking(
  detail: DtoFormDetail,
  now: Date = new Date(),
): DtoTrackingSummary {
  const tracking = detail.configuration.tracking;
  const configured = Boolean(
    tracking?.roster_field_key &&
      tracking.realization_date_field_key &&
      tracking.interval_days,
  );
  const empty: DtoTrackingSummary = {
    configured,
    collaborators: [],
    excludedCollaborators: tracking?.excluded_collaborators || [],
    total: 0,
    current: 0,
    dueSoon: 0,
    overdue: 0,
    never: 0,
    realizationAdherence: null,
    lastRealization: null,
  };
  if (!configured) return empty;

  const rosterFieldKey = tracking.roster_field_key as string;
  const realizationDateFieldKey = tracking.realization_date_field_key as string;
  const intervalDays = tracking.interval_days as number;
  const observed = uniqueNames(
    detail.records.flatMap((record) =>
      extractTrackingNames(record.values[rosterFieldKey]),
    ),
  );
  const observedKeys = new Set(observed.keys());
  const manual = uniqueNames(tracking.manual_collaborators);
  manual.forEach((name, key) => {
    if (!observed.has(key)) observed.set(key, name);
  });
  const manualKeys = new Set(manual.keys());
  const excluded = new Set(
    tracking.excluded_collaborators.map((name) => normalizeSearchText(name)),
  );
  const today = startOfDay(now);
  const dueSoonDays = Math.min(14, Math.max(3, Math.round(intervalDays * 0.2)));

  const collaborators: DtoTrackedCollaborator[] = [];
  observed.forEach((name, key) => {
    if (excluded.has(key)) return;
    const matchingRecords = detail.records.filter((record) =>
      extractTrackingNames(record.values[rosterFieldKey]).some(
        (candidate) => normalizeSearchText(candidate) === key,
      ),
    );
    const dates = matchingRecords
      .map((record) => parseDtoDate(record.values[realizationDateFieldKey]))
      .filter((date): date is Date => date !== null)
      .sort((left, right) => right.getTime() - left.getTime());
    const lastRealization = dates[0] || null;
    const nextDueDate = lastRealization
      ? addDays(startOfDay(lastRealization), intervalDays)
      : null;
    const daysUntilDue = nextDueDate
      ? Math.ceil((nextDueDate.getTime() - today.getTime()) / DAY_IN_MS)
      : null;
    const status: DtoTrackingStatus = !lastRealization
      ? "never"
      : (daysUntilDue as number) < 0
        ? "overdue"
        : (daysUntilDue as number) <= dueSoonDays
          ? "dueSoon"
          : "current";
    collaborators.push({
      key,
      name,
      source: !observedKeys.has(key) && manualKeys.has(key) ? "manual" : "observed",
      applications: matchingRecords.length,
      lastRealization,
      nextDueDate,
      daysUntilDue,
      status,
    });
  });

  collaborators.sort(
    (left, right) =>
      statusRank(left.status) - statusRank(right.status) ||
      (left.daysUntilDue ?? Number.NEGATIVE_INFINITY) -
        (right.daysUntilDue ?? Number.NEGATIVE_INFINITY) ||
      left.name.localeCompare(right.name, "pt-BR"),
  );
  const current = collaborators.filter((item) => item.status === "current").length;
  const dueSoon = collaborators.filter((item) => item.status === "dueSoon").length;
  const overdue = collaborators.filter((item) => item.status === "overdue").length;
  const never = collaborators.filter((item) => item.status === "never").length;
  const lastRealization = collaborators.reduce<Date | null>(
    (latest, item) =>
      item.lastRealization && (!latest || item.lastRealization > latest)
        ? item.lastRealization
        : latest,
    null,
  );

  return {
    configured,
    collaborators,
    excludedCollaborators: tracking.excluded_collaborators,
    total: collaborators.length,
    current,
    dueSoon,
    overdue,
    never,
    realizationAdherence:
      collaborators.length > 0
        ? ((current + dueSoon) / collaborators.length) * 100
        : null,
    lastRealization,
  };
}
