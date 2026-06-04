"use client";

import {
  RoutineGroupList,
  RunSummaryPill,
} from "@/features/extrator-manager/components/GroupedQueueViews";
import {
  ChevronIcon,
  FormField,
  PeriodInputs,
  RuleSummaryList,
  SearchableSelect,
  SelectInput,
  TextInput,
} from "@/features/extrator-manager/components/ExtratorManagerControls";
import {
  ExtratorActionButton as ActionButton,
  ExtratorCompactMetric as SummaryBadge,
  ExtratorSectionCard as SectionCard,
} from "@/features/extrator-manager/components/ExtratorPageShell";
import { formatSummaryValue } from "@/features/extrator-manager/lib/extratorFormat";
import {
  buildPeriodSummary,
  getBasePeriodMeta,
  hydratePeriodStateFromItem,
} from "@/features/extrator-manager/lib/extratorPeriod";

export default function ExtratorExtractionSection({
  bases,
  batchDraft,
  batchesPayload,
  clientHistoryPayload,
  clientLogPayload,
  clientTechnicalLogId,
  handleAddCurrentToBatch,
  handleCancelTask,
  handleCancelTaskGroup,
  handleChangeClientHistoryPage,
  handleDeleteBatch,
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
}) {
  return (
          <div className="grid items-start gap-4 xl:grid-cols-[1.18fr_1.02fr]">
            <div className="space-y-4">
              <SectionCard
                eyebrow="Extracao"
                title="Atualizar rotina"
                actions={
                  <>
                    <ActionButton
                      onClick={() => void handleRunSingle()}
                      disabled={!operationForm.base || Boolean(loadingAction)}
                      tone="accent"
                    >
                      Executar rotina
                    </ActionButton>
                    <ActionButton
                      onClick={handleAddCurrentToBatch}
                      disabled={!operationForm.base}
                    >
                      Adicionar ao lote
                    </ActionButton>
                  </>
                }
              >
                <div className="grid gap-4">
                  <FormField label="Rotina">
                    <SearchableSelect
                      value={operationForm.base}
                      onChange={updateOperationBase}
                      options={bases}
                      placeholder="Busque a rotina"
                      disabled={isOperationBaseLocked && Boolean(operationForm.base)}
                      sideAction={
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            toggleOperationBaseLock();
                          }}
                          className={`min-w-[88px] rounded-r-2xl border-l border-[color:var(--shell-line)] px-3 text-xs font-semibold transition ${
                            isOperationBaseLocked && operationForm.base
                              ? "text-[var(--shell-accent)]"
                              : "text-[var(--shell-muted)] hover:text-[var(--shell-text)]"
                          }`}
                          title={
                            isOperationBaseLocked && operationForm.base
                              ? "Rotina travada: mantem a selecao apos enviar"
                              : "Rotina destravada: limpa a selecao apos enviar"
                          }
                        >
                          {isOperationBaseLocked && operationForm.base
                            ? "Travada"
                            : "Livre"}
                        </button>
                      }
                    />
                  </FormField>

                  <PeriodInputs
                    base={operationForm.base}
                    onChange={(updater) =>
                      setOperationForm((currentForm) => ({
                        ...currentForm,
                        ...(typeof updater === "function"
                          ? updater(currentForm)
                          : updater),
                      }))
                    }
                    periodMeta={operationPeriodMeta}
                    showBase={false}
                    state={operationForm}
                  />

                  <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-4 text-sm text-[var(--shell-muted)]">
                    {operationForm.base && operationPeriodMeta
                      ? buildPeriodSummary(operationForm, operationPeriodMeta)
                      : "Selecione uma rotina para montar o periodo da extracao."}
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Lotes"
                title="Lote atual e lotes salvos"
                actions={
                  <>
                    <ActionButton
                      onClick={() => void handleRunBatch()}
                      disabled={!batchDraft.items.length || Boolean(loadingAction)}
                      tone="accent"
                    >
                      Executar lote
                    </ActionButton>
                    <ActionButton
                      onClick={() => void handleSaveBatch()}
                      disabled={!batchDraft.nome || !batchDraft.items.length}
                    >
                      Salvar lote
                    </ActionButton>
                  </>
                }
              >
                <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="space-y-4">
                    <FormField label="Nome do lote">
                      <TextInput
                        value={batchDraft.nome}
                        onChange={(event) =>
                          setBatchDraft((currentDraft) => ({
                            ...currentDraft,
                            nome: event.target.value,
                          }))
                        }
                        placeholder="Ex.: Fechamento mensal"
                      />
                    </FormField>
                    <FormField label="Lotes salvos">
                      <SelectInput
                        value=""
                        onChange={(event) => handleLoadBatch(event.target.value)}
                      >
                        <option value="">Selecione um lote para carregar</option>
                        {(batchesPayload?.saved_batches || []).map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.nome} ({batch.item_count} item(ns))
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--shell-text)]">
                        {batchDraft.nome || "Lote temporario"}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--shell-muted)]">
                        {batchDraft.items.length} item(ns) na memoria da tela
                      </p>
                    </div>

                    <RuleSummaryList emptyMessage="Adicione rotinas para montar o lote atual.">
                      {batchDraft.items.map((item, index) => {
                        const itemPeriodMeta = getBasePeriodMeta(reportsMeta, item.base);
                        const itemPeriodState = hydratePeriodStateFromItem(item);

                        return (
                          <article
                            key={`${item.base}-${index}`}
                            className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-[var(--shell-text)]">
                                  {item.base}
                                </p>
                                <p className="mt-1 text-sm text-[var(--shell-muted)]">
                                  {buildPeriodSummary(itemPeriodState, itemPeriodMeta)}
                                </p>
                              </div>
                              <ActionButton
                                onClick={() => handleRemoveBatchItem(index)}
                                tone="danger"
                              >
                                Remover
                              </ActionButton>
                            </div>
                          </article>
                        );
                      })}
                    </RuleSummaryList>

                    {batchDraft.id ? (
                      <ActionButton
                        onClick={() => void handleDeleteBatch(batchDraft.id)}
                        tone="danger"
                        disabled={Boolean(loadingAction)}
                      >
                        Excluir lote salvo carregado
                      </ActionButton>
                    ) : null}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-3">
              <SectionCard
                eyebrow="Fila do cliente"
                title="Fila Das Suas Solicitacoes"
              >
                <p className="text-sm leading-7 text-[var(--shell-muted)]">
                  Mostra o que este navegador enviou e ainda esta vivo na fila
                  do servidor
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <RunSummaryPill
                    label="Ativas"
                    note="Ativas neste navegador."
                    value={formatSummaryValue(clientLogPayload?.progress?.summary, "total")}
                  />
                  <RunSummaryPill
                    label="Na fila"
                    note="Aguardando worker."
                    value={formatSummaryValue(clientLogPayload?.progress?.summary, "queued")}
                  />
                  <RunSummaryPill
                    label="Em execucao"
                    note="Rodando agora."
                    tone="running"
                    value={formatSummaryValue(clientLogPayload?.progress?.summary, "running")}
                  />
                  <RunSummaryPill
                    label="Cancelando"
                    note="Interrupcao pedida."
                    tone="cancelling"
                    value={formatSummaryValue(clientLogPayload?.progress?.summary, "cancelling")}
                  />
                </div>

                <div className="shell-scrollbar mt-6 max-h-[360px] overflow-y-auto pr-1">
                  <RoutineGroupList
                    emptyMessage="Nenhuma rotina em andamento por enquanto."
                    groups={clientLogPayload?.progress?.active_groups || []}
                    onCancelGroup={handleCancelTaskGroup}
                    onCancelTask={handleCancelTask}
                    scope="progress"
                    taskVariant="progress"
                  />
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    aria-expanded={isClientLogExpanded}
                    aria-controls={clientTechnicalLogId}
                    onClick={() => setIsClientLogExpanded((current) => !current)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3 text-left text-sm text-[var(--shell-muted)] transition hover:border-[color:rgba(110,231,255,0.45)] hover:text-[var(--shell-text)]"
                  >
                    <span className="min-w-0 font-semibold">
                      {isClientLogExpanded
                        ? "Ocultar detalhes tecnicos da execucao mais recente"
                        : "Ver detalhes tecnicos da execucao mais recente"}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition duration-300 ${
                        isClientLogExpanded
                          ? "border-[color:var(--shell-accent)] text-[var(--shell-accent)]"
                          : "border-[color:var(--shell-line)] text-[var(--shell-muted)]"
                      }`}
                    >
                      <ChevronIcon expanded={isClientLogExpanded} />
                    </span>
                  </button>
                  <div
                    id={clientTechnicalLogId}
                    className={`grid transition-[grid-template-rows,margin-top] duration-300 ease-in-out ${
                      isClientLogExpanded ? "mt-3 grid-rows-[1fr]" : "mt-0 grid-rows-[0fr]"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="overflow-hidden rounded-2xl border border-[color:rgba(110,231,255,0.28)] bg-[rgba(8,16,25,0.82)]">
                        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--shell-line)] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
                            Log tecnico
                          </p>
                          <p className="text-xs text-[var(--shell-muted)]">
                            Execucao mais recente
                          </p>
                        </div>
                        <div className="shell-scrollbar max-h-56 overflow-y-auto px-4 py-4 font-mono text-xs leading-6 text-[#d9efe9]">
                          <pre className="m-0 whitespace-pre-wrap break-words">
                            {clientLogPayload?.log ||
                              "Nenhum log registrado para este cliente."}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Historico"
                title="Historico Ativo"
                actions={
                  <>
                    <ActionButton
                      onClick={() => void handleChangeClientHistoryPage(-1)}
                      disabled={(clientHistoryPayload?.page || 1) <= 1}
                    >
                      Pagina anterior
                    </ActionButton>
                    <ActionButton
                      onClick={() => void handleChangeClientHistoryPage(1)}
                      disabled={
                        (clientHistoryPayload?.page || 1) >=
                        (clientHistoryPayload?.total_pages || 1)
                      }
                    >
                      Proxima pagina
                    </ActionButton>
                  </>
                }
              >
                <p className="mb-4 text-sm leading-7 text-[var(--shell-muted)]">
                  Solicitacoes concluidas, canceladas ou com erro neste
                  navegador. Os grupos mais recentes ficam no topo e o
                  agrupamento segue a mesma logica da fila.
                </p>
                <div className="mb-4 grid gap-3 md:grid-cols-4">
                  <SummaryBadge
                    label="Total"
                    value={formatSummaryValue(clientHistoryPayload?.summary, "total")}
                  />
                  <SummaryBadge
                    label="Concluidas"
                    value={formatSummaryValue(clientHistoryPayload?.summary, "completed")}
                    tone="accent"
                  />
                  <SummaryBadge
                    label="Canceladas"
                    value={formatSummaryValue(clientHistoryPayload?.summary, "cancelled")}
                  />
                  <SummaryBadge
                    label="Erro"
                    value={formatSummaryValue(clientHistoryPayload?.summary, "error")}
                    tone="danger"
                  />
                </div>
                <p className="mb-4 text-sm text-[var(--shell-muted)]">
                  Pagina {clientHistoryPayload?.page || 1} de{" "}
                  {clientHistoryPayload?.total_pages || 1}
                </p>

                <RoutineGroupList
                  emptyMessage="Nenhuma solicitacao anterior encontrada para este navegador."
                  groups={clientHistoryPayload?.groups || []}
                  scope="history"
                  taskVariant="progress"
                />
              </SectionCard>
            </div>
          </div>
  );
}
