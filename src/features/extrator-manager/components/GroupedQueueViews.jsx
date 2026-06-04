"use client";

import { useState } from "react";

function clampPercent(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return Math.max(0, Math.min(100, numericValue));
}

function getStatusTone(status) {
  const normalizedStatus = String(status || "").trim();

  if (normalizedStatus === "running") {
    return "running";
  }
  if (normalizedStatus === "cancelling" || normalizedStatus === "cancelled") {
    return "cancelling";
  }
  if (
    normalizedStatus === "error" ||
    normalizedStatus === "completed_with_errors"
  ) {
    return "error";
  }
  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "completed_no_file"
  ) {
    return "done";
  }
  return "queued";
}

function getStatusChipClass(status) {
  const tone = getStatusTone(status);
  if (tone === "running" || tone === "done") {
    return "border-[color:rgba(78,225,208,0.4)] bg-[rgba(46,204,188,0.12)] text-[var(--shell-accent)]";
  }
  if (tone === "cancelling") {
    return "border-[color:rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.12)] text-[rgb(255,190,127)]";
  }
  if (tone === "error") {
    return "border-[color:rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] text-[rgb(255,162,162)]";
  }
  return "border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] text-[var(--shell-muted)]";
}

function getProgressBarClass(status) {
  const tone = getStatusTone(status);
  if (tone === "running" || tone === "done") {
    return "bg-[linear-gradient(90deg,#53e5da_0%,#f4d47b_100%)]";
  }
  if (tone === "cancelling") {
    return "bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)]";
  }
  if (tone === "error") {
    return "bg-[linear-gradient(90deg,#ef4444_0%,#f97316_100%)]";
  }
  return "bg-[linear-gradient(90deg,#7dd3fc_0%,#53e5da_100%)]";
}

function canCancelProgressTask(task) {
  return ["queued", "running"].includes(String(task?.status || "").trim());
}

function canCancelGlobalTask(task) {
  return ["queued", "running", "cancelling"].includes(
    String(task?.status || "").trim(),
  );
}

function progressCancelLabel(task) {
  return String(task?.status || "").trim() === "running"
    ? "Interromper"
    : "Cancelar";
}

function globalCancelLabel(task) {
  return String(task?.status || "").trim() === "queued"
    ? "Cancelar item"
    : "Interromper item";
}

function buildProgressMetaParts(task) {
  const parts = [];
  if (task?.request_label) {
    parts.push(`Solicitacao: ${task.request_label}`);
  }
  if (task?.queue_position) {
    parts.push(`Fila #${task.queue_position}`);
  }
  if (task?.updated_at) {
    parts.push(`Atualizado em ${task.updated_at}`);
  }
  return parts;
}

function buildGlobalMetaParts(task) {
  const parts = [];
  if (task?.request_label) {
    parts.push({ label: "Solicitacao", value: task.request_label });
  }
  if (task?.request_source_label) {
    parts.push({ label: "Origem", value: task.request_source_label });
  }
  if (task?.queued_at) {
    parts.push({ label: "Entrou na fila", value: task.queued_at });
  }
  if (task?.updated_at) {
    parts.push({ label: "Atualizado em", value: task.updated_at });
  }
  return parts;
}

function buildSummaryEntries(summary = {}, variant = "progress") {
  const queuedLabel = variant === "global" ? "Fila" : "Na fila";
  const entries = [];

  if (summary.total) {
    entries.push({
      label: `${summary.total} item(ns)`,
      className:
        "border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] text-[var(--shell-text)]",
    });
  }
  if (summary.running) {
    entries.push({
      label: `Executando: ${summary.running}`,
      className:
        "border-[color:rgba(78,225,208,0.4)] bg-[rgba(46,204,188,0.12)] text-[var(--shell-accent)]",
    });
  }
  if (summary.cancelling) {
    entries.push({
      label: `Cancelando: ${summary.cancelling}`,
      className:
        "border-[color:rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.12)] text-[rgb(255,190,127)]",
    });
  }
  if (summary.queued) {
    entries.push({
      label: `${queuedLabel}: ${summary.queued}`,
      className:
        "border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] text-[var(--shell-muted)]",
    });
  }
  if (summary.completed) {
    entries.push({
      label: `Concluidas: ${summary.completed}`,
      className:
        "border-[color:rgba(78,225,208,0.4)] bg-[rgba(46,204,188,0.12)] text-[var(--shell-accent)]",
    });
  }
  if (summary.cancelled) {
    entries.push({
      label: `Canceladas: ${summary.cancelled}`,
      className:
        "border-[color:rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.12)] text-[rgb(255,190,127)]",
    });
  }
  if (summary.error) {
    entries.push({
      label: `Erros: ${summary.error}`,
      className:
        "border-[color:rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.12)] text-[rgb(255,162,162)]",
    });
  }
  return entries;
}

function SummaryBadgeRow({ summary, variant = "progress" }) {
  const entries = buildSummaryEntries(summary, variant);
  if (!entries.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {entries.map((entry) => (
        <span
          key={entry.label}
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${entry.className}`}
        >
          {entry.label}
        </span>
      ))}
    </div>
  );
}

export function RunSummaryPill({ label, note, tone = "default", value }) {
  const toneClass =
    tone === "running"
      ? "border-[color:rgba(78,225,208,0.35)] bg-[rgba(18,52,57,0.5)]"
      : tone === "cancelling"
        ? "border-[color:rgba(251,146,60,0.28)] bg-[rgba(69,34,17,0.45)]"
        : "border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)]";

  return (
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-[var(--shell-text)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">{note}</p>
    </article>
  );
}

function LocalProgressTaskCard({ onCancelTask, task }) {
  const allowCancel = canCancelProgressTask(task) && typeof onCancelTask === "function";
  const metaParts = buildProgressMetaParts(task);

  return (
    <article className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-[var(--shell-text)]">
            {task?.title || task?.base || "Rotina"}
          </h4>
          <p className="mt-1 text-sm leading-6 text-[var(--shell-muted)]">
            {task?.detail || "A rotina esta sendo processada no servidor."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusChipClass(task?.status)}`}
          >
            {task?.status_label || task?.status || "Pendente"}
          </span>
          {allowCancel ? (
            <button
              type="button"
              onClick={() => onCancelTask(task.task_id)}
              className="inline-flex rounded-xl border border-[color:rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.08)] px-4 py-2 text-sm font-semibold text-[rgb(255,204,176)] transition hover:bg-[rgba(251,146,60,0.16)]"
            >
              {progressCancelLabel(task)}
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[rgba(255,255,255,0.08)]">
        <div
          className={`h-full rounded-full transition-all ${getProgressBarClass(task?.status)}`}
          style={{ width: `${clampPercent(task?.percent)}%` }}
        />
      </div>
      {metaParts.length ? (
        <p className="mt-3 text-sm leading-6 text-[var(--shell-muted)]">
          {metaParts.join(" | ")}
        </p>
      ) : null}
    </article>
  );
}

export function GlobalQueueTaskCard({ onCancelTask, task }) {
  const taskStatus = String(task?.status || "").trim();
  const canAct = canCancelGlobalTask(task) && typeof onCancelTask === "function";
  const isCancelling = taskStatus === "cancelling";
  const metaParts = buildGlobalMetaParts(task);

  return (
    <article
      className={`rounded-2xl border p-4 ${
        taskStatus === "running"
          ? "border-[color:rgba(78,225,208,0.35)] bg-[rgba(18,52,57,0.3)]"
          : taskStatus === "cancelling"
            ? "border-[color:rgba(251,146,60,0.28)] bg-[rgba(69,34,17,0.28)]"
            : "border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-[var(--shell-text)]">
            {task?.title || task?.base || "Rotina"}
          </h4>
          <p className="mt-1 text-sm leading-6 text-[var(--shell-muted)]">
            {task?.detail || "A rotina esta sendo processada no servidor."}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusChipClass(task?.status)}`}
        >
          {task?.status_label || task?.status || "Ativa"}
        </span>
      </div>

      {metaParts.length ? (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--shell-muted)]">
          {metaParts.map((item) => (
            <span key={`${item.label}-${item.value}`}>
              <strong className="font-semibold text-[var(--shell-text)]">
                {item.label}:
              </strong>{" "}
              {item.value}
            </span>
          ))}
        </div>
      ) : null}

      {canAct ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={isCancelling ? undefined : () => onCancelTask(task.task_id)}
            disabled={isCancelling}
            className={`inline-flex rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              isCancelling
                ? "cursor-not-allowed border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] text-[var(--shell-muted)]"
                : "border-[color:rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.08)] text-[rgb(255,204,176)] hover:bg-[rgba(251,146,60,0.16)]"
            }`}
          >
            {isCancelling ? "Interrupcao solicitada" : globalCancelLabel(task)}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function GroupSummaryHeader({
  actionLabel,
  badgesVariant,
  copy,
  defaultOpen,
  nestedContent,
  onAction,
  storageKey,
  sublabel,
  summary,
  title,
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (!storageKey || typeof window === "undefined") {
      return defaultOpen;
    }

    const storedValue = window.localStorage.getItem(
      `extrator-manager:queue-group:${storageKey}`,
    );

    if (storedValue === "open") {
      return true;
    }

    if (storedValue === "closed") {
      return false;
    }

    return defaultOpen;
  });

  function handleToggle(event) {
    const nextOpen = event.currentTarget.open;
    setIsOpen(nextOpen);

    if (storageKey && typeof window !== "undefined") {
      window.localStorage.setItem(
        `extrator-manager:queue-group:${storageKey}`,
        nextOpen ? "open" : "closed",
      );
    }
  }

  return (
    <details
      open={isOpen}
      onToggle={handleToggle}
      className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)]"
    >
      <summary className="list-none cursor-pointer px-4 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            {sublabel ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
                {sublabel}
              </p>
            ) : null}
            <h3 className="mt-1 text-2xl font-semibold text-[var(--shell-text)]">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--shell-muted)]">
              {copy}
            </p>
          </div>
        </div>
        <SummaryBadgeRow summary={summary} variant={badgesVariant} />
      </summary>
      <div className="space-y-3 px-4 pb-4">
        {onAction ? (
          <div>
            <button
              type="button"
              onClick={onAction}
              className="inline-flex rounded-xl border border-[color:rgba(251,146,60,0.35)] bg-[rgba(251,146,60,0.08)] px-4 py-2 text-sm font-semibold text-[rgb(255,204,176)] transition hover:bg-[rgba(251,146,60,0.16)]"
            >
              {actionLabel}
            </button>
          </div>
        ) : null}
        <div className="space-y-3">
          {nestedContent.length ? (
            nestedContent
          ) : (
            <div className="rounded-2xl border border-dashed border-[color:var(--shell-line)] px-4 py-5 text-sm text-[var(--shell-muted)]">
              Nenhum item neste agrupamento.
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

function MonthGroupPanel({
  group,
  onCancelGroup,
  onCancelTask,
  taskVariant = "progress",
}) {
  const defaultOpen = true;
  const actionHandler =
    group?.cancelable_task_ids?.length && typeof onCancelGroup === "function"
      ? () => onCancelGroup(group.cancelable_task_ids)
      : null;
  const nestedTasks = (group?.tasks || []).map((task) =>
    taskVariant === "global" ? (
      <GlobalQueueTaskCard
        key={task.task_id}
        task={task}
        onCancelTask={onCancelTask}
      />
    ) : (
      <LocalProgressTaskCard
        key={task.task_id}
        task={task}
        onCancelTask={onCancelTask}
      />
    ),
  );

  return (
    <GroupSummaryHeader
      actionLabel="Cancelar mes agrupado"
      badgesVariant={taskVariant === "global" ? "global" : "progress"}
      copy={`${group?.task_count || 0} execucao(oes) diaria(s) desta rotina neste mes.`}
      defaultOpen={defaultOpen}
      nestedContent={nestedTasks}
      onAction={actionHandler}
      storageKey={`month:${taskVariant}:${group?.id || group?.label || "sem-id"}`}
      sublabel="Agrupamento mensal"
      summary={group?.summary || {}}
      title={group?.label || "Mes"}
    />
  );
}

function RoutineGroupPanel({
  group,
  onCancelGroup,
  onCancelTask,
  scope = "progress",
  taskVariant = "progress",
}) {
  const actionHandler =
    group?.cancelable_task_ids?.length && typeof onCancelGroup === "function"
      ? () => onCancelGroup(group.cancelable_task_ids)
      : null;
  const nestedContent = [];

  if (Array.isArray(group?.month_groups) && group.month_groups.length) {
    nestedContent.push(
      ...group.month_groups.map((monthGroup) => (
        <MonthGroupPanel
          key={monthGroup.id}
          group={monthGroup}
          onCancelGroup={onCancelGroup}
          onCancelTask={onCancelTask}
          taskVariant={taskVariant}
        />
      )),
    );
  }

  if (Array.isArray(group?.tasks) && group.tasks.length) {
    nestedContent.push(
      ...group.tasks.map((task) =>
        taskVariant === "global" ? (
          <GlobalQueueTaskCard
            key={task.task_id}
            task={task}
            onCancelTask={onCancelTask}
          />
        ) : (
          <LocalProgressTaskCard
            key={task.task_id}
            task={task}
            onCancelTask={onCancelTask}
          />
        ),
      ),
    );
  }

  return (
    <GroupSummaryHeader
      actionLabel="Cancelar agrupamento"
      badgesVariant={taskVariant === "global" ? "global" : "progress"}
      copy={`${group?.task_count || 0} item(ns) agrupado(s) ${
        taskVariant === "global" ? "nesta rotina." : "para esta rotina."
      }`}
      defaultOpen={scope !== "history"}
      nestedContent={nestedContent}
      onAction={actionHandler}
      storageKey={`routine:${scope}:${taskVariant}:${group?.id || group?.label || group?.base || "sem-id"}`}
      summary={group?.summary || {}}
      title={group?.label || group?.base || "Rotina"}
    />
  );
}

export function RoutineGroupList({
  emptyMessage,
  groups,
  onCancelGroup,
  onCancelTask,
  scope = "progress",
  taskVariant = "progress",
}) {
  if (!groups?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--shell-line)] px-4 py-5 text-sm text-[var(--shell-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <RoutineGroupPanel
          key={group.id}
          group={group}
          onCancelGroup={onCancelGroup}
          onCancelTask={onCancelTask}
          scope={scope}
          taskVariant={taskVariant}
        />
      ))}
    </div>
  );
}

function ClientGroupPanel({
  group,
  onCancelGroup,
  onCancelTask,
  scope = "active",
  taskVariant = "global",
}) {
  const nestedContent = (group?.routine_groups || []).map((routineGroup) => (
    <RoutineGroupPanel
      key={routineGroup.id}
      group={routineGroup}
      onCancelGroup={onCancelGroup}
      onCancelTask={onCancelTask}
      scope={scope}
      taskVariant={taskVariant}
    />
  ));

  return (
    <GroupSummaryHeader
      badgesVariant="global"
      copy={`${group?.task_count || 0} item(ns) vinculados a este cliente.`}
      defaultOpen={scope !== "history"}
      nestedContent={nestedContent}
      storageKey={`client:${scope}:${group?.id || group?.label || group?.requested_ip || "sem-id"}`}
      sublabel="Cliente / IP"
      summary={group?.summary || {}}
      title={group?.label || group?.requested_ip || "Cliente"}
    />
  );
}

export function ClientGroupList({
  emptyMessage,
  groups,
  onCancelGroup,
  onCancelTask,
  scope = "active",
}) {
  if (!groups?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--shell-line)] px-4 py-5 text-sm text-[var(--shell-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <ClientGroupPanel
          key={group.id}
          group={group}
          onCancelGroup={onCancelGroup}
          onCancelTask={onCancelTask}
          scope={scope}
        />
      ))}
    </div>
  );
}
