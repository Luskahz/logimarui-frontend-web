"use client";

import {
  FormField,
  ModalFrame,
  RuleSummaryList,
  SelectInput,
  TextArea,
  TextInput,
} from "@/features/extrator-manager/components/ExtratorManagerControls";
import { ExtratorPagination } from "@/features/extrator-manager/components/ExtratorPagination";
import {
  ExtratorActionButton as ActionButton,
  ExtratorSectionCard as SectionCard,
} from "@/features/extrator-manager/components/ExtratorPageShell";

export default function ExtratorRequestsSection({
  handleSaveRequest,
  handleUpdateRequestStatus,
  isRequestCreateModalOpen,
  loadingAction,
  onRefresh,
  requestForm,
  requestMeta,
  requestsPayload,
  requestSourceOptions,
  requestUpdateOptions,
  setIsRequestCreateModalOpen,
  setRequestForm,
  setRequestsPage,
  setRequestsPageSize,
  setSelectedRequestId,
  status,
  syncRequestType,
}) {
  return (
          <div className="space-y-4">
            {isRequestCreateModalOpen ? (
              <ModalFrame
                title="Nova solicitacao"
                subtitle="Registre demandas de rotina, ajuste ou manutencao para acompanhamento operacional."
                onClose={() => setIsRequestCreateModalOpen(false)}
                closeOnBackdrop={false}
                maxWidth="max-w-4xl"
              >
            <SectionCard
              eyebrow="Solicitacoes"
              title="Nova solicitacao"
              actions={
                <ActionButton
                  onClick={() => void handleSaveRequest()}
                  disabled={Boolean(loadingAction)}
                  tone="accent"
                >
                  Registrar solicitacao
                </ActionButton>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Tipo">
                  <SelectInput
                    value={requestForm.tipoSolicitacao}
                    onChange={(event) => syncRequestType(event.target.value)}
                  >
                    {(requestMeta?.type_options || []).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Solicitante">
                  <TextInput
                    value={requestForm.solicitante}
                    onChange={(event) =>
                      setRequestForm((currentForm) => ({
                        ...currentForm,
                        solicitante: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <FormField label="Nome da rotina ou titulo">
                  <TextInput
                    value={requestForm.rotinaNome}
                    onChange={(event) =>
                      setRequestForm((currentForm) => ({
                        ...currentForm,
                        rotinaNome: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <FormField label="Origem">
                  <SelectInput
                    value={requestForm.origemTipo}
                    onChange={(event) =>
                      setRequestForm((currentForm) => ({
                        ...currentForm,
                        origemTipo: event.target.value,
                        origemDetalhe:
                          event.target.value === "outros"
                            ? currentForm.origemDetalhe
                            : "",
                      }))
                    }
                  >
                    {requestSourceOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                {requestForm.origemTipo === "outros" ? (
                  <div className="md:col-span-2">
                    <FormField label="Detalhe da origem">
                      <TextInput
                        value={requestForm.origemDetalhe}
                        onChange={(event) =>
                          setRequestForm((currentForm) => ({
                            ...currentForm,
                            origemDetalhe: event.target.value,
                          }))
                        }
                      />
                    </FormField>
                  </div>
                ) : null}
                <FormField label="Classificacao">
                  <SelectInput
                    value={requestForm.atualizacaoTipo}
                    onChange={(event) =>
                      setRequestForm((currentForm) => ({
                        ...currentForm,
                        atualizacaoTipo: event.target.value,
                        atualizacaoDetalhe:
                          event.target.value === "outros"
                            ? currentForm.atualizacaoDetalhe
                            : "",
                      }))
                    }
                  >
                    {requestUpdateOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                {requestForm.atualizacaoTipo === "outros" ? (
                  <FormField label="Detalhe da classificacao">
                    <TextInput
                      value={requestForm.atualizacaoDetalhe}
                      onChange={(event) =>
                        setRequestForm((currentForm) => ({
                          ...currentForm,
                          atualizacaoDetalhe: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                ) : null}
                <div className="md:col-span-2">
                  <FormField label="Descricao">
                    <TextArea
                      value={requestForm.descricaoAtualizacao}
                      onChange={(event) =>
                        setRequestForm((currentForm) => ({
                          ...currentForm,
                          descricaoAtualizacao: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                </div>
              </div>
            </SectionCard>
              </ModalFrame>
            ) : null}

            <SectionCard
              eyebrow="Backlog"
              title="Solicitacoes registradas"
              actions={
                <>
                  <ActionButton
                    onClick={() => void onRefresh()}
                    disabled={status === "loading" || Boolean(loadingAction)}
                  >
                    Recarregar solicitacoes
                  </ActionButton>
                  <ActionButton
                    onClick={() => setIsRequestCreateModalOpen(true)}
                    tone="accent"
                  >
                    Nova solicitacao
                  </ActionButton>
                </>
              }
            >
              <RuleSummaryList emptyMessage="Nenhuma solicitacao registrada ainda.">
                {(requestsPayload?.requests || []).map((requestItem) => (
                  <article
                    key={requestItem.id}
                    onClick={() => setSelectedRequestId(requestItem.id)}
                    className="cursor-pointer rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4 transition hover:border-[color:var(--shell-line-strong)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--shell-text)]">
                          {requestItem.rotina_nome}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--shell-muted)]">
                          {requestItem.tipo_solicitacao_label} · {requestItem.status_label}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(requestMeta?.status_options || []).map((statusOption) => (
                          <ActionButton
                            key={statusOption.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleUpdateRequestStatus(
                                requestItem.id,
                                statusOption.id,
                              );
                            }}
                            tone={
                              statusOption.id === requestItem.status
                                ? "accent"
                                : "default"
                            }
                          >
                            {statusOption.label}
                          </ActionButton>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--shell-muted)]">
                      Solicitante: {requestItem.solicitante}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
                      Origem: {requestItem.origem_label}
                      {requestItem.origem_detalhe
                        ? ` (${requestItem.origem_detalhe})`
                        : ""}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
                      Classificacao: {requestItem.atualizacao_label}
                      {requestItem.atualizacao_detalhe
                        ? ` (${requestItem.atualizacao_detalhe})`
                        : ""}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--shell-text)]">
                      {requestItem.descricao_atualizacao}
                    </p>
                  </article>
                ))}
              </RuleSummaryList>

              <div className="mt-4">
                <ExtratorPagination
                  itemLabel="solicitacoes"
                  page={requestsPayload?.pagination?.page || 1}
                  pageSize={requestsPayload?.pagination?.page_size || 10}
                  totalItems={requestsPayload?.pagination?.total_items || 0}
                  totalPages={requestsPayload?.pagination?.total_pages || 1}
                  onPageChange={setRequestsPage}
                  onPageSizeChange={setRequestsPageSize}
                />
              </div>
            </SectionCard>
          </div>
  );
}
