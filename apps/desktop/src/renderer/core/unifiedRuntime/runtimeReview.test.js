"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const context = vm.createContext({ window: {}, Date, Object, Array, Set, Number, String, RegExp, JSON, Error, Math });
const intentDirectory = path.join(__dirname, "..", "intent");
["intentTaxonomy.js", "intentValidation.js", "intentEnvelope.js", "index.js"].forEach((name) => vm.runInContext(fs.readFileSync(path.join(intentDirectory, name), "utf8"), context));
[
  "constants.js", "validation.js", "contracts.js", "capabilityResolver.js", "confirmationAnalyzer.js", "dispatchPlanner.js",
  "runtimeStateMachine.js", "runtimeFailure.js", "unifiedRuntimeDryRun.js", "capabilityFixtures.js", "dryRunScenarioCorpus.js",
  "runtimeReview.js", "humanConfirmation.js"
].forEach((name) => vm.runInContext(fs.readFileSync(path.join(__dirname, name), "utf8"), context));
const dryRun = context.window.WeishanUnifiedRuntimeDryRun;
const reviewApi = context.window.WeishanUnifiedRuntimeReview;
const confirmationApi = context.window.WeishanHumanConfirmation;
const corpus = context.window.WeishanUnifiedRuntimeScenarioCorpus.createDryRunScenarioCorpus();
const tests = [];
function test(name, fn) { tests.push([name, fn]); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function reviewFor(scenario) { const output = dryRun.evaluateDryRun(scenario.runtimeRequest); return reviewApi.createRuntimeReview({ runtimeRequest: output.runtimeRequest, executionPlan: output.executionPlan, dryRunResult: output.dryRunResult }); }
function rejects(fn) { assert.throws(fn, (error) => error && ["invalid_runtime_review_input", "invalid_execution_plan", "invalid_dry_run_result", "invalid_confirmation_contract", "invalid_confirmation_transition", "non_json_value", "non_finite_number", "circular_reference", "accessor_property_rejected", "prototype_pollution_key", "sensitive_metadata_key"].includes(error.code)); }
test("corpus has 180 phase one inputs", () => assert.strictEqual(corpus.length, 180));
corpus.forEach((scenario) => {
  test("review model " + scenario.scenarioId, () => {
    const review = reviewFor(scenario);
    assert.strictEqual(review.schemaVersion, "1.0");
    assert.strictEqual(review.runtimeRequestId, scenario.runtimeRequest.runtimeRequestId);
    assert.strictEqual(review.reviewSummary.executionGate, "CLOSED");
    assert.strictEqual(review.reviewSummary.didDo.length, 0);
    assert.strictEqual(review.riskSummary.externalEffectsOccurred, false);
    assert.strictEqual(review.riskSummary.persistenceOccurred, false);
    assert.strictEqual(review.permissionSummary.defaultDeny, true);
    assert.strictEqual(review.costSummary.costAuthorized, false);
    assert.strictEqual(review.confirmationSummary.authorizesExecution, false);
  });
  test("review isolation " + scenario.scenarioId, () => {
    const review = reviewFor(scenario);
    const token = confirmationApi.createConfirmationToken(review);
    assert.strictEqual(Object.isFrozen(review), true);
    assert.strictEqual(Object.isFrozen(review.reviewSummary), true);
    assert.strictEqual(Object.isFrozen(token), true);
    assert.strictEqual(token.authorizesExecution, false);
    assert.strictEqual(token.status, review.confirmationSummary.status);
    assert.strictEqual(token.confirmationId, "confirmation-" + review.runtimeRequestId);
  });
});
const baseReview = reviewFor(corpus[0]);
[
  ["unknown review field", (value) => { value.extra = true; }],
  ["function", (value) => { value.runtimeRequest.context.source = () => "x"; }],
  ["symbol", (value) => { value.runtimeRequest.context.source = Symbol("x"); }],
  ["getter", (value) => Object.defineProperty(value.executionPlan, "planStatus", { enumerable: true, get() { return "BLOCKED"; } })],
  ["setter", (value) => Object.defineProperty(value.dryRunResult, "status", { enumerable: true, set() {} })],
  ["circular", (value) => { value.runtimeRequest.context.self = value.runtimeRequest.context; }],
  ["prototype", (value) => Object.defineProperty(value.runtimeRequest.context, "__proto__", { enumerable: true, value: "x" })],
  ["sensitive", (value) => { value.runtimeRequest.context.accessToken = "x"; }],
  ["open gate", (value) => { value.executionPlan.executionGate = "OPEN"; }],
  ["execution evidence", (value) => { value.dryRunResult.executionOccurred = true; }],
  ["effect evidence", (value) => { value.dryRunResult.externalEffectsOccurred = true; }],
  ["persistence evidence", (value) => { value.dryRunResult.persistenceOccurred = true; }]
].forEach(([name, mutate]) => test("review rejects " + name, () => {
  const output = dryRun.evaluateDryRun(corpus[0].runtimeRequest);
  const input = { runtimeRequest: clone(output.runtimeRequest), executionPlan: clone(output.executionPlan), dryRunResult: clone(output.dryRunResult) };
  mutate(input); rejects(() => reviewApi.createRuntimeReview(input));
}));
test("not requested token cannot transition", () => { const token = confirmationApi.createConfirmationToken(baseReview); assert.strictEqual(token.status, "NOT_REQUESTED"); rejects(() => confirmationApi.updateConfirmation(token, "CONFIRMED")); });
["CONFIRMED", "DECLINED", "EXPIRED"].forEach((status) => test("waiting can become " + status, () => {
  const review = reviewFor(corpus.find((scenario) => scenario.dimensions.effect === "EXTERNAL" && scenario.dimensions.status === "AVAILABLE" && scenario.dimensions.variant !== "MULTI_CAPABILITY"));
  const token = confirmationApi.createConfirmationToken(review); assert.strictEqual(token.status, "WAITING");
  const updated = confirmationApi.updateConfirmation(token, status); assert.strictEqual(updated.status, status); assert.strictEqual(updated.authorizesExecution, false);
}));
["CONFIRMED", "DECLINED", "EXPIRED"].forEach((status) => test("terminal " + status + " cannot authorize", () => {
  const review = reviewFor(corpus.find((scenario) => scenario.dimensions.effect === "EXTERNAL" && scenario.dimensions.status === "AVAILABLE" && scenario.dimensions.variant !== "MULTI_CAPABILITY"));
  const terminal = confirmationApi.updateConfirmation(confirmationApi.createConfirmationToken(review), status);
  rejects(() => confirmationApi.updateConfirmation(terminal, "CONFIRMED")); assert.strictEqual(terminal.authorizesExecution, false);
}));
test("confirmation rejects authorization flag", () => { const token = clone(confirmationApi.createConfirmationToken(baseReview)); token.authorizesExecution = true; rejects(() => confirmationApi.validateConfirmation(token)); });
test("review input remains isolated", () => { const output = dryRun.evaluateDryRun(corpus[0].runtimeRequest); const input = { runtimeRequest: clone(output.runtimeRequest), executionPlan: clone(output.executionPlan), dryRunResult: clone(output.dryRunResult) }; const review = reviewApi.createRuntimeReview(input); input.executionPlan.executionGate = "OPEN"; assert.strictEqual(review.reviewSummary.executionGate, "CLOSED"); });
test("static boundary remains pure", () => { const forbidden = /require\s*\(|import\s|fetch\s*\(|https?:|WebSocket|XMLHttpRequest|ipcRenderer|ipcMain|electron|node:fs|writeFile|setTimeout|setInterval|Worker|process\.env|localStorage|sessionStorage|telemetry|analytics|pluginRegistry/g; ["runtimeReview.js", "humanConfirmation.js"].forEach((name) => assert.strictEqual(forbidden.test(fs.readFileSync(path.join(__dirname, name), "utf8")), false, name)); });
tests.forEach(([, fn]) => fn());
console.log("UNIFIED_RUNTIME_REVIEW_TESTS PASS " + tests.length);
