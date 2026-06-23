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
  const windowRef = load(["apps/desktop/src/renderer/core/cleanResultSurfaceV1.js"]);
  const api = windowRef.WeishanCleanResultSurfaceV1;
  assert.equal(api.CLEAN_RESULT_SURFACE_V1_VERSION, "2.1.70");
  const ready = api.buildCleanResultSurfaceV1({ brainDecision:{ procurementCategory:"flight", intentStatus:"ready" }, limitedBetaAvailable:true, limitedBetaPriceDisplay:"Limited Beta 只读验证价" });
  assert.equal(ready.resultSurfaceMode, "ready_with_results");
  assert.ok(ready.resultCardCount <= 3);
  assert.equal(ready.debugPanelsHiddenByDefault, true);
  assert.equal(ready.noPriceMessage, "暂无生产真实价格结果");
  const killOff = api.buildCleanResultSurfaceV1({ brainDecision:{ procurementCategory:"flight", intentStatus:"ready" }, limitedBetaAvailable:true, killSwitchState:"disabled" });
  assert.equal(killOff.resultSurfaceMode, "no_real_price");
  assert.equal(killOff.duplicateNoPriceMessageCount, 1);
  const noResult = api.buildCleanResultSurfaceV1({ brainDecision:{ procurementCategory:"product", intentStatus:"ready" } });
  assert.equal(noResult.resultSurfaceMode, "no_real_price");
  assert.equal(noResult.duplicateNoPriceMessageCount, 1);
  const blocked = api.buildCleanResultSurfaceV1({ brainDecision:{ procurementCategory:"restricted_or_blocked", intentStatus:"blocked" } });
  assert.equal(blocked.resultSurfaceMode, "blocked");
  assert.equal(blocked.resultCardCount, 0);
  for (const surface of [ready, killOff, noResult, blocked]) {
    assert.equal(surface.bookingUrlDisplayedCount, 0);
    assert.equal(surface.paymentActionDisplayedCount, 0);
    assert.equal(surface.orderActionDisplayedCount, 0);
    assert.equal(surface.identityUploadDisplayedCount, 0);
    for (const card of surface.resultCards) assert.ok(["manual_confirm", "copy_search_conditions", "external_search_manual"].includes(card.actionType));
    assert.equal(api.assertCleanResultSurfaceV1Safe(surface), true);
  }
  const audit = api.buildCleanResultSurfaceV1AuditDraft({ brainDecision:{ procurementCategory:"flight", intentStatus:"ready" }, limitedBetaAvailable:true });
  assert.equal(audit.eventType, "CLEAN_RESULT_SURFACE_V1_DRAFT");
  assert.equal(audit.maxResultCardCount, 3);
  assert.equal(audit.bookingUrlDisplayedCount, 0);
  assert.equal(audit.paymentActionDisplayedCount, 0);
  assert.equal(audit.orderActionDisplayedCount, 0);
  assert.equal(audit.identityUploadDisplayedCount, 0);
  assert.equal(audit.redacted, true);
  console.log("CLEAN_RESULT_SURFACE_V1_CORE PASS");
}

main();
