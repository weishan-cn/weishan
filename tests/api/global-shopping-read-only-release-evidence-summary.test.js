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
  const api = load("apps/desktop/src/renderer/core/globalShoppingReadOnlyReleaseEvidenceSummary.js").WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_RELEASE_EVIDENCE_SUMMARY_VERSION, "4.1.9");
  const ready = api.buildGlobalShoppingReadOnlyReleaseEvidenceSummary({
    finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "Final Offline Launch Review Console 已准备"),
    providerActivationBlockerSentinelSummary:readySummary("Provider Activation Blocker Sentinel", "Provider Activation Blocker Sentinel 已准备"),
    humanActivationFinalDossierSummary:readySummary("Human Activation Final Dossier", "Human Activation Final Dossier 已准备"),
    humanReleaseEvidenceTimelineSummary:readySummary("Human Release Evidence Timeline", "Human Release Evidence Timeline 已准备"),
    verifyE2eBuildSummary:{ status:"ready", title:"verify/e2e/build summary", userFacingSummary:{ resultLabel:"verify/e2e/build 已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Read-Only Release Evidence Summary");
  assert.equal(api.buildGlobalShoppingReadOnlyReleaseEvidenceSummary({ finalOfflineLaunchReviewConsoleSummary:readySummary("Final Offline Launch Review Console", "ok") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyReleaseEvidenceSummary({ createRelease:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_READ_ONLY_RELEASE_EVIDENCE_SUMMARY PASS");
}

main();
