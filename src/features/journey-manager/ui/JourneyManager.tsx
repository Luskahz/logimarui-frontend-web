"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { RefreshCw } from "lucide-react";
import { journeyApi } from "../api/journeyApi";
import { formatDateTime, formatDuration, groupByMap, mapTrFact } from "../lib/journeyPresentation";
import type { Indicator, JourneyItem, JourneyQuery, PeriodResponse, TrItem } from "../model/types";
import { JourneyDetails } from "./JourneyDetails";
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
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<PeriodResponse<JourneyItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    journeyApi.get(query, controller.signal).then((response) => {
      if (!controller.signal.aborted) setData(response);
    }).catch((failure: unknown) => {
      if (failure instanceof Error && failure.name === "AbortError") return;
      setError(failure instanceof Error ? failure.message : "Não foi possível carregar a Jornada.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, refresh]);

  const groups = useMemo(() => groupByMap(data?.items ?? []), [data]);
  const selectedTab = tabs.find((tab) => tab.id === query.indicator) ?? tabs[0];

  function setField<K extends keyof JourneyQuery>(key: K, value: JourneyQuery[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function startLoad() {
    setLoading(true);
    setError(null);
    setData(null);
  }

  function reload() {
    startLoad();
    setRefresh((value) => value + 1);
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
          <Button type="button" variant="outline" onClick={reload} aria-label="Atualizar dados da Jornada"><RefreshCw /> Atualizar</Button>
        </div>
        <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => {
          event.preventDefault();
          if (draft.to < draft.from) { setError("A data final deve ser igual ou posterior à inicial."); return; }
          startLoad();
          setQuery({ ...draft, indicator: query.indicator });
          setRefresh((value) => value + 1);
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
      </div>

      {loading && <p role="status" className="rounded-2xl border border-[color:var(--shell-line)] p-6">Carregando dados de Jornada…</p>}
      {error && <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm"><p>{error}</p><Button type="button" variant="outline" className="mt-3" onClick={reload}>Tentar novamente</Button></div>}
      {!loading && !error && data && <>
        <div role="status" className="flex flex-wrap justify-between gap-2 text-sm text-[var(--shell-muted)]">
          <span>{groups.length} mapa{groups.length === 1 ? "" : "s"} · {data.items.length} linha{data.items.length === 1 ? "" : "s"} de equipe</span>
          <span>Snapshot: {formatDateTime(data.snapshotAt)}</span>
        </div>
        {groups.length === 0 ? <p className="rounded-2xl border border-dashed border-[color:var(--shell-line)] p-8 text-center text-sm">Nenhum mapa encontrado no período e filtros selecionados.</p> :
          <div className="space-y-3">{groups.map((group) => <details key={group.key} className="group rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4 open:shadow-sm">
            <summary className="cursor-pointer list-none rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--shell-accent)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="text-lg font-semibold">Mapa {group.map ?? "não informado"}</h3>
                  <p className="text-sm text-[var(--shell-muted)]">{group.date} · {group.mapOrigin ?? "origem não informada"} · {group.items.length} integrante{group.items.length === 1 ? "" : "s"}</p></div>
                <span className="text-sm text-[var(--shell-accent)]">Abrir detalhes</span>
              </div>
            </summary>
            <div className="mt-4 border-t border-[color:var(--shell-line)] pt-4">
              {query.indicator === "tr" ? <TrMap group={group} now={now} /> :
                <div className="space-y-3">{group.items.map((item, index) => <details key={`${item.context.employeeCode ?? "unknown"}:${item.context.role ?? "unknown"}:${index}`} className="rounded-2xl border border-[color:var(--shell-line)] p-3">
                  <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-[var(--shell-accent)]">{item.context.employeeName ?? `Colaborador ${item.context.employeeCode ?? "não informado"}`} · {item.context.role ?? "função não informada"}</summary>
                  <div className="mt-3"><JourneyDetails indicator={query.indicator} item={item} now={now} /></div>
                </details>)}</div>}
            </div>
          </details>)}</div>}
      </>}
    </section>
  </main>;
}

function TrMap({ group, now }: { group: ReturnType<typeof groupByMap<JourneyItem>>[number]; now: number }) {
  const fact = mapTrFact(group as ReturnType<typeof groupByMap<TrItem>>[number]);
  if (!fact) return null;
  return <div className="space-y-4">
    <div><p className="text-sm font-semibold">Equipe associada</p>
      <ul className="mt-2 flex flex-wrap gap-2">{group.items.map((item, index) => <li key={`${item.context.employeeCode ?? "unknown"}:${index}`}
        className="rounded-full border border-[color:var(--shell-line)] px-3 py-1 text-sm">
        {item.context.employeeName ?? `#${item.context.employeeCode ?? "?"}`} · {item.context.role ?? "função não informada"}
        {item.expurge.present ? " · expurgado" : ""}
      </li>)}</ul></div>
    <JourneyDetails indicator="tr" item={fact} now={now} />
    <p className="text-xs text-[var(--shell-muted)]">Duração oficial: {formatDuration(fact.tr.seconds)}.</p>
  </div>;
}
