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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingTrustClosureExportPreview.js"]);
  const api = windowRef.WeishanGlobalShoppingTrustClosureExportPreview;
  assert.equal(api.GLOBAL_SHOPPING_TRUST_CLOSURE_EXPORT_PREVIEW_VERSION, "4.0.5");
  const ready = api.buildGlobalShoppingTrustClosureExportPreview({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备"),
    providerTrustClosureViewModelSummary:readySummary("Provider Trust Closure Review", "Provider Trust Closure Review 已准备")
  });
  assert.equal(ready.previewName, "global_shopping_trust_closure_export_preview_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.exportMode, "preview_only");
  assert.equal(ready.exportSummary.readyForManualPreview, true);
  assert.equal(ready.userFacingSummary.resultLabel, "Trust Closure Export Preview 已准备");
  const needsReview = api.buildGlobalShoppingTrustClosureExportPreview({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.exportSummary.readyForManualPreview, false);
  const blocked = api.buildGlobalShoppingTrustClosureExportPreview({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备"),
    download:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("download_detected"), true);
  const safeJson = JSON.stringify(api.buildGlobalShoppingTrustClosureExportPreviewAuditDraft({ token:"abc", orderUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_TRUST_CLOSURE_EXPORT_PREVIEW PASS");
}

main();
