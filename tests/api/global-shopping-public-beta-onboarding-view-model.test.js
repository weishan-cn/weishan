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
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaUserOnboardingShell.js",
    "apps/desktop/src/renderer/core/globalShoppingVisualTrialGuide.js",
    "apps/desktop/src/renderer/core/globalShoppingSafeFeedbackDraftPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaOnboardingViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaOnboardingViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_ONBOARDING_VIEW_MODEL_VERSION, "4.2.5");
  const ready = api.buildGlobalShoppingPublicBetaOnboardingViewModel({
    publicBetaUserOnboardingShellSummary:summary("Public Beta User Onboarding"),
    visualTrialGuideSummary:summary("Visual Trial Guide"),
    safeFeedbackDraftPanelSummary:summary("Safe Feedback Draft")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.5");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(ready.cards.length >= 7, true);
  assert.equal(api.buildGlobalShoppingPublicBetaOnboardingViewModel({
    publicBetaUserOnboardingShellSummary:summary("Public Beta User Onboarding")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaOnboardingViewModel({
    publicBetaUserOnboardingShellSummary:{ status:"blocked", title:"Public Beta User Onboarding" },
    visualTrialGuideSummary:summary("Visual Trial Guide"),
    safeFeedbackDraftPanelSummary:summary("Safe Feedback Draft")
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_ONBOARDING_VIEW_MODEL PASS");
}

main();
