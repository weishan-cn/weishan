const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function summary(title, status) {
  return {
    status:status || "ready",
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : " 已准备"), status:status === "blocked" ? "blocked" : "pass", redacted:true }],
    redacted:true
  };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaStabilityAudit.js",
    "apps/desktop/src/renderer/core/globalShoppingManualLaunchHandoffPack.js",
    "apps/desktop/src/renderer/core/globalShoppingManualLaunchHandoffViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingManualLaunchHandoffViewModel;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_VIEW_MODEL_VERSION, "4.1.8");

  const ready = api.buildGlobalShoppingManualLaunchHandoffViewModel({
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit", "ready"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack", "ready")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.1.8");
  assert.equal(ready.safeToProceedWithManualLaunchHandoffReview, true);
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(ready.cards.length >= 6, true);

  const needsReview = api.buildGlobalShoppingManualLaunchHandoffViewModel({
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit", "ready")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualLaunchHandoffViewModel({
    publicBetaStabilityAuditSummary:summary("Public Beta Stability Audit", "blocked"),
    manualLaunchHandoffPackSummary:summary("Manual Launch Handoff Pack", "ready")
  });
  assert.equal(blocked.status, "blocked");
  console.log("GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_VIEW_MODEL PASS");
}

main();
