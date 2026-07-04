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

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingSandboxDecisionReviewViewModel.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxDecisionReviewViewModel;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_DECISION_REVIEW_VIEW_MODEL_VERSION, "4.2.0");

  const ready = api.buildGlobalShoppingSandboxDecisionReviewViewModel({
    sandboxCandidateComparisonWorkbench:{
      status:"ready",
      userFacingSummary:{ resultLabel:"候选对比已准备", redacted:true },
      recommendationSummary:{ reason:"Official Fixture 在当前 sandbox 证据下更适合先复核。", redacted:true },
      candidateRows:[{ candidateId:"candidate_a", sourceName:"Official Fixture", confidenceLabel:"high", caveat:"该候选只表示当前 sandbox 证据下优先复核顺序，不代表最低价保证或交易能力。", redacted:true }]
    },
    providerEvidenceComparisonMatrix:{
      status:"ready",
      userFacingSummary:{ resultLabel:"证据矩阵已准备", redacted:true },
      matrixRows:[{ candidateId:"candidate_a", sourceName:"Official Fixture", completenessLabel:"完整", caveat:"当前矩阵只展示脱敏 sandbox 证据摘要。", redacted:true }]
    },
    readOnlyHandoffReadinessDrill:{
      status:"ready",
      userFacingSummary:{ resultLabel:"交接演练已准备", redacted:true },
      rows:[{ rowId:"allowed_parameters", label:"允许参数", value:"origin, destination, date", status:"pass", redacted:true }]
    }
  });

  assert.equal(ready.appVersion, "4.2.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Sandbox 候选决策复核");
  assert.equal(ready.cards.length, 4);
  assert.equal(ready.comparisonRows.length, 1);
  assert.equal(ready.evidenceMatrixRows.length, 1);
  assert.equal(ready.handoffDrillRows.length, 1);
  assert.equal(ready.disclosureRows[3].value, "决策复核不代表下单能力");
  assert.equal(ready.safety.bookingUrl, null);
  assert.equal(ready.safety.paymentUrl, null);
  assert.equal(ready.safety.orderUrl, null);

  const blocked = api.buildGlobalShoppingSandboxDecisionReviewViewModel({ networkEnabled:true });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_SANDBOX_DECISION_REVIEW_VIEW_MODEL PASS");
}

main();
