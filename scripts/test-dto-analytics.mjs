import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();

function transpile(relativePath) {
  return ts.transpileModule(
    fs.readFileSync(path.join(root, relativePath), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
      fileName: relativePath,
    },
  ).outputText;
}

function evaluate(code, dependencies = {}) {
  const moduleRecord = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier in dependencies) return dependencies[specifier];
    throw new Error(`Dependência inesperada no teste DTO: ${specifier}`);
  };
  new Function("exports", "module", "require", code)(
    moduleRecord.exports,
    moduleRecord,
    localRequire,
  );
  return moduleRecord.exports;
}

const formatters = evaluate(
  transpile("src/features/dpo/lib/dtoFormatters.ts"),
);
const analytics = evaluate(
  transpile("src/features/dpo/lib/dtoAnalytics.ts"),
  { "@/features/dpo/lib/dtoFormatters": formatters },
);
const tracking = evaluate(
  transpile("src/features/dpo/lib/dtoTracking.ts"),
  { "@/features/dpo/lib/dtoFormatters": formatters },
);

const saviDate = formatters.parseDtoDate("11/08/2026 17:20");
assert.ok(saviDate);
assert.equal(saviDate.getFullYear(), 2026);
assert.equal(saviDate.getMonth(), 7);
assert.equal(saviDate.getDate(), 11);
assert.equal(saviDate.getHours(), 17);
assert.equal(saviDate.getMinutes(), 20);

const columns = [
  { key: "collaborator", role: "COLLABORATOR", observation_status: "OBSERVED" },
  { key: "question-a", label: "Pergunta A", role: "EVALUATION", observation_status: "OBSERVED" },
  { key: "question-b", label: "Pergunta B", role: "EVALUATION", observation_status: "OBSERVED" },
];

function record(id, collaborator, date, statuses) {
  return {
    id,
    index: 0,
    date,
    collaborator,
    manager: null,
    values: {},
    answers: statuses.map(([column_key, status]) => ({
      column_key,
      label: column_key === "question-a" ? "Pergunta A" : "Pergunta B",
      raw_value: status,
      normalized_value: status.toLowerCase(),
      status,
    })),
  };
}

const records = [
  record("app-1", "Maria", "2026-08-01", [
    ["question-a", "NEGATIVE"],
    ["question-b", "POSITIVE"],
  ]),
  record("app-2", "Maria", "2026-08-08", [
    ["question-a", "NEGATIVE"],
    ["question-b", "IGNORED"],
  ]),
  record("app-3", "Maria", "2026-08-10", [
    ["question-a", "UNMAPPED"],
    ["question-b", "POSITIVE"],
  ]),
  record("app-4", "João", "2026-08-11", [
    ["question-a", "NEGATIVE"],
    ["question-b", "POSITIVE"],
  ]),
];

const metrics = analytics.computeDtoMetrics(records.slice(0, 3), columns);
assert.equal(metrics.positive, 2);
assert.equal(metrics.negative, 2);
assert.equal(metrics.ignored, 1);
assert.equal(metrics.unmapped, 1);
assert.equal(metrics.adherence, 50);

const collaborators = analytics.computeCollaboratorStats(records, columns);
assert.equal(collaborators.length, 2);
const maria = collaborators.find((item) => item.name === "Maria");
assert.equal(maria.applications, 3);
assert.equal(maria.applicationsWithNegative, 2);
assert.equal(maria.recurringGaps.length, 1);
assert.equal(maria.recurringGaps[0].questionLabel, "Pergunta A");
assert.deepEqual(maria.recurringGaps[0].recordIds, ["app-1", "app-2"]);

const duplicateApplication = [records[0], { ...records[0] }];
assert.equal(analytics.computeRecurringGaps(duplicateApplication).length, 0);

const trackingDetail = {
  configuration: {
    tracking: {
      mode: "COLLABORATOR",
      collaborator_source: "CPF",
      roster_field_key: "person",
      realization_date_field_key: "realized-at",
      interval_days: 60,
      applicable_functions: ["MOTORISTA"],
      new_employee_window_days: null,
      new_employee_first_due_days: null,
      excluded_collaborators: [],
      manual_collaborators: [],
    },
  },
  records: [
    { id: "cpf-ana", values: { person: "11111111111", "realized-at": "11/08/2026 17:20" } },
    { id: "cpf-bruno", values: { person: "22222222222", "realized-at": "01/06/2026 08:00" } },
    { id: "cpf-unknown", values: { person: "99999999999", "realized-at": "09/09/2026 08:00" } },
  ],
};
const workforceContext = {
  collaborator_source: "CPF",
  available_functions: [
    { name: "MOTORISTA", employees: 2 },
    { name: "AJUDANTE", employees: 1 },
  ],
  employees: [
    { key: "1", name: "Ana", function: "MOTORISTA", admission_date: "2024-01-10" },
    { key: "2", name: "Bruno", function: "MOTORISTA", admission_date: "2023-01-10" },
    { key: "3", name: "Carla", function: "AJUDANTE", admission_date: "2022-01-10" },
  ],
  record_employee_keys: {
    "cpf-ana": ["1"],
    "cpf-bruno": ["2"],
  },
  employees_without_cpf: 0,
  unmatched_records: 1,
};
const trackingSummary = tracking.computeDtoTracking(
  trackingDetail,
  workforceContext,
  new Date(2026, 8, 10, 12),
);
assert.equal(trackingSummary.mode, "COLLABORATOR");
assert.equal(trackingSummary.total, 3);
assert.equal(trackingSummary.current, 1);
assert.equal(trackingSummary.overdue, 1);
assert.equal(trackingSummary.never, 1);
assert.equal(Math.round(trackingSummary.realizationAdherence), 33);
assert.equal(
  trackingSummary.subjects.find((item) => item.name === "Carla").applications,
  0,
);

const environmentTracking = tracking.computeDtoTracking(
  {
    configuration: {
      tracking: {
        mode: "ENVIRONMENT",
        environment_source: "FIELD",
        roster_field_key: "environment",
        realization_date_field_key: "realized-at",
        interval_days: 30,
        applicable_functions: [],
        new_employee_window_days: null,
        new_employee_first_due_days: null,
        excluded_collaborators: ["Escritório"],
        manual_collaborators: ["Pátio"],
      },
    },
    records: [
      { values: { environment: "Oficina", "realized-at": "20/08/2026" } },
      { values: { environment: "Oficina", "realized-at": "01/09/2026" } },
      { values: { environment: "Armazém", "realized-at": "01/07/2026" } },
      { values: { environment: "Escritório", "realized-at": "09/09/2026" } },
    ],
  },
  null,
  new Date(2026, 8, 10, 12),
);
assert.equal(environmentTracking.mode, "ENVIRONMENT");
assert.equal(environmentTracking.total, 3);
assert.equal(environmentTracking.current, 1);
assert.equal(environmentTracking.overdue, 1);
assert.equal(environmentTracking.never, 1);
assert.equal(
  environmentTracking.subjects.find((item) => item.name === "Oficina").applications,
  2,
);
assert.equal(
  environmentTracking.subjects.find((item) => item.name === "Pátio").applications,
  0,
);

const formEnvironmentTracking = tracking.computeDtoTracking(
  {
    configuration: {
      tracking: {
        mode: "ENVIRONMENT",
        environment_source: "FORM",
        roster_field_key: null,
        realization_date_field_key: "realized-at",
        interval_days: 30,
        applicable_functions: [],
        new_employee_window_days: null,
        new_employee_first_due_days: null,
        excluded_collaborators: [],
        manual_collaborators: ["Armazém"],
      },
    },
    records: [
      { values: { "realized-at": "20/08/2026", evaluator: "Ana" } },
      { values: { "realized-at": "01/09/2026", evaluator: "Bruno" } },
    ],
  },
  null,
  new Date(2026, 8, 10, 12),
);
assert.equal(formEnvironmentTracking.configured, true);
assert.equal(formEnvironmentTracking.environmentSource, "FORM");
assert.equal(formEnvironmentTracking.total, 1);
assert.equal(formEnvironmentTracking.current, 1);
assert.equal(formEnvironmentTracking.subjects[0].name, "Armazém");
assert.equal(formEnvironmentTracking.subjects[0].applications, 2);
assert.equal(formEnvironmentTracking.subjects[0].source, "form");

const mapTracking = tracking.computeDtoTracking(
  {
    configuration: {
      tracking: {
        mode: "COLLABORATOR",
        collaborator_source: "MAP",
        roster_field_key: "map",
        realization_date_field_key: "realized-at",
        interval_days: 60,
        applicable_functions: ["MOTORISTA", "AJUDANTE"],
        new_employee_window_days: null,
        new_employee_first_due_days: null,
        excluded_collaborators: [],
        manual_collaborators: [],
      },
    },
    records: [
      { id: "map-291128", values: { map: 291128, "realized-at": "10/09/2026" } },
    ],
  },
  {
    collaborator_source: "MAP",
    available_functions: workforceContext.available_functions,
    employees: workforceContext.employees,
    record_employee_keys: {
      "map-291128": ["1", "2", "3"],
    },
    employees_without_cpf: 0,
    unmatched_records: 0,
  },
  new Date(2026, 8, 10, 12),
);
assert.equal(mapTracking.total, 3);
assert.equal(mapTracking.current, 3);
assert.ok(mapTracking.subjects.every((item) => item.applications === 1));

const newEmployeeTracking = tracking.computeDtoTracking(
  {
    configuration: {
      tracking: {
        mode: "COLLABORATOR",
        collaborator_source: "CPF",
        roster_field_key: "cpf",
        realization_date_field_key: "realized-at",
        interval_days: 60,
        applicable_functions: ["MOTORISTA"],
        new_employee_window_days: 45,
        new_employee_first_due_days: 30,
        excluded_collaborators: [],
        manual_collaborators: [],
      },
    },
    records: [],
  },
  {
    collaborator_source: "CPF",
    available_functions: [{ name: "MOTORISTA", employees: 1 }],
    employees: [
      {
        key: "raymundo",
        name: "Raymundo",
        function: "MOTORISTA",
        admission_date: "2026-09-10",
      },
    ],
    record_employee_keys: {},
    employees_without_cpf: 0,
    unmatched_records: 0,
  },
  new Date(2026, 8, 10, 12),
);
assert.equal(newEmployeeTracking.newEmployees, 1);
assert.equal(newEmployeeTracking.subjects[0].isNew, true);
assert.equal(newEmployeeTracking.subjects[0].firstRealizationPending, true);
assert.equal(newEmployeeTracking.subjects[0].status, "current");
assert.equal(
  newEmployeeTracking.subjects[0].nextDueDate.toISOString().slice(0, 10),
  "2026-10-10",
);

const newEmployeeAfterFirstRealization = tracking.computeDtoTracking(
  {
    configuration: {
      tracking: {
        mode: "COLLABORATOR",
        collaborator_source: "CPF",
        roster_field_key: "cpf",
        realization_date_field_key: "realized-at",
        interval_days: 60,
        applicable_functions: ["MOTORISTA"],
        new_employee_window_days: 45,
        new_employee_first_due_days: 30,
        excluded_collaborators: [],
        manual_collaborators: [],
      },
    },
    records: [
      { id: "raymundo-first", values: { "realized-at": "2026-09-10" } },
    ],
  },
  {
    collaborator_source: "CPF",
    available_functions: [{ name: "MOTORISTA", employees: 1 }],
    employees: [
      {
        key: "raymundo",
        name: "Raymundo",
        function: "MOTORISTA",
        admission_date: "2026-09-10",
      },
    ],
    record_employee_keys: { "raymundo-first": ["raymundo"] },
    employees_without_cpf: 0,
    unmatched_records: 0,
  },
  new Date(2026, 8, 10, 12),
);
assert.equal(newEmployeeAfterFirstRealization.subjects[0].firstRealizationPending, false);
assert.equal(
  newEmployeeAfterFirstRealization.subjects[0].nextDueDate.toISOString().slice(0, 10),
  "2026-11-09",
);

console.log("DTO analytics e acompanhamento: 9 cenários validados com sucesso.");
