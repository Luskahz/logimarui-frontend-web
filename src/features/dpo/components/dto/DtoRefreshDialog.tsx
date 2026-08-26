"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CalendarRange, LoaderCircle, RefreshCw, X } from "lucide-react";
import type {
  DtoFormDetail,
  DtoRefreshJob,
  DtoRefreshRequest,
} from "@/features/dpo/lib/dtoTypes";
import { DtoBadge, DtoButton } from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

function toInputDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultPeriod(): DtoRefreshRequest {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate());
  return { start_date: toInputDate(start), end_date: toInputDate(end) };
}

function preset(days: number): DtoRefreshRequest {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return { start_date: toInputDate(start), end_date: toInputDate(end) };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export default function DtoRefreshDialog({
  formName,
  onClose,
  onRefresh,
}: {
  formName: string;
  onClose: () => void;
  onRefresh: (
    period: DtoRefreshRequest,
    onProgress: (job: DtoRefreshJob) => void,
    signal: AbortSignal,
  ) => Promise<DtoFormDetail>;
}) {
  const initial = useMemo(() => defaultPeriod(), []);
  const [startDate, setStartDate] = useState(initial.start_date);
  const [endDate, setEndDate] = useState(initial.end_date);
  const [job, setJob] = useState<DtoRefreshJob | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      controllerRef.current?.abort();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function applyPreset(period: DtoRefreshRequest) {
    setStartDate(period.start_date);
    setEndDate(period.end_date);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startDate || !endDate || endDate < startDate) {
      setError("Informe um período válido; a data final não pode vir antes da inicial.");
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("running");
    setError(null);
    setJob(null);
    try {
      await onRefresh(
        { start_date: startDate, end_date: endDate },
        setJob,
        controller.signal,
      );
      setStatus("completed");
    } catch (refreshError) {
      if (!isAbortError(refreshError)) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Não foi possível atualizar esta DTO.",
        );
        setStatus("error");
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  const running = status === "running";
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[var(--shell-overlay)] p-0 backdrop-blur-sm sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dto-refresh-dialog-title"
        className="w-full rounded-t-[30px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-5 shadow-2xl sm:max-w-xl sm:rounded-[30px] sm:p-6"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Typography variant="overline">Dados do SAVI</Typography>
            <Typography id="dto-refresh-dialog-title" as="h2" variant="sectionTitle" className="mt-2">
              Atualizar período
            </Typography>
            <p className="mt-2 break-words text-sm leading-6 text-[var(--shell-muted)]">
              {formName}. O SAVI gerará um Excel novo e o snapshot anterior só será substituído depois da validação completa.
            </p>
          </div>
          <DtoButton size="icon-sm" aria-label="Fechar atualização" onClick={onClose}>
            <X aria-hidden="true" />
          </DtoButton>
        </header>

        <form className="mt-6" onSubmit={submit}>
          <div className="flex flex-wrap gap-2">
            <DtoButton type="button" size="sm" disabled={running} onClick={() => applyPreset(preset(30))}>
              30 dias
            </DtoButton>
            <DtoButton type="button" size="sm" disabled={running} onClick={() => applyPreset(preset(90))}>
              90 dias
            </DtoButton>
            <DtoButton
              type="button"
              size="sm"
              disabled={running}
              onClick={() => {
                const now = new Date();
                applyPreset({
                  start_date: `${now.getFullYear()}-01-01`,
                  end_date: toInputDate(now),
                });
              }}
            >
              Ano atual
            </DtoButton>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--shell-text)]">
              Data inicial
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 text-sm text-[var(--shell-text)] outline-none focus:border-[color:var(--shell-accent)]"
                type="date"
                value={startDate}
                max={endDate || undefined}
                disabled={running}
                required
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-[var(--shell-text)]">
              Data final
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 text-sm text-[var(--shell-text)] outline-none focus:border-[color:var(--shell-accent)]"
                type="date"
                value={endDate}
                min={startDate || undefined}
                disabled={running}
                required
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          {running ? (
            <div role="status" className="mt-5 rounded-2xl border border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)] p-4 text-sm text-[var(--shell-accent)]">
              <div className="flex items-center gap-3 font-semibold">
                <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
                {job ? "O SAVI está preparando o arquivo..." : "Solicitando a exportação..."}
              </div>
              <p className="mt-2 text-xs leading-5">
                A tela verifica o andamento por no máximo 90 segundos. Fechar este modal interrompe as consultas locais.
              </p>
            </div>
          ) : null}

          {status === "completed" ? (
            <div role="status" className="mt-5 rounded-2xl border border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)] p-4 text-sm text-[var(--shell-accent)]">
              <div className="flex flex-wrap items-center gap-2 font-semibold">
                Dados atualizados.
                {job?.total_records !== null && job?.total_records !== undefined ? (
                  <DtoBadge tone="accent">{job.total_records} aplicações</DtoBadge>
                ) : null}
              </div>
            </div>
          ) : null}

          {error ? (
            <div role="alert" className="mt-5 rounded-2xl border border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)] p-4 text-sm leading-6 text-[var(--shell-danger)]">
              {error}
            </div>
          ) : null}

          <footer className="mt-6 flex flex-wrap justify-end gap-2">
            <DtoButton type="button" onClick={onClose}>
              {status === "completed" ? "Ver análise" : "Fechar"}
            </DtoButton>
            {status !== "completed" ? (
              <DtoButton type="submit" tone="accent" disabled={running} aria-busy={running}>
                {running ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <CalendarRange aria-hidden="true" />}
                {running ? "Aguardando SAVI" : status === "error" ? "Tentar novamente" : "Atualizar dados"}
              </DtoButton>
            ) : (
              <DtoButton type="button" tone="accent" onClick={onClose}>
                <RefreshCw aria-hidden="true" />
                Concluído
              </DtoButton>
            )}
          </footer>
        </form>
      </section>
    </div>
  );
}
