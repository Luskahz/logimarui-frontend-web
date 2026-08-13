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

console.log("DTO analytics: 3 cenários validados com sucesso.");
