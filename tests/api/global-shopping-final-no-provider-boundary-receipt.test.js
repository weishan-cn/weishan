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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingFinalNoProviderBoundaryReceipt.js"]);
  const api = windowRef.WeishanGlobalShoppingFinalNoProviderBoundaryReceipt;
  assert.equal(api.GLOBAL_SHOPPING_FINAL_NO_PROVIDER_BOUNDARY_RECEIPT_VERSION, "4.2.5");
  const ready = api.buildGlobalShoppingFinalNoProviderBoundaryReceipt({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备"),
    trustClosureExportPreviewSummary:readySummary("Trust Closure Export Preview", "Trust Closure Export Preview 已准备")
  });
  assert.equal(ready.receiptName, "global_shopping_final_no_provider_boundary_receipt_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.boundaryMode, "no_provider_receipt_only");
  assert.equal(ready.boundarySummary.readyForBoundaryDisclosure, true);
  assert.equal(ready.userFacingSummary.resultLabel, "Final No-Provider Boundary Receipt 已准备");
  const needsReview = api.buildGlobalShoppingFinalNoProviderBoundaryReceipt({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.boundarySummary.readyForBoundaryDisclosure, false);
  const blocked = api.buildGlobalShoppingFinalNoProviderBoundaryReceipt({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备"),
    autoOpen:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("external_open_detected"), true);
  const safeJson = JSON.stringify(api.buildGlobalShoppingFinalNoProviderBoundaryReceiptAuditDraft({ secret:"abc", paymentUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_FINAL_NO_PROVIDER_BOUNDARY_RECEIPT PASS");
}

main();
