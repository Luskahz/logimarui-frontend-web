import type { Checklist, IndicatorResult, JourneyItem, TrItem } from "../model/types";

export interface MapGroup<T extends JourneyItem> {
  key: string;
  date: string;
  map: number | null;
  mapOrigin: string | null;
  items: T[];
}

export function groupByMap<T extends JourneyItem>(items: readonly T[]): MapGroup<T>[] {
  const groups = new Map<string, MapGroup<T>>();
  for (const [index, item] of items.entries()) {
    const { date, map, mapOrigin } = item.context;
    const key = map === null ? `${date}:unknown:${index}` : `${date}:${map}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, date, map, mapOrigin, items: [] };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date) ||
    (a.map ?? 0) - (b.map ?? 0));
}

/** TR belongs to the map; employee rows only supply its associated crew. */
export function mapTrFact(group: MapGroup<TrItem>): TrItem | undefined {
  return group.items[0];
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const sign = seconds < 0 ? "−" : "";
  const whole = Math.floor(Math.abs(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const remaining = whole % 60;
  return `${sign}${hours}h ${String(minutes).padStart(2, "0")}m ${String(remaining).padStart(2, "0")}s`;
}

export function liveSeconds(result: IndicatorResult, snapshotAt: string | null,
                            nowMs: number): number | null {
  if (result.seconds == null) return null;
  if (result.lifecycleStatus !== "EM_ANDAMENTO" || !snapshotAt) return result.seconds;
  const snapshotMs = new Date(snapshotAt).getTime();
  if (!Number.isFinite(snapshotMs)) return result.seconds;
  return result.seconds + Math.max(0, Math.floor((nowMs - snapshotMs) / 1000));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short",
  }).format(date);
}

export function outcomeLabel(value: boolean | null): string {
  return value === null ? "Sem resultado" : value ? "Atingido" : "Não atingido";
}

export function checklistPending(value: Checklist | null): boolean {
  return value === null || value.count === null || value.count === 0;
}
