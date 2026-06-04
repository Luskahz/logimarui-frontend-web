"use client";

import { useEffect } from "react";
import { useExtratorManagerStore } from "@/features/extrator-manager/store/useExtratorManagerStore";

const REALTIME_POLL_INTERVAL_MS = 5_000;

export function useExtratorManager() {
  const store = useExtratorManagerStore();
  const clientHistoryPayload = useExtratorManagerStore(
    (state) => state.clientHistoryPayload,
  );
  const loadRealtime = useExtratorManagerStore((state) => state.loadRealtime);
  const refreshAll = useExtratorManagerStore((state) => state.refreshAll);
  const historyPage = clientHistoryPayload?.page || 1;
  const historyPageSize = clientHistoryPayload?.page_size || 8;

  useEffect(() => {
    let active = true;
    let intervalId = 0;

    async function bootstrap() {
      try {
        await refreshAll({ historyPage: 1, historyPageSize: 8 });
      } catch {
        // O estado de erro ja foi atualizado na store.
      }

      if (!active) {
        return;
      }

      intervalId = window.setInterval(() => {
        void loadRealtime({
          historyPage,
          historyPageSize,
          silent: true,
        })
          .catch(() => {
            // Polling silencioso.
          });
      }, REALTIME_POLL_INTERVAL_MS);
    }

    void bootstrap();

    return () => {
      active = false;

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [historyPage, historyPageSize, loadRealtime, refreshAll]);

  return {
    ...store,
    loadClientHistory: ({ page = 1, pageSize = 8 } = {}) =>
      store.loadRealtime({
        historyPage: page,
        historyPageSize: pageSize,
        silent: true,
      }),
  };
}
