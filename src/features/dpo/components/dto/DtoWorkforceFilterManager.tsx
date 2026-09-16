"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Save, Trash2, UsersRound, X } from "lucide-react";
import DtoEmployeeSelectionDialog from "@/features/dpo/components/dto/DtoEmployeeSelectionDialog";
import { DtoButton, DtoPanel } from "@/features/dpo/components/dto/DtoPrimitives";
import type { WorkforceFilterCatalog, WorkforceTrackingFilter, WorkforceTrackingFilterPayload } from "@/features/dpo/lib/dtoTypes";
import { useFormManagerConfig } from "@/features/dpo/lib/formManagerConfig";
import { Typography } from "@/shared/ui/typography";

const EMPTY_DRAFT: WorkforceTrackingFilterPayload = { name: "", locations: [], functions: [], employee_keys: [], creation_password: "" };

function toggle(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function DtoWorkforceFilterManager() {
  const { api } = useFormManagerConfig();
  const [catalog, setCatalog] = useState<WorkforceFilterCatalog | null>(null);
  const [filters, setFilters] = useState<WorkforceTrackingFilter[]>([]);
  const [draft, setDraft] = useState<WorkforceTrackingFilterPayload>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [nextCatalog, nextFilters] = await Promise.all([api.getWorkforceFilterCatalog(), api.listWorkforceFilters()]);
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
    void Promise.all([api.getWorkforceFilterCatalog(), api.listWorkforceFilters()])
      .then(([nextCatalog, nextFilters]) => {
        if (!active) return;
        setCatalog(nextCatalog);
        setFilters(nextFilters);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar os filtros compartilhados.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api]);

  const availableFunctions = useMemo(() => {
    const counts = new Map<string, number>();
    (catalog?.employees || []).forEach((employee) => {
      const employeeLocation = employee.location || employee.area;
      if (draft.locations.length && (!employeeLocation || !draft.locations.includes(employeeLocation))) return;
      if (employee.function) counts.set(employee.function, (counts.get(employee.function) || 0) + 1);
    });
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right, "pt-BR"));
  }, [catalog?.employees, draft.locations]);

  const selectedEmployees = useMemo(() => {
    const keys = new Set(draft.employee_keys);
    return (catalog?.employees || []).filter((employee) => keys.has(employee.key));
  }, [catalog?.employees, draft.employee_keys]);
  const editing = editingId ? filters.find((filter) => filter.id === editingId) : null;
  const hasScope = Boolean(draft.locations.length || draft.functions.length || draft.employee_keys.length);

  function closeEditor() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setEditorOpen(false);
    setEmployeePickerOpen(false);
    setError(null);
  }

  function create() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  }

  function edit(filter: WorkforceTrackingFilter) {
    setEditingId(filter.id);
    setDraft({ name: filter.name, locations: filter.locations, functions: filter.functions, employee_keys: filter.employee_keys, creation_password: filter.creation_password });
    setEditorOpen(true);
    setError(null);
  }

  function toggleLocation(location: string) {
    setDraft((current) => {
      const locations = toggle(current.locations, location);
      const allowedFunctions = new Set((catalog?.employees || [])
        .filter((employee) => !locations.length || locations.includes(employee.location || employee.area || ""))
        .map((employee) => employee.function)
        .filter((value): value is string => Boolean(value)));
      return { ...current, locations, functions: current.functions.filter((name) => allowedFunctions.has(name)) };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (editingId) await api.updateWorkforceFilter(editingId, draft);
      else await api.createWorkforceFilter(draft);
      closeEditor();
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
      setDeleteId(null);
      setDeletePassword("");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir o filtro.");
    } finally {
      setSaving(false);
    }
  }

  return <DtoPanel className="p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><Typography variant="overline">Filtros públicos de acompanhamento</Typography><Typography as="h2" variant="cardTitle" className="mt-2">Recortes compartilhados</Typography><Typography variant="caption" className="mt-1">Filtros disponíveis em DTO, Blitz e Gabaritos de Segurança.</Typography></div>
      <DtoButton size="sm" tone="accent" onClick={create}><Plus aria-hidden="true" /> Novo filtro</DtoButton>
    </div>

    {loading ? <p className="mt-4 text-sm text-[var(--shell-muted)]">Carregando filtros públicos…</p> : null}
    {!loading ? <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {filters.map((filter) => <div key={filter.id} className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[var(--shell-text)]">{filter.name}</p><p className="mt-1 text-xs text-[var(--shell-muted)]">{filter.locations.length} área(s) · {filter.functions.length} função(ões) · {filter.employee_keys.length} pessoa(s)</p></div><div className="flex shrink-0 gap-1"><button type="button" aria-label={`Editar ${filter.name}`} onClick={() => edit(filter)} className="rounded-lg p-2 text-[var(--shell-muted)] hover:bg-[var(--shell-surface-muted)]"><Pencil className="h-4 w-4" /></button><button type="button" aria-label={`Excluir ${filter.name}`} onClick={() => setDeleteId(filter.id)} className="rounded-lg p-2 text-[var(--shell-danger)] hover:bg-[var(--shell-danger-soft)]"><Trash2 className="h-4 w-4" /></button></div></div></div>)}
      {!filters.length ? <p className="rounded-2xl border border-dashed border-[color:var(--shell-line)] p-4 text-sm text-[var(--shell-muted)]">Nenhum filtro público criado.</p> : null}
    </div> : null}
    {error ? <p role="alert" className="mt-4 text-sm text-[var(--shell-danger)]">{error}</p> : null}

    {editorOpen ? <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label={editing ? `Editar ${editing.name}` : "Criar filtro público"}><DtoPanel className="max-h-[88vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><Typography variant="overline">Filtro público</Typography><Typography as="h2" variant="cardTitle" className="mt-2">{editing ? `Editar ${editing.name}` : "Criar filtro"}</Typography></div><DtoButton size="sm" aria-label="Fechar" onClick={closeEditor}><X aria-hidden="true" /></DtoButton></div>
      <label className="mt-5 block text-xs font-semibold text-[var(--shell-muted)]">Nome do filtro<input value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} placeholder="Ex.: Entrega" className="mt-1.5 w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-2.5 text-sm text-[var(--shell-text)]" /></label>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <fieldset><legend className="text-xs font-semibold text-[var(--shell-muted)]">Áreas da operação</legend><div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-[color:var(--shell-line)] p-2">{(catalog?.locations.length ? catalog.locations : catalog?.areas || []).map((option) => <label key={option.name} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--shell-text)] hover:bg-[var(--shell-surface-muted)]"><input type="checkbox" checked={draft.locations.includes(option.name)} onChange={() => toggleLocation(option.name)} />{option.name} <span className="text-xs text-[var(--shell-muted)]">({option.employees})</span></label>)}</div></fieldset>
        <fieldset><legend className="text-xs font-semibold text-[var(--shell-muted)]">Funções {draft.locations.length ? "das áreas selecionadas" : ""}</legend><div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-[color:var(--shell-line)] p-2">{availableFunctions.map(([name, count]) => <label key={name} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[var(--shell-text)] hover:bg-[var(--shell-surface-muted)]"><input type="checkbox" checked={draft.functions.includes(name)} onChange={() => setDraft((value) => ({ ...value, functions: toggle(value.functions, name) }))} />{name} <span className="text-xs text-[var(--shell-muted)]">({count})</span></label>)}</div></fieldset>
      </div>
      <div className="mt-4 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm font-semibold text-[var(--shell-text)]">Pessoas específicas</p><p className="mt-1 truncate text-xs text-[var(--shell-muted)]">{selectedEmployees.length ? selectedEmployees.map((employee) => employee.name).join(", ") : "Nenhuma pessoa adicionada."}</p></div><DtoButton size="sm" onClick={() => setEmployeePickerOpen(true)}><UsersRound aria-hidden="true" /> Selecionar</DtoButton></div></div>
      <label className="mt-4 block text-xs font-semibold text-[var(--shell-muted)]">Senha de criação<span className="mt-1 block font-normal leading-5">Fica visível para recuperação administrativa e autoriza a exclusão.</span><div className="relative mt-1.5"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-muted)]" /><input value={draft.creation_password} onChange={(event) => setDraft((value) => ({ ...value, creation_password: event.target.value }))} className="w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] py-2.5 pl-9 pr-3 text-sm text-[var(--shell-text)]" /></div></label>
      <div className="mt-5 flex justify-end"><DtoButton tone="accent" disabled={saving || !draft.name.trim() || !hasScope || !draft.creation_password.trim()} onClick={() => void save()}><Save aria-hidden="true" /> {saving ? "Salvando" : "Salvar filtro"}</DtoButton></div>
    </DtoPanel></div> : null}

    <DtoEmployeeSelectionDialog open={employeePickerOpen} eyebrow="Filtro público" title="Selecionar pessoas específicas" description="A lista de funções acompanha a área escolhida." employees={catalog?.employees || []} selectedKeys={draft.employee_keys} onChange={(employee_keys) => setDraft((current) => ({ ...current, employee_keys }))} onClose={() => setEmployeePickerOpen(false)} />
    {deleteId ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Excluir filtro público"><DtoPanel className="w-full max-w-md p-5"><div className="flex items-center justify-between"><p className="font-semibold text-[var(--shell-text)]">Excluir filtro público</p><DtoButton size="sm" onClick={() => setDeleteId(null)}><X /></DtoButton></div><p className="mt-2 text-sm text-[var(--shell-muted)]">Informe a senha de criação para confirmar.</p><input value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} placeholder="Senha de criação" className="mt-4 w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-2.5 text-sm text-[var(--shell-text)]" /><DtoButton className="mt-4 w-full" tone="danger" disabled={saving || !deletePassword.trim()} onClick={() => void remove()}><Trash2 /> Excluir</DtoButton></DtoPanel></div> : null}
  </DtoPanel>;
}
