const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowRcRegressionAuditPack.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyReleaseRiskLedger.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowReadOnlyReleaseRiskLedger;
  assert.equal(api.FLIGHT_WORKFLOW_READ_ONLY_RELEASE_RISK_LEDGER_VERSION, "2.2.5");
  const model = api.buildFlightWorkflowReadOnlyReleaseRiskLedger({
    rcRegressionAuditSummary:{
      status:"passed",
      auditHealth:{ noSensitiveDataRisk:true, noTradingRisk:true, noSecretRisk:true, noExternalOpenRisk:true, noFileWriteRisk:true, noDownloadRisk:true },
      userFacingSummary:{ resultLabel:"RC 回归审计通过", redacted:true },
      redacted:true
    },
    rcEvidenceReviewSummary:{ status:"complete", userFacingSummary:{ resultLabel:"证据完整", redacted:true }, redacted:true },
    freezeGateSummary:{ status:"frozen", redacted:true },
    evidenceFreezePackSummary:{ status:"ready", redacted:true },
    copyValidationStatus:"pass"
  });
  assert.equal(model.status, "clear");
  assert.equal(model.userFacingSummary.title, "只读发布风险台账");
  assert.equal(model.riskSummary.safeToContinueReleaseCandidate, true);
  assert.equal(model.safety.payment, false);
  const audit = api.buildFlightWorkflowReleaseRiskLedgerAuditDraft({ secret:"abc" });
  assert.equal(audit.eventType, "FLIGHT_WORKFLOW_READ_ONLY_RELEASE_RISK_LEDGER_AUDIT_DRAFT");
  assert.equal(JSON.stringify(audit).includes("abc"), false);
  console.log("FLIGHT_WORKFLOW_READ_ONLY_RELEASE_RISK_LEDGER PASS");
}
main();
