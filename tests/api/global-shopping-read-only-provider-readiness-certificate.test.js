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
  const api = load("apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderReadinessCertificate.js").WeishanGlobalShoppingReadOnlyProviderReadinessCertificate;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_PROVIDER_READINESS_CERTIFICATE_VERSION, "4.1.0");
  const ready = api.buildGlobalShoppingReadOnlyProviderReadinessCertificate({
    providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "Provider Final Safety Seal 已准备"),
    offlineActivationWarRoomSummary:readySummary("Offline Activation War Room", "Offline Activation War Room 已准备"),
    readOnlyReleaseEvidenceSummary:readySummary("Read-Only Release Evidence Summary", "Read-Only Release Evidence Summary 已准备"),
    humanActivationFinalDossierSummary:readySummary("Human Activation Final Dossier", "Human Activation Final Dossier 已准备"),
    verifyE2eBuildSummary:{ status:"ready", title:"Verify / E2E / Build", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Read-Only Provider Readiness Certificate");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderReadinessCertificate({ providerFinalSafetySealSummary:readySummary("Provider Final Safety Seal", "ok") }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingReadOnlyProviderReadinessCertificate({ writeFile:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_READ_ONLY_PROVIDER_READINESS_CERTIFICATE PASS");
}

main();
