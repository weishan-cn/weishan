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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingHumanReleaseEvidenceTimeline.js"]);
  const api = windowRef.WeishanGlobalShoppingHumanReleaseEvidenceTimeline;
  assert.equal(api.GLOBAL_SHOPPING_HUMAN_RELEASE_EVIDENCE_TIMELINE_VERSION, "4.2.5");

  const ready = api.buildGlobalShoppingHumanReleaseEvidenceTimeline({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备"),
    adapterPolicyEngineSummary:readySummary("Adapter Policy Engine", "Adapter 策略引擎已准备"),
    humanApprovalEvidenceBinderSummary:readySummary("Human Approval Evidence Binder", "人工审批证据已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    providerCertificationFreezeLedgerSummary:readySummary("Provider Certification Freeze Ledger", "认证冻结台账已准备"),
    verifyE2eBuildSummary:readySummary("Verify / E2E / Build Summary", "Verify / E2E / Build 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.timelineSummary.humanEvidenceReviewRequired, true);
  assert.equal(ready.timelineBoundary.canPersistTimeline, false);
  assert.equal(JSON.stringify(ready).includes("token"), false);

  const needsReview = api.buildGlobalShoppingHumanReleaseEvidenceTimeline({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingHumanReleaseEvidenceTimeline({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备"),
    persistTimeline:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_HUMAN_RELEASE_EVIDENCE_TIMELINE PASS");
}

main();
