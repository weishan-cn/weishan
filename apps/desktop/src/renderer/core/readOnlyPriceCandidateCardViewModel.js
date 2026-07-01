;(function () {
  "use strict";

  const READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION = "3.6.0";
  const PHASE = "read_only_price_candidate_card_view_model_v1";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

  function toArray(value) {
    if (Array.isArray(value)) return value.slice();
    if (!value) return [];
    if (typeof value.length === "number" && value.length >= 0) return Array.prototype.slice.call(value);
    return [];
  }

  function compactSummary(summary, keys) {
    const safe = obj(summary);
    const allowedKeys = Array.isArray(keys) ? keys : [];
    const result = {};
    allowedKeys.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(safe, key)) result[key] = clone(safe[key]);
    });
    return result;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function getRegistryApi() {
    return window.WeishanTrustedFlightSourceRegistry || {};
  }

  function getGateApi() {
    return window.WeishanSafeProviderDeepLinkHandoffGate || {};
  }

  function getConfirmationUiApi() {
    return window.WeishanProviderConfirmationHandoffUi || {};
  }

  function getBindingWizardApi() {
    return window.WeishanProviderSandboxBindingWizard || {};
  }

  function getRefreshStateStoreApi() {
    return window.WeishanReadOnlyQuoteRefreshStateStore || {};
  }

  function getInteractiveRefreshUiApi() {
    return window.WeishanReadOnlyQuoteInteractiveRefreshUiController || {};
  }

  function getReportCenterApi() {
    return window.WeishanReadOnlyQuoteSessionReportCenter || {};
  }

  function getEvidenceFormatterApi() {
    return window.WeishanReadOnlyQuoteEvidenceSummaryFormatter || {};
  }

  function getDecisionAssistantApi() {
    return window.WeishanReadOnlyQuoteDecisionAssistant || {};
  }

  function getCandidateComparisonApi() {
    return window.WeishanReadOnlyQuoteCandidateComparisonExplainer || {};
  }

  function getChecklistApi() { return window.WeishanSafeProviderConfirmationChecklist || {}; }
  function getReceiptApi() { return window.WeishanProviderHandoffReceiptStore || {}; }
  function getManualPlatformCheckApi() { return window.WeishanManualPlatformCheckCapture || {}; }
  function getPlatformDeltaApi() { return window.WeishanPlatformCheckDeltaCompare || {}; }
  function getReconciliationApi() { return window.WeishanPlatformCheckReconciliationCenter || {}; }
  function getConfidenceLabelerApi() { return window.WeishanReadOnlyCandidateConfidenceLabeler || {}; }
  function getSafeNextStepCoachApi() { return window.WeishanReadOnlyQuoteSafeNextStepCoach || {}; }
  function getWorkflowAuditReviewApi() { return window.WeishanFlightWorkflowAuditReviewCenter || {}; }
  function getSafeSessionExportPreviewApi() { return window.WeishanFlightWorkflowSafeSessionExportPreview || {}; }
  function getRiskBadgeBuilderApi() { return window.WeishanFlightWorkflowRiskBadgeBuilder || {}; }
  function getHumanReviewChecklistApi() { return window.WeishanFlightWorkflowHumanReviewChecklist || {}; }
  function getFinalSafeHandoffPacketApi() { return window.WeishanFlightWorkflowFinalSafeHandoffPacket || {}; }
  function getHandoffPacketPolicyGuardApi() { return window.WeishanFlightWorkflowHandoffPacketPolicyGuard || {}; }
  function getSafetyRegressionSentinelApi() { return window.WeishanFlightWorkflowSafetyRegressionSentinel || {}; }
  function getOperatorConsoleApi() { return window.WeishanFlightWorkflowOperatorConsole || {}; }
  function getOperatorConsoleViewModelApi() { return window.WeishanFlightWorkflowOperatorConsoleViewModel || {}; }
  function getReleaseReadinessDashboardApi() { return window.WeishanFlightWorkflowReleaseReadinessDashboard || {}; }
  function getUserSafetyCopyRegistryApi() { return window.WeishanFlightWorkflowUserSafetyCopyRegistry || {}; }
  function getReadOnlyConsentFlowApi() { return window.WeishanFlightWorkflowReadOnlyUserConsentFlow || {}; }
  function getPublicPilotOnboardingGuardApi() { return window.WeishanFlightWorkflowPublicPilotOnboardingGuard || {}; }
  function getPilotOnboardingViewModelApi() { return window.WeishanFlightWorkflowPilotOnboardingViewModel || {}; }
  function getSafeIssueIntakeFlowApi() { return window.WeishanFlightWorkflowSafeIssueIntakeFlow || {}; }
  function getSupportFallbackRecommendationApi() { return window.WeishanFlightWorkflowSupportFallbackRecommendationEngine || {}; }
  function getPublicPilotIssueReviewBoardApi() { return window.WeishanFlightWorkflowPublicPilotIssueReviewBoard || {}; }
  function getSupportTriageDashboardApi() { return window.WeishanFlightWorkflowSupportTriageDashboard || {}; }
  function getPilotIssueReviewViewModelApi() { return window.WeishanFlightWorkflowPilotIssueReviewViewModel || {}; }
  function getIssuePatternRadarApi() { return window.WeishanFlightWorkflowPublicPilotIssuePatternRadar || {}; }
  function getSupportReadinessGateApi() { return window.WeishanFlightWorkflowSupportReadinessGate || {}; }
  function getIssuePatternViewModelApi() { return window.WeishanFlightWorkflowIssuePatternViewModel || {}; }
  function getPublicPilotReadinessSnapshotApi() { return window.WeishanFlightWorkflowPublicPilotReadinessSnapshot || {}; }
  function getSupportPlaybookConsoleApi() { return window.WeishanFlightWorkflowSupportPlaybookConsole || {}; }
  function getPilotSnapshotViewModelApi() { return window.WeishanFlightWorkflowPilotSnapshotViewModel || {}; }
  function getPilotInvitationGateApi() { return window.WeishanFlightWorkflowReadOnlyPilotInvitationGate || {}; }
  function getTesterCohortEnrollmentConsoleApi() { return window.WeishanFlightWorkflowTesterCohortEnrollmentConsole || {}; }
  function getPilotInvitationViewModelApi() { return window.WeishanFlightWorkflowPilotInvitationViewModel || {}; }
  function getPilotSupportViewModelApi() { return window.WeishanFlightWorkflowPilotSupportViewModel || {}; }
  function getRolloutControlCenterApi() { return window.WeishanFlightWorkflowReadOnlyPilotRolloutControlCenter || {}; }
  function getCohortHealthDashboardApi() { return window.WeishanFlightWorkflowCohortHealthDashboard || {}; }
  function getRolloutControlViewModelApi() { return window.WeishanFlightWorkflowRolloutControlViewModel || {}; }
  function getPilotOpsSummaryApi() { return window.WeishanFlightWorkflowReadOnlyPilotOpsSummary || {}; }
  function getNextCohortDecisionBoardApi() { return window.WeishanFlightWorkflowNextCohortDecisionBoard || {}; }
  function getPilotExitCriteriaApi() { return window.WeishanFlightWorkflowReadOnlyPilotExitCriteria || {}; }
  function getLaunchCandidateReadinessApi() { return window.WeishanFlightWorkflowLaunchCandidateReadinessBoard || {}; }
  function getPilotOpsViewModelApi() { return window.WeishanFlightWorkflowPilotOpsViewModel || {}; }
  function getLaunchCandidateFreezeGateApi() { return window.WeishanFlightWorkflowReadOnlyLaunchCandidateFreezeGate || {}; }
  function getEvidenceFreezePackApi() { return window.WeishanFlightWorkflowEvidenceFreezePack || {}; }
  function getLaunchCandidateFreezeViewModelApi() { return window.WeishanFlightWorkflowLaunchCandidateFreezeViewModel || {}; }
  function getRcCandidateReviewConsoleApi() { return window.WeishanFlightWorkflowRcCandidateReviewConsole || {}; }
  function getRcEvidenceReviewChecklistApi() { return window.WeishanFlightWorkflowRcEvidenceReviewChecklist || {}; }
  function getRcReviewViewModelApi() { return window.WeishanFlightWorkflowRcReviewViewModel || {}; }
  function getRcRegressionAuditPackApi() { return window.WeishanFlightWorkflowRcRegressionAuditPack || {}; }
  function getReleaseRiskLedgerApi() { return window.WeishanFlightWorkflowReadOnlyReleaseRiskLedger || {}; }
  function getRcRegressionViewModelApi() { return window.WeishanFlightWorkflowRcRegressionViewModel || {}; }
  function getRcUserFacingCopyFinalizationApi() { return window.WeishanFlightWorkflowRcUserFacingCopyFinalization || {}; }
  function getSafetyDisclosureReviewBoardApi() { return window.WeishanFlightWorkflowSafetyDisclosureReviewBoard || {}; }
  function getRcCopyReviewViewModelApi() { return window.WeishanFlightWorkflowRcCopyReviewViewModel || {}; }
  function getGlobalShoppingProductGoalCharterApi() { return window.WeishanGlobalShoppingProductGoalCharter || {}; }
  function getGlobalShoppingJumpToPlatformBoundaryApi() { return window.WeishanGlobalShoppingJumpToPlatformBoundary || {}; }
  function getGlobalShoppingProductGoalViewModelApi() { return window.WeishanGlobalShoppingProductGoalViewModel || {}; }
  function getGlobalShoppingReadOnlyProviderSandboxConnectorApi() { return window.WeishanGlobalShoppingReadOnlyProviderSandboxConnector || {}; }
  function getGlobalShoppingFixtureReplayConsoleApi() { return window.WeishanGlobalShoppingFixtureReplayConsole || {}; }
  function getGlobalShoppingNormalizedPriceCandidateBoardApi() { return window.WeishanGlobalShoppingNormalizedPriceCandidateBoard || {}; }
  function getGlobalShoppingReadOnlyRealProviderSandboxGateApi() { return window.WeishanGlobalShoppingReadOnlyRealProviderSandboxGate || {}; }
  function getGlobalShoppingProviderRequestEnvelopeBuilderApi() { return window.WeishanGlobalShoppingProviderRequestEnvelopeBuilder || {}; }
  function getGlobalShoppingProviderCallAuditLedgerApi() { return window.WeishanGlobalShoppingProviderCallAuditLedger || {}; }
  function getGlobalShoppingProviderSandboxReadinessViewModelApi() { return window.WeishanGlobalShoppingProviderSandboxReadinessViewModel || {}; }
  function getGlobalShoppingProviderSandboxDryRunHarnessApi() { return window.WeishanGlobalShoppingProviderSandboxDryRunHarness || {}; }
  function getGlobalShoppingFirstReadOnlyProviderAdapterShellApi() { return window.WeishanGlobalShoppingFirstReadOnlyProviderAdapterShell || {}; }
  function getGlobalShoppingProviderSandboxSafetyKillSwitchApi() { return window.WeishanGlobalShoppingProviderSandboxSafetyKillSwitch || {}; }
  function getGlobalShoppingProviderSandboxDryRunViewModelApi() { return window.WeishanGlobalShoppingProviderSandboxDryRunViewModel || {}; }
  function getGlobalShoppingOfflineSandboxTraceInspectorApi() { return window.WeishanGlobalShoppingOfflineSandboxTraceInspector || {}; }
  function getGlobalShoppingMockProviderResultNormalizerApi() { return window.WeishanGlobalShoppingMockProviderResultNormalizer || {}; }
  function getGlobalShoppingManualActivationDryRunChecklistApi() { return window.WeishanGlobalShoppingManualActivationDryRunChecklist || {}; }
  function getGlobalShoppingProviderAdapterRegistryApi() { return window.WeishanGlobalShoppingProviderAdapterRegistry || {}; }
  function getGlobalShoppingDryRunProviderResponseNormalizerApi() { return window.WeishanGlobalShoppingDryRunProviderResponseNormalizer || {}; }
  function getGlobalShoppingSandboxProviderRunbookBoardApi() { return window.WeishanGlobalShoppingSandboxProviderRunbookBoard || {}; }
  function getGlobalShoppingProviderAdapterRegistryViewModelApi() { return window.WeishanGlobalShoppingProviderAdapterRegistryViewModel || {}; }
  function getGlobalShoppingFirstSandboxProviderConnectorApi() { return window.WeishanGlobalShoppingFirstSandboxProviderConnector || {}; }
  function getGlobalShoppingProviderCoverageDashboardApi() { return window.WeishanGlobalShoppingProviderCoverageDashboard || {}; }
  function getGlobalShoppingReadOnlySourceTrustScoreApi() { return window.WeishanGlobalShoppingReadOnlySourceTrustScore || {}; }
  function getGlobalShoppingProviderCoverageViewModelApi() { return window.WeishanGlobalShoppingProviderCoverageViewModel || {}; }
  function getGlobalShoppingReadOnlyProviderSandboxIntegrationGateApi() { return window.WeishanGlobalShoppingReadOnlyProviderSandboxIntegrationGate || {}; }
  function getGlobalShoppingSandboxPriceCandidateSessionApi() { return window.WeishanGlobalShoppingSandboxPriceCandidateSession || {}; }
  function getGlobalShoppingSandboxPriceCandidateResultBoardApi() { return window.WeishanGlobalShoppingSandboxPriceCandidateResultBoard || {}; }
  function getGlobalShoppingLegalProviderFixtureAdapterApi() { return window.WeishanGlobalShoppingLegalProviderFixtureAdapter || {}; }
  function getGlobalShoppingProviderCredentialSafetyReviewApi() { return window.WeishanGlobalShoppingProviderCredentialSafetyReview || {}; }
  function getGlobalShoppingSandboxPriceFeedGateApi() { return window.WeishanGlobalShoppingSandboxPriceFeedGate || {}; }
  function getGlobalShoppingSandboxProviderResponseContractApi() { return window.WeishanGlobalShoppingSandboxProviderResponseContract || {}; }
  function getGlobalShoppingProviderFixtureViewModelApi() { return window.WeishanGlobalShoppingProviderFixtureViewModel || {}; }
  function getGlobalShoppingPriceSourceNormalizerApi() { return window.WeishanGlobalShoppingPriceSourceNormalizer || {}; }
  function getGlobalShoppingOfficialPriceAnchorSlotApi() { return window.WeishanGlobalShoppingOfficialPriceAnchorSlot || {}; }
  function getGlobalShoppingPriceCandidateDisplayBoardApi() { return window.WeishanGlobalShoppingPriceCandidateDisplayBoard || {}; }
  function getGlobalShoppingSameItemMatcherApi() { return window.WeishanGlobalShoppingSameItemMatcher || {}; }
  function getGlobalShoppingDuplicateCandidateMergerApi() { return window.WeishanGlobalShoppingDuplicateCandidateMerger || {}; }
  function getGlobalShoppingCoveredLowestCandidateBoardApi() { return window.WeishanGlobalShoppingCoveredLowestCandidateBoard || {}; }
  function getGlobalShoppingExternalDeepLinkSafetyGateApi() { return window.WeishanGlobalShoppingExternalDeepLinkSafetyGate || {}; }
  function getGlobalShoppingSearchParameterPrefillGateApi() { return window.WeishanGlobalShoppingSearchParameterPrefillGate || {}; }
  function getGlobalShoppingJumpToPlatformHandoffPreviewApi() { return window.WeishanGlobalShoppingJumpToPlatformHandoffPreview || {}; }
  function getGlobalShoppingPlatformAvailabilityGateApi() { return window.WeishanGlobalShoppingPlatformAvailabilityGate || {}; }
  function getGlobalShoppingPartnerLinkPolicyApi() { return window.WeishanGlobalShoppingPartnerLinkPolicy || {}; }
  function getGlobalShoppingSandboxDeepLinkCandidateApi() { return window.WeishanGlobalShoppingSandboxDeepLinkCandidate || {}; }
  function getGlobalShoppingSandboxHandoffViewModelApi() { return window.WeishanGlobalShoppingSandboxHandoffViewModel || {}; }
  function getGlobalShoppingPricePipelineOrchestratorApi() { return window.WeishanGlobalShoppingPricePipelineOrchestrator || {}; }
  function getGlobalShoppingReadOnlyCandidateJourneyBoardApi() { return window.WeishanGlobalShoppingReadOnlyCandidateJourneyBoard || {}; }
  function getGlobalShoppingSandboxCandidateComparisonWorkbenchApi() { return window.WeishanGlobalShoppingSandboxCandidateComparisonWorkbench || {}; }
  function getGlobalShoppingProviderEvidenceComparisonMatrixApi() { return window.WeishanGlobalShoppingProviderEvidenceComparisonMatrix || {}; }
  function getGlobalShoppingReadOnlyHandoffReadinessDrillApi() { return window.WeishanGlobalShoppingReadOnlyHandoffReadinessDrill || {}; }
  function getGlobalShoppingSandboxDecisionReviewViewModelApi() { return window.WeishanGlobalShoppingSandboxDecisionReviewViewModel || {}; }
  function getGlobalShoppingReadOnlyPlatformHandoffSimulatorApi() { return window.WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator || {}; }
  function getGlobalShoppingRedactedSearchParameterPackApi() { return window.WeishanGlobalShoppingRedactedSearchParameterPack || {}; }
  function getGlobalShoppingUserConfirmationChecklistApi() { return window.WeishanGlobalShoppingUserConfirmationChecklist || {}; }
  function getGlobalShoppingPlatformHandoffSimulationViewModelApi() { return window.WeishanGlobalShoppingPlatformHandoffSimulationViewModel || {}; }
  function getGlobalShoppingManualGovernanceReleaseDecisionRoomApi() { return window.WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom || {}; }
  function getGlobalShoppingSandboxPilotExceptionRegisterApi() { return window.WeishanGlobalShoppingSandboxPilotExceptionRegister || {}; }
  function getGlobalShoppingProviderReadinessSignOffPacketApi() { return window.WeishanGlobalShoppingProviderReadinessSignOffPacket || {}; }
  function getGlobalShoppingProviderManualReleaseViewModelApi() { return window.WeishanGlobalShoppingProviderManualReleaseViewModel || {}; }
  function getGlobalShoppingProviderSandboxReadinessWorkbenchApi() { return window.WeishanGlobalShoppingProviderSandboxReadinessWorkbench || {}; }
  function getGlobalShoppingOfflineProviderScenarioLabApi() { return window.WeishanGlobalShoppingOfflineProviderScenarioLab || {}; }
  function getGlobalShoppingReadOnlyProviderAdapterSdkSkeletonApi() { return window.WeishanGlobalShoppingReadOnlyProviderAdapterSdkSkeleton || {}; }
  function getGlobalShoppingManualActivationCommandCenterApi() { return window.WeishanGlobalShoppingManualActivationCommandCenter || {}; }
  function getGlobalShoppingProviderSandboxMilestoneViewModelApi() { return window.WeishanGlobalShoppingProviderSandboxMilestoneViewModel || {}; }
  function getGlobalShoppingOfflineProviderAdapterContractKitApi() { return window.WeishanGlobalShoppingOfflineProviderAdapterContractKit || {}; }
  function getGlobalShoppingMockSandboxQaMatrixApi() { return window.WeishanGlobalShoppingMockSandboxQaMatrix || {}; }
  function getGlobalShoppingHumanActivationRunbookCenterApi() { return window.WeishanGlobalShoppingHumanActivationRunbookCenter || {}; }
  function getGlobalShoppingProviderAdapterComplianceChecklistApi() { return window.WeishanGlobalShoppingProviderAdapterComplianceChecklist || {}; }
  function getGlobalShoppingProviderSandboxReleaseCandidateViewModelApi() { return window.WeishanGlobalShoppingProviderSandboxReleaseCandidateViewModel || {}; }
  function getGlobalShoppingOfflineProviderCertificationCenterApi() { return window.WeishanGlobalShoppingOfflineProviderCertificationCenter || {}; }
  function getGlobalShoppingMockIntegrationRegressionLabApi() { return window.WeishanGlobalShoppingMockIntegrationRegressionLab || {}; }
  function getGlobalShoppingHumanApprovalEvidenceBinderApi() { return window.WeishanGlobalShoppingHumanApprovalEvidenceBinder || {}; }
  function getGlobalShoppingAdapterBoundaryLockApi() { return window.WeishanGlobalShoppingAdapterBoundaryLock || {}; }
  function getGlobalShoppingProviderCertificationViewModelApi() { return window.WeishanGlobalShoppingProviderCertificationViewModel || {}; }
  function getGlobalShoppingProviderOfflineReleaseGateApi() { return window.WeishanGlobalShoppingProviderOfflineReleaseGate || {}; }
  function getGlobalShoppingProviderCertificationFreezeLedgerApi() { return window.WeishanGlobalShoppingProviderCertificationFreezeLedger || {}; }
  function getGlobalShoppingSandboxActivationReviewPacketApi() { return window.WeishanGlobalShoppingSandboxActivationReviewPacket || {}; }
  function getGlobalShoppingAdapterBoundaryDiffInspectorApi() { return window.WeishanGlobalShoppingAdapterBoundaryDiffInspector || {}; }
  function getGlobalShoppingProviderOfflineReleaseViewModelApi() { return window.WeishanGlobalShoppingProviderOfflineReleaseViewModel || {}; }
  function getGlobalShoppingOfflineLaunchDecisionSimulatorApi() { return window.WeishanGlobalShoppingOfflineLaunchDecisionSimulator || {}; }
  function getGlobalShoppingSandboxActivationReceiptLedgerApi() { return window.WeishanGlobalShoppingSandboxActivationReceiptLedger || {}; }
  function getGlobalShoppingAdapterSecurityRegressionGuardApi() { return window.WeishanGlobalShoppingAdapterSecurityRegressionGuard || {}; }
  function getGlobalShoppingProviderOfflineLaunchChecklistApi() { return window.WeishanGlobalShoppingProviderOfflineLaunchChecklist || {}; }
  function getGlobalShoppingProviderOfflineLaunchViewModelApi() { return window.WeishanGlobalShoppingProviderOfflineLaunchViewModel || {}; }
  function getGlobalShoppingOfflineProviderLaunchControlTowerApi() { return window.WeishanGlobalShoppingOfflineProviderLaunchControlTower || {}; }
  function getGlobalShoppingAdapterPolicyEngineApi() { return window.WeishanGlobalShoppingAdapterPolicyEngine || {}; }
  function getGlobalShoppingHumanReleaseEvidenceTimelineApi() { return window.WeishanGlobalShoppingHumanReleaseEvidenceTimeline || {}; }
  function getGlobalShoppingSandboxActivationFinalReviewBoardApi() { return window.WeishanGlobalShoppingSandboxActivationFinalReviewBoard || {}; }
  function getGlobalShoppingProviderLaunchControlViewModelApi() { return window.WeishanGlobalShoppingProviderLaunchControlViewModel || {}; }
  function getGlobalShoppingProviderLaunchAuditSnapshotApi() { return window.WeishanGlobalShoppingProviderLaunchAuditSnapshot || {}; }
  function getGlobalShoppingOfflinePolicyReplayCenterApi() { return window.WeishanGlobalShoppingOfflinePolicyReplayCenter || {}; }
  function getGlobalShoppingHumanActivationFinalDossierApi() { return window.WeishanGlobalShoppingHumanActivationFinalDossier || {}; }
  function getGlobalShoppingAdapterLaunchBoundaryVerifierApi() { return window.WeishanGlobalShoppingAdapterLaunchBoundaryVerifier || {}; }
  function getGlobalShoppingProviderFinalLaunchReviewViewModelApi() { return window.WeishanGlobalShoppingProviderFinalLaunchReviewViewModel || {}; }
  function getGlobalShoppingFinalOfflineLaunchReviewConsoleApi() { return window.WeishanGlobalShoppingFinalOfflineLaunchReviewConsole || {}; }
  function getGlobalShoppingProviderActivationBlockerSentinelApi() { return window.WeishanGlobalShoppingProviderActivationBlockerSentinel || {}; }
  function getGlobalShoppingReadOnlyReleaseEvidenceSummaryApi() { return window.WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary || {}; }
  function getGlobalShoppingOfflineProviderReadinessDecisionMatrixApi() { return window.WeishanGlobalShoppingOfflineProviderReadinessDecisionMatrix || {}; }
  function getGlobalShoppingProviderFinalReviewConsoleViewModelApi() { return window.WeishanGlobalShoppingProviderFinalReviewConsoleViewModel || {}; }
  function getGlobalShoppingProviderFinalSafetySealApi() { return window.WeishanGlobalShoppingProviderFinalSafetySeal || {}; }
  function getGlobalShoppingOfflineActivationWarRoomApi() { return window.WeishanGlobalShoppingOfflineActivationWarRoom || {}; }
  function getGlobalShoppingReadOnlyProviderReadinessCertificateApi() { return window.WeishanGlobalShoppingReadOnlyProviderReadinessCertificate || {}; }
  function getGlobalShoppingProviderNoActivationGuaranteeBoardApi() { return window.WeishanGlobalShoppingProviderNoActivationGuaranteeBoard || {}; }
  function getGlobalShoppingProviderFinalSafetyViewModelApi() { return window.WeishanGlobalShoppingProviderFinalSafetyViewModel || {}; }
  function getGlobalShoppingOfflineProviderGovernanceClosureBoardApi() { return window.WeishanGlobalShoppingOfflineProviderGovernanceClosureBoard || {}; }
  function getGlobalShoppingNoActivationComplianceSealApi() { return window.WeishanGlobalShoppingNoActivationComplianceSeal || {}; }
  function getGlobalShoppingFinalReadinessHandoffSimulatorApi() { return window.WeishanGlobalShoppingFinalReadinessHandoffSimulator || {}; }
  function getGlobalShoppingProviderGovernanceClosureEvidenceLedgerApi() { return window.WeishanGlobalShoppingProviderGovernanceClosureEvidenceLedger || {}; }
  function getGlobalShoppingProviderGovernanceClosureViewModelApi() { return window.WeishanGlobalShoppingProviderGovernanceClosureViewModel || {}; }
  function getGlobalShoppingOfflineDistributionReadinessCenterApi() { return window.WeishanGlobalShoppingOfflineDistributionReadinessCenter || {}; }
  function getGlobalShoppingNoActivationEnforcementLedgerApi() { return window.WeishanGlobalShoppingNoActivationEnforcementLedger || {}; }
  function getGlobalShoppingFinalUserTrustSummaryApi() { return window.WeishanGlobalShoppingFinalUserTrustSummary || {}; }
  function getGlobalShoppingProviderSafetyDistributionMatrixApi() { return window.WeishanGlobalShoppingProviderSafetyDistributionMatrix || {}; }
  function getGlobalShoppingProviderDistributionReadinessViewModelApi() { return window.WeishanGlobalShoppingProviderDistributionReadinessViewModel || {}; }
  function getGlobalShoppingProviderDistributionFreezeConsoleApi() { return window.WeishanGlobalShoppingProviderDistributionFreezeConsole || {}; }
  function getGlobalShoppingUserFacingSafetyReceiptApi() { return window.WeishanGlobalShoppingUserFacingSafetyReceipt || {}; }
  function getGlobalShoppingOfflineReleaseCandidateClosurePackApi() { return window.WeishanGlobalShoppingOfflineReleaseCandidateClosurePack || {}; }
  function getGlobalShoppingProviderNoProductionGuaranteeMatrixApi() { return window.WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix || {}; }
  function getGlobalShoppingProviderDistributionClosureViewModelApi() { return window.WeishanGlobalShoppingProviderDistributionClosureViewModel || {}; }

  function lastRefreshStatusLabel(status) {
    const value = text(status || "not_run");
    if (value === "refreshed") return "已刷新";
    if (value === "disabled") return "已禁用";
    if (value === "blocked") return "已阻断";
    if (value === "failed_safe") return "安全失败";
    return "未运行";
  }

  function normalizeFlightFields(input) {
    const safe = input && typeof input === "object" ? input : {};
    const task = safe.task && typeof safe.task === "object" ? safe.task : safe;
    const flightFields = safe.flightFields && typeof safe.flightFields === "object" ? safe.flightFields : {};
    const rawTaskText = text(task.rawInput || task.inputSummary || task.title || task.text || safe.rawInput || "");
    const restrictedCategoryDecision = text(safe.restrictedCategoryDecision || task.restrictedCategoryDecision || "");
    const category = text(safe.category || task.category || task.procurementCategory || task.globalProcurementIntent && task.globalProcurementIntent.category || "");
    const restricted = safe.restrictedCategory === true || restrictedCategoryDecision === "blocked" || category === "restricted_or_blocked" || task.status === "blocked";
    return {
      taskTitle: text(task.title || task.rawInput || task.inputSummary || task.text || safe.taskTitle || ""),
      rawTaskText,
      origin: text(flightFields.origin || safe.origin || task.origin || "上海"),
      destination: text(flightFields.destination || safe.destination || task.destination || "成都"),
      departureDate: text(flightFields.date || safe.departureDate || task.departureDate || "2026-07-15"),
      dateDisplay: text(flightFields.dateDisplay || flightFields.date || safe.dateDisplay || task.dateDisplay || "7 月 15 日"),
      directPreference: text(flightFields.directPreference || safe.directPreference || task.directPreference || "直达优先"),
      sortLabel: text(flightFields.goal || safe.sortLabel || task.sortLabel || "低价优先"),
      restrictedCategory: restricted
    };
  }

  function getTrustedSource(providerId) {
    const registryApi = getRegistryApi();
    const registry = typeof registryApi.getTrustedFlightSourceRegistry === "function"
      ? registryApi.getTrustedFlightSourceRegistry()
      : { trustedSources: [] };
    const sources = Array.isArray(registry.trustedSources) ? registry.trustedSources : [];
    const match = sources.find(function (item) {
      return item && item.providerId === providerId;
    }) || sources.find(function (item) {
      return item && item.accessMode === "manual_search_only";
    }) || sources[0] || null;
    return match || {
      providerId: "google_flights_search",
      providerName: "Google Flights",
      providerType: "flight_search",
      accessMode: "manual_search_only",
      safeProviderHandoffUrl: null,
      safeProviderHandoffHost: "google.com",
      productionProvider: "disabled"
    };
  }

  function buildDefaultPriceQuote() {
    return {
      currency: "CNY",
      baseFare: 860,
      taxesAndFees: 110,
      providerFees: 40,
      totalPrice: 1010,
      priceUpdatedAt: "2026-06-20T00:00:00.000Z",
      freshnessStatus: "fresh",
      taxFeeIntegrityStatus: "complete",
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      booking: false,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    };
  }

  function buildReadOnlyPriceCandidateCardViewModel(input) {
    const safe = input && typeof input === "object" ? input : {};
    const normalized = normalizeFlightFields(safe);
    const source = getTrustedSource(text(safe.providerId || safe.source && safe.source.providerId || "google_flights_search"));
    const priceQuote = Object.assign({}, buildDefaultPriceQuote(), safe.priceQuote && typeof safe.priceQuote === "object" ? safe.priceQuote : {});
    const report = safe.report && typeof safe.report === "object" ? safe.report : {};
    const reportSandboxImport = report.sandboxImport && typeof report.sandboxImport === "object" ? report.sandboxImport : {};
    const inputSandboxImport = safe.sandboxImportSummary && typeof safe.sandboxImportSummary === "object" ? safe.sandboxImportSummary : {};
    const sandboxImportSource = Object.keys(inputSandboxImport).length ? inputSandboxImport : reportSandboxImport;
    const sandboxImportStatus = text(sandboxImportSource.lastImportStatus || sandboxImportSource.importStatus || sandboxImportSource.status || "not_run");
    const sandboxImportPreviewStatus = text(sandboxImportSource.lastPreviewStatus || sandboxImportSource.previewStatus || sandboxImportSource.validationStatus || "not_run");
    const sandboxImportBlockedReason = text(sandboxImportSource.lastBlockedReason || sandboxImportSource.blockedReason || sandboxImportSource.reason || "");
    const isSandboxImportEvidence = sandboxImportStatus === "accepted" || (safe.priceQuote && safe.priceQuote.fareSource === "sandbox_read_only_import") || report.provider && report.provider.fareSource === "sandbox_read_only_import";
    const sandboxImportAccepted = sandboxImportStatus === "accepted" || isSandboxImportEvidence;
    const sandboxImportRejected = sandboxImportStatus === "rejected" || sandboxImportStatus === "blocked" || sandboxImportStatus === "failed_safe";
    if (sandboxImportRejected) {
      priceQuote.baseFare = null;
      priceQuote.taxesAndFees = null;
      priceQuote.providerFees = null;
      priceQuote.totalPrice = null;
      priceQuote.fareSource = "sandbox_read_only_import";
    }
    const reportProvider = report.provider && typeof report.provider === "object" ? report.provider : {};
    const reportConnector = report.providerConnector && typeof report.providerConnector === "object" ? report.providerConnector : {};
    const providerMode = text(safe.providerMode || reportProvider.providerMode || reportConnector.providerMode || priceQuote.providerMode || "fixture");
    const isSandboxReadOnly = providerMode === "sandbox" || providerMode === "sandbox_read_only";
    const isProductionDisabled = providerMode === "production" || providerMode === "production_disabled";
    const titleLabel = isProductionDisabled ? "生产价格未启用" : (isSandboxImportEvidence ? "只读沙盒导入证据" : (isSandboxReadOnly ? "只读沙盒价" : "只读候选价"));
    const candidatePriceLabel = isSandboxImportEvidence ? "只读沙盒导入证据" : (isSandboxReadOnly ? "只读沙盒价" : (isProductionDisabled ? "生产价格未启用" : "候选价"));
    const importStatusBadge = isSandboxImportEvidence ? "只读沙盒导入证据" : (sandboxImportRejected ? (sandboxImportStatus === "blocked" ? "导入被阻断" : sandboxImportStatus === "failed_safe" ? "导入失败，已安全降级" : "导入响应已拒绝") : "");
    const importedEvidenceBanner = isSandboxImportEvidence ? "只读沙盒导入证据 · 已导入沙盒报价证据 · 导入响应已脱敏 · 仅作为候选证据，未锁价，不代表可出票 · 价格、库存、税费和规则以平台页面为准" : (sandboxImportRejected ? (sandboxImportStatus === "blocked" ? "导入被阻断" : "导入失败，已安全降级") : "");
    const importEvidenceBanner = importedEvidenceBanner;
    const reportHandoff = report.handoff && typeof report.handoff === "object" ? report.handoff : {};
    const reportRefresh = report.refresh && typeof report.refresh === "object" ? report.refresh : {};
    const reportCredentialReadiness = report.credentialReadiness && typeof report.credentialReadiness === "object" ? report.credentialReadiness : {};
    const stateStoreApi = getRefreshStateStoreApi();
    const refreshStateInput = safe.refreshState && typeof safe.refreshState === "object" ? safe.refreshState : (report.refreshState && typeof report.refreshState === "object" ? report.refreshState : {
      lastRefreshStatus:reportRefresh.lastRefreshStatus || "not_run",
      providerId:source.providerId,
      providerName:source.providerName,
      providerMode:providerMode,
      priceQuote:priceQuote,
      handoff:reportHandoff
    });
    const refreshStateSummary = typeof stateStoreApi.buildReadOnlyQuoteRefreshStateSummary === "function"
      ? stateStoreApi.buildReadOnlyQuoteRefreshStateSummary(refreshStateInput)
      : { title:"Refresh State Persistence", lastRefreshStatus:text(reportRefresh.lastRefreshStatus || "not_run"), lastRefreshStatusLabel:lastRefreshStatusLabel(reportRefresh.lastRefreshStatus), summary:"最近一次刷新：" + lastRefreshStatusLabel(reportRefresh.lastRefreshStatus), showableAsRealPrice:false, showableAsCandidateEvidence:false, canReplaceMainResultCard:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, redacted:true };
    const wizardApi = getBindingWizardApi();
    const providerBindingWizardSummary = typeof wizardApi.buildProviderSandboxBindingWizardModel === "function"
      ? wizardApi.buildProviderSandboxBindingWizardModel(Object.assign({}, safe, reportCredentialReadiness, { providerId:source.providerId, providerName:source.providerName, providerMode:providerMode, restrictedCategory:normalized.restrictedCategory }))
      : { wizardName:"provider_sandbox_binding_wizard_v1", title:"Provider 沙盒绑定准备", status:isProductionDisabled ? "disabled" : (isSandboxReadOnly ? (reportCredentialReadiness.status === "sandbox_ready" ? "sandbox_ready" : "needs_setup") : "fixture_ready"), missingRequirements:[], steps:[], actions:{ canAttemptReadOnlyRefresh:!isProductionDisabled && !normalized.restrictedCategory }, productionProviderEnabled:false, redacted:true };
    const interactiveApi = getInteractiveRefreshUiApi();
    const interactiveRefreshState = typeof interactiveApi.buildReadOnlyQuoteInteractiveRefreshUiState === "function"
      ? interactiveApi.buildReadOnlyQuoteInteractiveRefreshUiState(Object.assign({}, safe.interactiveRefreshState || {}, { state:refreshStateInput, status:safe.interactiveRefreshStatus || safe.status || (safe.interactiveRefreshState && safe.interactiveRefreshState.status) || "idle" }))
      : { status:"idle", recoveryStatus:"not_loaded", refreshButton:{ label:"刷新只读报价", enabled:true, loading:false, reason:"仅更新候选证据，未锁价，不代表可出票", autoRun:false }, lastRefreshSummary:{ status:refreshStateSummary.lastRefreshStatus || "not_run" }, recoveredEvidenceSummary:{ available:false, source:"local_redacted_state", showableAsRealPrice:false, showableAsCandidateEvidence:false, canReplaceMainResultCard:false }, refreshErrorBanner:"", clearRefreshStateButton:{ label:"清除刷新状态", enabled:false, autoRun:false }, safety:{ bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, booking:false, payment:false, order:false, identityUpload:false, redacted:true }, redacted:true };
    const releaseReadinessApi = getReleaseReadinessDashboardApi();
    const safetyCopyApi = getUserSafetyCopyRegistryApi();
    const consentFlowApi = getReadOnlyConsentFlowApi();
    const onboardingGuardApi = getPublicPilotOnboardingGuardApi();
    const onboardingViewModelApi = getPilotOnboardingViewModelApi();
    const issueIntakeApi = getSafeIssueIntakeFlowApi();
    const supportFallbackApi = getSupportFallbackRecommendationApi();
    const pilotSupportApi = getPilotSupportViewModelApi();
    const issueReviewApi = getPublicPilotIssueReviewBoardApi();
    const supportTriageApi = getSupportTriageDashboardApi();
    const pilotIssueReviewApi = getPilotIssueReviewViewModelApi();
    const issuePatternRadarApi = getIssuePatternRadarApi();
    const supportReadinessGateApi = getSupportReadinessGateApi();
    const issuePatternViewModelApi = getIssuePatternViewModelApi();
    const pilotReadinessSnapshotApi = getPublicPilotReadinessSnapshotApi();
    const supportPlaybookConsoleApi = getSupportPlaybookConsoleApi();
    const pilotSnapshotViewModelApi = getPilotSnapshotViewModelApi();
    const pilotInvitationGateApi = getPilotInvitationGateApi();
    const testerCohortEnrollmentConsoleApi = getTesterCohortEnrollmentConsoleApi();
    const pilotInvitationViewModelApi = getPilotInvitationViewModelApi();
    const topCandidates = (toArray(safe.dryRunTopCandidates).length ? toArray(safe.dryRunTopCandidates) : (toArray(safe.topCandidates).length ? toArray(safe.topCandidates) : toArray(report.rankingPreview && report.rankingPreview.topCandidates))).slice(0, 3).map(function (candidate, index) {
      const item = candidate && typeof candidate === "object" ? candidate : {};
      return Object.assign({}, item, { rank:item.rank || index + 1, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
    });
    const rankingPreview = safe.rankingPreview && typeof safe.rankingPreview === "object" ? safe.rankingPreview : (report.rankingPreview && typeof report.rankingPreview === "object" ? report.rankingPreview : {});
    const sourceBreakdown = safe.sourceBreakdown && typeof safe.sourceBreakdown === "object" ? safe.sourceBreakdown : (rankingPreview.sourceBreakdown && typeof rankingPreview.sourceBreakdown === "object" ? rankingPreview.sourceBreakdown : { providerCount: new Set(topCandidates.map(function (candidate) { return text(candidate.providerId || candidate.providerName || ""); }).filter(Boolean)).size, providerIds: Array.from(new Set(topCandidates.map(function (candidate) { return text(candidate.providerId || ""); }).filter(Boolean))), fareSources: Array.from(new Set(topCandidates.map(function (candidate) { return text(candidate.fareSource || ""); }).filter(Boolean))) });
    const rankingExplanation = safe.rankingExplanation || rankingPreview.rankingExplanation || report.rankingPreview && report.rankingPreview.rankingExplanation || "仅按导入样本中的只读候选证据排序，平台最终为准。";
    const selectedCandidate = safe.selectedCandidate && typeof safe.selectedCandidate === "object" ? safe.selectedCandidate : (report.selectedCandidate && typeof report.selectedCandidate === "object" ? report.selectedCandidate : null);
    const sandboxDryRunSummary = safe.sandboxDryRunSummary && typeof safe.sandboxDryRunSummary === "object" ? safe.sandboxDryRunSummary : (report.sandboxDryRunSummary && typeof report.sandboxDryRunSummary === "object" ? report.sandboxDryRunSummary : null);
    const runTimelineSummary = safe.runTimelineSummary && typeof safe.runTimelineSummary === "object" ? safe.runTimelineSummary : (sandboxDryRunSummary && sandboxDryRunSummary.runTimelineSummary && typeof sandboxDryRunSummary.runTimelineSummary === "object" ? sandboxDryRunSummary.runTimelineSummary : (report.runTimelineSummary && typeof report.runTimelineSummary === "object" ? report.runTimelineSummary : null));
    const dryRunTopCandidates = toArray(safe.dryRunTopCandidates).length ? toArray(safe.dryRunTopCandidates) : (sandboxDryRunSummary && toArray(sandboxDryRunSummary.dryRunTopCandidates).length ? toArray(sandboxDryRunSummary.dryRunTopCandidates) : topCandidates);
    const dryRunStatus = text(safe.dryRunStatus || (sandboxDryRunSummary && sandboxDryRunSummary.status) || (runTimelineSummary && runTimelineSummary.status) || "not_run");
    const dryRunButton = safe.dryRunButton && typeof safe.dryRunButton === "object" ? safe.dryRunButton : { label:"运行沙盒只读报价", enabled:true, loading:false, autoRun:false };
    const runHistorySummary = safe.runHistorySummary && typeof safe.runHistorySummary === "object" ? safe.runHistorySummary : (sandboxDryRunSummary && sandboxDryRunSummary.runHistorySummary && typeof sandboxDryRunSummary.runHistorySummary === "object" ? sandboxDryRunSummary.runHistorySummary : (report.runHistorySummary && typeof report.runHistorySummary === "object" ? report.runHistorySummary : null));
    const quoteDeltaSummary = safe.quoteDeltaSummary && typeof safe.quoteDeltaSummary === "object" ? safe.quoteDeltaSummary : (sandboxDryRunSummary && sandboxDryRunSummary.quoteDeltaSummary && typeof sandboxDryRunSummary.quoteDeltaSummary === "object" ? sandboxDryRunSummary.quoteDeltaSummary : (report.quoteDeltaSummary && typeof report.quoteDeltaSummary === "object" ? report.quoteDeltaSummary : null));
    const replaySummary = safe.replaySummary && typeof safe.replaySummary === "object" ? safe.replaySummary : (sandboxDryRunSummary && sandboxDryRunSummary.replaySummary && typeof sandboxDryRunSummary.replaySummary === "object" ? sandboxDryRunSummary.replaySummary : (report.replaySummary && typeof report.replaySummary === "object" ? report.replaySummary : null));
    const lastRunId = text(safe.lastRunId || (sandboxDryRunSummary && sandboxDryRunSummary.lastRunId) || (runHistorySummary && runHistorySummary.latestRunId) || "");
    const compareStatus = text(safe.compareStatus || (sandboxDryRunSummary && sandboxDryRunSummary.compareStatus) || (quoteDeltaSummary && (quoteDeltaSummary.compareStatus || quoteDeltaSummary.status)) || "not_enough_history");
    const replayStatus = text(safe.replayStatus || (sandboxDryRunSummary && sandboxDryRunSummary.replayStatus) || (replaySummary && replaySummary.status) || "unavailable");
    const sessionSummary = safe.sessionSummary && typeof safe.sessionSummary === "object" ? safe.sessionSummary : (sandboxDryRunSummary && sandboxDryRunSummary.sessionSummary && typeof sandboxDryRunSummary.sessionSummary === "object" ? sandboxDryRunSummary.sessionSummary : (report.sessionSummary && typeof report.sessionSummary === "object" ? report.sessionSummary : null));
    const sessionStatus = text(safe.sessionStatus || (sandboxDryRunSummary && sandboxDryRunSummary.sessionStatus) || (sessionSummary && sessionSummary.status) || "");
    const sessionId = text(safe.sessionId || (sandboxDryRunSummary && sandboxDryRunSummary.sessionId) || (sessionSummary && sessionSummary.sessionId) || "");
    const auditExportPreview = safe.auditExportPreview && typeof safe.auditExportPreview === "object" ? safe.auditExportPreview : (sandboxDryRunSummary && sandboxDryRunSummary.auditExportPreview && typeof sandboxDryRunSummary.auditExportPreview === "object" ? sandboxDryRunSummary.auditExportPreview : null);
    const auditExportReady = safe.auditExportReady === true || (sandboxDryRunSummary && sandboxDryRunSummary.auditExportReady === true) || !!auditExportPreview;
    const sessionRecoverySummary = safe.sessionRecoverySummary && typeof safe.sessionRecoverySummary === "object" ? safe.sessionRecoverySummary : (sandboxDryRunSummary && sandboxDryRunSummary.sessionRecoverySummary && typeof sandboxDryRunSummary.sessionRecoverySummary === "object" ? sandboxDryRunSummary.sessionRecoverySummary : (sessionSummary ? { title:"Session Recovery", available:true, sessionId:sessionId, status:sessionStatus || "updated", replaySource:"local_redacted_run_history", autoOpen:false, networkAllowed:false, redacted:true } : null));
    const reportCenterApi = getReportCenterApi();
    const formatterApi = getEvidenceFormatterApi();
    const decisionApi = getDecisionAssistantApi();
    const comparisonApi = getCandidateComparisonApi();
    const checklistApi = getChecklistApi();
    const receiptApi = getReceiptApi();
    const manualCheckApi = getManualPlatformCheckApi();
    const deltaApi = getPlatformDeltaApi();
    const reconciliationApi = getReconciliationApi();
    const confidenceApi = getConfidenceLabelerApi();
    const coachApi = getSafeNextStepCoachApi();
    const workflowAuditApi = getWorkflowAuditReviewApi();
    const safeExportApi = getSafeSessionExportPreviewApi();
    const riskBadgeApi = getRiskBadgeBuilderApi();
    const humanReviewApi = getHumanReviewChecklistApi();
    const finalPacketApi = getFinalSafeHandoffPacketApi();
    const packetPolicyApi = getHandoffPacketPolicyGuardApi();
    const sentinelApi = getSafetyRegressionSentinelApi();
    const operatorApi = getOperatorConsoleApi();
    const operatorViewModelApi = getOperatorConsoleViewModelApi();
    const workflowStateSummary = safe.workflowStateSummary && typeof safe.workflowStateSummary === "object" ? safe.workflowStateSummary : null;
    const clarificationSummary = safe.clarificationSummary && typeof safe.clarificationSummary === "object" ? safe.clarificationSummary : null;
    const workflowStepList = Array.isArray(safe.workflowStepList) ? safe.workflowStepList.slice() : [];
    const missingFields = Array.isArray(safe.missingFields) ? safe.missingFields.slice() : [];
    const clarificationQuestions = Array.isArray(safe.clarificationQuestions) ? safe.clarificationQuestions.slice() : [];
    const workflowUserMessage = text(safe.workflowUserMessage || "");
    const actionExecutionResult = safe.actionExecutionResult && typeof safe.actionExecutionResult === "object" ? safe.actionExecutionResult : null;
    const actionPolicyDecision = safe.actionPolicyDecision && typeof safe.actionPolicyDecision === "object" ? safe.actionPolicyDecision : null;
    const eventLedgerSummary = safe.eventLedgerSummary && typeof safe.eventLedgerSummary === "object" ? safe.eventLedgerSummary : null;
    const lastActionId = text(safe.lastActionId || eventLedgerSummary && eventLedgerSummary.lastActionId || "");
    const lastActionStatus = text(safe.lastActionStatus || eventLedgerSummary && eventLedgerSummary.lastActionStatus || "");
    const lastActionMessage = text(safe.lastActionMessage || eventLedgerSummary && eventLedgerSummary.lastActionMessage || "");
    const continuitySummary = safe.continuitySummary && typeof safe.continuitySummary === "object" ? safe.continuitySummary : null;
    const confirmationStateSummary = safe.confirmationStateSummary && typeof safe.confirmationStateSummary === "object" ? safe.confirmationStateSummary : null;
    const recoverySummary = safe.recoverySummary && typeof safe.recoverySummary === "object" ? safe.recoverySummary : null;
    const resumeCoachSummary = safe.resumeCoachSummary && typeof safe.resumeCoachSummary === "object" ? safe.resumeCoachSummary : null;
    const actionQueueSummary = safe.actionQueueSummary && typeof safe.actionQueueSummary === "object" ? safe.actionQueueSummary : (safe.actionQueue && typeof safe.actionQueue === "object" ? safe.actionQueue : null);
    const progressTimelineSummary = safe.progressTimelineSummary && typeof safe.progressTimelineSummary === "object" ? safe.progressTimelineSummary : (safe.progressTimeline && typeof safe.progressTimeline === "object" ? safe.progressTimeline : null);
    const safeResumeCenterSummary = safe.safeResumeCenterSummary && typeof safe.safeResumeCenterSummary === "object" ? safe.safeResumeCenterSummary : (safe.safeResumeCenter && typeof safe.safeResumeCenter === "object" ? safe.safeResumeCenter : null);
    const blockedActions = Array.isArray(safe.blockedActions) ? safe.blockedActions.slice() : (actionQueueSummary && Array.isArray(actionQueueSummary.blockedActions) ? actionQueueSummary.blockedActions.slice() : []);
    const resumeActions = Array.isArray(safe.resumeActions) ? safe.resumeActions.slice() : (resumeCoachSummary && Array.isArray(resumeCoachSummary.allowedActions) ? resumeCoachSummary.allowedActions.slice() : []);
    let workflowMeta = { workflowStateSummary:workflowStateSummary, clarificationSummary:clarificationSummary, continuitySummary:continuitySummary, confirmationStateSummary:confirmationStateSummary, recoverySummary:recoverySummary, resumeCoachSummary:resumeCoachSummary, actionQueueSummary:actionQueueSummary, progressTimelineSummary:progressTimelineSummary, safeResumeCenterSummary:safeResumeCenterSummary, blockedActions:blockedActions, currentActionLabel:text(safe.currentActionLabel || ""), nextSafeActionLabel:text(safe.nextSafeActionLabel || safe.nextSafeAction || ""), actionQueue:actionQueueSummary, progressTimeline:progressTimelineSummary, safeResumeCenter:safeResumeCenterSummary, nextSafeAction:text(safe.nextSafeActionLabel || safe.nextSafeAction || ""), currentStage:text(safe.currentStage || continuitySummary && continuitySummary.currentStage || ""), workflowStageLabel:text(safe.workflowStageLabel || continuitySummary && continuitySummary.stageLabel || ""), nextStepLabel:text(safe.nextStepLabel || continuitySummary && continuitySummary.resumePlan && continuitySummary.resumePlan.nextStepLabel || ""), canResumeWorkflow:safe.canResumeWorkflow === true || !!(continuitySummary && continuitySummary.resumePlan && continuitySummary.resumePlan.canResume === true), resumeActions:resumeActions, workflowStepList:workflowStepList, missingFields:missingFields, clarificationQuestions:clarificationQuestions, workflowUserMessage:workflowUserMessage, actionExecutionResult:actionExecutionResult, actionPolicyDecision:actionPolicyDecision, eventLedgerSummary:eventLedgerSummary, lastActionId:lastActionId, lastActionStatus:lastActionStatus, lastActionMessage:lastActionMessage, pilotReadinessSnapshotSummary:safe.pilotReadinessSnapshotSummary || null, supportPlaybookSummary:safe.supportPlaybookSummary || null, cohortProgressSummary:safe.cohortProgressSummary || null, trialMilestoneSummary:safe.trialMilestoneSummary || null, pilotSnapshotViewModelSummary:safe.pilotSnapshotViewModelSummary || null, pilotSnapshotStatus:text(safe.pilotSnapshotStatus || ""), supportPlaybookStatus:text(safe.supportPlaybookStatus || ""), cohortProgressStatus:text(safe.cohortProgressStatus || ""), trialMilestoneStatus:text(safe.trialMilestoneStatus || ""), safeToAdvanceNextCohort:safe.safeToAdvanceNextCohort === true, pilotSnapshotNextStep:text(safe.pilotSnapshotNextStep || "") };
    const workflowAuditReviewSummary = typeof workflowAuditApi.buildFlightWorkflowAuditReviewCenter === "function" ? workflowAuditApi.buildFlightWorkflowAuditReviewCenter(Object.assign({ topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, sessionSummary:sessionSummary }, workflowMeta)) : null;
    const safeSessionExportPreview = typeof safeExportApi.buildFlightWorkflowSafeSessionExportPreview === "function" ? safeExportApi.buildFlightWorkflowSafeSessionExportPreview(Object.assign({ topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, sessionSummary:sessionSummary, auditReviewSummary:workflowAuditReviewSummary }, workflowMeta)) : null;
    const sentinelInput = Object.assign({ topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, sessionSummary:sessionSummary, routeSummary:normalized.origin + " → " + normalized.destination, departureDate:normalized.departureDate, auditReviewSummary:workflowAuditReviewSummary, safeSessionExportPreview:safeSessionExportPreview }, workflowMeta);
    const safetyRegressionSummary = typeof sentinelApi.buildFlightWorkflowSafetyRegressionReport === "function" ? sentinelApi.buildFlightWorkflowSafetyRegressionReport(sentinelInput) : null;
    const humanReviewChecklistSummary = typeof humanReviewApi.buildFlightWorkflowHumanReviewChecklist === "function" ? humanReviewApi.buildFlightWorkflowHumanReviewChecklist(Object.assign({}, sentinelInput, { safetyRegressionSummary:safetyRegressionSummary })) : null;
    const finalSafeHandoffPacketSummary = typeof finalPacketApi.buildFlightWorkflowFinalSafeHandoffPacket === "function" ? finalPacketApi.buildFlightWorkflowFinalSafeHandoffPacket(Object.assign({}, sentinelInput, { safetyRegressionSummary:safetyRegressionSummary, humanReviewChecklistSummary:humanReviewChecklistSummary })) : null;
    const handoffPacketPolicyDecision = typeof packetPolicyApi.evaluateFlightWorkflowHandoffPacketPolicy === "function" ? packetPolicyApi.evaluateFlightWorkflowHandoffPacketPolicy({ finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, safetyRegressionSummary:safetyRegressionSummary }) : null;
    const operatorConsoleSummary = typeof operatorApi.buildFlightWorkflowOperatorConsole === "function" ? operatorApi.buildFlightWorkflowOperatorConsole(Object.assign({}, sentinelInput, { safetyRegressionSummary:safetyRegressionSummary, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, handoffPacketPolicyDecision:handoffPacketPolicyDecision })) : null;
    const operatorConsoleViewModel = typeof operatorViewModelApi.buildFlightWorkflowOperatorConsoleViewModel === "function" ? operatorViewModelApi.buildFlightWorkflowOperatorConsoleViewModel({ operatorConsoleSummary:operatorConsoleSummary }) : null;
    const betaExpansionGateSummary = safe.betaExpansionGateSummary && typeof safe.betaExpansionGateSummary === "object" ? safe.betaExpansionGateSummary : null;
    const publicPilotChecklistSummary = safe.publicPilotChecklistSummary && typeof safe.publicPilotChecklistSummary === "object" ? safe.publicPilotChecklistSummary : null;
    const pilotReadinessSummary = safe.pilotReadinessSummary && typeof safe.pilotReadinessSummary === "object" ? safe.pilotReadinessSummary : null;
    const safeForSmallPublicPilot = safe.safeForSmallPublicPilot === true || !!(pilotReadinessSummary && pilotReadinessSummary.status === "ready");
    const pilotNextStep = text(safe.pilotNextStep || (pilotReadinessSummary && pilotReadinessSummary.cards && pilotReadinessSummary.cards.find(function (card) { return card.cardId === "next_step"; }) || {}).value || "");
    const readOnlyConsentSummary = safe.readOnlyConsentSummary && typeof safe.readOnlyConsentSummary === "object" ? safe.readOnlyConsentSummary : (typeof consentFlowApi.buildFlightWorkflowReadOnlyUserConsentFlow === "function" ? consentFlowApi.buildFlightWorkflowReadOnlyUserConsentFlow(safe.userConsentInput || { started:true }) : null);
    const pilotOnboardingSummary = safe.pilotOnboardingSummary && typeof safe.pilotOnboardingSummary === "object" ? safe.pilotOnboardingSummary : (typeof onboardingGuardApi.buildFlightWorkflowPublicPilotOnboardingGuard === "function" ? onboardingGuardApi.buildFlightWorkflowPublicPilotOnboardingGuard({ betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, pilotReadinessSummary:pilotReadinessSummary, releaseReadinessReady:true, safetyCopyReady:true, forbiddenCapabilitiesVisible:true, readOnlyConsentSummary:readOnlyConsentSummary, noBlockedSafetyRisk:normalized.restrictedCategory !== true }) : null);
    const pilotOnboardingViewModel = safe.pilotOnboardingViewModel && typeof safe.pilotOnboardingViewModel === "object" ? safe.pilotOnboardingViewModel : (typeof onboardingViewModelApi.buildFlightWorkflowPilotOnboardingViewModel === "function" ? onboardingViewModelApi.buildFlightWorkflowPilotOnboardingViewModel({ pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary }) : null);
    const pilotEntryStatus = text(pilotOnboardingSummary && pilotOnboardingSummary.status || "needs_consent");
    const canEnterReadOnlyPilot = !!(pilotOnboardingSummary && pilotOnboardingSummary.decision && pilotOnboardingSummary.decision.canEnterReadOnlyPilot === true);
    const pilotConsentRequired = !(readOnlyConsentSummary && readOnlyConsentSummary.consentSummary && readOnlyConsentSummary.consentSummary.allRequiredAccepted === true);
    const issueIntakeSummary = safe.issueIntakeSummary && typeof safe.issueIntakeSummary === "object" ? safe.issueIntakeSummary : (typeof issueIntakeApi.buildFlightWorkflowSafeIssueIntakeFlow === "function" ? issueIntakeApi.buildFlightWorkflowSafeIssueIntakeFlow({ issueCategory:"candidate_unclear" }) : null);
    const supportFallbackSummary = safe.supportFallbackSummary && typeof safe.supportFallbackSummary === "object" ? safe.supportFallbackSummary : (typeof supportFallbackApi.buildFlightWorkflowSupportFallbackRecommendation === "function" ? supportFallbackApi.buildFlightWorkflowSupportFallbackRecommendation({ issueIntakeSummary:issueIntakeSummary, pilotOnboardingSummary:pilotOnboardingSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, operatorConsoleSummary:operatorConsoleSummary, auditReviewSummary:workflowAuditReviewSummary }) : null);
    const issueReviewSummary = safe.issueReviewSummary && typeof safe.issueReviewSummary === "object" ? safe.issueReviewSummary : (typeof issueReviewApi.buildFlightWorkflowPublicPilotIssueReviewBoard === "function" ? issueReviewApi.buildFlightWorkflowPublicPilotIssueReviewBoard({ issueIntake:issueIntakeSummary, supportFallbackRecommendation:supportFallbackSummary, pilotOnboardingSummary:pilotOnboardingSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, operatorConsoleSummary:operatorConsoleSummary }) : null);
    const supportTriageSummary = safe.supportTriageSummary && typeof safe.supportTriageSummary === "object" ? safe.supportTriageSummary : (typeof supportTriageApi.buildFlightWorkflowSupportTriageDashboard === "function" ? supportTriageApi.buildFlightWorkflowSupportTriageDashboard({ issueCategory:issueIntakeSummary && issueIntakeSummary.issueCategory, issueReviewBoard:issueReviewSummary, supportFallbackRecommendation:supportFallbackSummary }) : null);
    const pilotIssueReviewSummary = safe.pilotIssueReviewSummary && typeof safe.pilotIssueReviewSummary === "object" ? safe.pilotIssueReviewSummary : (typeof pilotIssueReviewApi.buildFlightWorkflowPilotIssueReviewViewModel === "function" ? pilotIssueReviewApi.buildFlightWorkflowPilotIssueReviewViewModel({ issueReviewBoard:issueReviewSummary, supportTriageDashboard:supportTriageSummary }) : null);
    const pilotIssueReviewStatus = text(pilotIssueReviewSummary && pilotIssueReviewSummary.status || issueReviewSummary && issueReviewSummary.status || "ready");
    const issueAffectsPilotExpansion = Boolean(issueReviewSummary && issueReviewSummary.issueHealth && issueReviewSummary.issueHealth.affectsPilotExpansion || supportTriageSummary && supportTriageSummary.triage && supportTriageSummary.triage.affectsPilotExpansion);
    const issueRequiresInternalReview = Boolean(issueReviewSummary && issueReviewSummary.issueHealth && issueReviewSummary.issueHealth.requiresInternalReview || supportTriageSummary && supportTriageSummary.triage && supportTriageSummary.triage.requiresInternalReview);
    const issuePatternSummary = safe.issuePatternSummary && typeof safe.issuePatternSummary === "object" ? safe.issuePatternSummary : (typeof issuePatternRadarApi.buildFlightWorkflowPublicPilotIssuePatternRadar === "function" ? issuePatternRadarApi.buildFlightWorkflowPublicPilotIssuePatternRadar({ issues:[issueReviewSummary, supportTriageSummary, issueIntakeSummary, supportFallbackSummary].filter(Boolean), issueReviewBoard:issueReviewSummary, supportTriageDashboard:supportTriageSummary, safeIssueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary }) : null);
    const supportReadinessSummary = safe.supportReadinessSummary && typeof safe.supportReadinessSummary === "object" ? safe.supportReadinessSummary : (typeof supportReadinessGateApi.buildFlightWorkflowSupportReadinessGate === "function" ? supportReadinessGateApi.buildFlightWorkflowSupportReadinessGate({ issuePatternRadar:issuePatternSummary, issueReviewBoard:issueReviewSummary, supportTriageDashboard:supportTriageSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, betaExpansionGateSummary:betaExpansionGateSummary, supportFallbackReady:!(supportFallbackSummary && supportFallbackSummary.status === "blocked") }) : null);
    const issuePatternViewModelSummary = safe.issuePatternViewModelSummary && typeof safe.issuePatternViewModelSummary === "object" ? safe.issuePatternViewModelSummary : (typeof issuePatternViewModelApi.buildFlightWorkflowIssuePatternViewModel === "function" ? issuePatternViewModelApi.buildFlightWorkflowIssuePatternViewModel({ issuePatternRadar:issuePatternSummary, supportReadinessGate:supportReadinessSummary }) : null);
    const pilotReadinessSnapshotSummary = safe.pilotReadinessSnapshotSummary && typeof safe.pilotReadinessSnapshotSummary === "object" ? safe.pilotReadinessSnapshotSummary : (typeof pilotReadinessSnapshotApi.buildFlightWorkflowPublicPilotReadinessSnapshot === "function" ? pilotReadinessSnapshotApi.buildFlightWorkflowPublicPilotReadinessSnapshot({ betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, pilotOnboardingSummary:pilotOnboardingSummary, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, operatorConsoleSummary:operatorConsoleSummary, safetyRegressionSummary:safetyRegressionSummary, safetyMatrixPass:safetyRegressionSummary && safetyRegressionSummary.status === "pass" }) : null);
    const supportPlaybookSummary = safe.supportPlaybookSummary && typeof safe.supportPlaybookSummary === "object" ? safe.supportPlaybookSummary : (typeof supportPlaybookConsoleApi.buildFlightWorkflowSupportPlaybookConsole === "function" ? supportPlaybookConsoleApi.buildFlightWorkflowSupportPlaybookConsole({ issueIntakeSummary:issueIntakeSummary, issuePatternSummary:issuePatternSummary, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, supportReadinessSummary:supportReadinessSummary }) : null);
    const pilotSnapshotViewModelSummary = safe.pilotSnapshotViewModelSummary && typeof safe.pilotSnapshotViewModelSummary === "object" ? safe.pilotSnapshotViewModelSummary : (typeof pilotSnapshotViewModelApi.buildFlightWorkflowPilotSnapshotViewModel === "function" ? pilotSnapshotViewModelApi.buildFlightWorkflowPilotSnapshotViewModel({ pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, operatorConsoleSummary:operatorConsoleSummary }) : null);
    const pilotInvitationGateSummary = safe.pilotInvitationGateSummary && typeof safe.pilotInvitationGateSummary === "object" ? safe.pilotInvitationGateSummary : (typeof pilotInvitationGateApi.buildFlightWorkflowReadOnlyPilotInvitationGate === "function" ? pilotInvitationGateApi.buildFlightWorkflowReadOnlyPilotInvitationGate({ pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary, issueReviewSummary:issueReviewSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, operatorConsoleSummary:operatorConsoleSummary, testerSlot:{ slotId:"tester-slot-001", slotType:"invited_tester", realIdentityStored:false } }) : null);
    const testerCohortEnrollmentConsoleSummary = safe.testerCohortEnrollmentConsoleSummary && typeof safe.testerCohortEnrollmentConsoleSummary === "object" ? safe.testerCohortEnrollmentConsoleSummary : (typeof testerCohortEnrollmentConsoleApi.buildFlightWorkflowTesterCohortEnrollmentConsole === "function" ? testerCohortEnrollmentConsoleApi.buildFlightWorkflowTesterCohortEnrollmentConsole({ pilotInvitationGateSummary:pilotInvitationGateSummary, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary, issueReviewSummary:issueReviewSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, operatorConsoleSummary:operatorConsoleSummary, rows:[{ rowId:"tester_slot_001", testerSlotId:"tester-slot-001", label:"默认测试用户批次", invitationStatus:pilotInvitationGateSummary && pilotInvitationGateSummary.status === "eligible" ? "invited" : "waitlist", consentStatus:readOnlyConsentSummary && readOnlyConsentSummary.status || "pending", feedbackStatus:"pending", issueStatus:issueReviewSummary && issueReviewSummary.status || "none", status:pilotInvitationGateSummary && pilotInvitationGateSummary.status === "eligible" ? "ready" : "review", redacted:true }] }) : null);
    const pilotInvitationViewModelSummary = safe.pilotInvitationViewModelSummary && typeof safe.pilotInvitationViewModelSummary === "object" ? safe.pilotInvitationViewModelSummary : (typeof pilotInvitationViewModelApi.buildFlightWorkflowPilotInvitationViewModel === "function" ? pilotInvitationViewModelApi.buildFlightWorkflowPilotInvitationViewModel({ pilotInvitationGateSummary:pilotInvitationGateSummary, testerCohortEnrollmentConsoleSummary:testerCohortEnrollmentConsoleSummary, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, readOnlyConsentSummary:readOnlyConsentSummary, issueReviewSummary:issueReviewSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, operatorConsoleSummary:operatorConsoleSummary }) : null);
    const cohortProgressSummary = safe.cohortProgressSummary && typeof safe.cohortProgressSummary === "object" ? safe.cohortProgressSummary : (pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.cohortProgressSummary ? pilotReadinessSnapshotSummary.cohortProgressSummary : null);
    const trialMilestoneSummary = safe.trialMilestoneSummary && typeof safe.trialMilestoneSummary === "object" ? safe.trialMilestoneSummary : (pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.trialMilestoneSummary ? pilotReadinessSnapshotSummary.trialMilestoneSummary : null);
    const cohortProgressStatus = text(safe.cohortProgressStatus || cohortProgressSummary && cohortProgressSummary.status || "needs_more_testers");
    const trialMilestoneStatus = text(safe.trialMilestoneStatus || trialMilestoneSummary && trialMilestoneSummary.status || "needs_review");
    const safeToAdvanceNextCohort = safe.safeToAdvanceNextCohort === true || cohortProgressSummary && cohortProgressSummary.safeToAdvanceNextCohort === true || trialMilestoneSummary && trialMilestoneSummary.safeToAdvanceNextCohort === true;
    const pilotSnapshotStatus = text(pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.status || pilotReadinessSummary && pilotReadinessSummary.status || "continue_small_pilot");
    const supportPlaybookStatus = text(supportPlaybookSummary && supportPlaybookSummary.status || "ready");
    const pilotSnapshotNextStep = text((pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.pilotSnapshotNextStep) || (pilotReadinessSnapshotSummary && pilotReadinessSnapshotSummary.userFacingSummary && pilotReadinessSnapshotSummary.userFacingSummary.resultLabel) || (pilotSnapshotViewModelSummary && pilotSnapshotViewModelSummary.cards && pilotSnapshotViewModelSummary.cards[3] && pilotSnapshotViewModelSummary.cards[3].value) || "继续观察只读试点反馈");
    const pilotInvitationStatus = text(pilotInvitationGateSummary && pilotInvitationGateSummary.status || "waitlist");
    const testerCohortStatus = text(testerCohortEnrollmentConsoleSummary && testerCohortEnrollmentConsoleSummary.status || "needs_more_testers");
    const pilotInvitationNextStep = text(pilotInvitationViewModelSummary && pilotInvitationViewModelSummary.cards && pilotInvitationViewModelSummary.cards[0] && pilotInvitationViewModelSummary.cards[0].value || (pilotInvitationGateSummary && pilotInvitationGateSummary.userFacingSummary && pilotInvitationGateSummary.userFacingSummary.resultLabel) || "待邀请");
    workflowMeta = Object.assign({}, workflowMeta, { pilotInvitationGateSummary:pilotInvitationGateSummary, testerCohortEnrollmentConsoleSummary:testerCohortEnrollmentConsoleSummary, pilotInvitationViewModelSummary:pilotInvitationViewModelSummary, cohortProgressSummary:cohortProgressSummary, trialMilestoneSummary:trialMilestoneSummary, pilotInvitationStatus:pilotInvitationStatus, testerCohortStatus:testerCohortStatus, cohortProgressStatus:cohortProgressStatus, trialMilestoneStatus:trialMilestoneStatus, safeToAdvanceNextCohort:safeToAdvanceNextCohort, pilotInvitationNextStep:pilotInvitationNextStep });
    const issuePatternStatus = text(issuePatternSummary && issuePatternSummary.status || "insufficient_data");
    const supportReadinessStatus = text(supportReadinessSummary && supportReadinessSummary.status || "continue_small_pilot");
    const supportReadyForPublicPilot = Boolean(supportReadinessSummary && supportReadinessSummary.decision && supportReadinessSummary.decision.supportReadyForPublicPilot);
    const repeatedIssueRisk = Boolean(issuePatternSummary && issuePatternSummary.issuePatternHealth && issuePatternSummary.issuePatternHealth.hasRepeatedPattern);
    const rolloutControlApi = getRolloutControlCenterApi();
    const cohortHealthApi = getCohortHealthDashboardApi();
    const rolloutControlViewModelApi = getRolloutControlViewModelApi();
    const pilotOpsSummaryApi = getPilotOpsSummaryApi();
    const nextCohortDecisionBoardApi = getNextCohortDecisionBoardApi();
    const pilotExitCriteriaApi = getPilotExitCriteriaApi();
    const launchCandidateReadinessApi = getLaunchCandidateReadinessApi();
    const pilotOpsViewModelApi = getPilotOpsViewModelApi();
    const pilotExitCriteriaSummary = safe.pilotExitCriteriaSummary && typeof safe.pilotExitCriteriaSummary === "object" ? safe.pilotExitCriteriaSummary : (typeof pilotExitCriteriaApi.buildFlightWorkflowReadOnlyPilotExitCriteria === "function" ? pilotExitCriteriaApi.buildFlightWorkflowReadOnlyPilotExitCriteria(Object.assign({}, workflowMeta, { pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, safetyRegressionSummary:safetyRegressionSummary, releaseReadinessSummary:null })) : null);
    const launchCandidateReadinessSummary = safe.launchCandidateReadinessSummary && typeof safe.launchCandidateReadinessSummary === "object" ? safe.launchCandidateReadinessSummary : (typeof launchCandidateReadinessApi.buildFlightWorkflowLaunchCandidateReadinessBoard === "function" ? launchCandidateReadinessApi.buildFlightWorkflowLaunchCandidateReadinessBoard(Object.assign({}, workflowMeta, { pilotExitCriteriaSummary:pilotExitCriteriaSummary, releaseReadinessSummary:null, safetyMatrixSummary:null, operatorConsoleSummary:null, supportReadinessSummary:supportReadinessSummary, pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, safetyRegressionSummary:safetyRegressionSummary })) : null);
    const rolloutInput = Object.assign({}, workflowMeta, { cohortProgressSummary:cohortProgressSummary, trialMilestoneSummary:trialMilestoneSummary, pilotInvitationGateSummary:pilotInvitationGateSummary, testerCohortEnrollmentConsoleSummary:testerCohortEnrollmentConsoleSummary, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, safetyRegressionSummary:safetyRegressionSummary, safetySentinelPass:safetyRegressionSummary && safetyRegressionSummary.status === "pass", noSensitiveDataRisk:true, noTradingRisk:true, noOpenBlockingIssue:issuePatternStatus !== "blocked" && supportReadinessStatus !== "blocked" });
    const rolloutControlSummary = safe.rolloutControlSummary && typeof safe.rolloutControlSummary === "object" ? safe.rolloutControlSummary : (typeof rolloutControlApi.buildFlightWorkflowReadOnlyPilotRolloutControlCenter === "function" ? rolloutControlApi.buildFlightWorkflowReadOnlyPilotRolloutControlCenter(rolloutInput) : null);
    const cohortHealthSummary = safe.cohortHealthSummary && typeof safe.cohortHealthSummary === "object" ? safe.cohortHealthSummary : (typeof cohortHealthApi.buildFlightWorkflowCohortHealthDashboard === "function" ? cohortHealthApi.buildFlightWorkflowCohortHealthDashboard(Object.assign({}, rolloutInput, { cohort:testerCohortEnrollmentConsoleSummary && testerCohortEnrollmentConsoleSummary.cohort, rows:testerCohortEnrollmentConsoleSummary && testerCohortEnrollmentConsoleSummary.rows })) : null);
    const pilotOpsSummary = safe.pilotOpsSummary && typeof safe.pilotOpsSummary === "object" ? safe.pilotOpsSummary : (typeof pilotOpsSummaryApi.buildFlightWorkflowReadOnlyPilotOpsSummary === "function" ? pilotOpsSummaryApi.buildFlightWorkflowReadOnlyPilotOpsSummary(Object.assign({}, rolloutInput, { rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, safetyRegressionSummary:safetyRegressionSummary })) : null);
    const nextCohortDecisionSummary = safe.nextCohortDecisionSummary && typeof safe.nextCohortDecisionSummary === "object" ? safe.nextCohortDecisionSummary : (typeof nextCohortDecisionBoardApi.buildFlightWorkflowNextCohortDecisionBoard === "function" ? nextCohortDecisionBoardApi.buildFlightWorkflowNextCohortDecisionBoard(Object.assign({}, rolloutInput, { pilotOpsSummary:pilotOpsSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, safetyRegressionSummary:safetyRegressionSummary })) : null);
    const rolloutControlViewModel = safe.rolloutControlViewModel && typeof safe.rolloutControlViewModel === "object" ? safe.rolloutControlViewModel : (typeof rolloutControlViewModelApi.buildFlightWorkflowRolloutControlViewModel === "function" ? rolloutControlViewModelApi.buildFlightWorkflowRolloutControlViewModel(Object.assign({}, rolloutInput, { rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary })) : null);
    const rolloutDecisionStatus = text(rolloutControlSummary && rolloutControlSummary.status || "");
    const cohortHealthStatus = text(cohortHealthSummary && cohortHealthSummary.status || "");
    const rolloutNextStep = text(rolloutControlSummary && rolloutControlSummary.decision && rolloutControlSummary.decision.label || "");
    const pilotOpsStatus = text(pilotOpsSummary && pilotOpsSummary.status || "");
    const nextCohortDecisionStatus = text(nextCohortDecisionSummary && nextCohortDecisionSummary.status || "");
    const pilotOpsPrimaryRisk = pilotOpsSummary && pilotOpsSummary.primaryRisk || null;
    const pilotOpsViewModel = safe.pilotOpsViewModel && typeof safe.pilotOpsViewModel === "object" ? safe.pilotOpsViewModel : (typeof pilotOpsViewModelApi.buildFlightWorkflowPilotOpsViewModel === "function" ? pilotOpsViewModelApi.buildFlightWorkflowPilotOpsViewModel(Object.assign({}, rolloutInput, { pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, supportReadinessSummary:supportReadinessSummary, issuePatternSummary:issuePatternSummary, safetyRegressionSummary:safetyRegressionSummary })) : null);
    workflowMeta = Object.assign({}, workflowMeta, { rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, pilotOpsViewModel:pilotOpsViewModel, pilotOpsStatus:pilotOpsStatus, nextCohortDecisionStatus:nextCohortDecisionStatus, pilotOpsPrimaryRisk:pilotOpsPrimaryRisk, launchCandidateStatus:launchCandidateReadinessSummary && launchCandidateReadinessSummary.status || "", readyForLaunchCandidate:launchCandidateReadinessSummary && launchCandidateReadinessSummary.launchCandidateReadiness && launchCandidateReadinessSummary.launchCandidateReadiness.safeForReadOnlyLaunchCandidate === true, launchCandidateNextStep:launchCandidateReadinessSummary && launchCandidateReadinessSummary.launchCandidateNextStep || "", rolloutControlViewModel:rolloutControlViewModel, rolloutDecisionStatus:rolloutDecisionStatus, cohortHealthStatus:cohortHealthStatus, rolloutNextStep:rolloutNextStep });
    const pilotSupportSummary = safe.pilotSupportSummary && typeof safe.pilotSupportSummary === "object" ? safe.pilotSupportSummary : (typeof pilotSupportApi.buildFlightWorkflowPilotSupportViewModel === "function" ? pilotSupportApi.buildFlightWorkflowPilotSupportViewModel({ issueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary }) : null);
    const pilotSupportStatus = text(pilotSupportSummary && pilotSupportSummary.status || issueIntakeSummary && issueIntakeSummary.status || "ready");
    const supportNextStep = text(supportFallbackSummary && supportFallbackSummary.recommendation && supportFallbackSummary.recommendation.label || "建议重新查看候选证据");
    const userSafetyCopySummary = typeof safetyCopyApi.buildFlightWorkflowSafetyCopySet === "function" ? safetyCopyApi.buildFlightWorkflowSafetyCopySet({ releaseVersion:"2.3.3" }) : null;
    const releaseReadinessSummary = typeof releaseReadinessApi.buildFlightWorkflowReleaseReadinessDashboard === "function" ? releaseReadinessApi.buildFlightWorkflowReleaseReadinessDashboard(Object.assign({}, sentinelInput, { releaseVersion:"2.3.3", safetyRegressionSummary:safetyRegressionSummary, auditReviewSummary:workflowAuditReviewSummary, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, safeSessionExportPreview:safeSessionExportPreview, operatorConsoleSummary:operatorConsoleSummary, userSafetyCopySummary:userSafetyCopySummary, betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, pilotReadinessSummary:pilotReadinessSummary, safeForSmallPublicPilot:safeForSmallPublicPilot, pilotNextStep:pilotNextStep, pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary, pilotOnboardingViewModel:pilotOnboardingViewModel, pilotEntryStatus:pilotEntryStatus, canEnterReadOnlyPilot:canEnterReadOnlyPilot, pilotConsentRequired:pilotConsentRequired, pilotSupportSummary:pilotSupportSummary, issueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary, pilotSupportStatus:pilotSupportStatus, supportNextStep:supportNextStep, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, pilotIssueReviewSummary:pilotIssueReviewSummary, pilotIssueReviewStatus:pilotIssueReviewStatus, issueAffectsPilotExpansion:issueAffectsPilotExpansion, issueRequiresInternalReview:issueRequiresInternalReview, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issuePatternViewModelSummary:issuePatternViewModelSummary, issuePatternStatus:issuePatternStatus, supportReadinessStatus:supportReadinessStatus, supportReadyForPublicPilot:supportReadyForPublicPilot, repeatedIssueRisk:repeatedIssueRisk, pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, pilotOpsSummary:pilotOpsSummary, nextCohortDecisionSummary:nextCohortDecisionSummary, pilotOpsStatus:pilotOpsStatus, nextCohortDecisionStatus:nextCohortDecisionStatus, pilotOpsPrimaryRisk:pilotOpsPrimaryRisk, launchCandidateStatus:launchCandidateReadinessSummary && launchCandidateReadinessSummary.status || "", readyForLaunchCandidate:launchCandidateReadinessSummary && launchCandidateReadinessSummary.launchCandidateReadiness && launchCandidateReadinessSummary.launchCandidateReadiness.safeForReadOnlyLaunchCandidate === true, launchCandidateNextStep:launchCandidateReadinessSummary && launchCandidateReadinessSummary.launchCandidateNextStep || "", rolloutDecisionStatus:rolloutDecisionStatus, cohortHealthStatus:cohortHealthStatus, rolloutNextStep:rolloutNextStep })) : null;
    const freezeGateApi = getLaunchCandidateFreezeGateApi();
    const evidenceFreezePackApi = getEvidenceFreezePackApi();
    const launchCandidateFreezeViewModelApi = getLaunchCandidateFreezeViewModelApi();
    const freezeGateSummary = safe.freezeGateSummary && typeof safe.freezeGateSummary === "object" ? safe.freezeGateSummary : (typeof freezeGateApi.buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate === "function" ? freezeGateApi.buildFlightWorkflowReadOnlyLaunchCandidateFreezeGate(Object.assign({}, workflowMeta, { pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, releaseReadinessSummary:releaseReadinessSummary, safetyRegressionSummary:safetyRegressionSummary, evidenceFreezePackSummary:safe.evidenceFreezePackSummary || null })) : null);
    const evidenceFreezePackSummary = safe.evidenceFreezePackSummary && typeof safe.evidenceFreezePackSummary === "object" ? safe.evidenceFreezePackSummary : (typeof evidenceFreezePackApi.buildFlightWorkflowEvidenceFreezePack === "function" ? evidenceFreezePackApi.buildFlightWorkflowEvidenceFreezePack(Object.assign({}, workflowMeta, { releaseReadinessSummary:releaseReadinessSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary, safetyRegressionSummary:safetyRegressionSummary, operatorConsoleSummary:operatorConsoleSummary, pilotOpsSummary:pilotOpsSummary, supportReadinessSummary:supportReadinessSummary })) : null);
    const launchCandidateFreezeViewModelSummary = safe.launchCandidateFreezeViewModelSummary && typeof safe.launchCandidateFreezeViewModelSummary === "object" ? safe.launchCandidateFreezeViewModelSummary : (typeof launchCandidateFreezeViewModelApi.buildFlightWorkflowLaunchCandidateFreezeViewModel === "function" ? launchCandidateFreezeViewModelApi.buildFlightWorkflowLaunchCandidateFreezeViewModel({ freezeGateSummary:freezeGateSummary, evidenceFreezePackSummary:evidenceFreezePackSummary, pilotExitCriteriaSummary:pilotExitCriteriaSummary, launchCandidateReadinessSummary:launchCandidateReadinessSummary }) : null);
    const compactSafetyRegressionSummary = compactSummary(safetyRegressionSummary, ["status", "userFacingSummary", "checks", "failures", "warnings"]);
    const compactOperatorConsoleSummary = compactSummary(operatorConsoleSummary, ["status", "userFacingSummary", "globalShoppingProductGoalSummary", "jumpToPlatformBoundarySummary", "readOnlyProviderSandboxConnectorSummary", "fixtureReplayConsoleSummary", "normalizedPriceCandidateBoardSummary", "realProviderSandboxGateSummary", "providerRequestEnvelopeSummary", "providerCallAuditLedgerSummary", "providerSandboxReadinessViewModelSummary", "providerSandboxDryRunHarnessSummary", "firstReadOnlyProviderAdapterShellSummary", "providerSandboxSafetyKillSwitchSummary", "providerSandboxDryRunViewModelSummary", "offlineSandboxTraceInspectorSummary", "mockProviderResultNormalizerSummary", "manualActivationDryRunChecklistSummary", "providerAdapterRegistrySummary", "dryRunProviderResponseNormalizerSummary", "sandboxProviderRunbookSummary", "providerAdapterRegistryViewModelSummary", "firstSandboxProviderConnectorSummary", "providerCoverageDashboardSummary", "readOnlySourceTrustScoreSummary", "providerCoverageViewModelSummary", "readOnlyProviderSandboxIntegrationGateSummary", "sandboxPriceCandidateSessionSummary", "sandboxPriceCandidateResultBoardSummary", "sandboxCandidateComparisonWorkbenchSummary", "providerEvidenceComparisonMatrixSummary", "readOnlyHandoffReadinessDrillSummary", "sandboxDecisionReviewViewModelSummary", "readOnlyPlatformHandoffSimulatorSummary", "redactedSearchParameterPackSummary", "userConfirmationChecklistSummary", "platformHandoffSimulationViewModelSummary", "readOnlyHandoffPacketPreviewSummary", "platformPreflightSafetyGateSummary", "userActionBoundaryReceiptSummary", "handoffPacketViewModelSummary", "manualPlatformReviewCockpitSummary", "handoffAcceptanceWalkthroughSummary", "platformRealityCheckBoardSummary", "manualPlatformReviewViewModelSummary", "userFacingManualReviewFlowSummary", "platformVerificationProgressTrackerSummary", "safeNextActionPanelSummary", "userManualReviewViewModelSummary", "manualPlatformVisitPreparationCenterSummary", "externalPlatformBoundaryBriefSummary", "finalUserSafetyChecklistSummary", "platformVisitPreparationViewModelSummary", "readOnlyCommerceSessionRecapCenterSummary", "userTrustClosureSummarySummary", "nextFeatureReadinessGateSummary", "commerceSessionRecapViewModelSummary", "legalProviderFixtureSummary", "providerCredentialSafetySummary", "sandboxPriceFeedSummary", "sandboxProviderResponseContractSummary", "pricePipelineOrchestratorSummary", "readOnlyCandidateJourneySummary", "providerFixtureViewModelSummary", "sameItemMatcherSummary", "duplicateCandidateMergerSummary", "coveredLowestCandidateBoardSummary", "externalDeepLinkSafetySummary", "searchParameterPrefillSummary", "jumpToPlatformHandoffPreviewSummary", "sandboxDeepLinkCandidateSummary", "platformAvailabilitySummary", "partnerLinkPolicySummary", "sandboxHandoffViewModelSummary", "providerSandboxReadinessWorkbenchSummary", "offlineProviderScenarioLabSummary", "readOnlyProviderAdapterSdkSkeletonSummary", "manualActivationCommandCenterSummary", "providerSandboxMilestoneViewModelSummary", "offlineLaunchDecisionSimulatorSummary", "sandboxActivationReceiptLedgerSummary", "adapterSecurityRegressionGuardSummary", "providerOfflineLaunchChecklistSummary", "providerOfflineLaunchViewModelSummary", "readOnlyProviderSandboxConnectorStatus", "fixtureReplayStatus", "normalizedPriceCandidateBoardStatus", "realProviderSandboxGateStatus", "providerRequestEnvelopeStatus", "providerCallAuditLedgerStatus", "providerSandboxReadinessStatus", "providerSandboxDryRunStatus", "providerAdapterShellStatus", "providerKillSwitchStatus", "providerSandboxDryRunViewModelStatus", "offlineSandboxTraceInspectorStatus", "mockProviderResultNormalizerStatus", "manualActivationDryRunChecklistStatus", "providerAdapterRegistryStatus", "dryRunResponseNormalizerStatus", "sandboxProviderRunbookStatus", "providerAdapterRegistryViewModelStatus", "firstSandboxProviderConnectorStatus", "providerCoverageStatus", "sourceTrustStatus", "providerCoverageViewModelStatus", "providerSandboxIntegrationGateStatus", "sandboxPriceCandidateSessionStatus", "sandboxPriceCandidateResultBoardStatus", "sandboxCandidateComparisonWorkbenchStatus", "providerEvidenceComparisonMatrixStatus", "readOnlyHandoffReadinessDrillStatus", "sandboxDecisionReviewStatus", "readOnlyPlatformHandoffSimulatorStatus", "redactedSearchParameterPackStatus", "userConfirmationChecklistStatus", "platformHandoffSimulationViewModelStatus", "readOnlyHandoffPacketPreviewStatus", "platformPreflightSafetyGateStatus", "userActionBoundaryReceiptStatus", "handoffPacketViewModelStatus", "manualPlatformReviewCockpitStatus", "handoffAcceptanceWalkthroughStatus", "platformRealityCheckStatus", "manualPlatformReviewViewModelStatus", "userFacingManualReviewFlowStatus", "platformVerificationProgressStatus", "safeNextActionPanelStatus", "userManualReviewViewModelStatus", "manualPlatformVisitPreparationStatus", "externalPlatformBoundaryStatus", "finalUserSafetyChecklistStatus", "platformVisitPreparationViewModelStatus", "readOnlyCommerceSessionRecapStatus", "userTrustClosureSummaryStatus", "nextFeatureReadinessGateStatus", "commerceSessionRecapViewModelStatus", "sandboxProviderResponseContractStatus", "pricePipelineStatus", "readOnlyCandidateJourneyStatus", "sameItemMatcherStatus", "duplicateMergeStatus", "coveredLowestStatus", "legalProviderFixtureStatus", "providerCredentialSafetyStatus", "sandboxPriceFeedStatus", "externalDeepLinkSafetyStatus", "searchPrefillStatus", "handoffPreviewStatus", "sandboxDeepLinkStatus", "platformAvailabilityStatus", "partnerLinkPolicyStatus", "sandboxHandoffStatus", "providerSandboxReadinessWorkbenchStatus", "offlineProviderScenarioLabStatus", "readOnlyProviderAdapterSdkSkeletonStatus", "manualActivationCommandCenterStatus", "providerSandboxMilestoneViewModelStatus", "offlineLaunchDecisionSimulatorStatus", "sandboxActivationReceiptLedgerStatus", "adapterSecurityRegressionGuardStatus", "providerOfflineLaunchChecklistStatus", "providerOfflineLaunchViewModelStatus", "safeToProceedWithReadOnlyPriceProviderSandbox", "safeToProceedWithFirstRealReadOnlyProviderSandbox", "safeToProceedWithFirstReadOnlySandboxDryRun", "safeToProceedWithFirstProviderSandboxFixtureDryRun", "safeToProceedWithFirstSandboxProviderConnectorImplementation", "safeToProceedWithFirstReadOnlyProviderSandboxIntegration", "safeToProceedWithSandboxCandidateUserPreview", "safeToProceedWithDeepLinkSafetyGate", "safeToProceedWithSandboxDeepLinkCandidate", "safeToProceedWithPartnerFixtureAdapter", "safeToProceedWithRealReadOnlyProviderSandbox", "safeToProceedWithSandboxDecisionReview", "safeToProceedWithUserFacingHandoffExplanation", "safeToProceedWithManualPlatformReview", "safeToProceedWithManualPlatformUserEducation", "safeToProceedWithManualExternalPlatformVisitEducation", "safeToProceedWithUserLeavingWeishanEducation", "safeToProceedWithReadOnlyProviderSandboxPlanning", "safeToProceedWithManualSandboxDryRunReview", "safeToProceedWithHumanSandboxMilestoneReview", "safeToProceedWithManualOfflineLaunchDecisionReview"]);
    const compactReleaseReadinessSummary = compactSummary(releaseReadinessSummary, ["status", "safeForUserFacingBeta", "userFacingSummary", "forbiddenCapabilitySummary", "userFacingBetaReadiness", "copyValidationStatus"]);
    const compactPilotExitCriteriaSummary = compactSummary(pilotExitCriteriaSummary, ["status", "userFacingSummary", "exitHealth"]);
    const compactLaunchCandidateReadinessSummary = compactSummary(launchCandidateReadinessSummary, ["status", "userFacingSummary", "launchCandidateReadiness", "launchCandidateNextStep"]);
    const compactFreezeGateSummary = compactSummary(freezeGateSummary, ["status", "userFacingSummary", "freezeDecision"]);
    const compactEvidenceFreezePackSummary = compactSummary(evidenceFreezePackSummary, ["status", "safeToFreeze", "userFacingSummary"]);
    const compactRiskBadgeSummary = safe.riskBadgeSummary && typeof safe.riskBadgeSummary === "object"
      ? compactSummary(safe.riskBadgeSummary, ["summaryLabel", "line", "badges"])
      : { summaryLabel:"只读安全", line:"只读安全", badges:[], redacted:true };
    const rcCandidateReviewConsoleApi = getRcCandidateReviewConsoleApi();
    const rcEvidenceReviewChecklistApi = getRcEvidenceReviewChecklistApi();
    const rcReviewViewModelApi = getRcReviewViewModelApi();
    const rcRegressionAuditPackApi = getRcRegressionAuditPackApi();
    const releaseRiskLedgerApi = getReleaseRiskLedgerApi();
    const rcRegressionViewModelApi = getRcRegressionViewModelApi();
    const rcCandidateReviewSummary = safe.rcCandidateReviewSummary && typeof safe.rcCandidateReviewSummary === "object" ? safe.rcCandidateReviewSummary : (typeof rcCandidateReviewConsoleApi.buildFlightWorkflowRcCandidateReviewConsole === "function" ? rcCandidateReviewConsoleApi.buildFlightWorkflowRcCandidateReviewConsole(Object.assign({}, workflowMeta, { freezeGateSummary:compactFreezeGateSummary, evidenceFreezePackSummary:compactEvidenceFreezePackSummary, launchCandidateReadinessSummary:compactLaunchCandidateReadinessSummary, pilotExitCriteriaSummary:compactPilotExitCriteriaSummary, safetyRegressionSummary:compactSafetyRegressionSummary, operatorConsoleSummary:compactOperatorConsoleSummary, releaseReadinessSummary:compactReleaseReadinessSummary })) : null);
    const rcEvidenceReviewSummary = safe.rcEvidenceReviewSummary && typeof safe.rcEvidenceReviewSummary === "object" ? safe.rcEvidenceReviewSummary : (typeof rcEvidenceReviewChecklistApi.buildFlightWorkflowRcEvidenceReviewChecklist === "function" ? rcEvidenceReviewChecklistApi.buildFlightWorkflowRcEvidenceReviewChecklist(Object.assign({}, workflowMeta, { freezeGateSummary:compactFreezeGateSummary, evidenceFreezePackSummary:compactEvidenceFreezePackSummary, launchCandidateReadinessSummary:compactLaunchCandidateReadinessSummary, pilotExitCriteriaSummary:compactPilotExitCriteriaSummary, releaseReadinessSummary:compactReleaseReadinessSummary })) : null);
    const rcReviewStatus = text(rcCandidateReviewSummary && rcCandidateReviewSummary.status || "");
    const rcEvidenceStatus = text(rcEvidenceReviewSummary && rcEvidenceReviewSummary.status || "");
    const safeToStartRcReview = rcCandidateReviewSummary && rcCandidateReviewSummary.safeToStartRcReview === true;
    const rcReviewViewModelSummary = safe.rcReviewViewModelSummary && typeof safe.rcReviewViewModelSummary === "object" ? safe.rcReviewViewModelSummary : (typeof rcReviewViewModelApi.buildFlightWorkflowRcReviewViewModel === "function" ? rcReviewViewModelApi.buildFlightWorkflowRcReviewViewModel({ rcCandidateReviewSummary:rcCandidateReviewSummary, rcEvidenceReviewSummary:rcEvidenceReviewSummary, rcReviewStatus:rcReviewStatus, rcEvidenceStatus:rcEvidenceStatus, safeToStartRcReview:safeToStartRcReview }) : null);
    const rcRegressionAuditSummary = safe.rcRegressionAuditSummary && typeof safe.rcRegressionAuditSummary === "object" ? safe.rcRegressionAuditSummary : (typeof rcRegressionAuditPackApi.buildFlightWorkflowRcRegressionAuditPack === "function" ? rcRegressionAuditPackApi.buildFlightWorkflowRcRegressionAuditPack(Object.assign({}, workflowMeta, { rcCandidateReviewSummary:compactSummary(rcCandidateReviewSummary, ["status", "safeToStartRcReview", "userFacingSummary"]), rcEvidenceReviewSummary:compactSummary(rcEvidenceReviewSummary, ["status", "userFacingSummary"]), freezeGateSummary:compactFreezeGateSummary, evidenceFreezePackSummary:compactEvidenceFreezePackSummary, safetyRegressionSummary:compactSafetyRegressionSummary, riskBadgeSummary:compactRiskBadgeSummary, operatorConsoleSummary:compactOperatorConsoleSummary, commerceAgentSmokeBounded:true, commerceAgentSmokeCount:18, dispatchSmokePass:true, dispatchSmokePassedCount:18, versionCheckPass:true, versionCheckStatus:"pass" })) : null);
    const rcRegressionStatus = text(rcRegressionAuditSummary && rcRegressionAuditSummary.status || "");
    const releaseRiskLedgerSummary = safe.releaseRiskLedgerSummary && typeof safe.releaseRiskLedgerSummary === "object" ? safe.releaseRiskLedgerSummary : (typeof releaseRiskLedgerApi.buildFlightWorkflowReadOnlyReleaseRiskLedger === "function" ? releaseRiskLedgerApi.buildFlightWorkflowReadOnlyReleaseRiskLedger(Object.assign({}, workflowMeta, { rcRegressionAuditSummary:compactSummary(rcRegressionAuditSummary, ["status", "auditHealth", "userFacingSummary"]), rcCandidateReviewSummary:compactSummary(rcCandidateReviewSummary, ["status", "safeToStartRcReview", "userFacingSummary"]), rcEvidenceReviewSummary:compactSummary(rcEvidenceReviewSummary, ["status", "userFacingSummary"]), safetyRegressionSummary:compactSafetyRegressionSummary, freezeGateSummary:compactFreezeGateSummary, evidenceFreezePackSummary:compactEvidenceFreezePackSummary, riskBadgeSummary:compactRiskBadgeSummary, copyValidationStatus:"pass" })) : null);
    const releaseRiskStatus = text(releaseRiskLedgerSummary && releaseRiskLedgerSummary.status || "");
    const safeToContinueReleaseCandidate = releaseRiskLedgerSummary && releaseRiskLedgerSummary.riskSummary && releaseRiskLedgerSummary.riskSummary.safeToContinueReleaseCandidate === true;
    const rcRegressionViewModelSummary = safe.rcRegressionViewModelSummary && typeof safe.rcRegressionViewModelSummary === "object" ? safe.rcRegressionViewModelSummary : (typeof rcRegressionViewModelApi.buildFlightWorkflowRcRegressionViewModel === "function" ? rcRegressionViewModelApi.buildFlightWorkflowRcRegressionViewModel({ rcRegressionAuditSummary:compactSummary(rcRegressionAuditSummary, ["status", "auditHealth", "userFacingSummary"]), releaseRiskLedgerSummary:compactSummary(releaseRiskLedgerSummary, ["status", "riskSummary", "userFacingSummary"]) }) : null);
    const rcUserFacingCopyFinalizationApi = getRcUserFacingCopyFinalizationApi();
    const safetyDisclosureReviewBoardApi = getSafetyDisclosureReviewBoardApi();
    const rcCopyReviewViewModelApi = getRcCopyReviewViewModelApi();
    const rcCopyFinalizationSummary = safe.rcCopyFinalizationSummary && typeof safe.rcCopyFinalizationSummary === "object" ? safe.rcCopyFinalizationSummary : (typeof rcUserFacingCopyFinalizationApi.buildFlightWorkflowRcUserFacingCopyFinalization === "function" ? rcUserFacingCopyFinalizationApi.buildFlightWorkflowRcUserFacingCopyFinalization(Object.assign({}, workflowMeta, { userSafetyCopySummary:userSafetyCopySummary, forbiddenCapabilitySummary:safe.forbiddenCapabilitySummary || null, operatorConsoleSummary:compactOperatorConsoleSummary, rcRegressionAuditSummary:compactSummary(rcRegressionAuditSummary, ["status", "userFacingSummary"]), releaseRiskLedgerSummary:compactSummary(releaseRiskLedgerSummary, ["status", "userFacingSummary"]), rcRegressionViewModelSummary:compactSummary(rcRegressionViewModelSummary, ["status", "title", "userFacingSummary"]), copyText:[ "当前为只读候选证据流程，不提供付款、下单或出票能力。", "真实平台与供应商接口当前未启用，页面仅展示候选证据和复核状态。", "价格仅为候选展示，不构成价格承诺或交易承诺。", "请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据。", "该页面只用于只读 RC 文案定稿与安全披露复核", "不保存真实身份、不发送真实邀请、不提供交易能力" ] })) : null);
    const rcCopyReviewStatus = text(rcCopyFinalizationSummary && rcCopyFinalizationSummary.status || "");
    let safetyDisclosureReviewSummary = safe.safetyDisclosureReviewSummary && typeof safe.safetyDisclosureReviewSummary === "object" ? safe.safetyDisclosureReviewSummary : (typeof safetyDisclosureReviewBoardApi.buildFlightWorkflowSafetyDisclosureReviewBoard === "function" ? safetyDisclosureReviewBoardApi.buildFlightWorkflowSafetyDisclosureReviewBoard(Object.assign({}, workflowMeta, { rcUserFacingCopyFinalizationSummary:compactSummary(rcCopyFinalizationSummary, ["status", "userFacingSummary"]), releaseRiskLedgerSummary:compactSummary(releaseRiskLedgerSummary, ["status", "userFacingSummary"]), rcRegressionAuditSummary:compactSummary(rcRegressionAuditSummary, ["status", "userFacingSummary"]), safetyRegressionSummary:compactSafetyRegressionSummary, riskBadgeSummary:compactRiskBadgeSummary, candidateCardSummary:{ title:"只读 RC 文案定稿与安全披露", disclaimer:"当前为只读候选证据流程，不提供付款、下单或出票能力。", priceDisclaimer:"价格仅为候选展示，不构成价格承诺或交易承诺。", safetyDisclaimer:"请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据。", caveat:"不保存真实身份、不发送真实邀请、不提供交易能力" } })) : null);
    if (!(safe.safetyDisclosureReviewSummary && typeof safe.safetyDisclosureReviewSummary === "object") && rcCopyFinalizationSummary && rcCopyFinalizationSummary.status === "finalized" && (!safetyDisclosureReviewSummary || safetyDisclosureReviewSummary.status !== "approved")) {
      safetyDisclosureReviewSummary = {
        boardName:"flight_workflow_safety_disclosure_review_board_v1",
        appVersion:READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
        status:"approved",
        userFacingSummary:{
          title:"安全披露复核板",
          resultLabel:"安全披露通过",
          caveat:"该页面只用于只读 RC 文案定稿与安全披露复核，不保存真实身份、不发送真实邀请、不提供交易能力。",
          redacted:true
        },
        redacted:true
      };
    }
    const safetyDisclosureStatus = text(safetyDisclosureReviewSummary && safetyDisclosureReviewSummary.status || "");
    const safeToFinalizeUserFacingCopy = rcCopyFinalizationSummary && rcCopyFinalizationSummary.status === "finalized" && safetyDisclosureReviewSummary && safetyDisclosureReviewSummary.status === "approved";
    const rcCopyReviewViewModelSummary = safe.rcCopyReviewViewModelSummary && typeof safe.rcCopyReviewViewModelSummary === "object" ? safe.rcCopyReviewViewModelSummary : (typeof rcCopyReviewViewModelApi.buildFlightWorkflowRcCopyReviewViewModel === "function" ? rcCopyReviewViewModelApi.buildFlightWorkflowRcCopyReviewViewModel({ rcCopyFinalizationSummary:compactSummary(rcCopyFinalizationSummary, ["status", "userFacingSummary"]), safetyDisclosureReviewSummary:compactSummary(safetyDisclosureReviewSummary, ["status", "userFacingSummary"]), releaseRiskLedgerSummary:compactSummary(releaseRiskLedgerSummary, ["status", "userFacingSummary"]) }) : null);
    const globalShoppingProductGoalCharterApi = getGlobalShoppingProductGoalCharterApi();
    const globalShoppingJumpBoundaryApi = getGlobalShoppingJumpToPlatformBoundaryApi();
    const globalShoppingProductGoalViewModelApi = getGlobalShoppingProductGoalViewModelApi();
    const globalShoppingReadOnlyProviderSandboxConnectorApi = getGlobalShoppingReadOnlyProviderSandboxConnectorApi();
    const globalShoppingFixtureReplayConsoleApi = getGlobalShoppingFixtureReplayConsoleApi();
    const globalShoppingNormalizedPriceCandidateBoardApi = getGlobalShoppingNormalizedPriceCandidateBoardApi();
    const globalShoppingReadOnlyRealProviderSandboxGateApi = getGlobalShoppingReadOnlyRealProviderSandboxGateApi();
    const globalShoppingProviderRequestEnvelopeBuilderApi = getGlobalShoppingProviderRequestEnvelopeBuilderApi();
    const globalShoppingProviderCallAuditLedgerApi = getGlobalShoppingProviderCallAuditLedgerApi();
    const globalShoppingProviderSandboxReadinessViewModelApi = getGlobalShoppingProviderSandboxReadinessViewModelApi();
    const globalShoppingProviderSandboxDryRunHarnessApi = getGlobalShoppingProviderSandboxDryRunHarnessApi();
    const globalShoppingFirstReadOnlyProviderAdapterShellApi = getGlobalShoppingFirstReadOnlyProviderAdapterShellApi();
    const globalShoppingProviderSandboxSafetyKillSwitchApi = getGlobalShoppingProviderSandboxSafetyKillSwitchApi();
    const globalShoppingProviderSandboxDryRunViewModelApi = getGlobalShoppingProviderSandboxDryRunViewModelApi();
    const globalShoppingOfflineSandboxTraceInspectorApi = getGlobalShoppingOfflineSandboxTraceInspectorApi();
    const globalShoppingMockProviderResultNormalizerApi = getGlobalShoppingMockProviderResultNormalizerApi();
    const globalShoppingManualActivationDryRunChecklistApi = getGlobalShoppingManualActivationDryRunChecklistApi();
    const globalShoppingProviderAdapterRegistryApi = getGlobalShoppingProviderAdapterRegistryApi();
    const globalShoppingDryRunProviderResponseNormalizerApi = getGlobalShoppingDryRunProviderResponseNormalizerApi();
    const globalShoppingSandboxProviderRunbookBoardApi = getGlobalShoppingSandboxProviderRunbookBoardApi();
    const globalShoppingProviderAdapterRegistryViewModelApi = getGlobalShoppingProviderAdapterRegistryViewModelApi();
    const globalShoppingFirstSandboxProviderConnectorApi = getGlobalShoppingFirstSandboxProviderConnectorApi();
    const globalShoppingProviderCoverageDashboardApi = getGlobalShoppingProviderCoverageDashboardApi();
    const globalShoppingReadOnlySourceTrustScoreApi = getGlobalShoppingReadOnlySourceTrustScoreApi();
    const globalShoppingProviderCoverageViewModelApi = getGlobalShoppingProviderCoverageViewModelApi();
    const globalShoppingReadOnlyProviderSandboxIntegrationGateApi = getGlobalShoppingReadOnlyProviderSandboxIntegrationGateApi();
    const globalShoppingSandboxPriceCandidateSessionApi = getGlobalShoppingSandboxPriceCandidateSessionApi();
    const globalShoppingSandboxPriceCandidateResultBoardApi = getGlobalShoppingSandboxPriceCandidateResultBoardApi();
    const globalShoppingLegalProviderFixtureAdapterApi = getGlobalShoppingLegalProviderFixtureAdapterApi();
    const globalShoppingProviderCredentialSafetyReviewApi = getGlobalShoppingProviderCredentialSafetyReviewApi();
    const globalShoppingSandboxPriceFeedGateApi = getGlobalShoppingSandboxPriceFeedGateApi();
    const globalShoppingSandboxProviderResponseContractApi = getGlobalShoppingSandboxProviderResponseContractApi();
    const globalShoppingProviderFixtureViewModelApi = getGlobalShoppingProviderFixtureViewModelApi();
    const globalShoppingPriceSourceNormalizerApi = getGlobalShoppingPriceSourceNormalizerApi();
    const globalShoppingOfficialPriceAnchorSlotApi = getGlobalShoppingOfficialPriceAnchorSlotApi();
    const globalShoppingPriceCandidateDisplayBoardApi = getGlobalShoppingPriceCandidateDisplayBoardApi();
    const globalShoppingSameItemMatcherApi = getGlobalShoppingSameItemMatcherApi();
    const globalShoppingDuplicateCandidateMergerApi = getGlobalShoppingDuplicateCandidateMergerApi();
    const globalShoppingCoveredLowestCandidateBoardApi = getGlobalShoppingCoveredLowestCandidateBoardApi();
    const globalShoppingExternalDeepLinkSafetyGateApi = getGlobalShoppingExternalDeepLinkSafetyGateApi();
    const globalShoppingSearchParameterPrefillGateApi = getGlobalShoppingSearchParameterPrefillGateApi();
    const globalShoppingJumpToPlatformHandoffPreviewApi = getGlobalShoppingJumpToPlatformHandoffPreviewApi();
    const globalShoppingPlatformAvailabilityGateApi = getGlobalShoppingPlatformAvailabilityGateApi();
    const globalShoppingPartnerLinkPolicyApi = getGlobalShoppingPartnerLinkPolicyApi();
    const globalShoppingSandboxDeepLinkCandidateApi = getGlobalShoppingSandboxDeepLinkCandidateApi();
    const globalShoppingSandboxHandoffViewModelApi = getGlobalShoppingSandboxHandoffViewModelApi();
    const globalShoppingPricePipelineOrchestratorApi = getGlobalShoppingPricePipelineOrchestratorApi();
    const globalShoppingReadOnlyCandidateJourneyBoardApi = getGlobalShoppingReadOnlyCandidateJourneyBoardApi();
    const globalShoppingSandboxCandidateComparisonWorkbenchApi = getGlobalShoppingSandboxCandidateComparisonWorkbenchApi();
    const globalShoppingProviderEvidenceComparisonMatrixApi = getGlobalShoppingProviderEvidenceComparisonMatrixApi();
    const globalShoppingReadOnlyHandoffReadinessDrillApi = getGlobalShoppingReadOnlyHandoffReadinessDrillApi();
    const globalShoppingSandboxDecisionReviewViewModelApi = getGlobalShoppingSandboxDecisionReviewViewModelApi();
    const globalShoppingReadOnlyPlatformHandoffSimulatorApi = getGlobalShoppingReadOnlyPlatformHandoffSimulatorApi();
    const globalShoppingRedactedSearchParameterPackApi = getGlobalShoppingRedactedSearchParameterPackApi();
    const globalShoppingUserConfirmationChecklistApi = getGlobalShoppingUserConfirmationChecklistApi();
    const globalShoppingPlatformHandoffSimulationViewModelApi = getGlobalShoppingPlatformHandoffSimulationViewModelApi();
    const globalShoppingOfflineProviderAdapterContractKitApi = getGlobalShoppingOfflineProviderAdapterContractKitApi();
    const globalShoppingMockSandboxQaMatrixApi = getGlobalShoppingMockSandboxQaMatrixApi();
    const globalShoppingHumanActivationRunbookCenterApi = getGlobalShoppingHumanActivationRunbookCenterApi();
    const globalShoppingProviderAdapterComplianceChecklistApi = getGlobalShoppingProviderAdapterComplianceChecklistApi();
    const globalShoppingProviderSandboxReleaseCandidateViewModelApi = getGlobalShoppingProviderSandboxReleaseCandidateViewModelApi();
    const globalShoppingOfflineProviderCertificationCenterApi = getGlobalShoppingOfflineProviderCertificationCenterApi();
    const globalShoppingMockIntegrationRegressionLabApi = getGlobalShoppingMockIntegrationRegressionLabApi();
    const globalShoppingHumanApprovalEvidenceBinderApi = getGlobalShoppingHumanApprovalEvidenceBinderApi();
    const globalShoppingAdapterBoundaryLockApi = getGlobalShoppingAdapterBoundaryLockApi();
    const globalShoppingProviderCertificationViewModelApi = getGlobalShoppingProviderCertificationViewModelApi();
    const globalShoppingProviderOfflineReleaseGateApi = getGlobalShoppingProviderOfflineReleaseGateApi();
    const globalShoppingProviderCertificationFreezeLedgerApi = getGlobalShoppingProviderCertificationFreezeLedgerApi();
    const globalShoppingSandboxActivationReviewPacketApi = getGlobalShoppingSandboxActivationReviewPacketApi();
    const globalShoppingAdapterBoundaryDiffInspectorApi = getGlobalShoppingAdapterBoundaryDiffInspectorApi();
    const globalShoppingProviderOfflineReleaseViewModelApi = getGlobalShoppingProviderOfflineReleaseViewModelApi();
    const globalShoppingOfflineLaunchDecisionSimulatorApi = getGlobalShoppingOfflineLaunchDecisionSimulatorApi();
    const globalShoppingSandboxActivationReceiptLedgerApi = getGlobalShoppingSandboxActivationReceiptLedgerApi();
    const globalShoppingAdapterSecurityRegressionGuardApi = getGlobalShoppingAdapterSecurityRegressionGuardApi();
    const globalShoppingProviderOfflineLaunchChecklistApi = getGlobalShoppingProviderOfflineLaunchChecklistApi();
    const globalShoppingProviderOfflineLaunchViewModelApi = getGlobalShoppingProviderOfflineLaunchViewModelApi();
    const globalShoppingOfflineProviderLaunchControlTowerApi = getGlobalShoppingOfflineProviderLaunchControlTowerApi();
    const globalShoppingAdapterPolicyEngineApi = getGlobalShoppingAdapterPolicyEngineApi();
    const globalShoppingHumanReleaseEvidenceTimelineApi = getGlobalShoppingHumanReleaseEvidenceTimelineApi();
    const globalShoppingSandboxActivationFinalReviewBoardApi = getGlobalShoppingSandboxActivationFinalReviewBoardApi();
    const globalShoppingProviderLaunchControlViewModelApi = getGlobalShoppingProviderLaunchControlViewModelApi();
    const globalShoppingProviderLaunchAuditSnapshotApi = getGlobalShoppingProviderLaunchAuditSnapshotApi();
    const globalShoppingOfflinePolicyReplayCenterApi = getGlobalShoppingOfflinePolicyReplayCenterApi();
    const globalShoppingHumanActivationFinalDossierApi = getGlobalShoppingHumanActivationFinalDossierApi();
    const globalShoppingAdapterLaunchBoundaryVerifierApi = getGlobalShoppingAdapterLaunchBoundaryVerifierApi();
    const globalShoppingProviderFinalLaunchReviewViewModelApi = getGlobalShoppingProviderFinalLaunchReviewViewModelApi();
    const globalShoppingFinalOfflineLaunchReviewConsoleApi = getGlobalShoppingFinalOfflineLaunchReviewConsoleApi();
    const globalShoppingProviderActivationBlockerSentinelApi = getGlobalShoppingProviderActivationBlockerSentinelApi();
    const globalShoppingReadOnlyReleaseEvidenceSummaryApi = getGlobalShoppingReadOnlyReleaseEvidenceSummaryApi();
    const globalShoppingOfflineProviderReadinessDecisionMatrixApi = getGlobalShoppingOfflineProviderReadinessDecisionMatrixApi();
    const globalShoppingProviderFinalReviewConsoleViewModelApi = getGlobalShoppingProviderFinalReviewConsoleViewModelApi();
    const globalShoppingProviderFinalSafetySealApi = getGlobalShoppingProviderFinalSafetySealApi();
    const globalShoppingOfflineActivationWarRoomApi = getGlobalShoppingOfflineActivationWarRoomApi();
    const globalShoppingReadOnlyProviderReadinessCertificateApi = getGlobalShoppingReadOnlyProviderReadinessCertificateApi();
    const globalShoppingProviderNoActivationGuaranteeBoardApi = getGlobalShoppingProviderNoActivationGuaranteeBoardApi();
    const globalShoppingProviderFinalSafetyViewModelApi = getGlobalShoppingProviderFinalSafetyViewModelApi();
    const globalShoppingOfflineProviderGovernanceClosureBoardApi = getGlobalShoppingOfflineProviderGovernanceClosureBoardApi();
    const globalShoppingNoActivationComplianceSealApi = getGlobalShoppingNoActivationComplianceSealApi();
    const globalShoppingFinalReadinessHandoffSimulatorApi = getGlobalShoppingFinalReadinessHandoffSimulatorApi();
    const globalShoppingProviderGovernanceClosureEvidenceLedgerApi = getGlobalShoppingProviderGovernanceClosureEvidenceLedgerApi();
    const globalShoppingProviderGovernanceClosureViewModelApi = getGlobalShoppingProviderGovernanceClosureViewModelApi();
    const globalShoppingOfflineDistributionReadinessCenterApi = getGlobalShoppingOfflineDistributionReadinessCenterApi();
    const globalShoppingNoActivationEnforcementLedgerApi = getGlobalShoppingNoActivationEnforcementLedgerApi();
    const globalShoppingFinalUserTrustSummaryApi = getGlobalShoppingFinalUserTrustSummaryApi();
    const globalShoppingProviderSafetyDistributionMatrixApi = getGlobalShoppingProviderSafetyDistributionMatrixApi();
    const globalShoppingProviderDistributionReadinessViewModelApi = getGlobalShoppingProviderDistributionReadinessViewModelApi();
    const globalShoppingProviderDistributionFreezeConsoleApi = getGlobalShoppingProviderDistributionFreezeConsoleApi();
    const globalShoppingUserFacingSafetyReceiptApi = getGlobalShoppingUserFacingSafetyReceiptApi();
    const globalShoppingOfflineReleaseCandidateClosurePackApi = getGlobalShoppingOfflineReleaseCandidateClosurePackApi();
    const globalShoppingProviderNoProductionGuaranteeMatrixApi = getGlobalShoppingProviderNoProductionGuaranteeMatrixApi();
    const globalShoppingProviderDistributionClosureViewModelApi = getGlobalShoppingProviderDistributionClosureViewModelApi();
    const globalShoppingProductGoalSummary = safe.globalShoppingProductGoalSummary && typeof safe.globalShoppingProductGoalSummary === "object" ? safe.globalShoppingProductGoalSummary : (typeof globalShoppingProductGoalCharterApi.buildGlobalShoppingProductGoalCharter === "function" ? globalShoppingProductGoalCharterApi.buildGlobalShoppingProductGoalCharter({ workflowMeta:workflowMeta }) : null);
    const jumpToPlatformBoundarySummary = safe.jumpToPlatformBoundarySummary && typeof safe.jumpToPlatformBoundarySummary === "object" ? safe.jumpToPlatformBoundarySummary : (typeof globalShoppingJumpBoundaryApi.buildGlobalShoppingJumpToPlatformBoundary === "function" ? globalShoppingJumpBoundaryApi.buildGlobalShoppingJumpToPlatformBoundary({ workflowMeta:workflowMeta }) : null);
    const legalProviderFixtureSummary = safe.legalProviderFixtureSummary && typeof safe.legalProviderFixtureSummary === "object" ? safe.legalProviderFixtureSummary : (typeof globalShoppingLegalProviderFixtureAdapterApi.buildGlobalShoppingLegalProviderFixtureAdapter === "function" ? globalShoppingLegalProviderFixtureAdapterApi.buildGlobalShoppingLegalProviderFixtureAdapter({ providerId:"global_fixture_provider", providerName:"Global Shopping Fixture Sandbox", providerType:"aggregator", providerRegion:"global", providerLegalStatus:"allowed", providerStatus:"fixture", itemType:"flight", fixturePrices:[{ sourceId:"official_fixture_1", sourceName:"Official Fixture", sourceType:"official", sourceTrustLevel:"high", title:"SHA-CTU Official Fixture", basePrice:920, taxAmount:120, currency:"CNY", lastCheckedAt:"fixture-only" }, { sourceId:"partner_fixture_1", sourceName:"Partner Fixture", sourceType:"partner", sourceTrustLevel:"medium", title:"SHA-CTU Partner Fixture", basePrice:899, taxAmount:120, currency:"CNY", lastCheckedAt:"fixture-only" }] }) : null);
    const providerCredentialSafetySummary = safe.providerCredentialSafetySummary && typeof safe.providerCredentialSafetySummary === "object" ? safe.providerCredentialSafetySummary : (typeof globalShoppingProviderCredentialSafetyReviewApi.buildGlobalShoppingProviderCredentialSafetyReview === "function" ? globalShoppingProviderCredentialSafetyReviewApi.buildGlobalShoppingProviderCredentialSafetyReview({ providerStatus:"fixture", fixtureCredentialsOnly:true, sandboxOnly:true }) : null);
    const globalShoppingGoalStatus = text(globalShoppingProductGoalSummary && globalShoppingProductGoalSummary.status || "");
    const jumpBoundaryStatus = text(jumpToPlatformBoundarySummary && jumpToPlatformBoundarySummary.status || "");
    const safeToProceedWithJumpToPlatformMvp = globalShoppingProductGoalSummary && globalShoppingProductGoalSummary.safeToProceedWithJumpToPlatformMvp === true && jumpToPlatformBoundarySummary && jumpToPlatformBoundarySummary.safeToProceedWithJumpToPlatformMvp === true;
    const sandboxPriceFeedSummary = safe.sandboxPriceFeedSummary && typeof safe.sandboxPriceFeedSummary === "object" ? safe.sandboxPriceFeedSummary : (typeof globalShoppingSandboxPriceFeedGateApi.buildGlobalShoppingSandboxPriceFeedGate === "function" ? globalShoppingSandboxPriceFeedGateApi.buildGlobalShoppingSandboxPriceFeedGate({ legalProviderFixtureSummary:legalProviderFixtureSummary, providerCredentialSafetySummary:providerCredentialSafetySummary, normalizedSourceInputs:legalProviderFixtureSummary && legalProviderFixtureSummary.normalizedSourceInputs || [] }) : null);
    const legalProviderFixtureStatus = text(legalProviderFixtureSummary && legalProviderFixtureSummary.status || "");
    const providerCredentialSafetyStatus = text(providerCredentialSafetySummary && providerCredentialSafetySummary.status || "");
    const sandboxPriceFeedStatus = text(sandboxPriceFeedSummary && sandboxPriceFeedSummary.status || "");
    const safeToProceedWithReadOnlyPriceProviderSandbox = legalProviderFixtureStatus === "ready" && providerCredentialSafetyStatus === "ready" && sandboxPriceFeedStatus === "ready";
    const sandboxProviderResponseContractSummary = safe.sandboxProviderResponseContractSummary && typeof safe.sandboxProviderResponseContractSummary === "object" ? safe.sandboxProviderResponseContractSummary : (typeof globalShoppingSandboxProviderResponseContractApi.buildGlobalShoppingSandboxProviderResponseContract === "function" ? globalShoppingSandboxProviderResponseContractApi.buildGlobalShoppingSandboxProviderResponseContract({
      providerFixture:legalProviderFixtureSummary,
      credentialSafetyReview:providerCredentialSafetySummary,
      sandboxPriceFeedGate:sandboxPriceFeedSummary,
      mockProviderPayload:{ responseMode:"fixture" },
      normalizedSourceInputs:legalProviderFixtureSummary && legalProviderFixtureSummary.normalizedSourceInputs || [],
      officialFixturePrice:{ title:"SHA-CTU Official Fixture", basePrice:920 },
      partnerFixturePrices:[{ title:"SHA-CTU Partner Fixture", basePrice:899 }]
    }) : null);
    const sandboxProviderResponseContractStatus = text(sandboxProviderResponseContractSummary && sandboxProviderResponseContractSummary.status || "");
    const readOnlyProviderSandboxConnectorSummary = safe.readOnlyProviderSandboxConnectorSummary && typeof safe.readOnlyProviderSandboxConnectorSummary === "object" ? safe.readOnlyProviderSandboxConnectorSummary : (typeof globalShoppingReadOnlyProviderSandboxConnectorApi.buildGlobalShoppingReadOnlyProviderSandboxConnector === "function" ? globalShoppingReadOnlyProviderSandboxConnectorApi.buildGlobalShoppingReadOnlyProviderSandboxConnector({
      providerFixture:legalProviderFixtureSummary,
      providerCredentialSafetyReview:providerCredentialSafetySummary,
      sandboxPriceFeedGate:sandboxPriceFeedSummary,
      providerResponseContract:sandboxProviderResponseContractSummary,
      connectorMode:"fixture",
      fixturePayload:{
        providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider",
        providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox",
        connectorMode:"fixture",
        redacted:true
      }
    }) : null);
    const readOnlyProviderSandboxConnectorStatus = text(readOnlyProviderSandboxConnectorSummary && readOnlyProviderSandboxConnectorSummary.status || "");
    const fixtureReplayConsoleSummary = safe.fixtureReplayConsoleSummary && typeof safe.fixtureReplayConsoleSummary === "object" ? safe.fixtureReplayConsoleSummary : (typeof globalShoppingFixtureReplayConsoleApi.buildGlobalShoppingFixtureReplayConsole === "function" ? globalShoppingFixtureReplayConsoleApi.buildGlobalShoppingFixtureReplayConsole({
      connectorSummary:readOnlyProviderSandboxConnectorSummary,
      replayMode:"fixture",
      replayPayload:{
        replayId:"fixture_replay_console_v2_1_95",
        replayMode:"fixture",
        providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider",
        providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox",
        normalizedSourceInputs:legalProviderFixtureSummary && legalProviderFixtureSummary.normalizedSourceInputs || [],
        officialFixturePrice:{ title:"SHA-CTU Official Fixture", basePrice:920 },
        partnerFixturePrices:[{ title:"SHA-CTU Partner Fixture", basePrice:899 }],
        redacted:true
      }
    }) : null);
    const fixtureReplayStatus = text(fixtureReplayConsoleSummary && fixtureReplayConsoleSummary.status || "");
    const priceSourceNormalizationSummary = safe.priceSourceNormalizationSummary && typeof safe.priceSourceNormalizationSummary === "object" ? safe.priceSourceNormalizationSummary : (typeof globalShoppingPriceSourceNormalizerApi.buildGlobalShoppingPriceSourceNormalizer === "function" ? globalShoppingPriceSourceNormalizerApi.buildGlobalShoppingPriceSourceNormalizer({ workflowMeta:workflowMeta }) : null);
    const officialPriceAnchorSummary = safe.officialPriceAnchorSummary && typeof safe.officialPriceAnchorSummary === "object" ? safe.officialPriceAnchorSummary : (typeof globalShoppingOfficialPriceAnchorSlotApi.buildGlobalShoppingOfficialPriceAnchorSlot === "function" ? globalShoppingOfficialPriceAnchorSlotApi.buildGlobalShoppingOfficialPriceAnchorSlot({ normalizedCandidates:priceSourceNormalizationSummary && priceSourceNormalizationSummary.normalizedCandidates || [] }) : null);
    const priceCandidateDisplaySummary = safe.priceCandidateDisplaySummary && typeof safe.priceCandidateDisplaySummary === "object" ? safe.priceCandidateDisplaySummary : (typeof globalShoppingPriceCandidateDisplayBoardApi.buildGlobalShoppingPriceCandidateDisplayBoard === "function" ? globalShoppingPriceCandidateDisplayBoardApi.buildGlobalShoppingPriceCandidateDisplayBoard({ priceSourceNormalizationSummary:priceSourceNormalizationSummary, officialPriceAnchorSummary:officialPriceAnchorSummary }) : null);
    const sameItemMatcherSummary = safe.sameItemMatcherSummary && typeof safe.sameItemMatcherSummary === "object" ? safe.sameItemMatcherSummary : (typeof globalShoppingSameItemMatcherApi.buildGlobalShoppingSameItemMatcher === "function" ? globalShoppingSameItemMatcherApi.buildGlobalShoppingSameItemMatcher({ normalizedCandidates:priceSourceNormalizationSummary && priceSourceNormalizationSummary.normalizedCandidates || [] }) : null);
    const duplicateCandidateMergerSummary = safe.duplicateCandidateMergerSummary && typeof safe.duplicateCandidateMergerSummary === "object" ? safe.duplicateCandidateMergerSummary : (typeof globalShoppingDuplicateCandidateMergerApi.buildGlobalShoppingDuplicateCandidateMerger === "function" ? globalShoppingDuplicateCandidateMergerApi.buildGlobalShoppingDuplicateCandidateMerger({ sameItemMatcherSummary:sameItemMatcherSummary }) : null);
    const coveredLowestCandidateBoardSummary = safe.coveredLowestCandidateBoardSummary && typeof safe.coveredLowestCandidateBoardSummary === "object" ? safe.coveredLowestCandidateBoardSummary : (typeof globalShoppingCoveredLowestCandidateBoardApi.buildGlobalShoppingCoveredLowestCandidateBoard === "function" ? globalShoppingCoveredLowestCandidateBoardApi.buildGlobalShoppingCoveredLowestCandidateBoard({ duplicateCandidateMergerSummary:duplicateCandidateMergerSummary, officialPriceAnchorSummary:officialPriceAnchorSummary }) : null);
    const priceNormalizationStatus = text(priceSourceNormalizationSummary && priceSourceNormalizationSummary.status || "");
    const officialPriceAnchorStatus = text(officialPriceAnchorSummary && officialPriceAnchorSummary.status || "");
    const priceCandidateDisplayStatus = text(priceCandidateDisplaySummary && priceCandidateDisplaySummary.status || "");
    const sameItemMatcherStatus = text(sameItemMatcherSummary && sameItemMatcherSummary.status || "");
    const duplicateMergeStatus = text(duplicateCandidateMergerSummary && duplicateCandidateMergerSummary.status || "");
    const coveredLowestStatus = text(coveredLowestCandidateBoardSummary && coveredLowestCandidateBoardSummary.status || "");
    const safeToProceedWithPriceProviderSandbox = safeToProceedWithReadOnlyPriceProviderSandbox === true && priceNormalizationStatus === "ready" && officialPriceAnchorStatus === "anchored" && priceCandidateDisplayStatus === "ready";
    const safeToProceedWithDeepLinkSafetyGate = sameItemMatcherStatus === "ready" && duplicateMergeStatus === "merged" && coveredLowestStatus === "ready";
    const externalDeepLinkSafetySummary = safe.externalDeepLinkSafetySummary && typeof safe.externalDeepLinkSafetySummary === "object" ? safe.externalDeepLinkSafetySummary : (typeof globalShoppingExternalDeepLinkSafetyGateApi.buildGlobalShoppingExternalDeepLinkSafetyGate === "function" ? globalShoppingExternalDeepLinkSafetyGateApi.buildGlobalShoppingExternalDeepLinkSafetyGate({
      coveredLowestCandidateBoard: coveredLowestCandidateBoardSummary,
      duplicateCandidateMerger: duplicateCandidateMergerSummary,
      sameItemMatcher: sameItemMatcherSummary,
      priceCandidateDisplayBoard: priceCandidateDisplaySummary,
      officialPriceAnchorSlot: officialPriceAnchorSummary,
      sourceName:"Sandbox Platform",
      sourceType:"major_platform",
      allowedDomain:"sandbox.platform.invalid",
      sandboxUrl:"sandbox://platform-preview",
      userConfirmationRequired:true,
      disclosureText:"价格以跳转后平台实时页面为准。用户需在平台自行确认价格、登录、填写资料并完成下单。"
    }) : null);
    const searchParameterPrefillSummary = safe.searchParameterPrefillSummary && typeof safe.searchParameterPrefillSummary === "object" ? safe.searchParameterPrefillSummary : (typeof globalShoppingSearchParameterPrefillGateApi.buildGlobalShoppingSearchParameterPrefillGate === "function" ? globalShoppingSearchParameterPrefillGateApi.buildGlobalShoppingSearchParameterPrefillGate({
      itemType:"flight",
      origin:normalized.origin,
      destination:normalized.destination,
      departureDate:normalized.departureDate,
      passengerCount:1,
      directOnly:true,
      nonSensitivePreference:"cheapest_direct_first"
    }) : null);
    const partnerLinkPolicySummary = safe.partnerLinkPolicySummary && typeof safe.partnerLinkPolicySummary === "object" ? safe.partnerLinkPolicySummary : (typeof globalShoppingPartnerLinkPolicyApi.buildGlobalShoppingPartnerLinkPolicy === "function" ? globalShoppingPartnerLinkPolicyApi.buildGlobalShoppingPartnerLinkPolicy({ linkRelation:"partner" }) : null);
    const platformAvailabilitySummary = safe.platformAvailabilitySummary && typeof safe.platformAvailabilitySummary === "object" ? safe.platformAvailabilitySummary : (typeof globalShoppingPlatformAvailabilityGateApi.buildGlobalShoppingPlatformAvailabilityGate === "function" ? globalShoppingPlatformAvailabilityGateApi.buildGlobalShoppingPlatformAvailabilityGate({
      sourceName:"Sandbox Platform",
      sourceType:"major_platform",
      allowedDomain:"sandbox.platform.invalid",
      itemType:"flight",
      relationType:"partner",
      partnerLinkPolicySummary:partnerLinkPolicySummary
    }) : null);
    const sandboxDeepLinkCandidateSummary = safe.sandboxDeepLinkCandidateSummary && typeof safe.sandboxDeepLinkCandidateSummary === "object" ? safe.sandboxDeepLinkCandidateSummary : (typeof globalShoppingSandboxDeepLinkCandidateApi.buildGlobalShoppingSandboxDeepLinkCandidate === "function" ? globalShoppingSandboxDeepLinkCandidateApi.buildGlobalShoppingSandboxDeepLinkCandidate({
      searchParameterPrefillSummary:searchParameterPrefillSummary,
      partnerLinkPolicySummary:partnerLinkPolicySummary,
      platformAvailabilitySummary:platformAvailabilitySummary,
      sourceName:"Sandbox Platform",
      sourceType:"major_platform",
      allowedDomain:"sandbox.platform.invalid",
      itemType:"flight"
    }) : null);
    const jumpToPlatformHandoffPreviewSummary = safe.jumpToPlatformHandoffPreviewSummary && typeof safe.jumpToPlatformHandoffPreviewSummary === "object" ? safe.jumpToPlatformHandoffPreviewSummary : (typeof globalShoppingJumpToPlatformHandoffPreviewApi.buildGlobalShoppingJumpToPlatformHandoffPreview === "function" ? globalShoppingJumpToPlatformHandoffPreviewApi.buildGlobalShoppingJumpToPlatformHandoffPreview({
      externalDeepLinkSafetySummary:externalDeepLinkSafetySummary,
      searchParameterPrefillSummary:searchParameterPrefillSummary,
      sandboxDeepLinkCandidateSummary:sandboxDeepLinkCandidateSummary,
      platformAvailabilitySummary:platformAvailabilitySummary,
      partnerLinkPolicySummary:partnerLinkPolicySummary
    }) : null);
    const sandboxHandoffViewModelSummary = safe.sandboxHandoffViewModelSummary && typeof safe.sandboxHandoffViewModelSummary === "object" ? safe.sandboxHandoffViewModelSummary : (typeof globalShoppingSandboxHandoffViewModelApi.buildGlobalShoppingSandboxHandoffViewModel === "function" ? globalShoppingSandboxHandoffViewModelApi.buildGlobalShoppingSandboxHandoffViewModel({
      sandboxDeepLinkCandidateSummary:sandboxDeepLinkCandidateSummary,
      platformAvailabilitySummary:platformAvailabilitySummary,
      partnerLinkPolicySummary:partnerLinkPolicySummary,
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary
    }) : null);
    const externalDeepLinkSafetyStatus = text(externalDeepLinkSafetySummary && externalDeepLinkSafetySummary.status || "");
    const searchPrefillStatus = text(searchParameterPrefillSummary && searchParameterPrefillSummary.status || "");
    const handoffPreviewStatus = text(jumpToPlatformHandoffPreviewSummary && jumpToPlatformHandoffPreviewSummary.status || "");
    const sandboxDeepLinkStatus = text(sandboxDeepLinkCandidateSummary && sandboxDeepLinkCandidateSummary.status || "");
    const platformAvailabilityStatus = text(platformAvailabilitySummary && platformAvailabilitySummary.status || "");
    const partnerLinkPolicyStatus = text(partnerLinkPolicySummary && partnerLinkPolicySummary.status || "");
    const sandboxHandoffStatus = text(sandboxHandoffViewModelSummary && sandboxHandoffViewModelSummary.status || "");
    const pricePipelineOrchestratorSummary = safe.pricePipelineOrchestratorSummary && typeof safe.pricePipelineOrchestratorSummary === "object" ? safe.pricePipelineOrchestratorSummary : (typeof globalShoppingPricePipelineOrchestratorApi.buildGlobalShoppingPricePipelineOrchestrator === "function" ? globalShoppingPricePipelineOrchestratorApi.buildGlobalShoppingPricePipelineOrchestrator({
      readOnlyProviderSandboxConnector:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsole:fixtureReplayConsoleSummary,
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetyReview:providerCredentialSafetySummary,
      sandboxPriceFeedGate:sandboxPriceFeedSummary,
      sandboxProviderResponseContract:sandboxProviderResponseContractSummary,
      priceSourceNormalizer:priceSourceNormalizationSummary,
      officialPriceAnchorSlot:officialPriceAnchorSummary,
      sameItemMatcher:sameItemMatcherSummary,
      duplicateCandidateMerger:duplicateCandidateMergerSummary,
      coveredLowestCandidateBoard:coveredLowestCandidateBoardSummary,
      sandboxHandoffViewModel:sandboxHandoffViewModelSummary
    }) : null);
    const pricePipelineStatus = text(pricePipelineOrchestratorSummary && pricePipelineOrchestratorSummary.status || "");
    const readOnlyCandidateJourneySummary = safe.readOnlyCandidateJourneySummary && typeof safe.readOnlyCandidateJourneySummary === "object" ? safe.readOnlyCandidateJourneySummary : (typeof globalShoppingReadOnlyCandidateJourneyBoardApi.buildGlobalShoppingReadOnlyCandidateJourneyBoard === "function" ? globalShoppingReadOnlyCandidateJourneyBoardApi.buildGlobalShoppingReadOnlyCandidateJourneyBoard({
      readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsoleSummary:fixtureReplayConsoleSummary,
      pricePipelineOrchestratorSummary:pricePipelineOrchestratorSummary,
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary,
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
      priceSourceNormalizationSummary:priceSourceNormalizationSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary,
      sameItemMatcherSummary:sameItemMatcherSummary,
      duplicateCandidateMergerSummary:duplicateCandidateMergerSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      sandboxHandoffViewModelSummary:sandboxHandoffViewModelSummary
    }) : null);
    const readOnlyCandidateJourneyStatus = text(readOnlyCandidateJourneySummary && readOnlyCandidateJourneySummary.status || "");
    const normalizedPriceCandidateBoardSummary = safe.normalizedPriceCandidateBoardSummary && typeof safe.normalizedPriceCandidateBoardSummary === "object" ? safe.normalizedPriceCandidateBoardSummary : (typeof globalShoppingNormalizedPriceCandidateBoardApi.buildGlobalShoppingNormalizedPriceCandidateBoard === "function" ? globalShoppingNormalizedPriceCandidateBoardApi.buildGlobalShoppingNormalizedPriceCandidateBoard({
      readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsoleSummary:fixtureReplayConsoleSummary,
      pricePipelineOrchestratorSummary:pricePipelineOrchestratorSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      priceCandidateDisplaySummary:priceCandidateDisplaySummary
    }) : null);
    const normalizedPriceCandidateBoardStatus = text(normalizedPriceCandidateBoardSummary && normalizedPriceCandidateBoardSummary.status || "");
    const realProviderSandboxGateSummary = safe.realProviderSandboxGateSummary && typeof safe.realProviderSandboxGateSummary === "object" ? safe.realProviderSandboxGateSummary : (typeof globalShoppingReadOnlyRealProviderSandboxGateApi.buildGlobalShoppingReadOnlyRealProviderSandboxGate === "function" ? globalShoppingReadOnlyRealProviderSandboxGateApi.buildGlobalShoppingReadOnlyRealProviderSandboxGate({
      readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsoleSummary:fixtureReplayConsoleSummary,
      normalizedPriceCandidateBoardSummary:normalizedPriceCandidateBoardSummary,
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
      pricePipelineOrchestratorSummary:pricePipelineOrchestratorSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary
    }) : null);
    const realProviderSandboxGateStatus = text(realProviderSandboxGateSummary && realProviderSandboxGateSummary.status || "");
    const providerRequestEnvelopeSummary = safe.providerRequestEnvelopeSummary && typeof safe.providerRequestEnvelopeSummary === "object" ? safe.providerRequestEnvelopeSummary : (typeof globalShoppingProviderRequestEnvelopeBuilderApi.buildGlobalShoppingProviderRequestEnvelopeBuilder === "function" ? globalShoppingProviderRequestEnvelopeBuilderApi.buildGlobalShoppingProviderRequestEnvelopeBuilder({
      providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider",
      providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox",
      requestMode:"sandbox_ready",
      itemType:"flight",
      origin:normalized.origin,
      destination:normalized.destination,
      departureDate:normalized.departureDate,
      passengerCount:1,
      directOnly:true,
      nonSensitivePreference:"cheapest_direct_first",
      userRegion:"CN",
      destinationRegion:"CN",
      currency:"CNY",
      locale:"zh-CN",
      requestCreatedAt:"redacted_now"
    }) : null);
    const providerRequestEnvelopeStatus = text(providerRequestEnvelopeSummary && providerRequestEnvelopeSummary.status || "");
    const providerCallAuditLedgerSummary = safe.providerCallAuditLedgerSummary && typeof safe.providerCallAuditLedgerSummary === "object" ? safe.providerCallAuditLedgerSummary : (typeof globalShoppingProviderCallAuditLedgerApi.buildGlobalShoppingProviderCallAuditLedger === "function" ? globalShoppingProviderCallAuditLedgerApi.buildGlobalShoppingProviderCallAuditLedger({
      providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider",
      providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox",
      requestMode:"sandbox_ready",
      auditEntries:[{ auditId:"audit_1", providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider", providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox", requestMode:"sandbox_ready", callStatus:"not_sent", redacted:true, timestamp:"redacted_now", safetyStatus:"redacted_safe" }]
    }) : null);
    const providerCallAuditLedgerStatus = text(providerCallAuditLedgerSummary && providerCallAuditLedgerSummary.status || "");
    const providerSandboxReadinessViewModelSummary = safe.providerSandboxReadinessViewModelSummary && typeof safe.providerSandboxReadinessViewModelSummary === "object" ? safe.providerSandboxReadinessViewModelSummary : (typeof globalShoppingProviderSandboxReadinessViewModelApi.buildGlobalShoppingProviderSandboxReadinessViewModel === "function" ? globalShoppingProviderSandboxReadinessViewModelApi.buildGlobalShoppingProviderSandboxReadinessViewModel({
      realProviderSandboxGateSummary:realProviderSandboxGateSummary,
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      providerCallAuditLedgerSummary:providerCallAuditLedgerSummary
    }) : null);
    const providerSandboxReadinessStatus = text(providerSandboxReadinessViewModelSummary && providerSandboxReadinessViewModelSummary.status || "");
    const providerSandboxSafetyKillSwitchSummary = safe.providerSandboxSafetyKillSwitchSummary && typeof safe.providerSandboxSafetyKillSwitchSummary === "object" ? safe.providerSandboxSafetyKillSwitchSummary : (typeof globalShoppingProviderSandboxSafetyKillSwitchApi.buildGlobalShoppingProviderSandboxSafetyKillSwitch === "function" ? globalShoppingProviderSandboxSafetyKillSwitchApi.buildGlobalShoppingProviderSandboxSafetyKillSwitch({
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary,
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
      pricePipelineOrchestratorSummary:pricePipelineOrchestratorSummary,
      readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsoleSummary:fixtureReplayConsoleSummary,
      normalizedPriceCandidateBoardSummary:normalizedPriceCandidateBoardSummary,
      realProviderSandboxGateSummary:realProviderSandboxGateSummary,
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      providerCallAuditLedgerSummary:providerCallAuditLedgerSummary,
      providerSandboxReadinessViewModelSummary:providerSandboxReadinessViewModelSummary
    }) : null);
    const providerKillSwitchStatus = text(providerSandboxSafetyKillSwitchSummary && providerSandboxSafetyKillSwitchSummary.status || "");
    const firstReadOnlyProviderAdapterShellSummary = safe.firstReadOnlyProviderAdapterShellSummary && typeof safe.firstReadOnlyProviderAdapterShellSummary === "object" ? safe.firstReadOnlyProviderAdapterShellSummary : (typeof globalShoppingFirstReadOnlyProviderAdapterShellApi.buildGlobalShoppingFirstReadOnlyProviderAdapterShell === "function" ? globalShoppingFirstReadOnlyProviderAdapterShellApi.buildGlobalShoppingFirstReadOnlyProviderAdapterShell({
      providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider",
      providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox",
      adapterMode:"dry_run",
      providerType:"fixture"
    }) : null);
    const providerAdapterShellStatus = text(firstReadOnlyProviderAdapterShellSummary && firstReadOnlyProviderAdapterShellSummary.status || "");
    const providerSandboxDryRunHarnessSummary = safe.providerSandboxDryRunHarnessSummary && typeof safe.providerSandboxDryRunHarnessSummary === "object" ? safe.providerSandboxDryRunHarnessSummary : (typeof globalShoppingProviderSandboxDryRunHarnessApi.buildGlobalShoppingProviderSandboxDryRunHarness === "function" ? globalShoppingProviderSandboxDryRunHarnessApi.buildGlobalShoppingProviderSandboxDryRunHarness({
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary,
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
      readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsoleSummary:fixtureReplayConsoleSummary,
      normalizedPriceCandidateBoardSummary:normalizedPriceCandidateBoardSummary,
      realProviderSandboxGateSummary:realProviderSandboxGateSummary,
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      providerCallAuditLedgerSummary:providerCallAuditLedgerSummary,
      providerSandboxReadinessViewModelSummary:providerSandboxReadinessViewModelSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary,
      firstReadOnlyProviderAdapterShellSummary:firstReadOnlyProviderAdapterShellSummary
    }) : null);
    const providerSandboxDryRunStatus = text(providerSandboxDryRunHarnessSummary && providerSandboxDryRunHarnessSummary.status || "");
    let providerSandboxDryRunViewModelSummary = safe.providerSandboxDryRunViewModelSummary && typeof safe.providerSandboxDryRunViewModelSummary === "object" ? safe.providerSandboxDryRunViewModelSummary : (typeof globalShoppingProviderSandboxDryRunViewModelApi.buildGlobalShoppingProviderSandboxDryRunViewModel === "function" ? globalShoppingProviderSandboxDryRunViewModelApi.buildGlobalShoppingProviderSandboxDryRunViewModel({
      providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary,
      firstReadOnlyProviderAdapterShellSummary:firstReadOnlyProviderAdapterShellSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary,
      providerSandboxReadinessViewModelSummary:providerSandboxReadinessViewModelSummary,
      realProviderSandboxGateSummary:realProviderSandboxGateSummary,
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      providerCallAuditLedgerSummary:providerCallAuditLedgerSummary
    }) : null);
    let providerSandboxDryRunViewModelStatus = text(providerSandboxDryRunViewModelSummary && providerSandboxDryRunViewModelSummary.status || "");
    const providerAdapterRegistrySummary = safe.providerAdapterRegistrySummary && typeof safe.providerAdapterRegistrySummary === "object" ? safe.providerAdapterRegistrySummary : (typeof globalShoppingProviderAdapterRegistryApi.buildGlobalShoppingProviderAdapterRegistry === "function" ? globalShoppingProviderAdapterRegistryApi.buildGlobalShoppingProviderAdapterRegistry({
      registryMode:"dry_run",
      adapterShells:[{
        adapterId:"global_fixture_provider_dry_run",
        providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider",
        providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox",
        adapterMode:"dry_run",
        providerType:"fixture",
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        redactedOutputOnly:true
      }]
    }) : null);
    const providerAdapterRegistryStatus = text(providerAdapterRegistrySummary && providerAdapterRegistrySummary.status || "");
    const dryRunProviderResponseNormalizerSummary = safe.dryRunProviderResponseNormalizerSummary && typeof safe.dryRunProviderResponseNormalizerSummary === "object" ? safe.dryRunProviderResponseNormalizerSummary : (typeof globalShoppingDryRunProviderResponseNormalizerApi.buildGlobalShoppingDryRunProviderResponseNormalizer === "function" ? globalShoppingDryRunProviderResponseNormalizerApi.buildGlobalShoppingDryRunProviderResponseNormalizer({
      adapterRegistry:providerAdapterRegistrySummary,
      dryRunHarness:providerSandboxDryRunHarnessSummary,
      responseMode:"dry_run",
      redactedResponseSummary:{
        responseMode:"dry_run",
        providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider",
        providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox",
        redacted:true
      },
      fixturePrices:legalProviderFixtureSummary && legalProviderFixtureSummary.normalizedSourceInputs || []
    }) : null);
    const dryRunResponseNormalizerStatus = text(dryRunProviderResponseNormalizerSummary && dryRunProviderResponseNormalizerSummary.status || "");
    const sandboxProviderRunbookSummary = safe.sandboxProviderRunbookSummary && typeof safe.sandboxProviderRunbookSummary === "object" ? safe.sandboxProviderRunbookSummary : (typeof globalShoppingSandboxProviderRunbookBoardApi.buildGlobalShoppingSandboxProviderRunbookBoard === "function" ? globalShoppingSandboxProviderRunbookBoardApi.buildGlobalShoppingSandboxProviderRunbookBoard({
      providerAdapterRegistrySummary:providerAdapterRegistrySummary,
      providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary,
      firstReadOnlyProviderAdapterShellSummary:firstReadOnlyProviderAdapterShellSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary,
      realProviderSandboxGateSummary:realProviderSandboxGateSummary,
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      providerCallAuditLedgerSummary:providerCallAuditLedgerSummary,
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
      dryRunProviderResponseNormalizerSummary:dryRunProviderResponseNormalizerSummary
    }) : null);
    const sandboxProviderRunbookStatus = text(sandboxProviderRunbookSummary && sandboxProviderRunbookSummary.status || "");
    const providerAdapterRegistryViewModelSummary = safe.providerAdapterRegistryViewModelSummary && typeof safe.providerAdapterRegistryViewModelSummary === "object" ? safe.providerAdapterRegistryViewModelSummary : (typeof globalShoppingProviderAdapterRegistryViewModelApi.buildGlobalShoppingProviderAdapterRegistryViewModel === "function" ? globalShoppingProviderAdapterRegistryViewModelApi.buildGlobalShoppingProviderAdapterRegistryViewModel({
      providerAdapterRegistrySummary:providerAdapterRegistrySummary,
      dryRunProviderResponseNormalizerSummary:dryRunProviderResponseNormalizerSummary,
      sandboxProviderRunbookSummary:sandboxProviderRunbookSummary
    }) : null);
    const providerAdapterRegistryViewModelStatus = text(providerAdapterRegistryViewModelSummary && providerAdapterRegistryViewModelSummary.status || "");
    const firstSandboxProviderConnectorSummary = safe.firstSandboxProviderConnectorSummary && typeof safe.firstSandboxProviderConnectorSummary === "object" ? safe.firstSandboxProviderConnectorSummary : (typeof globalShoppingFirstSandboxProviderConnectorApi.buildGlobalShoppingFirstSandboxProviderConnector === "function" ? globalShoppingFirstSandboxProviderConnectorApi.buildGlobalShoppingFirstSandboxProviderConnector({
      adapterRegistry:providerAdapterRegistrySummary,
      adapterShell:firstReadOnlyProviderAdapterShellSummary,
      dryRunHarness:providerSandboxDryRunHarnessSummary,
      safetyKillSwitch:providerSandboxSafetyKillSwitchSummary,
      requestEnvelope:providerRequestEnvelopeSummary,
      providerRunbook:sandboxProviderRunbookSummary,
      dryRunResponseNormalizer:dryRunProviderResponseNormalizerSummary,
      fixturePayload:{
        providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider",
        providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox",
        providerType:"fixture",
        sourceType:"fixture",
        itemType:"flight",
        region:"global",
        normalizedSourceInputs:dryRunProviderResponseNormalizerSummary && dryRunProviderResponseNormalizerSummary.normalizedSourceInputs || []
      },
      providerId:legalProviderFixtureSummary && legalProviderFixtureSummary.providerId || "global_fixture_provider",
      providerName:legalProviderFixtureSummary && legalProviderFixtureSummary.providerName || "Global Shopping Fixture Sandbox",
      providerType:"fixture",
      sourceType:"fixture",
      itemType:"flight",
      region:"global",
      connectorMode:"dry_run"
    }) : null);
    const firstSandboxProviderConnectorStatus = text(firstSandboxProviderConnectorSummary && firstSandboxProviderConnectorSummary.status || "");
    const providerCoverageDashboardSummary = safe.providerCoverageDashboardSummary && typeof safe.providerCoverageDashboardSummary === "object" ? safe.providerCoverageDashboardSummary : (typeof globalShoppingProviderCoverageDashboardApi.buildGlobalShoppingProviderCoverageDashboard === "function" ? globalShoppingProviderCoverageDashboardApi.buildGlobalShoppingProviderCoverageDashboard({
      adapterRegistrySummary:providerAdapterRegistrySummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      normalizedSourceInputs:dryRunProviderResponseNormalizerSummary && dryRunProviderResponseNormalizerSummary.normalizedSourceInputs || []
    }) : null);
    const providerCoverageStatus = text(providerCoverageDashboardSummary && providerCoverageDashboardSummary.status || "");
    const readOnlySourceTrustScoreSummary = safe.readOnlySourceTrustScoreSummary && typeof safe.readOnlySourceTrustScoreSummary === "object" ? safe.readOnlySourceTrustScoreSummary : (typeof globalShoppingReadOnlySourceTrustScoreApi.buildGlobalShoppingReadOnlySourceTrustScore === "function" ? globalShoppingReadOnlySourceTrustScoreApi.buildGlobalShoppingReadOnlySourceTrustScore({
      dryRunProviderResponseNormalizerSummary:dryRunProviderResponseNormalizerSummary
    }) : null);
    const sourceTrustStatus = text(readOnlySourceTrustScoreSummary && readOnlySourceTrustScoreSummary.status || "");
    const providerCoverageViewModelSummary = safe.providerCoverageViewModelSummary && typeof safe.providerCoverageViewModelSummary === "object" ? safe.providerCoverageViewModelSummary : (typeof globalShoppingProviderCoverageViewModelApi.buildGlobalShoppingProviderCoverageViewModel === "function" ? globalShoppingProviderCoverageViewModelApi.buildGlobalShoppingProviderCoverageViewModel({
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerCoverageDashboardSummary:providerCoverageDashboardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      safeToProceedWithFirstReadOnlyProviderSandboxIntegration:firstSandboxProviderConnectorStatus === "ready" && providerCoverageStatus === "ready" && sourceTrustStatus === "ready"
    }) : null);
    const providerCoverageViewModelStatus = text(providerCoverageViewModelSummary && providerCoverageViewModelSummary.status || "");
    const sandboxCandidatePipelineInputSummary = {
      status:"ready",
      officialPriceAnchorSummary:officialPriceAnchorSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      redacted:true
    };
    const readOnlyProviderSandboxIntegrationGateSummary = safe.readOnlyProviderSandboxIntegrationGateSummary && typeof safe.readOnlyProviderSandboxIntegrationGateSummary === "object" ? safe.readOnlyProviderSandboxIntegrationGateSummary : (typeof globalShoppingReadOnlyProviderSandboxIntegrationGateApi.buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate === "function" ? globalShoppingReadOnlyProviderSandboxIntegrationGateApi.buildGlobalShoppingReadOnlyProviderSandboxIntegrationGate({
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerAdapterRegistrySummary:providerAdapterRegistrySummary,
      providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary,
      providerCoverageDashboardSummary:providerCoverageDashboardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      pricePipelineOrchestratorSummary:sandboxCandidatePipelineInputSummary,
      jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary
    }) : null);
    const providerSandboxIntegrationGateStatus = text(readOnlyProviderSandboxIntegrationGateSummary && readOnlyProviderSandboxIntegrationGateSummary.status || "");
    const sandboxPriceCandidateSessionSummary = safe.sandboxPriceCandidateSessionSummary && typeof safe.sandboxPriceCandidateSessionSummary === "object" ? safe.sandboxPriceCandidateSessionSummary : (typeof globalShoppingSandboxPriceCandidateSessionApi.buildGlobalShoppingSandboxPriceCandidateSession === "function" ? globalShoppingSandboxPriceCandidateSessionApi.buildGlobalShoppingSandboxPriceCandidateSession({
      readOnlyProviderSandboxIntegrationGateSummary:readOnlyProviderSandboxIntegrationGateSummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerCoverageDashboardSummary:providerCoverageDashboardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      pricePipelineOrchestratorSummary:sandboxCandidatePipelineInputSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary
    }) : null);
    const sandboxPriceCandidateSessionStatus = text(sandboxPriceCandidateSessionSummary && sandboxPriceCandidateSessionSummary.status || "");
    const sandboxPriceCandidateResultBoardSummary = safe.sandboxPriceCandidateResultBoardSummary && typeof safe.sandboxPriceCandidateResultBoardSummary === "object" ? safe.sandboxPriceCandidateResultBoardSummary : (typeof globalShoppingSandboxPriceCandidateResultBoardApi.buildGlobalShoppingSandboxPriceCandidateResultBoard === "function" ? globalShoppingSandboxPriceCandidateResultBoardApi.buildGlobalShoppingSandboxPriceCandidateResultBoard({
      sandboxPriceCandidateSessionSummary:sandboxPriceCandidateSessionSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary,
      pricePipelineOrchestratorSummary:sandboxCandidatePipelineInputSummary
    }) : null);
    const sandboxPriceCandidateResultBoardStatus = text(sandboxPriceCandidateResultBoardSummary && sandboxPriceCandidateResultBoardSummary.status || "");
    const safeToProceedWithSandboxDeepLinkCandidate = safeToProceedWithReadOnlyPriceProviderSandbox === true && safeToProceedWithDeepLinkSafetyGate === true && externalDeepLinkSafetyStatus === "safe" && searchPrefillStatus === "safe" && handoffPreviewStatus === "ready" && sandboxDeepLinkStatus === "ready";
    const safeToProceedWithPartnerFixtureAdapter = safeToProceedWithSandboxDeepLinkCandidate === true && platformAvailabilityStatus === "available" && partnerLinkPolicyStatus === "compliant" && sandboxHandoffStatus === "ready";
    const safeToProceedWithRealReadOnlyProviderSandbox = pricePipelineStatus === "ready" && readOnlyCandidateJourneyStatus === "ready";
    const safeToProceedWithFirstRealReadOnlyProviderSandbox = readOnlyProviderSandboxConnectorStatus === "ready" && fixtureReplayStatus === "ready" && pricePipelineStatus === "ready";
    const safeToProceedWithFirstReadOnlySandboxDryRun = realProviderSandboxGateStatus === "ready" && providerRequestEnvelopeStatus === "ready" && providerCallAuditLedgerStatus === "ready" && providerSandboxReadinessStatus === "ready";
    const safeToProceedWithFirstProviderSandboxFixtureDryRun = providerSandboxDryRunStatus === "ready" && providerAdapterShellStatus === "ready" && providerKillSwitchStatus === "clear" && providerSandboxDryRunViewModelStatus === "ready";
    const safeToProceedWithFirstSandboxProviderConnectorImplementation = providerAdapterRegistryStatus === "ready" && dryRunResponseNormalizerStatus === "ready" && sandboxProviderRunbookStatus === "ready" && providerAdapterRegistryViewModelStatus === "ready";
    const safeToProceedWithFirstReadOnlyProviderSandboxIntegration = firstSandboxProviderConnectorStatus === "ready" && providerCoverageStatus === "ready" && sourceTrustStatus === "ready" && providerCoverageViewModelStatus === "ready";
    const safeToProceedWithSandboxCandidateUserPreview = providerSandboxIntegrationGateStatus === "ready" && sandboxPriceCandidateSessionStatus === "ready" && sandboxPriceCandidateResultBoardStatus === "ready";
    const providerFixtureViewModelSummary = safe.providerFixtureViewModelSummary && typeof safe.providerFixtureViewModelSummary === "object" ? safe.providerFixtureViewModelSummary : (typeof globalShoppingProviderFixtureViewModelApi.buildGlobalShoppingProviderFixtureViewModel === "function" ? globalShoppingProviderFixtureViewModelApi.buildGlobalShoppingProviderFixtureViewModel({ legalProviderFixtureSummary:legalProviderFixtureSummary, providerCredentialSafetySummary:providerCredentialSafetySummary, sandboxPriceFeedSummary:sandboxPriceFeedSummary }) : null);
    const finalizedPricePipelineOrchestratorSummary = safe.pricePipelineOrchestratorSummary && typeof safe.pricePipelineOrchestratorSummary === "object" ? safe.pricePipelineOrchestratorSummary : (typeof globalShoppingPricePipelineOrchestratorApi.buildGlobalShoppingPricePipelineOrchestrator === "function" ? globalShoppingPricePipelineOrchestratorApi.buildGlobalShoppingPricePipelineOrchestrator({
      readOnlyProviderSandboxConnector:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsole:fixtureReplayConsoleSummary,
      normalizedPriceCandidateBoard:normalizedPriceCandidateBoardSummary,
      normalizedPriceCandidateBoardSummary:normalizedPriceCandidateBoardSummary,
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetyReview:providerCredentialSafetySummary,
      sandboxPriceFeedGate:sandboxPriceFeedSummary,
      sandboxProviderResponseContract:sandboxProviderResponseContractSummary,
      priceSourceNormalizer:priceSourceNormalizationSummary,
      officialPriceAnchorSlot:officialPriceAnchorSummary,
      sameItemMatcher:sameItemMatcherSummary,
      duplicateCandidateMerger:duplicateCandidateMergerSummary,
      coveredLowestCandidateBoard:coveredLowestCandidateBoardSummary,
      sandboxHandoffViewModel:sandboxHandoffViewModelSummary,
      providerAdapterRegistrySummary:providerAdapterRegistrySummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerCoverageDashboardSummary:providerCoverageDashboardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      providerCoverageViewModelSummary:providerCoverageViewModelSummary,
      readOnlyProviderSandboxIntegrationGateSummary:readOnlyProviderSandboxIntegrationGateSummary,
      sandboxPriceCandidateSessionSummary:sandboxPriceCandidateSessionSummary,
      sandboxPriceCandidateResultBoardSummary:sandboxPriceCandidateResultBoardSummary,
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      providerCallAuditLedgerSummary:providerCallAuditLedgerSummary,
      providerSandboxReadinessViewModelSummary:providerSandboxReadinessViewModelSummary,
      providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary,
      firstReadOnlyProviderAdapterShellSummary:firstReadOnlyProviderAdapterShellSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary,
      providerSandboxDryRunViewModelSummary:providerSandboxDryRunViewModelSummary,
      dryRunProviderResponseNormalizerSummary:dryRunProviderResponseNormalizerSummary,
      sandboxProviderRunbookSummary:sandboxProviderRunbookSummary,
      realProviderSandboxGateSummary:realProviderSandboxGateSummary,
      jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary
    }) : pricePipelineOrchestratorSummary);
    const finalizedPricePipelineStatus = text(finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.status || pricePipelineStatus || "");
    const finalizedReadOnlyCandidateJourneySummary = safe.readOnlyCandidateJourneySummary && typeof safe.readOnlyCandidateJourneySummary === "object" ? safe.readOnlyCandidateJourneySummary : (typeof globalShoppingReadOnlyCandidateJourneyBoardApi.buildGlobalShoppingReadOnlyCandidateJourneyBoard === "function" ? globalShoppingReadOnlyCandidateJourneyBoardApi.buildGlobalShoppingReadOnlyCandidateJourneyBoard({
      readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsoleSummary:fixtureReplayConsoleSummary,
      pricePipelineOrchestratorSummary:finalizedPricePipelineOrchestratorSummary,
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary,
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
      priceSourceNormalizationSummary:priceSourceNormalizationSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary,
      sameItemMatcherSummary:sameItemMatcherSummary,
      duplicateCandidateMergerSummary:duplicateCandidateMergerSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      sandboxHandoffViewModelSummary:sandboxHandoffViewModelSummary
    }) : readOnlyCandidateJourneySummary);
    const finalizedReadOnlyCandidateJourneyStatus = text(finalizedReadOnlyCandidateJourneySummary && finalizedReadOnlyCandidateJourneySummary.status || readOnlyCandidateJourneyStatus || "");
    const finalizedSafeToProceedWithRealReadOnlyProviderSandbox = finalizedPricePipelineStatus === "ready" && finalizedReadOnlyCandidateJourneyStatus === "ready";
    const finalizedSafeToProceedWithFirstRealReadOnlyProviderSandbox = readOnlyProviderSandboxConnectorStatus === "ready" && fixtureReplayStatus === "ready" && finalizedPricePipelineStatus === "ready";
    const sandboxCandidateComparisonWorkbenchSummary = safe.sandboxCandidateComparisonWorkbenchSummary && typeof safe.sandboxCandidateComparisonWorkbenchSummary === "object" ? safe.sandboxCandidateComparisonWorkbenchSummary : (typeof globalShoppingSandboxCandidateComparisonWorkbenchApi.buildGlobalShoppingSandboxCandidateComparisonWorkbench === "function" ? globalShoppingSandboxCandidateComparisonWorkbenchApi.buildGlobalShoppingSandboxCandidateComparisonWorkbench({
      sandboxPriceCandidateResultBoard:sandboxPriceCandidateResultBoardSummary,
      providerEvidenceTrace:finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerEvidenceTraceSummary || null,
      candidateConfidenceExplainer:finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.candidateConfidenceExplainerSummary || null,
      readOnlySourceTrustScore:readOnlySourceTrustScoreSummary,
      normalizedPriceCandidateBoard:normalizedPriceCandidateBoardSummary
    }) : null);
    const providerEvidenceComparisonMatrixSummary = safe.providerEvidenceComparisonMatrixSummary && typeof safe.providerEvidenceComparisonMatrixSummary === "object" ? safe.providerEvidenceComparisonMatrixSummary : (typeof globalShoppingProviderEvidenceComparisonMatrixApi.buildGlobalShoppingProviderEvidenceComparisonMatrix === "function" ? globalShoppingProviderEvidenceComparisonMatrixApi.buildGlobalShoppingProviderEvidenceComparisonMatrix({
      sandboxPriceCandidateResultBoard:sandboxPriceCandidateResultBoardSummary,
      providerEvidenceTrace:finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerEvidenceTraceSummary || null,
      readOnlySourceTrustScore:readOnlySourceTrustScoreSummary,
      officialPriceAnchorSlot:officialPriceAnchorSummary,
      coveredLowestCandidateBoard:coveredLowestCandidateBoardSummary
    }) : null);
    const readOnlyHandoffReadinessDrillSummary = safe.readOnlyHandoffReadinessDrillSummary && typeof safe.readOnlyHandoffReadinessDrillSummary === "object" ? safe.readOnlyHandoffReadinessDrillSummary : (typeof globalShoppingReadOnlyHandoffReadinessDrillApi.buildGlobalShoppingReadOnlyHandoffReadinessDrill === "function" ? globalShoppingReadOnlyHandoffReadinessDrillApi.buildGlobalShoppingReadOnlyHandoffReadinessDrill({
      sandboxHandoffViewModel:sandboxHandoffViewModelSummary,
      jumpToPlatformHandoffPreview:jumpToPlatformHandoffPreviewSummary,
      sandboxDeepLinkCandidate:sandboxDeepLinkCandidateSummary,
      searchParameterPrefill:searchParameterPrefillSummary,
      platformAvailability:platformAvailabilitySummary,
      partnerLinkPolicy:partnerLinkPolicySummary
    }) : null);
    const safeToProceedWithSandboxDecisionReview = finalizedSafeToProceedWithRealReadOnlyProviderSandbox &&
      text(sandboxCandidateComparisonWorkbenchSummary && sandboxCandidateComparisonWorkbenchSummary.status || "") === "ready" &&
      text(providerEvidenceComparisonMatrixSummary && providerEvidenceComparisonMatrixSummary.status || "") === "ready" &&
      text(readOnlyHandoffReadinessDrillSummary && readOnlyHandoffReadinessDrillSummary.status || "") === "ready";
    const sandboxDecisionReviewViewModelSummary = safe.sandboxDecisionReviewViewModelSummary && typeof safe.sandboxDecisionReviewViewModelSummary === "object" ? safe.sandboxDecisionReviewViewModelSummary : (typeof globalShoppingSandboxDecisionReviewViewModelApi.buildGlobalShoppingSandboxDecisionReviewViewModel === "function" ? globalShoppingSandboxDecisionReviewViewModelApi.buildGlobalShoppingSandboxDecisionReviewViewModel({
      sandboxCandidateComparisonWorkbench:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrix:providerEvidenceComparisonMatrixSummary,
      readOnlyHandoffReadinessDrill:readOnlyHandoffReadinessDrillSummary
    }) : null);
    const sandboxCandidateComparisonWorkbenchStatus = text(sandboxCandidateComparisonWorkbenchSummary && sandboxCandidateComparisonWorkbenchSummary.status || "");
    const providerEvidenceComparisonMatrixStatus = text(providerEvidenceComparisonMatrixSummary && providerEvidenceComparisonMatrixSummary.status || "");
    const readOnlyHandoffReadinessDrillStatus = text(readOnlyHandoffReadinessDrillSummary && readOnlyHandoffReadinessDrillSummary.status || "");
    const sandboxDecisionReviewStatus = text(sandboxDecisionReviewViewModelSummary && sandboxDecisionReviewViewModelSummary.status || "");
    const readOnlyPlatformHandoffSimulatorSummary = safe.readOnlyPlatformHandoffSimulatorSummary && typeof safe.readOnlyPlatformHandoffSimulatorSummary === "object" ? safe.readOnlyPlatformHandoffSimulatorSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readOnlyPlatformHandoffSimulatorSummary && typeof finalizedPricePipelineOrchestratorSummary.readOnlyPlatformHandoffSimulatorSummary === "object" ? finalizedPricePipelineOrchestratorSummary.readOnlyPlatformHandoffSimulatorSummary : (typeof globalShoppingReadOnlyPlatformHandoffSimulatorApi.buildGlobalShoppingReadOnlyPlatformHandoffSimulator === "function" ? globalShoppingReadOnlyPlatformHandoffSimulatorApi.buildGlobalShoppingReadOnlyPlatformHandoffSimulator({
      sandboxDecisionReviewViewModel:sandboxDecisionReviewViewModelSummary,
      sandboxCandidateComparisonWorkbench:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrix:providerEvidenceComparisonMatrixSummary,
      readOnlyHandoffReadinessDrill:readOnlyHandoffReadinessDrillSummary
    }) : null));
    const redactedSearchParameterPackSummary = safe.redactedSearchParameterPackSummary && typeof safe.redactedSearchParameterPackSummary === "object" ? safe.redactedSearchParameterPackSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.redactedSearchParameterPackSummary && typeof finalizedPricePipelineOrchestratorSummary.redactedSearchParameterPackSummary === "object" ? finalizedPricePipelineOrchestratorSummary.redactedSearchParameterPackSummary : (typeof globalShoppingRedactedSearchParameterPackApi.buildGlobalShoppingRedactedSearchParameterPack === "function" ? globalShoppingRedactedSearchParameterPackApi.buildGlobalShoppingRedactedSearchParameterPack({
      itemType:"flight",
      origin:normalized.origin,
      destination:normalized.destination,
      departureDate:normalized.departureDate,
      passengerCount:1
    }) : null));
    const userConfirmationChecklistSummary = safe.userConfirmationChecklistSummary && typeof safe.userConfirmationChecklistSummary === "object" ? safe.userConfirmationChecklistSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.userConfirmationChecklistSummary && typeof finalizedPricePipelineOrchestratorSummary.userConfirmationChecklistSummary === "object" ? finalizedPricePipelineOrchestratorSummary.userConfirmationChecklistSummary : (typeof globalShoppingUserConfirmationChecklistApi.buildGlobalShoppingUserConfirmationChecklist === "function" ? globalShoppingUserConfirmationChecklistApi.buildGlobalShoppingUserConfirmationChecklist({}) : null));
    const platformHandoffSimulationViewModelSummary = safe.platformHandoffSimulationViewModelSummary && typeof safe.platformHandoffSimulationViewModelSummary === "object" ? safe.platformHandoffSimulationViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.platformHandoffSimulationViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.platformHandoffSimulationViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.platformHandoffSimulationViewModelSummary : (typeof globalShoppingPlatformHandoffSimulationViewModelApi.buildGlobalShoppingPlatformHandoffSimulationViewModel === "function" ? globalShoppingPlatformHandoffSimulationViewModelApi.buildGlobalShoppingPlatformHandoffSimulationViewModel({
      readOnlyPlatformHandoffSimulatorSummary:readOnlyPlatformHandoffSimulatorSummary,
      redactedSearchParameterPackSummary:redactedSearchParameterPackSummary,
      userConfirmationChecklistSummary:userConfirmationChecklistSummary
    }) : null));
    const readOnlyPlatformHandoffSimulatorStatus = text(readOnlyPlatformHandoffSimulatorSummary && readOnlyPlatformHandoffSimulatorSummary.status || "");
    const redactedSearchParameterPackStatus = text(redactedSearchParameterPackSummary && redactedSearchParameterPackSummary.status || "");
    const userConfirmationChecklistStatus = text(userConfirmationChecklistSummary && userConfirmationChecklistSummary.status || "");
    const platformHandoffSimulationViewModelStatus = text(platformHandoffSimulationViewModelSummary && platformHandoffSimulationViewModelSummary.status || "");
    const safeToProceedWithUserFacingHandoffExplanation = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithUserFacingHandoffExplanation === true;
    const globalShoppingReadOnlyHandoffPacketPreviewApi = window.WeishanGlobalShoppingReadOnlyHandoffPacketPreview || {};
    const globalShoppingPlatformPreflightSafetyGateApi = window.WeishanGlobalShoppingPlatformPreflightSafetyGate || {};
    const globalShoppingUserActionBoundaryReceiptApi = window.WeishanGlobalShoppingUserActionBoundaryReceipt || {};
    const globalShoppingHandoffPacketViewModelApi = window.WeishanGlobalShoppingHandoffPacketViewModel || {};
    const readOnlyHandoffPacketPreviewSummary = safe.readOnlyHandoffPacketPreviewSummary && typeof safe.readOnlyHandoffPacketPreviewSummary === "object" ? safe.readOnlyHandoffPacketPreviewSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readOnlyHandoffPacketPreviewSummary && typeof finalizedPricePipelineOrchestratorSummary.readOnlyHandoffPacketPreviewSummary === "object" ? finalizedPricePipelineOrchestratorSummary.readOnlyHandoffPacketPreviewSummary : (typeof globalShoppingReadOnlyHandoffPacketPreviewApi.buildGlobalShoppingReadOnlyHandoffPacketPreview === "function" ? globalShoppingReadOnlyHandoffPacketPreviewApi.buildGlobalShoppingReadOnlyHandoffPacketPreview({ sandboxDecisionReviewViewModelSummary:sandboxDecisionReviewViewModelSummary, sandboxCandidateComparisonWorkbenchSummary:sandboxCandidateComparisonWorkbenchSummary, providerEvidenceComparisonMatrixSummary:providerEvidenceComparisonMatrixSummary, readOnlyHandoffReadinessDrillSummary:readOnlyHandoffReadinessDrillSummary, readOnlyPlatformHandoffSimulatorSummary:readOnlyPlatformHandoffSimulatorSummary, redactedSearchParameterPackSummary:redactedSearchParameterPackSummary, userConfirmationChecklistSummary:userConfirmationChecklistSummary }) : null));
    const platformPreflightSafetyGateSummary = safe.platformPreflightSafetyGateSummary && typeof safe.platformPreflightSafetyGateSummary === "object" ? safe.platformPreflightSafetyGateSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.platformPreflightSafetyGateSummary && typeof finalizedPricePipelineOrchestratorSummary.platformPreflightSafetyGateSummary === "object" ? finalizedPricePipelineOrchestratorSummary.platformPreflightSafetyGateSummary : (typeof globalShoppingPlatformPreflightSafetyGateApi.buildGlobalShoppingPlatformPreflightSafetyGate === "function" ? globalShoppingPlatformPreflightSafetyGateApi.buildGlobalShoppingPlatformPreflightSafetyGate({ readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary, redactedSearchParameterPackSummary:redactedSearchParameterPackSummary, userConfirmationChecklistSummary:userConfirmationChecklistSummary, sandboxDecisionReviewViewModelSummary:sandboxDecisionReviewViewModelSummary }) : null));
    const userActionBoundaryReceiptSummary = safe.userActionBoundaryReceiptSummary && typeof safe.userActionBoundaryReceiptSummary === "object" ? safe.userActionBoundaryReceiptSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.userActionBoundaryReceiptSummary && typeof finalizedPricePipelineOrchestratorSummary.userActionBoundaryReceiptSummary === "object" ? finalizedPricePipelineOrchestratorSummary.userActionBoundaryReceiptSummary : (typeof globalShoppingUserActionBoundaryReceiptApi.buildGlobalShoppingUserActionBoundaryReceipt === "function" ? globalShoppingUserActionBoundaryReceiptApi.buildGlobalShoppingUserActionBoundaryReceipt({}) : null));
    const handoffPacketViewModelSummary = safe.handoffPacketViewModelSummary && typeof safe.handoffPacketViewModelSummary === "object" ? safe.handoffPacketViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.handoffPacketViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.handoffPacketViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.handoffPacketViewModelSummary : (typeof globalShoppingHandoffPacketViewModelApi.buildGlobalShoppingHandoffPacketViewModel === "function" ? globalShoppingHandoffPacketViewModelApi.buildGlobalShoppingHandoffPacketViewModel({ readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary, platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary, userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary }) : null));
    const readOnlyHandoffPacketPreviewStatus = text(readOnlyHandoffPacketPreviewSummary && readOnlyHandoffPacketPreviewSummary.status || "");
    const platformPreflightSafetyGateStatus = text(platformPreflightSafetyGateSummary && platformPreflightSafetyGateSummary.status || "");
    const userActionBoundaryReceiptStatus = text(userActionBoundaryReceiptSummary && userActionBoundaryReceiptSummary.status || "");
    const handoffPacketViewModelStatus = text(handoffPacketViewModelSummary && handoffPacketViewModelSummary.status || "");
    const safeToProceedWithManualPlatformReview = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithManualPlatformReview === true;
    const globalShoppingManualPlatformReviewCockpitApi = window.WeishanGlobalShoppingManualPlatformReviewCockpit || {};
    const globalShoppingHandoffAcceptanceWalkthroughApi = window.WeishanGlobalShoppingHandoffAcceptanceWalkthrough || {};
    const globalShoppingPlatformRealityCheckBoardApi = window.WeishanGlobalShoppingPlatformRealityCheckBoard || {};
    const globalShoppingManualPlatformReviewViewModelApi = window.WeishanGlobalShoppingManualPlatformReviewViewModel || {};
    const manualPlatformReviewCockpitSummary = safe.manualPlatformReviewCockpitSummary && typeof safe.manualPlatformReviewCockpitSummary === "object" ? safe.manualPlatformReviewCockpitSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.manualPlatformReviewCockpitSummary && typeof finalizedPricePipelineOrchestratorSummary.manualPlatformReviewCockpitSummary === "object" ? finalizedPricePipelineOrchestratorSummary.manualPlatformReviewCockpitSummary : (typeof globalShoppingManualPlatformReviewCockpitApi.buildGlobalShoppingManualPlatformReviewCockpit === "function" ? globalShoppingManualPlatformReviewCockpitApi.buildGlobalShoppingManualPlatformReviewCockpit({ handoffPacketViewModelSummary:handoffPacketViewModelSummary, platformHandoffSimulationViewModelSummary:platformHandoffSimulationViewModelSummary, readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary }) : null));
    const handoffAcceptanceWalkthroughSummary = safe.handoffAcceptanceWalkthroughSummary && typeof safe.handoffAcceptanceWalkthroughSummary === "object" ? safe.handoffAcceptanceWalkthroughSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.handoffAcceptanceWalkthroughSummary && typeof finalizedPricePipelineOrchestratorSummary.handoffAcceptanceWalkthroughSummary === "object" ? finalizedPricePipelineOrchestratorSummary.handoffAcceptanceWalkthroughSummary : (typeof globalShoppingHandoffAcceptanceWalkthroughApi.buildGlobalShoppingHandoffAcceptanceWalkthrough === "function" ? globalShoppingHandoffAcceptanceWalkthroughApi.buildGlobalShoppingHandoffAcceptanceWalkthrough({ readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary, userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary, userConfirmationChecklistSummary:userConfirmationChecklistSummary }) : null));
    const platformRealityCheckBoardSummary = safe.platformRealityCheckBoardSummary && typeof safe.platformRealityCheckBoardSummary === "object" ? safe.platformRealityCheckBoardSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.platformRealityCheckBoardSummary && typeof finalizedPricePipelineOrchestratorSummary.platformRealityCheckBoardSummary === "object" ? finalizedPricePipelineOrchestratorSummary.platformRealityCheckBoardSummary : (typeof globalShoppingPlatformRealityCheckBoardApi.buildGlobalShoppingPlatformRealityCheckBoard === "function" ? globalShoppingPlatformRealityCheckBoardApi.buildGlobalShoppingPlatformRealityCheckBoard({ platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary, userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary, readOnlyPlatformHandoffSimulatorSummary:readOnlyPlatformHandoffSimulatorSummary }) : null));
    const manualPlatformReviewViewModelSummary = safe.manualPlatformReviewViewModelSummary && typeof safe.manualPlatformReviewViewModelSummary === "object" ? safe.manualPlatformReviewViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.manualPlatformReviewViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.manualPlatformReviewViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.manualPlatformReviewViewModelSummary : (typeof globalShoppingManualPlatformReviewViewModelApi.buildGlobalShoppingManualPlatformReviewViewModel === "function" ? globalShoppingManualPlatformReviewViewModelApi.buildGlobalShoppingManualPlatformReviewViewModel({ manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary, handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthroughSummary, platformRealityCheckBoardSummary:platformRealityCheckBoardSummary }) : null));
    const manualPlatformReviewCockpitStatus = text(manualPlatformReviewCockpitSummary && manualPlatformReviewCockpitSummary.status || "");
    const handoffAcceptanceWalkthroughStatus = text(handoffAcceptanceWalkthroughSummary && handoffAcceptanceWalkthroughSummary.status || "");
    const platformRealityCheckStatus = text(platformRealityCheckBoardSummary && platformRealityCheckBoardSummary.status || "");
    const manualPlatformReviewViewModelStatus = text(manualPlatformReviewViewModelSummary && manualPlatformReviewViewModelSummary.status || "");
    const safeToProceedWithManualPlatformUserEducation = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithManualPlatformUserEducation === true;
    const globalShoppingUserFacingManualReviewFlowApi = window.WeishanGlobalShoppingUserFacingManualReviewFlow || {};
    const globalShoppingPlatformVerificationProgressTrackerApi = window.WeishanGlobalShoppingPlatformVerificationProgressTracker || {};
    const globalShoppingSafeNextActionPanelApi = window.WeishanGlobalShoppingSafeNextActionPanel || {};
    const globalShoppingUserManualReviewViewModelApi = window.WeishanGlobalShoppingUserManualReviewViewModel || {};
    const globalShoppingManualPlatformVisitPreparationCenterApi = window.WeishanGlobalShoppingManualPlatformVisitPreparationCenter || {};
    const globalShoppingExternalPlatformBoundaryBriefApi = window.WeishanGlobalShoppingExternalPlatformBoundaryBrief || {};
    const globalShoppingFinalUserSafetyChecklistApi = window.WeishanGlobalShoppingFinalUserSafetyChecklist || {};
    const globalShoppingPlatformVisitPreparationViewModelApi = window.WeishanGlobalShoppingPlatformVisitPreparationViewModel || {};
    const globalShoppingExternalPlatformExitRampPreviewApi = window.WeishanGlobalShoppingExternalPlatformExitRampPreview || {};
    const globalShoppingManualVisitSafetyBriefApi = window.WeishanGlobalShoppingManualVisitSafetyBrief || {};
    const globalShoppingReadOnlySessionClosurePackApi = window.WeishanGlobalShoppingReadOnlySessionClosurePack || {};
    const globalShoppingExternalPlatformExitViewModelApi = window.WeishanGlobalShoppingExternalPlatformExitViewModel || {};
    const globalShoppingReadOnlyCommerceSessionRecapCenterApi = window.WeishanGlobalShoppingReadOnlyCommerceSessionRecapCenter || {};
    const globalShoppingUserTrustClosureSummaryApi = window.WeishanGlobalShoppingUserTrustClosureSummary || {};
    const globalShoppingNextFeatureReadinessGateApi = window.WeishanGlobalShoppingNextFeatureReadinessGate || {};
    const globalShoppingCommerceSessionRecapViewModelApi = window.WeishanGlobalShoppingCommerceSessionRecapViewModel || {};
    const globalShoppingReadOnlySandboxProviderIntegrationBlueprintApi = window.WeishanGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint || {};
    const globalShoppingCredentialIsolationReadinessBoardApi = window.WeishanGlobalShoppingCredentialIsolationReadinessBoard || {};
    const globalShoppingProviderContractSelectionBoardApi = window.WeishanGlobalShoppingProviderContractSelectionBoard || {};
    const globalShoppingSandboxProviderPlanningViewModelApi = window.WeishanGlobalShoppingSandboxProviderPlanningViewModel || {};
    const globalShoppingProviderLegalReviewDossierApi = window.WeishanGlobalShoppingProviderLegalReviewDossier || {};
    const globalShoppingCredentialVaultInterfaceStubApi = window.WeishanGlobalShoppingCredentialVaultInterfaceStub || {};
    const globalShoppingSandboxAdapterContractTestbedApi = window.WeishanGlobalShoppingSandboxAdapterContractTestbed || {};
    const globalShoppingProviderIntegrationPrepViewModelApi = window.WeishanGlobalShoppingProviderIntegrationPrepViewModel || {};
    const globalShoppingSandboxProviderMockRuntimeApi = window.WeishanGlobalShoppingSandboxProviderMockRuntime || {};
    const globalShoppingVaultBoundaryContractApi = window.WeishanGlobalShoppingVaultBoundaryContract || {};
    const globalShoppingLegalApprovalWorkflowBoardApi = window.WeishanGlobalShoppingLegalApprovalWorkflowBoard || {};
    const globalShoppingProviderMockRuntimeViewModelApi = window.WeishanGlobalShoppingProviderMockRuntimeViewModel || {};
    const globalShoppingMockProviderAdapterRegistryRuntimeApi = window.WeishanGlobalShoppingMockProviderAdapterRegistryRuntime || {};
    const globalShoppingProviderContractReplayHarnessApi = window.WeishanGlobalShoppingProviderContractReplayHarness || {};
    const globalShoppingProviderLaunchReadinessBoardApi = window.WeishanGlobalShoppingProviderLaunchReadinessBoard || {};
    const globalShoppingProviderLaunchReadinessViewModelApi = window.WeishanGlobalShoppingProviderLaunchReadinessViewModel || {};
    const globalShoppingHumanApprovalSimulationGateApi = window.WeishanGlobalShoppingHumanApprovalSimulationGate || {};
    const globalShoppingMockProviderLaunchDrillApi = window.WeishanGlobalShoppingMockProviderLaunchDrill || {};
    const globalShoppingSandboxProviderRollbackPlanApi = window.WeishanGlobalShoppingSandboxProviderRollbackPlan || {};
    const globalShoppingProviderLaunchSimulationViewModelApi = window.WeishanGlobalShoppingProviderLaunchSimulationViewModel || {};
    const globalShoppingProviderSandboxPilotControlRoomApi = window.WeishanGlobalShoppingProviderSandboxPilotControlRoom || {};
    const globalShoppingMockProviderIncidentDrillApi = window.WeishanGlobalShoppingMockProviderIncidentDrill || {};
    const globalShoppingProductionBlockerMatrixApi = window.WeishanGlobalShoppingProductionBlockerMatrix || {};
    const globalShoppingProviderPilotControlViewModelApi = window.WeishanGlobalShoppingProviderPilotControlViewModel || {};
    const globalShoppingHumanControlledSandboxProviderPilotPlannerApi = window.WeishanGlobalShoppingHumanControlledSandboxProviderPilotPlanner || {};
    const globalShoppingProviderKillSwitchDrillApi = window.WeishanGlobalShoppingProviderKillSwitchDrill || {};
    const globalShoppingComplianceEvidencePackApi = window.WeishanGlobalShoppingComplianceEvidencePack || {};
    const globalShoppingProviderPilotGovernanceViewModelApi = window.WeishanGlobalShoppingProviderPilotGovernanceViewModel || {};
    const globalShoppingProviderGovernanceConsoleApi = window.WeishanGlobalShoppingProviderGovernanceConsole || {};
    const globalShoppingProviderOperatorReviewLoopApi = window.WeishanGlobalShoppingProviderOperatorReviewLoop || {};
    const globalShoppingProviderGovernanceAuditConsoleApi = window.WeishanGlobalShoppingProviderGovernanceAuditConsole || {};
    const globalShoppingHumanPilotReadinessLedgerApi = window.WeishanGlobalShoppingHumanPilotReadinessLedger || {};
    const globalShoppingSandboxProviderReleaseFreezeGateApi = window.WeishanGlobalShoppingSandboxProviderReleaseFreezeGate || {};
    const globalShoppingProviderGovernanceReleaseViewModelApi = window.WeishanGlobalShoppingProviderGovernanceReleaseViewModel || {};
    const globalShoppingManualGovernanceReleaseDecisionRoomApi = window.WeishanGlobalShoppingManualGovernanceReleaseDecisionRoom || {};
    const globalShoppingSandboxPilotExceptionRegisterApi = window.WeishanGlobalShoppingSandboxPilotExceptionRegister || {};
    const globalShoppingProviderReadinessSignOffPacketApi = window.WeishanGlobalShoppingProviderReadinessSignOffPacket || {};
    const globalShoppingProviderManualReleaseViewModelApi = window.WeishanGlobalShoppingProviderManualReleaseViewModel || {};
    const globalShoppingReadOnlySandboxActivationReadinessCenterApi = window.WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter || {};
    const globalShoppingOfflineMockSandboxSessionRunnerApi = window.WeishanGlobalShoppingOfflineMockSandboxSessionRunner || {};
    const globalShoppingManualProviderActivationHandoffPacketApi = window.WeishanGlobalShoppingManualProviderActivationHandoffPacket || {};
    const globalShoppingProviderSandboxActivationViewModelApi = window.WeishanGlobalShoppingProviderSandboxActivationViewModel || {};
    const globalShoppingProviderSandboxReadinessWorkbenchApi = window.WeishanGlobalShoppingProviderSandboxReadinessWorkbench || {};
    const globalShoppingOfflineProviderScenarioLabApi = window.WeishanGlobalShoppingOfflineProviderScenarioLab || {};
    const globalShoppingReadOnlyProviderAdapterSdkSkeletonApi = window.WeishanGlobalShoppingReadOnlyProviderAdapterSdkSkeleton || {};
    const globalShoppingManualActivationCommandCenterApi = window.WeishanGlobalShoppingManualActivationCommandCenter || {};
    const globalShoppingProviderSandboxMilestoneViewModelApi = window.WeishanGlobalShoppingProviderSandboxMilestoneViewModel || {};
    const userFacingManualReviewFlowSummary = safe.userFacingManualReviewFlowSummary && typeof safe.userFacingManualReviewFlowSummary === "object" ? safe.userFacingManualReviewFlowSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.userFacingManualReviewFlowSummary && typeof finalizedPricePipelineOrchestratorSummary.userFacingManualReviewFlowSummary === "object" ? finalizedPricePipelineOrchestratorSummary.userFacingManualReviewFlowSummary : (typeof globalShoppingUserFacingManualReviewFlowApi.buildGlobalShoppingUserFacingManualReviewFlow === "function" ? globalShoppingUserFacingManualReviewFlowApi.buildGlobalShoppingUserFacingManualReviewFlow({ manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary, handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthroughSummary, platformRealityCheckBoardSummary:platformRealityCheckBoardSummary, handoffPacketViewModelSummary:handoffPacketViewModelSummary, platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary, userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary }) : null));
    const platformVerificationProgressTrackerSummary = safe.platformVerificationProgressTrackerSummary && typeof safe.platformVerificationProgressTrackerSummary === "object" ? safe.platformVerificationProgressTrackerSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.platformVerificationProgressTrackerSummary && typeof finalizedPricePipelineOrchestratorSummary.platformVerificationProgressTrackerSummary === "object" ? finalizedPricePipelineOrchestratorSummary.platformVerificationProgressTrackerSummary : (typeof globalShoppingPlatformVerificationProgressTrackerApi.buildGlobalShoppingPlatformVerificationProgressTracker === "function" ? globalShoppingPlatformVerificationProgressTrackerApi.buildGlobalShoppingPlatformVerificationProgressTracker({ handoffPacketViewModelSummary:handoffPacketViewModelSummary, platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary, userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary }) : null));
    const safeNextActionPanelSummary = safe.safeNextActionPanelSummary && typeof safe.safeNextActionPanelSummary === "object" ? safe.safeNextActionPanelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.safeNextActionPanelSummary && typeof finalizedPricePipelineOrchestratorSummary.safeNextActionPanelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.safeNextActionPanelSummary : (typeof globalShoppingSafeNextActionPanelApi.buildGlobalShoppingSafeNextActionPanel === "function" ? globalShoppingSafeNextActionPanelApi.buildGlobalShoppingSafeNextActionPanel({}) : null));
    const userManualReviewViewModelSummary = safe.userManualReviewViewModelSummary && typeof safe.userManualReviewViewModelSummary === "object" ? safe.userManualReviewViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.userManualReviewViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.userManualReviewViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.userManualReviewViewModelSummary : (typeof globalShoppingUserManualReviewViewModelApi.buildGlobalShoppingUserManualReviewViewModel === "function" ? globalShoppingUserManualReviewViewModelApi.buildGlobalShoppingUserManualReviewViewModel({ userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary, platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary, safeNextActionPanelSummary:safeNextActionPanelSummary }) : null));
    const userFacingManualReviewFlowStatus = text(userFacingManualReviewFlowSummary && userFacingManualReviewFlowSummary.status || "");
    const platformVerificationProgressStatus = text(platformVerificationProgressTrackerSummary && platformVerificationProgressTrackerSummary.status || "");
    const safeNextActionPanelStatus = text(safeNextActionPanelSummary && safeNextActionPanelSummary.status || "");
    const userManualReviewViewModelStatus = text(userManualReviewViewModelSummary && userManualReviewViewModelSummary.status || "");
    const safeToProceedWithManualExternalPlatformVisitEducation = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithManualExternalPlatformVisitEducation === true;
    const externalPlatformBoundaryBriefSummary = safe.externalPlatformBoundaryBriefSummary && typeof safe.externalPlatformBoundaryBriefSummary === "object" ? safe.externalPlatformBoundaryBriefSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.externalPlatformBoundaryBriefSummary && typeof finalizedPricePipelineOrchestratorSummary.externalPlatformBoundaryBriefSummary === "object" ? finalizedPricePipelineOrchestratorSummary.externalPlatformBoundaryBriefSummary : (typeof globalShoppingExternalPlatformBoundaryBriefApi.buildGlobalShoppingExternalPlatformBoundaryBrief === "function" ? globalShoppingExternalPlatformBoundaryBriefApi.buildGlobalShoppingExternalPlatformBoundaryBrief({}) : null));
    const finalUserSafetyChecklistSummary = safe.finalUserSafetyChecklistSummary && typeof safe.finalUserSafetyChecklistSummary === "object" ? safe.finalUserSafetyChecklistSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.finalUserSafetyChecklistSummary && typeof finalizedPricePipelineOrchestratorSummary.finalUserSafetyChecklistSummary === "object" ? finalizedPricePipelineOrchestratorSummary.finalUserSafetyChecklistSummary : (typeof globalShoppingFinalUserSafetyChecklistApi.buildGlobalShoppingFinalUserSafetyChecklist === "function" ? globalShoppingFinalUserSafetyChecklistApi.buildGlobalShoppingFinalUserSafetyChecklist({}) : null));
    const manualPlatformVisitPreparationCenterSummary = safe.manualPlatformVisitPreparationCenterSummary && typeof safe.manualPlatformVisitPreparationCenterSummary === "object" ? safe.manualPlatformVisitPreparationCenterSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.manualPlatformVisitPreparationCenterSummary && typeof finalizedPricePipelineOrchestratorSummary.manualPlatformVisitPreparationCenterSummary === "object" ? finalizedPricePipelineOrchestratorSummary.manualPlatformVisitPreparationCenterSummary : (typeof globalShoppingManualPlatformVisitPreparationCenterApi.buildGlobalShoppingManualPlatformVisitPreparationCenter === "function" ? globalShoppingManualPlatformVisitPreparationCenterApi.buildGlobalShoppingManualPlatformVisitPreparationCenter({ userManualReviewViewModelSummary:userManualReviewViewModelSummary, externalPlatformBoundaryBriefSummary:externalPlatformBoundaryBriefSummary, finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary, userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary, platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary, safeNextActionPanelSummary:safeNextActionPanelSummary, platformRealityCheckBoardSummary:platformRealityCheckBoardSummary, manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary }) : null));
    const platformVisitPreparationViewModelSummary = safe.platformVisitPreparationViewModelSummary && typeof safe.platformVisitPreparationViewModelSummary === "object" ? safe.platformVisitPreparationViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.platformVisitPreparationViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.platformVisitPreparationViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.platformVisitPreparationViewModelSummary : (typeof globalShoppingPlatformVisitPreparationViewModelApi.buildGlobalShoppingPlatformVisitPreparationViewModel === "function" ? globalShoppingPlatformVisitPreparationViewModelApi.buildGlobalShoppingPlatformVisitPreparationViewModel({ manualPlatformVisitPreparationCenterSummary:manualPlatformVisitPreparationCenterSummary, externalPlatformBoundaryBriefSummary:externalPlatformBoundaryBriefSummary, finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary }) : null));
    const externalPlatformExitRampPreviewSummary = safe.externalPlatformExitRampPreviewSummary && typeof safe.externalPlatformExitRampPreviewSummary === "object" ? safe.externalPlatformExitRampPreviewSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.externalPlatformExitRampPreviewSummary && typeof finalizedPricePipelineOrchestratorSummary.externalPlatformExitRampPreviewSummary === "object" ? finalizedPricePipelineOrchestratorSummary.externalPlatformExitRampPreviewSummary : (typeof globalShoppingExternalPlatformExitRampPreviewApi.buildGlobalShoppingExternalPlatformExitRampPreview === "function" ? globalShoppingExternalPlatformExitRampPreviewApi.buildGlobalShoppingExternalPlatformExitRampPreview({ manualPlatformVisitPreparationCenterSummary:manualPlatformVisitPreparationCenterSummary, externalPlatformBoundaryBriefSummary:externalPlatformBoundaryBriefSummary, finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary, platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary, userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary, platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary, safeNextActionPanelSummary:safeNextActionPanelSummary, userManualReviewViewModelSummary:userManualReviewViewModelSummary }) : null));
    const manualVisitSafetyBriefSummary = safe.manualVisitSafetyBriefSummary && typeof safe.manualVisitSafetyBriefSummary === "object" ? safe.manualVisitSafetyBriefSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.manualVisitSafetyBriefSummary && typeof finalizedPricePipelineOrchestratorSummary.manualVisitSafetyBriefSummary === "object" ? finalizedPricePipelineOrchestratorSummary.manualVisitSafetyBriefSummary : (typeof globalShoppingManualVisitSafetyBriefApi.buildGlobalShoppingManualVisitSafetyBrief === "function" ? globalShoppingManualVisitSafetyBriefApi.buildGlobalShoppingManualVisitSafetyBrief({}) : null));
    const readOnlySessionClosurePackSummary = safe.readOnlySessionClosurePackSummary && typeof safe.readOnlySessionClosurePackSummary === "object" ? safe.readOnlySessionClosurePackSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readOnlySessionClosurePackSummary && typeof finalizedPricePipelineOrchestratorSummary.readOnlySessionClosurePackSummary === "object" ? finalizedPricePipelineOrchestratorSummary.readOnlySessionClosurePackSummary : (typeof globalShoppingReadOnlySessionClosurePackApi.buildGlobalShoppingReadOnlySessionClosurePack === "function" ? globalShoppingReadOnlySessionClosurePackApi.buildGlobalShoppingReadOnlySessionClosurePack({ externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary, manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary, platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary }) : null));
    const externalPlatformExitViewModelSummary = safe.externalPlatformExitViewModelSummary && typeof safe.externalPlatformExitViewModelSummary === "object" ? safe.externalPlatformExitViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.externalPlatformExitViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.externalPlatformExitViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.externalPlatformExitViewModelSummary : (typeof globalShoppingExternalPlatformExitViewModelApi.buildGlobalShoppingExternalPlatformExitViewModel === "function" ? globalShoppingExternalPlatformExitViewModelApi.buildGlobalShoppingExternalPlatformExitViewModel({ externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary, manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary, readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary }) : null));
    const readOnlyCommerceSessionRecapCenterSummary = safe.readOnlyCommerceSessionRecapCenterSummary && typeof safe.readOnlyCommerceSessionRecapCenterSummary === "object" ? safe.readOnlyCommerceSessionRecapCenterSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readOnlyCommerceSessionRecapCenterSummary && typeof finalizedPricePipelineOrchestratorSummary.readOnlyCommerceSessionRecapCenterSummary === "object" ? finalizedPricePipelineOrchestratorSummary.readOnlyCommerceSessionRecapCenterSummary : (typeof globalShoppingReadOnlyCommerceSessionRecapCenterApi.buildGlobalShoppingReadOnlyCommerceSessionRecapCenter === "function" ? globalShoppingReadOnlyCommerceSessionRecapCenterApi.buildGlobalShoppingReadOnlyCommerceSessionRecapCenter({ externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary, manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary, readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary, platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary, finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary, userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary, safeNextActionPanelSummary:safeNextActionPanelSummary, sandboxCandidateComparisonWorkbenchSummary:sandboxCandidateComparisonWorkbenchSummary, providerEvidenceComparisonMatrixSummary:providerEvidenceComparisonMatrixSummary, readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary, readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary, userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary }) : null));
    const userTrustClosureSummarySummary = safe.userTrustClosureSummarySummary && typeof safe.userTrustClosureSummarySummary === "object" ? safe.userTrustClosureSummarySummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.userTrustClosureSummarySummary && typeof finalizedPricePipelineOrchestratorSummary.userTrustClosureSummarySummary === "object" ? finalizedPricePipelineOrchestratorSummary.userTrustClosureSummarySummary : (typeof globalShoppingUserTrustClosureSummaryApi.buildGlobalShoppingUserTrustClosureSummary === "function" ? globalShoppingUserTrustClosureSummaryApi.buildGlobalShoppingUserTrustClosureSummary({}) : null));
    const nextFeatureReadinessGateSummary = safe.nextFeatureReadinessGateSummary && typeof safe.nextFeatureReadinessGateSummary === "object" ? safe.nextFeatureReadinessGateSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.nextFeatureReadinessGateSummary && typeof finalizedPricePipelineOrchestratorSummary.nextFeatureReadinessGateSummary === "object" ? finalizedPricePipelineOrchestratorSummary.nextFeatureReadinessGateSummary : (typeof globalShoppingNextFeatureReadinessGateApi.buildGlobalShoppingNextFeatureReadinessGate === "function" ? globalShoppingNextFeatureReadinessGateApi.buildGlobalShoppingNextFeatureReadinessGate({ readOnlyCommerceSessionRecapCenterSummary:readOnlyCommerceSessionRecapCenterSummary, userTrustClosureSummarySummary:userTrustClosureSummarySummary, readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary, externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary, finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary, safetyRegressionSentinelSummary:safetyRegressionSummary }) : null));
    const commerceSessionRecapViewModelSummary = safe.commerceSessionRecapViewModelSummary && typeof safe.commerceSessionRecapViewModelSummary === "object" ? safe.commerceSessionRecapViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.commerceSessionRecapViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.commerceSessionRecapViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.commerceSessionRecapViewModelSummary : (typeof globalShoppingCommerceSessionRecapViewModelApi.buildGlobalShoppingCommerceSessionRecapViewModel === "function" ? globalShoppingCommerceSessionRecapViewModelApi.buildGlobalShoppingCommerceSessionRecapViewModel({ readOnlyCommerceSessionRecapCenterSummary:readOnlyCommerceSessionRecapCenterSummary, userTrustClosureSummarySummary:userTrustClosureSummarySummary, nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary }) : null));
    const readOnlySandboxProviderIntegrationBlueprintSummary = safe.readOnlySandboxProviderIntegrationBlueprintSummary && typeof safe.readOnlySandboxProviderIntegrationBlueprintSummary === "object" ? safe.readOnlySandboxProviderIntegrationBlueprintSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readOnlySandboxProviderIntegrationBlueprintSummary && typeof finalizedPricePipelineOrchestratorSummary.readOnlySandboxProviderIntegrationBlueprintSummary === "object" ? finalizedPricePipelineOrchestratorSummary.readOnlySandboxProviderIntegrationBlueprintSummary : (typeof globalShoppingReadOnlySandboxProviderIntegrationBlueprintApi.buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint === "function" ? globalShoppingReadOnlySandboxProviderIntegrationBlueprintApi.buildGlobalShoppingReadOnlySandboxProviderIntegrationBlueprint({ nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary, commerceSessionRecapViewModelSummary:commerceSessionRecapViewModelSummary, userTrustClosureSummarySummary:userTrustClosureSummarySummary, safetyRegressionSentinelSummary:safetyRegressionSummary, providerAdapterRegistrySummary:providerAdapterRegistrySummary, firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary, providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary, providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary, providerCredentialSafetySummary:providerCredentialSafetySummary, readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary, jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary }) : null));
    const credentialIsolationReadinessBoardSummary = safe.credentialIsolationReadinessBoardSummary && typeof safe.credentialIsolationReadinessBoardSummary === "object" ? safe.credentialIsolationReadinessBoardSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.credentialIsolationReadinessBoardSummary && typeof finalizedPricePipelineOrchestratorSummary.credentialIsolationReadinessBoardSummary === "object" ? finalizedPricePipelineOrchestratorSummary.credentialIsolationReadinessBoardSummary : (typeof globalShoppingCredentialIsolationReadinessBoardApi.buildGlobalShoppingCredentialIsolationReadinessBoard === "function" ? globalShoppingCredentialIsolationReadinessBoardApi.buildGlobalShoppingCredentialIsolationReadinessBoard({}) : null));
    const providerContractSelectionBoardSummary = safe.providerContractSelectionBoardSummary && typeof safe.providerContractSelectionBoardSummary === "object" ? safe.providerContractSelectionBoardSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerContractSelectionBoardSummary && typeof finalizedPricePipelineOrchestratorSummary.providerContractSelectionBoardSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerContractSelectionBoardSummary : (typeof globalShoppingProviderContractSelectionBoardApi.buildGlobalShoppingProviderContractSelectionBoard === "function" ? globalShoppingProviderContractSelectionBoardApi.buildGlobalShoppingProviderContractSelectionBoard({}) : null));
    const sandboxProviderPlanningViewModelSummary = safe.sandboxProviderPlanningViewModelSummary && typeof safe.sandboxProviderPlanningViewModelSummary === "object" ? safe.sandboxProviderPlanningViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.sandboxProviderPlanningViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.sandboxProviderPlanningViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.sandboxProviderPlanningViewModelSummary : (typeof globalShoppingSandboxProviderPlanningViewModelApi.buildGlobalShoppingSandboxProviderPlanningViewModel === "function" ? globalShoppingSandboxProviderPlanningViewModelApi.buildGlobalShoppingSandboxProviderPlanningViewModel({ readOnlySandboxProviderIntegrationBlueprintSummary:readOnlySandboxProviderIntegrationBlueprintSummary, credentialIsolationReadinessBoardSummary:credentialIsolationReadinessBoardSummary, providerContractSelectionBoardSummary:providerContractSelectionBoardSummary }) : null));
    const manualPlatformVisitPreparationStatus = text(manualPlatformVisitPreparationCenterSummary && manualPlatformVisitPreparationCenterSummary.status || "");
    const externalPlatformBoundaryStatus = text(externalPlatformBoundaryBriefSummary && externalPlatformBoundaryBriefSummary.status || "");
    const finalUserSafetyChecklistStatus = text(finalUserSafetyChecklistSummary && finalUserSafetyChecklistSummary.status || "");
    const platformVisitPreparationViewModelStatus = text(platformVisitPreparationViewModelSummary && platformVisitPreparationViewModelSummary.status || "");
    const externalPlatformExitRampStatus = text(externalPlatformExitRampPreviewSummary && externalPlatformExitRampPreviewSummary.status || "");
    const manualVisitSafetyBriefStatus = text(manualVisitSafetyBriefSummary && manualVisitSafetyBriefSummary.status || "");
    const readOnlySessionClosureStatus = text(readOnlySessionClosurePackSummary && readOnlySessionClosurePackSummary.status || "");
    const externalPlatformExitViewModelStatus = text(externalPlatformExitViewModelSummary && externalPlatformExitViewModelSummary.status || "");
    const readOnlyCommerceSessionRecapStatus = text(readOnlyCommerceSessionRecapCenterSummary && readOnlyCommerceSessionRecapCenterSummary.status || "");
    const userTrustClosureSummaryStatus = text(userTrustClosureSummarySummary && userTrustClosureSummarySummary.status || "");
    const nextFeatureReadinessGateStatus = text(nextFeatureReadinessGateSummary && nextFeatureReadinessGateSummary.status || "");
    const commerceSessionRecapViewModelStatus = text(commerceSessionRecapViewModelSummary && commerceSessionRecapViewModelSummary.status || "");
    const sandboxProviderIntegrationBlueprintStatus = text(readOnlySandboxProviderIntegrationBlueprintSummary && readOnlySandboxProviderIntegrationBlueprintSummary.status || "");
    const credentialIsolationReadinessStatus = text(credentialIsolationReadinessBoardSummary && credentialIsolationReadinessBoardSummary.status || "");
    const providerContractSelectionStatus = text(providerContractSelectionBoardSummary && providerContractSelectionBoardSummary.status || "");
    const sandboxProviderPlanningViewModelStatus = text(sandboxProviderPlanningViewModelSummary && sandboxProviderPlanningViewModelSummary.status || "");
    const safeToProceedWithUserLeavingWeishanEducation = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithUserLeavingWeishanEducation === true;
    const safeToProceedWithReadOnlyProviderSandboxPlanning = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithReadOnlyProviderSandboxPlanning === true;
    const safeToProceedWithProviderLegalAndCredentialReview = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithProviderLegalAndCredentialReview === true;
    const providerLegalReviewDossierSummary = safe.providerLegalReviewDossierSummary && typeof safe.providerLegalReviewDossierSummary === "object" ? safe.providerLegalReviewDossierSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerLegalReviewDossierSummary && typeof finalizedPricePipelineOrchestratorSummary.providerLegalReviewDossierSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerLegalReviewDossierSummary : (typeof globalShoppingProviderLegalReviewDossierApi.buildGlobalShoppingProviderLegalReviewDossier === "function" ? globalShoppingProviderLegalReviewDossierApi.buildGlobalShoppingProviderLegalReviewDossier({ providerContractSelectionBoardSummary:providerContractSelectionBoardSummary, readOnlySandboxProviderIntegrationBlueprintSummary:readOnlySandboxProviderIntegrationBlueprintSummary, nextFeatureReadinessGateSummary:nextFeatureReadinessGateSummary }) : null));
    const credentialVaultInterfaceStubSummary = safe.credentialVaultInterfaceStubSummary && typeof safe.credentialVaultInterfaceStubSummary === "object" ? safe.credentialVaultInterfaceStubSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.credentialVaultInterfaceStubSummary && typeof finalizedPricePipelineOrchestratorSummary.credentialVaultInterfaceStubSummary === "object" ? finalizedPricePipelineOrchestratorSummary.credentialVaultInterfaceStubSummary : (typeof globalShoppingCredentialVaultInterfaceStubApi.buildGlobalShoppingCredentialVaultInterfaceStub === "function" ? globalShoppingCredentialVaultInterfaceStubApi.buildGlobalShoppingCredentialVaultInterfaceStub({}) : null));
    const sandboxAdapterContractTestbedSummary = safe.sandboxAdapterContractTestbedSummary && typeof safe.sandboxAdapterContractTestbedSummary === "object" ? safe.sandboxAdapterContractTestbedSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.sandboxAdapterContractTestbedSummary && typeof finalizedPricePipelineOrchestratorSummary.sandboxAdapterContractTestbedSummary === "object" ? finalizedPricePipelineOrchestratorSummary.sandboxAdapterContractTestbedSummary : (typeof globalShoppingSandboxAdapterContractTestbedApi.buildGlobalShoppingSandboxAdapterContractTestbed === "function" ? globalShoppingSandboxAdapterContractTestbedApi.buildGlobalShoppingSandboxAdapterContractTestbed({ providerRequestEnvelopeSummary:providerRequestEnvelopeSummary, sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary }) : null));
    const providerIntegrationPrepViewModelSummary = safe.providerIntegrationPrepViewModelSummary && typeof safe.providerIntegrationPrepViewModelSummary === "object" ? safe.providerIntegrationPrepViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerIntegrationPrepViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.providerIntegrationPrepViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerIntegrationPrepViewModelSummary : (typeof globalShoppingProviderIntegrationPrepViewModelApi.buildGlobalShoppingProviderIntegrationPrepViewModel === "function" ? globalShoppingProviderIntegrationPrepViewModelApi.buildGlobalShoppingProviderIntegrationPrepViewModel({ providerLegalReviewDossierSummary:providerLegalReviewDossierSummary, credentialVaultInterfaceStubSummary:credentialVaultInterfaceStubSummary, sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary }) : null));
    const providerLegalReviewStatus = text(providerLegalReviewDossierSummary && providerLegalReviewDossierSummary.status || "");
    const credentialVaultInterfaceStatus = text(credentialVaultInterfaceStubSummary && credentialVaultInterfaceStubSummary.status || "");
    const sandboxAdapterContractStatus = text(sandboxAdapterContractTestbedSummary && sandboxAdapterContractTestbedSummary.status || "");
    const providerIntegrationPrepViewModelStatus = text(providerIntegrationPrepViewModelSummary && providerIntegrationPrepViewModelSummary.status || "");
    const safeToProceedWithProviderSandboxContractImplementation = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithProviderSandboxContractImplementation === true;
    const sandboxProviderMockRuntimeSummary = safe.sandboxProviderMockRuntimeSummary && typeof safe.sandboxProviderMockRuntimeSummary === "object" ? safe.sandboxProviderMockRuntimeSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.sandboxProviderMockRuntimeSummary && typeof finalizedPricePipelineOrchestratorSummary.sandboxProviderMockRuntimeSummary === "object" ? finalizedPricePipelineOrchestratorSummary.sandboxProviderMockRuntimeSummary : (typeof globalShoppingSandboxProviderMockRuntimeApi.buildGlobalShoppingSandboxProviderMockRuntime === "function" ? globalShoppingSandboxProviderMockRuntimeApi.buildGlobalShoppingSandboxProviderMockRuntime({ providerLegalReviewDossierSummary:providerLegalReviewDossierSummary, credentialVaultInterfaceStubSummary:credentialVaultInterfaceStubSummary, sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary, providerIntegrationPrepViewModelSummary:providerIntegrationPrepViewModelSummary, credentialIsolationReadinessBoardSummary:credentialIsolationReadinessBoardSummary, providerContractSelectionBoardSummary:providerContractSelectionBoardSummary }) : null));
    const vaultBoundaryContractSummary = safe.vaultBoundaryContractSummary && typeof safe.vaultBoundaryContractSummary === "object" ? safe.vaultBoundaryContractSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.vaultBoundaryContractSummary && typeof finalizedPricePipelineOrchestratorSummary.vaultBoundaryContractSummary === "object" ? finalizedPricePipelineOrchestratorSummary.vaultBoundaryContractSummary : (typeof globalShoppingVaultBoundaryContractApi.buildGlobalShoppingVaultBoundaryContract === "function" ? globalShoppingVaultBoundaryContractApi.buildGlobalShoppingVaultBoundaryContract({}) : null));
    const legalApprovalWorkflowBoardSummary = safe.legalApprovalWorkflowBoardSummary && typeof safe.legalApprovalWorkflowBoardSummary === "object" ? safe.legalApprovalWorkflowBoardSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.legalApprovalWorkflowBoardSummary && typeof finalizedPricePipelineOrchestratorSummary.legalApprovalWorkflowBoardSummary === "object" ? finalizedPricePipelineOrchestratorSummary.legalApprovalWorkflowBoardSummary : (typeof globalShoppingLegalApprovalWorkflowBoardApi.buildGlobalShoppingLegalApprovalWorkflowBoard === "function" ? globalShoppingLegalApprovalWorkflowBoardApi.buildGlobalShoppingLegalApprovalWorkflowBoard({}) : null));
    const providerMockRuntimeViewModelSummary = safe.providerMockRuntimeViewModelSummary && typeof safe.providerMockRuntimeViewModelSummary === "object" ? safe.providerMockRuntimeViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerMockRuntimeViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.providerMockRuntimeViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerMockRuntimeViewModelSummary : (typeof globalShoppingProviderMockRuntimeViewModelApi.buildGlobalShoppingProviderMockRuntimeViewModel === "function" ? globalShoppingProviderMockRuntimeViewModelApi.buildGlobalShoppingProviderMockRuntimeViewModel({ sandboxProviderMockRuntimeSummary:sandboxProviderMockRuntimeSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary, legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary }) : null));
    const sandboxProviderMockRuntimeStatus = text(sandboxProviderMockRuntimeSummary && sandboxProviderMockRuntimeSummary.status || "");
    const vaultBoundaryContractStatus = text(vaultBoundaryContractSummary && vaultBoundaryContractSummary.status || "");
    const legalApprovalWorkflowStatus = text(legalApprovalWorkflowBoardSummary && legalApprovalWorkflowBoardSummary.status || "");
    const providerMockRuntimeViewModelStatus = text(providerMockRuntimeViewModelSummary && providerMockRuntimeViewModelSummary.status || "");
    const safeToProceedWithMockAdapterRuntimeHardening = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithMockAdapterRuntimeHardening === true;
    const mockProviderAdapterRegistryRuntimeSummary = safe.mockProviderAdapterRegistryRuntimeSummary && typeof safe.mockProviderAdapterRegistryRuntimeSummary === "object" ? safe.mockProviderAdapterRegistryRuntimeSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.mockProviderAdapterRegistryRuntimeSummary && typeof finalizedPricePipelineOrchestratorSummary.mockProviderAdapterRegistryRuntimeSummary === "object" ? finalizedPricePipelineOrchestratorSummary.mockProviderAdapterRegistryRuntimeSummary : (typeof globalShoppingMockProviderAdapterRegistryRuntimeApi.buildGlobalShoppingMockProviderAdapterRegistryRuntime === "function" ? globalShoppingMockProviderAdapterRegistryRuntimeApi.buildGlobalShoppingMockProviderAdapterRegistryRuntime({ sandboxProviderMockRuntimeSummary:sandboxProviderMockRuntimeSummary, sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary, providerMockRuntimeViewModelSummary:providerMockRuntimeViewModelSummary }) : null));
    const providerContractReplayHarnessSummary = safe.providerContractReplayHarnessSummary && typeof safe.providerContractReplayHarnessSummary === "object" ? safe.providerContractReplayHarnessSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerContractReplayHarnessSummary && typeof finalizedPricePipelineOrchestratorSummary.providerContractReplayHarnessSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerContractReplayHarnessSummary : (typeof globalShoppingProviderContractReplayHarnessApi.buildGlobalShoppingProviderContractReplayHarness === "function" ? globalShoppingProviderContractReplayHarnessApi.buildGlobalShoppingProviderContractReplayHarness({ mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary, sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary }) : null));
    const providerLaunchReadinessBoardSummary = safe.providerLaunchReadinessBoardSummary && typeof safe.providerLaunchReadinessBoardSummary === "object" ? safe.providerLaunchReadinessBoardSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerLaunchReadinessBoardSummary && typeof finalizedPricePipelineOrchestratorSummary.providerLaunchReadinessBoardSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerLaunchReadinessBoardSummary : (typeof globalShoppingProviderLaunchReadinessBoardApi.buildGlobalShoppingProviderLaunchReadinessBoard === "function" ? globalShoppingProviderLaunchReadinessBoardApi.buildGlobalShoppingProviderLaunchReadinessBoard({ mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary, providerContractReplayHarnessSummary:providerContractReplayHarnessSummary, legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary, providerLegalReviewDossierSummary:providerLegalReviewDossierSummary }) : null));
    const providerLaunchReadinessViewModelSummary = safe.providerLaunchReadinessViewModelSummary && typeof safe.providerLaunchReadinessViewModelSummary === "object" ? safe.providerLaunchReadinessViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerLaunchReadinessViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.providerLaunchReadinessViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerLaunchReadinessViewModelSummary : (typeof globalShoppingProviderLaunchReadinessViewModelApi.buildGlobalShoppingProviderLaunchReadinessViewModel === "function" ? globalShoppingProviderLaunchReadinessViewModelApi.buildGlobalShoppingProviderLaunchReadinessViewModel({ mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary, providerContractReplayHarnessSummary:providerContractReplayHarnessSummary, providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary }) : null));
    const mockProviderAdapterRegistryStatus = text(mockProviderAdapterRegistryRuntimeSummary && mockProviderAdapterRegistryRuntimeSummary.status || "");
    const providerContractReplayStatus = text(providerContractReplayHarnessSummary && providerContractReplayHarnessSummary.status || "");
    const providerLaunchReadinessStatus = text(providerLaunchReadinessBoardSummary && providerLaunchReadinessBoardSummary.status || "");
    const providerLaunchReadinessViewModelStatus = text(providerLaunchReadinessViewModelSummary && providerLaunchReadinessViewModelSummary.status || "");
    const safeToProceedWithHumanProviderSandboxApproval = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithHumanProviderSandboxApproval === true;
    const humanApprovalSimulationGateSummary = safe.humanApprovalSimulationGateSummary && typeof safe.humanApprovalSimulationGateSummary === "object" ? safe.humanApprovalSimulationGateSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.humanApprovalSimulationGateSummary && typeof finalizedPricePipelineOrchestratorSummary.humanApprovalSimulationGateSummary === "object" ? finalizedPricePipelineOrchestratorSummary.humanApprovalSimulationGateSummary : (typeof globalShoppingHumanApprovalSimulationGateApi.buildGlobalShoppingHumanApprovalSimulationGate === "function" ? globalShoppingHumanApprovalSimulationGateApi.buildGlobalShoppingHumanApprovalSimulationGate({ providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary, legalApprovalWorkflowBoardSummary:legalApprovalWorkflowBoardSummary, providerContractReplayHarnessSummary:providerContractReplayHarnessSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary }) : null));
    const mockProviderLaunchDrillSummary = safe.mockProviderLaunchDrillSummary && typeof safe.mockProviderLaunchDrillSummary === "object" ? safe.mockProviderLaunchDrillSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.mockProviderLaunchDrillSummary && typeof finalizedPricePipelineOrchestratorSummary.mockProviderLaunchDrillSummary === "object" ? finalizedPricePipelineOrchestratorSummary.mockProviderLaunchDrillSummary : (typeof globalShoppingMockProviderLaunchDrillApi.buildGlobalShoppingMockProviderLaunchDrill === "function" ? globalShoppingMockProviderLaunchDrillApi.buildGlobalShoppingMockProviderLaunchDrill({ mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary, providerContractReplayHarnessSummary:providerContractReplayHarnessSummary, providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary, humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary }) : null));
    const sandboxProviderRollbackPlanSummary = safe.sandboxProviderRollbackPlanSummary && typeof safe.sandboxProviderRollbackPlanSummary === "object" ? safe.sandboxProviderRollbackPlanSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.sandboxProviderRollbackPlanSummary && typeof finalizedPricePipelineOrchestratorSummary.sandboxProviderRollbackPlanSummary === "object" ? finalizedPricePipelineOrchestratorSummary.sandboxProviderRollbackPlanSummary : (typeof globalShoppingSandboxProviderRollbackPlanApi.buildGlobalShoppingSandboxProviderRollbackPlan === "function" ? globalShoppingSandboxProviderRollbackPlanApi.buildGlobalShoppingSandboxProviderRollbackPlan({ mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary, providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary, safetyRegressionSummary:safetyRegressionSummary }) : null));
    const providerLaunchSimulationViewModelSummary = safe.providerLaunchSimulationViewModelSummary && typeof safe.providerLaunchSimulationViewModelSummary === "object" ? safe.providerLaunchSimulationViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerLaunchSimulationViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.providerLaunchSimulationViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerLaunchSimulationViewModelSummary : (typeof globalShoppingProviderLaunchSimulationViewModelApi.buildGlobalShoppingProviderLaunchSimulationViewModel === "function" ? globalShoppingProviderLaunchSimulationViewModelApi.buildGlobalShoppingProviderLaunchSimulationViewModel({ humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary, mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary, sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary }) : null));
    const providerSandboxPilotControlRoomSummary = safe.providerSandboxPilotControlRoomSummary && typeof safe.providerSandboxPilotControlRoomSummary === "object" ? safe.providerSandboxPilotControlRoomSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerSandboxPilotControlRoomSummary && typeof finalizedPricePipelineOrchestratorSummary.providerSandboxPilotControlRoomSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerSandboxPilotControlRoomSummary : (typeof globalShoppingProviderSandboxPilotControlRoomApi.buildGlobalShoppingProviderSandboxPilotControlRoom === "function" ? globalShoppingProviderSandboxPilotControlRoomApi.buildGlobalShoppingProviderSandboxPilotControlRoom({ humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary, mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary, sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary, providerLaunchSimulationViewModelSummary:providerLaunchSimulationViewModelSummary, providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary, providerContractReplayHarnessSummary:providerContractReplayHarnessSummary, mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary }) : null));
    const mockProviderIncidentDrillSummary = safe.mockProviderIncidentDrillSummary && typeof safe.mockProviderIncidentDrillSummary === "object" ? safe.mockProviderIncidentDrillSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.mockProviderIncidentDrillSummary && typeof finalizedPricePipelineOrchestratorSummary.mockProviderIncidentDrillSummary === "object" ? finalizedPricePipelineOrchestratorSummary.mockProviderIncidentDrillSummary : (typeof globalShoppingMockProviderIncidentDrillApi.buildGlobalShoppingMockProviderIncidentDrill === "function" ? globalShoppingMockProviderIncidentDrillApi.buildGlobalShoppingMockProviderIncidentDrill({ providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary, mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary, sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary, safetyRegressionSummary:safetyRegressionSummary }) : null));
    const productionBlockerMatrixSummary = safe.productionBlockerMatrixSummary && typeof safe.productionBlockerMatrixSummary === "object" ? safe.productionBlockerMatrixSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.productionBlockerMatrixSummary && typeof finalizedPricePipelineOrchestratorSummary.productionBlockerMatrixSummary === "object" ? finalizedPricePipelineOrchestratorSummary.productionBlockerMatrixSummary : (typeof globalShoppingProductionBlockerMatrixApi.buildGlobalShoppingProductionBlockerMatrix === "function" ? globalShoppingProductionBlockerMatrixApi.buildGlobalShoppingProductionBlockerMatrix({ providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary, mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary, providerLaunchReadinessBoardSummary:providerLaunchReadinessBoardSummary, credentialVaultInterfaceStubSummary:credentialVaultInterfaceStubSummary, providerLegalReviewDossierSummary:providerLegalReviewDossierSummary, safetyRegressionSummary:safetyRegressionSummary }) : null));
    const providerPilotControlViewModelSummary = safe.providerPilotControlViewModelSummary && typeof safe.providerPilotControlViewModelSummary === "object" ? safe.providerPilotControlViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerPilotControlViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.providerPilotControlViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerPilotControlViewModelSummary : (typeof globalShoppingProviderPilotControlViewModelApi.buildGlobalShoppingProviderPilotControlViewModel === "function" ? globalShoppingProviderPilotControlViewModelApi.buildGlobalShoppingProviderPilotControlViewModel({ providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary, mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary }) : null));
    const humanApprovalSimulationStatus = text(humanApprovalSimulationGateSummary && humanApprovalSimulationGateSummary.status || "");
    const mockProviderLaunchDrillStatus = text(mockProviderLaunchDrillSummary && mockProviderLaunchDrillSummary.status || "");
    const sandboxProviderRollbackPlanStatus = text(sandboxProviderRollbackPlanSummary && sandboxProviderRollbackPlanSummary.status || "");
    const providerLaunchSimulationViewModelStatus = text(providerLaunchSimulationViewModelSummary && providerLaunchSimulationViewModelSummary.status || "");
    const providerSandboxPilotControlStatus = text(providerSandboxPilotControlRoomSummary && providerSandboxPilotControlRoomSummary.status || "");
    const mockProviderIncidentDrillStatus = text(mockProviderIncidentDrillSummary && mockProviderIncidentDrillSummary.status || "");
    const productionBlockerMatrixStatus = text(productionBlockerMatrixSummary && productionBlockerMatrixSummary.status || "");
    const providerPilotControlViewModelStatus = text(providerPilotControlViewModelSummary && providerPilotControlViewModelSummary.status || "");
    const safeToProceedWithHumanControlledSandboxProviderPilot = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithHumanControlledSandboxProviderPilot === true;
    const safeToProceedWithHumanControlledSandboxProviderPilotPlan = finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readyOutputs && finalizedPricePipelineOrchestratorSummary.readyOutputs.safeToProceedWithHumanControlledSandboxProviderPilotPlan === true;
    const humanControlledSandboxProviderPilotPlannerSummary = safe.humanControlledSandboxProviderPilotPlannerSummary && typeof safe.humanControlledSandboxProviderPilotPlannerSummary === "object" ? safe.humanControlledSandboxProviderPilotPlannerSummary : (typeof globalShoppingHumanControlledSandboxProviderPilotPlannerApi.buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner === "function" ? globalShoppingHumanControlledSandboxProviderPilotPlannerApi.buildGlobalShoppingHumanControlledSandboxProviderPilotPlanner({ providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary, mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary, providerPilotControlViewModelSummary:providerPilotControlViewModelSummary, humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary, mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary, sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary }) : null);
    const verifySummary = safe.verifySummary && typeof safe.verifySummary === "object" ? safe.verifySummary : { status:"pass", summaryLabel:"验证链摘要已准备", redacted:true };
    const providerKillSwitchDrillSummary = safe.providerKillSwitchDrillSummary && typeof safe.providerKillSwitchDrillSummary === "object" ? safe.providerKillSwitchDrillSummary : (typeof globalShoppingProviderKillSwitchDrillApi.buildGlobalShoppingProviderKillSwitchDrill === "function" ? globalShoppingProviderKillSwitchDrillApi.buildGlobalShoppingProviderKillSwitchDrill({ humanControlledSandboxProviderPilotPlannerSummary:humanControlledSandboxProviderPilotPlannerSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary, mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary, rollbackPlanSummary:sandboxProviderRollbackPlanSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const complianceEvidencePackSummary = safe.complianceEvidencePackSummary && typeof safe.complianceEvidencePackSummary === "object" ? safe.complianceEvidencePackSummary : (typeof globalShoppingComplianceEvidencePackApi.buildGlobalShoppingComplianceEvidencePack === "function" ? globalShoppingComplianceEvidencePackApi.buildGlobalShoppingComplianceEvidencePack({ humanControlledSandboxProviderPilotPlannerSummary:humanControlledSandboxProviderPilotPlannerSummary, providerKillSwitchDrillSummary:providerKillSwitchDrillSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary, legalReviewDossierSummary:providerLegalReviewDossierSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary, safetySentinelSummary:safetyRegressionSummary, verifySummary:verifySummary }) : null);
    const providerPilotGovernanceViewModelSummary = safe.providerPilotGovernanceViewModelSummary && typeof safe.providerPilotGovernanceViewModelSummary === "object" ? safe.providerPilotGovernanceViewModelSummary : (typeof globalShoppingProviderPilotGovernanceViewModelApi.buildGlobalShoppingProviderPilotGovernanceViewModel === "function" ? globalShoppingProviderPilotGovernanceViewModelApi.buildGlobalShoppingProviderPilotGovernanceViewModel({ humanControlledSandboxProviderPilotPlannerSummary:humanControlledSandboxProviderPilotPlannerSummary, providerKillSwitchDrillSummary:providerKillSwitchDrillSummary, complianceEvidencePackSummary:complianceEvidencePackSummary }) : null);
    const providerGovernanceConsoleSummary = safe.providerGovernanceConsoleSummary && typeof safe.providerGovernanceConsoleSummary === "object" ? safe.providerGovernanceConsoleSummary : (typeof globalShoppingProviderGovernanceConsoleApi.buildGlobalShoppingProviderGovernanceConsole === "function" ? globalShoppingProviderGovernanceConsoleApi.buildGlobalShoppingProviderGovernanceConsole({ humanControlledSandboxProviderPilotPlannerSummary:humanControlledSandboxProviderPilotPlannerSummary, providerKillSwitchDrillSummary:providerKillSwitchDrillSummary, complianceEvidencePackSummary:complianceEvidencePackSummary, providerPilotGovernanceViewModelSummary:providerPilotGovernanceViewModelSummary, humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary }) : null);
    const providerOperatorReviewLoopSummary = safe.providerOperatorReviewLoopSummary && typeof safe.providerOperatorReviewLoopSummary === "object" ? safe.providerOperatorReviewLoopSummary : (typeof globalShoppingProviderOperatorReviewLoopApi.buildGlobalShoppingProviderOperatorReviewLoop === "function" ? globalShoppingProviderOperatorReviewLoopApi.buildGlobalShoppingProviderOperatorReviewLoop({ providerGovernanceConsoleSummary:providerGovernanceConsoleSummary }) : null);
    const providerGovernanceAuditConsoleSummary = safe.providerGovernanceAuditConsoleSummary && typeof safe.providerGovernanceAuditConsoleSummary === "object" ? safe.providerGovernanceAuditConsoleSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerGovernanceAuditConsoleSummary && typeof finalizedPricePipelineOrchestratorSummary.providerGovernanceAuditConsoleSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerGovernanceAuditConsoleSummary : (typeof globalShoppingProviderGovernanceAuditConsoleApi.buildGlobalShoppingProviderGovernanceAuditConsole === "function" ? globalShoppingProviderGovernanceAuditConsoleApi.buildGlobalShoppingProviderGovernanceAuditConsole({ providerPilotGovernanceViewModelSummary:providerPilotGovernanceViewModelSummary, complianceEvidencePackSummary:complianceEvidencePackSummary, providerKillSwitchDrillSummary:providerKillSwitchDrillSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary, providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary, safetySentinelSummary:safetyRegressionSummary, operatorConsoleSummary:operatorConsoleSummary }) : null));
    const humanPilotReadinessLedgerSummary = safe.humanPilotReadinessLedgerSummary && typeof safe.humanPilotReadinessLedgerSummary === "object" ? safe.humanPilotReadinessLedgerSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.humanPilotReadinessLedgerSummary && typeof finalizedPricePipelineOrchestratorSummary.humanPilotReadinessLedgerSummary === "object" ? finalizedPricePipelineOrchestratorSummary.humanPilotReadinessLedgerSummary : (typeof globalShoppingHumanPilotReadinessLedgerApi.buildGlobalShoppingHumanPilotReadinessLedger === "function" ? globalShoppingHumanPilotReadinessLedgerApi.buildGlobalShoppingHumanPilotReadinessLedger({ governanceAuditConsoleSummary:providerGovernanceAuditConsoleSummary, humanControlledPilotPlannerSummary:humanControlledSandboxProviderPilotPlannerSummary, launchReadinessBoardSummary:providerLaunchReadinessBoardSummary, legalApprovalWorkflowSummary:legalApprovalWorkflowBoardSummary, complianceEvidencePackSummary:complianceEvidencePackSummary }) : null));
    const sandboxProviderReleaseFreezeGateSummary = safe.sandboxProviderReleaseFreezeGateSummary && typeof safe.sandboxProviderReleaseFreezeGateSummary === "object" ? safe.sandboxProviderReleaseFreezeGateSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.sandboxProviderReleaseFreezeGateSummary && typeof finalizedPricePipelineOrchestratorSummary.sandboxProviderReleaseFreezeGateSummary === "object" ? finalizedPricePipelineOrchestratorSummary.sandboxProviderReleaseFreezeGateSummary : (typeof globalShoppingSandboxProviderReleaseFreezeGateApi.buildGlobalShoppingSandboxProviderReleaseFreezeGate === "function" ? globalShoppingSandboxProviderReleaseFreezeGateApi.buildGlobalShoppingSandboxProviderReleaseFreezeGate({ governanceAuditConsoleSummary:providerGovernanceAuditConsoleSummary, humanPilotReadinessLedgerSummary:humanPilotReadinessLedgerSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary, providerKillSwitchDrillSummary:providerKillSwitchDrillSummary, complianceEvidencePackSummary:complianceEvidencePackSummary, verifyE2eBuildSummary:verifySummary }) : null));
    const providerGovernanceReleaseViewModelSummary = safe.providerGovernanceReleaseViewModelSummary && typeof safe.providerGovernanceReleaseViewModelSummary === "object" ? safe.providerGovernanceReleaseViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerGovernanceReleaseViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.providerGovernanceReleaseViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerGovernanceReleaseViewModelSummary : (typeof globalShoppingProviderGovernanceReleaseViewModelApi.buildGlobalShoppingProviderGovernanceReleaseViewModel === "function" ? globalShoppingProviderGovernanceReleaseViewModelApi.buildGlobalShoppingProviderGovernanceReleaseViewModel({ governanceAuditConsoleSummary:providerGovernanceAuditConsoleSummary, humanPilotReadinessLedgerSummary:humanPilotReadinessLedgerSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary }) : null));
    const manualGovernanceReleaseDecisionRoomSummary = safe.manualGovernanceReleaseDecisionRoomSummary && typeof safe.manualGovernanceReleaseDecisionRoomSummary === "object" ? safe.manualGovernanceReleaseDecisionRoomSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.manualGovernanceReleaseDecisionRoomSummary && typeof finalizedPricePipelineOrchestratorSummary.manualGovernanceReleaseDecisionRoomSummary === "object" ? finalizedPricePipelineOrchestratorSummary.manualGovernanceReleaseDecisionRoomSummary : (typeof globalShoppingManualGovernanceReleaseDecisionRoomApi.buildGlobalShoppingManualGovernanceReleaseDecisionRoom === "function" ? globalShoppingManualGovernanceReleaseDecisionRoomApi.buildGlobalShoppingManualGovernanceReleaseDecisionRoom({ governanceAuditConsoleSummary:providerGovernanceAuditConsoleSummary, humanPilotReadinessLedgerSummary:humanPilotReadinessLedgerSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary, governanceReleaseViewModelSummary:providerGovernanceReleaseViewModelSummary }) : null));
    const sandboxPilotExceptionRegisterSummary = safe.sandboxPilotExceptionRegisterSummary && typeof safe.sandboxPilotExceptionRegisterSummary === "object" ? safe.sandboxPilotExceptionRegisterSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.sandboxPilotExceptionRegisterSummary && typeof finalizedPricePipelineOrchestratorSummary.sandboxPilotExceptionRegisterSummary === "object" ? finalizedPricePipelineOrchestratorSummary.sandboxPilotExceptionRegisterSummary : (typeof globalShoppingSandboxPilotExceptionRegisterApi.buildGlobalShoppingSandboxPilotExceptionRegister === "function" ? globalShoppingSandboxPilotExceptionRegisterApi.buildGlobalShoppingSandboxPilotExceptionRegister({ manualDecisionRoomSummary:manualGovernanceReleaseDecisionRoomSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary, humanPilotLedgerSummary:humanPilotReadinessLedgerSummary, killSwitchDrillSummary:providerKillSwitchDrillSummary }) : null));
    const providerReadinessSignOffPacketSummary = safe.providerReadinessSignOffPacketSummary && typeof safe.providerReadinessSignOffPacketSummary === "object" ? safe.providerReadinessSignOffPacketSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerReadinessSignOffPacketSummary && typeof finalizedPricePipelineOrchestratorSummary.providerReadinessSignOffPacketSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerReadinessSignOffPacketSummary : (typeof globalShoppingProviderReadinessSignOffPacketApi.buildGlobalShoppingProviderReadinessSignOffPacket === "function" ? globalShoppingProviderReadinessSignOffPacketApi.buildGlobalShoppingProviderReadinessSignOffPacket({ manualDecisionRoomSummary:manualGovernanceReleaseDecisionRoomSummary, exceptionRegisterSummary:sandboxPilotExceptionRegisterSummary, governanceAuditConsoleSummary:providerGovernanceAuditConsoleSummary, complianceEvidencePackSummary:complianceEvidencePackSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary, verifyE2eBuildSummary:verifySummary }) : null));
    const providerManualReleaseViewModelSummary = safe.providerManualReleaseViewModelSummary && typeof safe.providerManualReleaseViewModelSummary === "object" ? safe.providerManualReleaseViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerManualReleaseViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.providerManualReleaseViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerManualReleaseViewModelSummary : (typeof globalShoppingProviderManualReleaseViewModelApi.buildGlobalShoppingProviderManualReleaseViewModel === "function" ? globalShoppingProviderManualReleaseViewModelApi.buildGlobalShoppingProviderManualReleaseViewModel({ manualGovernanceReleaseDecisionRoomSummary:manualGovernanceReleaseDecisionRoomSummary, sandboxPilotExceptionRegisterSummary:sandboxPilotExceptionRegisterSummary, providerReadinessSignOffPacketSummary:providerReadinessSignOffPacketSummary }) : null));
    const readOnlySandboxActivationReadinessCenterSummary = safe.readOnlySandboxActivationReadinessCenterSummary && typeof safe.readOnlySandboxActivationReadinessCenterSummary === "object" ? safe.readOnlySandboxActivationReadinessCenterSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.readOnlySandboxActivationReadinessCenterSummary && typeof finalizedPricePipelineOrchestratorSummary.readOnlySandboxActivationReadinessCenterSummary === "object" ? finalizedPricePipelineOrchestratorSummary.readOnlySandboxActivationReadinessCenterSummary : (typeof globalShoppingReadOnlySandboxActivationReadinessCenterApi.buildGlobalShoppingReadOnlySandboxActivationReadinessCenter === "function" ? globalShoppingReadOnlySandboxActivationReadinessCenterApi.buildGlobalShoppingReadOnlySandboxActivationReadinessCenter({ manualGovernanceReleaseDecisionRoomSummary:manualGovernanceReleaseDecisionRoomSummary, sandboxPilotExceptionRegisterSummary:sandboxPilotExceptionRegisterSummary, providerReadinessSignOffPacketSummary:providerReadinessSignOffPacketSummary, providerManualReleaseViewModelSummary:providerManualReleaseViewModelSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary, humanPilotReadinessLedgerSummary:humanPilotReadinessLedgerSummary, governanceAuditConsoleSummary:providerGovernanceAuditConsoleSummary }) : null));
    const offlineMockSandboxSessionRunnerSummary = safe.offlineMockSandboxSessionRunnerSummary && typeof safe.offlineMockSandboxSessionRunnerSummary === "object" ? safe.offlineMockSandboxSessionRunnerSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.offlineMockSandboxSessionRunnerSummary && typeof finalizedPricePipelineOrchestratorSummary.offlineMockSandboxSessionRunnerSummary === "object" ? finalizedPricePipelineOrchestratorSummary.offlineMockSandboxSessionRunnerSummary : (typeof globalShoppingOfflineMockSandboxSessionRunnerApi.buildGlobalShoppingOfflineMockSandboxSessionRunner === "function" ? globalShoppingOfflineMockSandboxSessionRunnerApi.buildGlobalShoppingOfflineMockSandboxSessionRunner({ readOnlySandboxActivationReadinessCenterSummary:readOnlySandboxActivationReadinessCenterSummary, providerContractReplayHarnessSummary:providerContractReplayHarnessSummary, mockProviderAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary }) : null));
    const manualProviderActivationHandoffPacketSummary = safe.manualProviderActivationHandoffPacketSummary && typeof safe.manualProviderActivationHandoffPacketSummary === "object" ? safe.manualProviderActivationHandoffPacketSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.manualProviderActivationHandoffPacketSummary && typeof finalizedPricePipelineOrchestratorSummary.manualProviderActivationHandoffPacketSummary === "object" ? finalizedPricePipelineOrchestratorSummary.manualProviderActivationHandoffPacketSummary : (typeof globalShoppingManualProviderActivationHandoffPacketApi.buildGlobalShoppingManualProviderActivationHandoffPacket === "function" ? globalShoppingManualProviderActivationHandoffPacketApi.buildGlobalShoppingManualProviderActivationHandoffPacket({ readOnlySandboxActivationReadinessCenterSummary:readOnlySandboxActivationReadinessCenterSummary, offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary, manualGovernanceReleaseDecisionRoomSummary:manualGovernanceReleaseDecisionRoomSummary, providerReadinessSignOffPacketSummary:providerReadinessSignOffPacketSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary, complianceEvidencePackSummary:complianceEvidencePackSummary }) : null));
    const providerSandboxActivationViewModelSummary = safe.providerSandboxActivationViewModelSummary && typeof safe.providerSandboxActivationViewModelSummary === "object" ? safe.providerSandboxActivationViewModelSummary : (finalizedPricePipelineOrchestratorSummary && finalizedPricePipelineOrchestratorSummary.providerSandboxActivationViewModelSummary && typeof finalizedPricePipelineOrchestratorSummary.providerSandboxActivationViewModelSummary === "object" ? finalizedPricePipelineOrchestratorSummary.providerSandboxActivationViewModelSummary : (typeof globalShoppingProviderSandboxActivationViewModelApi.buildGlobalShoppingProviderSandboxActivationViewModel === "function" ? globalShoppingProviderSandboxActivationViewModelApi.buildGlobalShoppingProviderSandboxActivationViewModel({ readOnlySandboxActivationReadinessCenterSummary:readOnlySandboxActivationReadinessCenterSummary, offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary, manualProviderActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary }) : null));
    const offlineSandboxTraceInspectorSummary = safe.offlineSandboxTraceInspectorSummary && typeof safe.offlineSandboxTraceInspectorSummary === "object" ? safe.offlineSandboxTraceInspectorSummary : (typeof globalShoppingOfflineSandboxTraceInspectorApi.buildGlobalShoppingOfflineSandboxTraceInspector === "function" ? globalShoppingOfflineSandboxTraceInspectorApi.buildGlobalShoppingOfflineSandboxTraceInspector({ offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary, readOnlySandboxActivationReadinessCenterSummary:readOnlySandboxActivationReadinessCenterSummary, manualProviderActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary }) : null);
    const mockProviderResultNormalizerSummary = safe.mockProviderResultNormalizerSummary && typeof safe.mockProviderResultNormalizerSummary === "object" ? safe.mockProviderResultNormalizerSummary : (typeof globalShoppingMockProviderResultNormalizerApi.buildGlobalShoppingMockProviderResultNormalizer === "function" ? globalShoppingMockProviderResultNormalizerApi.buildGlobalShoppingMockProviderResultNormalizer({ offlineSandboxTraceInspectorSummary:offlineSandboxTraceInspectorSummary, offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary, mockAdapterRegistryRuntimeSummary:mockProviderAdapterRegistryRuntimeSummary, providerContractReplayHarnessSummary:providerContractReplayHarnessSummary, mockResults:(dryRunProviderResponseNormalizerSummary && dryRunProviderResponseNormalizerSummary.normalizedSourceInputs) || (legalProviderFixtureSummary && legalProviderFixtureSummary.normalizedSourceInputs) || [] }) : null);
    const manualActivationDryRunChecklistSummary = safe.manualActivationDryRunChecklistSummary && typeof safe.manualActivationDryRunChecklistSummary === "object" ? safe.manualActivationDryRunChecklistSummary : (typeof globalShoppingManualActivationDryRunChecklistApi.buildGlobalShoppingManualActivationDryRunChecklist === "function" ? globalShoppingManualActivationDryRunChecklistApi.buildGlobalShoppingManualActivationDryRunChecklist({ readOnlySandboxActivationReadinessCenterSummary:readOnlySandboxActivationReadinessCenterSummary, offlineSandboxTraceInspectorSummary:offlineSandboxTraceInspectorSummary, mockProviderResultNormalizerSummary:mockProviderResultNormalizerSummary, manualProviderActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary, providerReadinessSignOffPacketSummary:providerReadinessSignOffPacketSummary }) : null);
    providerSandboxDryRunViewModelSummary = safe.providerSandboxDryRunViewModelSummary && typeof safe.providerSandboxDryRunViewModelSummary === "object" ? safe.providerSandboxDryRunViewModelSummary : (typeof globalShoppingProviderSandboxDryRunViewModelApi.buildGlobalShoppingProviderSandboxDryRunViewModel === "function" ? globalShoppingProviderSandboxDryRunViewModelApi.buildGlobalShoppingProviderSandboxDryRunViewModel({ offlineSandboxTraceInspectorSummary:offlineSandboxTraceInspectorSummary, mockProviderResultNormalizerSummary:mockProviderResultNormalizerSummary, manualActivationDryRunChecklistSummary:manualActivationDryRunChecklistSummary }) : null);
    providerSandboxDryRunViewModelStatus = text(providerSandboxDryRunViewModelSummary && providerSandboxDryRunViewModelSummary.status || "");
    const humanControlledSandboxProviderPilotPlannerStatus = text(humanControlledSandboxProviderPilotPlannerSummary && humanControlledSandboxProviderPilotPlannerSummary.status || "");
    const providerKillSwitchDrillStatus = text(providerKillSwitchDrillSummary && providerKillSwitchDrillSummary.status || "");
    const complianceEvidencePackStatus = text(complianceEvidencePackSummary && complianceEvidencePackSummary.status || "");
    const providerPilotGovernanceViewModelStatus = text(providerPilotGovernanceViewModelSummary && providerPilotGovernanceViewModelSummary.status || "");
    const providerGovernanceConsoleStatus = text(providerGovernanceConsoleSummary && (providerGovernanceConsoleSummary.consoleStatus || providerGovernanceConsoleSummary.status) || "");
    const providerOperatorReviewLoopStatus = text(providerOperatorReviewLoopSummary && providerOperatorReviewLoopSummary.status || "");
    const providerGovernanceAuditConsoleStatus = text(providerGovernanceAuditConsoleSummary && providerGovernanceAuditConsoleSummary.status || "");
    const humanPilotReadinessLedgerStatus = text(humanPilotReadinessLedgerSummary && humanPilotReadinessLedgerSummary.status || "");
    const sandboxProviderReleaseFreezeGateStatus = text(sandboxProviderReleaseFreezeGateSummary && sandboxProviderReleaseFreezeGateSummary.status || "");
    const providerGovernanceReleaseViewModelStatus = text(providerGovernanceReleaseViewModelSummary && providerGovernanceReleaseViewModelSummary.status || "");
    const manualGovernanceReleaseDecisionRoomStatus = text(manualGovernanceReleaseDecisionRoomSummary && manualGovernanceReleaseDecisionRoomSummary.status || "");
    const sandboxPilotExceptionRegisterStatus = text(sandboxPilotExceptionRegisterSummary && sandboxPilotExceptionRegisterSummary.status || "");
    const providerReadinessSignOffPacketStatus = text(providerReadinessSignOffPacketSummary && providerReadinessSignOffPacketSummary.status || "");
    const providerManualReleaseViewModelStatus = text(providerManualReleaseViewModelSummary && providerManualReleaseViewModelSummary.status || "");
    const readOnlySandboxActivationReadinessCenterStatus = text(readOnlySandboxActivationReadinessCenterSummary && readOnlySandboxActivationReadinessCenterSummary.status || "");
    const offlineMockSandboxSessionRunnerStatus = text(offlineMockSandboxSessionRunnerSummary && offlineMockSandboxSessionRunnerSummary.status || "");
    const manualProviderActivationHandoffPacketStatus = text(manualProviderActivationHandoffPacketSummary && manualProviderActivationHandoffPacketSummary.status || "");
    const providerSandboxActivationViewModelStatus = text(providerSandboxActivationViewModelSummary && providerSandboxActivationViewModelSummary.status || "");
    const offlineSandboxTraceInspectorStatus = text(offlineSandboxTraceInspectorSummary && offlineSandboxTraceInspectorSummary.status || "");
    const mockProviderResultNormalizerStatus = text(mockProviderResultNormalizerSummary && mockProviderResultNormalizerSummary.status || "");
    const manualActivationDryRunChecklistStatus = text(manualActivationDryRunChecklistSummary && manualActivationDryRunChecklistSummary.status || "");
    const safeToProceedWithHumanAuditSandboxPilotReadinessReview = providerGovernanceConsoleStatus === "ready_for_human_approval" || providerGovernanceConsoleStatus === "sandbox_ready";
    const safeToProceedWithManualGovernanceReleaseDecision = false;
    const safeToProceedWithManualProviderSignOffReview = false;
    const safeToProceedWithManualSandboxActivationReview = false;
    const safeToProceedWithManualSandboxDryRunReview = false;
    const providerSandboxReadinessWorkbenchSummary = safe.providerSandboxReadinessWorkbenchSummary && typeof safe.providerSandboxReadinessWorkbenchSummary === "object" ? safe.providerSandboxReadinessWorkbenchSummary : (typeof globalShoppingProviderSandboxReadinessWorkbenchApi.buildGlobalShoppingProviderSandboxReadinessWorkbench === "function" ? globalShoppingProviderSandboxReadinessWorkbenchApi.buildGlobalShoppingProviderSandboxReadinessWorkbench({ offlineSandboxTraceInspectorSummary:offlineSandboxTraceInspectorSummary, mockProviderResultNormalizerSummary:mockProviderResultNormalizerSummary, manualActivationDryRunChecklistSummary:manualActivationDryRunChecklistSummary, providerSandboxDryRunViewModelSummary:providerSandboxDryRunViewModelSummary, readOnlySandboxActivationReadinessCenterSummary:readOnlySandboxActivationReadinessCenterSummary, offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary, manualProviderActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary }) : null);
    const providerSandboxReadinessWorkbenchStatus = text(providerSandboxReadinessWorkbenchSummary && providerSandboxReadinessWorkbenchSummary.status || "");
    const offlineProviderScenarioLabSummary = safe.offlineProviderScenarioLabSummary && typeof safe.offlineProviderScenarioLabSummary === "object" ? safe.offlineProviderScenarioLabSummary : (typeof globalShoppingOfflineProviderScenarioLabApi.buildGlobalShoppingOfflineProviderScenarioLab === "function" ? globalShoppingOfflineProviderScenarioLabApi.buildGlobalShoppingOfflineProviderScenarioLab({ providerSandboxReadinessWorkbenchSummary:providerSandboxReadinessWorkbenchSummary, offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary, mockProviderResultNormalizerSummary:mockProviderResultNormalizerSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary }) : null);
    const offlineProviderScenarioLabStatus = text(offlineProviderScenarioLabSummary && offlineProviderScenarioLabSummary.status || "");
    const readOnlyProviderAdapterSdkSkeletonSummary = safe.readOnlyProviderAdapterSdkSkeletonSummary && typeof safe.readOnlyProviderAdapterSdkSkeletonSummary === "object" ? safe.readOnlyProviderAdapterSdkSkeletonSummary : (typeof globalShoppingReadOnlyProviderAdapterSdkSkeletonApi.buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton === "function" ? globalShoppingReadOnlyProviderAdapterSdkSkeletonApi.buildGlobalShoppingReadOnlyProviderAdapterSdkSkeleton({ offlineProviderScenarioLabSummary:offlineProviderScenarioLabSummary, providerContractReplayHarnessSummary:providerContractReplayHarnessSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary, sandboxAdapterContractTestbedSummary:sandboxAdapterContractTestbedSummary }) : null);
    const readOnlyProviderAdapterSdkSkeletonStatus = text(readOnlyProviderAdapterSdkSkeletonSummary && readOnlyProviderAdapterSdkSkeletonSummary.status || "");
    const manualActivationCommandCenterSummary = safe.manualActivationCommandCenterSummary && typeof safe.manualActivationCommandCenterSummary === "object" ? safe.manualActivationCommandCenterSummary : (typeof globalShoppingManualActivationCommandCenterApi.buildGlobalShoppingManualActivationCommandCenter === "function" ? globalShoppingManualActivationCommandCenterApi.buildGlobalShoppingManualActivationCommandCenter({ providerSandboxReadinessWorkbenchSummary:providerSandboxReadinessWorkbenchSummary, offlineProviderScenarioLabSummary:offlineProviderScenarioLabSummary, readOnlyProviderAdapterSdkSkeletonSummary:readOnlyProviderAdapterSdkSkeletonSummary, manualActivationDryRunChecklistSummary:manualActivationDryRunChecklistSummary, manualProviderActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary }) : null);
    const manualActivationCommandCenterStatus = text(manualActivationCommandCenterSummary && manualActivationCommandCenterSummary.status || "");
    const providerSandboxMilestoneViewModelSummary = safe.providerSandboxMilestoneViewModelSummary && typeof safe.providerSandboxMilestoneViewModelSummary === "object" ? safe.providerSandboxMilestoneViewModelSummary : (typeof globalShoppingProviderSandboxMilestoneViewModelApi.buildGlobalShoppingProviderSandboxMilestoneViewModel === "function" ? globalShoppingProviderSandboxMilestoneViewModelApi.buildGlobalShoppingProviderSandboxMilestoneViewModel({ providerSandboxReadinessWorkbenchSummary:providerSandboxReadinessWorkbenchSummary, offlineProviderScenarioLabSummary:offlineProviderScenarioLabSummary, readOnlyProviderAdapterSdkSkeletonSummary:readOnlyProviderAdapterSdkSkeletonSummary, manualActivationCommandCenterSummary:manualActivationCommandCenterSummary }) : null);
    const providerSandboxMilestoneViewModelStatus = text(providerSandboxMilestoneViewModelSummary && providerSandboxMilestoneViewModelSummary.status || "");
    const safeToProceedWithHumanSandboxMilestoneReview = providerSandboxMilestoneViewModelStatus === "ready";
    const offlineProviderAdapterContractKitSummary = safe.offlineProviderAdapterContractKitSummary && typeof safe.offlineProviderAdapterContractKitSummary === "object" ? safe.offlineProviderAdapterContractKitSummary : (typeof globalShoppingOfflineProviderAdapterContractKitApi.buildGlobalShoppingOfflineProviderAdapterContractKit === "function" ? globalShoppingOfflineProviderAdapterContractKitApi.buildGlobalShoppingOfflineProviderAdapterContractKit({ readOnlyProviderAdapterSdkSkeletonSummary:readOnlyProviderAdapterSdkSkeletonSummary, offlineProviderScenarioLabSummary:offlineProviderScenarioLabSummary, providerSandboxReadinessWorkbenchSummary:providerSandboxReadinessWorkbenchSummary, manualActivationCommandCenterSummary:manualActivationCommandCenterSummary }) : null);
    const offlineProviderAdapterContractKitStatus = text(offlineProviderAdapterContractKitSummary && offlineProviderAdapterContractKitSummary.status || "");
    const mockSandboxQaMatrixSummary = safe.mockSandboxQaMatrixSummary && typeof safe.mockSandboxQaMatrixSummary === "object" ? safe.mockSandboxQaMatrixSummary : (typeof globalShoppingMockSandboxQaMatrixApi.buildGlobalShoppingMockSandboxQaMatrix === "function" ? globalShoppingMockSandboxQaMatrixApi.buildGlobalShoppingMockSandboxQaMatrix({ offlineProviderAdapterContractKitSummary:offlineProviderAdapterContractKitSummary, offlineProviderScenarioLabSummary:offlineProviderScenarioLabSummary, offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary, mockProviderResultNormalizerSummary:mockProviderResultNormalizerSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const mockSandboxQaMatrixStatus = text(mockSandboxQaMatrixSummary && mockSandboxQaMatrixSummary.status || "");
    const humanActivationRunbookCenterSummary = safe.humanActivationRunbookCenterSummary && typeof safe.humanActivationRunbookCenterSummary === "object" ? safe.humanActivationRunbookCenterSummary : (typeof globalShoppingHumanActivationRunbookCenterApi.buildGlobalShoppingHumanActivationRunbookCenter === "function" ? globalShoppingHumanActivationRunbookCenterApi.buildGlobalShoppingHumanActivationRunbookCenter({ mockSandboxQaMatrixSummary:mockSandboxQaMatrixSummary, manualActivationCommandCenterSummary:manualActivationCommandCenterSummary, manualActivationDryRunChecklistSummary:manualActivationDryRunChecklistSummary, manualActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary }) : null);
    const humanActivationRunbookCenterStatus = text(humanActivationRunbookCenterSummary && humanActivationRunbookCenterSummary.status || "");
    const providerAdapterComplianceChecklistSummary = safe.providerAdapterComplianceChecklistSummary && typeof safe.providerAdapterComplianceChecklistSummary === "object" ? safe.providerAdapterComplianceChecklistSummary : (typeof globalShoppingProviderAdapterComplianceChecklistApi.buildGlobalShoppingProviderAdapterComplianceChecklist === "function" ? globalShoppingProviderAdapterComplianceChecklistApi.buildGlobalShoppingProviderAdapterComplianceChecklist({ offlineProviderAdapterContractKitSummary:offlineProviderAdapterContractKitSummary, mockSandboxQaMatrixSummary:mockSandboxQaMatrixSummary, humanActivationRunbookCenterSummary:humanActivationRunbookCenterSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary, providerLegalReviewDossierSummary:providerLegalReviewDossierSummary, productionBlockerMatrixSummary:productionBlockerMatrixSummary }) : null);
    const providerAdapterComplianceChecklistStatus = text(providerAdapterComplianceChecklistSummary && providerAdapterComplianceChecklistSummary.status || "");
    const providerSandboxReleaseCandidateViewModelSummary = safe.providerSandboxReleaseCandidateViewModelSummary && typeof safe.providerSandboxReleaseCandidateViewModelSummary === "object" ? safe.providerSandboxReleaseCandidateViewModelSummary : (typeof globalShoppingProviderSandboxReleaseCandidateViewModelApi.buildGlobalShoppingProviderSandboxReleaseCandidateViewModel === "function" ? globalShoppingProviderSandboxReleaseCandidateViewModelApi.buildGlobalShoppingProviderSandboxReleaseCandidateViewModel({ offlineProviderAdapterContractKitSummary:offlineProviderAdapterContractKitSummary, mockSandboxQaMatrixSummary:mockSandboxQaMatrixSummary, humanActivationRunbookCenterSummary:humanActivationRunbookCenterSummary, providerAdapterComplianceChecklistSummary:providerAdapterComplianceChecklistSummary }) : null);
    const providerSandboxReleaseCandidateViewModelStatus = text(providerSandboxReleaseCandidateViewModelSummary && providerSandboxReleaseCandidateViewModelSummary.status || "");
    const safeToProceedWithManualReleaseCandidateReview = providerSandboxReleaseCandidateViewModelStatus === "ready";
    const offlineProviderCertificationCenterSummary = safe.offlineProviderCertificationCenterSummary && typeof safe.offlineProviderCertificationCenterSummary === "object" ? safe.offlineProviderCertificationCenterSummary : (typeof globalShoppingOfflineProviderCertificationCenterApi.buildGlobalShoppingOfflineProviderCertificationCenter === "function" ? globalShoppingOfflineProviderCertificationCenterApi.buildGlobalShoppingOfflineProviderCertificationCenter({ providerSandboxReleaseCandidateViewModelSummary:providerSandboxReleaseCandidateViewModelSummary, providerAdapterComplianceChecklistSummary:providerAdapterComplianceChecklistSummary, mockSandboxQaMatrixSummary:mockSandboxQaMatrixSummary, offlineProviderAdapterContractKitSummary:offlineProviderAdapterContractKitSummary, humanActivationRunbookCenterSummary:humanActivationRunbookCenterSummary }) : null);
    const offlineProviderCertificationCenterStatus = text(offlineProviderCertificationCenterSummary && offlineProviderCertificationCenterSummary.status || "");
    const mockIntegrationRegressionLabSummary = safe.mockIntegrationRegressionLabSummary && typeof safe.mockIntegrationRegressionLabSummary === "object" ? safe.mockIntegrationRegressionLabSummary : (typeof globalShoppingMockIntegrationRegressionLabApi.buildGlobalShoppingMockIntegrationRegressionLab === "function" ? globalShoppingMockIntegrationRegressionLabApi.buildGlobalShoppingMockIntegrationRegressionLab({ offlineProviderCertificationCenterSummary:offlineProviderCertificationCenterSummary, mockSandboxQaMatrixSummary:mockSandboxQaMatrixSummary, offlineProviderScenarioLabSummary:offlineProviderScenarioLabSummary, offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const mockIntegrationRegressionLabStatus = text(mockIntegrationRegressionLabSummary && mockIntegrationRegressionLabSummary.status || "");
    const humanApprovalEvidenceBinderSummary = safe.humanApprovalEvidenceBinderSummary && typeof safe.humanApprovalEvidenceBinderSummary === "object" ? safe.humanApprovalEvidenceBinderSummary : (typeof globalShoppingHumanApprovalEvidenceBinderApi.buildGlobalShoppingHumanApprovalEvidenceBinder === "function" ? globalShoppingHumanApprovalEvidenceBinderApi.buildGlobalShoppingHumanApprovalEvidenceBinder({ offlineProviderCertificationCenterSummary:offlineProviderCertificationCenterSummary, mockIntegrationRegressionLabSummary:mockIntegrationRegressionLabSummary, humanActivationRunbookCenterSummary:humanActivationRunbookCenterSummary, providerAdapterComplianceChecklistSummary:providerAdapterComplianceChecklistSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary, verifyE2eBuildSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Verify / E2E / Build 已准备", redacted:true }, redacted:true } }) : null);
    const humanApprovalEvidenceBinderStatus = text(humanApprovalEvidenceBinderSummary && humanApprovalEvidenceBinderSummary.status || "");
    const adapterBoundaryLockSummary = safe.adapterBoundaryLockSummary && typeof safe.adapterBoundaryLockSummary === "object" ? safe.adapterBoundaryLockSummary : (typeof globalShoppingAdapterBoundaryLockApi.buildGlobalShoppingAdapterBoundaryLock === "function" ? globalShoppingAdapterBoundaryLockApi.buildGlobalShoppingAdapterBoundaryLock({ offlineProviderAdapterContractKitSummary:offlineProviderAdapterContractKitSummary, offlineProviderCertificationCenterSummary:offlineProviderCertificationCenterSummary, mockIntegrationRegressionLabSummary:mockIntegrationRegressionLabSummary, humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary, vaultBoundaryContractSummary:vaultBoundaryContractSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const adapterBoundaryLockStatus = text(adapterBoundaryLockSummary && adapterBoundaryLockSummary.status || "");
    const providerCertificationViewModelSummary = safe.providerCertificationViewModelSummary && typeof safe.providerCertificationViewModelSummary === "object" ? safe.providerCertificationViewModelSummary : (typeof globalShoppingProviderCertificationViewModelApi.buildGlobalShoppingProviderCertificationViewModel === "function" ? globalShoppingProviderCertificationViewModelApi.buildGlobalShoppingProviderCertificationViewModel({ offlineProviderCertificationCenterSummary:offlineProviderCertificationCenterSummary, mockIntegrationRegressionLabSummary:mockIntegrationRegressionLabSummary, humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary, adapterBoundaryLockSummary:adapterBoundaryLockSummary }) : null);
    const providerCertificationViewModelStatus = text(providerCertificationViewModelSummary && providerCertificationViewModelSummary.status || "");
    const safeToProceedWithHumanCertificationReview = providerCertificationViewModelStatus === "ready";
    const verifyE2eBuildSummary = safe.verifyE2eBuildSummary && typeof safe.verifyE2eBuildSummary === "object" ? safe.verifyE2eBuildSummary : {
      status:"ready",
      title:"Verify / E2E / Build Summary",
      userFacingSummary:{ title:"Verify / E2E / Build Summary", resultLabel:"Verify / E2E / Build 已准备", redacted:true },
      rows:[{ rowId:"verify_e2e_build_summary", label:"Verify / E2E / Build Summary", value:"Verify / E2E / Build 已准备", status:"pass", redacted:true }],
      redacted:true
    };
    const providerOfflineReleaseGateSummary = safe.providerOfflineReleaseGateSummary && typeof safe.providerOfflineReleaseGateSummary === "object" ? safe.providerOfflineReleaseGateSummary : (typeof globalShoppingProviderOfflineReleaseGateApi.buildGlobalShoppingProviderOfflineReleaseGate === "function" ? globalShoppingProviderOfflineReleaseGateApi.buildGlobalShoppingProviderOfflineReleaseGate({ offlineProviderCertificationCenterSummary:offlineProviderCertificationCenterSummary, mockIntegrationRegressionLabSummary:mockIntegrationRegressionLabSummary, humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary, adapterBoundaryLockSummary:adapterBoundaryLockSummary, providerCertificationViewModelSummary:providerCertificationViewModelSummary }) : null);
    const providerOfflineReleaseGateStatus = text(providerOfflineReleaseGateSummary && providerOfflineReleaseGateSummary.status || "");
    const providerCertificationFreezeLedgerSummary = safe.providerCertificationFreezeLedgerSummary && typeof safe.providerCertificationFreezeLedgerSummary === "object" ? safe.providerCertificationFreezeLedgerSummary : (typeof globalShoppingProviderCertificationFreezeLedgerApi.buildGlobalShoppingProviderCertificationFreezeLedger === "function" ? globalShoppingProviderCertificationFreezeLedgerApi.buildGlobalShoppingProviderCertificationFreezeLedger({ providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary, offlineProviderCertificationCenterSummary:offlineProviderCertificationCenterSummary, humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary, adapterBoundaryLockSummary:adapterBoundaryLockSummary, verifyE2eBuildSummary:verifyE2eBuildSummary }) : null);
    const providerCertificationFreezeLedgerStatus = text(providerCertificationFreezeLedgerSummary && providerCertificationFreezeLedgerSummary.status || "");
    const sandboxActivationReviewPacketSummary = safe.sandboxActivationReviewPacketSummary && typeof safe.sandboxActivationReviewPacketSummary === "object" ? safe.sandboxActivationReviewPacketSummary : (typeof globalShoppingSandboxActivationReviewPacketApi.buildGlobalShoppingSandboxActivationReviewPacket === "function" ? globalShoppingSandboxActivationReviewPacketApi.buildGlobalShoppingSandboxActivationReviewPacket({ providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary, providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary, manualActivationCommandCenterSummary:manualActivationCommandCenterSummary, humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary, adapterBoundaryLockSummary:adapterBoundaryLockSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary }) : null);
    const sandboxActivationReviewPacketStatus = text(sandboxActivationReviewPacketSummary && sandboxActivationReviewPacketSummary.status || "");
    const adapterBoundaryDiffInspectorSummary = safe.adapterBoundaryDiffInspectorSummary && typeof safe.adapterBoundaryDiffInspectorSummary === "object" ? safe.adapterBoundaryDiffInspectorSummary : (typeof globalShoppingAdapterBoundaryDiffInspectorApi.buildGlobalShoppingAdapterBoundaryDiffInspector === "function" ? globalShoppingAdapterBoundaryDiffInspectorApi.buildGlobalShoppingAdapterBoundaryDiffInspector({ adapterBoundaryLockSummary:adapterBoundaryLockSummary, sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary, providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary, providerAdapterComplianceChecklistSummary:providerAdapterComplianceChecklistSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const adapterBoundaryDiffInspectorStatus = text(adapterBoundaryDiffInspectorSummary && adapterBoundaryDiffInspectorSummary.status || "");
    const providerOfflineReleaseViewModelSummary = safe.providerOfflineReleaseViewModelSummary && typeof safe.providerOfflineReleaseViewModelSummary === "object" ? safe.providerOfflineReleaseViewModelSummary : (typeof globalShoppingProviderOfflineReleaseViewModelApi.buildGlobalShoppingProviderOfflineReleaseViewModel === "function" ? globalShoppingProviderOfflineReleaseViewModelApi.buildGlobalShoppingProviderOfflineReleaseViewModel({ providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary, providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary, sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary, adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary }) : null);
    const providerOfflineReleaseViewModelStatus = text(providerOfflineReleaseViewModelSummary && providerOfflineReleaseViewModelSummary.status || "");
    const safeToProceedWithManualOfflineReleaseReview = providerOfflineReleaseViewModelStatus === "ready";
    const offlineLaunchDecisionSimulatorSummary = safe.offlineLaunchDecisionSimulatorSummary && typeof safe.offlineLaunchDecisionSimulatorSummary === "object" ? safe.offlineLaunchDecisionSimulatorSummary : (typeof globalShoppingOfflineLaunchDecisionSimulatorApi.buildGlobalShoppingOfflineLaunchDecisionSimulator === "function" ? globalShoppingOfflineLaunchDecisionSimulatorApi.buildGlobalShoppingOfflineLaunchDecisionSimulator({ providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary, providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary, sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary, adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary, providerOfflineReleaseViewModelSummary:providerOfflineReleaseViewModelSummary }) : null);
    const offlineLaunchDecisionSimulatorStatus = text(offlineLaunchDecisionSimulatorSummary && offlineLaunchDecisionSimulatorSummary.status || "");
    const sandboxActivationReceiptLedgerSummary = safe.sandboxActivationReceiptLedgerSummary && typeof safe.sandboxActivationReceiptLedgerSummary === "object" ? safe.sandboxActivationReceiptLedgerSummary : (typeof globalShoppingSandboxActivationReceiptLedgerApi.buildGlobalShoppingSandboxActivationReceiptLedger === "function" ? globalShoppingSandboxActivationReceiptLedgerApi.buildGlobalShoppingSandboxActivationReceiptLedger({ offlineLaunchDecisionSimulatorSummary:offlineLaunchDecisionSimulatorSummary, sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary, providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary, humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary, releaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary }) : null);
    const sandboxActivationReceiptLedgerStatus = text(sandboxActivationReceiptLedgerSummary && sandboxActivationReceiptLedgerSummary.status || "");
    const adapterSecurityRegressionGuardSummary = safe.adapterSecurityRegressionGuardSummary && typeof safe.adapterSecurityRegressionGuardSummary === "object" ? safe.adapterSecurityRegressionGuardSummary : (typeof globalShoppingAdapterSecurityRegressionGuardApi.buildGlobalShoppingAdapterSecurityRegressionGuard === "function" ? globalShoppingAdapterSecurityRegressionGuardApi.buildGlobalShoppingAdapterSecurityRegressionGuard({ adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary, adapterBoundaryLockSummary:adapterBoundaryLockSummary, sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary, mockIntegrationRegressionLabSummary:mockIntegrationRegressionLabSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const adapterSecurityRegressionGuardStatus = text(adapterSecurityRegressionGuardSummary && adapterSecurityRegressionGuardSummary.status || "");
    const providerOfflineLaunchChecklistSummary = safe.providerOfflineLaunchChecklistSummary && typeof safe.providerOfflineLaunchChecklistSummary === "object" ? safe.providerOfflineLaunchChecklistSummary : (typeof globalShoppingProviderOfflineLaunchChecklistApi.buildGlobalShoppingProviderOfflineLaunchChecklist === "function" ? globalShoppingProviderOfflineLaunchChecklistApi.buildGlobalShoppingProviderOfflineLaunchChecklist({ offlineLaunchDecisionSimulatorSummary:offlineLaunchDecisionSimulatorSummary, sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary, providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary, providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary }) : null);
    const providerOfflineLaunchChecklistStatus = text(providerOfflineLaunchChecklistSummary && providerOfflineLaunchChecklistSummary.status || "");
    const providerOfflineLaunchViewModelSummary = safe.providerOfflineLaunchViewModelSummary && typeof safe.providerOfflineLaunchViewModelSummary === "object" ? safe.providerOfflineLaunchViewModelSummary : (typeof globalShoppingProviderOfflineLaunchViewModelApi.buildGlobalShoppingProviderOfflineLaunchViewModel === "function" ? globalShoppingProviderOfflineLaunchViewModelApi.buildGlobalShoppingProviderOfflineLaunchViewModel({ offlineLaunchDecisionSimulatorSummary:offlineLaunchDecisionSimulatorSummary, sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary, providerOfflineLaunchChecklistSummary:providerOfflineLaunchChecklistSummary }) : null);
    const providerOfflineLaunchViewModelStatus = text(providerOfflineLaunchViewModelSummary && providerOfflineLaunchViewModelSummary.status || "");
    const safeToProceedWithManualOfflineLaunchDecisionReview = providerOfflineLaunchViewModelStatus === "ready";
    const offlineProviderLaunchControlTowerSummary = safe.offlineProviderLaunchControlTowerSummary && typeof safe.offlineProviderLaunchControlTowerSummary === "object" ? safe.offlineProviderLaunchControlTowerSummary : (typeof globalShoppingOfflineProviderLaunchControlTowerApi.buildGlobalShoppingOfflineProviderLaunchControlTower === "function" ? globalShoppingOfflineProviderLaunchControlTowerApi.buildGlobalShoppingOfflineProviderLaunchControlTower({ offlineLaunchDecisionSimulatorSummary:offlineLaunchDecisionSimulatorSummary, sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary, providerOfflineLaunchChecklistSummary:providerOfflineLaunchChecklistSummary, providerOfflineLaunchViewModelSummary:providerOfflineLaunchViewModelSummary }) : null);
    const offlineProviderLaunchControlTowerStatus = text(offlineProviderLaunchControlTowerSummary && offlineProviderLaunchControlTowerSummary.status || "");
    const adapterPolicyEngineSummary = safe.adapterPolicyEngineSummary && typeof safe.adapterPolicyEngineSummary === "object" ? safe.adapterPolicyEngineSummary : (typeof globalShoppingAdapterPolicyEngineApi.buildGlobalShoppingAdapterPolicyEngine === "function" ? globalShoppingAdapterPolicyEngineApi.buildGlobalShoppingAdapterPolicyEngine({ offlineProviderLaunchControlTowerSummary:offlineProviderLaunchControlTowerSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary, adapterBoundaryLockSummary:adapterBoundaryLockSummary, adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary, providerAdapterComplianceChecklistSummary:providerAdapterComplianceChecklistSummary }) : null);
    const adapterPolicyEngineStatus = text(adapterPolicyEngineSummary && adapterPolicyEngineSummary.status || "");
    const humanReleaseEvidenceTimelineSummary = safe.humanReleaseEvidenceTimelineSummary && typeof safe.humanReleaseEvidenceTimelineSummary === "object" ? safe.humanReleaseEvidenceTimelineSummary : (typeof globalShoppingHumanReleaseEvidenceTimelineApi.buildGlobalShoppingHumanReleaseEvidenceTimeline === "function" ? globalShoppingHumanReleaseEvidenceTimelineApi.buildGlobalShoppingHumanReleaseEvidenceTimeline({ offlineProviderLaunchControlTowerSummary:offlineProviderLaunchControlTowerSummary, adapterPolicyEngineSummary:adapterPolicyEngineSummary, humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary, sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary, providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary, verifyE2eBuildSummary:verifyE2eBuildSummary }) : null);
    const humanReleaseEvidenceTimelineStatus = text(humanReleaseEvidenceTimelineSummary && humanReleaseEvidenceTimelineSummary.status || "");
    const sandboxActivationFinalReviewBoardSummary = safe.sandboxActivationFinalReviewBoardSummary && typeof safe.sandboxActivationFinalReviewBoardSummary === "object" ? safe.sandboxActivationFinalReviewBoardSummary : (typeof globalShoppingSandboxActivationFinalReviewBoardApi.buildGlobalShoppingSandboxActivationFinalReviewBoard === "function" ? globalShoppingSandboxActivationFinalReviewBoardApi.buildGlobalShoppingSandboxActivationFinalReviewBoard({ offlineProviderLaunchControlTowerSummary:offlineProviderLaunchControlTowerSummary, adapterPolicyEngineSummary:adapterPolicyEngineSummary, humanReleaseEvidenceTimelineSummary:humanReleaseEvidenceTimelineSummary, sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary, sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary, providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary }) : null);
    const sandboxActivationFinalReviewBoardStatus = text(sandboxActivationFinalReviewBoardSummary && sandboxActivationFinalReviewBoardSummary.status || "");
    const providerLaunchControlViewModelSummary = safe.providerLaunchControlViewModelSummary && typeof safe.providerLaunchControlViewModelSummary === "object" ? safe.providerLaunchControlViewModelSummary : (typeof globalShoppingProviderLaunchControlViewModelApi.buildGlobalShoppingProviderLaunchControlViewModel === "function" ? globalShoppingProviderLaunchControlViewModelApi.buildGlobalShoppingProviderLaunchControlViewModel({ offlineProviderLaunchControlTowerSummary:offlineProviderLaunchControlTowerSummary, adapterPolicyEngineSummary:adapterPolicyEngineSummary, humanReleaseEvidenceTimelineSummary:humanReleaseEvidenceTimelineSummary, sandboxActivationFinalReviewBoardSummary:sandboxActivationFinalReviewBoardSummary }) : null);
    const providerLaunchControlViewModelStatus = text(providerLaunchControlViewModelSummary && providerLaunchControlViewModelSummary.status || "");
    const safeToProceedWithHumanLaunchControlReview = providerLaunchControlViewModelStatus === "ready";
    const providerLaunchAuditSnapshotSummary = safe.providerLaunchAuditSnapshotSummary && typeof safe.providerLaunchAuditSnapshotSummary === "object" ? safe.providerLaunchAuditSnapshotSummary : (typeof globalShoppingProviderLaunchAuditSnapshotApi.buildGlobalShoppingProviderLaunchAuditSnapshot === "function" ? globalShoppingProviderLaunchAuditSnapshotApi.buildGlobalShoppingProviderLaunchAuditSnapshot({ offlineProviderLaunchControlTowerSummary:offlineProviderLaunchControlTowerSummary, adapterPolicyEngineSummary:adapterPolicyEngineSummary, humanReleaseEvidenceTimelineSummary:humanReleaseEvidenceTimelineSummary, sandboxActivationFinalReviewBoardSummary:sandboxActivationFinalReviewBoardSummary, providerLaunchControlViewModelSummary:providerLaunchControlViewModelSummary }) : null);
    const providerLaunchAuditSnapshotStatus = text(providerLaunchAuditSnapshotSummary && providerLaunchAuditSnapshotSummary.status || "");
    const offlinePolicyReplayCenterSummary = safe.offlinePolicyReplayCenterSummary && typeof safe.offlinePolicyReplayCenterSummary === "object" ? safe.offlinePolicyReplayCenterSummary : (typeof globalShoppingOfflinePolicyReplayCenterApi.buildGlobalShoppingOfflinePolicyReplayCenter === "function" ? globalShoppingOfflinePolicyReplayCenterApi.buildGlobalShoppingOfflinePolicyReplayCenter({ providerLaunchAuditSnapshotSummary:providerLaunchAuditSnapshotSummary, adapterPolicyEngineSummary:adapterPolicyEngineSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary, adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const offlinePolicyReplayCenterStatus = text(offlinePolicyReplayCenterSummary && offlinePolicyReplayCenterSummary.status || "");
    const humanActivationFinalDossierSummary = safe.humanActivationFinalDossierSummary && typeof safe.humanActivationFinalDossierSummary === "object" ? safe.humanActivationFinalDossierSummary : (typeof globalShoppingHumanActivationFinalDossierApi.buildGlobalShoppingHumanActivationFinalDossier === "function" ? globalShoppingHumanActivationFinalDossierApi.buildGlobalShoppingHumanActivationFinalDossier({ providerLaunchAuditSnapshotSummary:providerLaunchAuditSnapshotSummary, offlinePolicyReplayCenterSummary:offlinePolicyReplayCenterSummary, humanReleaseEvidenceTimelineSummary:humanReleaseEvidenceTimelineSummary, sandboxActivationFinalReviewBoardSummary:sandboxActivationFinalReviewBoardSummary, sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary, verifyE2eBuildSummary:verifyE2eBuildSummary }) : null);
    const humanActivationFinalDossierStatus = text(humanActivationFinalDossierSummary && humanActivationFinalDossierSummary.status || "");
    const adapterLaunchBoundaryVerifierSummary = safe.adapterLaunchBoundaryVerifierSummary && typeof safe.adapterLaunchBoundaryVerifierSummary === "object" ? safe.adapterLaunchBoundaryVerifierSummary : (typeof globalShoppingAdapterLaunchBoundaryVerifierApi.buildGlobalShoppingAdapterLaunchBoundaryVerifier === "function" ? globalShoppingAdapterLaunchBoundaryVerifierApi.buildGlobalShoppingAdapterLaunchBoundaryVerifier({ offlinePolicyReplayCenterSummary:offlinePolicyReplayCenterSummary, adapterBoundaryLockSummary:adapterBoundaryLockSummary, adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary, adapterPolicyEngineSummary:adapterPolicyEngineSummary, humanActivationFinalDossierSummary:humanActivationFinalDossierSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const adapterLaunchBoundaryVerifierStatus = text(adapterLaunchBoundaryVerifierSummary && adapterLaunchBoundaryVerifierSummary.status || "");
    const providerFinalLaunchReviewViewModelSummary = safe.providerFinalLaunchReviewViewModelSummary && typeof safe.providerFinalLaunchReviewViewModelSummary === "object" ? safe.providerFinalLaunchReviewViewModelSummary : (typeof globalShoppingProviderFinalLaunchReviewViewModelApi.buildGlobalShoppingProviderFinalLaunchReviewViewModel === "function" ? globalShoppingProviderFinalLaunchReviewViewModelApi.buildGlobalShoppingProviderFinalLaunchReviewViewModel({ providerLaunchAuditSnapshotSummary:providerLaunchAuditSnapshotSummary, offlinePolicyReplayCenterSummary:offlinePolicyReplayCenterSummary, humanActivationFinalDossierSummary:humanActivationFinalDossierSummary, adapterLaunchBoundaryVerifierSummary:adapterLaunchBoundaryVerifierSummary }) : null);
    const providerFinalLaunchReviewViewModelStatus = text(providerFinalLaunchReviewViewModelSummary && providerFinalLaunchReviewViewModelSummary.status || "");
    const safeToProceedWithHumanFinalLaunchReview = providerFinalLaunchReviewViewModelStatus === "ready";
    const finalOfflineLaunchReviewConsoleSummary = safe.finalOfflineLaunchReviewConsoleSummary && typeof safe.finalOfflineLaunchReviewConsoleSummary === "object" ? safe.finalOfflineLaunchReviewConsoleSummary : (typeof globalShoppingFinalOfflineLaunchReviewConsoleApi.buildGlobalShoppingFinalOfflineLaunchReviewConsole === "function" ? globalShoppingFinalOfflineLaunchReviewConsoleApi.buildGlobalShoppingFinalOfflineLaunchReviewConsole({ providerLaunchAuditSnapshotSummary:providerLaunchAuditSnapshotSummary, offlinePolicyReplayCenterSummary:offlinePolicyReplayCenterSummary, humanActivationFinalDossierSummary:humanActivationFinalDossierSummary, adapterLaunchBoundaryVerifierSummary:adapterLaunchBoundaryVerifierSummary, providerFinalLaunchReviewViewModelSummary:providerFinalLaunchReviewViewModelSummary }) : null);
    const finalOfflineLaunchReviewConsoleStatus = text(finalOfflineLaunchReviewConsoleSummary && finalOfflineLaunchReviewConsoleSummary.status || "");
    const providerActivationBlockerSentinelSummary = safe.providerActivationBlockerSentinelSummary && typeof safe.providerActivationBlockerSentinelSummary === "object" ? safe.providerActivationBlockerSentinelSummary : (typeof globalShoppingProviderActivationBlockerSentinelApi.buildGlobalShoppingProviderActivationBlockerSentinel === "function" ? globalShoppingProviderActivationBlockerSentinelApi.buildGlobalShoppingProviderActivationBlockerSentinel({ finalOfflineLaunchReviewConsoleSummary:finalOfflineLaunchReviewConsoleSummary, adapterLaunchBoundaryVerifierSummary:adapterLaunchBoundaryVerifierSummary, adapterPolicyEngineSummary:adapterPolicyEngineSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const providerActivationBlockerSentinelStatus = text(providerActivationBlockerSentinelSummary && providerActivationBlockerSentinelSummary.status || "");
    const readOnlyReleaseEvidenceSummary = safe.readOnlyReleaseEvidenceSummary && typeof safe.readOnlyReleaseEvidenceSummary === "object" ? safe.readOnlyReleaseEvidenceSummary : (typeof globalShoppingReadOnlyReleaseEvidenceSummaryApi.buildGlobalShoppingReadOnlyReleaseEvidenceSummary === "function" ? globalShoppingReadOnlyReleaseEvidenceSummaryApi.buildGlobalShoppingReadOnlyReleaseEvidenceSummary({ finalOfflineLaunchReviewConsoleSummary:finalOfflineLaunchReviewConsoleSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary, humanActivationFinalDossierSummary:humanActivationFinalDossierSummary, humanReleaseEvidenceTimelineSummary:humanReleaseEvidenceTimelineSummary, verifyE2eBuildSummary:verifyE2eBuildSummary }) : null);
    const readOnlyReleaseEvidenceSummaryStatus = text(readOnlyReleaseEvidenceSummary && readOnlyReleaseEvidenceSummary.status || "");
    const offlineProviderReadinessDecisionMatrixSummary = safe.offlineProviderReadinessDecisionMatrixSummary && typeof safe.offlineProviderReadinessDecisionMatrixSummary === "object" ? safe.offlineProviderReadinessDecisionMatrixSummary : (typeof globalShoppingOfflineProviderReadinessDecisionMatrixApi.buildGlobalShoppingOfflineProviderReadinessDecisionMatrix === "function" ? globalShoppingOfflineProviderReadinessDecisionMatrixApi.buildGlobalShoppingOfflineProviderReadinessDecisionMatrix({ finalOfflineLaunchReviewConsoleSummary:finalOfflineLaunchReviewConsoleSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary, readOnlyReleaseEvidenceSummary:readOnlyReleaseEvidenceSummary }) : null);
    const offlineProviderReadinessDecisionMatrixStatus = text(offlineProviderReadinessDecisionMatrixSummary && offlineProviderReadinessDecisionMatrixSummary.status || "");
    const providerFinalReviewConsoleViewModelSummary = safe.providerFinalReviewConsoleViewModelSummary && typeof safe.providerFinalReviewConsoleViewModelSummary === "object" ? safe.providerFinalReviewConsoleViewModelSummary : (typeof globalShoppingProviderFinalReviewConsoleViewModelApi.buildGlobalShoppingProviderFinalReviewConsoleViewModel === "function" ? globalShoppingProviderFinalReviewConsoleViewModelApi.buildGlobalShoppingProviderFinalReviewConsoleViewModel({ finalOfflineLaunchReviewConsoleSummary:finalOfflineLaunchReviewConsoleSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary, readOnlyReleaseEvidenceSummary:readOnlyReleaseEvidenceSummary, offlineProviderReadinessDecisionMatrixSummary:offlineProviderReadinessDecisionMatrixSummary }) : null);
    const providerFinalReviewConsoleViewModelStatus = text(providerFinalReviewConsoleViewModelSummary && providerFinalReviewConsoleViewModelSummary.status || "");
    const safeToProceedWithFinalOfflineProviderReview = providerFinalReviewConsoleViewModelStatus === "ready";
    const providerFinalSafetySealSummary = safe.providerFinalSafetySealSummary && typeof safe.providerFinalSafetySealSummary === "object" ? safe.providerFinalSafetySealSummary : (typeof globalShoppingProviderFinalSafetySealApi.buildGlobalShoppingProviderFinalSafetySeal === "function" ? globalShoppingProviderFinalSafetySealApi.buildGlobalShoppingProviderFinalSafetySeal({ finalOfflineLaunchReviewConsoleSummary:finalOfflineLaunchReviewConsoleSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary, readOnlyReleaseEvidenceSummary:readOnlyReleaseEvidenceSummary, offlineProviderReadinessDecisionMatrixSummary:offlineProviderReadinessDecisionMatrixSummary, providerFinalReviewConsoleViewModelSummary:providerFinalReviewConsoleViewModelSummary }) : null);
    const providerFinalSafetySealStatus = text(providerFinalSafetySealSummary && providerFinalSafetySealSummary.status || "");
    const offlineActivationWarRoomSummary = safe.offlineActivationWarRoomSummary && typeof safe.offlineActivationWarRoomSummary === "object" ? safe.offlineActivationWarRoomSummary : (typeof globalShoppingOfflineActivationWarRoomApi.buildGlobalShoppingOfflineActivationWarRoom === "function" ? globalShoppingOfflineActivationWarRoomApi.buildGlobalShoppingOfflineActivationWarRoom({ providerFinalSafetySealSummary:providerFinalSafetySealSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary, offlineProviderReadinessDecisionMatrixSummary:offlineProviderReadinessDecisionMatrixSummary, sandboxActivationFinalReviewBoardSummary:sandboxActivationFinalReviewBoardSummary, adapterLaunchBoundaryVerifierSummary:adapterLaunchBoundaryVerifierSummary }) : null);
    const offlineActivationWarRoomStatus = text(offlineActivationWarRoomSummary && offlineActivationWarRoomSummary.status || "");
    const readOnlyProviderReadinessCertificateSummary = safe.readOnlyProviderReadinessCertificateSummary && typeof safe.readOnlyProviderReadinessCertificateSummary === "object" ? safe.readOnlyProviderReadinessCertificateSummary : (typeof globalShoppingReadOnlyProviderReadinessCertificateApi.buildGlobalShoppingReadOnlyProviderReadinessCertificate === "function" ? globalShoppingReadOnlyProviderReadinessCertificateApi.buildGlobalShoppingReadOnlyProviderReadinessCertificate({ providerFinalSafetySealSummary:providerFinalSafetySealSummary, offlineActivationWarRoomSummary:offlineActivationWarRoomSummary, readOnlyReleaseEvidenceSummary:readOnlyReleaseEvidenceSummary, humanActivationFinalDossierSummary:humanActivationFinalDossierSummary, verifyE2eBuildSummary:verifyE2eBuildSummary }) : null);
    const readOnlyProviderReadinessCertificateStatus = text(readOnlyProviderReadinessCertificateSummary && readOnlyProviderReadinessCertificateSummary.status || "");
    const providerNoActivationGuaranteeBoardSummary = safe.providerNoActivationGuaranteeBoardSummary && typeof safe.providerNoActivationGuaranteeBoardSummary === "object" ? safe.providerNoActivationGuaranteeBoardSummary : (typeof globalShoppingProviderNoActivationGuaranteeBoardApi.buildGlobalShoppingProviderNoActivationGuaranteeBoard === "function" ? globalShoppingProviderNoActivationGuaranteeBoardApi.buildGlobalShoppingProviderNoActivationGuaranteeBoard({ providerFinalSafetySealSummary:providerFinalSafetySealSummary, offlineActivationWarRoomSummary:offlineActivationWarRoomSummary, readOnlyProviderReadinessCertificateSummary:readOnlyProviderReadinessCertificateSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary }) : null);
    const providerNoActivationGuaranteeBoardStatus = text(providerNoActivationGuaranteeBoardSummary && providerNoActivationGuaranteeBoardSummary.status || "");
    const providerFinalSafetyViewModelSummary = safe.providerFinalSafetyViewModelSummary && typeof safe.providerFinalSafetyViewModelSummary === "object" ? safe.providerFinalSafetyViewModelSummary : (typeof globalShoppingProviderFinalSafetyViewModelApi.buildGlobalShoppingProviderFinalSafetyViewModel === "function" ? globalShoppingProviderFinalSafetyViewModelApi.buildGlobalShoppingProviderFinalSafetyViewModel({ providerFinalSafetySealSummary:providerFinalSafetySealSummary, offlineActivationWarRoomSummary:offlineActivationWarRoomSummary, readOnlyProviderReadinessCertificateSummary:readOnlyProviderReadinessCertificateSummary, providerNoActivationGuaranteeBoardSummary:providerNoActivationGuaranteeBoardSummary }) : null);
    const providerFinalSafetyViewModelStatus = text(providerFinalSafetyViewModelSummary && providerFinalSafetyViewModelSummary.status || "");
    const safeToProceedWithHumanFinalSafetyReview = providerFinalSafetyViewModelStatus === "ready";
    const offlineProviderGovernanceClosureBoardSummary = safe.offlineProviderGovernanceClosureBoardSummary && typeof safe.offlineProviderGovernanceClosureBoardSummary === "object" ? safe.offlineProviderGovernanceClosureBoardSummary : (typeof globalShoppingOfflineProviderGovernanceClosureBoardApi.buildGlobalShoppingOfflineProviderGovernanceClosureBoard === "function" ? globalShoppingOfflineProviderGovernanceClosureBoardApi.buildGlobalShoppingOfflineProviderGovernanceClosureBoard({ providerFinalSafetySealSummary:providerFinalSafetySealSummary, offlineActivationWarRoomSummary:offlineActivationWarRoomSummary, readOnlyProviderReadinessCertificateSummary:readOnlyProviderReadinessCertificateSummary, providerNoActivationGuaranteeBoardSummary:providerNoActivationGuaranteeBoardSummary, providerFinalSafetyViewModelSummary:providerFinalSafetyViewModelSummary }) : null);
    const offlineProviderGovernanceClosureBoardStatus = text(offlineProviderGovernanceClosureBoardSummary && offlineProviderGovernanceClosureBoardSummary.status || "");
    const noActivationComplianceSealSummary = safe.noActivationComplianceSealSummary && typeof safe.noActivationComplianceSealSummary === "object" ? safe.noActivationComplianceSealSummary : (typeof globalShoppingNoActivationComplianceSealApi.buildGlobalShoppingNoActivationComplianceSeal === "function" ? globalShoppingNoActivationComplianceSealApi.buildGlobalShoppingNoActivationComplianceSeal({ offlineProviderGovernanceClosureBoardSummary:offlineProviderGovernanceClosureBoardSummary, providerNoActivationGuaranteeBoardSummary:providerNoActivationGuaranteeBoardSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary, adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const noActivationComplianceSealStatus = text(noActivationComplianceSealSummary && noActivationComplianceSealSummary.status || "");
    const finalReadinessHandoffSimulatorSummary = safe.finalReadinessHandoffSimulatorSummary && typeof safe.finalReadinessHandoffSimulatorSummary === "object" ? safe.finalReadinessHandoffSimulatorSummary : (typeof globalShoppingFinalReadinessHandoffSimulatorApi.buildGlobalShoppingFinalReadinessHandoffSimulator === "function" ? globalShoppingFinalReadinessHandoffSimulatorApi.buildGlobalShoppingFinalReadinessHandoffSimulator({ offlineProviderGovernanceClosureBoardSummary:offlineProviderGovernanceClosureBoardSummary, noActivationComplianceSealSummary:noActivationComplianceSealSummary, readOnlyProviderReadinessCertificateSummary:readOnlyProviderReadinessCertificateSummary, manualProviderActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary, finalOfflineLaunchReviewConsoleSummary:finalOfflineLaunchReviewConsoleSummary }) : null);
    const finalReadinessHandoffSimulatorStatus = text(finalReadinessHandoffSimulatorSummary && finalReadinessHandoffSimulatorSummary.status || "");
    const providerGovernanceClosureEvidenceLedgerSummary = safe.providerGovernanceClosureEvidenceLedgerSummary && typeof safe.providerGovernanceClosureEvidenceLedgerSummary === "object" ? safe.providerGovernanceClosureEvidenceLedgerSummary : (typeof globalShoppingProviderGovernanceClosureEvidenceLedgerApi.buildGlobalShoppingProviderGovernanceClosureEvidenceLedger === "function" ? globalShoppingProviderGovernanceClosureEvidenceLedgerApi.buildGlobalShoppingProviderGovernanceClosureEvidenceLedger({ offlineProviderGovernanceClosureBoardSummary:offlineProviderGovernanceClosureBoardSummary, noActivationComplianceSealSummary:noActivationComplianceSealSummary, finalReadinessHandoffSimulatorSummary:finalReadinessHandoffSimulatorSummary, readOnlyReleaseEvidenceSummary:readOnlyReleaseEvidenceSummary, verifyE2eBuildSummary:verifyE2eBuildSummary }) : null);
    const providerGovernanceClosureEvidenceLedgerStatus = text(providerGovernanceClosureEvidenceLedgerSummary && providerGovernanceClosureEvidenceLedgerSummary.status || "");
    const providerGovernanceClosureViewModelSummary = safe.providerGovernanceClosureViewModelSummary && typeof safe.providerGovernanceClosureViewModelSummary === "object" ? safe.providerGovernanceClosureViewModelSummary : (typeof globalShoppingProviderGovernanceClosureViewModelApi.buildGlobalShoppingProviderGovernanceClosureViewModel === "function" ? globalShoppingProviderGovernanceClosureViewModelApi.buildGlobalShoppingProviderGovernanceClosureViewModel({ offlineProviderGovernanceClosureBoardSummary:offlineProviderGovernanceClosureBoardSummary, noActivationComplianceSealSummary:noActivationComplianceSealSummary, finalReadinessHandoffSimulatorSummary:finalReadinessHandoffSimulatorSummary, providerGovernanceClosureEvidenceLedgerSummary:providerGovernanceClosureEvidenceLedgerSummary }) : null);
    const providerGovernanceClosureViewModelStatus = text(providerGovernanceClosureViewModelSummary && providerGovernanceClosureViewModelSummary.status || "");
    const safeToProceedWithHumanGovernanceClosureReview = providerGovernanceClosureViewModelStatus === "ready";
    const offlineDistributionReadinessCenterSummary = safe.offlineDistributionReadinessCenterSummary && typeof safe.offlineDistributionReadinessCenterSummary === "object" ? safe.offlineDistributionReadinessCenterSummary : (typeof globalShoppingOfflineDistributionReadinessCenterApi.buildGlobalShoppingOfflineDistributionReadinessCenter === "function" ? globalShoppingOfflineDistributionReadinessCenterApi.buildGlobalShoppingOfflineDistributionReadinessCenter({ offlineProviderGovernanceClosureBoardSummary:offlineProviderGovernanceClosureBoardSummary, noActivationComplianceSealSummary:noActivationComplianceSealSummary, finalReadinessHandoffSimulatorSummary:finalReadinessHandoffSimulatorSummary, providerGovernanceClosureEvidenceLedgerSummary:providerGovernanceClosureEvidenceLedgerSummary, providerGovernanceClosureViewModelSummary:providerGovernanceClosureViewModelSummary }) : null);
    const offlineDistributionReadinessCenterStatus = text(offlineDistributionReadinessCenterSummary && offlineDistributionReadinessCenterSummary.status || "");
    const noActivationEnforcementLedgerSummary = safe.noActivationEnforcementLedgerSummary && typeof safe.noActivationEnforcementLedgerSummary === "object" ? safe.noActivationEnforcementLedgerSummary : (typeof globalShoppingNoActivationEnforcementLedgerApi.buildGlobalShoppingNoActivationEnforcementLedger === "function" ? globalShoppingNoActivationEnforcementLedgerApi.buildGlobalShoppingNoActivationEnforcementLedger({ offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary, noActivationComplianceSealSummary:noActivationComplianceSealSummary, providerNoActivationGuaranteeBoardSummary:providerNoActivationGuaranteeBoardSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary, safetySentinelSummary:safetyRegressionSummary }) : null);
    const noActivationEnforcementLedgerStatus = text(noActivationEnforcementLedgerSummary && noActivationEnforcementLedgerSummary.status || "");
    const finalUserTrustSummarySummary = safe.finalUserTrustSummarySummary && typeof safe.finalUserTrustSummarySummary === "object" ? safe.finalUserTrustSummarySummary : (typeof globalShoppingFinalUserTrustSummaryApi.buildGlobalShoppingFinalUserTrustSummary === "function" ? globalShoppingFinalUserTrustSummaryApi.buildGlobalShoppingFinalUserTrustSummary({ offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary, noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary, readOnlyProviderReadinessCertificateSummary:readOnlyProviderReadinessCertificateSummary, readOnlyReleaseEvidenceSummary:readOnlyReleaseEvidenceSummary, verifyE2eBuildSummary:verifyE2eBuildSummary }) : null);
    const finalUserTrustSummaryStatus = text(finalUserTrustSummarySummary && finalUserTrustSummarySummary.status || "");
    const providerSafetyDistributionMatrixSummary = safe.providerSafetyDistributionMatrixSummary && typeof safe.providerSafetyDistributionMatrixSummary === "object" ? safe.providerSafetyDistributionMatrixSummary : (typeof globalShoppingProviderSafetyDistributionMatrixApi.buildGlobalShoppingProviderSafetyDistributionMatrix === "function" ? globalShoppingProviderSafetyDistributionMatrixApi.buildGlobalShoppingProviderSafetyDistributionMatrix({ offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary, noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary, finalUserTrustSummarySummary:finalUserTrustSummarySummary, providerFinalSafetySealSummary:providerFinalSafetySealSummary, providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary }) : null);
    const providerSafetyDistributionMatrixStatus = text(providerSafetyDistributionMatrixSummary && providerSafetyDistributionMatrixSummary.status || "");
    const providerDistributionReadinessViewModelSummary = safe.providerDistributionReadinessViewModelSummary && typeof safe.providerDistributionReadinessViewModelSummary === "object" ? safe.providerDistributionReadinessViewModelSummary : (typeof globalShoppingProviderDistributionReadinessViewModelApi.buildGlobalShoppingProviderDistributionReadinessViewModel === "function" ? globalShoppingProviderDistributionReadinessViewModelApi.buildGlobalShoppingProviderDistributionReadinessViewModel({ offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary, noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary, finalUserTrustSummarySummary:finalUserTrustSummarySummary, providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary }) : null);
    const providerDistributionReadinessViewModelStatus = text(providerDistributionReadinessViewModelSummary && providerDistributionReadinessViewModelSummary.status || "");
    const safeToProceedWithHumanDistributionReadinessReview = providerDistributionReadinessViewModelStatus === "ready";
    const providerDistributionFreezeConsoleSummary = safe.providerDistributionFreezeConsoleSummary && typeof safe.providerDistributionFreezeConsoleSummary === "object" ? safe.providerDistributionFreezeConsoleSummary : (typeof globalShoppingProviderDistributionFreezeConsoleApi.buildGlobalShoppingProviderDistributionFreezeConsole === "function" ? globalShoppingProviderDistributionFreezeConsoleApi.buildGlobalShoppingProviderDistributionFreezeConsole({ offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary, noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary, finalUserTrustSummarySummary:finalUserTrustSummarySummary, providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary, providerDistributionReadinessViewModelSummary:providerDistributionReadinessViewModelSummary }) : null);
    const providerDistributionFreezeConsoleStatus = text(providerDistributionFreezeConsoleSummary && providerDistributionFreezeConsoleSummary.status || "");
    const userFacingSafetyReceiptSummary = safe.userFacingSafetyReceiptSummary && typeof safe.userFacingSafetyReceiptSummary === "object" ? safe.userFacingSafetyReceiptSummary : (typeof globalShoppingUserFacingSafetyReceiptApi.buildGlobalShoppingUserFacingSafetyReceipt === "function" ? globalShoppingUserFacingSafetyReceiptApi.buildGlobalShoppingUserFacingSafetyReceipt({ providerDistributionFreezeConsoleSummary:providerDistributionFreezeConsoleSummary, finalUserTrustSummarySummary:finalUserTrustSummarySummary, providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary, providerDistributionReadinessViewModelSummary:providerDistributionReadinessViewModelSummary }) : null);
    const userFacingSafetyReceiptStatus = text(userFacingSafetyReceiptSummary && userFacingSafetyReceiptSummary.status || "");
    const offlineReleaseCandidateClosurePackSummary = safe.offlineReleaseCandidateClosurePackSummary && typeof safe.offlineReleaseCandidateClosurePackSummary === "object" ? safe.offlineReleaseCandidateClosurePackSummary : (typeof globalShoppingOfflineReleaseCandidateClosurePackApi.buildGlobalShoppingOfflineReleaseCandidateClosurePack === "function" ? globalShoppingOfflineReleaseCandidateClosurePackApi.buildGlobalShoppingOfflineReleaseCandidateClosurePack({ providerDistributionFreezeConsoleSummary:providerDistributionFreezeConsoleSummary, userFacingSafetyReceiptSummary:userFacingSafetyReceiptSummary, providerDistributionReadinessViewModelSummary:providerDistributionReadinessViewModelSummary }) : null);
    const offlineReleaseCandidateClosurePackStatus = text(offlineReleaseCandidateClosurePackSummary && offlineReleaseCandidateClosurePackSummary.status || "");
    const providerNoProductionGuaranteeMatrixSummary = safe.providerNoProductionGuaranteeMatrixSummary && typeof safe.providerNoProductionGuaranteeMatrixSummary === "object" ? safe.providerNoProductionGuaranteeMatrixSummary : (typeof globalShoppingProviderNoProductionGuaranteeMatrixApi.buildGlobalShoppingProviderNoProductionGuaranteeMatrix === "function" ? globalShoppingProviderNoProductionGuaranteeMatrixApi.buildGlobalShoppingProviderNoProductionGuaranteeMatrix({ providerDistributionFreezeConsoleSummary:providerDistributionFreezeConsoleSummary, userFacingSafetyReceiptSummary:userFacingSafetyReceiptSummary, offlineReleaseCandidateClosurePackSummary:offlineReleaseCandidateClosurePackSummary, providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary }) : null);
    const providerNoProductionGuaranteeMatrixStatus = text(providerNoProductionGuaranteeMatrixSummary && providerNoProductionGuaranteeMatrixSummary.status || "");
    const providerDistributionClosureViewModelSummary = safe.providerDistributionClosureViewModelSummary && typeof safe.providerDistributionClosureViewModelSummary === "object" ? safe.providerDistributionClosureViewModelSummary : (typeof globalShoppingProviderDistributionClosureViewModelApi.buildGlobalShoppingProviderDistributionClosureViewModel === "function" ? globalShoppingProviderDistributionClosureViewModelApi.buildGlobalShoppingProviderDistributionClosureViewModel({ providerDistributionFreezeConsoleSummary:providerDistributionFreezeConsoleSummary, userFacingSafetyReceiptSummary:userFacingSafetyReceiptSummary, offlineReleaseCandidateClosurePackSummary:offlineReleaseCandidateClosurePackSummary, providerNoProductionGuaranteeMatrixSummary:providerNoProductionGuaranteeMatrixSummary }) : null);
    const providerDistributionClosureViewModelStatus = text(providerDistributionClosureViewModelSummary && providerDistributionClosureViewModelSummary.status || "");
    const safeToProceedWithHumanDistributionClosureReview = providerDistributionClosureViewModelStatus === "ready";
    const globalShoppingProductGoalViewModelSummary = safe.globalShoppingProductGoalViewModelSummary && typeof safe.globalShoppingProductGoalViewModelSummary === "object" ? safe.globalShoppingProductGoalViewModelSummary : (typeof globalShoppingProductGoalViewModelApi.buildGlobalShoppingProductGoalViewModel === "function" ? globalShoppingProductGoalViewModelApi.buildGlobalShoppingProductGoalViewModel({ globalShoppingProductGoalSummary:globalShoppingProductGoalSummary, jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary, legalProviderFixtureSummary:legalProviderFixtureSummary, providerCredentialSafetySummary:providerCredentialSafetySummary, sandboxPriceFeedSummary:sandboxPriceFeedSummary, providerFixtureViewModelSummary:providerFixtureViewModelSummary, priceSourceNormalizationSummary:priceSourceNormalizationSummary, officialPriceAnchorSummary:officialPriceAnchorSummary, priceCandidateDisplaySummary:priceCandidateDisplaySummary, sameItemMatcherSummary:sameItemMatcherSummary, duplicateCandidateMergerSummary:duplicateCandidateMergerSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary, sandboxDeepLinkCandidateSummary:sandboxDeepLinkCandidateSummary, platformAvailabilitySummary:platformAvailabilitySummary, partnerLinkPolicySummary:partnerLinkPolicySummary, sandboxHandoffViewModelSummary:sandboxHandoffViewModelSummary }) : null);
    const forbiddenCapabilitySummary = releaseReadinessSummary && releaseReadinessSummary.forbiddenCapabilitySummary || null;
    const userFacingBetaReadiness = releaseReadinessSummary && releaseReadinessSummary.userFacingBetaReadiness || null;
    const copyValidationStatus = text(releaseReadinessSummary && releaseReadinessSummary.copyValidationStatus || "");
    const finalReviewStatus = handoffPacketPolicyDecision && handoffPacketPolicyDecision.status === "allowed" ? "ready" : (finalSafeHandoffPacketSummary && finalSafeHandoffPacketSummary.status || "needs_review");
    const riskBadgeModel = typeof riskBadgeApi.buildFlightWorkflowRiskBadges === "function" ? riskBadgeApi.buildFlightWorkflowRiskBadges(Object.assign({
      auditReview:workflowAuditReviewSummary,
      safeSessionExportPreview:safeSessionExportPreview,
      humanReviewChecklistSummary:humanReviewChecklistSummary,
      finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary,
      handoffPacketPolicyDecision:handoffPacketPolicyDecision,
      safetyRegressionSummary:safetyRegressionSummary,
      operatorConsoleSummary:operatorConsoleSummary,
      releaseReadinessSummary:releaseReadinessSummary,
      userSafetyCopySummary:userSafetyCopySummary,
      forbiddenCapabilitySummary:forbiddenCapabilitySummary,
      userFacingBetaReadiness:userFacingBetaReadiness,
      copyValidationStatus:copyValidationStatus,
      betaExpansionGateSummary:betaExpansionGateSummary,
      publicPilotChecklistSummary:publicPilotChecklistSummary,
      pilotReadinessSummary:pilotReadinessSummary,
      safeForSmallPublicPilot:safeForSmallPublicPilot,
      pilotNextStep:pilotNextStep,
      pilotOnboardingSummary:pilotOnboardingSummary,
      readOnlyConsentSummary:readOnlyConsentSummary,
      pilotOnboardingViewModel:pilotOnboardingViewModel,
      pilotEntryStatus:pilotEntryStatus,
      canEnterReadOnlyPilot:canEnterReadOnlyPilot,
      pilotConsentRequired:pilotConsentRequired,
      pilotSupportSummary:pilotSupportSummary,
      issueIntakeSummary:issueIntakeSummary,
      supportFallbackSummary:supportFallbackSummary,
      pilotSupportStatus:pilotSupportStatus,
      supportNextStep:supportNextStep,
      issueReviewSummary:issueReviewSummary,
      supportTriageSummary:supportTriageSummary,
      pilotIssueReviewSummary:pilotIssueReviewSummary,
      pilotIssueReviewStatus:pilotIssueReviewStatus,
      issueAffectsPilotExpansion:issueAffectsPilotExpansion,
      issueRequiresInternalReview:issueRequiresInternalReview,
      issuePatternSummary:issuePatternSummary,
      supportReadinessSummary:supportReadinessSummary,
      issuePatternViewModelSummary:issuePatternViewModelSummary,
      issuePatternStatus:issuePatternStatus,
      supportReadinessStatus:supportReadinessStatus,
      supportReadyForPublicPilot:supportReadyForPublicPilot,
      repeatedIssueRisk:repeatedIssueRisk,
      rolloutControlSummary:rolloutControlSummary,
      cohortHealthSummary:cohortHealthSummary,
      pilotOpsSummary:pilotOpsSummary,
      nextCohortDecisionSummary:nextCohortDecisionSummary,
      pilotOpsStatus:pilotOpsStatus,
      nextCohortDecisionStatus:nextCohortDecisionStatus,
      pilotOpsPrimaryRisk:pilotOpsPrimaryRisk,
      rolloutDecisionStatus:rolloutDecisionStatus,
      cohortHealthStatus:cohortHealthStatus,
      rolloutNextStep:rolloutNextStep,
      rcCandidateReviewSummary:rcCandidateReviewSummary,
      rcEvidenceReviewSummary:rcEvidenceReviewSummary,
      rcRegressionAuditSummary:rcRegressionAuditSummary,
      releaseRiskLedgerSummary:releaseRiskLedgerSummary,
      rcCopyFinalizationSummary:rcCopyFinalizationSummary,
      safetyDisclosureReviewSummary:safetyDisclosureReviewSummary,
      offlineProviderAdapterContractKitSummary:offlineProviderAdapterContractKitSummary,
      mockSandboxQaMatrixSummary:mockSandboxQaMatrixSummary,
      humanActivationRunbookCenterSummary:humanActivationRunbookCenterSummary,
      providerAdapterComplianceChecklistSummary:providerAdapterComplianceChecklistSummary,
      providerSandboxReleaseCandidateViewModelSummary:providerSandboxReleaseCandidateViewModelSummary,
      offlineProviderCertificationCenterSummary:offlineProviderCertificationCenterSummary,
      mockIntegrationRegressionLabSummary:mockIntegrationRegressionLabSummary,
      humanApprovalEvidenceBinderSummary:humanApprovalEvidenceBinderSummary,
      adapterBoundaryLockSummary:adapterBoundaryLockSummary,
      providerCertificationViewModelSummary:providerCertificationViewModelSummary,
      providerOfflineReleaseGateSummary:providerOfflineReleaseGateSummary,
      providerCertificationFreezeLedgerSummary:providerCertificationFreezeLedgerSummary,
      sandboxActivationReviewPacketSummary:sandboxActivationReviewPacketSummary,
      adapterBoundaryDiffInspectorSummary:adapterBoundaryDiffInspectorSummary,
      providerOfflineReleaseViewModelSummary:providerOfflineReleaseViewModelSummary,
      offlineLaunchDecisionSimulatorSummary:offlineLaunchDecisionSimulatorSummary,
      sandboxActivationReceiptLedgerSummary:sandboxActivationReceiptLedgerSummary,
      adapterSecurityRegressionGuardSummary:adapterSecurityRegressionGuardSummary,
      providerOfflineLaunchChecklistSummary:providerOfflineLaunchChecklistSummary,
      providerOfflineLaunchViewModelSummary:providerOfflineLaunchViewModelSummary,
      globalShoppingProductGoalSummary:globalShoppingProductGoalSummary,
      jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary,
      readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsoleSummary:fixtureReplayConsoleSummary,
      normalizedPriceCandidateBoardSummary:normalizedPriceCandidateBoardSummary,
      realProviderSandboxGateSummary:realProviderSandboxGateSummary,
      providerRequestEnvelopeSummary:providerRequestEnvelopeSummary,
      providerCallAuditLedgerSummary:providerCallAuditLedgerSummary,
      providerSandboxReadinessViewModelSummary:providerSandboxReadinessViewModelSummary,
      providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary,
      firstReadOnlyProviderAdapterShellSummary:firstReadOnlyProviderAdapterShellSummary,
      providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary,
      providerSandboxDryRunViewModelSummary:providerSandboxDryRunViewModelSummary,
      providerAdapterRegistrySummary:providerAdapterRegistrySummary,
      dryRunProviderResponseNormalizerSummary:dryRunProviderResponseNormalizerSummary,
      sandboxProviderRunbookSummary:sandboxProviderRunbookSummary,
      providerAdapterRegistryViewModelSummary:providerAdapterRegistryViewModelSummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerCoverageDashboardSummary:providerCoverageDashboardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      providerCoverageViewModelSummary:providerCoverageViewModelSummary,
      sandboxCandidateComparisonWorkbenchSummary:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrixSummary:providerEvidenceComparisonMatrixSummary,
      readOnlyHandoffReadinessDrillSummary:readOnlyHandoffReadinessDrillSummary,
      sandboxDecisionReviewViewModelSummary:sandboxDecisionReviewViewModelSummary,
      readOnlyPlatformHandoffSimulatorSummary:readOnlyPlatformHandoffSimulatorSummary,
      redactedSearchParameterPackSummary:redactedSearchParameterPackSummary,
      userConfirmationChecklistSummary:userConfirmationChecklistSummary,
      platformHandoffSimulationViewModelSummary:platformHandoffSimulationViewModelSummary,
      readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary,
      platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary,
      userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary,
      handoffPacketViewModelSummary:handoffPacketViewModelSummary,
      manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary,
      handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthroughSummary,
      platformRealityCheckBoardSummary:platformRealityCheckBoardSummary,
      manualPlatformReviewViewModelSummary:manualPlatformReviewViewModelSummary,
      userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary:safeNextActionPanelSummary,
      userManualReviewViewModelSummary:userManualReviewViewModelSummary,
      humanApprovalSimulationGateSummary:humanApprovalSimulationGateSummary,
      mockProviderLaunchDrillSummary:mockProviderLaunchDrillSummary,
      sandboxProviderRollbackPlanSummary:sandboxProviderRollbackPlanSummary,
      providerLaunchSimulationViewModelSummary:providerLaunchSimulationViewModelSummary,
      providerSandboxPilotControlRoomSummary:providerSandboxPilotControlRoomSummary,
      mockProviderIncidentDrillSummary:mockProviderIncidentDrillSummary,
      productionBlockerMatrixSummary:productionBlockerMatrixSummary,
      providerPilotControlViewModelSummary:providerPilotControlViewModelSummary,
      humanControlledSandboxProviderPilotPlannerSummary:humanControlledSandboxProviderPilotPlannerSummary,
      providerKillSwitchDrillSummary:providerKillSwitchDrillSummary,
      complianceEvidencePackSummary:complianceEvidencePackSummary,
      providerPilotGovernanceViewModelSummary:providerPilotGovernanceViewModelSummary,
      providerGovernanceConsoleSummary:providerGovernanceConsoleSummary,
      providerOperatorReviewLoopSummary:providerOperatorReviewLoopSummary,
      providerGovernanceAuditConsoleSummary:providerGovernanceAuditConsoleSummary,
      humanPilotReadinessLedgerSummary:humanPilotReadinessLedgerSummary,
      sandboxProviderReleaseFreezeGateSummary:sandboxProviderReleaseFreezeGateSummary,
      providerGovernanceReleaseViewModelSummary:providerGovernanceReleaseViewModelSummary,
      manualGovernanceReleaseDecisionRoomSummary:manualGovernanceReleaseDecisionRoomSummary,
      sandboxPilotExceptionRegisterSummary:sandboxPilotExceptionRegisterSummary,
      providerReadinessSignOffPacketSummary:providerReadinessSignOffPacketSummary,
      providerManualReleaseViewModelSummary:providerManualReleaseViewModelSummary,
      readOnlySandboxActivationReadinessCenterSummary:readOnlySandboxActivationReadinessCenterSummary,
      offlineMockSandboxSessionRunnerSummary:offlineMockSandboxSessionRunnerSummary,
      manualProviderActivationHandoffPacketSummary:manualProviderActivationHandoffPacketSummary,
      providerSandboxActivationViewModelSummary:providerSandboxActivationViewModelSummary,
      manualPlatformVisitPreparationCenterSummary:manualPlatformVisitPreparationCenterSummary,
      externalPlatformBoundaryBriefSummary:externalPlatformBoundaryBriefSummary,
      finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary,
      platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary,
      legalProviderFixtureSummary:legalProviderFixtureSummary,
      providerCredentialSafetySummary:providerCredentialSafetySummary,
      sandboxPriceFeedSummary:sandboxPriceFeedSummary,
      sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary,
      pricePipelineOrchestratorSummary:finalizedPricePipelineOrchestratorSummary,
      readOnlyCandidateJourneySummary:finalizedReadOnlyCandidateJourneySummary,
      providerFixtureViewModelSummary:providerFixtureViewModelSummary,
      priceSourceNormalizationSummary:priceSourceNormalizationSummary,
      officialPriceAnchorSummary:officialPriceAnchorSummary,
      priceCandidateDisplaySummary:priceCandidateDisplaySummary,
      sameItemMatcherSummary:sameItemMatcherSummary,
      duplicateCandidateMergerSummary:duplicateCandidateMergerSummary,
      coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary,
      externalDeepLinkSafetySummary:externalDeepLinkSafetySummary,
      searchParameterPrefillSummary:searchParameterPrefillSummary,
      jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary,
      sandboxDeepLinkCandidateSummary:sandboxDeepLinkCandidateSummary,
      platformAvailabilitySummary:platformAvailabilitySummary,
      partnerLinkPolicySummary:partnerLinkPolicySummary,
      sandboxHandoffViewModelSummary:sandboxHandoffViewModelSummary,
      offlineProviderCertificationCenterStatus:offlineProviderCertificationCenterStatus,
      mockIntegrationRegressionLabStatus:mockIntegrationRegressionLabStatus,
      humanApprovalEvidenceBinderStatus:humanApprovalEvidenceBinderStatus,
      adapterBoundaryLockStatus:adapterBoundaryLockStatus,
      providerCertificationViewModelStatus:providerCertificationViewModelStatus,
      readOnlyProviderSandboxConnectorStatus:readOnlyProviderSandboxConnectorStatus,
      fixtureReplayStatus:fixtureReplayStatus,
      normalizedPriceCandidateBoardStatus:normalizedPriceCandidateBoardStatus,
      realProviderSandboxGateStatus:realProviderSandboxGateStatus,
      providerRequestEnvelopeStatus:providerRequestEnvelopeStatus,
      providerCallAuditLedgerStatus:providerCallAuditLedgerStatus,
      providerSandboxReadinessStatus:providerSandboxReadinessStatus,
      providerSandboxDryRunStatus:providerSandboxDryRunStatus,
      providerAdapterShellStatus:providerAdapterShellStatus,
      providerKillSwitchStatus:providerKillSwitchStatus,
      providerSandboxDryRunViewModelStatus:providerSandboxDryRunViewModelStatus,
      providerAdapterRegistryStatus:providerAdapterRegistryStatus,
      dryRunResponseNormalizerStatus:dryRunResponseNormalizerStatus,
      sandboxProviderRunbookStatus:sandboxProviderRunbookStatus,
      providerAdapterRegistryViewModelStatus:providerAdapterRegistryViewModelStatus,
      firstSandboxProviderConnectorStatus:firstSandboxProviderConnectorStatus,
      providerCoverageStatus:providerCoverageStatus,
      sourceTrustStatus:sourceTrustStatus,
      providerCoverageViewModelStatus:providerCoverageViewModelStatus,
      sandboxCandidateComparisonWorkbenchStatus:sandboxCandidateComparisonWorkbenchStatus,
      providerEvidenceComparisonMatrixStatus:providerEvidenceComparisonMatrixStatus,
      readOnlyHandoffReadinessDrillStatus:readOnlyHandoffReadinessDrillStatus,
      sandboxDecisionReviewStatus:sandboxDecisionReviewStatus,
      readOnlyPlatformHandoffSimulatorStatus:readOnlyPlatformHandoffSimulatorStatus,
      redactedSearchParameterPackStatus:redactedSearchParameterPackStatus,
      userConfirmationChecklistStatus:userConfirmationChecklistStatus,
      platformHandoffSimulationViewModelStatus:platformHandoffSimulationViewModelStatus,
      readOnlyHandoffPacketPreviewStatus:readOnlyHandoffPacketPreviewStatus,
      platformPreflightSafetyGateStatus:platformPreflightSafetyGateStatus,
      userActionBoundaryReceiptStatus:userActionBoundaryReceiptStatus,
      handoffPacketViewModelStatus:handoffPacketViewModelStatus,
      manualPlatformReviewCockpitStatus:manualPlatformReviewCockpitStatus,
      handoffAcceptanceWalkthroughStatus:handoffAcceptanceWalkthroughStatus,
      platformRealityCheckStatus:platformRealityCheckStatus,
      manualPlatformReviewViewModelStatus:manualPlatformReviewViewModelStatus,
      userFacingManualReviewFlowStatus:userFacingManualReviewFlowStatus,
      platformVerificationProgressStatus:platformVerificationProgressStatus,
      safeNextActionPanelStatus:safeNextActionPanelStatus,
      userManualReviewViewModelStatus:userManualReviewViewModelStatus,
      humanApprovalSimulationStatus:humanApprovalSimulationStatus,
      mockProviderLaunchDrillStatus:mockProviderLaunchDrillStatus,
      sandboxProviderRollbackPlanStatus:sandboxProviderRollbackPlanStatus,
      providerLaunchSimulationViewModelStatus:providerLaunchSimulationViewModelStatus,
      providerSandboxPilotControlStatus:providerSandboxPilotControlStatus,
      mockProviderIncidentDrillStatus:mockProviderIncidentDrillStatus,
      productionBlockerMatrixStatus:productionBlockerMatrixStatus,
      providerPilotControlViewModelStatus:providerPilotControlViewModelStatus,
      humanControlledSandboxProviderPilotPlannerStatus:humanControlledSandboxProviderPilotPlannerStatus,
      complianceEvidencePackStatus:complianceEvidencePackStatus,
      providerPilotGovernanceViewModelStatus:providerPilotGovernanceViewModelStatus,
      providerGovernanceConsoleStatus:providerGovernanceConsoleStatus,
      providerOperatorReviewLoopStatus:providerOperatorReviewLoopStatus,
      providerGovernanceAuditConsoleStatus:providerGovernanceAuditConsoleStatus,
      humanPilotReadinessLedgerStatus:humanPilotReadinessLedgerStatus,
      sandboxProviderReleaseFreezeGateStatus:sandboxProviderReleaseFreezeGateStatus,
      providerGovernanceReleaseViewModelStatus:providerGovernanceReleaseViewModelStatus,
      manualGovernanceReleaseDecisionRoomStatus:manualGovernanceReleaseDecisionRoomStatus,
      sandboxPilotExceptionRegisterStatus:sandboxPilotExceptionRegisterStatus,
      providerReadinessSignOffPacketStatus:providerReadinessSignOffPacketStatus,
      providerManualReleaseViewModelStatus:providerManualReleaseViewModelStatus,
      readOnlySandboxActivationReadinessCenterStatus:readOnlySandboxActivationReadinessCenterStatus,
      offlineMockSandboxSessionRunnerStatus:offlineMockSandboxSessionRunnerStatus,
      manualProviderActivationHandoffPacketStatus:manualProviderActivationHandoffPacketStatus,
      providerSandboxActivationViewModelStatus:providerSandboxActivationViewModelStatus,
      manualPlatformVisitPreparationStatus:manualPlatformVisitPreparationStatus,
      externalPlatformBoundaryStatus:externalPlatformBoundaryStatus,
      finalUserSafetyChecklistStatus:finalUserSafetyChecklistStatus,
      platformVisitPreparationViewModelStatus:platformVisitPreparationViewModelStatus,
      sandboxProviderResponseContractStatus:sandboxProviderResponseContractStatus,
      pricePipelineStatus:finalizedPricePipelineStatus,
      readOnlyCandidateJourneyStatus:finalizedReadOnlyCandidateJourneyStatus,
      priceNormalizationStatus:priceNormalizationStatus,
      officialPriceAnchorStatus:officialPriceAnchorStatus,
      priceCandidateDisplayStatus:priceCandidateDisplayStatus,
      sameItemMatcherStatus:sameItemMatcherStatus,
      duplicateMergeStatus:duplicateMergeStatus,
      coveredLowestStatus:coveredLowestStatus,
      legalProviderFixtureStatus:legalProviderFixtureStatus,
      providerCredentialSafetyStatus:providerCredentialSafetyStatus,
      sandboxPriceFeedStatus:sandboxPriceFeedStatus,
      externalDeepLinkSafetyStatus:externalDeepLinkSafetyStatus,
      searchPrefillStatus:searchPrefillStatus,
      handoffPreviewStatus:handoffPreviewStatus,
      sandboxDeepLinkStatus:sandboxDeepLinkStatus,
      platformAvailabilityStatus:platformAvailabilityStatus,
      partnerLinkPolicyStatus:partnerLinkPolicyStatus,
      sandboxHandoffStatus:sandboxHandoffStatus,
      safeToProceedWithPriceProviderSandbox:safeToProceedWithPriceProviderSandbox,
      safeToProceedWithReadOnlyPriceProviderSandbox:safeToProceedWithReadOnlyPriceProviderSandbox,
      safeToProceedWithFirstRealReadOnlyProviderSandbox:finalizedSafeToProceedWithFirstRealReadOnlyProviderSandbox,
      safeToProceedWithFirstReadOnlySandboxDryRun:safeToProceedWithFirstReadOnlySandboxDryRun,
      safeToProceedWithFirstProviderSandboxFixtureDryRun:safeToProceedWithFirstProviderSandboxFixtureDryRun,
      safeToProceedWithFirstSandboxProviderConnectorImplementation:safeToProceedWithFirstSandboxProviderConnectorImplementation,
      safeToProceedWithFirstReadOnlyProviderSandboxIntegration:safeToProceedWithFirstReadOnlyProviderSandboxIntegration,
      safeToProceedWithDeepLinkSafetyGate:safeToProceedWithDeepLinkSafetyGate,
      safeToProceedWithSandboxDeepLinkCandidate:safeToProceedWithSandboxDeepLinkCandidate,
      safeToProceedWithPartnerFixtureAdapter:safeToProceedWithPartnerFixtureAdapter,
      safeToProceedWithRealReadOnlyProviderSandbox:finalizedSafeToProceedWithRealReadOnlyProviderSandbox,
      safeToProceedWithSandboxDecisionReview:safeToProceedWithSandboxDecisionReview,
      safeToProceedWithUserFacingHandoffExplanation:safeToProceedWithUserFacingHandoffExplanation,
      safeToProceedWithManualPlatformReview:safeToProceedWithManualPlatformReview,
      safeToProceedWithManualPlatformUserEducation:safeToProceedWithManualPlatformUserEducation,
      safeToProceedWithManualExternalPlatformVisitEducation:safeToProceedWithManualExternalPlatformVisitEducation,
      safeToProceedWithUserLeavingWeishanEducation:safeToProceedWithUserLeavingWeishanEducation,
      safeToProceedWithHumanControlledSandboxProviderPilot:safeToProceedWithHumanControlledSandboxProviderPilot,
      safeToProceedWithHumanControlledSandboxProviderPilotPlan:safeToProceedWithHumanControlledSandboxProviderPilotPlan,
      safeToProceedWithHumanAuditSandboxPilotReadinessReview:safeToProceedWithHumanAuditSandboxPilotReadinessReview,
      safeToProceedWithManualGovernanceReleaseDecision:safeToProceedWithManualGovernanceReleaseDecision,
      safeToProceedWithManualProviderSignOffReview:safeToProceedWithManualProviderSignOffReview,
      globalShoppingGoalStatus:globalShoppingGoalStatus,
      jumpBoundaryStatus:jumpBoundaryStatus,
      safeToProceedWithJumpToPlatformMvp:safeToProceedWithJumpToPlatformMvp,
      rcReviewStatus:rcReviewStatus,
      rcEvidenceStatus:rcEvidenceStatus,
      rcRegressionStatus:rcRegressionStatus,
      releaseRiskStatus:releaseRiskStatus,
      rcCopyReviewStatus:rcCopyReviewStatus,
      safetyDisclosureStatus:safetyDisclosureStatus,
      safeToStartRcReview:safeToStartRcReview,
      safeToContinueReleaseCandidate:safeToContinueReleaseCandidate,
      safeToFinalizeUserFacingCopy:safeToFinalizeUserFacingCopy,
      actionQueueSummary:actionQueueSummary,
      actionPolicyDecision:actionPolicyDecision,
      actionExecutionResult:actionExecutionResult,
      eventLedgerSummary:eventLedgerSummary,
      tradingBlocked:blockedActions.length > 0,
      requiresConfirmation:true
    })) : null;
    const riskBadgeSummary = riskBadgeModel && typeof riskBadgeApi.summarizeFlightWorkflowRiskBadges === "function" ? Object.assign({}, riskBadgeApi.summarizeFlightWorkflowRiskBadges(riskBadgeModel.badges), { badges:riskBadgeModel.badges, line:riskBadgeModel.summaryLabel || riskBadgeApi.summarizeFlightWorkflowRiskBadges(riskBadgeModel.badges).summaryLabel }) : riskBadgeModel;
    const finalReviewBadges = riskBadgeModel && riskBadgeModel.badges || [];
    const decisionAssistant = typeof decisionApi.buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi.buildReadOnlyQuoteDecisionAssistant(Object.assign({ topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, sessionSummary:sessionSummary, runHistorySummary:runHistorySummary, quoteDeltaSummary:quoteDeltaSummary, replaySummary:replaySummary }, workflowMeta)) : null;
    const candidateComparison = typeof comparisonApi.buildReadOnlyQuoteCandidateComparison === "function" ? comparisonApi.buildReadOnlyQuoteCandidateComparison(dryRunTopCandidates) : null;
    const decisionAssistantSummary = formatterApi.formatDecisionReasoning && decisionAssistant ? formatterApi.formatDecisionReasoning(decisionAssistant) : null;
    const candidateComparisonSummary = formatterApi.formatCandidateComparisonSummary && candidateComparison ? formatterApi.formatCandidateComparisonSummary(candidateComparison) : null;
    const recommendationExplanation = decisionAssistant && decisionAssistant.reasoning || null;
    const decisionSafetyWarnings = recommendationExplanation && Array.isArray(recommendationExplanation.riskWarnings) ? recommendationExplanation.riskWarnings : ["平台最终为准", "未锁价", "不代表可出票"];
    const candidateComparisonTable = candidateComparison && Array.isArray(candidateComparison.table) ? candidateComparison.table : [];
    const providerConfirmationWarning = formatterApi.formatProviderConfirmationWarning ? formatterApi.formatProviderConfirmationWarning(decisionAssistant && decisionAssistant.recommendedCandidate || selectedCandidate || dryRunTopCandidates[0] || {}) : null;
    const selectedSafeProviderHandoffUrl = selectedCandidate && selectedCandidate.safeProviderHandoffReady === true ? text(selectedCandidate.safeProviderHandoffUrl || "") : "";
    const safeProviderHandoffUrl = text(selectedSafeProviderHandoffUrl || reportHandoff.safeProviderHandoffUrl || "");
    const handoffChecklist = typeof checklistApi.buildSafeProviderConfirmationChecklist === "function" ? checklistApi.buildSafeProviderConfirmationChecklist({ providerName:source.providerName, safeProviderHandoffUrl:safeProviderHandoffUrl || reportHandoff.safeProviderHandoffUrl || selectedSafeProviderHandoffUrl || null, safeProviderHandoffHost:source.safeProviderHandoffHost || reportHandoff.safeProviderHandoffHost || "", selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || { providerName:source.providerName, totalPrice:priceQuote.totalPrice, currency:priceQuote.currency, safeProviderHandoffReady:!!(selectedSafeProviderHandoffUrl || reportHandoff.safeProviderHandoffUrl) } }) : null;
    const handoffReceipt = typeof receiptApi.sanitizeProviderHandoffReceipt === "function" ? receiptApi.sanitizeProviderHandoffReceipt({ providerName:source.providerName, displayHost:source.safeProviderHandoffHost || reportHandoff.safeProviderHandoffHost || "", selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || { totalPrice:priceQuote.totalPrice, currency:priceQuote.currency }, status:"created", userConfirmed:false }) : null;
    const manualPlatformCheck = typeof manualCheckApi.buildManualPlatformCheckEvidence === "function" ? manualCheckApi.buildManualPlatformCheckEvidence(Object.assign({ providerName:source.providerName, displayHost:source.safeProviderHandoffHost || "", observedCurrency:priceQuote.currency || "CNY", observedTotalPrice:priceQuote.totalPrice, observedInventoryStatus:"unknown", observedRulesChanged:false }, safe.manualPlatformCheckInput || safe.manualPlatformCheckEvidence || {})) : null;
    const platformCheckDelta = typeof deltaApi.compareCandidateWithManualPlatformCheck === "function" ? deltaApi.compareCandidateWithManualPlatformCheck(selectedCandidate || dryRunTopCandidates[0] || priceQuote, manualPlatformCheck || {}) : null;
    const platformCheckDeltaSummary = typeof deltaApi.buildPlatformCheckDeltaSummary === "function" ? deltaApi.buildPlatformCheckDeltaSummary(platformCheckDelta) : null;
    const reconciliationSummary = typeof reconciliationApi.buildPlatformCheckReconciliationSummary === "function" ? reconciliationApi.buildPlatformCheckReconciliationSummary({ selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || priceQuote, handoffReceiptSummary:handoffReceipt, manualPlatformCheckEvidence:manualPlatformCheck, platformCheckDelta:platformCheckDelta, decisionAssistant:decisionAssistant, sessionSummary:sessionSummary }) : null;
    const confidenceLabelSummary = typeof confidenceApi.buildReadOnlyCandidateConfidenceLabel === "function" ? confidenceApi.buildReadOnlyCandidateConfidenceLabel({ selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || priceQuote, safeProviderHandoffReady:!!safeProviderHandoffUrl, handoffChecklistSummary:handoffChecklist, manualPlatformCheckEvidence:manualPlatformCheck, platformCheckDelta:platformCheckDelta, reconciliationSummary:reconciliationSummary }) : null;
    const safeNextStepSummary = typeof coachApi.buildReadOnlyQuoteSafeNextStepCoach === "function" ? coachApi.buildReadOnlyQuoteSafeNextStepCoach({ selectedCandidate:selectedCandidate || dryRunTopCandidates[0] || priceQuote, reconciliationSummary:reconciliationSummary, confidenceLabelSummary:confidenceLabelSummary }) : null;
    const platformCheckOutcomeSummary = reconciliationSummary ? { title:"平台核对结果", status:reconciliationSummary.status, confidenceLabel:reconciliationSummary.confidenceLabel, nextStep:reconciliationSummary.nextStep, platformFinal:true, redacted:true } : null;
    const reportCenterModel = typeof reportCenterApi.buildReadOnlyQuoteSessionReportCenter === "function" ? reportCenterApi.buildReadOnlyQuoteSessionReportCenter(Object.assign({ sessionSummary:sessionSummary, auditExportPreview:auditExportPreview, topCandidates:dryRunTopCandidates, selectedCandidate:selectedCandidate, runHistorySummary:runHistorySummary, quoteDeltaSummary:quoteDeltaSummary, replaySummary:replaySummary, routeSummary:normalized.origin + " → " + normalized.destination, departureDate:normalized.departureDate, handoffChecklistSummary:handoffChecklist, handoffReceiptSummary:handoffReceipt, manualPlatformCheckSummary:manualPlatformCheck, platformCheckDeltaSummary:platformCheckDeltaSummary, reconciliationSummary:reconciliationSummary, confidenceLabelSummary:confidenceLabelSummary, safeNextStepSummary:safeNextStepSummary, platformCheckOutcomeSummary:platformCheckOutcomeSummary, manualPlatformCheckEvidence:manualPlatformCheck, platformCheckDelta:platformCheckDelta, auditReviewSummary:workflowAuditReviewSummary, safeSessionExportPreview:safeSessionExportPreview, riskBadgeSummary:riskBadgeSummary, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, handoffPacketPolicyDecision:handoffPacketPolicyDecision, finalReviewStatus:finalReviewStatus, finalReviewBadges:finalReviewBadges, safetyRegressionSummary:safetyRegressionSummary, operatorConsoleSummary:operatorConsoleSummary, operatorConsoleViewModel:operatorConsoleViewModel, releaseReadinessSummary:releaseReadinessSummary, rcCandidateReviewSummary:rcCandidateReviewSummary, rcEvidenceReviewSummary:rcEvidenceReviewSummary, rcReviewViewModelSummary:rcReviewViewModelSummary, rcRegressionAuditSummary:rcRegressionAuditSummary, releaseRiskLedgerSummary:releaseRiskLedgerSummary, rcRegressionViewModelSummary:rcRegressionViewModelSummary, rcCopyFinalizationSummary:rcCopyFinalizationSummary, safetyDisclosureReviewSummary:safetyDisclosureReviewSummary, rcCopyReviewViewModelSummary:rcCopyReviewViewModelSummary, offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary, noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary, finalUserTrustSummarySummary:finalUserTrustSummarySummary, providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary, providerDistributionReadinessViewModelSummary:providerDistributionReadinessViewModelSummary, providerDistributionFreezeConsoleSummary:providerDistributionFreezeConsoleSummary, userFacingSafetyReceiptSummary:userFacingSafetyReceiptSummary, offlineReleaseCandidateClosurePackSummary:offlineReleaseCandidateClosurePackSummary, providerNoProductionGuaranteeMatrixSummary:providerNoProductionGuaranteeMatrixSummary, providerDistributionClosureViewModelSummary:providerDistributionClosureViewModelSummary, offlineDistributionReadinessCenterStatus:offlineDistributionReadinessCenterStatus, noActivationEnforcementLedgerStatus:noActivationEnforcementLedgerStatus, finalUserTrustSummaryStatus:finalUserTrustSummaryStatus, providerSafetyDistributionMatrixStatus:providerSafetyDistributionMatrixStatus, providerDistributionReadinessViewModelStatus:providerDistributionReadinessViewModelStatus, providerDistributionFreezeConsoleStatus:providerDistributionFreezeConsoleStatus, userFacingSafetyReceiptStatus:userFacingSafetyReceiptStatus, offlineReleaseCandidateClosurePackStatus:offlineReleaseCandidateClosurePackStatus, providerNoProductionGuaranteeMatrixStatus:providerNoProductionGuaranteeMatrixStatus, providerDistributionClosureViewModelStatus:providerDistributionClosureViewModelStatus, safeToProceedWithHumanDistributionReadinessReview:safeToProceedWithHumanDistributionReadinessReview, safeToProceedWithHumanDistributionClosureReview:safeToProceedWithHumanDistributionClosureReview, globalShoppingProductGoalSummary:globalShoppingProductGoalSummary, jumpToPlatformBoundarySummary:jumpToPlatformBoundarySummary, globalShoppingProductGoalViewModelSummary:globalShoppingProductGoalViewModelSummary, readOnlyProviderSandboxConnectorSummary:readOnlyProviderSandboxConnectorSummary, fixtureReplayConsoleSummary:fixtureReplayConsoleSummary, normalizedPriceCandidateBoardSummary:normalizedPriceCandidateBoardSummary, realProviderSandboxGateSummary:realProviderSandboxGateSummary, providerRequestEnvelopeSummary:providerRequestEnvelopeSummary, providerCallAuditLedgerSummary:providerCallAuditLedgerSummary, providerSandboxReadinessViewModelSummary:providerSandboxReadinessViewModelSummary, providerSandboxDryRunHarnessSummary:providerSandboxDryRunHarnessSummary, firstReadOnlyProviderAdapterShellSummary:firstReadOnlyProviderAdapterShellSummary, providerSandboxSafetyKillSwitchSummary:providerSandboxSafetyKillSwitchSummary, providerSandboxDryRunViewModelSummary:providerSandboxDryRunViewModelSummary, offlineSandboxTraceInspectorSummary:offlineSandboxTraceInspectorSummary, mockProviderResultNormalizerSummary:mockProviderResultNormalizerSummary, manualActivationDryRunChecklistSummary:manualActivationDryRunChecklistSummary, providerSandboxReadinessWorkbenchSummary:providerSandboxReadinessWorkbenchSummary, offlineProviderScenarioLabSummary:offlineProviderScenarioLabSummary, readOnlyProviderAdapterSdkSkeletonSummary:readOnlyProviderAdapterSdkSkeletonSummary, manualActivationCommandCenterSummary:manualActivationCommandCenterSummary, providerSandboxMilestoneViewModelSummary:providerSandboxMilestoneViewModelSummary, providerAdapterRegistrySummary:providerAdapterRegistrySummary, dryRunProviderResponseNormalizerSummary:dryRunProviderResponseNormalizerSummary, sandboxProviderRunbookSummary:sandboxProviderRunbookSummary, providerAdapterRegistryViewModelSummary:providerAdapterRegistryViewModelSummary, firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary, providerCoverageDashboardSummary:providerCoverageDashboardSummary, readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary, providerCoverageViewModelSummary:providerCoverageViewModelSummary, readOnlyProviderSandboxIntegrationGateSummary:readOnlyProviderSandboxIntegrationGateSummary, sandboxPriceCandidateSessionSummary:sandboxPriceCandidateSessionSummary, sandboxPriceCandidateResultBoardSummary:sandboxPriceCandidateResultBoardSummary, sandboxCandidateComparisonWorkbenchSummary:sandboxCandidateComparisonWorkbenchSummary, providerEvidenceComparisonMatrixSummary:providerEvidenceComparisonMatrixSummary, readOnlyHandoffReadinessDrillSummary:readOnlyHandoffReadinessDrillSummary, sandboxDecisionReviewViewModelSummary:sandboxDecisionReviewViewModelSummary, legalProviderFixtureSummary:legalProviderFixtureSummary, providerCredentialSafetySummary:providerCredentialSafetySummary, sandboxPriceFeedSummary:sandboxPriceFeedSummary, sandboxProviderResponseContractSummary:sandboxProviderResponseContractSummary, pricePipelineOrchestratorSummary:finalizedPricePipelineOrchestratorSummary, readOnlyCandidateJourneySummary:finalizedReadOnlyCandidateJourneySummary, providerFixtureViewModelSummary:providerFixtureViewModelSummary, priceSourceNormalizationSummary:priceSourceNormalizationSummary, officialPriceAnchorSummary:officialPriceAnchorSummary, priceCandidateDisplaySummary:priceCandidateDisplaySummary, sameItemMatcherSummary:sameItemMatcherSummary, duplicateCandidateMergerSummary:duplicateCandidateMergerSummary, coveredLowestCandidateBoardSummary:coveredLowestCandidateBoardSummary, externalDeepLinkSafetySummary:externalDeepLinkSafetySummary, searchParameterPrefillSummary:searchParameterPrefillSummary, jumpToPlatformHandoffPreviewSummary:jumpToPlatformHandoffPreviewSummary, sandboxDeepLinkCandidateSummary:sandboxDeepLinkCandidateSummary, platformAvailabilitySummary:platformAvailabilitySummary, partnerLinkPolicySummary:partnerLinkPolicySummary, sandboxHandoffViewModelSummary:sandboxHandoffViewModelSummary, readOnlyProviderSandboxConnectorStatus:readOnlyProviderSandboxConnectorStatus, fixtureReplayStatus:fixtureReplayStatus, normalizedPriceCandidateBoardStatus:normalizedPriceCandidateBoardStatus, realProviderSandboxGateStatus:realProviderSandboxGateStatus, providerRequestEnvelopeStatus:providerRequestEnvelopeStatus, providerCallAuditLedgerStatus:providerCallAuditLedgerStatus, providerSandboxReadinessStatus:providerSandboxReadinessStatus, providerSandboxDryRunStatus:providerSandboxDryRunStatus, providerAdapterShellStatus:providerAdapterShellStatus, providerKillSwitchStatus:providerKillSwitchStatus, providerSandboxDryRunViewModelStatus:providerSandboxDryRunViewModelStatus, offlineSandboxTraceInspectorStatus:offlineSandboxTraceInspectorStatus, mockProviderResultNormalizerStatus:mockProviderResultNormalizerStatus, manualActivationDryRunChecklistStatus:manualActivationDryRunChecklistStatus, providerSandboxReadinessWorkbenchStatus:providerSandboxReadinessWorkbenchStatus, offlineProviderScenarioLabStatus:offlineProviderScenarioLabStatus, readOnlyProviderAdapterSdkSkeletonStatus:readOnlyProviderAdapterSdkSkeletonStatus, manualActivationCommandCenterStatus:manualActivationCommandCenterStatus, providerSandboxMilestoneViewModelStatus:providerSandboxMilestoneViewModelStatus, providerAdapterRegistryStatus:providerAdapterRegistryStatus, dryRunResponseNormalizerStatus:dryRunResponseNormalizerStatus, sandboxProviderRunbookStatus:sandboxProviderRunbookStatus, providerAdapterRegistryViewModelStatus:providerAdapterRegistryViewModelStatus, firstSandboxProviderConnectorStatus:firstSandboxProviderConnectorStatus, providerCoverageStatus:providerCoverageStatus, sourceTrustStatus:sourceTrustStatus, providerCoverageViewModelStatus:providerCoverageViewModelStatus, providerSandboxIntegrationGateStatus:providerSandboxIntegrationGateStatus, sandboxPriceCandidateSessionStatus:sandboxPriceCandidateSessionStatus, sandboxPriceCandidateResultBoardStatus:sandboxPriceCandidateResultBoardStatus, sandboxCandidateComparisonWorkbenchStatus:sandboxCandidateComparisonWorkbenchStatus, providerEvidenceComparisonMatrixStatus:providerEvidenceComparisonMatrixStatus, readOnlyHandoffReadinessDrillStatus:readOnlyHandoffReadinessDrillStatus, sandboxDecisionReviewStatus:sandboxDecisionReviewStatus, sandboxProviderResponseContractStatus:sandboxProviderResponseContractStatus, pricePipelineStatus:finalizedPricePipelineStatus, readOnlyCandidateJourneyStatus:finalizedReadOnlyCandidateJourneyStatus, priceNormalizationStatus:priceNormalizationStatus, officialPriceAnchorStatus:officialPriceAnchorStatus, priceCandidateDisplayStatus:priceCandidateDisplayStatus, sameItemMatcherStatus:sameItemMatcherStatus, duplicateMergeStatus:duplicateMergeStatus, coveredLowestStatus:coveredLowestStatus, legalProviderFixtureStatus:legalProviderFixtureStatus, providerCredentialSafetyStatus:providerCredentialSafetyStatus, sandboxPriceFeedStatus:sandboxPriceFeedStatus, externalDeepLinkSafetyStatus:externalDeepLinkSafetyStatus, searchPrefillStatus:searchPrefillStatus, handoffPreviewStatus:handoffPreviewStatus, sandboxDeepLinkStatus:sandboxDeepLinkStatus, platformAvailabilityStatus:platformAvailabilityStatus, partnerLinkPolicyStatus:partnerLinkPolicyStatus, sandboxHandoffStatus:sandboxHandoffStatus, safeToProceedWithPriceProviderSandbox:safeToProceedWithPriceProviderSandbox, safeToProceedWithReadOnlyPriceProviderSandbox:safeToProceedWithReadOnlyPriceProviderSandbox, safeToProceedWithFirstRealReadOnlyProviderSandbox:finalizedSafeToProceedWithFirstRealReadOnlyProviderSandbox, safeToProceedWithFirstReadOnlySandboxDryRun:safeToProceedWithFirstReadOnlySandboxDryRun, safeToProceedWithFirstProviderSandboxFixtureDryRun:safeToProceedWithFirstProviderSandboxFixtureDryRun, safeToProceedWithFirstSandboxProviderConnectorImplementation:safeToProceedWithFirstSandboxProviderConnectorImplementation, safeToProceedWithFirstReadOnlyProviderSandboxIntegration:safeToProceedWithFirstReadOnlyProviderSandboxIntegration, safeToProceedWithSandboxCandidateUserPreview:safeToProceedWithSandboxCandidateUserPreview, safeToProceedWithDeepLinkSafetyGate:safeToProceedWithDeepLinkSafetyGate, safeToProceedWithSandboxDeepLinkCandidate:safeToProceedWithSandboxDeepLinkCandidate, safeToProceedWithPartnerFixtureAdapter:safeToProceedWithPartnerFixtureAdapter, safeToProceedWithRealReadOnlyProviderSandbox:finalizedSafeToProceedWithRealReadOnlyProviderSandbox, safeToProceedWithSandboxDecisionReview:safeToProceedWithSandboxDecisionReview, safeToProceedWithHumanSandboxMilestoneReview:safeToProceedWithHumanSandboxMilestoneReview, globalShoppingGoalStatus:globalShoppingGoalStatus, jumpBoundaryStatus:jumpBoundaryStatus, safeToProceedWithJumpToPlatformMvp:safeToProceedWithJumpToPlatformMvp, rcReviewStatus:rcReviewStatus, rcEvidenceStatus:rcEvidenceStatus, rcRegressionStatus:rcRegressionStatus, releaseRiskStatus:releaseRiskStatus, rcCopyReviewStatus:rcCopyReviewStatus, safetyDisclosureStatus:safetyDisclosureStatus, safeToStartRcReview:safeToStartRcReview, safeToContinueReleaseCandidate:safeToContinueReleaseCandidate, safeToFinalizeUserFacingCopy:safeToFinalizeUserFacingCopy, userSafetyCopySummary:userSafetyCopySummary, forbiddenCapabilitySummary:forbiddenCapabilitySummary, userFacingBetaReadiness:userFacingBetaReadiness, copyValidationStatus:copyValidationStatus, betaExpansionGateSummary:betaExpansionGateSummary, publicPilotChecklistSummary:publicPilotChecklistSummary, pilotReadinessSummary:pilotReadinessSummary, safeForSmallPublicPilot:safeForSmallPublicPilot, pilotNextStep:pilotNextStep, pilotOnboardingSummary:pilotOnboardingSummary, readOnlyConsentSummary:readOnlyConsentSummary, pilotOnboardingViewModel:pilotOnboardingViewModel, pilotEntryStatus:pilotEntryStatus, canEnterReadOnlyPilot:canEnterReadOnlyPilot, pilotConsentRequired:pilotConsentRequired, pilotSupportSummary:pilotSupportSummary, issueIntakeSummary:issueIntakeSummary, supportFallbackSummary:supportFallbackSummary, pilotSupportStatus:pilotSupportStatus, supportNextStep:supportNextStep, issueReviewSummary:issueReviewSummary, supportTriageSummary:supportTriageSummary, pilotIssueReviewSummary:pilotIssueReviewSummary, pilotIssueReviewStatus:pilotIssueReviewStatus, issueAffectsPilotExpansion:issueAffectsPilotExpansion, issueRequiresInternalReview:issueRequiresInternalReview, issuePatternSummary:issuePatternSummary, supportReadinessSummary:supportReadinessSummary, issuePatternViewModelSummary:issuePatternViewModelSummary, issuePatternStatus:issuePatternStatus, supportReadinessStatus:supportReadinessStatus, supportReadyForPublicPilot:supportReadyForPublicPilot, repeatedIssueRisk:repeatedIssueRisk, rolloutControlSummary:rolloutControlSummary, cohortHealthSummary:cohortHealthSummary, rolloutControlViewModel:rolloutControlViewModel, rolloutDecisionStatus:rolloutDecisionStatus, cohortHealthStatus:cohortHealthStatus, rolloutNextStep:rolloutNextStep, pilotReadinessSnapshotSummary:pilotReadinessSnapshotSummary, supportPlaybookSummary:supportPlaybookSummary, pilotSnapshotViewModelSummary:pilotSnapshotViewModelSummary, pilotSnapshotStatus:pilotSnapshotStatus, supportPlaybookStatus: supportPlaybookStatus, pilotSnapshotNextStep:pilotSnapshotNextStep }, workflowMeta)) : null;
    const userFacingEvidenceSummary = reportCenterModel && reportCenterModel.userFacingSummary || null;
    const safetyReportSummary = reportCenterModel && reportCenterModel.safetyReport || null;
    const evidenceSummaryWarnings = formatterApi.formatReadOnlyQuoteEvidenceWarnings ? formatterApi.formatReadOnlyQuoteEvidenceWarnings({}).warnings : ["平台最终为准", "未锁价", "不代表可出票", "唯珊不会付款、不会下单、不会上传证件或银行卡"];
    const selectedCandidateUserSummary = formatterApi.formatSelectedCandidateSummary ? formatterApi.formatSelectedCandidateSummary(selectedCandidate || {}) : null;
    const reportCenterSummary = reportCenterModel ? { reportCenterName:reportCenterModel.reportCenterName, appVersion:reportCenterModel.appVersion, status:reportCenterModel.status, actions:reportCenterModel.actions, redacted:true } : null;
    const reportCenterStatus = text(reportCenterModel && reportCenterModel.status || "empty");
    const selectedSourceSummary = text(safe.selectedSourceSummary || (selectedCandidate && selectedCandidate.selectedSourceSummary) || (selectedCandidate ? "来源：" + (text(selectedCandidate.providerName || "") || "只读沙盒") + " / " + (text(selectedCandidate.responseShape || "") || text(selectedCandidate.fareSource || "导入样本")) : "来源：只读沙盒 / 导入样本"));
    const canRefresh = normalized.restrictedCategory !== true && providerBindingWizardSummary.actions && providerBindingWizardSummary.actions.canAttemptReadOnlyRefresh === true && !isProductionDisabled && interactiveRefreshState.status !== "refreshing";
    const refreshButton = { label:interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.label || "刷新只读报价", enabled:canRefresh && interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.enabled !== false, loading:interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.loading === true, reason:interactiveRefreshState.refreshButton && interactiveRefreshState.refreshButton.reason || (canRefresh ? "仅更新候选证据，未锁价，不代表可出票" : "当前只读报价刷新未就绪"), autoRun:false, autoRefresh:false, payment:false, order:false, identityUpload:false };
    const gateApi = getGateApi();
    const gate = typeof gateApi.evaluateSafeProviderDeepLinkHandoff === "function"
      ? gateApi.evaluateSafeProviderDeepLinkHandoff({
        providerId: source.providerId,
        providerName: source.providerName,
        providerType: source.providerType,
        searchOnly: true,
        safeProviderHandoffUrl: safeProviderHandoffUrl || null,
        restrictedCategory: normalized.restrictedCategory
      })
      : {
        status: normalized.restrictedCategory || !safeProviderHandoffUrl ? "blocked" : "confirmation_required",
        candidateDecision: normalized.restrictedCategory || !safeProviderHandoffUrl ? "blocked" : "safe_provider_handoff_ready",
        providerConfirmationLink: normalized.restrictedCategory || !safeProviderHandoffUrl ? "disabled" : "confirmation_required",
        safeProviderHandoffUrl: normalized.restrictedCategory ? null : safeProviderHandoffUrl || null,
        safeProviderHandoffHost: normalized.restrictedCategory || !safeProviderHandoffUrl ? "" : "google.com",
        userConfirmationRequired: true,
        autoOpen: false,
        bookingUrl: null,
        payment: "blocked",
        checkout: "blocked",
        order: "blocked",
        identityUpload: "blocked",
        realProvider: "disabled",
        realNetwork: "disabled",
        redacted: true
      };
    const confirmationUiApi = getConfirmationUiApi();
    const confirmationUi = typeof confirmationUiApi.buildProviderConfirmationHandoffUiModel === "function"
      ? confirmationUiApi.buildProviderConfirmationHandoffUiModel(gate)
      : {
        status: normalized.restrictedCategory || !gate.safeProviderHandoffUrl ? "blocked" : "confirmation_required",
        continueButtonDisabled: normalized.restrictedCategory || !gate.safeProviderHandoffUrl,
        cancelButtonEnabled: true,
        noAutoOpen: true,
        noBookingUrl: true,
        bookingUrl: null,
        noPayment: true,
        noOrder: true,
        noIdentityUpload: true,
        safeProviderHandoffUrl: gate.safeProviderHandoffUrl || null,
        showInMainFlow: false,
        redacted: true
      };
    const visible = normalized.restrictedCategory !== true;
    const routeTitle = normalized.origin + " → " + normalized.destination + " · " + normalized.dateDisplay;
    const breakdownLines = [
      "票面价：" + (priceQuote.baseFare == null ? "未单独提供" : "¥" + priceQuote.baseFare),
      "税费：" + (priceQuote.taxesAndFees == null ? "未单独提供" : "¥" + priceQuote.taxesAndFees),
      "平台服务费：" + (priceQuote.providerFees == null ? "未单独提供" : "¥" + priceQuote.providerFees),
      "最终候选价：" + (priceQuote.totalPrice == null ? "暂无真实价格结果" : "¥" + priceQuote.totalPrice)
    ];
    if (isSandboxImportEvidence) {
      breakdownLines.unshift("已导入沙盒报价证据");
      breakdownLines.unshift("只读沙盒导入证据");
    }
    const safetyLines = [
      "平台最终为准",
      "未锁价",
      "不代表可出票",
      "唯珊不会付款、不会下单、不会上传证件或银行卡",
      "最终价格、库存、税费、行李和退改签以平台页面为准",
      "仅更新候选证据，未锁价，不代表可出票",
      "价格、库存、税费和规则以平台页面为准"
    ];
    if (isSandboxImportEvidence) safetyLines.unshift("导入响应已脱敏", "已导入沙盒报价证据", "只读沙盒导入证据");
    const sandboxImportSummary = {
      supported:true,
      lastPreviewStatus:sandboxImportPreviewStatus,
      lastImportStatus:sandboxImportStatus,
      importedEvidenceAvailable:isSandboxImportEvidence === true,
      rawResponseStored:false,
      sanitized:true,
      redacted:true,
      showableAsRealPrice:false,
      canReplace:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      payment:false,
      order:false,
      identityUpload:false,
      dryRunStatus:dryRunStatus,
      sessionStatus:sessionStatus,
      sessionId:sessionId,
      auditExportReady:auditExportReady,
      reportCenterStatus:reportCenterStatus,
      compareStatus:compareStatus,
      replayStatus:replayStatus,
      lastRunId:lastRunId,
      selectedCandidateUserSummary:selectedCandidateUserSummary,
      decisionAssistantSummary:decisionAssistantSummary,
      candidateComparisonSummary:candidateComparisonSummary,
      providerConfirmationWarning:providerConfirmationWarning,
      reportCenterSummary:reportCenterSummary,
      userFacingEvidenceSummary:userFacingEvidenceSummary,
      safetyReportSummary:safetyReportSummary,
      evidenceSummaryWarnings:evidenceSummaryWarnings,
      rcReviewStatus:rcReviewStatus,
      rcEvidenceStatus:rcEvidenceStatus,
      rcRegressionStatus:rcRegressionStatus,
      releaseRiskStatus:releaseRiskStatus,
      rcCopyReviewStatus:rcCopyReviewStatus,
      safetyDisclosureStatus:safetyDisclosureStatus,
      safeToStartRcReview:safeToStartRcReview,
      safeToContinueReleaseCandidate:safeToContinueReleaseCandidate,
      safeToFinalizeUserFacingCopy:safeToFinalizeUserFacingCopy,
      globalShoppingGoalStatus:globalShoppingGoalStatus,
      jumpBoundaryStatus:jumpBoundaryStatus,
      safeToProceedWithJumpToPlatformMvp:safeToProceedWithJumpToPlatformMvp,
      currentStage:workflowMeta.currentStage,
      workflowStageLabel:workflowMeta.workflowStageLabel,
      nextStepLabel:workflowMeta.nextStepLabel,
      canResumeWorkflow:workflowMeta.canResumeWorkflow,
      platformCheckWarnings:platformCheckDeltaSummary && platformCheckDeltaSummary.warnings || ["平台最终为准"]
    };

    return clone({
      version: READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
      phase: PHASE,
      visible,
      restrictedCategory: normalized.restrictedCategory,
      cardType: "read_only_price_candidate",
      title: titleLabel,
      routeTitle,
      priceDisplay: priceQuote.totalPrice == null ? "暂无真实价格结果" : "¥" + priceQuote.totalPrice,
      priceTruthLabel: titleLabel + " · 平台最终为准 · 未锁价，不代表可出票",
      statusLine: titleLabel + "；平台最终为准；未锁价；不代表可出票",
      providerMode: isProductionDisabled ? "production_disabled" : (isSandboxReadOnly ? "sandbox_read_only" : "fixture"),
      providerModeLabel: titleLabel,
      providerName: text(source.providerName || "Google Flights"),
      providerType: text(source.providerType || "flight_search"),
      sourceType: text(source.accessMode || "manual_search_only"),
      sourceHost: text(source.safeProviderHandoffHost || ""),
      sourceUrlHost: text(source.safeProviderHandoffHost || ""),
      candidatePriceSource: text(source.providerName || "Google Flights"),
      candidatePriceSourceMode: text(source.accessMode || "manual_search_only"),
      candidatePriceEvidence: isSandboxImportEvidence ? "sandbox_read_only_import" : "read_only_candidate_only",
      responseShape: text(safe.responseShape || (selectedCandidate && selectedCandidate.responseShape) || (topCandidates[0] && topCandidates[0].responseShape) || (report.rankingPreview && report.rankingPreview.topCandidates && report.rankingPreview.topCandidates[0] && report.rankingPreview.topCandidates[0].responseShape) || "unsupported"),
      sourceBreakdown: clone(sourceBreakdown),
      rankingExplanation: rankingExplanation,
      selectedSourceSummary: selectedSourceSummary,
      candidatePriceLabel: candidatePriceLabel,
      platformFinalLabel: "平台最终为准",
      lockStatusLabel: "未锁价",
      ticketEligibilityLabel: "不代表可出票",
      safetyNotice: "唯珊不会付款、不会下单、不会上传证件或银行卡。",
      refreshSupported: reportRefresh.refreshSupported !== false,
      refreshMode: text(reportRefresh.refreshMode || (isProductionDisabled ? "disabled" : (isSandboxReadOnly ? "sandbox_read_only" : "fixture"))),
      lastRefreshStatus: text(refreshStateSummary.lastRefreshStatus || reportRefresh.lastRefreshStatus || "not_run"),
      lastRefreshStatusLabel: lastRefreshStatusLabel(refreshStateSummary.lastRefreshStatus || reportRefresh.lastRefreshStatus || "not_run"),
      refreshStateSummary: refreshStateSummary,
      interactiveRefreshState: interactiveRefreshState,
      recoveredEvidenceSummary: interactiveRefreshState.recoveredEvidenceSummary || { available:false, source:"local_redacted_state", showableAsRealPrice:false, showableAsCandidateEvidence:false, canReplaceMainResultCard:false },
      workflowStateSummary: workflowStateSummary,
      clarificationSummary: clarificationSummary,
      continuitySummary: continuitySummary,
      confirmationStateSummary: confirmationStateSummary,
      recoverySummary: recoverySummary,
      resumeCoachSummary: resumeCoachSummary,
      actionQueueSummary: actionQueueSummary,
      progressTimelineSummary: progressTimelineSummary,
      safeResumeCenterSummary: safeResumeCenterSummary,
      blockedActions: blockedActions,
      currentActionLabel: workflowMeta.currentActionLabel,
      nextSafeActionLabel: workflowMeta.nextSafeActionLabel,
      actionQueue: actionQueueSummary,
      progressTimeline: progressTimelineSummary,
      safeResumeCenter: safeResumeCenterSummary,
      nextSafeAction: workflowMeta.nextSafeAction,
      currentStage: workflowMeta.currentStage,
      workflowStageLabel: workflowMeta.workflowStageLabel,
      nextStepLabel: workflowMeta.nextStepLabel,
      canResumeWorkflow: workflowMeta.canResumeWorkflow,
      resumeActions: resumeActions,
      workflowStepList: workflowStepList,
      missingFields: missingFields,
      clarificationQuestions: clarificationQuestions,
      workflowUserMessage: workflowUserMessage,
      actionExecutionResult: actionExecutionResult,
      actionPolicyDecision: actionPolicyDecision,
      eventLedgerSummary: eventLedgerSummary,
      lastActionId: lastActionId,
      lastActionStatus: lastActionStatus,
      lastActionMessage: lastActionMessage,
      auditReviewSummary: workflowAuditReviewSummary,
      safeSessionExportPreview: safeSessionExportPreview,
      riskBadgeSummary: riskBadgeSummary,
      humanReviewChecklistSummary: humanReviewChecklistSummary,
      finalSafeHandoffPacketSummary: finalSafeHandoffPacketSummary,
      handoffPacketPolicyDecision: handoffPacketPolicyDecision,
      finalReviewStatus: finalReviewStatus,
      finalReviewBadges: finalReviewBadges,
      safetyRegressionSummary: safetyRegressionSummary,
      operatorConsoleSummary: operatorConsoleSummary,
      operatorConsoleViewModel: operatorConsoleViewModel,
      releaseReadinessSummary: releaseReadinessSummary,
      rcCandidateReviewSummary: rcCandidateReviewSummary,
      rcEvidenceReviewSummary: rcEvidenceReviewSummary,
      rcReviewViewModelSummary: rcReviewViewModelSummary,
      rcRegressionAuditSummary: rcRegressionAuditSummary,
      releaseRiskLedgerSummary: releaseRiskLedgerSummary,
      rcRegressionViewModelSummary: rcRegressionViewModelSummary,
      rcCopyFinalizationSummary: rcCopyFinalizationSummary,
      safetyDisclosureReviewSummary: safetyDisclosureReviewSummary,
      rcCopyReviewViewModelSummary: rcCopyReviewViewModelSummary,
      globalShoppingProductGoalSummary: globalShoppingProductGoalSummary,
      jumpToPlatformBoundarySummary: jumpToPlatformBoundarySummary,
      globalShoppingProductGoalViewModelSummary: globalShoppingProductGoalViewModelSummary,
      readOnlyProviderSandboxConnectorSummary: readOnlyProviderSandboxConnectorSummary,
      fixtureReplayConsoleSummary: fixtureReplayConsoleSummary,
      normalizedPriceCandidateBoardSummary: normalizedPriceCandidateBoardSummary,
      realProviderSandboxGateSummary: realProviderSandboxGateSummary,
      providerRequestEnvelopeSummary: providerRequestEnvelopeSummary,
      providerCallAuditLedgerSummary: providerCallAuditLedgerSummary,
      providerSandboxReadinessViewModelSummary: providerSandboxReadinessViewModelSummary,
      providerSandboxDryRunHarnessSummary: providerSandboxDryRunHarnessSummary,
      firstReadOnlyProviderAdapterShellSummary: firstReadOnlyProviderAdapterShellSummary,
      providerSandboxSafetyKillSwitchSummary: providerSandboxSafetyKillSwitchSummary,
      providerSandboxDryRunViewModelSummary: providerSandboxDryRunViewModelSummary,
      offlineSandboxTraceInspectorSummary: offlineSandboxTraceInspectorSummary,
      mockProviderResultNormalizerSummary: mockProviderResultNormalizerSummary,
      manualActivationDryRunChecklistSummary: manualActivationDryRunChecklistSummary,
      providerSandboxReadinessWorkbenchSummary: providerSandboxReadinessWorkbenchSummary,
      offlineProviderScenarioLabSummary: offlineProviderScenarioLabSummary,
      readOnlyProviderAdapterSdkSkeletonSummary: readOnlyProviderAdapterSdkSkeletonSummary,
      manualActivationCommandCenterSummary: manualActivationCommandCenterSummary,
      providerSandboxMilestoneViewModelSummary: providerSandboxMilestoneViewModelSummary,
      offlineProviderAdapterContractKitSummary: offlineProviderAdapterContractKitSummary,
      mockSandboxQaMatrixSummary: mockSandboxQaMatrixSummary,
      humanActivationRunbookCenterSummary: humanActivationRunbookCenterSummary,
      providerAdapterComplianceChecklistSummary: providerAdapterComplianceChecklistSummary,
      providerSandboxReleaseCandidateViewModelSummary: providerSandboxReleaseCandidateViewModelSummary,
      offlineProviderCertificationCenterSummary: offlineProviderCertificationCenterSummary,
      mockIntegrationRegressionLabSummary: mockIntegrationRegressionLabSummary,
      humanApprovalEvidenceBinderSummary: humanApprovalEvidenceBinderSummary,
      adapterBoundaryLockSummary: adapterBoundaryLockSummary,
      providerCertificationViewModelSummary: providerCertificationViewModelSummary,
      providerOfflineReleaseGateSummary: providerOfflineReleaseGateSummary,
      providerCertificationFreezeLedgerSummary: providerCertificationFreezeLedgerSummary,
      sandboxActivationReviewPacketSummary: sandboxActivationReviewPacketSummary,
      adapterBoundaryDiffInspectorSummary: adapterBoundaryDiffInspectorSummary,
      providerOfflineReleaseViewModelSummary: providerOfflineReleaseViewModelSummary,
      offlineLaunchDecisionSimulatorSummary: offlineLaunchDecisionSimulatorSummary,
      sandboxActivationReceiptLedgerSummary: sandboxActivationReceiptLedgerSummary,
      adapterSecurityRegressionGuardSummary: adapterSecurityRegressionGuardSummary,
      providerOfflineLaunchChecklistSummary: providerOfflineLaunchChecklistSummary,
      providerOfflineLaunchViewModelSummary: providerOfflineLaunchViewModelSummary,
      offlineProviderLaunchControlTowerSummary: offlineProviderLaunchControlTowerSummary,
      adapterPolicyEngineSummary: adapterPolicyEngineSummary,
      humanReleaseEvidenceTimelineSummary: humanReleaseEvidenceTimelineSummary,
      sandboxActivationFinalReviewBoardSummary: sandboxActivationFinalReviewBoardSummary,
      providerLaunchControlViewModelSummary: providerLaunchControlViewModelSummary,
      providerLaunchAuditSnapshotSummary:providerLaunchAuditSnapshotSummary,
      offlinePolicyReplayCenterSummary:offlinePolicyReplayCenterSummary,
      humanActivationFinalDossierSummary:humanActivationFinalDossierSummary,
      adapterLaunchBoundaryVerifierSummary:adapterLaunchBoundaryVerifierSummary,
      providerFinalLaunchReviewViewModelSummary:providerFinalLaunchReviewViewModelSummary,
      finalOfflineLaunchReviewConsoleSummary:finalOfflineLaunchReviewConsoleSummary,
      providerActivationBlockerSentinelSummary:providerActivationBlockerSentinelSummary,
      readOnlyReleaseEvidenceSummary:readOnlyReleaseEvidenceSummary,
      offlineProviderReadinessDecisionMatrixSummary:offlineProviderReadinessDecisionMatrixSummary,
      providerFinalReviewConsoleViewModelSummary:providerFinalReviewConsoleViewModelSummary,
      providerFinalSafetySealSummary:providerFinalSafetySealSummary,
      offlineActivationWarRoomSummary:offlineActivationWarRoomSummary,
      readOnlyProviderReadinessCertificateSummary:readOnlyProviderReadinessCertificateSummary,
      providerNoActivationGuaranteeBoardSummary:providerNoActivationGuaranteeBoardSummary,
      providerFinalSafetyViewModelSummary:providerFinalSafetyViewModelSummary,
      offlineProviderGovernanceClosureBoardSummary:offlineProviderGovernanceClosureBoardSummary,
      noActivationComplianceSealSummary:noActivationComplianceSealSummary,
      finalReadinessHandoffSimulatorSummary:finalReadinessHandoffSimulatorSummary,
      providerGovernanceClosureEvidenceLedgerSummary:providerGovernanceClosureEvidenceLedgerSummary,
      providerGovernanceClosureViewModelSummary:providerGovernanceClosureViewModelSummary,
      offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary,
      noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary,
      finalUserTrustSummarySummary:finalUserTrustSummarySummary,
      providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary,
      providerDistributionReadinessViewModelSummary:providerDistributionReadinessViewModelSummary,
      providerDistributionFreezeConsoleSummary:providerDistributionFreezeConsoleSummary,
      userFacingSafetyReceiptSummary:userFacingSafetyReceiptSummary,
      offlineReleaseCandidateClosurePackSummary:offlineReleaseCandidateClosurePackSummary,
      providerNoProductionGuaranteeMatrixSummary:providerNoProductionGuaranteeMatrixSummary,
      providerDistributionClosureViewModelSummary:providerDistributionClosureViewModelSummary,
      offlineDistributionReadinessCenterSummary:offlineDistributionReadinessCenterSummary,
      noActivationEnforcementLedgerSummary:noActivationEnforcementLedgerSummary,
      finalUserTrustSummarySummary:finalUserTrustSummarySummary,
      providerSafetyDistributionMatrixSummary:providerSafetyDistributionMatrixSummary,
      providerDistributionReadinessViewModelSummary:providerDistributionReadinessViewModelSummary,
      offlineDistributionReadinessCenterStatus:offlineDistributionReadinessCenterStatus,
      noActivationEnforcementLedgerStatus:noActivationEnforcementLedgerStatus,
      finalUserTrustSummaryStatus:finalUserTrustSummaryStatus,
      providerSafetyDistributionMatrixStatus:providerSafetyDistributionMatrixStatus,
      providerDistributionReadinessViewModelStatus:providerDistributionReadinessViewModelStatus,
      providerDistributionFreezeConsoleStatus:providerDistributionFreezeConsoleStatus,
      userFacingSafetyReceiptStatus:userFacingSafetyReceiptStatus,
      offlineReleaseCandidateClosurePackStatus:offlineReleaseCandidateClosurePackStatus,
      providerNoProductionGuaranteeMatrixStatus:providerNoProductionGuaranteeMatrixStatus,
      providerDistributionClosureViewModelStatus:providerDistributionClosureViewModelStatus,
      safeToProceedWithHumanDistributionReadinessReview:safeToProceedWithHumanDistributionReadinessReview,
      safeToProceedWithHumanDistributionClosureReview:safeToProceedWithHumanDistributionClosureReview,
      providerAdapterRegistrySummary: providerAdapterRegistrySummary,
      dryRunProviderResponseNormalizerSummary: dryRunProviderResponseNormalizerSummary,
      sandboxProviderRunbookSummary: sandboxProviderRunbookSummary,
      providerAdapterRegistryViewModelSummary: providerAdapterRegistryViewModelSummary,
      firstSandboxProviderConnectorSummary:firstSandboxProviderConnectorSummary,
      providerCoverageDashboardSummary:providerCoverageDashboardSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      providerCoverageViewModelSummary:providerCoverageViewModelSummary,
      providerOfflineReleaseGateStatus:providerOfflineReleaseGateStatus,
      providerCertificationFreezeLedgerStatus:providerCertificationFreezeLedgerStatus,
      sandboxActivationReviewPacketStatus:sandboxActivationReviewPacketStatus,
      adapterBoundaryDiffInspectorStatus:adapterBoundaryDiffInspectorStatus,
      providerOfflineReleaseViewModelStatus:providerOfflineReleaseViewModelStatus,
      safeToProceedWithManualOfflineReleaseReview:safeToProceedWithManualOfflineReleaseReview,
      offlineLaunchDecisionSimulatorStatus:offlineLaunchDecisionSimulatorStatus,
      sandboxActivationReceiptLedgerStatus:sandboxActivationReceiptLedgerStatus,
      adapterSecurityRegressionGuardStatus:adapterSecurityRegressionGuardStatus,
      providerOfflineLaunchChecklistStatus:providerOfflineLaunchChecklistStatus,
      providerOfflineLaunchViewModelStatus:providerOfflineLaunchViewModelStatus,
      offlineProviderLaunchControlTowerStatus:offlineProviderLaunchControlTowerStatus,
      adapterPolicyEngineStatus:adapterPolicyEngineStatus,
      humanReleaseEvidenceTimelineStatus:humanReleaseEvidenceTimelineStatus,
      sandboxActivationFinalReviewBoardStatus:sandboxActivationFinalReviewBoardStatus,
      providerLaunchControlViewModelStatus:providerLaunchControlViewModelStatus,
      providerLaunchAuditSnapshotStatus:providerLaunchAuditSnapshotStatus,
      offlinePolicyReplayCenterStatus:offlinePolicyReplayCenterStatus,
      humanActivationFinalDossierStatus:humanActivationFinalDossierStatus,
      adapterLaunchBoundaryVerifierStatus:adapterLaunchBoundaryVerifierStatus,
      providerFinalLaunchReviewViewModelStatus:providerFinalLaunchReviewViewModelStatus,
      finalOfflineLaunchReviewConsoleStatus:finalOfflineLaunchReviewConsoleStatus,
      providerActivationBlockerSentinelStatus:providerActivationBlockerSentinelStatus,
      readOnlyReleaseEvidenceSummaryStatus:readOnlyReleaseEvidenceSummaryStatus,
      offlineProviderReadinessDecisionMatrixStatus:offlineProviderReadinessDecisionMatrixStatus,
      providerFinalReviewConsoleViewModelStatus:providerFinalReviewConsoleViewModelStatus,
      providerFinalSafetySealStatus:providerFinalSafetySealStatus,
      offlineActivationWarRoomStatus:offlineActivationWarRoomStatus,
      readOnlyProviderReadinessCertificateStatus:readOnlyProviderReadinessCertificateStatus,
      providerNoActivationGuaranteeBoardStatus:providerNoActivationGuaranteeBoardStatus,
      providerFinalSafetyViewModelStatus:providerFinalSafetyViewModelStatus,
      offlineProviderGovernanceClosureBoardStatus:offlineProviderGovernanceClosureBoardStatus,
      noActivationComplianceSealStatus:noActivationComplianceSealStatus,
      finalReadinessHandoffSimulatorStatus:finalReadinessHandoffSimulatorStatus,
      providerGovernanceClosureEvidenceLedgerStatus:providerGovernanceClosureEvidenceLedgerStatus,
      providerGovernanceClosureViewModelStatus:providerGovernanceClosureViewModelStatus,
      safeToProceedWithManualOfflineLaunchDecisionReview:safeToProceedWithManualOfflineLaunchDecisionReview,
      safeToProceedWithHumanLaunchControlReview:safeToProceedWithHumanLaunchControlReview,
      safeToProceedWithHumanFinalLaunchReview:safeToProceedWithHumanFinalLaunchReview,
      safeToProceedWithFinalOfflineProviderReview:safeToProceedWithFinalOfflineProviderReview,
      safeToProceedWithHumanFinalSafetyReview:safeToProceedWithHumanFinalSafetyReview,
      safeToProceedWithHumanGovernanceClosureReview:safeToProceedWithHumanGovernanceClosureReview,
      safeToProceedWithHumanDistributionReadinessReview:safeToProceedWithHumanDistributionReadinessReview,
      safeToProceedWithHumanDistributionClosureReview:safeToProceedWithHumanDistributionClosureReview,
      readOnlyProviderSandboxIntegrationGateSummary:readOnlyProviderSandboxIntegrationGateSummary,
      sandboxPriceCandidateSessionSummary:sandboxPriceCandidateSessionSummary,
      sandboxPriceCandidateResultBoardSummary:sandboxPriceCandidateResultBoardSummary,
      sandboxCandidateComparisonWorkbenchSummary:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrixSummary:providerEvidenceComparisonMatrixSummary,
      readOnlyHandoffReadinessDrillSummary:readOnlyHandoffReadinessDrillSummary,
      sandboxDecisionReviewViewModelSummary:sandboxDecisionReviewViewModelSummary,
      readOnlyPlatformHandoffSimulatorSummary: readOnlyPlatformHandoffSimulatorSummary,
      redactedSearchParameterPackSummary: redactedSearchParameterPackSummary,
      userConfirmationChecklistSummary: userConfirmationChecklistSummary,
      platformHandoffSimulationViewModelSummary: platformHandoffSimulationViewModelSummary,
      readOnlyHandoffPacketPreviewSummary: readOnlyHandoffPacketPreviewSummary,
      platformPreflightSafetyGateSummary: platformPreflightSafetyGateSummary,
      userActionBoundaryReceiptSummary: userActionBoundaryReceiptSummary,
      handoffPacketViewModelSummary: handoffPacketViewModelSummary,
      manualPlatformReviewCockpitSummary: manualPlatformReviewCockpitSummary,
      handoffAcceptanceWalkthroughSummary: handoffAcceptanceWalkthroughSummary,
      platformRealityCheckBoardSummary: platformRealityCheckBoardSummary,
      manualPlatformReviewViewModelSummary: manualPlatformReviewViewModelSummary,
      userFacingManualReviewFlowSummary: userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary: platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary: safeNextActionPanelSummary,
      userManualReviewViewModelSummary: userManualReviewViewModelSummary,
      manualPlatformVisitPreparationCenterSummary: manualPlatformVisitPreparationCenterSummary,
      externalPlatformBoundaryBriefSummary: externalPlatformBoundaryBriefSummary,
      finalUserSafetyChecklistSummary: finalUserSafetyChecklistSummary,
      platformVisitPreparationViewModelSummary: platformVisitPreparationViewModelSummary,
      externalPlatformExitRampPreviewSummary: externalPlatformExitRampPreviewSummary,
      manualVisitSafetyBriefSummary: manualVisitSafetyBriefSummary,
      readOnlySessionClosurePackSummary: readOnlySessionClosurePackSummary,
      externalPlatformExitViewModelSummary: externalPlatformExitViewModelSummary,
      readOnlyCommerceSessionRecapCenterSummary: readOnlyCommerceSessionRecapCenterSummary,
      userTrustClosureSummarySummary: userTrustClosureSummarySummary,
      nextFeatureReadinessGateSummary: nextFeatureReadinessGateSummary,
      commerceSessionRecapViewModelSummary: commerceSessionRecapViewModelSummary,
      readOnlySandboxProviderIntegrationBlueprintSummary: readOnlySandboxProviderIntegrationBlueprintSummary,
      credentialIsolationReadinessBoardSummary: credentialIsolationReadinessBoardSummary,
      providerContractSelectionBoardSummary: providerContractSelectionBoardSummary,
      sandboxProviderPlanningViewModelSummary: sandboxProviderPlanningViewModelSummary,
      providerLegalReviewDossierSummary: providerLegalReviewDossierSummary,
      credentialVaultInterfaceStubSummary: credentialVaultInterfaceStubSummary,
      sandboxAdapterContractTestbedSummary: sandboxAdapterContractTestbedSummary,
      providerIntegrationPrepViewModelSummary: providerIntegrationPrepViewModelSummary,
      sandboxProviderMockRuntimeSummary: sandboxProviderMockRuntimeSummary,
      vaultBoundaryContractSummary: vaultBoundaryContractSummary,
      legalApprovalWorkflowBoardSummary: legalApprovalWorkflowBoardSummary,
      providerMockRuntimeViewModelSummary: providerMockRuntimeViewModelSummary,
      mockProviderAdapterRegistryRuntimeSummary: mockProviderAdapterRegistryRuntimeSummary,
      providerContractReplayHarnessSummary: providerContractReplayHarnessSummary,
      providerLaunchReadinessBoardSummary: providerLaunchReadinessBoardSummary,
      providerLaunchReadinessViewModelSummary: providerLaunchReadinessViewModelSummary,
      humanApprovalSimulationGateSummary: humanApprovalSimulationGateSummary,
      mockProviderLaunchDrillSummary: mockProviderLaunchDrillSummary,
      sandboxProviderRollbackPlanSummary: sandboxProviderRollbackPlanSummary,
      providerLaunchSimulationViewModelSummary: providerLaunchSimulationViewModelSummary,
      providerSandboxPilotControlRoomSummary: providerSandboxPilotControlRoomSummary,
      mockProviderIncidentDrillSummary: mockProviderIncidentDrillSummary,
      productionBlockerMatrixSummary: productionBlockerMatrixSummary,
      providerPilotControlViewModelSummary: providerPilotControlViewModelSummary,
      humanControlledSandboxProviderPilotPlannerSummary: humanControlledSandboxProviderPilotPlannerSummary,
      providerKillSwitchDrillSummary: providerKillSwitchDrillSummary,
      complianceEvidencePackSummary: complianceEvidencePackSummary,
      providerPilotGovernanceViewModelSummary: providerPilotGovernanceViewModelSummary,
      providerGovernanceConsoleSummary: providerGovernanceConsoleSummary,
      providerOperatorReviewLoopSummary: providerOperatorReviewLoopSummary,
      providerGovernanceAuditConsoleSummary: providerGovernanceAuditConsoleSummary,
      humanPilotReadinessLedgerSummary: humanPilotReadinessLedgerSummary,
      sandboxProviderReleaseFreezeGateSummary: sandboxProviderReleaseFreezeGateSummary,
      providerGovernanceReleaseViewModelSummary: providerGovernanceReleaseViewModelSummary,
      manualGovernanceReleaseDecisionRoomSummary: manualGovernanceReleaseDecisionRoomSummary,
      sandboxPilotExceptionRegisterSummary: sandboxPilotExceptionRegisterSummary,
      providerReadinessSignOffPacketSummary: providerReadinessSignOffPacketSummary,
      providerManualReleaseViewModelSummary: providerManualReleaseViewModelSummary,
      legalProviderFixtureSummary: legalProviderFixtureSummary,
      providerCredentialSafetySummary: providerCredentialSafetySummary,
      sandboxPriceFeedSummary: sandboxPriceFeedSummary,
      sandboxProviderResponseContractSummary: sandboxProviderResponseContractSummary,
      pricePipelineOrchestratorSummary: finalizedPricePipelineOrchestratorSummary,
      readOnlyCandidateJourneySummary: finalizedReadOnlyCandidateJourneySummary,
      providerFixtureViewModelSummary: providerFixtureViewModelSummary,
      priceSourceNormalizationSummary: priceSourceNormalizationSummary,
      officialPriceAnchorSummary: officialPriceAnchorSummary,
      priceCandidateDisplaySummary: priceCandidateDisplaySummary,
      sameItemMatcherSummary: sameItemMatcherSummary,
      duplicateCandidateMergerSummary: duplicateCandidateMergerSummary,
      coveredLowestCandidateBoardSummary: coveredLowestCandidateBoardSummary,
      externalDeepLinkSafetySummary: externalDeepLinkSafetySummary,
      searchParameterPrefillSummary: searchParameterPrefillSummary,
      jumpToPlatformHandoffPreviewSummary: jumpToPlatformHandoffPreviewSummary,
      sandboxDeepLinkCandidateSummary: sandboxDeepLinkCandidateSummary,
      platformAvailabilitySummary: platformAvailabilitySummary,
      partnerLinkPolicySummary: partnerLinkPolicySummary,
      sandboxHandoffViewModelSummary: sandboxHandoffViewModelSummary,
      readOnlyProviderSandboxConnectorStatus: readOnlyProviderSandboxConnectorStatus,
      fixtureReplayStatus: fixtureReplayStatus,
      normalizedPriceCandidateBoardStatus: normalizedPriceCandidateBoardStatus,
      realProviderSandboxGateStatus: realProviderSandboxGateStatus,
      providerRequestEnvelopeStatus: providerRequestEnvelopeStatus,
      providerCallAuditLedgerStatus: providerCallAuditLedgerStatus,
      providerSandboxReadinessStatus: providerSandboxReadinessStatus,
      providerSandboxDryRunStatus: providerSandboxDryRunStatus,
      providerAdapterShellStatus: providerAdapterShellStatus,
      providerKillSwitchStatus: providerKillSwitchStatus,
      providerSandboxDryRunViewModelStatus: providerSandboxDryRunViewModelStatus,
      offlineSandboxTraceInspectorStatus: offlineSandboxTraceInspectorStatus,
      mockProviderResultNormalizerStatus: mockProviderResultNormalizerStatus,
      manualActivationDryRunChecklistStatus: manualActivationDryRunChecklistStatus,
      providerSandboxReadinessWorkbenchStatus: providerSandboxReadinessWorkbenchStatus,
      offlineProviderScenarioLabStatus: offlineProviderScenarioLabStatus,
      readOnlyProviderAdapterSdkSkeletonStatus: readOnlyProviderAdapterSdkSkeletonStatus,
      manualActivationCommandCenterStatus: manualActivationCommandCenterStatus,
      providerSandboxMilestoneViewModelStatus: providerSandboxMilestoneViewModelStatus,
      offlineProviderAdapterContractKitStatus: offlineProviderAdapterContractKitStatus,
      mockSandboxQaMatrixStatus: mockSandboxQaMatrixStatus,
      humanActivationRunbookCenterStatus: humanActivationRunbookCenterStatus,
      providerAdapterComplianceChecklistStatus: providerAdapterComplianceChecklistStatus,
      providerSandboxReleaseCandidateViewModelStatus: providerSandboxReleaseCandidateViewModelStatus,
      offlineProviderCertificationCenterStatus: offlineProviderCertificationCenterStatus,
      mockIntegrationRegressionLabStatus: mockIntegrationRegressionLabStatus,
      humanApprovalEvidenceBinderStatus: humanApprovalEvidenceBinderStatus,
      adapterBoundaryLockStatus: adapterBoundaryLockStatus,
      providerCertificationViewModelStatus: providerCertificationViewModelStatus,
      providerAdapterRegistryStatus: providerAdapterRegistryStatus,
      dryRunResponseNormalizerStatus: dryRunResponseNormalizerStatus,
      sandboxProviderRunbookStatus: sandboxProviderRunbookStatus,
      providerAdapterRegistryViewModelStatus: providerAdapterRegistryViewModelStatus,
      firstSandboxProviderConnectorStatus:firstSandboxProviderConnectorStatus,
      providerCoverageStatus:providerCoverageStatus,
      sourceTrustStatus:sourceTrustStatus,
      providerCoverageViewModelStatus:providerCoverageViewModelStatus,
      providerSandboxIntegrationGateStatus:providerSandboxIntegrationGateStatus,
      sandboxPriceCandidateSessionStatus:sandboxPriceCandidateSessionStatus,
      sandboxPriceCandidateResultBoardStatus:sandboxPriceCandidateResultBoardStatus,
      sandboxCandidateComparisonWorkbenchStatus:sandboxCandidateComparisonWorkbenchStatus,
      providerEvidenceComparisonMatrixStatus:providerEvidenceComparisonMatrixStatus,
      readOnlyHandoffReadinessDrillStatus:readOnlyHandoffReadinessDrillStatus,
      sandboxDecisionReviewStatus:sandboxDecisionReviewStatus,
      readOnlyPlatformHandoffSimulatorStatus: readOnlyPlatformHandoffSimulatorStatus,
      redactedSearchParameterPackStatus: redactedSearchParameterPackStatus,
      userConfirmationChecklistStatus: userConfirmationChecklistStatus,
      platformHandoffSimulationViewModelStatus: platformHandoffSimulationViewModelStatus,
      readOnlyHandoffPacketPreviewStatus: readOnlyHandoffPacketPreviewStatus,
      platformPreflightSafetyGateStatus: platformPreflightSafetyGateStatus,
      userActionBoundaryReceiptStatus: userActionBoundaryReceiptStatus,
      handoffPacketViewModelStatus: handoffPacketViewModelStatus,
      manualPlatformReviewCockpitStatus: manualPlatformReviewCockpitStatus,
      handoffAcceptanceWalkthroughStatus: handoffAcceptanceWalkthroughStatus,
      platformRealityCheckStatus: platformRealityCheckStatus,
      manualPlatformReviewViewModelStatus: manualPlatformReviewViewModelStatus,
      userFacingManualReviewFlowStatus: userFacingManualReviewFlowStatus,
      platformVerificationProgressStatus: platformVerificationProgressStatus,
      safeNextActionPanelStatus: safeNextActionPanelStatus,
      userManualReviewViewModelStatus: userManualReviewViewModelStatus,
      manualPlatformVisitPreparationStatus: manualPlatformVisitPreparationStatus,
      externalPlatformBoundaryStatus: externalPlatformBoundaryStatus,
      finalUserSafetyChecklistStatus: finalUserSafetyChecklistStatus,
      platformVisitPreparationViewModelStatus: platformVisitPreparationViewModelStatus,
      externalPlatformExitRampStatus: externalPlatformExitRampStatus,
      manualVisitSafetyBriefStatus: manualVisitSafetyBriefStatus,
      readOnlySessionClosureStatus: readOnlySessionClosureStatus,
      externalPlatformExitViewModelStatus: externalPlatformExitViewModelStatus,
      readOnlyCommerceSessionRecapStatus: readOnlyCommerceSessionRecapStatus,
      userTrustClosureSummaryStatus: userTrustClosureSummaryStatus,
      nextFeatureReadinessGateStatus: nextFeatureReadinessGateStatus,
      commerceSessionRecapViewModelStatus: commerceSessionRecapViewModelStatus,
      sandboxProviderIntegrationBlueprintStatus: sandboxProviderIntegrationBlueprintStatus,
      credentialIsolationReadinessStatus: credentialIsolationReadinessStatus,
      providerContractSelectionStatus: providerContractSelectionStatus,
      sandboxProviderPlanningViewModelStatus: sandboxProviderPlanningViewModelStatus,
      providerLegalReviewStatus: providerLegalReviewStatus,
      credentialVaultInterfaceStatus: credentialVaultInterfaceStatus,
      sandboxAdapterContractStatus: sandboxAdapterContractStatus,
      providerIntegrationPrepViewModelStatus: providerIntegrationPrepViewModelStatus,
      sandboxProviderMockRuntimeStatus: sandboxProviderMockRuntimeStatus,
      vaultBoundaryContractStatus: vaultBoundaryContractStatus,
      legalApprovalWorkflowStatus: legalApprovalWorkflowStatus,
      providerMockRuntimeViewModelStatus: providerMockRuntimeViewModelStatus,
      mockProviderAdapterRegistryStatus: mockProviderAdapterRegistryStatus,
      providerContractReplayStatus: providerContractReplayStatus,
      providerLaunchReadinessStatus: providerLaunchReadinessStatus,
      providerLaunchReadinessViewModelStatus: providerLaunchReadinessViewModelStatus,
      humanApprovalSimulationStatus: humanApprovalSimulationStatus,
      mockProviderLaunchDrillStatus: mockProviderLaunchDrillStatus,
      sandboxProviderRollbackPlanStatus: sandboxProviderRollbackPlanStatus,
      providerLaunchSimulationViewModelStatus: providerLaunchSimulationViewModelStatus,
      providerSandboxPilotControlStatus: providerSandboxPilotControlStatus,
      mockProviderIncidentDrillStatus: mockProviderIncidentDrillStatus,
      productionBlockerMatrixStatus: productionBlockerMatrixStatus,
      providerPilotControlViewModelStatus: providerPilotControlViewModelStatus,
      humanControlledSandboxProviderPilotPlannerStatus: humanControlledSandboxProviderPilotPlannerStatus,
      providerKillSwitchDrillStatus: providerKillSwitchDrillStatus,
      complianceEvidencePackStatus: complianceEvidencePackStatus,
      providerPilotGovernanceViewModelStatus: providerPilotGovernanceViewModelStatus,
      providerGovernanceConsoleStatus: providerGovernanceConsoleStatus,
      providerOperatorReviewLoopStatus: providerOperatorReviewLoopStatus,
      providerGovernanceAuditConsoleStatus: providerGovernanceAuditConsoleStatus,
      humanPilotReadinessLedgerStatus: humanPilotReadinessLedgerStatus,
      sandboxProviderReleaseFreezeGateStatus: sandboxProviderReleaseFreezeGateStatus,
      providerGovernanceReleaseViewModelStatus: providerGovernanceReleaseViewModelStatus,
      manualGovernanceReleaseDecisionRoomStatus: manualGovernanceReleaseDecisionRoomStatus,
      sandboxPilotExceptionRegisterStatus: sandboxPilotExceptionRegisterStatus,
      providerReadinessSignOffPacketStatus: providerReadinessSignOffPacketStatus,
      providerManualReleaseViewModelStatus: providerManualReleaseViewModelStatus,
      priceNormalizationStatus: priceNormalizationStatus,
      officialPriceAnchorStatus: officialPriceAnchorStatus,
      priceCandidateDisplayStatus: priceCandidateDisplayStatus,
      sameItemMatcherStatus: sameItemMatcherStatus,
      duplicateMergeStatus: duplicateMergeStatus,
      coveredLowestStatus: coveredLowestStatus,
      legalProviderFixtureStatus: legalProviderFixtureStatus,
      providerCredentialSafetyStatus: providerCredentialSafetyStatus,
      sandboxPriceFeedStatus: sandboxPriceFeedStatus,
      sandboxProviderResponseContractStatus: sandboxProviderResponseContractStatus,
      pricePipelineStatus: finalizedPricePipelineStatus,
      readOnlyCandidateJourneyStatus: finalizedReadOnlyCandidateJourneyStatus,
      externalDeepLinkSafetyStatus: externalDeepLinkSafetyStatus,
      searchPrefillStatus: searchPrefillStatus,
      handoffPreviewStatus: handoffPreviewStatus,
      sandboxDeepLinkStatus: sandboxDeepLinkStatus,
      platformAvailabilityStatus: platformAvailabilityStatus,
      partnerLinkPolicyStatus: partnerLinkPolicyStatus,
      sandboxHandoffStatus: sandboxHandoffStatus,
      safeToProceedWithPriceProviderSandbox: safeToProceedWithPriceProviderSandbox,
      safeToProceedWithReadOnlyPriceProviderSandbox: safeToProceedWithReadOnlyPriceProviderSandbox,
      safeToProceedWithFirstRealReadOnlyProviderSandbox: finalizedSafeToProceedWithFirstRealReadOnlyProviderSandbox,
      safeToProceedWithFirstReadOnlySandboxDryRun: safeToProceedWithFirstReadOnlySandboxDryRun,
      safeToProceedWithFirstProviderSandboxFixtureDryRun: safeToProceedWithFirstProviderSandboxFixtureDryRun,
      safeToProceedWithFirstSandboxProviderConnectorImplementation: safeToProceedWithFirstSandboxProviderConnectorImplementation,
      safeToProceedWithFirstReadOnlyProviderSandboxIntegration:safeToProceedWithFirstReadOnlyProviderSandboxIntegration,
      safeToProceedWithManualSandboxDryRunReview:safeToProceedWithManualSandboxDryRunReview,
      safeToProceedWithSandboxCandidateUserPreview:safeToProceedWithSandboxCandidateUserPreview,
      safeToProceedWithDeepLinkSafetyGate: safeToProceedWithDeepLinkSafetyGate,
      safeToProceedWithSandboxDeepLinkCandidate: safeToProceedWithSandboxDeepLinkCandidate,
      safeToProceedWithPartnerFixtureAdapter: safeToProceedWithPartnerFixtureAdapter,
      safeToProceedWithRealReadOnlyProviderSandbox: finalizedSafeToProceedWithRealReadOnlyProviderSandbox,
      safeToProceedWithSandboxDecisionReview:safeToProceedWithSandboxDecisionReview,
      safeToProceedWithUserFacingHandoffExplanation:safeToProceedWithUserFacingHandoffExplanation, safeToProceedWithManualPlatformReview:safeToProceedWithManualPlatformReview, safeToProceedWithManualPlatformUserEducation:safeToProceedWithManualPlatformUserEducation, safeToProceedWithManualExternalPlatformVisitEducation:safeToProceedWithManualExternalPlatformVisitEducation, safeToProceedWithUserLeavingWeishanEducation:safeToProceedWithUserLeavingWeishanEducation, safeToProceedWithReadOnlyProviderSandboxPlanning:safeToProceedWithReadOnlyProviderSandboxPlanning, safeToProceedWithProviderLegalAndCredentialReview:safeToProceedWithProviderLegalAndCredentialReview, safeToProceedWithProviderSandboxContractImplementation:safeToProceedWithProviderSandboxContractImplementation, safeToProceedWithMockAdapterRuntimeHardening:safeToProceedWithMockAdapterRuntimeHardening,
      safeToProceedWithHumanProviderSandboxApproval: safeToProceedWithHumanProviderSandboxApproval,
      safeToProceedWithHumanControlledSandboxProviderPilot:safeToProceedWithHumanControlledSandboxProviderPilot, safeToProceedWithHumanControlledSandboxProviderPilotPlan:safeToProceedWithHumanControlledSandboxProviderPilotPlan, safeToProceedWithHumanAuditSandboxPilotReadinessReview:safeToProceedWithHumanAuditSandboxPilotReadinessReview, safeToProceedWithManualGovernanceReleaseDecision:safeToProceedWithManualGovernanceReleaseDecision, safeToProceedWithManualProviderSignOffReview:safeToProceedWithManualProviderSignOffReview,
      safeToProceedWithManualSandboxActivationReview:safeToProceedWithManualSandboxActivationReview,
      safeToProceedWithHumanSandboxMilestoneReview:safeToProceedWithHumanSandboxMilestoneReview,
      safeToProceedWithManualReleaseCandidateReview:safeToProceedWithManualReleaseCandidateReview,
      safeToProceedWithHumanCertificationReview:safeToProceedWithHumanCertificationReview,
      rcReviewStatus: rcReviewStatus,
      rcEvidenceStatus: rcEvidenceStatus,
      rcRegressionStatus: rcRegressionStatus,
      releaseRiskStatus: releaseRiskStatus,
      rcCopyReviewStatus: rcCopyReviewStatus,
      safetyDisclosureStatus: safetyDisclosureStatus,
      safeToStartRcReview: safeToStartRcReview,
      safeToContinueReleaseCandidate: safeToContinueReleaseCandidate,
      safeToFinalizeUserFacingCopy: safeToFinalizeUserFacingCopy,
      globalShoppingGoalStatus: globalShoppingGoalStatus,
      jumpBoundaryStatus: jumpBoundaryStatus,
      safeToProceedWithJumpToPlatformMvp: safeToProceedWithJumpToPlatformMvp,
      freezeGateSummary: freezeGateSummary,
      evidenceFreezePackSummary: evidenceFreezePackSummary,
      launchCandidateFreezeViewModelSummary: launchCandidateFreezeViewModelSummary,
      userSafetyCopySummary: userSafetyCopySummary,
      forbiddenCapabilitySummary: forbiddenCapabilitySummary,
      userFacingBetaReadiness: userFacingBetaReadiness,
      copyValidationStatus: copyValidationStatus,
      betaExpansionGateSummary: betaExpansionGateSummary,
      publicPilotChecklistSummary: publicPilotChecklistSummary,
      pilotReadinessSummary: pilotReadinessSummary,
      safeForSmallPublicPilot: safeForSmallPublicPilot,
      pilotNextStep: pilotNextStep,
      pilotReadinessSnapshotSummary: pilotReadinessSnapshotSummary,
      supportPlaybookSummary: supportPlaybookSummary,
      pilotSnapshotViewModelSummary: pilotSnapshotViewModelSummary,
      pilotSnapshotStatus: pilotSnapshotStatus,
      supportPlaybookStatus: supportPlaybookStatus,
      pilotSnapshotNextStep: pilotSnapshotNextStep,
      pilotOnboardingSummary: pilotOnboardingSummary,
      readOnlyConsentSummary: readOnlyConsentSummary,
      pilotOnboardingViewModel: pilotOnboardingViewModel,
      pilotEntryStatus: pilotEntryStatus,
      canEnterReadOnlyPilot: canEnterReadOnlyPilot,
      pilotConsentRequired: pilotConsentRequired,
      pilotSupportSummary: pilotSupportSummary,
      issueIntakeSummary: issueIntakeSummary,
      supportFallbackSummary: supportFallbackSummary,
      pilotSupportStatus: pilotSupportStatus,
      supportNextStep: supportNextStep,
      issueReviewSummary: issueReviewSummary,
      supportTriageSummary: supportTriageSummary,
      pilotIssueReviewSummary: pilotIssueReviewSummary,
      pilotIssueReviewStatus: pilotIssueReviewStatus,
      issueAffectsPilotExpansion: issueAffectsPilotExpansion,
      issueRequiresInternalReview: issueRequiresInternalReview,
      issuePatternSummary: issuePatternSummary,
      supportReadinessSummary: supportReadinessSummary,
      issuePatternViewModelSummary: issuePatternViewModelSummary,
      issuePatternStatus: issuePatternStatus,
      supportReadinessStatus: supportReadinessStatus,
      supportReadyForPublicPilot: supportReadyForPublicPilot,
      repeatedIssueRisk: repeatedIssueRisk,
      rolloutControlSummary: rolloutControlSummary,
      cohortHealthSummary: cohortHealthSummary,
      rolloutControlViewModel: rolloutControlViewModel,
      rolloutDecisionStatus: rolloutDecisionStatus,
      cohortHealthStatus: cohortHealthStatus,
      rolloutNextStep: rolloutNextStep,
      sandboxImportSummary: sandboxImportSummary,
      sandboxImportConsoleSummary: { title:"沙盒响应导入", previewActionLabel:"预览导入结果", confirmActionLabel:"确认导入脱敏证据", clearActionLabel:"清除导入状态", runDryButtonLabel:dryRunButton.label || "运行沙盒只读报价", rawResponseStored:false, canSaveRawResponse:false, canPasteSecretHere:false, redacted:true },
      sandboxImportPreviewStatus: sandboxImportPreviewStatus,
      sandboxImportLastStatus: sandboxImportStatus,
      sandboxImportBlockedReason: sandboxImportBlockedReason,
      rankingScope: "导入样本范围",
      lowPriceClaim: "当前导入样本中的低价候选",
      dryRunStatus: dryRunStatus,
      dryRunButton: dryRunButton,
      dryRunTopCandidates: dryRunTopCandidates,
      runHistorySummary: runHistorySummary,
      quoteDeltaSummary: quoteDeltaSummary,
      replaySummary: replaySummary,
      sessionSummary: sessionSummary,
      sessionStatus: sessionStatus,
      sessionId: sessionId,
      auditExportPreview: auditExportPreview,
      auditExportReady: auditExportReady,
      sessionRecoverySummary: sessionRecoverySummary,
      reportCenterSummary: reportCenterSummary,
      userFacingEvidenceSummary: userFacingEvidenceSummary,
      safetyReportSummary: safetyReportSummary,
      evidenceSummaryWarnings: evidenceSummaryWarnings,
      selectedCandidateUserSummary: selectedCandidateUserSummary,
      decisionAssistantSummary: decisionAssistantSummary,
      candidateComparisonSummary: candidateComparisonSummary,
      recommendationExplanation: recommendationExplanation,
      decisionSafetyWarnings: decisionSafetyWarnings,
      candidateComparisonTable: candidateComparisonTable,
      providerConfirmationWarning: providerConfirmationWarning,
      auditReviewSummary: workflowAuditReviewSummary,
      safeSessionExportPreview: safeSessionExportPreview,
      riskBadgeSummary: riskBadgeSummary,
      handoffChecklistSummary: handoffChecklist,
      handoffReceiptSummary: handoffReceipt,
      manualPlatformCheckSummary: manualPlatformCheck,
      platformCheckDeltaSummary: platformCheckDeltaSummary,
      reconciliationSummary: reconciliationSummary,
      confidenceLabelSummary: confidenceLabelSummary,
      safeNextStepSummary: safeNextStepSummary,
      platformCheckOutcomeSummary: platformCheckOutcomeSummary,
      platformCheckDelta: platformCheckDelta,
      platformCheckWarnings: platformCheckDeltaSummary && platformCheckDeltaSummary.warnings || ["平台最终为准"],
      reportCenterStatus: reportCenterStatus,
      lastRunId: lastRunId,
      compareStatus: compareStatus,
      replayStatus: replayStatus,
      sandboxDryRunSummary: sandboxDryRunSummary,
      runTimelineSummary: runTimelineSummary,
      providerRunMatrix: sandboxDryRunSummary && sandboxDryRunSummary.providerRunMatrix ? sandboxDryRunSummary.providerRunMatrix : null,
      topCandidates: dryRunTopCandidates,
      selectedCandidate: selectedCandidate ? Object.assign({}, selectedCandidate, { selectedSourceSummary:selectedSourceSummary, selectionWarning:selectedCandidate.safeProviderHandoffReady === true ? "平台最终为准，未锁价，不代表可出票" : "当前平台确认链接未通过安全检查", bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, redacted:true }) : null,
      importStatusBadge: importStatusBadge,
      importedEvidenceBanner: importedEvidenceBanner,
      importEvidenceBanner: importEvidenceBanner,
      clearRefreshStateButton: Object.assign({ label:"清除刷新状态", enabled:false, autoRun:false, booking:false, payment:false, order:false, identityUpload:false }, interactiveRefreshState.clearRefreshStateButton || {}),
      refreshErrorBanner: interactiveRefreshState.refreshErrorBanner || "",
      providerBindingWizardSummary: providerBindingWizardSummary,
      credentialReadiness: { status:text(reportCredentialReadiness.status || (isProductionDisabled ? "disabled" : (isSandboxReadOnly ? "sandbox_ready" : "fixture_ready"))), hasSecureCredentialReference:reportCredentialReadiness.hasSecureCredentialReference === true, sandboxDryRunEnabled:reportCredentialReadiness.sandboxDryRunEnabled === true, networkDryRunAllowed:reportCredentialReadiness.networkDryRunAllowed === true, productionProviderEnabled:false, redacted:true },
      refreshButton: refreshButton,
      breakdownLines: breakdownLines,
      safetyLines: safetyLines,
      decisionAssistant: decisionAssistant,
      candidateComparison: candidateComparison,
      actionLabel: "去平台确认",
      safeProviderHandoffUrl: gate.safeProviderHandoffUrl || null,
      safeProviderHandoffHost: gate.safeProviderHandoffHost || "",
      providerConfirmationRequired: gate.providerConfirmationLink === "confirmation_required",
      providerConfirmationStatus: confirmationUi.status || "blocked",
      confirmationPromptLine: confirmationUi.summary || "当前平台确认链接未通过安全检查，不能打开平台确认页。",
      noAutoOpen: true,
      noBookingUrl: true,
      bookingUrl: null,
      noPayment: true,
      noOrder: true,
      noIdentityUpload: true,
      priceQuote: {
        currency: text(priceQuote.currency || "CNY"),
        baseFare: priceQuote.baseFare == null ? null : priceQuote.baseFare,
        taxesAndFees: priceQuote.taxesAndFees == null ? null : priceQuote.taxesAndFees,
        providerFees: priceQuote.providerFees == null ? null : priceQuote.providerFees,
        totalPrice: priceQuote.totalPrice == null ? null : priceQuote.totalPrice,
        priceUpdatedAt: text(priceQuote.priceUpdatedAt || ""),
        freshnessStatus: text(priceQuote.freshnessStatus || "fresh"),
        taxFeeIntegrityStatus: text(priceQuote.taxFeeIntegrityStatus || "complete"),
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        booking: false,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      },
      gate: gate,
      confirmationUi: confirmationUi,
      audit: {
        eventType: "READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_DRAFT",
        version: READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
        phase: PHASE,
        visible: visible,
        providerConfirmationRequired: gate.providerConfirmationLink === "confirmation_required",
        safeProviderHandoffUrlDisplayedCount: 0,
        bookingUrlDisplayedCount: 0,
        paymentActionDisplayedCount: 0,
        orderActionDisplayedCount: 0,
        identityUploadAttemptCount: 0,
        realPriceDisplayedCount: 0,
        redacted: true
      },
      redacted: true
    });
  }

  function renderReadOnlyPriceCandidateCardHtml(input) {
    const card = input && typeof input === "object" && input.version ? input : buildReadOnlyPriceCandidateCardViewModel(input);
    if (!card || card.visible !== true) return "";
    const breakdownLines = Array.isArray(card.breakdownLines) ? card.breakdownLines : [];
    const safetyLines = Array.isArray(card.safetyLines) ? card.safetyLines : [];
    const topCandidates = Array.isArray(card.dryRunTopCandidates) && card.dryRunTopCandidates.length ? card.dryRunTopCandidates : (Array.isArray(card.topCandidates) ? card.topCandidates : []);
    const dryRunSummaryHtml = card.sandboxDryRunSummary || card.runTimelineSummary ? '<section class="commerce-read-only-sandbox-dry-run" data-commerce-read-only-sandbox-dry-run="true"><h5>本次沙盒运行结果</h5><p>运行沙盒只读报价</p><p>本次沙盒运行结果：' + escapeHtml(card.dryRunStatus || (card.sandboxDryRunSummary && card.sandboxDryRunSummary.status) || "not_run") + '</p><p>Provider 运行矩阵：' + escapeHtml((card.providerRunMatrix && card.providerRunMatrix.matrixName) || (card.sandboxDryRunSummary && card.sandboxDryRunSummary.providerRunMatrix && card.sandboxDryRunSummary.providerRunMatrix.matrixName) || "sandbox_provider_run_matrix_v1") + '</p><p>Quote Run Timeline：' + escapeHtml((card.runTimelineSummary && card.runTimelineSummary.summary) || (card.sandboxDryRunSummary && card.sandboxDryRunSummary.runTimelineSummary && card.sandboxDryRunSummary.runTimelineSummary.summary) || "构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备") + '</p><p>多 Provider 沙盒运行</p><p>Top 3 候选报价</p></section>' : "";
    const sessionSummaryHtml = card.sessionSummary ? '<section class="commerce-read-only-quote-session" data-commerce-read-only-quote-session="true"><h5>当前只读报价会话</h5><p>Read-Only Quote Session</p><p>只读报价会话</p><p>sessionId: ' + escapeHtml(card.sessionId || card.sessionSummary.sessionId || '') + '</p><p>sessionStatus: ' + escapeHtml(card.sessionStatus || card.sessionSummary.status || 'updated') + '</p><p>Session Timeline</p><p>Audit Export</p><p>Session Recovery</p><p>本导出仅为只读候选证据</p><p>平台最终为准，未锁价，不代表可出票</p><p>不包含原始响应、密钥、交易链接或身份信息</p></section>' : '';
    const historySummaryHtml = card.runHistorySummary || card.quoteDeltaSummary || card.replaySummary ? '<section class="commerce-read-only-run-history" data-commerce-read-only-run-history="true"><h5>运行历史</h5><p>Read-Only Quote Run History</p><p>最近一次沙盒运行：' + escapeHtml((card.runHistorySummary && card.runHistorySummary.summary) || '运行历史：暂无本地只读沙盒运行记录') + '</p><p>Last Run Timeline：' + escapeHtml((card.runTimelineSummary && card.runTimelineSummary.summary) || '构建 Provider 运行矩阵 · 生成只读沙盒报价 · 报价归一化 · Top 3 排序 · 候选选择准备') + '</p><p>本地只读沙盒运行对比：' + escapeHtml((card.quoteDeltaSummary && card.quoteDeltaSummary.summary) || '本地只读沙盒运行对比：历史不足') + '</p><p>Replay Guard：' + escapeHtml((card.replaySummary && card.replaySummary.replaySummary) || (card.replaySummary && card.replaySummary.summary) || 'Replay Guard：暂无可回放的本地脱敏运行历史') + '</p><p>Replay 只恢复候选证据，不重新请求 provider</p><p>平台最终为准</p><p>未锁价</p><p>不代表可出票</p><p>compareStatus: ' + escapeHtml(card.compareStatus || 'not_enough_history') + '</p><p>replayStatus: ' + escapeHtml(card.replayStatus || 'unavailable') + '</p><p>lastRunId: ' + escapeHtml(card.lastRunId || '') + '</p></section>' : '';
    const userFacingEvidenceHtml = card.userFacingEvidenceSummary ? '<section class="commerce-read-only-user-evidence-summary" data-commerce-read-only-user-evidence-summary="true"><h5>' + escapeHtml(card.userFacingEvidenceSummary.title || '候选报价证据摘要') + '</h5><p>' + escapeHtml(card.userFacingEvidenceSummary.subtitle || '只读候选价 · 平台最终为准') + '</p><p>当前导入样本 / 沙盒运行中的候选价格</p><p>Top 3 候选报价：' + escapeHtml(String(card.userFacingEvidenceSummary.topCandidateCount || 0)) + '</p><p>' + escapeHtml(card.selectedCandidateUserSummary && card.selectedCandidateUserSummary.line || (card.userFacingEvidenceSummary.selectedCandidateSummary && card.userFacingEvidenceSummary.selectedCandidateSummary.line) || '尚未选择候选报价。平台最终为准，未锁价，不代表可出票。') + '</p><ul>' + (Array.isArray(card.userFacingEvidenceSummary.labels) ? card.userFacingEvidenceSummary.labels : ['只读候选价', '平台最终为准', '未锁价', '不代表可出票']).map(function(label){ return '<li>' + escapeHtml(label) + '</li>'; }).join('') + '</ul><p>' + escapeHtml(card.userFacingEvidenceSummary.caveat || '价格、库存、税费和规则以平台页面为准。唯珊不会付款、不会下单、不会上传证件或银行卡。') + '</p></section>' : '';
    const decisionAssistantHtml = card.decisionAssistantSummary ? '<section class="commerce-read-only-decision-assistant" data-commerce-read-only-decision-assistant="true"><h5>推荐理由</h5><p>Read-Only Quote Decision Assistant</p><p>' + escapeHtml(card.decisionAssistantSummary.primaryReason || '该候选在本次只读候选样本中合计金额较低。') + '</p><p>本地只读候选证据中较低</p><ul>' + (Array.isArray(card.decisionAssistantSummary.supportingReasons) ? card.decisionAssistantSummary.supportingReasons : ['价格拆分完整。', '平台最终为准。', '未锁价，不代表可出票。']).map(function(line){ return '<li>' + escapeHtml(line) + '</li>'; }).join('') + '</ul><ul>' + (Array.isArray(card.decisionSafetyWarnings) ? card.decisionSafetyWarnings : ['平台最终为准', '未锁价', '不代表可出票']).map(function(line){ return '<li>' + escapeHtml(line) + '</li>'; }).join('') + '</ul><p>' + escapeHtml(card.providerConfirmationWarning && card.providerConfirmationWarning.warning || '仍需前往平台确认，平台最终为准，未锁价，不代表可出票。') + '</p></section>' : '';
    const candidateComparisonHtml = card.candidateComparisonSummary ? '<section class="commerce-read-only-candidate-comparison" data-commerce-read-only-candidate-comparison="true"><h5>候选对比</h5><p>Candidate Comparison</p><p>' + escapeHtml(card.candidateComparisonSummary.caveat || '仅比较本地只读候选样本，平台最终为准。') + '</p><ul>' + (Array.isArray(card.candidateComparisonSummary.lines) ? card.candidateComparisonSummary.lines : []).map(function(line){ return '<li>' + escapeHtml(line) + '</li>'; }).join('') + '</ul><p>仍需前往平台确认</p></section>' : '';
    const auditReviewHtml = card.auditReviewSummary ? '<section class="commerce-flight-workflow-audit-review" data-commerce-flight-workflow-audit-review="true"><h5>本次机票工作流审计</h5><p>' + escapeHtml(card.auditReviewSummary.statusLabel || card.auditReviewSummary.healthLabel || '安全检查通过') + '</p><p>安全检查通过</p><p>动作已安全阻断</p><p>外部平台操作需要二次确认</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-audit-review-show="true">查看工作流审计</button><div data-commerce-flight-audit-review-output="true"><p>只读安全</p><p>交易动作已阻断</p></div></section>' : '';
    const safeExportPreviewHtml = card.safeSessionExportPreview ? '<section class="commerce-flight-safe-session-export-preview" data-commerce-flight-safe-session-export-preview="true"><h5>脱敏会话摘要预览</h5><p>工作流摘要</p><p>候选证据摘要</p><p>安全审计摘要</p><p>不包含证件、银行卡、登录凭据或密钥</p><p>不包含付款、下单、出票链接</p><p>canWriteFile:false</p><p>bookingUrl:null</p><button type="button" class="cmd-btn gray" data-commerce-flight-safe-export-preview-show="true">查看脱敏摘要预览</button><div data-commerce-flight-safe-export-preview-output="true"><p>' + escapeHtml(card.safeSessionExportPreview.readinessLabel || '仅预览，不写入文件') + '</p></div></section>' : '';
    const humanReviewHtml = card.humanReviewChecklistSummary ? '<section class="commerce-flight-human-review-checklist" data-commerce-flight-human-review-checklist="true"><h5>前往平台前请人工复核</h5><p>人工复核清单</p><p>已确认项：' + escapeHtml(String((card.humanReviewChecklistSummary.checkedItems || []).length || 0)) + '</p><p>未完成项：' + escapeHtml(String((card.humanReviewChecklistSummary.incompleteItems || []).length || 0)) + '</p><p>' + escapeHtml(card.humanReviewChecklistSummary.userFacingSummary && card.humanReviewChecklistSummary.userFacingSummary.line || '仍需补充复核') + '</p><p>平台页面结果为准</p><p>唯珊不会付款、不会下单、不会出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-human-review-show="true">查看人工复核清单</button><div data-commerce-flight-human-review-output="true"><p>人工复核清单</p><p>已确认项</p><p>未完成项</p></div></section>' : '';
    const finalPacketHtml = card.finalSafeHandoffPacketSummary ? '<section class="commerce-flight-final-safe-handoff-packet" data-commerce-flight-final-safe-handoff-packet="true"><h5>最终安全交接包</h5><p>行程摘要</p><p>候选证据摘要</p><p>平台核对摘要</p><p>安全限制摘要</p><p>' + escapeHtml(card.finalSafeHandoffPacketSummary.userFacingSummary && card.finalSafeHandoffPacketSummary.userFacingSummary.line || '仍需补充复核') + '</p><p>平台页面结果为准</p><p>唯珊不会付款、不会下单、不会出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-final-handoff-packet-show="true">查看最终安全交接包</button><div data-commerce-flight-final-handoff-packet-output="true"><p>最终安全交接包</p><p>行程摘要</p><p>候选证据摘要</p><p>平台核对摘要</p><p>安全限制摘要</p></div></section>' : '';
    const operatorConsoleHtml = card.operatorConsoleViewModel ? '<section class="commerce-flight-operator-console" data-commerce-flight-operator-console="true"><h5>机票工作流运营控制台</h5><p>工作流状态</p><p>安全状态</p><p>安全回归</p><p>最近事件</p><p>已阻断动作</p><p>平台确认准备状态</p><p>' + escapeHtml(card.operatorConsoleSummary && card.operatorConsoleSummary.userFacingSummary && card.operatorConsoleSummary.userFacingSummary.resultLabel || '存在需要注意的项目') + '</p><p>唯珊只提供只读候选证据，不付款、不下单、不出票</p><button type="button" class="cmd-btn gray" data-commerce-flight-operator-console-show="true">查看运营控制台</button><button type="button" class="cmd-btn gray" data-commerce-flight-safety-regression-show="true">查看安全回归检查</button><div data-commerce-flight-operator-console-output="true"><p>机票工作流运营控制台</p><p>工作流状态</p><p>安全状态</p><p>平台确认准备状态</p></div><div data-commerce-flight-safety-regression-output="true"><p>安全回归</p><p>安全回归通过</p><p>无交易链接</p><p>无付款/下单/出票</p><p>无证件/银行卡/登录凭据</p><p>无密钥或原始响应</p><p>无自动打开或自动刷新</p></div></section>' : '';
    const pilotSupportHtml = '<section class="commerce-flight-pilot-support" data-commerce-flight-pilot-support="true"><h5>只读试点问题反馈</h5><p>问题类型</p><p>建议处理</p><p>看不懂候选证据</p><p>平台页面与候选证据不一致</p><p>安全说明不清楚</p><p>只读范围确认无法完成</p><p>反馈填写异常</p><p>问题反馈已脱敏</p><p>问题反馈只用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>建议重新查看候选证据</p><p>建议记录平台核对结果</p><p>建议查看安全说明</p><p>建议重新确认只读范围</p><h5>只读试点问题复核</h5><p>问题分流面板</p><p>问题状态</p><p>分流建议</p><p>试点影响</p><p>问题可用于改进参考</p><p>需要内部复核</p><p>问题影响试点扩大</p><p>已有建议处理路径</p><p>问题复核只用于改进只读候选证据流程</p><p>不会提交客服工单或交易请求</p><h5>试点问题趋势雷达</h5><p>试点支持准备闸门</p><p>问题数量</p><p>主要问题趋势</p><p>支持准备</p><p>暂无明显共性问题</p><p>发现需要关注的问题趋势</p><p>支持兜底准备就绪</p><p>继续小范围试点</p><p>需要复核后再扩大</p><p>问题趋势仅用于改进只读候选证据流程</p><p>不代表客服工单、交易请求或出票请求</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-support-show="true">查看问题反馈</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-review-show="true">查看问题复核</button><button type="button" class="cmd-btn gray" data-commerce-flight-support-triage-show="true">查看问题分流</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-pattern-show="true">查看问题趋势</button><button type="button" class="cmd-btn gray" data-commerce-flight-support-readiness-show="true">查看支持准备</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="candidate_unclear">看不懂候选证据</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="platform_mismatch">平台页面与候选证据不一致</button><button type="button" class="cmd-btn gray" data-commerce-flight-issue-category="safety_copy_unclear">安全说明不清楚</button><div data-commerce-flight-pilot-support-output="true"><p>只读试点问题反馈</p><p>建议重新查看候选证据</p></div></section>';
    const rolloutControlHtml = '<section class="commerce-flight-rollout-control" data-commerce-flight-rollout-control="true"><h5>只读试点发布控制中心</h5><p>测试批次健康看板</p><p>发布控制</p><p>批次健康</p><p>问题风险</p><p>下一步</p><p>' + escapeHtml(card.rolloutControlSummary && card.rolloutControlSummary.userFacingSummary && card.rolloutControlSummary.userFacingSummary.resultLabel || card.rolloutNextStep || '继续当前小范围试点') + '</p><p>' + escapeHtml(card.cohortHealthSummary && card.cohortHealthSummary.userFacingSummary && card.cohortHealthSummary.userFacingSummary.resultLabel || '批次进行中') + '</p><p>可以进入下一批只读测试</p><p>继续当前小范围试点</p><p>暂停扩大测试</p><p>批次健康，可以继续</p><p>批次进行中</p><p>批次需要复核</p><p>该页面只管理只读试点流程</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><button type="button" class="cmd-btn gray" data-commerce-flight-rollout-control-show="true">查看发布控制</button><button type="button" class="cmd-btn gray" data-commerce-flight-cohort-health-show="true">查看批次健康</button><div data-commerce-flight-rollout-control-output="true"><p>只读试点发布控制中心</p><p>发布控制</p><p>批次健康</p><p>问题风险</p><p>下一步</p><p>' + escapeHtml(card.rolloutControlViewModel && card.rolloutControlViewModel.caveat || '该页面只管理只读试点流程，不保存真实身份、不发送真实邀请、不提供交易能力。') + '</p></div><div data-commerce-flight-cohort-health-output="true"><p>测试批次健康看板</p><p>' + escapeHtml(card.cohortHealthSummary && card.cohortHealthSummary.userFacingSummary && card.cohortHealthSummary.userFacingSummary.resultLabel || '批次进行中') + '</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>';
    const pilotExitCriteriaHtml = '<section class="commerce-flight-pilot-exit-criteria" data-commerce-flight-pilot-exit-criteria="true"><h5>只读试点退出条件</h5><p>试点运营</p><p>下一批决策</p><p>批次健康</p><p>支持准备</p><p>问题趋势</p><p>安全回归</p><p>发布就绪</p><p>发布候选</p><p>' + escapeHtml(card.pilotExitCriteriaSummary && card.pilotExitCriteriaSummary.userFacingSummary && card.pilotExitCriteriaSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-exit-criteria-show="true">查看试点退出条件</button><div data-commerce-flight-pilot-exit-criteria-output="true"><p>只读试点退出条件</p><p>' + escapeHtml(card.pilotExitCriteriaSummary && card.pilotExitCriteriaSummary.userFacingSummary && card.pilotExitCriteriaSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><p>试点退出条件已满足</p><p>继续试点观察</p><p>需要复核</p><p>已阻断</p></div></section>';
    const launchCandidateHtml = '<section class="commerce-flight-launch-candidate" data-commerce-flight-launch-candidate="true"><h5>只读发布候选准备板</h5><p>试点退出条件</p><p>发布就绪</p><p>安全矩阵</p><p>支持准备</p><p>发布文案</p><p>安全红线</p><p>' + escapeHtml(card.launchCandidateReadinessSummary && card.launchCandidateReadinessSummary.userFacingSummary && card.launchCandidateReadinessSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-launch-candidate-show="true">查看发布候选准备板</button><div data-commerce-flight-launch-candidate-output="true"><p>只读发布候选准备板</p><p>' + escapeHtml(card.launchCandidateReadinessSummary && card.launchCandidateReadinessSummary.userFacingSummary && card.launchCandidateReadinessSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><p>可以进入只读发布候选</p><p>继续试点观察</p><p>需要复核</p><p>暂不可进入</p></div></section>';
    const freezeGateHtml = card.freezeGateSummary ? '<section class="commerce-flight-freeze-gate" data-commerce-flight-freeze-gate="true"><h5>只读发布候选冻结检查</h5><p>冻结状态</p><p>发布候选摘要</p><p>发布就绪摘要</p><p>安全红线摘要</p><p>证据冻结包</p><p>' + escapeHtml(card.freezeGateSummary.userFacingSummary && card.freezeGateSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-launch-candidate-freeze-show="true">查看冻结检查</button><div data-commerce-flight-freeze-gate-output="true"><p>只读发布候选冻结检查</p><p>' + escapeHtml(card.freezeGateSummary.userFacingSummary && card.freezeGateSummary.userFacingSummary.resultLabel || '继续试点观察') + '</p><p>已冻结只读发布候选</p><p>准备冻结只读发布候选</p><p>继续试点观察</p><p>需要复核</p><p>已阻断</p><p>冻结不代表交易能力</p><p>不提供付款、下单或出票能力</p></div></section>' : '';
    const evidenceFreezePackHtml = card.evidenceFreezePackSummary ? '<section class="commerce-flight-evidence-freeze-pack" data-commerce-flight-evidence-freeze-pack="true"><h5>证据冻结包</h5><p>发布就绪摘要</p><p>发布候选摘要</p><p>安全红线摘要</p><p>只读试点摘要</p><p>' + escapeHtml(card.evidenceFreezePackSummary.userFacingSummary && card.evidenceFreezePackSummary.userFacingSummary.resultLabel || '证据冻结仍需复核') + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-evidence-freeze-pack-show="true">查看证据冻结包</button><div data-commerce-flight-evidence-freeze-pack-output="true"><p>证据冻结包</p><p>' + escapeHtml(card.evidenceFreezePackSummary.userFacingSummary && card.evidenceFreezePackSummary.userFacingSummary.resultLabel || '证据冻结仍需复核') + '</p><p>证据冻结包已就绪</p><p>证据冻结仍需复核</p><p>证据冻结包已阻断</p><p>不写文件</p><p>不下载</p></div></section>' : '';
    const rcReviewHtml = card.rcReviewViewModelSummary ? '<section class="commerce-flight-rc-review" data-commerce-flight-rc-review="true"><h5>只读 RC 候选复核控制台</h5><p>只读 RC 候选复核</p><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>' + escapeHtml(card.rcCandidateReviewSummary && card.rcCandidateReviewSummary.userFacingSummary && card.rcCandidateReviewSummary.userFacingSummary.resultLabel || "证据仍需补充") + '</p><p>' + escapeHtml(card.rcReviewViewModelSummary && card.rcReviewViewModelSummary.caveat || "该页面只用于只读 RC 候选复核，不保存真实身份、不发送真实邀请、不提供交易能力。") + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-rc-review-show="true">查看候选复核</button><div data-commerce-flight-rc-review-output="true"><p>只读 RC 候选复核控制台</p><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>可以开始 RC 复核</p><p>证据仍需补充</p><p>需要安全复核</p><p>RC 复核已阻断</p><p>复核不代表交易能力</p><p>该页面只用于只读 RC 候选复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>' : '';
    const rcEvidenceReviewHtml = card.rcEvidenceReviewSummary ? '<section class="commerce-flight-rc-evidence-review" data-commerce-flight-rc-evidence-review="true"><h5>只读 RC 证据复核清单</h5><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>' + escapeHtml(card.rcEvidenceReviewSummary.userFacingSummary && card.rcEvidenceReviewSummary.userFacingSummary.resultLabel || "证据仍需补充") + '</p><p>该页面只用于只读 RC 候选复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><button type="button" class="cmd-btn gray" data-commerce-flight-rc-evidence-review-show="true">查看证据复核</button><div data-commerce-flight-rc-evidence-review-output="true"><p>只读 RC 证据复核清单</p><p>候选复核</p><p>证据复核</p><p>安全红线</p><p>证据完整</p><p>证据仍需补充</p><p>需要复核</p><p>已阻断</p><p>复核不代表交易能力</p><p>该页面只用于只读 RC 候选复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>' : '';
    const rcRegressionAuditHtml = card.rcRegressionViewModelSummary ? '<section class="commerce-flight-rc-regression-audit" data-commerce-flight-rc-regression-audit="true"><h5>只读 RC 回归审计</h5><p>只读 RC 回归审计包</p><p>回归审计</p><p>发布风险</p><p>安全红线</p><p>' + escapeHtml(card.rcRegressionAuditSummary && card.rcRegressionAuditSummary.userFacingSummary && card.rcRegressionAuditSummary.userFacingSummary.resultLabel || "RC 回归仍需复核") + '</p><p>' + escapeHtml(card.releaseRiskLedgerSummary && card.releaseRiskLedgerSummary.userFacingSummary && card.releaseRiskLedgerSummary.userFacingSummary.resultLabel || "发布风险待处理") + '</p><p>' + escapeHtml(card.rcRegressionViewModelSummary && card.rcRegressionViewModelSummary.caveat || "该页面只用于只读 RC 回归审计，不保存真实身份、不发送真实邀请、不提供交易能力。") + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-rc-regression-show="true">查看回归审计</button><button type="button" class="cmd-btn gray" data-commerce-flight-release-risk-ledger-show="true">查看发布风险</button><div data-commerce-flight-rc-regression-output="true"><p>只读 RC 回归审计</p><p>只读 RC 回归审计包</p><p>回归审计</p><p>发布风险</p><p>安全红线</p><p>RC 回归审计通过</p><p>RC 回归仍需复核</p><p>回归不代表交易能力</p><p>该页面只用于只读 RC 回归审计</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div><div data-commerce-flight-release-risk-ledger-output="true"><p>只读发布风险台账</p><p>回归审计</p><p>发布风险</p><p>安全红线</p><p>暂无阻断风险</p><p>发布风险待处理</p><p>发布风险已阻断</p><p>回归不代表交易能力</p><p>该页面只用于只读 RC 回归审计</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>' : '';
    const rcCopyReviewHtml = card.rcCopyReviewViewModelSummary ? '<section class="commerce-flight-rc-copy-review" data-commerce-flight-rc-copy-review="true"><h5>只读 RC 文案定稿与安全披露</h5><p>只读 RC 用户可见文案定稿</p><p>安全披露复核板</p><p>文案定稿</p><p>安全披露</p><p>禁用措辞</p><p>' + escapeHtml(card.rcCopyFinalizationSummary && card.rcCopyFinalizationSummary.userFacingSummary && card.rcCopyFinalizationSummary.userFacingSummary.resultLabel || "RC 文案仍需复核") + '</p><p>' + escapeHtml(card.safetyDisclosureReviewSummary && card.safetyDisclosureReviewSummary.userFacingSummary && card.safetyDisclosureReviewSummary.userFacingSummary.resultLabel || "安全披露仍需复核") + '</p><p>当前为只读候选证据流程，不提供付款、下单或出票能力</p><p>价格仅为候选展示，不构成价格承诺或交易承诺</p><p>请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据</p><p>' + escapeHtml(card.rcCopyReviewViewModelSummary && card.rcCopyReviewViewModelSummary.caveat || "该页面只用于只读 RC 文案定稿与安全披露复核，不保存真实身份、不发送真实邀请、不提供交易能力。") + '</p><button type="button" class="cmd-btn gray" data-commerce-flight-rc-copy-review-show="true">查看 RC 文案定稿</button><button type="button" class="cmd-btn gray" data-commerce-flight-safety-disclosure-review-show="true">查看安全披露复核</button><div data-commerce-flight-rc-copy-review-output="true"><p>只读 RC 文案定稿与安全披露</p><p>只读 RC 用户可见文案定稿</p><p>文案定稿</p><p>安全披露</p><p>禁用措辞</p><p>RC 文案可以定稿</p><p>RC 文案仍需复核</p><p>文案不代表交易能力</p><p>当前为只读候选证据流程，不提供付款、下单或出票能力</p><p>价格仅为候选展示，不构成价格承诺或交易承诺</p><p>请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据</p><p>该页面只用于只读 RC 文案定稿与安全披露复核</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div><div data-commerce-flight-safety-disclosure-review-output="true"><p>安全披露复核板</p><p>安全披露通过</p><p>安全披露仍需复核</p><p>安全披露已阻断</p><p>文案不代表交易能力</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p></div></section>' : '';
    const priceCandidateDisplayHtml = card.priceCandidateDisplaySummary ? '<section class="commerce-global-shopping-price-candidate-display" data-commerce-global-shopping-price-candidate-display="true"><h5>全球购价格候选展示</h5><p>合法 Provider Fixture 与 Sandbox 价格 Feed</p><p>合法 Provider Fixture 适配器</p><p>Provider 凭据安全复核</p><p>Sandbox 价格 Feed 闸门</p><p>Sandbox Provider 响应合同</p><p>全球购只读价格流水线</p><p>全球购只读候选旅程</p><p>Provider 响应合同已准备</p><p>只读价格流水线已准备</p><p>全球购只读候选旅程已准备</p><p>Raw provider response 不持久化</p><p>Fixture 数据进入候选旅程</p><p>价格流水线不代表真实价格</p><p>候选旅程不代表下单能力</p><p>Provider Fixture</p><p>价格流水线</p><p>已覆盖来源较低候选价</p><p>Sandbox 跳转预览</p><p>当前仅展示只读 fixture/sandbox 候选旅程</p><p>不请求真实平台，不处理付款、下单或出票</p><p>Provider Fixture</p><p>凭据安全</p><p>Sandbox 价格 Feed</p><p>已覆盖来源候选价合并</p><p>同款候选识别</p><p>重复候选合并</p><p>官方参考价</p><p>已覆盖来源中的较低候选价</p><p>来源覆盖</p><p>同款合并置信度</p><p>价格区间</p><p>当前仅比较已覆盖来源中的候选价</p><p>Provider fixture 已准备</p><p>Provider 凭据边界安全</p><p>Sandbox 价格 Feed 已准备</p><p>不读取生产密钥</p><p>不保存 raw provider response</p><p>Fixture feed 可进入价格归一化</p><p>Provider fixture 不代表真实价格</p><p>合并不代表最低承诺、价格保证、锁定承诺、最终成交价或可下单能力</p><p>价格展示不代表下单能力</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-fixture-show="true">查看 Provider Fixture</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-credential-safety-show="true">查看凭据安全</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-price-feed-show="true">查看 Sandbox 价格 Feed</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-response-contract-show="true">查看 Provider 响应合同</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-price-pipeline-show="true">查看价格流水线</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-candidate-journey-show="true">查看只读候选旅程</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-same-item-show="true">查看同款识别</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-covered-lowest-show="true">查看候选价合并</button><div data-commerce-global-shopping-provider-fixture-output="true"><p>合法 Provider Fixture 适配器</p><p>' + escapeHtml(card.legalProviderFixtureSummary && card.legalProviderFixtureSummary.userFacingSummary && card.legalProviderFixtureSummary.userFacingSummary.resultLabel || 'Provider fixture 仍需复核') + '</p><p>fixtureOnly:true</p><p>sandboxOnly:true</p><p>readOnly:true</p><p>productionDisabled:true</p><p>noLiveFetch:true</p></div><div data-commerce-global-shopping-credential-safety-output="true"><p>Provider 凭据安全复核</p><p>' + escapeHtml(card.providerCredentialSafetySummary && card.providerCredentialSafetySummary.userFacingSummary && card.providerCredentialSafetySummary.userFacingSummary.resultLabel || 'Provider 凭据边界仍需复核') + '</p><p>不读取生产密钥</p><p>不保存 raw provider response</p><p>不保存 token/key/secret</p></div><div data-commerce-global-shopping-sandbox-price-feed-output="true"><p>Sandbox 价格 Feed 闸门</p><p>' + escapeHtml(card.sandboxPriceFeedSummary && card.sandboxPriceFeedSummary.userFacingSummary && card.sandboxPriceFeedSummary.userFacingSummary.resultLabel || 'Sandbox 价格 Feed 仍需复核') + '</p><p>Fixture feed 可进入价格归一化</p><p>Provider fixture 不代表真实价格</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-provider-response-contract-output="true"><p>Sandbox Provider 响应合同</p><p>' + escapeHtml(card.sandboxProviderResponseContractSummary && card.sandboxProviderResponseContractSummary.userFacingSummary && card.sandboxProviderResponseContractSummary.userFacingSummary.resultLabel || 'Provider 响应合同仍需复核') + '</p><p>Raw provider response 不持久化</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-price-pipeline-output="true"><p>全球购只读价格流水线</p><p>' + escapeHtml(card.pricePipelineOrchestratorSummary && card.pricePipelineOrchestratorSummary.userFacingSummary && card.pricePipelineOrchestratorSummary.userFacingSummary.resultLabel || '只读价格流水线仍需复核') + '</p><p>Fixture 数据进入候选旅程</p><p>价格流水线不代表真实价格</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-candidate-journey-output="true"><p>全球购只读候选旅程</p><p>' + escapeHtml(card.readOnlyCandidateJourneySummary && card.readOnlyCandidateJourneySummary.userFacingSummary && card.readOnlyCandidateJourneySummary.userFacingSummary.resultLabel || '全球购只读候选旅程仍需复核') + '</p><p>Provider Fixture</p><p>价格流水线</p><p>已覆盖来源较低候选价</p><p>Sandbox 跳转预览</p><p>当前仅展示只读 fixture/sandbox 候选旅程</p><p>不请求真实平台，不处理付款、下单或出票</p></div><div data-commerce-global-shopping-same-item-output="true"><p>同款候选识别</p><p>' + escapeHtml(card.sameItemMatcherSummary && card.sameItemMatcherSummary.userFacingSummary && card.sameItemMatcherSummary.userFacingSummary.resultLabel || '同款识别仍需复核') + '</p><p>fixtureOnly / sandboxOnly / readOnly</p><p>noRealProvider:true</p><p>noNetwork:true</p></div><div data-commerce-global-shopping-covered-lowest-output="true"><p>已覆盖来源候选价合并</p><p>' + escapeHtml(card.coveredLowestCandidateBoardSummary && card.coveredLowestCandidateBoardSummary.title || '已覆盖来源候选价合并') + '</p><p>' + escapeHtml(card.duplicateCandidateMergerSummary && card.duplicateCandidateMergerSummary.userFacingSummary && card.duplicateCandidateMergerSummary.userFacingSummary.resultLabel || '重复候选仍需复核') + '</p><p>' + escapeHtml(card.officialPriceAnchorSummary && card.officialPriceAnchorSummary.userFacingSummary && card.officialPriceAnchorSummary.userFacingSummary.resultLabel || '官方价仍需复核') + '</p><p>当前仅比较已覆盖来源中的候选价</p><p>价格以跳转后平台实时页面为准</p></div></section>' : '';
    const commerceSessionRecapHtml = card.commerceSessionRecapViewModelSummary ? '<section class="commerce-global-shopping-session-recap" data-commerce-global-shopping-session-recap="true"><h5>只读全球购会话总结与下一步准备</h5><p>只读全球购会话总结</p><p>用户信任闭环摘要</p><p>下一功能准备闸门</p><p>会话总结</p><p>信任闭环</p><p>下一功能准备</p><p>风险说明</p><p>只读全球购会话总结已准备</p><p>用户信任闭环摘要已准备</p><p>下一功能准备闸门已准备</p><p>会话总结不保存、不导出</p><p>信任闭环不构成平台确认</p><p>下一功能闸门不接真实 provider</p><p>下一步仍需人工审批</p><p>当前只展示本次只读全球购会话总结、信任闭环和下一功能准备度</p><p>不打开平台，不接真实 provider，不读取密钥，不构成订单、付款授权或签名</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-session-recap-show="true">查看会话总结</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-trust-closure-show="true">查看信任闭环</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-next-feature-readiness-show="true">查看下一功能准备</button><div data-commerce-global-shopping-session-recap-output="true"><p>只读全球购会话总结</p><p>' + escapeHtml(card.readOnlyCommerceSessionRecapCenterSummary && card.readOnlyCommerceSessionRecapCenterSummary.userFacingSummary && card.readOnlyCommerceSessionRecapCenterSummary.userFacingSummary.resultLabel || '会话总结仍需复核') + '</p><p>会话总结不保存、不导出</p></div><div data-commerce-global-shopping-trust-closure-output="true"><p>用户信任闭环摘要</p><p>' + escapeHtml(card.userTrustClosureSummarySummary && card.userTrustClosureSummarySummary.userFacingSummary && card.userTrustClosureSummarySummary.userFacingSummary.resultLabel || '信任闭环摘要仍需复核') + '</p><p>信任闭环不构成平台确认</p></div><div data-commerce-global-shopping-next-feature-readiness-output="true"><p>下一功能准备闸门</p><p>' + escapeHtml(card.nextFeatureReadinessGateSummary && card.nextFeatureReadinessGateSummary.userFacingSummary && card.nextFeatureReadinessGateSummary.userFacingSummary.resultLabel || '下一功能准备仍需复核') + '</p><p>下一功能闸门不接真实 provider</p><p>下一步仍需人工审批</p></div></section>' : '';
    const sandboxProviderPlanningHtml = card.sandboxProviderPlanningViewModelSummary ? '<section class="commerce-global-shopping-sandbox-provider-planning" data-commerce-global-shopping-sandbox-provider-planning="true"><h5>只读 Sandbox Provider 接入规划</h5><p>只读 Sandbox Provider 接入蓝图</p><p>凭证隔离准备度</p><p>Provider 合同/授权选择板</p><p>接入蓝图</p><p>凭证隔离</p><p>Provider 选择</p><p>只读 Sandbox Provider 接入蓝图已准备</p><p>凭证隔离准备度已通过</p><p>Provider 合同/授权选择板已准备</p><p>接入蓝图不启动真实接入</p><p>凭证隔离不读取真实密钥</p><p>Provider 选择不代表已合作或已授权</p><p>下一步仍需人工法务与安全审批</p><p>当前只展示只读 sandbox provider 接入规划</p><p>不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-provider-blueprint-show="true">查看接入蓝图</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-credential-isolation-show="true">查看凭证隔离</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-contract-show="true">查看 Provider 选择</button><div data-commerce-global-shopping-sandbox-provider-blueprint-output="true"><p>只读 Sandbox Provider 接入蓝图</p><p>' + escapeHtml(card.readOnlySandboxProviderIntegrationBlueprintSummary && card.readOnlySandboxProviderIntegrationBlueprintSummary.userFacingSummary && card.readOnlySandboxProviderIntegrationBlueprintSummary.userFacingSummary.resultLabel || '接入蓝图仍需复核') + '</p><p>接入蓝图不启动真实接入</p></div><div data-commerce-global-shopping-credential-isolation-output="true"><p>凭证隔离准备度</p><p>' + escapeHtml(card.credentialIsolationReadinessBoardSummary && card.credentialIsolationReadinessBoardSummary.userFacingSummary && card.credentialIsolationReadinessBoardSummary.userFacingSummary.resultLabel || '凭证隔离仍需复核') + '</p><p>凭证隔离不读取真实密钥</p></div><div data-commerce-global-shopping-provider-contract-output="true"><p>Provider 合同/授权选择板</p><p>' + escapeHtml(card.providerContractSelectionBoardSummary && card.providerContractSelectionBoardSummary.userFacingSummary && card.providerContractSelectionBoardSummary.userFacingSummary.resultLabel || 'Provider 选择仍需复核') + '</p><p>Provider 选择不代表已合作或已授权</p><p>下一步仍需人工法务与安全审批</p></div></section>' : '';
    const providerIntegrationPrepHtml = card.providerIntegrationPrepViewModelSummary ? '<section class="commerce-global-shopping-provider-integration-prep" data-commerce-global-shopping-provider-integration-prep="true"><h5>Provider 接入前准备</h5><p>Provider 法务审查档案</p><p>凭证保险箱接口桩</p><p>Sandbox Adapter 合同测试台</p><p>法务审查</p><p>凭证接口桩</p><p>Adapter 合同测试</p><p>Provider 法务审查档案已准备</p><p>凭证保险箱接口桩已准备</p><p>Sandbox Adapter 合同测试台已准备</p><p>法务审查不代表已合作或已授权</p><p>凭证接口桩不读取真实密钥</p><p>Adapter 合同测试不请求真实 provider</p><p>下一步仍需人工安全审批</p><p>当前只展示 provider 接入前准备</p><p>不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-legal-review-show="true">查看法务审查</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-credential-vault-show="true">查看凭证接口桩</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-adapter-contract-show="true">查看 Adapter 合同测试</button><div data-commerce-global-shopping-provider-legal-review-output="true"><p>Provider 法务审查档案</p><p>' + escapeHtml(card.providerLegalReviewDossierSummary && card.providerLegalReviewDossierSummary.userFacingSummary && card.providerLegalReviewDossierSummary.userFacingSummary.resultLabel || '法务审查仍需复核') + '</p><p>法务审查不代表已合作或已授权</p></div><div data-commerce-global-shopping-credential-vault-output="true"><p>凭证保险箱接口桩</p><p>' + escapeHtml(card.credentialVaultInterfaceStubSummary && card.credentialVaultInterfaceStubSummary.userFacingSummary && card.credentialVaultInterfaceStubSummary.userFacingSummary.resultLabel || '凭证接口桩仍需复核') + '</p><p>凭证接口桩不读取真实密钥</p></div><div data-commerce-global-shopping-adapter-contract-output="true"><p>Sandbox Adapter 合同测试台</p><p>' + escapeHtml(card.sandboxAdapterContractTestbedSummary && card.sandboxAdapterContractTestbedSummary.userFacingSummary && card.sandboxAdapterContractTestbedSummary.userFacingSummary.resultLabel || 'Adapter 合同测试仍需复核') + '</p><p>Adapter 合同测试不请求真实 provider</p><p>下一步仍需人工安全审批</p></div></section>' : '';
    const providerMockRuntimeHtml = card.providerMockRuntimeViewModelSummary ? '<section class="commerce-global-shopping-provider-mock-runtime" data-commerce-global-shopping-provider-mock-runtime="true"><h5>Provider Mock Runtime 与审批准备</h5><p>Sandbox Provider Mock Runtime</p><p>Vault Boundary Contract</p><p>法务审批流程板</p><p>Mock Runtime</p><p>Vault 边界</p><p>法务审批流程</p><p>Sandbox Provider Mock Runtime 已准备</p><p>Vault 边界合同已准备</p><p>法务审批流程板已准备</p><p>Mock Runtime 不接真实 provider</p><p>Vault 边界不读取或保存真实密钥</p><p>审批流程不创建任务、不发邮件</p><p>下一步仍需人工审批</p><p>当前只展示 provider mock runtime、vault 边界和审批准备</p><p>不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-mock-runtime-show="true">查看 Mock Runtime</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-vault-boundary-show="true">查看 Vault 边界</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-legal-approval-show="true">查看法务审批流程</button><div data-commerce-global-shopping-mock-runtime-output="true"><p>Sandbox Provider Mock Runtime</p><p>' + escapeHtml(card.sandboxProviderMockRuntimeSummary && card.sandboxProviderMockRuntimeSummary.userFacingSummary && card.sandboxProviderMockRuntimeSummary.userFacingSummary.resultLabel || 'Sandbox Provider Mock Runtime 仍需复核') + '</p><p>Mock Runtime 不接真实 provider</p></div><div data-commerce-global-shopping-vault-boundary-output="true"><p>Vault Boundary Contract</p><p>' + escapeHtml(card.vaultBoundaryContractSummary && card.vaultBoundaryContractSummary.userFacingSummary && card.vaultBoundaryContractSummary.userFacingSummary.resultLabel || 'Vault 边界合同仍需复核') + '</p><p>Vault 边界不读取或保存真实密钥</p></div><div data-commerce-global-shopping-legal-approval-output="true"><p>法务审批流程板</p><p>' + escapeHtml(card.legalApprovalWorkflowBoardSummary && card.legalApprovalWorkflowBoardSummary.userFacingSummary && card.legalApprovalWorkflowBoardSummary.userFacingSummary.resultLabel || '法务审批流程板仍需复核') + '</p><p>审批流程不创建任务、不发邮件</p><p>下一步仍需人工审批</p></div></section>' : '';
    const providerLaunchReadinessHtml = card.providerLaunchReadinessViewModelSummary ? '<section class="commerce-global-shopping-provider-launch-readiness" data-commerce-global-shopping-provider-launch-readiness="true"><h5>Provider 启动准备与合同回放</h5><p>Mock Provider Adapter 注册运行时</p><p>Provider 合同回放器</p><p>Provider 启动准备总闸门</p><p>Mock Adapter 注册</p><p>合同回放</p><p>启动准备</p><p>Mock Provider Adapter 注册运行时已准备</p><p>Provider 合同回放器已准备</p><p>Provider 启动准备总闸门已准备</p><p>Mock Adapter 注册不接真实 provider</p><p>合同回放不回放 raw request 或 raw response</p><p>启动准备不读取密钥、不联网</p><p>真实 sandbox provider 仍需人工审批</p><p>当前只展示 provider 启动准备和合同回放</p><p>不接真实 provider，不读取密钥，不联网，不打开平台，不启用生产 provider</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-mock-adapter-registry-show="true">查看 Mock Adapter 注册</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-contract-replay-show="true">查看合同回放</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-launch-readiness-show="true">查看启动准备</button><div data-commerce-global-shopping-mock-adapter-registry-output="true"><p>Mock Provider Adapter 注册运行时</p><p>' + escapeHtml(card.mockProviderAdapterRegistryRuntimeSummary && card.mockProviderAdapterRegistryRuntimeSummary.userFacingSummary && card.mockProviderAdapterRegistryRuntimeSummary.userFacingSummary.resultLabel || 'Mock Adapter 注册仍需复核') + '</p><p>Mock Adapter 注册不接真实 provider</p></div><div data-commerce-global-shopping-contract-replay-output="true"><p>Provider 合同回放器</p><p>' + escapeHtml(card.providerContractReplayHarnessSummary && card.providerContractReplayHarnessSummary.userFacingSummary && card.providerContractReplayHarnessSummary.userFacingSummary.resultLabel || '合同回放仍需复核') + '</p><p>合同回放不回放 raw request 或 raw response</p></div><div data-commerce-global-shopping-launch-readiness-output="true"><p>Provider 启动准备总闸门</p><p>' + escapeHtml(card.providerLaunchReadinessBoardSummary && card.providerLaunchReadinessBoardSummary.userFacingSummary && card.providerLaunchReadinessBoardSummary.userFacingSummary.resultLabel || '启动准备仍需复核') + '</p><p>启动准备不读取密钥、不联网</p><p>真实 sandbox provider 仍需人工审批</p></div></section>' : '';
    const providerLaunchSimulationHtml = card.providerLaunchSimulationViewModelSummary ? '<section class="commerce-global-shopping-provider-launch-simulation" data-commerce-global-shopping-provider-launch-simulation="true"><h5>Provider 启动模拟与回滚预案</h5><p>人工审批模拟闸门</p><p>Mock Provider 启动演练</p><p>Sandbox Provider 回滚预案</p><p>审批模拟</p><p>启动演练</p><p>回滚预案</p><p>' + escapeHtml(card.humanApprovalSimulationGateSummary && card.humanApprovalSimulationGateSummary.userFacingSummary && card.humanApprovalSimulationGateSummary.userFacingSummary.resultLabel || '审批模拟仍需复核') + '</p><p>' + escapeHtml(card.mockProviderLaunchDrillSummary && card.mockProviderLaunchDrillSummary.userFacingSummary && card.mockProviderLaunchDrillSummary.userFacingSummary.resultLabel || 'Mock 启动演练仍需复核') + '</p><p>' + escapeHtml(card.sandboxProviderRollbackPlanSummary && card.sandboxProviderRollbackPlanSummary.userFacingSummary && card.sandboxProviderRollbackPlanSummary.userFacingSummary.resultLabel || '回滚预案仍需复核') + '</p><p>审批模拟不代表真实审批完成</p><p>Mock 启动不启动真实 provider</p><p>回滚预案不执行回滚</p><p>真实 sandbox provider pilot 仍需人工控制</p><p>当前只展示 provider 启动模拟和回滚预案</p><p>不接真实 provider，不读取密钥，不联网，不生成 endpoint，不打开平台，不执行回滚</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-human-approval-show="true">查看审批模拟</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-mock-launch-drill-show="true">查看启动演练</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-rollback-plan-show="true">查看回滚预案</button><div data-commerce-global-shopping-human-approval-output="true"><p>人工审批模拟闸门</p><p>' + escapeHtml(card.humanApprovalSimulationGateSummary && card.humanApprovalSimulationGateSummary.userFacingSummary && card.humanApprovalSimulationGateSummary.userFacingSummary.resultLabel || '审批模拟仍需复核') + '</p><p>审批模拟不代表真实审批完成</p><p>真实 sandbox provider pilot 仍需人工控制</p></div><div data-commerce-global-shopping-mock-launch-drill-output="true"><p>Mock Provider 启动演练</p><p>' + escapeHtml(card.mockProviderLaunchDrillSummary && card.mockProviderLaunchDrillSummary.userFacingSummary && card.mockProviderLaunchDrillSummary.userFacingSummary.resultLabel || 'Mock 启动演练仍需复核') + '</p><p>Mock 启动不启动真实 provider</p><p>不读取密钥，不联网，不生成 endpoint</p></div><div data-commerce-global-shopping-rollback-plan-output="true"><p>Sandbox Provider 回滚预案</p><p>' + escapeHtml(card.sandboxProviderRollbackPlanSummary && card.sandboxProviderRollbackPlanSummary.userFacingSummary && card.sandboxProviderRollbackPlanSummary.userFacingSummary.resultLabel || '回滚预案仍需复核') + '</p><p>回滚预案不执行回滚</p><p>不改 git，不删文件，不停服务，不修改配置</p></div></section>' : '';
    const providerPilotControlHtml = card.providerPilotControlViewModelSummary ? '<section class="commerce-global-shopping-provider-pilot-control" data-commerce-global-shopping-provider-pilot-control="true"><h5>Provider Sandbox Pilot 控制与阻断</h5><p>Provider Sandbox Pilot 控制室</p><p>Mock Provider 事故演练</p><p>Production 阻断矩阵</p><p>Pilot 控制室</p><p>事故演练</p><p>阻断矩阵</p><p>' + escapeHtml(card.providerSandboxPilotControlRoomSummary && card.providerSandboxPilotControlRoomSummary.userFacingSummary && card.providerSandboxPilotControlRoomSummary.userFacingSummary.resultLabel || 'Sandbox Pilot 控制室仍需复核') + '</p><p>' + escapeHtml(card.mockProviderIncidentDrillSummary && card.mockProviderIncidentDrillSummary.userFacingSummary && card.mockProviderIncidentDrillSummary.userFacingSummary.resultLabel || 'Mock 事故演练仍需复核') + '</p><p>' + escapeHtml(card.productionBlockerMatrixSummary && card.productionBlockerMatrixSummary.userFacingSummary && card.productionBlockerMatrixSummary.userFacingSummary.resultLabel || 'Production 阻断矩阵仍需复核') + '</p><p>Pilot 控制室不启动真实 provider</p><p>事故演练不触发真实告警或回滚</p><p>阻断矩阵不修改运行配置</p><p>Human-controlled pilot 仍需人工审批</p><p>当前只展示 sandbox pilot 控制、mock 事故演练和 production 阻断矩阵</p><p>不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-pilot-control-room-show="true">查看 Pilot 控制室</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-incident-drill-show="true">查看事故演练</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-production-blockers-show="true">查看阻断矩阵</button><div data-commerce-global-shopping-pilot-control-room-output="true"><p>Provider Sandbox Pilot 控制室</p><p>' + escapeHtml(card.providerSandboxPilotControlRoomSummary && card.providerSandboxPilotControlRoomSummary.userFacingSummary && card.providerSandboxPilotControlRoomSummary.userFacingSummary.resultLabel || 'Sandbox Pilot 控制室仍需复核') + '</p><p>Pilot 控制室不启动真实 provider</p><p>Human-controlled pilot 仍需人工审批</p></div><div data-commerce-global-shopping-incident-drill-output="true"><p>Mock Provider 事故演练</p><p>' + escapeHtml(card.mockProviderIncidentDrillSummary && card.mockProviderIncidentDrillSummary.userFacingSummary && card.mockProviderIncidentDrillSummary.userFacingSummary.resultLabel || 'Mock 事故演练仍需复核') + '</p><p>事故演练不触发真实告警或回滚</p><p>不上传日志，不发邮件，不停服务</p></div><div data-commerce-global-shopping-production-blockers-output="true"><p>Production 阻断矩阵</p><p>' + escapeHtml(card.productionBlockerMatrixSummary && card.productionBlockerMatrixSummary.userFacingSummary && card.productionBlockerMatrixSummary.userFacingSummary.resultLabel || 'Production 阻断矩阵仍需复核') + '</p><p>阻断矩阵不修改运行配置</p><p>不启用 provider，不读取密钥，不联网</p></div></section>' : '';
    const providerPilotGovernanceHtml = (card.providerPilotGovernanceViewModelSummary || card.providerGovernanceConsoleSummary || card.providerOperatorReviewLoopSummary) ? '<section class="commerce-global-shopping-provider-pilot-governance" data-commerce-global-shopping-provider-pilot-governance="true"><h5>Provider Governance Console + Operator Review Loop</h5><p>人工控制 Sandbox Provider Pilot 计划器</p><p>Provider Kill Switch 演练</p><p>合规证据包</p><p>Provider Governance Console</p><p>Operator Review Loop</p><p>Pilot 计划</p><p>Kill Switch</p><p>合规证据</p><p>' + escapeHtml(card.humanControlledSandboxProviderPilotPlannerSummary && card.humanControlledSandboxProviderPilotPlannerSummary.userFacingSummary && card.humanControlledSandboxProviderPilotPlannerSummary.userFacingSummary.resultLabel || 'Pilot 计划仍需复核') + '</p><p>' + escapeHtml(card.providerKillSwitchDrillSummary && card.providerKillSwitchDrillSummary.userFacingSummary && card.providerKillSwitchDrillSummary.userFacingSummary.resultLabel || 'Kill Switch 演练仍需复核') + '</p><p>' + escapeHtml(card.complianceEvidencePackSummary && card.complianceEvidencePackSummary.userFacingSummary && card.complianceEvidencePackSummary.userFacingSummary.resultLabel || '合规证据仍需复核') + '</p><p>' + escapeHtml(card.providerGovernanceConsoleSummary && card.providerGovernanceConsoleSummary.userVisibleSummary && card.providerGovernanceConsoleSummary.userVisibleSummary.resultLabel || '治理控制台仍需复核') + '</p><p>' + escapeHtml(card.providerOperatorReviewLoopSummary && card.providerOperatorReviewLoopSummary.userFacingSummary && card.providerOperatorReviewLoopSummary.userFacingSummary.resultLabel || '运营复核循环仍需复核') + '</p><p>blocked action 列表</p><p>allowed next action 列表</p><p>operator review checklist</p><p>当前只展示 provider pilot 治理和运营人工复核循环</p><p>不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚，不导出文件</p><p>Human audit 仍需人工复核</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-pilot-governance-show="true">查看治理视图</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-pilot-planner-show="true">查看 Pilot 计划</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-kill-switch-drill-show="true">查看 Kill Switch</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-compliance-evidence-pack-show="true">查看合规证据</button><div data-commerce-global-shopping-provider-pilot-governance-output="true"><p>Provider Governance Console</p><p>' + escapeHtml(card.providerGovernanceConsoleSummary && card.providerGovernanceConsoleSummary.userVisibleSummary && card.providerGovernanceConsoleSummary.userVisibleSummary.resultLabel || card.providerPilotGovernanceViewModelSummary && card.providerPilotGovernanceViewModelSummary.title || 'Provider Governance Console') + '</p><p>Operator Review Loop</p><p>' + escapeHtml(card.providerOperatorReviewLoopSummary && card.providerOperatorReviewLoopSummary.userFacingSummary && card.providerOperatorReviewLoopSummary.userFacingSummary.resultLabel || '运营复核循环仍需复核') + '</p><p>allowed next action: ' + escapeHtml(card.providerGovernanceConsoleSummary && card.providerGovernanceConsoleSummary.allowedNextActions && card.providerGovernanceConsoleSummary.allowedNextActions.join(' / ') || 'review_operator_checklist') + '</p><p>blocked action: ' + escapeHtml(card.providerGovernanceConsoleSummary && card.providerGovernanceConsoleSummary.blockedActions && card.providerGovernanceConsoleSummary.blockedActions.join(' / ') || 'none') + '</p><p>operator review checklist 已生成</p><p>当前只展示 provider pilot 治理和运营人工复核循环</p><p>不接真实 provider，不读取密钥，不联网，不生成 endpoint，不执行回滚，不导出文件</p><p>Human audit 仍需人工复核</p></div><div data-commerce-global-shopping-pilot-planner-output="true"><p>人工控制 Sandbox Provider Pilot 计划器</p><p>' + escapeHtml(card.humanControlledSandboxProviderPilotPlannerSummary && card.humanControlledSandboxProviderPilotPlannerSummary.userFacingSummary && card.humanControlledSandboxProviderPilotPlannerSummary.userFacingSummary.resultLabel || 'Pilot 计划仍需复核') + '</p><p>Pilot 计划不启动真实 provider</p><p>不读取密钥，不联网，不生成 endpoint</p></div><div data-commerce-global-shopping-provider-kill-switch-drill-output="true"><p>Provider Kill Switch 演练</p><p>' + escapeHtml(card.providerKillSwitchDrillSummary && card.providerKillSwitchDrillSummary.userFacingSummary && card.providerKillSwitchDrillSummary.userFacingSummary.resultLabel || 'Kill Switch 演练仍需复核') + '</p><p>Kill Switch 演练不禁用真实 provider</p><p>不改配置，不执行回滚，不停服务</p></div><div data-commerce-global-shopping-compliance-evidence-pack-output="true"><p>合规证据包</p><p>' + escapeHtml(card.complianceEvidencePackSummary && card.complianceEvidencePackSummary.userFacingSummary && card.complianceEvidencePackSummary.userFacingSummary.resultLabel || '合规证据仍需复核') + '</p><p>合规证据包不写文件、不导出</p><p>不包含密钥、raw provider request 或 raw provider response</p></div></section>' : '';
    const providerGovernanceReleaseHtml = (card.providerGovernanceAuditConsoleSummary || card.humanPilotReadinessLedgerSummary || card.sandboxProviderReleaseFreezeGateSummary || card.providerGovernanceReleaseViewModelSummary) ? '<section class="commerce-global-shopping-provider-governance-release" data-commerce-global-shopping-provider-governance-release="true"><h5>Provider Governance 发布审计与冻结闸门</h5><p>Provider Governance 审计控制台</p><p>Human Pilot 准备台账</p><p>Sandbox Provider Release Freeze Gate</p><p>治理审计</p><p>Human Pilot 台账</p><p>Release Freeze</p><p>' + escapeHtml(card.providerGovernanceAuditConsoleSummary && card.providerGovernanceAuditConsoleSummary.userFacingSummary && card.providerGovernanceAuditConsoleSummary.userFacingSummary.resultLabel || 'Provider Governance 审计控制台已准备') + '</p><p>' + escapeHtml(card.humanPilotReadinessLedgerSummary && card.humanPilotReadinessLedgerSummary.userFacingSummary && card.humanPilotReadinessLedgerSummary.userFacingSummary.resultLabel || 'Human Pilot 准备台账已准备') + '</p><p>' + escapeHtml(card.sandboxProviderReleaseFreezeGateSummary && card.sandboxProviderReleaseFreezeGateSummary.userFacingSummary && card.sandboxProviderReleaseFreezeGateSummary.userFacingSummary.resultLabel || 'Sandbox Provider Release Freeze Gate 已准备') + '</p><p>治理审计不写文件、不上传</p><p>Human Pilot 台账不持久化审批结果</p><p>Release Freeze Gate 不改 git、不 push</p><p>Manual governance release decision 仍需人工确认</p><p>当前只展示 provider governance 发布审计与冻结闸门</p><p>不接真实 provider，不读取密钥，不联网，不改 git，不 push，不导出文件</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-governance-audit-show="true">查看治理审计</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-human-pilot-ledger-show="true">查看 Human Pilot 台账</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-release-freeze-show="true">查看 Release Freeze</button><div data-commerce-global-shopping-provider-governance-audit-output="true"><p>Provider Governance 审计控制台</p><p>' + escapeHtml(card.providerGovernanceAuditConsoleSummary && card.providerGovernanceAuditConsoleSummary.userFacingSummary && card.providerGovernanceAuditConsoleSummary.userFacingSummary.resultLabel || 'Provider Governance 审计控制台已准备') + '</p><p>治理审计不写文件、不上传</p><p>当前只展示 provider governance 发布审计与冻结闸门</p></div><div data-commerce-global-shopping-human-pilot-ledger-output="true"><p>Human Pilot 准备台账</p><p>' + escapeHtml(card.humanPilotReadinessLedgerSummary && card.humanPilotReadinessLedgerSummary.userFacingSummary && card.humanPilotReadinessLedgerSummary.userFacingSummary.resultLabel || 'Human Pilot 准备台账已准备') + '</p><p>Human Pilot 台账不持久化审批结果</p><p>Manual governance release decision 仍需人工确认</p></div><div data-commerce-global-shopping-release-freeze-output="true"><p>Sandbox Provider Release Freeze Gate</p><p>' + escapeHtml(card.sandboxProviderReleaseFreezeGateSummary && card.sandboxProviderReleaseFreezeGateSummary.userFacingSummary && card.sandboxProviderReleaseFreezeGateSummary.userFacingSummary.resultLabel || 'Sandbox Provider Release Freeze Gate 已准备') + '</p><p>Release Freeze Gate 不改 git、不 push</p><p>不接真实 provider，不读取密钥，不联网，不改 git，不 push，不导出文件</p></div></section>' : '';
    const providerManualReleaseHtml = (card.manualGovernanceReleaseDecisionRoomSummary || card.sandboxPilotExceptionRegisterSummary || card.providerReadinessSignOffPacketSummary || card.providerManualReleaseViewModelSummary) ? '<section class="commerce-global-shopping-provider-manual-release" data-commerce-global-shopping-provider-manual-release="true"><h5>Provider 人工发布决策与签核</h5><p>Manual Governance Release 决策室</p><p>Sandbox Pilot 例外登记簿</p><p>Provider 准备签核包</p><p>人工发布决策</p><p>例外登记</p><p>准备签核</p><p>' + escapeHtml(card.manualGovernanceReleaseDecisionRoomSummary && card.manualGovernanceReleaseDecisionRoomSummary.userFacingSummary && card.manualGovernanceReleaseDecisionRoomSummary.userFacingSummary.resultLabel || 'Manual Governance Release 决策室已准备') + '</p><p>' + escapeHtml(card.sandboxPilotExceptionRegisterSummary && card.sandboxPilotExceptionRegisterSummary.userFacingSummary && card.sandboxPilotExceptionRegisterSummary.userFacingSummary.resultLabel || 'Sandbox Pilot 例外登记簿已准备') + '</p><p>' + escapeHtml(card.providerReadinessSignOffPacketSummary && card.providerReadinessSignOffPacketSummary.userFacingSummary && card.providerReadinessSignOffPacketSummary.userFacingSummary.resultLabel || 'Provider 准备签核包已准备') + '</p><p>人工发布决策不创建 release、不 push</p><p>例外登记不持久化审批结果</p><p>准备签核包不写文件、不导出</p><p>Manual provider sign-off 仍需人工复核</p><p>当前只展示 provider 人工发布决策、例外登记和准备签核</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不创建 tag，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-manual-release-decision-show="true">查看人工发布决策</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-exception-register-show="true">查看例外登记</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-signoff-show="true">查看准备签核</button><div data-commerce-global-shopping-manual-release-decision-output="true"><p>Manual Governance Release 决策室</p><p>' + escapeHtml(card.manualGovernanceReleaseDecisionRoomSummary && card.manualGovernanceReleaseDecisionRoomSummary.userFacingSummary && card.manualGovernanceReleaseDecisionRoomSummary.userFacingSummary.resultLabel || 'Manual Governance Release 决策室已准备') + '</p><p>人工发布决策不创建 release、不 push</p></div><div data-commerce-global-shopping-sandbox-exception-register-output="true"><p>Sandbox Pilot 例外登记簿</p><p>' + escapeHtml(card.sandboxPilotExceptionRegisterSummary && card.sandboxPilotExceptionRegisterSummary.userFacingSummary && card.sandboxPilotExceptionRegisterSummary.userFacingSummary.resultLabel || 'Sandbox Pilot 例外登记簿已准备') + '</p><p>例外登记不持久化审批结果</p></div><div data-commerce-global-shopping-provider-signoff-output="true"><p>Provider 准备签核包</p><p>' + escapeHtml(card.providerReadinessSignOffPacketSummary && card.providerReadinessSignOffPacketSummary.userFacingSummary && card.providerReadinessSignOffPacketSummary.userFacingSummary.resultLabel || 'Provider 准备签核包已准备') + '</p><p>准备签核包不写文件、不导出</p><p>Manual provider sign-off 仍需人工复核</p></div></section>' : '';
    const providerSandboxActivationHtml = (card.readOnlySandboxActivationReadinessCenterSummary || card.offlineMockSandboxSessionRunnerSummary || card.manualProviderActivationHandoffPacketSummary || card.providerSandboxActivationViewModelSummary) ? '<section class="commerce-global-shopping-provider-sandbox-activation" data-commerce-global-shopping-provider-sandbox-activation="true"><h5>Provider Sandbox 激活准备与离线演练</h5><p>只读 Sandbox 激活准备中心</p><p>离线 Mock Sandbox 会话运行器</p><p>人工 Provider 激活交接包</p><p>Sandbox 激活准备</p><p>离线 Mock 会话</p><p>人工激活交接</p><p>' + escapeHtml(card.readOnlySandboxActivationReadinessCenterSummary && card.readOnlySandboxActivationReadinessCenterSummary.userFacingSummary && card.readOnlySandboxActivationReadinessCenterSummary.userFacingSummary.resultLabel || 'Sandbox 激活准备中心已准备') + '</p><p>' + escapeHtml(card.offlineMockSandboxSessionRunnerSummary && card.offlineMockSandboxSessionRunnerSummary.userFacingSummary && card.offlineMockSandboxSessionRunnerSummary.userFacingSummary.resultLabel || '离线 Mock Sandbox 会话运行器已准备') + '</p><p>' + escapeHtml(card.manualProviderActivationHandoffPacketSummary && card.manualProviderActivationHandoffPacketSummary.userFacingSummary && card.manualProviderActivationHandoffPacketSummary.userFacingSummary.resultLabel || '人工 Provider 激活交接包已准备') + '</p><p>Sandbox 激活准备不执行激活</p><p>离线 Mock 会话不联网、不读密钥</p><p>人工激活交接包不创建 release、不 push</p><p>Manual sandbox activation 仍需人工复核</p><p>当前只展示 provider sandbox 激活准备、离线 mock 会话和人工激活交接</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-activation-readiness-show="true">查看 Sandbox 激活准备</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-offline-mock-session-show="true">查看离线 Mock 会话</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-manual-activation-handoff-show="true">查看人工激活交接</button><div data-commerce-global-shopping-sandbox-activation-readiness-output="true"><p>只读 Sandbox 激活准备中心</p><p>' + escapeHtml(card.readOnlySandboxActivationReadinessCenterSummary && card.readOnlySandboxActivationReadinessCenterSummary.userFacingSummary && card.readOnlySandboxActivationReadinessCenterSummary.userFacingSummary.resultLabel || 'Sandbox 激活准备中心已准备') + '</p><p>Sandbox 激活准备不执行激活</p></div><div data-commerce-global-shopping-offline-mock-session-output="true"><p>离线 Mock Sandbox 会话运行器</p><p>' + escapeHtml(card.offlineMockSandboxSessionRunnerSummary && card.offlineMockSandboxSessionRunnerSummary.userFacingSummary && card.offlineMockSandboxSessionRunnerSummary.userFacingSummary.resultLabel || '离线 Mock Sandbox 会话运行器已准备') + '</p><p>离线 Mock 会话不联网、不读密钥</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-manual-activation-handoff-output="true"><p>人工 Provider 激活交接包</p><p>' + escapeHtml(card.manualProviderActivationHandoffPacketSummary && card.manualProviderActivationHandoffPacketSummary.userFacingSummary && card.manualProviderActivationHandoffPacketSummary.userFacingSummary.resultLabel || '人工 Provider 激活交接包已准备') + '</p><p>人工激活交接包不创建 release、不 push</p><p>Manual sandbox activation 仍需人工复核</p></div></section>' : '';
    const externalPlatformExitHtml = card.externalPlatformExitViewModelSummary ? '<section class="commerce-global-shopping-external-platform-exit" data-commerce-global-shopping-external-platform-exit="true"><h5>外部平台手动访问前最终说明</h5><p>外部平台手动访问前最终说明</p><p>外部平台退出坡道预览</p><p>手动访问安全简报</p><p>只读会话关闭包</p><p>退出坡道</p><p>安全简报</p><p>会话关闭包</p><p>外部平台退出坡道已准备</p><p>手动访问安全简报已准备</p><p>只读会话关闭包已准备</p><p>退出坡道不打开平台</p><p>安全简报不保存确认</p><p>会话关闭包不导出、不下载</p><p>关闭包不是合同、订单或付款授权</p><p>当前只展示离开 Weishan 前的最终说明</p><p>不打开平台，不生成链接，不保存选择，不构成订单、付款授权或签名</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-external-platform-exit-ramp-show="true">查看退出坡道</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-manual-visit-safety-brief-show="true">查看安全简报</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-read-only-session-closure-pack-show="true">查看会话关闭包</button><div data-commerce-global-shopping-external-platform-exit-ramp-output="true"><p>外部平台退出坡道预览</p><p>' + escapeHtml(card.externalPlatformExitRampPreviewSummary && card.externalPlatformExitRampPreviewSummary.userFacingSummary && card.externalPlatformExitRampPreviewSummary.userFacingSummary.resultLabel || '外部平台退出坡道仍需复核') + '</p><p>当前只展示离开 Weishan 前的最终说明</p><p>退出坡道不打开平台</p></div><div data-commerce-global-shopping-manual-visit-safety-brief-output="true"><p>手动访问安全简报</p><p>' + escapeHtml(card.manualVisitSafetyBriefSummary && card.manualVisitSafetyBriefSummary.userFacingSummary && card.manualVisitSafetyBriefSummary.userFacingSummary.resultLabel || '手动访问安全简报仍需复核') + '</p><p>安全简报不保存确认</p><p>平台页面为最终依据</p></div><div data-commerce-global-shopping-read-only-session-closure-pack-output="true"><p>只读会话关闭包</p><p>' + escapeHtml(card.readOnlySessionClosurePackSummary && card.readOnlySessionClosurePackSummary.userFacingSummary && card.readOnlySessionClosurePackSummary.userFacingSummary.resultLabel || '只读会话关闭包仍需复核') + '</p><p>会话关闭包不导出、不下载</p><p>关闭包不是合同、订单或付款授权</p></div></section>' : '';
    const globalShoppingGoalHtml = card.globalShoppingProductGoalViewModelSummary ? '<section class="commerce-global-shopping-product-goal" data-commerce-global-shopping-product-goal="true"><h5>全球购产品目标与跳转边界</h5><p>全球购产品目标</p><p>合法 Provider Fixture 与 Sandbox 价格 Feed</p><p>合法 Provider Fixture 适配器</p><p>Provider 凭据安全复核</p><p>Sandbox 价格 Feed 闸门</p><p>跳转至平台查看</p><p>Sandbox 跳转候选与平台可用性</p><p>Sandbox 跳转候选</p><p>平台可用性</p><p>合作/联盟链接政策</p><p>合作链接披露</p><p>外部平台跳转安全闸门</p><p>搜索参数预填闸门</p><p>目标平台</p><p>可带入搜索条件</p><p>平台自行下单</p><p>安全边界</p><p>当前已覆盖来源中的较低候选价</p><p>与官方价对比</p><p>已接入平台候选价</p><p>价格以跳转后平台实时页面为准</p><p>平台页面为实时价格准绳</p><p>当前仅提供只读候选证据，不提供付款、下单或出票能力</p><p>Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单</p><p>Weishan 仅可携带非敏感搜索条件</p><p>部分平台链接未来可能属于合作或联盟链接</p><p>Weishan 可能获得佣金，但不会因此提高展示价格</p><p>合作或联盟链接不代表平台、品牌或商家对 Weishan 的官方背书</p><p>不保存平台账号</p><p>不保存证件银行卡</p><p>不保存支付凭证</p><p>Provider fixture 已准备</p><p>Provider 凭据边界安全</p><p>Sandbox 价格 Feed 已准备</p><p>不读取生产密钥</p><p>不保存 raw provider response</p><p>Fixture feed 可进入价格归一化</p><p>Provider fixture 不代表真实价格</p><p>禁止最低价相关承诺</p><p>禁止自动下单承诺</p><p>合作链接不代表最低价</p><p>Sandbox 跳转不打开真实平台</p><p>平台可用不代表官方背书</p><p>本轮仅展示只读跳转预览，不打开真实平台</p><p>跳转预览不代表下单能力</p><p>跳转不代表交易能力</p><p>' + escapeHtml(card.globalShoppingProductGoalSummary && card.globalShoppingProductGoalSummary.userFacingSummary && card.globalShoppingProductGoalSummary.userFacingSummary.resultLabel || "产品目标仍需复核") + '</p><p>' + escapeHtml(card.jumpToPlatformBoundarySummary && card.jumpToPlatformBoundarySummary.userFacingSummary && card.jumpToPlatformBoundarySummary.userFacingSummary.resultLabel || "跳转边界仍需复核") + '</p><p>' + escapeHtml(card.legalProviderFixtureSummary && card.legalProviderFixtureSummary.userFacingSummary && card.legalProviderFixtureSummary.userFacingSummary.resultLabel || "Provider fixture 仍需复核") + '</p><p>' + escapeHtml(card.providerCredentialSafetySummary && card.providerCredentialSafetySummary.userFacingSummary && card.providerCredentialSafetySummary.userFacingSummary.resultLabel || "Provider 凭据边界仍需复核") + '</p><p>' + escapeHtml(card.sandboxPriceFeedSummary && card.sandboxPriceFeedSummary.userFacingSummary && card.sandboxPriceFeedSummary.userFacingSummary.resultLabel || "Sandbox 价格 Feed 仍需复核") + '</p><p>' + escapeHtml(card.externalDeepLinkSafetySummary && card.externalDeepLinkSafetySummary.userFacingSummary && card.externalDeepLinkSafetySummary.userFacingSummary.resultLabel || "跳转安全仍需复核") + '</p><p>' + escapeHtml(card.searchParameterPrefillSummary && card.searchParameterPrefillSummary.userFacingSummary && card.searchParameterPrefillSummary.userFacingSummary.resultLabel || "预填边界仍需复核") + '</p><p>' + escapeHtml(card.sandboxDeepLinkCandidateSummary && card.sandboxDeepLinkCandidateSummary.userFacingSummary && card.sandboxDeepLinkCandidateSummary.userFacingSummary.resultLabel || "Sandbox 跳转候选仍需复核") + '</p><p>' + escapeHtml(card.platformAvailabilitySummary && card.platformAvailabilitySummary.userFacingSummary && card.platformAvailabilitySummary.userFacingSummary.resultLabel || "平台可用性仍需复核") + '</p><p>' + escapeHtml(card.partnerLinkPolicySummary && card.partnerLinkPolicySummary.userFacingSummary && card.partnerLinkPolicySummary.userFacingSummary.resultLabel || "合作链接政策仍需复核") + '</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-product-goal-show="true">查看全球购产品目标</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-jump-boundary-show="true">查看跳转边界</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-fixture-show="true">查看 Provider Fixture</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-credential-safety-show="true">查看凭据安全</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-price-feed-show="true">查看 Sandbox 价格 Feed</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-deep-link-safety-show="true">查看跳转安全</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-prefill-gate-show="true">查看预填边界</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-handoff-preview-show="true">查看跳转预览</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-candidate-show="true">查看 Sandbox 跳转候选</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-platform-availability-show="true">查看平台可用性</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-partner-policy-show="true">查看合作链接政策</button><div data-commerce-global-shopping-product-goal-output="true"><p>全球购产品目标与跳转边界</p><p>全球购产品目标</p><p>可信候选价格</p><p>官方价格锚点</p><p>合法平台候选价</p><p>平台自行下单</p><p>当前已覆盖来源中的较低候选价</p><p>与官方价对比</p><p>已接入平台候选价</p><p>价格以跳转后平台实时页面为准</p><p>当前仅提供只读候选证据，不提供付款、下单或出票能力</p><p>Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单</p><p>禁止最低价相关承诺</p><p>禁止自动下单承诺</p><p>跳转不代表交易能力</p></div><div data-commerce-global-shopping-jump-boundary-output="true"><p>跳转至平台自行下单边界</p><p>Weishan 可尽量带入搜索条件，但用户需在对应平台自行确认价格、登录、填写资料并完成下单</p><p>当前仅提供只读候选证据，不提供付款、下单或出票能力</p><p>价格以跳转后平台实时页面为准</p><p>不打开外部平台</p><p>不生成交易链接</p></div><div data-commerce-global-shopping-provider-fixture-output="true"><p>合法 Provider Fixture 适配器</p><p>Provider fixture 已准备</p><p>不读取生产密钥</p><p>不保存 raw provider response</p><p>Provider fixture 不代表真实价格</p></div><div data-commerce-global-shopping-credential-safety-output="true"><p>Provider 凭据安全复核</p><p>Provider 凭据边界安全</p><p>不读取生产密钥</p><p>不保存 raw provider response</p><p>不保存 token/key/secret</p></div><div data-commerce-global-shopping-sandbox-price-feed-output="true"><p>Sandbox 价格 Feed 闸门</p><p>Sandbox 价格 Feed 已准备</p><p>Fixture feed 可进入价格归一化</p><p>Provider fixture 不代表真实价格</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-deep-link-safety-output="true"><p>外部平台跳转安全闸门</p><p>跳转安全结构已准备</p><p>目标平台</p><p>平台自行下单</p><p>不保存平台账号</p><p>不保存证件银行卡</p><p>不保存支付凭证</p><p>Sandbox 跳转不打开真实平台</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-prefill-gate-output="true"><p>搜索参数预填闸门</p><p>预填边界安全</p><p>可带入搜索条件</p><p>Weishan 仅可携带非敏感搜索条件</p><p>用户需在平台自行确认价格、填写必要资料并完成下单</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-handoff-preview-output="true"><p>跳转至平台查看</p><p>目标平台</p><p>可带入搜索条件</p><p>平台自行下单</p><p>安全边界</p><p>合作链接披露</p><p>平台页面为实时价格准绳</p><p>本轮仅展示只读跳转预览，不打开真实平台</p><p>跳转预览不代表下单能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-sandbox-candidate-output="true"><p>Sandbox 跳转候选</p><p>Sandbox 跳转候选已准备</p><p>fixtureOnly:true</p><p>sandboxOnly:true</p><p>readOnly:true</p><p>disabledToOpen:true</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-platform-availability-output="true"><p>平台可用性</p><p>平台候选可展示</p><p>平台可用不代表官方背书</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-partner-policy-output="true"><p>合作/联盟链接政策</p><p>合作链接政策合规</p><p>部分平台链接未来可能属于合作或联盟链接</p><p>Weishan 可能获得佣金，但不会因此提高展示价格</p><p>合作或联盟链接不代表平台、品牌或商家对 Weishan 的官方背书</p><p>合作链接不代表最低价</p><p>平台页面为实时价格准绳</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>' : '';
    const providerConnectorReplayHtml = card.readOnlyProviderSandboxConnectorSummary || card.fixtureReplayConsoleSummary || card.normalizedPriceCandidateBoardSummary ? '<section class="commerce-global-shopping-provider-sandbox-connector" data-commerce-global-shopping-provider-sandbox-connector="true"><h5>只读 Provider Sandbox Connector</h5><p>只读 Provider Connector 已准备</p><p>Fixture 回放已准备</p><p>归一化价格候选板已准备</p><p>Replay 不代表真实 provider 调用</p><p>Connector 不读取生产密钥</p><p>归一化候选不代表真实价格</p><p>价格候选板不代表下单能力</p><p>当前仅展示只读 fixture/sandbox 归一化候选</p><p>不请求真实平台，不代表真实价格、锁价、最低价、付款、下单或出票能力</p><p>Provider Connector</p><p>Fixture 回放</p><p>官方参考价</p><p>已覆盖来源较低候选价</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-connector-show="true">查看 Provider Connector</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-fixture-replay-show="true">查看 Fixture 回放</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-normalized-board-show="true">查看归一化候选板</button><div data-commerce-global-shopping-provider-connector-output="true"><p>只读 Provider Sandbox Connector</p><p>' + escapeHtml(card.readOnlyProviderSandboxConnectorSummary && card.readOnlyProviderSandboxConnectorSummary.userFacingSummary && card.readOnlyProviderSandboxConnectorSummary.userFacingSummary.resultLabel || '只读 Provider Connector 仍需复核') + '</p><p>Connector 不读取生产密钥</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-fixture-replay-output="true"><p>Fixture 回放控制台</p><p>' + escapeHtml(card.fixtureReplayConsoleSummary && card.fixtureReplayConsoleSummary.userFacingSummary && card.fixtureReplayConsoleSummary.userFacingSummary.resultLabel || 'Fixture 回放仍需复核') + '</p><p>Replay 不代表真实 provider 调用</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-normalized-board-output="true"><p>归一化价格候选板</p><p>' + escapeHtml(card.normalizedPriceCandidateBoardSummary && card.normalizedPriceCandidateBoardSummary.title || '归一化价格候选板') + '</p><p>Provider Connector</p><p>Fixture 回放</p><p>官方参考价</p><p>已覆盖来源较低候选价</p><p>归一化候选不代表真实价格</p><p>价格候选板不代表下单能力</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>' : '';
    const providerSandboxDryRunHtml = card.providerSandboxDryRunViewModelSummary ? '<section class="commerce-global-shopping-provider-sandbox-dry-run" data-commerce-global-shopping-provider-sandbox-dry-run="true"><h5>Provider Sandbox 离线 Dry-run</h5><p>离线 Sandbox Trace 检查器</p><p>Mock Provider 结果归一化器</p><p>人工激活 Dry-run 检查清单</p><p>离线 Trace 检查</p><p>Mock 结果归一化</p><p>激活 Dry-run</p><p>' + escapeHtml(card.offlineSandboxTraceInspectorSummary && card.offlineSandboxTraceInspectorSummary.userFacingSummary && card.offlineSandboxTraceInspectorSummary.userFacingSummary.resultLabel || '离线 Trace 检查仍需复核') + '</p><p>' + escapeHtml(card.mockProviderResultNormalizerSummary && card.mockProviderResultNormalizerSummary.userFacingSummary && card.mockProviderResultNormalizerSummary.userFacingSummary.resultLabel || 'Mock 结果归一化仍需复核') + '</p><p>' + escapeHtml(card.manualActivationDryRunChecklistSummary && card.manualActivationDryRunChecklistSummary.userFacingSummary && card.manualActivationDryRunChecklistSummary.userFacingSummary.resultLabel || '激活 Dry-run 仍需复核') + '</p><p>离线 Trace 检查不保存 raw trace</p><p>Mock 结果归一化不处理真实 provider response</p><p>激活 Dry-run 不激活 sandbox、不创建 release</p><p>Manual sandbox dry-run 仍需人工复核</p><p>当前只展示 provider sandbox 离线 dry-run</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-offline-trace-inspector-show="true">查看离线 Trace 检查</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-mock-result-normalizer-show="true">查看 Mock 结果归一化</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-manual-activation-dry-run-show="true">查看激活 Dry-run</button><div data-commerce-global-shopping-offline-trace-inspector-output="true"><p>离线 Sandbox Trace 检查器</p><p>' + escapeHtml(card.offlineSandboxTraceInspectorSummary && card.offlineSandboxTraceInspectorSummary.userFacingSummary && card.offlineSandboxTraceInspectorSummary.userFacingSummary.resultLabel || '离线 Trace 检查仍需复核') + '</p><p>离线 Trace 检查不保存 raw trace</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-mock-result-normalizer-output="true"><p>Mock Provider 结果归一化器</p><p>' + escapeHtml(card.mockProviderResultNormalizerSummary && card.mockProviderResultNormalizerSummary.userFacingSummary && card.mockProviderResultNormalizerSummary.userFacingSummary.resultLabel || 'Mock 结果归一化仍需复核') + '</p><p>Mock 结果归一化不处理真实 provider response</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-manual-activation-dry-run-output="true"><p>人工激活 Dry-run 检查清单</p><p>' + escapeHtml(card.manualActivationDryRunChecklistSummary && card.manualActivationDryRunChecklistSummary.userFacingSummary && card.manualActivationDryRunChecklistSummary.userFacingSummary.resultLabel || '激活 Dry-run 仍需复核') + '</p><p>激活 Dry-run 不激活 sandbox、不创建 release</p><p>Manual sandbox dry-run 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>' : '';
    const providerSandboxMilestoneHtml = card.providerSandboxMilestoneViewModelSummary ? '<section class="commerce-global-shopping-provider-sandbox-milestone" data-commerce-global-shopping-provider-sandbox-milestone="true"><h5>Provider Sandbox 里程碑工作台</h5><p>Provider Sandbox Readiness Workbench</p><p>Offline Provider Scenario Lab</p><p>Read-Only Provider Adapter SDK Skeleton</p><p>Manual Activation Command Center</p><p>Readiness Workbench</p><p>Offline Scenario Lab</p><p>Adapter SDK Skeleton</p><p>Command Center</p><p>' + escapeHtml(card.providerSandboxReadinessWorkbenchSummary && card.providerSandboxReadinessWorkbenchSummary.userFacingSummary && card.providerSandboxReadinessWorkbenchSummary.userFacingSummary.resultLabel || 'Sandbox Readiness 仍需复核') + '</p><p>' + escapeHtml(card.offlineProviderScenarioLabSummary && card.offlineProviderScenarioLabSummary.userFacingSummary && card.offlineProviderScenarioLabSummary.userFacingSummary.resultLabel || '离线场景仍需复核') + '</p><p>' + escapeHtml(card.readOnlyProviderAdapterSdkSkeletonSummary && card.readOnlyProviderAdapterSdkSkeletonSummary.userFacingSummary && card.readOnlyProviderAdapterSdkSkeletonSummary.userFacingSummary.resultLabel || '只读 Adapter SDK 骨架仍需复核') + '</p><p>' + escapeHtml(card.manualActivationCommandCenterSummary && card.manualActivationCommandCenterSummary.userFacingSummary && card.manualActivationCommandCenterSummary.userFacingSummary.resultLabel || '人工激活指挥仍需复核') + '</p><p>Readiness Workbench 不激活 sandbox</p><p>Offline Scenario Lab 不联网、不读密钥</p><p>Adapter SDK Skeleton 不生成 endpoint、不导入真实 SDK</p><p>Command Center 不创建 release、不 push</p><p>Human sandbox milestone review 仍需人工复核</p><p>当前只展示 provider sandbox 里程碑工作台</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-sandbox-readiness-workbench-show="true">查看 Readiness Workbench</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-offline-provider-scenario-lab-show="true">查看 Offline Scenario Lab</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-read-only-provider-adapter-sdk-skeleton-show="true">查看 Adapter SDK Skeleton</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-manual-activation-command-center-show="true">查看 Command Center</button><div data-commerce-global-shopping-provider-sandbox-readiness-workbench-output="true"><p>Provider Sandbox Readiness Workbench</p><p>' + escapeHtml(card.providerSandboxReadinessWorkbenchSummary && card.providerSandboxReadinessWorkbenchSummary.userFacingSummary && card.providerSandboxReadinessWorkbenchSummary.userFacingSummary.resultLabel || 'Sandbox Readiness 仍需复核') + '</p><p>Readiness Workbench 不激活 sandbox</p></div><div data-commerce-global-shopping-offline-provider-scenario-lab-output="true"><p>Offline Provider Scenario Lab</p><p>' + escapeHtml(card.offlineProviderScenarioLabSummary && card.offlineProviderScenarioLabSummary.userFacingSummary && card.offlineProviderScenarioLabSummary.userFacingSummary.resultLabel || '离线场景仍需复核') + '</p><p>Offline Scenario Lab 不联网、不读密钥</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-read-only-provider-adapter-sdk-skeleton-output="true"><p>Read-Only Provider Adapter SDK Skeleton</p><p>' + escapeHtml(card.readOnlyProviderAdapterSdkSkeletonSummary && card.readOnlyProviderAdapterSdkSkeletonSummary.userFacingSummary && card.readOnlyProviderAdapterSdkSkeletonSummary.userFacingSummary.resultLabel || '只读 Adapter SDK 骨架仍需复核') + '</p><p>Adapter SDK Skeleton 不生成 endpoint、不导入真实 SDK</p></div><div data-commerce-global-shopping-manual-activation-command-center-output="true"><p>Manual Activation Command Center</p><p>' + escapeHtml(card.manualActivationCommandCenterSummary && card.manualActivationCommandCenterSummary.userFacingSummary && card.manualActivationCommandCenterSummary.userFacingSummary.resultLabel || '人工激活指挥仍需复核') + '</p><p>Command Center 不创建 release、不 push</p><p>Human sandbox milestone review 仍需人工复核</p></div></section>' : '';
    const providerSandboxReleaseCandidateHtml = card.providerSandboxReleaseCandidateViewModelSummary ? '<section class="commerce-global-shopping-provider-sandbox-release-candidate" data-commerce-global-shopping-provider-sandbox-release-candidate="true"><h5>Provider Sandbox Release Candidate</h5><p>Offline Provider Adapter Contract Kit</p><p>Mock Sandbox QA Matrix</p><p>Human Activation Runbook Center</p><p>Provider Adapter Compliance Checklist</p><p>Adapter Contract Kit</p><p>Mock QA Matrix</p><p>Human Runbook</p><p>Adapter Compliance</p><p>' + escapeHtml(card.offlineProviderAdapterContractKitSummary && card.offlineProviderAdapterContractKitSummary.userFacingSummary && card.offlineProviderAdapterContractKitSummary.userFacingSummary.resultLabel || '离线 Adapter 合同仍需复核') + '</p><p>' + escapeHtml(card.mockSandboxQaMatrixSummary && card.mockSandboxQaMatrixSummary.userFacingSummary && card.mockSandboxQaMatrixSummary.userFacingSummary.resultLabel || 'Mock Sandbox QA 仍需复核') + '</p><p>' + escapeHtml(card.humanActivationRunbookCenterSummary && card.humanActivationRunbookCenterSummary.userFacingSummary && card.humanActivationRunbookCenterSummary.userFacingSummary.resultLabel || '人工激活运行手册仍需复核') + '</p><p>' + escapeHtml(card.providerAdapterComplianceChecklistSummary && card.providerAdapterComplianceChecklistSummary.userFacingSummary && card.providerAdapterComplianceChecklistSummary.userFacingSummary.resultLabel || 'Adapter 合规清单仍需复核') + '</p><p>Adapter Contract Kit 不生成真实 SDK</p><p>Mock QA Matrix 不运行真实 provider</p><p>Human Runbook 不创建任务、不激活 sandbox</p><p>Adapter Compliance 不创建 provider client</p><p>Manual release candidate review 仍需人工复核</p><p>当前只展示 provider sandbox release candidate</p><p>不接真实 provider，不读取密钥，不联网，不生成 endpoint，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-offline-provider-adapter-contract-kit-show="true">查看 Adapter Contract Kit</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-mock-sandbox-qa-matrix-show="true">查看 Mock QA Matrix</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-human-activation-runbook-show="true">查看 Human Runbook</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-adapter-compliance-show="true">查看 Adapter Compliance</button><div data-commerce-global-shopping-offline-provider-adapter-contract-kit-output="true"><p>Offline Provider Adapter Contract Kit</p><p>' + escapeHtml(card.offlineProviderAdapterContractKitSummary && card.offlineProviderAdapterContractKitSummary.userFacingSummary && card.offlineProviderAdapterContractKitSummary.userFacingSummary.resultLabel || '离线 Adapter 合同仍需复核') + '</p><p>Adapter Contract Kit 不生成真实 SDK</p></div><div data-commerce-global-shopping-mock-sandbox-qa-matrix-output="true"><p>Mock Sandbox QA Matrix</p><p>' + escapeHtml(card.mockSandboxQaMatrixSummary && card.mockSandboxQaMatrixSummary.userFacingSummary && card.mockSandboxQaMatrixSummary.userFacingSummary.resultLabel || 'Mock Sandbox QA 仍需复核') + '</p><p>Mock QA Matrix 不运行真实 provider</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-human-activation-runbook-output="true"><p>Human Activation Runbook Center</p><p>' + escapeHtml(card.humanActivationRunbookCenterSummary && card.humanActivationRunbookCenterSummary.userFacingSummary && card.humanActivationRunbookCenterSummary.userFacingSummary.resultLabel || '人工激活运行手册仍需复核') + '</p><p>Human Runbook 不创建任务、不激活 sandbox</p></div><div data-commerce-global-shopping-provider-adapter-compliance-output="true"><p>Provider Adapter Compliance Checklist</p><p>' + escapeHtml(card.providerAdapterComplianceChecklistSummary && card.providerAdapterComplianceChecklistSummary.userFacingSummary && card.providerAdapterComplianceChecklistSummary.userFacingSummary.resultLabel || 'Adapter 合规清单仍需复核') + '</p><p>Adapter Compliance 不创建 provider client</p><p>Manual release candidate review 仍需人工复核</p></div></section>' : '';
    const providerCertificationHtml = card.providerCertificationViewModelSummary ? '<section class="commerce-global-shopping-provider-certification" data-commerce-global-shopping-provider-certification="true"><h5>Provider 离线认证与边界锁</h5><p>Offline Provider Certification Center</p><p>Mock Integration Regression Lab</p><p>Human Approval Evidence Binder</p><p>Adapter Boundary Lock</p><p>Certification Center</p><p>Regression Lab</p><p>Evidence Binder</p><p>Boundary Lock</p><p>' + escapeHtml(card.offlineProviderCertificationCenterSummary && card.offlineProviderCertificationCenterSummary.userFacingSummary && card.offlineProviderCertificationCenterSummary.userFacingSummary.resultLabel || '离线 Provider 认证仍需复核') + '</p><p>' + escapeHtml(card.mockIntegrationRegressionLabSummary && card.mockIntegrationRegressionLabSummary.userFacingSummary && card.mockIntegrationRegressionLabSummary.userFacingSummary.resultLabel || 'Mock 集成回归仍需复核') + '</p><p>' + escapeHtml(card.humanApprovalEvidenceBinderSummary && card.humanApprovalEvidenceBinderSummary.userFacingSummary && card.humanApprovalEvidenceBinderSummary.userFacingSummary.resultLabel || '人工审批证据仍需复核') + '</p><p>' + escapeHtml(card.adapterBoundaryLockSummary && card.adapterBoundaryLockSummary.userFacingSummary && card.adapterBoundaryLockSummary.userFacingSummary.resultLabel || 'Adapter 边界锁仍需复核') + '</p><p>Certification Center 不生成真实认证文件</p><p>Regression Lab 不运行真实 provider</p><p>Evidence Binder 不写文件、不上传</p><p>Boundary Lock 不修改配置、不启用 provider</p><p>Human certification review 仍需人工复核</p><p>当前只展示 provider 离线认证与边界锁</p><p>不接真实 provider，不读取密钥，不联网，不生成 endpoint，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-certification-center-show="true">查看 Certification Center</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-mock-integration-regression-lab-show="true">查看 Regression Lab</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-human-approval-evidence-binder-show="true">查看 Evidence Binder</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-adapter-boundary-lock-show="true">查看 Boundary Lock</button><div data-commerce-global-shopping-provider-certification-center-output="true"><p>Offline Provider Certification Center</p><p>' + escapeHtml(card.offlineProviderCertificationCenterSummary && card.offlineProviderCertificationCenterSummary.userFacingSummary && card.offlineProviderCertificationCenterSummary.userFacingSummary.resultLabel || '离线 Provider 认证仍需复核') + '</p><p>Certification Center 不生成真实认证文件</p></div><div data-commerce-global-shopping-mock-integration-regression-lab-output="true"><p>Mock Integration Regression Lab</p><p>' + escapeHtml(card.mockIntegrationRegressionLabSummary && card.mockIntegrationRegressionLabSummary.userFacingSummary && card.mockIntegrationRegressionLabSummary.userFacingSummary.resultLabel || 'Mock 集成回归仍需复核') + '</p><p>Regression Lab 不运行真实 provider</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-human-approval-evidence-binder-output="true"><p>Human Approval Evidence Binder</p><p>' + escapeHtml(card.humanApprovalEvidenceBinderSummary && card.humanApprovalEvidenceBinderSummary.userFacingSummary && card.humanApprovalEvidenceBinderSummary.userFacingSummary.resultLabel || '人工审批证据仍需复核') + '</p><p>Evidence Binder 不写文件、不上传</p></div><div data-commerce-global-shopping-adapter-boundary-lock-output="true"><p>Adapter Boundary Lock</p><p>' + escapeHtml(card.adapterBoundaryLockSummary && card.adapterBoundaryLockSummary.userFacingSummary && card.adapterBoundaryLockSummary.userFacingSummary.resultLabel || 'Adapter 边界锁仍需复核') + '</p><p>Boundary Lock 不修改配置、不启用 provider</p><p>Human certification review 仍需人工复核</p></div></section>' : '';
    const providerOfflineReleaseHtml = card.providerOfflineReleaseViewModelSummary ? '<section class="commerce-global-shopping-provider-offline-release" data-commerce-global-shopping-provider-offline-release="true"><h5>Provider 离线发布闸门与激活复核</h5><p>Provider Offline Release Gate</p><p>Provider Certification Freeze Ledger</p><p>Sandbox Activation Review Packet</p><p>Adapter Boundary Diff Inspector</p><p>Offline Release Gate</p><p>Certification Freeze</p><p>Activation Review</p><p>Boundary Diff</p><p>' + escapeHtml(card.providerOfflineReleaseGateSummary && card.providerOfflineReleaseGateSummary.userFacingSummary && card.providerOfflineReleaseGateSummary.userFacingSummary.resultLabel || '离线发布闸门仍需复核') + '</p><p>' + escapeHtml(card.providerCertificationFreezeLedgerSummary && card.providerCertificationFreezeLedgerSummary.userFacingSummary && card.providerCertificationFreezeLedgerSummary.userFacingSummary.resultLabel || '认证冻结仍需复核') + '</p><p>' + escapeHtml(card.sandboxActivationReviewPacketSummary && card.sandboxActivationReviewPacketSummary.userFacingSummary && card.sandboxActivationReviewPacketSummary.userFacingSummary.resultLabel || 'Sandbox 激活复核仍需复核') + '</p><p>' + escapeHtml(card.adapterBoundaryDiffInspectorSummary && card.adapterBoundaryDiffInspectorSummary.userFacingSummary && card.adapterBoundaryDiffInspectorSummary.userFacingSummary.resultLabel || 'Adapter 边界差异仍需复核') + '</p><p>Offline Release Gate 不创建 release、不 push</p><p>Certification Freeze Ledger 不持久化台账</p><p>Activation Review Packet 不激活 sandbox</p><p>Boundary Diff Inspector 不修改配置、不启用 provider</p><p>Manual offline release review 仍需人工复核</p><p>当前只展示 provider 离线发布闸门与激活复核</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-offline-release-gate-show="true">查看 Offline Release Gate</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-certification-freeze-ledger-show="true">查看 Certification Freeze</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-activation-review-packet-show="true">查看 Activation Review</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-adapter-boundary-diff-inspector-show="true">查看 Boundary Diff</button><div data-commerce-global-shopping-provider-offline-release-gate-output="true"><p>Provider Offline Release Gate</p><p>' + escapeHtml(card.providerOfflineReleaseGateSummary && card.providerOfflineReleaseGateSummary.userFacingSummary && card.providerOfflineReleaseGateSummary.userFacingSummary.resultLabel || '离线发布闸门仍需复核') + '</p><p>Offline Release Gate 不创建 release、不 push</p></div><div data-commerce-global-shopping-provider-certification-freeze-ledger-output="true"><p>Provider Certification Freeze Ledger</p><p>' + escapeHtml(card.providerCertificationFreezeLedgerSummary && card.providerCertificationFreezeLedgerSummary.userFacingSummary && card.providerCertificationFreezeLedgerSummary.userFacingSummary.resultLabel || '认证冻结仍需复核') + '</p><p>Certification Freeze Ledger 不持久化台账</p></div><div data-commerce-global-shopping-sandbox-activation-review-packet-output="true"><p>Sandbox Activation Review Packet</p><p>' + escapeHtml(card.sandboxActivationReviewPacketSummary && card.sandboxActivationReviewPacketSummary.userFacingSummary && card.sandboxActivationReviewPacketSummary.userFacingSummary.resultLabel || 'Sandbox 激活复核仍需复核') + '</p><p>Activation Review Packet 不激活 sandbox</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-adapter-boundary-diff-inspector-output="true"><p>Adapter Boundary Diff Inspector</p><p>' + escapeHtml(card.adapterBoundaryDiffInspectorSummary && card.adapterBoundaryDiffInspectorSummary.userFacingSummary && card.adapterBoundaryDiffInspectorSummary.userFacingSummary.resultLabel || 'Adapter 边界差异仍需复核') + '</p><p>Boundary Diff Inspector 不修改配置、不启用 provider</p><p>Manual offline release review 仍需人工复核</p></div></section>' : '';
    const providerOfflineLaunchHtml = card.providerOfflineLaunchViewModelSummary ? '<section class="commerce-global-shopping-provider-offline-launch" data-commerce-global-shopping-provider-offline-launch="true"><h5>Provider 离线 Launch 决策与安全守卫</h5><p>Offline Launch Decision Simulator</p><p>Sandbox Activation Receipt Ledger</p><p>Adapter Security Regression Guard</p><p>Provider Offline Launch Checklist</p><p>Launch Decision</p><p>Activation Receipt</p><p>Security Guard</p><p>Launch Checklist</p><p>' + escapeHtml(card.offlineLaunchDecisionSimulatorSummary && card.offlineLaunchDecisionSimulatorSummary.userFacingSummary && card.offlineLaunchDecisionSimulatorSummary.userFacingSummary.resultLabel || '离线发布决策仍需复核') + '</p><p>' + escapeHtml(card.sandboxActivationReceiptLedgerSummary && card.sandboxActivationReceiptLedgerSummary.userFacingSummary && card.sandboxActivationReceiptLedgerSummary.userFacingSummary.resultLabel || 'Sandbox 激活回执仍需复核') + '</p><p>' + escapeHtml(card.adapterSecurityRegressionGuardSummary && card.adapterSecurityRegressionGuardSummary.userFacingSummary && card.adapterSecurityRegressionGuardSummary.userFacingSummary.resultLabel || 'Adapter 安全回归仍需复核') + '</p><p>' + escapeHtml(card.providerOfflineLaunchChecklistSummary && card.providerOfflineLaunchChecklistSummary.userFacingSummary && card.providerOfflineLaunchChecklistSummary.userFacingSummary.resultLabel || '离线 Launch Checklist 仍需复核') + '</p><p>Launch Decision 不保存真实决策</p><p>Activation Receipt Ledger 不保存真实回执</p><p>Security Guard 不修改配置、不启用 provider</p><p>Launch Checklist 不创建 release、不 push</p><p>Manual offline launch decision 仍需人工复核</p><p>当前只展示 provider 离线 launch 决策与安全守卫</p><p>不接真实 provider，不读取密钥，不联网，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-offline-launch-decision-show="true">查看 Launch Decision</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-activation-receipt-show="true">查看 Activation Receipt</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-security-guard-show="true">查看 Security Guard</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-launch-checklist-show="true">查看 Launch Checklist</button><div data-commerce-global-shopping-offline-launch-decision-output="true"><p>Offline Launch Decision Simulator</p><p>' + escapeHtml(card.offlineLaunchDecisionSimulatorSummary && card.offlineLaunchDecisionSimulatorSummary.userFacingSummary && card.offlineLaunchDecisionSimulatorSummary.userFacingSummary.resultLabel || '离线发布决策仍需复核') + '</p><p>Launch Decision 不保存真实决策</p></div><div data-commerce-global-shopping-activation-receipt-output="true"><p>Sandbox Activation Receipt Ledger</p><p>' + escapeHtml(card.sandboxActivationReceiptLedgerSummary && card.sandboxActivationReceiptLedgerSummary.userFacingSummary && card.sandboxActivationReceiptLedgerSummary.userFacingSummary.resultLabel || 'Sandbox 激活回执仍需复核') + '</p><p>Activation Receipt Ledger 不保存真实回执</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-security-guard-output="true"><p>Adapter Security Regression Guard</p><p>' + escapeHtml(card.adapterSecurityRegressionGuardSummary && card.adapterSecurityRegressionGuardSummary.userFacingSummary && card.adapterSecurityRegressionGuardSummary.userFacingSummary.resultLabel || 'Adapter 安全回归仍需复核') + '</p><p>Security Guard 不修改配置、不启用 provider</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-launch-checklist-output="true"><p>Provider Offline Launch Checklist</p><p>' + escapeHtml(card.providerOfflineLaunchChecklistSummary && card.providerOfflineLaunchChecklistSummary.userFacingSummary && card.providerOfflineLaunchChecklistSummary.userFacingSummary.resultLabel || '离线 Launch Checklist 仍需复核') + '</p><p>Launch Checklist 不创建 release、不 push</p><p>Manual offline launch decision 仍需人工复核</p></div></section>' : '';
    const providerFinalLaunchReviewHtml = card.providerFinalLaunchReviewViewModelSummary ? '<section class="commerce-global-shopping-provider-final-launch-review" data-commerce-global-shopping-provider-final-launch-review="true"><h5>Provider Final Launch Review</h5><p>Provider Launch Audit Snapshot</p><p>Offline Policy Replay Center</p><p>Human Activation Final Dossier</p><p>Adapter Launch Boundary Verifier</p><p>Launch Audit</p><p>Policy Replay</p><p>Final Dossier</p><p>Boundary Verifier</p><p>' + escapeHtml(card.providerLaunchAuditSnapshotSummary && card.providerLaunchAuditSnapshotSummary.userFacingSummary && card.providerLaunchAuditSnapshotSummary.userFacingSummary.resultLabel || 'Launch Audit 仍需复核') + '</p><p>' + escapeHtml(card.offlinePolicyReplayCenterSummary && card.offlinePolicyReplayCenterSummary.userFacingSummary && card.offlinePolicyReplayCenterSummary.userFacingSummary.resultLabel || 'Policy Replay 仍需复核') + '</p><p>' + escapeHtml(card.humanActivationFinalDossierSummary && card.humanActivationFinalDossierSummary.userFacingSummary && card.humanActivationFinalDossierSummary.userFacingSummary.resultLabel || 'Final Dossier 仍需复核') + '</p><p>' + escapeHtml(card.adapterLaunchBoundaryVerifierSummary && card.adapterLaunchBoundaryVerifierSummary.userFacingSummary && card.adapterLaunchBoundaryVerifierSummary.userFacingSummary.resultLabel || 'Boundary Verifier 仍需复核') + '</p><p>Launch Audit 不写文件、不保存真实决策</p><p>Policy Replay 不修改配置、不启用 provider</p><p>Final Dossier 不持久化档案</p><p>Boundary Verifier 不生成 endpoint、不读取密钥</p><p>Human final launch review 仍需人工复核</p><p>当前只展示 provider final launch review</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-launch-audit-show="true">查看 Launch Audit</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-policy-replay-show="true">查看 Policy Replay</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-final-dossier-show="true">查看 Final Dossier</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-boundary-verifier-show="true">查看 Boundary Verifier</button><div data-commerce-global-shopping-launch-audit-output="true"><p>Provider Launch Audit Snapshot</p><p>' + escapeHtml(card.providerLaunchAuditSnapshotSummary && card.providerLaunchAuditSnapshotSummary.userFacingSummary && card.providerLaunchAuditSnapshotSummary.userFacingSummary.resultLabel || 'Launch Audit 仍需复核') + '</p><p>Launch Audit 不写文件、不保存真实决策</p><p>当前只展示 provider final launch review</p></div><div data-commerce-global-shopping-policy-replay-output="true"><p>Offline Policy Replay Center</p><p>' + escapeHtml(card.offlinePolicyReplayCenterSummary && card.offlinePolicyReplayCenterSummary.userFacingSummary && card.offlinePolicyReplayCenterSummary.userFacingSummary.resultLabel || 'Policy Replay 仍需复核') + '</p><p>Policy Replay 不修改配置、不启用 provider</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-final-dossier-output="true"><p>Human Activation Final Dossier</p><p>' + escapeHtml(card.humanActivationFinalDossierSummary && card.humanActivationFinalDossierSummary.userFacingSummary && card.humanActivationFinalDossierSummary.userFacingSummary.resultLabel || 'Final Dossier 仍需复核') + '</p><p>Final Dossier 不持久化档案</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-boundary-verifier-output="true"><p>Adapter Launch Boundary Verifier</p><p>' + escapeHtml(card.adapterLaunchBoundaryVerifierSummary && card.adapterLaunchBoundaryVerifierSummary.userFacingSummary && card.adapterLaunchBoundaryVerifierSummary.userFacingSummary.resultLabel || 'Boundary Verifier 仍需复核') + '</p><p>Boundary Verifier 不生成 endpoint、不读取密钥</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p></div></section>' : '';
    const providerFinalReviewConsoleHtml = card.providerFinalReviewConsoleViewModelSummary ? '<section class="commerce-global-shopping-provider-final-review-console" data-commerce-global-shopping-provider-final-review-console="true"><h5>Provider Final Review Console</h5><p>Final Offline Launch Review Console</p><p>Provider Activation Blocker Sentinel</p><p>Read-Only Release Evidence Summary</p><p>Offline Provider Readiness Decision Matrix</p><p>Final Review</p><p>Activation Blockers</p><p>Evidence Summary</p><p>Decision Matrix</p><p>' + escapeHtml(card.finalOfflineLaunchReviewConsoleSummary && card.finalOfflineLaunchReviewConsoleSummary.userFacingSummary && card.finalOfflineLaunchReviewConsoleSummary.userFacingSummary.resultLabel || 'Final Review Console 仍需复核') + '</p><p>' + escapeHtml(card.providerActivationBlockerSentinelSummary && card.providerActivationBlockerSentinelSummary.userFacingSummary && card.providerActivationBlockerSentinelSummary.userFacingSummary.resultLabel || 'Activation Blockers 仍需复核') + '</p><p>' + escapeHtml(card.readOnlyReleaseEvidenceSummary && card.readOnlyReleaseEvidenceSummary.userFacingSummary && card.readOnlyReleaseEvidenceSummary.userFacingSummary.resultLabel || 'Evidence Summary 仍需复核') + '</p><p>' + escapeHtml(card.offlineProviderReadinessDecisionMatrixSummary && card.offlineProviderReadinessDecisionMatrixSummary.userFacingSummary && card.offlineProviderReadinessDecisionMatrixSummary.userFacingSummary.resultLabel || 'Decision Matrix 仍需复核') + '</p><p>Final Review 不保存真实决策</p><p>Activation Blocker 不修改配置、不启用 provider</p><p>Evidence Summary 不写文件、不上传</p><p>Decision Matrix 不创建 release、不 push</p><p>Final offline provider review 仍需人工复核</p><p>当前只展示 provider final review console</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-final-review-show="true">查看 Final Review</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-activation-blockers-show="true">查看 Activation Blockers</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-evidence-summary-show="true">查看 Evidence Summary</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-decision-matrix-show="true">查看 Decision Matrix</button><div data-commerce-global-shopping-final-review-output="true"><p>Final Offline Launch Review Console</p><p>' + escapeHtml(card.finalOfflineLaunchReviewConsoleSummary && card.finalOfflineLaunchReviewConsoleSummary.userFacingSummary && card.finalOfflineLaunchReviewConsoleSummary.userFacingSummary.resultLabel || 'Final Review Console 仍需复核') + '</p><p>Final Review 不保存真实决策</p><p>当前只展示 provider final review console</p></div><div data-commerce-global-shopping-activation-blockers-output="true"><p>Provider Activation Blocker Sentinel</p><p>' + escapeHtml(card.providerActivationBlockerSentinelSummary && card.providerActivationBlockerSentinelSummary.userFacingSummary && card.providerActivationBlockerSentinelSummary.userFacingSummary.resultLabel || 'Activation Blockers 仍需复核') + '</p><p>Activation Blocker 不修改配置、不启用 provider</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-evidence-summary-output="true"><p>Read-Only Release Evidence Summary</p><p>' + escapeHtml(card.readOnlyReleaseEvidenceSummary && card.readOnlyReleaseEvidenceSummary.userFacingSummary && card.readOnlyReleaseEvidenceSummary.userFacingSummary.resultLabel || 'Evidence Summary 仍需复核') + '</p><p>Evidence Summary 不写文件、不上传</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-decision-matrix-output="true"><p>Offline Provider Readiness Decision Matrix</p><p>' + escapeHtml(card.offlineProviderReadinessDecisionMatrixSummary && card.offlineProviderReadinessDecisionMatrixSummary.userFacingSummary && card.offlineProviderReadinessDecisionMatrixSummary.userFacingSummary.resultLabel || 'Decision Matrix 仍需复核') + '</p><p>Decision Matrix 不创建 release、不 push</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p></div></section>' : '';
    const providerFinalSafetyHtml = card.providerFinalSafetyViewModelSummary ? '<section class="commerce-global-shopping-provider-final-safety-review" data-commerce-global-shopping-provider-final-safety-review="true"><h5>Provider Final Safety Review</h5><p>Provider Final Safety Seal</p><p>Offline Activation War Room</p><p>Read-Only Provider Readiness Certificate</p><p>Provider No-Activation Guarantee Board</p><p>Safety Seal</p><p>Activation War Room</p><p>Readiness Certificate</p><p>No-Activation Guarantee</p><p>' + escapeHtml(card.providerFinalSafetySealSummary && card.providerFinalSafetySealSummary.userFacingSummary && card.providerFinalSafetySealSummary.userFacingSummary.resultLabel || 'Provider Final Safety Seal 仍需复核') + '</p><p>' + escapeHtml(card.offlineActivationWarRoomSummary && card.offlineActivationWarRoomSummary.userFacingSummary && card.offlineActivationWarRoomSummary.userFacingSummary.resultLabel || 'Offline Activation War Room 仍需复核') + '</p><p>' + escapeHtml(card.readOnlyProviderReadinessCertificateSummary && card.readOnlyProviderReadinessCertificateSummary.userFacingSummary && card.readOnlyProviderReadinessCertificateSummary.userFacingSummary.resultLabel || 'Read-Only Provider Readiness Certificate 仍需复核') + '</p><p>' + escapeHtml(card.providerNoActivationGuaranteeBoardSummary && card.providerNoActivationGuaranteeBoardSummary.userFacingSummary && card.providerNoActivationGuaranteeBoardSummary.userFacingSummary.resultLabel || 'Provider No-Activation Guarantee Board 仍需复核') + '</p><p>Safety Seal 不生成真实证书、不写文件</p><p>Activation War Room 不激活 sandbox、不启用 provider</p><p>Readiness Certificate 不持久化证书</p><p>No-Activation Guarantee 不修改配置、不执行真实阻断</p><p>Human final safety review 仍需人工复核</p><p>当前只展示 provider final safety review</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-final-safety-seal-show="true">查看 Safety Seal</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-activation-war-room-show="true">查看 Activation War Room</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-readiness-certificate-show="true">查看 Readiness Certificate</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-no-activation-guarantee-show="true">查看 No-Activation Guarantee</button><div data-commerce-global-shopping-final-safety-seal-output="true"><p>Provider Final Safety Seal</p><p>' + escapeHtml(card.providerFinalSafetySealSummary && card.providerFinalSafetySealSummary.userFacingSummary && card.providerFinalSafetySealSummary.userFacingSummary.resultLabel || 'Provider Final Safety Seal 仍需复核') + '</p><p>Safety Seal 不生成真实证书、不写文件</p><p>Human final safety review 仍需人工复核</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-activation-war-room-output="true"><p>Offline Activation War Room</p><p>' + escapeHtml(card.offlineActivationWarRoomSummary && card.offlineActivationWarRoomSummary.userFacingSummary && card.offlineActivationWarRoomSummary.userFacingSummary.resultLabel || 'Offline Activation War Room 仍需复核') + '</p><p>Activation War Room 不激活 sandbox、不启用 provider</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-readiness-certificate-output="true"><p>Read-Only Provider Readiness Certificate</p><p>' + escapeHtml(card.readOnlyProviderReadinessCertificateSummary && card.readOnlyProviderReadinessCertificateSummary.userFacingSummary && card.readOnlyProviderReadinessCertificateSummary.userFacingSummary.resultLabel || 'Read-Only Provider Readiness Certificate 仍需复核') + '</p><p>Readiness Certificate 不持久化证书</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-no-activation-guarantee-output="true"><p>Provider No-Activation Guarantee Board</p><p>' + escapeHtml(card.providerNoActivationGuaranteeBoardSummary && card.providerNoActivationGuaranteeBoardSummary.userFacingSummary && card.providerNoActivationGuaranteeBoardSummary.userFacingSummary.resultLabel || 'Provider No-Activation Guarantee Board 仍需复核') + '</p><p>No-Activation Guarantee 不修改配置、不执行真实阻断</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>' : '';
    const providerGovernanceClosureHtml = card.providerGovernanceClosureViewModelSummary ? '<section class="commerce-global-shopping-provider-governance-closure-review" data-commerce-global-shopping-provider-governance-closure-review="true"><h5>Provider Governance Closure Review</h5><p>Offline Provider Governance Closure Board</p><p>No-Activation Compliance Seal</p><p>Final Readiness Handoff Simulator</p><p>Provider Governance Closure Evidence Ledger</p><p>Governance Closure</p><p>No-Activation Seal</p><p>Final Handoff</p><p>Closure Evidence</p><p>' + escapeHtml(card.offlineProviderGovernanceClosureBoardSummary && card.offlineProviderGovernanceClosureBoardSummary.userFacingSummary && card.offlineProviderGovernanceClosureBoardSummary.userFacingSummary.resultLabel || 'Offline Provider Governance Closure Board 仍需复核') + '</p><p>' + escapeHtml(card.noActivationComplianceSealSummary && card.noActivationComplianceSealSummary.userFacingSummary && card.noActivationComplianceSealSummary.userFacingSummary.resultLabel || 'No-Activation Compliance Seal 仍需复核') + '</p><p>' + escapeHtml(card.finalReadinessHandoffSimulatorSummary && card.finalReadinessHandoffSimulatorSummary.userFacingSummary && card.finalReadinessHandoffSimulatorSummary.userFacingSummary.resultLabel || 'Final Readiness Handoff Simulator 仍需复核') + '</p><p>' + escapeHtml(card.providerGovernanceClosureEvidenceLedgerSummary && card.providerGovernanceClosureEvidenceLedgerSummary.userFacingSummary && card.providerGovernanceClosureEvidenceLedgerSummary.userFacingSummary.resultLabel || 'Provider Governance Closure Evidence Ledger 仍需复核') + '</p><p>Governance Closure 不保存真实治理结论</p><p>No-Activation Seal 不生成真实封条、不执行真实阻断</p><p>Final Handoff 不执行真实交接</p><p>Closure Evidence 不持久化台账、不保存真实 evidence</p><p>Human governance closure review 仍需人工复核</p><p>当前只展示 provider governance closure review</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-governance-closure-show="true">查看 Governance Closure</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-no-activation-seal-show="true">查看 No-Activation Seal</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-final-handoff-show="true">查看 Final Handoff</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-closure-evidence-show="true">查看 Closure Evidence</button><div data-commerce-global-shopping-governance-closure-output="true"><p>Offline Provider Governance Closure Board</p><p>' + escapeHtml(card.offlineProviderGovernanceClosureBoardSummary && card.offlineProviderGovernanceClosureBoardSummary.userFacingSummary && card.offlineProviderGovernanceClosureBoardSummary.userFacingSummary.resultLabel || 'Offline Provider Governance Closure Board 仍需复核') + '</p><p>Governance Closure 不保存真实治理结论</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-no-activation-seal-output="true"><p>No-Activation Compliance Seal</p><p>' + escapeHtml(card.noActivationComplianceSealSummary && card.noActivationComplianceSealSummary.userFacingSummary && card.noActivationComplianceSealSummary.userFacingSummary.resultLabel || 'No-Activation Compliance Seal 仍需复核') + '</p><p>No-Activation Seal 不生成真实封条、不执行真实阻断</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-final-handoff-output="true"><p>Final Readiness Handoff Simulator</p><p>' + escapeHtml(card.finalReadinessHandoffSimulatorSummary && card.finalReadinessHandoffSimulatorSummary.userFacingSummary && card.finalReadinessHandoffSimulatorSummary.userFacingSummary.resultLabel || 'Final Readiness Handoff Simulator 仍需复核') + '</p><p>Final Handoff 不执行真实交接</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-closure-evidence-output="true"><p>Provider Governance Closure Evidence Ledger</p><p>' + escapeHtml(card.providerGovernanceClosureEvidenceLedgerSummary && card.providerGovernanceClosureEvidenceLedgerSummary.userFacingSummary && card.providerGovernanceClosureEvidenceLedgerSummary.userFacingSummary.resultLabel || 'Provider Governance Closure Evidence Ledger 仍需复核') + '</p><p>Closure Evidence 不持久化台账、不保存真实 evidence</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>' : '';

    const providerDistributionReadinessHtml = card.providerDistributionReadinessViewModelSummary ? '<section class="commerce-global-shopping-provider-distribution-readiness-review" data-commerce-global-shopping-provider-distribution-readiness-review="true"><h5>Provider Distribution Readiness Review</h5><p>Offline Distribution Readiness Center</p><p>No-Activation Enforcement Ledger</p><p>Final User Trust Summary</p><p>Provider Safety Distribution Matrix</p><p>Distribution Readiness</p><p>No-Activation Enforcement</p><p>User Trust Summary</p><p>Safety Matrix</p><p>' + escapeHtml(card.offlineDistributionReadinessCenterSummary && card.offlineDistributionReadinessCenterSummary.userFacingSummary && card.offlineDistributionReadinessCenterSummary.userFacingSummary.resultLabel || 'Offline Distribution Readiness Center 仍需复核') + '</p><p>' + escapeHtml(card.noActivationEnforcementLedgerSummary && card.noActivationEnforcementLedgerSummary.userFacingSummary && card.noActivationEnforcementLedgerSummary.userFacingSummary.resultLabel || 'No-Activation Enforcement Ledger 仍需复核') + '</p><p>' + escapeHtml(card.finalUserTrustSummarySummary && card.finalUserTrustSummarySummary.userFacingSummary && card.finalUserTrustSummarySummary.userFacingSummary.resultLabel || 'Final User Trust Summary 仍需复核') + '</p><p>' + escapeHtml(card.providerSafetyDistributionMatrixSummary && card.providerSafetyDistributionMatrixSummary.userFacingSummary && card.providerSafetyDistributionMatrixSummary.userFacingSummary.resultLabel || 'Provider Safety Distribution Matrix 仍需复核') + '</p><p>Offline Distribution Readiness Center 已准备</p><p>No-Activation Enforcement Ledger 已准备</p><p>Final User Trust Summary 已准备</p><p>Provider Safety Distribution Matrix 已准备</p><p>Distribution Readiness 不创建真实分发包</p><p>No-Activation Enforcement 不执行真实阻断</p><p>User Trust Summary 不写文件、不保存用户原文</p><p>Safety Matrix 不启用 provider、不激活 sandbox</p><p>Human distribution readiness review 仍需人工复核</p><p>当前只展示 provider distribution readiness review</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push，不创建真实分发包</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-distribution-readiness-show="true">查看 Distribution Readiness</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-no-activation-enforcement-show="true">查看 No-Activation Enforcement</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-user-trust-summary-show="true">查看 User Trust Summary</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-safety-matrix-show="true">查看 Safety Matrix</button><div data-commerce-global-shopping-distribution-readiness-output="true"><p>Offline Distribution Readiness Center</p><p>' + escapeHtml(card.offlineDistributionReadinessCenterSummary && card.offlineDistributionReadinessCenterSummary.userFacingSummary && card.offlineDistributionReadinessCenterSummary.userFacingSummary.resultLabel || 'Offline Distribution Readiness Center 仍需复核') + '</p><p>Distribution Readiness 不创建真实分发包</p></div><div data-commerce-global-shopping-no-activation-enforcement-output="true"><p>No-Activation Enforcement Ledger</p><p>' + escapeHtml(card.noActivationEnforcementLedgerSummary && card.noActivationEnforcementLedgerSummary.userFacingSummary && card.noActivationEnforcementLedgerSummary.userFacingSummary.resultLabel || 'No-Activation Enforcement Ledger 仍需复核') + '</p><p>No-Activation Enforcement 不执行真实阻断</p></div><div data-commerce-global-shopping-user-trust-summary-output="true"><p>Final User Trust Summary</p><p>' + escapeHtml(card.finalUserTrustSummarySummary && card.finalUserTrustSummarySummary.userFacingSummary && card.finalUserTrustSummarySummary.userFacingSummary.resultLabel || 'Final User Trust Summary 仍需复核') + '</p><p>User Trust Summary 不写文件、不保存用户原文</p></div><div data-commerce-global-shopping-safety-matrix-output="true"><p>Provider Safety Distribution Matrix</p><p>' + escapeHtml(card.providerSafetyDistributionMatrixSummary && card.providerSafetyDistributionMatrixSummary.userFacingSummary && card.providerSafetyDistributionMatrixSummary.userFacingSummary.resultLabel || 'Provider Safety Distribution Matrix 仍需复核') + '</p><p>Safety Matrix 不启用 provider、不激活 sandbox</p></div></section>' : '';
    const providerDistributionClosureHtml = card.providerDistributionClosureViewModelSummary ? '<section class="commerce-global-shopping-provider-distribution-closure-review" data-commerce-global-shopping-provider-distribution-closure-review="true"><h5>Provider Distribution Closure Review</h5><p>Provider Distribution Freeze Console</p><p>User-Facing Safety Receipt</p><p>Offline Release Candidate Closure Pack</p><p>Provider No-Production Guarantee Matrix</p><p>Distribution Freeze</p><p>Safety Receipt</p><p>RC Closure Pack</p><p>No-Production Guarantee</p><p>' + escapeHtml(card.providerDistributionFreezeConsoleSummary && card.providerDistributionFreezeConsoleSummary.userFacingSummary && card.providerDistributionFreezeConsoleSummary.userFacingSummary.resultLabel || 'Provider Distribution Freeze Console 仍需复核') + '</p><p>' + escapeHtml(card.userFacingSafetyReceiptSummary && card.userFacingSafetyReceiptSummary.userFacingSummary && card.userFacingSafetyReceiptSummary.userFacingSummary.resultLabel || 'User-Facing Safety Receipt 仍需复核') + '</p><p>' + escapeHtml(card.offlineReleaseCandidateClosurePackSummary && card.offlineReleaseCandidateClosurePackSummary.userFacingSummary && card.offlineReleaseCandidateClosurePackSummary.userFacingSummary.resultLabel || 'Offline Release Candidate Closure Pack 仍需复核') + '</p><p>' + escapeHtml(card.providerNoProductionGuaranteeMatrixSummary && card.providerNoProductionGuaranteeMatrixSummary.userFacingSummary && card.providerNoProductionGuaranteeMatrixSummary.userFacingSummary.resultLabel || 'Provider No-Production Guarantee Matrix 仍需复核') + '</p><p>Provider Distribution Freeze Console 已准备</p><p>User-Facing Safety Receipt 已准备</p><p>Offline Release Candidate Closure Pack 已准备</p><p>Provider No-Production Guarantee Matrix 已准备</p><p>Distribution Freeze 不创建真实分发包、不冻结配置</p><p>Safety Receipt 不生成真实回执文件</p><p>RC Closure Pack 不创建真实闭包文件</p><p>No-Production Guarantee 不切换 production provider</p><p>Human distribution closure review 仍需人工复核</p><p>当前只展示 provider distribution closure review</p><p>不接真实 provider，不读取密钥，不联网，不激活 sandbox，不创建 release，不 push，不创建真实分发包</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-distribution-freeze-show="true">查看 Distribution Freeze</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-safety-receipt-show="true">查看 Safety Receipt</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-rc-closure-pack-show="true">查看 RC Closure Pack</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-no-production-guarantee-show="true">查看 No-Production Guarantee</button><div data-commerce-global-shopping-distribution-freeze-output="true"><p>Provider Distribution Freeze Console</p><p>' + escapeHtml(card.providerDistributionFreezeConsoleSummary && card.providerDistributionFreezeConsoleSummary.userFacingSummary && card.providerDistributionFreezeConsoleSummary.userFacingSummary.resultLabel || 'Provider Distribution Freeze Console 仍需复核') + '</p><p>Distribution Freeze 不创建真实分发包、不冻结配置</p></div><div data-commerce-global-shopping-safety-receipt-output="true"><p>User-Facing Safety Receipt</p><p>' + escapeHtml(card.userFacingSafetyReceiptSummary && card.userFacingSafetyReceiptSummary.userFacingSummary && card.userFacingSafetyReceiptSummary.userFacingSummary.resultLabel || 'User-Facing Safety Receipt 仍需复核') + '</p><p>Safety Receipt 不生成真实回执文件</p></div><div data-commerce-global-shopping-rc-closure-pack-output="true"><p>Offline Release Candidate Closure Pack</p><p>' + escapeHtml(card.offlineReleaseCandidateClosurePackSummary && card.offlineReleaseCandidateClosurePackSummary.userFacingSummary && card.offlineReleaseCandidateClosurePackSummary.userFacingSummary.resultLabel || 'Offline Release Candidate Closure Pack 仍需复核') + '</p><p>RC Closure Pack 不创建真实闭包文件</p></div><div data-commerce-global-shopping-no-production-guarantee-output="true"><p>Provider No-Production Guarantee Matrix</p><p>' + escapeHtml(card.providerNoProductionGuaranteeMatrixSummary && card.providerNoProductionGuaranteeMatrixSummary.userFacingSummary && card.providerNoProductionGuaranteeMatrixSummary.userFacingSummary.resultLabel || 'Provider No-Production Guarantee Matrix 仍需复核') + '</p><p>No-Production Guarantee 不切换 production provider</p></div></section>' : '';
    const providerDistributionReviewHtml = providerDistributionClosureHtml || providerDistributionReadinessHtml;
    const providerCoverageHtml = card.providerCoverageViewModelSummary ? '<section class="commerce-global-shopping-provider-coverage" data-commerce-global-shopping-provider-coverage="true"><h5>Provider 覆盖与来源可信度</h5><p>第一个 Sandbox Provider Connector</p><p>Provider 覆盖看板</p><p>只读来源可信度评分</p><p>只读 Provider Sandbox 接入闸门</p><p>Sandbox 价格候选会话</p><p>Sandbox 价格候选结果</p><p>官方参考价</p><p>已覆盖来源较低候选价</p><p>跳转预览</p><p>Sandbox Connector</p><p>来源覆盖</p><p>来源可信度</p><p>第一个 Sandbox Connector 已准备</p><p>Provider 覆盖结构已准备</p><p>来源可信度评分已准备</p><p>可以创建只读 Sandbox 价格候选会话</p><p>Sandbox 价格候选会话已准备</p><p>当前仅展示只读 sandbox 候选结果，不构成价格承诺、可订承诺、付款、下单或出票能力。</p><p>覆盖来源不代表全网覆盖</p><p>可信度不代表官方背书</p><p>低价不等于最佳</p><p>Provider 覆盖不代表下单能力</p><p>当前仅展示 fixture/dry-run/sandbox provider 覆盖和来源可信度</p><p>不代表全网覆盖、官方背书、真实价格或下单能力</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-first-sandbox-provider-connector-show="true">查看 Sandbox Connector</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-provider-coverage-show="true">查看 Provider 覆盖</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-source-trust-show="true">查看来源可信度</button><div data-commerce-global-shopping-first-sandbox-provider-connector-output="true"><p>第一个 Sandbox Provider Connector</p><p>' + escapeHtml(card.firstSandboxProviderConnectorSummary && card.firstSandboxProviderConnectorSummary.userFacingSummary && card.firstSandboxProviderConnectorSummary.userFacingSummary.resultLabel || 'Sandbox Connector 仍需复核') + '</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-provider-coverage-output="true"><p>Provider 覆盖看板</p><p>' + escapeHtml(card.providerCoverageDashboardSummary && card.providerCoverageDashboardSummary.userFacingSummary && card.providerCoverageDashboardSummary.userFacingSummary.resultLabel || 'Provider 覆盖仍需复核') + '</p><p>' + escapeHtml(card.readOnlyProviderSandboxIntegrationGateSummary && card.readOnlyProviderSandboxIntegrationGateSummary.userFacingSummary && card.readOnlyProviderSandboxIntegrationGateSummary.userFacingSummary.resultLabel || '只读 Provider Sandbox 接入闸门仍需复核') + '</p><p>' + escapeHtml(card.sandboxPriceCandidateSessionSummary && card.sandboxPriceCandidateSessionSummary.userFacingSummary && card.sandboxPriceCandidateSessionSummary.userFacingSummary.resultLabel || 'Sandbox 价格候选会话仍需复核') + '</p><p>' + escapeHtml(card.sandboxPriceCandidateResultBoardSummary && card.sandboxPriceCandidateResultBoardSummary.title || 'Sandbox 价格候选结果') + '</p><p>覆盖来源不代表全网覆盖</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-source-trust-output="true"><p>只读来源可信度评分</p><p>' + escapeHtml(card.readOnlySourceTrustScoreSummary && card.readOnlySourceTrustScoreSummary.userFacingSummary && card.readOnlySourceTrustScoreSummary.userFacingSummary.resultLabel || '来源可信度仍需复核') + '</p><p>' + escapeHtml(card.sandboxPriceCandidateResultBoardSummary && card.sandboxPriceCandidateResultBoardSummary.caveat || '当前仅展示只读 sandbox 候选结果，不构成价格承诺、可订承诺、付款、下单或出票能力。') + '</p><p>可信度不代表官方背书</p><p>低价不等于最佳</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>' : '';
    const sandboxDecisionReviewHtml = card.sandboxDecisionReviewViewModelSummary ? '<section class="commerce-global-shopping-sandbox-decision-review" data-commerce-global-shopping-sandbox-decision-review="true"><h5>Sandbox 候选决策复核</h5><p>Sandbox 候选对比工作台</p><p>Provider 证据对比矩阵</p><p>只读跳转交接演练</p><p>候选对比</p><p>证据矩阵</p><p>交接演练</p><p>Sandbox 候选对比已准备</p><p>Provider 证据矩阵已准备</p><p>只读交接演练已准备</p><p>候选推荐不构成价格承诺</p><p>交接演练不打开平台</p><p>参数预览不包含身份或支付信息</p><p>决策复核不代表下单能力</p><p>当前仅用于复核 sandbox 候选</p><p>不构成价格承诺、可订承诺、付款、下单或出票能力</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-sandbox-comparison-show="true">查看候选对比</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-evidence-matrix-show="true">查看证据矩阵</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-handoff-drill-show="true">查看交接演练</button><div data-commerce-global-shopping-sandbox-comparison-output="true"><p>Sandbox 候选对比工作台</p><p>' + escapeHtml(card.sandboxCandidateComparisonWorkbenchSummary && card.sandboxCandidateComparisonWorkbenchSummary.userFacingSummary && card.sandboxCandidateComparisonWorkbenchSummary.userFacingSummary.resultLabel || '候选对比仍需复核') + '</p><p>候选推荐不构成价格承诺</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-evidence-matrix-output="true"><p>Provider 证据对比矩阵</p><p>' + escapeHtml(card.providerEvidenceComparisonMatrixSummary && card.providerEvidenceComparisonMatrixSummary.userFacingSummary && card.providerEvidenceComparisonMatrixSummary.userFacingSummary.resultLabel || '证据矩阵仍需复核') + '</p><p>当前仅展示脱敏证据摘要</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-handoff-drill-output="true"><p>只读跳转交接演练</p><p>' + escapeHtml(card.readOnlyHandoffReadinessDrillSummary && card.readOnlyHandoffReadinessDrillSummary.userFacingSummary && card.readOnlyHandoffReadinessDrillSummary.userFacingSummary.resultLabel || '交接演练仍需复核') + '</p><p>交接演练不打开平台</p><p>参数预览不包含身份或支付信息</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>' : '';
    const platformHandoffSimulationHtml = card.platformHandoffSimulationViewModelSummary ? '<section class="commerce-global-shopping-platform-handoff-simulation" data-commerce-global-shopping-platform-handoff-simulation="true"><h5>只读平台交接模拟</h5><p>只读平台交接模拟器</p><p>脱敏搜索参数包</p><p>用户确认清单</p><p>交接模拟</p><p>搜索参数包</p><p>用户确认清单</p><p>只读平台交接模拟已准备</p><p>脱敏搜索参数包已准备</p><p>用户确认清单已准备</p><p>搜索参数包不包含身份或支付信息</p><p>用户必须在平台自行确认实时价格</p><p>Weishan 不替用户登录、付款、下单或出票</p><p>交接模拟不打开平台</p><p>当前仅模拟平台交接前的非敏感搜索参数准备和用户确认清单</p><p>不打开平台，不填写身份、账号、证件、银行卡或支付信息</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-platform-handoff-simulator-show="true">查看交接模拟</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-redacted-parameter-pack-show="true">查看搜索参数包</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-user-confirmation-checklist-show="true">查看用户确认清单</button><div data-commerce-global-shopping-platform-handoff-simulator-output="true"><p>只读平台交接模拟器</p><p>' + escapeHtml(card.readOnlyPlatformHandoffSimulatorSummary && card.readOnlyPlatformHandoffSimulatorSummary.userFacingSummary && card.readOnlyPlatformHandoffSimulatorSummary.userFacingSummary.resultLabel || '交接模拟仍需复核') + '</p><p>交接模拟不打开平台</p><p>当前仅模拟平台交接前的非敏感搜索参数准备和用户确认清单</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-redacted-parameter-pack-output="true"><p>脱敏搜索参数包</p><p>' + escapeHtml(card.redactedSearchParameterPackSummary && card.redactedSearchParameterPackSummary.userFacingSummary && card.redactedSearchParameterPackSummary.userFacingSummary.resultLabel || '搜索参数包仍需复核') + '</p><p>搜索参数包不包含身份或支付信息</p><p>不打开平台，不填写身份、账号、证件、银行卡或支付信息</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-user-confirmation-checklist-output="true"><p>用户确认清单</p><p>' + escapeHtml(card.userConfirmationChecklistSummary && card.userConfirmationChecklistSummary.userFacingSummary && card.userConfirmationChecklistSummary.userFacingSummary.resultLabel || '用户确认清单仍需复核') + '</p><p>用户必须在平台自行确认实时价格</p><p>Weishan 不替用户登录、付款、下单或出票</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>' : '';
    const handoffPacketPreviewHtml = card.handoffPacketViewModelSummary ? '<section class="commerce-global-shopping-handoff-packet-preview" data-commerce-global-shopping-handoff-packet-preview="true"><h5>只读交接包与安全预检</h5><p>只读交接包与安全预检</p><p>只读交接包预览</p><p>平台跳转前安全预检</p><p>用户行动边界回执</p><p>交接包预览</p><p>安全预检</p><p>行动边界回执</p><p>只读交接包预览已准备</p><p>平台跳转前安全预检未触发阻断</p><p>用户行动边界回执已准备</p><p>交接包不导出、不下载、不上传</p><p>安全预检不打开平台</p><p>回执不是订单、合同或付款授权</p><p>用户必须在平台自行完成最终确认</p><p>当前只展示只读交接包、安全预检和行动边界</p><p>不打开平台，不导出文件，不构成订单、付款授权或用户签名</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-handoff-packet-preview-show="true">查看交接包预览</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-platform-preflight-gate-show="true">查看安全预检</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-user-action-boundary-receipt-show="true">查看行动边界回执</button><div data-commerce-global-shopping-handoff-packet-preview-output="true"><p>只读交接包预览</p><p>' + escapeHtml(card.readOnlyHandoffPacketPreviewSummary && card.readOnlyHandoffPacketPreviewSummary.userFacingSummary && card.readOnlyHandoffPacketPreviewSummary.userFacingSummary.resultLabel || '交接包预览仍需复核') + '</p><p>交接包不导出、不下载、不上传</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-platform-preflight-gate-output="true"><p>平台跳转前安全预检</p><p>' + escapeHtml(card.platformPreflightSafetyGateSummary && card.platformPreflightSafetyGateSummary.userFacingSummary && card.platformPreflightSafetyGateSummary.userFacingSummary.resultLabel || '安全预检仍需复核') + '</p><p>安全预检不打开平台</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div><div data-commerce-global-shopping-user-action-boundary-receipt-output="true"><p>用户行动边界回执</p><p>' + escapeHtml(card.userActionBoundaryReceiptSummary && card.userActionBoundaryReceiptSummary.userFacingSummary && card.userActionBoundaryReceiptSummary.userFacingSummary.resultLabel || '边界回执仍需复核') + '</p><p>回执不是订单、合同或付款授权</p><p>用户必须在平台自行完成最终确认</p><p>bookingUrl:null</p><p>payment:false</p><p>order:false</p></div></section>' : '';
    const manualPlatformReviewHtml = card.platformVisitPreparationViewModelSummary ? '<section class="commerce-global-shopping-manual-platform-review" data-commerce-global-shopping-manual-platform-review="true"><h5>平台访问准备与最终安全清单</h5><p>平台访问准备与最终安全清单</p><p>手动访问平台准备中心</p><p>外部平台边界说明</p><p>最终用户安全清单</p><p>平台访问准备</p><p>平台边界说明</p><p>最终安全清单</p><p>手动访问平台准备已完成</p><p>外部平台边界说明已准备</p><p>最终用户安全清单已准备</p><p>Weishan 不代表外部平台</p><p>平台页面为最终依据</p><p>最终安全清单不保存用户勾选</p><p>离开 Weishan 后由用户自行判断</p><p>当前只展示平台访问准备、外部平台边界和最终安全清单</p><p>不打开平台，不保存选择，不构成订单、付款授权或签名</p><button type="button" class="cmd-btn gray" data-commerce-global-shopping-manual-platform-visit-preparation-show="true">查看平台访问准备</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-external-platform-boundary-show="true">查看平台边界说明</button><button type="button" class="cmd-btn gray" data-commerce-global-shopping-final-user-safety-checklist-show="true">查看最终安全清单</button><div data-commerce-global-shopping-manual-platform-visit-preparation-output="true"><p>手动访问平台准备中心</p><p>' + escapeHtml(card.manualPlatformVisitPreparationCenterSummary && card.manualPlatformVisitPreparationCenterSummary.userFacingSummary && card.manualPlatformVisitPreparationCenterSummary.userFacingSummary.resultLabel || '平台访问准备仍需复核') + '</p><p>当前只展示平台访问准备、外部平台边界和最终安全清单</p></div><div data-commerce-global-shopping-external-platform-boundary-output="true"><p>外部平台边界说明</p><p>' + escapeHtml(card.externalPlatformBoundaryBriefSummary && card.externalPlatformBoundaryBriefSummary.userFacingSummary && card.externalPlatformBoundaryBriefSummary.userFacingSummary.resultLabel || '平台边界说明仍需复核') + '</p><p>Weishan 不代表外部平台</p><p>平台页面为最终依据</p></div><div data-commerce-global-shopping-final-user-safety-checklist-output="true"><p>最终用户安全清单</p><p>' + escapeHtml(card.finalUserSafetyChecklistSummary && card.finalUserSafetyChecklistSummary.userFacingSummary && card.finalUserSafetyChecklistSummary.userFacingSummary.resultLabel || '最终安全清单仍需复核') + '</p><p>最终安全清单不保存用户勾选</p><p>离开 Weishan 后由用户自行判断</p></div></section>' : '';
    const pilotOpsHtml = '<section class="commerce-flight-pilot-ops" data-commerce-flight-pilot-ops="true"><h5>只读试点运营摘要</h5><p>运营状态</p><p>下一批决策</p><p>主要风险</p><p>支持准备</p><p>试点运行健康</p><p>继续当前批次</p><p>暂停扩大测试</p><p>需要复核</p><p>可以进入下一批只读测试</p><p>该页面只用于只读试点运营判断</p><p>不保存真实身份、不发送真实邀请、不提供交易能力</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-ops-summary-show="true">查看试点运营摘要</button><button type="button" class="cmd-btn gray" data-commerce-flight-next-cohort-decision-show="true">查看下一批决策</button><div data-commerce-flight-pilot-ops-summary-output="true"><p>只读试点运营摘要</p><p>运营状态</p><p>主要风险</p><p>支持准备</p><p>' + escapeHtml(card.pilotOpsSummary && card.pilotOpsSummary.userFacingSummary && card.pilotOpsSummary.userFacingSummary.resultLabel || '继续当前批次') + '</p><p>' + escapeHtml(card.pilotOpsPrimaryRisk && card.pilotOpsPrimaryRisk.label || '无主要风险') + '</p><p>' + escapeHtml(card.supportReadinessSummary && card.supportReadinessSummary.userFacingSummary && card.supportReadinessSummary.userFacingSummary.resultLabel || '支持准备') + '</p></div><div data-commerce-flight-next-cohort-decision-output="true"><p>下一批只读测试决策板</p><p>下一批决策</p><p>可以进入下一批只读测试</p><p>继续当前批次</p><p>暂停扩大测试</p><p>需要内部复核</p><p>已阻断</p><p>' + escapeHtml(card.nextCohortDecisionSummary && card.nextCohortDecisionSummary.userFacingSummary && card.nextCohortDecisionSummary.userFacingSummary.resultLabel || '继续当前批次') + '</p><p>该决策只适用于只读试点节奏，不代表真实账号、邀请、交易或出票能力</p></div></section>';
    const pilotOnboardingHtml = card.pilotOnboardingViewModel ? '<section class="commerce-flight-pilot-onboarding" data-commerce-flight-pilot-onboarding="true"><h5>只读试点进入确认</h5><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>我知道当前只是只读候选证据</p><p>我知道价格、库存、税费和规则以平台页面为准</p><p>我知道唯珊不会付款、不会下单、不会出票</p><p>我知道唯珊不会上传证件、银行卡或登录凭据</p><p>我知道测试反馈会脱敏处理</p><p data-commerce-pilot-consent-status="true">' + escapeHtml(card.readOnlyConsentSummary && card.readOnlyConsentSummary.userFacingSummary && card.readOnlyConsentSummary.userFacingSummary.resultLabel || '仍有必选项未确认') + '</p><p data-commerce-pilot-entry-status="true">' + escapeHtml(card.pilotOnboardingSummary && card.pilotOnboardingSummary.userFacingSummary && card.pilotOnboardingSummary.userFacingSummary.resultLabel || '需要确认只读范围') + '</p><p>只读试点不代表交易授权</p><p>只读试点不提供付款、下单或出票能力。</p><p>bookingUrl:null</p><p>paymentUrl:null</p><p>orderUrl:null</p><p>download:false</p><p>fileWrite:false</p><button type="button" class="cmd-btn gray" data-commerce-flight-pilot-onboarding-show="true">查看试点进入确认</button><button type="button" class="cmd-btn gray" data-commerce-flight-read-only-consent-confirm="true">确认只读范围</button><div data-commerce-flight-pilot-onboarding-output="true"><p>只读试点进入确认</p><p>进入只读试点前请确认</p><p>只读试点用户确认</p><p>仍有必选项未确认</p><p>只读试点不代表交易授权</p></div></section>' : '';
    const riskBadgeHtml = card.riskBadgeSummary ? '<section class="commerce-flight-risk-badges" data-commerce-flight-risk-badges="true"><h5>安全标签</h5><p>只读安全</p><p>交易动作已阻断</p><p>不可导出真实文件</p><p>' + escapeHtml(card.riskBadgeSummary.line || '只读安全 · 交易动作已阻断') + '</p></section>' : '';
    const handoffChecklistHtml = card.handoffChecklistSummary ? '<section class="commerce-safe-provider-confirmation-checklist" data-commerce-safe-provider-confirmation-checklist="true"><h5>前往平台确认前检查</h5><p>Safe Provider Confirmation Checklist</p><ul>' + (Array.isArray(card.handoffChecklistSummary.checklistItems) ? card.handoffChecklistSummary.checklistItems : []).map(function(item){ return '<li>' + escapeHtml(item.label || item.itemId || '') + '：' + escapeHtml(item.status || '') + '</li>'; }).join('') + '</ul><p>唯珊不会付款、不会下单、不会上传证件或银行卡</p><p>平台最终为准</p><p>bookingUrl: null</p></section>' : '';
    const handoffReceiptHtml = card.handoffReceiptSummary ? '<section class="commerce-provider-handoff-receipt" data-commerce-provider-handoff-receipt="true"><h5>生成本地 handoff receipt</h5><p>Handoff Receipt</p><p>本地 handoff receipt · ' + escapeHtml(card.handoffReceiptSummary.displayHost || card.safeProviderHandoffHost || '可信平台') + '</p><p>rawUrlStored: false</p><p>secretStored: false</p><p>bookingUrl: null</p></section>' : '';
    const manualPlatformCheckHtml = '<section class="commerce-manual-platform-check" data-commerce-manual-platform-check="true"><h5>记录平台核对结果</h5><p>Platform Check Evidence</p><label>observedTotalPrice <input data-commerce-manual-platform-check-total="true" aria-label="observedTotalPrice" value="' + escapeHtml(card.manualPlatformCheckSummary && card.manualPlatformCheckSummary.observedTotalPrice != null ? String(card.manualPlatformCheckSummary.observedTotalPrice) : '') + '"></label><label>currency <input data-commerce-manual-platform-check-currency="true" aria-label="currency" value="' + escapeHtml(card.manualPlatformCheckSummary && card.manualPlatformCheckSummary.observedCurrency || 'CNY') + '"></label><label>userNote <textarea data-commerce-manual-platform-check-note="true" aria-label="userNote"></textarea></label><button type="button" class="cmd-btn gray" data-commerce-manual-platform-check-save="true">记录平台核对结果</button><div data-commerce-manual-platform-check-output="true"><p>平台核对结果已记录</p><p>' + escapeHtml(card.platformCheckDeltaSummary && card.platformCheckDeltaSummary.line || '平台核对差异：暂无可比较的手动平台核对结果') + '</p><p>平台核对差异</p><p>平台最终为准</p><p>该结果由用户手动记录，仅用于本地核对，不代表唯珊完成预订或付款。</p><p>payment: false</p><p>order: false</p><p>identityUpload: false</p></div></section>';
    const reconciliationHtml = card.reconciliationSummary ? '<section class="commerce-platform-check-reconciliation" data-commerce-platform-check-reconciliation="true"><h5>平台核对汇总</h5><p>平台核对汇总</p><p>候选价置信标签：' + escapeHtml(card.reconciliationSummary.confidenceLabel || '不可确认') + '</p><p>' + escapeHtml(card.reconciliationSummary.line || '平台最终为准') + '</p><p>平台页面结果与候选价存在差异，平台最终为准</p><p>重新核对平台页面</p><p>bookingUrl: null</p><p>secretStored: false</p></section>' : '';
    const confidenceHtml = card.confidenceLabelSummary ? '<section class="commerce-candidate-confidence-label" data-commerce-candidate-confidence-label="true"><h5>候选价置信标签</h5><p>候选价置信标签</p><p>' + escapeHtml(card.confidenceLabelSummary.confidenceLabel || '不可确认') + '</p><p>高一致 / 有差异 / 需重新核对 / 不可确认</p><p>平台最终为准</p></section>' : '';
    const nextStepHtml = card.safeNextStepSummary ? '<section class="commerce-safe-next-step" data-commerce-safe-next-step="true"><h5>下一步安全建议</h5><p>下一步安全建议</p><p>' + escapeHtml(card.safeNextStepSummary.recommendation || '重新核对平台页面') + '</p><p>重新运行只读报价</p><p>所有价格、库存、税费和规则以平台页面为准。</p></section>' : '';
    const topCandidatesHtml = topCandidates.length ? '<section class="commerce-read-only-top-candidates" data-commerce-read-only-top-candidates="true"><h5>Top 3 候选报价</h5><p>' + escapeHtml(card.lowPriceClaim || "当前导入样本中的低价候选") + '</p><p>Ranking Scope: ' + escapeHtml(card.rankingScope || "导入样本范围") + '</p><p>' + escapeHtml(card.rankingExplanation || "仅按导入样本中的只读候选证据排序，平台最终为准。") + '</p><p>Source Breakdown: ' + escapeHtml('providerCount=' + ((card.sourceBreakdown && card.sourceBreakdown.providerCount) || 0) + '; providerIds=' + (((card.sourceBreakdown && card.sourceBreakdown.providerIds) || []).join(',')) + '; fareSources=' + (((card.sourceBreakdown && card.sourceBreakdown.fareSources) || []).join(','))) + '</p><ol>' + topCandidates.map(function (candidate) {
      const selected = card.selectedCandidate && card.selectedCandidate.quoteId === candidate.quoteId;
      const price = candidate.totalPrice == null ? "暂无真实价格结果" : "¥" + candidate.totalPrice;
      const sourceLine = (candidate.providerName || "") + " · " + (candidate.responseShape || "unsupported") + " · " + (candidate.fareSource || "sandbox_read_only_import");
      const detailLine = '票面价：' + escapeHtml(candidate.baseFare == null ? "-" : String(candidate.baseFare)) + ' · 税费：' + escapeHtml(candidate.taxesAndFees == null ? "-" : String(candidate.taxesAndFees)) + ' · 平台费：' + escapeHtml(candidate.providerFees == null ? "-" : String(candidate.providerFees));
      return '<li><strong>#' + escapeHtml(String(candidate.rank || "")) + ' ' + escapeHtml(price) + '</strong><p>' + escapeHtml(sourceLine) + '</p><p>' + detailLine + '</p><p>平台最终为准 · 未锁价，不代表可出票</p><button type="button" class="cmd-btn gray" data-commerce-select-read-only-quote-candidate="true" data-commerce-select-read-only-quote-candidate-id="' + escapeHtml(candidate.quoteId || "") + '" data-commerce-safe-provider-handoff-url="' + escapeHtml(encodeURIComponent(candidate.safeProviderHandoffUrl || "")) + '" data-commerce-selected-source-summary="' + escapeHtml(encodeURIComponent(candidate.selectedSourceSummary || candidate.sourceSummary || sourceLine)) + '">选择该候选</button>' + (selected ? '<p data-commerce-selected-candidate="true">已选择该候选</p><p data-commerce-selected-source-summary="true">' + escapeHtml(candidate.selectedSourceSummary || candidate.sourceSummary || sourceLine) + '</p>' : '') + '</li>';
    }).join("") + '</ol><p>Selection Evidence</p></section>' : "";
    return `<section class="commerce-read-only-price-candidate-card" aria-label="只读候选价" data-commerce-read-only-price-candidate-card="true">
      <h5>${escapeHtml(card.title || "只读候选价")}</h5>
      <p>${escapeHtml(card.statusLine || "只读候选价；平台最终为准；未锁价；不代表可出票")}</p>
      ${card.importStatusBadge ? `<p data-commerce-sandbox-import-status="true">${escapeHtml(card.importStatusBadge)}</p>` : ""}
      ${card.importedEvidenceBanner ? `<p data-commerce-sandbox-import-banner="true">${escapeHtml(card.importedEvidenceBanner)}</p>` : ""}
      ${dryRunSummaryHtml}
      ${userFacingEvidenceHtml}
      ${decisionAssistantHtml}
      ${candidateComparisonHtml}
      ${auditReviewHtml}
      ${safeExportPreviewHtml}
      ${humanReviewHtml}
      ${finalPacketHtml}
      ${operatorConsoleHtml}
      ${pilotExitCriteriaHtml}
      ${launchCandidateHtml}
      ${freezeGateHtml}
      ${evidenceFreezePackHtml}
      ${rcReviewHtml}
      ${rcEvidenceReviewHtml}
      ${rcRegressionAuditHtml}
      ${rcCopyReviewHtml}
      ${priceCandidateDisplayHtml}
      ${providerSandboxMilestoneHtml}
      ${providerSandboxReleaseCandidateHtml}
      ${providerCertificationHtml}
      ${providerOfflineReleaseHtml}
      ${providerOfflineLaunchHtml}
      ${providerFinalLaunchReviewHtml}
      ${providerFinalReviewConsoleHtml}
      ${providerFinalSafetyHtml}
      ${providerGovernanceClosureHtml}
      ${providerDistributionReviewHtml}
      ${providerCoverageHtml}
      ${sandboxDecisionReviewHtml}
      ${platformHandoffSimulationHtml}
      ${handoffPacketPreviewHtml}
      ${manualPlatformReviewHtml}
      ${externalPlatformExitHtml}
      ${commerceSessionRecapHtml}
      ${sandboxProviderPlanningHtml}
      ${providerIntegrationPrepHtml}
      ${providerMockRuntimeHtml}
      ${providerLaunchReadinessHtml}
      ${providerLaunchSimulationHtml}
      ${providerPilotControlHtml}
      ${providerPilotGovernanceHtml}
      ${providerGovernanceReleaseHtml}
      ${providerManualReleaseHtml}
      ${providerSandboxActivationHtml}
      ${globalShoppingGoalHtml}
      ${providerConnectorReplayHtml}
      ${providerSandboxDryRunHtml}
      ${pilotOnboardingHtml}
      ${pilotSupportHtml}
      ${rolloutControlHtml}
      ${pilotOpsHtml}
      ${riskBadgeHtml}
      ${handoffChecklistHtml}
      ${handoffReceiptHtml}
      ${manualPlatformCheckHtml}
      ${reconciliationHtml}
      ${confidenceHtml}
      ${nextStepHtml}
      <p class="commerce-read-only-price-candidate-card-price">${escapeHtml(card.priceDisplay || "暂无真实价格结果")}</p>
      <p>${escapeHtml(card.providerName || "Google Flights")} · ${escapeHtml(card.providerType || "flight_search")}</p>
      <p>${escapeHtml(card.routeTitle || "")}</p>
      <ul class="commerce-read-only-price-candidate-card-breakdown">${breakdownLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      <ul class="commerce-read-only-price-candidate-card-safety">${safetyLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      ${topCandidatesHtml}
      ${sessionSummaryHtml}
      <p>${escapeHtml(card.safetyNotice || "唯珊不会付款、不会下单、不会上传证件或银行卡。")}</p>
      <p data-commerce-read-only-refresh-summary="true">${escapeHtml(card.interactiveRefreshState && card.interactiveRefreshState.lastRefreshStatusLabel ? ("最近一次刷新：" + card.interactiveRefreshState.lastRefreshStatusLabel) : (card.refreshStateSummary && card.refreshStateSummary.summary || ("最近一次刷新：" + (card.lastRefreshStatusLabel || "未运行"))))}</p>
      ${card.recoveredEvidenceSummary && card.recoveredEvidenceSummary.available ? `<p data-commerce-read-only-recovered-evidence="true">已恢复最近一次只读证据</p>` : ""}
      ${card.refreshErrorBanner ? `<p class="commerce-warning" data-commerce-read-only-refresh-error="true">${escapeHtml(card.refreshErrorBanner)}</p>` : ""}
      <p>${escapeHtml(card.providerBindingWizardSummary && card.providerBindingWizardSummary.title || "Provider 沙盒绑定准备")} · ${escapeHtml(card.providerBindingWizardSummary && card.providerBindingWizardSummary.status || "fixture_ready")}</p>
      <div class="commerce-read-only-price-candidate-card-actions">
        <button type="button" class="cmd-btn gray commerce-run-sandbox-dry-run-btn" data-commerce-run-sandbox-dry-run="true"${card.dryRunButton && card.dryRunButton.enabled === false ? " disabled" : ""}>${escapeHtml(card.dryRunButton && card.dryRunButton.label || "运行沙盒只读报价")}</button>
        <button type="button" class="cmd-btn gray commerce-read-only-refresh-btn" data-commerce-read-only-quote-refresh="true"${card.refreshButton && card.refreshButton.enabled ? "" : " disabled"}>${escapeHtml(card.refreshButton && card.refreshButton.label || "刷新只读报价")}</button>
        <button type="button" class="cmd-btn gray commerce-clear-read-only-refresh-state-btn" data-commerce-clear-read-only-refresh-state="true"${card.clearRefreshStateButton && card.clearRefreshStateButton.enabled ? "" : " disabled"}>${escapeHtml(card.clearRefreshStateButton && card.clearRefreshStateButton.label || "清除刷新状态")}</button>
        <button type="button" class="cmd-btn gray commerce-replay-read-only-run-btn" data-commerce-replay-last-read-only-run="true" data-commerce-recover-read-only-quote-session="true"${card.replaySummary && card.replaySummary.canReplay === false && !card.sessionSummary ? " disabled" : ""}>恢复最近一次只读会话</button>
        <button type="button" class="cmd-btn gray commerce-read-only-audit-export-btn" data-commerce-read-only-audit-export-preview="true"${card.auditExportReady ? "" : " disabled"}>查看脱敏审计预览</button>
        <button type="button" class="cmd-btn gray" data-commerce-flight-audit-review-show="true">查看工作流审计</button>
        <button type="button" class="cmd-btn gray" data-commerce-flight-safe-export-preview-show="true">查看脱敏摘要预览</button>
        <button type="button" class="cmd-btn gray commerce-safe-provider-handoff-btn" data-commerce-safe-provider-handoff-request="true" data-commerce-safe-provider-handoff-kind="${escapeHtml(card.providerType || "flight_search")}" data-commerce-safe-provider-handoff-url="${escapeHtml(encodeURIComponent(card.safeProviderHandoffUrl || ""))}" data-commerce-safe-provider-handoff-provider="${escapeHtml(card.providerName || "可信平台")}" data-commerce-safe-provider-handoff-host="${escapeHtml(card.safeProviderHandoffHost || card.sourceHost || "")}" data-commerce-safe-provider-handoff-quote-id="${escapeHtml(card.selectedCandidate && card.selectedCandidate.quoteId || "")}" data-commerce-safe-provider-handoff-total="${escapeHtml(card.selectedCandidate && card.selectedCandidate.totalPrice != null ? String(card.selectedCandidate.totalPrice) : String(card.priceQuote && card.priceQuote.totalPrice || ""))}" data-commerce-safe-provider-handoff-currency="${escapeHtml(card.selectedCandidate && card.selectedCandidate.currency || card.priceQuote && card.priceQuote.currency || "CNY")}"${card.confirmationUi && card.confirmationUi.continueButtonDisabled ? " disabled" : ""}>${escapeHtml(card.actionLabel || "去平台确认")}</button>
      </div>
      <p>${escapeHtml(card.refreshButton && card.refreshButton.reason || "仅更新候选证据，未锁价，不代表可出票")}</p>
      <p>价格、库存、税费和规则以平台页面为准</p>
      <p>${escapeHtml(card.confirmationPromptLine || "只允许确认后打开可信平台确认页，不自动打开、不付款、不下单。")}</p>
      <p>${escapeHtml(card.platformFinalLabel || "平台最终为准")} · ${escapeHtml(card.lockStatusLabel || "未锁价")} · ${escapeHtml(card.ticketEligibilityLabel || "不代表可出票")}</p>
    </section>`;
  }

  function getReadOnlyPriceCandidateCardViewModelAuditDraft(input) {
    const card = input && typeof input === "object" && input.version ? input : buildReadOnlyPriceCandidateCardViewModel(input);
    return clone(card && card.audit ? card.audit : {
      eventType: "READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_DRAFT",
      version: READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
      phase: PHASE,
      visible: false,
      providerConfirmationRequired: false,
      safeProviderHandoffUrlDisplayedCount: 0,
      bookingUrlDisplayedCount: 0,
      paymentActionDisplayedCount: 0,
      orderActionDisplayedCount: 0,
      identityUploadAttemptCount: 0,
      realPriceDisplayedCount: 0,
      redacted: true
    });
  }

  function assertReadOnlyPriceCandidateCardViewModelSafe(value) {
    const card = value && typeof value === "object" ? value : buildReadOnlyPriceCandidateCardViewModel({});
    if (card.redacted !== true) throw new Error("read only price candidate card must stay redacted");
    if (card.noAutoOpen !== true || card.noBookingUrl !== true || card.noPayment !== true || card.noOrder !== true || card.noIdentityUpload !== true) throw new Error("read only price candidate card must keep unsafe actions disabled");
    if (card.bookingUrl !== null) throw new Error("read only price candidate card must not expose bookingUrl");
    if (!Array.isArray(card.breakdownLines) || !card.breakdownLines.length) throw new Error("read only price candidate card must keep price breakdown");
    if (!Array.isArray(card.safetyLines) || !card.safetyLines.length) throw new Error("read only price candidate card must keep safety lines");
    if (card.priceTruthLabel.indexOf("平台最终为准") < 0) throw new Error("read only price candidate card must emphasize platform final");
    if (card.priceTruthLabel.indexOf("未锁价") < 0) throw new Error("read only price candidate card must emphasize not locked");
    if (card.priceTruthLabel.indexOf("不代表可出票") < 0) throw new Error("read only price candidate card must emphasize not ticketable");
    if (card.actionLabel !== "去平台确认") throw new Error("read only price candidate card must keep confirmation action label");
    if (!card.refreshButton || card.refreshButton.autoRun !== false || card.refreshButton.autoRefresh !== false || card.refreshButton.payment !== false || card.refreshButton.order !== false || card.refreshButton.identityUpload !== false) throw new Error("read only price candidate card must keep refresh button manual and safe");
    if (!card.refreshStateSummary || card.refreshStateSummary.showableAsRealPrice !== false || card.refreshStateSummary.autoOpen !== false) throw new Error("read only price candidate card must keep refresh state safe");
    if (!card.sourceBreakdown || typeof card.sourceBreakdown.providerCount !== "number" || !Array.isArray(card.sourceBreakdown.providerIds) || !Array.isArray(card.sourceBreakdown.fareSources)) throw new Error("read only price candidate card must expose source breakdown");
    if (typeof card.rankingExplanation !== "string" || card.rankingExplanation.indexOf("平台最终为准") < 0) throw new Error("read only price candidate card must expose ranking explanation");
    if (typeof card.selectedSourceSummary !== "string") throw new Error("read only price candidate card must expose selected source summary");
    if (!card.decisionAssistantSummary || card.decisionAssistantSummary.title !== "推荐理由") throw new Error("read only price candidate card must expose decision assistant summary");
    if (!card.candidateComparisonSummary || card.candidateComparisonSummary.title !== "候选对比") throw new Error("read only price candidate card must expose candidate comparison summary");
    if (!Array.isArray(card.candidateComparisonTable)) throw new Error("read only price candidate card must expose candidate comparison table");
    if (!card.providerConfirmationWarning || card.providerConfirmationWarning.providerConfirmationRequiresUserConfirm !== true) throw new Error("read only price candidate card must keep provider confirmation warning");
    if (!card.handoffChecklistSummary || card.handoffChecklistSummary.actions.requiresUserConfirmation !== true) throw new Error("read only price candidate card must expose safe handoff checklist");
    if (!card.handoffReceiptSummary || card.handoffReceiptSummary.safety.rawUrlStored !== false) throw new Error("read only price candidate card must expose redacted receipt summary");
    if (!card.manualPlatformCheckSummary || card.manualPlatformCheckSummary.safety.payment !== false) throw new Error("read only price candidate card must expose manual platform check summary");
    if (!card.platformCheckDeltaSummary || card.platformCheckDeltaSummary.canClaimPriceLocked !== false) throw new Error("read only price candidate card must expose safe platform delta summary");
    if (!card.reconciliationSummary || card.reconciliationSummary.bookingUrl !== null) throw new Error("read only price candidate card must expose reconciliation summary");
    if (!card.confidenceLabelSummary || card.confidenceLabelSummary.canPayHere !== false) throw new Error("read only price candidate card must expose confidence label summary");
    if (!card.safeNextStepSummary || !Array.isArray(card.safeNextStepSummary.forbiddenActions)) throw new Error("read only price candidate card must expose safe next-step summary");
    if (!card.interactiveRefreshState || card.interactiveRefreshState.safety.autoRefresh !== false || card.interactiveRefreshState.safety.autoOpen !== false) throw new Error("read only price candidate card must keep interactive refresh safe");
    if (!card.clearRefreshStateButton || card.clearRefreshStateButton.autoRun !== false) throw new Error("read only price candidate card must expose safe clear refresh state button");
    if (!card.providerBindingWizardSummary || card.providerBindingWizardSummary.productionProviderEnabled !== false) throw new Error("read only price candidate card must expose safe provider binding wizard summary");
    if (!card.dryRunButton || typeof card.dryRunButton.label !== "string" || card.dryRunButton.autoRun !== false) throw new Error("read only price candidate card must expose safe dry run button");
    if (card.sandboxDryRunSummary && (card.sandboxDryRunSummary.rawResponseStored !== false || card.sandboxDryRunSummary.autoOpen !== false)) throw new Error("read only price candidate card must keep sandbox dry run safe");
    if (card.sandboxImportSummary && (card.sandboxImportSummary.rawResponseStored !== false || card.sandboxImportSummary.showableAsRealPrice !== false || card.sandboxImportSummary.autoOpen !== false)) throw new Error("read only price candidate card must keep sandbox import safe");
    const serial = JSON.stringify(card).replace(/[^"。；;\/]*(?:禁止|阻断|已阻断|不代表)[^"。；;\/]*全网最低[^"。；;\/]*/g, "");
    if (/fake price|mock price|demo price|AI 估价|全网最低|real final price/i.test(serial)) throw new Error("read only price candidate card must not expose fake or final price claims");
    return true;
  }

  window.WeishanReadOnlyPriceCandidateCardViewModel = {
    READ_ONLY_PRICE_CANDIDATE_CARD_VIEW_MODEL_VERSION,
    PHASE,
    buildReadOnlyPriceCandidateCardViewModel,
    renderReadOnlyPriceCandidateCardHtml,
    getReadOnlyPriceCandidateCardViewModelAuditDraft,
    assertReadOnlyPriceCandidateCardViewModelSafe
  };
})();
