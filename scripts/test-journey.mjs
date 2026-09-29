import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function evaluate(relativePath, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(process.cwd(), relativePath), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: relativePath,
  }).outputText;
  const moduleRecord = { exports: {} };
  new Function("exports", "module", "require", code)(moduleRecord.exports, moduleRecord,
    (specifier) => {
      if (specifier in dependencies) return dependencies[specifier];
      throw new Error(`Dependência inesperada: ${specifier}`);
    });
  return moduleRecord.exports;
}

const lib = evaluate("src/features/journey-manager/lib/journeyPresentation.ts");
const api = evaluate("src/features/journey-manager/api/journeyApi.ts", {
  "@/features/auth": {},
  "@/shared/network/gatewayUrl": {},
});

const query = { indicator: "tml", from: "2026-09-28", to: "2026-09-29", mode: "ponto",
  map: "", employeeCode: "", role: "all", expurge: "all" };
assert.equal(api.buildJourneyPath(query), "/api/v1/journey/tml?from=2026-09-28&to=2026-09-29&expurge=all&mode=ponto");
assert.ok(!api.buildJourneyPath({ ...query, indicator: "tr" }).includes("mode="));
assert.ok(api.buildJourneyPath({ ...query, map: " 10 ", role: "ajudante", expurge: "expurged" }).includes("map=10"));
assert.throws(() => api.normalizeJourneyResponse({ from: "2026-09-28", items: [] }), /inválida/);
assert.throws(() => api.normalizeJourneyResponse({ from: "2026-09-28", to: "2026-09-28", snapshotAt: null, items: [{}] }), /Linha/);

const context = (map, employeeCode, role = "motorista") => ({ date: "2026-09-28", map, mapOrigin: "LIVE", employeeCode, role, employeeName: `#${employeeCode}` });
const result = { seconds: 90001, targetSeconds: 36000, lifecycleStatus: "EM_ANDAMENTO",
  targetStatus: "ESTOURADO", achieved: null, secondsDifference: 54001, temporalOrderAnomaly: false };
const item = (map, employeeCode, role = "motorista", expurged = false) => ({
  context: context(map, employeeCode, role), snapshotAt: "2026-09-28T18:00:00",
  tr: result, expurge: { present: expurged, flags: { recharge: map === 11 } },
});
const rows = [item(10, 100), item(10, 200, "ajudante", true), item(11, 100)];
assert.throws(() => api.normalizeJourneyResponse({ from: "2026-09-28", to: "2026-09-28", snapshotAt: null, items: rows }, "tml"), /Linha/);
const normalized = api.normalizeJourneyResponse({ from: "2026-09-28", to: "2026-09-28", snapshotAt: null, items: rows });
assert.equal(normalized.items[1].expurge.present, true);
assert.equal(normalized.items[1].tr.achieved, null);
assert.equal(normalized.items[1].tr.targetStatus, "ESTOURADO");
assert.equal(normalized.items[1].tr.lifecycleStatus, "EM_ANDAMENTO");
const groups = lib.groupByMap(rows);
assert.equal(groups.length, 2);
assert.deepEqual(groups[0].items.map((row) => row.context.employeeCode), [100, 200]);
assert.equal(groups[1].items[0].context.employeeCode, 100);
assert.equal(lib.mapTrFact(groups[0]), rows[0]);
assert.equal(lib.formatDuration(90001), "25h 00m 01s");
assert.equal(lib.formatDuration(360001), "100h 00m 01s");
assert.equal(lib.formatDuration(null), "—");
assert.equal(lib.outcomeLabel(null), "Sem resultado");
assert.equal(lib.checklistPending(null), true);
assert.equal(lib.checklistPending({ count: 0 }), true);
assert.equal(lib.checklistPending({ count: 1 }), false);
assert.equal(lib.liveSeconds(result, "2026-09-28T18:00:00.000Z", Date.parse("2026-09-28T18:00:10.000Z")), 90011);
assert.equal(lib.liveSeconds({ ...result, lifecycleStatus: "FINALIZADO" }, "2026-09-28T18:00:00.000Z", Date.parse("2026-09-28T18:00:10.000Z")), 90001);
assert.equal(lib.liveSeconds({ ...result, seconds: null }, "2026-09-28T18:00:00.000Z", Date.now()), null);
assert.equal(api.buildJourneyPath({ ...query, indicator: "jl", mode: "mpd" }).includes("mode=mpd"), true);
assert.equal(api.buildJourneyPath({ ...query, indicator: "jl", mode: "ponto" }).includes("mode=ponto"), true);
console.log("Journey contract and presentation checks passed");
