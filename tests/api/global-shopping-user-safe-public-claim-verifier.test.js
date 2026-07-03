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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingUserSafePublicClaimVerifier.js"]);
  const api = windowRef.WeishanGlobalShoppingUserSafePublicClaimVerifier;
  assert.equal(api.GLOBAL_SHOPPING_USER_SAFE_PUBLIC_CLAIM_VERIFIER_VERSION, "4.0.7");
  const ready = api.buildGlobalShoppingUserSafePublicClaimVerifier({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    noProviderUserAssurancePanelSummary:readySummary("No-Provider User Assurance Panel", "No-Provider User Assurance Panel 已准备"),
    offlineLaunchReadinessFinalizerSummary:readySummary("Offline Launch Readiness Finalizer", "Offline Launch Readiness Finalizer 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备"),
    userVisibleSafetyBoundaryExplainerSummary:readySummary("User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 已准备")
  });
  assert.equal(ready.verifierName, "global_shopping_user_safe_public_claim_verifier_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "User-Safe Public Claim Verifier 已准备");
  assert.equal(ready.claimRules.length > 0, true);
  assert.equal(ready.rows.some((row) => row.value === "Claim Verifier 不承诺最低价、最终价或官方背书"), true);
  const needsReview = api.buildGlobalShoppingUserSafePublicClaimVerifier({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备")
  });
  assert.equal(needsReview.status, "needs_review");
  const blocked = api.buildGlobalShoppingUserSafePublicClaimVerifier({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    noProviderUserAssurancePanelSummary:readySummary("No-Provider User Assurance Panel", "No-Provider User Assurance Panel 已准备"),
    offlineLaunchReadinessFinalizerSummary:readySummary("Offline Launch Readiness Finalizer", "Offline Launch Readiness Finalizer 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备"),
    userVisibleSafetyBoundaryExplainerSummary:readySummary("User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 已准备"),
    claimLowestPrice:true
  });
  assert.equal(blocked.status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingUserSafePublicClaimVerifierAuditDraft({ secret:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_USER_SAFE_PUBLIC_CLAIM_VERIFIER PASS");
}

main();
