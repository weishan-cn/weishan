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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingSandboxActivationReceiptLedger.js"]);
  const api = windowRef.WeishanGlobalShoppingSandboxActivationReceiptLedger;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_ACTIVATION_RECEIPT_LEDGER_VERSION, "4.0.1");

  const ready = api.buildGlobalShoppingSandboxActivationReceiptLedger({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备"),
    sandboxActivationReviewPacketSummary:readySummary("Sandbox Activation Review Packet", "Sandbox 激活复核包已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "发布冻结门已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.receiptBoundary.canPersistRealReceipt, false);
  assert.equal(ready.receiptSummary.humanReceiptReviewRequired, true);

  const needsReview = api.buildGlobalShoppingSandboxActivationReceiptLedger({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxActivationReceiptLedger({
    offlineLaunchDecisionSimulatorSummary:readySummary("Offline Launch Decision Simulator", "离线发布决策模拟器已准备"),
    sandboxActivationReviewPacketSummary:readySummary("Sandbox Activation Review Packet", "Sandbox 激活复核包已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据夹已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate", "发布冻结门已准备"),
    persistLedger:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_SANDBOX_ACTIVATION_RECEIPT_LEDGER PASS");
}

main();
