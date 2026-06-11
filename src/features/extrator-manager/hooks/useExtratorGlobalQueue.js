"use client";

import { useEffect } from "react";
import { useExtratorGlobalQueueStore } from "@/features/extrator-manager/store/useExtratorGlobalQueueStore";

const POLL_INTERVAL_MS = 5_000;

export function useExtratorGlobalQueue({ enabled = true } = {}) {
  const store = useExtratorGlobalQueueStore();
  const historyPage = useExtratorGlobalQueueStore((state) => state.historyPage);
  const historyPageSize = useExtratorGlobalQueueStore(
    (state) => state.historyPageSize,
  );
  const loadQueue = useExtratorGlobalQueueStore((state) => state.loadQueue);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let active = true;
    let intervalId = 0;

    async function bootstrap() {
      try {
        await loadQueue({
          nextHistoryPage: historyPage,
          nextHistoryPageSize: historyPageSize,
        });
      } catch {
        // O estado de erro ja foi atualizado na store.
      }

      if (!active) {
        return;
      }

      intervalId = window.setInterval(() => {
        void loadQueue({
          nextHistoryPage: historyPage,
          nextHistoryPageSize: historyPageSize,
          silent: true,
        })
          .catch(() => {
            // Polling silencioso.
          });
      }, POLL_INTERVAL_MS);
    }

    void bootstrap();

    return () => {
      active = false;

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [enabled, historyPage, historyPageSize, loadQueue]);

  return {
    ...store,
    refreshQueue: ({
      nextHistoryPage = historyPage,
      nextHistoryPageSize = historyPageSize,
      silent = false,
    } = {}) =>
      loadQueue({ nextHistoryPage, nextHistoryPageSize, silent }),
  };
}
