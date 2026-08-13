"use client";

import { useCallback, useMemo, useState } from "react";
import {
  computeAttentionPoints,
  computeCollaboratorStats,
  computeDtoMetrics,
  computeQuestionStats,
  computeTimeline,
  computeTrend,
  DEFAULT_DTO_FILTERS,
  filterDtoRecords,
  getDtoFilterOptions,
} from "@/features/dpo/lib/dtoAnalytics";
import type {
  DtoFiltersState,
  DtoFormDetail,
} from "@/features/dpo/lib/dtoTypes";

export function useDtoForm(detail: DtoFormDetail) {
  const [filters, setFilters] = useState<DtoFiltersState>({
    ...DEFAULT_DTO_FILTERS,
  });

  const updateFilter = useCallback(
    <Key extends keyof DtoFiltersState>(
      key: Key,
      value: DtoFiltersState[Key],
    ) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_DTO_FILTERS });
  }, []);

  const filteredRecords = useMemo(
    () => filterDtoRecords(detail.records, filters),
    [detail.records, filters],
  );
  const filterOptions = useMemo(() => getDtoFilterOptions(detail), [detail]);
  const metrics = useMemo(
    () => computeDtoMetrics(filteredRecords, detail.columns),
    [detail.columns, filteredRecords],
  );
  const questions = useMemo(
    () => computeQuestionStats(filteredRecords, detail.columns),
    [detail.columns, filteredRecords],
  );
  const collaborators = useMemo(
    () => computeCollaboratorStats(filteredRecords, detail.columns),
    [detail.columns, filteredRecords],
  );
  const timeline = useMemo(
    () => computeTimeline(filteredRecords),
    [filteredRecords],
  );
  const trend = useMemo(() => computeTrend(timeline), [timeline]);
  const attentionPoints = useMemo(
    () => computeAttentionPoints(detail, filteredRecords),
    [detail, filteredRecords],
  );

  return {
    attentionPoints,
    collaborators,
    filteredRecords,
    filterOptions,
    filters,
    metrics,
    questions,
    resetFilters,
    timeline,
    trend,
    updateFilter,
  };
}

