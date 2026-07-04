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

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaStabilityAudit.js",
    "apps/desktop/src/renderer/core/globalShoppingManualLaunchHandoffPack.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingManualLaunchHandoffPack;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_PACK_VERSION, "4.2.6");

  const ready = api.buildGlobalShoppingManualLaunchHandoffPack({
    publicBetaStabilityAuditSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Stability Audit", resultLabel:"Public Beta Stability Audit 已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.6");
  assert.equal(ready.manualReviewRequired, true);
  assert.deepEqual(ready.nextDecisionOptions, ["manual_review_required", "continue_testing"]);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.buyButtonEnabled, false);

  const needsReview = api.buildGlobalShoppingManualLaunchHandoffPack({});
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualLaunchHandoffPack({
    publicBetaStabilityAuditSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Stability Audit", resultLabel:"Public Beta Stability Audit 已准备", redacted:true }, redacted:true },
    upload:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(JSON.stringify(ready).includes("token"), false);
  console.log("GLOBAL_SHOPPING_MANUAL_LAUNCH_HANDOFF_PACK PASS");
}

main();
