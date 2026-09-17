"use client";

import { useState } from "react";
import {
  BeesVerificationModal,
  PasswordActionModal,
} from "@/features/extrator-manager/ui/ExtratorManagerControls";
import ExtratorDestinationsSection from "@/features/extrator-manager/ui/ExtratorDestinationsSection";
import ExtratorExtractionSection from "@/features/extrator-manager/ui/ExtratorExtractionSection";
import ExtratorGlobalQueueSection from "@/features/extrator-manager/ui/ExtratorGlobalQueueSection";
import ExtratorRequestsSection from "@/features/extrator-manager/ui/ExtratorRequestsSection";
import ExtratorSchedulerSection from "@/features/extrator-manager/ui/ExtratorSchedulerSection";
import ExtratorPageShell, {
  ExtratorActionButton as ActionButton,
} from "@/features/extrator-manager/ui/ExtratorPageShell";
import { normalizeExtratorTabId } from "@/features/extrator-manager/ui/ExtratorSectionNav";
import ExtratorStatusOverview from "@/features/extrator-manager/ui/ExtratorStatusOverview";
import { useBeesVerificationFlow } from "@/features/extrator-manager/model/useBeesVerificationFlow";
import { useExtratorDestinationsController } from "@/features/extrator-manager/model/useExtratorDestinationsController";
import { useExtratorGlobalQueueController } from "@/features/extrator-manager/model/useExtratorGlobalQueueController";
import { useExtratorManager } from "@/features/extrator-manager/model/useExtratorManager";
import { useExtratorOperationsController } from "@/features/extrator-manager/model/useExtratorOperationsController";
import { useExtratorRequestsController } from "@/features/extrator-manager/model/useExtratorRequestsController";
import { useExtratorSchedulerController } from "@/features/extrator-manager/model/useExtratorSchedulerController";
import { usePasswordAction } from "@/features/extrator-manager/model/usePasswordAction";

function getInitialActiveTabFromUrl() {
  if (typeof window === "undefined") {
    return "operacoes";
  }
  return normalizeExtratorTabId(
    new URLSearchParams(window.location.search).get("aba"),
  );
}

export default function ExtratorManagerView() {
  const manager = useExtratorManager();
  const [routeActiveTab] = useState(getInitialActiveTabFromUrl);
  const [activeTabOverride, setActiveTabOverride] = useState(null);
  const activeTab = activeTabOverride || routeActiveTab;
  const reportsMeta = manager.statusPayload?.reports_meta || {};
  const historyPage = manager.clientHistoryPayload?.page || 1;
  const historyPageSize = manager.clientHistoryPayload?.page_size || 8;
  const passwordAction = usePasswordAction();
  const beesVerification = useBeesVerificationFlow({
    beesAuthStatus: manager.statusPayload?.bees_auth || {},
    historyPage,
    historyPageSize,
    refreshAll: manager.refreshAll,
    reportsMeta,
  });
  const operations = useExtratorOperationsController({
    batchesPayload: manager.batchesPayload,
    clientHistoryPayload: manager.clientHistoryPayload,
    clientLogPayload: manager.clientLogPayload,
    loadClientHistory: manager.loadClientHistory,
    loadingAction: manager.loadingAction,
    openPasswordAction: passwordAction.open,
    reportsMeta,
    runAction: manager.runAction,
    showPendingBeesVerification: beesVerification.showPending,
    statusPayload: manager.statusPayload,
  });
  const scheduler = useExtratorSchedulerController({
    active: activeTab === "scheduler",
    clientHistoryPayload: manager.clientHistoryPayload,
    loadingAction: manager.loadingAction,
    loadScheduler: manager.loadScheduler,
    openPasswordAction: passwordAction.open,
    reportsMeta,
    runAction: manager.runAction,
    schedulerPayload: manager.schedulerPayload,
    status: manager.status,
  });
  const destinations = useExtratorDestinationsController({
    active: activeTab === "destinos",
    clientHistoryPayload: manager.clientHistoryPayload,
    destinationsPayload: manager.destinationsPayload,
    loadDestinations: manager.loadDestinations,
    loadingAction: manager.loadingAction,
    openPasswordAction: passwordAction.open,
    runAction: manager.runAction,
    status: manager.status,
  });
  const requests = useExtratorRequestsController({
    active: activeTab === "solicitacoes",
    clientHistoryPayload: manager.clientHistoryPayload,
    loadingAction: manager.loadingAction,
    loadRequests: manager.loadRequests,
    openPasswordAction: passwordAction.open,
    requestsPayload: manager.requestsPayload,
    runAction: manager.runAction,
    status: manager.status,
  });
  const globalQueue = useExtratorGlobalQueueController({
    enabled: activeTab === "globalQueue",
  });
  const isGlobalQueue = activeTab === "globalQueue";

  return (
    <ExtratorPageShell
      title="Extrator"
      activeTab={activeTab}
      onTabChange={setActiveTabOverride}
      error={isGlobalQueue ? globalQueue.error || manager.error : manager.error}
      actions={
        isGlobalQueue ? (
          <ActionButton
            onClick={() => void globalQueue.refresh()}
            disabled={Boolean(globalQueue.loadingAction)}
          >
            Atualizar fila
          </ActionButton>
        ) : (
          <ActionButton
            onClick={() =>
              void manager.refreshAll({ historyPage, historyPageSize })
            }
            disabled={
              manager.status === "loading" || Boolean(manager.loadingAction)
            }
          >
            Atualizar tudo
          </ActionButton>
        )
      }
      headerAfter={
        <ExtratorStatusOverview
          lastUpdatedAt={manager.lastUpdatedAt}
          statusPayload={manager.statusPayload}
        />
      }
    >
      {activeTab === "operacoes" ? (
        <ExtratorExtractionSection {...operations.sectionProps} />
      ) : null}
      {activeTab === "scheduler" && scheduler.isReady ? (
        <ExtratorSchedulerSection {...scheduler.sectionProps} />
      ) : null}
      {activeTab === "destinos" && destinations.isReady ? (
        <ExtratorDestinationsSection {...destinations.sectionProps} />
      ) : null}
      {activeTab === "solicitacoes" && requests.isReady ? (
        <ExtratorRequestsSection {...requests.sectionProps} />
      ) : null}
      {isGlobalQueue ? (
        <ExtratorGlobalQueueSection {...globalQueue.sectionProps} />
      ) : null}

      <BeesVerificationModal {...beesVerification.modalProps} />
      <PasswordActionModal {...passwordAction.modalProps} />
    </ExtratorPageShell>
  );
}
