const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const window = load([
    "apps/desktop/src/renderer/core/flightWorkflowPublicPilotIssueReviewBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowSupportTriageDashboard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotIssueReviewViewModel.js"
  ]);
  const board = window.WeishanFlightWorkflowPublicPilotIssueReviewBoard.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:{ status:"redacted", issueCategory:"platform_mismatch" } });
  const triage = window.WeishanFlightWorkflowSupportTriageDashboard.buildFlightWorkflowSupportTriageDashboard({ issueCategory:"platform_mismatch", issueReviewBoard:board });
  const api = window.WeishanFlightWorkflowPilotIssueReviewViewModel;
  const vm = api.buildFlightWorkflowPilotIssueReviewViewModel({ issueReviewBoard:board, supportTriageDashboard:triage });
  assert.equal(api.FLIGHT_WORKFLOW_PILOT_ISSUE_REVIEW_VIEW_MODEL_VERSION, "3.7.0");
  assert.equal(vm.title, "只读试点问题复核");
  assert.ok(vm.cards.find((card) => card.cardId === "issue"));
  assert.ok(vm.cards.find((card) => card.cardId === "triage"));
  assert.ok(vm.cards.find((card) => card.cardId === "pilot"));
  assert.ok(vm.cards.find((card) => card.cardId === "safety"));
  assert.ok(vm.issueRows.length > 0);
  assert.ok(vm.triageRows.length > 0);
  assert.ok(vm.findings.length > 0);
  assert.ok(vm.caveat.includes("问题复核只用于改进只读候选证据流程"));
  const json = JSON.stringify(vm);
  assert.equal(/sk-|apiKey abc|secret abc|password abc|credential abc|身份证 123|护照 123|银行卡 123|https:\/\/example/i.test(json), false);
  assert.equal(vm.bookingUrl, null);
  assert.equal(vm.paymentUrl, null);
  assert.equal(vm.orderUrl, null);
  console.log("FLIGHT_WORKFLOW_PILOT_ISSUE_REVIEW_VIEW_MODEL PASS");
}
main();
