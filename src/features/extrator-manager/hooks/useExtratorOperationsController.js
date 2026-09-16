"use client";

import { useId, useState } from "react";
import { extratorApi } from "@/features/extrator-manager/lib/extratorApi";
import {
  buildHistoryRefreshOptions,
  EMPTY_BATCH_DRAFT,
  EMPTY_OPERATION_FORM,
} from "@/features/extrator-manager/lib/extratorOperations";
import {
  buildDefaultPeriodState,
  buildPeriodArgs,
  derivePeriodState,
  getBasePeriodMeta,
  hydratePeriodStateFromItem,
  serializeTaskForRequest,
} from "@/features/extrator-manager/lib/extratorPeriod";

export function useExtratorOperationsController({
  batchesPayload,
  clientHistoryPayload,
  clientLogPayload,
  loadClientHistory,
  loadingAction,
  openPasswordAction,
  reportsMeta,
  runAction,
  showPendingBeesVerification,
  statusPayload,
}) {
  const [operationFormDraft, setOperationFormDraft] = useState(null);
  const [batchDraft, setBatchDraft] = useState(() => ({
    ...EMPTY_BATCH_DRAFT,
    items: [],
  }));
  const [isClientLogExpanded, setIsClientLogExpanded] = useState(false);
  const [isOperationBaseLocked, setIsOperationBaseLocked] = useState(false);
  const clientTechnicalLogId = useId();
  const bases = statusPayload?.bases || [];
  const defaultOperationBase = bases[0] || "";
  const defaultOperationForm = defaultOperationBase
    ? {
        base: defaultOperationBase,
        ...buildDefaultPeriodState(
          getBasePeriodMeta(reportsMeta, defaultOperationBase),
        ),
      }
    : EMPTY_OPERATION_FORM;
  const hasOperationFormDraft = operationFormDraft !== null;
  const operationFormCandidate = operationFormDraft || defaultOperationForm;
  const operationBase =
    operationFormCandidate.base ||
    (hasOperationFormDraft ? "" : defaultOperationBase);
  const operationPeriodMeta = operationBase
    ? getBasePeriodMeta(reportsMeta, operationBase)
    : null;
  const operationForm = operationBase
    ? {
        ...derivePeriodState(
          { ...operationFormCandidate, base: operationBase },
          operationPeriodMeta,
        ),
        base: operationBase,
      }
    : operationFormCandidate;

  function setOperationForm(nextValue) {
    setOperationFormDraft((currentDraft) => {
      const currentForm = currentDraft || defaultOperationForm;
      const draftUpdate =
        typeof nextValue === "function" ? nextValue(currentForm) : nextValue;
      const mergedForm = { ...currentForm, ...(draftUpdate || {}) };
      const nextBase = mergedForm.base || "";

      if (!nextBase) {
        return { ...EMPTY_OPERATION_FORM, ...(draftUpdate || {}) };
      }

      return {
        ...derivePeriodState(
          { ...mergedForm, base: nextBase },
          getBasePeriodMeta(reportsMeta, nextBase),
        ),
        base: nextBase,
      };
    });
  }

  function updateOperationBase(base) {
    setOperationForm({
      base,
      ...buildDefaultPeriodState(getBasePeriodMeta(reportsMeta, base)),
    });
  }

  function toggleOperationBaseLock() {
    if (!operationForm.base && !isOperationBaseLocked) {
      return;
    }
    setIsOperationBaseLocked((current) => !current);
  }

  function buildOperationRequest() {
    return serializeTaskForRequest(operationForm.base, operationForm);
  }

  async function handleRunSingle() {
    if (showPendingBeesVerification(operationForm.base)) {
      return;
    }

    await runAction(
      "executar rotina",
      () => extratorApi.enqueue(buildOperationRequest()),
      buildHistoryRefreshOptions(clientHistoryPayload),
    );
    if (!isOperationBaseLocked) {
      setOperationFormDraft(EMPTY_OPERATION_FORM);
    }
  }

  function handleAddCurrentToBatch() {
    if (!operationForm.base) {
      return;
    }
    setBatchDraft((currentDraft) => ({
      ...currentDraft,
      items: [...currentDraft.items, buildOperationRequest()],
    }));
  }

  function handleRemoveBatchItem(indexToRemove) {
    setBatchDraft((currentDraft) => ({
      ...currentDraft,
      items: currentDraft.items.filter((_, index) => index !== indexToRemove),
    }));
  }

  function handleLoadBatch(batchId) {
    const batch = (batchesPayload?.saved_batches || []).find(
      (item) => item.id === batchId,
    );
    if (!batch) {
      return;
    }

    setBatchDraft({
      id: batch.id,
      nome: batch.nome || "",
      senha: "",
      items: batch.items || [],
    });
    if (batch.items?.[0]) {
      const firstItem = batch.items[0];
      setOperationForm({
        base: firstItem.base || "",
        ...hydratePeriodStateFromItem(firstItem),
      });
    }
  }

  async function handleRunBatch() {
    const pendingBeesItem = (batchDraft.items || []).find((item) =>
      showPendingBeesVerification(item.base),
    );
    if (pendingBeesItem) {
      return;
    }

    await runAction(
      "executar lote",
      () =>
        extratorApi.enqueueBatch({
          batch_name: batchDraft.nome,
          items: batchDraft.items.map((item) => ({
            base: item.base,
            period_type: item.period_type,
            period_mode: item.period_mode,
            period_args: buildPeriodArgs(hydratePeriodStateFromItem(item)),
          })),
        }),
      buildHistoryRefreshOptions(clientHistoryPayload),
    );
  }

  async function handleSaveBatch() {
    openPasswordAction({
      title: batchDraft.id ? "Editar lote salvo" : "Salvar lote",
      subtitle: batchDraft.id
        ? `Informe a senha cadastrada para atualizar o lote '${batchDraft.nome}'.`
        : `Defina a senha que vai proteger o lote '${batchDraft.nome}'.`,
      label: "Senha do lote",
      placeholder: batchDraft.id
        ? "Obrigatoria para editar o lote"
        : "Obrigatoria para excluir o lote depois",
      submitLabel: batchDraft.id ? "Salvar alteracao" : "Salvar lote",
      requiredMessage: batchDraft.id
        ? "Informe a senha deste lote antes de editar."
        : "Informe a senha para salvar o lote.",
      run: async (password) => {
        const payload = await runAction(
          "salvar lote",
          () =>
            extratorApi.saveBatch({
              id: batchDraft.id || undefined,
              nome: batchDraft.nome,
              senha: password,
              items: batchDraft.items,
            }),
          buildHistoryRefreshOptions(clientHistoryPayload),
        );
        const savedBatch = payload?.saved_batch;
        if (savedBatch) {
          setBatchDraft((currentDraft) => ({
            ...currentDraft,
            id: savedBatch.id || currentDraft.id,
          }));
        }
      },
    });
  }

  async function handleDeleteBatch(batchId) {
    openPasswordAction({
      title: "Excluir lote salvo",
      subtitle: `Informe a senha cadastrada para excluir o lote '${batchDraft.nome || batchId}'.`,
      label: "Senha do lote",
      placeholder: "Obrigatoria para excluir o lote",
      submitLabel: "Excluir lote",
      requiredMessage: "Informe a senha deste lote antes de exclui-lo.",
      run: async (password) => {
        await runAction(
          "excluir lote",
          () => extratorApi.deleteBatch({ id: batchId, senha: password }),
          buildHistoryRefreshOptions(clientHistoryPayload),
        );
        if (batchDraft.id === batchId) {
          setBatchDraft({ ...EMPTY_BATCH_DRAFT, items: [] });
        }
      },
    });
  }

  async function handleCancelTask(taskId) {
    await runAction(
      "cancelar tarefa",
      () => extratorApi.cancelTask({ task_id: taskId }),
      buildHistoryRefreshOptions(clientHistoryPayload),
    );
  }

  async function handleCancelTaskGroup(taskIds) {
    await runAction(
      "cancelar grupo de tarefas",
      () => extratorApi.cancelTask({ task_ids: taskIds }),
      buildHistoryRefreshOptions(clientHistoryPayload),
    );
  }

  async function handleChangeClientHistoryPage(direction) {
    const nextPage = Math.max(
      1,
      (clientHistoryPayload?.page || 1) + direction,
    );
    await loadClientHistory({
      page: nextPage,
      pageSize: clientHistoryPayload?.page_size || 8,
    });
  }

  return {
    sectionProps: {
      bases,
      batchDraft,
      batchesPayload,
      clientHistoryPayload,
      clientLogPayload,
      clientTechnicalLogId,
      handleAddCurrentToBatch,
      handleCancelTask,
      handleCancelTaskGroup,
      handleDeleteBatch,
      handleChangeClientHistoryPage,
      handleLoadBatch,
      handleRemoveBatchItem,
      handleRunBatch,
      handleRunSingle,
      handleSaveBatch,
      isClientLogExpanded,
      isOperationBaseLocked,
      loadingAction,
      operationForm,
      operationPeriodMeta,
      reportsMeta,
      setBatchDraft,
      setIsClientLogExpanded,
      setOperationForm,
      toggleOperationBaseLock,
      updateOperationBase,
    },
  };
}
