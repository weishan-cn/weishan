const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingManualVisitSafetyBrief.js");
  const api = windowRef.WeishanGlobalShoppingManualVisitSafetyBrief;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_VISIT_SAFETY_BRIEF_VERSION, "4.0.6");
  const ready = api.buildGlobalShoppingManualVisitSafetyBrief({});
  assert.equal(ready.appVersion, "4.0.6");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "手动访问安全简报已准备");
  assert.equal(api.buildGlobalShoppingManualVisitSafetyBrief({ statesNoGeneratedLink:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingManualVisitSafetyBrief({ statesNoConfirmationPersistence:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingManualVisitSafetyBrief({ persistConfirmation:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingManualVisitSafetyBrief({ openExternal:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingManualVisitSafetyBrief({ payment:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_MANUAL_VISIT_SAFETY_BRIEF PASS");
}
main();
