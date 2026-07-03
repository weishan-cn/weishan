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
  const api = load("apps/desktop/src/renderer/core/globalShoppingProviderFinalLaunchReviewViewModel.js").WeishanGlobalShoppingProviderFinalLaunchReviewViewModel;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_FINAL_LAUNCH_REVIEW_VIEW_MODEL_VERSION, "4.0.8");
  const ready = api.buildGlobalShoppingProviderFinalLaunchReviewViewModel({
    providerLaunchAuditSnapshotSummary:readySummary("Provider Launch Audit Snapshot", "Provider Launch Audit Snapshot 已准备"),
    offlinePolicyReplayCenterSummary:readySummary("Offline Policy Replay Center", "Offline Policy Replay Center 已准备"),
    humanActivationFinalDossierSummary:readySummary("Human Activation Final Dossier", "Human Activation Final Dossier 已准备"),
    adapterLaunchBoundaryVerifierSummary:readySummary("Adapter Launch Boundary Verifier", "Adapter Launch Boundary Verifier 已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "Provider Final Launch Review");
  assert.equal(ready.safeToProceedWithHumanFinalLaunchReview, true);
  assert.equal(api.buildGlobalShoppingProviderFinalLaunchReviewViewModel({ providerLaunchAuditSnapshotSummary:readySummary("Provider Launch Audit Snapshot", "ok") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderFinalLaunchReviewViewModel({ providerLaunchAuditSnapshotSummary:{ status:"blocked", userFacingSummary:{ resultLabel:"已阻断", redacted:true }, rows:[{ rowId:"r1", label:"Provider Launch Audit Snapshot", value:"已阻断", status:"blocked", redacted:true }], redacted:true } }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PROVIDER_FINAL_LAUNCH_REVIEW_VIEW_MODEL PASS");
}

main();
