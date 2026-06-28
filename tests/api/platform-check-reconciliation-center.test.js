const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file){ const window = {}; window.window = window; vm.runInContext(fs.readFileSync(path.join(ROOT,file), "utf8"), vm.createContext({ window, console }), { filename:file }); return window; }
const api = load("apps/desktop/src/renderer/core/platformCheckReconciliationCenter.js").WeishanPlatformCheckReconciliationCenter;
function model(evidence, candidate = { totalPrice:1000, currency:"CNY", providerName:"Trusted" }) {
  return api.buildPlatformCheckReconciliationCenter({ selectedCandidate:candidate, manualPlatformCheckEvidence:evidence, handoffReceiptSummary:{ providerName:"Trusted", displayHost:"example.com", userConfirmed:true } });
}
assert.equal(model(null).appVersion, "2.1.95");
assert.equal(model(null).status, "no_platform_check");
assert.equal(model(null).reconciliationResult.confidenceLabel, "不可确认");
assert.equal(model({ status:"accepted", observedCurrency:"CNY", observedTotalPrice:1000, observedInventoryStatus:"available" }).status, "matched");
assert.equal(model({ status:"accepted", observedCurrency:"CNY", observedTotalPrice:1000, observedInventoryStatus:"available" }).reconciliationResult.confidenceLabel, "高一致");
assert.equal(model({ status:"accepted", observedCurrency:"CNY", observedTotalPrice:1030, observedInventoryStatus:"available" }).status, "price_changed");
assert.equal(model({ status:"accepted", observedCurrency:"CNY", observedTotalPrice:1030, observedInventoryStatus:"available" }).reconciliationResult.confidenceLabel, "有差异");
assert.equal(model({ status:"accepted", observedCurrency:"CNY", observedTotalPrice:1100, observedInventoryStatus:"available" }).status, "needs_recheck");
assert.equal(model({ status:"accepted", observedCurrency:"USD", observedTotalPrice:1000, observedInventoryStatus:"available" }).status, "needs_recheck");
assert.equal(model({ status:"accepted", observedCurrency:"CNY", observedTotalPrice:1000, observedInventoryStatus:"unavailable" }).status, "needs_recheck");
assert.equal(model({ status:"blocked", sensitiveInputBlocked:true }).status, "blocked");
const safe = model({ status:"accepted", observedCurrency:"CNY", observedTotalPrice:1000 });
assert.equal(safe.safety.bookingUrl, null);
assert.equal(safe.safety.rawUrlStored, false);
assert.equal(safe.safety.secretStored, false);
assert.equal(safe.safety.payment, false);
assert.equal(safe.safety.order, false);
assert.equal(safe.safety.identityUpload, false);
console.log("PLATFORM_CHECK_RECONCILIATION_CENTER PASS");
