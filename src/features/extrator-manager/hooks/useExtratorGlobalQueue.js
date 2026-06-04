"use client";

import { useEffect } from "react";
import { useExtratorGlobalQueueStore } from "@/features/extrator-manager/store/useExtratorGlobalQueueStore";

const POLL_INTERVAL_MS = 5_000;

export function useExtratorGlobalQueue() {
  const store = useExtratorGlobalQueueStore();
  const historyPage = useExtratorGlobalQueueStore((state) => state.historyPage);
  const loadQueue = useExtratorGlobalQueueStore((state) => state.loadQueue);

  useEffect(() => {
    let active = true;
    let intervalId = 0;

    async function bootstrap() {
      try {
        await loadQueue({ nextHistoryPage: 1 });
      } catch {
        // O estado de erro ja foi atualizado na store.
      }

      if (!active) {
        return;
      }

      intervalId = window.setInterval(() => {
        void loadQueue({
          nextHistoryPage: historyPage,
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
  }, [historyPage, loadQueue]);

  return {
    ...store,
    refreshQueue: ({ nextHistoryPage = historyPage, silent = false } = {}) =>
      loadQueue({ nextHistoryPage, silent }),
  };
}
