const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionManager.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteAuditExport.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteEvidenceSummaryFormatter.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteDecisionAssistant.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateComparisonExplainer.js",
    "apps/desktop/src/renderer/core/flightWorkflowAuditReviewCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowSafeSessionExportPreview.js",
    "apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js"
  ]);
  const manager = windowRef.WeishanReadOnlyQuoteSessionManager;
  const api = windowRef.WeishanReadOnlyQuoteSessionReportCenter;
  assert.equal(api.READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION, "2.1.73");
  const empty = api.buildReadOnlyQuoteSessionReportCenter({});
  assert.equal(empty.status, "empty");
  const session = manager.updateReadOnlyQuoteSession(manager.createReadOnlyQuoteSession({ route:"上海 → 成都", departureDate:"2026-07-15" }), { type:"DRY_RUN_COMPLETED", result:{ runId:"r1", dryRunTopCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:980, bookingUrl:"https://blocked.example" }], selectedCandidate:{ quoteId:"q1", providerName:"A", totalPrice:980, token:"abc" } } });
  const summary = manager.buildReadOnlyQuoteSessionSummary(session);
  const ready = api.buildReadOnlyQuoteSessionReportCenter({ workflowStateSummary:{ status:"evidence_ready" }, clarificationSummary:{ status:"complete" }, workflowStepList:[{ label:"生成候选证据", status:"completed" }], missingFields:[], clarificationQuestions:[], workflowUserMessage:"候选证据已生成，平台最终为准。", sessionSummary:summary, topCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:980 }], selectedCandidate:{ quoteId:"q1", providerName:"A", totalPrice:980 }, runHistorySummary:{ totalRunCount:1 }, quoteDeltaSummary:{ status:"not_enough_history" }, replaySummary:{ status:"unavailable" } });
  assert.equal(ready.appVersion, "2.1.73");
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "候选报价证据摘要");
  assert.ok(ready.userFacingSummary.labels.includes("只读候选价"));
  assert.ok(ready.userFacingSummary.labels.includes("平台最终为准"));
  assert.ok(ready.userFacingSummary.labels.includes("未锁价"));
  assert.ok(ready.userFacingSummary.labels.includes("不代表可出票"));
  assert.equal(ready.userFacingSummary.canClaimLowestAcrossWeb, false);
  assert.equal(ready.userFacingSummary.canClaimFinalBookablePrice, false);
  assert.equal(ready.userFacingSummary.canReplaceMainResultCard, false);
  assert.equal(ready.safetyReport.rawResponseStored, false);
  assert.equal(ready.userFacingSummary.workflowStateSummary.status, "evidence_ready");
  assert.equal(ready.safetyReport.clarificationSummary.status, "complete");
  assert.equal(ready.safetyReport.workflowStepList[0].label, "生成候选证据");
  assert.equal(ready.safetyReport.workflowUserMessage, "候选证据已生成，平台最终为准。");
  assert.equal(ready.safetyReport.secretStored, false);
  assert.equal(ready.safetyReport.bookingUrl, null);
  assert.equal(ready.safetyReport.payment, false);
  assert.equal(ready.safetyReport.order, false);
  assert.equal(ready.safetyReport.identityUpload, false);
  assert.equal(ready.safetyReport.auditReviewSummary.userFacingSummary.title, "本次机票工作流审计");
  assert.equal(ready.safetyReport.safeSessionExportPreview.canWriteFile, false);
  assert.ok(ready.safetyReport.riskBadgeSummary.line.includes("只读安全"));
  assert.ok(ready.safetyReport.riskBadgeSummary.line.includes("交易动作已阻断"));
  assert.equal(ready.actions.providerConfirmationRequiresUserConfirm, true);
  assert.equal(ready.actions.canPayHere, false);
  assert.equal(ready.actions.canOrderHere, false);
  assert.equal(ready.actions.canUploadIdentityHere, false);
  const reportWithLedger = api.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:summary, eventLedgerSummary:{ lastActionId:"select_candidate", lastActionStatus:"executed_local", lastActionMessage:"动作已执行" } });
  assert.equal(reportWithLedger.userFacingSummary.lastActionId, "select_candidate");
  assert.equal(reportWithLedger.safetyReport.lastActionMessage, "动作已执行");
  assert.ok(ready.userFacingSummary.decisionAssistantSummary);
  assert.ok(ready.userFacingSummary.candidateComparisonSummary);
  assert.ok(ready.safetyReport.decisionAssistantSummary);
  assert.ok(ready.safetyReport.candidateComparisonSummary);
  assert.ok(Array.isArray(ready.safetyReport.decisionSafetyWarnings));
  const userFacing = JSON.stringify(ready.userFacingSummary);
  assert.equal(/rawResponse|token|key|secret|bookingUrl|paymentUrl|orderUrl/i.test(userFacing), false);
  assert.equal(/全网最低|已锁价|可以出票|可直接出票|真实最终价/.test(userFacing), false);
  const malformed = api.buildReadOnlyQuoteSessionReportCenter({ session:null });
  assert.equal(malformed.status, "failed_safe");
  const audit = api.buildReadOnlyQuoteSessionReportCenterAuditDraft({ sessionSummary:summary });
  assert.equal(audit.providerConfirmationRequiresUserConfirm, true);
  console.log("READ_ONLY_QUOTE_SESSION_REPORT_CENTER PASS");
}
main();
