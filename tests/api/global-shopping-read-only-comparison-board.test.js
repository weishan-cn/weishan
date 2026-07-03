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
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:title, label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingCategoryResultSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCandidateEvidenceUnifier.js",
    "apps/desktop/src/renderer/core/globalShoppingFeeNormalizationView.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialAnchorComparisonView.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyComparisonBoard.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyComparisonBoard;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_COMPARISON_BOARD_VERSION, "4.1.4");
  const ready = api.buildGlobalShoppingReadOnlyComparisonBoard({
    boardMode:"read_only_comparison_only",
    globalShoppingReadOnlyCandidateEvidenceUnifierSummary:readySummary("候选价证据", "候选价证据已准备"),
    globalShoppingFeeNormalizationViewSummary:readySummary("费用归一化", "费用归一化已准备"),
    globalShoppingOfficialAnchorComparisonViewSummary:readySummary("官方价锚点", "官方价锚点已准备"),
    categoryResultSimulatorSummary:readySummary("Category Result Simulator", "Category Result Simulator 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.appVersion, "4.1.4");
  assert.equal(ready.manualReviewRequired, true);
  assert.equal(ready.providerZeroLocked, true);
  assert.equal(ready.externalUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.buyButtonEnabled, false);
  assert.equal(api.buildGlobalShoppingReadOnlyComparisonBoard({
    globalShoppingReadOnlyCandidateEvidenceUnifierSummary:readySummary("候选价证据", "候选价证据已准备")
  }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyComparisonBoard({
    globalShoppingReadOnlyCandidateEvidenceUnifierSummary:readySummary("候选价证据", "候选价证据已准备"),
    globalShoppingFeeNormalizationViewSummary:readySummary("费用归一化", "费用归一化已准备"),
    globalShoppingOfficialAnchorComparisonViewSummary:readySummary("官方价锚点", "官方价锚点已准备"),
    categoryResultSimulatorSummary:readySummary("Category Result Simulator", "Category Result Simulator 已准备"),
    providerUrl:"https://blocked.example"
  }).status, "blocked");
  console.log("GLOBAL_SHOPPING_READ_ONLY_COMPARISON_BOARD PASS");
}

main();
