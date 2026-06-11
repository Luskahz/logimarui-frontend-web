"use client";

import { create } from "zustand";
import { extratorApi } from "@/features/extrator-manager/lib/extratorApi";

function toErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

const DEFAULT_LIST_QUERY = Object.freeze({
  page: 1,
  pageSize: 10,
  filters: {},
});
let schedulerRequestSequence = 0;
let destinationsRequestSequence = 0;
let requestsRequestSequence = 0;

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
  schedulerQuery: DEFAULT_LIST_QUERY,
  destinationsQuery: DEFAULT_LIST_QUERY,
  requestsQuery: DEFAULT_LIST_QUERY,

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

  async loadScheduler(query = get().schedulerQuery) {
    const requestSequence = ++schedulerRequestSequence;
    const schedulerQuery = {
      ...DEFAULT_LIST_QUERY,
      ...query,
      filters: query?.filters || {},
    };
    const schedulerPayload = await extratorApi.getScheduler(schedulerQuery);
    if (requestSequence !== schedulerRequestSequence) {
      return schedulerPayload;
    }
    set({ schedulerPayload, schedulerQuery });
    return schedulerPayload;
  },

  async loadDestinations(query = get().destinationsQuery) {
    const requestSequence = ++destinationsRequestSequence;
    const destinationsQuery = {
      ...DEFAULT_LIST_QUERY,
      ...query,
      filters: query?.filters || {},
    };
    const destinationsPayload =
      await extratorApi.getDestinations(destinationsQuery);
    if (requestSequence !== destinationsRequestSequence) {
      return destinationsPayload;
    }
    set({ destinationsPayload, destinationsQuery });
    return destinationsPayload;
  },

  async loadRequests(query = get().requestsQuery) {
    const requestSequence = ++requestsRequestSequence;
    const requestsQuery = {
      ...DEFAULT_LIST_QUERY,
      ...query,
    };
    const requestsPayload = await extratorApi.getRequests(requestsQuery);
    if (requestSequence !== requestsRequestSequence) {
      return requestsPayload;
    }
    set({ requestsPayload, requestsQuery });
    return requestsPayload;
  },

  async loadAuxiliary() {
    const [
      schedulerPayload,
      destinationsPayload,
      batchesPayload,
      requestsPayload,
    ] = await Promise.all([
      get().loadScheduler(),
      get().loadDestinations(),
      extratorApi.getBatches(),
      get().loadRequests(),
    ]);

    set({
      batchesPayload,
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
