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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessFinalViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderLaunchReadinessFinalViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_FINAL_VIEW_MODEL_VERSION, "4.1.3");
  const ready = api.buildGlobalShoppingProviderLaunchReadinessFinalViewModel({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    noProviderUserAssurancePanelSummary:readySummary("No-Provider User Assurance Panel", "No-Provider User Assurance Panel 已准备"),
    offlineLaunchReadinessFinalizerSummary:readySummary("Offline Launch Readiness Finalizer", "Offline Launch Readiness Finalizer 已准备"),
    userSafePublicClaimVerifierSummary:readySummary("User-Safe Public Claim Verifier", "User-Safe Public Claim Verifier 已准备")
  });
  assert.equal(ready.viewModelName, "global_shopping_provider_launch_readiness_final_view_model_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Launch Readiness Final Review");
  assert.equal(ready.cards.length, 5);
  assert.equal(ready.safeToProceedWithHumanLaunchReadinessFinalReview, true);
  assert.equal(ready.disclosureRows.some((row) => row.value === "Launch Finalizer 不执行真实 launch"), true);
  const needsReview = api.buildGlobalShoppingProviderLaunchReadinessFinalViewModel({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithHumanLaunchReadinessFinalReview, false);
  const blocked = api.buildGlobalShoppingProviderLaunchReadinessFinalViewModel({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    noProviderUserAssurancePanelSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"No-Provider User Assurance Panel 已阻断", redacted:true }, rows:[], redacted:true },
    offlineLaunchReadinessFinalizerSummary:readySummary("Offline Launch Readiness Finalizer", "Offline Launch Readiness Finalizer 已准备"),
    userSafePublicClaimVerifierSummary:readySummary("User-Safe Public Claim Verifier", "User-Safe Public Claim Verifier 已准备")
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.safeToProceedWithHumanLaunchReadinessFinalReview, false);
  const safeJson = JSON.stringify(api.buildGlobalShoppingProviderLaunchReadinessFinalViewModelAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_LAUNCH_READINESS_FINAL_VIEW_MODEL PASS");
}

main();
