import { parseDtoDate } from "@/features/dpo/lib/dtoFormatters";
import type {
  DtoFormDetail,
  DtoPlanningItem,
  DtoTrackingContext,
} from "@/features/dpo/lib/dtoTypes";

export type DtoPlanningOccurrenceStatus =
  | "completed"
  | "pending"
  | "missed"
  | "upcoming";

export interface DtoPlanningOccurrence {
  key: string;
  plan: DtoPlanningItem;
  date: Date;
  periodEnd: Date;
  actualCount: number;
  matchingRecordIds: string[];
  status: DtoPlanningOccurrenceStatus;
}

export interface DtoPlanningCalendarEntry {
  key: string;
  plan: DtoPlanningItem;
  occurrence: DtoPlanningOccurrence;
  targetKey: string;
  targetName: string;
  targetKind: "collaborator" | "applicant" | "generic";
  actualCount: number;
  status: DtoPlanningOccurrenceStatus;
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function addMonthsClamped(value: Date, months: number): Date {
  const targetMonth = value.getMonth() + months;
  const lastDay = new Date(value.getFullYear(), targetMonth + 1, 0).getDate();
  return new Date(
    value.getFullYear(),
    targetMonth,
    Math.min(value.getDate(), lastDay),
  );
}

function minDate(left: Date, right: Date): Date {
  return left <= right ? left : right;
}

function recordDate(detail: DtoFormDetail, record: DtoFormDetail["records"][number]) {
  const dateFieldKey = detail.configuration.tracking.realization_date_field_key;
  return parseDtoDate(dateFieldKey ? record.values[dateFieldKey] : record.date)
    || parseDtoDate(record.date);
}

function periodEnd(plan: DtoPlanningItem, occurrenceDate: Date, planEnd: Date): Date {
  if (plan.recurrence === "WEEKLY") {
    return endOfDay(minDate(addDays(occurrenceDate, 6), planEnd));
  }
  if (plan.recurrence === "MONTHLY") {
    return endOfDay(minDate(
      new Date(occurrenceDate.getFullYear(), occurrenceDate.getMonth() + 1, 0),
      planEnd,
    ));
  }
  return endOfDay(occurrenceDate);
}

function occurrenceDates(plan: DtoPlanningItem): Date[] {
  const start = parseDtoDate(plan.start_date);
  const end = parseDtoDate(plan.end_date);
  if (!start || !end) return [];
  if (plan.recurrence === "ONCE") return [startOfDay(start)];

  const dates: Date[] = [];
  let cursor = startOfDay(start);
  const limit = endOfDay(end);
  let index = 0;
  while (cursor <= limit && index < 600) {
    dates.push(cursor);
    index += 1;
    cursor = plan.recurrence === "WEEKLY"
      ? addDays(cursor, 7)
      : addMonthsClamped(start, index);
  }
  return dates;
}

export function computePlanningOccurrences({
  context,
  detail,
  items,
  now = new Date(),
}: {
  context: DtoTrackingContext | null;
  detail: DtoFormDetail;
  items: DtoPlanningItem[];
  now?: Date;
}): DtoPlanningOccurrence[] {
  const today = startOfDay(now);
  return items.flatMap((plan) => {
    const parsedEnd = parseDtoDate(plan.end_date);
    if (!parsedEnd) return [];

    return occurrenceDates(plan).map((date) => {
      const currentPeriodEnd = periodEnd(plan, date, endOfDay(parsedEnd));
      const matchingRecordIds = detail.records.flatMap((record) => {
        const realizedAt = recordDate(detail, record);
        if (!realizedAt || realizedAt < date || realizedAt > currentPeriodEnd) return [];
        const applicantKeys = context?.record_applicant_keys?.[record.id] || [];
        if (!applicantKeys.includes(plan.assignee_employee_key)) return [];
        if (plan.target_employee_keys.length > 0) {
          const recordTargets = context?.record_employee_keys[record.id] || [];
          if (!recordTargets.some((key) => plan.target_employee_keys.includes(key))) {
            return [];
          }
        }
        return [record.id];
      });
      const actualCount = new Set(matchingRecordIds).size;
      const status: DtoPlanningOccurrenceStatus = actualCount >= plan.target_count
        ? "completed"
        : date > today
          ? "upcoming"
          : currentPeriodEnd < today
            ? "missed"
            : "pending";
      return {
        key: `${plan.id}:${date.toISOString().slice(0, 10)}`,
        plan,
        date,
        periodEnd: currentPeriodEnd,
        actualCount,
        matchingRecordIds,
        status,
      };
    });
  }).sort((left, right) => left.date.getTime() - right.date.getTime());
}

function statusForTarget({
  actualCount,
  occurrence,
  now,
}: {
  actualCount: number;
  occurrence: DtoPlanningOccurrence;
  now: Date;
}): DtoPlanningOccurrenceStatus {
  if (actualCount > 0) return "completed";
  const today = startOfDay(now);
  if (occurrence.date > today) return "upcoming";
  return occurrence.periodEnd < today ? "missed" : "pending";
}

export function computePlanningCalendarEntries({
  collaboratorMode,
  context,
  employeeNamesByKey,
  now = new Date(),
  occurrences,
}: {
  collaboratorMode: boolean;
  context: DtoTrackingContext | null;
  employeeNamesByKey: Record<string, string>;
  now?: Date;
  occurrences: DtoPlanningOccurrence[];
}): DtoPlanningCalendarEntry[] {
  return occurrences.flatMap<DtoPlanningCalendarEntry>((occurrence) => {
    const plan = occurrence.plan;
    if (collaboratorMode && plan.target_employee_keys.length > 0) {
      return plan.target_employee_keys.map((targetKey) => {
        const matchingRecordIds = occurrence.matchingRecordIds.filter((recordId) =>
          context?.record_employee_keys[recordId]?.includes(targetKey),
        );
        const actualCount = new Set(matchingRecordIds).size;
        return {
          key: `${occurrence.key}:${targetKey}`,
          plan,
          occurrence,
          targetKey,
          targetName: employeeNamesByKey[targetKey] || "Colaborador indisponível",
          targetKind: "collaborator" as const,
          actualCount,
          status: statusForTarget({ actualCount, occurrence, now }),
        };
      });
    }

    const targetKind = collaboratorMode ? "generic" as const : "applicant" as const;
    const targetKey = collaboratorMode
      ? `plan:${plan.id}`
      : plan.assignee_employee_key;
    const targetName = collaboratorMode
      ? plan.title
      : employeeNamesByKey[plan.assignee_employee_key] || "Aplicador indisponível";
    return [{
      key: `${occurrence.key}:${targetKey}`,
      plan,
      occurrence,
      targetKey,
      targetName,
      targetKind,
      actualCount: occurrence.actualCount,
      status: occurrence.status,
    }];
  });
}

export function monthCalendarDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -mondayOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function sameCalendarDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}
