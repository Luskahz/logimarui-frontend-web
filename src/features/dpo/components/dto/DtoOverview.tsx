"use client";

import { ArrowRight, CircleAlert } from "lucide-react";
import {
  computePortfolioMetrics,
  getPortfolioOffenders,
} from "@/features/dpo/lib/dtoAnalytics";
import {
  formatDtoNumber,
  formatDtoPercentage,
} from "@/features/dpo/lib/dtoFormatters";
import type { DtoFormResourceMap } from "@/features/dpo/lib/dtoTypes";
import {
  DtoButton,
  DtoMetricCard,
  DtoPanel,
} from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

export default function DtoOverview({
  formsCount,
  onAnalyze,
  resources,
}: {
  formsCount: number;
  onAnalyze: (formId: string) => void;
  resources: DtoFormResourceMap;
}) {
  const metrics = computePortfolioMetrics(formsCount, resources);
  const offenders = getPortfolioOffenders(resources).slice(0, 3);

  return (
    <DtoPanel className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography variant="overline">Visão geral</Typography>
          <Typography as="h2" variant="sectionTitle" className="mt-2">
            Leitura consolidada
          </Typography>
          <Typography variant="supportingText" className="mt-2 max-w-3xl">
            A aderência considera exclusivamente OK / (OK + NOK). Campos
            vazios, neutros, metadados e valores inesperados não entram no
            denominador.
          </Typography>
        </div>

        {metrics.partial ? (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-2 text-xs text-[var(--shell-muted)]">
            <CircleAlert aria-hidden="true" className="h-4 w-4" />
            {metrics.loadedForms} de {metrics.forms} formulário(s) carregado(s)
            {metrics.failedForms > 0 ? ` · ${metrics.failedForms} com falha` : ""}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DtoMetricCard
          label="Formulários DTO"
          value={formatDtoNumber(metrics.forms)}
          hint="Descobertos dinamicamente no SAVI."
        />
        <DtoMetricCard
          label="DTOs aplicadas"
          value={formatDtoNumber(metrics.applications)}
          hint={metrics.partial ? "Total parcial dos formulários disponíveis." : "Aplicações carregadas."}
        />
        <DtoMetricCard
          label="Aderência geral"
          tone="accent"
          value={formatDtoPercentage(metrics.adherence)}
          hint="OK / (OK + NOK)."
        />
        <DtoMetricCard
          label="Respostas NOK"
          tone={metrics.nok && metrics.nok > 0 ? "danger" : "default"}
          value={formatDtoNumber(metrics.nok)}
          hint="Desvios entre respostas avaliativas válidas."
        />
        <DtoMetricCard
          label="Colaboradores"
          value={
            metrics.collaborators === null
              ? "Não identificado"
              : formatDtoNumber(metrics.collaborators)
          }
          hint="Somente em formulários com campo reconhecido."
        />
      </div>

      {offenders.length > 0 ? (
        <div className="mt-5 rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
          <Typography as="h3" variant="cardTitle">
            Pontos de atenção consolidados
          </Typography>
          <Typography variant="caption" className="mt-1">
            Ordenação transparente por maior quantidade de NOK; em empate,
            menor aderência.
          </Typography>

          <ol className="mt-4 grid gap-2 lg:grid-cols-3">
            {offenders.map((item, index) => (
              <li
                key={item.id}
                className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--shell-muted)]">
                    {index + 1}º ponto de atenção
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-[var(--shell-text)]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--shell-muted)]">
                    {formatDtoNumber(item.nok)} NOK · {formatDtoPercentage(item.adherence)} de aderência
                  </p>
                </div>
                <DtoButton
                  size="icon-sm"
                  aria-label={`Analisar ${item.name}`}
                  onClick={() => onAnalyze(item.id)}
                >
                  <ArrowRight aria-hidden="true" />
                </DtoButton>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </DtoPanel>
  );
}

