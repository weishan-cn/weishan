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
  const api = load("apps/desktop/src/renderer/core/globalShoppingFinalOfflineLaunchReviewConsole.js").WeishanGlobalShoppingFinalOfflineLaunchReviewConsole;
  assert.equal(api.GLOBAL_SHOPPING_FINAL_OFFLINE_LAUNCH_REVIEW_CONSOLE_VERSION, "4.1.4");
  const ready = api.buildGlobalShoppingFinalOfflineLaunchReviewConsole({
    providerLaunchAuditSnapshotSummary:readySummary("Provider Launch Audit Snapshot", "Provider Launch Audit Snapshot 已准备"),
    offlinePolicyReplayCenterSummary:readySummary("Offline Policy Replay Center", "Offline Policy Replay Center 已准备"),
    humanActivationFinalDossierSummary:readySummary("Human Activation Final Dossier", "Human Activation Final Dossier 已准备"),
    adapterLaunchBoundaryVerifierSummary:readySummary("Adapter Launch Boundary Verifier", "Adapter Launch Boundary Verifier 已准备"),
    providerFinalLaunchReviewViewModelSummary:{ status:"ready", title:"Provider Final Launch Review", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Final Offline Launch Review Console");
  assert.equal(api.buildGlobalShoppingFinalOfflineLaunchReviewConsole({ providerLaunchAuditSnapshotSummary:readySummary("Provider Launch Audit Snapshot", "ok") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingFinalOfflineLaunchReviewConsole({ network:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_FINAL_OFFLINE_LAUNCH_REVIEW_CONSOLE PASS");
}

main();
