"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const context = vm.createContext({ window: {}, Date, Object, Array, Set, Number, String, RegExp, JSON, Error, Math });
const intentDirectory = path.join(__dirname, "..", "intent");
["intentTaxonomy.js", "intentValidation.js", "intentEnvelope.js", "index.js"].forEach((name) =>
  vm.runInContext(fs.readFileSync(path.join(intentDirectory, name), "utf8"), context, { filename: name }));
[
  "constants.js", "validation.js", "contracts.js", "capabilityResolver.js", "confirmationAnalyzer.js",
  "dispatchPlanner.js", "runtimeStateMachine.js", "runtimeFailure.js", "unifiedRuntimeDryRun.js",
  "capabilityFixtures.js", "dryRunScenarioCorpus.js"
].forEach((name) => vm.runInContext(fs.readFileSync(path.join(__dirname, name), "utf8"), context, { filename: name }));
const runtime = context.window.WeishanUnifiedRuntimeDryRun;
const contracts = context.window.WeishanUnifiedRuntimeContracts;
const fixtures = context.window.WeishanUnifiedRuntimeFixtures;
const corpus = context.window.WeishanUnifiedRuntimeScenarioCorpus.createDryRunScenarioCorpus();
const tests = [];
function test(name, fn) { tests.push([name, fn]); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function throws(fn, code) { const codes = Array.isArray(code) ? code : [code, "non_json_value", "non_finite_number", "circular_reference", "accessor_property_rejected", "prototype_pollution_key", "sensitive_metadata_key"]; assert.throws(fn, (error) => error && codes.includes(error.code)); }

test("scenario corpus has exactly 180 entries", () => assert.strictEqual(corpus.length, 180));
test("scenario corpus ids are unique", () => assert.strictEqual(new Set(corpus.map((item) => item.scenarioId)).size, 180));
test("scenario corpus dimensions are unique", () => assert.strictEqual(new Set(corpus.map((item) => JSON.stringify(item.dimensions))).size, 180));
test("video fixture stays disabled", () => assert.strictEqual(fixtures.createPluginVideoDisabledFixture().status, "DISABLED"));
corpus.forEach((scenario) => {
  test("pipeline " + scenario.scenarioId, () => {
    const output = runtime.evaluateDryRun(scenario.runtimeRequest);
    assert.strictEqual(output.state, "COMPLETED_DRY_RUN");
    assert.strictEqual(output.runtimeRequest.runtimeMode, "DRY_RUN");
    assert.strictEqual(output.dispatchPlan.executionGate, "CLOSED");
    assert.strictEqual(output.executionPlan, output.dispatchPlan);
    assert.strictEqual(output.dryRunResult.executionOccurred, false);
    if (scenario.dimensions.status === "DISABLED") assert.strictEqual(output.resolution.resolutionStatus, "DISABLED");
    if (scenario.dimensions.status === "UNAVAILABLE" && scenario.dimensions.variant !== "MULTI_CAPABILITY" && scenario.dimensions.variant !== "PLUGIN_DISABLED") assert.strictEqual(output.resolution.resolutionStatus, "UNAVAILABLE");
  });
  test("safety " + scenario.scenarioId, () => {
    const output = runtime.evaluateDryRun(scenario.runtimeRequest);
    assert.deepStrictEqual(Array.from(output.dryRunResult.didDo), []);
    assert.strictEqual(output.dryRunResult.externalEffectsOccurred, false);
    assert.strictEqual(output.dryRunResult.persistenceOccurred, false);
    assert.strictEqual(output.runtimeRequest.capabilitySnapshot.defaultPolicy, "DEFAULT_DENY");
    assert.strictEqual(Object.isFrozen(output), true);
    if ((scenario.dimensions.effect !== "NONE" || scenario.dimensions.status !== "AVAILABLE") && scenario.dimensions.variant !== "MULTI_CAPABILITY") assert.strictEqual(output.confirmation.required, true);
  });
});
[
  ["unknown top-level snapshot", (value) => { value.extra = true; }],
  ["unknown descriptor field", (value) => { value.capabilities[0].extra = true; }],
  ["unknown nested policy field", (value) => { value.capabilities[0].externalEffects.extra = true; }],
  ["function in snapshot", (value) => { value.capabilities[0].displayName = () => "x"; }],
  ["symbol in snapshot", (value) => { value.capabilities[0].displayName = Symbol("x"); }],
  ["infinity in snapshot", (value) => { value.capabilities[0].costModel.value = Infinity; }],
  ["duplicate capability", (value) => { value.capabilities.push(clone(value.capabilities[0])); }],
  ["unknown status", (value) => { value.capabilities[0].status = "EXECUTING"; }],
  ["unbound runtime", (value) => { value.capabilities[0].runtimeBinding.bindingType = "LIVE"; }],
  ["unknown permission", (value) => { value.capabilities[0].permissions = ["ROOT"]; }],
  ["unknown operation effect", (value) => { value.capabilities[0].operations[0].effectLevel = "NETWORK"; }],
  ["missing default deny", (value) => { value.defaultPolicy = "ALLOW"; }],
  ["empty snapshot id", (value) => { value.snapshotId = ""; }]
].forEach(([name, mutate]) => test("capability snapshot rejects " + name, () => {
  const snapshot = clone(fixtures.createCapabilitySnapshot()); mutate(snapshot); throws(() => contracts.createCapabilitySnapshot(snapshot), "invalid_capability_snapshot");
}));
[
  ["getter", (value) => Object.defineProperty(value.context, "x", { enumerable: true, get() { return 1; } })],
  ["setter", (value) => Object.defineProperty(value.context, "x", { enumerable: true, set() {} })],
  ["circular", (value) => { value.context.self = value.context; }],
  ["prototype", (value) => Object.defineProperty(value.context, "__proto__", { enumerable: true, value: "x" })],
  ["token", (value) => { value.context.accessToken = "x"; }],
  ["endpoint", (value) => { value.constraints.endpoint = "x"; }],
  ["mode", (value) => { value.runtimeMode = "EXECUTE"; }],
  ["bad timestamp", (value) => { value.requestedAt = 5; }]
].forEach(([name, mutate]) => test("runtime request rejects " + name, () => {
  const request = clone(corpus[0].runtimeRequest); mutate(request); throws(() => contracts.createRuntimeRequest(request), "invalid_runtime_request");
}));
test("input isolation", () => { const input = clone(corpus[0].runtimeRequest); const output = runtime.evaluateDryRun(input); input.context.source = "mutated"; assert.strictEqual(output.runtimeRequest.context.source, "synthetic"); });
test("safe failure is deterministic", () => { const first = runtime.evaluateDryRun({}); const second = runtime.evaluateDryRun({}); assert.deepStrictEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second))); });
test("state machine rejects skipping", () => { assert.throws(() => context.window.WeishanUnifiedRuntimeStateMachine.transition("RECEIVED", "PLANNED")); });
test("static boundary excludes live runtime dependencies", () => {
  const forbidden = /require\s*\(|import\s|from\s+["']|fetch\s*\(|https?:|WebSocket|XMLHttpRequest|ipcRenderer|ipcMain|electron|node:fs|setTimeout|setInterval|Worker|process\.env|localStorage|sessionStorage|pluginRegistry/g;
  fs.readdirSync(__dirname).filter((name) => name.endsWith(".js") && !name.endsWith(".test.js")).forEach((name) =>
    assert.strictEqual(forbidden.test(fs.readFileSync(path.join(__dirname, name), "utf8")), false, name));
});
test("no public action method is exposed", () => {
  assert.deepStrictEqual(Object.keys(runtime).sort(), ["evaluateDryRun"]);
  assert.strictEqual(typeof runtime.execute, "undefined");
  assert.strictEqual(typeof runtime.submit, "undefined");
});
tests.forEach(([name, fn]) => fn());
console.log("UNIFIED_RUNTIME_DRY_RUN_TESTS PASS " + tests.length);
