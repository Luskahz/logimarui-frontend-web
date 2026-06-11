"use client";

import { ChevronDown } from "lucide-react";
import {
  CheckboxField,
  FormField,
  ModalFrame,
  PeriodInputs,
  RuleSummaryList,
  SearchableSelect,
  SelectInput,
  TextInput,
} from "@/features/extrator-manager/components/ExtratorManagerControls";
import { ExtratorPagination } from "@/features/extrator-manager/components/ExtratorPagination";
import {
  ExtratorActionButton as ActionButton,
  ExtratorSectionCard as SectionCard,
} from "@/features/extrator-manager/components/ExtratorPageShell";
import { usePaginatedItems } from "@/features/extrator-manager/hooks/usePaginatedItems";
import { buildPeriodSummary } from "@/features/extrator-manager/lib/extratorPeriod";

function SchedulerRoutineGroup({
  formatDateTime,
  group,
  handleDeleteSchedulerRule,
  handleToggleSchedulerRule,
  openSchedulerEditModal,
  reportsMeta,
  schedulerMeta,
  schedulerPeriodLabel,
  schedulerScheduleLabel,
  toBooleanLabel,
}) {
  const pagination = usePaginatedItems(group?.items || [], 5);

  return (
    <details className="group rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
            Rotina
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[var(--shell-text)]">
            {group.label}
          </h3>
          <p className="mt-1 text-sm text-[var(--shell-muted)]">
            {group.item_count || group.items?.length || 0} regra(s) de agendamento
          </p>
        </div>
        <ChevronDown
          aria-hidden="true"
          className="mt-1 h-5 w-5 shrink-0 text-[var(--shell-muted)] transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="space-y-3 px-4 pb-4">
        {pagination.items.map((rule) => (
          <div
            key={rule.id}
            className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--shell-text)]">
                  {schedulerScheduleLabel(rule, schedulerMeta)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--shell-muted)]">
                  {rule.schedule_type} · {toBooleanLabel(rule.enabled)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton onClick={() => openSchedulerEditModal(rule)}>
                  Carregar para editar
                </ActionButton>
                <ActionButton
                  onClick={() => void handleToggleSchedulerRule(rule)}
                >
                  {rule.enabled ? "Pausar" : "Ativar"}
                </ActionButton>
                <ActionButton
                  onClick={() => void handleDeleteSchedulerRule(rule.id)}
                  tone="danger"
                >
                  Excluir
                </ActionButton>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--shell-muted)]">
              {schedulerPeriodLabel(rule, reportsMeta, schedulerMeta)}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
              Atualizada em {formatDateTime(rule.updated_at)}
            </p>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="mx-4 mb-4">
          <ExtratorPagination
            itemLabel="regras"
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            showPageSize={false}
          />
        </div>
      ) : null}
    </details>
  );
}

export default function ExtratorSchedulerSection({
  formatCountLabel,
  handleDeleteSchedulerRule,
  handleSaveSchedulerRule,
  handleToggleSchedulerRule,
  isSchedulerModalOpen,
  loadingAction,
  openSchedulerCreateModal,
  openSchedulerEditModal,
  onRefresh,
  resetSchedulerFilters,
  reportsMeta,
  schedulerBaseFilterOptions,
  schedulerFilters,
  schedulerForm,
  schedulerGroups,
  schedulerIntervalLabel,
  schedulerMeta,
  schedulerPeriodFilterOptions,
  schedulerPeriodMeta,
  schedulerPeriodLabel,
  schedulerPagination,
  schedulerScheduleFilterOptions,
  schedulerScheduleLabel,
  schedulerScheduleKindLabel,
  schedulerTargetOptions,
  filterAllValue,
  setIsSchedulerModalOpen,
  setSchedulerForm,
  setSchedulerFilters,
  setSchedulerPage,
  setSchedulerPageSize,
  status,
  syncSchedulerForm,
  toBooleanLabel,
  formatDateTime,
}) {
  return (
          <div className="space-y-4">
            {isSchedulerModalOpen ? (
              <ModalFrame
                title={schedulerForm.id ? "Editar regra" : "Nova regra"}
                subtitle="Monte um agendamento novo sem disputar espaco com a lista principal."
                onClose={() => setIsSchedulerModalOpen(false)}
                maxWidth="max-w-5xl"
              >
            <SectionCard
              eyebrow="Scheduler"
              title="Nova regra ou edicao"
              actions={
                <>
                  <ActionButton
                    onClick={() => void handleSaveSchedulerRule()}
                    disabled={Boolean(loadingAction)}
                    tone="accent"
                  >
                    {schedulerForm.id ? "Atualizar regra" : "Criar regra"}
                  </ActionButton>
                  <ActionButton
                    onClick={() => openSchedulerCreateModal()}
                  >
                    Limpar
                  </ActionButton>
                </>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Alvo">
                  <SelectInput
                    value={schedulerForm.targetType}
                    onChange={(event) =>
                      syncSchedulerForm({
                        ...schedulerForm,
                        targetType: event.target.value,
                      })
                    }
                  >
                    {schedulerTargetOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                {schedulerForm.targetType === "base" ? (
                  <FormField label="Rotina">
                    <SearchableSelect
                      value={schedulerForm.base}
                      onChange={(value) =>
                        syncSchedulerForm({
                          ...schedulerForm,
                          base: value,
                        })
                      }
                      options={schedulerMeta?.base_options || []}
                      placeholder="Busque a rotina"
                    />
                  </FormField>
                ) : null}

                <FormField label="Tipo de agendamento">
                  <SelectInput
                    value={schedulerForm.scheduleType}
                    onChange={(event) =>
                      setSchedulerForm((currentForm) => ({
                        ...currentForm,
                        scheduleType: event.target.value,
                      }))
                    }
                  >
                    {(schedulerMeta?.schedule_options || []).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                {schedulerForm.scheduleType === "daily" ? (
                  <FormField label="Horario">
                    <TextInput
                      type="time"
                      value={schedulerForm.time}
                      onChange={(event) =>
                        setSchedulerForm((currentForm) => ({
                          ...currentForm,
                          time: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                ) : null}

                {schedulerForm.scheduleType === "interval_from_time" ? (
                  <>
                    <FormField label="Horario inicial">
                      <TextInput
                        type="time"
                        value={schedulerForm.startTime}
                        onChange={(event) =>
                          setSchedulerForm((currentForm) => ({
                            ...currentForm,
                            startTime: event.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Horario final">
                      <TextInput
                        type="time"
                        value={schedulerForm.endTime}
                        onChange={(event) =>
                          setSchedulerForm((currentForm) => ({
                            ...currentForm,
                            endTime: event.target.value,
                          }))
                        }
                      />
                    </FormField>
                  </>
                ) : null}

                {schedulerForm.scheduleType !== "daily" ? (
                  <>
                    <FormField label="Intervalo">
                      <TextInput
                        type="number"
                        min="1"
                        value={schedulerForm.intervalValue}
                        onChange={(event) =>
                          setSchedulerForm((currentForm) => ({
                            ...currentForm,
                            intervalValue: event.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Unidade">
                      <SelectInput
                        value={schedulerForm.intervalUnit}
                        onChange={(event) =>
                          setSchedulerForm((currentForm) => ({
                            ...currentForm,
                            intervalUnit: event.target.value,
                          }))
                        }
                    >
                        {(schedulerMeta?.interval_unit_options || []).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  </>
                ) : null}

                <div className="md:col-span-2">
                  <PeriodInputs
                    base={schedulerForm.base || schedulerForm.targetType}
                    onChange={(updater) =>
                      setSchedulerForm((currentForm) => ({
                        ...currentForm,
                        ...(typeof updater === "function"
                          ? updater(currentForm)
                          : updater),
                      }))
                    }
                    periodMeta={schedulerPeriodMeta}
                    state={schedulerForm}
                  />
                </div>

                <div className="flex items-end">
                  <CheckboxField
                    checked={schedulerForm.enabled}
                    onChange={(event) =>
                      setSchedulerForm((currentForm) => ({
                        ...currentForm,
                        enabled: event.target.checked,
                      }))
                    }
                    label="Regra habilitada"
                  />
                </div>
              </div>
            </SectionCard>
              </ModalFrame>
            ) : null}

            <SectionCard
              eyebrow="Scheduler"
              title="Configuracoes do scheduler"
              actions={
                <>
                  <ActionButton
                    onClick={() => void onRefresh()}
                    disabled={status === "loading" || Boolean(loadingAction)}
                  >
                    Recarregar regras
                  </ActionButton>
                  <ActionButton onClick={openSchedulerCreateModal} tone="accent">
                    Criar nova regra
                  </ActionButton>
                </>
              }
            >
              <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
                <p className="text-sm leading-7 text-[var(--shell-muted)]">
                  Ative, pause, edite ou remova regras existentes. Use os filtros
                  para localizar rotinas por periodo, horario, intervalo ou status.
                </p>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div className="min-w-[240px] flex-1">
                    <FormField label="Pesquisar">
                      <TextInput
                        value={schedulerFilters.search}
                        onChange={(event) =>
                          setSchedulerFilters((current) => ({
                            ...current,
                            search: event.target.value,
                          }))
                        }
                        placeholder="Busque por rotina, periodo, horario ou intervalo"
                      />
                    </FormField>
                  </div>
                  <ActionButton onClick={resetSchedulerFilters}>
                    Limpar filtros
                  </ActionButton>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Rotina">
                    <SearchableSelect
                      value={schedulerFilters.base}
                      onChange={(value) =>
                        setSchedulerFilters((current) => ({
                          ...current,
                          base: value,
                        }))
                      }
                      options={schedulerBaseFilterOptions}
                      placeholder="Todas as rotinas"
                    />
                  </FormField>
                  <FormField label="Atualizacao">
                    <SelectInput
                      value={schedulerFilters.period}
                      onChange={(event) =>
                        setSchedulerFilters((current) => ({
                          ...current,
                          period: event.target.value,
                        }))
                      }
                    >
                      {schedulerPeriodFilterOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="Disparo">
                    <SelectInput
                      value={schedulerFilters.scheduleType}
                      onChange={(event) =>
                        setSchedulerFilters((current) => ({
                          ...current,
                          scheduleType: event.target.value,
                        }))
                      }
                    >
                      {schedulerScheduleFilterOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="Status">
                    <SelectInput
                      value={schedulerFilters.enabled}
                      onChange={(event) =>
                        setSchedulerFilters((current) => ({
                          ...current,
                          enabled: event.target.value,
                        }))
                      }
                    >
                      <option value={filterAllValue}>Todos os status</option>
                      <option value="true">Ativas</option>
                      <option value="false">Pausadas</option>
                    </SelectInput>
                  </FormField>
                </div>

                <div className="mt-4 text-sm text-[var(--shell-muted)]">
                  {(schedulerPagination?.total_items || 0) > 0
                    ? `Exibindo ${formatCountLabel(schedulerPagination.total_items, "rotina", "rotinas")} agrupadas.`
                    : "Nenhuma regra disponivel para filtrar."}
                </div>
              </div>

              <RuleSummaryList emptyMessage="Nenhuma regra do scheduler encontrou correspondencia com os filtros atuais.">
                {schedulerGroups.map((group) => (
                  <SchedulerRoutineGroup
                    key={group.id}
                    formatDateTime={formatDateTime}
                    group={group}
                    handleDeleteSchedulerRule={handleDeleteSchedulerRule}
                    handleToggleSchedulerRule={handleToggleSchedulerRule}
                    openSchedulerEditModal={openSchedulerEditModal}
                    reportsMeta={reportsMeta}
                    schedulerMeta={schedulerMeta}
                    schedulerPeriodLabel={schedulerPeriodLabel}
                    schedulerScheduleLabel={schedulerScheduleLabel}
                    toBooleanLabel={toBooleanLabel}
                  />
                ))}
              </RuleSummaryList>

              <div className="mt-4">
                <ExtratorPagination
                  itemLabel="rotinas"
                  page={schedulerPagination?.page || 1}
                  pageSize={schedulerPagination?.page_size || 10}
                  totalItems={schedulerPagination?.total_items || 0}
                  totalPages={schedulerPagination?.total_pages || 1}
                  onPageChange={setSchedulerPage}
                  onPageSizeChange={setSchedulerPageSize}
                />
              </div>
            </SectionCard>
          </div>
  );
}
