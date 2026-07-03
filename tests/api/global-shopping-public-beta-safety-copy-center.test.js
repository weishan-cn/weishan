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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingPublicBetaSafetyCopyCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingPublicBetaSafetyCopyCenter;
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_SAFETY_COPY_CENTER_VERSION, "4.0.5");
  const ready = api.buildGlobalShoppingPublicBetaSafetyCopyCenter({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    providerZeroRuntimeLockSummary:readySummary("Provider-Zero Runtime Lock", "Provider-Zero Runtime Lock 已准备"),
    userTrustLaunchBoardSummary:readySummary("User Trust Launch Board", "User Trust Launch Board 已准备"),
    userSafePublicClaimVerifierSummary:readySummary("User-Safe Public Claim Verifier", "User-Safe Public Claim Verifier 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备")
  });
  assert.equal(ready.centerName, "global_shopping_public_beta_safety_copy_center_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "Public Beta Safety Copy Center 已准备");
  assert.equal(api.buildGlobalShoppingPublicBetaSafetyCopyCenter({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    providerZeroRuntimeLockSummary:readySummary("Provider-Zero Runtime Lock", "Provider-Zero Runtime Lock 已准备"),
    userTrustLaunchBoardSummary:readySummary("User Trust Launch Board", "User Trust Launch Board 已准备"),
    userSafePublicClaimVerifierSummary:readySummary("User-Safe Public Claim Verifier", "User-Safe Public Claim Verifier 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备"),
    copyCandidates:["全网最低"]
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_SAFETY_COPY_CENTER PASS");
}

main();
