"use client";

import { useExtratorGlobalQueue } from "@/features/extrator-manager/hooks/useExtratorGlobalQueue";
import { extratorApi } from "@/features/extrator-manager/lib/extratorApi";

export function useExtratorGlobalQueueController({ enabled }) {
  const {
    error,
    historyPage,
    historyPageSize,
    loadingAction,
    payload,
    refreshQueue,
    runAction,
  } = useExtratorGlobalQueue({ enabled });

  async function handleCancelTask(taskId) {
    const password =
      typeof window !== "undefined"
        ? window.prompt("Informe a senha administrativa para cancelar a tarefa.")
        : "";
    if (!password) {
      return;
    }
    await runAction("cancelar tarefa global", () =>
      extratorApi.cancelGlobalTask({ task_id: taskId, senha_admin: password }),
    );
  }

  async function handleCancelGroup(taskIds) {
    const password =
      typeof window !== "undefined"
        ? window.prompt("Informe a senha administrativa para cancelar o grupo.")
        : "";
    if (!password) {
      return;
    }
    await runAction("cancelar grupo global", () =>
      extratorApi.cancelGlobalTask({ task_ids: taskIds, senha_admin: password }),
    );
  }

  return {
    error,
    loadingAction,
    refresh: () => refreshQueue({ nextHistoryPage: historyPage }),
    sectionProps: {
      historyPage,
      historyPageSize,
      onCancelGroup: handleCancelGroup,
      onCancelTask: handleCancelTask,
      payload,
      refreshQueue,
    },
  };
}
