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

function summary(title) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel:title + " 已准备", redacted:true }, rows:[{ rowId:title, label:title, value:title + " 已准备", status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaVisualQaConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialScenarioChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingNoTransactionRegressionGuard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaQaViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialReadinessPack.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaUserOnboardingShell.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaUserOnboardingShell;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_USER_ONBOARDING_SHELL_VERSION, "4.2.1");
  const ready = api.buildGlobalShoppingPublicBetaUserOnboardingShell({
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    publicBetaTrialScenarioChecklistSummary:summary("Trial Scenario Checklist"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    publicBetaQaViewModelSummary:summary("Public Beta QA View Model"),
    publicBetaTrialReadinessPackSummary:summary("Public Beta Trial Readiness Pack")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.1");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.match(ready.userValueSummary, /候选价、费用归一化和官方价锚点/);
  assert.match(ready.userFacingSummary.caveat, /不创建 release、不 push/);
  assert.equal(api.buildGlobalShoppingPublicBetaUserOnboardingShell({
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaUserOnboardingShell({
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    publicBetaTrialScenarioChecklistSummary:summary("Trial Scenario Checklist"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    publicBetaQaViewModelSummary:summary("Public Beta QA View Model"),
    publicBetaTrialReadinessPackSummary:summary("Public Beta Trial Readiness Pack"),
    externalOpen:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_USER_ONBOARDING_SHELL PASS");
}

main();
