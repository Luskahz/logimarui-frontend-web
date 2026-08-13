"use client";

import { Clock3, RefreshCw } from "lucide-react";
import { Typography } from "@/shared/ui/typography";
import { formatDtoDateTime } from "@/features/dpo/lib/dtoFormatters";
import {
  DtoBadge,
  DtoButton,
  DtoPanel,
} from "@/features/dpo/components/dto/DtoPrimitives";

export default function DtoManagerHeader({
  cached,
  lastUpdatedAt,
  onRefresh,
  refreshCompletedAt,
  refreshError,
  refreshing,
}: {
  cached: boolean;
  lastUpdatedAt: string | null;
  onRefresh: () => Promise<unknown>;
  refreshCompletedAt: string | null;
  refreshError: string | null;
  refreshing: boolean;
}) {
  return (
    <DtoPanel className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-3xl">
          <Typography variant="eyebrow">Gestão DPO</Typography>
          <Typography as="h1" variant="pageTitle" className="mt-3">
            Gerenciador de DTOs
          </Typography>
          <Typography variant="description" className="mt-3">
            Análise gerencial das aplicações de Diagnóstico Operacional do
            Trabalho, com foco em aderência, recorrências e oportunidades de
            atuação sobre os pontos NOK.
          </Typography>
        </div>

        <div className="flex min-w-0 flex-col items-start gap-3 sm:items-end">
          <DtoButton
            tone="accent"
            disabled={refreshing}
            aria-busy={refreshing}
            onClick={() => void onRefresh()}
          >
            <RefreshCw
              aria-hidden="true"
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Atualizando" : "Atualizar"}
          </DtoButton>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--shell-muted)] sm:justify-end">
            <Clock3 aria-hidden="true" className="h-4 w-4" />
            <span>
              Última atualização: {lastUpdatedAt ? formatDtoDateTime(lastUpdatedAt) : "aguardando dados"}
            </span>
            {cached ? <DtoBadge>Cache do serviço</DtoBadge> : null}
          </div>
        </div>
      </div>

      {refreshError ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)] px-4 py-3 text-sm leading-6 text-[var(--shell-danger)]"
        >
          A atualização falhou. Os últimos dados válidos continuam visíveis. {refreshError}
        </div>
      ) : refreshCompletedAt && !refreshing ? (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)] px-4 py-3 text-sm text-[var(--shell-accent)]"
        >
          Atualização concluída em {formatDtoDateTime(refreshCompletedAt)}.
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {refreshing
          ? "Atualização das DTOs em andamento."
          : refreshCompletedAt
            ? `Atualização concluída em ${formatDtoDateTime(refreshCompletedAt)}.`
            : ""}
      </p>
    </DtoPanel>
  );
}
