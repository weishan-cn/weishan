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
    "apps/desktop/src/renderer/core/globalShoppingProviderEvidenceComparisonMatrix.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderEvidenceComparisonMatrix;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_EVIDENCE_COMPARISON_MATRIX_VERSION, "4.0.6");

  const ready = api.buildGlobalShoppingProviderEvidenceComparisonMatrix({
    providerEvidenceTrace:{
      evidenceItems:[
        { candidateId:"candidate_a", evidenceType:"official_anchor", traceSummary:"官方参考价证据完整", redacted:true },
        { candidateId:"candidate_a", evidenceType:"provider_candidate", traceSummary:"Provider 候选证据完整", redacted:true },
        { candidateId:"candidate_a", evidenceType:"tax_fee_normalization", traceSummary:"税费归一化证据完整", redacted:true },
        { candidateId:"candidate_a", evidenceType:"source_trust", traceSummary:"来源可信度证据完整", redacted:true },
        { candidateId:"candidate_a", evidenceType:"covered_lowest", traceSummary:"已覆盖来源较低候选", redacted:true },
        { candidateId:"candidate_a", evidenceType:"handoff_preview", traceSummary:"交接演练参数完整", redacted:true }
      ]
    },
    sandboxCandidateComparisonWorkbench:{
      candidateRows:[
        { candidateId:"candidate_a", sourceName:"Official Fixture", sourceType:"official", evidenceCompletenessLabel:"完整", redacted:true }
      ]
    }
  });

  assert.equal(ready.appVersion, "4.0.6");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider 证据对比矩阵");
  assert.equal(ready.matrixColumns.length, 7);
  assert.equal(ready.matrixRows.length, 1);
  assert.equal(ready.matrixRows[0].officialAnchorEvidence, "官方参考价证据完整");
  assert.equal(ready.matrixHealth.hasSafetyDisclosureColumn, true);
  assert.equal(ready.matrixBoundary.canContainRawResponse, false);
  assert.equal(ready.matrixBoundary.canContainRealUrl, false);
  assert.equal(ready.matrixBoundary.canContainApiKey, false);

  const blocked = api.buildGlobalShoppingProviderEvidenceComparisonMatrix({ rawResponseStored:true });
  assert.equal(blocked.status, "blocked");

  console.log("GLOBAL_SHOPPING_PROVIDER_EVIDENCE_COMPARISON_MATRIX PASS");
}

main();
