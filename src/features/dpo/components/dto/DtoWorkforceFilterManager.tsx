"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Save, Search, Trash2, UsersRound, X } from "lucide-react";
import { DtoBadge, DtoButton, DtoPanel } from "@/features/dpo/components/dto/DtoPrimitives";
import { normalizeSearchText } from "@/features/dpo/lib/dtoFormatters";
import type {
  WorkforceFilterCatalog,
  WorkforceTrackingFilter,
  WorkforceTrackingFilterPayload,
} from "@/features/dpo/lib/dtoTypes";
import { useFormManagerConfig } from "@/features/dpo/lib/formManagerConfig";
import { Typography } from "@/shared/ui/typography";

const EMPTY_DRAFT: WorkforceTrackingFilterPayload = {
  name: "",
  locations: [],
  functions: [],
  employee_keys: [],
  creation_password: "",
};

function toggle(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export default function DtoWorkforceFilterManager() {
  const { api } = useFormManagerConfig();
  const [catalog, setCatalog] = useState<WorkforceFilterCatalog | null>(null);
  const [filters, setFilters] = useState<WorkforceTrackingFilter[]>([]);
  const [draft, setDraft] = useState<WorkforceTrackingFilterPayload>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [nextCatalog, nextFilters] = await Promise.all([
        api.getWorkforceFilterCatalog(),
        api.listWorkforceFilters(),
      ]);
      setCatalog(nextCatalog);
      setFilters(nextFilters);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar os filtros compartilhados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.getWorkforceFilterCatalog(),
      api.listWorkforceFilters(),
    ]).then(([nextCatalog, nextFilters]) => {
      if (!active) return;
      setCatalog(nextCatalog);
      setFilters(nextFilters);
    }).catch((reason) => {
      if (!active) return;
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar os filtros compartilhados.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [api]);

  const visibleEmployees = useMemo(() => {
    const query = normalizeSearchText(employeeSearch);
    return (catalog?.employees || []).filter((employee) => !query || normalizeSearchText(
      `${employee.name} ${employee.function || ""} ${employee.location || ""}`,
    ).includes(query));
  }, [catalog?.employees, employeeSearch]);

  const editing = editingId ? filters.find((filter) => filter.id === editingId) : null;
  const hasScope = Boolean(draft.locations.length || draft.functions.length || draft.employee_keys.length);

  function resetDraft() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setEmployeeSearch("");
    setDeleteId(null);
    setDeletePassword("");
    setError(null);
  }

  function edit(filter: WorkforceTrackingFilter) {
    setEditingId(filter.id);
    setDraft({
      name: filter.name,
      locations: filter.locations,
      functions: filter.functions,
      employee_keys: filter.employee_keys,
      creation_password: filter.creation_password,
    });
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.updateWorkforceFilter(editingId, draft);
      } else {
        await api.createWorkforceFilter(draft);
      }
      resetDraft();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o filtro.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteId) return;
    setSaving(true);
    setError(null);
    try {
      await api.deleteWorkforceFilter(deleteId, deletePassword);
      resetDraft();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir o filtro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DtoPanel className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography variant="overline">Filtros públicos de acompanhamento</Typography>
          <Typography as="h2" variant="cardTitle" className="mt-2">
            Recortes compartilhados da população
          </Typography>
          <Typography variant="supportingText" className="mt-2 max-w-3xl">
            Crie recortes por <code>local</code>, função ou pessoas específicas. Eles aparecem nas telas de DTO, Blitz e Gabaritos de Segurança para qualquer pessoa autenticada.
          </Typography>
        </div>
        <DtoBadge tone="accent"><UsersRound aria-hidden="true" className="mr-1 h-3.5 w-3.5" />Base única de funcionários</DtoBadge>
      </div>

      {loading ? <p className="mt-5 text-sm text-[var(--shell-muted)]">Carregando filtros públicos…</p> : null}
      {!loading ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-2">
            {filters.length ? filters.map((filter) => (
              <div key={filter.id} className={`rounded-2xl border p-4 ${editingId === filter.id ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]" : "border-[color:var(--shell-line)] bg-[var(--shell-surface)]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--shell-text)]">{filter.name}</p>
                    <p className="mt-1 text-xs text-[var(--shell-muted)]">
                      {filter.locations.length} local(is) · {filter.functions.length} função(ões) · {filter.employee_keys.length} pessoa(s) direta(s)
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" aria-label={`Editar ${filter.name}`} onClick={() => edit(filter)} className="rounded-lg p-2 text-[var(--shell-muted)] hover:bg-[var(--shell-surface-muted)] hover:text-[var(--shell-text)]"><Pencil aria-hidden="true" className="h-4 w-4" /></button>
                    <button type="button" aria-label={`Excluir ${filter.name}`} onClick={() => { setDeleteId(filter.id); setDeletePassword(""); }} className="rounded-lg p-2 text-[var(--shell-danger)] hover:bg-[var(--shell-danger-soft)]"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            )) : (
              <p className="rounded-2xl border border-dashed border-[color:var(--shell-line)] p-4 text-sm text-[var(--shell-muted)]">Nenhum filtro público criado.</p>
            )}
          </div>

          <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-[var(--shell-text)]">{editing ? `Editar ${editing.name}` : "Criar filtro público"}</p>
              {editing ? <DtoButton size="sm" onClick={resetDraft}><X aria-hidden="true" /> Cancelar</DtoButton> : <Plus aria-hidden="true" className="h-4 w-4 text-[var(--shell-accent)]" />}
            </div>
            <label className="mt-4 block text-xs font-semibold text-[var(--shell-muted)]">Nome do filtro
              <input value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} placeholder="Ex.: Entrega" className="mt-1.5 w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-2.5 text-sm text-[var(--shell-text)]" />
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <fieldset><legend className="text-xs font-semibold text-[var(--shell-muted)]">Locais da operação</legend><div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
                {(catalog?.locations || []).map((option) => <label key={option.name} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--shell-text)] hover:bg-[var(--shell-surface-muted)]"><input type="checkbox" checked={draft.locations.includes(option.name)} onChange={() => setDraft((value) => ({ ...value, locations: toggle(value.locations, option.name) }))} className="accent-[var(--shell-accent)]" />{option.name} <span className="text-xs text-[var(--shell-muted)]">({option.employees})</span></label>)}
              </div></fieldset>
              <fieldset><legend className="text-xs font-semibold text-[var(--shell-muted)]">Cargos / funções</legend><div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
                {(catalog?.functions || []).map((option) => <label key={option.name} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--shell-text)] hover:bg-[var(--shell-surface-muted)]"><input type="checkbox" checked={draft.functions.includes(option.name)} onChange={() => setDraft((value) => ({ ...value, functions: toggle(value.functions, option.name) }))} className="accent-[var(--shell-accent)]" />{option.name} <span className="text-xs text-[var(--shell-muted)]">({option.employees})</span></label>)}
              </div></fieldset>
            </div>

            <div className="mt-4"><label className="relative block text-xs font-semibold text-[var(--shell-muted)]">Pessoas específicas
              <Search aria-hidden="true" className="absolute bottom-3 left-3 h-4 w-4 text-[var(--shell-muted)]" />
              <input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Buscar nome, função ou local" className="mt-1.5 w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] py-2.5 pl-9 pr-3 text-sm text-[var(--shell-text)]" />
            </label><div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
              {visibleEmployees.map((employee) => <label key={employee.key} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--shell-text)] hover:bg-[var(--shell-surface-muted)]"><input type="checkbox" checked={draft.employee_keys.includes(employee.key)} onChange={() => setDraft((value) => ({ ...value, employee_keys: toggle(value.employee_keys, employee.key) }))} className="mt-1 accent-[var(--shell-accent)]" /><span>{employee.name}<small className="ml-1 text-xs text-[var(--shell-muted)]">{[employee.function, employee.location].filter(Boolean).join(" · ")}</small></span></label>)}
            </div></div>

            <label className="mt-4 block text-xs font-semibold text-[var(--shell-muted)]">Senha de criação
              <span className="mt-1 block font-normal leading-5">Fica visível nesta gestão para recuperação administrativa; apenas ela autoriza excluir o filtro.</span>
              <div className="relative mt-1.5"><KeyRound aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-muted)]" /><input value={draft.creation_password} onChange={(event) => setDraft((value) => ({ ...value, creation_password: event.target.value }))} className="w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] py-2.5 pl-9 pr-3 text-sm text-[var(--shell-text)]" /></div>
            </label>
            <div className="mt-5 flex justify-end gap-2"><DtoButton tone="accent" disabled={saving || !draft.name.trim() || !hasScope || !draft.creation_password.trim()} onClick={() => void save()}><Save aria-hidden="true" />{saving ? "Salvando" : editing ? "Salvar filtro" : "Criar filtro"}</DtoButton></div>
          </div>
        </div>
      ) : null}

      {deleteId ? <div className="mt-4 rounded-2xl border border-[color:var(--shell-danger)] bg-[var(--shell-danger-soft)] p-4"><p className="font-semibold text-[var(--shell-text)]">Excluir filtro público</p><p className="mt-1 text-sm text-[var(--shell-muted)]">Informe a senha de criação para confirmar a exclusão.</p><div className="mt-3 flex flex-wrap gap-2"><input value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} placeholder="Senha de criação" className="min-w-52 flex-1 rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-2 text-sm text-[var(--shell-text)]" /><DtoButton tone="danger" disabled={saving || !deletePassword.trim()} onClick={() => void remove()}><Trash2 aria-hidden="true" /> Excluir</DtoButton><DtoButton disabled={saving} onClick={() => { setDeleteId(null); setDeletePassword(""); }}>Cancelar</DtoButton></div></div> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-[var(--shell-danger)]">{error}</p> : null}
    </DtoPanel>
  );
}
