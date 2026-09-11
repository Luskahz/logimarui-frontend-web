"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Settings2 } from "lucide-react";
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
  DtoTrackingContext,
  DtoTrackedSubject,
  DtoTrackingStatus,
} from "@/features/dpo/lib/dtoTypes";
import { useFormManagerConfig } from "@/features/dpo/lib/formManagerConfig";
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

function dueHint(subject: DtoTrackedSubject): string {
  if (subject.status === "never") return "Sem realização válida";
  if (subject.daysUntilDue === null) return "Prazo indisponível";
  const prefix = subject.firstRealizationPending ? "1ª realização · " : "";
  if (subject.daysUntilDue < 0) {
    return `${prefix}${Math.abs(subject.daysUntilDue)} dia(s) em atraso`;
  }
  if (subject.daysUntilDue === 0) return `${prefix}prazo vence hoje`;
  return `${prefix}${subject.daysUntilDue} dia(s) até o prazo`;
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
  const { api } = useFormManagerConfig();
  const [search, setSearch] = useState("");
  const [contextResult, setContextResult] = useState<{
    key: string;
    context: DtoTrackingContext | null;
    error: string | null;
  } | null>(null);
  const [contextReload, setContextReload] = useState(0);
  const needsWorkforceContext =
    detail.configuration.tracking.mode === "COLLABORATOR" &&
    Boolean(
      detail.configuration.tracking.collaborator_source &&
        detail.configuration.tracking.roster_field_key &&
        detail.configuration.tracking.realization_date_field_key &&
        detail.configuration.tracking.interval_days &&
        detail.configuration.tracking.applicable_functions?.length,
    );
  const contextRequestKey = needsWorkforceContext
    ? `${detail.form.id}:${detail.configuration.revision}:${contextReload}`
    : null;
  const currentContextResult = contextResult?.key === contextRequestKey
    ? contextResult
    : null;
  const context = currentContextResult?.context || null;
  const contextStatus = !needsWorkforceContext
    ? "ready"
    : currentContextResult
      ? currentContextResult.error
        ? "error"
        : "ready"
      : "loading";
  const contextError = currentContextResult?.error || null;

  useEffect(() => {
    if (!contextRequestKey) return;
    const controller = new AbortController();
    void api.getTrackingContext(detail.form.id, controller.signal)
      .then((payload) => {
        setContextResult({ key: contextRequestKey, context: payload, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setContextResult({
          key: contextRequestKey,
          context: null,
          error: error instanceof Error
            ? error.message
            : "Não foi possível consultar o cadastro de colaboradores.",
        });
      });
    return () => controller.abort();
  }, [api, contextRequestKey, detail.form.id]);

  const tracking = useMemo(
    () => computeDtoTracking(detail, context),
    [context, detail],
  );
  const isEnvironment = tracking.mode === "ENVIRONMENT";
  const isFormEnvironment = isEnvironment && tracking.environmentSource === "FORM";
  const subjectLabel = isEnvironment ? "ambiente" : "colaborador";
  const subjectsLabel = isEnvironment ? "ambientes" : "colaboradores";
  const populationLabel = isEnvironment ? "Ambientes" : "Colaboradores";
  const subjectHeading = isEnvironment ? "Ambiente" : "Colaborador";
  const visibleSubjects = useMemo(() => {
    const query = normalizeSearchText(search);
    return query
      ? tracking.subjects.filter((item) =>
          normalizeSearchText(`${item.name} ${item.function || ""}`).includes(query),
        )
      : tracking.subjects;
  }, [search, tracking.subjects]);

  if (!tracking.configured) {
    return (
      <DtoStatePanel
        title="Defina a forma de acompanhamento"
        description="Escolha na Configuração se o ciclo será por colaborador ou por ambiente. Para um ambiente geral, defina um único rótulo: todas as realizações do formulário serão atribuídas a ele."
        action={
          <DtoButton tone="accent" onClick={onConfigure}>
            <Settings2 aria-hidden="true" /> Configurar acompanhamento
          </DtoButton>
        }
      />
    );
  }

  if (needsWorkforceContext && contextStatus === "loading") {
    return (
      <DtoStatePanel
        title="Consultando o cadastro de colaboradores"
        description="A população oficial e os vínculos das realizações estão sendo carregados do banco read-only."
      />
    );
  }

  if (needsWorkforceContext && contextStatus === "error") {
    return (
      <DtoStatePanel
        title="Não foi possível montar o acompanhamento por colaborador"
        description={contextError || "O cadastro oficial não respondeu."}
        action={
          <DtoButton tone="accent" onClick={() => setContextReload((value) => value + 1)}>
            <RefreshCw aria-hidden="true" /> Tentar novamente
          </DtoButton>
        }
      />
    );
  }

  if (tracking.total === 0) {
    return (
      <DtoStatePanel
        title={`Nenhum ${subjectLabel} na população acompanhada`}
        description={isEnvironment
          ? `O campo selecionado ainda não possui ${subjectsLabel} válidos no snapshot, ou todos foram desconsiderados. Revise a configuração.`
          : context?.employees_without_cpf
            ? `O cadastro possui ${formatDtoNumber(context.employees_without_cpf)} funcionário(s) sem CPF. Eles permanecerão fora do cálculo até o preenchimento da coluna.`
            : "Nenhum funcionário com CPF válido pertence às funções selecionadas. Revise o filtro na configuração."}
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

  const chartSubjects = tracking.subjects.slice(0, 20).reverse();
  const applicationsOption: EChartsOption = {
    animationDuration: 450,
    grid: { top: 12, right: 20, bottom: 30, left: 150, containLabel: false },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params;
        const index = Number(item?.dataIndex ?? 0);
        const subject = chartSubjects[index];
        return subject
          ? `<strong>${escapeHtml(subject.name)}</strong><br/>${STATUS_LABELS[subject.status]}<br/>${formatDtoNumber(subject.applications)} realização(ões)`
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
      data: chartSubjects.map((item) => item.name),
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
        data: chartSubjects.map((item) => ({
          value: item.applications,
          itemStyle: { color: STATUS_COLORS[item.status], borderRadius: [0, 6, 6, 0] },
        })),
      },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DtoBadge tone="accent">
          {isFormEnvironment
            ? "Acompanhamento do ambiente geral"
            : isEnvironment
              ? "Acompanhamento por ambiente"
              : tracking.collaboratorSource === "MAP"
                ? "Acompanhamento por mapa e equipe"
                : "Acompanhamento por CPF"}
        </DtoBadge>
      </div>
      <section aria-labelledby="tracking-kpis-title">
        <h2 id="tracking-kpis-title" className="sr-only">
          Indicadores do acompanhamento
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          <DtoMetricCard label={populationLabel} value={formatDtoNumber(tracking.total)} />
          {!isEnvironment ? (
            <DtoMetricCard
              label="Novos"
              value={formatDtoNumber(tracking.newEmployees)}
              hint="Conforme a janela após a admissão."
            />
          ) : null}
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
            ariaLabel={`Distribuição dos ${subjectsLabel} por situação de realização`}
            className="mt-3 h-80"
            option={coverageOption}
          />
        </DtoPanel>

        <DtoPanel className="p-5 sm:p-6">
          <Typography variant="overline">Realizações</Typography>
          <Typography as="h2" variant="cardTitle" className="mt-2">
            Volume por {subjectLabel}
          </Typography>
          <Typography variant="caption" className="mt-1">
            Mostra até 20 {subjectsLabel}, priorizando quem nunca recebeu uma realização ou está em atraso.
          </Typography>
          <DtoEChart
            ariaLabel={`Quantidade de realizações por ${subjectLabel}`}
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
            <span className="sr-only">Buscar {subjectLabel}</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar ${subjectLabel}`}
              className="w-full rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] py-2.5 pl-10 pr-3 text-sm text-[var(--shell-text)]"
            />
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-[var(--shell-muted)]">
              <tr className="border-b border-[color:var(--shell-line)]">
                <th className="px-3 py-3 font-semibold">{subjectHeading}</th>
                {!isEnvironment ? <th className="px-3 py-3 font-semibold">Função</th> : null}
                {!isEnvironment ? <th className="px-3 py-3 font-semibold">Admissão</th> : null}
                <th className="px-3 py-3 font-semibold">Situação</th>
                <th className="px-3 py-3 font-semibold">Realizações</th>
                <th className="px-3 py-3 font-semibold">Última realização</th>
                <th className="px-3 py-3 font-semibold">Próximo prazo</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubjects.map((subject) => (
                <tr key={subject.key} className="border-b border-[color:var(--shell-line)] last:border-0">
                  <td className="px-3 py-3 font-semibold text-[var(--shell-text)]">
                    {subject.name}
                    {subject.isNew ? (
                      <span className="ml-2"><DtoBadge tone="accent">Novo</DtoBadge></span>
                    ) : null}
                    {subject.source !== "observed" && subject.source !== "database" ? (
                      <span className="ml-2 text-xs font-normal text-[var(--shell-muted)]">
                        {subject.source === "form" ? "formulário" : "manual"}
                      </span>
                    ) : null}
                  </td>
                  {!isEnvironment ? (
                    <td className="px-3 py-3 text-[var(--shell-muted)]">
                      {subject.function || "Não informada"}
                    </td>
                  ) : null}
                  {!isEnvironment ? (
                    <td className="px-3 py-3 text-[var(--shell-muted)]">
                      {formatDtoDate(subject.admissionDate)}
                    </td>
                  ) : null}
                  <td className="px-3 py-3">
                    <DtoBadge tone={statusTone(subject.status)}>
                      {subject.firstRealizationPending && subject.status === "current"
                        ? "Dentro do prazo inicial"
                        : subject.firstRealizationPending && subject.status === "dueSoon"
                          ? "Prazo inicial próximo"
                          : STATUS_LABELS[subject.status]}
                    </DtoBadge>
                  </td>
                  <td className="px-3 py-3 text-[var(--shell-muted)]">{formatDtoNumber(subject.applications)}</td>
                  <td className="px-3 py-3 text-[var(--shell-muted)]">{formatDtoDate(subject.lastRealization)}</td>
                  <td className="px-3 py-3 text-[var(--shell-muted)]">
                    <span className="block text-[var(--shell-text)]">{formatDtoDate(subject.nextDueDate)}</span>
                    <span className="text-xs">{dueHint(subject)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleSubjects.length ? (
            <p className="py-8 text-center text-sm text-[var(--shell-muted)]">
              Nenhum {subjectLabel} corresponde à busca.
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--shell-muted)]">
          <span>
            Intervalo configurado: <strong className="text-[var(--shell-text)]">{detail.configuration.tracking.interval_days} dias</strong>
            {!isEnvironment && detail.configuration.tracking.new_employee_first_due_days
              ? ` · primeira realização em ${detail.configuration.tracking.new_employee_first_due_days} dias após admissão`
              : ""}
          </span>
          <span>
            {isFormEnvironment
              ? "Todas as realizações deste formulário contam para o ambiente geral."
              : isEnvironment
                ? `${tracking.excludedSubjects.length} ${subjectLabel}(es) desconsiderado(s)`
                : `${formatDtoNumber(context?.unmatched_records || 0)} realização(ões) sem vínculo cadastral`}
          </span>
        </div>
      </DtoPanel>
    </div>
  );
}
