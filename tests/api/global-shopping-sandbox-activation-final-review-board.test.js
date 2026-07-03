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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingSandboxActivationFinalReviewBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingSandboxActivationFinalReviewBoard;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_ACTIVATION_FINAL_REVIEW_BOARD_VERSION, "4.1.7");

  const ready = api.buildGlobalShoppingSandboxActivationFinalReviewBoard({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备"),
    adapterPolicyEngineSummary:readySummary("Adapter Policy Engine", "Adapter 策略引擎已准备"),
    humanReleaseEvidenceTimelineSummary:readySummary("Human Release Evidence Timeline", "人工发布证据时间线已准备"),
    sandboxActivationReviewPacketSummary:readySummary("Sandbox Activation Review Packet", "Sandbox 激活复核包已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    providerOfflineReleaseGateSummary:readySummary("Provider Offline Release Gate", "离线发布闸门已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.reviewSummary.humanFinalReviewRequired, true);
  assert.equal(ready.reviewBoundary.canActivateSandbox, false);
  assert.equal(JSON.stringify(ready).includes("key"), false);

  const needsReview = api.buildGlobalShoppingSandboxActivationFinalReviewBoard({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxActivationFinalReviewBoard({
    offlineProviderLaunchControlTowerSummary:readySummary("Offline Provider Launch Control Tower", "离线 Launch 控制塔已准备"),
    activateSandbox:true
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_SANDBOX_ACTIVATION_FINAL_REVIEW_BOARD PASS");
}

main();
