;(function () {
  "use strict";

  const READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION = "2.2.0";
  const REPORT_CENTER_NAME = "read_only_quote_session_report_center_v1";
  const FORBIDDEN_NAME_RE = /(rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i;
  const FORBIDDEN_TEXT_RE = /全网最低|最低价保证|已锁价|可以出票|可直接出票|真实最终价|立即购买/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe).filter(function (item) { return item !== undefined; });
    if (!value || typeof value !== "object") return value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      if (FORBIDDEN_NAME_RE.test(name)) return;
      const next = stripUnsafe(value[name]);
      if (next !== undefined) result[name] = next;
    });
    return result;
  }

  function formatterApi() {
    return window.WeishanReadOnlyQuoteEvidenceSummaryFormatter || {};
  }

  function sessionApi() {
    return window.WeishanReadOnlyQuoteSessionManager || {};
  }

  function auditApi() {
    return window.WeishanReadOnlyQuoteAuditExport || {};
  }

  function decisionApi() {
    return window.WeishanReadOnlyQuoteDecisionAssistant || {};
  }

  function comparisonApi() {
    return window.WeishanReadOnlyQuoteCandidateComparisonExplainer || {};
  }

  function workflowAuditApi() { return window.WeishanFlightWorkflowAuditReviewCenter || {}; }
  function safeExportApi() { return window.WeishanFlightWorkflowSafeSessionExportPreview || {}; }
  function riskBadgeApi() { return window.WeishanFlightWorkflowRiskBadgeBuilder || {}; }
  function humanReviewApi() { return window.WeishanFlightWorkflowHumanReviewChecklist || {}; }
  function finalPacketApi() { return window.WeishanFlightWorkflowFinalSafeHandoffPacket || {}; }
  function packetPolicyApi() { return window.WeishanFlightWorkflowHandoffPacketPolicyGuard || {}; }
  function sentinelApi() { return window.WeishanFlightWorkflowSafetyRegressionSentinel || {}; }
  function operatorApi() { return window.WeishanFlightWorkflowOperatorConsole || {}; }
  function operatorViewModelApi() { return window.WeishanFlightWorkflowOperatorConsoleViewModel || {}; }
  function invitationGateApi() { return window.WeishanFlightWorkflowReadOnlyPilotInvitationGate || {}; }
  function testerCohortEnrollmentConsoleApi() { return window.WeishanFlightWorkflowTesterCohortEnrollmentConsole || {}; }
  function pilotInvitationViewModelApi() { return window.WeishanFlightWorkflowPilotInvitationViewModel || {}; }
  function scenarioSimulatorApi() { return window.WeishanFlightWorkflowScenarioSimulator || {}; }
  function safetyTestMatrixApi() { return window.WeishanFlightWorkflowSafetyTestMatrixConsole || {}; }
  function releaseReadinessApi() { return window.WeishanFlightWorkflowReleaseReadinessDashboard || {}; }

  function safeText(value) {
    return text(value).replace(FORBIDDEN_TEXT_RE, "保守候选证据");
  }

  function safeCandidates(input) {
    const safe = input && typeof input === "object" ? input : {};
    const candidates = Array.isArray(safe.topCandidates) ? safe.topCandidates
      : (Array.isArray(safe.dryRunTopCandidates) ? safe.dryRunTopCandidates
        : (safe.rankingPreview && Array.isArray(safe.rankingPreview.topCandidates) ? safe.rankingPreview.topCandidates : []));
    return candidates.slice(0, 3).map(function (candidate, index) {
      const item = stripUnsafe(candidate && typeof candidate === "object" ? candidate : {}) || {};
      return Object.assign({}, item, {
        rank: item.rank || index + 1,
        bookingUrl: null,
        checkoutUrl: null,
        paymentUrl: null,
        orderUrl: null,
        payment: false,
        order: false,
        identityUpload: false,
        redacted: true
      });
    });
  }

  function resolveSessionSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.sessionSummary && typeof safe.sessionSummary === "object") return stripUnsafe(safe.sessionSummary);
    if (safe.session && typeof safe.session === "object" && sessionApi().buildReadOnlyQuoteSessionSummary) return sessionApi().buildReadOnlyQuoteSessionSummary(safe.session);
    if (safe.sessionName || safe.sessionId || safe.userIntentSummary) {
      return sessionApi().buildReadOnlyQuoteSessionSummary ? sessionApi().buildReadOnlyQuoteSessionSummary(safe) : stripUnsafe(safe);
    }
    return null;
  }

  function workflowFields(input) {
    const safe = input && typeof input === "object" ? input : {};
    return {
      workflowStateSummary: stripUnsafe(safe.workflowStateSummary || null),
      clarificationSummary: stripUnsafe(safe.clarificationSummary || null),
      continuitySummary: stripUnsafe(safe.continuitySummary || null),
      confirmationStateSummary: stripUnsafe(safe.confirmationStateSummary || null),
      recoverySummary: stripUnsafe(safe.recoverySummary || null),
      resumeCoachSummary: stripUnsafe(safe.resumeCoachSummary || null),
      actionQueueSummary: stripUnsafe(safe.actionQueueSummary || safe.actionQueue || null),
      progressTimelineSummary: stripUnsafe(safe.progressTimelineSummary || safe.progressTimeline || null),
      safeResumeCenterSummary: stripUnsafe(safe.safeResumeCenterSummary || safe.safeResumeCenter || null),
      blockedActions: stripUnsafe(Array.isArray(safe.blockedActions) ? safe.blockedActions : (safe.actionQueueSummary && safe.actionQueueSummary.blockedActions || [])),
      currentActionLabel: safeText(safe.currentActionLabel || ""),
      nextSafeActionLabel: safeText(safe.nextSafeActionLabel || safe.nextSafeAction || ""),
      actionQueue: stripUnsafe(safe.actionQueueSummary || safe.actionQueue || null),
      progressTimeline: stripUnsafe(safe.progressTimelineSummary || safe.progressTimeline || null),
      safeResumeCenter: stripUnsafe(safe.safeResumeCenterSummary || safe.safeResumeCenter || null),
      nextSafeAction: safeText(safe.nextSafeActionLabel || safe.nextSafeAction || ""),
      currentStage: safeText(safe.currentStage || ""),
      workflowStageLabel: safeText(safe.workflowStageLabel || safe.continuitySummary && safe.continuitySummary.stageLabel || ""),
      nextStepLabel: safeText(safe.nextStepLabel || ""),
      canResumeWorkflow: safe.canResumeWorkflow === true,
      resumeActions: stripUnsafe(Array.isArray(safe.resumeActions) ? safe.resumeActions : (safe.resumeCoachSummary && safe.resumeCoachSummary.allowedActions || [])),
      workflowStepList: stripUnsafe(safe.workflowStepList || null),
      missingFields: Array.isArray(safe.missingFields) ? safe.missingFields.map(safeText) : [],
      clarificationQuestions: Array.isArray(safe.clarificationQuestions) ? safe.clarificationQuestions.map(safeText) : [],
      workflowUserMessage: safeText(safe.workflowUserMessage || ""),
      actionExecutionResult: stripUnsafe(safe.actionExecutionResult || null),
      actionPolicyDecision: stripUnsafe(safe.actionPolicyDecision || null),
      eventLedgerSummary: stripUnsafe(safe.eventLedgerSummary || null),
      lastActionId: safeText(safe.lastActionId || safe.eventLedgerSummary && safe.eventLedgerSummary.lastActionId || ""),
      lastActionStatus: safeText(safe.lastActionStatus || safe.eventLedgerSummary && safe.eventLedgerSummary.lastActionStatus || ""),
      lastActionMessage: safeText(safe.lastActionMessage || safe.eventLedgerSummary && safe.eventLedgerSummary.lastActionMessage || ""),
      auditReviewSummary: stripUnsafe(safe.auditReviewSummary || null),
      safeSessionExportPreview: stripUnsafe(safe.safeSessionExportPreview || null),
      riskBadgeSummary: stripUnsafe(safe.riskBadgeSummary || null),
      humanReviewChecklistSummary: stripUnsafe(safe.humanReviewChecklistSummary || null),
      finalSafeHandoffPacketSummary: stripUnsafe(safe.finalSafeHandoffPacketSummary || null),
      handoffPacketPolicyDecision: stripUnsafe(safe.handoffPacketPolicyDecision || null),
      finalReviewStatus: safeText(safe.finalReviewStatus || ""),
      finalReviewBadges: stripUnsafe(safe.finalReviewBadges || []),
      safetyRegressionSummary: stripUnsafe(safe.safetyRegressionSummary || null),
      operatorConsoleSummary: stripUnsafe(safe.operatorConsoleSummary || null),
      operatorConsoleViewModel: stripUnsafe(safe.operatorConsoleViewModel || null),
      scenarioSimulationSummary: stripUnsafe(safe.scenarioSimulationSummary || null),
      safetyTestMatrixSummary: stripUnsafe(safe.safetyTestMatrixSummary || null),
      releaseReadinessSummary: stripUnsafe(safe.releaseReadinessSummary || null),
      userSafetyCopySummary: stripUnsafe(safe.userSafetyCopySummary || null),
      forbiddenCapabilitySummary: stripUnsafe(safe.forbiddenCapabilitySummary || null),
      userFacingBetaReadiness: stripUnsafe(safe.userFacingBetaReadiness || null),
      copyValidationStatus: safeText(safe.copyValidationStatus || ""),
      betaExpansionGateSummary: stripUnsafe(safe.betaExpansionGateSummary || null),
      publicPilotChecklistSummary: stripUnsafe(safe.publicPilotChecklistSummary || null),
      pilotReadinessSummary: stripUnsafe(safe.pilotReadinessSummary || null),
      cohortProgressSummary: stripUnsafe(safe.cohortProgressSummary || null),
      trialMilestoneSummary: stripUnsafe(safe.trialMilestoneSummary || null),
      safeForSmallPublicPilot: safe.safeForSmallPublicPilot === true,
       pilotNextStep: safeText(safe.pilotNextStep || ""),
      pilotOnboardingSummary: stripUnsafe(safe.pilotOnboardingSummary || null),
      readOnlyConsentSummary: stripUnsafe(safe.readOnlyConsentSummary || null),
      pilotOnboardingViewModel: stripUnsafe(safe.pilotOnboardingViewModel || null),
      pilotEntryStatus: safeText(safe.pilotEntryStatus || ""),
      canEnterReadOnlyPilot: safe.canEnterReadOnlyPilot === true,
      pilotConsentRequired: safe.pilotConsentRequired === true,
      pilotReadinessSnapshotSummary: stripUnsafe(safe.pilotReadinessSnapshotSummary || null),
      supportPlaybookSummary: stripUnsafe(safe.supportPlaybookSummary || null),
      pilotExitCriteriaSummary: stripUnsafe(safe.pilotExitCriteriaSummary || null),
      launchCandidateReadinessSummary: stripUnsafe(safe.launchCandidateReadinessSummary || null),
      freezeGateSummary: stripUnsafe(safe.freezeGateSummary || null),
      evidenceFreezePackSummary: stripUnsafe(safe.evidenceFreezePackSummary || null),
      rcCandidateReviewSummary: stripUnsafe(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary: stripUnsafe(safe.rcEvidenceReviewSummary || null),
      rcReviewViewModelSummary: stripUnsafe(safe.rcReviewViewModelSummary || null),
      rcRegressionAuditSummary: stripUnsafe(safe.rcRegressionAuditSummary || null),
      releaseRiskLedgerSummary: stripUnsafe(safe.releaseRiskLedgerSummary || null),
      rcRegressionViewModelSummary: stripUnsafe(safe.rcRegressionViewModelSummary || null),
      rcCopyFinalizationSummary: stripUnsafe(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary: stripUnsafe(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewViewModelSummary: stripUnsafe(safe.rcCopyReviewViewModelSummary || null),
      rcReviewStatus: safeText(safe.rcReviewStatus || safe.rcCandidateReviewSummary && safe.rcCandidateReviewSummary.status || ""),
      rcEvidenceStatus: safeText(safe.rcEvidenceStatus || safe.rcEvidenceReviewSummary && safe.rcEvidenceReviewSummary.status || ""),
      rcRegressionStatus: safeText(safe.rcRegressionStatus || safe.rcRegressionAuditSummary && safe.rcRegressionAuditSummary.status || ""),
      releaseRiskStatus: safeText(safe.releaseRiskStatus || safe.releaseRiskLedgerSummary && safe.releaseRiskLedgerSummary.status || ""),
      rcCopyReviewStatus: safeText(safe.rcCopyReviewStatus || safe.rcCopyFinalizationSummary && safe.rcCopyFinalizationSummary.status || ""),
      safetyDisclosureStatus: safeText(safe.safetyDisclosureStatus || safe.safetyDisclosureReviewSummary && safe.safetyDisclosureReviewSummary.status || ""),
      safeToStartRcReview: safe.safeToStartRcReview === true,
      safeToContinueReleaseCandidate: safe.safeToContinueReleaseCandidate === true,
      safeToFinalizeUserFacingCopy: safe.safeToFinalizeUserFacingCopy === true,
      globalShoppingProductGoalSummary: stripUnsafe(safe.globalShoppingProductGoalSummary || null),
      jumpToPlatformBoundarySummary: stripUnsafe(safe.jumpToPlatformBoundarySummary || null),
      globalShoppingProductGoalViewModelSummary: stripUnsafe(safe.globalShoppingProductGoalViewModelSummary || null),
      readOnlyProviderSandboxConnectorSummary: stripUnsafe(safe.readOnlyProviderSandboxConnectorSummary || null),
      fixtureReplayConsoleSummary: stripUnsafe(safe.fixtureReplayConsoleSummary || null),
      normalizedPriceCandidateBoardSummary: stripUnsafe(safe.normalizedPriceCandidateBoardSummary || null),
      realProviderSandboxGateSummary: stripUnsafe(safe.realProviderSandboxGateSummary || null),
      providerRequestEnvelopeSummary: stripUnsafe(safe.providerRequestEnvelopeSummary || null),
      providerCallAuditLedgerSummary: stripUnsafe(safe.providerCallAuditLedgerSummary || null),
      providerSandboxReadinessViewModelSummary: stripUnsafe(safe.providerSandboxReadinessViewModelSummary || null),
      providerSandboxDryRunHarnessSummary: stripUnsafe(safe.providerSandboxDryRunHarnessSummary || null),
      firstReadOnlyProviderAdapterShellSummary: stripUnsafe(safe.firstReadOnlyProviderAdapterShellSummary || null),
      providerSandboxSafetyKillSwitchSummary: stripUnsafe(safe.providerSandboxSafetyKillSwitchSummary || null),
      providerSandboxDryRunViewModelSummary: stripUnsafe(safe.providerSandboxDryRunViewModelSummary || null),
      providerAdapterRegistrySummary: stripUnsafe(safe.providerAdapterRegistrySummary || null),
      dryRunProviderResponseNormalizerSummary: stripUnsafe(safe.dryRunProviderResponseNormalizerSummary || null),
      sandboxProviderRunbookSummary: stripUnsafe(safe.sandboxProviderRunbookSummary || null),
      providerAdapterRegistryViewModelSummary: stripUnsafe(safe.providerAdapterRegistryViewModelSummary || null),
      firstSandboxProviderConnectorSummary: stripUnsafe(safe.firstSandboxProviderConnectorSummary || null),
      providerCoverageDashboardSummary: stripUnsafe(safe.providerCoverageDashboardSummary || null),
      readOnlySourceTrustScoreSummary: stripUnsafe(safe.readOnlySourceTrustScoreSummary || null),
      providerCoverageViewModelSummary: stripUnsafe(safe.providerCoverageViewModelSummary || null),
      readOnlyProviderSandboxIntegrationGateSummary: stripUnsafe(safe.readOnlyProviderSandboxIntegrationGateSummary || null),
      sandboxPriceCandidateSessionSummary: stripUnsafe(safe.sandboxPriceCandidateSessionSummary || null),
      sandboxPriceCandidateResultBoardSummary: stripUnsafe(safe.sandboxPriceCandidateResultBoardSummary || null),
      legalProviderFixtureSummary: stripUnsafe(safe.legalProviderFixtureSummary || null),
      providerCredentialSafetySummary: stripUnsafe(safe.providerCredentialSafetySummary || null),
      sandboxPriceFeedSummary: stripUnsafe(safe.sandboxPriceFeedSummary || null),
      sandboxProviderResponseContractSummary: stripUnsafe(safe.sandboxProviderResponseContractSummary || null),
      pricePipelineOrchestratorSummary: stripUnsafe(safe.pricePipelineOrchestratorSummary || null),
      readOnlyCandidateJourneySummary: stripUnsafe(safe.readOnlyCandidateJourneySummary || null),
      providerFixtureViewModelSummary: stripUnsafe(safe.providerFixtureViewModelSummary || null),
      priceSourceNormalizationSummary: stripUnsafe(safe.priceSourceNormalizationSummary || null),
      officialPriceAnchorSummary: stripUnsafe(safe.officialPriceAnchorSummary || null),
      priceCandidateDisplaySummary: stripUnsafe(safe.priceCandidateDisplaySummary || null),
      sameItemMatcherSummary: stripUnsafe(safe.sameItemMatcherSummary || null),
      duplicateCandidateMergerSummary: stripUnsafe(safe.duplicateCandidateMergerSummary || null),
      coveredLowestCandidateBoardSummary: stripUnsafe(safe.coveredLowestCandidateBoardSummary || null),
      externalDeepLinkSafetySummary: stripUnsafe(safe.externalDeepLinkSafetySummary || null),
      searchParameterPrefillSummary: stripUnsafe(safe.searchParameterPrefillSummary || null),
      jumpToPlatformHandoffPreviewSummary: stripUnsafe(safe.jumpToPlatformHandoffPreviewSummary || null),
      sandboxDeepLinkCandidateSummary: stripUnsafe(safe.sandboxDeepLinkCandidateSummary || null),
      platformAvailabilitySummary: stripUnsafe(safe.platformAvailabilitySummary || null),
      partnerLinkPolicySummary: stripUnsafe(safe.partnerLinkPolicySummary || null),
      sandboxHandoffViewModelSummary: stripUnsafe(safe.sandboxHandoffViewModelSummary || null),
      readOnlyProviderSandboxConnectorStatus: safeText(safe.readOnlyProviderSandboxConnectorStatus || safe.readOnlyProviderSandboxConnectorSummary && safe.readOnlyProviderSandboxConnectorSummary.status || ""),
      fixtureReplayStatus: safeText(safe.fixtureReplayStatus || safe.fixtureReplayConsoleSummary && safe.fixtureReplayConsoleSummary.status || ""),
      normalizedPriceCandidateBoardStatus: safeText(safe.normalizedPriceCandidateBoardStatus || safe.normalizedPriceCandidateBoardSummary && safe.normalizedPriceCandidateBoardSummary.status || ""),
      realProviderSandboxGateStatus: safeText(safe.realProviderSandboxGateStatus || safe.realProviderSandboxGateSummary && safe.realProviderSandboxGateSummary.status || ""),
      providerRequestEnvelopeStatus: safeText(safe.providerRequestEnvelopeStatus || safe.providerRequestEnvelopeSummary && safe.providerRequestEnvelopeSummary.status || ""),
      providerCallAuditLedgerStatus: safeText(safe.providerCallAuditLedgerStatus || safe.providerCallAuditLedgerSummary && safe.providerCallAuditLedgerSummary.status || ""),
      providerSandboxReadinessStatus: safeText(safe.providerSandboxReadinessStatus || safe.providerSandboxReadinessViewModelSummary && safe.providerSandboxReadinessViewModelSummary.status || ""),
      providerSandboxDryRunStatus: safeText(safe.providerSandboxDryRunStatus || safe.providerSandboxDryRunHarnessSummary && safe.providerSandboxDryRunHarnessSummary.status || ""),
      providerAdapterShellStatus: safeText(safe.providerAdapterShellStatus || safe.firstReadOnlyProviderAdapterShellSummary && safe.firstReadOnlyProviderAdapterShellSummary.status || ""),
      providerKillSwitchStatus: safeText(safe.providerKillSwitchStatus || safe.providerSandboxSafetyKillSwitchSummary && safe.providerSandboxSafetyKillSwitchSummary.status || ""),
      providerSandboxDryRunViewModelStatus: safeText(safe.providerSandboxDryRunViewModelStatus || safe.providerSandboxDryRunViewModelSummary && safe.providerSandboxDryRunViewModelSummary.status || ""),
      providerAdapterRegistryStatus: safeText(safe.providerAdapterRegistryStatus || safe.providerAdapterRegistrySummary && safe.providerAdapterRegistrySummary.status || ""),
      dryRunResponseNormalizerStatus: safeText(safe.dryRunResponseNormalizerStatus || safe.dryRunProviderResponseNormalizerSummary && safe.dryRunProviderResponseNormalizerSummary.status || ""),
      sandboxProviderRunbookStatus: safeText(safe.sandboxProviderRunbookStatus || safe.sandboxProviderRunbookSummary && safe.sandboxProviderRunbookSummary.status || ""),
      providerAdapterRegistryViewModelStatus: safeText(safe.providerAdapterRegistryViewModelStatus || safe.providerAdapterRegistryViewModelSummary && safe.providerAdapterRegistryViewModelSummary.status || ""),
      firstSandboxProviderConnectorStatus: safeText(safe.firstSandboxProviderConnectorStatus || safe.firstSandboxProviderConnectorSummary && safe.firstSandboxProviderConnectorSummary.status || ""),
      providerCoverageStatus: safeText(safe.providerCoverageStatus || safe.providerCoverageDashboardSummary && safe.providerCoverageDashboardSummary.status || ""),
      sourceTrustStatus: safeText(safe.sourceTrustStatus || safe.readOnlySourceTrustScoreSummary && safe.readOnlySourceTrustScoreSummary.status || ""),
      providerCoverageViewModelStatus: safeText(safe.providerCoverageViewModelStatus || safe.providerCoverageViewModelSummary && safe.providerCoverageViewModelSummary.status || ""),
      providerSandboxIntegrationGateStatus: safeText(safe.providerSandboxIntegrationGateStatus || safe.readOnlyProviderSandboxIntegrationGateSummary && safe.readOnlyProviderSandboxIntegrationGateSummary.status || ""),
      sandboxPriceCandidateSessionStatus: safeText(safe.sandboxPriceCandidateSessionStatus || safe.sandboxPriceCandidateSessionSummary && safe.sandboxPriceCandidateSessionSummary.status || ""),
      sandboxPriceCandidateResultBoardStatus: safeText(safe.sandboxPriceCandidateResultBoardStatus || safe.sandboxPriceCandidateResultBoardSummary && safe.sandboxPriceCandidateResultBoardSummary.status || ""),
      priceNormalizationStatus: safeText(safe.priceNormalizationStatus || safe.priceSourceNormalizationSummary && safe.priceSourceNormalizationSummary.status || ""),
      officialPriceAnchorStatus: safeText(safe.officialPriceAnchorStatus || safe.officialPriceAnchorSummary && safe.officialPriceAnchorSummary.status || ""),
      priceCandidateDisplayStatus: safeText(safe.priceCandidateDisplayStatus || safe.priceCandidateDisplaySummary && safe.priceCandidateDisplaySummary.status || ""),
      sameItemMatcherStatus: safeText(safe.sameItemMatcherStatus || safe.sameItemMatcherSummary && safe.sameItemMatcherSummary.status || ""),
      duplicateMergeStatus: safeText(safe.duplicateMergeStatus || safe.duplicateCandidateMergerSummary && safe.duplicateCandidateMergerSummary.status || ""),
      coveredLowestStatus: safeText(safe.coveredLowestStatus || safe.coveredLowestCandidateBoardSummary && safe.coveredLowestCandidateBoardSummary.status || ""),
      legalProviderFixtureStatus: safeText(safe.legalProviderFixtureStatus || safe.legalProviderFixtureSummary && safe.legalProviderFixtureSummary.status || ""),
      providerCredentialSafetyStatus: safeText(safe.providerCredentialSafetyStatus || safe.providerCredentialSafetySummary && safe.providerCredentialSafetySummary.status || ""),
      sandboxPriceFeedStatus: safeText(safe.sandboxPriceFeedStatus || safe.sandboxPriceFeedSummary && safe.sandboxPriceFeedSummary.status || ""),
      sandboxProviderResponseContractStatus: safeText(safe.sandboxProviderResponseContractStatus || safe.sandboxProviderResponseContractSummary && safe.sandboxProviderResponseContractSummary.status || ""),
      pricePipelineStatus: safeText(safe.pricePipelineStatus || safe.pricePipelineOrchestratorSummary && safe.pricePipelineOrchestratorSummary.status || ""),
      readOnlyCandidateJourneyStatus: safeText(safe.readOnlyCandidateJourneyStatus || safe.readOnlyCandidateJourneySummary && safe.readOnlyCandidateJourneySummary.status || ""),
      externalDeepLinkSafetyStatus: safeText(safe.externalDeepLinkSafetyStatus || safe.externalDeepLinkSafetySummary && safe.externalDeepLinkSafetySummary.status || ""),
      searchPrefillStatus: safeText(safe.searchPrefillStatus || safe.searchParameterPrefillSummary && safe.searchParameterPrefillSummary.status || ""),
      handoffPreviewStatus: safeText(safe.handoffPreviewStatus || safe.jumpToPlatformHandoffPreviewSummary && safe.jumpToPlatformHandoffPreviewSummary.status || ""),
      sandboxDeepLinkStatus: safeText(safe.sandboxDeepLinkStatus || safe.sandboxDeepLinkCandidateSummary && safe.sandboxDeepLinkCandidateSummary.status || ""),
      platformAvailabilityStatus: safeText(safe.platformAvailabilityStatus || safe.platformAvailabilitySummary && safe.platformAvailabilitySummary.status || ""),
      partnerLinkPolicyStatus: safeText(safe.partnerLinkPolicyStatus || safe.partnerLinkPolicySummary && safe.partnerLinkPolicySummary.status || ""),
      sandboxHandoffStatus: safeText(safe.sandboxHandoffStatus || safe.sandboxHandoffViewModelSummary && safe.sandboxHandoffViewModelSummary.status || ""),
      safeToProceedWithPriceProviderSandbox: safe.safeToProceedWithPriceProviderSandbox === true,
      safeToProceedWithReadOnlyPriceProviderSandbox: safe.safeToProceedWithReadOnlyPriceProviderSandbox === true,
      safeToProceedWithFirstRealReadOnlyProviderSandbox: safe.safeToProceedWithFirstRealReadOnlyProviderSandbox === true,
      safeToProceedWithFirstReadOnlySandboxDryRun: safe.safeToProceedWithFirstReadOnlySandboxDryRun === true,
      safeToProceedWithFirstProviderSandboxFixtureDryRun: safe.safeToProceedWithFirstProviderSandboxFixtureDryRun === true,
      safeToProceedWithFirstSandboxProviderConnectorImplementation: safe.safeToProceedWithFirstSandboxProviderConnectorImplementation === true,
      safeToProceedWithFirstReadOnlyProviderSandboxIntegration: safe.safeToProceedWithFirstReadOnlyProviderSandboxIntegration === true,
      safeToProceedWithSandboxCandidateUserPreview: safe.safeToProceedWithSandboxCandidateUserPreview === true,
      safeToProceedWithDeepLinkSafetyGate: safe.safeToProceedWithDeepLinkSafetyGate === true,
      safeToProceedWithSandboxDeepLinkCandidate: safe.safeToProceedWithSandboxDeepLinkCandidate === true,
      safeToProceedWithPartnerFixtureAdapter: safe.safeToProceedWithPartnerFixtureAdapter === true,
      safeToProceedWithRealReadOnlyProviderSandbox: safe.safeToProceedWithRealReadOnlyProviderSandbox === true,
      globalShoppingGoalStatus: safeText(safe.globalShoppingGoalStatus || safe.globalShoppingProductGoalSummary && safe.globalShoppingProductGoalSummary.status || ""),
      jumpBoundaryStatus: safeText(safe.jumpBoundaryStatus || safe.jumpToPlatformBoundarySummary && safe.jumpToPlatformBoundarySummary.status || ""),
      safeToProceedWithJumpToPlatformMvp: safe.safeToProceedWithJumpToPlatformMvp === true,
      pilotOpsSummary: stripUnsafe(safe.pilotOpsSummary || safe.readOnlyPilotOpsSummary || null),
      nextCohortDecisionSummary: stripUnsafe(safe.nextCohortDecisionSummary || safe.nextCohortDecisionBoard || null),
      launchCandidateStatus: safeText(safe.launchCandidateStatus || ""),
      readyForLaunchCandidate: safe.readyForLaunchCandidate === true,
      launchCandidateNextStep: safeText(safe.launchCandidateNextStep || ""),
      pilotOpsStatus: safeText(safe.pilotOpsStatus || ""),
      nextCohortDecisionStatus: safeText(safe.nextCohortDecisionStatus || ""),
      pilotOpsPrimaryRisk: stripUnsafe(safe.pilotOpsPrimaryRisk || null),
      pilotInvitationGateSummary: stripUnsafe(safe.pilotInvitationGateSummary || null),
      testerCohortEnrollmentConsoleSummary: stripUnsafe(safe.testerCohortEnrollmentConsoleSummary || null),
      pilotInvitationViewModelSummary: stripUnsafe(safe.pilotInvitationViewModelSummary || null),
      cohortProgressStatus: safeText(safe.cohortProgressStatus || ""),
      trialMilestoneStatus: safeText(safe.trialMilestoneStatus || ""),
      safeToAdvanceNextCohort: safe.safeToAdvanceNextCohort === true || obj(safe.cohortProgressSummary).safeToAdvanceNextCohort === true || obj(safe.trialMilestoneSummary).safeToAdvanceNextCohort === true,
      pilotSnapshotStatus: safeText(safe.pilotSnapshotStatus || ""),
      supportPlaybookStatus: safeText(safe.supportPlaybookStatus || ""),
      pilotSnapshotNextStep: safeText(safe.pilotSnapshotNextStep || ""),
      pilotInvitationStatus: safeText(safe.pilotInvitationStatus || ""),
      testerCohortStatus: safeText(safe.testerCohortStatus || ""),
      pilotInvitationNextStep: safeText(safe.pilotInvitationNextStep || ""),
      rolloutControlSummary: stripUnsafe(safe.rolloutControlSummary || null),
      cohortHealthSummary: stripUnsafe(safe.cohortHealthSummary || null),
      pilotExitCriteriaSummary: stripUnsafe(safe.pilotExitCriteriaSummary || null),
      launchCandidateReadinessSummary: stripUnsafe(safe.launchCandidateReadinessSummary || null),
      freezeGateSummary: stripUnsafe(safe.freezeGateSummary || null),
      evidenceFreezePackSummary: stripUnsafe(safe.evidenceFreezePackSummary || null),
      rcCandidateReviewSummary: stripUnsafe(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary: stripUnsafe(safe.rcEvidenceReviewSummary || null),
      rcReviewViewModelSummary: stripUnsafe(safe.rcReviewViewModelSummary || null),
      rcRegressionAuditSummary: stripUnsafe(safe.rcRegressionAuditSummary || null),
      releaseRiskLedgerSummary: stripUnsafe(safe.releaseRiskLedgerSummary || null),
      rcRegressionViewModelSummary: stripUnsafe(safe.rcRegressionViewModelSummary || null),
      rcCopyFinalizationSummary: stripUnsafe(safe.rcCopyFinalizationSummary || null),
      safetyDisclosureReviewSummary: stripUnsafe(safe.safetyDisclosureReviewSummary || null),
      rcCopyReviewViewModelSummary: stripUnsafe(safe.rcCopyReviewViewModelSummary || null),
      rcReviewStatus: safeText(safe.rcReviewStatus || safe.rcCandidateReviewSummary && safe.rcCandidateReviewSummary.status || ""),
      rcEvidenceStatus: safeText(safe.rcEvidenceStatus || safe.rcEvidenceReviewSummary && safe.rcEvidenceReviewSummary.status || ""),
      rcRegressionStatus: safeText(safe.rcRegressionStatus || safe.rcRegressionAuditSummary && safe.rcRegressionAuditSummary.status || ""),
      releaseRiskStatus: safeText(safe.releaseRiskStatus || safe.releaseRiskLedgerSummary && safe.releaseRiskLedgerSummary.status || ""),
      rcCopyReviewStatus: safeText(safe.rcCopyReviewStatus || safe.rcCopyFinalizationSummary && safe.rcCopyFinalizationSummary.status || ""),
      safetyDisclosureStatus: safeText(safe.safetyDisclosureStatus || safe.safetyDisclosureReviewSummary && safe.safetyDisclosureReviewSummary.status || ""),
      safeToStartRcReview: safe.safeToStartRcReview === true,
      safeToContinueReleaseCandidate: safe.safeToContinueReleaseCandidate === true,
      safeToFinalizeUserFacingCopy: safe.safeToFinalizeUserFacingCopy === true,
      globalShoppingProductGoalSummary: stripUnsafe(safe.globalShoppingProductGoalSummary || null),
      jumpToPlatformBoundarySummary: stripUnsafe(safe.jumpToPlatformBoundarySummary || null),
      globalShoppingProductGoalViewModelSummary: stripUnsafe(safe.globalShoppingProductGoalViewModelSummary || null),
      globalShoppingGoalStatus: safeText(safe.globalShoppingGoalStatus || safe.globalShoppingProductGoalSummary && safe.globalShoppingProductGoalSummary.status || ""),
      jumpBoundaryStatus: safeText(safe.jumpBoundaryStatus || safe.jumpToPlatformBoundarySummary && safe.jumpToPlatformBoundarySummary.status || ""),
      safeToProceedWithJumpToPlatformMvp: safe.safeToProceedWithJumpToPlatformMvp === true,
      pilotOpsSummary: stripUnsafe(safe.pilotOpsSummary || null),
      nextCohortDecisionSummary: stripUnsafe(safe.nextCohortDecisionSummary || null),
      launchCandidateStatus: safeText(safe.launchCandidateStatus || ""),
      readyForLaunchCandidate: safe.readyForLaunchCandidate === true,
      launchCandidateNextStep: safeText(safe.launchCandidateNextStep || ""),
      pilotOpsStatus: safeText(safe.pilotOpsStatus || ""),
      nextCohortDecisionStatus: safeText(safe.nextCohortDecisionStatus || ""),
      pilotOpsPrimaryRisk: stripUnsafe(safe.pilotOpsPrimaryRisk || null),
      rolloutControlViewModel: stripUnsafe(safe.rolloutControlViewModel || null),
      rolloutDecisionStatus: safeText(safe.rolloutDecisionStatus || ""),
      cohortHealthStatus: safeText(safe.cohortHealthStatus || ""),
      rolloutNextStep: safeText(safe.rolloutNextStep || "")
    };
  }

  function malformedSession(input) {
    const safe = input && typeof input === "object" ? input : null;
    if (!safe) return false;
    if (safe.session === null) return true;
    const session = safe.sessionSummary || safe.session || safe;
    if (!session || typeof session !== "object") return true;
    if ((session.sessionName || session.sessionId || session.userIntentSummary) && typeof session !== "object") return true;
    return false;
  }

  function buildUserFacingQuoteEvidenceSummary(input) {
    const safe = input && typeof input === "object" ? input : {};
    const summary = resolveSessionSummary(safe);
    const intent = summary && summary.userIntentSummary || safe.userIntentSummary || {};
    const candidates = safeCandidates(safe);
    const formatter = formatterApi();
    const selected = safe.selectedCandidate || (summary && summary.dryRun && summary.dryRun.selectedCandidate) || (summary && summary.selection) || null;
    const selectedSummary = formatter.formatSelectedCandidateSummary ? formatter.formatSelectedCandidateSummary(selected || {}) : { line:"尚未选择候选报价。平台最终为准，未锁价，不代表可出票。", selected:false, redacted:true };
    const topSummary = formatter.formatTopCandidateSummary ? formatter.formatTopCandidateSummary(candidates) : { lines:[], redacted:true };
    const decisionAssistant = typeof decisionApi().buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi().buildReadOnlyQuoteDecisionAssistant(Object.assign({}, safe, { topCandidates:candidates, selectedCandidate:selected, handoffChecklistSummary:safe.handoffChecklistSummary || safe.handoffChecklist, handoffReceiptSummary:safe.handoffReceiptSummary || safe.handoffReceipt, manualPlatformCheckSummary:safe.manualPlatformCheckSummary || safe.manualPlatformCheckEvidence, platformCheckDeltaSummary:safe.platformCheckDeltaSummary || safe.platformCheckDelta, reconciliationSummary:safe.reconciliationSummary, confidenceLabelSummary:safe.confidenceLabelSummary, safeNextStepSummary:safe.safeNextStepSummary, platformCheckOutcomeSummary:safe.platformCheckOutcomeSummary, manualPlatformCheckEvidence:safe.manualPlatformCheckEvidence, platformCheckDelta:safe.platformCheckDelta })) : null;
    const candidateComparison = typeof comparisonApi().buildReadOnlyQuoteCandidateComparison === "function" ? comparisonApi().buildReadOnlyQuoteCandidateComparison(candidates) : null;
    const decisionAssistantSummary = formatter.formatDecisionReasoning && decisionAssistant ? formatter.formatDecisionReasoning(decisionAssistant) : null;
    const candidateComparisonSummary = formatter.formatCandidateComparisonSummary && candidateComparison ? formatter.formatCandidateComparisonSummary(candidateComparison) : null;
    const workflow = workflowFields(safe);
    const auditReviewSummary = workflow.auditReviewSummary || (typeof workflowAuditApi().buildFlightWorkflowAuditReviewCenter === "function" ? workflowAuditApi().buildFlightWorkflowAuditReviewCenter(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected })) : null);
    const safeSessionExportPreview = workflow.safeSessionExportPreview || (typeof safeExportApi().buildFlightWorkflowSafeSessionExportPreview === "function" ? safeExportApi().buildFlightWorkflowSafeSessionExportPreview(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary })) : null);
    const humanReviewChecklistSummary = workflow.humanReviewChecklistSummary || safe.humanReviewChecklistSummary || (typeof humanReviewApi().buildFlightWorkflowHumanReviewChecklist === "function" ? humanReviewApi().buildFlightWorkflowHumanReviewChecklist(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary })) : null);
    const finalSafeHandoffPacketSummary = workflow.finalSafeHandoffPacketSummary || safe.finalSafeHandoffPacketSummary || (typeof finalPacketApi().buildFlightWorkflowFinalSafeHandoffPacket === "function" ? finalPacketApi().buildFlightWorkflowFinalSafeHandoffPacket(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary, humanReviewChecklistSummary:humanReviewChecklistSummary })) : null);
    const handoffPacketPolicyDecision = workflow.handoffPacketPolicyDecision || safe.handoffPacketPolicyDecision || (typeof packetPolicyApi().evaluateFlightWorkflowHandoffPacketPolicy === "function" ? packetPolicyApi().evaluateFlightWorkflowHandoffPacketPolicy({ finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary }) : null);
    const finalReviewStatus = workflow.finalReviewStatus || safe.finalReviewStatus || (handoffPacketPolicyDecision && handoffPacketPolicyDecision.status === "allowed" ? "ready" : finalSafeHandoffPacketSummary && finalSafeHandoffPacketSummary.status || "needs_review");
    const riskBadgeModel = typeof riskBadgeApi().buildFlightWorkflowRiskBadges === "function" ? riskBadgeApi().buildFlightWorkflowRiskBadges({ auditReview:auditReviewSummary, safeSessionExportPreview:safeSessionExportPreview, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, handoffPacketPolicyDecision:handoffPacketPolicyDecision, actionQueueSummary:workflow.actionQueueSummary, actionPolicyDecision:workflow.actionPolicyDecision, actionExecutionResult:workflow.actionExecutionResult, eventLedgerSummary:workflow.eventLedgerSummary, freezeGateSummary:workflow.freezeGateSummary, evidenceFreezePackSummary:workflow.evidenceFreezePackSummary, tradingBlocked:true, requiresConfirmation:true }) : null;
    const riskBadgeSummary = workflow.riskBadgeSummary || (riskBadgeModel && typeof riskBadgeApi().summarizeFlightWorkflowRiskBadges === "function" ? Object.assign({}, riskBadgeApi().summarizeFlightWorkflowRiskBadges(riskBadgeModel.badges), { badges:riskBadgeModel.badges, line:riskBadgeModel.summaryLabel || riskBadgeApi().summarizeFlightWorkflowRiskBadges(riskBadgeModel.badges).summaryLabel }) : riskBadgeModel);
    const safetyRegressionSummary = workflow.safetyRegressionSummary || safe.safetyRegressionSummary || (typeof sentinelApi().buildFlightWorkflowSafetyRegressionReport === "function" ? sentinelApi().buildFlightWorkflowSafetyRegressionReport(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary, safeSessionExportPreview:safeSessionExportPreview, freezeGateSummary:workflow.freezeGateSummary, evidenceFreezePackSummary:workflow.evidenceFreezePackSummary })) : null);
    const operatorConsoleSummary = workflow.operatorConsoleSummary || safe.operatorConsoleSummary || (typeof operatorApi().buildFlightWorkflowOperatorConsole === "function" ? operatorApi().buildFlightWorkflowOperatorConsole(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary, safeSessionExportPreview:safeSessionExportPreview, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, handoffPacketPolicyDecision:handoffPacketPolicyDecision, safetyRegressionSummary:safetyRegressionSummary, freezeGateSummary:workflow.freezeGateSummary, evidenceFreezePackSummary:workflow.evidenceFreezePackSummary })) : null);
    const operatorConsoleViewModel = workflow.operatorConsoleViewModel || safe.operatorConsoleViewModel || (typeof operatorViewModelApi().buildFlightWorkflowOperatorConsoleViewModel === "function" ? operatorViewModelApi().buildFlightWorkflowOperatorConsoleViewModel({ operatorConsoleSummary:operatorConsoleSummary }) : null);
    const pilotExitCriteriaSummary = workflow.pilotExitCriteriaSummary || safe.pilotExitCriteriaSummary || null;
    const launchCandidateReadinessSummary = workflow.launchCandidateReadinessSummary || safe.launchCandidateReadinessSummary || null;
    const scenarioSimulationSummary = workflow.scenarioSimulationSummary || safe.scenarioSimulationSummary || null;
    const safetyTestMatrixSummary = workflow.safetyTestMatrixSummary || safe.safetyTestMatrixSummary || null;
    const releaseReadinessSummary = workflow.releaseReadinessSummary || safe.releaseReadinessSummary || (typeof releaseReadinessApi().buildFlightWorkflowReleaseReadinessDashboard === "function" ? releaseReadinessApi().buildFlightWorkflowReleaseReadinessDashboard(Object.assign({}, safe, workflow, { scenarioSimulationSummary:scenarioSimulationSummary, safetyTestMatrixSummary:safetyTestMatrixSummary, auditReviewSummary:auditReviewSummary, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, safeSessionExportPreview:safeSessionExportPreview, operatorConsoleSummary:operatorConsoleSummary })) : null);
    const finalReviewBadges = workflow.finalReviewBadges || safe.finalReviewBadges || riskBadgeModel && riskBadgeModel.badges || [];
    const providerCoverageSummary = formatter.formatGlobalShoppingCoverageSummary ? formatter.formatGlobalShoppingCoverageSummary({ providerCoverageViewModelSummary:workflow.providerCoverageViewModelSummary || safe.providerCoverageViewModelSummary || null }) : null;
    return clone({
      title: "候选报价证据摘要",
      subtitle: "只读候选价 · 平台最终为准",
      routeSummary: safeText(safe.routeSummary || intent.route || ""),
      departureDate: safeText(safe.departureDate || intent.departureDate || ""),
      topCandidateCount: candidates.length,
      topCandidateSummary: topSummary,
      selectedCandidateSummary: selectedSummary,
      decisionAssistantSummary: decisionAssistantSummary,
      candidateComparisonSummary: candidateComparisonSummary,
      recommendationExplanation: decisionAssistant && decisionAssistant.reasoning || null,
      decisionSafetyWarnings: decisionAssistant && decisionAssistant.reasoning && decisionAssistant.reasoning.riskWarnings || ["平台最终为准", "未锁价", "不代表可出票", "仍需平台确认"],
      handoffChecklistSummary: stripUnsafe(safe.handoffChecklistSummary || safe.handoffChecklist || decisionAssistant && decisionAssistant.handoffChecklistSummary || null),
      handoffReceiptSummary: stripUnsafe(safe.handoffReceiptSummary || safe.handoffReceipt || decisionAssistant && decisionAssistant.handoffReceiptSummary || null),
      manualPlatformCheckSummary: stripUnsafe(safe.manualPlatformCheckSummary || safe.manualPlatformCheckEvidence || decisionAssistant && decisionAssistant.manualPlatformCheckSummary || null),
      platformCheckDeltaSummary: stripUnsafe(safe.platformCheckDeltaSummary || safe.platformCheckDelta || decisionAssistant && decisionAssistant.platformCheckDeltaSummary || null),
      reconciliationSummary: stripUnsafe(safe.reconciliationSummary || decisionAssistant && decisionAssistant.reconciliationSummary || null),
      confidenceLabelSummary: stripUnsafe(safe.confidenceLabelSummary || decisionAssistant && decisionAssistant.confidenceLabelSummary || null),
      safeNextStepSummary: stripUnsafe(safe.safeNextStepSummary || decisionAssistant && decisionAssistant.safeNextStepSummary || null),
      platformCheckOutcomeSummary: stripUnsafe(safe.platformCheckOutcomeSummary || decisionAssistant && decisionAssistant.platformCheckOutcomeSummary || null),
      workflowStateSummary: workflowFields(safe).workflowStateSummary,
      clarificationSummary: workflowFields(safe).clarificationSummary,
      continuitySummary: workflowFields(safe).continuitySummary,
      confirmationStateSummary: workflowFields(safe).confirmationStateSummary,
      recoverySummary: workflowFields(safe).recoverySummary,
      resumeCoachSummary: workflowFields(safe).resumeCoachSummary,
      currentStage: workflowFields(safe).currentStage,
      workflowStageLabel: workflowFields(safe).workflowStageLabel,
      nextStepLabel: workflowFields(safe).nextStepLabel,
      canResumeWorkflow: workflowFields(safe).canResumeWorkflow,
      resumeActions: workflowFields(safe).resumeActions,
      workflowStepList: workflowFields(safe).workflowStepList,
      missingFields: workflowFields(safe).missingFields,
      clarificationQuestions: workflowFields(safe).clarificationQuestions,
      workflowUserMessage: workflowFields(safe).workflowUserMessage,
      actionExecutionResult: workflowFields(safe).actionExecutionResult,
      actionPolicyDecision: workflowFields(safe).actionPolicyDecision,
      eventLedgerSummary: workflowFields(safe).eventLedgerSummary,
      lastActionId: workflowFields(safe).lastActionId,
      lastActionStatus: workflowFields(safe).lastActionStatus,
      lastActionMessage: workflowFields(safe).lastActionMessage,
      auditReviewSummary: auditReviewSummary ? { title:auditReviewSummary.userFacingSummary && auditReviewSummary.userFacingSummary.title || "本次机票工作流审计", line:auditReviewSummary.userFacingSummary && auditReviewSummary.userFacingSummary.resultLabel || "安全检查通过", redacted:true } : null,
      safeSessionExportPreview: safeSessionExportPreview ? { title:"脱敏会话摘要预览", line:safeSessionExportPreview.status === "ready" ? "仅预览，不写入文件" : "预览未就绪", sectionLabels:["工作流摘要", "候选证据摘要", "安全审计摘要"], canWriteFile:false, redacted:true } : null,
      riskBadgeSummary: riskBadgeSummary ? { line:riskBadgeSummary.line || riskBadgeSummary.summaryLabel || "只读安全", badgeCount:riskBadgeSummary.badgeCount || (Array.isArray(riskBadgeSummary.badges) ? riskBadgeSummary.badges.length : 0), redacted:true } : null,
      humanReviewChecklistSummary: humanReviewChecklistSummary ? { title:"前往平台前请人工复核", line:humanReviewChecklistSummary.userFacingSummary && humanReviewChecklistSummary.userFacingSummary.line || "仍需补充复核", checkedCount:(humanReviewChecklistSummary.checkedItems || []).length || 0, incompleteCount:(humanReviewChecklistSummary.incompleteItems || []).length || 0, redacted:true } : null,
      finalSafeHandoffPacketSummary: finalSafeHandoffPacketSummary ? { title:"最终安全交接包", line:finalSafeHandoffPacketSummary.userFacingSummary && finalSafeHandoffPacketSummary.userFacingSummary.line || "仍需补充复核", sectionLabels:["行程摘要", "候选证据摘要", "平台核对摘要", "安全限制摘要"], canOpenExternalPlatform:false, redacted:true } : null,
      handoffPacketPolicyDecision: handoffPacketPolicyDecision,
      finalReviewStatus: finalReviewStatus,
      finalReviewBadges: finalReviewBadges,
      safetyRegressionSummary: safetyRegressionSummary ? { title:"安全回归", line:safetyRegressionSummary.status === "pass" ? "安全回归通过" : "安全回归失败", checkCount:(safetyRegressionSummary.checks || []).length || 0, redacted:true } : null,
      operatorConsoleSummary: operatorConsoleSummary ? { title:"机票工作流运营控制台", line:operatorConsoleSummary.userFacingSummary && operatorConsoleSummary.userFacingSummary.resultLabel || "存在需要注意的项目", status:operatorConsoleSummary.status, redacted:true } : null,
      operatorConsoleViewModel: operatorConsoleViewModel,
      firstSandboxProviderConnectorSummary: workflow.firstSandboxProviderConnectorSummary || safe.firstSandboxProviderConnectorSummary ? { title:"第一个 Sandbox Provider Connector", line:workflow.firstSandboxProviderConnectorSummary && workflow.firstSandboxProviderConnectorSummary.userFacingSummary && workflow.firstSandboxProviderConnectorSummary.userFacingSummary.resultLabel || safe.firstSandboxProviderConnectorSummary && safe.firstSandboxProviderConnectorSummary.userFacingSummary && safe.firstSandboxProviderConnectorSummary.userFacingSummary.resultLabel || "Sandbox Connector 仍需复核", redacted:true } : null,
      providerCoverageDashboardSummary: workflow.providerCoverageDashboardSummary || safe.providerCoverageDashboardSummary ? { title:"Provider 覆盖看板", line:workflow.providerCoverageDashboardSummary && workflow.providerCoverageDashboardSummary.userFacingSummary && workflow.providerCoverageDashboardSummary.userFacingSummary.resultLabel || safe.providerCoverageDashboardSummary && safe.providerCoverageDashboardSummary.userFacingSummary && safe.providerCoverageDashboardSummary.userFacingSummary.resultLabel || "Provider 覆盖仍需复核", redacted:true } : null,
      readOnlySourceTrustScoreSummary: workflow.readOnlySourceTrustScoreSummary || safe.readOnlySourceTrustScoreSummary ? { title:"只读来源可信度评分", line:workflow.readOnlySourceTrustScoreSummary && workflow.readOnlySourceTrustScoreSummary.userFacingSummary && workflow.readOnlySourceTrustScoreSummary.userFacingSummary.resultLabel || safe.readOnlySourceTrustScoreSummary && safe.readOnlySourceTrustScoreSummary.userFacingSummary && safe.readOnlySourceTrustScoreSummary.userFacingSummary.resultLabel || "来源可信度仍需复核", redacted:true } : null,
      providerCoverageViewModelSummary: providerCoverageSummary,
      readOnlyProviderSandboxIntegrationGateSummary: workflow.readOnlyProviderSandboxIntegrationGateSummary || safe.readOnlyProviderSandboxIntegrationGateSummary ? { title:"只读 Provider Sandbox 接入闸门", line:workflow.readOnlyProviderSandboxIntegrationGateSummary && workflow.readOnlyProviderSandboxIntegrationGateSummary.userFacingSummary && workflow.readOnlyProviderSandboxIntegrationGateSummary.userFacingSummary.resultLabel || safe.readOnlyProviderSandboxIntegrationGateSummary && safe.readOnlyProviderSandboxIntegrationGateSummary.userFacingSummary && safe.readOnlyProviderSandboxIntegrationGateSummary.userFacingSummary.resultLabel || "只读 Provider Sandbox 接入闸门仍需复核", redacted:true } : null,
      sandboxPriceCandidateSessionSummary: workflow.sandboxPriceCandidateSessionSummary || safe.sandboxPriceCandidateSessionSummary ? { title:"Sandbox 价格候选会话", line:workflow.sandboxPriceCandidateSessionSummary && workflow.sandboxPriceCandidateSessionSummary.userFacingSummary && workflow.sandboxPriceCandidateSessionSummary.userFacingSummary.resultLabel || safe.sandboxPriceCandidateSessionSummary && safe.sandboxPriceCandidateSessionSummary.userFacingSummary && safe.sandboxPriceCandidateSessionSummary.userFacingSummary.resultLabel || "Sandbox 价格候选会话仍需复核", redacted:true } : null,
      sandboxPriceCandidateResultBoardSummary: workflow.sandboxPriceCandidateResultBoardSummary || safe.sandboxPriceCandidateResultBoardSummary ? { title:"Sandbox 价格候选结果", line:workflow.sandboxPriceCandidateResultBoardSummary && workflow.sandboxPriceCandidateResultBoardSummary.caveat || safe.sandboxPriceCandidateResultBoardSummary && safe.sandboxPriceCandidateResultBoardSummary.caveat || "当前仅展示只读 sandbox 候选结果，不代表真实价格、全网最低、最低价保证、锁价、可订、付款、下单或出票能力。", redacted:true } : null,
      firstSandboxProviderConnectorStatus: workflow.firstSandboxProviderConnectorStatus || safe.firstSandboxProviderConnectorStatus || "",
      providerCoverageStatus: workflow.providerCoverageStatus || safe.providerCoverageStatus || "",
      sourceTrustStatus: workflow.sourceTrustStatus || safe.sourceTrustStatus || "",
      providerCoverageViewModelStatus: workflow.providerCoverageViewModelStatus || safe.providerCoverageViewModelStatus || "",
      providerSandboxIntegrationGateStatus: workflow.providerSandboxIntegrationGateStatus || safe.providerSandboxIntegrationGateStatus || "",
      sandboxPriceCandidateSessionStatus: workflow.sandboxPriceCandidateSessionStatus || safe.sandboxPriceCandidateSessionStatus || "",
      sandboxPriceCandidateResultBoardStatus: workflow.sandboxPriceCandidateResultBoardStatus || safe.sandboxPriceCandidateResultBoardStatus || "",
      safeToProceedWithFirstReadOnlyProviderSandboxIntegration: workflow.safeToProceedWithFirstReadOnlyProviderSandboxIntegration === true || safe.safeToProceedWithFirstReadOnlyProviderSandboxIntegration === true,
      safeToProceedWithSandboxCandidateUserPreview: workflow.safeToProceedWithSandboxCandidateUserPreview === true || safe.safeToProceedWithSandboxCandidateUserPreview === true,
      pilotExitCriteriaSummary: pilotExitCriteriaSummary ? { title:"只读试点退出条件", line:pilotExitCriteriaSummary.userFacingSummary && pilotExitCriteriaSummary.userFacingSummary.resultLabel || "继续试点观察", redacted:true } : null,
      launchCandidateReadinessSummary: launchCandidateReadinessSummary ? { title:"只读发布候选准备板", line:launchCandidateReadinessSummary.userFacingSummary && launchCandidateReadinessSummary.userFacingSummary.resultLabel || "继续试点观察", redacted:true } : null,
      freezeGateSummary: workflow.freezeGateSummary ? { title:"只读发布候选冻结检查", line:workflow.freezeGateSummary.userFacingSummary && workflow.freezeGateSummary.userFacingSummary.resultLabel || "继续试点观察", redacted:true } : null,
      evidenceFreezePackSummary: workflow.evidenceFreezePackSummary ? { title:"证据冻结包", line:workflow.evidenceFreezePackSummary.userFacingSummary && workflow.evidenceFreezePackSummary.userFacingSummary.resultLabel || "继续试点观察", redacted:true } : null,
      rcCandidateReviewSummary: workflow.rcCandidateReviewSummary ? { title:"只读 RC 候选复核控制台", line:workflow.rcCandidateReviewSummary.userFacingSummary && workflow.rcCandidateReviewSummary.userFacingSummary.resultLabel || "证据仍需补充", redacted:true } : null,
      rcEvidenceReviewSummary: workflow.rcEvidenceReviewSummary ? { title:"只读 RC 证据复核清单", line:workflow.rcEvidenceReviewSummary.userFacingSummary && workflow.rcEvidenceReviewSummary.userFacingSummary.resultLabel || "证据仍需补充", redacted:true } : null,
      rcReviewViewModelSummary: workflow.rcReviewViewModelSummary ? { title:"只读 RC 候选复核", line:workflow.rcReviewViewModelSummary.title || "只读 RC 候选复核", redacted:true } : null,
      rcRegressionAuditSummary: workflow.rcRegressionAuditSummary ? { title:"只读 RC 回归审计包", line:workflow.rcRegressionAuditSummary.userFacingSummary && workflow.rcRegressionAuditSummary.userFacingSummary.resultLabel || "RC 回归仍需复核", redacted:true } : null,
      releaseRiskLedgerSummary: workflow.releaseRiskLedgerSummary ? { title:"只读发布风险台账", line:workflow.releaseRiskLedgerSummary.userFacingSummary && workflow.releaseRiskLedgerSummary.userFacingSummary.resultLabel || "发布风险待处理", redacted:true } : null,
      rcRegressionViewModelSummary: workflow.rcRegressionViewModelSummary ? { title:"只读 RC 回归审计", line:workflow.rcRegressionViewModelSummary.title || "只读 RC 回归审计", redacted:true } : null,
      rcCopyFinalizationSummary: workflow.rcCopyFinalizationSummary ? { title:"只读 RC 用户可见文案定稿", line:workflow.rcCopyFinalizationSummary.userFacingSummary && workflow.rcCopyFinalizationSummary.userFacingSummary.resultLabel || "RC 文案仍需复核", redacted:true } : null,
      safetyDisclosureReviewSummary: workflow.safetyDisclosureReviewSummary ? { title:"安全披露复核板", line:workflow.safetyDisclosureReviewSummary.userFacingSummary && workflow.safetyDisclosureReviewSummary.userFacingSummary.resultLabel || "安全披露仍需复核", redacted:true } : null,
      rcCopyReviewViewModelSummary: workflow.rcCopyReviewViewModelSummary ? { title:"只读 RC 文案定稿与安全披露", line:workflow.rcCopyReviewViewModelSummary.title || "只读 RC 文案定稿与安全披露", redacted:true } : null,
      globalShoppingProductGoalSummary: workflow.globalShoppingProductGoalSummary ? { title:"全球购产品目标", line:workflow.globalShoppingProductGoalSummary.userFacingSummary && workflow.globalShoppingProductGoalSummary.userFacingSummary.resultLabel || "产品目标仍需复核", redacted:true } : null,
      jumpToPlatformBoundarySummary: workflow.jumpToPlatformBoundarySummary ? { title:"跳转至平台自行下单边界", line:workflow.jumpToPlatformBoundarySummary.userFacingSummary && workflow.jumpToPlatformBoundarySummary.userFacingSummary.resultLabel || "跳转边界仍需复核", redacted:true } : null,
      globalShoppingProductGoalViewModelSummary: workflow.globalShoppingProductGoalViewModelSummary ? { title:"全球购产品目标与跳转边界", line:workflow.globalShoppingProductGoalViewModelSummary.title || "全球购产品目标与跳转边界", redacted:true } : null,
      readOnlyProviderSandboxConnectorSummary: workflow.readOnlyProviderSandboxConnectorSummary ? { title:"只读 Provider Sandbox Connector", line:workflow.readOnlyProviderSandboxConnectorSummary.userFacingSummary && workflow.readOnlyProviderSandboxConnectorSummary.userFacingSummary.resultLabel || "只读 Provider Connector 仍需复核", redacted:true } : null,
      fixtureReplayConsoleSummary: workflow.fixtureReplayConsoleSummary ? { title:"Fixture 回放控制台", line:workflow.fixtureReplayConsoleSummary.userFacingSummary && workflow.fixtureReplayConsoleSummary.userFacingSummary.resultLabel || "Fixture 回放仍需复核", redacted:true } : null,
      normalizedPriceCandidateBoardSummary: workflow.normalizedPriceCandidateBoardSummary ? { title:"归一化价格候选板", line:workflow.normalizedPriceCandidateBoardSummary.caveat || "当前仅展示只读 fixture/sandbox 归一化候选", redacted:true } : null,
      realProviderSandboxGateSummary: workflow.realProviderSandboxGateSummary ? { title:"真实只读 Provider Sandbox 闸门", line:workflow.realProviderSandboxGateSummary.userFacingSummary && workflow.realProviderSandboxGateSummary.userFacingSummary.resultLabel || "仍需复核", redacted:true } : null,
      providerRequestEnvelopeSummary: workflow.providerRequestEnvelopeSummary ? { title:"Provider 请求封装", line:workflow.providerRequestEnvelopeSummary.userFacingSummary && workflow.providerRequestEnvelopeSummary.userFacingSummary.resultLabel || "仍需复核", redacted:true } : null,
      providerCallAuditLedgerSummary: workflow.providerCallAuditLedgerSummary ? { title:"Provider 调用审计台账", line:workflow.providerCallAuditLedgerSummary.userFacingSummary && workflow.providerCallAuditLedgerSummary.userFacingSummary.resultLabel || "仍需复核", redacted:true } : null,
      providerSandboxReadinessViewModelSummary: workflow.providerSandboxReadinessViewModelSummary ? { title:"真实只读 Provider Sandbox 准备", line:workflow.providerSandboxReadinessViewModelSummary.title || "真实只读 Provider Sandbox 准备", redacted:true } : null,
      providerSandboxDryRunHarnessSummary: workflow.providerSandboxDryRunHarnessSummary ? { title:"Provider Sandbox 干跑框架", line:workflow.providerSandboxDryRunHarnessSummary.userFacingSummary && workflow.providerSandboxDryRunHarnessSummary.userFacingSummary.resultLabel || "Provider Sandbox 干跑框架仍需复核", redacted:true } : null,
      firstReadOnlyProviderAdapterShellSummary: workflow.firstReadOnlyProviderAdapterShellSummary ? { title:"第一个只读 Provider Adapter 外壳", line:workflow.firstReadOnlyProviderAdapterShellSummary.userFacingSummary && workflow.firstReadOnlyProviderAdapterShellSummary.userFacingSummary.resultLabel || "Adapter 外壳仍需复核", redacted:true } : null,
      providerSandboxSafetyKillSwitchSummary: workflow.providerSandboxSafetyKillSwitchSummary ? { title:"Provider Sandbox 安全熔断器", line:workflow.providerSandboxSafetyKillSwitchSummary.userFacingSummary && workflow.providerSandboxSafetyKillSwitchSummary.userFacingSummary.resultLabel || "安全熔断器仍需复核", redacted:true } : null,
      providerSandboxDryRunViewModelSummary: workflow.providerSandboxDryRunViewModelSummary ? { title:"Provider Sandbox 干跑准备", line:workflow.providerSandboxDryRunViewModelSummary.title || "Provider Sandbox 干跑准备", redacted:true } : null,
      providerAdapterRegistrySummary: workflow.providerAdapterRegistrySummary ? { title:"Provider Adapter 注册表", line:workflow.providerAdapterRegistrySummary.userFacingSummary && workflow.providerAdapterRegistrySummary.userFacingSummary.resultLabel || "Adapter 注册表仍需复核", redacted:true } : null,
      dryRunProviderResponseNormalizerSummary: workflow.dryRunProviderResponseNormalizerSummary ? { title:"Dry-Run Provider 响应归一化器", line:workflow.dryRunProviderResponseNormalizerSummary.userFacingSummary && workflow.dryRunProviderResponseNormalizerSummary.userFacingSummary.resultLabel || "响应归一化仍需复核", redacted:true } : null,
      sandboxProviderRunbookSummary: workflow.sandboxProviderRunbookSummary ? { title:"Sandbox Provider 接入运行手册", line:workflow.sandboxProviderRunbookSummary.userFacingSummary && workflow.sandboxProviderRunbookSummary.userFacingSummary.resultLabel || "接入手册仍需复核", redacted:true } : null,
      providerAdapterRegistryViewModelSummary: workflow.providerAdapterRegistryViewModelSummary ? { title:"Provider Adapter 注册与接入手册", line:workflow.providerAdapterRegistryViewModelSummary.title || "Provider Adapter 注册与接入手册", redacted:true } : null,
      legalProviderFixtureSummary: workflow.legalProviderFixtureSummary ? { title:"合法 Provider Fixture 适配器", line:workflow.legalProviderFixtureSummary.userFacingSummary && workflow.legalProviderFixtureSummary.userFacingSummary.resultLabel || "Provider fixture 仍需复核", redacted:true } : null,
      providerCredentialSafetySummary: workflow.providerCredentialSafetySummary ? { title:"Provider 凭据安全复核", line:workflow.providerCredentialSafetySummary.userFacingSummary && workflow.providerCredentialSafetySummary.userFacingSummary.resultLabel || "Provider 凭据边界仍需复核", redacted:true } : null,
      sandboxPriceFeedSummary: workflow.sandboxPriceFeedSummary ? { title:"Sandbox 价格 Feed 闸门", line:workflow.sandboxPriceFeedSummary.userFacingSummary && workflow.sandboxPriceFeedSummary.userFacingSummary.resultLabel || "Sandbox 价格 Feed 仍需复核", redacted:true } : null,
      sandboxProviderResponseContractSummary: workflow.sandboxProviderResponseContractSummary ? { title:"Sandbox Provider 响应合同", line:workflow.sandboxProviderResponseContractSummary.userFacingSummary && workflow.sandboxProviderResponseContractSummary.userFacingSummary.resultLabel || "Provider 响应合同仍需复核", redacted:true } : null,
      pricePipelineOrchestratorSummary: workflow.pricePipelineOrchestratorSummary ? { title:"全球购只读价格流水线", line:workflow.pricePipelineOrchestratorSummary.userFacingSummary && workflow.pricePipelineOrchestratorSummary.userFacingSummary.resultLabel || "只读价格流水线仍需复核", redacted:true } : null,
      readOnlyCandidateJourneySummary: workflow.readOnlyCandidateJourneySummary ? { title:"全球购只读候选旅程", line:workflow.readOnlyCandidateJourneySummary.userFacingSummary && workflow.readOnlyCandidateJourneySummary.userFacingSummary.resultLabel || "全球购只读候选旅程仍需复核", redacted:true } : null,
      providerFixtureViewModelSummary: workflow.providerFixtureViewModelSummary ? { title:"合法 Provider Fixture 与 Sandbox 价格 Feed", line:workflow.providerFixtureViewModelSummary.title || "合法 Provider Fixture 与 Sandbox 价格 Feed", redacted:true } : null,
      priceSourceNormalizationSummary: workflow.priceSourceNormalizationSummary ? { title:"价格源归一化层", line:workflow.priceSourceNormalizationSummary.userFacingSummary && workflow.priceSourceNormalizationSummary.userFacingSummary.resultLabel || "价格归一化仍需复核", redacted:true } : null,
      officialPriceAnchorSummary: workflow.officialPriceAnchorSummary ? { title:"官方价格锚点", line:workflow.officialPriceAnchorSummary.userFacingSummary && workflow.officialPriceAnchorSummary.userFacingSummary.resultLabel || "官方价仍需复核", redacted:true } : null,
      priceCandidateDisplaySummary: workflow.priceCandidateDisplaySummary ? { title:"全球购价格候选展示", line:workflow.priceCandidateDisplaySummary.caveat || "当前仅展示只读 fixture 候选价", redacted:true } : null,
      sameItemMatcherSummary: workflow.sameItemMatcherSummary ? { title:"同款候选识别", line:workflow.sameItemMatcherSummary.userFacingSummary && workflow.sameItemMatcherSummary.userFacingSummary.resultLabel || "同款识别仍需复核", redacted:true } : null,
      duplicateCandidateMergerSummary: workflow.duplicateCandidateMergerSummary ? { title:"重复候选合并", line:workflow.duplicateCandidateMergerSummary.userFacingSummary && workflow.duplicateCandidateMergerSummary.userFacingSummary.resultLabel || "重复候选仍需复核", redacted:true } : null,
      coveredLowestCandidateBoardSummary: workflow.coveredLowestCandidateBoardSummary ? { title:"已覆盖来源候选价合并", line:workflow.coveredLowestCandidateBoardSummary.caveat || "当前仅比较已覆盖来源中的候选价", redacted:true } : null,
      externalDeepLinkSafetySummary: workflow.externalDeepLinkSafetySummary ? { title:"外部平台跳转安全闸门", line:workflow.externalDeepLinkSafetySummary.userFacingSummary && workflow.externalDeepLinkSafetySummary.userFacingSummary.resultLabel || "跳转安全仍需复核", redacted:true } : null,
      searchParameterPrefillSummary: workflow.searchParameterPrefillSummary ? { title:"搜索参数预填闸门", line:workflow.searchParameterPrefillSummary.userFacingSummary && workflow.searchParameterPrefillSummary.userFacingSummary.resultLabel || "预填边界仍需复核", redacted:true } : null,
      jumpToPlatformHandoffPreviewSummary: workflow.jumpToPlatformHandoffPreviewSummary ? { title:"跳转至平台查看", line:workflow.jumpToPlatformHandoffPreviewSummary.caveat || "本轮仅展示只读跳转预览，不打开真实平台", redacted:true } : null,
      sandboxDeepLinkCandidateSummary: workflow.sandboxDeepLinkCandidateSummary ? { title:"Sandbox 跳转候选", line:workflow.sandboxDeepLinkCandidateSummary.userFacingSummary && workflow.sandboxDeepLinkCandidateSummary.userFacingSummary.resultLabel || "Sandbox 跳转候选仍需复核", redacted:true } : null,
      platformAvailabilitySummary: workflow.platformAvailabilitySummary ? { title:"平台可用性", line:workflow.platformAvailabilitySummary.userFacingSummary && workflow.platformAvailabilitySummary.userFacingSummary.resultLabel || "平台可用性仍需复核", redacted:true } : null,
      partnerLinkPolicySummary: workflow.partnerLinkPolicySummary ? { title:"合作/联盟链接政策", line:workflow.partnerLinkPolicySummary.userFacingSummary && workflow.partnerLinkPolicySummary.userFacingSummary.resultLabel || "合作链接政策仍需复核", redacted:true } : null,
      sandboxHandoffViewModelSummary: workflow.sandboxHandoffViewModelSummary ? { title:"Sandbox 跳转候选与平台可用性", line:workflow.sandboxHandoffViewModelSummary.title || "Sandbox 跳转候选与平台可用性", redacted:true } : null,
      rcReviewStatus: workflow.rcReviewStatus || safe.rcReviewStatus || "",
      rcEvidenceStatus: workflow.rcEvidenceStatus || safe.rcEvidenceStatus || "",
      rcRegressionStatus: workflow.rcRegressionStatus || safe.rcRegressionStatus || "",
      releaseRiskStatus: workflow.releaseRiskStatus || safe.releaseRiskStatus || "",
      rcCopyReviewStatus: workflow.rcCopyReviewStatus || safe.rcCopyReviewStatus || "",
      safetyDisclosureStatus: workflow.safetyDisclosureStatus || safe.safetyDisclosureStatus || "",
      safeToStartRcReview: workflow.safeToStartRcReview === true || safe.safeToStartRcReview === true,
      safeToContinueReleaseCandidate: workflow.safeToContinueReleaseCandidate === true || safe.safeToContinueReleaseCandidate === true,
      safeToFinalizeUserFacingCopy: workflow.safeToFinalizeUserFacingCopy === true || safe.safeToFinalizeUserFacingCopy === true,
      globalShoppingGoalStatus: workflow.globalShoppingGoalStatus || safe.globalShoppingGoalStatus || "",
      jumpBoundaryStatus: workflow.jumpBoundaryStatus || safe.jumpBoundaryStatus || "",
      safeToProceedWithJumpToPlatformMvp: workflow.safeToProceedWithJumpToPlatformMvp === true || safe.safeToProceedWithJumpToPlatformMvp === true,
      readOnlyProviderSandboxConnectorStatus: workflow.readOnlyProviderSandboxConnectorStatus || safe.readOnlyProviderSandboxConnectorStatus || "",
      fixtureReplayStatus: workflow.fixtureReplayStatus || safe.fixtureReplayStatus || "",
      normalizedPriceCandidateBoardStatus: workflow.normalizedPriceCandidateBoardStatus || safe.normalizedPriceCandidateBoardStatus || "",
      realProviderSandboxGateStatus: workflow.realProviderSandboxGateStatus || safe.realProviderSandboxGateStatus || "",
      providerRequestEnvelopeStatus: workflow.providerRequestEnvelopeStatus || safe.providerRequestEnvelopeStatus || "",
      providerCallAuditLedgerStatus: workflow.providerCallAuditLedgerStatus || safe.providerCallAuditLedgerStatus || "",
      providerSandboxReadinessStatus: workflow.providerSandboxReadinessStatus || safe.providerSandboxReadinessStatus || "",
      priceNormalizationStatus: workflow.priceNormalizationStatus || safe.priceNormalizationStatus || "",
      officialPriceAnchorStatus: workflow.officialPriceAnchorStatus || safe.officialPriceAnchorStatus || "",
      priceCandidateDisplayStatus: workflow.priceCandidateDisplayStatus || safe.priceCandidateDisplayStatus || "",
      sameItemMatcherStatus: workflow.sameItemMatcherStatus || safe.sameItemMatcherStatus || "",
      duplicateMergeStatus: workflow.duplicateMergeStatus || safe.duplicateMergeStatus || "",
      coveredLowestStatus: workflow.coveredLowestStatus || safe.coveredLowestStatus || "",
      legalProviderFixtureStatus: workflow.legalProviderFixtureStatus || safe.legalProviderFixtureStatus || "",
      providerCredentialSafetyStatus: workflow.providerCredentialSafetyStatus || safe.providerCredentialSafetyStatus || "",
      sandboxPriceFeedStatus: workflow.sandboxPriceFeedStatus || safe.sandboxPriceFeedStatus || "",
      sandboxProviderResponseContractStatus: workflow.sandboxProviderResponseContractStatus || safe.sandboxProviderResponseContractStatus || "",
      pricePipelineStatus: workflow.pricePipelineStatus || safe.pricePipelineStatus || "",
      readOnlyCandidateJourneyStatus: workflow.readOnlyCandidateJourneyStatus || safe.readOnlyCandidateJourneyStatus || "",
      providerSandboxDryRunStatus: workflow.providerSandboxDryRunStatus || safe.providerSandboxDryRunStatus || "",
      providerAdapterShellStatus: workflow.providerAdapterShellStatus || safe.providerAdapterShellStatus || "",
      providerKillSwitchStatus: workflow.providerKillSwitchStatus || safe.providerKillSwitchStatus || "",
      providerSandboxDryRunViewModelStatus: workflow.providerSandboxDryRunViewModelStatus || safe.providerSandboxDryRunViewModelStatus || "",
      providerAdapterRegistryStatus: workflow.providerAdapterRegistryStatus || safe.providerAdapterRegistryStatus || "",
      dryRunResponseNormalizerStatus: workflow.dryRunResponseNormalizerStatus || safe.dryRunResponseNormalizerStatus || "",
      sandboxProviderRunbookStatus: workflow.sandboxProviderRunbookStatus || safe.sandboxProviderRunbookStatus || "",
      providerAdapterRegistryViewModelStatus: workflow.providerAdapterRegistryViewModelStatus || safe.providerAdapterRegistryViewModelStatus || "",
      safeToProceedWithFirstRealReadOnlyProviderSandbox: workflow.safeToProceedWithFirstRealReadOnlyProviderSandbox === true || safe.safeToProceedWithFirstRealReadOnlyProviderSandbox === true,
      safeToProceedWithFirstReadOnlySandboxDryRun: workflow.safeToProceedWithFirstReadOnlySandboxDryRun === true || safe.safeToProceedWithFirstReadOnlySandboxDryRun === true,
      externalDeepLinkSafetyStatus: workflow.externalDeepLinkSafetyStatus || safe.externalDeepLinkSafetyStatus || "",
      searchPrefillStatus: workflow.searchPrefillStatus || safe.searchPrefillStatus || "",
      handoffPreviewStatus: workflow.handoffPreviewStatus || safe.handoffPreviewStatus || "",
      sandboxDeepLinkStatus: workflow.sandboxDeepLinkStatus || safe.sandboxDeepLinkStatus || "",
      platformAvailabilityStatus: workflow.platformAvailabilityStatus || safe.platformAvailabilityStatus || "",
      partnerLinkPolicyStatus: workflow.partnerLinkPolicyStatus || safe.partnerLinkPolicyStatus || "",
      sandboxHandoffStatus: workflow.sandboxHandoffStatus || safe.sandboxHandoffStatus || "",
      safeToProceedWithPriceProviderSandbox: workflow.safeToProceedWithPriceProviderSandbox === true || safe.safeToProceedWithPriceProviderSandbox === true,
      safeToProceedWithReadOnlyPriceProviderSandbox: workflow.safeToProceedWithReadOnlyPriceProviderSandbox === true || safe.safeToProceedWithReadOnlyPriceProviderSandbox === true,
      safeToProceedWithFirstProviderSandboxFixtureDryRun: workflow.safeToProceedWithFirstProviderSandboxFixtureDryRun === true || safe.safeToProceedWithFirstProviderSandboxFixtureDryRun === true,
      safeToProceedWithFirstSandboxProviderConnectorImplementation: workflow.safeToProceedWithFirstSandboxProviderConnectorImplementation === true || safe.safeToProceedWithFirstSandboxProviderConnectorImplementation === true,
      safeToProceedWithDeepLinkSafetyGate: workflow.safeToProceedWithDeepLinkSafetyGate === true || safe.safeToProceedWithDeepLinkSafetyGate === true,
      safeToProceedWithSandboxDeepLinkCandidate: workflow.safeToProceedWithSandboxDeepLinkCandidate === true || safe.safeToProceedWithSandboxDeepLinkCandidate === true,
      safeToProceedWithPartnerFixtureAdapter: workflow.safeToProceedWithPartnerFixtureAdapter === true || safe.safeToProceedWithPartnerFixtureAdapter === true,
      safeToProceedWithRealReadOnlyProviderSandbox: workflow.safeToProceedWithRealReadOnlyProviderSandbox === true || safe.safeToProceedWithRealReadOnlyProviderSandbox === true,
      launchCandidateStatus: workflow.launchCandidateStatus || safe.launchCandidateStatus || "",
      readyForLaunchCandidate: workflow.readyForLaunchCandidate === true || safe.readyForLaunchCandidate === true,
      launchCandidateNextStep: workflow.launchCandidateNextStep || safe.launchCandidateNextStep || "",
      pilotOnboardingSummary: workflow.pilotOnboardingSummary,
      readOnlyConsentSummary: workflow.readOnlyConsentSummary,
      pilotOnboardingViewModel: workflow.pilotOnboardingViewModel,
      pilotEntryStatus: workflow.pilotEntryStatus,
      canEnterReadOnlyPilot: workflow.canEnterReadOnlyPilot === true,
      pilotConsentRequired: workflow.pilotConsentRequired === true,
      scenarioSimulationSummary: scenarioSimulationSummary,
      safetyTestMatrixSummary: safetyTestMatrixSummary,
      platformCheckWarnings: stripUnsafe(decisionAssistant && decisionAssistant.platformCheckWarnings || (safe.manualPlatformCheckEvidence ? ["平台核对结果已记录", "平台最终为准"] : ["仍需平台确认"])),
      workflowStateSummary: workflowFields(safe).workflowStateSummary,
      clarificationSummary: workflowFields(safe).clarificationSummary,
      continuitySummary: workflowFields(safe).continuitySummary,
      confirmationStateSummary: workflowFields(safe).confirmationStateSummary,
      recoverySummary: workflowFields(safe).recoverySummary,
      resumeCoachSummary: workflowFields(safe).resumeCoachSummary,
      currentStage: workflowFields(safe).currentStage,
      workflowStageLabel: workflowFields(safe).workflowStageLabel,
      nextStepLabel: workflowFields(safe).nextStepLabel,
      canResumeWorkflow: workflowFields(safe).canResumeWorkflow,
      resumeActions: workflowFields(safe).resumeActions,
      workflowStepList: workflowFields(safe).workflowStepList,
      missingFields: workflowFields(safe).missingFields,
      clarificationQuestions: workflowFields(safe).clarificationQuestions,
      workflowUserMessage: workflowFields(safe).workflowUserMessage,
      actionExecutionResult: workflowFields(safe).actionExecutionResult,
      actionPolicyDecision: workflowFields(safe).actionPolicyDecision,
      eventLedgerSummary: workflowFields(safe).eventLedgerSummary,
      lastActionId: workflowFields(safe).lastActionId,
      lastActionStatus: workflowFields(safe).lastActionStatus,
      lastActionMessage: workflowFields(safe).lastActionMessage,
      labels: ["只读候选价", "平台最终为准", "未锁价", "不代表可出票"],
      caveat: "价格、库存、税费和规则以平台页面为准。唯珊不会付款、不会下单、不会上传证件或银行卡。",
      canClaimLowestAcrossWeb: false,
      canClaimFinalBookablePrice: false,
      canReplaceMainResultCard: false,
      redacted: true
    });
  }

  function buildSafetyQuoteEvidenceReport(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    const summary = resolveSessionSummary(safe);
    const auditPreview = safe.auditExportPreview ;
    const candidates = safeCandidates(safe);
    const selected = safe.selectedCandidate || summary && summary.selection || null;
    const decisionAssistant = typeof decisionApi().buildReadOnlyQuoteDecisionAssistant === "function" ? decisionApi().buildReadOnlyQuoteDecisionAssistant(Object.assign({}, safe, { topCandidates:candidates, selectedCandidate:selected })) : null;
    const candidateComparison = typeof comparisonApi().buildReadOnlyQuoteCandidateComparison === "function" ? comparisonApi().buildReadOnlyQuoteCandidateComparison(candidates) : null;
    const workflow = workflowFields(safe);
    const auditReviewSummary = workflow.auditReviewSummary || (typeof workflowAuditApi().buildFlightWorkflowAuditReviewCenter === "function" ? workflowAuditApi().buildFlightWorkflowAuditReviewCenter(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected })) : null);
    const safeSessionExportPreview = workflow.safeSessionExportPreview || (typeof safeExportApi().buildFlightWorkflowSafeSessionExportPreview === "function" ? safeExportApi().buildFlightWorkflowSafeSessionExportPreview(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary })) : null);
    const humanReviewChecklistSummary = workflow.humanReviewChecklistSummary || safe.humanReviewChecklistSummary || (typeof humanReviewApi().buildFlightWorkflowHumanReviewChecklist === "function" ? humanReviewApi().buildFlightWorkflowHumanReviewChecklist(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary })) : null);
    const finalSafeHandoffPacketSummary = workflow.finalSafeHandoffPacketSummary || safe.finalSafeHandoffPacketSummary || (typeof finalPacketApi().buildFlightWorkflowFinalSafeHandoffPacket === "function" ? finalPacketApi().buildFlightWorkflowFinalSafeHandoffPacket(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary, humanReviewChecklistSummary:humanReviewChecklistSummary })) : null);
    const handoffPacketPolicyDecision = workflow.handoffPacketPolicyDecision || safe.handoffPacketPolicyDecision || (typeof packetPolicyApi().evaluateFlightWorkflowHandoffPacketPolicy === "function" ? packetPolicyApi().evaluateFlightWorkflowHandoffPacketPolicy({ finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary }) : null);
    const finalReviewStatus = workflow.finalReviewStatus || safe.finalReviewStatus || (handoffPacketPolicyDecision && handoffPacketPolicyDecision.status === "allowed" ? "ready" : finalSafeHandoffPacketSummary && finalSafeHandoffPacketSummary.status || "needs_review");
    const riskBadgeModel = typeof riskBadgeApi().buildFlightWorkflowRiskBadges === "function" ? riskBadgeApi().buildFlightWorkflowRiskBadges({ auditReview:auditReviewSummary, safeSessionExportPreview:safeSessionExportPreview, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, handoffPacketPolicyDecision:handoffPacketPolicyDecision, actionQueueSummary:workflow.actionQueueSummary, actionPolicyDecision:workflow.actionPolicyDecision, actionExecutionResult:workflow.actionExecutionResult, eventLedgerSummary:workflow.eventLedgerSummary, tradingBlocked:true, requiresConfirmation:true }) : null;
    const riskBadgeSummary = workflow.riskBadgeSummary || (riskBadgeModel && typeof riskBadgeApi().summarizeFlightWorkflowRiskBadges === "function" ? Object.assign({}, riskBadgeApi().summarizeFlightWorkflowRiskBadges(riskBadgeModel.badges), { badges:riskBadgeModel.badges, line:riskBadgeModel.summaryLabel || riskBadgeApi().summarizeFlightWorkflowRiskBadges(riskBadgeModel.badges).summaryLabel }) : riskBadgeModel);
    const safetyRegressionSummary = workflow.safetyRegressionSummary || safe.safetyRegressionSummary || (typeof sentinelApi().buildFlightWorkflowSafetyRegressionReport === "function" ? sentinelApi().buildFlightWorkflowSafetyRegressionReport(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary, safeSessionExportPreview:safeSessionExportPreview })) : null);
    const operatorConsoleSummary = workflow.operatorConsoleSummary || safe.operatorConsoleSummary || (typeof operatorApi().buildFlightWorkflowOperatorConsole === "function" ? operatorApi().buildFlightWorkflowOperatorConsole(Object.assign({}, safe, workflow, { topCandidates:candidates, selectedCandidate:selected, auditReviewSummary:auditReviewSummary, safeSessionExportPreview:safeSessionExportPreview, humanReviewChecklistSummary:humanReviewChecklistSummary, finalSafeHandoffPacketSummary:finalSafeHandoffPacketSummary, handoffPacketPolicyDecision:handoffPacketPolicyDecision, safetyRegressionSummary:safetyRegressionSummary })) : null);
    const operatorConsoleViewModel = workflow.operatorConsoleViewModel || safe.operatorConsoleViewModel || (typeof operatorViewModelApi().buildFlightWorkflowOperatorConsoleViewModel === "function" ? operatorViewModelApi().buildFlightWorkflowOperatorConsoleViewModel({ operatorConsoleSummary:operatorConsoleSummary }) : null);
    const finalReviewBadges = workflow.finalReviewBadges || safe.finalReviewBadges || riskBadgeModel && riskBadgeModel.badges || [];
    return clone({
      sessionSummary: summary,
      auditExportPreview: stripUnsafe(auditPreview),
      historySummary: stripUnsafe(safe.runHistorySummary || safe.historySummary || summary && summary.history || null),
      deltaSummary: stripUnsafe(safe.quoteDeltaSummary || safe.deltaSummary || summary && summary.deltaCompare || null),
      replaySummary: stripUnsafe(safe.replaySummary || summary && summary.replay || null),
      decisionAssistantSummary: stripUnsafe(decisionAssistant ? { assistantName:decisionAssistant.assistantName, appVersion:decisionAssistant.appVersion, status:decisionAssistant.status, recommendationType:decisionAssistant.recommendationType, recommendedCandidate:decisionAssistant.recommendedCandidate, actions:decisionAssistant.actions, safety:decisionAssistant.safety, handoffChecklistSummary:decisionAssistant.handoffChecklistSummary || null, handoffReceiptSummary:decisionAssistant.handoffReceiptSummary || null, manualPlatformCheckSummary:decisionAssistant.manualPlatformCheckSummary || null, platformCheckDeltaSummary:decisionAssistant.platformCheckDeltaSummary || null, reconciliationSummary:decisionAssistant.reconciliationSummary || null, confidenceLabelSummary:decisionAssistant.confidenceLabelSummary || null, safeNextStepSummary:decisionAssistant.safeNextStepSummary || null, platformCheckOutcomeSummary:decisionAssistant.platformCheckOutcomeSummary || null, continuitySummary:decisionAssistant.continuitySummary || null, confirmationStateSummary:decisionAssistant.confirmationStateSummary || null, recoverySummary:decisionAssistant.recoverySummary || null, resumeCoachSummary:decisionAssistant.resumeCoachSummary || null, currentStage:decisionAssistant.currentStage || "", workflowStageLabel:decisionAssistant.workflowStageLabel || "", nextStepLabel:decisionAssistant.nextStepLabel || "", canResumeWorkflow:decisionAssistant.canResumeWorkflow === true, resumeActions:decisionAssistant.resumeActions || [], redacted:true } : null),
      candidateComparisonSummary: stripUnsafe(candidateComparison ? { explainerName:candidateComparison.explainerName, appVersion:candidateComparison.appVersion, status:candidateComparison.status, table:candidateComparison.table, summary:candidateComparison.summary, forbiddenClaims:candidateComparison.forbiddenClaims, redacted:true } : null),
      recommendationExplanation: stripUnsafe(decisionAssistant && decisionAssistant.reasoning || null),
      decisionSafetyWarnings: decisionAssistant && decisionAssistant.reasoning && Array.isArray(decisionAssistant.reasoning.riskWarnings) ? decisionAssistant.reasoning.riskWarnings.slice(0, 6) : ["平台最终为准", "未锁价", "不代表可出票"],
      reconciliationSummary: stripUnsafe(safe.reconciliationSummary || decisionAssistant && decisionAssistant.reconciliationSummary || null),
      confidenceLabelSummary: stripUnsafe(safe.confidenceLabelSummary || decisionAssistant && decisionAssistant.confidenceLabelSummary || null),
      safeNextStepSummary: stripUnsafe(safe.safeNextStepSummary || decisionAssistant && decisionAssistant.safeNextStepSummary || null),
      platformCheckOutcomeSummary: stripUnsafe(safe.platformCheckOutcomeSummary || decisionAssistant && decisionAssistant.platformCheckOutcomeSummary || null),
      workflowStateSummary: workflowFields(safe).workflowStateSummary,
      clarificationSummary: workflowFields(safe).clarificationSummary,
      continuitySummary: workflowFields(safe).continuitySummary,
      confirmationStateSummary: workflowFields(safe).confirmationStateSummary,
      recoverySummary: workflowFields(safe).recoverySummary,
      resumeCoachSummary: workflowFields(safe).resumeCoachSummary,
      currentStage: workflowFields(safe).currentStage,
      workflowStageLabel: workflowFields(safe).workflowStageLabel,
      nextStepLabel: workflowFields(safe).nextStepLabel,
      canResumeWorkflow: workflowFields(safe).canResumeWorkflow,
      resumeActions: workflowFields(safe).resumeActions,
      workflowStepList: workflowFields(safe).workflowStepList,
      missingFields: workflowFields(safe).missingFields,
      clarificationQuestions: workflowFields(safe).clarificationQuestions,
      workflowUserMessage: workflowFields(safe).workflowUserMessage,
      actionExecutionResult: workflowFields(safe).actionExecutionResult,
      actionPolicyDecision: workflowFields(safe).actionPolicyDecision,
      eventLedgerSummary: workflowFields(safe).eventLedgerSummary,
      lastActionId: workflowFields(safe).lastActionId,
      lastActionStatus: workflowFields(safe).lastActionStatus,
      lastActionMessage: workflowFields(safe).lastActionMessage,
      auditReviewSummary: auditReviewSummary,
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
      rcCandidateReviewSummary: workflow.rcCandidateReviewSummary || safe.rcCandidateReviewSummary || null,
      rcEvidenceReviewSummary: workflow.rcEvidenceReviewSummary || safe.rcEvidenceReviewSummary || null,
      rcReviewViewModelSummary: workflow.rcReviewViewModelSummary || safe.rcReviewViewModelSummary || null,
      rcRegressionAuditSummary: workflow.rcRegressionAuditSummary || safe.rcRegressionAuditSummary || null,
      releaseRiskLedgerSummary: workflow.releaseRiskLedgerSummary || safe.releaseRiskLedgerSummary || null,
      rcRegressionViewModelSummary: workflow.rcRegressionViewModelSummary || safe.rcRegressionViewModelSummary || null,
      rcCopyFinalizationSummary: workflow.rcCopyFinalizationSummary || safe.rcCopyFinalizationSummary || null,
      safetyDisclosureReviewSummary: workflow.safetyDisclosureReviewSummary || safe.safetyDisclosureReviewSummary || null,
      rcCopyReviewViewModelSummary: workflow.rcCopyReviewViewModelSummary || safe.rcCopyReviewViewModelSummary || null,
      firstSandboxProviderConnectorSummary: workflow.firstSandboxProviderConnectorSummary || safe.firstSandboxProviderConnectorSummary || null,
      providerCoverageDashboardSummary: workflow.providerCoverageDashboardSummary || safe.providerCoverageDashboardSummary || null,
      readOnlySourceTrustScoreSummary: workflow.readOnlySourceTrustScoreSummary || safe.readOnlySourceTrustScoreSummary || null,
      providerCoverageViewModelSummary: workflow.providerCoverageViewModelSummary || safe.providerCoverageViewModelSummary || null,
      readOnlyProviderSandboxIntegrationGateSummary: workflow.readOnlyProviderSandboxIntegrationGateSummary || safe.readOnlyProviderSandboxIntegrationGateSummary || null,
      sandboxPriceCandidateSessionSummary: workflow.sandboxPriceCandidateSessionSummary || safe.sandboxPriceCandidateSessionSummary || null,
      sandboxPriceCandidateResultBoardSummary: workflow.sandboxPriceCandidateResultBoardSummary || safe.sandboxPriceCandidateResultBoardSummary || null,
      rcReviewStatus: workflow.rcReviewStatus || safe.rcReviewStatus || "",
      rcEvidenceStatus: workflow.rcEvidenceStatus || safe.rcEvidenceStatus || "",
      rcRegressionStatus: workflow.rcRegressionStatus || safe.rcRegressionStatus || "",
      releaseRiskStatus: workflow.releaseRiskStatus || safe.releaseRiskStatus || "",
      rcCopyReviewStatus: workflow.rcCopyReviewStatus || safe.rcCopyReviewStatus || "",
      safetyDisclosureStatus: workflow.safetyDisclosureStatus || safe.safetyDisclosureStatus || "",
      safeToStartRcReview: workflow.safeToStartRcReview === true || safe.safeToStartRcReview === true,
      safeToContinueReleaseCandidate: workflow.safeToContinueReleaseCandidate === true || safe.safeToContinueReleaseCandidate === true,
      safeToFinalizeUserFacingCopy: workflow.safeToFinalizeUserFacingCopy === true || safe.safeToFinalizeUserFacingCopy === true,
      firstSandboxProviderConnectorStatus: workflow.firstSandboxProviderConnectorStatus || safe.firstSandboxProviderConnectorStatus || "",
      providerCoverageStatus: workflow.providerCoverageStatus || safe.providerCoverageStatus || "",
      sourceTrustStatus: workflow.sourceTrustStatus || safe.sourceTrustStatus || "",
      providerCoverageViewModelStatus: workflow.providerCoverageViewModelStatus || safe.providerCoverageViewModelStatus || "",
      providerSandboxIntegrationGateStatus: workflow.providerSandboxIntegrationGateStatus || safe.providerSandboxIntegrationGateStatus || "",
      sandboxPriceCandidateSessionStatus: workflow.sandboxPriceCandidateSessionStatus || safe.sandboxPriceCandidateSessionStatus || "",
      sandboxPriceCandidateResultBoardStatus: workflow.sandboxPriceCandidateResultBoardStatus || safe.sandboxPriceCandidateResultBoardStatus || "",
      safeToProceedWithFirstReadOnlyProviderSandboxIntegration: workflow.safeToProceedWithFirstReadOnlyProviderSandboxIntegration === true || safe.safeToProceedWithFirstReadOnlyProviderSandboxIntegration === true,
      safeToProceedWithSandboxCandidateUserPreview: workflow.safeToProceedWithSandboxCandidateUserPreview === true || safe.safeToProceedWithSandboxCandidateUserPreview === true,
      pilotOnboardingSummary: workflow.pilotOnboardingSummary,
      readOnlyConsentSummary: workflow.readOnlyConsentSummary,
      pilotOnboardingViewModel: workflow.pilotOnboardingViewModel,
      pilotEntryStatus: workflow.pilotEntryStatus,
      canEnterReadOnlyPilot: workflow.canEnterReadOnlyPilot === true,
      pilotConsentRequired: workflow.pilotConsentRequired === true,
      rawResponseStored: false,
      secretStored: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  function sanitizeReadOnlyQuoteSessionReportCenter(input) {
    const safe = stripUnsafe(input && typeof input === "object" ? input : {}) || {};
    const hasSession = !!resolveSessionSummary(safe);
    const failed = malformedSession(input);
    const userFacingSummary = buildUserFacingQuoteEvidenceSummary(safe);
    const safetyReport = buildSafetyQuoteEvidenceReport(safe);
    const selected = safe.selectedCandidate || safetyReport.sessionSummary && safetyReport.sessionSummary.selection || null;
    const canConfirm = !!(selected && selected.safeProviderHandoffReady === true);
    return clone({
      reportCenterName: REPORT_CENTER_NAME,
      appVersion: READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION,
      status: failed ? "failed_safe" : (hasSession ? "ready" : "empty"),
      userFacingSummary: userFacingSummary,
      safetyReport: safetyReport,
      actions: {
        canOpenProviderConfirmation: canConfirm,
        providerConfirmationRequiresUserConfirm: true,
        canExportRedactedPreview: hasSession && !failed,
        canRecoverSession: hasSession && !failed,
        canPayHere: false,
        canOrderHere: false,
        canUploadIdentityHere: false
      },
      issuePatternSummary: clone(safe.issuePatternSummary || null),
      supportReadinessSummary: clone(safe.supportReadinessSummary || null),
      issuePatternStatus: text(safe.issuePatternStatus || safe.issuePatternSummary && safe.issuePatternSummary.status || ""),
      supportReadinessStatus: text(safe.supportReadinessStatus || safe.supportReadinessSummary && safe.supportReadinessSummary.status || ""),
      supportReadyForPublicPilot: safe.supportReadyForPublicPilot === true || safe.supportReadinessSummary && safe.supportReadinessSummary.decision && safe.supportReadinessSummary.decision.supportReadyForPublicPilot === true,
      repeatedIssueRisk: safe.repeatedIssueRisk === true || safe.issuePatternSummary && safe.issuePatternSummary.issuePatternHealth && safe.issuePatternSummary.issuePatternHealth.hasRepeatedPattern === true,
      redacted: true
    });
  }

  function buildReadOnlyQuoteSessionReportCenter(input) {
    return sanitizeReadOnlyQuoteSessionReportCenter(input);
  }

  function buildReadOnlyQuoteSessionReportCenterAuditDraft(input) {
    const report = buildReadOnlyQuoteSessionReportCenter(input);
    return clone({
      eventType: "READ_ONLY_QUOTE_SESSION_REPORT_CENTER_AUDIT_DRAFT",
      reportCenterName: REPORT_CENTER_NAME,
      appVersion: READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION,
      status: report.status,
      topCandidateCount: report.userFacingSummary.topCandidateCount,
      decisionAssistantSummary: report.safetyReport.decisionAssistantSummary,
      candidateComparisonSummary: report.safetyReport.candidateComparisonSummary,
      recommendationExplanation: report.safetyReport.recommendationExplanation,
      decisionSafetyWarnings: report.safetyReport.decisionSafetyWarnings,
      handoffChecklistSummary: report.safetyReport.handoffChecklistSummary || null,
      handoffReceiptSummary: report.safetyReport.handoffReceiptSummary || null,
      manualPlatformCheckSummary: report.safetyReport.manualPlatformCheckSummary || null,
      platformCheckDeltaSummary: report.safetyReport.platformCheckDeltaSummary || null,
      reconciliationSummary: report.safetyReport.reconciliationSummary || null,
      confidenceLabelSummary: report.safetyReport.confidenceLabelSummary || null,
      safeNextStepSummary: report.safetyReport.safeNextStepSummary || null,
      platformCheckOutcomeSummary: report.safetyReport.platformCheckOutcomeSummary || null,
      platformCheckWarnings: report.safetyReport.platformCheckWarnings || [],
      workflowStateSummary: report.safetyReport.workflowStateSummary || null,
      clarificationSummary: report.safetyReport.clarificationSummary || null,
      workflowStepList: report.safetyReport.workflowStepList || null,
      missingFields: report.safetyReport.missingFields || [],
      clarificationQuestions: report.safetyReport.clarificationQuestions || [],
      workflowUserMessage: report.safetyReport.workflowUserMessage || "",
      actionExecutionResult: report.safetyReport.actionExecutionResult || null,
      actionPolicyDecision: report.safetyReport.actionPolicyDecision || null,
      eventLedgerSummary: report.safetyReport.eventLedgerSummary || null,
      lastActionId: report.safetyReport.lastActionId || "",
      lastActionStatus: report.safetyReport.lastActionStatus || "",
      lastActionMessage: report.safetyReport.lastActionMessage || "",
      auditReviewSummary: report.safetyReport.auditReviewSummary || null,
      safeSessionExportPreview: report.safetyReport.safeSessionExportPreview || null,
      riskBadgeSummary: report.safetyReport.riskBadgeSummary || null,
      humanReviewChecklistSummary: report.safetyReport.humanReviewChecklistSummary || null,
      finalSafeHandoffPacketSummary: report.safetyReport.finalSafeHandoffPacketSummary || null,
      handoffPacketPolicyDecision: report.safetyReport.handoffPacketPolicyDecision || null,
      finalReviewStatus: report.safetyReport.finalReviewStatus || "",
      finalReviewBadges: report.safetyReport.finalReviewBadges || [],
      safetyRegressionSummary: report.safetyReport.safetyRegressionSummary || null,
      operatorConsoleSummary: report.safetyReport.operatorConsoleSummary || null,
      operatorConsoleViewModel: report.safetyReport.operatorConsoleViewModel || null,
      pilotOnboardingSummary: report.safetyReport.pilotOnboardingSummary || null,
      readOnlyConsentSummary: report.safetyReport.readOnlyConsentSummary || null,
      pilotOnboardingViewModel: report.safetyReport.pilotOnboardingViewModel || null,
      pilotEntryStatus: report.safetyReport.pilotEntryStatus || "",
      canEnterReadOnlyPilot: report.safetyReport.canEnterReadOnlyPilot === true,
      pilotConsentRequired: report.safetyReport.pilotConsentRequired === true,
      pilotReadinessSnapshotSummary: report.safetyReport.pilotReadinessSnapshotSummary || null,
      supportPlaybookSummary: report.safetyReport.supportPlaybookSummary || null,
      cohortProgressSummary: report.safetyReport.cohortProgressSummary || null,
      trialMilestoneSummary: report.safetyReport.trialMilestoneSummary || null,
      pilotInvitationGateSummary: report.safetyReport.pilotInvitationGateSummary || null,
      testerCohortEnrollmentConsoleSummary: report.safetyReport.testerCohortEnrollmentConsoleSummary || null,
      pilotInvitationViewModelSummary: report.safetyReport.pilotInvitationViewModelSummary || null,
      cohortProgressStatus: report.safetyReport.cohortProgressStatus || "",
      trialMilestoneStatus: report.safetyReport.trialMilestoneStatus || "",
      safeToAdvanceNextCohort: report.safetyReport.safeToAdvanceNextCohort === true,
      pilotSnapshotStatus: report.safetyReport.pilotSnapshotStatus || "",
      supportPlaybookStatus: report.safetyReport.supportPlaybookStatus || "",
      pilotSnapshotNextStep: report.safetyReport.pilotSnapshotNextStep || "",
      pilotInvitationStatus: report.safetyReport.pilotInvitationStatus || "",
      testerCohortStatus: report.safetyReport.testerCohortStatus || "",
      pilotInvitationNextStep: report.safetyReport.pilotInvitationNextStep || "",
      rolloutControlSummary: report.safetyReport.rolloutControlSummary || null,
      cohortHealthSummary: report.safetyReport.cohortHealthSummary || null,
      pilotExitCriteriaSummary: report.safetyReport.pilotExitCriteriaSummary || null,
      launchCandidateReadinessSummary: report.safetyReport.launchCandidateReadinessSummary || null,
      rcCandidateReviewSummary: report.safetyReport.rcCandidateReviewSummary || null,
      rcEvidenceReviewSummary: report.safetyReport.rcEvidenceReviewSummary || null,
      rcReviewViewModelSummary: report.safetyReport.rcReviewViewModelSummary || null,
      rcRegressionAuditSummary: report.safetyReport.rcRegressionAuditSummary || null,
      releaseRiskLedgerSummary: report.safetyReport.releaseRiskLedgerSummary || null,
      rcRegressionViewModelSummary: report.safetyReport.rcRegressionViewModelSummary || null,
      rcReviewStatus: report.safetyReport.rcReviewStatus || "",
      rcEvidenceStatus: report.safetyReport.rcEvidenceStatus || "",
      rcRegressionStatus: report.safetyReport.rcRegressionStatus || "",
      releaseRiskStatus: report.safetyReport.releaseRiskStatus || "",
      safeToStartRcReview: report.safetyReport.safeToStartRcReview === true,
      safeToContinueReleaseCandidate: report.safetyReport.safeToContinueReleaseCandidate === true,
      rolloutControlViewModel: report.safetyReport.rolloutControlViewModel || null,
      rolloutDecisionStatus: report.safetyReport.rolloutDecisionStatus || "",
      cohortHealthStatus: report.safetyReport.cohortHealthStatus || "",
      launchCandidateStatus: report.safetyReport.launchCandidateStatus || "",
      readyForLaunchCandidate: report.safetyReport.readyForLaunchCandidate === true,
      launchCandidateNextStep: report.safetyReport.launchCandidateNextStep || "",
      rolloutNextStep: report.safetyReport.rolloutNextStep || "",
      scenarioSimulationSummary: report.safetyReport.scenarioSimulationSummary || null,
      safetyTestMatrixSummary: report.safetyReport.safetyTestMatrixSummary || null,
      continuitySummary: report.safetyReport.continuitySummary || null,
      confirmationStateSummary: report.safetyReport.confirmationStateSummary || null,
      recoverySummary: report.safetyReport.recoverySummary || null,
      resumeCoachSummary: report.safetyReport.resumeCoachSummary || null,
      actionQueueSummary: report.safetyReport.actionQueueSummary || null,
      progressTimelineSummary: report.safetyReport.progressTimelineSummary || null,
      safeResumeCenterSummary: report.safetyReport.safeResumeCenterSummary || null,
      blockedActions: report.safetyReport.blockedActions || [],
      nextSafeAction: report.safetyReport.nextSafeAction || report.safetyReport.nextSafeActionLabel || "",
      currentStage: report.safetyReport.currentStage || "",
      workflowStageLabel: report.safetyReport.workflowStageLabel || "",
      nextStepLabel: report.safetyReport.nextStepLabel || "",
      canResumeWorkflow: report.safetyReport.canResumeWorkflow === true,
      resumeActions: report.safetyReport.resumeActions || [],
      canOpenProviderConfirmation: report.actions.canOpenProviderConfirmation,
      providerConfirmationRequiresUserConfirm: true,
      rawResponseStored: false,
      secretStored: false,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    });
  }

  window.WeishanReadOnlyQuoteSessionReportCenter = {
    READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION,
    REPORT_CENTER_NAME,
    buildReadOnlyQuoteSessionReportCenter,
    buildUserFacingQuoteEvidenceSummary,
    buildSafetyQuoteEvidenceReport,
    buildReadOnlyQuoteSessionReportCenterAuditDraft,
    sanitizeReadOnlyQuoteSessionReportCenter
  };
})();
