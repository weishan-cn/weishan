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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyHandoffReadinessDrill.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingReadOnlyHandoffReadinessDrill;
  assert.equal(api.GLOBAL_SHOPPING_READ_ONLY_HANDOFF_READINESS_DRILL_VERSION, "3.8.0");

  const ready = api.buildGlobalShoppingReadOnlyHandoffReadinessDrill({
    sandboxCandidateComparisonWorkbench:{ recommendationSummary:{ recommendedCandidateId:"candidate_a" }, redacted:true },
    providerEvidenceComparisonMatrix:{ matrixRows:[{ rowId:"candidate_a", redacted:true }] },
    parameterSource:{
      origin:"SHA",
      destination:"CTU",
      date:"2026-07-15",
      passengerCount:1,
      cabinClass:"economy",
      currency:"CNY",
      locale:"zh-CN",
      region:"CN"
    }
  });

  assert.equal(ready.appVersion, "3.8.0");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "只读跳转交接演练");
  assert.equal(ready.parameterPreview.readinessLabel, "ready");
  assert.equal(ready.parameterPreview.allowedParameters.includes("origin"), true);
  assert.equal(ready.parameterPreview.blockedParameters.length, 0);
  assert.equal(ready.handoffHealth.hasRecommendedCandidate, true);
  assert.equal(ready.handoffBoundary.canGenerateRealUrl, false);
  assert.equal(ready.handoffBoundary.canOpenExternalNow, false);
  assert.equal(ready.handoffBoundary.canCarryPaymentCredential, false);

  const blocked = api.buildGlobalShoppingReadOnlyHandoffReadinessDrill({
    parameterSource:{ origin:"SHA", destination:"CTU", date:"2026-07-15", realName:"redacted user" }
  });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_READ_ONLY_HANDOFF_READINESS_DRILL PASS");
}

main();
