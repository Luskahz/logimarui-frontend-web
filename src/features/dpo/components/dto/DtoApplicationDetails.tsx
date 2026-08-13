import type {
  DtoAnswerSemantic,
  DtoColumn,
  DtoRecord,
} from "@/features/dpo/lib/dtoTypes";
import { formatDtoValue } from "@/features/dpo/lib/dtoFormatters";
import { DtoBadge } from "@/features/dpo/components/dto/DtoPrimitives";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<DtoAnswerSemantic, string> = {
  POSITIVE: "Positiva",
  NEGATIVE: "Negativa",
  IGNORED: "Desconsiderada",
  BLANK: "Em branco",
  UNMAPPED: "Não parametrizada",
};

function AnswerStatusBadge({ status }: { status: DtoAnswerSemantic }) {
  if (status === "POSITIVE") {
    return <DtoBadge tone="accent">Positiva</DtoBadge>;
  }
  if (status === "NEGATIVE") {
    return <DtoBadge tone="danger">Negativa</DtoBadge>;
  }
  return <DtoBadge>{STATUS_LABELS[status]}</DtoBadge>;
}

export default function DtoApplicationDetails({
  columns,
  record,
}: {
  columns: DtoColumn[];
  record: DtoRecord;
}) {
  const metadataColumns = columns.filter(
    (column) => column.role !== "EVALUATION" && column.role !== "IGNORE",
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-[20px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
        <h4 className="text-sm font-semibold text-[var(--shell-text)]">
          Metadados disponíveis
        </h4>
        {metadataColumns.length > 0 ? (
          <dl className="mt-3 space-y-2">
            {metadataColumns.map((column) => (
              <div
                key={column.key}
                className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-2.5"
              >
                <dt className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--shell-muted)]">
                  <span className="break-words">{column.label}</span>
                  {column.role === "CONTEXT" ? <DtoBadge>Contexto</DtoBadge> : null}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-[var(--shell-text)]">
                  {formatDtoValue(record.values?.[column.key])}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[var(--shell-muted)]">
            Nenhum metadado adicional foi retornado nesta aplicação.
          </p>
        )}
      </section>

      <section className="rounded-[20px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
        <h4 className="text-sm font-semibold text-[var(--shell-text)]">
          Respostas avaliativas
        </h4>
        {record.answers?.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {record.answers.map((answer) => (
              <li
                key={answer.column_key}
                className={cn(
                  "rounded-2xl border bg-[var(--shell-surface)] px-3 py-3",
                  answer.status === "NEGATIVE"
                    ? "border-[color:var(--shell-danger)]"
                    : "border-[color:var(--shell-line)]",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 break-words text-sm leading-6 text-[var(--shell-text)]">
                    {answer.label}
                  </p>
                  <AnswerStatusBadge status={answer.status} />
                </div>
                <p className="mt-2 break-words text-xs text-[var(--shell-muted)]">
                  Valor original: {formatDtoValue(answer.raw_value)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[var(--shell-muted)]">
            Nenhuma pergunta avaliativa foi identificada nesta aplicação.
          </p>
        )}
      </section>
    </div>
  );
}
