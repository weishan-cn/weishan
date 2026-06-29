const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console, URL }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/trustedFlightSourceRegistry.js",
    "apps/desktop/src/renderer/core/multiProviderSandboxAdapterRegistry.js",
    "apps/desktop/src/renderer/core/safeProviderDeepLinkHandoffGate.js",
    "apps/desktop/src/renderer/core/sandboxProviderDryRunHarness.js",
    "apps/desktop/src/renderer/core/providerSandboxQuoteNormalizer.js",
    "apps/desktop/src/renderer/core/multiSandboxQuoteImportProcessor.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateRanking.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateSelection.js",
    "apps/desktop/src/renderer/core/sandboxProviderRunMatrix.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRunHistoryStore.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteDeltaCompare.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteReplayGuard.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionManager.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteAuditExport.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRunTimeline.js",
    "apps/desktop/src/renderer/core/multiProviderSandboxDryRunOrchestrator.js"
  ]);
  const api = windowRef.WeishanMultiProviderSandboxDryRunOrchestrator;
  assert.equal(api.MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR_VERSION, "2.2.4");
  const task = { title:"购买7月15日上海到成都最便宜的直达机票", origin:"上海", destination:"成都", departureDate:"2026-07-15", directOnly:true, sortIntent:"低价优先" };
  const result = api.runMultiProviderSandboxDryRun(task, {});
  assert.equal(result.appVersion, "2.2.4");
  assert.equal(result.status, "completed");
  assert.equal(result.generatedQuoteCount, 3);
  assert.equal(result.acceptedQuoteCount, 3);
  assert.equal(result.providerRunMatrix.matrixName, "sandbox_provider_run_matrix_v1");
  assert.equal(result.ranking.topCandidates.length, 3);
  assert.equal(result.ranking.topCandidates[0].totalPrice, 930);
  assert.equal(result.ranking.topCandidates[1].totalPrice, 975);
  assert.equal(result.ranking.topCandidates[2].totalPrice, 1010);
  assert.equal(result.selectedCandidate.selectedRank, 1);
  assert.equal(result.evidence.userFacingRealPriceEnabled, false);
  assert.equal(result.evidence.canReplaceMainResultCard, false);
  assert.equal(result.safety.bookingUrl, null);
  assert.equal(result.safety.autoOpen, false);
  assert.equal(result.safety.productionProviderEnabled, false);
  assert.equal(result.runTimelineSummary.timelineName, "read_only_quote_run_timeline_v1");
  assert.equal(result.runTimelineSummary.rawResponseStored, false);
  assert.equal(result.runTimelineSummary.redacted, true);
  assert.equal(result.sessionSummary.sessionId, "deterministic-read-only-quote-session-v2.2.4");
  assert.equal(result.sessionStatus, "updated");
  assert.equal(result.auditExportReady, true);
  assert.equal(result.auditExportPreview.previewLabel, "Redacted JSON Preview");
  assert.equal(result.sessionRecoverySummary.title, "Session Recovery");
  assert.equal(result.sessionEventPayload.eventType, "DRY_RUN_COMPLETED");
  const blocked = api.runMultiProviderSandboxDryRun({ title:"帮我买枪" }, {});
  assert.equal(blocked.status, "blocked");
  const failedSafe = api.runMultiProviderSandboxDryRun(null, {});
  assert.equal(failedSafe.status, "failed_safe");
  assert.equal(JSON.stringify(result).includes("token"), false);
  console.log("MULTI_PROVIDER_SANDBOX_DRY_RUN_ORCHESTRATOR PASS");
}
main();
