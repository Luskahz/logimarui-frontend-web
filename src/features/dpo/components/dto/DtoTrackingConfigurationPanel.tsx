"use client";

import { useMemo, useState } from "react";
import { MapPin, Plus, RotateCcw, Save, UserMinus, UsersRound, X } from "lucide-react";
import { DtoBadge, DtoButton } from "@/features/dpo/components/dto/DtoPrimitives";
import { normalizeSearchText } from "@/features/dpo/lib/dtoFormatters";
import { extractTrackingNames } from "@/features/dpo/lib/dtoTracking";
import type {
  DtoConfigurationUpdate,
  DtoEnvironmentSource,
  DtoFormConfiguration,
  DtoTrackingConfiguration,
  DtoTrackingMode,
} from "@/features/dpo/lib/dtoTypes";
import { Typography } from "@/shared/ui/typography";

function inferredFieldKey(
  configuration: DtoFormConfiguration,
  role: "COLLABORATOR" | "CONTEXT" | "DATE",
): string {
  const fields = configuration.fields.filter(
    (field) => field.role === role && field.observation_status === "OBSERVED",
  );
  return fields.length === 1 ? fields[0].key : "";
}

function uniqueNames(values: string[]): string[] {
  const names = new Map<string, string>();
  values.forEach((value) => {
    const key = normalizeSearchText(value);
    if (key && !names.has(key)) names.set(key, value.trim());
  });
  return [...names.values()].sort((left, right) =>
    left.localeCompare(right, "pt-BR"),
  );
}

export default function DtoTrackingConfigurationPanel({
  configuration,
  onSave,
}: {
  configuration: DtoFormConfiguration;
  onSave: (update: DtoConfigurationUpdate) => Promise<unknown>;
}) {
  const current = configuration.tracking;
  const [trackingMode, setTrackingMode] = useState<DtoTrackingMode>(
    current.mode || "COLLABORATOR",
  );
  const [environmentSource, setEnvironmentSource] = useState<DtoEnvironmentSource>(
    current.environment_source || "FIELD",
  );
  const [rosterFieldKey, setRosterFieldKey] = useState(
    (current.mode === "ENVIRONMENT" && current.environment_source === "FORM")
      ? ""
      : current.roster_field_key ||
        inferredFieldKey(
          configuration,
          (current.mode || "COLLABORATOR") === "ENVIRONMENT"
            ? "CONTEXT"
            : "COLLABORATOR",
        ),
  );
  const [dateFieldKey, setDateFieldKey] = useState(
    current.realization_date_field_key || inferredFieldKey(configuration, "DATE"),
  );
  const [intervalDays, setIntervalDays] = useState(
    current.interval_days ? String(current.interval_days) : "",
  );
  const [excluded, setExcluded] = useState(current.excluded_collaborators);
  const [manual, setManual] = useState(current.manual_collaborators);
  const [manualName, setManualName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rosterField = configuration.fields.find(
    (field) => field.key === rosterFieldKey,
  );
  const observedNames = useMemo(
    () =>
      uniqueNames(
        (rosterField?.observed_values || []).flatMap((value) =>
          extractTrackingNames(value.display_value),
        ),
      ),
    [rosterField],
  );
  const parsedInterval = Number(intervalDays);
  const intervalValid =
    intervalDays !== "" &&
    Number.isInteger(parsedInterval) &&
    parsedInterval >= 1 &&
    parsedInterval <= 3660;
  const fieldsDistinct = !rosterFieldKey || rosterFieldKey !== dateFieldKey;
  const isEnvironment = trackingMode === "ENVIRONMENT";
  const isFormEnvironment = isEnvironment && environmentSource === "FORM";
  const subject = isEnvironment ? "ambiente" : "colaborador";
  const subjects = isEnvironment ? "ambientes" : "colaboradores";
  const hasPopulationSource = isFormEnvironment
    ? manual.length === 1
    : Boolean(rosterFieldKey);
  const currentIsFormEnvironment =
    current.mode === "ENVIRONMENT" && current.environment_source === "FORM";
  const currentConfigured = Boolean(
    current.realization_date_field_key &&
      current.interval_days &&
      (currentIsFormEnvironment
        ? current.manual_collaborators.length === 1 && !current.roster_field_key
        : current.roster_field_key),
  );

  function changeTrackingMode(mode: DtoTrackingMode) {
    if (mode === trackingMode) return;
    setTrackingMode(mode);
    setEnvironmentSource("FIELD");
    setRosterFieldKey(
      inferredFieldKey(
        configuration,
        mode === "ENVIRONMENT" ? "CONTEXT" : "COLLABORATOR",
      ),
    );
    setExcluded([]);
    setManual([]);
    setManualName("");
  }

  function changeEnvironmentSource(source: DtoEnvironmentSource) {
    if (source === environmentSource) return;
    setEnvironmentSource(source);
    setRosterFieldKey(
      source === "FORM"
        ? ""
        : inferredFieldKey(configuration, "CONTEXT"),
    );
    setExcluded([]);
    setManual([]);
    setManualName("");
  }

  function toggleExcluded(name: string) {
    const key = normalizeSearchText(name);
    setExcluded((values) =>
      values.some((value) => normalizeSearchText(value) === key)
        ? values.filter((value) => normalizeSearchText(value) !== key)
        : [...values, name],
    );
    setManual((values) =>
      values.filter((value) => normalizeSearchText(value) !== key),
    );
  }

  function addManualSubject() {
    const name = manualName.trim();
    const key = normalizeSearchText(name);
    if (!key) return;
    if (isFormEnvironment && manual.length > 0) return;
    if (observedNames.some((value) => normalizeSearchText(value) === key)) {
      setManualName("");
      return;
    }
    setManual((values) =>
      values.some((value) => normalizeSearchText(value) === key)
        ? values
        : [...values, name],
    );
    setExcluded((values) =>
      values.filter((value) => normalizeSearchText(value) !== key),
    );
    setManualName("");
  }

  async function save(tracking: DtoTrackingConfiguration | null) {
    setSaving(true);
    setError(null);
    try {
      await onSave({ revision: configuration.revision, tracking });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar a forma de acompanhamento.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <Typography variant="overline">Forma de acompanhamento</Typography>
          <Typography as="h3" variant="cardTitle" className="mt-2">
            Dimensão, periodicidade e população acompanhada
          </Typography>
          <Typography variant="supportingText" className="mt-2">
            Escolha se cada ciclo pertence a uma pessoa ou a um ambiente. No
            ambiente, você pode usar uma coluna com vários locais ou um único
            rótulo que representa todas as realizações do formulário.
          </Typography>
        </div>
        {currentConfigured ? (
          <DtoBadge tone="accent">
            {current.mode === "ENVIRONMENT"
              ? currentIsFormEnvironment
                ? "Ambiente geral"
                : "Por ambiente"
              : "Por colaborador"}
          </DtoBadge>
        ) : (
          <DtoBadge>Configuração opcional</DtoBadge>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Dimensão do acompanhamento">
        <button
          type="button"
          role="radio"
          aria-checked={trackingMode === "COLLABORATOR"}
          onClick={() => changeTrackingMode("COLLABORATOR")}
          className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
            trackingMode === "COLLABORATOR"
              ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
              : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] hover:border-[color:var(--shell-line-strong)]"
          }`}
        >
          <UsersRound aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--shell-accent)]" />
          <span>
            <span className="block text-sm font-semibold text-[var(--shell-text)]">Por colaborador</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--shell-muted)]">
              Cada pessoa possui sua própria última realização e próximo prazo.
            </span>
          </span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={trackingMode === "ENVIRONMENT"}
          onClick={() => changeTrackingMode("ENVIRONMENT")}
          className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
            trackingMode === "ENVIRONMENT"
              ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
              : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] hover:border-[color:var(--shell-line-strong)]"
          }`}
        >
          <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--shell-accent)]" />
          <span>
            <span className="block text-sm font-semibold text-[var(--shell-text)]">Por ambiente</span>
            <span className="mt-1 block text-xs leading-5 text-[var(--shell-muted)]">
              Cada local possui um único ciclo, independentemente de quem realizou.
            </span>
          </span>
        </button>
      </div>

      {isEnvironment ? (
        <fieldset className="mt-5 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4">
          <legend className="px-1 text-sm font-semibold text-[var(--shell-text)]">
            Como identificar o ambiente
          </legend>
          <div className="mt-2 grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Fonte do ambiente">
            <button
              type="button"
              role="radio"
              aria-checked={environmentSource === "FIELD"}
              onClick={() => changeEnvironmentSource("FIELD")}
              className={`rounded-xl border p-3 text-left transition ${
                environmentSource === "FIELD"
                  ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
                  : "border-[color:var(--shell-line)] hover:border-[color:var(--shell-line-strong)]"
              }`}
            >
              <span className="block text-sm font-semibold text-[var(--shell-text)]">Campo de ambiente no formulário</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--shell-muted)]">
                Use quando cada realização informa o local, como Oficina, Pátio ou Armazém.
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={environmentSource === "FORM"}
              onClick={() => changeEnvironmentSource("FORM")}
              className={`rounded-xl border p-3 text-left transition ${
                environmentSource === "FORM"
                  ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
                  : "border-[color:var(--shell-line)] hover:border-[color:var(--shell-line-strong)]"
              }`}
            >
              <span className="block text-sm font-semibold text-[var(--shell-text)]">Ambiente geral do formulário</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--shell-muted)]">
                Use quando todo registro vale para um único local e não existe uma coluna de ambiente.
              </span>
            </button>
          </div>
        </fieldset>
      ) : null}

      <div className={`mt-5 grid gap-4 ${isFormEnvironment ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
        {!isFormEnvironment ? (
          <label className="text-xs font-semibold text-[var(--shell-muted)]">
            Pergunta/campo do {subject}
          <select
            value={rosterFieldKey}
            onChange={(event) => {
              setRosterFieldKey(event.target.value);
              setExcluded([]);
            }}
            className="mt-2 w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-2.5 text-sm text-[var(--shell-text)]"
          >
            <option value="">Selecione um campo</option>
            {configuration.fields
              .filter((field) => field.observation_status === "OBSERVED")
              .map((field) => (
                <option key={field.key} value={field.key}>
                  {field.source_name}
                </option>
              ))}
          </select>
          </label>
        ) : null}

        <label className="text-xs font-semibold text-[var(--shell-muted)]">
          Campo da data de realização
          <select
            value={dateFieldKey}
            onChange={(event) => setDateFieldKey(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-2.5 text-sm text-[var(--shell-text)]"
          >
            <option value="">Selecione um campo</option>
            {configuration.fields
              .filter((field) => field.observation_status === "OBSERVED")
              .map((field) => (
                <option key={field.key} value={field.key}>
                  {field.source_name}
                  {field.role === "DATE" ? " · data detectada" : ""}
                </option>
              ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-[var(--shell-muted)]">
          Dias entre realizações
          <input
            inputMode="numeric"
            min={1}
            max={3660}
            step={1}
            type="number"
            value={intervalDays}
            onChange={(event) => setIntervalDays(event.target.value)}
            placeholder="Ex.: 30 ou 60"
            className="mt-2 w-full rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3 py-2.5 text-sm text-[var(--shell-text)]"
          />
        </label>
      </div>

      <div className={`mt-5 grid gap-4 ${isFormEnvironment ? "max-w-2xl" : "xl:grid-cols-2"}`}>
        {!isFormEnvironment ? (
          <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4">
          <div className="flex items-start gap-3">
            <UserMinus aria-hidden="true" className="mt-0.5 h-4 w-4 text-[var(--shell-muted)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--shell-text)]">
                Desconsiderar {subjects}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--shell-muted)]">
                {isEnvironment
                  ? "Use para locais que não pertencem ao escopo desta rotina."
                  : "Use para desligados ou pessoas que não pertencem mais à operação."}
              </p>
            </div>
          </div>
          <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
            {rosterFieldKey && observedNames.length ? (
              observedNames.map((name) => {
                const checked = excluded.some(
                  (value) => normalizeSearchText(value) === normalizeSearchText(name),
                );
                return (
                  <label
                    key={normalizeSearchText(name)}
                    className="flex items-center gap-3 rounded-xl border border-[color:var(--shell-line)] px-3 py-2 text-sm text-[var(--shell-text)]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleExcluded(name)}
                      className="h-4 w-4 accent-[var(--shell-accent)]"
                    />
                    <span className="min-w-0 break-words">{name}</span>
                  </label>
                );
              })
            ) : (
              <p className="text-sm text-[var(--shell-muted)]">
                Selecione o campo de {subject} para listar os valores observados.
              </p>
            )}
          </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--shell-text)]">
            {isFormEnvironment ? "Definir ambiente geral" : `Incluir ${subject} sem registro`}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--shell-muted)]">
            {isFormEnvironment
              ? "Informe um único rótulo. Todas as realizações deste formulário serão atribuídas a esse ambiente."
              : "Inclusões manuais aparecem como “Nunca realizado” até surgir uma aplicação."}
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addManualSubject();
                }
              }}
              placeholder={isFormEnvironment ? "Ex.: Armazém" : isEnvironment ? "Nome do ambiente" : "Nome do colaborador"}
              className="min-w-0 flex-1 rounded-xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-2 text-sm text-[var(--shell-text)]"
            />
            <DtoButton size="sm" disabled={isFormEnvironment && manual.length > 0} onClick={addManualSubject}>
              <Plus aria-hidden="true" /> Adicionar
            </DtoButton>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {manual.length ? (
              manual.map((name) => (
                <span
                  key={normalizeSearchText(name)}
                  className="inline-flex items-center gap-1 rounded-full border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--shell-text)]"
                >
                    {name}
                  <button
                    type="button"
                    aria-label={`Remover ${name}`}
                    onClick={() =>
                      setManual((values) =>
                        values.filter(
                          (value) =>
                            normalizeSearchText(value) !== normalizeSearchText(name),
                        ),
                      )
                    }
                    className="rounded-full p-0.5 text-[var(--shell-muted)] hover:text-[var(--shell-text)]"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-[var(--shell-muted)]">
                {isFormEnvironment ? "Defina o ambiente que este formulário representa." : "Nenhuma inclusão manual."}
              </span>
            )}
          </div>
        </div>
      </div>

      {intervalDays && !intervalValid ? (
        <p role="alert" className="mt-4 text-sm text-[var(--shell-danger)]">
          Informe um intervalo inteiro entre 1 e 3660 dias.
        </p>
      ) : null}
      {!fieldsDistinct ? (
        <p role="alert" className="mt-4 text-sm text-[var(--shell-danger)]">
          O campo de {subject} e o campo de data devem ser diferentes.
        </p>
      ) : null}
      {isFormEnvironment && manual.length !== 1 ? (
        <p role="alert" className="mt-4 text-sm text-[var(--shell-danger)]">
          Defina exatamente um ambiente geral para este formulário.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm text-[var(--shell-danger)]">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <DtoButton
          disabled={saving}
          onClick={() => void save(null)}
        >
          <RotateCcw aria-hidden="true" /> Limpar acompanhamento
        </DtoButton>
        <DtoButton
          tone="accent"
          disabled={
            saving ||
            !hasPopulationSource ||
            !dateFieldKey ||
            !intervalValid ||
            (!isFormEnvironment && !fieldsDistinct)
          }
          onClick={() =>
            void save({
              mode: trackingMode,
              environment_source: isEnvironment ? environmentSource : "FIELD",
              roster_field_key: isFormEnvironment ? null : rosterFieldKey,
              realization_date_field_key: dateFieldKey,
              interval_days: parsedInterval,
              excluded_collaborators: isFormEnvironment ? [] : excluded,
              manual_collaborators: manual,
            })
          }
        >
          <Save aria-hidden="true" /> {saving ? "Salvando" : "Salvar acompanhamento"}
        </DtoButton>
      </div>
    </section>
  );
}
