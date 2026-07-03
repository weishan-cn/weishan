const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function readySummary(title, resultLabel) {
  return {
    status:"ready",
    title,
    userFacingSummary:{ title, resultLabel, redacted:true },
    bookingUrl:null,
    checkoutUrl:null,
    paymentUrl:null,
    orderUrl:null,
    payment:false,
    order:false,
    ticketing:false,
    autoOpen:false,
    autoRefresh:false,
    fileWrite:false,
    download:false,
    redacted:true
  };
}

function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderDistributionFreezeConsole.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderDistributionFreezeConsole;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_FREEZE_CONSOLE_VERSION, "4.1.6");
  const ready = api.buildGlobalShoppingProviderDistributionFreezeConsole({
    offlineDistributionReadinessCenterSummary:readySummary("Offline Distribution Readiness Center", "Offline Distribution Readiness Center 已准备"),
    noActivationEnforcementLedgerSummary:readySummary("No-Activation Enforcement Ledger", "No-Activation Enforcement Ledger 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    providerSafetyDistributionMatrixSummary:readySummary("Provider Safety Distribution Matrix", "Provider Safety Distribution Matrix 已准备"),
    providerDistributionReadinessViewModelSummary:readySummary("Provider Distribution Readiness Review", "Provider Distribution Readiness Review 已准备")
  });
  assert.equal(ready.consoleName, "global_shopping_provider_distribution_freeze_console_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider Distribution Freeze Console");
  assert.equal(ready.freezeSummary.readyForUserFacingSafetyReceipt, true);
  assert.equal(ready.rows.some((row) => row.value === "Distribution Freeze 不创建真实分发包、不冻结配置。"), true);
  const needsReview = api.buildGlobalShoppingProviderDistributionFreezeConsole({});
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingProviderDistributionFreezeConsole({
    offlineDistributionReadinessCenterSummary:readySummary("Offline Distribution Readiness Center", "Offline Distribution Readiness Center 已准备"),
    noActivationEnforcementLedgerSummary:readySummary("No-Activation Enforcement Ledger", "No-Activation Enforcement Ledger 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    providerSafetyDistributionMatrixSummary:readySummary("Provider Safety Distribution Matrix", "Provider Safety Distribution Matrix 已准备"),
    providerDistributionReadinessViewModelSummary:readySummary("Provider Distribution Readiness Review", "Provider Distribution Readiness Review 已准备"),
    freezeRuntimeConfig:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("runtime_config_freeze_detected"), true);
  const json = JSON.stringify(api.buildGlobalShoppingProviderDistributionFreezeConsole({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_DISTRIBUTION_FREEZE_CONSOLE PASS");
}

main();
