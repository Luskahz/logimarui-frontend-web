"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildGatewayUrl } from "@/features/app-shell/lib/gatewayUrl";

const FRONTEND_SERVICE_ID = "frontend";
const POLL_INTERVAL_MS = 5_000;

function toErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

async function readJsonResponse(response) {
  const rawText = await response.text();
  let payload = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload?.message || payload?.errorMessage || `Falha HTTP ${response.status}`;

    throw new Error(message);
  }

  return payload;
}

function orderForShutdown(services) {
  return [...services].sort((left, right) => {
    if (left.id === FRONTEND_SERVICE_ID && right.id !== FRONTEND_SERVICE_ID) {
      return 1;
    }

    if (left.id !== FRONTEND_SERVICE_ID && right.id === FRONTEND_SERVICE_ID) {
      return -1;
    }

    return 0;
  });
}

export function useManagedServices() {
  const [overview, setOverview] = useState({
    startup: null,
    services: [],
  });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState("");

  const loadOverview = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setStatus("loading");
    }

    try {
      const payload = await readJsonResponse(
        await fetch(buildGatewayUrl("/admin/services/overview"), {
          cache: "no-store",
        }),
      );

      setOverview({
        startup: payload?.startup ?? null,
        services: Array.isArray(payload?.services) ? payload.services : [],
      });
      setLastLoadedAt(new Date().toISOString());
      setError("");
      setStatus("ready");

      return payload;
    } catch (loadError) {
      setError(toErrorMessage(loadError, "Nao foi possivel consultar o gateway."));

      if (!silent) {
        setStatus("error");
      }

      throw loadError;
    }
  }, []);

  const runPost = useCallback(async (path) => {
    return readJsonResponse(
      await fetch(buildGatewayUrl(path), {
        method: "POST",
      }),
    );
  }, []);

  const runSingleAction = useCallback(
    async (service, action) => {
      const actionLabelMap = {
        start: "Iniciando",
        stop: "Parando",
        restart: "Reiniciando",
      };

      setActionState({
        kind: action,
        label: `${actionLabelMap[action]} ${service.id}`,
        step: 1,
        total: 1,
      });
      setError("");

      try {
        await runPost(`/admin/services/${service.id}/${action}`);
        await loadOverview({ silent: true });
      } catch (actionError) {
        setError(
          toErrorMessage(
            actionError,
            `Falha ao executar ${action} para ${service.id}.`,
          ),
        );
        throw actionError;
      } finally {
        setActionState(null);
      }
    },
    [loadOverview, runPost],
  );

  const runBulkAction = useCallback(
    async ({ services, label, resolveAction }) => {
      if (!services.length) {
        await loadOverview({ silent: true });
        return;
      }

      setError("");

      try {
        for (let index = 0; index < services.length; index += 1) {
          const service = services[index];
          const action = resolveAction(service);

          setActionState({
            kind: action,
            label: `${label}: ${service.id}`,
            step: index + 1,
            total: services.length,
          });

          await runPost(`/admin/services/${service.id}/${action}`);
        }

        await loadOverview({ silent: true });
      } catch (actionError) {
        setError(
          toErrorMessage(
            actionError,
            `Falha ao executar a rotina "${label}".`,
          ),
        );
        throw actionError;
      } finally {
        setActionState(null);
      }
    },
    [loadOverview, runPost],
  );

  useEffect(() => {
    let isMounted = true;
    let intervalId = 0;

    const bootstrap = async () => {
      try {
        await loadOverview();
      } catch {
        // O erro ja foi refletido no estado.
      }

      if (!isMounted) {
        return;
      }

      intervalId = window.setInterval(() => {
        void loadOverview({ silent: true }).catch(() => {
          // O polling silencioso so atualiza o estado.
        });
      }, POLL_INTERVAL_MS);
    };

    void bootstrap();

    return () => {
      isMounted = false;

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [loadOverview]);

  const services = useMemo(() => overview.services || [], [overview.services]);
  const runningCount = useMemo(
    () => services.filter((service) => service.running).length,
    [services],
  );

  const refreshOverview = useCallback(async () => {
    await loadOverview();
  }, [loadOverview]);

  const startSystem = useCallback(async () => {
    await runBulkAction({
      services: services.filter((service) => !service.running),
      label: "Ligando sistema",
      resolveAction: () => "start",
    });
  }, [runBulkAction, services]);

  const stopSystem = useCallback(async () => {
    await runBulkAction({
      services: orderForShutdown(services.filter((service) => service.running)),
      label: "Parando sistema",
      resolveAction: () => "stop",
    });
  }, [runBulkAction, services]);

  const restartSystem = useCallback(async () => {
    await runBulkAction({
      services: orderForShutdown(services),
      label: "Reiniciando sistema",
      resolveAction: (service) => (service.running ? "restart" : "start"),
    });
  }, [runBulkAction, services]);

  return {
    actionState,
    error,
    lastLoadedAt,
    overview,
    refreshOverview,
    restartService: (service) => runSingleAction(service, "restart"),
    restartSystem,
    runningCount,
    services,
    startService: (service) => runSingleAction(service, "start"),
    startSystem,
    status,
    stopService: (service) => runSingleAction(service, "stop"),
    stopSystem,
  };
}
