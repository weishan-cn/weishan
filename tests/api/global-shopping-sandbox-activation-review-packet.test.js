const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function readySummary(title, resultLabel) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingSandboxActivationReviewPacket.js"]);
  const api = windowRef.WeishanGlobalShoppingSandboxActivationReviewPacket;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_ACTIVATION_REVIEW_PACKET_VERSION, "3.1.0");

  const ready = api.buildGlobalShoppingSandboxActivationReviewPacket({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    manualActivationCommandCenterSummary:readySummary("Manual Activation Command Center", "人工激活指挥已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "发布冻结门已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.reviewBoundary.canActivateSandbox, false);
  assert.equal(ready.reviewSummary.manualActivationReviewRequired, true);

  const needsReview = api.buildGlobalShoppingSandboxActivationReviewPacket({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxActivationReviewPacket({
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    manualActivationCommandCenterSummary:readySummary("Manual Activation Command Center", "人工激活指挥已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "发布冻结门已准备"),
    activateSandbox:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_SANDBOX_ACTIVATION_REVIEW_PACKET PASS");
}

main();
