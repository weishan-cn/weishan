const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingFinalUserSafetyChecklist.js");
  const api = windowRef.WeishanGlobalShoppingFinalUserSafetyChecklist;
  assert.equal(api.GLOBAL_SHOPPING_FINAL_USER_SAFETY_CHECKLIST_VERSION, "4.2.4");

  const ready = api.buildGlobalShoppingFinalUserSafetyChecklist({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.safetyItems.length >= 7, true);
  assert.equal(ready.checklistBoundary.canPersistChecklist, false);

  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ hasPriceSafety:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ hasAvailabilitySafety:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ hasFeePolicySafety:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ hasIdentityPrivacySafety:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ hasPaymentOrderSafety:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ hasPlatformFinalAuthority:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ hasUserDecisionBoundary:false }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ persistChecklist:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ openExternal:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ paymentAuthorization:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingFinalUserSafetyChecklist({ hasForbiddenClaim:true }).status, "blocked");
  assert.equal(JSON.stringify(ready).includes("token"), false);
}

main();
