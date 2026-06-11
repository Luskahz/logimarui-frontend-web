"use client";

import { create } from "zustand";
import { extratorApi } from "@/features/extrator-manager/lib/extratorApi";

function toErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export const useExtratorGlobalQueueStore = create((set, get) => ({
  status: "loading",
  error: "",
  loadingAction: "",
  payload: null,
  historyPage: 1,
  historyPageSize: 10,

  async loadQueue({ nextHistoryPage, nextHistoryPageSize, silent = false } = {}) {
    const historyPage = nextHistoryPage ?? get().historyPage;
    const historyPageSize = nextHistoryPageSize ?? get().historyPageSize;

    if (!silent) {
      set({ status: "loading" });
    }

    try {
      const payload = await extratorApi.getGlobalQueue({
        historyPage,
        historyPageSize,
      });

      set({
        payload,
        historyPage: payload?.history?.page || historyPage,
        historyPageSize: payload?.history?.page_size || historyPageSize,
        error: "",
        status: "ready",
      });

      return payload;
    } catch (loadError) {
      set({
        error: toErrorMessage(
          loadError,
          "Nao foi possivel consultar a fila global do extrator.",
        ),
        ...(silent ? {} : { status: "error" }),
      });
      throw loadError;
    }
  },

  async runAction(actionLabel, action) {
    set({
      loadingAction: actionLabel,
      error: "",
    });

    try {
      const result = await action();
      await get().loadQueue({
        nextHistoryPage: get().historyPage,
        nextHistoryPageSize: get().historyPageSize,
        silent: true,
      });
      return result;
    } catch (actionError) {
      set({
        error: toErrorMessage(
          actionError,
          `Falha ao executar ${actionLabel}.`,
        ),
      });
      throw actionError;
    } finally {
      set({ loadingAction: "" });
    }
  },

  setHistoryPage(historyPage) {
    set({ historyPage });
  },

  setHistoryPageSize(historyPageSize) {
    set({ historyPage: 1, historyPageSize });
  },
}));
