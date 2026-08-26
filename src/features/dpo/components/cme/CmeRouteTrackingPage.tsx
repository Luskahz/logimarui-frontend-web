import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  PackageOpen,
  ReceiptText,
  RotateCcw,
  Route,
  Search,
  Truck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Typography } from "@/shared/ui/typography";

const ORDER_CONTEXT = [
  { icon: ReceiptText, label: "Cliente / PDV", value: "Aguardando consulta" },
  { icon: Route, label: "RN / rota", value: "—" },
  { icon: UserRound, label: "Motorista", value: "Integração futura" },
  { icon: Truck, label: "Entregas da rota", value: "Integração futura" },
  { icon: PackageOpen, label: "Volumes", value: "—" },
  { icon: Clock3, label: "Tempo de espera ANS", value: "—" },
];

const STEPS = [
  {
    number: "01",
    title: "Localizar o pedido",
    description: "Informe o código do cliente ou a nota fiscal para iniciar o apontamento.",
  },
  {
    number: "02",
    title: "Conferir o contexto",
    description: "Valide rota, motorista, volumes e tempo de espera antes de decidir.",
  },
  {
    number: "03",
    title: "Registrar a decisão",
    description: "Selecione o motivo, detalhe a ocorrência e confirme ou reverta.",
  },
];

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

export function CmeRouteTrackingContent() {
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
                Área de apontamento de devolução para localizar o pedido, conferir o contexto da rota e registrar a decisão operacional.
              </Typography>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <StatusBadge>Layout demonstrativo</StatusBadge>
              <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-[color:var(--shell-line-strong)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--shell-muted)]">
                <Clock3 className="h-3.5 w-3.5" />
                Integração pendente
              </span>
            </div>
          </div>
        </Panel>

        <div className="grid gap-4 xl:grid-cols-[1.55fr_0.75fr]">
          <div className="space-y-4">
            <Panel className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Typography variant="overline">Identificação do pedido</Typography>
                  <Typography variant="sectionTitle" className="mt-2">
                    Localize a entrega
                  </Typography>
                  <Typography variant="supportingText" className="mt-2">
                    Use um dos identificadores disponíveis. Os dados serão preenchidos pelos endpoints em uma próxima etapa.
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
                    placeholder="Ex.: 123456"
                    className="h-11 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-3 text-[var(--shell-text)] placeholder:text-[var(--shell-muted)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-number" className="text-[var(--shell-text)]">
                    Nota fiscal
                  </Label>
                  <Input
                    id="invoice-number"
                    inputMode="numeric"
                    placeholder="Ex.: 000123456"
                    className="h-11 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-3 text-[var(--shell-text)] placeholder:text-[var(--shell-muted)]"
                  />
                </div>

                <Button
                  type="button"
                  disabled
                  className="h-11 rounded-xl bg-[var(--shell-contrast)] px-4 text-[var(--shell-contrast-ink)] sm:col-span-2 lg:col-span-1"
                >
                  <Search />
                  Consultar pedido
                </Button>
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Typography variant="overline">Contexto operacional</Typography>
                  <Typography variant="sectionTitle" className="mt-2">
                    Dados da rota e do pedido
                  </Typography>
                </div>
                <span className="rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--shell-muted)]">
                  Nenhum pedido selecionado
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ORDER_CONTEXT.map(({ icon: Icon, label, value }) => (
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

              <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-amber-500/25 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Alerta e contingência</p>
                  <p className="mt-1 text-sm leading-6 opacity-80">
                    A sinalização da ocorrência será exibida aqui quando o contexto do pedido estiver disponível.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel className="p-5 sm:p-6">
              <div>
                <Typography variant="overline">Apontamento de devolução</Typography>
                <Typography variant="sectionTitle" className="mt-2">
                  Registre a ocorrência
                </Typography>
                <Typography variant="supportingText" className="mt-2">
                  Os controles ficam bloqueados neste protótipo até a conexão com o backend.
                </Typography>
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
                    <option value="">Selecione o motivo</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ans-status" className="text-[var(--shell-text)]">
                    Situação do ANS
                  </Label>
                  <Input
                    id="ans-status"
                    disabled
                    value="Aguardando consulta do pedido"
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
                    placeholder="Descreva o que ocorreu no atendimento ao cliente..."
                    className="min-h-32 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] px-3 py-3 text-[var(--shell-text)] placeholder:text-[var(--shell-muted)]"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[color:var(--shell-line)] pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled
                  className="h-11 rounded-xl border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] px-4 text-[var(--shell-text)]"
                >
                  <RotateCcw />
                  Reverter apontamento
                </Button>
                <Button
                  type="button"
                  disabled
                  className="h-11 rounded-xl bg-[var(--shell-contrast)] px-4 text-[var(--shell-contrast-ink)]"
                >
                  <CheckCircle2 />
                  Confirmar devolução
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
              <Typography variant="overline">Integrações previstas</Typography>
              <ul className="mt-4 space-y-3">
                {[
                  "Consulta de cliente e nota fiscal",
                  "Motorista vinculado à rota",
                  "Quantidade de entregas e volumes",
                  "Persistência da decisão e observação",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3.5 py-3 text-sm text-[var(--shell-muted)]"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--shell-accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>
          </aside>
        </div>
    </div>
  );
}

export default function CmeRouteTrackingPage() {
  return (
    <AuthenticatedShell mainClassName="min-h-screen px-4 pb-6 pt-72 min-[440px]:pt-52 sm:px-6 sm:pb-8 lg:pt-32">
      <CmeRouteTrackingContent />
    </AuthenticatedShell>
  );
}
