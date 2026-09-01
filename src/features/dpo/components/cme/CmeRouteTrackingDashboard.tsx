"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  PackageOpen,
  RotateCcw,
  Send,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useCmeRouteTracking } from "@/features/dpo/hooks/useCmeRouteTracking";
import type {
  DecimalValue,
  Occurrence,
  OccurrenceStatus,
  OrderSummary,
} from "@/features/dpo/lib/cmeTypes";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";
import ExtratorSectionNav from "@/features/extrator-manager/components/ExtratorSectionNav";

type DashboardTab = "operation" | "occurrences";

const CME_TAB_ITEMS = [
  { id: "operation", label: "Acompanhamento de rota" },
  { id: "occurrences", label: "Acompanhamento das ocorrências" },
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR");
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

const OCCURRENCE_STATUS: Record<
  OccurrenceStatus,
  { label: string; className: string }
> = {
  OPEN: {
    label: "Ocorrência aberta",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  },
  RETURNED: {
    label: "Devolução confirmada",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  },
  REVERTED: {
    label: "Ocorrência revertida",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200",
  },
};

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] ${className}`}
    >
      {children}
    </section>
  );
}

function Feedback({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {children}
    </div>
  );
}

function toNumber(value: DecimalValue | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value: DecimalValue | undefined): string {
  const parsed = toNumber(value);
  return parsed === null ? "—" : currencyFormatter.format(parsed);
}

function formatDecimal(value: DecimalValue | undefined, suffix = ""): string {
  const parsed = toNumber(value);
  return parsed === null ? "—" : `${decimalFormatter.format(parsed)}${suffix}`;
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTimeFormatter.format(parsed);
}

function formatElapsed(start: string | undefined, end?: string | null): string {
  if (!start) {
    return "—";
  }

  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return "—";
  }

  const totalMinutes = Math.max(0, Math.floor((endTime - startTime) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days) return `${days}d ${hours}h ${minutes}min`;
  if (hours) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

function displayValue(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function buildTransferMessage({
  order,
  reason,
  observation,
  transferPossible,
  ans,
  elapsed,
}: {
  order: OrderSummary;
  reason: string;
  observation: string;
  transferPossible: boolean;
  ans: string;
  elapsed: string;
}): string {
  return [
    "🚨🚨 Alerta Devolução 🚨🚨",
    `🏪 PDV-Código: ${displayValue(order.customerId)}`,
    `®️ Nome PDV: ${displayValue(order.tradeName || order.customerName)}`,
    `👔 RN: ${order.sectorCode ? `@Setor ${order.sectorCode}` : "—"}`,
    `🚚 Motorista: ${displayValue(order.driverName)}`,
    `💸 Valor Pedido: ${formatCurrency(order.orderValue)}`,
    `📦 Volume: ${formatDecimal(order.totalHectoliters, " hl")}`,
    `⚖️ Peso: ${formatDecimal(order.totalWeightKg, " kg")}`,
    `🚦 Motivo: ${displayValue(reason.trim())}`,
    `📝 Observação: ${displayValue(observation.trim())}`,
    `🛣️ Possibilidade Repasse: ${transferPossible ? "Sim" : "Não"}`,
    `⏰ Tempo Espera: ${elapsed}`,
    `⚖️ ANS: ${displayValue(ans)}`,
  ].join("\n");
}

async function copyTransferMessage(message: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(message);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = message;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Falha ao copiar a mensagem.");
    }
  } finally {
    document.body.removeChild(textArea);
  }
}

function calculateAns(value: DecimalValue | undefined): string {
  const parsed = toNumber(value);

  if (parsed === null) {
    return "—";
  }

  if (parsed < 500) {
    return "0 MINUTOS";
  }

  if (parsed < 2000) {
    return "08 MINUTOS";
  }

  if (parsed < 5000) {
    return "15 MINUTOS";
  }

  return "GERENCIAL";
}

function DetailRow({
  label,
  value,
  emphasis = false,
  valueClassName = "",
}: {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className={`grid min-h-11 grid-cols-[100px_1fr] items-center border-b border-[color:var(--shell-line)] px-3 py-2 last:border-b-0 sm:grid-cols-[128px_1fr] ${
        emphasis ? "bg-[var(--shell-accent-soft)]" : "bg-[var(--shell-surface-muted)]"
      }`}
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]">
        {label}
      </span>
      <div
        className={`min-w-0 text-right text-sm font-bold uppercase tracking-[0.02em] text-[var(--shell-text)] sm:text-base ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

function InvoiceRail({
  orders,
  selectedOrder,
  disabled,
  onSelect,
}: {
  orders: OrderSummary[];
  selectedOrder: OrderSummary | null;
  disabled: boolean;
  onSelect: (order: OrderSummary) => void;
}) {
  return (
    <aside className="flex h-full min-h-[260px] flex-col bg-[var(--shell-surface-muted)]">
      <div className="flex items-center justify-between border-b border-[color:var(--shell-line)] px-4 py-3">
        <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--shell-text)]">
          Notas fiscais
        </span>
        <span className="rounded-full bg-[var(--shell-surface)] px-2.5 py-1 text-[10px] font-bold text-[var(--shell-muted)]">
          {orders.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {orders.length ? (
          orders.map((order) => {
            const selected = selectedOrder?.invoiceNumber === order.invoiceNumber;

            return (
              <button
                key={order.invoiceNumber}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(order)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  selected
                    ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)] text-[var(--shell-accent)]"
                    : "border-transparent text-[var(--shell-text)] hover:border-[color:var(--shell-line-strong)] hover:bg-[var(--shell-surface)]"
                }`}
              >
                <span className="block text-sm font-extrabold">{order.invoiceNumber}</span>
                <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--shell-muted)]">
                  {formatDate(order.deliveryDate)}
                </span>
              </button>
            );
          })
        ) : (
          <div className="flex min-h-52 items-center justify-center px-4 text-center text-xs leading-5 text-[var(--shell-muted)]">
            Digite o cliente no formulário para carregar as notas.
          </div>
        )}
      </div>
    </aside>
  );
}

function OccurrenceCard({
  occurrence,
  busy,
  now,
  onConfirm,
  onRevert,
}: {
  occurrence: Occurrence;
  busy: boolean;
  now: number;
  onConfirm: (occurrenceId: number) => void;
  onRevert: (occurrenceId: number) => void;
}) {
  const status = OCCURRENCE_STATUS[occurrence.status];
  const decisionAt = occurrence.returnConfirmedAt || occurrence.revertedAt;

  return (
    <article className="min-w-[260px] flex-1 basis-[280px] rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4 shadow-[0_12px_32px_rgba(2,6,23,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--shell-muted)]">
            Ocorrência #{occurrence.id}
          </p>
          <p className="mt-2 font-serif text-xl font-semibold text-[var(--shell-text)]">
            NF {occurrence.invoiceNumber}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]">
            Cliente
          </dt>
          <dd className="mt-1 font-bold text-[var(--shell-text)]">
            {occurrence.customerId}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]">
            Tipo
          </dt>
          <dd className="mt-1 font-bold text-[var(--shell-text)]">Devolução</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]">
            Criada em
          </dt>
          <dd className="mt-1 font-semibold text-[var(--shell-text)]">
            {formatDateTime(occurrence.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]">
            Atualizada em
          </dt>
          <dd className="mt-1 font-semibold text-[var(--shell-text)]">
            {formatDateTime(occurrence.updatedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]">
            Tempo em tratativa
          </dt>
          <dd className="mt-1 font-bold text-[var(--shell-accent)]">
            {formatElapsed(occurrence.createdAt, decisionAt || new Date(now).toISOString())}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2 rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-3 text-sm">
        <p>
          <span className="font-bold text-[var(--shell-muted)]">Motivo: </span>
          <span className="text-[var(--shell-text)]">{displayValue(occurrence.reason)}</span>
        </p>
        <p className="whitespace-pre-wrap">
          <span className="font-bold text-[var(--shell-muted)]">Observação: </span>
          <span className="text-[var(--shell-text)]">{displayValue(occurrence.observation)}</span>
        </p>
        <p>
          <span className="font-bold text-[var(--shell-muted)]">Repasse: </span>
          <span className="text-[var(--shell-text)]">{occurrence.transferPossible ? "Sim" : "Não"}</span>
        </p>
      </div>

      {occurrence.status !== "REVERTED" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {occurrence.status === "OPEN" ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() => onConfirm(occurrence.id)}
              className="h-10 rounded-xl bg-[var(--shell-accent)] px-4 text-white"
            >
              {busy ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}
              Confirmar devolução
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onRevert(occurrence.id)}
            className="h-10 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)]"
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}
            Reverter
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export default function CmeRouteTrackingDashboard() {
  const {
    changeCustomerInput,
    confirmReturn,
    context,
    customerInput,
    error,
    isDebouncing,
    items,
    loadOccurrences,
    occurrence,
    occurrences,
    occurrencesError,
    occurrencesLoading,
    orders,
    phase,
    revertOccurrence,
    startTreatment,
    selectedOrder,
    selectOrder,
    success,
  } = useCmeRouteTracking();
  const [activeTab, setActiveTab] = useState<DashboardTab>("operation");
  const [labelInput, setLabelInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [observationInput, setObservationInput] = useState("");
  const [transferPossibleInput, setTransferPossibleInput] = useState(false);
  const [clipboardFeedback, setClipboardFeedback] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const hasOpenOccurrence = occurrence?.status === "OPEN" ||
      occurrences?.content.some((item) => item.status === "OPEN");
    if (!hasOpenOccurrence) {
      return;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [occurrence, occurrences]);

  const isBusy = phase !== null;
  const occurrenceView = occurrence ? OCCURRENCE_STATUS[occurrence.status] : null;
  const occurrenceCards = occurrences?.content ?? [];
  const invoiceOrders = orders?.content ?? [];
  const ans = calculateAns(selectedOrder?.orderValue);
  const searchState = isDebouncing
    ? "Aguardando 2 segundos para consultar"
    : phase === "searching"
      ? "Buscando cliente no banco READ"
      : phase === "loading-context"
        ? "Carregando dados da nota"
        : selectedOrder
          ? "Consulta atualizada"
          : "";

  const handleCustomerInputChange = (value: string) => {
    setLabelInput("");
    setReasonInput("");
    setObservationInput("");
    setTransferPossibleInput(false);
    setClipboardFeedback("");
    changeCustomerInput(value);
  };

  const handleSelectOrder = (order: OrderSummary) => {
    setLabelInput("");
    setReasonInput("");
    setObservationInput("");
    setTransferPossibleInput(false);
    setClipboardFeedback("");
    selectOrder(order);
  };

  const handleStartTreatment = async () => {
    if (!selectedOrder) {
      return;
    }

    setClipboardFeedback("");
    const transferMessage = buildTransferMessage({
      order: selectedOrder,
      reason: reasonInput,
      observation: observationInput,
      transferPossible: transferPossibleInput,
      ans,
      elapsed: "0min",
    });

    const copyPromise = copyTransferMessage(transferMessage)
      .then(() => true)
      .catch(() => false);
    const created = await startTreatment({
      reason: reasonInput,
      observation: observationInput,
      transferPossible: transferPossibleInput,
    });

    if (!created) {
      await copyPromise;
      return;
    }

    if (await copyPromise) {
      setClipboardFeedback("Alerta copiado para a área de transferência.");
    } else {
      setClipboardFeedback(
        "Tratativa iniciada, mas não foi possível copiar o alerta automaticamente.",
      );
    }
  };

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);

    if (tab === "occurrences") {
      void loadOccurrences();
    }
  };

  return (
    <div className="space-y-3">
      <Panel className="overflow-hidden p-2">
        <ExtratorSectionNav
          activeTab={activeTab}
          items={CME_TAB_ITEMS}
          onTabChange={(tab) => handleTabChange(tab as DashboardTab)}
          ariaLabel="Seções do acompanhamento CME"
          className="flex flex-wrap gap-2"
        />
      </Panel>

      {activeTab === "operation" ? (
        <>
          {error ? <Feedback tone="error">{error}</Feedback> : null}
          {success ? <Feedback tone="success">{success}</Feedback> : null}
          {clipboardFeedback ? <Feedback tone="success">{clipboardFeedback}</Feedback> : null}

          <div className="grid gap-4 xl:min-h-[calc(100vh-13rem)] xl:grid-cols-[minmax(360px,1.1fr)_minmax(400px,1.4fr)_minmax(190px,0.58fr)]">
        <Panel className="order-1 flex min-h-[560px] flex-col overflow-hidden p-4 sm:p-5 xl:min-h-0">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Typography variant="overline">Apontamento</Typography>
                <Typography variant="sectionTitle" className="mt-2">
                  Controle de devolução
                </Typography>
                <Typography variant="supportingText" className="mt-2">
                  O formulário acompanha a nota fiscal selecionada.
                </Typography>
              </div>
              {occurrenceView ? (
                <span
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${occurrenceView.className}`}
                >
                  {occurrenceView.label}
                </span>
              ) : null}
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-xl border border-[color:var(--shell-line)]">
              <DetailRow
                label="Rótulo"
                emphasis
                value={
                  <Input
                    value={labelInput}
                    onChange={(event) => setLabelInput(event.target.value)}
                    placeholder="Informe o rótulo"
                    disabled={!selectedOrder}
                    className="ml-auto h-8 max-w-48 rounded-lg border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] text-right text-sm font-bold uppercase"
                  />
                }
              />
              <DetailRow
                label="Cód. cliente"
                value={
                  <div className="ml-auto w-full max-w-48">
                    <Input
                      id="cme-customer-code"
                      inputMode="numeric"
                      autoComplete="off"
                      value={customerInput}
                      onChange={(event) =>
                        handleCustomerInputChange(event.target.value)
                      }
                      placeholder="Informe o código"
                      className="h-8 w-full rounded-lg border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] text-right text-sm font-bold"
                    />
                    {searchState ? (
                      <span
                        className="mt-1 flex items-center justify-end gap-1.5 text-[9px] font-semibold normal-case tracking-normal text-[var(--shell-muted)]"
                        aria-live="polite"
                      >
                        {isDebouncing || phase === "searching" ? (
                          <LoaderCircle className="h-3 w-3 animate-spin text-[var(--shell-accent)]" />
                        ) : (
                          <Clock3 className="h-3 w-3" />
                        )}
                        {searchState}
                      </span>
                    ) : null}
                  </div>
                }
              />
              <DetailRow
                label="Nome"
                value={selectedOrder?.tradeName || selectedOrder?.customerName || "—"}
              />
              <DetailRow label="Mapa" value={selectedOrder?.routeNumber ?? "—"} />
              <DetailRow label="NF" value={selectedOrder?.invoiceNumber ?? "—"} />
              <DetailRow label="Valor" value={formatCurrency(selectedOrder?.orderValue)} />
              <DetailRow label="Volume" value={formatDecimal(selectedOrder?.totalHectoliters, " hl")} />
              <DetailRow label="Peso" value={formatDecimal(selectedOrder?.totalWeightKg, " kg")} />
              <DetailRow label="Motor" value={selectedOrder?.driverName || "—"} />
              <DetailRow label="Setor" value={selectedOrder?.sectorCode ?? "—"} />
              <DetailRow
                label="ANS"
                value={ans}
                valueClassName={
                  ans === "GERENCIAL"
                    ? "text-orange-500"
                    : "text-[var(--shell-accent)]"
                }
              />
              <DetailRow
                label="Pedido"
                emphasis
                value={selectedOrder?.orderType || "—"}
                valueClassName="text-[var(--shell-accent)]"
              />
              <DetailRow label="Entrega" value={formatDate(selectedOrder?.deliveryDate)} />
              <DetailRow
                label="Status"
                value={
                  selectedOrder?.externalStatus ||
                  occurrenceView?.label ||
                  "Sem apontamento"
                }
              />
              <div className="space-y-3 border-b border-[color:var(--shell-line)] bg-[var(--shell-accent-soft)] px-3 py-3">
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]" htmlFor="cme-reason">
                  Motivo
                </label>
                <Input
                  id="cme-reason"
                  value={reasonInput}
                  onChange={(event) => setReasonInput(event.target.value)}
                  placeholder="Ex.: PDV fechado"
                  disabled={!selectedOrder || isBusy}
                  maxLength={120}
                  className="h-9 rounded-lg border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] text-sm"
                />
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]" htmlFor="cme-observation">
                  Observação
                </label>
                <textarea
                  id="cme-observation"
                  value={observationInput}
                  onChange={(event) => setObservationInput(event.target.value)}
                  placeholder="Descreva o contexto da ocorrência"
                  disabled={!selectedOrder || isBusy}
                  maxLength={2000}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] px-3 py-2 text-sm text-[var(--shell-text)] outline-none transition focus:border-[color:var(--shell-accent)]"
                />
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]" htmlFor="cme-transfer-possible">
                  Possibilidade de repasse
                </label>
                <select
                  id="cme-transfer-possible"
                  value={transferPossibleInput ? "true" : "false"}
                  onChange={(event) => setTransferPossibleInput(event.target.value === "true")}
                  disabled={!selectedOrder || isBusy}
                  className="h-9 w-full rounded-lg border border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] px-3 text-sm text-[var(--shell-text)] outline-none focus:border-[color:var(--shell-accent)]"
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <Button
                type="button"
                disabled={
                  isBusy || !context || Boolean(occurrence && occurrence.status !== "REVERTED") ||
                  !reasonInput.trim() || !observationInput.trim()
                }
                onClick={() => void handleStartTreatment()}
                className="h-11 w-full rounded-xl bg-[var(--shell-contrast)] px-5 text-[var(--shell-contrast-ink)]"
              >
                {phase === "starting" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Send />
                )}
                {occurrence?.status === "OPEN"
                  ? "Tratativa em andamento"
                  : occurrence?.status === "RETURNED"
                    ? "Devolução confirmada"
                    : "Iniciar tratativa"}
              </Button>
            </div>
          </div>
        </Panel>

        <Panel className="order-3 flex min-h-[420px] flex-col overflow-hidden xl:order-2 xl:min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--shell-line)] p-4 sm:p-5">
            <div>
              <Typography variant="overline">Produtos da nota</Typography>
              <Typography variant="sectionTitle" className="mt-2">
                {selectedOrder
                  ? `NF ${selectedOrder.invoiceNumber}`
                  : "Nenhuma nota selecionada"}
              </Typography>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--shell-muted)]">
              {phase === "loading-context" ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-[var(--shell-accent)]" />
              ) : (
                <PackageOpen className="h-4 w-4" />
              )}
              {items.length} itens
            </span>
          </div>

          {items.length ? (
            <div className="min-h-0 flex-1 divide-y divide-[color:var(--shell-line)] overflow-y-auto">
              {items.map((item) => (
                <article
                  key={item.productCode}
                  className="grid gap-2 px-4 py-4 sm:grid-cols-[110px_1fr_auto] sm:items-center sm:px-5"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--shell-accent)]">
                    {item.productCode}
                  </span>
                  <span className="text-sm font-semibold text-[var(--shell-text)]">
                    {item.productName || "Produto sem descrição"}
                  </span>
                  <span className="text-sm font-bold text-[var(--shell-muted)]">
                    {formatDecimal(item.quantity)} un.
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              {phase === "loading-context" ? (
                <LoaderCircle className="h-9 w-9 animate-spin text-[var(--shell-accent)]" />
              ) : (
                <FileText className="h-9 w-9 text-[var(--shell-muted)]" />
              )}
              <p className="mt-4 max-w-sm text-sm font-semibold text-[var(--shell-text)]">
                {selectedOrder
                  ? "Carregando ou aguardando os produtos desta nota fiscal."
                  : "Digite o cliente no formulário e selecione uma nota fiscal."}
              </p>
            </div>
          )}
        </Panel>

        <Panel className="order-2 min-h-[340px] overflow-hidden xl:order-3 xl:min-h-0">
          <InvoiceRail
            orders={invoiceOrders}
            selectedOrder={selectedOrder}
            disabled={isBusy}
            onSelect={handleSelectOrder}
          />
        </Panel>
          </div>
        </>
      ) : (
        <Panel className="min-h-[calc(100vh-13rem)] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--shell-line)] p-4 sm:p-5">
            <div>
              <Typography variant="overline">Ocorrências de devolução</Typography>
              <Typography variant="sectionTitle" className="mt-2">
                Acompanhamento das ocorrências
              </Typography>
              <Typography variant="supportingText" className="mt-2">
                Cards em ordem da ocorrência mais recente para a mais antiga.
              </Typography>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--shell-muted)]">
              {occurrencesLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-[var(--shell-accent)]" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {occurrences?.totalElements ?? 0} ocorrências
            </span>
          </div>

          {occurrencesError ? (
            <div className="p-4 sm:p-5">
              <Feedback tone="error">{occurrencesError}</Feedback>
            </div>
          ) : null}

          {occurrenceCards.length ? (
            <div className="flex flex-wrap gap-4 p-4 sm:p-5">
              {occurrenceCards.map((item) => (
                <OccurrenceCard
                  key={item.id}
                  occurrence={item}
                  now={now}
                  busy={isBusy}
                  onConfirm={(occurrenceId) => void confirmReturn(occurrenceId)}
                  onRevert={(occurrenceId) => void revertOccurrence(occurrenceId)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              {occurrencesLoading ? (
                <LoaderCircle className="h-9 w-9 animate-spin text-[var(--shell-accent)]" />
              ) : (
                <FileText className="h-9 w-9 text-[var(--shell-muted)]" />
              )}
              <p className="mt-4 text-sm font-semibold text-[var(--shell-text)]">
                {occurrencesLoading
                  ? "Carregando ocorrências..."
                  : "Nenhuma ocorrência de devolução foi encontrada."}
              </p>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
