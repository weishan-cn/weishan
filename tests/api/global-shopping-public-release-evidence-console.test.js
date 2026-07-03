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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicReleaseEvidenceConsole.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicReleaseEvidenceConsole;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_RELEASE_EVIDENCE_CONSOLE_VERSION, "4.1.5");
  const ready = api.buildGlobalShoppingPublicReleaseEvidenceConsole({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备"),
    trustClosureExportPreviewSummary:readySummary("Trust Closure Export Preview", "Trust Closure Export Preview 已准备"),
    finalNoProviderBoundaryReceiptSummary:readySummary("Final No-Provider Boundary Receipt", "Final No-Provider Boundary Receipt 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备"),
    providerPublicReleaseViewModelSummary:{ status:"ready", title:"Provider Public Release Review", userFacingSummary:{ resultLabel:"Provider Public Release Review 已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.consoleName, "global_shopping_public_release_evidence_console_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "Public Release Evidence Console 已准备");
  assert.equal(ready.publicReleaseEvidenceSummary.readyForNoProviderUserAssurancePanel, true);
  assert.equal(ready.publicReleaseEvidenceSections.length, 5);
  assert.equal(ready.bookingUrl, null);
  const needsReview = api.buildGlobalShoppingPublicReleaseEvidenceConsole({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingPublicReleaseEvidenceConsole({
    providerReadOnlyPublicReleaseCenterSummary:readySummary("Provider Read-Only Public Release Center", "Provider Read-Only Public Release Center 已准备"),
    trustClosureExportPreviewSummary:readySummary("Trust Closure Export Preview", "Trust Closure Export Preview 已准备"),
    finalNoProviderBoundaryReceiptSummary:readySummary("Final No-Provider Boundary Receipt", "Final No-Provider Boundary Receipt 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备"),
    providerPublicReleaseViewModelSummary:{ status:"ready", title:"Provider Public Release Review", redacted:true },
    createRelease:true
  });
  assert.equal(blocked.status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingPublicReleaseEvidenceConsoleAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PUBLIC_RELEASE_EVIDENCE_CONSOLE PASS");
}

main();
