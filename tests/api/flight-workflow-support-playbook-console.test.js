const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowSupportPlaybookConsole.js"]).WeishanFlightWorkflowSupportPlaybookConsole;
  assert.equal(api.FLIGHT_WORKFLOW_SUPPORT_PLAYBOOK_CONSOLE_VERSION, "4.2.4");
  const ready = api.buildFlightWorkflowSupportPlaybookConsole({ issueIntakeSummary:{ issueCategory:"platform_mismatch", redacted:true }, issuePatternSummary:{ status:"needs_review", redacted:true }, issueReviewSummary:{ status:"needs_review", redacted:true }, supportTriageSummary:{ status:"needs_internal_review", redacted:true }, supportReadinessSummary:{ status:"needs_review", redacted:true } });
  assert.equal(ready.status, "needs_review");
  assert.equal(ready.supportPlaybookStatus, "needs_review");
  assert.equal(ready.supportPlaybookNextStep, "支持处理仍需复核");
  assert.ok(ready.playbookItems.length >= 5);
  assert.equal(Array.isArray(ready.forbiddenSupportActions), true);
  assert.equal(JSON.stringify(ready).includes("secret"), false);
  assert.equal(ready.bookingUrl, null);
  console.log("FLIGHT_WORKFLOW_SUPPORT_PLAYBOOK_CONSOLE PASS");
}
main();
