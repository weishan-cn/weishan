const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingProviderEvidenceTrace.js"]);
  const api = windowRef.WeishanGlobalShoppingProviderEvidenceTrace;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_EVIDENCE_TRACE_VERSION, "4.1.2");
  const ready = api.buildGlobalShoppingProviderEvidenceTrace({
    sandboxSessionReplayCenter:{ replaySummary:{ hasHandoffPreview:true }, replayBoundary:{ replayMode:"summary_only" }, redacted:true },
    firstSandboxProviderConnector:{ status:"ready", redacted:true },
    providerCoverageDashboard:{ status:"ready", redacted:true },
    readOnlySourceTrustScore:{ status:"ready", trustScores:[{ trustLabel:"high" }], redacted:true },
    dryRunProviderResponseNormalizer:{ status:"ready", redacted:true },
    pricePipelineOrchestrator:{ status:"ready", officialPriceAnchorSummary:{ status:"anchored" }, coveredLowestCandidateBoardSummary:{ status:"ready" }, redacted:true },
    sandboxPriceCandidateResultBoard:{ status:"ready", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.evidenceItems.length >= 6, true);
  assert.equal(api.buildGlobalShoppingProviderEvidenceTrace({ candidateEvidenceItems:[] }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderEvidenceTrace({ candidateEvidenceItems:[{ evidenceType:"provider_candidate", candidateId:"c", sourceId:"s", sourceName:"x", trustLabel:"medium", evidenceStatus:"pass", traceSummary:"ok", caveat:"x" }] }).status, "needs_review");
  assert.equal(api.buildGlobalShoppingProviderEvidenceTrace({ rawRequestIncluded:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderEvidenceTrace({ rawResponseIncluded:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderEvidenceTrace({ realUrlIncluded:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderEvidenceTrace({ apiKeyIncluded:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderEvidenceTrace({ userIdentityIncluded:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderEvidenceTrace({ paymentDataIncluded:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingProviderEvidenceTrace({ persistTrace:true }).status, "blocked");
  assert.equal(/token|secret|apiKey/i.test(JSON.stringify(ready)), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_EVIDENCE_TRACE PASS");
}
main();