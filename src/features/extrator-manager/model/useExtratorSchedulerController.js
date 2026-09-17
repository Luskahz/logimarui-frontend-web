"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/features/extrator-manager/model/useDebouncedValue";
import { extratorApi } from "@/features/extrator-manager/api/extratorApi";
import { formatDateTime } from "@/features/extrator-manager/lib/extratorFormat";
import {
  FILTER_ALL_VALUE,
  formatCountLabel,
  toBooleanLabel,
} from "@/features/extrator-manager/lib/extratorOptions";
import {
  buildHistoryRefreshOptions,
} from "@/features/extrator-manager/lib/extratorOperations";
import { derivePeriodState, getBasePeriodMeta } from "@/features/extrator-manager/lib/extratorPeriod";
import {
  buildSchedulerDefaultForm,
  buildSchedulerFormFromRule,
  DEFAULT_SCHEDULER_FILTERS,
  schedulerIntervalLabel,
  schedulerPeriodLabel,
  schedulerScheduleLabel,
  serializeSchedulerForm,
} from "@/features/extrator-manager/lib/extratorScheduler";

export function useExtratorSchedulerController({
  active,
  clientHistoryPayload,
  loadingAction,
  loadScheduler,
  openPasswordAction,
  reportsMeta,
  runAction,
  schedulerPayload,
  status,
}) {
  const [formDraft, setFormDraft] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_SCHEDULER_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedFilters = useDebouncedValue(filters);
  const schedulerMeta = schedulerPayload?.scheduler_meta || null;
  const defaultForm = schedulerMeta
    ? buildSchedulerDefaultForm(schedulerMeta)
    : null;
  const formCandidate = formDraft || defaultForm;
  const periodMeta = formCandidate
    ? formCandidate.targetType === "all"
      ? schedulerMeta?.all_period_meta
      : getBasePeriodMeta(reportsMeta, formCandidate.base)
    : null;
  const form = formCandidate
    ? derivePeriodState(formCandidate, periodMeta)
    : null;
  const hasPayload = Boolean(schedulerPayload);

  useEffect(() => {
    if (!active || !hasPayload) {
      return;
    }
    void loadScheduler({ page, pageSize, filters: debouncedFilters }).catch(
      () => {},
    );
  }, [active, debouncedFilters, hasPayload, loadScheduler, page, pageSize]);

  function setForm(nextValue) {
    setFormDraft((currentDraft) => {
      const currentForm = currentDraft || defaultForm;
      if (!currentForm) {
        return currentDraft;
      }
      const draftUpdate =
        typeof nextValue === "function" ? nextValue(currentForm) : nextValue;
      const mergedForm = { ...currentForm, ...(draftUpdate || {}) };
      const nextPeriodMeta =
        mergedForm.targetType === "all"
          ? schedulerMeta?.all_period_meta
          : getBasePeriodMeta(reportsMeta, mergedForm.base);
      return derivePeriodState(mergedForm, nextPeriodMeta);
    });
  }

  function syncForm(nextForm) {
    const nextPeriodMeta =
      nextForm.targetType === "all"
        ? schedulerMeta?.all_period_meta
        : getBasePeriodMeta(reportsMeta, nextForm.base);
    setForm({ ...nextForm, ...derivePeriodState(nextForm, nextPeriodMeta) });
  }

  function openCreateModal() {
    setForm(buildSchedulerDefaultForm(schedulerMeta));
    setIsModalOpen(true);
  }

  function openEditModal(rule) {
    setForm(buildSchedulerFormFromRule(rule));
    setIsModalOpen(true);
  }

  function resetFilters() {
    setPage(1);
    setFilters(DEFAULT_SCHEDULER_FILTERS);
  }

  function updateFilters(updater) {
    setPage(1);
    setFilters(updater);
  }

  async function handleSaveRule() {
    openPasswordAction({
      title: form.id ? "Atualizar regra do scheduler" : "Criar regra do scheduler",
      subtitle: form.id
        ? `Informe a senha cadastrada para atualizar a regra '${form.base || "Todas as rotinas"}'.`
        : `Defina a senha que vai proteger a regra '${form.base || "Todas as rotinas"}'.`,
      label: "Senha da regra",
      placeholder: form.id
        ? "Obrigatoria para editar a regra"
        : "Obrigatoria para criar a regra",
      submitLabel: form.id ? "Salvar alteracao" : "Criar regra",
      requiredMessage: "Informe a senha da regra antes de salvar.",
      run: async (password) => {
        await runAction(
          "salvar regra do scheduler",
          () => extratorApi.saveSchedulerRule(serializeSchedulerForm(form, password)),
          buildHistoryRefreshOptions(clientHistoryPayload),
        );
        setForm(buildSchedulerDefaultForm(schedulerMeta));
        setIsModalOpen(false);
      },
    });
  }

  async function handleToggleRule(rule) {
    openPasswordAction({
      title: rule.enabled
        ? "Pausar regra do scheduler"
        : "Habilitar regra do scheduler",
      subtitle: `Informe a senha cadastrada para ${rule.enabled ? "pausar" : "habilitar"} a regra '${rule.base || "Todas as rotinas"}'.`,
      label: "Senha da regra",
      placeholder: "Obrigatoria para alterar o status",
      submitLabel: rule.enabled ? "Pausar regra" : "Habilitar regra",
      requiredMessage:
        "Informe a senha desta regra antes de alterar seu status.",
      run: async (password) => {
        await runAction(
          "alterar status do scheduler",
          () =>
            extratorApi.setSchedulerRuleEnabled({
              id: rule.id,
              enabled: !rule.enabled,
              senha: password,
            }),
          buildHistoryRefreshOptions(clientHistoryPayload),
        );
      },
    });
  }

  async function handleDeleteRule(ruleId) {
    const rule = (schedulerPayload?.rules || []).find(
      (item) => item.id === ruleId,
    );
    openPasswordAction({
      title: "Remover regra do scheduler",
      subtitle: `Informe a senha cadastrada para remover a regra '${rule?.base || ruleId}'.`,
      label: "Senha da regra",
      placeholder: "Obrigatoria para remover a regra",
      submitLabel: "Remover regra",
      requiredMessage: "Informe a senha desta regra antes de remove-la.",
      run: async (password) => {
        await runAction(
          "excluir regra do scheduler",
          () => extratorApi.deleteSchedulerRule({ id: ruleId, senha: password }),
          buildHistoryRefreshOptions(clientHistoryPayload),
        );
      },
    });
  }

  const baseFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todas as rotinas" },
    ...(schedulerPayload?.filter_options?.base || []),
  ];
  const periodFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todas as atualizacoes" },
    ...(schedulerPayload?.filter_options?.period || []),
  ];
  const scheduleFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todos os disparos" },
    ...(schedulerMeta?.schedule_options || []),
  ];

  return {
    isReady: Boolean(form),
    sectionProps: {
      filterAllValue: FILTER_ALL_VALUE,
      formatCountLabel,
      formatDateTime,
      handleDeleteSchedulerRule: handleDeleteRule,
      handleSaveSchedulerRule: handleSaveRule,
      handleToggleSchedulerRule: handleToggleRule,
      isSchedulerModalOpen: isModalOpen,
      loadingAction,
      openSchedulerCreateModal: openCreateModal,
      openSchedulerEditModal: openEditModal,
      onRefresh: () =>
        loadScheduler({ page, pageSize, filters: debouncedFilters }),
      reportsMeta,
      resetSchedulerFilters: resetFilters,
      schedulerBaseFilterOptions: baseFilterOptions,
      schedulerFilters: filters,
      schedulerForm: form,
      schedulerGroups: schedulerPayload?.groups || [],
      schedulerPagination: schedulerPayload?.pagination,
      schedulerIntervalLabel,
      schedulerMeta,
      schedulerPeriodFilterOptions: periodFilterOptions,
      schedulerPeriodLabel,
      schedulerPeriodMeta: periodMeta,
      schedulerScheduleFilterOptions: scheduleFilterOptions,
      schedulerScheduleLabel,
      schedulerTargetOptions: schedulerMeta?.target_options || [],
      setIsSchedulerModalOpen: setIsModalOpen,
      setSchedulerFilters: updateFilters,
      setSchedulerForm: setForm,
      setSchedulerPage: setPage,
      setSchedulerPageSize: (nextPageSize) => {
        setPage(1);
        setPageSize(nextPageSize);
      },
      status,
      syncSchedulerForm: syncForm,
      toBooleanLabel,
    },
  };
}
