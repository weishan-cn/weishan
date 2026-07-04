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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingNoProviderUserAssurancePanel.js"]);
  const api = windowRef.WeishanGlobalShoppingNoProviderUserAssurancePanel;
  assert.equal(api.GLOBAL_SHOPPING_NO_PROVIDER_USER_ASSURANCE_PANEL_VERSION, "4.2.5");
  const ready = api.buildGlobalShoppingNoProviderUserAssurancePanel({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    finalNoProviderBoundaryReceiptSummary:readySummary("Final No-Provider Boundary Receipt", "Final No-Provider Boundary Receipt 已准备"),
    noProviderExecutionFinalGuardSummary:readySummary("No-Provider-Execution Final Guard", "No-Provider-Execution Final Guard 已准备"),
    userVisibleSafetyBoundaryExplainerSummary:readySummary("User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备")
  });
  assert.equal(ready.panelName, "global_shopping_no_provider_user_assurance_panel_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "No-Provider User Assurance Panel 已准备");
  assert.equal(ready.noProviderUserAssuranceSummary.readyForOfflineLaunchReadinessFinalizer, true);
  assert.equal(ready.noProviderUserAssuranceSections.length, 5);
  const needsReview = api.buildGlobalShoppingNoProviderUserAssurancePanel({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingNoProviderUserAssurancePanel({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    finalNoProviderBoundaryReceiptSummary:readySummary("Final No-Provider Boundary Receipt", "Final No-Provider Boundary Receipt 已准备"),
    noProviderExecutionFinalGuardSummary:readySummary("No-Provider-Execution Final Guard", "No-Provider-Execution Final Guard 已准备"),
    userVisibleSafetyBoundaryExplainerSummary:readySummary("User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    openExternal:true
  });
  assert.equal(blocked.status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingNoProviderUserAssurancePanelAuditDraft({ secret:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_NO_PROVIDER_USER_ASSURANCE_PANEL PASS");
}

main();
