const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingReadOnlyPublicBetaShell.js"]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyPublicBetaShell;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_PUBLIC_BETA_SHELL_VERSION, "4.0.2");
  const ready = api.buildGlobalShoppingReadOnlyPublicBetaShell({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    noProviderUserAssurancePanelSummary:readySummary("No-Provider User Assurance Panel", "No-Provider User Assurance Panel 已准备"),
    offlineLaunchReadinessFinalizerSummary:readySummary("Offline Launch Readiness Finalizer", "Offline Launch Readiness Finalizer 已准备"),
    userSafePublicClaimVerifierSummary:readySummary("User-Safe Public Claim Verifier", "User-Safe Public Claim Verifier 已准备"),
    providerLaunchReadinessFinalViewModelSummary:{ status:"ready", title:"Provider Launch Readiness Final Review", redacted:true }
  });
  assert.equal(ready.shellName, "global_shopping_read_only_public_beta_shell_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "Global Shopping Read-Only Public Beta Shell 已准备");
  assert.equal(ready.publicBetaShellSummary.readyForProviderZeroRuntimeLock, true);
  assert.equal(api.buildGlobalShoppingReadOnlyPublicBetaShell({ publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyPublicBetaShell({
    publicReleaseEvidenceConsoleSummary:readySummary("Public Release Evidence Console", "Public Release Evidence Console 已准备"),
    noProviderUserAssurancePanelSummary:readySummary("No-Provider User Assurance Panel", "No-Provider User Assurance Panel 已准备"),
    offlineLaunchReadinessFinalizerSummary:readySummary("Offline Launch Readiness Finalizer", "Offline Launch Readiness Finalizer 已准备"),
    userSafePublicClaimVerifierSummary:readySummary("User-Safe Public Claim Verifier", "User-Safe Public Claim Verifier 已准备"),
    providerLaunchReadinessFinalViewModelSummary:{ status:"ready", title:"Provider Launch Readiness Final Review", redacted:true },
    payment:true
  }).status, "blocked");
  const safeJson = JSON.stringify(api.buildGlobalShoppingReadOnlyPublicBetaShellAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" }));
  assert.equal(safeJson.includes("abc"), false);
  assert.equal(safeJson.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_READ_ONLY_PUBLIC_BETA_SHELL PASS");
}

main();
