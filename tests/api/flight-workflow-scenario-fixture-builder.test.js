const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowScenarioFixtureBuilder.js"]);
  const api = windowRef.WeishanFlightWorkflowScenarioFixtureBuilder;
  assert.equal(api.FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER_VERSION, "4.1.2");
  const complete = api.buildCompleteFlightScenarioFixture();
  assert.equal(complete.scenarioId, "complete_flight_request");
  assert.equal(complete.bookingUrl, null);
  assert.equal(complete.selectedCandidate.safeProviderHandoffReady, true);
  assert.equal(complete.userFacingSummary, undefined);
  assert.equal(complete.safety ? complete.safety.bookingUrl : null, null);
  const missingDate = api.buildFlightWorkflowScenarioFixture("missing_date");
  assert.equal(missingDate.scenarioLabel, "缺少日期");
  assert.ok(Array.isArray(missingDate.missingFields));
  assert.ok(missingDate.missingFields.includes("departureDate"));
  const unsafe = api.buildUnsafeFlightScenarioFixture("illegal_secret_injection", { scenarioLabel:"非法密钥阻断" });
  assert.equal(unsafe.bookingUrl, null);
  assert.equal(unsafe.checkoutUrl, null);
  assert.equal(unsafe.paymentUrl, null);
  assert.equal(unsafe.orderUrl, null);
  assert.equal(unsafe.token, undefined);
  assert.equal(unsafe.secretStored, false);
  const auditDraft = api.buildFlightWorkflowScenarioFixtureBuilderAuditDraft({ scenarioId:"sensitive_input_blocked" });
  assert.equal(auditDraft.eventType, "FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER_AUDIT_DRAFT");
  assert.equal(auditDraft.bookingUrl, null);
  assert.equal(auditDraft.redacted, true);
  assert.equal(JSON.stringify(unsafe).includes("sk-live-blocked"), false);
  console.log("FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER PASS");
}
main();
