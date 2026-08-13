"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getCollaboratorRecords } from "@/features/dpo/lib/dtoAnalytics";
import { formatDtoDate, formatDtoNumber, formatDtoPercentage, normalizeSearchText } from "@/features/dpo/lib/dtoFormatters";
import type { DtoCollaboratorStat, DtoColumn, DtoFiltersState, DtoRecord } from "@/features/dpo/lib/dtoTypes";
import DtoCollaboratorAnalysisDialog from "@/features/dpo/components/dto/DtoCollaboratorAnalysisDialog";
import { DtoBadge, DtoButton, DtoPanel } from "@/features/dpo/components/dto/DtoPrimitives";
import { Typography } from "@/shared/ui/typography";

const PAGE_SIZE = 8;
type SortMode = "negative" | "adherence" | "applications" | "recent";
type StatusFilter = "all" | "negative" | "recurring";

function periodLabel(filters: DtoFiltersState) {
  if (filters.period === "last30") return "Últimos 30 dias";
  if (filters.period === "last90") return "Últimos 90 dias";
  if (filters.period === "currentYear") return "Ano atual";
  if (filters.period === "custom") return `${filters.startDate || "início"} a ${filters.endDate || "hoje"}`;
  return "Todo o período";
}

export default function DtoCollaborators({
  collaborators,
  columns,
  filters,
  formName,
  records,
}: {
  collaborators: DtoCollaboratorStat[] | null;
  columns: DtoColumn[];
  filters: DtoFiltersState;
  formName: string;
  records: DtoRecord[];
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("negative");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [question, setQuestion] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const questionOptions = useMemo(() => {
    const labels = new Map<string, string>();
    records.forEach((record) => record.answers.forEach((answer) => {
      if (answer.status === "NEGATIVE") labels.set(answer.column_key, answer.label);
    }));
    return [...labels.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [records]);

  const filtered = useMemo(() => {
    if (!collaborators) return null;
    const query = normalizeSearchText(search);
    return collaborators.filter((item) => {
      if (query && !normalizeSearchText(item.name).includes(query)) return false;
      if (status === "negative" && item.negative === 0) return false;
      if (status === "recurring" && item.recurringGaps.length === 0) return false;
      if (question) {
        const individual = getCollaboratorRecords(records, item.name);
        if (!individual.some((record) => record.answers.some((answer) => answer.column_key === question && answer.status === "NEGATIVE"))) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sort === "adherence") return (a.adherence ?? Infinity) - (b.adherence ?? Infinity);
      if (sort === "applications") return b.applications - a.applications;
      if (sort === "recent") return (b.lastApplication?.getTime() ?? -Infinity) - (a.lastApplication?.getTime() ?? -Infinity);
      return b.negative - a.negative;
    });
  }, [collaborators, question, records, search, sort, status]);

  if (filtered === null) return (
    <DtoPanel className="p-5 sm:p-6">
      <Typography variant="overline">Colaboradores</Typography>
      <Typography as="h2" variant="cardTitle" className="mt-2">Campo não identificado</Typography>
      <Typography variant="supportingText" className="mt-3">A análise individual permanece indisponível porque nenhum campo foi associado com segurança ao colaborador.</Typography>
    </DtoPanel>
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const normalizedPage = Math.min(page, totalPages);
  const visible = filtered.slice((normalizedPage - 1) * PAGE_SIZE, normalizedPage * PAGE_SIZE);
  const selectedRecords = selected ? getCollaboratorRecords(records, selected) : [];

  return (
    <DtoPanel className="p-5 sm:p-6">
      <Typography variant="overline">Colaboradores e gaps recorrentes</Typography>
      <Typography as="h2" variant="cardTitle" className="mt-2">Acompanhamento para treinamento e fidelização</Typography>
      <Typography variant="caption" className="mt-1">Recorrência significa a mesma pergunta negativa para o mesmo colaborador em pelo menos duas aplicações distintas.</Typography>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="relative"><span className="sr-only">Buscar colaborador</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-muted)]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar colaborador" className="w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--shell-text)]" /></label>
        <select aria-label="Ordenar colaboradores" value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-2.5 text-sm text-[var(--shell-text)]"><option value="negative">Mais respostas negativas</option><option value="adherence">Menor aderência</option><option value="applications">Mais aplicações</option><option value="recent">Aplicação mais recente</option></select>
        <select aria-label="Filtrar recorrência" value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }} className="rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-2.5 text-sm text-[var(--shell-text)]"><option value="all">Todos</option><option value="negative">Possui resposta negativa</option><option value="recurring">Possui recorrência real</option></select>
        <select aria-label="Filtrar pergunta negativa" value={question} onChange={(event) => { setQuestion(event.target.value); setPage(1); }} className="rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-2.5 text-sm text-[var(--shell-text)]"><option value="">Todas as perguntas negativas</option>{questionOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      </div>

      {visible.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{visible.map((item) => (
        <article key={item.name} className="flex flex-col rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="break-words text-sm font-semibold text-[var(--shell-text)]">{item.name}</h3>{item.recurringGaps.length ? <DtoBadge tone="danger">{item.recurringGaps.length} gap(s) recorrente(s)</DtoBadge> : null}</div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            <div><dt className="text-[var(--shell-muted)]">Aplicações</dt><dd className="mt-1 font-semibold">{formatDtoNumber(item.applications)}</dd></div>
            <div><dt className="text-[var(--shell-muted)]">Negativas</dt><dd className="mt-1 font-semibold text-[var(--shell-danger)]">{formatDtoNumber(item.negative)}</dd></div>
            <div><dt className="text-[var(--shell-muted)]">Aplicações negativas</dt><dd className="mt-1 font-semibold">{formatDtoNumber(item.applicationsWithNegative)}</dd></div>
            <div><dt className="text-[var(--shell-muted)]">Aderência</dt><dd className="mt-1 font-semibold text-[var(--shell-accent)]">{formatDtoPercentage(item.adherence)}</dd></div>
            <div><dt className="text-[var(--shell-muted)]">Última aplicação</dt><dd className="mt-1 font-semibold">{formatDtoDate(item.lastApplication)}</dd></div>
          </dl>
          <DtoButton className="mt-4 self-start" tone="accent" onClick={() => setSelected(item.name)}>Analisar colaborador</DtoButton>
        </article>
      ))}</div> : <div className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] px-4 py-8 text-center text-sm text-[var(--shell-muted)]">Nenhum colaborador corresponde aos filtros da seção.</div>}

      {totalPages > 1 ? <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-[var(--shell-muted)]">Página {normalizedPage} de {totalPages}</span><div className="flex gap-2"><DtoButton size="sm" disabled={normalizedPage <= 1} onClick={() => setPage(normalizedPage - 1)}>Anterior</DtoButton><DtoButton size="sm" disabled={normalizedPage >= totalPages} onClick={() => setPage(normalizedPage + 1)}>Próxima</DtoButton></div></div> : null}

      {selected ? <DtoCollaboratorAnalysisDialog collaborator={selected} columns={columns} formName={formName} onClose={() => setSelected(null)} periodLabel={periodLabel(filters)} records={selectedRecords} /> : null}
    </DtoPanel>
  );
}
