const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window.WeishanGlobalShoppingPublicBetaAcceptanceBoard;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingPublicBetaAcceptanceBoard.js");
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_BOARD_VERSION, "4.0.7");
  const ready = api.buildGlobalShoppingPublicBetaAcceptanceBoard({
    providerZeroLocked:true,
    candidateEvidenceReady:true,
    feeNormalizationReady:true,
    officialAnchorReady:true,
    safetyCopyClean:true,
    categoryShellReady:true,
    finalAuditReady:true,
    noPayment:true,
    noOrder:true,
    noTicketing:true,
    noExternalOpen:true,
    manualReviewRequired:true
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(api.buildGlobalShoppingPublicBetaAcceptanceBoard({
    providerZeroLocked:true
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingPublicBetaAcceptanceBoard({
    providerZeroLocked:true,
    candidateEvidenceReady:true,
    feeNormalizationReady:true,
    officialAnchorReady:true,
    safetyCopyClean:true,
    categoryShellReady:true,
    finalAuditReady:true,
    noPayment:true,
    noOrder:true,
    noTicketing:true,
    noExternalOpen:true,
    manualReviewRequired:true,
    push:true
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_ACCEPTANCE_BOARD PASS");
}

main();
