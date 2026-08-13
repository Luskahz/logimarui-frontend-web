"use client";

import { useState } from "react";
import {
  formatDtoNumber,
  formatDtoPercentage,
} from "@/features/dpo/lib/dtoFormatters";
import type { DtoQuestionStat } from "@/features/dpo/lib/dtoTypes";
import {
  DtoBadge,
  DtoButton,
  DtoPanel,
} from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

const INITIAL_QUESTION_LIMIT = 10;

export default function DtoCriticalQuestions({
  questions,
}: {
  questions: DtoQuestionStat[];
}) {
  const [showAll, setShowAll] = useState(false);
  const answeredQuestions = questions.filter(
    (question) => question.answered > 0 || question.unexpected > 0,
  );
  const visibleQuestions = showAll
    ? answeredQuestions
    : answeredQuestions.slice(0, INITIAL_QUESTION_LIMIT);

  return (
    <DtoPanel className="p-5 sm:p-6">
      <Typography variant="overline">Perguntas mais críticas</Typography>
      <Typography as="h2" variant="cardTitle" className="mt-2">
        Onde o padrão apresenta mais desvios
      </Typography>
      <Typography variant="caption" className="mt-1">
        Ordem: maior quantidade de NOK; em empate, maior taxa de NOK. A taxa é
        NOK / (OK + NOK).
      </Typography>

      {visibleQuestions.length > 0 ? (
        <ol className="mt-5 space-y-3">
          {visibleQuestions.map((question, index) => (
            <li
              key={question.columnKey}
              className="rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--shell-muted)]">
                    {index + 1}º por recorrência de NOK
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold leading-6 text-[var(--shell-text)]">
                    {question.label}
                  </p>
                </div>
                {question.unexpected > 0 ? (
                  <DtoBadge>{question.unexpected} inesperada(s)</DtoBadge>
                ) : null}
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--shell-surface)]">
                <div
                  className="h-full rounded-full bg-[var(--shell-danger)]"
                  style={{ width: `${Math.max(0, Math.min(100, question.nokRate ?? 0))}%` }}
                />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div><dt className="text-[var(--shell-muted)]">OK</dt><dd className="mt-1 font-semibold text-[var(--shell-accent)]">{formatDtoNumber(question.ok)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">NOK</dt><dd className="mt-1 font-semibold text-[var(--shell-danger)]">{formatDtoNumber(question.nok)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">Taxa NOK</dt><dd className="mt-1 font-semibold text-[var(--shell-text)]">{formatDtoPercentage(question.nokRate)}</dd></div>
                <div><dt className="text-[var(--shell-muted)]">Respondido</dt><dd className="mt-1 font-semibold text-[var(--shell-text)]">{formatDtoNumber(question.answered)}</dd></div>
              </dl>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-4 py-8 text-center text-sm leading-6 text-[var(--shell-muted)]">
          {questions.length > 0
            ? "As perguntas avaliativas não possuem respostas OK ou NOK neste recorte."
            : "Nenhuma coluna avaliativa foi identificada com segurança."}
        </div>
      )}

      {answeredQuestions.length > INITIAL_QUESTION_LIMIT ? (
        <div className="mt-4 flex justify-center">
          <DtoButton size="sm" onClick={() => setShowAll((current) => !current)}>
            {showAll ? "Mostrar principais" : `Ver todas (${answeredQuestions.length})`}
          </DtoButton>
        </div>
      ) : null}
    </DtoPanel>
  );
}

