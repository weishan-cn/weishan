const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowRcCopyReviewViewModel.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowRcCopyReviewViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_RC_COPY_REVIEW_VIEW_MODEL_VERSION, "3.8.0");
  const model = api.buildFlightWorkflowRcCopyReviewViewModel({
    rcCopyFinalizationSummary:{ status:"finalized", userFacingSummary:{ resultLabel:"文案可以定稿", redacted:true }, copyRows:[{ rowId:"copy", label:"文案定稿", value:"文案可以定稿", status:"pass", redacted:true }], forbiddenCopyFindings:[], redacted:true },
    safetyDisclosureReviewSummary:{ status:"approved", userFacingSummary:{ resultLabel:"安全披露通过", redacted:true }, disclosureRows:[{ rowId:"disclosure", label:"安全披露", value:"安全披露通过", status:"pass", redacted:true }], redacted:true },
    releaseRiskLedgerSummary:{ status:"clear", rows:[{ rowId:"risk", label:"发布风险", value:"暂无阻断风险", status:"pass", redacted:true }], redacted:true }
  });
  assert.equal(model.title, "只读 RC 文案定稿与安全披露");
  assert.equal(model.cards[0].cardId, "copy_finalization");
  assert.equal(model.cards[1].cardId, "safety_disclosure");
  assert.equal(model.cards[2].cardId, "forbidden_copy");
  assert.equal(model.cards[3].cardId, "next_step");
  assert.equal(model.copyRows.length, 1);
  assert.equal(model.disclosureRows.length, 1);
  assert.equal(model.riskRows.length, 1);
  assert.equal(model.bookingUrl, null);
  console.log("FLIGHT_WORKFLOW_RC_COPY_REVIEW_VIEW_MODEL PASS");
}
main();
