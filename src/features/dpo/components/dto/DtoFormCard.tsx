"use client";

import { ArrowRight, RefreshCw, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import {
  computeDtoMetrics,
  computeTimeline,
  computeTrend,
} from "@/features/dpo/lib/dtoAnalytics";
import {
  formatDtoDate,
  formatDtoNumber,
  formatDtoPercentage,
  formatPercentagePointDelta,
} from "@/features/dpo/lib/dtoFormatters";
import type {
  DtoFormReference,
  DtoFormResource,
} from "@/features/dpo/lib/dtoTypes";
import {
  DtoBadge,
  DtoButton,
  DtoPanel,
} from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

function DtoFormCardSkeleton({ name }: { name: string }) {
  return (
    <DtoPanel className="min-h-72 p-5" aria-label={`Carregando ${name}`}>
      <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--shell-surface-muted)]" />
      <div className="mt-4 h-7 w-3/4 animate-pulse rounded-xl bg-[var(--shell-surface-muted)]" />
      <div className="mt-6 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-2xl bg-[var(--shell-surface-muted)]"
          />
        ))}
      </div>
    </DtoPanel>
  );
}

export default function DtoFormCard({
  form,
  onAnalyze,
  onRetry,
  resource,
}: {
  form: DtoFormReference;
  onAnalyze: (formId: string) => void;
  onRetry: (formId: string) => Promise<unknown>;
  resource: DtoFormResource | undefined;
}) {
  const detail = resource?.data || null;
  const metrics = useMemo(
    () => (detail ? computeDtoMetrics(detail.records, detail.columns) : null),
    [detail],
  );
  const trend = useMemo(
    () => (detail ? computeTrend(computeTimeline(detail.records)) : null),
    [detail],
  );

  if (!resource || (!resource.data && (resource.status === "idle" || resource.status === "loading"))) {
    return <DtoFormCardSkeleton name={form.name} />;
  }

  if (!detail || !metrics) {
    return (
      <DtoPanel className="flex min-h-72 flex-col p-5">
        <div className="flex items-center gap-2 text-[var(--shell-danger)]">
          <TriangleAlert aria-hidden="true" className="h-5 w-5" />
          <Typography variant="overline" className="text-[var(--shell-danger)]">
            Falha individual
          </Typography>
        </div>
        <h3 className="mt-3 break-words text-xl font-semibold text-[var(--shell-text)]">
          {form.name}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-[var(--shell-danger)]">
          {resource.error || "Não foi possível carregar este formulário."}
        </p>
        <DtoButton
          tone="danger"
          className="mt-5 self-start"
          onClick={() => void onRetry(form.id)}
        >
          <RefreshCw aria-hidden="true" />
          Tentar novamente
        </DtoButton>
      </DtoPanel>
    );
  }

  const lastApplicationLabel = metrics.hasDateColumn
    ? metrics.lastApplication
      ? formatDtoDate(metrics.lastApplication)
      : "Sem data válida"
    : "Não identificada";
  const trendLabel = trend
    ? `${trend.direction === "improving" ? "Melhora" : trend.direction === "worsening" ? "Queda" : "Estável"} ${formatPercentagePointDelta(trend.delta)}`
    : metrics.hasDateColumn
      ? "Sem períodos comparáveis"
      : "Data não identificada";

  return (
    <DtoPanel className="flex min-h-72 flex-col p-5 transition hover:border-[color:var(--shell-line-strong)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography variant="overline">Formulário DTO</Typography>
          <h3 className="mt-2 break-words text-xl font-semibold text-[var(--shell-text)]">
            {form.name}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {resource.isRefreshing ? <DtoBadge tone="accent">Atualizando</DtoBadge> : null}
          {detail.quality_issues.length > 0 ? <DtoBadge>Schema parcial</DtoBadge> : null}
          {detail.cached ? <DtoBadge>Cache</DtoBadge> : null}
        </div>
      </div>

      {resource.error ? (
        <div className="mt-4 rounded-2xl border border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)] px-3 py-2 text-xs leading-5 text-[var(--shell-danger)]">
          A atualização deste formulário falhou; os dados anteriores foram preservados. {resource.error}
        </div>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[var(--shell-surface-muted)] p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shell-muted)]">Aplicações</dt>
          <dd className="mt-2 text-lg font-semibold text-[var(--shell-text)]">{formatDtoNumber(metrics.applications)}</dd>
        </div>
        <div className="rounded-2xl bg-[var(--shell-surface-muted)] p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shell-muted)]">Aderência</dt>
          <dd className="mt-2 text-lg font-semibold text-[var(--shell-accent)]">{formatDtoPercentage(metrics.adherence)}</dd>
        </div>
        <div className="rounded-2xl bg-[var(--shell-surface-muted)] p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shell-muted)]">Respostas negativas</dt>
          <dd className="mt-2 text-lg font-semibold text-[var(--shell-danger)]">{formatDtoNumber(metrics.negative)}</dd>
        </div>
        <div className="rounded-2xl bg-[var(--shell-surface-muted)] p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--shell-muted)]">Colaboradores</dt>
          <dd className="mt-2 break-words text-sm font-semibold text-[var(--shell-text)]">
            {metrics.collaborators === null ? "Não identificado" : formatDtoNumber(metrics.collaborators)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-2 text-xs leading-5 text-[var(--shell-muted)] sm:grid-cols-2">
        <p><span className="font-semibold text-[var(--shell-text)]">Última aplicação:</span> {lastApplicationLabel}</p>
        <p><span className="font-semibold text-[var(--shell-text)]">Tendência:</span> {trendLabel}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        {resource.error ? (
          <DtoButton size="sm" tone="danger" onClick={() => void onRetry(form.id)}>
            <RefreshCw aria-hidden="true" />
            Repetir carga
          </DtoButton>
        ) : <span />}
        <DtoButton tone="accent" onClick={() => onAnalyze(form.id)}>
          Analisar
          <ArrowRight aria-hidden="true" />
        </DtoButton>
      </div>
    </DtoPanel>
  );
}
