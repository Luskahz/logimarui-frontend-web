import type {
  DtoAttentionPoint,
  DtoCollaboratorStat,
  DtoColumn,
  DtoFiltersState,
  DtoFormDetail,
  DtoFormResourceMap,
  DtoMetrics,
  DtoPortfolioMetrics,
  DtoQuestionStat,
  DtoRecord,
  DtoTimelinePoint,
  DtoTrend,
} from "@/features/dpo/lib/dtoTypes";
import {
  formatDtoPercentage,
  formatDtoValue,
  formatPercentagePointDelta,
  normalizeSearchText,
  parseDtoDate,
} from "@/features/dpo/lib/dtoFormatters";

export const DEFAULT_DTO_FILTERS: DtoFiltersState = Object.freeze({
  period: "all",
  startDate: "",
  endDate: "",
  collaborator: "",
  manager: "",
  search: "",
  onlyNok: false,
});

function hasColumnKind(columns: DtoColumn[], kind: DtoColumn["kind"]): boolean {
  return columns.some((column) => column.kind === kind);
}

function startOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(23, 59, 59, 999);
  return result;
}

function resolveDateRange(
  filters: DtoFiltersState,
  now: Date,
): { start: Date | null; end: Date | null } {
  const today = startOfDay(now);

  if (filters.period === "last30" || filters.period === "last90") {
    const days = filters.period === "last30" ? 30 : 90;
    const start = new Date(today.getTime());
    start.setDate(start.getDate() - (days - 1));
    return { start, end: endOfDay(today) };
  }

  if (filters.period === "currentYear") {
    return {
      start: new Date(today.getFullYear(), 0, 1),
      end: new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
  }

  if (filters.period === "custom") {
    const start = parseDtoDate(filters.startDate);
    const end = parseDtoDate(filters.endDate);
    return {
      start: start ? startOfDay(start) : null,
      end: end ? endOfDay(end) : null,
    };
  }

  return { start: null, end: null };
}

function recordMatchesSearch(record: DtoRecord, search: string): boolean {
  if (!search) {
    return true;
  }

  const values = [
    record.id,
    record.collaborator,
    record.manager,
    ...Object.entries(record.values || {}).flatMap(([key, value]) => [
      key,
      formatDtoValue(value),
    ]),
    ...(record.answers || []).flatMap((answer) => [
      answer.label,
      formatDtoValue(answer.raw_value),
    ]),
  ];

  return normalizeSearchText(values.join(" ")).includes(search);
}

export function filterDtoRecords(
  records: DtoRecord[],
  filters: DtoFiltersState,
  now = new Date(),
): DtoRecord[] {
  const normalizedCollaborator = normalizeSearchText(filters.collaborator);
  const normalizedManager = normalizeSearchText(filters.manager);
  const normalizedSearch = normalizeSearchText(filters.search);
  const { start, end } = resolveDateRange(filters, now);
  const filtersByDate = Boolean(start || end);

  return records.filter((record) => {
    if (
      normalizedCollaborator &&
      normalizeSearchText(record.collaborator) !== normalizedCollaborator
    ) {
      return false;
    }

    if (
      normalizedManager &&
      normalizeSearchText(record.manager) !== normalizedManager
    ) {
      return false;
    }

    if (filtersByDate) {
      const recordDate = parseDtoDate(record.date);
      if (!recordDate) {
        return false;
      }
      if (start && recordDate < start) {
        return false;
      }
      if (end && recordDate > end) {
        return false;
      }
    }

    if (
      filters.onlyNok &&
      !(record.answers || []).some((answer) => answer.status === "nok")
    ) {
      return false;
    }

    return recordMatchesSearch(record, normalizedSearch);
  });
}

export function getDtoFilterOptions(detail: DtoFormDetail): {
  collaborators: string[];
  managers: string[];
  hasDateColumn: boolean;
  hasCollaboratorColumn: boolean;
  hasManagerColumn: boolean;
} {
  const uniqueValues = (values: Array<string | null>): string[] => {
    const labels = new Map<string, string>();

    values.forEach((value) => {
      const label = String(value ?? "").trim();
      const key = normalizeSearchText(label);
      if (key && !labels.has(key)) {
        labels.set(key, label);
      }
    });

    return [...labels.values()].sort((left, right) =>
      left.localeCompare(right, "pt-BR"),
    );
  };

  return {
    collaborators: uniqueValues(detail.records.map((record) => record.collaborator)),
    managers: uniqueValues(detail.records.map((record) => record.manager)),
    hasDateColumn: hasColumnKind(detail.columns, "date"),
    hasCollaboratorColumn: hasColumnKind(detail.columns, "collaborator"),
    hasManagerColumn: hasColumnKind(detail.columns, "manager"),
  };
}

export function computeRecordMetrics(record: DtoRecord): {
  ok: number;
  nok: number;
  answered: number;
  adherence: number | null;
} {
  let ok = 0;
  let nok = 0;

  (record.answers || []).forEach((answer) => {
    if (answer.status === "ok") {
      ok += 1;
    } else if (answer.status === "nok") {
      nok += 1;
    }
  });

  const answered = ok + nok;
  return {
    ok,
    nok,
    answered,
    adherence: answered > 0 ? (ok / answered) * 100 : null,
  };
}

export function computeDtoMetrics(
  records: DtoRecord[],
  columns: DtoColumn[],
): DtoMetrics {
  let ok = 0;
  let nok = 0;
  let neutral = 0;
  let blank = 0;
  let unexpected = 0;
  let lastApplication: Date | null = null;
  const collaborators = new Set<string>();
  const hasDateColumn = hasColumnKind(columns, "date");
  const hasCollaboratorColumn = hasColumnKind(columns, "collaborator");

  records.forEach((record) => {
    (record.answers || []).forEach((answer) => {
      if (answer.status === "ok") {
        ok += 1;
      } else if (answer.status === "nok") {
        nok += 1;
      } else if (answer.status === "neutral") {
        neutral += 1;
      } else if (answer.status === "blank") {
        blank += 1;
      } else if (answer.status === "unexpected") {
        unexpected += 1;
      }
    });

    const parsedDate = parseDtoDate(record.date);
    if (parsedDate && (!lastApplication || parsedDate > lastApplication)) {
      lastApplication = parsedDate;
    }

    const collaborator = String(record.collaborator ?? "").trim();
    if (collaborator) {
      collaborators.add(normalizeSearchText(collaborator));
    }
  });

  const answered = ok + nok;
  return {
    applications: records.length,
    ok,
    nok,
    neutral,
    blank,
    unexpected,
    answered,
    adherence: answered > 0 ? (ok / answered) * 100 : null,
    collaborators: hasCollaboratorColumn ? collaborators.size : null,
    lastApplication,
    hasDateColumn,
    hasCollaboratorColumn,
  };
}

export function computeQuestionStats(
  records: DtoRecord[],
  columns: DtoColumn[],
): DtoQuestionStat[] {
  const stats = new Map<string, DtoQuestionStat>();

  columns
    .filter((column) => column.kind === "evaluation")
    .forEach((column) => {
      stats.set(column.key, {
        columnKey: column.key,
        label: column.label,
        ok: 0,
        nok: 0,
        neutral: 0,
        unexpected: 0,
        answered: 0,
        nokRate: null,
      });
    });

  records.forEach((record) => {
    (record.answers || []).forEach((answer) => {
      const current = stats.get(answer.column_key);
      if (!current) {
        return;
      }

      if (answer.status === "ok") {
        current.ok += 1;
      } else if (answer.status === "nok") {
        current.nok += 1;
      } else if (answer.status === "neutral") {
        current.neutral += 1;
      } else if (answer.status === "unexpected") {
        current.unexpected += 1;
      }
    });
  });

  return [...stats.values()]
    .map((item) => {
      const answered = item.ok + item.nok;
      return {
        ...item,
        answered,
        nokRate: answered > 0 ? (item.nok / answered) * 100 : null,
      };
    })
    .sort((left, right) => {
      if (right.nok !== left.nok) {
        return right.nok - left.nok;
      }

      const rateDifference = (right.nokRate ?? -1) - (left.nokRate ?? -1);
      if (rateDifference !== 0) {
        return rateDifference;
      }

      return left.label.localeCompare(right.label, "pt-BR");
    });
}

export function computeCollaboratorStats(
  records: DtoRecord[],
  columns: DtoColumn[],
): DtoCollaboratorStat[] | null {
  if (!hasColumnKind(columns, "collaborator")) {
    return null;
  }

  const groups = new Map<
    string,
    DtoCollaboratorStat & { normalizedName: string }
  >();

  records.forEach((record) => {
    const name = String(record.collaborator ?? "").trim();
    const normalizedName = normalizeSearchText(name);
    if (!normalizedName) {
      return;
    }

    const recordMetrics = computeRecordMetrics(record);
    const current = groups.get(normalizedName) || {
      normalizedName,
      name,
      applications: 0,
      applicationsWithNok: 0,
      ok: 0,
      nok: 0,
      adherence: null,
    };

    current.applications += 1;
    current.ok += recordMetrics.ok;
    current.nok += recordMetrics.nok;
    if (recordMetrics.nok > 0) {
      current.applicationsWithNok += 1;
    }
    groups.set(normalizedName, current);
  });

  return [...groups.values()]
    .map(({ normalizedName: _normalizedName, ...item }) => {
      const answered = item.ok + item.nok;
      return {
        ...item,
        adherence: answered > 0 ? (item.ok / answered) * 100 : null,
      };
    })
    .sort((left, right) => {
      if (right.applicationsWithNok !== left.applicationsWithNok) {
        return right.applicationsWithNok - left.applicationsWithNok;
      }
      if (right.nok !== left.nok) {
        return right.nok - left.nok;
      }
      return left.name.localeCompare(right.name, "pt-BR");
    });
}

type TimelineGranularity = "day" | "week" | "month";

function resolveTimelineGranularity(dates: Date[]): TimelineGranularity {
  if (dates.length < 2) {
    return "day";
  }

  const sortedTimes = dates.map((date) => date.getTime()).sort((a, b) => a - b);
  const spanInDays =
    (sortedTimes[sortedTimes.length - 1] - sortedTimes[0]) / 86_400_000;

  if (spanInDays <= 45) {
    return "day";
  }
  if (spanInDays <= 240) {
    return "week";
  }
  return "month";
}

function getTimelineBucket(
  date: Date,
  granularity: TimelineGranularity,
): { key: string; label: string; order: number } {
  let bucketDate = startOfDay(date);

  if (granularity === "week") {
    const weekday = bucketDate.getDay();
    const distanceFromMonday = (weekday + 6) % 7;
    bucketDate.setDate(bucketDate.getDate() - distanceFromMonday);
  } else if (granularity === "month") {
    bucketDate = new Date(bucketDate.getFullYear(), bucketDate.getMonth(), 1);
  }

  const key = [
    bucketDate.getFullYear(),
    String(bucketDate.getMonth() + 1).padStart(2, "0"),
    String(bucketDate.getDate()).padStart(2, "0"),
  ].join("-");

  const label =
    granularity === "month"
      ? new Intl.DateTimeFormat("pt-BR", {
          month: "short",
          year: "2-digit",
        }).format(bucketDate)
      : granularity === "week"
        ? `Sem. ${new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }).format(bucketDate)}`
        : new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }).format(bucketDate);

  return { key, label, order: bucketDate.getTime() };
}

export function computeTimeline(records: DtoRecord[]): DtoTimelinePoint[] {
  const datedRecords = records
    .map((record) => ({ record, date: parseDtoDate(record.date) }))
    .filter(
      (item): item is { record: DtoRecord; date: Date } => item.date !== null,
    );

  if (datedRecords.length === 0) {
    return [];
  }

  const granularity = resolveTimelineGranularity(
    datedRecords.map((item) => item.date),
  );
  const buckets = new Map<
    string,
    DtoTimelinePoint & { order: number }
  >();

  datedRecords.forEach(({ record, date }) => {
    const bucket = getTimelineBucket(date, granularity);
    const current = buckets.get(bucket.key) || {
      key: bucket.key,
      label: bucket.label,
      order: bucket.order,
      applications: 0,
      ok: 0,
      nok: 0,
      adherence: null,
    };
    const metrics = computeRecordMetrics(record);
    current.applications += 1;
    current.ok += metrics.ok;
    current.nok += metrics.nok;
    buckets.set(bucket.key, current);
  });

  return [...buckets.values()]
    .sort((left, right) => left.order - right.order)
    .map(({ order: _order, ...item }) => {
      const answered = item.ok + item.nok;
      return {
        ...item,
        adherence: answered > 0 ? (item.ok / answered) * 100 : null,
      };
    });
}

export function computeTrend(timeline: DtoTimelinePoint[]): DtoTrend | null {
  const comparable = timeline.filter((item) => item.adherence !== null);
  if (comparable.length < 2) {
    return null;
  }

  const previous = comparable[comparable.length - 2];
  const current = comparable[comparable.length - 1];
  const delta = (current.adherence ?? 0) - (previous.adherence ?? 0);

  return {
    direction: delta > 0 ? "improving" : delta < 0 ? "worsening" : "stable",
    delta,
    previousLabel: previous.label,
    currentLabel: current.label,
  };
}

export function computeAttentionPoints(
  detail: DtoFormDetail,
  records: DtoRecord[],
): DtoAttentionPoint[] {
  if (records.length === 0) {
    return [];
  }

  const points: DtoAttentionPoint[] = [];
  const questions = computeQuestionStats(records, detail.columns);
  const topQuestion = questions.find((question) => question.nok > 0);
  const timeline = computeTimeline(records);
  const trend = computeTrend(timeline);
  const collaborators = computeCollaboratorStats(records, detail.columns);
  const recurrentCollaborator = collaborators?.find(
    (item) => item.applicationsWithNok >= 2,
  );
  const recurringGap = findRecurringCollaboratorGap(records, detail.columns);
  const metrics = computeDtoMetrics(records, detail.columns);

  if (topQuestion) {
    points.push({
      id: `question-${topQuestion.columnKey}`,
      title: "Pergunta com mais desvios",
      description: `${topQuestion.label}: ${topQuestion.nok} NOK em ${topQuestion.answered} respostas válidas (${formatDtoPercentage(topQuestion.nokRate)} de NOK).`,
      tone: "danger",
    });
  }

  if (trend?.direction === "worsening") {
    points.push({
      id: "adherence-trend",
      title: "Aderência recuou no período mais recente",
      description: `De ${trend.previousLabel} para ${trend.currentLabel}, a aderência variou ${formatPercentagePointDelta(trend.delta)}.`,
      tone: "attention",
    });
  }

  if (recurringGap) {
    points.push({
      id: `recurring-gap-${recurringGap.collaboratorKey}-${recurringGap.columnKey}`,
      title: "Mesmo gap reapareceu",
      description: `${recurringGap.collaboratorName} recebeu NOK em “${recurringGap.questionLabel}” em ${recurringGap.applications} aplicações. O dado indica oportunidade de acompanhamento e treinamento.`,
      tone: "attention",
    });
  } else if (recurrentCollaborator) {
    points.push({
      id: `recurrence-${normalizeSearchText(recurrentCollaborator.name)}`,
      title: "Recorrência para acompanhamento",
      description: `${recurrentCollaborator.name} teve ${recurrentCollaborator.applicationsWithNok} aplicações com ao menos um NOK. O dado indica oportunidade de acompanhamento e treinamento.`,
      tone: "attention",
    });
  }

  if (metrics.unexpected > 0) {
    points.push({
      id: "unexpected-values",
      title: "Qualidade de dados requer revisão",
      description: `${metrics.unexpected} resposta(s) avaliativa(s) possuem valor inesperado e não foram convertidas em OK ou NOK.`,
      tone: "default",
    });
  }

  return points;
}

function findRecurringCollaboratorGap(
  records: DtoRecord[],
  columns: DtoColumn[],
): {
  collaboratorKey: string;
  collaboratorName: string;
  columnKey: string;
  questionLabel: string;
  applications: number;
} | null {
  if (!hasColumnKind(columns, "collaborator")) {
    return null;
  }

  const gaps = new Map<
    string,
    {
      collaboratorKey: string;
      collaboratorName: string;
      columnKey: string;
      questionLabel: string;
      applicationKeys: Set<string>;
    }
  >();

  records.forEach((record) => {
    const collaboratorName = String(record.collaborator ?? "").trim();
    const collaboratorKey = normalizeSearchText(collaboratorName);
    if (!collaboratorKey) {
      return;
    }

    (record.answers || [])
      .filter((answer) => answer.status === "nok")
      .forEach((answer) => {
        const key = `${collaboratorKey}\u0000${answer.column_key}`;
        const current = gaps.get(key) || {
          collaboratorKey,
          collaboratorName,
          columnKey: answer.column_key,
          questionLabel: answer.label,
          applicationKeys: new Set<string>(),
        };
        current.applicationKeys.add(`${record.id}-${record.index}`);
        gaps.set(key, current);
      });
  });

  const recurring = [...gaps.values()]
    .map((gap) => ({
      collaboratorKey: gap.collaboratorKey,
      collaboratorName: gap.collaboratorName,
      columnKey: gap.columnKey,
      questionLabel: gap.questionLabel,
      applications: gap.applicationKeys.size,
    }))
    .filter((gap) => gap.applications >= 2)
    .sort((left, right) => {
      if (right.applications !== left.applications) {
        return right.applications - left.applications;
      }
      const collaboratorOrder = left.collaboratorName.localeCompare(
        right.collaboratorName,
        "pt-BR",
      );
      return collaboratorOrder !== 0
        ? collaboratorOrder
        : left.questionLabel.localeCompare(right.questionLabel, "pt-BR");
    });

  return recurring[0] || null;
}

export function computePortfolioMetrics(
  formsCount: number,
  resources: DtoFormResourceMap,
): DtoPortfolioMetrics {
  const resourceValues = Object.values(resources);
  const successfulDetails = resourceValues
    .map((resource) => resource.data)
    .filter((detail): detail is DtoFormDetail => detail !== null);
  const failedForms = resourceValues.filter(
    (resource) => resource.status === "error" && !resource.data,
  ).length;
  const pendingForms = resourceValues.filter(
    (resource) =>
      (resource.status === "idle" || resource.status === "loading") &&
      !resource.data,
  ).length;
  const loadedForms = successfulDetails.length;

  if (loadedForms === 0 && formsCount > 0) {
    return {
      forms: formsCount,
      loadedForms,
      failedForms,
      pendingForms,
      applications: null,
      ok: null,
      nok: null,
      adherence: null,
      collaborators: null,
      partial: true,
    };
  }

  let applications = 0;
  let ok = 0;
  let nok = 0;
  let hasCollaboratorData = false;
  const collaborators = new Set<string>();

  successfulDetails.forEach((detail) => {
    const metrics = computeDtoMetrics(detail.records, detail.columns);
    applications += metrics.applications;
    ok += metrics.ok;
    nok += metrics.nok;

    if (metrics.hasCollaboratorColumn) {
      hasCollaboratorData = true;
      detail.records.forEach((record) => {
        const normalized = normalizeSearchText(record.collaborator);
        if (normalized) {
          collaborators.add(normalized);
        }
      });
    }
  });

  const answered = ok + nok;
  return {
    forms: formsCount,
    loadedForms,
    failedForms,
    pendingForms,
    applications,
    ok,
    nok,
    adherence: answered > 0 ? (ok / answered) * 100 : null,
    collaborators: hasCollaboratorData ? collaborators.size : null,
    partial: loadedForms < formsCount || failedForms > 0 || pendingForms > 0,
  };
}

export function getPortfolioOffenders(
  resources: DtoFormResourceMap,
): Array<{
  id: string;
  name: string;
  nok: number;
  adherence: number | null;
}> {
  return Object.values(resources)
    .map((resource) => {
      if (!resource.data) {
        return null;
      }
      const metrics = computeDtoMetrics(
        resource.data.records,
        resource.data.columns,
      );
      return {
        id: resource.data.form.id,
        name: resource.data.form.name,
        nok: metrics.nok,
        adherence: metrics.adherence,
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        name: string;
        nok: number;
        adherence: number | null;
      } => item !== null && item.nok > 0,
    )
    .sort((left, right) => {
      if (right.nok !== left.nok) {
        return right.nok - left.nok;
      }
      return (left.adherence ?? Number.POSITIVE_INFINITY) -
        (right.adherence ?? Number.POSITIVE_INFINITY);
    });
}
