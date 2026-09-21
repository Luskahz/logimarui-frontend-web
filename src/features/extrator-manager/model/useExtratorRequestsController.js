"use client";

import { useEffect, useState } from "react";
import { extratorApi } from "@/features/extrator-manager/api/extratorApi";
import { buildHistoryRefreshOptions } from "@/features/extrator-manager/lib/extratorOperations";
import {
  buildRequestDefaultForm,
  serializeRequestForm,
} from "@/features/extrator-manager/lib/extratorRequests";

export function useExtratorRequestsController({
  active,
  clientHistoryPayload,
  loadingAction,
  loadRequests,
  openPasswordAction,
  requestsPayload,
  runAction,
  status,
}) {
  const [formDraft, setFormDraft] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const requestMeta = requestsPayload?.request_meta || null;
  const defaultForm = requestMeta ? buildRequestDefaultForm(requestMeta) : null;
  const formCandidate = formDraft || defaultForm;
  const sourceOptions =
    requestMeta?.source_options_by_type?.[formCandidate?.tipoSolicitacao] ||
    requestMeta?.source_options ||
    [];
  const updateOptions =
    requestMeta?.update_options_by_type?.[formCandidate?.tipoSolicitacao] ||
    requestMeta?.update_options ||
    [];
  const form = formCandidate
    ? {
        ...formCandidate,
        origemTipo: sourceOptions.some(
          (option) => option.id === formCandidate.origemTipo,
        )
          ? formCandidate.origemTipo
          : sourceOptions[0]?.id || "",
        atualizacaoTipo: updateOptions.some(
          (option) => option.id === formCandidate.atualizacaoTipo,
        )
          ? formCandidate.atualizacaoTipo
          : updateOptions[0]?.id || "",
      }
    : null;
  const selectedRequest = (requestsPayload?.requests || []).find(
    (requestItem) => requestItem.id === selectedRequestId,
  );
  const hasPayload = Boolean(requestsPayload);

  useEffect(() => {
    if (!active || !hasPayload) {
      return;
    }
    void loadRequests({ page, pageSize }).catch(() => {});
  }, [active, hasPayload, loadRequests, page, pageSize]);

  function setForm(nextValue) {
    setFormDraft((currentDraft) => {
      const currentForm = currentDraft || defaultForm;
      if (!currentForm) {
        return currentDraft;
      }
      const draftUpdate =
        typeof nextValue === "function" ? nextValue(currentForm) : nextValue;
      const mergedForm = { ...currentForm, ...(draftUpdate || {}) };
      const nextSourceOptions =
        requestMeta?.source_options_by_type?.[mergedForm.tipoSolicitacao] ||
        requestMeta?.source_options ||
        [];
      const nextUpdateOptions =
        requestMeta?.update_options_by_type?.[mergedForm.tipoSolicitacao] ||
        requestMeta?.update_options ||
        [];
      return {
        ...mergedForm,
        origemTipo: nextSourceOptions.some(
          (option) => option.id === mergedForm.origemTipo,
        )
          ? mergedForm.origemTipo
          : nextSourceOptions[0]?.id || "",
        atualizacaoTipo: nextUpdateOptions.some(
          (option) => option.id === mergedForm.atualizacaoTipo,
        )
          ? mergedForm.atualizacaoTipo
          : nextUpdateOptions[0]?.id || "",
      };
    });
  }

  function syncRequestType(nextType) {
    const nextSourceOptions =
      requestMeta?.source_options_by_type?.[nextType] ||
      requestMeta?.source_options ||
      [];
    const nextUpdateOptions =
      requestMeta?.update_options_by_type?.[nextType] ||
      requestMeta?.update_options ||
      [];
    setForm((currentForm) => ({
      ...currentForm,
      tipoSolicitacao: nextType,
      origemTipo: nextSourceOptions[0]?.id || "",
      origemDetalhe: "",
      atualizacaoTipo: nextUpdateOptions[0]?.id || "",
      atualizacaoDetalhe: "",
    }));
  }

  async function handleSaveRequest() {
    await runAction(
      "salvar solicitacao",
      () => extratorApi.saveRequest(serializeRequestForm(form)),
      buildHistoryRefreshOptions(clientHistoryPayload),
    );
    setForm(buildRequestDefaultForm(requestMeta));
    setIsCreateModalOpen(false);
  }

  async function handleUpdateRequestStatus(requestId, nextStatus) {
    const requestItem = (requestsPayload?.requests || []).find(
      (item) => item.id === requestId,
    );
    const statusLabel =
      (requestMeta?.status_options || []).find((item) => item.id === nextStatus)
        ?.label || nextStatus;
    openPasswordAction({
      title: `Alterar status para ${statusLabel}`,
      subtitle: `Informe a senha do administrador para atualizar a solicitacao '${requestItem?.rotina_nome || requestId}'.`,
      label: "Senha do administrador",
      placeholder: "Obrigatoria para alterar o status",
      submitLabel: statusLabel,
      requiredMessage:
        "Informe a senha de administrador para alterar o status da solicitacao.",
      run: async (password) => {
        await runAction(
          "alterar status da solicitacao",
          () =>
            extratorApi.updateRequestStatus({
              id: requestId,
              status: nextStatus,
              senha_admin: password,
            }),
          buildHistoryRefreshOptions(clientHistoryPayload),
        );
      },
    });
  }

  return {
    isReady: Boolean(form),
    sectionProps: {
      handleSaveRequest,
      handleUpdateRequestStatus,
      isRequestCreateModalOpen: isCreateModalOpen,
      loadingAction,
      onRefresh: () => loadRequests({ page, pageSize }),
      requestForm: form,
      requestMeta,
      requestsPayload,
      requestSourceOptions: sourceOptions,
      requestUpdateOptions: updateOptions,
      selectedRequest,
      setIsRequestCreateModalOpen: setIsCreateModalOpen,
      setRequestForm: setForm,
      setRequestsPage: setPage,
      setRequestsPageSize: (nextPageSize) => {
        setPage(1);
        setPageSize(nextPageSize);
      },
      setSelectedRequestId,
      status,
      syncRequestType,
    },
  };
}
