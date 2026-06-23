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
    "apps/desktop/src/renderer/core/providerConfirmationHandoffUi.js",
    "apps/desktop/src/renderer/core/providerSandboxBindingWizard.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRefreshStateStore.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteInteractiveRefreshUiController.js",
    "apps/desktop/src/renderer/core/sandboxProviderDryRunHarness.js",
    "apps/desktop/src/renderer/core/sandboxProviderRunMatrix.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateRanking.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateSelection.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRunHistoryStore.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteDeltaCompare.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteReplayGuard.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionManager.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteEvidenceSummaryFormatter.js",
    "apps/desktop/src/renderer/core/safeProviderConfirmationChecklist.js",
    "apps/desktop/src/renderer/core/providerHandoffReceiptStore.js",
    "apps/desktop/src/renderer/core/manualPlatformCheckCapture.js",
    "apps/desktop/src/renderer/core/platformCheckDeltaCompare.js",
    "apps/desktop/src/renderer/core/platformCheckReconciliationCenter.js",
    "apps/desktop/src/renderer/core/readOnlyCandidateConfidenceLabeler.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSafeNextStepCoach.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteDecisionAssistant.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteCandidateComparisonExplainer.js",
    "apps/desktop/src/renderer/core/flightWorkflowAuditReviewCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowSafeSessionExportPreview.js",
    "apps/desktop/src/renderer/core/flightWorkflowRiskBadgeBuilder.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteAuditExport.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRunTimeline.js",
    "apps/desktop/src/renderer/core/multiProviderSandboxDryRunOrchestrator.js",
    "apps/desktop/src/renderer/core/readOnlyPriceCandidateCardViewModel.js"
  ]);
  const api = windowRef.WeishanReadOnlyPriceCandidateCardViewModel;
  const dryRunApi = windowRef.WeishanMultiProviderSandboxDryRunOrchestrator;
  const dryRun = dryRunApi.runMultiProviderSandboxDryRun({ title:"购买7月15日上海到成都最便宜的直达机票", origin:"上海", destination:"成都", departureDate:"2026-07-15", directOnly:true, sortIntent:"低价优先" }, {});
  assert.equal(api.READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION, "2.1.71");
  const card = api.buildReadOnlyPriceCandidateCardViewModel({ continuitySummary:{ status:"resumable", currentStage:"decision", stageLabel:"选择候选", resumePlan:{ nextStepLabel:"确认前往平台", canResume:true } }, confirmationStateSummary:{ labels:["已选择候选"] }, recoverySummary:{ status:"resumable" }, resumeCoachSummary:{ allowedActions:[{ label:"前往平台确认" }] }, currentStage:"decision", workflowStageLabel:"选择候选", nextStepLabel:"确认前往平台", canResumeWorkflow:true, resumeActions:[{ label:"前往平台确认" }], blockedActions:[{ label:"付款" }], actionPolicyDecision:{ status:"requires_confirmation" }, workflowStateSummary:{ status:"evidence_ready" }, clarificationSummary:{ status:"complete" }, workflowStepList:[{ label:"生成候选证据", status:"completed" }], missingFields:[], clarificationQuestions:[], workflowUserMessage:"候选证据已生成，平台最终为准。", sandboxDryRunSummary:dryRun, runTimelineSummary:dryRun.runTimelineSummary, providerRunMatrix:dryRun.providerRunMatrix, dryRunStatus:dryRun.status, dryRunButton:{ label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false }, dryRunTopCandidates:dryRun.dryRunTopCandidates, task:{ title:"7月15日上海到成都最便宜的机票" }, providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", report:{ provider:{ providerMode:"fixture" }, handoff:{ safeProviderHandoffUrl:"https://www.google.com/travel/flights" }, rankingPreview:{ sourceBreakdown:{ providerCount:3, providerIds:["flight_provider_trusted_fixture","trip_com_sandbox_stub","airline_official_sandbox_stub"], fareSources:["sandbox_read_only_import"] }, rankingExplanation:"仅按导入样本中的只读候选证据排序，平台最终为准。" }, selectedCandidate:{ providerName:"Airline Official Sandbox Stub", responseShape:"airline_official_stub_quote", selectedSourceSummary:"来源：Airline Official Sandbox Stub / airline_official_stub_quote" } }, sourceBreakdown:{ providerCount:3, providerIds:["flight_provider_trusted_fixture","trip_com_sandbox_stub","airline_official_sandbox_stub"], fareSources:["sandbox_read_only_import"] }, selectedSourceSummary:"来源：Airline Official Sandbox Stub / airline_official_stub_quote", rankingExplanation:"仅按导入样本中的只读候选证据排序，平台最终为准。", flightFields:{ origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", goal:"低价优先", directPreference:"直达优先" }, topCandidates:[{ rank:1, quoteId:"q930", providerName:"Airline Official Sandbox Stub", responseShape:"airline_official_stub_quote", fareSource:"sandbox_read_only_import", currency:"CNY", baseFare:780, taxesAndFees:130, providerFees:20, totalPrice:930, safeProviderHandoffReady:true, safeProviderHandoffUrl:"https://www.google.com/travel/flights", bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true }] });
  assert.equal(card.visible, true);
  assert.equal(card.title, "只读候选价");
  assert.equal(card.providerMode, "fixture");
  assert.equal(card.workflowStateSummary.status, "evidence_ready");
  assert.equal(card.clarificationSummary.status, "complete");
  assert.equal(card.workflowStepList[0].label, "生成候选证据");
  assert.equal(card.workflowUserMessage, "候选证据已生成，平台最终为准。");
  assert.equal(card.priceTruthLabel, "只读候选价 · 平台最终为准 · 未锁价，不代表可出票");
  assert.equal(card.providerConfirmationRequired, true);
  assert.equal(card.auditReviewSummary.userFacingSummary.title, "本次机票工作流审计");
  assert.equal(card.auditReviewSummary.bookingUrl, null);
  assert.equal(card.safeSessionExportPreview.canWriteFile, false);
  assert.equal(card.safeSessionExportPreview.bookingUrl, null);
  assert.ok(card.riskBadgeSummary.line.includes("只读安全"));
  assert.ok(card.riskBadgeSummary.line.includes("交易动作已阻断"));
  assert.equal(card.confirmationUi.continueButtonDisabled, false);
  assert.equal(card.bookingUrl, null);
  const cardWithLedger = api.buildReadOnlyPriceCandidateCardViewModel({ eventLedgerSummary:{ lastActionId:"record_platform_check", lastActionStatus:"executed_local", lastActionMessage:"动作已执行" } });
  assert.equal(cardWithLedger.lastActionId, "record_platform_check");
  assert.equal(cardWithLedger.lastActionMessage, "动作已执行");
  assert.equal(card.noAutoOpen, true);
  assert.equal(card.noPayment, true);
  assert.equal(card.noOrder, true);
  assert.equal(card.noIdentityUpload, true);
  assert.equal(card.selectedSourceSummary, "来源：Airline Official Sandbox Stub / airline_official_stub_quote");
  assert.equal(card.rankingExplanation, "仅按导入样本中的只读候选证据排序，平台最终为准。");
  assert.equal(card.sourceBreakdown.providerCount, 3);
  assert.equal(card.refreshButton.label, "刷新只读报价");
  assert.equal(card.refreshButton.enabled, true);
  assert.equal(card.refreshButton.autoRun, false);
  assert.equal(card.refreshButton.payment, false);
  assert.equal(card.refreshButton.order, false);
  assert.equal(card.refreshButton.identityUpload, false);
  assert.equal(card.refreshButton.autoRefresh, false);
  assert.equal(card.refreshStateSummary.summary, "最近一次刷新：未运行");
  assert.equal(card.dryRunButton.label, "运行沙盒只读报价");
  assert.equal(card.dryRunStatus, "completed");
  assert.equal(card.dryRunTopCandidates.length, 3);
  assert.equal(card.providerBindingWizardSummary.title, "Provider 沙盒绑定准备");
  assert.equal(card.interactiveRefreshState.status, "idle");
  assert.equal(card.clearRefreshStateButton.label, "清除刷新状态");
  assert.equal(card.sessionSummary.sessionId, "deterministic-read-only-quote-session-v2.1.71");
  assert.equal(card.sessionStatus, "updated");
  assert.equal(card.auditExportReady, true);
  assert.equal(card.sessionRecoverySummary.title, "Session Recovery");
  assert.equal(card.reportCenterStatus, "ready");
  assert.equal(card.reportCenterSummary.reportCenterName, "read_only_quote_session_report_center_v1");
  assert.equal(card.userFacingEvidenceSummary.title, "候选报价证据摘要");
  assert.equal(card.userFacingEvidenceSummary.subtitle, "只读候选价 · 平台最终为准");
  assert.equal(card.safetyReportSummary.rawResponseStored, false);
  assert.ok(card.evidenceSummaryWarnings.includes("平台最终为准"));
  assert.equal(card.selectedCandidateUserSummary.requiresUserConfirm, true);
  assert.equal(card.decisionAssistantSummary.title, "推荐理由");
  assert.equal(card.candidateComparisonSummary.title, "候选对比");
  assert.equal(card.recommendationExplanation.primaryReason, "该候选在本次只读候选样本中合计金额较低。");
  assert.ok(card.decisionAssistantSummary.line.includes("平台最终为准"));
  assert.ok(Array.isArray(card.candidateComparisonTable));
  assert.equal(card.providerConfirmationWarning.providerConfirmationRequiresUserConfirm, true);
  assert.equal(card.handoffChecklistSummary.actions.requiresUserConfirmation, true);
  assert.equal(card.handoffReceiptSummary.safety.rawUrlStored, false);
  assert.equal(card.manualPlatformCheckSummary.status, "accepted");
  assert.equal(card.platformCheckDeltaSummary.canClaimPriceLocked, false);
  assert.equal(card.reconciliationSummary.title, "平台核对汇总");
  assert.ok(["高一致", "有差异", "需重新核对", "不可确认"].includes(card.confidenceLabelSummary.confidenceLabel));
  assert.ok(card.safeNextStepSummary.forbiddenActions.includes("付款"));
  const html = api.renderReadOnlyPriceCandidateCardHtml(card);
  assert.equal(html.includes("Top 3 候选报价"), true);
  assert.equal(html.includes("推荐理由"), true);
  assert.equal(html.includes("候选对比"), true);
  assert.equal(html.includes("本地只读候选证据中较低"), true);
  assert.equal(html.includes("仍需前往平台确认"), true);
  assert.equal(html.includes("前往平台确认前检查"), true);
  assert.equal(html.includes("生成本地 handoff receipt"), true);
  assert.equal(html.includes("记录平台核对结果"), true);
  assert.equal(html.includes("平台核对差异"), true);
  assert.equal(html.includes("平台核对汇总"), true);
  assert.equal(html.includes("候选价置信标签"), true);
  assert.equal(html.includes("下一步安全建议"), true);
  assert.equal(html.includes("本次机票工作流审计"), true);
  assert.equal(html.includes("安全检查通过"), true);
  assert.equal(html.includes("脱敏会话摘要预览"), true);
  assert.equal(html.includes("工作流摘要"), true);
  assert.equal(html.includes("候选证据摘要"), true);
  assert.equal(html.includes("安全审计摘要"), true);
  assert.equal(html.includes("不包含证件、银行卡、登录凭据或密钥"), true);
  assert.equal(html.includes("不包含付款、下单、出票链接"), true);
  assert.equal(html.includes("查看脱敏摘要预览"), true);
  assert.equal(html.includes("只读安全"), true);
  assert.equal(html.includes("交易动作已阻断"), true);
  assert.equal(html.includes("重新核对平台页面"), true);
  assert.equal(html.includes("当前只读报价会话"), true);
  assert.equal(html.includes("Audit Export"), true);
  assert.equal(html.includes("候选报价证据摘要"), true);
  assert.equal(html.includes("只读候选价 · 平台最终为准"), true);
  assert.equal(html.includes("唯珊不会付款、不会下单、不会上传证件或银行卡"), true);
  assert.equal(html.includes("查看脱敏审计预览"), true);
  assert.equal(html.includes("Airline Official Sandbox Stub"), true);
  assert.equal(html.includes("airline_official_stub_quote"), true);
  assert.equal(html.includes("Source Breakdown"), true);
  assert.equal(html.includes("平台最终为准"), true);
  assert.equal(html.includes("未锁价"), true);
  assert.equal(html.includes("不代表可出票"), true);
  assert.equal(html.includes("去平台确认"), true);
  assert.equal(html.includes("当前导入样本中的低价候选"), true);
  assert.equal(html.includes("Limited Beta"), false);
  assert.equal(/bookingUrl:\s*https?:/i.test(html), false);
  const rankedCard = api.buildReadOnlyPriceCandidateCardViewModel({ sandboxDryRunSummary:dryRun, runTimelineSummary:dryRun.runTimelineSummary, providerRunMatrix:dryRun.providerRunMatrix, dryRunStatus:dryRun.status, dryRunButton:{ label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false }, dryRunTopCandidates:dryRun.dryRunTopCandidates, topCandidates:[{ rank:1, quoteId:"q980", providerName:"Trusted Flight Fixture", responseShape:"weishan_normalized_quote", fareSource:"sandbox_read_only_import", currency:"CNY", baseFare:830, taxesAndFees:110, providerFees:40, totalPrice:980, safeProviderHandoffReady:true, safeProviderHandoffUrl:"https://www.google.com/travel/flights", bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true }], selectedCandidate:{ quoteId:"quote_3", providerName:"Airline Official Sandbox Stub", responseShape:"airline_official_stub_quote", selectedSourceSummary:"来源：Airline Official Sandbox Stub / airline_official_stub_quote", safeProviderHandoffReady:true, safeProviderHandoffUrl:"https://www.google.com/travel/flights" }, sourceBreakdown:{ providerCount:1, providerIds:["q980"], fareSources:["sandbox_read_only_import"] }, rankingExplanation:"仅按导入样本中的只读候选证据排序，平台最终为准。", report:{ handoff:{ safeProviderHandoffUrl:null } } });
  assert.equal(rankedCard.topCandidates.length, 3);
  assert.equal(rankedCard.lowPriceClaim, "当前导入样本中的低价候选");
  assert.equal(rankedCard.rankingScope, "导入样本范围");
  assert.equal(rankedCard.selectedSourceSummary, "来源：Airline Official Sandbox Stub / airline_official_stub_quote");
  assert.equal(rankedCard.runTimelineSummary.timelineName, "read_only_quote_run_timeline_v1");
  const rankedHtml = api.renderReadOnlyPriceCandidateCardHtml(rankedCard);
  assert.equal(rankedHtml.includes("选择该候选"), true);
  assert.equal(rankedHtml.includes("已选择该候选"), true);
  assert.equal(rankedHtml.includes("当前导入样本中的低价候选"), true);
  assert.equal(rankedHtml.includes("运行沙盒只读报价"), true);
  assert.equal(rankedHtml.includes("本次沙盒运行结果"), true);
  assert.equal(rankedHtml.includes("全网最低"), false);
  const missingUrlCard = api.buildReadOnlyPriceCandidateCardViewModel({ providerId:"google_flights_search", report:{ handoff:{ safeProviderHandoffUrl:null } } });
  assert.equal(missingUrlCard.visible, true);
  assert.equal(missingUrlCard.gate.status, "blocked");
  assert.equal(missingUrlCard.confirmationUi.status, "blocked");
  assert.equal(missingUrlCard.confirmationUi.continueButtonDisabled, true);
  assert.equal(missingUrlCard.safeProviderHandoffUrl, null);
  assert.equal(missingUrlCard.bookingUrl, null);
  assert.equal(missingUrlCard.refreshButton.enabled, true);
  assert.equal(missingUrlCard.noAutoOpen, true);
  const missingUrlHtml = api.renderReadOnlyPriceCandidateCardHtml(missingUrlCard);
  assert.equal(missingUrlHtml.includes("当前平台确认链接未通过安全检查"), true);
  assert.equal(missingUrlHtml.includes("运行沙盒只读报价"), true);
  assert.equal(missingUrlHtml.includes("disabled"), true);
  assert.equal(api.assertReadOnlyPriceCandidateCardViewModelSafe(card), true);
  assert.equal(api.assertReadOnlyPriceCandidateCardViewModelSafe(missingUrlCard), true);
  const commerceAgentPageSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/routes/CommerceAgentPage.js"), "utf8");
  assert.equal(commerceAgentPageSource.includes('safeProviderHandoffCandidate.safeProviderHandoffUrl || "https://www.google.com/travel/flights"'), false);
  console.log("READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_CORE PASS");
}
main();
