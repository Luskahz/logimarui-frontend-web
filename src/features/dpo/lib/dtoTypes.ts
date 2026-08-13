export type DtoFieldRole =
  | "EVALUATION"
  | "COLLABORATOR"
  | "APPLIER"
  | "DATE"
  | "CONTEXT"
  | "IGNORE";

export type DtoConfigurationSource = "AUTO" | "MANUAL";
export type DtoObservationStatus = "OBSERVED" | "NOT_OBSERVED";
export type DtoAnswerSemantic =
  | "POSITIVE"
  | "NEGATIVE"
  | "IGNORED"
  | "UNMAPPED"
  | "BLANK";

export interface DtoFormReference {
  id: string;
  name: string;
  created_at?: string | null;
  used_at?: string | null;
}

export interface DtoFormsResponse {
  forms: DtoFormReference[];
  count: number;
  discovered_at: string | null;
  cached: boolean;
}

export interface DtoObservedValue {
  normalized_value: string;
  display_value: string;
  count: number;
  semantic: DtoAnswerSemantic;
  configuration_source: DtoConfigurationSource;
}

export interface DtoColumn {
  key: string;
  label: string;
  normalized_label: string;
  role: DtoFieldRole;
  configuration_source: DtoConfigurationSource;
  observation_status: DtoObservationStatus;
  non_blank_count: number;
  observed_values: DtoObservedValue[];
  warnings: string[];
}

export interface DtoAnswer {
  column_key: string;
  label: string;
  raw_value: unknown;
  normalized_value: string | null;
  status: DtoAnswerSemantic;
}

export interface DtoRecord {
  id: string;
  index: number;
  date: string | null;
  collaborator: string | null;
  manager: string | null;
  values: Record<string, unknown>;
  answers: DtoAnswer[];
}

export interface DtoQualityIssue {
  code: string;
  message: string;
  column_key?: string | null;
  record_index?: number | null;
  values?: unknown[] | null;
}

export interface DtoFieldConfiguration {
  key: string;
  source_name: string;
  normalized_name: string;
  role: DtoFieldRole;
  configuration_source: DtoConfigurationSource;
  observation_status: DtoObservationStatus;
  first_seen_at: string;
  last_seen_at: string;
  answer_mappings: Record<string, DtoAnswerSemantic>;
  observed_values: DtoObservedValue[];
  warnings: string[];
}

export interface DtoFormConfiguration {
  schema_version: number;
  form_id: string;
  form_name: string;
  revision: number;
  updated_at: string;
  fields: DtoFieldConfiguration[];
  unmapped_values_count: number;
  fields_requiring_configuration: number;
}

export interface DtoFieldOverride {
  field_key: string;
  role: DtoFieldRole;
  answer_mappings: Record<string, Exclude<DtoAnswerSemantic, "BLANK">>;
}

export interface DtoConfigurationUpdate {
  revision: number;
  fields?: DtoFieldOverride[];
  reset_fields?: string[];
}

export interface DtoFormDetail {
  form: DtoFormReference;
  columns: DtoColumn[];
  records: DtoRecord[];
  loaded_at: string | null;
  cached: boolean;
  quality_issues: DtoQualityIssue[];
  configuration: DtoFormConfiguration;
}

export type DtoResourceStatus = "idle" | "loading" | "ready" | "empty" | "error";

export interface DtoFormResource {
  status: DtoResourceStatus;
  data: DtoFormDetail | null;
  error: string | null;
  isRefreshing: boolean;
}

export type DtoFormResourceMap = Record<string, DtoFormResource>;
export type DtoPeriodFilter = "all" | "last30" | "last90" | "currentYear" | "custom";

export interface DtoFiltersState {
  period: DtoPeriodFilter;
  startDate: string;
  endDate: string;
  collaborator: string;
  manager: string;
  search: string;
  onlyNegative: boolean;
}

export interface DtoMetrics {
  applications: number;
  positive: number;
  negative: number;
  ignored: number;
  blank: number;
  unmapped: number;
  answered: number;
  adherence: number | null;
  collaborators: number | null;
  lastApplication: Date | null;
  hasDateColumn: boolean;
  hasCollaboratorColumn: boolean;
}

export interface DtoQuestionStat {
  columnKey: string;
  label: string;
  positive: number;
  negative: number;
  ignored: number;
  unmapped: number;
  answered: number;
  negativeApplications: number;
  negativeRate: number | null;
  recurring: boolean;
}

export interface DtoRecurringGap {
  columnKey: string;
  questionLabel: string;
  applications: number;
  recordIds: string[];
  lastOccurrence: Date | null;
}

export interface DtoCollaboratorStat {
  name: string;
  applications: number;
  applicationsWithNegative: number;
  positive: number;
  negative: number;
  adherence: number | null;
  recurringGaps: DtoRecurringGap[];
  lastApplication: Date | null;
}

export interface DtoTimelinePoint {
  key: string;
  label: string;
  applications: number;
  positive: number;
  negative: number;
  adherence: number | null;
}

export interface DtoApplicationTimelinePoint {
  key: string;
  label: string;
  date: Date;
  positive: number;
  negative: number;
  adherence: number | null;
}

export interface DtoTrend {
  direction: "improving" | "worsening" | "stable";
  delta: number;
  previousLabel: string;
  currentLabel: string;
}

export interface DtoAttentionPoint {
  id: string;
  title: string;
  description: string;
  tone: "default" | "attention" | "danger";
}

export interface DtoPortfolioMetrics {
  forms: number;
  loadedForms: number;
  failedForms: number;
  pendingForms: number;
  applications: number | null;
  positive: number | null;
  negative: number | null;
  adherence: number | null;
  collaborators: number | null;
  partial: boolean;
}
