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
    "apps/desktop/src/renderer/core/flightWorkflowSafetyRegressionSentinel.js",
    "apps/desktop/src/renderer/core/flightWorkflowOperatorConsole.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteSessionReportCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyLaunchCandidateFreezeGate.js",
    "apps/desktop/src/renderer/core/flightWorkflowEvidenceFreezePack.js",
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
    "apps/desktop/src/renderer/core/globalShoppingSandboxSessionReplayCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderEvidenceTrace.js",
    "apps/desktop/src/renderer/core/globalShoppingCandidateConfidenceExplainer.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxReplayViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxCandidateComparisonWorkbench.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderEvidenceComparisonMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyHandoffReadinessDrill.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxDecisionReviewViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyPlatformHandoffSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingRedactedSearchParameterPack.js",
    "apps/desktop/src/renderer/core/globalShoppingUserConfirmationChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformHandoffSimulationViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingManualPlatformReviewCockpit.js",
    "apps/desktop/src/renderer/core/globalShoppingHandoffAcceptanceWalkthrough.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformRealityCheckBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingManualPlatformReviewViewModel.js",
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
    "apps/desktop/src/renderer/core/globalShoppingPriceCandidateDisplayBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingProductGoalViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxHandoffViewModel.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyUserConsentFlow.js",
    "apps/desktop/src/renderer/core/flightWorkflowPublicPilotOnboardingGuard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotOnboardingViewModel.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotOpsSummary.js",
    "apps/desktop/src/renderer/core/flightWorkflowNextCohortDecisionBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotOpsViewModel.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotRolloutControlCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowCohortHealthDashboard.js",
    "apps/desktop/src/renderer/core/flightWorkflowRolloutControlViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingManualPlatformVisitPreparationCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformBoundaryBrief.js",
    "apps/desktop/src/renderer/core/globalShoppingFinalUserSafetyChecklist.js",
    "apps/desktop/src/renderer/core/globalShoppingPlatformVisitPreparationViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitRampPreview.js",
    "apps/desktop/src/renderer/core/globalShoppingManualVisitSafetyBrief.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlySessionClosurePack.js",
    "apps/desktop/src/renderer/core/globalShoppingExternalPlatformExitViewModel.js",
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
    "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceAuditConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingHumanPilotReadinessLedger.js",
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderReleaseFreezeGate.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceReleaseViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingCommerceSessionRecapViewModel.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteAuditExport.js",
    "apps/desktop/src/renderer/core/readOnlyQuoteRunTimeline.js",
    "apps/desktop/src/renderer/core/multiProviderSandboxDryRunOrchestrator.js",
    "apps/desktop/src/renderer/core/readOnlyPriceCandidateCardViewModel.js"
  ]);
  const api = windowRef.WeishanReadOnlyPriceCandidateCardViewModel;
  const dryRunApi = windowRef.WeishanMultiProviderSandboxDryRunOrchestrator;
  const dryRun = dryRunApi.runMultiProviderSandboxDryRun({ title:"购买7月15日上海到成都最便宜的直达机票", origin:"上海", destination:"成都", departureDate:"2026-07-15", directOnly:true, sortIntent:"低价优先" }, {});
  const comparisonWorkbenchSummary = { status:"ready", userFacingSummary:{ title:"Sandbox 候选对比工作台", resultLabel:"候选对比已准备", redacted:true }, candidateRows:[{ candidateId:"candidate_a", sourceName:"Official Fixture", confidenceLabel:"high", caveat:"该候选只表示当前 sandbox 证据下优先复核顺序，不代表最低价保证或交易能力。", redacted:true }], recommendationSummary:{ recommendedCandidateId:"candidate_a", reason:"Official Fixture 在当前 sandbox 证据下更适合先复核。", redacted:true }, redacted:true };
  const evidenceComparisonMatrixSummary = { status:"ready", userFacingSummary:{ title:"Provider 证据对比矩阵", resultLabel:"证据矩阵已准备", redacted:true }, matrixRows:[{ candidateId:"candidate_a", sourceName:"Official Fixture", completenessLabel:"完整", caveat:"当前矩阵只展示脱敏 sandbox 证据摘要。", redacted:true }], redacted:true };
  const handoffReadinessDrillSummary = { status:"ready", userFacingSummary:{ title:"只读跳转交接演练", resultLabel:"交接演练已准备", redacted:true }, rows:[{ rowId:"allowed_parameters", label:"允许参数", value:"origin, destination, date", status:"pass", redacted:true }], redacted:true };
  const decisionReviewViewModelSummary = { status:"ready", title:"Sandbox 候选决策复核", caveat:"当前仅用于复核 sandbox 候选，不代表真实价格、全网最低、锁价、可订、付款、下单或出票能力。", redacted:true };
  const pricePipelineSummary = { status:"ready", userFacingSummary:{ title:"全球购只读价格流水线", resultLabel:"只读价格流水线已准备", redacted:true }, providerEvidenceTraceSummary:{ status:"ready", redacted:true }, candidateConfidenceExplainerSummary:{ status:"ready", redacted:true }, sandboxCandidateComparisonWorkbenchSummary:comparisonWorkbenchSummary, providerEvidenceComparisonMatrixSummary:evidenceComparisonMatrixSummary, readOnlyHandoffReadinessDrillSummary:handoffReadinessDrillSummary, sandboxDecisionReviewViewModelSummary:decisionReviewViewModelSummary, manualPlatformReviewCockpitSummary:{ status:"ready", userFacingSummary:{ title:"手动平台复核驾驶舱", resultLabel:"手动平台复核驾驶舱已准备", redacted:true }, redacted:true }, handoffAcceptanceWalkthroughSummary:{ status:"ready", userFacingSummary:{ title:"交接包接受演练", resultLabel:"交接包接受演练已准备", redacted:true }, redacted:true }, platformRealityCheckBoardSummary:{ status:"ready", userFacingSummary:{ title:"平台真实页面复核清单", resultLabel:"平台真实页面复核清单已准备", redacted:true }, redacted:true }, manualPlatformReviewViewModelSummary:{ status:"ready", title:"手动平台复核与现实检查", redacted:true }, userFacingManualReviewFlowSummary:{ status:"ready", userFacingSummary:{ title:"用户手动复核流程", resultLabel:"用户手动复核流程已准备", redacted:true }, redacted:true }, platformVerificationProgressTrackerSummary:{ status:"ready", userFacingSummary:{ title:"平台核对进度追踪", resultLabel:"平台核对进度已准备", redacted:true }, progressRows:[{ itemId:"price", label:"实时价格", status:"user_must_verify", summary:"到平台后人工核对实时价格", redacted:true }], redacted:true }, safeNextActionPanelSummary:{ status:"ready", userFacingSummary:{ title:"安全下一步", resultLabel:"安全下一步已准备", redacted:true }, safeActionRows:[{ actionId:"manual_verify", label:"到平台后人工核对实时价格", kind:"safe", redacted:true }], forbiddenActionRows:[{ actionId:"forbidden_1", label:"立即购买：已阻断", kind:"blocked", redacted:true }], redacted:true }, userManualReviewViewModelSummary:{ status:"ready", title:"用户手动复核与安全下一步", userFacingSummary:{ title:"用户手动复核与安全下一步", resultLabel:"用户手动复核与安全下一步已准备", redacted:true }, redacted:true }, readOnlyCommerceSessionRecapCenterSummary:{ status:"ready", userFacingSummary:{ title:"只读全球购会话总结", resultLabel:"只读全球购会话总结已准备", redacted:true }, rows:[{ rowId:"summary_scope", label:"会话总结不保存、不导出", value:"当前只展示只读会话总结摘要", status:"pass", redacted:true }], redacted:true }, userTrustClosureSummarySummary:{ status:"ready", userFacingSummary:{ title:"用户信任闭环摘要", resultLabel:"用户信任闭环摘要已准备", redacted:true }, rows:[{ rowId:"trust_boundary", label:"平台页面为最终依据", value:"信任闭环不构成平台确认", status:"pass", redacted:true }], redacted:true }, nextFeatureReadinessGateSummary:{ status:"ready", userFacingSummary:{ title:"下一功能准备闸门", resultLabel:"下一功能准备闸门已准备", redacted:true }, rows:[{ rowId:"next_boundary", label:"下一功能闸门不接真实 provider", value:"只评估 readiness，不接真实 provider", status:"pass", redacted:true }], redacted:true }, providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ title:"Provider 法务审查档案", resultLabel:"法务审查档案已准备", redacted:true }, redacted:true }, credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ title:"凭证保险箱接口桩", resultLabel:"凭证接口桩已准备", redacted:true }, redacted:true }, sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Adapter 合同测试台", resultLabel:"Adapter 合同测试台已准备", redacted:true }, redacted:true }, providerIntegrationPrepViewModelSummary:{ status:"ready", title:"Provider 接入前准备", userFacingSummary:{ title:"Provider 接入前准备", resultLabel:"Provider 接入前准备已准备", redacted:true }, redacted:true }, sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Provider Mock Runtime", resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true }, redacted:true }, vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ title:"Vault Boundary Contract", resultLabel:"Vault 边界合同已准备", redacted:true }, redacted:true }, legalApprovalWorkflowBoardSummary:{ status:"ready", userFacingSummary:{ title:"法务审批流程板", resultLabel:"法务审批流程板已准备", redacted:true }, redacted:true }, providerMockRuntimeViewModelSummary:{ status:"ready", title:"Provider Mock Runtime 与审批准备", userFacingSummary:{ title:"Provider Mock Runtime 与审批准备", resultLabel:"Provider Mock Runtime 与审批准备已准备", redacted:true }, redacted:true }, mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ title:"Mock Provider Adapter 注册运行时", resultLabel:"Mock Adapter 注册运行时已准备", redacted:true }, rows:[{ rowId:"mock_registry", label:"Mock Adapter 注册", value:"只允许 mock / fixture / dry_run / contract_only", status:"pass", redacted:true }], redacted:true }, providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ title:"Provider 合同回放器", resultLabel:"Provider 合同回放器已准备", redacted:true }, rows:[{ rowId:"contract_replay", label:"合同回放", value:"只回放脱敏 contract case", status:"pass", redacted:true }], redacted:true }, providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ title:"Provider 启动准备总闸门", resultLabel:"Provider 启动准备总闸门已准备", redacted:true }, rows:[{ rowId:"launch_readiness", label:"启动准备", value:"真实 sandbox provider 仍需人工审批", status:"pass", redacted:true }], redacted:true }, providerLaunchReadinessViewModelSummary:{ status:"ready", title:"Provider 启动准备与合同回放", userFacingSummary:{ title:"Provider 启动准备与合同回放", resultLabel:"Provider 启动准备与合同回放已准备", redacted:true }, redacted:true }, providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ title:"Provider Sandbox Pilot 控制室", resultLabel:"Sandbox Pilot 控制室已准备", redacted:true }, redacted:true }, mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ title:"Mock Provider 事故演练", resultLabel:"Mock 事故演练已准备", redacted:true }, redacted:true }, productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ title:"Production 阻断矩阵", resultLabel:"Production 阻断矩阵已准备", redacted:true }, redacted:true }, providerPilotControlViewModelSummary:{ status:"ready", title:"Provider Sandbox Pilot 控制与阻断", userFacingSummary:{ title:"Provider Sandbox Pilot 控制与阻断", resultLabel:"Provider Sandbox Pilot 控制与阻断已准备", redacted:true }, redacted:true }, providerGovernanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ title:"Provider Governance 审计控制台", resultLabel:"治理审计控制台已准备", redacted:true }, rows:[{ rowId:"audit", label:"治理审计", value:"治理审计控制台已准备", status:"pass", redacted:true }], redacted:true }, humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ title:"Human Pilot 准备台账", resultLabel:"Human Pilot 准备台账已准备", redacted:true }, rows:[{ rowId:"ledger", label:"Human Pilot", value:"Human Pilot 准备台账已准备", status:"pass", redacted:true }], redacted:true }, sandboxProviderReleaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Provider Release Freeze Gate", resultLabel:"Release Freeze Gate 已准备", redacted:true }, rows:[{ rowId:"freeze", label:"Release Freeze", value:"Release Freeze Gate 已准备", status:"pass", redacted:true }], redacted:true }, providerGovernanceReleaseViewModelSummary:{ status:"ready", title:"Provider Governance 发布审计与冻结闸门", redacted:true }, manualGovernanceReleaseDecisionRoomSummary:{ status:"ready", userFacingSummary:{ title:"Manual Governance Release 决策室", resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true }, sandboxPilotExceptionRegisterSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Pilot 例外登记簿", resultLabel:"例外登记簿已准备", redacted:true }, redacted:true }, providerReadinessSignOffPacketSummary:{ status:"ready", userFacingSummary:{ title:"Provider 准备签核包", resultLabel:"准备签核包已准备", redacted:true }, redacted:true }, providerManualReleaseViewModelSummary:{ status:"ready", title:"Provider 人工发布决策与签核", redacted:true }, commerceSessionRecapViewModelSummary:{ status:"ready", title:"只读全球购会话总结与下一步准备", userFacingSummary:{ title:"只读全球购会话总结与下一步准备", resultLabel:"只读全球购会话总结与下一步准备已准备", redacted:true }, redacted:true }, readyOutputs:{ safeToProceedWithSandboxDecisionReview:true, safeToProceedWithManualPlatformReview:true, safeToProceedWithManualPlatformUserEducation:true, safeToProceedWithManualExternalPlatformVisitEducation:true, safeToProceedWithReadOnlyProviderSandboxPlanning:true, safeToProceedWithProviderSandboxContractImplementation:true, safeToProceedWithMockAdapterRuntimeHardening:true, safeToProceedWithHumanProviderSandboxApproval:true, safeToProceedWithHumanControlledSandboxProviderPilotPlan:true, safeToProceedWithManualProviderSignOffReview:false }, redacted:true };
  const candidateJourneySummary = { status:"ready", title:"全球购只读候选旅程", redacted:true };
  assert.equal(api.READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION, "2.4.1");
  const card = api.buildReadOnlyPriceCandidateCardViewModel({ continuitySummary:{ status:"resumable", currentStage:"decision", stageLabel:"选择候选", resumePlan:{ nextStepLabel:"确认前往平台", canResume:true } }, confirmationStateSummary:{ labels:["已选择候选"] }, recoverySummary:{ status:"resumable" }, resumeCoachSummary:{ allowedActions:[{ label:"前往平台确认" }] }, currentStage:"decision", workflowStageLabel:"选择候选", nextStepLabel:"确认前往平台", canResumeWorkflow:true, resumeActions:[{ label:"前往平台确认" }], blockedActions:[{ label:"付款" }], actionPolicyDecision:{ status:"requires_confirmation" }, workflowStateSummary:{ status:"evidence_ready" }, clarificationSummary:{ status:"complete" }, workflowStepList:[{ label:"生成候选证据", status:"completed" }], missingFields:[], clarificationQuestions:[], workflowUserMessage:"候选证据已生成，平台最终为准。", sandboxDryRunSummary:dryRun, runTimelineSummary:dryRun.runTimelineSummary, providerRunMatrix:dryRun.providerRunMatrix, dryRunStatus:dryRun.status, dryRunButton:{ label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false }, dryRunTopCandidates:dryRun.dryRunTopCandidates, task:{ title:"7月15日上海到成都最便宜的机票" }, providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", providerSandboxDryRunHarnessSummary:{ status:"ready", userFacingSummary:{ title:"Provider Sandbox 干跑框架", resultLabel:"干跑框架已准备", redacted:true }, redacted:true }, pricePipelineOrchestratorSummary:pricePipelineSummary, readOnlyCandidateJourneySummary:candidateJourneySummary, sandboxCandidateComparisonWorkbenchSummary:comparisonWorkbenchSummary, providerEvidenceComparisonMatrixSummary:evidenceComparisonMatrixSummary, readOnlyHandoffReadinessDrillSummary:handoffReadinessDrillSummary, sandboxDecisionReviewViewModelSummary:decisionReviewViewModelSummary, report:{ provider:{ providerMode:"fixture" }, handoff:{ safeProviderHandoffUrl:"https://www.google.com/travel/flights" }, rankingPreview:{ sourceBreakdown:{ providerCount:3, providerIds:["flight_provider_trusted_fixture","trip_com_sandbox_stub","airline_official_sandbox_stub"], fareSources:["sandbox_read_only_import"] }, rankingExplanation:"仅按导入样本中的只读候选证据排序，平台最终为准。" }, selectedCandidate:{ providerName:"Airline Official Sandbox Stub", responseShape:"airline_official_stub_quote", selectedSourceSummary:"来源：Airline Official Sandbox Stub / airline_official_stub_quote" } }, sourceBreakdown:{ providerCount:3, providerIds:["flight_provider_trusted_fixture","trip_com_sandbox_stub","airline_official_sandbox_stub"], fareSources:["sandbox_read_only_import"] }, selectedSourceSummary:"来源：Airline Official Sandbox Stub / airline_official_stub_quote", rankingExplanation:"仅按导入样本中的只读候选证据排序，平台最终为准。", flightFields:{ origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", goal:"低价优先", directPreference:"直达优先" }, topCandidates:[{ rank:1, quoteId:"q930", providerName:"Airline Official Sandbox Stub", responseShape:"airline_official_stub_quote", fareSource:"sandbox_read_only_import", currency:"CNY", baseFare:780, taxesAndFees:130, providerFees:20, totalPrice:930, safeProviderHandoffReady:true, safeProviderHandoffUrl:"https://www.google.com/travel/flights", bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true }] });
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
  assert.equal(card.readOnlyConsentSummary.status, "missing_required_items");
  assert.equal(card.pilotOnboardingSummary.status, "needs_internal_testing");
  assert.equal(card.pilotEntryStatus, "needs_internal_testing");
  assert.equal(card.canEnterReadOnlyPilot, false);
  assert.equal(card.pilotConsentRequired, true);
  assert.equal(card.pilotOnboardingViewModel.title, "只读试点进入确认");
  assert.equal(card.rolloutControlSummary.centerName, "flight_workflow_read_only_pilot_rollout_control_center_v1");
  assert.equal(card.cohortHealthSummary.dashboardName, "flight_workflow_cohort_health_dashboard_v1");
  assert.equal(card.rolloutControlViewModel.title, "只读试点发布控制中心");
  assert.equal(card.rcReviewStatus, "blocked");
  assert.equal(card.safeToStartRcReview, false);
  assert.equal(card.rcReviewViewModelSummary.title, "只读 RC 候选复核");
  assert.equal(card.rcRegressionAuditSummary.userFacingSummary.title, "只读 RC 回归审计包");
  assert.equal(card.releaseRiskLedgerSummary.userFacingSummary.title, "只读发布风险台账");
  assert.equal(card.rcRegressionViewModelSummary.title, "只读 RC 回归审计");
  assert.equal(card.rcRegressionStatus, "blocked");
  assert.equal(card.releaseRiskStatus, "needs_review");
  assert.equal(card.rcCopyFinalizationSummary.userFacingSummary.title, "只读 RC 用户可见文案定稿");
  assert.equal(card.safetyDisclosureReviewSummary.userFacingSummary.title, "安全披露复核板");
  assert.equal(card.rcCopyReviewViewModelSummary.title, "只读 RC 文案定稿与安全披露");
  assert.ok(["finalized", "needs_review", "approved"].includes(card.rcCopyReviewStatus));
  assert.ok(["approved", "needs_review", "blocked"].includes(card.safetyDisclosureStatus));
  assert.equal(typeof card.safeToFinalizeUserFacingCopy, "boolean");
  assert.equal(card.globalShoppingProductGoalSummary.userFacingSummary.title, "全球购产品目标");
  assert.equal(card.jumpToPlatformBoundarySummary.userFacingSummary.title, "跳转至平台自行下单边界");
  assert.equal(card.globalShoppingProductGoalViewModelSummary.title, "全球购产品目标与跳转边界");
  assert.equal(card.readOnlyProviderSandboxConnectorSummary.userFacingSummary.title, "只读 Provider Sandbox Connector");
  assert.equal(card.fixtureReplayConsoleSummary.userFacingSummary.title, "Fixture 回放控制台");
  assert.equal(card.normalizedPriceCandidateBoardSummary.title, "归一化价格候选板");
  assert.equal(card.providerSandboxDryRunHarnessSummary.userFacingSummary.title, "Provider Sandbox 干跑框架");
  assert.equal(card.firstReadOnlyProviderAdapterShellSummary.userFacingSummary.title, "第一个只读 Provider Adapter 外壳");
  assert.equal(card.providerSandboxSafetyKillSwitchSummary.userFacingSummary.title, "Provider Sandbox 安全熔断器");
  assert.equal(card.providerSandboxDryRunViewModelSummary.title, "Provider Sandbox 离线 Dry-run");
  assert.equal(card.providerAdapterRegistrySummary.userFacingSummary.title, "Provider Adapter 注册表");
  assert.equal(card.dryRunProviderResponseNormalizerSummary.userFacingSummary.title, "Dry-Run Provider 响应归一化器");
  assert.equal(card.sandboxProviderRunbookSummary.userFacingSummary.title, "Sandbox Provider 接入运行手册");
  assert.equal(card.providerAdapterRegistryViewModelSummary.title, "Provider Adapter 注册与接入手册");
  assert.equal(card.firstSandboxProviderConnectorSummary.userFacingSummary.title, "第一个 Sandbox Provider Connector");
  assert.equal(card.providerCoverageDashboardSummary.userFacingSummary.title, "Provider 覆盖看板");
  assert.equal(card.readOnlySourceTrustScoreSummary.userFacingSummary.title, "只读来源可信度评分");
  assert.equal(card.providerCoverageViewModelSummary.title, "Provider 覆盖与来源可信度");
  assert.equal(card.readOnlyProviderSandboxIntegrationGateSummary.userFacingSummary.title, "只读 Provider Sandbox 接入闸门");
  assert.equal(card.sandboxPriceCandidateSessionSummary.userFacingSummary.title, "Sandbox 价格候选会话");
  assert.equal(card.sandboxPriceCandidateResultBoardSummary.title, "Sandbox 价格候选结果");
  assert.equal(card.legalProviderFixtureSummary.userFacingSummary.title, "合法 Provider Fixture 适配器");
  assert.equal(card.providerCredentialSafetySummary.userFacingSummary.title, "Provider 凭据安全复核");
  assert.equal(card.sandboxPriceFeedSummary.userFacingSummary.title, "Sandbox 价格 Feed 闸门");
  assert.equal(card.sandboxProviderResponseContractSummary.userFacingSummary.title, "Sandbox Provider 响应合同");
  assert.equal(card.pricePipelineOrchestratorSummary.userFacingSummary.title, "全球购只读价格流水线");
  assert.equal(card.readOnlyCandidateJourneySummary.title, "全球购只读候选旅程");
  assert.equal(card.providerFixtureViewModelSummary.title, "合法 Provider Fixture 与 Sandbox 价格 Feed");
  assert.equal(card.globalShoppingGoalStatus, "aligned");
  assert.equal(card.jumpBoundaryStatus, "safe");
  assert.equal(card.safeToProceedWithJumpToPlatformMvp, true);
  assert.equal(card.sameItemMatcherSummary.userFacingSummary.title, "同款候选识别");
  assert.equal(card.duplicateCandidateMergerSummary.userFacingSummary.title, "重复候选合并");
  assert.equal(card.coveredLowestCandidateBoardSummary.title, "已覆盖来源候选价合并");
  assert.equal(card.externalDeepLinkSafetySummary.userFacingSummary.title, "外部平台跳转安全闸门");
  assert.equal(card.searchParameterPrefillSummary.userFacingSummary.title, "搜索参数预填闸门");
  assert.equal(card.jumpToPlatformHandoffPreviewSummary.title, "跳转至平台查看");
  assert.equal(card.sandboxDeepLinkCandidateSummary.userFacingSummary.title, "Sandbox 跳转候选");
  assert.equal(card.platformAvailabilitySummary.userFacingSummary.title, "平台可用性");
  assert.equal(card.partnerLinkPolicySummary.userFacingSummary.title, "合作/联盟链接政策");
  assert.equal(card.sandboxHandoffViewModelSummary.title, "Sandbox 跳转候选与平台可用性");
  assert.equal(card.manualPlatformReviewCockpitSummary.userFacingSummary.title, "手动平台复核驾驶舱");
  assert.equal(card.externalPlatformExitRampPreviewSummary.userFacingSummary.title, "外部平台退出坡道预览");
  assert.equal(card.manualVisitSafetyBriefSummary.userFacingSummary.title, "手动访问安全简报");
  assert.equal(card.readOnlySessionClosurePackSummary.userFacingSummary.title, "只读会话关闭包");
  assert.equal(card.externalPlatformExitViewModelSummary.title, "外部平台手动访问前最终说明");
  assert.equal(card.externalPlatformExitRampStatus, "ready");
  assert.equal(card.manualVisitSafetyBriefStatus, "ready");
  assert.equal(card.readOnlySessionClosureStatus, "ready");
  assert.equal(card.externalPlatformExitViewModelStatus, "ready");
  assert.equal(card.handoffAcceptanceWalkthroughSummary.userFacingSummary.title, "交接包接受演练");
  assert.equal(card.platformRealityCheckBoardSummary.userFacingSummary.title, "平台真实页面复核清单");
  assert.equal(card.manualPlatformReviewViewModelSummary.title, "手动平台复核与现实检查");
  assert.equal(card.userFacingManualReviewFlowSummary.userFacingSummary.title, "用户手动复核流程");
  assert.equal(card.platformVerificationProgressTrackerSummary.userFacingSummary.title, "平台核对进度追踪");
  assert.equal(card.safeNextActionPanelSummary.userFacingSummary.title, "安全下一步");
  assert.equal(card.userManualReviewViewModelSummary.title, "用户手动复核与安全下一步");
  assert.equal(card.readOnlyCommerceSessionRecapCenterSummary.userFacingSummary.title, "只读全球购会话总结");
  assert.equal(card.userTrustClosureSummarySummary.userFacingSummary.title, "用户信任闭环摘要");
  assert.equal(card.nextFeatureReadinessGateSummary.userFacingSummary.title, "下一功能准备闸门");
  assert.equal(card.providerLegalReviewDossierSummary.userFacingSummary.title, "Provider 法务审查档案");
  assert.equal(card.credentialVaultInterfaceStubSummary.userFacingSummary.title, "凭证保险箱接口桩");
  assert.equal(card.sandboxAdapterContractTestbedSummary.userFacingSummary.title, "Sandbox Adapter 合同测试台");
  assert.equal(card.providerIntegrationPrepViewModelSummary.title, "Provider 接入前准备");
  assert.equal(card.sandboxProviderMockRuntimeSummary.userFacingSummary.title, "Sandbox Provider Mock Runtime");
  assert.equal(card.vaultBoundaryContractSummary.userFacingSummary.title, "Vault Boundary Contract");
  assert.equal(card.legalApprovalWorkflowBoardSummary.userFacingSummary.title, "法务审批流程板");
  assert.equal(card.providerMockRuntimeViewModelSummary.title, "Provider Mock Runtime 与审批准备");
  assert.equal(card.mockProviderAdapterRegistryRuntimeSummary.userFacingSummary.title, "Mock Provider Adapter 注册运行时");
  assert.equal(card.providerContractReplayHarnessSummary.userFacingSummary.title, "Provider 合同回放器");
  assert.equal(card.providerLaunchReadinessBoardSummary.userFacingSummary.title, "Provider 启动准备总闸门");
  assert.equal(card.providerLaunchReadinessViewModelSummary.title, "Provider 启动准备与合同回放");
  assert.equal(card.providerSandboxPilotControlRoomSummary.userFacingSummary.title, "Provider Sandbox Pilot 控制室");
  assert.equal(card.mockProviderIncidentDrillSummary.userFacingSummary.title, "Mock Provider 事故演练");
  assert.equal(card.productionBlockerMatrixSummary.userFacingSummary.title, "Production 阻断矩阵");
  assert.equal(card.providerPilotControlViewModelSummary.title, "Provider Sandbox Pilot 控制与阻断");
  assert.equal(card.providerGovernanceAuditConsoleSummary.userFacingSummary.title, "Provider Governance 审计控制台");
  assert.equal(card.humanPilotReadinessLedgerSummary.userFacingSummary.title, "Human Pilot 准备台账");
  assert.equal(card.sandboxProviderReleaseFreezeGateSummary.userFacingSummary.title, "Sandbox Provider Release Freeze Gate");
  assert.equal(card.providerGovernanceReleaseViewModelSummary.title, "Provider Governance 发布审计与冻结闸门");
  assert.equal(card.manualGovernanceReleaseDecisionRoomSummary.userFacingSummary.title, "Manual Governance Release 决策室");
  assert.equal(card.sandboxPilotExceptionRegisterSummary.userFacingSummary.title, "Sandbox Pilot 例外登记簿");
  assert.equal(card.providerReadinessSignOffPacketSummary.userFacingSummary.title, "Provider 准备签核包");
  assert.equal(card.providerManualReleaseViewModelSummary.title, "Provider 人工发布决策与签核");
  assert.equal(card.commerceSessionRecapViewModelSummary.title, "只读全球购会话总结与下一步准备");
  assert.equal(card.sameItemMatcherStatus, "ready");
  assert.equal(card.duplicateMergeStatus, "merged");
  assert.equal(card.coveredLowestStatus, "ready");
  assert.equal(card.legalProviderFixtureStatus, "ready");
  assert.equal(card.providerCredentialSafetyStatus, "ready");
  assert.equal(card.sandboxPriceFeedStatus, "ready");
  assert.equal(card.sandboxProviderResponseContractStatus, "ready");
  assert.equal(card.readOnlyProviderSandboxConnectorStatus, "ready");
  assert.equal(card.fixtureReplayStatus, "ready");
  assert.equal(card.normalizedPriceCandidateBoardStatus, "ready");
  assert.equal(card.providerSandboxDryRunStatus, "ready");
  assert.equal(card.providerAdapterShellStatus, "ready");
  assert.equal(card.providerKillSwitchStatus, "clear");
  assert.equal(card.providerSandboxDryRunViewModelStatus, "needs_review");
  assert.equal(card.providerAdapterRegistryStatus, "ready");
  assert.equal(card.providerGovernanceAuditConsoleStatus, "ready");
  assert.equal(card.humanPilotReadinessLedgerStatus, "ready");
  assert.equal(card.sandboxProviderReleaseFreezeGateStatus, "ready");
  assert.equal(card.providerGovernanceReleaseViewModelStatus, "ready");
  assert.equal(card.safeToProceedWithManualGovernanceReleaseDecision, false);
  assert.equal(card.manualGovernanceReleaseDecisionRoomStatus, "ready");
  assert.equal(card.sandboxPilotExceptionRegisterStatus, "ready");
  assert.equal(card.providerReadinessSignOffPacketStatus, "ready");
  assert.equal(card.providerManualReleaseViewModelStatus, "ready");
  assert.equal(card.safeToProceedWithManualProviderSignOffReview, false);
  assert.equal(card.dryRunResponseNormalizerStatus, "ready");
  assert.equal(card.sandboxProviderRunbookStatus, "ready");
  assert.equal(card.providerAdapterRegistryViewModelStatus, "ready");
  assert.equal(card.firstSandboxProviderConnectorStatus, "ready");
  assert.equal(card.providerCoverageStatus, "ready");
  assert.equal(card.sourceTrustStatus, "ready");
  assert.equal(card.providerCoverageViewModelStatus, "ready");
  assert.equal(card.providerSandboxIntegrationGateStatus, "ready");
  assert.equal(card.sandboxPriceCandidateSessionStatus, "ready");
  assert.equal(card.sandboxPriceCandidateResultBoardStatus, "ready");
  assert.equal(card.pricePipelineStatus, "ready");
  assert.equal(card.readOnlyCandidateJourneyStatus, "ready");
  assert.equal(card.externalDeepLinkSafetyStatus, "safe");
  assert.equal(card.searchPrefillStatus, "safe");
  assert.equal(card.manualPlatformReviewCockpitStatus, "ready");
  assert.equal(card.handoffAcceptanceWalkthroughStatus, "ready");
  assert.equal(card.platformRealityCheckStatus, "ready");
  assert.equal(card.manualPlatformReviewViewModelStatus, "ready");
  assert.equal(card.userFacingManualReviewFlowStatus, "ready");
  assert.equal(card.platformVerificationProgressStatus, "ready");
  assert.equal(card.safeNextActionPanelStatus, "ready");
  assert.equal(card.userManualReviewViewModelStatus, "ready");
  assert.equal(card.readOnlyCommerceSessionRecapStatus, "ready");
  assert.equal(card.userTrustClosureSummaryStatus, "ready");
  assert.equal(card.nextFeatureReadinessGateStatus, "ready");
  assert.equal(card.providerLegalReviewStatus, "ready");
  assert.equal(card.credentialVaultInterfaceStatus, "ready");
  assert.equal(card.sandboxAdapterContractStatus, "ready");
  assert.equal(card.providerIntegrationPrepViewModelStatus, "ready");
  assert.equal(card.sandboxProviderMockRuntimeStatus, "ready");
  assert.equal(card.vaultBoundaryContractStatus, "ready");
  assert.equal(card.legalApprovalWorkflowStatus, "ready");
  assert.equal(card.providerMockRuntimeViewModelStatus, "ready");
  assert.equal(card.mockProviderAdapterRegistryStatus, "ready");
  assert.equal(card.providerContractReplayStatus, "ready");
  assert.equal(card.providerLaunchReadinessStatus, "ready");
  assert.equal(card.providerLaunchReadinessViewModelStatus, "ready");
  assert.equal(card.commerceSessionRecapViewModelStatus, "ready");
  assert.equal(card.safeToProceedWithManualExternalPlatformVisitEducation, true);
  assert.equal(card.safeToProceedWithManualPlatformUserEducation, true);
  assert.equal(card.safeToProceedWithReadOnlyProviderSandboxPlanning, true);
  assert.equal(card.safeToProceedWithProviderSandboxContractImplementation, true);
  assert.equal(card.safeToProceedWithMockAdapterRuntimeHardening, true);
  assert.equal(card.safeToProceedWithHumanProviderSandboxApproval, true);
  assert.equal(card.safeToProceedWithHumanControlledSandboxProviderPilotPlan, true);
  assert.equal(card.handoffPreviewStatus, "ready");
  assert.equal(card.safeToProceedWithReadOnlyPriceProviderSandbox, true);
  assert.equal(card.safeToProceedWithFirstRealReadOnlyProviderSandbox, true);
  assert.equal(card.safeToProceedWithFirstProviderSandboxFixtureDryRun, false);
  assert.equal(card.safeToProceedWithFirstSandboxProviderConnectorImplementation, true);
  assert.equal(card.safeToProceedWithFirstReadOnlyProviderSandboxIntegration, true);
  assert.equal(card.safeToProceedWithSandboxCandidateUserPreview, true);
  assert.equal(card.safeToProceedWithDeepLinkSafetyGate, true);
  assert.equal(card.safeToProceedWithSandboxDeepLinkCandidate, true);
  assert.equal(card.safeToProceedWithPartnerFixtureAdapter, true);
  assert.equal(card.safeToProceedWithRealReadOnlyProviderSandbox, true);
  assert.equal(card.confirmationUi.continueButtonDisabled, false);
  assert.equal(card.bookingUrl, null);
  assert.equal(card.sandboxCandidateComparisonWorkbenchSummary.userFacingSummary.title, "Sandbox 候选对比工作台");
  assert.equal(card.providerEvidenceComparisonMatrixSummary.userFacingSummary.title, "Provider 证据对比矩阵");
  assert.equal(card.readOnlyHandoffReadinessDrillSummary.userFacingSummary.title, "只读跳转交接演练");
  assert.equal(card.sandboxDecisionReviewViewModelSummary.title, "Sandbox 候选决策复核");
  assert.equal(card.safeToProceedWithSandboxDecisionReview, true);
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
  assert.equal(card.sessionSummary.sessionId, "deterministic-read-only-quote-session-v2.4.1");
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
  assert.equal(html.includes("离线 Sandbox Trace 检查器"), true);
  assert.equal(html.includes("Mock Provider 结果归一化器"), true);
  assert.equal(html.includes("人工激活 Dry-run 检查清单"), true);
  assert.equal(html.includes("平台访问准备与最终安全清单"), true);
  assert.equal(html.includes("手动访问平台准备中心"), true);
  assert.equal(html.includes("外部平台边界说明"), true);
  assert.equal(html.includes("最终用户安全清单"), true);
  assert.equal(html.includes("平台访问准备"), true);
  assert.equal(html.includes("平台边界说明"), true);
  assert.equal(html.includes("最终安全清单"), true);
  assert.equal(html.includes("手动访问平台准备已完成"), true);
  assert.equal(html.includes("外部平台边界说明已准备"), true);
  assert.equal(html.includes("最终用户安全清单已准备"), true);
  assert.equal(html.includes("Weishan 不代表外部平台"), true);
  assert.equal(html.includes("平台页面为最终依据"), true);
  assert.equal(html.includes("最终安全清单不保存用户勾选"), true);
  assert.equal(html.includes("离开 Weishan 后由用户自行判断"), true);
  assert.equal(html.includes("当前只展示平台访问准备、外部平台边界和最终安全清单"), true);
  assert.equal(html.includes("不打开平台，不保存选择，不构成订单、付款授权或签名"), true);
  assert.equal(html.includes("Provider 接入前准备"), true);
  assert.equal(html.includes("Provider 法务审查档案"), true);
  assert.equal(html.includes("凭证保险箱接口桩"), true);
  assert.equal(html.includes("Sandbox Adapter 合同测试台"), true);
  assert.equal(html.includes("法务审查不代表已合作或已授权"), true);
  assert.equal(html.includes("凭证接口桩不读取真实密钥"), true);
  assert.equal(html.includes("Adapter 合同测试不请求真实 provider"), true);
  assert.equal(html.includes("下一步仍需人工安全审批"), true);
  assert.equal(html.includes("当前只展示 provider 接入前准备"), true);
  assert.equal(html.includes("Provider Mock Runtime 与审批准备"), true);
  assert.equal(html.includes("Sandbox Provider Mock Runtime"), true);
  assert.equal(html.includes("Vault Boundary Contract"), true);
  assert.equal(html.includes("法务审批流程板"), true);
  assert.equal(html.includes("Mock Runtime 不接真实 provider"), true);
  assert.equal(html.includes("Vault 边界不读取或保存真实密钥"), true);
  assert.equal(html.includes("审批流程不创建任务、不发邮件"), true);
  assert.equal(html.includes("当前只展示 provider mock runtime、vault 边界和审批准备"), true);
  assert.equal(html.includes("不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider"), true);
  assert.equal(html.includes("Provider Sandbox Pilot 控制与阻断"), true);
  assert.equal(html.includes("Provider Sandbox Pilot 控制室"), true);
  assert.equal(html.includes("Mock Provider 事故演练"), true);
  assert.equal(html.includes("Production 阻断矩阵"), true);
  assert.equal(html.includes("Pilot 控制室不启动真实 provider"), true);
  assert.equal(html.includes("事故演练不触发真实告警或回滚"), true);
  assert.equal(html.includes("阻断矩阵不修改运行配置"), true);
  assert.equal(html.includes("当前只展示 sandbox pilot 控制、mock 事故演练和 production 阻断矩阵"), true);
  assert.equal(html.includes("只允许只读 adapter 注册"), true);
  assert.equal(html.includes("不接收 raw provider response"), true);
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
  assert.equal(html.includes("只读试点进入确认"), true);
  assert.equal(html.includes("进入只读试点前请确认"), true);
  assert.equal(html.includes("只读试点用户确认"), true);
  assert.equal(html.includes("我知道当前只是只读候选证据"), true);
  assert.equal(html.includes("仍有必选项未确认"), true);
  assert.equal(html.includes("只读试点不代表交易授权"), true);
  assert.equal(html.includes("只读试点发布控制中心"), true);
  assert.equal(html.includes("只读试点运营摘要"), true);
  assert.equal(html.includes("下一批只读测试决策板"), true);
  assert.equal(html.includes("测试批次健康看板"), true);
  assert.equal(html.includes("发布控制"), true);
  assert.equal(html.includes("批次健康"), true);
  assert.equal(html.includes("问题风险"), true);
  assert.equal(html.includes("该页面只管理只读试点流程"), true);
  assert.equal(html.includes("不保存真实身份、不发送真实邀请、不提供交易能力"), true);
  assert.equal(html.includes("只读 RC 候选复核控制台"), true);
  assert.equal(html.includes("只读 RC 候选复核"), true);
  assert.equal(html.includes("只读 RC 证据复核清单"), true);
  assert.equal(html.includes("只读 RC 回归审计"), true);
  assert.equal(html.includes("只读 RC 回归审计包"), true);
  assert.equal(html.includes("只读发布风险台账"), true);
  assert.equal(html.includes("只读 RC 文案定稿与安全披露"), true);
  assert.equal(html.includes("只读 RC 用户可见文案定稿"), true);
  assert.equal(html.includes("安全披露复核板"), true);
  assert.equal(html.includes("全球购产品目标与跳转边界"), true);
  assert.equal(html.includes("全球购产品目标"), true);
  assert.equal(html.includes("合法 Provider Fixture 与 Sandbox 价格 Feed"), true);
  assert.equal(html.includes("合法 Provider Fixture 适配器"), true);
  assert.equal(html.includes("Provider 凭据安全复核"), true);
  assert.equal(html.includes("Sandbox 价格 Feed 闸门"), true);
  assert.equal(html.includes("查看 Provider Fixture"), true);
  assert.equal(html.includes("查看凭据安全"), true);
  assert.equal(html.includes("查看 Sandbox 价格 Feed"), true);
  assert.equal(html.includes("不读取生产密钥"), true);
  assert.equal(html.includes("不保存 raw provider response"), true);
  assert.equal(html.includes("Provider fixture 不代表真实价格"), true);
  assert.equal(html.includes("跳转至平台自行下单边界"), true);
  assert.equal(html.includes("跳转至平台查看"), true);
  assert.equal(html.includes("Sandbox 跳转候选与平台可用性"), true);
  assert.equal(html.includes("查看 Sandbox 跳转候选"), true);
  assert.equal(html.includes("查看平台可用性"), true);
  assert.equal(html.includes("查看合作链接政策"), true);
  assert.equal(html.includes("合作链接披露"), true);
  assert.equal(html.includes("合作链接不代表最低价"), true);
  assert.equal(html.includes("平台页面为实时价格准绳"), true);
  assert.equal(html.includes("Sandbox 跳转不打开真实平台"), true);
  assert.equal(html.includes("外部平台跳转安全闸门"), true);
  assert.equal(html.includes("搜索参数预填闸门"), true);
  assert.equal(html.includes("Provider Sandbox 离线 Dry-run"), true);
  assert.equal(html.includes("离线 Sandbox Trace 检查器"), true);
  assert.equal(html.includes("Mock Provider 结果归一化器"), true);
  assert.equal(html.includes("人工激活 Dry-run 检查清单"), true);
  assert.equal(html.includes("离线 Trace 检查不保存 raw trace"), true);
  assert.equal(html.includes("Mock 结果归一化不处理真实 provider response"), true);
  assert.equal(html.includes("激活 Dry-run 不激活 sandbox、不创建 release"), true);
  assert.equal(html.includes("Manual sandbox dry-run 仍需人工复核"), true);
  assert.equal(html.includes("当前只展示 provider sandbox 离线 dry-run"), true);
  assert.equal(html.includes("目标平台"), true);
  assert.equal(html.includes("可带入搜索条件"), true);
  assert.equal(html.includes("不保存平台账号"), true);
  assert.equal(html.includes("不保存证件银行卡"), true);
  assert.equal(html.includes("不保存支付凭证"), true);
  assert.equal(html.includes("本轮仅展示只读跳转预览，不打开真实平台"), true);
  assert.equal(html.includes("跳转预览不代表下单能力"), true);
  assert.equal(html.includes("同款候选识别"), true);
  assert.equal(html.includes("重复候选合并"), true);
  assert.equal(html.includes("已覆盖来源候选价合并"), true);
  assert.equal(html.includes("可信候选价格"), true);
  assert.equal(html.includes("官方价格锚点"), true);
  assert.equal(html.includes("合法平台候选价"), true);
  assert.equal(html.includes("平台自行下单"), true);
  assert.equal(html.includes("当前已覆盖来源中的较低候选价"), true);
  assert.equal(html.includes("与官方价对比"), true);
  assert.equal(html.includes("已接入平台候选价"), true);
  assert.equal(html.includes("价格以跳转后平台实时页面为准"), true);
  assert.equal(html.includes("当前仅提供只读候选证据，不提供付款、下单或出票能力"), true);
  assert.equal(html.includes("Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单"), true);
  assert.equal(html.includes("禁止最低价相关承诺"), true);
  assert.equal(html.includes("禁止自动下单承诺"), true);
  assert.equal(html.includes("跳转不代表交易能力"), true);
  assert.equal(html.includes("查看全球购产品目标"), true);
  assert.equal(html.includes("查看跳转边界"), true);
  assert.equal(html.includes("回归审计"), true);
  assert.equal(html.includes("发布风险"), true);
  assert.equal(html.includes("RC 回归审计通过"), true);
  assert.equal(html.includes("RC 文案可以定稿"), true);
  assert.equal(html.includes("安全披露通过"), true);
  assert.equal(html.includes("文案不代表交易能力"), true);
  assert.equal(html.includes("回归不代表交易能力"), true);
  assert.equal(html.includes("复核不代表交易能力"), true);
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
  assert.equal(/(^|[^禁止])全网最低承诺/.test(rankedHtml), false);
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
  assert.equal(commerceAgentPageSource.includes("[data-commerce-flight-rc-review-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-flight-rc-evidence-review-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-flight-rc-regression-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-flight-release-risk-ledger-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-flight-rc-copy-review-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-flight-safety-disclosure-review-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-global-shopping-product-goal-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-global-shopping-jump-boundary-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-global-shopping-provider-dry-run-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-global-shopping-adapter-shell-show]"), true);
  assert.equal(commerceAgentPageSource.includes("[data-commerce-global-shopping-kill-switch-show]"), true);
  console.log("READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_CORE PASS");
}
main();
