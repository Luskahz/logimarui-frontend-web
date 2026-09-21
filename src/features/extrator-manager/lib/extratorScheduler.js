import { getOptionLabel } from "@/features/extrator-manager/lib/extratorOptions";
import {
  buildDefaultPeriodState,
  buildPeriodArgs,
  buildPeriodSummary,
  getBasePeriodMeta,
  hydratePeriodStateFromItem,
} from "@/features/extrator-manager/lib/extratorPeriod";

export const DEFAULT_SCHEDULER_FILTERS = Object.freeze({
  search: "",
  base: "__all__",
  period: "__all__",
  scheduleType: "__all__",
  enabled: "__all__",
});

export function buildSchedulerDefaultForm(schedulerMeta) {
  const firstBase = schedulerMeta?.base_options?.[0]?.id || "";
  const defaultPeriodState = buildDefaultPeriodState(
    schedulerMeta?.all_period_meta || null,
  );

  return {
    id: "",
    targetType: "base",
    base: firstBase,
    scheduleType: "daily",
    time: "06:00",
    startTime: "06:00",
    endTime: "",
    weekday: schedulerMeta?.weekday_options?.[0]?.id || "monday",
    monthDay: "1",
    intervalValue: "1",
    intervalUnit: schedulerMeta?.interval_unit_options?.[1]?.id || "hours",
    enabled: true,
    recoverMissed: true,
    senha: "",
    ...defaultPeriodState,
  };
}

export function buildSchedulerFormFromRule(rule) {
  return {
    id: rule.id || "",
    targetType: rule.target_type || "base",
    base: rule.base || "",
    scheduleType: rule.schedule_type || "daily",
    time: rule.time || "06:00",
    startTime: rule.start_time || "06:00",
    endTime: rule.end_time || "",
    weekday: rule.weekday || "monday",
    monthDay: String(rule.month_day || 1),
    intervalValue: String(rule.interval_value || 1),
    intervalUnit: rule.interval_unit || "hours",
    enabled: Boolean(rule.enabled),
    recoverMissed: rule.recover_missed !== false,
    senha: "",
    ...hydratePeriodStateFromItem({
      period_type: rule.period_type,
      period_mode: rule.period_mode,
      period_args: rule.period_args,
    }),
  };
}

export function serializeSchedulerForm(form, password) {
  return {
    id: form.id || undefined,
    target_type: form.targetType,
    base: form.base,
    schedule_type: form.scheduleType,
    time: form.time,
    start_time: form.startTime,
    end_time: form.endTime,
    weekday: form.weekday,
    month_day: Number.parseInt(form.monthDay || "1", 10),
    interval_value: Number.parseInt(form.intervalValue || "1", 10),
    interval_unit: form.intervalUnit,
    enabled: form.enabled,
    recover_missed: form.recoverMissed,
    senha: password,
    period_type: form.periodType,
    period_mode: form.periodMode,
    period_args: buildPeriodArgs(form),
  };
}

export function schedulerIntervalLabel(rule, schedulerMeta) {
  const unitLabel = getOptionLabel(
    schedulerMeta?.interval_unit_options,
    rule?.interval_unit,
    rule?.interval_unit || "minutos",
  );
  return `${rule?.interval_value || 1} ${unitLabel}`;
}

export function schedulerScheduleLabel(rule, schedulerMeta) {
  if (rule?.schedule_type === "daily") {
    return `Diario as ${rule?.time || "--:--"}`;
  }
  if (rule?.schedule_type === "weekly") {
    const weekdayLabel = getOptionLabel(
      schedulerMeta?.weekday_options,
      rule?.weekday,
      rule?.weekday || "dia fixo",
    );
    return `Toda semana (${weekdayLabel}) as ${rule?.time || "--:--"}`;
  }
  if (rule?.schedule_type === "monthly_day") {
    return `Todo dia ${rule?.month_day || 1} as ${rule?.time || "--:--"}`;
  }
  if (rule?.schedule_type === "interval_from_time") {
    const endTime = rule?.end_time ? ` ate ${rule.end_time}` : "";
    return `A cada ${schedulerIntervalLabel(rule, schedulerMeta)} desde ${rule?.start_time || "--:--"}${endTime}`;
  }
  return `A cada ${schedulerIntervalLabel(rule, schedulerMeta)}`;
}

export function schedulerPeriodLabel(rule, reportsMeta, schedulerMeta) {
  const periodMeta =
    rule?.target_type === "all"
      ? schedulerMeta?.all_period_meta
      : getBasePeriodMeta(reportsMeta, rule?.base);
  return buildPeriodSummary(hydratePeriodStateFromItem(rule), periodMeta);
}
