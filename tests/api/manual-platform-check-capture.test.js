const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file){ const window = {}; window.window = window; vm.runInContext(fs.readFileSync(path.join(ROOT,file), "utf8"), vm.createContext({ window, console }), { filename:file }); return window; }
const api = load("apps/desktop/src/renderer/core/manualPlatformCheckCapture.js").WeishanManualPlatformCheckCapture;
const valid = api.buildManualPlatformCheckEvidence({ observedCurrency:"CNY", observedTotalPrice:1100, observedBaseFare:900, observedTaxesAndFees:150, observedProviderFees:50, observedInventoryStatus:"available", observedRulesChanged:false, userNote:"平台显示含税" });
assert.equal(valid.appVersion, "2.2.3");
assert.equal(valid.status, "accepted");
assert.equal(api.buildManualPlatformCheckEvidence({ observedTotalPrice:1 }).status, "rejected");
assert.equal(api.buildManualPlatformCheckEvidence({ observedCurrency:"CNY", observedTotalPrice:"NaN" }).status, "rejected");
for (const field of ["apiKey", "cardNumber", "rawHtml", "screenshotPath", "orderId", "paymentId"]) { const input = { observedCurrency:"CNY", observedTotalPrice:1 }; input[field] = "SECRET"; assert.equal(api.buildManualPlatformCheckEvidence(input).status, "blocked"); }
const note = api.buildManualPlatformCheckEvidence({ observedCurrency:"CNY", observedTotalPrice:1, userNote:"hello apiKey" });
assert.equal(note.status, "blocked");
assert.equal(valid.safety.payment, false);
assert.equal(valid.safety.order, false);
assert.equal(valid.safety.identityUpload, false);
assert.equal(api.buildManualPlatformCheckEvidence({ observedCurrency:"CNY", observedTotalPrice:1, observedInventoryStatus:"unavailable" }).observedInventoryStatus, "unavailable");
assert.equal(api.buildManualPlatformCheckEvidence({ observedCurrency:"CNY", observedTotalPrice:1, userNote:"passport 123" }).status, "blocked");
assert.equal(valid.confidenceLabel, "不可确认");
console.log("MANUAL_PLATFORM_CHECK_CAPTURE PASS");
