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

function summary(title, status) {
  return {
    status:status || "ready",
    title,
    userFacingSummary:{ title, resultLabel:title + (status === "blocked" ? " 已阻断" : " 已准备"), redacted:true },
    rows:[{ rowId:title, label:title, value:title + (status === "blocked" ? " 已阻断" : " 已准备"), status:status === "blocked" ? "blocked" : "pass", redacted:true }],
    redacted:true
  };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaRcConsole.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaRcConsole;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_RC_CONSOLE_VERSION, "4.1.5");

  const ready = api.buildGlobalShoppingPublicBetaRcConsole({
    publicBetaOnboardingViewModelSummary:summary("Public Beta Onboarding View Model"),
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    publicBetaTrialScenarioChecklistSummary:summary("Trial Scenario Checklist"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    finalManualAcceptanceConsoleSummary:summary("Final Manual Acceptance Console")
  });
  assert.equal(ready.appVersion, "4.1.5");
  assert.equal(ready.rcStatus, "manual_review_required");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(ready.blockedCapabilities.length, 0);

  const needsReview = api.buildGlobalShoppingPublicBetaRcConsole({
    publicBetaOnboardingViewModelSummary:summary("Public Beta Onboarding View Model")
  });
  assert.equal(needsReview.rcStatus, "needs_review");

  const blockedByCapability = api.buildGlobalShoppingPublicBetaRcConsole({
    publicBetaOnboardingViewModelSummary:summary("Public Beta Onboarding View Model"),
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    publicBetaTrialScenarioChecklistSummary:summary("Trial Scenario Checklist"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    finalManualAcceptanceConsoleSummary:summary("Final Manual Acceptance Console"),
    push:true
  });
  assert.equal(blockedByCapability.rcStatus, "blocked");

  const blockedByLanguage = api.buildGlobalShoppingPublicBetaRcConsole({
    publicBetaOnboardingViewModelSummary:summary("Public Beta Onboarding View Model"),
    publicBetaVisualQaConsoleSummary:summary("Public Beta Visual QA Console"),
    publicBetaTrialScenarioChecklistSummary:summary("Trial Scenario Checklist"),
    noTransactionRegressionGuardSummary:summary("No-Transaction Regression Guard"),
    finalManualAcceptanceConsoleSummary:summary("Final Manual Acceptance Console"),
    summary:"ready_to_publish"
  });
  assert.equal(blockedByLanguage.rcStatus, "blocked");

  const malformed = api.buildGlobalShoppingPublicBetaRcConsole(null);
  assert.ok(["needs_review", "blocked"].includes(malformed.rcStatus));
  assert.equal(JSON.stringify(ready).includes("token"), false);
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_RC_CONSOLE PASS");
}

main();
