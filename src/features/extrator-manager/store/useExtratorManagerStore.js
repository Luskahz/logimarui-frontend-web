"use client";

import { create } from "zustand";
import { extratorApi } from "@/features/extrator-manager/lib/extratorApi";

function toErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export const useExtratorManagerStore = create((set, get) => ({
  status: "loading",
  error: "",
  loadingAction: "",
  lastUpdatedAt: "",
  statusPayload: null,
  clientLogPayload: null,
  clientHistoryPayload: null,
  schedulerPayload: null,
  destinationsPayload: null,
  batchesPayload: null,
  requestsPayload: null,

  async loadRealtime({ historyPage = 1, historyPageSize = 8, silent = false } = {}) {
    if (!silent) {
      set({ status: "loading" });
    }

    try {
      const [statusPayload, clientLogPayload, clientHistoryPayload] =
        await Promise.all([
          extratorApi.getStatus(),
          extratorApi.getClientLog(),
          extratorApi.getClientHistory({
            page: historyPage,
            pageSize: historyPageSize,
          }),
        ]);

      set({
        statusPayload,
        clientLogPayload,
        clientHistoryPayload,
        lastUpdatedAt: new Date().toISOString(),
        error: "",
        status: "ready",
      });

      return {
        statusPayload,
        clientLogPayload,
        clientHistoryPayload,
      };
    } catch (loadError) {
      set({
        error: toErrorMessage(
          loadError,
          "Nao foi possivel consultar os dados do extrator.",
        ),
        ...(silent ? {} : { status: "error" }),
      });
      throw loadError;
    }
  },

  async loadAuxiliary() {
    const [
      schedulerPayload,
      destinationsPayload,
      batchesPayload,
      requestsPayload,
    ] = await Promise.all([
      extratorApi.getScheduler(),
      extratorApi.getDestinations(),
      extratorApi.getBatches(),
      extratorApi.getRequests(),
    ]);

    set({
      schedulerPayload,
      destinationsPayload,
      batchesPayload,
      requestsPayload,
    });

    return {
      schedulerPayload,
      destinationsPayload,
      batchesPayload,
      requestsPayload,
    };
  },

  async refreshAll({ historyPage = 1, historyPageSize = 8, silent = false } = {}) {
    if (!silent) {
      set({ status: "loading" });
    }

    try {
      await Promise.all([
        get().loadRealtime({ historyPage, historyPageSize, silent: true }),
        get().loadAuxiliary(),
      ]);

      set({
        error: "",
        status: "ready",
      });
    } catch (loadError) {
      set({
        error: toErrorMessage(
          loadError,
          "Nao foi possivel carregar todos os dados do extrator.",
        ),
        ...(silent ? {} : { status: "error" }),
      });
      throw loadError;
    }
  },

  async runAction(actionLabel, action, refreshOptions) {
    set({
      loadingAction: actionLabel,
      error: "",
    });

    try {
      const result = await action();
      await get().refreshAll({ ...refreshOptions, silent: true });
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
}));
