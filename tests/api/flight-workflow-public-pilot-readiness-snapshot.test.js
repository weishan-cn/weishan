const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowPublicPilotReadinessSnapshot.js"]).WeishanFlightWorkflowPublicPilotReadinessSnapshot;
  assert.equal(api.FLIGHT_WORKFLOW_PUBLIC_PILOT_READINESS_SNAPSHOT_VERSION, "2.2.6");
  const ready = api.buildFlightWorkflowPublicPilotReadinessSnapshot({ betaExpansionGateSummary:{ status:"approved", decision:{ safeToExpandReadOnlyBeta:true }, redacted:true }, publicPilotChecklistSummary:{ status:"ready", redacted:true }, pilotOnboardingSummary:{ status:"allowed", decision:{ canEnterReadOnlyPilot:true }, redacted:true }, issuePatternSummary:{ status:"ready", redacted:true }, supportReadinessSummary:{ status:"ready", redacted:true }, issueReviewSummary:{ status:"ready", redacted:true }, supportTriageSummary:{ status:"ready", redacted:true }, operatorConsoleSummary:{ status:"ready", redacted:true }, safetyRegressionSummary:{ status:"pass", redacted:true } });
  assert.equal(ready.status, "ready");
  assert.equal(ready.snapshotHealth.safeToContinuePublicPilot, true);
  assert.equal(ready.supportPlaybookStatus, "ready");
  assert.equal(ready.pilotSnapshotNextStep, "可以继续只读试点");
  assert.ok(ready.rows.length >= 5);
  assert.equal(JSON.stringify(ready).includes("token"), false);
  assert.equal(ready.bookingUrl, null);
  console.log("FLIGHT_WORKFLOW_PUBLIC_PILOT_READINESS_SNAPSHOT PASS");
}
main();
