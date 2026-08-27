"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  PackageOpen,
  RotateCcw,
  Search,
  Send,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { useCmeRouteTracking } from "@/features/dpo/hooks/useCmeRouteTracking";
import type {
  DecimalValue,
  OccurrenceStatus,
  OrderSummary,
} from "@/features/dpo/lib/cmeTypes";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";

type SectionId = "consulta" | "apontamento" | "itens";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

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
      <span
        className={`min-w-0 text-right text-sm font-bold uppercase tracking-[0.02em] text-[var(--shell-text)] sm:text-base ${valueClassName}`}
      >
        {value}
      </span>
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
    <aside className="flex min-h-[220px] flex-col border-b border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] md:min-h-[460px] md:border-b-0 md:border-r">
      <div className="flex items-center justify-between border-b border-[color:var(--shell-line)] px-4 py-3">
        <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--shell-text)]">
          Notas
        </span>
        <span className="rounded-full bg-[var(--shell-surface)] px-2.5 py-1 text-[10px] font-bold text-[var(--shell-muted)]">
          {orders.length}
        </span>
      </div>

      <div className="max-h-[500px] flex-1 space-y-1 overflow-y-auto p-2">
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
            As notas do cliente aparecerão aqui após a consulta.
          </div>
        )}
      </div>
    </aside>
  );
}

export default function CmeRouteTrackingDashboard() {
  const {
    changeCustomerInput,
    confirmReturn,
    consult,
    context,
    customerInput,
    error,
    isDebouncing,
    items,
    occurrence,
    orders,
    phase,
    revertOccurrence,
    selectedOrder,
    selectOrder,
    success,
  } = useCmeRouteTracking();
  const [activeSection, setActiveSection] = useState<SectionId>("consulta");
  const [labelInput, setLabelInput] = useState("");

  const isBusy = phase !== null;
  const occurrenceView = occurrence ? OCCURRENCE_STATUS[occurrence.status] : null;
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
          : "Digite o código do cliente";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    consult();
  };

  const sections: Array<{ id: SectionId; label: string; count?: number }> = [
    { id: "consulta", label: "Consulta CME", count: invoiceOrders.length || undefined },
    { id: "apontamento", label: "Apontamento" },
    { id: "itens", label: "Itens da nota", count: items.length || undefined },
  ];

  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <Typography variant="eyebrow">Entrega DPO · Bloco 4.0</Typography>
              <Typography variant="pageTitle" className="mt-3">
                Acompanhamento de rota CME
              </Typography>
              <Typography variant="description" className="mt-3 max-w-3xl">
                Consulta operacional de clientes, notas fiscais e devoluções em rota.
              </Typography>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--shell-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--shell-accent)]" />
              Fonte: banco READ
            </span>
          </div>
        </div>

        <nav
          aria-label="Seções do acompanhamento CME"
          className="flex gap-2 overflow-x-auto border-t border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3 sm:px-6"
        >
          {sections.map((section) => {
            const active = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--shell-contrast)] text-[var(--shell-contrast-ink)]"
                    : "border border-[color:var(--shell-line)] bg-[var(--shell-surface)] text-[var(--shell-text)] hover:border-[color:var(--shell-line-strong)]"
                }`}
              >
                {section.label}
                {section.count ? (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-white/20" : "bg-[var(--shell-accent-soft)] text-[var(--shell-accent)]"}`}>
                    {section.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </Panel>

      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}

      {activeSection === "consulta" ? (
        <div className="space-y-4">
          <Panel className="p-4 sm:p-5">
            <form
              onSubmit={handleSubmit}
              className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)] lg:items-end"
            >
              <div>
                <Typography variant="overline">Localização automática</Typography>
                <Typography variant="sectionTitle" className="mt-2">
                  Informe o cliente
                </Typography>
                <Typography variant="supportingText" className="mt-2">
                  A consulta inicia automaticamente após 2 segundos sem digitação.
                </Typography>
              </div>

              <div>
                <label
                  htmlFor="cme-customer-code"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--shell-muted)]"
                >
                  Cliente
                </label>
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--shell-muted)]" />
                    <Input
                      id="cme-customer-code"
                      inputMode="numeric"
                      autoComplete="off"
                      value={customerInput}
                      onChange={(event) => changeCustomerInput(event.target.value)}
                      placeholder="Ex.: 59148"
                      className="h-12 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] pl-10 text-base font-bold text-[var(--shell-text)]"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!customerInput || isBusy}
                    aria-label="Consultar cliente agora"
                    className="h-12 rounded-xl bg-[var(--shell-contrast)] px-4 text-[var(--shell-contrast-ink)]"
                  >
                    {isBusy ? <LoaderCircle className="animate-spin" /> : <Search />}
                    <span className="hidden sm:inline">Consultar</span>
                  </Button>
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs text-[var(--shell-muted)]" aria-live="polite">
                  {isDebouncing || isBusy ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[var(--shell-accent)]" />
                  ) : (
                    <Clock3 className="h-3.5 w-3.5" />
                  )}
                  {searchState}
                </p>
              </div>
            </form>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="grid md:grid-cols-[180px_minmax(0,1fr)]">
              <InvoiceRail
                orders={invoiceOrders}
                selectedOrder={selectedOrder}
                disabled={isBusy}
                onSelect={selectOrder}
              />

              <div className="min-w-0 bg-[var(--shell-surface)] p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--shell-contrast)] px-4 py-2.5 text-[var(--shell-contrast-ink)]">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-65">Mapa</span>
                    <span className="text-sm font-extrabold">{selectedOrder?.routeNumber ?? "—"}</span>
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-[0.1em]">
                    Controle de devoluções
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-[color:var(--shell-line)]">
                  <DetailRow
                    label="Rótulo"
                    emphasis
                    value={
                      <Input
                        value={labelInput}
                        onChange={(event) => setLabelInput(event.target.value)}
                        placeholder="Informe o rótulo"
                        className="ml-auto h-8 max-w-sm rounded-lg border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] text-right text-sm font-bold uppercase"
                      />
                    }
                  />
                  <DetailRow label="Cliente" value={selectedOrder?.customerId ?? (customerInput || "—")} />
                  <DetailRow
                    label="Nome"
                    value={selectedOrder?.tradeName || selectedOrder?.customerName || "—"}
                  />
                  <DetailRow label="Valor" value={formatCurrency(selectedOrder?.orderValue)} />
                  <DetailRow label="Hecto" value={formatDecimal(selectedOrder?.totalHectoliters)} />
                  <DetailRow label="Motor" value={selectedOrder?.driverName || "—"} />
                  <DetailRow label="Setor" value={selectedOrder?.sectorCode ?? "—"} />
                  <DetailRow
                    label="ANS"
                    value={ans}
                    valueClassName={ans === "GERENCIAL" ? "text-orange-500" : "text-[var(--shell-accent)]"}
                  />
                  <DetailRow
                    label="Pedido"
                    emphasis
                    value={selectedOrder?.orderType || "—"}
                    valueClassName="text-[var(--shell-accent)]"
                  />
                  <DetailRow label="NF" value={selectedOrder?.invoiceNumber ?? "—"} />
                  <DetailRow label="Entrega" value={formatDate(selectedOrder?.deliveryDate)} />
                  <DetailRow
                    label="Status"
                    value={selectedOrder?.externalStatus || occurrenceView?.label || "Sem apontamento"}
                  />
                </div>

                <div className="mt-3 rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--shell-muted)]">
                  {selectedOrder
                    ? selectedOrder.customerName || "Cliente carregado pelo banco READ"
                    : "Aguardando um código de cliente para montar o painel"}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}

      {activeSection === "apontamento" ? (
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Typography variant="overline">Apontamento de devolução</Typography>
              <Typography variant="sectionTitle" className="mt-2">
                Confirmação da ocorrência
              </Typography>
              <Typography variant="supportingText" className="mt-2 max-w-2xl">
                Selecione uma nota na consulta para confirmar ou reverter a devolução.
              </Typography>
            </div>
            {occurrenceView ? (
              <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${occurrenceView.className}`}>
                {occurrenceView.label}
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Cliente", selectedOrder?.customerId ?? "—"],
              ["Nota fiscal", selectedOrder?.invoiceNumber ?? "—"],
              ["Valor", formatCurrency(selectedOrder?.orderValue)],
              ["ANS", ans],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--shell-muted)]">{label}</p>
                <p className="mt-2 text-base font-bold text-[var(--shell-text)]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy || !occurrence || occurrence.status === "REVERTED"}
              onClick={revertOccurrence}
              className="h-11 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)]"
            >
              {phase === "reverting" ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}
              Reverter apontamento
            </Button>
            <Button
              type="button"
              disabled={isBusy || !context || occurrence?.status === "RETURNED"}
              onClick={confirmReturn}
              className="h-11 rounded-xl bg-[var(--shell-contrast)] px-5 text-[var(--shell-contrast-ink)]"
            >
              {phase === "confirming" ? <LoaderCircle className="animate-spin" /> : <Send />}
              {occurrence?.status === "RETURNED" ? "Devolução confirmada" : "Confirmar devolução"}
            </Button>
          </div>
        </Panel>
      ) : null}

      {activeSection === "itens" ? (
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--shell-line)] p-5 sm:p-6">
            <div>
              <Typography variant="overline">Itens da nota fiscal</Typography>
              <Typography variant="sectionTitle" className="mt-2">
                {selectedOrder ? `NF ${selectedOrder.invoiceNumber}` : "Nenhuma nota selecionada"}
              </Typography>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--shell-muted)]">
              <PackageOpen className="h-4 w-4" />
              {items.length} itens
            </span>
          </div>

          {items.length ? (
            <div className="divide-y divide-[color:var(--shell-line)]">
              {items.map((item) => (
                <article key={item.productCode} className="grid gap-2 px-5 py-4 sm:grid-cols-[110px_1fr_auto] sm:items-center sm:px-6">
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
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <FileText className="h-9 w-9 text-[var(--shell-muted)]" />
              <p className="mt-4 text-sm font-semibold text-[var(--shell-text)]">
                Consulte um cliente e selecione uma nota fiscal.
              </p>
            </div>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
