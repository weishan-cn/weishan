const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowUserSafetyCopyRegistry.js",
    "apps/desktop/src/renderer/core/flightWorkflowReleaseReadinessDashboard.js",
    "apps/desktop/src/renderer/core/flightWorkflowReleaseReadinessViewModel.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowReleaseReadinessViewModel;
  assert.equal(api.FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_VERSION, "4.1.7");
  const dashboard = { status:"ready", releaseVersion:"4.1.7", safeForUserFacingBeta:true, readiness:{ status:"ready", matrixBlocked:false, warningCount:0, operatorReady:true, redacted:true }, cards:[], checklistRows:[{ label:"安全矩阵", passed:true, value:"通过", redacted:true }], forbiddenCapabilities:["付款", "下单", "出票", "证件银行卡上传"], userFacingSummary:{ resultLabel:"可以进入只读 Beta 验收", redacted:true }, redacted:true };
  const vm = api.buildFlightWorkflowReleaseReadinessViewModel({ releaseReadinessSummary:dashboard });
  assert.equal(vm.title, "机票工作流发布就绪总览");
  assert.ok(vm.statusCards.some((card) => card.cardId === "release_status"));
  assert.ok(vm.statusCards.some((card) => card.cardId === "safety_boundary"));
  assert.ok(vm.statusCards.some((card) => card.cardId === "safety_matrix"));
  assert.ok(vm.forbiddenCapabilityRows.length >= 4);
  assert.ok(vm.caveat.includes("不代表真实票价、库存或可出票"));
  assert.ok(vm.caveat.includes("唯珊不会付款"));
  assert.equal(vm.bookingUrl, null);
  assert.equal(vm.payment, false);
  const json = JSON.stringify(api.buildFlightWorkflowReleaseReadinessViewModel({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  const auditDraft = api.buildFlightWorkflowReleaseReadinessViewModelAuditDraft({ releaseReadinessSummary:dashboard });
  assert.equal(auditDraft.eventType, "FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL_AUDIT_DRAFT");
  assert.equal(auditDraft.bookingUrl, null);
  console.log("FLIGHT_WORKFLOW_RELEASE_READINESS_VIEW_MODEL PASS");
}
main();
