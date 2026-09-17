"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { DtoBadge, DtoButton, DtoPanel } from "@/features/dpo/ui/dto/DtoPrimitives";
import { normalizeSearchText } from "@/features/dpo/lib/dtoFormatters";
import type { WorkforceFilterEmployee } from "@/features/dpo/model/dtoTypes";
import { Typography } from "@/shared/ui/typography";

export interface DtoEmployeeSelectionOption extends WorkforceFilterEmployee {
  supportingText?: string | null;
  badgeLabel?: string | null;
  badgeTone?: "default" | "accent" | "danger";
}

interface Props {
  open: boolean;
  title: string;
  eyebrow?: string;
  description?: string;
  employees: DtoEmployeeSelectionOption[];
  selectedKeys: string[];
  mode?: "single" | "multiple";
  confirmLabel?: string;
  emptyLabel?: string;
  onChange: (keys: string[]) => void;
  onClose: () => void;
}

const fieldClass = "w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-2.5 text-sm text-[var(--shell-text)] outline-none focus:border-[color:var(--shell-accent)]";

export default function DtoEmployeeSelectionDialog({
  open,
  title,
  eyebrow = "Selecionar colaboradores",
  description,
  employees,
  selectedKeys,
  mode = "multiple",
  confirmLabel = "Concluir seleção",
  emptyLabel = "Nenhum colaborador atende aos filtros.",
  onChange,
  onClose,
}: Props) {
  const [area, setArea] = useState("");
  const [employeeFunction, setEmployeeFunction] = useState("");
  const [search, setSearch] = useState("");

  const areas = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach((employee) => {
      const value = employee.area || employee.location;
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    });
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right, "pt-BR"));
  }, [employees]);

  const functions = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach((employee) => {
      const employeeArea = employee.area || employee.location;
      if (area && employeeArea !== area) return;
      if (employee.function) counts.set(employee.function, (counts.get(employee.function) || 0) + 1);
    });
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right, "pt-BR"));
  }, [area, employees]);

  const activeFunction = functions.some(([name]) => name === employeeFunction) ? employeeFunction : "";

  const visibleEmployees = useMemo(() => {
    const query = normalizeSearchText(search);
    return employees.filter((employee) => {
      const employeeArea = employee.area || employee.location;
      return (!area || employeeArea === area)
        && (!activeFunction || employee.function === activeFunction)
        && (!query || normalizeSearchText(`${employee.name} ${employee.function || ""} ${employeeArea || ""}`).includes(query));
    });
  }, [activeFunction, area, employees, search]);

  if (!open) return null;

  function close() {
    setArea("");
    setEmployeeFunction("");
    setSearch("");
    onClose();
  }

  function select(key: string) {
    if (mode === "single") {
      onChange([key]);
      close();
      return;
    }
    onChange(selectedKeys.includes(key)
      ? selectedKeys.filter((selected) => selected !== key)
      : [...selectedKeys, key]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <DtoPanel className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Typography variant="overline">{eyebrow}</Typography>
            <Typography as="h2" variant="cardTitle" className="mt-2">{title}</Typography>
            {description ? <Typography variant="caption" className="mt-1">{description}</Typography> : null}
          </div>
          <DtoButton size="sm" aria-label="Fechar seleção" onClick={close}><X aria-hidden="true" /></DtoButton>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-semibold text-[var(--shell-muted)]">Área
            <select className={`mt-1.5 ${fieldClass}`} value={area} onChange={(event) => { setArea(event.target.value); setEmployeeFunction(""); }}>
              <option value="">Todas as áreas</option>
              {areas.map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[var(--shell-muted)]">Função
            <select className={`mt-1.5 ${fieldClass}`} value={activeFunction} onChange={(event) => setEmployeeFunction(event.target.value)}>
              <option value="">Todas as funções</option>
              {functions.map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}
            </select>
          </label>
          <label className="relative text-xs font-semibold text-[var(--shell-muted)]">Buscar pessoa
            <Search aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-[var(--shell-muted)]" />
            <input className={`mt-1.5 pl-9 ${fieldClass}`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, área ou função" />
          </label>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto rounded-xl border border-[color:var(--shell-line)] p-2">
          {visibleEmployees.map((employee) => {
            const selected = selectedKeys.includes(employee.key);
            const areaLabel = employee.area || employee.location;
            return (
              <label key={employee.key} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--shell-surface-muted)] ${selected ? "bg-[var(--shell-accent-soft)]" : ""}`}>
                <input type={mode === "single" ? "radio" : "checkbox"} name={mode === "single" ? "employee-selection" : undefined} checked={selected} onChange={() => select(employee.key)} className="accent-[var(--shell-accent)]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--shell-text)]">{employee.name}</span>
                  <span className="block truncate text-xs text-[var(--shell-muted)]">{employee.supportingText || [areaLabel, employee.function].filter(Boolean).join(" · ") || "Sem área ou função"}</span>
                </span>
                {employee.badgeLabel ? <DtoBadge tone={employee.badgeTone || "default"}>{employee.badgeLabel}</DtoBadge> : null}
              </label>
            );
          })}
          {visibleEmployees.length === 0 ? <p className="px-3 py-8 text-center text-sm text-[var(--shell-muted)]">{emptyLabel}</p> : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--shell-muted)]">{selectedKeys.length} selecionado(s)</span>
          {mode === "multiple" ? <DtoButton tone="accent" onClick={close}>{confirmLabel}</DtoButton> : null}
        </div>
      </DtoPanel>
    </div>
  );
}
