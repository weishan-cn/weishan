const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowRcRegressionAuditPack.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyReleaseRiskLedger.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcRegressionViewModel.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowRcRegressionViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_RC_REGRESSION_VIEW_MODEL_VERSION, "4.0.0");
  const model = api.buildFlightWorkflowRcRegressionViewModel({
    rcRegressionAuditSummary:{ status:"passed", userFacingSummary:{ resultLabel:"RC 回归审计通过", redacted:true }, regressionRows:[{ rowId:"regression", label:"回归审计", value:"RC 回归审计通过", status:"pass", redacted:true }], redacted:true },
    releaseRiskLedgerSummary:{ status:"clear", userFacingSummary:{ resultLabel:"暂无阻断风险", redacted:true }, rows:[{ rowId:"release_risk", label:"发布风险", value:"暂无阻断风险", status:"pass", redacted:true }], redacted:true }
  });
  assert.equal(model.status, "clear");
  assert.equal(model.title, "只读 RC 回归审计");
  assert.equal(model.cards.length, 4);
  assert.equal(model.cards[0].label, "回归审计");
  assert.equal(model.riskRows[0].value, "暂无阻断风险");
  assert.equal(model.bookingUrl, null);
  const audit = api.buildFlightWorkflowRcRegressionViewModelAuditDraft({ token:"abc" });
  assert.equal(audit.eventType, "FLIGHT_WORKFLOW_RC_REGRESSION_VIEW_MODEL_AUDIT_DRAFT");
  assert.equal(JSON.stringify(audit).includes("abc"), false);
  console.log("FLIGHT_WORKFLOW_RC_REGRESSION_VIEW_MODEL PASS");
}
main();
