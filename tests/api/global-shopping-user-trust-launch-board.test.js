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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingUserTrustLaunchBoard.js"]);
  const api = windowRef.WeishanGlobalShoppingUserTrustLaunchBoard;
  assert.equal(api.GLOBAL_SHOPPING_USER_TRUST_LAUNCH_BOARD_VERSION, "4.0.8");
  const ready = api.buildGlobalShoppingUserTrustLaunchBoard({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    providerZeroRuntimeLockSummary:readySummary("Provider-Zero Runtime Lock", "Provider-Zero Runtime Lock 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    userVisibleSafetyBoundaryExplainerSummary:readySummary("User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备")
  });
  assert.equal(ready.boardName, "global_shopping_user_trust_launch_board_v1");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "User Trust Launch Board 已准备");
  assert.equal(ready.userTrustLaunchBoardSummary.readyForPublicBetaSafetyCopyCenter, true);
  assert.equal(api.buildGlobalShoppingUserTrustLaunchBoard({
    globalShoppingReadOnlyPublicBetaShellSummary:readySummary("Global Shopping Read-Only Public Beta Shell", "Global Shopping Read-Only Public Beta Shell 已准备"),
    providerZeroRuntimeLockSummary:readySummary("Provider-Zero Runtime Lock", "Provider-Zero Runtime Lock 已准备"),
    finalUserTrustSummarySummary:readySummary("Final User Trust Summary", "Final User Trust Summary 已准备"),
    userVisibleSafetyBoundaryExplainerSummary:readySummary("User-Visible Safety Boundary Explainer", "User-Visible Safety Boundary Explainer 已准备"),
    publicSafetyStatementPreviewSummary:readySummary("Public Safety Statement Preview", "Public Safety Statement Preview 已准备"),
    openExternalDocument:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_USER_TRUST_LAUNCH_BOARD PASS");
}

main();
