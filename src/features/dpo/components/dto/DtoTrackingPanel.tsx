"use client";

import { useMemo, useState } from "react";
import { Search, Settings2 } from "lucide-react";
import type { EChartsOption } from "echarts";
import DtoEChart from "@/features/dpo/components/dto/DtoEChart";
import {
  DtoBadge,
  DtoButton,
  DtoMetricCard,
  DtoPanel,
  DtoStatePanel,
} from "@/features/dpo/components/dto/DtoPrimitives";
import { computeDtoTracking } from "@/features/dpo/lib/dtoTracking";
import {
  formatDtoDate,
  formatDtoNumber,
  formatDtoPercentage,
  normalizeSearchText,
} from "@/features/dpo/lib/dtoFormatters";
import type {
  DtoFormDetail,
  DtoTrackedCollaborator,
  DtoTrackingStatus,
} from "@/features/dpo/lib/dtoTypes";
import { Typography } from "@/shared/ui/typography";

const STATUS_LABELS: Record<DtoTrackingStatus, string> = {
  current: "Em dia",
  dueSoon: "Próximo do prazo",
  overdue: "Em atraso",
  never: "Nunca realizado",
};

const STATUS_COLORS: Record<DtoTrackingStatus, string> = {
  current: "#14b8a6",
  dueSoon: "#f59e0b",
  overdue: "#f97316",
  never: "#ef4444",
};

function statusTone(status: DtoTrackingStatus): "accent" | "danger" | "default" {
  if (status === "current") return "accent";
  if (status === "overdue" || status === "never") return "danger";
  return "default";
}

function dueHint(collaborator: DtoTrackedCollaborator): string {
  if (collaborator.status === "never") return "Sem realização válida";
  if (collaborator.daysUntilDue === null) return "Prazo indisponível";
  if (collaborator.daysUntilDue < 0) {
    return `${Math.abs(collaborator.daysUntilDue)} dia(s) em atraso`;
  }
  if (collaborator.daysUntilDue === 0) return "Prazo vence hoje";
  return `${collaborator.daysUntilDue} dia(s) até o prazo`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

export default function DtoTrackingPanel({
  detail,
  onConfigure,
}: {
  detail: DtoFormDetail;
  onConfigure: () => void;
}) {
  const [search, setSearch] = useState("");
  const tracking = useMemo(() => computeDtoTracking(detail), [detail]);
  const visibleCollaborators = useMemo(() => {
    const query = normalizeSearchText(search);
    return query
      ? tracking.collaborators.filter((item) =>
          normalizeSearchText(item.name).includes(query),
        )
      : tracking.collaborators;
  }, [search, tracking.collaborators]);

  if (!tracking.configured) {
    return (
      <DtoStatePanel
        title="Defina a forma de acompanhamento"
        description="Escolha na Configuração o campo que identifica os colaboradores, a data de realização e a periodicidade exigida para este formulário."
        action={
          <DtoButton tone="accent" onClick={onConfigure}>
            <Settings2 aria-hidden="true" /> Configurar acompanhamento
          </DtoButton>
        }
      />
    );
  }

  if (tracking.total === 0) {
    return (
      <DtoStatePanel
        title="Nenhum colaborador na população acompanhada"
        description="O campo selecionado ainda não possui nomes válidos no snapshot, ou todos foram desconsiderados. Inclua pessoas manualmente ou revise a configuração."
        action={
          <DtoButton tone="accent" onClick={onConfigure}>
            <Settings2 aria-hidden="true" /> Revisar acompanhamento
          </DtoButton>
        }
      />
    );
  }

  const coverageOption: EChartsOption = {
    animationDuration: 450,
    color: [
      STATUS_COLORS.current,
      STATUS_COLORS.dueSoon,
      STATUS_COLORS.overdue,
      STATUS_COLORS.never,
    ],
    tooltip: { trigger: "item", valueFormatter: (value) => formatDtoNumber(Number(value)) },
    legend: {
      bottom: 0,
      textStyle: { color: "#94a3b8", fontSize: 11 },
    },
    series: [
      {
        name: "Situação",
        type: "pie",
        radius: ["48%", "72%"],
        center: ["50%", "43%"],
        avoidLabelOverlap: true,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: "bold" } },
        data: [
          { name: STATUS_LABELS.current, value: tracking.current },
          { name: STATUS_LABELS.dueSoon, value: tracking.dueSoon },
          { name: STATUS_LABELS.overdue, value: tracking.overdue },
          { name: STATUS_LABELS.never, value: tracking.never },
        ],
      },
    ],
  };

  const chartCollaborators = tracking.collaborators.slice(0, 20).reverse();
  const applicationsOption: EChartsOption = {
    animationDuration: 450,
    grid: { top: 12, right: 20, bottom: 30, left: 150, containLabel: false },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params;
        const index = Number(item?.dataIndex ?? 0);
        const collaborator = chartCollaborators[index];
        return collaborator
          ? `<strong>${escapeHtml(collaborator.name)}</strong><br/>${STATUS_LABELS[collaborator.status]}<br/>${formatDtoNumber(collaborator.applications)} realização(ões)`
          : "";
      },
    },
    xAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: "#94a3b8" },
      splitLine: { lineStyle: { color: "#334155", type: "dashed" } },
    },
    yAxis: {
      type: "category",
      data: chartCollaborators.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "#94a3b8",
        width: 132,
        overflow: "truncate",
      },
    },
    series: [
      {
        name: "Realizações",
        type: "bar",
        barMaxWidth: 22,
        data: chartCollaborators.map((item) => ({
          value: item.applications,
          itemStyle: { color: STATUS_COLORS[item.status], borderRadius: [0, 6, 6, 0] },
        })),
      },
    ],
  };

  return (
    <div className="space-y-4">
      <section aria-labelledby="tracking-kpis-title">
        <h2 id="tracking-kpis-title" className="sr-only">
          Indicadores do acompanhamento
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DtoMetricCard label="Colaboradores" value={formatDtoNumber(tracking.total)} />
          <DtoMetricCard
            label="Aderência de realização"
            tone="accent"
            value={formatDtoPercentage(tracking.realizationAdherence)}
            hint="Em dia ou próximos do prazo / população acompanhada."
          />
          <DtoMetricCard label="Em dia" tone="accent" value={formatDtoNumber(tracking.current)} />
          <DtoMetricCard label="Em atraso" tone={tracking.overdue ? "danger" : "default"} value={formatDtoNumber(tracking.overdue)} />
          <DtoMetricCard label="Nunca realizado" tone={tracking.never ? "danger" : "default"} value={formatDtoNumber(tracking.never)} />
          <DtoMetricCard label="Última realização" value={formatDtoDate(tracking.lastRealization)} />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <DtoPanel className="p-5 sm:p-6">
          <Typography variant="overline">Cobertura</Typography>
          <Typography as="h2" variant="cardTitle" className="mt-2">
            Situação da periodicidade
          </Typography>
          <DtoEChart
            ariaLabel="Distribuição dos colaboradores por situação de realização"
            className="mt-3 h-80"
            option={coverageOption}
          />
        </DtoPanel>

        <DtoPanel className="p-5 sm:p-6">
          <Typography variant="overline">Realizações</Typography>
          <Typography as="h2" variant="cardTitle" className="mt-2">
            Volume por colaborador
          </Typography>
          <Typography variant="caption" className="mt-1">
            Mostra até 20 pessoas, priorizando quem nunca realizou ou está em atraso.
          </Typography>
          <DtoEChart
            ariaLabel="Quantidade de realizações por colaborador"
            className="mt-3 h-96"
            option={applicationsOption}
          />
        </DtoPanel>
      </div>

      <DtoPanel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Typography variant="overline">População acompanhada</Typography>
            <Typography as="h2" variant="cardTitle" className="mt-2">
              Última realização e próximo prazo
            </Typography>
          </div>
          <label className="relative min-w-60 flex-1 sm:max-w-sm">
            <span className="sr-only">Buscar colaborador</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar colaborador"
              className="w-full rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] py-2.5 pl-10 pr-3 text-sm text-[var(--shell-text)]"
            />
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-[var(--shell-muted)]">
              <tr className="border-b border-[color:var(--shell-line)]">
                <th className="px-3 py-3 font-semibold">Colaborador</th>
                <th className="px-3 py-3 font-semibold">Situação</th>
                <th className="px-3 py-3 font-semibold">Realizações</th>
                <th className="px-3 py-3 font-semibold">Última realização</th>
                <th className="px-3 py-3 font-semibold">Próximo prazo</th>
              </tr>
            </thead>
            <tbody>
              {visibleCollaborators.map((collaborator) => (
                <tr key={collaborator.key} className="border-b border-[color:var(--shell-line)] last:border-0">
                  <td className="px-3 py-3 font-semibold text-[var(--shell-text)]">
                    {collaborator.name}
                    {collaborator.source === "manual" ? (
                      <span className="ml-2 text-xs font-normal text-[var(--shell-muted)]">manual</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <DtoBadge tone={statusTone(collaborator.status)}>
                      {STATUS_LABELS[collaborator.status]}
                    </DtoBadge>
                  </td>
                  <td className="px-3 py-3 text-[var(--shell-muted)]">{formatDtoNumber(collaborator.applications)}</td>
                  <td className="px-3 py-3 text-[var(--shell-muted)]">{formatDtoDate(collaborator.lastRealization)}</td>
                  <td className="px-3 py-3 text-[var(--shell-muted)]">
                    <span className="block text-[var(--shell-text)]">{formatDtoDate(collaborator.nextDueDate)}</span>
                    <span className="text-xs">{dueHint(collaborator)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleCollaborators.length ? (
            <p className="py-8 text-center text-sm text-[var(--shell-muted)]">
              Nenhum colaborador corresponde à busca.
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--shell-muted)]">
          <span>
            Intervalo configurado: <strong className="text-[var(--shell-text)]">{detail.configuration.tracking.interval_days} dias</strong>
          </span>
          <span>{tracking.excludedCollaborators.length} colaborador(es) desconsiderado(s)</span>
        </div>
      </DtoPanel>
    </div>
  );
}
