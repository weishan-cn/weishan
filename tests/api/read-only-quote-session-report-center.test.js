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
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotOpsSummary.js",
    "apps/desktop/src/renderer/core/flightWorkflowNextCohortDecisionBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcCandidateReviewConsole.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcEvidenceReviewChecklist.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcReviewViewModel.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcRegressionAuditPack.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyReleaseRiskLedger.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcRegressionViewModel.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcUserFacingCopyFinalization.js",
    "apps/desktop/src/renderer/core/flightWorkflowSafetyDisclosureReviewBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowRcCopyReviewViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProductGoalCharter.js",
    "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformBoundary.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalDeepLinkSafetyGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSearchParameterPrefillGate.js",
    "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformHandoffPreview.js",
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js",
    "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js",
    "apps/desktop/src/renderer/core/globalShoppingCoveredLowestCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProductGoalViewModel.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyUserConsentFlow.js",
    "apps/desktop/src/renderer/core/flightWorkflowPublicPilotOnboardingGuard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotOnboardingViewModel.js"
  ]);
  const manager = windowRef.WeishanReadOnlyQuoteSessionManager;
  const api = windowRef.WeishanReadOnlyQuoteSessionReportCenter;
  assert.equal(api.READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION, "2.1.91");
  const empty = api.buildReadOnlyQuoteSessionReportCenter({});
  assert.equal(empty.status, "empty");
  const session = manager.updateReadOnlyQuoteSession(manager.createReadOnlyQuoteSession({ route:"上海 → 成都", departureDate:"2026-07-15" }), { type:"DRY_RUN_COMPLETED", result:{ runId:"r1", dryRunTopCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:980, bookingUrl:"https://blocked.example" }], selectedCandidate:{ quoteId:"q1", providerName:"A", totalPrice:980, token:"abc" } } });
  const summary = manager.buildReadOnlyQuoteSessionSummary(session);
  const ready = api.buildReadOnlyQuoteSessionReportCenter({ workflowStateSummary:{ status:"evidence_ready" }, clarificationSummary:{ status:"complete" }, workflowStepList:[{ label:"生成候选证据", status:"completed" }], missingFields:[], clarificationQuestions:[], workflowUserMessage:"候选证据已生成，平台最终为准。", sessionSummary:summary, topCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:980 }], selectedCandidate:{ quoteId:"q1", providerName:"A", totalPrice:980 }, runHistorySummary:{ totalRunCount:1 }, quoteDeltaSummary:{ status:"not_enough_history" }, replaySummary:{ status:"unavailable" } });
  assert.equal(ready.appVersion, "2.1.91");
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
  assert.equal(ready.safetyReport.readOnlyConsentSummary, null);
  const rcReady = api.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:summary, rcCandidateReviewSummary:{ status:"ready_for_review", reviewDecision:{ label:"可以开始 RC 复核" }, userFacingSummary:{ resultLabel:"可以开始 RC 复核", redacted:true }, safeToStartRcReview:true, redacted:true }, rcEvidenceReviewSummary:{ status:"complete", userFacingSummary:{ resultLabel:"证据完整", redacted:true }, redacted:true }, rcReviewViewModelSummary:{ status:"ready_for_review", title:"只读 RC 候选复核", caveat:"该页面只用于只读 RC 候选复核，不保存真实身份、不发送真实邀请、不提供交易能力。", redacted:true }, rcReviewStatus:"ready_for_review", rcEvidenceStatus:"complete", safeToStartRcReview:true });
  assert.equal(rcReady.safetyReport.rcReviewStatus, "ready_for_review");
  assert.equal(rcReady.safetyReport.rcEvidenceStatus, "complete");
  assert.equal(rcReady.userFacingSummary.safeToStartRcReview, true);
  const rcRegressionReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    rcRegressionAuditSummary:{ status:"passed", userFacingSummary:{ resultLabel:"RC 回归审计通过", redacted:true }, redacted:true },
    releaseRiskLedgerSummary:{ status:"clear", userFacingSummary:{ resultLabel:"暂无阻断风险", redacted:true }, riskSummary:{ safeToContinueReleaseCandidate:true }, redacted:true },
    rcRegressionViewModelSummary:{ status:"clear", title:"只读 RC 回归审计", caveat:"该页面只用于只读 RC 回归审计，不保存真实身份、不发送真实邀请、不提供交易能力。", redacted:true },
    rcRegressionStatus:"passed",
    releaseRiskStatus:"clear",
    safeToContinueReleaseCandidate:true
  });
  assert.equal(rcRegressionReady.safetyReport.rcRegressionStatus, "passed");
  assert.equal(rcRegressionReady.safetyReport.releaseRiskStatus, "clear");
  assert.equal(rcRegressionReady.safetyReport.rcRegressionViewModelSummary.title, "只读 RC 回归审计");
  assert.equal(rcRegressionReady.userFacingSummary.safeToContinueReleaseCandidate, true);
  const rcCopyReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    rcCopyFinalizationSummary:{ status:"finalized", userFacingSummary:{ resultLabel:"文案可以定稿", redacted:true }, redacted:true },
    safetyDisclosureReviewSummary:{ status:"approved", userFacingSummary:{ resultLabel:"安全披露通过", redacted:true }, redacted:true },
    rcCopyReviewViewModelSummary:{ status:"approved", title:"只读 RC 文案定稿与安全披露", caveat:"该页面只用于只读 RC 文案定稿与安全披露复核，不保存真实身份、不发送真实邀请、不提供交易能力。", redacted:true },
    rcCopyReviewStatus:"finalized",
    safetyDisclosureStatus:"approved",
    safeToFinalizeUserFacingCopy:true
  });
  assert.equal(rcCopyReady.safetyReport.rcCopyReviewStatus, "finalized");
  assert.equal(rcCopyReady.safetyReport.safetyDisclosureStatus, "approved");
  assert.equal(rcCopyReady.safetyReport.rcCopyReviewViewModelSummary.title, "只读 RC 文案定稿与安全披露");
  assert.equal(rcCopyReady.userFacingSummary.safeToFinalizeUserFacingCopy, true);
  const globalGoal = windowRef.WeishanGlobalShoppingProductGoalCharter.buildGlobalShoppingProductGoalCharter();
  const jumpBoundary = windowRef.WeishanGlobalShoppingJumpToPlatformBoundary.buildGlobalShoppingJumpToPlatformBoundary();
  const goalView = windowRef.WeishanGlobalShoppingProductGoalViewModel.buildGlobalShoppingProductGoalViewModel({ globalShoppingProductGoalSummary:globalGoal, jumpToPlatformBoundarySummary:jumpBoundary });
  const normalizer = windowRef.WeishanGlobalShoppingPriceSourceNormalizer.buildGlobalShoppingPriceSourceNormalizer();
  const sameItemMatcher = windowRef.WeishanGlobalShoppingSameItemMatcher.buildGlobalShoppingSameItemMatcher({ priceSourceNormalizationSummary:normalizer });
  const merger = windowRef.WeishanGlobalShoppingDuplicateCandidateMerger.buildGlobalShoppingDuplicateCandidateMerger({ sameItemMatcherSummary:sameItemMatcher });
  const anchor = windowRef.WeishanGlobalShoppingOfficialPriceAnchorSlot.buildGlobalShoppingOfficialPriceAnchorSlot({ priceSourceNormalizationSummary:normalizer });
  const coveredBoard = windowRef.WeishanGlobalShoppingCoveredLowestCandidateBoard.buildGlobalShoppingCoveredLowestCandidateBoard({ duplicateCandidateMergerSummary:merger, officialPriceAnchorSummary:anchor });
  const deepLink = windowRef.WeishanGlobalShoppingExternalDeepLinkSafetyGate.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", sourceName:"Sandbox Platform", disclosureText:"价格以跳转后平台实时页面为准。用户需在平台自行确认价格、登录、填写资料并完成下单。" });
  const prefill = windowRef.WeishanGlobalShoppingSearchParameterPrefillGate.buildGlobalShoppingSearchParameterPrefillGate({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1 });
  const preview = windowRef.WeishanGlobalShoppingJumpToPlatformHandoffPreview.buildGlobalShoppingJumpToPlatformHandoffPreview({ externalDeepLinkSafetySummary:deepLink, searchParameterPrefillSummary:prefill });
  const globalReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    globalShoppingProductGoalSummary:globalGoal,
    jumpToPlatformBoundarySummary:jumpBoundary,
    globalShoppingProductGoalViewModelSummary:goalView,
    priceSourceNormalizationSummary:normalizer,
    officialPriceAnchorSummary:anchor,
    sameItemMatcherSummary:sameItemMatcher,
    duplicateCandidateMergerSummary:merger,
    coveredLowestCandidateBoardSummary:coveredBoard,
    externalDeepLinkSafetySummary:deepLink,
    searchParameterPrefillSummary:prefill,
    jumpToPlatformHandoffPreviewSummary:preview,
    globalShoppingGoalStatus:"aligned",
    jumpBoundaryStatus:"safe",
    safeToProceedWithJumpToPlatformMvp:true,
    safeToProceedWithDeepLinkSafetyGate:true,
    externalDeepLinkSafetyStatus:"safe",
    searchPrefillStatus:"safe",
    handoffPreviewStatus:"ready",
    safeToProceedWithSandboxDeepLinkCandidate:true
  });
  assert.equal(globalReady.userFacingSummary.globalShoppingProductGoalSummary.title, "全球购产品目标");
  assert.equal(globalReady.userFacingSummary.jumpToPlatformBoundarySummary.title, "跳转至平台自行下单边界");
  assert.equal(globalReady.userFacingSummary.globalShoppingProductGoalViewModelSummary.title, "全球购产品目标与跳转边界");
  assert.equal(globalReady.userFacingSummary.sameItemMatcherSummary.title, "同款候选识别");
  assert.equal(globalReady.userFacingSummary.duplicateCandidateMergerSummary.title, "重复候选合并");
  assert.equal(globalReady.userFacingSummary.coveredLowestCandidateBoardSummary.title, "已覆盖来源候选价合并");
  assert.equal(globalReady.userFacingSummary.externalDeepLinkSafetySummary.title, "外部平台跳转安全闸门");
  assert.equal(globalReady.userFacingSummary.searchParameterPrefillSummary.title, "搜索参数预填闸门");
  assert.equal(globalReady.userFacingSummary.jumpToPlatformHandoffPreviewSummary.title, "跳转至平台查看");
  assert.equal(globalReady.userFacingSummary.globalShoppingGoalStatus, "aligned");
  assert.equal(globalReady.userFacingSummary.jumpBoundaryStatus, "safe");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithJumpToPlatformMvp, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithDeepLinkSafetyGate, true);
  assert.equal(globalReady.userFacingSummary.externalDeepLinkSafetyStatus, "safe");
  assert.equal(globalReady.userFacingSummary.searchPrefillStatus, "safe");
  assert.equal(globalReady.userFacingSummary.handoffPreviewStatus, "ready");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithSandboxDeepLinkCandidate, true);
  const withOnboarding = api.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:summary, pilotOnboardingSummary:{ status:"allowed", redacted:true }, readOnlyConsentSummary:{ status:"accepted", redacted:true }, pilotEntryStatus:"allowed", canEnterReadOnlyPilot:true, pilotConsentRequired:false });
  assert.equal(withOnboarding.safetyReport.pilotEntryStatus, "allowed");
  assert.equal(withOnboarding.safetyReport.canEnterReadOnlyPilot, true);
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
  const withPilotOps = api.buildReadOnlyQuoteSessionReportCenter({ sessionSummary:summary, pilotOpsSummary:{ status:"healthy", primaryRisk:{ riskId:"none", label:"无主要风险" } }, nextCohortDecisionSummary:{ status:"advance", decision:{ decisionId:"advance_next_cohort", label:"可以进入下一批只读测试" } }, pilotOpsStatus:"healthy", nextCohortDecisionStatus:"advance", pilotOpsPrimaryRisk:{ riskId:"none", label:"无主要风险" } });
  assert.equal(withPilotOps.status, "ready");
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
