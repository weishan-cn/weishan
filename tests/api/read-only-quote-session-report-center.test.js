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
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingFixtureReplayConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingNormalizedPriceCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyRealProviderSandboxGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderRequestEnvelopeBuilder.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCallAuditLedger.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxReadinessViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxSafetyKillSwitch.js",
    "apps/desktop/src/renderer/core/globalShoppingFirstReadOnlyProviderAdapterShell.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunHarness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistry.js",
    "apps/desktop/src/renderer/core/globalShoppingDryRunProviderResponseNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderRunbookBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderAdapterRegistryViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingFirstSandboxProviderConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageDashboard.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySourceTrustScore.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCoverageViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxIntegrationGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateSession.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceCandidateResultBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingLegalProviderFixtureAdapter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderCredentialSafetyReview.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxPriceFeedGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderResponseContract.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderFixtureViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPriceSourceNormalizer.js",
    "apps/desktop/src/renderer/core/globalShoppingOfficialPriceAnchorSlot.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalDeepLinkSafetyGate.js",
    "apps/desktop/src/renderer/core/globalShoppingSearchParameterPrefillGate.js",
    "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformHandoffPreview.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformAvailabilityGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPartnerLinkPolicy.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxDeepLinkCandidate.js",
    "apps/desktop/src/renderer/core/globalShoppingSameItemMatcher.js",
    "apps/desktop/src/renderer/core/globalShoppingDuplicateCandidateMerger.js",
    "apps/desktop/src/renderer/core/globalShoppingCoveredLowestCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPricePipelineOrchestrator.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCandidateJourneyBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProductGoalViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxHandoffViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyCommerceSessionRecapCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingUserTrustClosureSummary.js",
    "apps/desktop/src/renderer/core/globalShoppingNextFeatureReadinessGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLegalReviewDossier.js",
    "apps/desktop/src/renderer/core/globalShoppingCredentialVaultInterfaceStub.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxAdapterContractTestbed.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderIntegrationPrepViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingMockProviderAdapterRegistryRuntime.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderContractReplayHarness.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderLaunchReadinessViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingHumanControlledSandboxProviderPilotPlanner.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderKillSwitchDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingComplianceEvidencePack.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderPilotGovernanceViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderOperatorReviewLoop.js",
    "apps/desktop/src/renderer/core/globalShoppingCommerceSessionRecapViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaVisualQaConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialScenarioChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingNoTransactionRegressionGuard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaQaViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaUserOnboardingShell.js",
    "apps/desktop/src/renderer/core/globalShoppingVisualTrialGuide.js",
    "apps/desktop/src/renderer/core/globalShoppingSafeFeedbackDraftPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaOnboardingViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaRcConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingOfflineTrialReleaseGate.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaRcViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaStabilityAudit.js",
    "apps/desktop/src/renderer/core/globalShoppingManualLaunchHandoffPack.js",
    "apps/desktop/src/renderer/core/globalShoppingManualLaunchHandoffViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateEvidenceReview.js",
    "apps/desktop/src/renderer/core/globalShoppingTrialOperatorNotesPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingOfflineSafetyDeltaBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateReviewViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaCandidateQaFreeze.js",
    "apps/desktop/src/renderer/core/globalShoppingTrialFeedbackIntakeMock.js",
    "apps/desktop/src/renderer/core/globalShoppingOfflineRegressionEvidenceBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaQaFreezeViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaReadinessSnapshot.js",
    "apps/desktop/src/renderer/core/globalShoppingManualFeedbackReviewQueueMock.js",
    "apps/desktop/src/renderer/core/globalShoppingOfflineIssueTriageBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaReadinessReviewViewModel.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyUserConsentFlow.js",
    "apps/desktop/src/renderer/core/flightWorkflowPublicPilotOnboardingGuard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotOnboardingViewModel.js"
  ]);
  const manager = windowRef.WeishanReadOnlyQuoteSessionManager;
  const api = windowRef.WeishanReadOnlyQuoteSessionReportCenter;
  assert.equal(api.READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION, "4.2.5");
  const empty = api.buildReadOnlyQuoteSessionReportCenter({});
  assert.equal(empty.status, "empty");
  const session = manager.updateReadOnlyQuoteSession(manager.createReadOnlyQuoteSession({ route:"上海 → 成都", departureDate:"2026-07-15" }), { type:"DRY_RUN_COMPLETED", result:{ runId:"r1", dryRunTopCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:980, bookingUrl:"https://blocked.example" }], selectedCandidate:{ quoteId:"q1", providerName:"A", totalPrice:980, token:"abc" } } });
  const summary = manager.buildReadOnlyQuoteSessionSummary(session);
  const ready = api.buildReadOnlyQuoteSessionReportCenter({ workflowStateSummary:{ status:"evidence_ready" }, clarificationSummary:{ status:"complete" }, workflowStepList:[{ label:"生成候选证据", status:"completed" }], missingFields:[], clarificationQuestions:[], workflowUserMessage:"候选证据已生成，平台最终为准。", sessionSummary:summary, topCandidates:[{ quoteId:"q1", providerName:"A", totalPrice:980 }], selectedCandidate:{ quoteId:"q1", providerName:"A", totalPrice:980 }, runHistorySummary:{ totalRunCount:1 }, quoteDeltaSummary:{ status:"not_enough_history" }, replaySummary:{ status:"unavailable" } });
  assert.equal(ready.appVersion, "4.2.5");
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
  const pilotControlReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ title:"Provider Sandbox Pilot 控制室", resultLabel:"Sandbox Pilot 控制室已准备", redacted:true }, redacted:true },
    mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ title:"Mock Provider 事故演练", resultLabel:"Mock 事故演练已准备", redacted:true }, redacted:true },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ title:"Production 阻断矩阵", resultLabel:"Production 阻断矩阵已准备", redacted:true }, redacted:true },
    providerPilotControlViewModelSummary:{ status:"ready", title:"Provider Sandbox Pilot 控制与阻断", redacted:true },
    providerSandboxPilotControlStatus:"ready",
    mockProviderIncidentDrillStatus:"ready",
    productionBlockerMatrixStatus:"ready",
    providerPilotControlViewModelStatus:"ready",
    safeToProceedWithHumanControlledSandboxProviderPilotPlan:true
  });
  assert.equal(pilotControlReady.userFacingSummary.providerSandboxPilotControlRoomSummary.title, "Provider Sandbox Pilot 控制室");
  assert.equal(pilotControlReady.userFacingSummary.mockProviderIncidentDrillSummary.title, "Mock Provider 事故演练");
  assert.equal(pilotControlReady.userFacingSummary.productionBlockerMatrixSummary.title, "Production 阻断矩阵");
  assert.equal(pilotControlReady.userFacingSummary.providerPilotControlViewModelSummary.title, "Provider Sandbox Pilot 控制与阻断");
  assert.equal(pilotControlReady.userFacingSummary.safeToProceedWithHumanControlledSandboxProviderPilotPlan, true);
  const governanceReleaseReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    providerGovernanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ title:"Provider Governance 审计控制台", resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ title:"Human Pilot 准备台账", resultLabel:"Human Pilot 准备台账已准备", redacted:true }, redacted:true },
    sandboxProviderReleaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Provider Release Freeze Gate", resultLabel:"Release Freeze Gate 已准备", redacted:true }, redacted:true },
    providerGovernanceReleaseViewModelSummary:{ status:"ready", title:"Provider Governance 发布审计与冻结闸门", redacted:true },
    providerGovernanceAuditConsoleStatus:"ready",
    humanPilotReadinessLedgerStatus:"ready",
    sandboxProviderReleaseFreezeGateStatus:"ready",
    providerGovernanceReleaseViewModelStatus:"ready",
    safeToProceedWithManualGovernanceReleaseDecision:false
  });
  assert.equal(governanceReleaseReady.userFacingSummary.providerGovernanceAuditConsoleSummary.title, "Provider Governance 审计控制台");
  assert.equal(governanceReleaseReady.userFacingSummary.humanPilotReadinessLedgerSummary.title, "Human Pilot 准备台账");
  assert.equal(governanceReleaseReady.userFacingSummary.sandboxProviderReleaseFreezeGateSummary.title, "Sandbox Provider Release Freeze Gate");
  assert.equal(governanceReleaseReady.userFacingSummary.providerGovernanceReleaseViewModelSummary.title, "Provider Governance 发布审计与冻结闸门");
  assert.equal(governanceReleaseReady.safetyReport.providerGovernanceAuditConsoleStatus, "ready");
  assert.equal(governanceReleaseReady.safetyReport.humanPilotReadinessLedgerStatus, "ready");
  assert.equal(governanceReleaseReady.safetyReport.sandboxProviderReleaseFreezeGateStatus, "ready");
  assert.equal(governanceReleaseReady.safetyReport.providerGovernanceReleaseViewModelStatus, "ready");
  assert.equal(governanceReleaseReady.userFacingSummary.safeToProceedWithManualGovernanceReleaseDecision, false);
  const trialOperationsReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicBetaTrialOperationsConsoleSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Trial Operations Console", resultLabel:"Public Beta Trial Operations Console 已准备", redacted:true }, redacted:true },
    manualQaScenarioRunnerSummary:{ status:"ready", userFacingSummary:{ title:"Manual QA Scenario Runner", resultLabel:"Manual QA Scenario Runner 已准备", redacted:true }, redacted:true },
    offlineFeedbackReviewBoardSummary:{ status:"ready", userFacingSummary:{ title:"Offline Feedback Review Board", resultLabel:"Offline Feedback Review Board 已准备", redacted:true }, redacted:true },
    publicBetaTrialOperationsViewModelSummary:{ status:"ready", title:"Public Beta Trial Operations Console", userFacingSummary:{ title:"Public Beta Trial Operations View Model", resultLabel:"Public Beta Trial Operations View Model 已准备", redacted:true }, redacted:true },
    publicBetaTrialOperationsConsoleStatus:"ready",
    manualQaScenarioRunnerStatus:"ready",
    offlineFeedbackReviewBoardStatus:"ready",
    publicBetaTrialOperationsViewModelStatus:"ready",
    safeToProceedWithManualTrialOperationsReview:true
  });
  assert.equal(trialOperationsReady.safetyReport.publicBetaTrialOperationsConsoleSummary.userFacingSummary.title, "Public Beta Trial Operations Console");
  assert.equal(trialOperationsReady.safetyReport.manualQaScenarioRunnerSummary.userFacingSummary.title, "Manual QA Scenario Runner");
  assert.equal(trialOperationsReady.safetyReport.offlineFeedbackReviewBoardSummary.userFacingSummary.title, "Offline Feedback Review Board");
  assert.equal(trialOperationsReady.safetyReport.publicBetaTrialOperationsViewModelStatus, "ready");
  assert.equal(trialOperationsReady.userFacingSummary.safeToProceedWithManualTrialOperationsReview, true);
  const readinessReviewReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicBetaReadinessSnapshotSummary:{ status:"manual_review_required", userFacingSummary:{ title:"Public Beta Readiness Snapshot", resultLabel:"Public Beta Readiness Snapshot 需人工复核", redacted:true }, redacted:true },
    manualFeedbackReviewQueueMockSummary:{ status:"manual_review_required", userFacingSummary:{ title:"Manual Feedback Review Queue Mock", resultLabel:"Manual Feedback Review Queue Mock 需人工复核", redacted:true }, redacted:true },
    offlineIssueTriageBoardSummary:{ status:"manual_review_required", userFacingSummary:{ title:"Offline Issue Triage Board", resultLabel:"Offline Issue Triage Board 需人工复核", redacted:true }, redacted:true },
    publicBetaReadinessReviewViewModelSummary:{ status:"ready", title:"Public Beta Readiness Snapshot", userFacingSummary:{ title:"Public Beta Readiness Review ViewModel", resultLabel:"Public Beta Readiness Snapshot / Manual Feedback Review Queue Mock / Offline Issue Triage Board 已准备", redacted:true }, safeToProceedWithManualReadinessReview:true, redacted:true },
    publicBetaReadinessSnapshotStatus:"manual_review_required",
    manualFeedbackReviewQueueStatus:"manual_review_required",
    offlineIssueTriageBoardStatus:"manual_review_required",
    publicBetaReadinessReviewViewModelStatus:"ready",
    safeToProceedWithManualReadinessReview:true
  });
  assert.equal(readinessReviewReady.safetyReport.publicBetaReadinessSnapshotSummary.title, "Public Beta Readiness Snapshot");
  assert.equal(readinessReviewReady.safetyReport.manualFeedbackReviewQueueMockSummary.title, "Manual Feedback Review Queue Mock");
  assert.equal(readinessReviewReady.safetyReport.offlineIssueTriageBoardSummary.title, "Offline Issue Triage Board");
  assert.equal(readinessReviewReady.safetyReport.publicBetaReadinessReviewViewModelSummary.title, "Public Beta Readiness Review ViewModel");
  assert.equal(readinessReviewReady.safetyReport.publicBetaReadinessSnapshotStatus, "manual_review_required");
  assert.equal(readinessReviewReady.safetyReport.manualFeedbackReviewQueueStatus, "manual_review_required");
  assert.equal(readinessReviewReady.safetyReport.publicBetaReadinessReviewViewModelStatus, "ready");
  assert.equal(readinessReviewReady.userFacingSummary.safeToProceedWithManualReadinessReview, true);
  const offlineAcceptanceReviewReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicBetaOfflineAcceptanceEvidenceCenterSummary:{ status:"manual_review_required", userFacingSummary:{ title:"Public Beta Offline Acceptance Evidence Center", resultLabel:"Public Beta Offline Acceptance Evidence Center 需人工复核", redacted:true }, redacted:true },
    manualScenarioReviewBoardSummary:{ status:"manual_review_required", userFacingSummary:{ title:"Manual Scenario Review Board", resultLabel:"Manual Scenario Review Board 需人工复核", redacted:true }, redacted:true },
    zeroPersistenceRegressionGateSummary:{ status:"manual_review_required", userFacingSummary:{ title:"Zero-Persistence Regression Gate", resultLabel:"Zero-Persistence Regression Gate 需人工复核", redacted:true }, redacted:true },
    publicBetaOfflineAcceptanceViewModelSummary:{ status:"needs_review", title:"Public Beta Offline Acceptance ViewModel", userFacingSummary:{ title:"Public Beta Offline Acceptance ViewModel", resultLabel:"Public Beta Offline Acceptance ViewModel 仍需复核", redacted:true }, safeToProceedWithManualOfflineAcceptanceReview:false, redacted:true },
    publicBetaOfflineAcceptanceEvidenceCenterStatus:"manual_review_required",
    manualScenarioReviewStatus:"manual_review_required",
    zeroPersistenceStatus:"manual_review_required",
    publicBetaOfflineAcceptanceViewModelStatus:"needs_review",
    safeToProceedWithManualOfflineAcceptanceReview:false
  });
  assert.equal(offlineAcceptanceReviewReady.safetyReport.publicBetaOfflineAcceptanceEvidenceCenterSummary.title, "Public Beta Offline Acceptance Evidence Center");
  assert.equal(offlineAcceptanceReviewReady.safetyReport.manualScenarioReviewBoardSummary.title, "Manual Scenario Review Board");
  assert.equal(offlineAcceptanceReviewReady.safetyReport.zeroPersistenceRegressionGateSummary.title, "Zero-Persistence Regression Gate");
  assert.equal(offlineAcceptanceReviewReady.safetyReport.publicBetaOfflineAcceptanceViewModelSummary.title, "Public Beta Offline Acceptance ViewModel");
  assert.equal(offlineAcceptanceReviewReady.safetyReport.publicBetaOfflineAcceptanceEvidenceCenterStatus, "manual_review_required");
  assert.equal(offlineAcceptanceReviewReady.safetyReport.manualScenarioReviewStatus, "manual_review_required");
  assert.equal(offlineAcceptanceReviewReady.safetyReport.zeroPersistenceStatus, "manual_review_required");
  assert.equal(offlineAcceptanceReviewReady.safetyReport.publicBetaOfflineAcceptanceViewModelStatus, "needs_review");
  assert.equal(offlineAcceptanceReviewReady.userFacingSummary.safeToProceedWithManualOfflineAcceptanceReview, false);
  const publicBetaComparisonReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    categoryResultSimulatorSummary:{ status:"ready", userFacingSummary:{ title:"Category Result Simulator", resultLabel:"Category Result Simulator 已准备", redacted:true }, redacted:true },
    readOnlyComparisonBoardSummary:{ status:"ready", userFacingSummary:{ title:"Read-Only Comparison Board", resultLabel:"Read-Only Comparison Board 已准备", redacted:true }, redacted:true },
    resultTrustBadgePanelSummary:{ status:"ready", userFacingSummary:{ title:"Result Trust Badge", resultLabel:"Result Trust Badge 已准备", redacted:true }, redacted:true },
    categoryResultSimulatorStatus:"ready",
    readOnlyComparisonBoardStatus:"ready",
    resultTrustBadgePanelStatus:"ready",
    safeToProceedWithManualComparisonReview:true
  });
  assert.equal(publicBetaComparisonReady.safetyReport.categoryResultSimulatorSummary.userFacingSummary.title, "Category Result Simulator");
  assert.equal(publicBetaComparisonReady.safetyReport.readOnlyComparisonBoardSummary.userFacingSummary.title, "Read-Only Comparison Board");
  assert.equal(publicBetaComparisonReady.safetyReport.resultTrustBadgePanelSummary.userFacingSummary.title, "Result Trust Badge");
  const publicBetaRcReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicBetaRcConsoleSummary:{ status:"manual_review_required", rcStatus:"manual_review_required", userFacingSummary:{ title:"Public Beta RC Console", resultLabel:"Public Beta RC Console 进入人工复核", redacted:true }, redacted:true },
    offlineTrialReleaseGateSummary:{ status:"ready", userFacingSummary:{ title:"Offline Trial Release Gate", resultLabel:"Offline Trial Release Gate 已准备", redacted:true }, redacted:true },
    publicBetaRcViewModelSummary:{ status:"ready", title:"Public Beta RC Console", userFacingSummary:{ title:"Public Beta RC Console", resultLabel:"Public Beta RC Console / Offline Trial Release Gate 已准备", redacted:true }, safeToProceedWithManualRcReview:true, redacted:true },
    publicBetaRcConsoleStatus:"manual_review_required",
    offlineTrialReleaseGateStatus:"ready",
    publicBetaRcViewModelStatus:"ready",
    safeToProceedWithManualRcReview:true
  });
  assert.equal(publicBetaRcReady.safetyReport.publicBetaRcConsoleSummary.userFacingSummary.title, "Public Beta RC Console");
  assert.equal(publicBetaRcReady.safetyReport.offlineTrialReleaseGateSummary.userFacingSummary.title, "Offline Trial Release Gate");
  assert.equal(publicBetaRcReady.safetyReport.publicBetaRcViewModelSummary.title, "Public Beta RC Console");
  assert.equal(publicBetaRcReady.safetyReport.publicBetaRcConsoleStatus, "manual_review_required");
  assert.equal(publicBetaRcReady.safetyReport.offlineTrialReleaseGateStatus, "ready");
  assert.equal(publicBetaRcReady.safetyReport.publicBetaRcViewModelStatus, "ready");
  assert.equal(publicBetaRcReady.userFacingSummary.safeToProceedWithManualRcReview, true);
  const publicBetaStabilityReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicBetaStabilityAuditSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Stability Audit", resultLabel:"Public Beta Stability Audit 已准备", redacted:true }, knownWarnings:["既有 secret scan WARN 仅作为已知警告展示"], redacted:true },
    manualLaunchHandoffPackSummary:{ status:"ready", userFacingSummary:{ title:"Manual Launch Handoff Pack", resultLabel:"Manual Launch Handoff Pack 已准备", redacted:true }, nextDecisionOptions:["manual_review_required", "continue_testing"], redacted:true },
    manualLaunchHandoffViewModelSummary:{ status:"ready", userFacingSummary:{ title:"Manual Launch Handoff Review", resultLabel:"Public Beta Stability Audit / Manual Launch Handoff Pack 已准备", redacted:true }, safeToProceedWithManualLaunchHandoffReview:true, redacted:true },
    publicBetaStabilityAuditStatus:"ready",
    manualLaunchHandoffPackStatus:"ready",
    manualLaunchHandoffViewModelStatus:"ready",
    safeToProceedWithManualLaunchHandoffReview:true
  });
  assert.equal(publicBetaStabilityReady.safetyReport.publicBetaStabilityAuditSummary.userFacingSummary.title, "Public Beta Stability Audit");
  assert.equal(publicBetaStabilityReady.safetyReport.manualLaunchHandoffPackSummary.userFacingSummary.title, "Manual Launch Handoff Pack");
  assert.equal(publicBetaStabilityReady.safetyReport.manualLaunchHandoffViewModelSummary.userFacingSummary.resultLabel, "Public Beta Stability Audit / Manual Launch Handoff Pack 已准备");
  assert.equal(publicBetaStabilityReady.safetyReport.publicBetaStabilityAuditStatus, "ready");
  assert.equal(publicBetaStabilityReady.safetyReport.manualLaunchHandoffPackStatus, "ready");
  assert.equal(publicBetaStabilityReady.safetyReport.manualLaunchHandoffViewModelStatus, "ready");
  assert.equal(publicBetaStabilityReady.userFacingSummary.safeToProceedWithManualLaunchHandoffReview, true);
  const publicBetaManualQaReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicBetaManualQaReportCenterSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Manual QA Report Center", resultLabel:"Public Beta Manual QA Report Center 已准备", redacted:true }, redacted:true },
    trialFeedbackSafetyGateSummary:{ status:"ready", userFacingSummary:{ title:"Trial Feedback Safety Gate", resultLabel:"Trial Feedback Safety Gate 已准备", redacted:true }, redacted:true },
    publicBetaRcEvidenceSnapshotSummary:{ status:"ready", userFacingSummary:{ title:"RC Evidence Snapshot", resultLabel:"RC Evidence Snapshot 已准备", redacted:true }, redacted:true },
    publicBetaManualQaViewModelSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Manual QA ViewModel", resultLabel:"Public Beta Manual QA Report Center / Trial Feedback Safety Gate / RC Evidence Snapshot 已准备", redacted:true }, safeToProceedWithManualQaReview:true, redacted:true },
    publicBetaManualQaReportCenterStatus:"ready",
    trialFeedbackSafetyGateStatus:"ready",
    publicBetaRcEvidenceSnapshotStatus:"ready",
    publicBetaManualQaViewModelStatus:"ready",
    safeToProceedWithManualQaReview:true
  });
  assert.equal(publicBetaManualQaReady.safetyReport.publicBetaManualQaReportCenterSummary.userFacingSummary.title, "Public Beta Manual QA Report Center");
  assert.equal(publicBetaManualQaReady.safetyReport.trialFeedbackSafetyGateSummary.userFacingSummary.title, "Trial Feedback Safety Gate");
  assert.equal(publicBetaManualQaReady.safetyReport.publicBetaRcEvidenceSnapshotSummary.userFacingSummary.title, "RC Evidence Snapshot");
  assert.equal(publicBetaManualQaReady.safetyReport.publicBetaManualQaViewModelSummary.userFacingSummary.resultLabel, "Public Beta Manual QA Report Center / Trial Feedback Safety Gate / RC Evidence Snapshot 已准备");
  assert.equal(publicBetaManualQaReady.safetyReport.publicBetaManualQaReportCenterStatus, "ready");
  assert.equal(publicBetaManualQaReady.safetyReport.trialFeedbackSafetyGateStatus, "ready");
  assert.equal(publicBetaManualQaReady.safetyReport.publicBetaRcEvidenceSnapshotStatus, "ready");
  assert.equal(publicBetaManualQaReady.safetyReport.publicBetaManualQaViewModelStatus, "ready");
  assert.equal(publicBetaManualQaReady.userFacingSummary.safeToProceedWithManualQaReview, true);
  const acceptanceSnapshotReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicBetaFreezeEvidenceSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Freeze Evidence Summary", resultLabel:"Public Beta Freeze Evidence Summary 已准备", redacted:true }, redacted:true },
    manualTrialIssueReviewBoardSummary:{ status:"ready", userFacingSummary:{ title:"Manual Trial Issue Review Board", resultLabel:"Manual Trial Issue Review Board 已准备", redacted:true }, redacted:true },
    offlineAcceptanceSnapshotSummary:{ status:"needs_review", userFacingSummary:{ title:"Offline Acceptance Snapshot", resultLabel:"Offline Acceptance Snapshot 仍需复核", redacted:true }, redacted:true },
    publicBetaAcceptanceSnapshotViewModelSummary:{ status:"needs_review", userFacingSummary:{ title:"Public Beta Acceptance Snapshot View Model", resultLabel:"Public Beta Acceptance Snapshot View Model 仍需复核", redacted:true }, safeToProceedWithManualAcceptanceSnapshotReview:false, redacted:true },
    publicBetaAcceptanceReviewConsoleSummary:{ status:"manual_review_required", userFacingSummary:{ title:"Public Beta Acceptance Review Console", resultLabel:"Public Beta Acceptance Review Console 需人工复核", redacted:true }, redacted:true },
    offlineTrialClosureBoardSummary:{ status:"manual_review_required", userFacingSummary:{ title:"Offline Trial Closure Board", resultLabel:"Offline Trial Closure Board 需人工复核", redacted:true }, redacted:true },
    noLaunchAssuranceGateSummary:{ status:"ready", userFacingSummary:{ title:"No-Launch Assurance Gate", resultLabel:"No-Launch Assurance Gate 已准备", redacted:true }, redacted:true },
    publicBetaClosureReviewViewModelSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Closure Review View Model", resultLabel:"Public Beta Closure Review View Model 已准备", redacted:true }, safeToProceedWithManualClosureReview:true, redacted:true },
    publicBetaFreezeEvidenceStatus:"ready",
    manualTrialIssueReviewStatus:"ready",
    offlineAcceptanceSnapshotStatus:"needs_review",
    publicBetaAcceptanceSnapshotViewModelStatus:"needs_review",
    publicBetaAcceptanceReviewConsoleStatus:"manual_review_required",
    offlineTrialClosureBoardStatus:"manual_review_required",
    noLaunchAssuranceGateStatus:"ready",
    publicBetaClosureReviewViewModelStatus:"ready",
    safeToProceedWithManualAcceptanceSnapshotReview:false,
    safeToProceedWithManualClosureReview:true
  });
  assert.equal(acceptanceSnapshotReady.safetyReport.publicBetaFreezeEvidenceSummary.title, "Public Beta Freeze Evidence Summary");
  assert.equal(acceptanceSnapshotReady.safetyReport.manualTrialIssueReviewBoardSummary.title, "Manual Trial Issue Review Board");
  assert.equal(acceptanceSnapshotReady.safetyReport.offlineAcceptanceSnapshotSummary.title, "Offline Acceptance Snapshot");
  assert.equal(acceptanceSnapshotReady.safetyReport.publicBetaAcceptanceSnapshotViewModelSummary.line, "Public Beta Acceptance Snapshot View Model 仍需复核");
  assert.equal(acceptanceSnapshotReady.safetyReport.publicBetaAcceptanceReviewConsoleSummary.title, "Public Beta Acceptance Review Console");
  assert.equal(acceptanceSnapshotReady.safetyReport.offlineTrialClosureBoardSummary.title, "Offline Trial Closure Board");
  assert.equal(acceptanceSnapshotReady.safetyReport.noLaunchAssuranceGateSummary.title, "No-Launch Assurance Gate");
  assert.equal(acceptanceSnapshotReady.safetyReport.publicBetaClosureReviewViewModelSummary.line, "Public Beta Closure Review View Model 已准备");
  assert.equal(acceptanceSnapshotReady.safetyReport.publicBetaFreezeEvidenceStatus, "ready");
  assert.equal(acceptanceSnapshotReady.safetyReport.manualTrialIssueReviewStatus, "ready");
  assert.equal(acceptanceSnapshotReady.safetyReport.offlineAcceptanceSnapshotStatus, "needs_review");
  assert.equal(acceptanceSnapshotReady.safetyReport.publicBetaAcceptanceSnapshotViewModelStatus, "needs_review");
  assert.equal(acceptanceSnapshotReady.safetyReport.publicBetaAcceptanceReviewConsoleStatus, "manual_review_required");
  assert.equal(acceptanceSnapshotReady.safetyReport.offlineTrialClosureBoardStatus, "manual_review_required");
  assert.equal(acceptanceSnapshotReady.safetyReport.noLaunchAssuranceGateStatus, "ready");
  assert.equal(acceptanceSnapshotReady.safetyReport.publicBetaClosureReviewViewModelStatus, "ready");
  assert.equal(acceptanceSnapshotReady.userFacingSummary.safeToProceedWithManualAcceptanceSnapshotReview, false);
  assert.equal(acceptanceSnapshotReady.userFacingSummary.safeToProceedWithManualClosureReview, true);
  const closureArchiveReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicBetaClosureEvidenceArchiveSummary:{ status:"manual_review_required", archiveStatus:"manual_review_required", userFacingSummary:{ title:"Public Beta Closure Evidence Archive", resultLabel:"Public Beta Closure Evidence Archive 需人工复核", redacted:true }, redacted:true },
    manualTrialExitCriteriaSummary:{ status:"manual_review_required", exitCriteriaStatus:"manual_review_required", userFacingSummary:{ title:"Manual Trial Exit Criteria", resultLabel:"Manual Trial Exit Criteria 需人工复核", redacted:true }, redacted:true },
    offlineNextStepPlanningBoardSummary:{ status:"manual_review_required", planningStatus:"manual_review_required", userFacingSummary:{ title:"Offline Next-Step Planning Board", resultLabel:"Offline Next-Step Planning Board 需人工复核", redacted:true }, redacted:true },
    publicBetaNextStepViewModelSummary:{ status:"ready", title:"Public Beta Next-Step ViewModel", userFacingSummary:{ title:"Public Beta Next-Step ViewModel", resultLabel:"Public Beta Closure Evidence Archive / Manual Trial Exit Criteria / Offline Next-Step Planning Board 已准备", redacted:true }, safeToProceedWithManualNextStepReview:true, redacted:true },
    publicBetaFinalReadinessCommandCenterSummary:{ status:"manual_review_required", finalReadinessStatus:"manual_review_required", userFacingSummary:{ title:"Public Beta Final Readiness Command Center", resultLabel:"Public Beta Final Readiness Command Center 需人工复核", redacted:true }, redacted:true },
    offlineLaunchBlockerMatrixSummary:{ status:"blocked", blockerMatrixStatus:"blocked", userFacingSummary:{ title:"Offline Launch Blocker Matrix", resultLabel:"Offline Launch Blocker Matrix 已保持阻断", redacted:true }, redacted:true },
    manualNextPhaseDossierSummary:{ status:"manual_review_required", dossierStatus:"manual_review_required", userFacingSummary:{ title:"Manual Next-Phase Dossier", resultLabel:"Manual Next-Phase Dossier 需人工复核", redacted:true }, redacted:true },
    publicBetaFinalReadinessViewModelSummary:{ status:"ready", title:"Public Beta Final Readiness ViewModel", userFacingSummary:{ title:"Public Beta Final Readiness ViewModel", resultLabel:"Public Beta Final Readiness ViewModel 已准备", redacted:true }, safeToProceedWithManualFinalReadinessReview:true, redacted:true },
    publicBetaCandidateLockSummary:{ status:"manual_review_required", candidateLockStatus:"manual_review_required", userFacingSummary:{ title:"Public Beta Candidate Lock", resultLabel:"Public Beta Candidate Lock 需人工复核", redacted:true }, redacted:true },
    finalTrialHandoffConsoleSummary:{ status:"manual_review_required", handoffStatus:"manual_review_required", userFacingSummary:{ title:"Final Trial Handoff Console", resultLabel:"Final Trial Handoff Console 需人工复核", redacted:true }, redacted:true },
    noProviderProductionBoundarySummary:{ status:"manual_review_required", boundaryStatus:"manual_review_required", userFacingSummary:{ title:"No-Provider Production Boundary", resultLabel:"No-Provider Production Boundary 需人工复核", redacted:true }, redacted:true },
    publicBetaCandidateViewModelSummary:{ status:"ready", title:"Public Beta Candidate ViewModel", userFacingSummary:{ title:"Public Beta Candidate ViewModel", resultLabel:"Public Beta Candidate ViewModel 已准备", redacted:true }, safeToProceedWithManualCandidateReview:true, redacted:true },
    publicBetaCandidateEvidenceReviewSummary:{ status:"manual_review_required", evidenceReviewStatus:"manual_review_required", userFacingSummary:{ title:"Public Beta Candidate Evidence Review", resultLabel:"Public Beta Candidate Evidence Review 需人工复核", redacted:true }, redacted:true },
    trialOperatorNotesPanelSummary:{ status:"manual_review_required", notesStatus:"manual_review_required", userFacingSummary:{ title:"Trial Operator Notes Panel", resultLabel:"Trial Operator Notes Panel 需人工复核", redacted:true }, redacted:true },
    offlineSafetyDeltaBoardSummary:{ status:"manual_review_required", deltaStatus:"manual_review_required", userFacingSummary:{ title:"Offline Safety Delta Board", resultLabel:"Offline Safety Delta Board 需人工复核", redacted:true }, redacted:true },
    publicBetaCandidateReviewViewModelSummary:{ status:"ready", title:"Public Beta Candidate Review ViewModel", userFacingSummary:{ title:"Public Beta Candidate Review ViewModel", resultLabel:"Public Beta Candidate Evidence Review / Trial Operator Notes Panel / Offline Safety Delta Board 已准备", redacted:true }, safeToProceedWithManualCandidateEvidenceReview:true, redacted:true },
    publicBetaClosureEvidenceArchiveStatus:"manual_review_required",
    manualTrialExitCriteriaStatus:"manual_review_required",
    offlineNextStepPlanningStatus:"manual_review_required",
    publicBetaNextStepViewModelStatus:"ready",
    publicBetaFinalReadinessCommandCenterStatus:"manual_review_required",
    offlineLaunchBlockerMatrixStatus:"blocked",
    manualNextPhaseDossierStatus:"manual_review_required",
    publicBetaFinalReadinessViewModelStatus:"ready",
    publicBetaCandidateLockStatus:"manual_review_required",
    finalTrialHandoffStatus:"manual_review_required",
    noProviderProductionBoundaryStatus:"manual_review_required",
    publicBetaCandidateViewModelStatus:"ready",
    publicBetaCandidateEvidenceReviewStatus:"manual_review_required",
    trialOperatorNotesStatus:"manual_review_required",
    offlineSafetyDeltaStatus:"manual_review_required",
    publicBetaCandidateReviewViewModelStatus:"ready",
    safeToProceedWithManualNextStepReview:true,
    safeToProceedWithManualCandidateReview:true,
    safeToProceedWithManualCandidateEvidenceReview:true
  });
  assert.equal(closureArchiveReady.safetyReport.publicBetaClosureEvidenceArchiveSummary.title, "Public Beta Closure Evidence Archive");
  assert.equal(closureArchiveReady.safetyReport.manualTrialExitCriteriaSummary.title, "Manual Trial Exit Criteria");
  assert.equal(closureArchiveReady.safetyReport.offlineNextStepPlanningBoardSummary.title, "Offline Next-Step Planning Board");
  assert.equal(closureArchiveReady.safetyReport.publicBetaNextStepViewModelSummary.title, "Public Beta Next-Step ViewModel");
  assert.equal(closureArchiveReady.safetyReport.publicBetaFinalReadinessCommandCenterSummary.title, "Public Beta Final Readiness Command Center");
  assert.equal(closureArchiveReady.safetyReport.offlineLaunchBlockerMatrixSummary.title, "Offline Launch Blocker Matrix");
  assert.equal(closureArchiveReady.safetyReport.manualNextPhaseDossierSummary.title, "Manual Next-Phase Dossier");
  assert.equal(closureArchiveReady.safetyReport.publicBetaFinalReadinessViewModelSummary.title, "Public Beta Final Readiness ViewModel");
  assert.equal(closureArchiveReady.safetyReport.publicBetaCandidateLockSummary.title, "Public Beta Candidate Lock");
  assert.equal(closureArchiveReady.safetyReport.finalTrialHandoffConsoleSummary.title, "Final Trial Handoff Console");
  assert.equal(closureArchiveReady.safetyReport.noProviderProductionBoundarySummary.title, "No-Provider Production Boundary");
  assert.equal(closureArchiveReady.safetyReport.publicBetaCandidateViewModelSummary.title, "Public Beta Candidate ViewModel");
  assert.equal(closureArchiveReady.safetyReport.publicBetaCandidateEvidenceReviewSummary.title, "Public Beta Candidate Evidence Review");
  assert.equal(closureArchiveReady.safetyReport.trialOperatorNotesPanelSummary.title, "Trial Operator Notes Panel");
  assert.equal(closureArchiveReady.safetyReport.offlineSafetyDeltaBoardSummary.title, "Offline Safety Delta Board");
  assert.equal(closureArchiveReady.safetyReport.publicBetaCandidateReviewViewModelSummary.title, "Public Beta Candidate Review ViewModel");
  assert.equal(closureArchiveReady.safetyReport.publicBetaClosureEvidenceArchiveStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.manualTrialExitCriteriaStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.offlineNextStepPlanningStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.publicBetaNextStepViewModelStatus, "ready");
  assert.equal(closureArchiveReady.safetyReport.publicBetaFinalReadinessCommandCenterStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.offlineLaunchBlockerMatrixStatus, "blocked");
  assert.equal(closureArchiveReady.safetyReport.manualNextPhaseDossierStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.publicBetaFinalReadinessViewModelStatus, "ready");
  assert.equal(closureArchiveReady.safetyReport.publicBetaCandidateLockStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.finalTrialHandoffStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.noProviderProductionBoundaryStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.publicBetaCandidateViewModelStatus, "ready");
  assert.equal(closureArchiveReady.safetyReport.publicBetaCandidateEvidenceReviewStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.trialOperatorNotesStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.offlineSafetyDeltaStatus, "manual_review_required");
  assert.equal(closureArchiveReady.safetyReport.publicBetaCandidateReviewViewModelStatus, "ready");
  assert.equal(closureArchiveReady.userFacingSummary.safeToProceedWithManualNextStepReview, true);
  assert.equal(closureArchiveReady.userFacingSummary.safeToProceedWithManualCandidateReview, true);
  assert.equal(closureArchiveReady.userFacingSummary.safeToProceedWithManualCandidateEvidenceReview, true);
  const qaFreezeReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicBetaCandidateQaFreezeSummary:{ status:"manual_review_required", qaFreezeStatus:"manual_review_required", userFacingSummary:{ title:"Public Beta Candidate QA Freeze", resultLabel:"Public Beta Candidate QA Freeze 需人工复核", redacted:true }, redacted:true },
    trialFeedbackIntakeMockSummary:{ status:"manual_review_required", intakeStatus:"manual_review_required", userFacingSummary:{ title:"Trial Feedback Intake Mock", resultLabel:"Trial Feedback Intake Mock 需人工复核", redacted:true }, redacted:true },
    offlineRegressionEvidenceBoardSummary:{ status:"manual_review_required", regressionEvidenceStatus:"manual_review_required", userFacingSummary:{ title:"Offline Regression Evidence Board", resultLabel:"Offline Regression Evidence Board 需人工复核", redacted:true }, redacted:true },
    publicBetaQaFreezeViewModelSummary:{ status:"ready", title:"Public Beta QA Freeze ViewModel", userFacingSummary:{ title:"Public Beta QA Freeze ViewModel", resultLabel:"Public Beta Candidate QA Freeze / Trial Feedback Intake Mock / Offline Regression Evidence Board 已准备", redacted:true }, safeToProceedWithManualQaFreezeReview:true, redacted:true },
    publicBetaCandidateQaFreezeStatus:"manual_review_required",
    trialFeedbackIntakeStatus:"manual_review_required",
    offlineRegressionEvidenceStatus:"manual_review_required",
    publicBetaQaFreezeViewModelStatus:"ready",
    safeToProceedWithManualQaFreezeReview:true
  });
  assert.equal(qaFreezeReady.userFacingSummary.publicBetaCandidateQaFreezeSummary.title, "Public Beta Candidate QA Freeze");
  assert.equal(qaFreezeReady.userFacingSummary.trialFeedbackIntakeMockSummary.title, "Trial Feedback Intake Mock");
  assert.equal(qaFreezeReady.userFacingSummary.offlineRegressionEvidenceBoardSummary.title, "Offline Regression Evidence Board");
  assert.equal(qaFreezeReady.userFacingSummary.publicBetaQaFreezeViewModelSummary.title, "Public Beta QA Freeze ViewModel");
  assert.equal(qaFreezeReady.userFacingSummary.publicBetaCandidateQaFreezeStatus, "manual_review_required");
  assert.equal(qaFreezeReady.userFacingSummary.trialFeedbackIntakeStatus, "manual_review_required");
  assert.equal(qaFreezeReady.userFacingSummary.offlineRegressionEvidenceStatus, "manual_review_required");
  assert.equal(qaFreezeReady.userFacingSummary.publicBetaQaFreezeViewModelStatus, "ready");
  assert.equal(qaFreezeReady.userFacingSummary.safeToProceedWithManualQaFreezeReview, true);
  const sandboxMilestoneReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    providerSandboxReadinessWorkbenchSummary:{ status:"ready", userFacingSummary:{ title:"Provider Sandbox Readiness Workbench", resultLabel:"Sandbox Readiness Workbench 已准备", redacted:true }, redacted:true },
    offlineProviderScenarioLabSummary:{ status:"ready", userFacingSummary:{ title:"Offline Provider Scenario Lab", resultLabel:"离线场景实验室已准备", redacted:true }, redacted:true },
    readOnlyProviderAdapterSdkSkeletonSummary:{ status:"ready", userFacingSummary:{ title:"Read-Only Provider Adapter SDK Skeleton", resultLabel:"只读 Adapter SDK 骨架已准备", redacted:true }, redacted:true },
    manualActivationCommandCenterSummary:{ status:"ready", userFacingSummary:{ title:"Manual Activation Command Center", resultLabel:"人工激活指挥中心已准备", redacted:true }, redacted:true },
    providerSandboxMilestoneViewModelSummary:{ status:"ready", title:"Provider Sandbox 里程碑工作台", redacted:true },
    providerSandboxReadinessWorkbenchStatus:"ready",
    offlineProviderScenarioLabStatus:"ready",
    readOnlyProviderAdapterSdkSkeletonStatus:"ready",
    manualActivationCommandCenterStatus:"ready",
    providerSandboxMilestoneViewModelStatus:"ready",
    safeToProceedWithHumanSandboxMilestoneReview:true
  });
  assert.equal(sandboxMilestoneReady.safetyReport.providerSandboxReadinessWorkbenchSummary.userFacingSummary.title, "Provider Sandbox Readiness Workbench");
  assert.equal(sandboxMilestoneReady.safetyReport.offlineProviderScenarioLabSummary.userFacingSummary.title, "Offline Provider Scenario Lab");
  assert.equal(sandboxMilestoneReady.safetyReport.readOnlyProviderAdapterSdkSkeletonSummary.userFacingSummary.title, "Read-Only Provider Adapter SDK Skeleton");
  assert.equal(sandboxMilestoneReady.safetyReport.manualActivationCommandCenterSummary.userFacingSummary.title, "Manual Activation Command Center");
  assert.equal(sandboxMilestoneReady.safetyReport.providerSandboxMilestoneViewModelSummary.title, "Provider Sandbox 里程碑工作台");
  assert.equal(sandboxMilestoneReady.safetyReport.providerSandboxReadinessWorkbenchStatus, "ready");
  assert.equal(sandboxMilestoneReady.safetyReport.offlineProviderScenarioLabStatus, "ready");
  assert.equal(sandboxMilestoneReady.safetyReport.readOnlyProviderAdapterSdkSkeletonStatus, "ready");
  assert.equal(sandboxMilestoneReady.safetyReport.manualActivationCommandCenterStatus, "ready");
  assert.equal(sandboxMilestoneReady.safetyReport.providerSandboxMilestoneViewModelStatus, "ready");
  assert.equal(sandboxMilestoneReady.userFacingSummary.safeToProceedWithHumanSandboxMilestoneReview, true);
  const offlineLaunchReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    offlineLaunchDecisionSimulatorSummary:{ status:"ready", userFacingSummary:{ title:"Offline Launch Decision Simulator", resultLabel:"离线发布决策模拟器已准备", redacted:true }, redacted:true },
    sandboxActivationReceiptLedgerSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Activation Receipt Ledger", resultLabel:"Sandbox 激活回执台账已准备", redacted:true }, redacted:true },
    adapterSecurityRegressionGuardSummary:{ status:"ready", userFacingSummary:{ title:"Adapter Security Regression Guard", resultLabel:"Adapter 安全回归守卫已准备", redacted:true }, redacted:true },
    providerOfflineLaunchChecklistSummary:{ status:"ready", userFacingSummary:{ title:"Provider Offline Launch Checklist", resultLabel:"离线 Launch Checklist 已准备", redacted:true }, redacted:true },
    providerOfflineLaunchViewModelSummary:{ status:"ready", title:"Provider 离线 Launch 决策与安全守卫", redacted:true },
    offlineLaunchDecisionSimulatorStatus:"ready",
    sandboxActivationReceiptLedgerStatus:"ready",
    adapterSecurityRegressionGuardStatus:"ready",
    providerOfflineLaunchChecklistStatus:"ready",
    providerOfflineLaunchViewModelStatus:"ready",
    safeToProceedWithManualOfflineLaunchDecisionReview:true
  });
  assert.equal(offlineLaunchReady.safetyReport.offlineLaunchDecisionSimulatorSummary.userFacingSummary.title, "Offline Launch Decision Simulator");
  assert.equal(offlineLaunchReady.safetyReport.sandboxActivationReceiptLedgerSummary.userFacingSummary.title, "Sandbox Activation Receipt Ledger");
  assert.equal(offlineLaunchReady.safetyReport.adapterSecurityRegressionGuardSummary.userFacingSummary.title, "Adapter Security Regression Guard");
  assert.equal(offlineLaunchReady.safetyReport.providerOfflineLaunchChecklistSummary.userFacingSummary.title, "Provider Offline Launch Checklist");
  assert.equal(offlineLaunchReady.safetyReport.providerOfflineLaunchViewModelSummary.title, "Provider 离线 Launch 决策与安全守卫");
  assert.equal(offlineLaunchReady.safetyReport.offlineLaunchDecisionSimulatorStatus, "ready");
  assert.equal(offlineLaunchReady.safetyReport.sandboxActivationReceiptLedgerStatus, "ready");
  assert.equal(offlineLaunchReady.safetyReport.adapterSecurityRegressionGuardStatus, "ready");
  assert.equal(offlineLaunchReady.safetyReport.providerOfflineLaunchChecklistStatus, "ready");
  assert.equal(offlineLaunchReady.safetyReport.providerOfflineLaunchViewModelStatus, "ready");
  assert.equal(offlineLaunchReady.userFacingSummary.safeToProceedWithManualOfflineLaunchDecisionReview, true);
  const launchControlReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    offlineProviderLaunchControlTowerSummary:{ status:"ready", userFacingSummary:{ title:"Offline Provider Launch Control Tower", resultLabel:"离线 Launch 控制塔已准备", redacted:true }, redacted:true },
    adapterPolicyEngineSummary:{ status:"ready", userFacingSummary:{ title:"Adapter Policy Engine", resultLabel:"Adapter 策略引擎已准备", redacted:true }, redacted:true },
    humanReleaseEvidenceTimelineSummary:{ status:"ready", userFacingSummary:{ title:"Human Release Evidence Timeline", resultLabel:"人工发布证据时间线已准备", redacted:true }, redacted:true },
    sandboxActivationFinalReviewBoardSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Activation Final Review Board", resultLabel:"Sandbox 激活终审板已准备", redacted:true }, redacted:true },
    providerLaunchControlViewModelSummary:{ status:"ready", title:"Provider Launch Control Tower", redacted:true },
    offlineProviderLaunchControlTowerStatus:"ready",
    adapterPolicyEngineStatus:"ready",
    humanReleaseEvidenceTimelineStatus:"ready",
    sandboxActivationFinalReviewBoardStatus:"ready",
    providerLaunchControlViewModelStatus:"ready",
    safeToProceedWithHumanLaunchControlReview:true
  });
  assert.equal(launchControlReady.safetyReport.offlineProviderLaunchControlTowerSummary.userFacingSummary.title, "Offline Provider Launch Control Tower");
  assert.equal(launchControlReady.safetyReport.adapterPolicyEngineSummary.userFacingSummary.title, "Adapter Policy Engine");
  assert.equal(launchControlReady.safetyReport.humanReleaseEvidenceTimelineSummary.userFacingSummary.title, "Human Release Evidence Timeline");
  assert.equal(launchControlReady.safetyReport.sandboxActivationFinalReviewBoardSummary.userFacingSummary.title, "Sandbox Activation Final Review Board");
  assert.equal(launchControlReady.safetyReport.providerLaunchControlViewModelSummary.title, "Provider Launch Control Tower");
  assert.equal(launchControlReady.safetyReport.offlineProviderLaunchControlTowerStatus, "ready");
  assert.equal(launchControlReady.safetyReport.adapterPolicyEngineStatus, "ready");
  assert.equal(launchControlReady.safetyReport.humanReleaseEvidenceTimelineStatus, "ready");
  assert.equal(launchControlReady.safetyReport.sandboxActivationFinalReviewBoardStatus, "ready");
  assert.equal(launchControlReady.safetyReport.providerLaunchControlViewModelStatus, "ready");
  assert.equal(launchControlReady.userFacingSummary.safeToProceedWithHumanLaunchControlReview, true);
  const providerManualReleaseReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    manualGovernanceReleaseDecisionRoomSummary:{ status:"ready", userFacingSummary:{ title:"Manual Governance Release 决策室", resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true },
    sandboxPilotExceptionRegisterSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Pilot 例外登记簿", resultLabel:"例外登记簿已准备", redacted:true }, redacted:true },
    providerReadinessSignOffPacketSummary:{ status:"ready", userFacingSummary:{ title:"Provider 准备签核包", resultLabel:"准备签核包已准备", redacted:true }, redacted:true },
    providerManualReleaseViewModelSummary:{ status:"ready", title:"Provider 人工发布决策与签核", redacted:true },
    manualGovernanceReleaseDecisionRoomStatus:"ready",
    sandboxPilotExceptionRegisterStatus:"ready",
    providerReadinessSignOffPacketStatus:"ready",
    providerManualReleaseViewModelStatus:"ready",
    safeToProceedWithManualProviderSignOffReview:false
  });
  assert.equal(providerManualReleaseReady.userFacingSummary.manualGovernanceReleaseDecisionRoomSummary.title, "Manual Governance Release 决策室");
  assert.equal(providerManualReleaseReady.userFacingSummary.sandboxPilotExceptionRegisterSummary.title, "Sandbox Pilot 例外登记簿");
  assert.equal(providerManualReleaseReady.userFacingSummary.providerReadinessSignOffPacketSummary.title, "Provider 准备签核包");
  assert.equal(providerManualReleaseReady.userFacingSummary.providerManualReleaseViewModelSummary.title, "Provider 人工发布决策与签核");
  const governanceClosureReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    offlineProviderGovernanceClosureBoardSummary:{ status:"ready", userFacingSummary:{ title:"Offline Provider Governance Closure Board", resultLabel:"Offline Provider Governance Closure Board 已准备", redacted:true }, redacted:true },
    noActivationComplianceSealSummary:{ status:"ready", userFacingSummary:{ title:"No-Activation Compliance Seal", resultLabel:"No-Activation Compliance Seal 已准备", redacted:true }, redacted:true },
    finalReadinessHandoffSimulatorSummary:{ status:"ready", userFacingSummary:{ title:"Final Readiness Handoff Simulator", resultLabel:"Final Readiness Handoff Simulator 已准备", redacted:true }, redacted:true },
    providerGovernanceClosureEvidenceLedgerSummary:{ status:"ready", userFacingSummary:{ title:"Provider Governance Closure Evidence Ledger", resultLabel:"Provider Governance Closure Evidence Ledger 已准备", redacted:true }, redacted:true },
    providerGovernanceClosureViewModelSummary:{ status:"ready", title:"Provider Governance Closure Review", redacted:true },
    offlineProviderGovernanceClosureBoardStatus:"ready",
    noActivationComplianceSealStatus:"ready",
    finalReadinessHandoffSimulatorStatus:"ready",
    providerGovernanceClosureEvidenceLedgerStatus:"ready",
    providerGovernanceClosureViewModelStatus:"ready",
    safeToProceedWithHumanGovernanceClosureReview:true
  });
  assert.equal(governanceClosureReady.safetyReport.offlineProviderGovernanceClosureBoardSummary.userFacingSummary.title, "Offline Provider Governance Closure Board");
  assert.equal(governanceClosureReady.safetyReport.noActivationComplianceSealSummary.userFacingSummary.title, "No-Activation Compliance Seal");
  assert.equal(governanceClosureReady.safetyReport.finalReadinessHandoffSimulatorSummary.userFacingSummary.title, "Final Readiness Handoff Simulator");
  assert.equal(governanceClosureReady.safetyReport.providerGovernanceClosureEvidenceLedgerSummary.userFacingSummary.title, "Provider Governance Closure Evidence Ledger");
  assert.equal(governanceClosureReady.safetyReport.providerGovernanceClosureViewModelSummary.title, "Provider Governance Closure Review");
  assert.equal(governanceClosureReady.safetyReport.offlineProviderGovernanceClosureBoardStatus, "ready");
  assert.equal(governanceClosureReady.safetyReport.noActivationComplianceSealStatus, "ready");
  assert.equal(governanceClosureReady.safetyReport.finalReadinessHandoffSimulatorStatus, "ready");
  assert.equal(governanceClosureReady.safetyReport.providerGovernanceClosureEvidenceLedgerStatus, "ready");
  assert.equal(governanceClosureReady.safetyReport.providerGovernanceClosureViewModelStatus, "ready");
  assert.equal(governanceClosureReady.safetyReport.safeToProceedWithHumanGovernanceClosureReview, true);
  const distributionReadinessReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    offlineDistributionReadinessCenterSummary:{ status:"ready", userFacingSummary:{ title:"Offline Distribution Readiness Center", resultLabel:"Offline Distribution Readiness Center 已准备", redacted:true }, redacted:true },
    noActivationEnforcementLedgerSummary:{ status:"ready", userFacingSummary:{ title:"No-Activation Enforcement Ledger", resultLabel:"No-Activation Enforcement Ledger 已准备", redacted:true }, redacted:true },
    finalUserTrustSummarySummary:{ status:"ready", userFacingSummary:{ title:"Final User Trust Summary", resultLabel:"Final User Trust Summary 已准备", redacted:true }, redacted:true },
    providerSafetyDistributionMatrixSummary:{ status:"ready", userFacingSummary:{ title:"Provider Safety Distribution Matrix", resultLabel:"Provider Safety Distribution Matrix 已准备", redacted:true }, redacted:true },
    providerDistributionReadinessViewModelSummary:{ status:"ready", title:"Provider Distribution Readiness Review", redacted:true },
    offlineDistributionReadinessCenterStatus:"ready",
    noActivationEnforcementLedgerStatus:"ready",
    finalUserTrustSummaryStatus:"ready",
    providerSafetyDistributionMatrixStatus:"ready",
    providerDistributionReadinessViewModelStatus:"ready",
    safeToProceedWithHumanDistributionReadinessReview:true
  });
  assert.equal(distributionReadinessReady.safetyReport.offlineDistributionReadinessCenterSummary.userFacingSummary.title, "Offline Distribution Readiness Center");
  assert.equal(distributionReadinessReady.safetyReport.noActivationEnforcementLedgerSummary.userFacingSummary.title, "No-Activation Enforcement Ledger");
  assert.equal(distributionReadinessReady.safetyReport.finalUserTrustSummarySummary.userFacingSummary.title, "Final User Trust Summary");
  assert.equal(distributionReadinessReady.safetyReport.providerSafetyDistributionMatrixSummary.userFacingSummary.title, "Provider Safety Distribution Matrix");
  assert.equal(distributionReadinessReady.safetyReport.providerDistributionReadinessViewModelSummary.title, "Provider Distribution Readiness Review");
  assert.equal(distributionReadinessReady.safetyReport.offlineDistributionReadinessCenterStatus, "ready");
  assert.equal(distributionReadinessReady.safetyReport.noActivationEnforcementLedgerStatus, "ready");
  assert.equal(distributionReadinessReady.safetyReport.finalUserTrustSummaryStatus, "ready");
  assert.equal(distributionReadinessReady.safetyReport.providerSafetyDistributionMatrixStatus, "ready");
  assert.equal(distributionReadinessReady.safetyReport.providerDistributionReadinessViewModelStatus, "ready");
  assert.equal(distributionReadinessReady.safetyReport.safeToProceedWithHumanDistributionReadinessReview, true);
  const trustClosureReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    providerPublicTrustClosureCenterSummary:{ status:"ready", userFacingSummary:{ title:"Provider Public Trust Closure Center", resultLabel:"Provider Public Trust Closure Center 已准备", redacted:true }, redacted:true },
    offlineReleaseMemorySnapshotSummary:{ status:"ready", userFacingSummary:{ title:"Offline Release Memory Snapshot", resultLabel:"Offline Release Memory Snapshot 已准备", redacted:true }, redacted:true },
    noProviderExecutionFinalGuardSummary:{ status:"ready", userFacingSummary:{ title:"No-Provider-Execution Final Guard", resultLabel:"No-Provider-Execution Final Guard 已准备", redacted:true }, redacted:true },
    userVisibleSafetyBoundaryExplainerSummary:{ status:"ready", userFacingSummary:{ title:"User-Visible Safety Boundary Explainer", resultLabel:"User-Visible Safety Boundary Explainer 已准备", redacted:true }, redacted:true },
    providerTrustClosureViewModelSummary:{ status:"ready", title:"Provider Trust Closure Review", redacted:true },
    providerPublicTrustClosureCenterStatus:"ready",
    offlineReleaseMemorySnapshotStatus:"ready",
    noProviderExecutionFinalGuardStatus:"ready",
    userVisibleSafetyBoundaryExplainerStatus:"ready",
    providerTrustClosureViewModelStatus:"ready",
    safeToProceedWithHumanTrustClosureReview:true
  });
  assert.equal(trustClosureReady.safetyReport.providerPublicTrustClosureCenterSummary.userFacingSummary.title, "Provider Public Trust Closure Center");
  assert.equal(trustClosureReady.safetyReport.offlineReleaseMemorySnapshotSummary.userFacingSummary.title, "Offline Release Memory Snapshot");
  assert.equal(trustClosureReady.safetyReport.noProviderExecutionFinalGuardSummary.userFacingSummary.title, "No-Provider-Execution Final Guard");
  assert.equal(trustClosureReady.safetyReport.userVisibleSafetyBoundaryExplainerSummary.userFacingSummary.title, "User-Visible Safety Boundary Explainer");
  assert.equal(trustClosureReady.safetyReport.providerTrustClosureViewModelSummary.title, "Provider Trust Closure Review");
  assert.equal(trustClosureReady.safetyReport.providerPublicTrustClosureCenterStatus, "ready");
  assert.equal(trustClosureReady.safetyReport.offlineReleaseMemorySnapshotStatus, "ready");
  assert.equal(trustClosureReady.safetyReport.noProviderExecutionFinalGuardStatus, "ready");
  assert.equal(trustClosureReady.safetyReport.userVisibleSafetyBoundaryExplainerStatus, "ready");
  assert.equal(trustClosureReady.safetyReport.providerTrustClosureViewModelStatus, "ready");
  assert.equal(trustClosureReady.safetyReport.safeToProceedWithHumanTrustClosureReview, true);
  const launchReadinessFinalReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    publicReleaseEvidenceConsoleSummary:{ status:"ready", userFacingSummary:{ title:"Public Release Evidence Console", resultLabel:"Public Release Evidence Console 已准备", redacted:true }, redacted:true },
    noProviderUserAssurancePanelSummary:{ status:"ready", userFacingSummary:{ title:"No-Provider User Assurance Panel", resultLabel:"No-Provider User Assurance Panel 已准备", redacted:true }, redacted:true },
    offlineLaunchReadinessFinalizerSummary:{ status:"ready", userFacingSummary:{ title:"Offline Launch Readiness Finalizer", resultLabel:"Offline Launch Readiness Finalizer 已准备", redacted:true }, redacted:true },
    userSafePublicClaimVerifierSummary:{ status:"ready", userFacingSummary:{ title:"User-Safe Public Claim Verifier", resultLabel:"User-Safe Public Claim Verifier 已准备", redacted:true }, redacted:true },
    providerLaunchReadinessFinalViewModelSummary:{ status:"ready", title:"Provider Launch Readiness Final Review", redacted:true },
    publicReleaseEvidenceConsoleStatus:"ready",
    noProviderUserAssurancePanelStatus:"ready",
    offlineLaunchReadinessFinalizerStatus:"ready",
    userSafePublicClaimVerifierStatus:"ready",
    providerLaunchReadinessFinalViewModelStatus:"ready",
    safeToProceedWithHumanLaunchReadinessFinalReview:true
  });
  assert.equal(launchReadinessFinalReady.safetyReport.publicReleaseEvidenceConsoleSummary.userFacingSummary.title, "Public Release Evidence Console");
  assert.equal(launchReadinessFinalReady.safetyReport.noProviderUserAssurancePanelSummary.userFacingSummary.title, "No-Provider User Assurance Panel");
  assert.equal(launchReadinessFinalReady.safetyReport.offlineLaunchReadinessFinalizerSummary.userFacingSummary.title, "Offline Launch Readiness Finalizer");
  assert.equal(launchReadinessFinalReady.safetyReport.userSafePublicClaimVerifierSummary.userFacingSummary.title, "User-Safe Public Claim Verifier");
  assert.equal(launchReadinessFinalReady.safetyReport.providerLaunchReadinessFinalViewModelSummary.title, "Provider Launch Readiness Final Review");
  assert.equal(launchReadinessFinalReady.safetyReport.publicReleaseEvidenceConsoleStatus, "ready");
  assert.equal(launchReadinessFinalReady.safetyReport.noProviderUserAssurancePanelStatus, "ready");
  assert.equal(launchReadinessFinalReady.safetyReport.offlineLaunchReadinessFinalizerStatus, "ready");
  assert.equal(launchReadinessFinalReady.safetyReport.userSafePublicClaimVerifierStatus, "ready");
  assert.equal(launchReadinessFinalReady.safetyReport.providerLaunchReadinessFinalViewModelStatus, "ready");
  assert.equal(launchReadinessFinalReady.userFacingSummary.safeToProceedWithHumanLaunchReadinessFinalReview, true);
  const publicBetaReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    globalShoppingReadOnlyPublicBetaShellSummary:{ status:"ready", userFacingSummary:{ title:"Global Shopping Read-Only Public Beta Shell", resultLabel:"Global Shopping Read-Only Public Beta Shell 已准备", redacted:true }, redacted:true },
    providerZeroRuntimeLockSummary:{ status:"ready", userFacingSummary:{ title:"Provider-Zero Runtime Lock", resultLabel:"Provider-Zero Runtime Lock 已准备", redacted:true }, redacted:true },
    userTrustLaunchBoardSummary:{ status:"ready", userFacingSummary:{ title:"User Trust Launch Board", resultLabel:"User Trust Launch Board 已准备", redacted:true }, redacted:true },
    publicBetaSafetyCopyCenterSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Safety Copy Center", resultLabel:"Public Beta Safety Copy Center 已准备", redacted:true }, redacted:true },
    publicBetaFinalGateSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Final Gate", resultLabel:"Public Beta Final Gate 已准备", redacted:true }, redacted:true },
    releaseCandidateConfidenceBoardSummary:{ status:"ready", userFacingSummary:{ title:"RC Confidence Board", resultLabel:"RC Confidence Board 已准备", redacted:true }, redacted:true },
    publicBetaFinalViewModelSummary:{ status:"ready", userFacingSummary:{ title:"Next Manual Review", resultLabel:"下一步仍需人工复核", redacted:true }, redacted:true },
    globalShoppingPublicBetaViewModelSummary:{ status:"ready", title:"Global Shopping Public Beta Review", redacted:true },
    globalShoppingPublicBetaUserFacingCopyPolishSummary:{ status:"ready", userFacingSummary:{ title:"全球购 Public Beta", resultLabel:"全球购 Public Beta 已准备", redacted:true }, redacted:true },
    globalShoppingProviderZeroStatusPanelSummary:{ status:"ready", userFacingSummary:{ title:"Provider-Zero Status Panel", resultLabel:"Provider-Zero Status Panel 已准备", redacted:true }, redacted:true },
    publicBetaUserJourneyShellSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta User Journey", resultLabel:"Public Beta User Journey 已准备", redacted:true }, redacted:true },
    safeSearchIntentMatrixSummary:{ status:"ready", userFacingSummary:{ title:"Safe Search Intent Matrix", resultLabel:"Safe Search Intent Matrix 已准备", redacted:true }, redacted:true },
    publicBetaUserBoundaryPanelSummary:{ status:"ready", userFacingSummary:{ title:"User Boundary Panel", resultLabel:"User Boundary Panel 已准备", redacted:true }, redacted:true },
    publicBetaTrialReadinessPackSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Trial Readiness Pack", resultLabel:"Public Beta Trial Readiness Pack 已准备", redacted:true }, redacted:true },
    finalManualAcceptanceConsoleSummary:{ status:"ready", userFacingSummary:{ title:"Final Manual Acceptance Console", resultLabel:"Final Manual Acceptance Console 已准备", redacted:true }, redacted:true },
    publicBetaFeedbackPlaceholderSummary:{ status:"ready", userFacingSummary:{ title:"Feedback Placeholder", resultLabel:"Feedback Placeholder 已准备", redacted:true }, redacted:true },
    publicBetaFinalManualViewModelSummary:{ status:"ready", userFacingSummary:{ title:"Public Beta Final Manual View Model", resultLabel:"Public Beta Final Manual View Model 已准备", redacted:true }, redacted:true },
    globalShoppingReadOnlyPublicBetaShellStatus:"ready",
    providerZeroRuntimeLockStatus:"ready",
    userTrustLaunchBoardStatus:"ready",
    publicBetaSafetyCopyCenterStatus:"ready",
    publicBetaFinalGateStatus:"ready",
    releaseCandidateConfidenceBoardStatus:"ready",
    publicBetaFinalViewModelStatus:"ready",
    globalShoppingPublicBetaViewModelStatus:"ready",
    globalShoppingPublicBetaUserFacingCopyPolishStatus:"ready",
    globalShoppingProviderZeroStatusPanelStatus:"ready",
    publicBetaUserJourneyShellStatus:"ready",
    safeSearchIntentMatrixStatus:"ready",
    publicBetaUserBoundaryPanelStatus:"ready",
    publicBetaTrialReadinessPackStatus:"ready",
    finalManualAcceptanceConsoleStatus:"ready",
    publicBetaFeedbackPlaceholderStatus:"ready",
    publicBetaFinalManualViewModelStatus:"ready",
    safeToProceedWithHumanPublicBetaReview:true,
    safeToProceedWithManualPublicBetaReview:true,
    safeToProceedWithManualTrialReview:true
  });
  assert.equal(publicBetaReady.safetyReport.globalShoppingReadOnlyPublicBetaShellSummary.userFacingSummary.title, "Global Shopping Read-Only Public Beta Shell");
  assert.equal(publicBetaReady.safetyReport.providerZeroRuntimeLockSummary.userFacingSummary.title, "Provider-Zero Runtime Lock");
  assert.equal(publicBetaReady.safetyReport.userTrustLaunchBoardSummary.userFacingSummary.title, "User Trust Launch Board");
  assert.equal(publicBetaReady.safetyReport.publicBetaSafetyCopyCenterSummary.userFacingSummary.title, "Public Beta Safety Copy Center");
  assert.equal(publicBetaReady.safetyReport.publicBetaFinalGateSummary.userFacingSummary.resultLabel, "Public Beta Final Gate 已准备");
  assert.equal(publicBetaReady.safetyReport.releaseCandidateConfidenceBoardSummary.userFacingSummary.resultLabel, "RC Confidence Board 已准备");
  assert.equal(publicBetaReady.safetyReport.publicBetaFinalViewModelSummary.userFacingSummary.resultLabel, "下一步仍需人工复核");
  assert.equal(publicBetaReady.safetyReport.globalShoppingPublicBetaViewModelSummary.title, "Global Shopping Public Beta Review");
  assert.equal(publicBetaReady.safetyReport.globalShoppingPublicBetaUserFacingCopyPolishSummary.userFacingSummary.title, "全球购 Public Beta");
  assert.equal(publicBetaReady.safetyReport.globalShoppingProviderZeroStatusPanelSummary.userFacingSummary.title, "Provider-Zero Status Panel");
  assert.equal(publicBetaReady.safetyReport.publicBetaUserJourneyShellSummary.userFacingSummary.title, "Public Beta User Journey");
  assert.equal(publicBetaReady.safetyReport.safeSearchIntentMatrixSummary.userFacingSummary.title, "Safe Search Intent Matrix");
  assert.equal(publicBetaReady.safetyReport.publicBetaUserBoundaryPanelSummary.userFacingSummary.title, "User Boundary Panel");
  assert.equal(publicBetaReady.safetyReport.publicBetaTrialReadinessPackSummary.userFacingSummary.title, "Public Beta Trial Readiness Pack");
  assert.equal(publicBetaReady.safetyReport.finalManualAcceptanceConsoleSummary.userFacingSummary.title, "Final Manual Acceptance Console");
  assert.equal(publicBetaReady.safetyReport.publicBetaFeedbackPlaceholderSummary.userFacingSummary.title, "Feedback Placeholder");
  assert.equal(publicBetaReady.safetyReport.publicBetaFinalManualViewModelSummary.userFacingSummary.title, "Public Beta Final Manual View Model");
  const globalGoal = windowRef.WeishanGlobalShoppingProductGoalCharter.buildGlobalShoppingProductGoalCharter();
  const jumpBoundary = windowRef.WeishanGlobalShoppingJumpToPlatformBoundary.buildGlobalShoppingJumpToPlatformBoundary();
  const legalProviderFixture = windowRef.WeishanGlobalShoppingLegalProviderFixtureAdapter.buildGlobalShoppingLegalProviderFixtureAdapter({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"official", providerLegalStatus:"allowed", providerStatus:"fixture", itemType:"flight", officialFixturePrice:{ title:"SHA-CTU", basePrice:900 } });
  const credentialSafety = windowRef.WeishanGlobalShoppingProviderCredentialSafetyReview.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture" });
  const sandboxPriceFeed = windowRef.WeishanGlobalShoppingSandboxPriceFeedGate.buildGlobalShoppingSandboxPriceFeedGate({ legalProviderFixtureSummary:legalProviderFixture, providerCredentialSafetySummary:credentialSafety, normalizedSourceInputs:legalProviderFixture.normalizedSourceInputs });
  const responseContract = windowRef.WeishanGlobalShoppingSandboxProviderResponseContract.buildGlobalShoppingSandboxProviderResponseContract({ providerFixture:legalProviderFixture, credentialSafetyReview:credentialSafety, sandboxPriceFeedGate:sandboxPriceFeed, normalizedSourceInputs:legalProviderFixture.normalizedSourceInputs, officialFixturePrice:{ title:"SHA-CTU", basePrice:900 }, partnerFixturePrices:[{ title:"Partner Fixture", basePrice:899 }] });
  const providerFixtureVm = windowRef.WeishanGlobalShoppingProviderFixtureViewModel.buildGlobalShoppingProviderFixtureViewModel({ legalProviderFixtureSummary:legalProviderFixture, providerCredentialSafetySummary:credentialSafety, sandboxPriceFeedSummary:sandboxPriceFeed });
  const goalView = windowRef.WeishanGlobalShoppingProductGoalViewModel.buildGlobalShoppingProductGoalViewModel({ globalShoppingProductGoalSummary:globalGoal, jumpToPlatformBoundarySummary:jumpBoundary });
  const connector = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxConnector.buildGlobalShoppingReadOnlyProviderSandboxConnector({ providerFixture:legalProviderFixture, providerCredentialSafetyReview:credentialSafety, sandboxPriceFeedGate:sandboxPriceFeed, providerResponseContract:responseContract, connectorMode:"fixture", fixturePayload:{ providerId:"provider_1", providerName:"Fixture Provider", redacted:true } });
  const replay = windowRef.WeishanGlobalShoppingFixtureReplayConsole.buildGlobalShoppingFixtureReplayConsole({ connectorSummary:connector, replayPayload:{ replayId:"fixture_replay_report_center", replayMode:"fixture", providerId:"provider_1", providerName:"Fixture Provider", redacted:true } });
  const normalizer = windowRef.WeishanGlobalShoppingPriceSourceNormalizer.buildGlobalShoppingPriceSourceNormalizer();
  const sameItemMatcher = windowRef.WeishanGlobalShoppingSameItemMatcher.buildGlobalShoppingSameItemMatcher({ priceSourceNormalizationSummary:normalizer });
  const merger = windowRef.WeishanGlobalShoppingDuplicateCandidateMerger.buildGlobalShoppingDuplicateCandidateMerger({ sameItemMatcherSummary:sameItemMatcher });
  const anchor = windowRef.WeishanGlobalShoppingOfficialPriceAnchorSlot.buildGlobalShoppingOfficialPriceAnchorSlot({ priceSourceNormalizationSummary:normalizer });
  const coveredBoard = windowRef.WeishanGlobalShoppingCoveredLowestCandidateBoard.buildGlobalShoppingCoveredLowestCandidateBoard({ duplicateCandidateMergerSummary:merger, officialPriceAnchorSummary:anchor });
  const deepLink = windowRef.WeishanGlobalShoppingExternalDeepLinkSafetyGate.buildGlobalShoppingExternalDeepLinkSafetyGate({ allowedDomain:"sandbox.platform.invalid", sourceType:"major_platform", sourceName:"Sandbox Platform", disclosureText:"价格以跳转后平台实时页面为准。用户需在平台自行确认价格、登录、填写资料并完成下单。" });
  const prefill = windowRef.WeishanGlobalShoppingSearchParameterPrefillGate.buildGlobalShoppingSearchParameterPrefillGate({ itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1 });
  const partner = windowRef.WeishanGlobalShoppingPartnerLinkPolicy.buildGlobalShoppingPartnerLinkPolicy({ linkRelation:"partner" });
  const availability = windowRef.WeishanGlobalShoppingPlatformAvailabilityGate.buildGlobalShoppingPlatformAvailabilityGate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", relationType:"partner", partnerLinkPolicySummary:partner });
  const sandbox = windowRef.WeishanGlobalShoppingSandboxDeepLinkCandidate.buildGlobalShoppingSandboxDeepLinkCandidate({ sourceName:"Sandbox Platform", sourceType:"major_platform", allowedDomain:"sandbox.platform.invalid", itemType:"flight", searchParameterPrefillSummary:prefill, partnerLinkPolicySummary:partner, platformAvailabilitySummary:availability });
  const preview = windowRef.WeishanGlobalShoppingJumpToPlatformHandoffPreview.buildGlobalShoppingJumpToPlatformHandoffPreview({ externalDeepLinkSafetySummary:deepLink, searchParameterPrefillSummary:prefill, sandboxDeepLinkCandidateSummary:sandbox, platformAvailabilitySummary:availability, partnerLinkPolicySummary:partner });
  const sandboxVm = windowRef.WeishanGlobalShoppingSandboxHandoffViewModel.buildGlobalShoppingSandboxHandoffViewModel({ sandboxDeepLinkCandidateSummary:sandbox, platformAvailabilitySummary:availability, partnerLinkPolicySummary:partner });
  const manualPlatformReviewCockpit = { status:"ready", userFacingSummary:{ title:"手动平台复核驾驶舱", resultLabel:"手动平台复核驾驶舱已准备", redacted:true }, redacted:true };
  const handoffAcceptanceWalkthrough = { status:"ready", userFacingSummary:{ title:"交接包接受演练", resultLabel:"交接包接受演练已准备", redacted:true }, redacted:true };
  const platformRealityCheckBoard = { status:"ready", userFacingSummary:{ title:"平台真实页面复核清单", resultLabel:"平台真实页面复核清单已准备", redacted:true }, redacted:true };
  const manualPlatformReviewViewModel = { status:"ready", title:"手动平台复核与现实检查", userFacingSummary:{ title:"手动平台复核与现实检查", resultLabel:"手动平台复核与现实检查已准备", redacted:true }, redacted:true };
  const pipeline = windowRef.WeishanGlobalShoppingPricePipelineOrchestrator.buildGlobalShoppingPricePipelineOrchestrator({ legalProviderFixtureSummary:legalProviderFixture, providerCredentialSafetyReview:credentialSafety, sandboxPriceFeedGate:sandboxPriceFeed, sandboxProviderResponseContract:responseContract, readOnlyProviderSandboxConnector:connector, fixtureReplayConsole:replay, priceSourceNormalizer:normalizer, officialPriceAnchorSlot:anchor, sameItemMatcher:sameItemMatcher, duplicateCandidateMerger:merger, coveredLowestCandidateBoard:coveredBoard, sandboxHandoffViewModel:sandboxVm });
  const journey = windowRef.WeishanGlobalShoppingReadOnlyCandidateJourneyBoard.buildGlobalShoppingReadOnlyCandidateJourneyBoard({ pricePipelineOrchestratorSummary:pipeline, legalProviderFixtureSummary:legalProviderFixture, coveredLowestCandidateBoardSummary:coveredBoard, sandboxHandoffViewModelSummary:sandboxVm });
  const realSandboxGate = windowRef.WeishanGlobalShoppingReadOnlyRealProviderSandboxGate.buildGlobalShoppingReadOnlyRealProviderSandboxGate({ readOnlyProviderSandboxConnectorSummary:connector, fixtureReplayConsoleSummary:replay, normalizedPriceCandidateBoardSummary:{ status:"ready", title:"归一化价格候选板", redacted:true }, providerResponseContractSummary:responseContract, pricePipelineOrchestratorSummary:pipeline, providerCredentialSafetySummary:credentialSafety, sandboxPriceFeedSummary:sandboxPriceFeed });
  const requestEnvelope = windowRef.WeishanGlobalShoppingProviderRequestEnvelopeBuilder.buildGlobalShoppingProviderRequestEnvelopeBuilder({ providerId:"provider_1", providerName:"Fixture Provider", requestMode:"sandbox_ready", itemType:"flight", origin:"SHA", destination:"CTU", departureDate:"2026-07-15", passengerCount:1, userRegion:"CN" });
  const callAudit = windowRef.WeishanGlobalShoppingProviderCallAuditLedger.buildGlobalShoppingProviderCallAuditLedger({ providerId:"provider_1", auditEntries:[{ auditId:"audit_1", providerId:"provider_1", requestMode:"sandbox_ready", callStatus:"dry_run", redacted:true, timestamp:"redacted_now", safetyStatus:"redacted_safe" }] });
  const readiness = windowRef.WeishanGlobalShoppingProviderSandboxReadinessViewModel.buildGlobalShoppingProviderSandboxReadinessViewModel({ realProviderSandboxGateSummary:realSandboxGate, providerRequestEnvelopeSummary:requestEnvelope, providerCallAuditLedgerSummary:callAudit });
  const killSwitch = windowRef.WeishanGlobalShoppingProviderSandboxSafetyKillSwitch.buildGlobalShoppingProviderSandboxSafetyKillSwitch({});
  const adapterShell = windowRef.WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell.buildGlobalShoppingFirstReadOnlyProviderAdapterShell({ providerId:"provider_1", providerName:"Fixture Provider", adapterMode:"dry_run", providerType:"fixture" });
  const dryRunHarness = windowRef.WeishanGlobalShoppingProviderSandboxDryRunHarness.buildGlobalShoppingProviderSandboxDryRunHarness({ providerRequestEnvelopeSummary:requestEnvelope, realProviderSandboxGateSummary:realSandboxGate, providerCallAuditLedgerSummary:callAudit, providerSandboxSafetyKillSwitchSummary:killSwitch, firstReadOnlyProviderAdapterShellSummary:adapterShell });
  const dryRunVm = windowRef.WeishanGlobalShoppingProviderSandboxDryRunViewModel.buildGlobalShoppingProviderSandboxDryRunViewModel({ providerSandboxDryRunHarnessSummary:dryRunHarness, firstReadOnlyProviderAdapterShellSummary:adapterShell, providerSandboxSafetyKillSwitchSummary:killSwitch });
  const adapterRegistry = windowRef.WeishanGlobalShoppingProviderAdapterRegistry.buildGlobalShoppingProviderAdapterRegistry({ registryMode:"dry_run", adapterShells:[{ adapterId:"global_fixture_provider_dry_run", providerId:"provider_1", providerName:"Fixture Provider", providerType:"fixture", adapterMode:"dry_run", readOnly:true, sandboxOnly:true, productionDisabled:true, redactedOutputOnly:true }] });
  const responseNormalizer = windowRef.WeishanGlobalShoppingDryRunProviderResponseNormalizer.buildGlobalShoppingDryRunProviderResponseNormalizer({ adapterRegistry:adapterRegistry, dryRunHarness:dryRunHarness, responseMode:"dry_run", redactedResponseSummary:{ responseMode:"dry_run", providerId:"provider_1", providerName:"Fixture Provider", redacted:true }, fixturePrices:[{ title:"SHA-CTU", basePrice:900, taxAmount:120, currency:"CNY" }] });
  const runbookBoard = windowRef.WeishanGlobalShoppingSandboxProviderRunbookBoard.buildGlobalShoppingSandboxProviderRunbookBoard({ providerAdapterRegistrySummary:adapterRegistry, providerSandboxDryRunHarnessSummary:dryRunHarness, firstReadOnlyProviderAdapterShellSummary:adapterShell, providerSandboxSafetyKillSwitchSummary:killSwitch, providerRequestEnvelopeSummary:requestEnvelope, providerCallAuditLedgerSummary:callAudit, sandboxProviderResponseContractSummary:responseContract, dryRunProviderResponseNormalizerSummary:responseNormalizer });
  const adapterRegistryView = windowRef.WeishanGlobalShoppingProviderAdapterRegistryViewModel.buildGlobalShoppingProviderAdapterRegistryViewModel({ providerAdapterRegistrySummary:adapterRegistry, dryRunProviderResponseNormalizerSummary:responseNormalizer, sandboxProviderRunbookSummary:runbookBoard, safeToProceedWithFirstSandboxProviderConnectorImplementation:true });
  const firstSandboxConnector = windowRef.WeishanGlobalShoppingFirstSandboxProviderConnector.buildGlobalShoppingFirstSandboxProviderConnector({ providerId:"provider_1", providerName:"Fixture Provider", providerType:"fixture", itemType:"flight", connectorMode:"dry_run", adapterRegistry:adapterRegistry, adapterShell:adapterShell, dryRunHarness:dryRunHarness, safetyKillSwitch:killSwitch, requestEnvelope:requestEnvelope, providerRunbook:runbookBoard, dryRunResponseNormalizer:responseNormalizer, normalizedSourceInputs:responseNormalizer.normalizedSourceInputs });
  const coverageDashboard = windowRef.WeishanGlobalShoppingProviderCoverageDashboard.buildGlobalShoppingProviderCoverageDashboard({ adapterRegistrySummary:adapterRegistry, firstSandboxProviderConnectorSummary:firstSandboxConnector, normalizedSourceInputs:responseNormalizer.normalizedSourceInputs });
  const sourceTrust = windowRef.WeishanGlobalShoppingReadOnlySourceTrustScore.buildGlobalShoppingReadOnlySourceTrustScore({ dryRunProviderResponseNormalizerSummary:responseNormalizer });
  const coverageViewModel = windowRef.WeishanGlobalShoppingProviderCoverageViewModel.buildGlobalShoppingProviderCoverageViewModel({ firstSandboxProviderConnectorSummary:firstSandboxConnector, providerCoverageDashboardSummary:coverageDashboard, readOnlySourceTrustScoreSummary:sourceTrust, safeToProceedWithFirstReadOnlyProviderSandboxIntegration:true });
  const integrationGate = windowRef.WeishanGlobalShoppingReadOnlyProviderSandboxIntegrationGate.buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate({ legalProviderFixtureSummary:legalProviderFixture, providerCredentialSafetySummary:credentialSafety, sandboxPriceFeedSummary:sandboxPriceFeed, firstSandboxProviderConnectorSummary:firstSandboxConnector, providerAdapterRegistrySummary:adapterRegistry, providerSandboxDryRunHarnessSummary:dryRunHarness, providerSandboxSafetyKillSwitchSummary:killSwitch, providerCoverageDashboardSummary:coverageDashboard, readOnlySourceTrustScoreSummary:sourceTrust, pricePipelineOrchestratorSummary:{ status:"ready", redacted:true }, jumpToPlatformHandoffPreviewSummary:preview });
  const sandboxSession = windowRef.WeishanGlobalShoppingSandboxPriceCandidateSession.buildGlobalShoppingSandboxPriceCandidateSession({ readOnlyProviderSandboxIntegrationGateSummary:integrationGate, firstSandboxProviderConnectorSummary:firstSandboxConnector, providerCoverageDashboardSummary:coverageDashboard, readOnlySourceTrustScoreSummary:sourceTrust, pricePipelineOrchestratorSummary:{ status:"ready", officialPriceAnchorSummary:anchor, coveredLowestCandidateBoardSummary:coveredBoard, redacted:true }, coveredLowestCandidateBoardSummary:coveredBoard, jumpToPlatformHandoffPreviewSummary:preview, officialPriceAnchorSummary:anchor });
  const sandboxResultBoard = windowRef.WeishanGlobalShoppingSandboxPriceCandidateResultBoard.buildGlobalShoppingSandboxPriceCandidateResultBoard({ sandboxPriceCandidateSessionSummary:sandboxSession, officialPriceAnchorSummary:anchor, coveredLowestCandidateBoardSummary:coveredBoard, readOnlySourceTrustScoreSummary:sourceTrust, jumpToPlatformHandoffPreviewSummary:preview, pricePipelineOrchestratorSummary:pipeline });
  const globalReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    globalShoppingProductGoalSummary:globalGoal,
    jumpToPlatformBoundarySummary:jumpBoundary,
    globalShoppingProductGoalViewModelSummary:goalView,
    readOnlyProviderSandboxConnectorSummary:connector,
    fixtureReplayConsoleSummary:replay,
    normalizedPriceCandidateBoardSummary:{ status:"ready", title:"归一化价格候选板", redacted:true },
    realProviderSandboxGateSummary:realSandboxGate,
    providerRequestEnvelopeSummary:requestEnvelope,
    providerCallAuditLedgerSummary:callAudit,
    providerSandboxReadinessViewModelSummary:readiness,
    providerSandboxDryRunHarnessSummary:dryRunHarness,
    firstReadOnlyProviderAdapterShellSummary:adapterShell,
    providerSandboxSafetyKillSwitchSummary:killSwitch,
    providerSandboxDryRunViewModelSummary:dryRunVm,
    providerAdapterRegistrySummary:adapterRegistry,
    dryRunProviderResponseNormalizerSummary:responseNormalizer,
    sandboxProviderRunbookSummary:runbookBoard,
    providerAdapterRegistryViewModelSummary:adapterRegistryView,
    firstSandboxProviderConnectorSummary:firstSandboxConnector,
    providerCoverageDashboardSummary:coverageDashboard,
    readOnlySourceTrustScoreSummary:sourceTrust,
    providerCoverageViewModelSummary:coverageViewModel,
    readOnlyProviderSandboxIntegrationGateSummary:integrationGate,
    sandboxPriceCandidateSessionSummary:sandboxSession,
    sandboxPriceCandidateResultBoardSummary:sandboxResultBoard,
    legalProviderFixtureSummary:legalProviderFixture,
    providerCredentialSafetySummary:credentialSafety,
    sandboxPriceFeedSummary:sandboxPriceFeed,
    sandboxProviderResponseContractSummary:responseContract,
    pricePipelineOrchestratorSummary:pipeline,
    readOnlyCandidateJourneySummary:journey,
    providerFixtureViewModelSummary:providerFixtureVm,
    priceSourceNormalizationSummary:normalizer,
    officialPriceAnchorSummary:anchor,
    sameItemMatcherSummary:sameItemMatcher,
    duplicateCandidateMergerSummary:merger,
    coveredLowestCandidateBoardSummary:coveredBoard,
    externalDeepLinkSafetySummary:deepLink,
    searchParameterPrefillSummary:prefill,
    jumpToPlatformHandoffPreviewSummary:preview,
    sandboxDeepLinkCandidateSummary:sandbox,
    platformAvailabilitySummary:availability,
    partnerLinkPolicySummary:partner,
    sandboxHandoffViewModelSummary:sandboxVm,
    manualPlatformReviewCockpitSummary:manualPlatformReviewCockpit,
    handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthrough,
    platformRealityCheckBoardSummary:platformRealityCheckBoard,
    manualPlatformReviewViewModelSummary:manualPlatformReviewViewModel,
    userFacingManualReviewFlowSummary:{ status:"ready", userFacingSummary:{ title:"用户手动复核流程", resultLabel:"用户手动复核流程已准备", redacted:true }, redacted:true },
    platformVerificationProgressTrackerSummary:{ status:"ready", userFacingSummary:{ title:"平台核对进度追踪", resultLabel:"平台核对进度已准备", redacted:true }, redacted:true },
    safeNextActionPanelSummary:{ status:"ready", userFacingSummary:{ title:"安全下一步", resultLabel:"安全下一步已准备", redacted:true }, redacted:true },
    userManualReviewViewModelSummary:{ status:"ready", title:"用户手动复核与安全下一步", userFacingSummary:{ title:"用户手动复核与安全下一步", resultLabel:"用户手动复核与安全下一步已准备", redacted:true }, redacted:true },
    readOnlyCommerceSessionRecapCenterSummary:{ status:"ready", userFacingSummary:{ title:"只读全球购会话总结", resultLabel:"只读全球购会话总结已准备", redacted:true }, rows:[{ rowId:"summary_scope", label:"会话总结不保存、不导出", value:"当前只展示只读会话总结摘要", status:"pass", redacted:true }], redacted:true },
    userTrustClosureSummarySummary:{ status:"ready", userFacingSummary:{ title:"用户信任闭环摘要", resultLabel:"用户信任闭环摘要已准备", redacted:true }, rows:[{ rowId:"trust_boundary", label:"平台页面为最终依据", value:"信任闭环不构成平台确认", status:"pass", redacted:true }], redacted:true },
    nextFeatureReadinessGateSummary:{ status:"ready", userFacingSummary:{ title:"下一功能准备闸门", resultLabel:"下一功能准备闸门已准备", redacted:true }, rows:[{ rowId:"next_boundary", label:"下一功能闸门不接真实 provider", value:"只评估 readiness，不接真实 provider", status:"pass", redacted:true }], redacted:true },
    providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ title:"Provider 法务审查档案", resultLabel:"法务审查档案已准备", redacted:true }, redacted:true },
    credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ title:"凭证保险箱接口桩", resultLabel:"凭证接口桩已准备", redacted:true }, redacted:true },
    sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Adapter 合同测试台", resultLabel:"Adapter 合同测试台已准备", redacted:true }, redacted:true },
    providerIntegrationPrepViewModelSummary:{ status:"ready", title:"Provider 接入前准备", userFacingSummary:{ title:"Provider 接入前准备", resultLabel:"Provider 接入前准备已准备", redacted:true }, redacted:true },
    sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Provider Mock Runtime", resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true }, redacted:true },
    vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ title:"Vault Boundary Contract", resultLabel:"Vault 边界合同已准备", redacted:true }, redacted:true },
    legalApprovalWorkflowBoardSummary:{ status:"ready", userFacingSummary:{ title:"法务审批流程板", resultLabel:"法务审批流程板已准备", redacted:true }, redacted:true },
    providerMockRuntimeViewModelSummary:{ status:"ready", title:"Provider Mock Runtime 与审批准备", userFacingSummary:{ title:"Provider Mock Runtime 与审批准备", resultLabel:"Provider Mock Runtime 与审批准备已准备", redacted:true }, redacted:true },
    mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ title:"Mock Provider Adapter 注册运行时", resultLabel:"Mock Adapter 注册运行时已准备", redacted:true }, redacted:true },
    providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ title:"Provider 合同回放器", resultLabel:"Provider 合同回放器已准备", redacted:true }, redacted:true },
    providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ title:"Provider 启动准备总闸门", resultLabel:"Provider 启动准备总闸门已准备", redacted:true }, redacted:true },
    providerLaunchReadinessViewModelSummary:{ status:"ready", title:"Provider 启动准备与合同回放", userFacingSummary:{ title:"Provider 启动准备与合同回放", resultLabel:"Provider 启动准备与合同回放已准备", redacted:true }, redacted:true },
    humanControlledSandboxProviderPilotPlannerSummary:{ status:"ready", userFacingSummary:{ title:"人工控制 Sandbox Provider Pilot 计划器", resultLabel:"Pilot 计划器已准备", redacted:true }, redacted:true },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ title:"Provider Kill Switch 演练", resultLabel:"Kill Switch 演练已准备", redacted:true }, redacted:true },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ title:"合规证据包", resultLabel:"合规证据包已准备", redacted:true }, redacted:true },
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", userFacingSummary:{ title:"Provider Pilot 治理与合规证据", resultLabel:"治理视图已准备", redacted:true }, redacted:true },
    providerGovernanceConsoleSummary:{ consoleStatus:"ready_for_human_approval", status:"ready_for_human_approval", userVisibleSummary:{ title:"Provider Governance Console", resultLabel:"可进入人工最终确认", redacted:true }, allowedNextActions:["request_final_human_approval"], blockedActions:[], redacted:true },
    providerOperatorReviewLoopSummary:{ status:"ready_for_human_approval", userFacingSummary:{ title:"Operator Review Loop", resultLabel:"等待人工最终确认", redacted:true }, redacted:true },
    commerceSessionRecapViewModelSummary:{ status:"ready", title:"只读全球购会话总结与下一步准备", userFacingSummary:{ title:"只读全球购会话总结与下一步准备", resultLabel:"只读全球购会话总结与下一步准备已准备", redacted:true }, redacted:true },
    globalShoppingGoalStatus:"aligned",
    jumpBoundaryStatus:"safe",
    legalProviderFixtureStatus:"ready",
    providerCredentialSafetyStatus:"ready",
    sandboxPriceFeedStatus:"ready",
    sandboxProviderResponseContractStatus:"ready",
    pricePipelineStatus:"ready",
    readOnlyCandidateJourneyStatus:"ready",
    readOnlyProviderSandboxConnectorStatus:"ready",
    fixtureReplayStatus:"ready",
    normalizedPriceCandidateBoardStatus:"ready",
    realProviderSandboxGateStatus:"ready",
    providerRequestEnvelopeStatus:"ready",
    providerCallAuditLedgerStatus:"ready",
    providerSandboxReadinessStatus:"ready",
    providerSandboxDryRunStatus:"ready",
    providerAdapterShellStatus:"ready",
    providerKillSwitchStatus:"clear",
    providerSandboxDryRunViewModelStatus:"ready",
    providerAdapterRegistryStatus:"ready",
    dryRunResponseNormalizerStatus:"ready",
    sandboxProviderRunbookStatus:"ready",
    providerAdapterRegistryViewModelStatus:"ready",
    firstSandboxProviderConnectorStatus:"ready",
    providerCoverageStatus:"ready",
    sourceTrustStatus:"ready",
    providerCoverageViewModelStatus:"ready",
    providerSandboxIntegrationGateStatus:"ready",
    sandboxPriceCandidateSessionStatus:"ready",
    sandboxPriceCandidateResultBoardStatus:"ready",
    safeToProceedWithReadOnlyPriceProviderSandbox:true,
    safeToProceedWithFirstRealReadOnlyProviderSandbox:true,
    safeToProceedWithFirstReadOnlySandboxDryRun:true,
    safeToProceedWithFirstProviderSandboxFixtureDryRun:true,
    safeToProceedWithFirstSandboxProviderConnectorImplementation:true,
    safeToProceedWithFirstReadOnlyProviderSandboxIntegration:true,
    safeToProceedWithSandboxCandidateUserPreview:true,
    safeToProceedWithRealReadOnlyProviderSandbox:true,
    safeToProceedWithJumpToPlatformMvp:true,
    safeToProceedWithDeepLinkSafetyGate:true,
    externalDeepLinkSafetyStatus:"safe",
    searchPrefillStatus:"safe",
    handoffPreviewStatus:"ready",
    sandboxDeepLinkStatus:"ready",
    platformAvailabilityStatus:"available",
    partnerLinkPolicyStatus:"compliant",
    sandboxHandoffStatus:"ready",
    manualPlatformReviewCockpitStatus:"ready",
    handoffAcceptanceWalkthroughStatus:"ready",
    platformRealityCheckStatus:"ready",
    manualPlatformReviewViewModelStatus:"ready",
    safeToProceedWithSandboxDeepLinkCandidate:true,
    safeToProceedWithPartnerFixtureAdapter:true,
    safeToProceedWithManualPlatformUserEducation:true,
    userFacingManualReviewFlowStatus:"ready",
    platformVerificationProgressStatus:"ready",
    safeNextActionPanelStatus:"ready",
    userManualReviewViewModelStatus:"ready",
    safeToProceedWithManualExternalPlatformVisitEducation:true,
    readOnlyCommerceSessionRecapStatus:"ready",
    userTrustClosureSummaryStatus:"ready",
    nextFeatureReadinessGateStatus:"ready",
    commerceSessionRecapViewModelStatus:"ready",
    providerLegalReviewStatus:"ready",
    credentialVaultInterfaceStatus:"ready",
    sandboxAdapterContractStatus:"ready",
    providerIntegrationPrepViewModelStatus:"ready",
    sandboxProviderMockRuntimeStatus:"ready",
    vaultBoundaryContractStatus:"ready",
    legalApprovalWorkflowStatus:"ready",
    providerMockRuntimeViewModelStatus:"ready",
    mockProviderAdapterRegistryStatus:"ready",
    providerContractReplayStatus:"ready",
    providerLaunchReadinessStatus:"ready",
    providerLaunchReadinessViewModelStatus:"ready",
    safeToProceedWithReadOnlyProviderSandboxPlanning:true,
    safeToProceedWithProviderSandboxContractImplementation:true,
    safeToProceedWithMockAdapterRuntimeHardening:true,
    safeToProceedWithHumanProviderSandboxApproval:true,
    safeToProceedWithHumanAuditSandboxPilotReadinessReview:true
  });
  assert.equal(globalReady.userFacingSummary.globalShoppingProductGoalSummary.title, "全球购产品目标");
  assert.equal(globalReady.userFacingSummary.jumpToPlatformBoundarySummary.title, "跳转至平台自行下单边界");
  assert.equal(globalReady.userFacingSummary.globalShoppingProductGoalViewModelSummary.title, "全球购产品目标与跳转边界");
  assert.equal(globalReady.userFacingSummary.legalProviderFixtureSummary.title, "合法 Provider Fixture 适配器");
  assert.equal(globalReady.userFacingSummary.providerCredentialSafetySummary.title, "Provider 凭据安全复核");
  assert.equal(globalReady.userFacingSummary.sandboxPriceFeedSummary.title, "Sandbox 价格 Feed 闸门");
  assert.equal(globalReady.userFacingSummary.sandboxProviderResponseContractSummary.title, "Sandbox Provider 响应合同");
  assert.equal(globalReady.userFacingSummary.pricePipelineOrchestratorSummary.title, "全球购只读价格流水线");
  assert.equal(globalReady.userFacingSummary.readOnlyCandidateJourneySummary.title, "全球购只读候选旅程");
  assert.equal(globalReady.userFacingSummary.providerSandboxDryRunHarnessSummary.title, "Provider Sandbox 干跑框架");
  assert.equal(globalReady.userFacingSummary.firstReadOnlyProviderAdapterShellSummary.title, "第一个只读 Provider Adapter 外壳");
  assert.equal(globalReady.userFacingSummary.providerSandboxSafetyKillSwitchSummary.title, "Provider Sandbox 安全熔断器");
  assert.equal(globalReady.userFacingSummary.providerSandboxDryRunViewModelSummary.title, "Provider Sandbox 离线 Dry-run");
  assert.equal(globalReady.userFacingSummary.providerAdapterRegistrySummary.title, "Provider Adapter 注册表");
  assert.equal(globalReady.userFacingSummary.dryRunProviderResponseNormalizerSummary.title, "Dry-Run Provider 响应归一化器");
  assert.equal(globalReady.userFacingSummary.sandboxProviderRunbookSummary.title, "Sandbox Provider 接入运行手册");
  assert.equal(globalReady.userFacingSummary.providerAdapterRegistryViewModelSummary.title, "Provider Adapter 注册与接入手册");
  assert.equal(globalReady.userFacingSummary.firstSandboxProviderConnectorSummary.title, "第一个 Sandbox Provider Connector");
  assert.equal(globalReady.userFacingSummary.providerCoverageDashboardSummary.title, "Provider 覆盖看板");
  assert.equal(globalReady.userFacingSummary.readOnlySourceTrustScoreSummary.title, "只读来源可信度评分");
  assert.equal(globalReady.userFacingSummary.providerCoverageViewModelSummary.title, "Provider 覆盖与来源可信度");
  assert.equal(globalReady.userFacingSummary.readOnlyProviderSandboxIntegrationGateSummary.title, "只读 Provider Sandbox 接入闸门");
  assert.equal(globalReady.userFacingSummary.sandboxPriceCandidateSessionSummary.title, "Sandbox 价格候选会话");
  assert.equal(globalReady.userFacingSummary.sandboxPriceCandidateResultBoardSummary.title, "Sandbox 价格候选结果");
  assert.equal(globalReady.userFacingSummary.providerFixtureViewModelSummary.title, "合法 Provider Fixture 与 Sandbox 价格 Feed");
  assert.equal(globalReady.userFacingSummary.sameItemMatcherSummary.title, "同款候选识别");
  assert.equal(globalReady.userFacingSummary.duplicateCandidateMergerSummary.title, "重复候选合并");
  assert.equal(globalReady.userFacingSummary.coveredLowestCandidateBoardSummary.title, "已覆盖来源候选价合并");
  assert.equal(globalReady.userFacingSummary.externalDeepLinkSafetySummary.title, "外部平台跳转安全闸门");
  assert.equal(globalReady.userFacingSummary.searchParameterPrefillSummary.title, "搜索参数预填闸门");
  assert.equal(globalReady.userFacingSummary.jumpToPlatformHandoffPreviewSummary.title, "跳转至平台查看");
  assert.equal(globalReady.userFacingSummary.sandboxDeepLinkCandidateSummary.title, "Sandbox 跳转候选");
  assert.equal(globalReady.userFacingSummary.platformAvailabilitySummary.title, "平台可用性");
  assert.equal(globalReady.userFacingSummary.partnerLinkPolicySummary.title, "合作/联盟链接政策");
  assert.equal(globalReady.userFacingSummary.sandboxHandoffViewModelSummary.title, "Sandbox 跳转候选与平台可用性");
  assert.equal(globalReady.userFacingSummary.manualPlatformReviewCockpitSummary.title, "手动平台复核驾驶舱");
  assert.equal(globalReady.userFacingSummary.handoffAcceptanceWalkthroughSummary.title, "交接包接受演练");
  assert.equal(globalReady.userFacingSummary.platformRealityCheckBoardSummary.title, "平台真实页面复核清单");
  assert.equal(globalReady.userFacingSummary.manualPlatformReviewViewModelSummary.title, "手动平台复核与现实检查");
  assert.equal(globalReady.userFacingSummary.userFacingManualReviewFlowSummary.title, "用户手动复核流程");
  assert.equal(globalReady.userFacingSummary.platformVerificationProgressTrackerSummary.title, "平台核对进度追踪");
  assert.equal(globalReady.userFacingSummary.safeNextActionPanelSummary.title, "安全下一步");
  assert.equal(globalReady.userFacingSummary.userManualReviewViewModelSummary.title, "用户手动复核与安全下一步");
  assert.equal(globalReady.userFacingSummary.readOnlyCommerceSessionRecapCenterSummary.title, "只读全球购会话总结");
  assert.equal(globalReady.userFacingSummary.userTrustClosureSummarySummary.title, "用户信任闭环摘要");
  assert.equal(globalReady.userFacingSummary.nextFeatureReadinessGateSummary.title, "下一功能准备闸门");
  assert.equal(globalReady.userFacingSummary.providerLegalReviewDossierSummary.title, "Provider 法务审查档案");
  assert.equal(globalReady.userFacingSummary.credentialVaultInterfaceStubSummary.title, "凭证保险箱接口桩");
  assert.equal(globalReady.userFacingSummary.sandboxAdapterContractTestbedSummary.title, "Sandbox Adapter 合同测试台");
  assert.equal(globalReady.userFacingSummary.providerIntegrationPrepViewModelSummary.title, "Provider 接入前准备");
  assert.equal(globalReady.userFacingSummary.sandboxProviderMockRuntimeSummary.title, "Sandbox Provider Mock Runtime");
  assert.equal(globalReady.userFacingSummary.vaultBoundaryContractSummary.title, "Vault Boundary Contract");
  assert.equal(globalReady.userFacingSummary.legalApprovalWorkflowBoardSummary.title, "法务审批流程板");
  assert.equal(globalReady.userFacingSummary.providerMockRuntimeViewModelSummary.title, "Provider Mock Runtime 与审批准备");
  assert.equal(globalReady.userFacingSummary.mockProviderAdapterRegistryRuntimeSummary.title, "Mock Provider Adapter 注册运行时");
  assert.equal(globalReady.userFacingSummary.providerContractReplayHarnessSummary.title, "Provider 合同回放器");
  assert.equal(globalReady.userFacingSummary.providerLaunchReadinessBoardSummary.title, "Provider 启动准备总闸门");
  assert.equal(globalReady.userFacingSummary.providerLaunchReadinessViewModelSummary.title, "Provider 启动准备与合同回放");
  assert.equal(globalReady.userFacingSummary.providerGovernanceConsoleSummary.title, "Provider Governance Console");
  assert.equal(globalReady.userFacingSummary.providerOperatorReviewLoopSummary.title, "Operator Review Loop");
  assert.equal(globalReady.userFacingSummary.commerceSessionRecapViewModelSummary.title, "只读全球购会话总结与下一步准备");
  assert.equal(globalReady.userFacingSummary.publicReleaseEvidenceConsoleSummary.title, "Public Release Evidence Console");
  assert.equal(globalReady.userFacingSummary.noProviderUserAssurancePanelSummary.title, "No-Provider User Assurance Panel");
  assert.equal(globalReady.userFacingSummary.offlineLaunchReadinessFinalizerSummary.title, "Offline Launch Readiness Finalizer");
  assert.equal(globalReady.userFacingSummary.userSafePublicClaimVerifierSummary.title, "User-Safe Public Claim Verifier");
  assert.equal(globalReady.userFacingSummary.providerLaunchReadinessFinalViewModelSummary.title, "Provider Launch Readiness Final Review");
  assert.equal(globalReady.userFacingSummary.globalShoppingGoalStatus, "aligned");
  assert.equal(globalReady.userFacingSummary.jumpBoundaryStatus, "safe");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithJumpToPlatformMvp, true);
  assert.equal(globalReady.userFacingSummary.legalProviderFixtureStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerCredentialSafetyStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerAdapterRegistryStatus, "ready");
  assert.equal(globalReady.userFacingSummary.dryRunResponseNormalizerStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxProviderRunbookStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerAdapterRegistryViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.firstSandboxProviderConnectorStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerCoverageStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sourceTrustStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerCoverageViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerSandboxIntegrationGateStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxPriceCandidateSessionStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxPriceCandidateResultBoardStatus, "ready");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithSandboxCandidateUserPreview, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithFirstSandboxProviderConnectorImplementation, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithFirstReadOnlyProviderSandboxIntegration, true);
  assert.equal(globalReady.userFacingSummary.sandboxPriceFeedStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxProviderResponseContractStatus, "ready");
  assert.equal(globalReady.userFacingSummary.pricePipelineStatus, "ready");
  assert.equal(globalReady.userFacingSummary.readOnlyCandidateJourneyStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerSandboxDryRunStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerAdapterShellStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerKillSwitchStatus, "clear");
  assert.equal(globalReady.userFacingSummary.providerSandboxDryRunViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithReadOnlyPriceProviderSandbox, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithRealReadOnlyProviderSandbox, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithFirstProviderSandboxFixtureDryRun, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithDeepLinkSafetyGate, true);
  assert.equal(globalReady.userFacingSummary.externalDeepLinkSafetyStatus, "safe");
  assert.equal(globalReady.userFacingSummary.searchPrefillStatus, "safe");
  assert.equal(globalReady.userFacingSummary.handoffPreviewStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxDeepLinkStatus, "ready");
  assert.equal(globalReady.userFacingSummary.platformAvailabilityStatus, "available");
  assert.equal(globalReady.userFacingSummary.partnerLinkPolicyStatus, "compliant");
  assert.equal(globalReady.userFacingSummary.manualPlatformReviewCockpitStatus, "ready");
  assert.equal(globalReady.userFacingSummary.handoffAcceptanceWalkthroughStatus, "ready");
  assert.equal(globalReady.userFacingSummary.platformRealityCheckStatus, "ready");
  assert.equal(globalReady.userFacingSummary.manualPlatformReviewViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.userFacingManualReviewFlowStatus, "ready");
  assert.equal(globalReady.userFacingSummary.platformVerificationProgressStatus, "ready");
  assert.equal(globalReady.userFacingSummary.safeNextActionPanelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.userManualReviewViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.readOnlyCommerceSessionRecapStatus, "ready");
  assert.equal(globalReady.userFacingSummary.userTrustClosureSummaryStatus, "ready");
  assert.equal(globalReady.userFacingSummary.nextFeatureReadinessGateStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerLegalReviewStatus, "ready");
  assert.equal(globalReady.userFacingSummary.credentialVaultInterfaceStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxAdapterContractStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerIntegrationPrepViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.sandboxProviderMockRuntimeStatus, "ready");
  assert.equal(globalReady.userFacingSummary.vaultBoundaryContractStatus, "ready");
  assert.equal(globalReady.userFacingSummary.legalApprovalWorkflowStatus, "ready");
  assert.equal(globalReady.userFacingSummary.providerMockRuntimeViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.commerceSessionRecapViewModelStatus, "ready");
  assert.equal(globalReady.userFacingSummary.safeToProceedWithSandboxDeepLinkCandidate, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithPartnerFixtureAdapter, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithManualPlatformUserEducation, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithManualExternalPlatformVisitEducation, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithReadOnlyProviderSandboxPlanning, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithProviderSandboxContractImplementation, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithMockAdapterRuntimeHardening, true);
  assert.equal(globalReady.userFacingSummary.safeToProceedWithHumanProviderSandboxApproval, true);
  const providerCertificationReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    offlineProviderCertificationCenterSummary:{ status:"ready", userFacingSummary:{ title:"Offline Provider Certification Center", resultLabel:"离线 Provider 认证中心已准备", redacted:true }, redacted:true },
    mockIntegrationRegressionLabSummary:{ status:"ready", userFacingSummary:{ title:"Mock Integration Regression Lab", resultLabel:"Mock 集成回归实验室已准备", redacted:true }, redacted:true },
    humanApprovalEvidenceBinderSummary:{ status:"ready", userFacingSummary:{ title:"Human Approval Evidence Binder", resultLabel:"人工审批证据夹已准备", redacted:true }, redacted:true },
    adapterBoundaryLockSummary:{ status:"ready", userFacingSummary:{ title:"Adapter Boundary Lock", resultLabel:"Adapter 边界锁已准备", redacted:true }, redacted:true },
    providerCertificationViewModelSummary:{ status:"ready", title:"Provider 离线认证与边界锁", redacted:true },
    offlineProviderCertificationCenterStatus:"ready",
    mockIntegrationRegressionLabStatus:"ready",
    humanApprovalEvidenceBinderStatus:"ready",
    adapterBoundaryLockStatus:"ready",
    providerCertificationViewModelStatus:"ready",
    safeToProceedWithHumanCertificationReview:true
  });
  assert.equal(providerCertificationReady.safetyReport.offlineProviderCertificationCenterSummary.userFacingSummary.title, "Offline Provider Certification Center");
  assert.equal(providerCertificationReady.safetyReport.mockIntegrationRegressionLabSummary.userFacingSummary.title, "Mock Integration Regression Lab");
  assert.equal(providerCertificationReady.safetyReport.humanApprovalEvidenceBinderSummary.userFacingSummary.title, "Human Approval Evidence Binder");
  assert.equal(providerCertificationReady.safetyReport.adapterBoundaryLockSummary.userFacingSummary.title, "Adapter Boundary Lock");
  assert.equal(providerCertificationReady.safetyReport.providerCertificationViewModelSummary.title, "Provider 离线认证与边界锁");
  assert.equal(providerCertificationReady.safetyReport.offlineProviderCertificationCenterStatus, "ready");
  assert.equal(providerCertificationReady.safetyReport.mockIntegrationRegressionLabStatus, "ready");
  assert.equal(providerCertificationReady.safetyReport.humanApprovalEvidenceBinderStatus, "ready");
  assert.equal(providerCertificationReady.safetyReport.adapterBoundaryLockStatus, "ready");
  assert.equal(providerCertificationReady.safetyReport.providerCertificationViewModelStatus, "ready");
  assert.equal(providerCertificationReady.safetyReport.safeToProceedWithHumanCertificationReview, true);
  const decisionReviewReady = api.buildReadOnlyQuoteSessionReportCenter({
    sessionSummary:summary,
    sandboxCandidateComparisonWorkbenchSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox 候选对比工作台", resultLabel:"候选对比已准备", caveat:"当前仅比较脱敏 sandbox 候选。", redacted:true }, redacted:true },
    providerEvidenceComparisonMatrixSummary:{ status:"ready", userFacingSummary:{ title:"Provider 证据对比矩阵", resultLabel:"证据矩阵已准备", caveat:"当前矩阵只展示脱敏 sandbox 证据摘要。", redacted:true }, redacted:true },
    readOnlyHandoffReadinessDrillSummary:{ status:"ready", userFacingSummary:{ title:"只读跳转交接演练", resultLabel:"交接演练已准备", caveat:"当前只演练非敏感搜索参数准备度。", redacted:true }, redacted:true },
    sandboxDecisionReviewViewModelSummary:{ status:"ready", title:"Sandbox 候选决策复核", caveat:"当前仅用于复核 sandbox 候选，不代表真实价格、全网最低、锁价、可订、付款、下单或出票能力。", redacted:true },
    sandboxCandidateComparisonWorkbenchStatus:"ready",
    providerEvidenceComparisonMatrixStatus:"ready",
    readOnlyHandoffReadinessDrillStatus:"ready",
    sandboxDecisionReviewStatus:"ready",
    safeToProceedWithSandboxDecisionReview:true
  });
  assert.equal(decisionReviewReady.safetyReport.sandboxCandidateComparisonWorkbenchSummary.userFacingSummary.title, "Sandbox 候选对比工作台");
  assert.equal(decisionReviewReady.safetyReport.providerEvidenceComparisonMatrixSummary.userFacingSummary.title, "Provider 证据对比矩阵");
  assert.equal(decisionReviewReady.safetyReport.readOnlyHandoffReadinessDrillSummary.userFacingSummary.title, "只读跳转交接演练");
  assert.equal(decisionReviewReady.safetyReport.sandboxDecisionReviewViewModelSummary.title, "Sandbox 候选决策复核");
  assert.equal(decisionReviewReady.userFacingSummary.sandboxDecisionReviewStatus, "ready");
  assert.equal(decisionReviewReady.userFacingSummary.safeToProceedWithSandboxDecisionReview, true);
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
  const userFacingValues = userFacing.replace(/"[^"]+":/g, "");
  assert.equal(/rawResponse|token|key|secret|bookingUrl|paymentUrl|orderUrl/i.test(userFacingValues), false);
  assert.equal(/全网最低|已锁价|可以出票|可直接出票|真实最终价/.test(userFacing), false);
  const malformed = api.buildReadOnlyQuoteSessionReportCenter({ session:null });
  assert.equal(malformed.status, "failed_safe");
  const audit = api.buildReadOnlyQuoteSessionReportCenterAuditDraft({ sessionSummary:summary });
  assert.equal(audit.providerConfirmationRequiresUserConfirm, true);
  console.log("READ_ONLY_QUOTE_SESSION_REPORT_CENTER PASS");
}
main();
