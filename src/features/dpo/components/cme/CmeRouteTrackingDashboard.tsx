"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  PackageOpen,
  ReceiptText,
  RotateCcw,
  Route,
  Search,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

import { useCmeRouteTracking } from "@/features/dpo/hooks/useCmeRouteTracking";
import type {
  DecimalValue,
  OccurrenceStatus,
  OrderSummary,
} from "@/features/dpo/lib/cmeTypes";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Typography } from "@/shared/ui/typography";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR");

const STEPS = [
  {
    number: "01",
    title: "Localizar o pedido",
    description: "Informe o cliente e, se souber, a nota fiscal.",
  },
  {
    number: "02",
    title: "Conferir o contexto",
    description: "Valide pedido, itens, valor e volume antes de decidir.",
  },
  {
    number: "03",
    title: "Registrar a decisão",
    description: "Confirme a devolução ou reverta a ocorrência ativa.",
  },
];

const OCCURRENCE_STATUS: Record<
  OccurrenceStatus,
  { label: string; className: string }
> = {
  OPEN: {
    label: "Ocorrência aberta",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  },
  RETURNED: {
    label: "Devolução confirmada",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  },
  REVERTED: {
    label: "Ocorrência revertida",
    className: "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200",
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
      className={`rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] ${className}`}
    >
      {children}
    </section>
  );
}

function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-accent-soft)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--shell-accent)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--shell-accent)]" />
      {children}
    </span>
  );
}

function Feedback({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-[20px] border px-4 py-3 text-sm ${
        isError
          ? "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
          : "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
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

function OrderCard({
  order,
  onSelect,
  selected,
  disabled,
}: {
  order: OrderSummary;
  onSelect: (order: OrderSummary) => void;
  selected: boolean;
  disabled: boolean;
}) {
  return (
    <article
      className={`rounded-[22px] border p-4 transition ${
        selected
          ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
          : "border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Typography variant="mutedOverline">NF {order.invoiceNumber}</Typography>
          <Typography variant="cardTitle" className="mt-2">
            Pedido {order.orderNumber}
          </Typography>
        </div>
        <span className="rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-1 text-xs font-semibold text-[var(--shell-muted)]">
          Entrega {formatDate(order.deliveryDate)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[var(--shell-muted)]">Valor</p>
          <p className="mt-1 font-semibold text-[var(--shell-text)]">
            {formatCurrency(order.orderValue)}
          </p>
        </div>
        <div>
          <p className="text-[var(--shell-muted)]">Volume</p>
          <p className="mt-1 font-semibold text-[var(--shell-text)]">
            {formatDecimal(order.totalHectoliters, " HL")}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant={selected ? "secondary" : "outline"}
        disabled={disabled || selected}
        onClick={() => onSelect(order)}
        className="mt-4 h-10 w-full rounded-xl border-[color:var(--shell-line-strong)]"
      >
        {selected ? <CheckCircle2 /> : <ReceiptText />}
        {selected ? "Nota selecionada" : "Selecionar nota"}
      </Button>
    </article>
  );
}

export default function CmeRouteTrackingDashboard() {
  const {
    changeCustomerInput,
    changeInvoiceInput,
    consult,
    confirmReturn,
    context,
    customerInput,
    error,
    invoiceInput,
    items,
    occurrence,
    orders,
    phase,
    revertOccurrence,
    selectedOrder,
    selectOrder,
    success,
  } = useCmeRouteTracking();

  const isBusy = phase !== null;
  const hasContext = context !== null;
  const occurrenceView = occurrence ? OCCURRENCE_STATUS[occurrence.status] : null;
  const contextCards = [
    {
      icon: ReceiptText,
      label: "Cliente / PDV",
      value: context ? String(context.customerId) : "Aguardando consulta",
    },
    {
      icon: Route,
      label: "Pedido / nota fiscal",
      value: context
        ? `${selectedOrder?.orderNumber ?? "Pedido não informado"} · NF ${context.invoiceNumber}`
        : "—",
    },
    {
      icon: ReceiptText,
      label: "Valor do pedido",
      value: formatCurrency(context?.orderValue),
    },
    {
      icon: PackageOpen,
      label: "Volume da NF",
      value: formatDecimal(context?.totalHectoliters, " HL"),
    },
    {
      icon: PackageOpen,
      label: "Itens encontrados",
      value: hasContext ? String(items.length) : "—",
    },
    {
      icon: UserRound,
      label: "Motorista / rota",
      value: "Endpoint ainda não disponível",
    },
  ];

  return (
    <div className="space-y-4">
      <Panel className="overflow-hidden p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div>
            <Typography variant="eyebrow">Entrega DPO · Bloco 4.0</Typography>
            <Typography variant="pageTitle" className="mt-3">
              Acompanhamento de rota CME
            </Typography>
            <Typography variant="description" className="mt-3 max-w-3xl">
              Consulte pedidos no banco READ e registre a confirmação ou reversão da devolução no serviço de ocorrências.
            </Typography>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <StatusBadge>Backend conectado</StatusBadge>
            <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-[color:var(--shell-line-strong)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--shell-muted)]">
              <Clock3 className="h-3.5 w-3.5" />
              Motorista pendente
            </span>
          </div>
        </div>
      </Panel>

      {error ? <Feedback tone="error">{error}</Feedback> : null}
      {success ? <Feedback tone="success">{success}</Feedback> : null}

      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.75fr]">
        <div className="space-y-4">
          <Panel className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Typography variant="overline">Identificação do pedido</Typography>
                <Typography variant="sectionTitle" className="mt-2">
                  Localize a entrega
                </Typography>
                <Typography variant="supportingText" className="mt-2 max-w-3xl">
                  O código do cliente é obrigatório. Informe também a nota fiscal para abrir diretamente ou deixe-a vazia para listar os pedidos do cliente.
                </Typography>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--shell-accent-soft)] text-[var(--shell-accent)]">
                <Search className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="customer-code" className="text-[var(--shell-text)]">
                  Código do cliente
                </Label>
                <Input
                  id="customer-code"
                  inputMode="numeric"
                  autoComplete="off"
                  value={customerInput}
                  onChange={(event) => changeCustomerInput(event.target.value)}
                  disabled={isBusy}
                  placeholder="Ex.: 123456"
                  className="h-11 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-3 text-[var(--shell-text)] placeholder:text-[var(--shell-muted)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice-number" className="text-[var(--shell-text)]">
                  Nota fiscal <span className="font-normal text-[var(--shell-muted)]">(opcional)</span>
                </Label>
                <Input
                  id="invoice-number"
                  inputMode="numeric"
                  autoComplete="off"
                  value={invoiceInput}
                  onChange={(event) => changeInvoiceInput(event.target.value)}
                  disabled={isBusy}
                  placeholder="Ex.: 000123456"
                  className="h-11 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-3 text-[var(--shell-text)] placeholder:text-[var(--shell-muted)]"
                />
              </div>

              <Button
                type="button"
                disabled={isBusy || !customerInput.trim()}
                onClick={consult}
                className="h-11 rounded-xl bg-[var(--shell-contrast)] px-4 text-[var(--shell-contrast-ink)] sm:col-span-2 lg:col-span-1"
              >
                {phase === "searching" || phase === "loading-context" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Search />
                )}
                {invoiceInput.trim() ? "Consultar nota" : "Consultar pedidos"}
              </Button>
            </div>
          </Panel>

          {orders?.content.length ? (
            <Panel className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Typography variant="overline">Pedidos encontrados</Typography>
                  <Typography variant="sectionTitle" className="mt-2">
                    Selecione a nota fiscal
                  </Typography>
                </div>
                <span className="rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--shell-muted)]">
                  {orders.totalElements} resultado{orders.totalElements === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {orders.content.map((order) => (
                  <OrderCard
                    key={`${order.orderNumber}-${order.invoiceNumber}`}
                    order={order}
                    disabled={isBusy}
                    selected={selectedOrder?.invoiceNumber === order.invoiceNumber}
                    onSelect={selectOrder}
                  />
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Typography variant="overline">Contexto operacional</Typography>
                <Typography variant="sectionTitle" className="mt-2">
                  Dados da rota e do pedido
                </Typography>
              </div>
              <span className="rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--shell-muted)]">
                {hasContext ? `NF ${context.invoiceNumber}` : "Nenhum pedido selecionado"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contextCards.map(({ icon: Icon, label, value }) => (
                <article
                  key={label}
                  className="rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--shell-surface)] text-[var(--shell-accent)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <Typography variant="mutedOverline" className="mt-4">
                    {label}
                  </Typography>
                  <Typography variant="itemTitle" className="mt-2">
                    {value}
                  </Typography>
                </article>
              ))}
            </div>

            <div
              className={`mt-4 flex items-start gap-3 rounded-[22px] border p-4 ${
                hasContext
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
              }`}
            >
              {hasContext ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {hasContext ? "Contexto de devolução carregado" : "Aguardando consulta"}
                </p>
                <p className="mt-1 text-sm leading-6 opacity-80">
                  {hasContext
                    ? "Cliente, nota, valor, volume e itens foram lidos do banco READ."
                    : "Consulte um cliente e selecione a nota fiscal para liberar as ações."}
                </p>
              </div>
            </div>
          </Panel>

          {hasContext ? (
            <Panel className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Typography variant="overline">Itens da nota fiscal</Typography>
                  <Typography variant="sectionTitle" className="mt-2">
                    Produtos encontrados
                  </Typography>
                </div>
                <span className="rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--shell-muted)]">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </span>
              </div>

              {items.length ? (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {items.map((item) => (
                    <article
                      key={item.productCode}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shell-accent)]">
                          Produto {item.productCode}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--shell-text)]">
                          {item.productName || "Produto sem descrição"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-1 text-xs font-semibold text-[var(--shell-muted)]">
                        {formatDecimal(item.quantity)} un.
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] px-4 py-5 text-sm text-[var(--shell-muted)]">
                  A nota foi localizada, mas nenhum item foi retornado.
                </p>
              )}
            </Panel>
          ) : null}

          <Panel className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Typography variant="overline">Apontamento de devolução</Typography>
                <Typography variant="sectionTitle" className="mt-2">
                  Registre a ocorrência
                </Typography>
                <Typography variant="supportingText" className="mt-2">
                  A API atual grava cliente, nota e estado. Motivo, ANS e observação aguardam ampliação do contrato.
                </Typography>
              </div>
              {occurrenceView ? (
                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${occurrenceView.className}`}>
                  {occurrenceView.label}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="return-reason" className="text-[var(--shell-text)]">
                  Motivo da devolução
                </Label>
                <select
                  id="return-reason"
                  disabled
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-3 text-sm text-[var(--shell-muted)] outline-none disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="">Endpoint ainda não possui este campo</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ans-status" className="text-[var(--shell-text)]">
                  Situação do ANS
                </Label>
                <Input
                  id="ans-status"
                  disabled
                  value="Endpoint ainda não disponível"
                  readOnly
                  className="h-11 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-3 text-[var(--shell-muted)]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="return-notes" className="text-[var(--shell-text)]">
                  Observação
                </Label>
                <Textarea
                  id="return-notes"
                  disabled
                  placeholder="O endpoint de ocorrência ainda não recebe observações."
                  className="min-h-28 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-3 py-3 text-[var(--shell-text)] placeholder:text-[var(--shell-muted)]"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[color:var(--shell-line)] pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy || !occurrence || occurrence.status === "REVERTED"}
                onClick={revertOccurrence}
                className="h-11 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] px-4 text-[var(--shell-text)]"
              >
                {phase === "reverting" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <RotateCcw />
                )}
                {phase === "reverting" ? "Revertendo..." : "Reverter apontamento"}
              </Button>
              <Button
                type="button"
                disabled={isBusy || !hasContext || occurrence?.status === "RETURNED"}
                onClick={confirmReturn}
                className="h-11 rounded-xl bg-[var(--shell-contrast)] px-4 text-[var(--shell-contrast-ink)]"
              >
                {phase === "confirming" ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <CheckCircle2 />
                )}
                {phase === "confirming"
                  ? "Confirmando..."
                  : occurrence?.status === "RETURNED"
                    ? "Devolução confirmada"
                    : "Confirmar devolução"}
              </Button>
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <Typography variant="overline">Fluxo do apontamento</Typography>
            <div className="mt-5 space-y-5">
              {STEPS.map((step, index) => (
                <div key={step.number} className="relative flex gap-3">
                  {index < STEPS.length - 1 ? (
                    <span className="absolute left-5 top-10 h-[calc(100%+0.25rem)] w-px bg-[var(--shell-line-strong)]" />
                  ) : null}
                  <span className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] text-xs font-semibold text-[var(--shell-accent)]">
                    {step.number}
                  </span>
                  <div className="pb-1">
                    <Typography variant="itemTitle">{step.title}</Typography>
                    <Typography variant="caption" className="mt-1">
                      {step.description}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <Typography variant="overline">Estado das integrações</Typography>
            <ul className="mt-4 space-y-3">
              {[
                { label: "Pedidos do cliente", ready: true },
                { label: "Itens e contexto da nota", ready: true },
                { label: "Confirmar e reverter devolução", ready: true },
                { label: "Motorista e quantidade de entregas", ready: false },
                { label: "Motivo, ANS e observação", ready: false },
              ].map((item) => (
                <li
                  key={item.label}
                  className="flex items-start gap-3 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3.5 py-3 text-sm text-[var(--shell-muted)]"
                >
                  {item.ready ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--shell-accent)]" />
                  ) : (
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  {item.label}
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
