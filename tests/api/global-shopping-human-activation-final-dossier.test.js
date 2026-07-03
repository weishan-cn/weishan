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
  return window;
}

function readySummary(title, resultLabel) {
  return { status:"ready", title, userFacingSummary:{ title, resultLabel, redacted:true }, rows:[{ rowId:"r1", label:title, value:resultLabel, status:"pass", redacted:true }], redacted:true };
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingHumanActivationFinalDossier.js").WeishanGlobalShoppingHumanActivationFinalDossier;
  assert.equal(api.GLOBAL_SHOPPING_HUMAN_ACTIVATION_FINAL_DOSSIER_VERSION, "4.1.2");
  const ready = api.buildGlobalShoppingHumanActivationFinalDossier({
    providerLaunchAuditSnapshotSummary:readySummary("Provider Launch Audit Snapshot", "Provider Launch Audit Snapshot 已准备"),
    offlinePolicyReplayCenterSummary:readySummary("Offline Policy Replay Center", "Offline Policy Replay Center 已准备"),
    humanReleaseEvidenceTimelineSummary:readySummary("Human Release Evidence Timeline", "人工发布证据时间线已准备"),
    sandboxActivationFinalReviewBoardSummary:readySummary("Sandbox Activation Final Review Board", "Sandbox 激活终审板已准备"),
    sandboxActivationReceiptLedgerSummary:readySummary("Sandbox Activation Receipt Ledger", "Sandbox 激活回执台账已准备"),
    verifyE2eBuildSummary:{ status:"ready", title:"verify/e2e/build", resultLabel:"验证链已准备", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Human Activation Final Dossier");
  assert.equal(api.buildGlobalShoppingHumanActivationFinalDossier({ providerLaunchAuditSnapshotSummary:readySummary("Provider Launch Audit Snapshot", "ok") }).status, "needs_review");
  console.log("GLOBAL_SHOPPING_HUMAN_ACTIVATION_FINAL_DOSSIER PASS");
}

main();
