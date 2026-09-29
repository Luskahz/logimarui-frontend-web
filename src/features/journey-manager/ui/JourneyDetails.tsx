import type { ReactNode } from "react";
import type { Checklist, Indicator, IndicatorResult, JlItem, JourneyItem, TiItem, TmlItem, TrItem } from "../model/types";
import { checklistPending, formatDateTime, formatDuration, liveSeconds, outcomeLabel } from "../lib/journeyPresentation";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-[var(--shell-muted)]">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-[var(--shell-text)]">{children}</dd></div>;
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
      <Field label="Ciclo">{value.lifecycleStatus ?? "—"}</Field>
      <Field label="Situação da meta">{value.targetStatus ?? "—"}</Field>
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
      <p className="mt-2 text-sm text-[var(--shell-muted)]">Checklist ausente ou pendente. O TML permanece conforme retornado pela API.</p> :
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

function ExpurgeContext({ item }: { item: JourneyItem }) {
  const { expurge } = item;
  return <div className="rounded-xl border border-[color:var(--shell-line)] p-3 text-sm">
    <p className="font-semibold">Expurgo: {expurge.present === null ? "não informado" : expurge.present ? "sim" : "não"}</p>
    {expurge.present && <p className="mt-1 text-[var(--shell-muted)]">{[expurge.types, expurge.reasons, expurge.observations].filter(Boolean).join(" · ") || "Sem detalhe informado"}</p>}
    {expurge.flags?.recharge && <p className="mt-1">Recarga sinalizada</p>}
    {expurge.flags?.stoppedMap && <p className="mt-1">Mapa parado sinalizado</p>}
  </div>;
}

export function JourneyDetails({ indicator, item, now }: {
  indicator: Indicator; item: JourneyItem; now: number;
}) {
  return <div className="space-y-3">
    {indicator === "tml" && (() => { const row = item as TmlItem; return <>
      <Metric label="TML" value={row.tml} snapshotAt={row.snapshotAt} now={now} />
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
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Saída">{formatDateTime(row.mapDepartureAt)}</Field>
        <Field label="Retorno">{formatDateTime(row.mapReturnAt)}</Field>
        <Field label="Tempo previsto">{formatDuration(row.plannedSeconds)}</Field>
        <Field label="Dispersão">{row.dispersion ?? "—"}</Field>
      </dl>
    </>; })()}
    {indicator === "ti" && (() => { const row = item as TiItem; return <>
      <div className="grid gap-3 lg:grid-cols-3">
        <Metric label="PFIS" value={row.physicalClose} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="PFIN" value={row.financialClose} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="TI" value={row.ti} snapshotAt={row.snapshotAt} now={now} />
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Etapa operacional">{row.operationalStage ?? "—"}</Field>
        <Field label="Saída do mapa">{formatDateTime(row.mapDepartureAt)}</Field>
        <Field label="Entrada do veículo">{formatDateTime(row.vehicleEntryAt)}</Field>
        <Field label="PFIS">{formatDateTime(row.physicalCloseAt)}</Field>
        <Field label="PFIN">{formatDateTime(row.financialCloseAt)}</Field>
        <Field label="Ponto final">{formatDateTime(row.pointExitAt)}</Field>
        <Field label="Fim TI">{formatDateTime(row.endedAt)}</Field>
        <Field label="Origem do ponto">{row.pointOrigin ?? "—"}</Field>
        <Field label="PFIS origem">{formatDuration(row.sourcePhysicalSeconds)}</Field>
        <Field label="PFIN origem">{formatDuration(row.sourceFinancialSeconds)}</Field>
        <Field label="Interno origem">{formatDuration(row.sourceInternalSeconds)}</Field>
      </dl>
    </>; })()}
    {indicator === "jl" && (() => { const row = item as JlItem; return <>
      <Metric label={row.mode === "mpd" ? "Jornada operacional" : "Jornada laboral"} value={row.jl} snapshotAt={row.snapshotAt} now={now} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="TML" value={row.tml} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="TR" value={row.tr} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="TI" value={row.ti} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="PFIS (detalhe)" value={row.physicalClose} snapshotAt={row.snapshotAt} now={now} />
        <Metric label="PFIN (detalhe)" value={row.financialClose} snapshotAt={row.snapshotAt} now={now} />
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Etapa">{row.operationalStage ?? "—"}</Field>
        <Field label="Início">{formatDateTime(row.startedAt)}</Field>
        <Field label="Fim">{formatDateTime(row.endedAt)}</Field>
        <Field label="Data ponto">{row.pointJourneyDate ?? "—"}</Field>
        <Field label="Entrada ponto">{formatDateTime(row.pointEntryAt)}</Field>
        <Field label="Saída ponto">{formatDateTime(row.pointExitAt)}</Field>
        <Field label="Soma dos componentes">{formatDuration(row.componentSumSeconds)}</Field>
        <Field label="Divergência">{formatDuration(row.divergenceSeconds)}</Field>
      </dl>
    </>; })()}
    <ExpurgeContext item={item} />
  </div>;
}
