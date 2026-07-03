const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  files.forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingUserConfirmationChecklist.js"]);
  const api = windowRef.WeishanGlobalShoppingUserConfirmationChecklist;
  assert.equal(api.GLOBAL_SHOPPING_USER_CONFIRMATION_CHECKLIST_VERSION, "4.0.7");
  const ready = api.buildGlobalShoppingUserConfirmationChecklist({});
  assert.equal(ready.appVersion, "4.0.7");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "用户确认清单已准备");
  assert.equal(ready.confirmationItems.some((item) => item.category === "price"), true);
  assert.equal(ready.confirmationItems.some((item) => item.category === "fee"), true);
  assert.equal(ready.confirmationItems.some((item) => item.category === "availability"), true);
  assert.equal(ready.confirmationItems.some((item) => item.category === "identity"), true);
  assert.equal(ready.confirmationItems.some((item) => item.category === "account"), true);
  assert.equal(ready.confirmationItems.some((item) => item.category === "payment"), true);
  assert.equal(ready.confirmationItems.some((item) => item.category === "policy"), true);
  assert.equal(ready.confirmationItems.some((item) => item.category === "order"), true);
  assert.equal(ready.userOnlyActions.length >= 4, true);
  assert.equal(ready.checklistBoundary.canPersistUserConfirmation, false);
  assert.equal(ready.checklistBoundary.canSubmitUserConfirmation, false);
  assert.equal(ready.checklistBoundary.canOpenExternalNow, false);
  assert.equal(ready.checklistBoundary.canCheckout, false);
  assert.equal(ready.checklistBoundary.canPay, false);
  assert.equal(ready.checklistBoundary.canTicket, false);
  assert.equal(ready.checklistBoundary.canCreateOrder, false);
  assert.equal(ready.checklistBoundary.doesNotMakeDecisionForUser, true);
  assert.equal(api.buildGlobalShoppingUserConfirmationChecklist({ persistUserConfirmation:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingUserConfirmationChecklist({ submitUserConfirmation:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingUserConfirmationChecklist({ openExternal:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingUserConfirmationChecklist({ checkout:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingUserConfirmationChecklist({ payment:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingUserConfirmationChecklist({ ticketing:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingUserConfirmationChecklist({ createOrder:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingUserConfirmationChecklist({ makeDecisionForUser:true }).status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingUserConfirmationChecklist({ token:"abc", secret:"def" }));
  assert.equal(/abc|def|token|secret/i.test(safeJson), false);
  console.log("GLOBAL_SHOPPING_USER_CONFIRMATION_CHECKLIST PASS");
}

main();
