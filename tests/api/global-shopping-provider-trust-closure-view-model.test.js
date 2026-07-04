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
    rows:[{ rowId:title.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label:title, value:resultLabel, status:"pass", redacted:true }],
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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderTrustClosureViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderTrustClosureViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_TRUST_CLOSURE_VIEW_MODEL_VERSION, "4.2.1");
  const ready = api.buildGlobalShoppingProviderTrustClosureViewModel({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备"),
    offlineReleaseMemorySnapshotSummary:readySummary("Offline Release Memory Snapshot", "Offline Release Memory Snapshot 已准备"),
    noProviderExecutionFinalGuardSummary:readySummary("No-Provider-Execution Final Guard", "No-Provider-Execution Final Guard 已准备"),
    userVisibleSafetyBoundaryExplainerSummary:readySummary("User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 已准备")
  });
  assert.equal(ready.viewModelName, "global_shopping_provider_trust_closure_view_model_v1");
  assert.equal(ready.appVersion, "4.2.1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Trust Closure Review");
  assert.equal(ready.cards.length, 5);
  assert.equal(ready.safeToProceedWithHumanTrustClosureReview, true);
  assert.equal(ready.disclosureRows.some((row) => row.value === "Public Trust Closure 不生成真实公开声明"), true);
  const needsReview = api.buildGlobalShoppingProviderTrustClosureViewModel({
    providerPublicTrustClosureCenterSummary:readySummary("Provider Public Trust Closure Center", "Provider Public Trust Closure Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithHumanTrustClosureReview, false);
  const blocked = api.buildGlobalShoppingProviderTrustClosureViewModel({
    providerPublicTrustClosureCenterSummary:{ status:"blocked", userFacingSummary:{ title:"Provider Public Trust Closure Center", resultLabel:"Provider Public Trust Closure Center 已阻断", redacted:true }, rows:[], redacted:true },
    offlineReleaseMemorySnapshotSummary:readySummary("Offline Release Memory Snapshot", "Offline Release Memory Snapshot 已准备"),
    noProviderExecutionFinalGuardSummary:readySummary("No-Provider-Execution Final Guard", "No-Provider-Execution Final Guard 已准备"),
    userVisibleSafetyBoundaryExplainerSummary:readySummary("User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 已准备")
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.safeToProceedWithHumanTrustClosureReview, false);
  const safeJson = JSON.stringify(api.buildGlobalShoppingProviderTrustClosureViewModelAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_TRUST_CLOSURE_VIEW_MODEL PASS");
}

main();
