"use client";

import { useState } from "react";
import { formatDtoNumber, formatDtoPercentage } from "@/features/dpo/lib/dtoFormatters";
import type { DtoQuestionStat } from "@/features/dpo/lib/dtoTypes";
import { DtoBadge, DtoButton, DtoPanel } from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

export default function DtoCriticalQuestions({
  questions,
  compact = false,
  title = "Onde o padrão apresenta mais desvios",
}: {
  questions: DtoQuestionStat[];
  compact?: boolean;
  title?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const relevant = questions.filter(
    (question) => question.answered > 0 || question.unmapped > 0,
  );
  const visible = compact || expanded ? relevant : relevant.slice(0, 10);

  return (
    <DtoPanel className="p-5 sm:p-6">
      <Typography variant="overline">Perguntas críticas</Typography>
      <Typography as="h2" variant="cardTitle" className="mt-2">{title}</Typography>
      <Typography variant="caption" className="mt-1">
        Ordem: maior quantidade de resultados negativos; em empate, maior taxa negativa.
        A taxa usa apenas respostas positivas e negativas.
      </Typography>

      {visible.length ? (
        <div className="mt-5 space-y-3">
          {visible.map((question, index) => (
            <article key={question.columnKey} className="rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--shell-muted)]">
                    {index + 1}º por resultado negativo
                  </p>
                  <h3 className="mt-2 break-words text-sm font-semibold leading-6 text-[var(--shell-text)]">{question.label}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {question.recurring ? <DtoBadge tone="danger">Gap recorrente</DtoBadge> : null}
                  {question.unmapped > 0 ? <DtoBadge>{question.unmapped} não parametrizada(s)</DtoBadge> : null}
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--shell-surface)]">
                <div className="h-full rounded-full bg-[var(--shell-danger)]" style={{ width: `${Math.max(0, Math.min(100, question.negativeRate ?? 0))}%` }} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                <div><dt className="text-[var(--shell-muted)]">Positivas</dt><dd className="mt-1 font-semibold text-[var(--shell-accent)]">{formatDtoNumber(question.positive)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">Negativas</dt><dd className="mt-1 font-semibold text-[var(--shell-danger)]">{formatDtoNumber(question.negative)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">Taxa negativa</dt><dd className="mt-1 font-semibold text-[var(--shell-text)]">{formatDtoPercentage(question.negativeRate)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">Aplicações negativas</dt><dd className="mt-1 font-semibold text-[var(--shell-text)]">{formatDtoNumber(question.negativeApplications)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">Respondidas</dt><dd className="mt-1 font-semibold text-[var(--shell-text)]">{formatDtoNumber(question.answered)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-4 py-8 text-center text-sm text-[var(--shell-muted)]">
          As perguntas parametrizadas não possuem respostas positivas ou negativas neste recorte.
        </div>
      )}

      {!compact && relevant.length > 10 ? (
        <DtoButton className="mt-4" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Mostrar menos" : `Mostrar todas (${relevant.length})`}
        </DtoButton>
      ) : null}
    </DtoPanel>
  );
}
