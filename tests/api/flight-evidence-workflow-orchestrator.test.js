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
    "apps/desktop/src/renderer/core/multiProviderSandboxDryRunOrchestrator.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteDecisionAssistant.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteEvidenceSummaryFormatter.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateComparisonExplainer.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js",
    "apps/desktop/src/renderer/core/readOnlyCandidateConfidenceLabeler.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSafeNextStepCoach.js",
    "apps/desktop/src/renderer/core/flightIntentNormalizer.js",
    "apps/desktop/src/renderer/core/flightEvidenceWorkflowStatusPresenter.js",
    "apps/desktop/src/renderer/core/flightEvidenceWorkflowOrchestrator.js"
  ]);
  const api = windowRef.WeishanFlightEvidenceWorkflowOrchestrator;
  assert.equal(api.FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_VERSION, "2.1.60");
  const ready = api.runFlightEvidenceWorkflow({ rawText:"帮我查7月15日上海到成都最便宜的直达机票" });
  assert.equal(ready.orchestratorName, "flight_evidence_workflow_orchestrator_v1");
  assert.equal(ready.workflowId, "deterministic-flight-evidence-workflow-v2.1.60");
  assert.equal(ready.status, "ready");
  assert.equal(ready.flightIntentSummary.status, "ready");
  assert.equal(ready.safety.dryRunRan, true);
  assert.equal(ready.safety.networkAllowed, false);
  assert.equal(ready.topCandidates.length, 3);
  assert.equal(ready.selectedCandidate.rank, 1);
  assert.equal(ready.selectedCandidate.recommendationType, "candidate_evidence_only");
  assert.ok(ready.workflowSteps.map((step) => step.label).includes("生成 Top 3 候选"));
  assert.ok(ready.decisionAssistant.reasoning.primaryReason.includes("候选"));
  assert.equal(ready.bookingUrl, null);
  const summary = api.buildFlightEvidenceWorkflowSummary(ready);
  assert.equal(summary.title, "机票请求工作流");
  assert.equal(summary.routeSummary, "上海 到 成都");
  const incomplete = api.runFlightEvidenceWorkflow({ rawText:"帮我查7月15日机票" });
  assert.equal(incomplete.status, "needs_clarification");
  assert.equal(incomplete.safety.dryRunRan, false);
  assert.equal(incomplete.topCandidates.length, 0);
  assert.ok(incomplete.clarificationQuestions.join(" ").includes("出发地"));
  const blocked = api.runFlightEvidenceWorkflow({ rawText:"帮我买枪" });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.safety.dryRunRan, false);
  assert.equal(blocked.topCandidates.length, 0);
  assert.equal(/https?:\/\/|token/i.test(JSON.stringify(ready)), false);
  assert.equal(ready.bookingUrl, null);
  assert.equal(ready.paymentUrl, null);
  assert.equal(ready.orderUrl, null);
  console.log("FLIGHT_EVIDENCE_WORKFLOW_ORCHESTRATOR_CORE PASS");
}
main();
