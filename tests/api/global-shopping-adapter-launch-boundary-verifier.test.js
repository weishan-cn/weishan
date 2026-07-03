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
  const api = load("apps/desktop/src/renderer/core/globalShoppingAdapterLaunchBoundaryVerifier.js").WeishanGlobalShoppingAdapterLaunchBoundaryVerifier;
  assert.equal(api.GLOBAL_SHOPPING_ADAPTER_LAUNCH_BOUNDARY_VERIFIER_VERSION, "4.1.5");
  const ready = api.buildGlobalShoppingAdapterLaunchBoundaryVerifier({
    offlinePolicyReplayCenterSummary:readySummary("Offline Policy Replay Center", "Offline Policy Replay Center 已准备"),
    adapterBoundaryLockSummary:readySummary("Adapter Boundary Lock", "Adapter 边界锁已准备"),
    adapterBoundaryDiffInspectorSummary:readySummary("Adapter Boundary Diff Inspector", "Adapter Boundary Diff Inspector 已准备"),
    adapterPolicyEngineSummary:readySummary("Adapter Policy Engine", "Adapter 策略引擎已准备"),
    humanActivationFinalDossierSummary:readySummary("Human Activation Final Dossier", "Human Activation Final Dossier 已准备"),
    safetySentinelSummary:{ status:"pass", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Adapter Launch Boundary Verifier");
  assert.equal(api.buildGlobalShoppingAdapterLaunchBoundaryVerifier({ offlinePolicyReplayCenterSummary:readySummary("Offline Policy Replay Center", "ok") }).status, "needs_review");
  console.log("GLOBAL_SHOPPING_ADAPTER_LAUNCH_BOUNDARY_VERIFIER PASS");
}

main();
