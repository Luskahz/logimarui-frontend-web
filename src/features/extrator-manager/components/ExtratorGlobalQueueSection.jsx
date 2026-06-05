"use client";

import {
  ClientGroupList,
  GlobalQueueTaskCard,
} from "@/features/extrator-manager/components/GroupedQueueViews";
import {
  ExtratorActionButton as ActionButton,
  ExtratorMetricCard as SummaryCard,
  ExtratorSectionCard as SectionCard,
} from "@/features/extrator-manager/components/ExtratorPageShell";
import { formatDateTime } from "@/features/extrator-manager/lib/extratorFormat";

export default function ExtratorGlobalQueueSection({
  historyPage,
  onCancelGroup,
  onCancelTask,
  payload,
  refreshQueue,
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Atualizado em"
          value={formatDateTime(payload?.updated_at)}
          hint="Horario da ultima leitura da fila global."
        />
        <SummaryCard
          label="Executando"
          value={payload?.summary?.running || 0}
          hint="Tarefas atualmente em execucao."
          tone={payload?.summary?.running ? "accent" : "default"}
        />
        <SummaryCard
          label="Em fila"
          value={payload?.summary?.queued || 0}
          hint="Tarefas aguardando worker."
          tone={payload?.summary?.queued ? "accent" : "default"}
        />
        <SummaryCard
          label="Cancelando"
          value={payload?.summary?.cancelling || 0}
          hint="Cancelamentos administrativos em andamento."
          tone={payload?.summary?.cancelling ? "danger" : "default"}
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
        <SectionCard title="Execucao atual">
          {payload?.executing_task ? (
            <GlobalQueueTaskCard
              task={payload.executing_task}
              onCancelTask={onCancelTask}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[color:var(--shell-line)] px-4 py-5 text-sm text-[var(--shell-muted)]">
              Nenhuma tarefa esta em execucao agora.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Fila global agrupada">
          <ClientGroupList
            emptyMessage="Nao ha itens ativos na fila global neste instante."
            groups={payload?.active_groups || []}
            onCancelGroup={onCancelGroup}
            onCancelTask={onCancelTask}
            scope="active"
          />
        </SectionCard>
      </section>

      <SectionCard
        title="Historico da fila global"
        actions={
          <>
            <ActionButton
              onClick={() =>
                void refreshQueue({ nextHistoryPage: Math.max(1, historyPage - 1) })
              }
              disabled={(payload?.history?.page || 1) <= 1}
            >
              Pagina anterior
            </ActionButton>
            <ActionButton
              onClick={() =>
                void refreshQueue({
                  nextHistoryPage: (payload?.history?.page || 1) + 1,
                })
              }
              disabled={
                (payload?.history?.page || 1) >=
                (payload?.history?.total_pages || 1)
              }
            >
              Proxima pagina
            </ActionButton>
          </>
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard
            label="Total"
            value={payload?.history?.summary?.total || 0}
            hint="Todas as tarefas finalizadas."
          />
          <SummaryCard
            label="Concluidas"
            value={payload?.history?.summary?.completed || 0}
            hint="Execucoes com sucesso."
            tone="accent"
          />
          <SummaryCard
            label="Canceladas"
            value={payload?.history?.summary?.cancelled || 0}
            hint="Canceladas manualmente."
          />
          <SummaryCard
            label="Erro"
            value={payload?.history?.summary?.error || 0}
            hint="Execucoes com falha."
            tone="danger"
          />
        </div>

        <p className="mt-4 text-sm text-[var(--shell-muted)]">
          Pagina {payload?.history?.page || 1} de{" "}
          {payload?.history?.total_pages || 1}
        </p>

        <div className="mt-4 space-y-3">
          <ClientGroupList
            emptyMessage="Nenhum historico consolidado disponivel ainda na fila global."
            groups={payload?.history?.groups || []}
            scope="history"
          />
        </div>
      </SectionCard>
    </>
  );
}
