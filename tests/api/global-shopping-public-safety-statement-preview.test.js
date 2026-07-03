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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicSafetyStatementPreview.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicSafetyStatementPreview;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_SAFETY_STATEMENT_PREVIEW_VERSION, "4.1.1");
  const ready = api.buildGlobalShoppingPublicSafetyStatementPreview({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备"),
    trustClosureExportPreviewSummary:readySummary("Trust Closure Export Preview", "Trust Closure Export Preview 已准备"),
    finalNoProviderBoundaryReceiptSummary:readySummary("Final No-Provider Boundary Receipt", "Final No-Provider Boundary Receipt 已准备")
  });
  assert.equal(ready.statementName, "global_shopping_public_safety_statement_preview_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.statementMode, "preview_only");
  assert.equal(ready.statementSummary.readyForPublicSafetyReview, true);
  assert.equal(ready.userFacingSummary.resultLabel, "Public Safety Statement Preview 已准备");
  const needsReview = api.buildGlobalShoppingPublicSafetyStatementPreview({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  assert.equal(needsReview.statementSummary.readyForPublicSafetyReview, false);
  const blocked = api.buildGlobalShoppingPublicSafetyStatementPreview({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备"),
    provider:true
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.blockedReasons.includes("provider_detected"), true);
  const safeJson = JSON.stringify(api.buildGlobalShoppingPublicSafetyStatementPreviewAuditDraft({ apiKey:"abc", checkoutUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PUBLIC_SAFETY_STATEMENT_PREVIEW PASS");
}

main();
