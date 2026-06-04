"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  CheckboxField,
  ChevronIcon,
  FormField,
  ModalFrame,
  PasswordActionModal,
  PeriodInputs,
  RuleSummaryList,
  SearchableSelect,
  SelectInput,
  StatusPill,
  TextArea,
  TextInput,
} from "@/features/extrator-manager/components/ExtratorManagerControls";
import ExtratorDestinationsSection from "@/features/extrator-manager/components/ExtratorDestinationsSection";
import ExtratorExtractionSection from "@/features/extrator-manager/components/ExtratorExtractionSection";
import ExtratorRequestsSection from "@/features/extrator-manager/components/ExtratorRequestsSection";
import ExtratorSchedulerSection from "@/features/extrator-manager/components/ExtratorSchedulerSection";
import {
  RoutineGroupList,
  RunSummaryPill,
} from "@/features/extrator-manager/components/GroupedQueueViews";
import ExtratorPageShell, {
  ExtratorActionButton as ActionButton,
  ExtratorCompactMetric as SummaryBadge,
  ExtratorSectionCard as SectionCard,
} from "@/features/extrator-manager/components/ExtratorPageShell";
import { normalizeExtratorTabId } from "@/features/extrator-manager/components/ExtratorSectionNav";
import { useExtratorManager } from "@/features/extrator-manager/hooks/useExtratorManager";
import { extratorApi } from "@/features/extrator-manager/lib/extratorApi";
import {
  formatDateTime,
  formatSummaryValue,
} from "@/features/extrator-manager/lib/extratorFormat";
import {
  buildDefaultPeriodState,
  buildPeriodArgs,
  buildPeriodSummary,
  derivePeriodState,
  getBasePeriodMeta,
  hydratePeriodStateFromItem,
  serializeTaskForRequest,
} from "@/features/extrator-manager/lib/extratorPeriod";

const EMPTY_OPERATION_FORM = {
  base: "",
  periodType: "",
  periodMode: "",
  monthReference: "",
  date: "",
  startDate: "",
  endDate: "",
};

const FILTER_ALL_VALUE = "__all__";

function toBooleanLabel(value) {
  return value ? "Ativo" : "Pausado";
}

function normalizeFilterText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeOption(option) {
  if (typeof option === "string") {
    return { id: option, label: option };
  }

  return {
    id: String(option?.id ?? option?.value ?? ""),
    label: String(option?.label ?? option?.id ?? option?.value ?? ""),
  };
}

function getOptionLabel(options, value, fallback = "") {
  const normalizedValue = String(value ?? "");
  return (
    (options || [])
      .map(normalizeOption)
      .find((option) => option.id === normalizedValue)?.label ||
    fallback ||
    normalizedValue
  );
}

function uniqueOptions(options) {
  const seen = new Set();
  return (options || [])
    .map(normalizeOption)
    .filter((option) => {
      if (!option.id || seen.has(option.id)) {
        return false;
      }

      seen.add(option.id);
      return true;
    });
}

function formatCountLabel(total, singular, plural) {
  const numericTotal = Number(total || 0);
  return `${numericTotal} ${numericTotal === 1 ? singular : plural}`;
}

function getInitialActiveTabFromUrl() {
  if (typeof window === "undefined") {
    return "operacoes";
  }

  return normalizeExtratorTabId(
    new URLSearchParams(window.location.search).get("aba"),
  );
}

function groupRules(items, getGroupId, getGroupLabel) {
  const groupsMap = new Map();

  (items || []).forEach((item) => {
    const id = getGroupId(item) || "sem-grupo";
    const label = getGroupLabel(item) || "Sem grupo";

    if (!groupsMap.has(id)) {
      groupsMap.set(id, {
        id,
        label,
        items: [],
      });
    }

    groupsMap.get(id).items.push(item);
  });

  return Array.from(groupsMap.values()).sort((left, right) =>
    left.label.localeCompare(right.label, "pt-BR"),
  );
}

function summarizeGroups(groups, singularGroupLabel = "grupo", pluralGroupLabel = "grupos") {
  return formatCountLabel(groups?.length || 0, singularGroupLabel, pluralGroupLabel);
}

function buildDestinationDefaultForm(destinationMeta) {
  const defaultRule = destinationMeta?.default_rule || {};
  const firstBase = destinationMeta?.base_options?.[0]?.id || "";
  const firstListenOption =
    destinationMeta?.listen_period_options_by_base?.[firstBase]?.[0]?.id ||
    destinationMeta?.listen_period_default ||
    "todos";

  return {
    id: "",
    base: firstBase,
    nome: "",
    senha: "",
    caminho: "",
    enabled: true,
    listenPeriodType: firstListenOption,
    prefixo: defaultRule.prefixo || "",
    sufixo: defaultRule.sufixo || "",
    includeRotina: Boolean(defaultRule.include_rotina),
    stackPath: Boolean(defaultRule.stack_path),
    separator: defaultRule.sep || "",
    rotinaSeparador: defaultRule.rotina_separador || "_",
    extensaoArquivo: defaultRule.extensao_arquivo || ".csv",
    mesFormato: defaultRule.mes_formato || "completo",
    mesAbreviacaoTamanho: String(defaultRule.mes_abreviacao_tamanho || 3),
    mesCaixa: defaultRule.mes_caixa || "minusculo",
    mesSemAcento: Boolean(defaultRule.mes_sem_acento),
    dataOrdem: defaultRule.data_ordem || "dmy",
    dataSeparador: defaultRule.data_separador || "_",
    arquivoTemplateMensal: defaultRule.arquivo_template_mensal || "{mes_nome}",
    arquivoTemplateDiario: defaultRule.arquivo_template_diario || "{dia}",
    arquivoTemplatePeriodo:
      defaultRule.arquivo_template_periodo ||
      "{data_inicial}{sep_nome}{data_final}",
    arquivoTemplateSemPeriodo:
      defaultRule.arquivo_template_sem_periodo || "{rotina}",
    pastaTemplateMensal: defaultRule.pasta_template_mensal || "{ano}",
    pastaTemplateDiario:
      defaultRule.pasta_template_diario || "{ano}\\{mes_nome}",
    pastaTemplatePeriodo: defaultRule.pasta_template_periodo || "{ano}",
    pastaTemplateSemPeriodo: defaultRule.pasta_template_sem_periodo || "",
  };
}

function buildSchedulerDefaultForm(schedulerMeta) {
  const firstBase = schedulerMeta?.base_options?.[0]?.id || "";
  const defaultPeriodState = buildDefaultPeriodState(
    schedulerMeta?.all_period_meta || null,
  );

  return {
    id: "",
    targetType: "base",
    base: firstBase,
    scheduleType: "daily",
    time: "06:00",
    startTime: "06:00",
    endTime: "",
    intervalValue: "1",
    intervalUnit: schedulerMeta?.interval_unit_options?.[1]?.id || "hours",
    enabled: true,
    senha: "",
    ...defaultPeriodState,
  };
}

function buildRequestDefaultForm(requestMeta) {
  const requestType = requestMeta?.type_default || "nova_rotina";
  const sourceOptions =
    requestMeta?.source_options_by_type?.[requestType] ||
    requestMeta?.source_options ||
    [];
  const updateOptions =
    requestMeta?.update_options_by_type?.[requestType] ||
    requestMeta?.update_options ||
    [];

  return {
    tipoSolicitacao: requestType,
    solicitante: "",
    rotinaNome: "",
    origemTipo: sourceOptions[0]?.id || "",
    origemDetalhe: "",
    descricaoAtualizacao: "",
    atualizacaoTipo: updateOptions[0]?.id || "",
    atualizacaoDetalhe: "",
  };
}

function schedulerTargetLabel(rule) {
  return rule?.target_type === "all" ? "Todas as rotinas padrao" : rule?.base || "Sem rotina";
}

function schedulerIntervalLabel(rule, schedulerMeta) {
  const unitLabel = getOptionLabel(
    schedulerMeta?.interval_unit_options,
    rule?.interval_unit,
    rule?.interval_unit || "minutos",
  );

  return `${rule?.interval_value || 1} ${unitLabel}`;
}

function schedulerScheduleKindLabel(rule, schedulerMeta) {
  return getOptionLabel(
    schedulerMeta?.schedule_options,
    rule?.schedule_type,
    rule?.schedule_type || "Agendamento",
  );
}

function schedulerScheduleLabel(rule, schedulerMeta) {
  if (rule?.schedule_type === "daily") {
    return `Diario as ${rule?.time || "--:--"}`;
  }

  if (rule?.schedule_type === "interval_from_time") {
    const endTime = rule?.end_time ? ` ate ${rule.end_time}` : "";
    return `A cada ${schedulerIntervalLabel(rule, schedulerMeta)} desde ${rule?.start_time || "--:--"}${endTime}`;
  }

  return `A cada ${schedulerIntervalLabel(rule, schedulerMeta)}`;
}

function schedulerPeriodLabel(rule, reportsMeta, schedulerMeta) {
  const periodMeta =
    rule?.target_type === "all"
      ? schedulerMeta?.all_period_meta
      : getBasePeriodMeta(reportsMeta, rule?.base);

  return buildPeriodSummary(hydratePeriodStateFromItem(rule), periodMeta);
}

function schedulerGroupId(rule) {
  return rule?.target_type === "all" ? "all" : rule?.base || "sem-rotina";
}

function schedulerGroupLabel(rule) {
  return schedulerTargetLabel(rule);
}

function schedulerRuleMatchesFilters(rule, filters, reportsMeta, schedulerMeta) {
  const search = normalizeFilterText(filters.search);
  const searchableText = normalizeFilterText(
    [
      schedulerTargetLabel(rule),
      schedulerScheduleLabel(rule, schedulerMeta),
      schedulerPeriodLabel(rule, reportsMeta, schedulerMeta),
      schedulerScheduleKindLabel(rule, schedulerMeta),
      toBooleanLabel(rule?.enabled),
    ].join(" "),
  );

  if (search && !searchableText.includes(search)) {
    return false;
  }

  if (filters.base !== FILTER_ALL_VALUE && schedulerGroupId(rule) !== filters.base) {
    return false;
  }

  if (filters.period !== FILTER_ALL_VALUE && rule?.period_type !== filters.period) {
    return false;
  }

  if (
    filters.scheduleType !== FILTER_ALL_VALUE &&
    rule?.schedule_type !== filters.scheduleType
  ) {
    return false;
  }

  if (filters.enabled !== FILTER_ALL_VALUE) {
    return String(Boolean(rule?.enabled)) === filters.enabled;
  }

  return true;
}

function destinationGroupId(rule) {
  return String(rule?.nome || "Sem nome").trim() || "Sem nome";
}

function destinationSourceLabel(rule) {
  return rule?.migrated_from_sql ? "Migrado do SQL" : "Criado na interface";
}

function destinationListenLabel(rule, destinationMeta) {
  const listenOptions =
    destinationMeta?.listen_period_options_by_base?.[rule?.base] || [];
  return (
    rule?.listen_period_label ||
    getOptionLabel(listenOptions, rule?.listen_period_type, rule?.listen_period_type)
  );
}

function destinationRuleMatchesFilters(rule, filters, destinationMeta) {
  const search = normalizeFilterText(filters.search);
  const searchableText = normalizeFilterText(
    [
      rule?.nome,
      rule?.base,
      rule?.caminho,
      destinationListenLabel(rule, destinationMeta),
      destinationSourceLabel(rule),
      toBooleanLabel(rule?.enabled),
    ].join(" "),
  );

  if (search && !searchableText.includes(search)) {
    return false;
  }

  if (filters.owner !== FILTER_ALL_VALUE && destinationGroupId(rule) !== filters.owner) {
    return false;
  }

  if (filters.base !== FILTER_ALL_VALUE && rule?.base !== filters.base) {
    return false;
  }

  if (
    filters.period !== FILTER_ALL_VALUE &&
    (rule?.listen_period_type || "todos") !== filters.period
  ) {
    return false;
  }

  if (filters.enabled !== FILTER_ALL_VALUE) {
    return String(Boolean(rule?.enabled)) === filters.enabled;
  }

  if (filters.source !== FILTER_ALL_VALUE) {
    const source = rule?.migrated_from_sql ? "sql" : "interface";
    return source === filters.source;
  }

  return true;
}

function stripDestinationAccents(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function applyDestinationMonthCase(value, caseMode) {
  const rawValue = String(value ?? "");

  if (caseMode === "maiusculo") {
    return rawValue.toUpperCase();
  }

  if (caseMode === "titulo") {
    return rawValue.charAt(0).toUpperCase() + rawValue.slice(1).toLowerCase();
  }

  return rawValue.toLowerCase();
}

function formatDestinationMonthName(rule, monthIndex, forcedFormat = "") {
  const months = [
    "janeiro",
    "fevereiro",
    "marco",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const selectedFormat = String(forcedFormat || rule?.mesFormato || "completo").toLowerCase();
  const abbrSize = Math.min(Math.max(Number(rule?.mesAbreviacaoTamanho || 3), 1), 12);
  const baseName = months[Math.max(0, Math.min(monthIndex, 11))] || months[0];
  const formattedName =
    selectedFormat === "abreviado" ? baseName.slice(0, abbrSize) : baseName;
  const withoutAccent = rule?.mesSemAcento
    ? stripDestinationAccents(formattedName)
    : formattedName;

  return applyDestinationMonthCase(withoutAccent, rule?.mesCaixa || "minusculo");
}

function formatDestinationDate(rule, date) {
  const separator = String(rule?.dataSeparador ?? "_");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());

  if (rule?.dataOrdem === "ymd") {
    return [year, month, day].join(separator);
  }

  if (rule?.dataOrdem === "mdy") {
    return [month, day, year].join(separator);
  }

  return [day, month, year].join(separator);
}

function formatDestinationRoutineName(rule) {
  const separator = rule?.rotinaSeparador || "_";
  return String(rule?.base || "03_11_40").replace(/[_\s-]+/g, separator);
}

function buildDestinationTemplateContext(rule) {
  const sampleDate = new Date(2026, 2, 5);
  const sampleStart = new Date(2026, 2, 1);
  const sampleEnd = new Date(2026, 2, 31);

  return {
    rotina: formatDestinationRoutineName(rule),
    extensao: rule?.extensaoArquivo || ".csv",
    ano: "2026",
    ano_abreviado: "26",
    mes_nome: formatDestinationMonthName(rule, 2),
    mes_nome_completo: formatDestinationMonthName(rule, 2, "completo"),
    mes_nome_abreviado: formatDestinationMonthName(rule, 2, "abreviado"),
    mes_numero: "03",
    mes_numero_sem_zero: "3",
    dia: "05",
    dia_sem_zero: "5",
    data: formatDestinationDate(rule, sampleDate),
    data_inicial: formatDestinationDate(rule, sampleStart),
    data_final: formatDestinationDate(rule, sampleEnd),
    sep_nome: rule?.separator || "",
    periodo_legado: formatDestinationMonthName(rule, 2),
  };
}

function renderDestinationTemplateString(template, context) {
  return String(template || "").replace(/\{([^{}]+)\}/g, (_, token) =>
    Object.prototype.hasOwnProperty.call(context, token) ? context[token] : "",
  );
}

function sanitizeDestinationPreviewComponent(value) {
  return String(value || "").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
}

function buildDestinationPreviewPath(rule, periodType) {
  const context = buildDestinationTemplateContext(rule);
  const fileTemplates = {
    mensal: rule?.arquivoTemplateMensal,
    diario: rule?.arquivoTemplateDiario,
    periodo: rule?.arquivoTemplatePeriodo,
    sem_periodo: rule?.arquivoTemplateSemPeriodo,
  };
  const folderTemplates = {
    mensal: rule?.pastaTemplateMensal,
    diario: rule?.pastaTemplateDiario,
    periodo: rule?.pastaTemplatePeriodo,
    sem_periodo: rule?.pastaTemplateSemPeriodo,
  };
  const folder = sanitizeDestinationPreviewComponent(
    renderDestinationTemplateString(folderTemplates[periodType], context),
  );
  const file = sanitizeDestinationPreviewComponent(
    renderDestinationTemplateString(fileTemplates[periodType], context),
  );
  const extension = rule?.extensaoArquivo || ".csv";
  const fileWithExtension = file.endsWith(extension) ? file : `${file}${extension}`;
  const basePath = String(rule?.caminho || "D:\\Relatorios\\Promax").replace(/[\\/]$/, "");

  return [basePath, folder, fileWithExtension].filter(Boolean).join("\\");
}

function DestinationPreview({ form }) {
  const examples = [
    ["Mensal", buildDestinationPreviewPath(form, "mensal")],
    ["Diario", buildDestinationPreviewPath(form, "diario")],
    ["Periodo", buildDestinationPreviewPath(form, "periodo")],
    ["Sem periodo", buildDestinationPreviewPath(form, "sem_periodo")],
  ];

  return (
    <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-4">
      <p className="text-sm font-semibold text-[var(--shell-text)]">
        Exemplos de destino
      </p>
      <div className="mt-3 space-y-2">
        {examples.map(([label, path]) => (
          <p
            key={label}
            className="break-words rounded-xl bg-[var(--shell-surface-strong)] px-3 py-2 font-mono text-xs leading-5 text-[var(--shell-muted)]"
          >
            <span className="font-semibold text-[var(--shell-text)]">{label}: </span>
            {path}
          </p>
        ))}
      </div>
    </div>
  );
}

function ExtratorManagerScreen() {
  const {
    batchesPayload,
    clientHistoryPayload,
    clientLogPayload,
    destinationsPayload,
    error,
    lastUpdatedAt,
    loadingAction,
    loadClientHistory,
    refreshAll,
    requestsPayload,
    runAction,
    schedulerPayload,
    status,
    statusPayload,
  } = useExtratorManager();
  const [routeActiveTab] = useState(getInitialActiveTabFromUrl);
  const [activeTabOverride, setActiveTabOverride] = useState(null);
  const [operationFormDraft, setOperationFormDraft] = useState(null);
  const [batchDraft, setBatchDraft] = useState({
    id: "",
    nome: "",
    senha: "",
    items: [],
  });
  const [schedulerFormDraft, setSchedulerFormDraft] = useState(null);
  const [destinationFormDraft, setDestinationFormDraft] = useState(null);
  const [requestFormDraft, setRequestFormDraft] = useState(null);
  const [isClientLogExpanded, setIsClientLogExpanded] = useState(false);
  const clientTechnicalLogId = useId();
  const [isOperationBaseLocked, setIsOperationBaseLocked] = useState(false);
  const [schedulerFilters, setSchedulerFilters] = useState({
    search: "",
    base: FILTER_ALL_VALUE,
    period: FILTER_ALL_VALUE,
    scheduleType: FILTER_ALL_VALUE,
    enabled: FILTER_ALL_VALUE,
  });
  const [destinationFilters, setDestinationFilters] = useState({
    search: "",
    owner: FILTER_ALL_VALUE,
    base: FILTER_ALL_VALUE,
    period: FILTER_ALL_VALUE,
    enabled: FILTER_ALL_VALUE,
    source: FILTER_ALL_VALUE,
  });
  const [expandedSchedulerGroups, setExpandedSchedulerGroups] = useState({});
  const [expandedDestinationGroups, setExpandedDestinationGroups] = useState({});
  const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
  const [isDestinationHelpOpen, setIsDestinationHelpOpen] = useState(false);
  const [isRequestCreateModalOpen, setIsRequestCreateModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [passwordActionModal, setPasswordActionModal] = useState(null);
  const [passwordActionValue, setPasswordActionValue] = useState("");
  const [passwordActionError, setPasswordActionError] = useState("");
  const [passwordActionSubmitting, setPasswordActionSubmitting] = useState(false);
  const passwordActionInputRef = useRef(null);

  const reportsMeta = statusPayload?.reports_meta || {};
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
    operationFormCandidate.base || (hasOperationFormDraft ? "" : defaultOperationBase);
  const operationPeriodMeta = operationBase
    ? getBasePeriodMeta(reportsMeta, operationBase)
    : null;
  const operationForm = operationBase
    ? {
        ...derivePeriodState(
          {
            ...operationFormCandidate,
            base: operationBase,
          },
          operationPeriodMeta,
        ),
        base: operationBase,
      }
    : operationFormCandidate;
  const schedulerMeta = schedulerPayload?.scheduler_meta || null;
  const schedulerDefaultForm = schedulerMeta
    ? buildSchedulerDefaultForm(schedulerMeta)
    : null;
  const schedulerFormCandidate = schedulerFormDraft || schedulerDefaultForm;
  const schedulerPeriodMeta = schedulerFormCandidate
    ? schedulerFormCandidate.targetType === "all"
      ? schedulerMeta?.all_period_meta
      : getBasePeriodMeta(reportsMeta, schedulerFormCandidate.base)
    : null;
  const schedulerForm = schedulerFormCandidate
    ? derivePeriodState(schedulerFormCandidate, schedulerPeriodMeta)
    : null;
  const destinationMeta = destinationsPayload?.destination_meta || null;
  const destinationDefaultForm = destinationMeta
    ? buildDestinationDefaultForm(destinationMeta)
    : null;
  const destinationFormCandidate =
    destinationFormDraft || destinationDefaultForm;
  const selectedDestinationListenOptions =
    destinationMeta?.listen_period_options_by_base?.[
      destinationFormCandidate?.base
    ] || [];
  const destinationForm = destinationFormCandidate
    ? {
        ...destinationFormCandidate,
        listenPeriodType: selectedDestinationListenOptions.some(
          (option) => option.id === destinationFormCandidate.listenPeriodType,
        )
          ? destinationFormCandidate.listenPeriodType
          : selectedDestinationListenOptions[0]?.id ||
            destinationMeta?.listen_period_default ||
            "todos",
      }
    : null;
  const requestMeta = requestsPayload?.request_meta || null;
  const requestDefaultForm = requestMeta
    ? buildRequestDefaultForm(requestMeta)
    : null;
  const requestFormCandidate = requestFormDraft || requestDefaultForm;
  const requestSourceOptions =
    requestMeta?.source_options_by_type?.[requestFormCandidate?.tipoSolicitacao] ||
    requestMeta?.source_options ||
    [];
  const requestUpdateOptions =
    requestMeta?.update_options_by_type?.[requestFormCandidate?.tipoSolicitacao] ||
    requestMeta?.update_options ||
    [];
  const requestForm = requestFormCandidate
    ? {
        ...requestFormCandidate,
        origemTipo: requestSourceOptions.some(
          (option) => option.id === requestFormCandidate.origemTipo,
        )
          ? requestFormCandidate.origemTipo
          : requestSourceOptions[0]?.id || "",
        atualizacaoTipo: requestUpdateOptions.some(
          (option) => option.id === requestFormCandidate.atualizacaoTipo,
        )
          ? requestFormCandidate.atualizacaoTipo
          : requestUpdateOptions[0]?.id || "",
      }
    : null;
  const selectedRequest = (requestsPayload?.requests || []).find(
    (requestItem) => requestItem.id === selectedRequestId,
  );
  const activeTab = activeTabOverride || routeActiveTab;

  const schedulerRules = schedulerPayload?.rules || [];
  const filteredSchedulerRules = schedulerRules.filter((rule) =>
    schedulerRuleMatchesFilters(rule, schedulerFilters, reportsMeta, schedulerMeta),
  );
  const schedulerGroups = groupRules(
    filteredSchedulerRules,
    schedulerGroupId,
    schedulerGroupLabel,
  );
  const schedulerBaseFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todas as rotinas" },
    ...uniqueOptions(
      schedulerRules.map((rule) => ({
        id: schedulerGroupId(rule),
        label: schedulerGroupLabel(rule),
      })),
    ),
  ];
  const schedulerPeriodFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todas as atualizacoes" },
    ...uniqueOptions(
      schedulerRules.map((rule) => ({
        id: rule.period_type,
        label: schedulerPeriodLabel(rule, reportsMeta, schedulerMeta).split(":")[0],
      })),
    ),
  ];
  const schedulerScheduleFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todos os disparos" },
    ...(schedulerMeta?.schedule_options || []),
  ];
  const destinationRules = destinationsPayload?.rules || [];
  const filteredDestinationRules = destinationRules.filter((rule) =>
    destinationRuleMatchesFilters(rule, destinationFilters, destinationMeta),
  );
  const destinationGroups = groupRules(
    filteredDestinationRules,
    destinationGroupId,
    destinationGroupId,
  );
  const destinationOwnerFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todos os criadores" },
    ...uniqueOptions(
      destinationRules.map((rule) => ({
        id: destinationGroupId(rule),
        label: destinationGroupId(rule),
      })),
    ),
  ];
  const destinationBaseFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todas as rotinas" },
    ...uniqueOptions(
      destinationRules.map((rule) => ({
        id: rule.base,
        label: rule.base || "Sem rotina",
      })),
    ),
  ];
  const destinationPeriodFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todas as atualizacoes" },
    ...uniqueOptions(
      destinationRules.map((rule) => ({
        id: rule.listen_period_type || "todos",
        label: destinationListenLabel(rule, destinationMeta),
      })),
    ),
  ];
  const destinationSourceFilterOptions = [
    { id: FILTER_ALL_VALUE, label: "Todas as origens" },
    { id: "interface", label: "Criado na interface" },
    { id: "sql", label: "Migrado do SQL" },
  ];

  useEffect(() => {
    if (!passwordActionModal?.isOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      passwordActionInputRef.current?.focus();
    }, 0);

    function handleKeyDown(event) {
      if (event.key === "Escape" && !passwordActionSubmitting) {
        setPasswordActionModal(null);
        setPasswordActionValue("");
        setPasswordActionError("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [passwordActionModal, passwordActionSubmitting]);

  function closePasswordActionModal() {
    if (passwordActionSubmitting) {
      return;
    }

    setPasswordActionModal(null);
    setPasswordActionValue("");
    setPasswordActionError("");
  }

  function openPasswordActionModal(config) {
    setPasswordActionModal({
      isOpen: true,
      ...config,
    });
    setPasswordActionValue("");
    setPasswordActionError("");
  }

  function toggleOperationBaseLock() {
    if (!operationForm.base && !isOperationBaseLocked) {
      return;
    }

    setIsOperationBaseLocked((current) => !current);
  }

  function resetSchedulerFilters() {
    setSchedulerFilters({
      search: "",
      base: FILTER_ALL_VALUE,
      period: FILTER_ALL_VALUE,
      scheduleType: FILTER_ALL_VALUE,
      enabled: FILTER_ALL_VALUE,
    });
  }

  function resetDestinationFilters() {
    setDestinationFilters({
      search: "",
      owner: FILTER_ALL_VALUE,
      base: FILTER_ALL_VALUE,
      period: FILTER_ALL_VALUE,
      enabled: FILTER_ALL_VALUE,
      source: FILTER_ALL_VALUE,
    });
  }

  function toggleSchedulerGroup(groupId) {
    setExpandedSchedulerGroups((current) => ({
      ...current,
      [groupId]: current[groupId] === false,
    }));
  }

  function toggleDestinationGroup(groupId) {
    setExpandedDestinationGroups((current) => ({
      ...current,
      [groupId]: current[groupId] === false,
    }));
  }

  function openSchedulerCreateModal() {
    setSchedulerForm(buildSchedulerDefaultForm(schedulerPayload?.scheduler_meta));
    setIsSchedulerModalOpen(true);
  }

  function openSchedulerEditModal(rule) {
    loadSchedulerRuleIntoForm(rule);
    setIsSchedulerModalOpen(true);
  }

  function openDestinationCreateModal() {
    setDestinationForm(
      buildDestinationDefaultForm(destinationsPayload?.destination_meta),
    );
    setIsDestinationModalOpen(true);
  }

  function openDestinationEditModal(rule) {
    loadDestinationRuleIntoForm(rule);
    setIsDestinationModalOpen(true);
  }

  async function submitPasswordActionModal() {
    if (!passwordActionModal?.run) {
      return;
    }

    const password = passwordActionValue.trim();

    if (!password) {
      setPasswordActionError(
        passwordActionModal.requiredMessage || "Informe a senha para continuar.",
      );
      return;
    }

    setPasswordActionSubmitting(true);
    setPasswordActionError("");

    try {
      await passwordActionModal.run(password);
      setPasswordActionModal(null);
      setPasswordActionValue("");
    } catch (modalError) {
      setPasswordActionError(
        modalError instanceof Error && modalError.message
          ? modalError.message
          : "Erro ao confirmar a acao protegida.",
      );
    } finally {
      setPasswordActionSubmitting(false);
    }
  }

  function setOperationForm(nextValue) {
    setOperationFormDraft((currentDraft) => {
      const currentForm = currentDraft || defaultOperationForm;
      const draftUpdate =
        typeof nextValue === "function" ? nextValue(currentForm) : nextValue;
      const mergedForm = {
        ...currentForm,
        ...(draftUpdate || {}),
      };
      const nextBase = mergedForm.base || "";

      if (!nextBase) {
        return {
          ...EMPTY_OPERATION_FORM,
          ...(draftUpdate || {}),
        };
      }

      return {
        ...derivePeriodState(
          {
            ...mergedForm,
            base: nextBase,
          },
          getBasePeriodMeta(reportsMeta, nextBase),
        ),
        base: nextBase,
      };
    });
  }

  function setSchedulerForm(nextValue) {
    setSchedulerFormDraft((currentDraft) => {
      const currentForm = currentDraft || schedulerDefaultForm;

      if (!currentForm) {
        return currentDraft;
      }

      const draftUpdate =
        typeof nextValue === "function" ? nextValue(currentForm) : nextValue;
      const mergedForm = {
        ...currentForm,
        ...(draftUpdate || {}),
      };
      const periodMeta =
        mergedForm.targetType === "all"
          ? schedulerMeta?.all_period_meta
          : getBasePeriodMeta(reportsMeta, mergedForm.base);

      return derivePeriodState(mergedForm, periodMeta);
    });
  }

  function setDestinationForm(nextValue) {
    setDestinationFormDraft((currentDraft) => {
      const currentForm = currentDraft || destinationDefaultForm;

      if (!currentForm) {
        return currentDraft;
      }

      const draftUpdate =
        typeof nextValue === "function" ? nextValue(currentForm) : nextValue;
      const mergedForm = {
        ...currentForm,
        ...(draftUpdate || {}),
      };
      const listenOptions =
        destinationMeta?.listen_period_options_by_base?.[mergedForm.base] || [];

      return {
        ...mergedForm,
        listenPeriodType: listenOptions.some(
          (option) => option.id === mergedForm.listenPeriodType,
        )
          ? mergedForm.listenPeriodType
          : listenOptions[0]?.id || destinationMeta?.listen_period_default || "todos",
      };
    });
  }

  function setRequestForm(nextValue) {
    setRequestFormDraft((currentDraft) => {
      const currentForm = currentDraft || requestDefaultForm;

      if (!currentForm) {
        return currentDraft;
      }

      const draftUpdate =
        typeof nextValue === "function" ? nextValue(currentForm) : nextValue;
      const mergedForm = {
        ...currentForm,
        ...(draftUpdate || {}),
      };
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

  function updateOperationBase(base) {
    const nextPeriodMeta = getBasePeriodMeta(reportsMeta, base);
    const defaultPeriodState = buildDefaultPeriodState(nextPeriodMeta);
    setOperationForm({
      base,
      ...defaultPeriodState,
    });
  }

  function buildOperationRequest() {
    return serializeTaskForRequest(operationForm.base, operationForm);
  }

  async function handleRunSingle() {
    await runAction(
      "executar rotina",
      () => extratorApi.enqueue(buildOperationRequest()),
      {
        historyPage: clientHistoryPayload?.page || 1,
        historyPageSize: clientHistoryPayload?.page_size || 8,
      },
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
      {
        historyPage: clientHistoryPayload?.page || 1,
        historyPageSize: clientHistoryPayload?.page_size || 8,
      },
    );
  }

  async function handleSaveBatch() {
    openPasswordActionModal({
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
          {
            historyPage: clientHistoryPayload?.page || 1,
            historyPageSize: clientHistoryPayload?.page_size || 8,
          },
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
    openPasswordActionModal({
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
          {
            historyPage: clientHistoryPayload?.page || 1,
            historyPageSize: clientHistoryPayload?.page_size || 8,
          },
        );

        if (batchDraft.id === batchId) {
          setBatchDraft({
            id: "",
            nome: "",
            senha: "",
            items: [],
          });
        }
      },
    });
  }

  async function handleCancelTask(taskId) {
    await runAction(
      "cancelar tarefa",
      () => extratorApi.cancelTask({ task_id: taskId }),
      {
        historyPage: clientHistoryPayload?.page || 1,
        historyPageSize: clientHistoryPayload?.page_size || 8,
      },
    );
  }

  async function handleCancelTaskGroup(taskIds) {
    await runAction(
      "cancelar grupo de tarefas",
      () => extratorApi.cancelTask({ task_ids: taskIds }),
      {
        historyPage: clientHistoryPayload?.page || 1,
        historyPageSize: clientHistoryPayload?.page_size || 8,
      },
    );
  }

  async function handleChangeClientHistoryPage(direction) {
    const nextPage = Math.max(1, (clientHistoryPayload?.page || 1) + direction);
    await loadClientHistory({
      page: nextPage,
      pageSize: clientHistoryPayload?.page_size || 8,
    });
  }

  function syncSchedulerForm(nextForm) {
    const periodMeta =
      nextForm.targetType === "all"
        ? schedulerPayload?.scheduler_meta?.all_period_meta
        : getBasePeriodMeta(reportsMeta, nextForm.base);
    const derivedPeriodState = derivePeriodState(nextForm, periodMeta);
    setSchedulerForm({
      ...nextForm,
      ...derivedPeriodState,
    });
  }

  function loadSchedulerRuleIntoForm(rule) {
    setSchedulerForm({
      id: rule.id || "",
      targetType: rule.target_type || "base",
      base: rule.base || "",
      scheduleType: rule.schedule_type || "daily",
      time: rule.time || "06:00",
      startTime: rule.start_time || "06:00",
      endTime: rule.end_time || "",
      intervalValue: String(rule.interval_value || 1),
      intervalUnit: rule.interval_unit || "hours",
      enabled: Boolean(rule.enabled),
      senha: "",
      ...hydratePeriodStateFromItem({
        period_type: rule.period_type,
        period_mode: rule.period_mode,
        period_args: rule.period_args,
      }),
    });
  }

  async function handleSaveSchedulerRule() {
    openPasswordActionModal({
      title: schedulerForm.id ? "Atualizar regra do scheduler" : "Criar regra do scheduler",
      subtitle: schedulerForm.id
        ? `Informe a senha cadastrada para atualizar a regra '${schedulerForm.base || "Todas as rotinas"}'.`
        : `Defina a senha que vai proteger a regra '${schedulerForm.base || "Todas as rotinas"}'.`,
      label: "Senha da regra",
      placeholder: schedulerForm.id
        ? "Obrigatoria para editar a regra"
        : "Obrigatoria para criar a regra",
      submitLabel: schedulerForm.id ? "Salvar alteracao" : "Criar regra",
      requiredMessage: "Informe a senha da regra antes de salvar.",
      run: async (password) => {
        await runAction(
          "salvar regra do scheduler",
          () =>
            extratorApi.saveSchedulerRule({
              id: schedulerForm.id || undefined,
              target_type: schedulerForm.targetType,
              base: schedulerForm.base,
              schedule_type: schedulerForm.scheduleType,
              time: schedulerForm.time,
              start_time: schedulerForm.startTime,
              end_time: schedulerForm.endTime,
              interval_value: Number.parseInt(
                schedulerForm.intervalValue || "1",
                10,
              ),
              interval_unit: schedulerForm.intervalUnit,
              enabled: schedulerForm.enabled,
              senha: password,
              period_type: schedulerForm.periodType,
              period_mode: schedulerForm.periodMode,
              period_args: buildPeriodArgs(schedulerForm),
            }),
          {
            historyPage: clientHistoryPayload?.page || 1,
            historyPageSize: clientHistoryPayload?.page_size || 8,
          },
        );

        setSchedulerForm(buildSchedulerDefaultForm(schedulerPayload?.scheduler_meta));
        setIsSchedulerModalOpen(false);
      },
    });
  }

  async function handleToggleSchedulerRule(rule) {
    openPasswordActionModal({
      title: rule.enabled ? "Pausar regra do scheduler" : "Habilitar regra do scheduler",
      subtitle: `Informe a senha cadastrada para ${rule.enabled ? "pausar" : "habilitar"} a regra '${rule.base || "Todas as rotinas"}'.`,
      label: "Senha da regra",
      placeholder: "Obrigatoria para alterar o status",
      submitLabel: rule.enabled ? "Pausar regra" : "Habilitar regra",
      requiredMessage: "Informe a senha desta regra antes de alterar seu status.",
      run: async (password) => {
        await runAction(
          "alterar status do scheduler",
          () =>
            extratorApi.setSchedulerRuleEnabled({
              id: rule.id,
              enabled: !rule.enabled,
              senha: password,
            }),
          {
            historyPage: clientHistoryPayload?.page || 1,
            historyPageSize: clientHistoryPayload?.page_size || 8,
          },
        );
      },
    });
  }

  async function handleDeleteSchedulerRule(ruleId) {
    const rule = (schedulerPayload?.rules || []).find((item) => item.id === ruleId);

    openPasswordActionModal({
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
          {
            historyPage: clientHistoryPayload?.page || 1,
            historyPageSize: clientHistoryPayload?.page_size || 8,
          },
        );
      },
    });
  }

  function loadDestinationRuleIntoForm(rule) {
    setDestinationForm({
      id: rule.id || "",
      base: rule.base || "",
      nome: rule.nome || "",
      senha: "",
      caminho: rule.caminho || "",
      enabled: Boolean(rule.enabled),
      listenPeriodType: rule.listen_period_type || "todos",
      prefixo: rule.prefixo || "",
      sufixo: rule.sufixo || "",
      includeRotina: Boolean(rule.include_rotina),
      stackPath: Boolean(rule.stack_path),
      separator: rule.sep || "",
      rotinaSeparador: rule.rotina_separador || "_",
      extensaoArquivo: rule.extensao_arquivo || ".csv",
      mesFormato: rule.mes_formato || "completo",
      mesAbreviacaoTamanho: String(rule.mes_abreviacao_tamanho || 3),
      mesCaixa: rule.mes_caixa || "minusculo",
      mesSemAcento: Boolean(rule.mes_sem_acento),
      dataOrdem: rule.data_ordem || "dmy",
      dataSeparador: rule.data_separador || "_",
      arquivoTemplateMensal: rule.arquivo_template_mensal || "",
      arquivoTemplateDiario: rule.arquivo_template_diario || "",
      arquivoTemplatePeriodo: rule.arquivo_template_periodo || "",
      arquivoTemplateSemPeriodo: rule.arquivo_template_sem_periodo || "",
      pastaTemplateMensal: rule.pasta_template_mensal || "",
      pastaTemplateDiario: rule.pasta_template_diario || "",
      pastaTemplatePeriodo: rule.pasta_template_periodo || "",
      pastaTemplateSemPeriodo: rule.pasta_template_sem_periodo || "",
    });
  }

  async function handleSaveDestinationRule() {
    openPasswordActionModal({
      title: destinationForm.id ? "Atualizar destino" : "Salvar destino",
      subtitle: destinationForm.id
        ? `Informe a senha cadastrada para atualizar o destino '${destinationForm.nome || destinationForm.base}'.`
        : `Defina a senha que vai proteger o destino '${destinationForm.nome || destinationForm.base}'.`,
      label: "Senha do destino",
      placeholder: destinationForm.id
        ? "Obrigatoria para alterar o destino"
        : "Obrigatoria para salvar o destino",
      submitLabel: destinationForm.id ? "Salvar alteracao" : "Salvar destino",
      requiredMessage: "Informe a senha do destino antes de salvar.",
      run: async (password) => {
        await runAction(
          "salvar destino",
          () =>
            extratorApi.saveDestinationRule({
              id: destinationForm.id || undefined,
              base: destinationForm.base,
              nome: destinationForm.nome,
              senha: password,
              caminho: destinationForm.caminho,
              enabled: destinationForm.enabled,
              listen_period_type: destinationForm.listenPeriodType,
              prefixo: destinationForm.prefixo,
              sufixo: destinationForm.sufixo,
              include_rotina: destinationForm.includeRotina,
              stack_path: destinationForm.stackPath,
              sep: destinationForm.separator,
              rotina_separador: destinationForm.rotinaSeparador,
              extensao_arquivo: destinationForm.extensaoArquivo,
              mes_formato: destinationForm.mesFormato,
              mes_abreviacao_tamanho: Number.parseInt(
                destinationForm.mesAbreviacaoTamanho || "3",
                10,
              ),
              mes_caixa: destinationForm.mesCaixa,
              mes_sem_acento: destinationForm.mesSemAcento,
              data_ordem: destinationForm.dataOrdem,
              data_separador: destinationForm.dataSeparador,
              arquivo_template_mensal: destinationForm.arquivoTemplateMensal,
              arquivo_template_diario: destinationForm.arquivoTemplateDiario,
              arquivo_template_periodo: destinationForm.arquivoTemplatePeriodo,
              arquivo_template_sem_periodo:
                destinationForm.arquivoTemplateSemPeriodo,
              pasta_template_mensal: destinationForm.pastaTemplateMensal,
              pasta_template_diario: destinationForm.pastaTemplateDiario,
              pasta_template_periodo: destinationForm.pastaTemplatePeriodo,
              pasta_template_sem_periodo: destinationForm.pastaTemplateSemPeriodo,
            }),
          {
            historyPage: clientHistoryPayload?.page || 1,
            historyPageSize: clientHistoryPayload?.page_size || 8,
          },
        );

        setDestinationForm(
          buildDestinationDefaultForm(destinationsPayload?.destination_meta),
        );
        setIsDestinationModalOpen(false);
      },
    });
  }

  async function handleDeleteDestinationRule(ruleId) {
    const rule = (destinationsPayload?.rules || []).find((item) => item.id === ruleId);

    openPasswordActionModal({
      title: "Remover destino personalizado",
      subtitle: `Informe a senha cadastrada para remover o destino '${rule?.nome || rule?.base || ruleId}'.`,
      label: "Senha do destino",
      placeholder: "Obrigatoria para remover o destino",
      submitLabel: "Remover destino",
      requiredMessage: "Informe a senha desta regra antes de remover o destino.",
      run: async (password) => {
        await runAction(
          "excluir destino",
          () => extratorApi.deleteDestinationRule({ id: ruleId, senha: password }),
          {
            historyPage: clientHistoryPayload?.page || 1,
            historyPageSize: clientHistoryPayload?.page_size || 8,
          },
        );
      },
    });
  }

  function syncRequestType(nextType) {
    const requestMeta = requestsPayload?.request_meta;
    const sourceOptions =
      requestMeta?.source_options_by_type?.[nextType] || requestMeta?.source_options || [];
    const updateOptions =
      requestMeta?.update_options_by_type?.[nextType] || requestMeta?.update_options || [];

    setRequestForm((currentForm) => ({
      ...currentForm,
      tipoSolicitacao: nextType,
      origemTipo: sourceOptions[0]?.id || "",
      origemDetalhe: "",
      atualizacaoTipo: updateOptions[0]?.id || "",
      atualizacaoDetalhe: "",
    }));
  }

  async function handleSaveRequest() {
    await runAction(
      "salvar solicitacao",
      () =>
        extratorApi.saveRequest({
          tipo_solicitacao: requestForm.tipoSolicitacao,
          solicitante: requestForm.solicitante,
          rotina_nome: requestForm.rotinaNome,
          origem_tipo: requestForm.origemTipo,
          origem_detalhe: requestForm.origemDetalhe,
          descricao_atualizacao: requestForm.descricaoAtualizacao,
          atualizacao_tipo: requestForm.atualizacaoTipo,
          atualizacao_detalhe: requestForm.atualizacaoDetalhe,
        }),
      {
        historyPage: clientHistoryPayload?.page || 1,
        historyPageSize: clientHistoryPayload?.page_size || 8,
      },
    );

    setRequestForm(buildRequestDefaultForm(requestsPayload?.request_meta));
    setIsRequestCreateModalOpen(false);
  }

  async function handleUpdateRequestStatus(requestId, nextStatus) {
    const requestItem = (requestsPayload?.requests || []).find(
      (item) => item.id === requestId,
    );
    const statusLabel =
      (requestMeta?.status_options || []).find((item) => item.id === nextStatus)
        ?.label || nextStatus;

    openPasswordActionModal({
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
          {
            historyPage: clientHistoryPayload?.page || 1,
            historyPageSize: clientHistoryPayload?.page_size || 8,
          },
        );
      },
    });
  }

  return (
    <ExtratorPageShell
      title="Extrator"
      activeTab={activeTab}
      onTabChange={setActiveTabOverride}
      error={error}
      actions={
        <ActionButton
          onClick={() =>
            void refreshAll({
              historyPage: clientHistoryPayload?.page || 1,
              historyPageSize: clientHistoryPayload?.page_size || 8,
            })
          }
          disabled={status === "loading" || Boolean(loadingAction)}
        >
          Atualizar tudo
        </ActionButton>
      }
      headerAfter={
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatusPill
              label="Executando"
              value={statusPayload?.executando ? "Sim" : "Nao"}
              note={`${statusPayload?.workers_ativos || 0}/${statusPayload?.workers_maximos || 0} worker(s) ativo(s).`}
              tone={statusPayload?.executando ? "accent" : "default"}
            />
            <StatusPill
              label="Ultima tarefa"
              value={statusPayload?.ultima_tarefa || "Nenhuma"}
              note={lastUpdatedAt ? `Painel atualizado em ${formatDateTime(lastUpdatedAt)}.` : ""}
            />
            <StatusPill
              label="Na fila"
              value={statusPayload?.fila_tamanho || 0}
              note="Tarefas aguardando processamento."
              tone={statusPayload?.fila_tamanho ? "accent" : "default"}
            />
            <StatusPill
              label="Scheduler"
              value={statusPayload?.scheduler_enabled_count || 0}
              note={`${statusPayload?.scheduler_rules_count || 0} regra(s) cadastrada(s).`}
              tone={statusPayload?.scheduler_enabled_count ? "accent" : "default"}
            />
        </div>
      }
    >

        {activeTab === "operacoes" ? (
          <ExtratorExtractionSection
            bases={bases}
            batchDraft={batchDraft}
            batchesPayload={batchesPayload}
            clientHistoryPayload={clientHistoryPayload}
            clientLogPayload={clientLogPayload}
            clientTechnicalLogId={clientTechnicalLogId}
            handleAddCurrentToBatch={handleAddCurrentToBatch}
            handleCancelTask={handleCancelTask}
            handleCancelTaskGroup={handleCancelTaskGroup}
            handleChangeClientHistoryPage={handleChangeClientHistoryPage}
            handleDeleteBatch={handleDeleteBatch}
            handleLoadBatch={handleLoadBatch}
            handleRemoveBatchItem={handleRemoveBatchItem}
            handleRunBatch={handleRunBatch}
            handleRunSingle={handleRunSingle}
            handleSaveBatch={handleSaveBatch}
            isClientLogExpanded={isClientLogExpanded}
            isOperationBaseLocked={isOperationBaseLocked}
            loadingAction={loadingAction}
            operationForm={operationForm}
            operationPeriodMeta={operationPeriodMeta}
            reportsMeta={reportsMeta}
            setBatchDraft={setBatchDraft}
            setIsClientLogExpanded={setIsClientLogExpanded}
            setOperationForm={setOperationForm}
            toggleOperationBaseLock={toggleOperationBaseLock}
            updateOperationBase={updateOperationBase}
          />
        ) : null}
        {activeTab === "scheduler" && schedulerForm ? (
          <ExtratorSchedulerSection
            bases={bases}
            clientHistoryPayload={clientHistoryPayload}
            expandedSchedulerGroups={expandedSchedulerGroups}
            filteredSchedulerRules={filteredSchedulerRules}
            filterAllValue={FILTER_ALL_VALUE}
            formatCountLabel={formatCountLabel}
            formatDateTime={formatDateTime}
            handleDeleteSchedulerRule={handleDeleteSchedulerRule}
            handleSaveSchedulerRule={handleSaveSchedulerRule}
            handleToggleSchedulerRule={handleToggleSchedulerRule}
            isSchedulerModalOpen={isSchedulerModalOpen}
            loadingAction={loadingAction}
            openSchedulerCreateModal={openSchedulerCreateModal}
            openSchedulerEditModal={openSchedulerEditModal}
            refreshAll={refreshAll}
            reportsMeta={reportsMeta}
            resetSchedulerFilters={resetSchedulerFilters}
            schedulerBaseFilterOptions={schedulerBaseFilterOptions}
            schedulerFilters={schedulerFilters}
            schedulerForm={schedulerForm}
            schedulerGroups={schedulerGroups}
            schedulerIntervalLabel={schedulerIntervalLabel}
            schedulerMeta={schedulerMeta}
            schedulerPeriodFilterOptions={schedulerPeriodFilterOptions}
            schedulerPeriodLabel={schedulerPeriodLabel}
            schedulerPeriodMeta={schedulerPeriodMeta}
            schedulerRules={schedulerRules}
            schedulerScheduleFilterOptions={schedulerScheduleFilterOptions}
            schedulerScheduleKindLabel={schedulerScheduleKindLabel}
            schedulerScheduleLabel={schedulerScheduleLabel}
            schedulerTargetLabel={schedulerTargetLabel}
            schedulerTargetOptions={schedulerMeta?.target_options || []}
            setExpandedSchedulerGroups={setExpandedSchedulerGroups}
            setIsSchedulerModalOpen={setIsSchedulerModalOpen}
            setSchedulerForm={setSchedulerForm}
            setSchedulerFilters={setSchedulerFilters}
            status={status}
            summarizeGroups={summarizeGroups}
            syncSchedulerForm={syncSchedulerForm}
            toBooleanLabel={toBooleanLabel}
          />
        ) : null}
        {activeTab === "destinos" && destinationForm ? (
          <ExtratorDestinationsSection
            clientHistoryPayload={clientHistoryPayload}
            DestinationPreview={DestinationPreview}
            destinationBaseFilterOptions={destinationBaseFilterOptions}
            destinationFilters={destinationFilters}
            destinationForm={destinationForm}
            destinationFormBaseOptions={destinationFormBaseOptions}
            destinationGroups={destinationGroups}
            destinationListenOptions={destinationListenOptions}
            destinationOwnerFilterOptions={destinationOwnerFilterOptions}
            destinationPeriodFilterOptions={destinationPeriodFilterOptions}
            destinationRules={destinationRules}
            destinationSourceFilterOptions={destinationSourceFilterOptions}
            destinationsPayload={destinationsPayload}
            expandedDestinationGroups={expandedDestinationGroups}
            filteredDestinationRules={filteredDestinationRules}
            filterAllValue={FILTER_ALL_VALUE}
            formatCountLabel={formatCountLabel}
            formatDateTime={formatDateTime}
            handleDeleteDestinationRule={handleDeleteDestinationRule}
            handleSaveDestinationRule={handleSaveDestinationRule}
            isDestinationModalOpen={isDestinationModalOpen}
            loadingAction={loadingAction}
            openDestinationCreateModal={openDestinationCreateModal}
            openDestinationEditModal={openDestinationEditModal}
            refreshAll={refreshAll}
            resetDestinationFilters={resetDestinationFilters}
            selectedDestinationListenOptions={selectedDestinationListenOptions}
            setDestinationFilters={setDestinationFilters}
            setDestinationForm={setDestinationForm}
            setExpandedDestinationGroups={setExpandedDestinationGroups}
            setIsDestinationHelpOpen={setIsDestinationHelpOpen}
            setIsDestinationModalOpen={setIsDestinationModalOpen}
            status={status}
            summarizeGroups={summarizeGroups}
            syncDestinationForm={syncDestinationForm}
            toBooleanLabel={toBooleanLabel}
          />
        ) : null}

        {activeTab === "solicitacoes" && requestForm ? (
          <ExtratorRequestsSection
            clientHistoryPayload={clientHistoryPayload}
            handleSaveRequest={handleSaveRequest}
            handleUpdateRequestStatus={handleUpdateRequestStatus}
            isRequestCreateModalOpen={isRequestCreateModalOpen}
            loadingAction={loadingAction}
            refreshAll={refreshAll}
            requestForm={requestForm}
            requestMeta={requestMeta}
            requestsPayload={requestsPayload}
            requestSourceOptions={requestSourceOptions}
            requestUpdateOptions={requestUpdateOptions}
            setIsRequestCreateModalOpen={setIsRequestCreateModalOpen}
            setRequestForm={setRequestForm}
            setSelectedRequestId={setSelectedRequestId}
            status={status}
            syncRequestType={syncRequestType}
          />
        ) : null}

        {isDestinationHelpOpen ? (
          <ModalFrame
            title="Tokens disponiveis"
            subtitle="Use os tokens nos templates de arquivo e pasta. A pre-visualizacao do destino atualiza conforme os campos mudam."
            onClose={() => setIsDestinationHelpOpen(false)}
            maxWidth="max-w-4xl"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {(destinationsPayload?.destination_meta?.template_token_options || []).map(
                (token) => (
                  <div
                    key={token.id}
                    className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4"
                  >
                    <p className="font-mono text-sm font-semibold text-[var(--shell-text)]">
                      {`{${token.id}}`}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
                      {token.label}
                    </p>
                    <p className="mt-2 text-xs text-[var(--shell-muted)]">
                      Exemplo: {token.example || "-"}
                    </p>
                  </div>
                ),
              )}
            </div>
          </ModalFrame>
        ) : null}

        {selectedRequest ? (
          <ModalFrame
            title={selectedRequest.rotina_nome || "Solicitacao"}
            subtitle={`${selectedRequest.tipo_solicitacao_label || selectedRequest.tipo_solicitacao || "Solicitacao"} por ${selectedRequest.solicitante || "-"} em ${selectedRequest.created_at || "-"}`}
            onClose={() => setSelectedRequestId("")}
            maxWidth="max-w-3xl"
          >
            <div className="flex flex-wrap gap-2 text-xs text-[var(--shell-muted)]">
              <span className="rounded-full border border-[color:var(--shell-line)] px-3 py-1">
                {selectedRequest.status_label || selectedRequest.status}
              </span>
              <span className="rounded-full border border-[color:var(--shell-line)] px-3 py-1">
                {selectedRequest.origem_label}
                {selectedRequest.origem_detalhe
                  ? ` (${selectedRequest.origem_detalhe})`
                  : ""}
              </span>
              <span className="rounded-full border border-[color:var(--shell-line)] px-3 py-1">
                {selectedRequest.atualizacao_label}
                {selectedRequest.atualizacao_detalhe
                  ? ` (${selectedRequest.atualizacao_detalhe})`
                  : ""}
              </span>
              <span className="rounded-full border border-[color:var(--shell-line)] px-3 py-1">
                Atualizada em {selectedRequest.updated_at || "-"}
              </span>
            </div>
            <div className="mt-5 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4 text-sm leading-7 text-[var(--shell-text)]">
              {selectedRequest.descricao_atualizacao || "Sem descricao registrada."}
            </div>
          </ModalFrame>
        ) : null}

        <PasswordActionModal
          config={passwordActionModal}
          error={passwordActionError}
          inputRef={passwordActionInputRef}
          onChange={setPasswordActionValue}
          onClose={closePasswordActionModal}
          onSubmit={submitPasswordActionModal}
          submitting={passwordActionSubmitting}
          value={passwordActionValue}
        />
    </ExtratorPageShell>
  );
}

export default function ExtratorManagerPage() {
  return <ExtratorManagerScreen />;
}
