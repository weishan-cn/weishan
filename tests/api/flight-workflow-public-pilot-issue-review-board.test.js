const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function assertSafe(value) {
  const json = JSON.stringify(value);
  assert.equal(/sk-|apiKey abc|secret abc|password abc|credential abc|身份证 123|护照 123|银行卡 123|https:\/\/example/i.test(json), false);
  assert.equal(value.safety.bookingUrl, null);
  assert.equal(value.safety.paymentUrl, null);
  assert.equal(value.safety.orderUrl, null);
}
function main() {
  const api = load(["apps/desktop/src/renderer/core/flightWorkflowPublicPilotIssueReviewBoard.js"]).WeishanFlightWorkflowPublicPilotIssueReviewBoard;
  assert.equal(api.FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_REVIEW_BOARD_VERSION, "3.2.0");
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({}).status, "ready");
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:{ status:"ready", issueCategory:"candidate_unclear" } }).status, "ready");
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:{ status:"redacted", issueCategory:"other" } }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:{ status:"blocked", issueCategory:"other" } }).status, "blocked");
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:{ status:"ready", issueCategory:"other" }, supportFallbackRecommendation:{ status:"needs_review", recommendation:{ recommendationId:"internal_review" } } }).status, "needs_review");
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:{ status:"ready", issueCategory:"platform_mismatch" } }).issueHealth.affectsPilotExpansion, true);
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:{ status:"ready", issueCategory:"safety_copy_unclear" } }).issueHealth.affectsPilotExpansion, true);
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({ rawUserTextStored:true }).status, "blocked");
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({ secretStored:true }).status, "blocked");
  assert.equal(api.buildFlightWorkflowPublicPilotIssueReviewBoard({ bookingUrl:"https://example.invalid" }).status, "blocked");
  const board = api.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:{ status:"redacted", issueCategory:"platform_mismatch" } });
  assert.ok(board.findings.length > 0);
  assert.ok(board.rows.length > 0);
  assert.ok(JSON.stringify(board.findings).includes("问题反馈已脱敏"));
  assertSafe(board);
  console.log("FLIGHT_WORKFLOW_PUBLIC_PILOT_ISSUE_REVIEW_BOARD PASS");
}
main();
