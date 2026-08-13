"use client";

import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";
import { useDtoForm } from "@/features/dpo/hooks/useDtoForm";
import {
  formatDtoDate,
  formatDtoDateTime,
  formatDtoNumber,
  formatDtoPercentage,
} from "@/features/dpo/lib/dtoFormatters";
import type {
  DtoFormDetail,
  DtoFormResource,
} from "@/features/dpo/lib/dtoTypes";
import DtoApplicationsHistory from "@/features/dpo/components/dto/DtoApplicationsHistory";
import DtoCollaborators from "@/features/dpo/components/dto/DtoCollaborators";
import DtoCriticalQuestions from "@/features/dpo/components/dto/DtoCriticalQuestions";
import DtoFilters from "@/features/dpo/components/dto/DtoFilters";
import DtoTrendChart from "@/features/dpo/components/dto/DtoTrendChart";
import {
  DtoBadge,
  DtoButton,
  DtoMetricCard,
  DtoPanel,
  DtoStatePanel,
} from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

function DtoQualityIssues({ detail }: { detail: DtoFormDetail }) {
  if (detail.quality_issues.length === 0) {
    return null;
  }

  return (
    <DtoPanel className="border-[color:var(--shell-line-strong)] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--shell-muted)]" />
        <div className="min-w-0">
          <Typography as="h2" variant="cardTitle">
            Schema parcialmente reconhecido
          </Typography>
          <Typography variant="supportingText" className="mt-2">
            Valores desconhecidos não foram convertidos silenciosamente. As
            funções dependentes de campos não identificados permanecem
            indisponíveis.
          </Typography>
          <ul className="mt-3 space-y-2 text-sm text-[var(--shell-muted)]">
            {detail.quality_issues.slice(0, 6).map((issue, index) => (
              <li
                key={`${issue.code}-${issue.column_key || "form"}-${issue.record_index ?? index}`}
                className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-2"
              >
                <span className="font-semibold text-[var(--shell-text)]">{issue.code}</span>
                {issue.column_key ? ` · ${issue.column_key}` : ""}: {issue.message}
              </li>
            ))}
          </ul>
          {detail.quality_issues.length > 6 ? (
            <p className="mt-2 text-xs text-[var(--shell-muted)]">
              Mais {detail.quality_issues.length - 6} ocorrência(s) registrada(s) pelo adaptador.
            </p>
          ) : null}
        </div>
      </div>
    </DtoPanel>
  );
}

export default function DtoFormAnalysis({
  detail,
  onBack,
  onRetry,
  resource,
}: {
  detail: DtoFormDetail;
  onBack: () => void;
  onRetry: () => Promise<unknown>;
  resource: DtoFormResource;
}) {
  const analysis = useDtoForm(detail);
  const {
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
  } = analysis;

  return (
    <div className="space-y-4">
      <DtoPanel className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-4xl">
            <DtoButton size="sm" onClick={onBack}>
              <ArrowLeft aria-hidden="true" />
              Voltar à visão geral
            </DtoButton>
            <Typography variant="overline" className="mt-5">
              Análise do formulário
            </Typography>
            <Typography as="h2" variant="sectionTitle" className="mt-2 break-words">
              {detail.form.name}
            </Typography>
            <Typography variant="supportingText" className="mt-2">
              Todos os indicadores desta tela usam o mesmo conjunto de
              aplicações filtradas e preservam as respostas originais do SAVI.
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {resource.isRefreshing ? <DtoBadge tone="accent">Atualizando</DtoBadge> : null}
            {detail.cached ? <DtoBadge>Cache do serviço</DtoBadge> : null}
            {detail.quality_issues.length > 0 ? <DtoBadge>Schema parcial</DtoBadge> : null}
            <span className="text-xs text-[var(--shell-muted)]">
              Carga: {formatDtoDateTime(detail.loaded_at)}
            </span>
          </div>
        </div>

        {resource.error ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)] px-4 py-3 text-sm text-[var(--shell-danger)]">
            <p className="min-w-0 flex-1">
              A última tentativa falhou; os dados anteriores continuam em uso. {resource.error}
            </p>
            <DtoButton tone="danger" size="sm" onClick={() => void onRetry()}>
              <RefreshCw aria-hidden="true" />
              Repetir carga
            </DtoButton>
          </div>
        ) : null}
      </DtoPanel>

      <DtoQualityIssues detail={detail} />

      {detail.records.length === 0 ? (
        <DtoStatePanel
          title="Formulário sem respostas"
          description="A DTO foi descoberta e seu schema foi carregado, mas ainda não existem aplicações para analisar. Nenhuma métrica foi fabricada."
        />
      ) : (
        <>
          <DtoFilters
            collaborators={filterOptions.collaborators}
            filteredCount={filteredRecords.length}
            filters={filters}
            hasCollaboratorColumn={filterOptions.hasCollaboratorColumn}
            hasDateColumn={filterOptions.hasDateColumn}
            hasManagerColumn={filterOptions.hasManagerColumn}
            managers={filterOptions.managers}
            onReset={resetFilters}
            onUpdate={updateFilter}
            totalCount={detail.records.length}
          />

          <section aria-labelledby="dto-kpis-title">
            <h2 id="dto-kpis-title" className="sr-only">Indicadores da DTO</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <DtoMetricCard label="Aplicações" value={formatDtoNumber(metrics.applications)} hint="No recorte atual." />
              <DtoMetricCard label="Aderência" tone="accent" value={formatDtoPercentage(metrics.adherence)} hint="OK / (OK + NOK)." />
              <DtoMetricCard label="Respostas OK" tone="accent" value={formatDtoNumber(metrics.ok)} />
              <DtoMetricCard label="Respostas NOK" tone={metrics.nok > 0 ? "danger" : "default"} value={formatDtoNumber(metrics.nok)} />
              <DtoMetricCard label="Colaboradores" value={metrics.collaborators === null ? "Não identificado" : formatDtoNumber(metrics.collaborators)} />
              <DtoMetricCard label="Última aplicação" value={metrics.hasDateColumn ? metrics.lastApplication ? formatDtoDate(metrics.lastApplication) : "Sem data válida" : "Não identificada"} />
            </div>
          </section>

          <DtoPanel className="p-5 sm:p-6">
            <Typography variant="overline">Oportunidades prioritárias</Typography>
            <Typography as="h2" variant="cardTitle" className="mt-2">
              Pontos de atenção derivados dos dados
            </Typography>
            <Typography variant="caption" className="mt-1">
              Regras determinísticas: maior NOK por pergunta, piora entre os
              dois últimos períodos comparáveis, recorrência com NOK e valores
              inesperados.
            </Typography>
            {attentionPoints.length > 0 ? (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {attentionPoints.map((point) => (
                  <article
                    key={point.id}
                    className={`rounded-[22px] border p-4 ${point.tone === "danger" ? "border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)]" : "border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)]"}`}
                  >
                    <h3 className={`text-sm font-semibold ${point.tone === "danger" ? "text-[var(--shell-danger)]" : "text-[var(--shell-text)]"}`}>{point.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">{point.description}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-4 py-6 text-center text-sm text-[var(--shell-muted)]">
                Não há evidência suficiente neste recorte para gerar um ponto de atenção determinístico.
              </div>
            )}
          </DtoPanel>

          <DtoTrendChart
            hasDateColumn={filterOptions.hasDateColumn}
            timeline={timeline}
            trend={trend}
          />

          <div className="grid items-start gap-4 xl:grid-cols-2">
            <DtoCriticalQuestions questions={questions} />
            <DtoCollaborators collaborators={collaborators} />
          </div>

          <DtoApplicationsHistory columns={detail.columns} records={filteredRecords} />
        </>
      )}
    </div>
  );
}

