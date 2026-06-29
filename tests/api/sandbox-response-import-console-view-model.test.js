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
    "apps/desktop/src/renderer/core/realFlightPriceReadOnlyProviderContract.js",
    "apps/desktop/src/renderer/core/realFlightPriceIntegrityGuard.js",
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
    "apps/desktop/src/renderer/core/readOnlyQuoteEvidenceSummaryFormatter.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteDecisionAssistant.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateComparisonExplainer.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteAuditExport.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRunTimeline.js",
    "apps/desktop/src/renderer/core/multiProviderSandboxDryRunOrchestrator.js",
    "apps/desktop/src/renderer/core/sandboxResponseImportConsoleViewModel.js"
  ]);
  const api = windowRef.WeishanSandboxResponseImportConsoleViewModel;
  assert.equal(api.SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL_VERSION, "2.1.98");
  const initial = api.buildSandboxResponseImportConsoleModel();
  assert.equal(initial.status, "idle");
  assert.equal(initial.title, "多 Provider 沙盒报价导入");
  assert.equal(initial.rawInputStored, false);
  assert.equal(initial.actions.canPasteSecretHere, false);
  assert.equal(initial.messages.platformFinal, "平台最终为准。");
  const raw = JSON.stringify([
    { providerId:"flight_provider_trusted_fixture", providerName:"Trusted Flight Fixture", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", route:{ origin:"SHA", destination:"CTU" }, departureDate:"2026-07-15", currency:"CNY", baseFare:860, taxesAndFees:110, providerFees:40, totalPrice:1010, priceUpdatedAt:"2026-01-01T00:00:00.000Z", freshnessMinutes:15, handoffCandidate:{ providerId:"google_flights_search", handoffType:"provider_search" } },
    { providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:975 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } }
  ]);
  const dryRunApi = windowRef.WeishanMultiProviderSandboxDryRunOrchestrator;
  const dryRun = dryRunApi.runMultiProviderSandboxDryRun({ title:"购买7月15日上海到成都最便宜的直达机票", origin:"上海", destination:"成都", departureDate:"2026-07-15", directOnly:true, sortIntent:"低价优先" }, {});
  const preview = api.buildSandboxResponseValidationPreview(raw);
  assert.equal(preview.status, "preview_ready");
  assert.equal(preview.preview.validationStatus, "accepted");
  assert.equal(preview.preview.providerName, "Trusted Flight Fixture");
  assert.equal(preview.preview.responseShape, "weishan_normalized_quote");
  assert.equal(preview.preview.sourceSummary, "来源：Trusted Flight Fixture / weishan_normalized_quote");
  assert.equal(preview.multiQuotePreview.title, "多 Provider 沙盒报价导入");
  assert.equal(preview.multiQuotePreview.sourceBreakdown.providerCount, 2);
  assert.equal(preview.rankingPreview.rankingExplanation, "仅按导入样本中的只读候选证据排序，平台最终为准。");
  assert.equal(preview.sourceBreakdown.providerCount, 2);
  assert.equal(preview.lowPriceClaim, "当前导入样本中的低价候选");
  assert.equal(preview.rawInputStored, false);
  const dryRunPreview = api.buildSandboxResponseImportConsoleModel({ sandboxDryRunSummary: dryRun, runTimelineSummary: dryRun.runTimelineSummary, providerRunMatrix: dryRun.providerRunMatrix, dryRunStatus: dryRun.status, dryRunButton:{ label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false }, dryRunTopCandidates: dryRun.dryRunTopCandidates });
  assert.equal(dryRunPreview.dryRunStatus, "completed");
  assert.equal(dryRunPreview.dryRunButton.label, "运行沙盒只读报价");
  assert.equal(dryRunPreview.dryRunTopCandidates.length, 3);
  assert.equal(dryRunPreview.runTimelineSummary.timelineName, "read_only_quote_run_timeline_v1");
  assert.equal(dryRunPreview.sessionSummary.sessionId, "deterministic-read-only-quote-session-v2.1.98");
  assert.equal(dryRunPreview.auditExportReady, true);
  assert.equal(dryRunPreview.sessionRecoverySummary.title, "Session Recovery");
  assert.equal(dryRunPreview.reportCenterStatus, "ready");
  assert.equal(dryRunPreview.reportCenterSummary.reportCenterName, "read_only_quote_session_report_center_v1");
  assert.equal(dryRunPreview.userFacingEvidenceSummary.title, "候选报价证据摘要");
  assert.equal(dryRunPreview.safetyReportSummary.rawResponseStored, false);
  assert.ok(dryRunPreview.evidenceSummaryWarnings.includes("平台最终为准"));
  assert.equal(dryRunPreview.decisionAssistantSummary.title, "推荐理由");
  assert.equal(dryRunPreview.candidateComparisonSummary.title, "候选对比");
  assert.ok(Array.isArray(dryRunPreview.candidateComparisonTable));
  assert.equal(dryRunPreview.providerConfirmationWarning.providerConfirmationRequiresUserConfirm, true);
  const imported = api.buildSandboxResponseImportResult(raw);
  assert.equal(imported.status, "accepted");
  assert.equal(imported.importResult.status, "accepted");
  assert.equal(imported.importResult.sanitizedQuote.totalPrice, 1010);
  assert.equal(imported.importResult.rawResponseStored, false);
  assert.equal(imported.importResult.rankingPreview.sourceBreakdown.providerCount, 2);
  const invalid = api.buildSandboxResponseValidationPreview("{ nope");
  assert.equal(invalid.status, "failed_safe");
  assert.equal(invalid.preview.validationStatus, "failed_safe");
  const sensitive = api.buildSandboxResponseValidationPreview(JSON.stringify({ token:"abc" }));
  assert.equal(sensitive.status, "blocked");
  assert.equal(sensitive.preview.validationStatus, "blocked");
  const booking = api.buildSandboxResponseValidationPreview(JSON.stringify(Object.assign({ providerId:"trip_com_sandbox_stub", providerName:"Trip.com Sandbox Stub", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", trip:{ from:"SHA", to:"CTU", date:"2026-07-15" }, price:{ currency:"CNY", fare:820, tax:120, serviceFee:35, total:975 }, freshness:{ updatedAt:"2026-01-01T00:00:00.000Z", minutes:10 }, handoffCandidate:{ providerId:"trip_com_search", handoffType:"provider_search" } }, { bookingUrl:"https://example.com/booking" })));
  assert.equal(booking.status, "blocked");
  assert.equal(booking.safety.bookingUrl, null);
  const audit = api.buildSandboxResponseImportConsoleAuditDraft(imported);
  assert.equal(audit.rawInputStored, false);
  assert.equal(audit.rawResponseStored, false);
  assert.equal(audit.dryRunStatus, "not_run");
  assert.equal(audit.bookingUrl, null);
  assert.equal(audit.autoOpen, false);
  assert.equal(audit.sourceBreakdown.providerCount, 2);
  assert.equal(audit.reportCenterStatus, "empty");
  console.log("SANDBOX_RESPONSE_IMPORT_CONSOLE_VIEW_MODEL PASS");
}
main();
