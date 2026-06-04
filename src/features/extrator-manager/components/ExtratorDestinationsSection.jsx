"use client";

import {
  CheckboxField,
  FormField,
  ModalFrame,
  RuleSummaryList,
  SearchableSelect,
  SelectInput,
  TextInput,
} from "@/features/extrator-manager/components/ExtratorManagerControls";
import {
  ExtratorActionButton as ActionButton,
  ExtratorSectionCard as SectionCard,
} from "@/features/extrator-manager/components/ExtratorPageShell";

export default function ExtratorDestinationsSection({
  clientHistoryPayload,
  DestinationPreview,
  destinationBaseFilterOptions,
  destinationForm,
  destinationFormBaseOptions,
  destinationGroups,
  destinationOwnerFilterOptions,
  destinationPeriodFilterOptions,
  destinationRules,
  destinationSourceFilterOptions,
  destinationFilters,
  destinationsPayload,
  destinationListenOptions,
  expandedDestinationGroups,
  filteredDestinationRules,
  filterAllValue,
  formatCountLabel,
  formatDateTime,
  handleDeleteDestinationRule,
  handleSaveDestinationRule,
  isDestinationModalOpen,
  loadingAction,
  openDestinationCreateModal,
  openDestinationEditModal,
  refreshAll,
  resetDestinationFilters,
  selectedDestinationListenOptions,
  setDestinationFilters,
  setDestinationForm,
  setExpandedDestinationGroups,
  setIsDestinationHelpOpen,
  setIsDestinationModalOpen,
  status,
  summarizeGroups,
  syncDestinationForm,
  toBooleanLabel,
}) {
  return (
          <div className="space-y-4">
            {isDestinationModalOpen ? (
              <ModalFrame
                title={destinationForm.id ? "Editar destino" : "Novo destino"}
                subtitle="Defina o caminho base e monte nome/pasta final com templates por periodo."
                onClose={() => setIsDestinationModalOpen(false)}
                maxWidth="max-w-6xl"
              >
            <SectionCard
              eyebrow="Destinos"
              title="Novo destino ou edicao"
              actions={
                <>
                  <ActionButton
                    onClick={() => void handleSaveDestinationRule()}
                    disabled={Boolean(loadingAction)}
                    tone="accent"
                  >
                    {destinationForm.id ? "Atualizar destino" : "Salvar destino"}
                  </ActionButton>
                  <ActionButton
                    onClick={() => openDestinationCreateModal()}
                  >
                    Limpar
                  </ActionButton>
                </>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Rotina">
                  <SearchableSelect
                    value={destinationForm.base}
                    onChange={(value) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        base: value,
                        listenPeriodType:
                          destinationsPayload?.destination_meta
                            ?.listen_period_options_by_base?.[
                            value
                          ]?.[0]?.id || "todos",
                      }))
                    }
                    options={destinationsPayload?.destination_meta?.base_options || []}
                    placeholder="Busque a rotina"
                  />
                </FormField>
                <FormField label="Responsavel">
                  <TextInput
                    value={destinationForm.nome}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        nome: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <FormField label="Escuta de periodo">
                  <SelectInput
                    value={destinationForm.listenPeriodType}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        listenPeriodType: event.target.value,
                      }))
                    }
                  >
                    {selectedDestinationListenOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Caminho base">
                    <TextInput
                      value={destinationForm.caminho}
                      onChange={(event) =>
                        setDestinationForm((currentForm) => ({
                          ...currentForm,
                          caminho: event.target.value,
                        }))
                      }
                      placeholder="Ex.: D:\\Relatorios\\Promax\\03_11_40"
                    />
                  </FormField>
                </div>
                <FormField label="Extensao do arquivo">
                  <TextInput
                    value={destinationForm.extensaoArquivo}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        extensaoArquivo: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <FormField label="Separador do nome">
                  <SelectInput
                    value={destinationForm.separator}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        separator: event.target.value,
                      }))
                    }
                  >
                    {(
                      destinationsPayload?.destination_meta?.separator_options || []
                    ).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Separador da rotina">
                  <TextInput
                    value={destinationForm.rotinaSeparador}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        rotinaSeparador: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <FormField label="Formato do mes">
                  <SelectInput
                    value={destinationForm.mesFormato}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        mesFormato: event.target.value,
                      }))
                    }
                  >
                    {(
                      destinationsPayload?.destination_meta?.mes_formato_options ||
                      []
                    ).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Caixa do mes">
                  <SelectInput
                    value={destinationForm.mesCaixa}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        mesCaixa: event.target.value,
                      }))
                    }
                  >
                    {(
                      destinationsPayload?.destination_meta?.mes_caixa_options || []
                    ).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Tamanho da abreviacao">
                  <TextInput
                    type="number"
                    min="1"
                    max="12"
                    value={destinationForm.mesAbreviacaoTamanho}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        mesAbreviacaoTamanho: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <FormField label="Ordem da data">
                  <SelectInput
                    value={destinationForm.dataOrdem}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        dataOrdem: event.target.value,
                      }))
                    }
                  >
                    {(
                      destinationsPayload?.destination_meta?.data_ordem_options || []
                    ).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Separador da data">
                  <TextInput
                    value={destinationForm.dataSeparador}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        dataSeparador: event.target.value,
                      }))
                    }
                  />
                </FormField>
                <div className="md:col-span-2 flex flex-wrap gap-4">
                  <CheckboxField
                    checked={destinationForm.enabled}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        enabled: event.target.checked,
                      }))
                    }
                    label="Destino habilitado"
                  />
                  <CheckboxField
                    checked={destinationForm.includeRotina}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        includeRotina: event.target.checked,
                      }))
                    }
                    label="Incluir rotina no nome"
                  />
                  <CheckboxField
                    checked={destinationForm.stackPath}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        stackPath: event.target.checked,
                      }))
                    }
                    label="Empilhar pastas"
                  />
                  <CheckboxField
                    checked={destinationForm.mesSemAcento}
                    onChange={(event) =>
                      setDestinationForm((currentForm) => ({
                        ...currentForm,
                        mesSemAcento: event.target.checked,
                      }))
                    }
                    label="Mes sem acento"
                  />
                </div>

                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                  <FormField label="Arquivo mensal">
                    <TextInput
                      value={destinationForm.arquivoTemplateMensal}
                      onChange={(event) =>
                        setDestinationForm((currentForm) => ({
                          ...currentForm,
                          arquivoTemplateMensal: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Pasta mensal">
                    <TextInput
                      value={destinationForm.pastaTemplateMensal}
                      onChange={(event) =>
                        setDestinationForm((currentForm) => ({
                          ...currentForm,
                          pastaTemplateMensal: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Arquivo diario">
                    <TextInput
                      value={destinationForm.arquivoTemplateDiario}
                      onChange={(event) =>
                        setDestinationForm((currentForm) => ({
                          ...currentForm,
                          arquivoTemplateDiario: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Pasta diaria">
                    <TextInput
                      value={destinationForm.pastaTemplateDiario}
                      onChange={(event) =>
                        setDestinationForm((currentForm) => ({
                          ...currentForm,
                          pastaTemplateDiario: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Arquivo por periodo">
                    <TextInput
                      value={destinationForm.arquivoTemplatePeriodo}
                      onChange={(event) =>
                        setDestinationForm((currentForm) => ({
                          ...currentForm,
                          arquivoTemplatePeriodo: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Pasta por periodo">
                    <TextInput
                      value={destinationForm.pastaTemplatePeriodo}
                      onChange={(event) =>
                        setDestinationForm((currentForm) => ({
                          ...currentForm,
                          pastaTemplatePeriodo: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Arquivo sem periodo">
                    <TextInput
                      value={destinationForm.arquivoTemplateSemPeriodo}
                      onChange={(event) =>
                        setDestinationForm((currentForm) => ({
                          ...currentForm,
                          arquivoTemplateSemPeriodo: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Pasta sem periodo">
                    <TextInput
                      value={destinationForm.pastaTemplateSemPeriodo}
                      onChange={(event) =>
                        setDestinationForm((currentForm) => ({
                          ...currentForm,
                          pastaTemplateSemPeriodo: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <DestinationPreview form={destinationForm} />
                </div>

                <div className="md:col-span-2 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-4 text-sm text-[var(--shell-muted)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>
                      Tokens disponiveis:{" "}
                      {(
                        destinationsPayload?.destination_meta?.template_token_options || []
                      )
                        .map((token) => `{${token.id}}`)
                        .join(", ")}
                    </span>
                    <ActionButton onClick={() => setIsDestinationHelpOpen(true)}>
                      Ver ajuda
                    </ActionButton>
                  </div>
                </div>
              </div>
            </SectionCard>
              </ModalFrame>
            ) : null}

            <SectionCard
              eyebrow="Destinos"
              title="Destinos salvos"
              actions={
                <>
                  <ActionButton
                    onClick={() =>
                      void refreshAll({
                        historyPage: clientHistoryPayload?.page || 1,
                        historyPageSize: clientHistoryPayload?.page_size || 8,
                      })
                    }
                    disabled={status === "loading" || Boolean(loadingAction)}
                  >
                    Recarregar destinos
                  </ActionButton>
                  <ActionButton onClick={openDestinationCreateModal} tone="accent">
                    Novo destino
                  </ActionButton>
                </>
              }
            >
              <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
                <p className="text-sm leading-7 text-[var(--shell-muted)]">
                  Pesquise por criador, rotina, caminho ou tipo de escuta antes
                  de carregar uma regra para edicao.
                </p>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div className="min-w-[240px] flex-1">
                    <FormField label="Pesquisar">
                      <TextInput
                        value={destinationFilters.search}
                        onChange={(event) =>
                          setDestinationFilters((current) => ({
                            ...current,
                            search: event.target.value,
                          }))
                        }
                        placeholder="Busque por criador, rotina, caminho ou tipo de escuta"
                      />
                    </FormField>
                  </div>
                  <ActionButton onClick={resetDestinationFilters}>
                    Limpar filtros
                  </ActionButton>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <FormField label="Criador">
                    <SelectInput
                      value={destinationFilters.owner}
                      onChange={(event) =>
                        setDestinationFilters((current) => ({
                          ...current,
                          owner: event.target.value,
                        }))
                      }
                    >
                      {destinationOwnerFilterOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="Rotina">
                    <SearchableSelect
                      value={destinationFilters.base}
                      onChange={(value) =>
                        setDestinationFilters((current) => ({
                          ...current,
                          base: value,
                        }))
                      }
                      options={destinationBaseFilterOptions}
                      placeholder="Todas as rotinas"
                    />
                  </FormField>
                  <FormField label="Atualizacao">
                    <SelectInput
                      value={destinationFilters.period}
                      onChange={(event) =>
                        setDestinationFilters((current) => ({
                          ...current,
                          period: event.target.value,
                        }))
                      }
                    >
                      {destinationPeriodFilterOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                  <FormField label="Status">
                    <SelectInput
                      value={destinationFilters.enabled}
                      onChange={(event) =>
                        setDestinationFilters((current) => ({
                          ...current,
                          enabled: event.target.value,
                        }))
                      }
                    >
                      <option value={filterAllValue}>Todos os status</option>
                      <option value="true">Ativos</option>
                      <option value="false">Pausados</option>
                    </SelectInput>
                  </FormField>
                  <FormField label="Origem">
                    <SelectInput
                      value={destinationFilters.source}
                      onChange={(event) =>
                        setDestinationFilters((current) => ({
                          ...current,
                          source: event.target.value,
                        }))
                      }
                    >
                      {destinationSourceFilterOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>

                <div className="mt-4 text-sm text-[var(--shell-muted)]">
                  {destinationRules.length
                    ? `Exibindo ${formatCountLabel(filteredDestinationRules.length, "destino", "destinos")} em ${summarizeGroups(destinationGroups)}.`
                    : "Nenhum destino disponivel para filtrar."}
                </div>
              </div>

              <RuleSummaryList emptyMessage="Nenhum destino encontrou correspondencia com os filtros atuais.">
                {filteredDestinationRules.map((rule) => (
                  <article
                    key={rule.id}
                    className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--shell-text)]">
                          {rule.base} · {rule.nome}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--shell-muted)]">
                          {rule.listen_period_label} · {toBooleanLabel(rule.enabled)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <ActionButton onClick={() => openDestinationEditModal(rule)}>
                          Carregar para editar
                        </ActionButton>
                        <ActionButton
                          onClick={() => void handleDeleteDestinationRule(rule.id)}
                          tone="danger"
                        >
                          Excluir
                        </ActionButton>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--shell-muted)]">
                      {rule.caminho}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
                      Atualizado em {formatDateTime(rule.updated_at)}
                    </p>
                  </article>
                ))}
              </RuleSummaryList>
            </SectionCard>
          </div>
  );
}
