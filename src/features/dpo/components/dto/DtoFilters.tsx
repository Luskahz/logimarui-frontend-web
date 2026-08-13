"use client";

import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";
import type {
  DtoFiltersState,
  DtoPeriodFilter,
} from "@/features/dpo/lib/dtoTypes";
import {
  DtoButton,
  DtoPanel,
} from "@/features/dpo/components/dto/DtoPrimitives";

const SELECT_CLASS_NAME =
  "h-10 w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 text-sm text-[var(--shell-text)] outline-none transition focus:border-[color:var(--shell-accent)] disabled:cursor-not-allowed disabled:opacity-60";

export default function DtoFilters({
  filteredCount,
  filters,
  hasCollaboratorColumn,
  hasDateColumn,
  hasManagerColumn,
  collaborators,
  managers,
  onReset,
  onUpdate,
  totalCount,
}: {
  filteredCount: number;
  filters: DtoFiltersState;
  hasCollaboratorColumn: boolean;
  hasDateColumn: boolean;
  hasManagerColumn: boolean;
  collaborators: string[];
  managers: string[];
  onReset: () => void;
  onUpdate: <Key extends keyof DtoFiltersState>(
    key: Key,
    value: DtoFiltersState[Key],
  ) => void;
  totalCount: number;
}) {
  return (
    <DtoPanel className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography variant="overline">Filtros da análise</Typography>
          <Typography as="h2" variant="cardTitle" className="mt-2">
            Um recorte para toda a página
          </Typography>
          <Typography variant="caption" className="mt-1">
            {filteredCount} de {totalCount} aplicação(ões) participam de todos os
            indicadores abaixo.
          </Typography>
        </div>
        <DtoButton size="sm" onClick={onReset}>
          <RotateCcw aria-hidden="true" />
          Limpar filtros
        </DtoButton>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold text-[var(--shell-muted)]">Período</span>
          <select
            className={SELECT_CLASS_NAME}
            value={filters.period}
            disabled={!hasDateColumn}
            onChange={(event) =>
              onUpdate("period", event.target.value as DtoPeriodFilter)
            }
          >
            <option value="all">Todo o período</option>
            <option value="last30">Últimos 30 dias</option>
            <option value="last90">Últimos 90 dias</option>
            <option value="currentYear">Ano atual</option>
            <option value="custom">Intervalo personalizado</option>
          </select>
          {!hasDateColumn ? (
            <span className="block text-xs text-[var(--shell-muted)]">Data não identificada neste formulário.</span>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold text-[var(--shell-muted)]">Colaborador</span>
          <select
            className={SELECT_CLASS_NAME}
            value={filters.collaborator}
            disabled={!hasCollaboratorColumn || collaborators.length === 0}
            onChange={(event) => onUpdate("collaborator", event.target.value)}
          >
            <option value="">Todos os colaboradores</option>
            {collaborators.map((collaborator) => (
              <option key={collaborator} value={collaborator}>{collaborator}</option>
            ))}
          </select>
          {!hasCollaboratorColumn ? (
            <span className="block text-xs text-[var(--shell-muted)]">Campo de colaborador não identificado.</span>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold text-[var(--shell-muted)]">Aplicador ou gestor</span>
          <select
            className={SELECT_CLASS_NAME}
            value={filters.manager}
            disabled={!hasManagerColumn || managers.length === 0}
            onChange={(event) => onUpdate("manager", event.target.value)}
          >
            <option value="">Todos os aplicadores</option>
            {managers.map((manager) => (
              <option key={manager} value={manager}>{manager}</option>
            ))}
          </select>
          {!hasManagerColumn ? (
            <span className="block text-xs text-[var(--shell-muted)]">Campo de aplicador não identificado.</span>
          ) : null}
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold text-[var(--shell-muted)]">Busca textual</span>
          <span className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-muted)]"
            />
            <Input
              value={filters.search}
              onChange={(event) => onUpdate("search", event.target.value)}
              placeholder="Pessoa, gestor ou conteúdo"
              className="h-10 rounded-xl border-[color:var(--shell-line)] bg-[var(--shell-surface)] pl-9 text-[var(--shell-text)] shadow-none placeholder:text-[var(--shell-muted)] focus-visible:border-[color:var(--shell-accent)] focus-visible:ring-[var(--shell-accent-soft)]"
            />
          </span>
        </label>
      </div>

      {filters.period === "custom" && hasDateColumn ? (
        <div className="mt-4 grid gap-4 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold text-[var(--shell-muted)]">Data inicial</span>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => onUpdate("startDate", event.target.value)}
              className="h-10 rounded-xl border-[color:var(--shell-line)] bg-[var(--shell-surface)] text-[var(--shell-text)] shadow-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold text-[var(--shell-muted)]">Data final</span>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => onUpdate("endDate", event.target.value)}
              className="h-10 rounded-xl border-[color:var(--shell-line)] bg-[var(--shell-surface)] text-[var(--shell-text)] shadow-none"
            />
          </label>
        </div>
      ) : null}

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
        <input
          type="checkbox"
          checked={filters.onlyNegative}
          onChange={(event) => onUpdate("onlyNegative", event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--shell-accent)]"
        />
        <span>
          <span className="block text-sm font-semibold text-[var(--shell-text)]">Somente aplicações contendo resultado negativo</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--shell-muted)]">Mantém aplicações com ao menos uma resposta parametrizada como negativa.</span>
        </span>
      </label>
    </DtoPanel>
  );
}
