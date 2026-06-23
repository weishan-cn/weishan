const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file){ const window = {}; window.window = window; vm.runInContext(fs.readFileSync(path.join(ROOT,file), "utf8"), vm.createContext({ window, console, URL }), { filename:file }); return window; }
const api = load("apps/desktop/src/renderer/core/safeProviderConfirmationChecklist.js").WeishanSafeProviderConfirmationChecklist;
assert.equal(api.SAFE_PROVIDER_CONFIRMATION_CHECKLIST_VERSION, "2.1.64");
const ready = api.buildSafeProviderConfirmationChecklist({ providerName:"Google Flights", safeProviderHandoffUrl:"https://www.google.com/travel/flights", selectedCandidate:{ quoteId:"q1", totalPrice:100, currency:"CNY", safeProviderHandoffReady:true } });
assert.equal(ready.status, "ready");
assert.equal(ready.actions.requiresUserConfirmation, true);
assert.equal(ready.actions.canPayHere, false);
assert.equal(ready.actions.canOrderHere, false);
assert.equal(ready.safety.bookingUrl, null);
assert.equal(JSON.stringify(ready).includes("secret"), false);
assert.equal(api.buildSafeProviderConfirmationChecklist({ safeProviderHandoffUrl:"https://www.google.com/travel/flights" }).status, "disabled");
assert.equal(api.buildSafeProviderConfirmationChecklist({ safeProviderHandoffUrl:"https://example.com/payment", selectedCandidate:{ quoteId:"q1" }, status:"blocked" }).status, "blocked");
console.log("SAFE_PROVIDER_CONFIRMATION_CHECKLIST PASS");
