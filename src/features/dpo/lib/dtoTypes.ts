export type DtoColumnKind =
  | "evaluation"
  | "date"
  | "collaborator"
  | "manager"
  | "metadata"
  | "unknown";

export type DtoAnswerStatus =
  | "ok"
  | "nok"
  | "neutral"
  | "blank"
  | "unexpected";

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

export interface DtoColumn {
  key: string;
  label: string;
  normalized_label: string;
  kind: DtoColumnKind;
  non_blank_count: number;
  observed_values: unknown[];
  unexpected_values: unknown[];
}

export interface DtoAnswer {
  column_key: string;
  label: string;
  raw_value: unknown;
  status: DtoAnswerStatus;
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

export interface DtoFormDetail {
  form: DtoFormReference;
  columns: DtoColumn[];
  records: DtoRecord[];
  loaded_at: string | null;
  cached: boolean;
  quality_issues: DtoQualityIssue[];
}

export type DtoResourceStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "error";

export interface DtoFormResource {
  status: DtoResourceStatus;
  data: DtoFormDetail | null;
  error: string | null;
  isRefreshing: boolean;
}

export type DtoFormResourceMap = Record<string, DtoFormResource>;

export type DtoPeriodFilter =
  | "all"
  | "last30"
  | "last90"
  | "currentYear"
  | "custom";

export interface DtoFiltersState {
  period: DtoPeriodFilter;
  startDate: string;
  endDate: string;
  collaborator: string;
  manager: string;
  search: string;
  onlyNok: boolean;
}

export interface DtoMetrics {
  applications: number;
  ok: number;
  nok: number;
  neutral: number;
  blank: number;
  unexpected: number;
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
  ok: number;
  nok: number;
  neutral: number;
  unexpected: number;
  answered: number;
  nokRate: number | null;
}

export interface DtoCollaboratorStat {
  name: string;
  applications: number;
  applicationsWithNok: number;
  ok: number;
  nok: number;
  adherence: number | null;
}

export interface DtoTimelinePoint {
  key: string;
  label: string;
  applications: number;
  ok: number;
  nok: number;
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
  ok: number | null;
  nok: number | null;
  adherence: number | null;
  collaborators: number | null;
  partial: boolean;
}
