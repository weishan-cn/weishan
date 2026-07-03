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
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyUserConsentFlow.js",
    "apps/desktop/src/renderer/core/flightWorkflowPublicPilotOnboardingGuard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotOnboardingViewModel.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotOpsSummary.js",
    "apps/desktop/src/renderer/core/flightWorkflowNextCohortDecisionBoard.js",
    "apps/desktop/src/renderer/core/flightWorkflowPilotOpsViewModel.js",
    "apps/desktop/src/renderer/core/flightWorkflowReadOnlyPilotRolloutControlCenter.js",
    "apps/desktop/src/renderer/core/flightWorkflowCohortHealthDashboard.js",
    "apps/desktop/src/renderer/core/flightWorkflowRolloutControlViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingProductGoalCharter.js",
    "apps/desktop/src/renderer/core/globalShoppingJumpToPlatformBoundary.js",
    "apps/desktop/src/renderer/core/globalShoppingProductGoalViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyProviderSandboxConnector.js",
    "apps/desktop/src/renderer/core/globalShoppingFixtureReplayConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingNormalizedPriceCandidateBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingFirstReadOnlyProviderAdapterShell.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxSafetyKillSwitch.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSandboxDryRunViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingOfflineDistributionReadinessCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingNoActivationEnforcementLedger.js",
    "apps/desktop/src/renderer/core/globalShoppingFinalUserTrustSummary.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderSafetyDistributionMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderDistributionReadinessViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyPublicBetaShell.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderZeroRuntimeLock.js",
    "apps/desktop/src/renderer/core/globalShoppingUserTrustLaunchBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaSafetyCopyCenter.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaUserFacingCopyPolish.js",
    "apps/desktop/src/renderer/core/globalShoppingProviderZeroStatusPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaUserJourneyShell.js",
    "apps/desktop/src/renderer/core/globalShoppingSafeSearchIntentMatrix.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaUserBoundaryPanel.js",
    "apps/desktop/src/renderer/core/globalShoppingCategoryResultSimulator.js",
    "apps/desktop/src/renderer/core/globalShoppingReadOnlyComparisonBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingResultTrustBadgePanel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalGate.js",
    "apps/desktop/src/renderer/core/globalShoppingReleaseCandidateConfidenceBoard.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaViewModel.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaTrialReadinessPack.js",
    "apps/desktop/src/renderer/core/globalShoppingFinalManualAcceptanceConsole.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFeedbackPlaceholder.js",
    "apps/desktop/src/renderer/core/globalShoppingPublicBetaFinalManualViewModel.js",
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
  const providerSandboxReadinessWorkbenchSummary = { status:"ready", userFacingSummary:{ title:"Provider Sandbox Readiness Workbench", resultLabel:"Sandbox Readiness Workbench 已准备", redacted:true }, redacted:true };
  const offlineProviderScenarioLabSummary = { status:"ready", userFacingSummary:{ title:"Offline Provider Scenario Lab", resultLabel:"离线场景实验室已准备", redacted:true }, redacted:true };
  const readOnlyProviderAdapterSdkSkeletonSummary = { status:"ready", userFacingSummary:{ title:"Read-Only Provider Adapter SDK Skeleton", resultLabel:"只读 Adapter SDK 骨架已准备", redacted:true }, redacted:true };
  const manualActivationCommandCenterSummary = { status:"ready", userFacingSummary:{ title:"Manual Activation Command Center", resultLabel:"人工激活指挥中心已准备", redacted:true }, redacted:true };
  const providerSandboxMilestoneViewModelSummary = { status:"ready", title:"Provider Sandbox 里程碑工作台", caveat:"当前只展示 provider sandbox 里程碑工作台，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push。", redacted:true };
  const offlineProviderCertificationCenterSummary = { status:"ready", userFacingSummary:{ title:"Offline Provider Certification Center", resultLabel:"离线 Provider 认证中心已准备", redacted:true }, rows:[{ rowId:"certification", label:"Certification Center", value:"离线 Provider 认证中心已准备", status:"pass", redacted:true }], redacted:true };
  const mockIntegrationRegressionLabSummary = { status:"ready", userFacingSummary:{ title:"Mock Integration Regression Lab", resultLabel:"Mock 集成回归实验室已准备", redacted:true }, rows:[{ rowId:"regression", label:"Regression Lab", value:"Mock 集成回归实验室已准备", status:"pass", redacted:true }], redacted:true };
  const humanApprovalEvidenceBinderSummary = { status:"ready", userFacingSummary:{ title:"Human Approval Evidence Binder", resultLabel:"人工审批证据夹已准备", redacted:true }, rows:[{ rowId:"evidence", label:"Evidence Binder", value:"人工审批证据夹已准备", status:"pass", redacted:true }], redacted:true };
  const adapterBoundaryLockSummary = { status:"ready", userFacingSummary:{ title:"Adapter Boundary Lock", resultLabel:"Adapter 边界锁已准备", redacted:true }, rows:[{ rowId:"boundary", label:"Boundary Lock", value:"Adapter 边界锁已准备", status:"pass", redacted:true }], redacted:true };
  const providerCertificationViewModelSummary = { status:"ready", title:"Provider 离线认证与边界锁", caveat:"当前只展示 provider 离线认证与边界锁，不接真实 provider，不读取密钥，不联网，不生成 endpoint，不创建 release，不 push。", redacted:true };
  const providerOfflineReleaseGateSummary = { status:"ready", userFacingSummary:{ title:"Provider Offline Release Gate", resultLabel:"离线发布闸门已准备", redacted:true }, rows:[{ rowId:"release_gate", label:"Offline Release Gate", value:"离线发布闸门已准备", status:"pass", redacted:true }], redacted:true };
  const providerCertificationFreezeLedgerSummary = { status:"ready", userFacingSummary:{ title:"Provider Certification Freeze Ledger", resultLabel:"认证冻结台账已准备", redacted:true }, rows:[{ rowId:"freeze", label:"Certification Freeze", value:"认证冻结台账已准备", status:"pass", redacted:true }], redacted:true };
  const sandboxActivationReviewPacketSummary = { status:"ready", userFacingSummary:{ title:"Sandbox Activation Review Packet", resultLabel:"Sandbox 激活复核包已准备", redacted:true }, rows:[{ rowId:"review", label:"Activation Review", value:"Sandbox 激活复核包已准备", status:"pass", redacted:true }], redacted:true };
  const adapterBoundaryDiffInspectorSummary = { status:"ready", userFacingSummary:{ title:"Adapter Boundary Diff Inspector", resultLabel:"Adapter 边界差异检查器已准备", redacted:true }, rows:[{ rowId:"boundary_diff", label:"Boundary Diff", value:"Adapter 边界差异检查器已准备", status:"pass", redacted:true }], redacted:true };
  const providerAdapterComplianceChecklistSummary = { status:"ready", userFacingSummary:{ title:"Provider Adapter Compliance Checklist", resultLabel:"Adapter 合规清单已准备", redacted:true }, rows:[{ rowId:"compliance", label:"Adapter Compliance", value:"Adapter 合规清单已准备", status:"pass", redacted:true }], redacted:true };
  const offlineLaunchDecisionSimulatorSummary = { status:"ready", userFacingSummary:{ title:"Offline Launch Decision Simulator", resultLabel:"离线发布决策模拟器已准备", redacted:true }, rows:[{ rowId:"offline_release_gate", label:"Offline Release Gate", value:"离线发布闸门已准备", status:"pass", redacted:true }], redacted:true };
  const sandboxActivationReceiptLedgerSummary = { status:"ready", userFacingSummary:{ title:"Sandbox Activation Receipt Ledger", resultLabel:"Sandbox 激活回执台账已准备", redacted:true }, rows:[{ rowId:"launch_decision_simulator", label:"Offline Launch Decision Simulator", value:"离线发布决策模拟器已准备", status:"pass", redacted:true }], redacted:true };
  const adapterSecurityRegressionGuardSummary = { status:"ready", userFacingSummary:{ title:"Adapter Security Regression Guard", resultLabel:"Adapter 安全回归守卫已准备", redacted:true }, rows:[{ rowId:"boundary_diff_inspector", label:"Adapter Boundary Diff Inspector", value:"Adapter 边界差异已准备", status:"pass", redacted:true }], redacted:true };
  const providerOfflineLaunchChecklistSummary = { status:"ready", userFacingSummary:{ title:"Provider Offline Launch Checklist", resultLabel:"离线 Launch Checklist 已准备", redacted:true }, rows:[{ rowId:"launch_decision_simulator", label:"Offline Launch Decision Simulator", value:"离线发布决策模拟器已准备", status:"pass", redacted:true }], redacted:true };
  const providerOfflineLaunchViewModelSummary = { status:"ready", title:"Provider 离线 Launch 决策与安全守卫", caveat:"当前只展示 provider 离线 launch 决策与安全守卫，不接真实 provider，不读取密钥，不联网，不创建 release，不 push。", redacted:true };
  const providerPublicTrustClosureCenterSummary = { status:"ready", userFacingSummary:{ title:"Provider Public Trust Closure Center", resultLabel:"Provider Public Trust Closure Center 已准备", redacted:true }, rows:[{ rowId:"trust_closure", label:"Provider Public Trust Closure Center", value:"Provider Public Trust Closure Center 已准备", status:"pass", redacted:true }], redacted:true };
  const offlineReleaseMemorySnapshotSummary = { status:"ready", userFacingSummary:{ title:"Offline Release Memory Snapshot", resultLabel:"Offline Release Memory Snapshot 已准备", redacted:true }, rows:[{ rowId:"release_memory", label:"Offline Release Memory Snapshot", value:"Offline Release Memory Snapshot 已准备", status:"pass", redacted:true }], redacted:true };
  const noProviderExecutionFinalGuardSummary = { status:"ready", userFacingSummary:{ title:"No-Provider-Execution Final Guard", resultLabel:"No-Provider-Execution Final Guard 已准备", redacted:true }, rows:[{ rowId:"no_provider_guard", label:"No-Provider-Execution Final Guard", value:"No-Provider-Execution Final Guard 已准备", status:"pass", redacted:true }], redacted:true };
  const userVisibleSafetyBoundaryExplainerSummary = { status:"ready", userFacingSummary:{ title:"User-Visible Safety Boundary Explainer", resultLabel:"User-Visible Safety Boundary Explainer 已准备", redacted:true }, rows:[{ rowId:"safety_boundary", label:"User-Visible Safety Boundary Explainer", value:"User-Visible Safety Boundary Explainer 已准备", status:"pass", redacted:true }], redacted:true };
  const providerTrustClosureViewModelSummary = { status:"ready", title:"Provider Trust Closure Review", caveat:"当前只展示 provider trust closure review，不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push，不打开平台。", redacted:true };
  const publicReleaseEvidenceConsoleSummary = { status:"ready", userFacingSummary:{ title:"Public Release Evidence Console", resultLabel:"Public Release Evidence Console 已准备", redacted:true }, rows:[{ rowId:"release_evidence", label:"Public Release Evidence Console", value:"Public Release Evidence Console 已准备", status:"pass", redacted:true }], redacted:true };
  const noProviderUserAssurancePanelSummary = { status:"ready", userFacingSummary:{ title:"No-Provider User Assurance Panel", resultLabel:"No-Provider User Assurance Panel 已准备", redacted:true }, rows:[{ rowId:"user_assurance", label:"No-Provider User Assurance Panel", value:"No-Provider User Assurance Panel 已准备", status:"pass", redacted:true }], redacted:true };
  const offlineLaunchReadinessFinalizerSummary = { status:"ready", userFacingSummary:{ title:"Offline Launch Readiness Finalizer", resultLabel:"Offline Launch Readiness Finalizer 已准备", redacted:true }, rows:[{ rowId:"launch_finalizer", label:"Offline Launch Readiness Finalizer", value:"Offline Launch Readiness Finalizer 已准备", status:"pass", redacted:true }], redacted:true };
  const userSafePublicClaimVerifierSummary = { status:"ready", userFacingSummary:{ title:"User-Safe Public Claim Verifier", resultLabel:"User-Safe Public Claim Verifier 已准备", redacted:true }, rows:[{ rowId:"claim_verifier", label:"User-Safe Public Claim Verifier", value:"User-Safe Public Claim Verifier 已准备", status:"pass", redacted:true }], redacted:true };
  const providerLaunchReadinessFinalViewModelSummary = { status:"ready", title:"Provider Launch Readiness Final Review", caveat:"当前只展示 provider launch readiness final review，不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，不执行真实 launch。", redacted:true };
  const globalShoppingReadOnlyPublicBetaShellSummary = { status:"ready", userFacingSummary:{ title:"Global Shopping Read-Only Public Beta Shell", resultLabel:"Global Shopping Read-Only Public Beta Shell 已准备", redacted:true }, rows:[{ rowId:"public_beta", label:"Global Shopping Read-Only Public Beta Shell", value:"Global Shopping Read-Only Public Beta Shell 已准备", status:"pass", redacted:true }], redacted:true };
  const providerZeroRuntimeLockSummary = { status:"ready", userFacingSummary:{ title:"Provider-Zero Runtime Lock", resultLabel:"Provider-Zero Runtime Lock 已准备", redacted:true }, rows:[{ rowId:"provider_zero_lock", label:"Provider-Zero Runtime Lock", value:"Provider-Zero Runtime Lock 已准备", status:"pass", redacted:true }], redacted:true };
  const userTrustLaunchBoardSummary = { status:"ready", userFacingSummary:{ title:"User Trust Launch Board", resultLabel:"User Trust Launch Board 已准备", redacted:true }, rows:[{ rowId:"user_trust_launch", label:"User Trust Launch Board", value:"User Trust Launch Board 已准备", status:"pass", redacted:true }], redacted:true };
  const publicBetaSafetyCopyCenterSummary = { status:"ready", userFacingSummary:{ title:"Public Beta Safety Copy Center", resultLabel:"Public Beta Safety Copy Center 已准备", redacted:true }, rows:[{ rowId:"safety_copy", label:"Public Beta Safety Copy Center", value:"Public Beta Safety Copy Center 已准备", status:"pass", redacted:true }], redacted:true };
  const globalShoppingPublicBetaUserFacingCopyPolishSummary = { status:"ready", userFacingSummary:{ title:"全球购 Public Beta", resultLabel:"全球购 Public Beta 已准备", redacted:true }, rows:[{ rowId:"public_beta_copy", label:"全球购 Public Beta", value:"全球购 Public Beta 已准备", status:"pass", redacted:true }], redacted:true };
  const globalShoppingProviderZeroStatusPanelSummary = { status:"ready", userFacingSummary:{ title:"Provider-Zero Status Panel", resultLabel:"Provider-Zero Status Panel 已准备", redacted:true }, rows:[{ rowId:"provider_zero_status_panel", label:"Provider-Zero Status Panel", value:"Provider-Zero Status Panel 已准备", status:"pass", redacted:true }], redacted:true };
  const publicBetaFinalGateSummary = { status:"ready", userFacingSummary:{ title:"Public Beta Final Gate", resultLabel:"Public Beta Final Gate 已准备", redacted:true }, rows:[{ rowId:"public_beta_final_gate", label:"Public Beta Final Gate", value:"Public Beta Final Gate 已准备", status:"pass", redacted:true }], redacted:true };
  const releaseCandidateConfidenceBoardSummary = { status:"ready", userFacingSummary:{ title:"RC Confidence Board", resultLabel:"RC Confidence Board 已准备", redacted:true }, rows:[{ rowId:"release_candidate_confidence_board", label:"RC Confidence Board", value:"RC Confidence Board 已准备", status:"pass", redacted:true }], redacted:true };
  const publicBetaFinalViewModelSummary = { status:"ready", userFacingSummary:{ title:"Next Manual Review", resultLabel:"下一步仍需人工复核", redacted:true }, rows:[{ rowId:"next_manual_review", label:"Next Manual Review", value:"下一步仍需人工复核", status:"warning", redacted:true }], redacted:true };
  const publicBetaTrialReadinessPackSummary = { status:"ready", userFacingSummary:{ title:"Public Beta Trial Readiness Pack", resultLabel:"Public Beta Trial Readiness Pack 已准备", redacted:true }, rows:[{ rowId:"trial_readiness_pack", label:"Public Beta Trial Readiness Pack", value:"Public Beta Trial Readiness Pack 已准备", status:"pass", redacted:true }], redacted:true };
  const finalManualAcceptanceConsoleSummary = { status:"ready", userFacingSummary:{ title:"Final Manual Acceptance Console", resultLabel:"Final Manual Acceptance Console 已准备", redacted:true }, rows:[{ rowId:"final_manual_acceptance_console", label:"Final Manual Acceptance Console", value:"Final Manual Acceptance Console 已准备", status:"pass", redacted:true }], redacted:true };
  const publicBetaFeedbackPlaceholderSummary = { status:"ready", userFacingSummary:{ title:"Feedback Placeholder", resultLabel:"Feedback Placeholder 已准备", redacted:true }, rows:[{ rowId:"feedback_placeholder", label:"Feedback Placeholder", value:"Feedback Placeholder 已准备", status:"pass", redacted:true }], redacted:true };
  const publicBetaFinalManualViewModelSummary = { status:"ready", userFacingSummary:{ title:"Public Beta Final Manual View Model", resultLabel:"Public Beta Final Manual View Model 已准备", redacted:true }, rows:[{ rowId:"public_beta_final_manual_view_model", label:"Public Beta Final Manual View Model", value:"Public Beta Final Manual View Model 已准备", status:"pass", redacted:true }], redacted:true };
  const globalShoppingPublicBetaViewModelSummary = { status:"ready", title:"Global Shopping Public Beta Review", caveat:"当前只展示 Global Shopping Public Beta Review，不接真实 provider，不读取密钥，不联网，不打开平台，不创建 release，不 push，不付款、不下单、不出票。", redacted:true };
  const pricePipelineSummary = { status:"ready", userFacingSummary:{ title:"全球购只读价格流水线", resultLabel:"只读价格流水线已准备", redacted:true }, providerEvidenceTraceSummary:{ status:"ready", redacted:true }, candidateConfidenceExplainerSummary:{ status:"ready", redacted:true }, sandboxCandidateComparisonWorkbenchSummary:comparisonWorkbenchSummary, providerEvidenceComparisonMatrixSummary:evidenceComparisonMatrixSummary, readOnlyHandoffReadinessDrillSummary:handoffReadinessDrillSummary, sandboxDecisionReviewViewModelSummary:decisionReviewViewModelSummary, manualPlatformReviewCockpitSummary:{ status:"ready", userFacingSummary:{ title:"手动平台复核驾驶舱", resultLabel:"手动平台复核驾驶舱已准备", redacted:true }, redacted:true }, handoffAcceptanceWalkthroughSummary:{ status:"ready", userFacingSummary:{ title:"交接包接受演练", resultLabel:"交接包接受演练已准备", redacted:true }, redacted:true }, platformRealityCheckBoardSummary:{ status:"ready", userFacingSummary:{ title:"平台真实页面复核清单", resultLabel:"平台真实页面复核清单已准备", redacted:true }, redacted:true }, manualPlatformReviewViewModelSummary:{ status:"ready", title:"手动平台复核与现实检查", redacted:true }, userFacingManualReviewFlowSummary:{ status:"ready", userFacingSummary:{ title:"用户手动复核流程", resultLabel:"用户手动复核流程已准备", redacted:true }, redacted:true }, platformVerificationProgressTrackerSummary:{ status:"ready", userFacingSummary:{ title:"平台核对进度追踪", resultLabel:"平台核对进度已准备", redacted:true }, progressRows:[{ itemId:"price", label:"实时价格", status:"user_must_verify", summary:"到平台后人工核对实时价格", redacted:true }], redacted:true }, safeNextActionPanelSummary:{ status:"ready", userFacingSummary:{ title:"安全下一步", resultLabel:"安全下一步已准备", redacted:true }, safeActionRows:[{ actionId:"manual_verify", label:"到平台后人工核对实时价格", kind:"safe", redacted:true }], forbiddenActionRows:[{ actionId:"forbidden_1", label:"立即购买：已阻断", kind:"blocked", redacted:true }], redacted:true }, userManualReviewViewModelSummary:{ status:"ready", title:"用户手动复核与安全下一步", userFacingSummary:{ title:"用户手动复核与安全下一步", resultLabel:"用户手动复核与安全下一步已准备", redacted:true }, redacted:true }, readOnlyCommerceSessionRecapCenterSummary:{ status:"ready", userFacingSummary:{ title:"只读全球购会话总结", resultLabel:"只读全球购会话总结已准备", redacted:true }, rows:[{ rowId:"summary_scope", label:"会话总结不保存、不导出", value:"当前只展示只读会话总结摘要", status:"pass", redacted:true }], redacted:true }, userTrustClosureSummarySummary:{ status:"ready", userFacingSummary:{ title:"用户信任闭环摘要", resultLabel:"用户信任闭环摘要已准备", redacted:true }, rows:[{ rowId:"trust_boundary", label:"平台页面为最终依据", value:"信任闭环不构成平台确认", status:"pass", redacted:true }], redacted:true }, nextFeatureReadinessGateSummary:{ status:"ready", userFacingSummary:{ title:"下一功能准备闸门", resultLabel:"下一功能准备闸门已准备", redacted:true }, rows:[{ rowId:"next_boundary", label:"下一功能闸门不接真实 provider", value:"只评估 readiness，不接真实 provider", status:"pass", redacted:true }], redacted:true }, providerLegalReviewDossierSummary:{ status:"ready", userFacingSummary:{ title:"Provider 法务审查档案", resultLabel:"法务审查档案已准备", redacted:true }, redacted:true }, credentialVaultInterfaceStubSummary:{ status:"ready", userFacingSummary:{ title:"凭证保险箱接口桩", resultLabel:"凭证接口桩已准备", redacted:true }, redacted:true }, sandboxAdapterContractTestbedSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Adapter 合同测试台", resultLabel:"Adapter 合同测试台已准备", redacted:true }, redacted:true }, providerIntegrationPrepViewModelSummary:{ status:"ready", title:"Provider 接入前准备", userFacingSummary:{ title:"Provider 接入前准备", resultLabel:"Provider 接入前准备已准备", redacted:true }, redacted:true }, sandboxProviderMockRuntimeSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Provider Mock Runtime", resultLabel:"Sandbox Provider Mock Runtime 已准备", redacted:true }, redacted:true }, vaultBoundaryContractSummary:{ status:"ready", userFacingSummary:{ title:"Vault Boundary Contract", resultLabel:"Vault 边界合同已准备", redacted:true }, redacted:true }, legalApprovalWorkflowBoardSummary:{ status:"ready", userFacingSummary:{ title:"法务审批流程板", resultLabel:"法务审批流程板已准备", redacted:true }, redacted:true }, providerMockRuntimeViewModelSummary:{ status:"ready", title:"Provider Mock Runtime 与审批准备", userFacingSummary:{ title:"Provider Mock Runtime 与审批准备", resultLabel:"Provider Mock Runtime 与审批准备已准备", redacted:true }, redacted:true }, mockProviderAdapterRegistryRuntimeSummary:{ status:"ready", userFacingSummary:{ title:"Mock Provider Adapter 注册运行时", resultLabel:"Mock Adapter 注册运行时已准备", redacted:true }, rows:[{ rowId:"mock_registry", label:"Mock Adapter 注册", value:"只允许 mock / fixture / dry_run / contract_only", status:"pass", redacted:true }], redacted:true }, providerContractReplayHarnessSummary:{ status:"ready", userFacingSummary:{ title:"Provider 合同回放器", resultLabel:"Provider 合同回放器已准备", redacted:true }, rows:[{ rowId:"contract_replay", label:"合同回放", value:"只回放脱敏 contract case", status:"pass", redacted:true }], redacted:true }, providerLaunchReadinessBoardSummary:{ status:"ready", userFacingSummary:{ title:"Provider 启动准备总闸门", resultLabel:"Provider 启动准备总闸门已准备", redacted:true }, rows:[{ rowId:"launch_readiness", label:"启动准备", value:"真实 sandbox provider 仍需人工审批", status:"pass", redacted:true }], redacted:true }, providerLaunchReadinessViewModelSummary:{ status:"ready", title:"Provider 启动准备与合同回放", userFacingSummary:{ title:"Provider 启动准备与合同回放", resultLabel:"Provider 启动准备与合同回放已准备", redacted:true }, redacted:true }, providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ title:"Provider Sandbox Pilot 控制室", resultLabel:"Sandbox Pilot 控制室已准备", redacted:true }, redacted:true }, mockProviderIncidentDrillSummary:{ status:"ready", userFacingSummary:{ title:"Mock Provider 事故演练", resultLabel:"Mock 事故演练已准备", redacted:true }, redacted:true }, productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ title:"Production 阻断矩阵", resultLabel:"Production 阻断矩阵已准备", redacted:true }, redacted:true }, providerPilotControlViewModelSummary:{ status:"ready", title:"Provider Sandbox Pilot 控制与阻断", userFacingSummary:{ title:"Provider Sandbox Pilot 控制与阻断", resultLabel:"Provider Sandbox Pilot 控制与阻断已准备", redacted:true }, redacted:true }, providerGovernanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ title:"Provider Governance 审计控制台", resultLabel:"治理审计控制台已准备", redacted:true }, rows:[{ rowId:"audit", label:"治理审计", value:"治理审计控制台已准备", status:"pass", redacted:true }], redacted:true }, humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ title:"Human Pilot 准备台账", resultLabel:"Human Pilot 准备台账已准备", redacted:true }, rows:[{ rowId:"ledger", label:"Human Pilot", value:"Human Pilot 准备台账已准备", status:"pass", redacted:true }], redacted:true }, sandboxProviderReleaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Provider Release Freeze Gate", resultLabel:"Release Freeze Gate 已准备", redacted:true }, rows:[{ rowId:"freeze", label:"Release Freeze", value:"Release Freeze Gate 已准备", status:"pass", redacted:true }], redacted:true }, providerGovernanceReleaseViewModelSummary:{ status:"ready", title:"Provider Governance 发布审计与冻结闸门", redacted:true }, manualGovernanceReleaseDecisionRoomSummary:{ status:"ready", userFacingSummary:{ title:"Manual Governance Release 决策室", resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true }, sandboxPilotExceptionRegisterSummary:{ status:"ready", userFacingSummary:{ title:"Sandbox Pilot 例外登记簿", resultLabel:"例外登记簿已准备", redacted:true }, redacted:true }, providerReadinessSignOffPacketSummary:{ status:"ready", userFacingSummary:{ title:"Provider 准备签核包", resultLabel:"准备签核包已准备", redacted:true }, redacted:true }, providerManualReleaseViewModelSummary:{ status:"ready", title:"Provider 人工发布决策与签核", redacted:true }, commerceSessionRecapViewModelSummary:{ status:"ready", title:"只读全球购会话总结与下一步准备", userFacingSummary:{ title:"只读全球购会话总结与下一步准备", resultLabel:"只读全球购会话总结与下一步准备已准备", redacted:true }, redacted:true }, readyOutputs:{ safeToProceedWithSandboxDecisionReview:true, safeToProceedWithManualPlatformReview:true, safeToProceedWithManualPlatformUserEducation:true, safeToProceedWithManualExternalPlatformVisitEducation:true, safeToProceedWithReadOnlyProviderSandboxPlanning:true, safeToProceedWithProviderSandboxContractImplementation:true, safeToProceedWithMockAdapterRuntimeHardening:true, safeToProceedWithHumanProviderSandboxApproval:true, safeToProceedWithHumanControlledSandboxProviderPilotPlan:true, safeToProceedWithManualProviderSignOffReview:false }, redacted:true };
  const candidateJourneySummary = { status:"ready", title:"全球购只读候选旅程", redacted:true };
  assert.equal(api.READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION, "4.1.0");
  const card = api.buildReadOnlyPriceCandidateCardViewModel({ continuitySummary:{ status:"resumable", currentStage:"decision", stageLabel:"选择候选", resumePlan:{ nextStepLabel:"确认前往平台", canResume:true } }, confirmationStateSummary:{ labels:["已选择候选"] }, recoverySummary:{ status:"resumable" }, resumeCoachSummary:{ allowedActions:[{ label:"前往平台确认" }] }, currentStage:"decision", workflowStageLabel:"选择候选", nextStepLabel:"确认前往平台", canResumeWorkflow:true, resumeActions:[{ label:"前往平台确认" }], blockedActions:[{ label:"付款" }], actionPolicyDecision:{ status:"requires_confirmation" }, workflowStateSummary:{ status:"evidence_ready" }, clarificationSummary:{ status:"complete" }, workflowStepList:[{ label:"生成候选证据", status:"completed" }], missingFields:[], clarificationQuestions:[], workflowUserMessage:"候选证据已生成，平台最终为准。", sandboxDryRunSummary:dryRun, runTimelineSummary:dryRun.runTimelineSummary, providerRunMatrix:dryRun.providerRunMatrix, dryRunStatus:dryRun.status, dryRunButton:{ label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false }, dryRunTopCandidates:dryRun.dryRunTopCandidates, task:{ title:"7月15日上海到成都最便宜的机票" }, providerId:"google_flights_search", providerName:"Google Flights", providerType:"flight_search", providerSandboxDryRunHarnessSummary:{ status:"ready", userFacingSummary:{ title:"Provider Sandbox 干跑框架", resultLabel:"干跑框架已准备", redacted:true }, redacted:true }, safetyRegressionSummary:{ status:"pass", checks:[], failures:[], warnings:[], redacted:true }, providerSandboxReadinessWorkbenchSummary:providerSandboxReadinessWorkbenchSummary, offlineProviderScenarioLabSummary:offlineProviderScenarioLabSummary, readOnlyProviderAdapterSdkSkeletonSummary:readOnlyProviderAdapterSdkSkeletonSummary, manualActivationCommandCenterSummary:manualActivationCommandCenterSummary, providerSandboxMilestoneViewModelSummary:providerSandboxMilestoneViewModelSummary, offlineProviderCertificationCenterSummary:offlineProviderCertificationCenterSummary, mockIntegrationRegressionLabSummary:mockIntegrationRegressionLabSummary, humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary, adapterBoundaryLockSummary:adapterBoundaryLockSummary, providerCertificationViewModelSummary:providerCertificationViewModelSummary, providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary, providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary, sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary, adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary, providerAdapterComplianceChecklistSummary:providerAdapterComplianceChecklistSummary, offlineLaunchDecisionSimulatorSummary:offlineLaunchDecisionSimulatorSummary, sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary, providerOfflineLaunchChecklistSummary:providerOfflineLaunchChecklistSummary, providerOfflineLaunchViewModelSummary:providerOfflineLaunchViewModelSummary, providerPublicTrustClosureCenterSummary:providerPublicTrustClosureCenterSummary, offlineReleaseMemorySnapshotSummary:offlineReleaseMemorySnapshotSummary, noProviderExecutionFinalGuardSummary:noProviderExecutionFinalGuardSummary, userVisibleSafetyBoundaryExplainerSummary:userVisibleSafetyBoundaryExplainerSummary, providerTrustClosureViewModelSummary:providerTrustClosureViewModelSummary, publicReleaseEvidenceConsoleSummary:publicReleaseEvidenceConsoleSummary, noProviderUserAssurancePanelSummary:noProviderUserAssurancePanelSummary, offlineLaunchReadinessFinalizerSummary:offlineLaunchReadinessFinalizerSummary, userSafePublicClaimVerifierSummary:userSafePublicClaimVerifierSummary, providerLaunchReadinessFinalViewModelSummary:providerLaunchReadinessFinalViewModelSummary, globalShoppingReadOnlyPublicBetaShellSummary:globalShoppingReadOnlyPublicBetaShellSummary, providerZeroRuntimeLockSummary:providerZeroRuntimeLockSummary, globalShoppingProviderZeroStatusPanelSummary:globalShoppingProviderZeroStatusPanelSummary, userTrustLaunchBoardSummary:userTrustLaunchBoardSummary, publicBetaSafetyCopyCenterSummary:publicBetaSafetyCopyCenterSummary, globalShoppingPublicBetaUserFacingCopyPolishSummary:globalShoppingPublicBetaUserFacingCopyPolishSummary, publicBetaFinalGateSummary:publicBetaFinalGateSummary, releaseCandidateConfidenceBoardSummary:releaseCandidateConfidenceBoardSummary, publicBetaFinalViewModelSummary:publicBetaFinalViewModelSummary, publicBetaTrialReadinessPackSummary:publicBetaTrialReadinessPackSummary, finalManualAcceptanceConsoleSummary:finalManualAcceptanceConsoleSummary, publicBetaFeedbackPlaceholderSummary:publicBetaFeedbackPlaceholderSummary, publicBetaFinalManualViewModelSummary:publicBetaFinalManualViewModelSummary, globalShoppingPublicBetaViewModelSummary:globalShoppingPublicBetaViewModelSummary, globalShoppingReadOnlyPublicBetaShellStatus:"ready", providerZeroRuntimeLockStatus:"ready", globalShoppingProviderZeroStatusPanelStatus:"ready", userTrustLaunchBoardStatus:"ready", publicBetaSafetyCopyCenterStatus:"ready", publicBetaFinalGateStatus:"ready", releaseCandidateConfidenceBoardStatus:"ready", publicBetaFinalViewModelStatus:"ready", publicBetaTrialReadinessPackStatus:"ready", finalManualAcceptanceConsoleStatus:"ready", publicBetaFeedbackPlaceholderStatus:"ready", publicBetaFinalManualViewModelStatus:"ready", globalShoppingPublicBetaUserFacingCopyPolishStatus:"ready", globalShoppingPublicBetaViewModelStatus:"ready", safeToProceedWithHumanPublicBetaReview:true, safeToProceedWithManualPublicBetaReview:true, safeToProceedWithManualTrialReview:true, pricePipelineOrchestratorSummary:pricePipelineSummary, readOnlyCandidateJourneySummary:candidateJourneySummary, sandboxCandidateComparisonWorkbenchSummary:comparisonWorkbenchSummary, providerEvidenceComparisonMatrixSummary:evidenceComparisonMatrixSummary, readOnlyHandoffReadinessDrillSummary:handoffReadinessDrillSummary, sandboxDecisionReviewViewModelSummary:decisionReviewViewModelSummary, report:{ provider:{ providerMode:"fixture" }, handoff:{ safeProviderHandoffUrl:"https://www.google.com/travel/flights" }, rankingPreview:{ sourceBreakdown:{ providerCount:3, providerIds:["flight_provider_trusted_fixture","trip_com_sandbox_stub","airline_official_sandbox_stub"], fareSources:["sandbox_read_only_import"] }, rankingExplanation:"仅按导入样本中的只读候选证据排序，平台最终为准。" }, selectedCandidate:{ providerName:"Airline Official Sandbox Stub", responseShape:"airline_official_stub_quote", selectedSourceSummary:"来源：Airline Official Sandbox Stub / airline_official_stub_quote" } }, sourceBreakdown:{ providerCount:3, providerIds:["flight_provider_trusted_fixture","trip_com_sandbox_stub","airline_official_sandbox_stub"], fareSources:["sandbox_read_only_import"] }, selectedSourceSummary:"来源：Airline Official Sandbox Stub / airline_official_stub_quote", rankingExplanation:"仅按导入样本中的只读候选证据排序，平台最终为准。", flightFields:{ origin:"上海", destination:"成都", dateDisplay:"7 月 15 日", goal:"低价优先", directPreference:"直达优先" }, topCandidates:[{ rank:1, quoteId:"q930", providerName:"Airline Official Sandbox Stub", responseShape:"airline_official_stub_quote", fareSource:"sandbox_read_only_import", currency:"CNY", baseFare:780, taxesAndFees:130, providerFees:20, totalPrice:930, safeProviderHandoffReady:true, safeProviderHandoffUrl:"https://www.google.com/travel/flights", bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true }] });
  assert.equal(card.visible, true);
  assert.equal(card.providerMode, "fixture");
  assert.equal(card.workflowStateSummary.status, "evidence_ready");
  assert.equal(card.clarificationSummary.status, "complete");
  assert.equal(card.workflowStepList[0].label, "生成候选证据");
  assert.equal(card.workflowUserMessage, "候选证据已生成，平台最终为准。");
  assert.equal(card.priceTruthLabel, "只读候选价 · 平台最终为准 · 未锁价，不代表可出票");
  assert.equal(card.providerConfirmationRequired, true);
  assert.equal(card.auditReviewSummary.bookingUrl, null);
  assert.equal(card.safeSessionExportPreview.canWriteFile, false);
  assert.equal(card.safeSessionExportPreview.bookingUrl, null);
  assert.ok(card.riskBadgeSummary.line.includes("只读安全"));
  assert.ok(card.riskBadgeSummary.line.includes("交易动作已阻断"));
  assert.equal(card.readOnlyConsentSummary.status, "missing_required_items");
  assert.equal(card.pilotOnboardingSummary.status, "needs_internal_testing");
  assert.equal(card.canEnterReadOnlyPilot, false);
  assert.equal(card.pilotConsentRequired, true);
  assert.equal(card.rolloutControlSummary.centerName, "flight_workflow_read_only_pilot_rollout_control_center_v1");
  assert.equal(card.cohortHealthSummary.dashboardName, "flight_workflow_cohort_health_dashboard_v1");
  assert.equal(card.safeToStartRcReview, false);
  assert.ok(["finalized", "needs_review", "approved"].includes(card.rcCopyReviewStatus));
  assert.ok(["approved", "needs_review", "blocked"].includes(card.safetyDisclosureStatus));
  assert.equal(typeof card.safeToFinalizeUserFacingCopy, "boolean");
  const renderedCardHtml = api.renderReadOnlyPriceCandidateCardHtml(card);
  assert.equal(renderedCardHtml.includes("Public Beta RC Console"), true);
  assert.equal(renderedCardHtml.includes("Offline Trial Release Gate"), true);
  assert.equal(renderedCardHtml.includes("No Release Mutation"), true);
  assert.equal(renderedCardHtml.includes("No Transaction"), true);
  assert.equal(renderedCardHtml.includes("No Provider"), true);
  assert.equal(renderedCardHtml.includes("No External Open"), true);
  assert.equal(renderedCardHtml.includes("当前只是 RC 候选，不创建 release、不 push"), true);
  assert.equal(renderedCardHtml.includes("人工复核通过后才能进入下一阶段"), true);
  assert.equal(renderedCardHtml.includes("仍然不接真实 provider、不联网、不启用交易"), true);
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
  assert.equal(card.dryRunTopCandidates.length, 3);
  assert.equal(card.interactiveRefreshState.status, "idle");
  assert.equal(card.clearRefreshStateButton.label, "清除刷新状态");
  assert.equal(card.sessionSummary.sessionId, "deterministic-read-only-quote-session-v2.5.0");
  assert.equal(card.auditExportReady, true);
  assert.equal(card.reportCenterSummary.reportCenterName, "read_only_quote_session_report_center_v1");
  assert.equal(card.safetyReportSummary.rawResponseStored, false);
  assert.ok(card.evidenceSummaryWarnings.includes("平台最终为准"));
  assert.equal(card.selectedCandidateUserSummary.requiresUserConfirm, true);
  assert.equal(card.recommendationExplanation.primaryReason, "该候选在本次只读候选样本中合计金额较低。");
  assert.ok(card.decisionAssistantSummary.line.includes("平台最终为准"));
  assert.ok(Array.isArray(card.candidateComparisonTable));
  assert.equal(card.providerConfirmationWarning.providerConfirmationRequiresUserConfirm, true);
  assert.equal(card.handoffChecklistSummary.actions.requiresUserConfirmation, true);
  assert.equal(card.handoffReceiptSummary.safety.rawUrlStored, false);
  assert.equal(card.manualPlatformCheckSummary.status, "accepted");
  assert.equal(card.platformCheckDeltaSummary.canClaimPriceLocked, false);
  assert.ok(["高一致", "有差异", "需重新核对", "不可确认"].includes(card.confidenceLabelSummary.confidenceLabel));
  assert.ok(card.safeNextStepSummary.forbiddenActions.includes("付款"));
  const html = api.renderReadOnlyPriceCandidateCardHtml(card);
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
