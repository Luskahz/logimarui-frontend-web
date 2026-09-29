import type { ReactNode } from "react";
import type { Checklist, Indicator, IndicatorResult, JlItem, JourneyItem, TiItem, TmlItem, TrItem } from "../model/types";
import { checklistPending, formatDateTime, formatDuration, liveSeconds, outcomeLabel, statusLabel, statusTone } from "../lib/journeyPresentation";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-[var(--shell-muted)]">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-[var(--shell-text)]">{children}</dd></div>;
}

export function StatusBadge({ value }: { value: string | null }) {
  const tone = statusTone(value);
  const style = tone === "live" ? "border-sky-500/30 bg-sky-500/10" :
    tone === "positive" ? "border-emerald-500/30 bg-emerald-500/10" :
    tone === "warning" ? "border-amber-500/30 bg-amber-500/10" :
    "border-[color:var(--shell-line)] bg-[var(--shell-surface)]";
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}>{statusLabel(value)}</span>;
}

function Metric({ label, value, snapshotAt, now }: {
  label: string; value: IndicatorResult; snapshotAt: string | null; now: number;
}) {
  const visualSeconds = liveSeconds(value, snapshotAt, now);
  return <section className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-3">
    <h5 className="font-semibold text-[var(--shell-text)]">{label}</h5>
    <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Field label="Duração">{formatDuration(visualSeconds)}{value.lifecycleStatus === "EM_ANDAMENTO" && visualSeconds !== null ? " · ao vivo" : ""}</Field>
      <Field label="Meta">{formatDuration(value.targetSeconds)}</Field>
      <Field label="Ciclo"><StatusBadge value={value.lifecycleStatus} /></Field>
      <Field label="Meta · último snapshot"><StatusBadge value={value.targetStatus} /></Field>
      <Field label="Atingimento">{outcomeLabel(value.achieved)}</Field>
      <Field label="Diferença">{formatDuration(value.secondsDifference)}</Field>
    </dl>
    {value.temporalOrderAnomaly && <p className="mt-3 text-sm font-semibold text-amber-700 dark:text-amber-200">Anomalia na ordem temporal</p>}
  </section>;
}

function ChecklistFields({ label, value }: { label: string; value: Checklist | null }) {
  return <section className="rounded-xl border border-[color:var(--shell-line)] p-3">
    <h5 className="font-semibold">{label}</h5>
    {checklistPending(value) ?
      <p className="mt-2 text-sm text-[var(--shell-muted)]">Pendente/ausente. O TML permanece conforme retornado pela API.</p> :
      <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Registros">{value.count}</Field>
        <Field label="Tempo total">{formatDuration(value.totalSeconds)}</Field>
        <Field label="Tempo efetivo">{formatDuration(value.effectiveSeconds)}</Field>
        <Field label="Início efetivo">{formatDateTime(value.effectiveStartedAt)}</Field>
        <Field label="Fim efetivo">{formatDateTime(value.effectiveEndedAt)}</Field>
        <Field label="Aderente">{value.adherent === null ? "—" : value.adherent ? "Sim" : "Não"}</Field>
      </dl>}
  </section>;
}

export function ExpurgeContext({ item }: { item: JourneyItem }) {
  const { expurge } = item;
  return <div className="rounded-xl border border-[color:var(--shell-line)] p-3 text-sm">
    <p className="font-semibold">Expurgo: {expurge.present === null ? "não informado" : expurge.present ? "sim" : "não"}</p>
    {expurge.present && <p className="mt-1 text-[var(--shell-muted)]">{[expurge.types, expurge.reasons, expurge.observations].filter(Boolean).join(" · ") || "Sem detalhe informado"}</p>}
    {expurge.flags?.recharge && <p className="mt-1">Recarga sinalizada</p>}
    {expurge.flags?.stoppedMap && <p className="mt-1">Mapa parado sinalizado</p>}
  </div>;
}

export function JourneyDetails({ indicator, item, now, showExpurge = true }: {
  indicator: Indicator; item: JourneyItem; now: number; showExpurge?: boolean;
}) {
  return <div className="space-y-3">
    {indicator === "tml" && (() => { const row = item as TmlItem; return <>
      <Metric label="TML" value={row.tml} snapshotAt={row.snapshotAt} now={now} />
      <h5 className="text-sm font-semibold">Marcos e contexto</h5>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Início">{formatDateTime(row.startedAt)}</Field>
        <Field label="Entrada">{formatDateTime(row.entryAt)}</Field>
        <Field label="Matinal">{formatDateTime(row.morningAt)}</Field>
        <Field label="Saída do mapa">{formatDateTime(row.mapDepartureAt)}</Field>
        <Field label="Fim">{formatDateTime(row.endedAt)}</Field>
        <Field label="Origem do ponto">{row.pointOrigin ?? "—"}</Field>
        <Field label="Checklists totais">{formatDuration(row.totalChecklistSeconds)}</Field>
      </dl>
      <div className="grid gap-3 md:grid-cols-2"><ChecklistFields label="Checklist de carga" value={row.loadChecklist} />
        <ChecklistFields label="Checklist de manutenção" value={row.maintenanceChecklist} /></div>
    </>; })()}
    {indicator === "tr" && (() => { const row = item as TrItem; return <>
      <Metric label="TR do mapa" value={row.tr} snapshotAt={row.snapshotAt} now={now} />
      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-xl border border-[color:var(--shell-line)] p-3"><h5 className="font-semibold">Timeline</h5>
          <dl className="mt-3 grid grid-cols-2 gap-3"><Field label="Saída">{formatDateTime(row.mapDepartureAt)}</Field>
            <Field label="Retorno">{formatDateTime(row.mapReturnAt)}</Field></dl></section>
        <section className="rounded-xl border border-[color:var(--shell-line)] p-3"><h5 className="font-semibold">Planejamento</h5>
          <dl className="mt-3 grid grid-cols-2 gap-3"><Field label="Tempo previsto">{formatDuration(row.plannedSeconds)}</Field>
            <Field label="Dispersão">{row.dispersion ?? "—"}</Field></dl></section>
      </div>
    </>; })()}
    {indicator === "ti" && (() => { const row = item as TiItem; return <>
      <div className="grid gap-3 lg:grid-cols-3">
        <Metric label="PFIS" value={row.physicalClose} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="PFIN" value={row.financialClose} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="TI" value={row.ti} snapshotAt={row.snapshotAt} now={now} />
      </div>
      <div className="rounded-xl border border-[color:var(--shell-line)] p-3">
        <p className="text-sm font-semibold">Etapa atual: {statusLabel(row.operationalStage)}</p>
        <ol className="mt-3 grid gap-3 sm:grid-cols-4">
          {[["Entrada do veículo / retorno", row.vehicleEntryAt], ["PFIS", row.physicalCloseAt],
            ["PFIN", row.financialCloseAt], ["Ponto final", row.pointExitAt]].map(([label, time], index) =>
            <li key={label} className="rounded-lg bg-[var(--shell-surface-muted)] p-2 text-sm">
              <span className="font-semibold">{index + 1}. {label}</span><br />{formatDateTime(time)}
            </li>)}
        </ol>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Saída do mapa">{formatDateTime(row.mapDepartureAt)}</Field>
        <Field label="Fim TI">{formatDateTime(row.endedAt)}</Field>
        <Field label="Origem do ponto">{row.pointOrigin ?? "—"}</Field>
        <Field label="PFIS origem">{formatDuration(row.sourcePhysicalSeconds)}</Field>
        <Field label="PFIN origem">{formatDuration(row.sourceFinancialSeconds)}</Field>
        <Field label="Interno origem">{formatDuration(row.sourceInternalSeconds)}</Field>
      </dl>
    </>; })()}
    {indicator === "jl" && (() => { const row = item as JlItem; return <>
      <p className="text-sm font-semibold">{row.mode === "mpd" ? "MPD · Jornada Operacional" : "Ponto · Jornada Laboral"}</p>
      <Metric label="Jornada" value={row.jl} snapshotAt={row.snapshotAt} now={now} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="TML" value={row.tml} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="TR" value={row.tr} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="TI" value={row.ti} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="PFIS (detalhe)" value={row.physicalClose} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="PFIN (detalhe)" value={row.financialClose} snapshotAt={row.snapshotAt} now={now} />
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Etapa">{statusLabel(row.operationalStage)}</Field>
        <Field label="Início">{formatDateTime(row.startedAt)}</Field>
        <Field label="Fim">{formatDateTime(row.endedAt)}</Field>
        <Field label="Data ponto">{row.pointJourneyDate ?? "—"}</Field>
        <Field label="Entrada ponto">{formatDateTime(row.pointEntryAt)}</Field>
        <Field label="Saída ponto">{formatDateTime(row.pointExitAt)}</Field>
        <Field label="Soma dos componentes">{formatDuration(row.componentSumSeconds)}</Field>
        <Field label="Divergência">{formatDuration(row.divergenceSeconds)}</Field>
      </dl>
    </>; })()}
    {showExpurge && <ExpurgeContext item={item} />}
  </div>;
}
