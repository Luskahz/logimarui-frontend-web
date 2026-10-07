"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { RefreshCw } from "lucide-react";
import { journeyApi } from "../api/journeyApi";
import { filterMapGroups, formatDateTime, groupByMap, hasLiveRows, shouldPollJourney,
  type LiveScope } from "../lib/journeyPresentation";
import type { Indicator, JourneyItem, JourneyQuery, PeriodResponse } from "../model/types";
import { JourneyMapDialog, JourneyMapRow } from "./JourneyMapRow";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const tabs: { id: Indicator; label: string; description: string }[] = [
  { id: "tml", label: "TML", description: "Tempo de matinal e liberação" },
  { id: "tr", label: "TR", description: "Tempo de rota do mapa" },
  { id: "ti", label: "TI", description: "Tempo interno, PFIS e PFIN" },
  { id: "jl", label: "JL", description: "Jornada operacional ou laboral" },
];

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const initialQuery = (): JourneyQuery => ({
  indicator: "tml", from: localDate(), to: localDate(), mode: "ponto",
  map: "", employeeCode: "", role: "all", expurge: "all",
});

function selectorClass() {
  return "h-9 w-full rounded-md border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-2 text-sm text-[var(--shell-text)] focus-visible:outline-2 focus-visible:outline-[var(--shell-accent)]";
}

export default function JourneyManager() {
  const [draft, setDraft] = useState<JourneyQuery>(initialQuery);
  const [query, setQuery] = useState<JourneyQuery>(draft);
  const [data, setData] = useState<PeriodResponse<JourneyItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [scope, setScope] = useState<LiveScope>("all");
  const [selectedMapKey, setSelectedMapKey] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const requestRef = useRef<AbortController | null>(null);
  const lastSuccessRef = useRef(0);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(clock);
  }, []);

  const loadSnapshot = useCallback(async (requestedQuery: JourneyQuery, silent: boolean) => {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await journeyApi.get(requestedQuery, controller.signal);
      if (controller.signal.aborted) return;
      setData(response);
      setError(null);
      setRefreshNotice(null);
      lastSuccessRef.current = Date.now();
    } catch (failure) {
      if (controller.signal.aborted || failure instanceof Error && failure.name === "AbortError") return;
      const message = failure instanceof Error ? failure.message : "Não foi possível carregar a Jornada.";
      if (silent) setRefreshNotice(`Atualização não concluída: ${message}`);
      else setError(message);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    requestRef.current?.abort();
    requestRef.current = null;
    queueMicrotask(() => { if (active) void loadSnapshot(query, false); });
    return () => {
      active = false;
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [query, loadSnapshot]);

  const groups = useMemo(() => groupByMap(data?.items ?? []), [data]);
  const today = localDate();
  const visibleGroups = useMemo(() => filterMapGroups(groups, scope, today), [groups, scope, today]);
  const selectedGroup = visibleGroups.find((group) => group.key === selectedMapKey);
  const visibleItems = useMemo(() => visibleGroups.flatMap((group) => group.items), [visibleGroups]);
  const live = hasLiveRows(visibleItems, query.indicator);
  const hasExplicitLiveOrigin = groups.some((group) => group.mapOrigin === "LIVE");
  const selectedTab = tabs.find((tab) => tab.id === query.indicator) ?? tabs[0];

  useEffect(() => {
    if (!live) return;
    const tick = () => {
      if (!requestRef.current && shouldPollJourney(visibleItems, query.indicator, document.visibilityState)) {
        setRefreshing(true);
        void loadSnapshot(query, true);
      }
    };
    const interval = window.setInterval(tick, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastSuccessRef.current >= 60_000) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [live, visibleItems, query, loadSnapshot]);

  function setField<K extends keyof JourneyQuery>(key: K, value: JourneyQuery[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function startLoad() {
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(true);
    setRefreshing(false);
    setError(null);
    setData(null);
    setRefreshNotice(null);
    setScope("all");
    setSelectedMapKey(null);
  }

  function reload() {
    if (requestRef.current) return;
    if (!data) { setLoading(true); setError(null); }
    else setRefreshing(true);
    void loadSnapshot(query, data !== null);
  }

  function selectTab(tab: Indicator) {
    if (tab === query.indicator) return;
    startLoad();
    setDraft((current) => ({ ...current, indicator: tab }));
    setQuery((current) => ({ ...current, indicator: tab }));
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
      (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(tabs[next].id);
    document.getElementById(`journey-tab-${tabs[next].id}`)?.focus();
  }

  return <main className="space-y-5 text-[var(--shell-text)]">
    <header className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">DPO · Entrega · Bloco 1.0</p>
      <h1 className="mt-2 font-serif text-3xl">Gerenciador de Jornada</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--shell-muted)]">Acompanhe os indicadores oficiais por mapa e equipe. O período permite consultar dias anteriores sem alterar o cálculo das procedures.</p>
    </header>

    <div role="tablist" aria-label="Indicadores de Jornada" className="flex flex-wrap gap-2">
      {tabs.map((tab, index) => <button key={tab.id} id={`journey-tab-${tab.id}`}
        type="button" role="tab" aria-selected={query.indicator === tab.id}
        aria-controls="journey-panel" tabIndex={query.indicator === tab.id ? 0 : -1}
        onClick={() => selectTab(tab.id)} onKeyDown={(event) => onTabKey(event, index)}
        className={`rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shell-accent)] ${query.indicator === tab.id ? "bg-[var(--shell-accent)] text-white" : "border border-[color:var(--shell-line)] bg-[var(--shell-surface)]"}`}>
        {tab.label}</button>)}
    </div>

    <section role="tabpanel" id="journey-panel" aria-labelledby={`journey-tab-${query.indicator}`} className="space-y-5">
      <div className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-semibold">{selectedTab.label}</h2><p className="text-sm text-[var(--shell-muted)]">{selectedTab.description}</p></div>
          <Button type="button" variant="outline" onClick={reload} disabled={loading || refreshing} aria-label="Atualizar dados da Jornada"><RefreshCw /> {refreshing ? "Atualizando" : "Atualizar"}</Button>
        </div>
        <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => {
          event.preventDefault();
          if (draft.to < draft.from) { setError("A data final deve ser igual ou posterior à inicial."); return; }
          startLoad();
          setQuery({ ...draft, indicator: query.indicator });
        }}>
          <label className="text-sm">De <Input type="date" required value={draft.from} onChange={(event) => setField("from", event.target.value)} /></label>
          <label className="text-sm">Até <Input type="date" required value={draft.to} onChange={(event) => setField("to", event.target.value)} /></label>
          {query.indicator !== "tr" && <label className="text-sm">Modo
            <select className={selectorClass()} value={draft.mode} onChange={(event) => setField("mode", event.target.value as JourneyQuery["mode"])}>
              <option value="ponto">Ponto {query.indicator === "jl" ? "· jornada laboral" : ""}</option>
              <option value="mpd">MPD {query.indicator === "jl" ? "· jornada operacional" : ""}</option>
            </select></label>}
          <label className="text-sm">Mapa <Input type="number" min="1" inputMode="numeric" placeholder="Todos" value={draft.map} onChange={(event) => setField("map", event.target.value)} /></label>
          <label className="text-sm">Colaborador <Input type="number" min="1" inputMode="numeric" placeholder="Todos" value={draft.employeeCode} onChange={(event) => setField("employeeCode", event.target.value)} /></label>
          <label className="text-sm">Função <select className={selectorClass()} value={draft.role} onChange={(event) => setField("role", event.target.value as JourneyQuery["role"])}>
            <option value="all">Todos</option><option value="motorista">Motoristas</option><option value="ajudante">Ajudantes</option>
          </select></label>
          <label className="text-sm">Expurgo <select className={selectorClass()} value={draft.expurge} onChange={(event) => setField("expurge", event.target.value as JourneyQuery["expurge"])}>
            <option value="all">Todos</option><option value="not_expurged">Não expurgados</option><option value="expurged">Expurgados</option>
          </select></label>
          <div className="flex items-end"><Button type="submit" className="w-full">Aplicar filtros</Button></div>
        </form>
        {data && (hasExplicitLiveOrigin || scope !== "all") && <label className="mt-4 block max-w-sm text-sm">Recorte dos mapas carregados
          <select className={selectorClass()} value={scope} onChange={(event) => setScope(event.target.value as LiveScope)}>
            <option value="all">Todos os mapas</option>
            <option value="d0">D0 · LIVE de hoje no período</option>
            <option value="earlier">Pendentes anteriores · LIVE no período</option>
          </select>
        </label>}
      </div>

      {loading && <p role="status" className="rounded-2xl border border-[color:var(--shell-line)] p-6">Carregando dados de Jornada…</p>}
      {error && <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm"><p>{error}</p><Button type="button" variant="outline" className="mt-3" onClick={reload}>Tentar novamente</Button></div>}
      {refreshNotice && data && <p role="status" className="text-xs text-amber-700 dark:text-amber-200">{refreshNotice} Os dados anteriores continuam visíveis.</p>}
      {!loading && !error && data && <>
        <div role="status" className="flex flex-wrap justify-between gap-2 text-sm text-[var(--shell-muted)]">
          <span>{visibleGroups.length} mapa{visibleGroups.length === 1 ? "" : "s"} · {visibleItems.length} linha{visibleItems.length === 1 ? "" : "s"} de equipe</span>
          <span>{refreshing ? "Atualizando snapshot… · " : ""}Snapshot: {formatDateTime(data.snapshotAt)}</span>
        </div>
        {visibleGroups.length === 0 ? <p className="rounded-2xl border border-dashed border-[color:var(--shell-line)] p-8 text-center text-sm">Nenhum mapa encontrado no período e filtros selecionados.</p> :
          <div className="space-y-3">{visibleGroups.map((group) =>
            <JourneyMapRow key={group.key} group={group} indicator={query.indicator} now={now}
              onOpen={() => setSelectedMapKey(group.key)} />)}</div>}
      </>}
      {selectedGroup && <JourneyMapDialog key={`${query.indicator}:${selectedGroup.key}`}
        group={selectedGroup} indicator={query.indicator} now={now}
        onClose={() => setSelectedMapKey(null)} />}
    </section>
  </main>;
}
