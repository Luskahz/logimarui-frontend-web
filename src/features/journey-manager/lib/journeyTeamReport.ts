import type { ExpurgeFilter, Indicator, JourneyTeamObservation } from "../model/types";
import { sumCounts } from "./journeyAnalysis";

export interface TeamReportFilters {
  excluded: number[];
  fleets: string[];
  expurge: ExpurgeFilter;
  view: "all" | "not_attained" | "journey_exceeded";
}
export const initialTeamReportFilters: TeamReportFilters = { excluded: [], fleets: [], expurge: "all", view: "all" };

/** Filter individual observations before rolling up, including people who changed fleet. */
export function teamReportRows(observations: JourneyTeamObservation[], filters: TeamReportFilters) {
  const grouped = new Map<number, JourneyTeamObservation[]>();
  for (const row of observations) {
    if (filters.excluded.includes(row.employeeCode) ||
        (filters.fleets.length > 0 && !filters.fleets.includes(row.fleet?.trim() ?? "")) ||
        (filters.expurge === "expurged" && row.expurgePresent !== true) ||
        (filters.expurge === "not_expurged" && row.expurgePresent !== false)) continue;
    const rows = grouped.get(row.employeeCode) ?? [];
    rows.push(row); grouped.set(row.employeeCode, rows);
  }
  return [...grouped.entries()].map(([employeeCode, rows]) => {
    const counts = sumCounts(rows.map(row => row.counts));
    const times = rows.flatMap(row => row.seconds === null ? [] : [row.seconds]);
    const journeyKnown = rows.filter(row => row.journeyExceeded !== null).length;
    return { employeeCode, employeeName: rows.at(-1)!.employeeName, counts,
      dates: [...new Set(rows.flatMap(row => row.departureDate === null ? [] : [row.departureDate]))].sort(),
      averageSeconds: times.length ? times.reduce((total, seconds) => total + seconds, 0) / times.length : null,
      timeSamples: times.length, journeyExceeded: rows.filter(row => row.journeyExceeded === true).length,
      journeyKnown, journeyUnknown: rows.length - journeyKnown };
  }).filter(row => filters.view === "all" || (filters.view === "not_attained" ?
    row.counts.notAttained > 0 : row.journeyExceeded > 0))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "pt-BR"));
}

export function formatTeamAverage(seconds: number | null, indicator: Indicator) {
  if (seconds === null) return "—";
  const total = Math.round(seconds);
  const first = indicator === "tml" || indicator === "ti" ? Math.floor(total / 60) : Math.floor(total / 3600);
  const second = indicator === "tml" || indicator === "ti" ? total % 60 : Math.floor(total / 60) % 60;
  return `${String(first).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}
