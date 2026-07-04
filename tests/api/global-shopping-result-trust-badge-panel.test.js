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
  return window.WeishanGlobalShoppingResultTrustBadgePanel;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingResultTrustBadgePanel.js");
  assert.equal(api.GLOBAL_SHOPPING_RESULT_TRUST_BADGE_PANEL_VERSION, "4.2.4");
  const ready = api.buildGlobalShoppingResultTrustBadgePanel({
    panelMode:"result_trust_badge_only",
    sourceAvailable:true,
    officialAnchorCompared:true,
    feeNormalized:true,
    providerZero:true,
    readOnly:true,
    manualReviewRequired:true
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.2.4");
  assert.equal(ready.providerZero, true);
  assert.equal(ready.readOnly, true);
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingResultTrustBadgePanel({
    sourceAvailable:true,
    officialAnchorCompared:false,
    feeNormalized:true,
    providerZero:true,
    readOnly:true,
    manualReviewRequired:true
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingResultTrustBadgePanel({
    sourceAvailable:true,
    officialAnchorCompared:true,
    feeNormalized:true,
    providerZero:true,
    readOnly:true,
    manualReviewRequired:true,
    providerUrl:"https://blocked.example"
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_RESULT_TRUST_BADGE_PANEL PASS");
}

main();
