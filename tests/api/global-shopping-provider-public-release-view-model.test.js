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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderPublicReleaseViewModel.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderPublicReleaseViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_PUBLIC_RELEASE_VIEW_MODEL_VERSION, "4.0.5");
  const ready = api.buildGlobalShoppingProviderPublicReleaseViewModel({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备"),
    trustClosureExportPreviewSummary:readySummary("Trust Closure Export Preview", "Trust Closure Export Preview 已准备"),
    finalNoProviderBoundaryReceiptSummary:readySummary("Final No-Provider Boundary Receipt", "Final No-Provider Boundary Receipt 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备")
  });
  assert.equal(ready.viewModelName, "global_shopping_provider_public_release_view_model_v1");
  assert.equal(ready.appVersion, "4.0.5");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Public Release Review");
  assert.equal(ready.cards.length, 5);
  assert.equal(ready.safeToProceedWithHumanPublicReleaseReview, true);
  assert.equal(ready.disclosureRows.some((row) => row.value === "Public Release 不创建真实公开发布"), true);
  const needsReview = api.buildGlobalShoppingProviderPublicReleaseViewModel({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.safeToProceedWithHumanPublicReleaseReview, false);
  const blocked = api.buildGlobalShoppingProviderPublicReleaseViewModel({
    providerReadOnlyPublicReleaseCenterSummary:{ status:"blocked", userFacingSummary:{ title:"Provider Read-Only Public Release Center", resultLabel:"Provider Read-Only Public Release Center 已阻断", redacted:true }, rows:[], redacted:true },
    trustClosureExportPreviewSummary:readySummary("Trust Closure Export Preview", "Trust Closure Export Preview 已准备"),
    finalNoProviderBoundaryReceiptSummary:readySummary("Final No-Provider Boundary Receipt", "Final No-Provider Boundary Receipt 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备")
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.safeToProceedWithHumanPublicReleaseReview, false);
  const safeJson = JSON.stringify(api.buildGlobalShoppingProviderPublicReleaseViewModelAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_PUBLIC_RELEASE_VIEW_MODEL PASS");
}

main();
