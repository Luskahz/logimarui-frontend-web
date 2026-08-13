"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  computeCollaboratorApplicationTimeline,
  computeDtoMetrics,
  computeQuestionStats,
} from "@/features/dpo/lib/dtoAnalytics";
import { formatDtoDate, formatDtoNumber, formatDtoPercentage } from "@/features/dpo/lib/dtoFormatters";
import type { DtoColumn, DtoRecord } from "@/features/dpo/lib/dtoTypes";
import DtoApplicationsHistory from "@/features/dpo/components/dto/DtoApplicationsHistory";
import DtoCriticalQuestions from "@/features/dpo/components/dto/DtoCriticalQuestions";
import { DtoBadge, DtoButton, DtoMetricCard, DtoPanel } from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

export default function DtoCollaboratorAnalysisDialog({
  collaborator,
  columns,
  formName,
  onClose,
  periodLabel,
  records,
}: {
  collaborator: string;
  columns: DtoColumn[];
  formName: string;
  onClose: () => void;
  periodLabel: string;
  records: DtoRecord[];
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const metrics = useMemo(() => computeDtoMetrics(records, columns), [columns, records]);
  const questions = useMemo(() => computeQuestionStats(records, columns), [columns, records]);
  const timeline = useMemo(() => computeCollaboratorApplicationTimeline(records), [records]);
  const applicationsWithNegative = useMemo(
    () => records.filter((record) => record.answers.some((answer) => answer.status === "NEGATIVE")).length,
    [records],
  );
  const recurringGaps = questions.filter((question) => question.recurring).length;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--shell-overlay)] p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="dto-collaborator-dialog-title" className="max-h-[96vh] w-full overflow-y-auto rounded-t-[30px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-4 shadow-2xl sm:max-w-6xl sm:rounded-[30px] sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Typography variant="overline">Análise individual na DTO</Typography>
            <Typography id="dto-collaborator-dialog-title" as="h2" variant="sectionTitle" className="mt-2 break-words">{collaborator}</Typography>
            <p className="mt-2 text-sm text-[var(--shell-muted)]">{formName} · {periodLabel}</p>
            <p className="mt-1 text-xs text-[var(--shell-muted)]">Última aplicação: {formatDtoDate(metrics.lastApplication)}</p>
          </div>
          <DtoButton size="icon-sm" aria-label="Fechar análise do colaborador" onClick={onClose}><X aria-hidden="true" /></DtoButton>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DtoMetricCard label="Aplicações" value={formatDtoNumber(metrics.applications)} />
          <DtoMetricCard label="Aderência" tone="accent" value={formatDtoPercentage(metrics.adherence)} />
          <DtoMetricCard label="Positivas" tone="accent" value={formatDtoNumber(metrics.positive)} />
          <DtoMetricCard label="Negativas" tone={metrics.negative ? "danger" : "default"} value={formatDtoNumber(metrics.negative)} />
          <DtoMetricCard label="Aplicações negativas" value={formatDtoNumber(applicationsWithNegative)} />
          <DtoMetricCard label="Gaps recorrentes" tone={recurringGaps ? "danger" : "default"} value={formatDtoNumber(recurringGaps)} />
        </div>

        <DtoPanel className="mt-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Typography variant="overline">Evolução do colaborador</Typography>
              <Typography as="h3" variant="cardTitle" className="mt-2">Aderência e negativas por aplicação</Typography>
            </div>
            {recurringGaps ? <DtoBadge tone="danger">{recurringGaps} gap(s) recorrente(s)</DtoBadge> : null}
          </div>
          {timeline.length ? (
            <div className="mt-5 h-72 min-w-0" role="img" aria-label="Evolução da aderência do colaborador por aplicação">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="var(--shell-line)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tick={{ fill: "var(--shell-muted)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={16} />
                  <YAxis yAxisId="adherence" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "var(--shell-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                  <YAxis yAxisId="negative" orientation="right" allowDecimals={false} tick={{ fill: "var(--shell-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip formatter={(value, name) => name === "Aderência" ? formatDtoPercentage(Number(value)) : formatDtoNumber(Number(value))} />
                  <Bar yAxisId="negative" dataKey="negative" name="Negativas" fill="var(--shell-danger-bg)" stroke="var(--shell-danger)" radius={[6, 6, 0, 0]} maxBarSize={34} />
                  <Line yAxisId="adherence" type="monotone" dataKey="adherence" name="Aderência" stroke="var(--shell-accent)" strokeWidth={3} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] px-4 py-8 text-center text-sm text-[var(--shell-muted)]">A data não está disponível com segurança para montar a evolução individual.</div>
          )}
        </DtoPanel>

        <div className="mt-4"><DtoCriticalQuestions compact questions={questions} title="Pontos do padrão com maior dificuldade" /></div>
        <div className="mt-4"><DtoApplicationsHistory columns={columns} records={records} /></div>
      </section>
    </div>
  );
}
