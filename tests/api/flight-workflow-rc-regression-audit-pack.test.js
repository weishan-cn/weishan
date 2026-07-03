const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowRcRegressionAuditPack.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowRcRegressionAuditPack;
  assert.equal(api.FLIGHT_WORKFLOW_RC_REGRESSION_AUDIT_PACK_VERSION, "4.0.8");
  const model = api.buildFlightWorkflowRcRegressionAuditPack({
    rcCandidateReviewSummary:{ status:"ready_for_review", safeToStartRcReview:true, userFacingSummary:{ resultLabel:"可以开始 RC 复核", redacted:true }, redacted:true },
    rcEvidenceReviewSummary:{ status:"complete", userFacingSummary:{ resultLabel:"证据完整", redacted:true }, redacted:true },
    freezeGateSummary:{ status:"frozen", freezeDecision:{ safeToFreeze:true }, userFacingSummary:{ resultLabel:"已冻结只读发布候选", redacted:true }, redacted:true },
    evidenceFreezePackSummary:{ status:"ready", safeToFreeze:true, userFacingSummary:{ resultLabel:"证据冻结包已就绪", redacted:true }, redacted:true },
    safetyRegressionSummary:{ status:"pass", redacted:true },
    commerceAgentSmokeBounded:true,
    commerceAgentSmokeCount:18,
    dispatchSmokePass:true,
    dispatchSmokePassedCount:18,
    versionCheckPass:true,
    versionCheckStatus:"pass"
  });
  assert.equal(model.status, "passed");
  assert.equal(model.userFacingSummary.title, "只读 RC 回归审计包");
  assert.equal(model.auditHealth.commerceAgentSmokeBounded, true);
  assert.equal(model.safety.bookingUrl, null);
  const audit = api.buildFlightWorkflowRcRegressionAuditPackAuditDraft({ token:"abc" });
  assert.equal(audit.eventType, "FLIGHT_WORKFLOW_RC_REGRESSION_AUDIT_PACK_AUDIT_DRAFT");
  assert.equal(JSON.stringify(audit).includes("abc"), false);
  console.log("FLIGHT_WORKFLOW_RC_REGRESSION_AUDIT_PACK PASS");
}
main();
