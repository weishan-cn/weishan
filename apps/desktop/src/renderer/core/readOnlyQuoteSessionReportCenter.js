;(function () {
  "use strict";

  const READ_ONLY_QUOTE_SESSION_REPORT_CENTER_VERSION = "2.1.84";
  const REPORT_CENTER_NAME = "read_only_quote_session_report_center_v1";
  const FORBIDDEN_NAME_RE = /(rawProviderResponse|rawResponse|rawPayload|token|key|secret|password|auth|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|identity|passport|bank|card)/i;
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
      pilotExitCriteriaSummary: pilotExitCriteriaSummary ? { title:"只读试点退出条件", line:pilotExitCriteriaSummary.userFacingSummary && pilotExitCriteriaSummary.userFacingSummary.resultLabel || "继续试点观察", redacted:true } : null,
      launchCandidateReadinessSummary: launchCandidateReadinessSummary ? { title:"只读发布候选准备板", line:launchCandidateReadinessSummary.userFacingSummary && launchCandidateReadinessSummary.userFacingSummary.resultLabel || "继续试点观察", redacted:true } : null,
      freezeGateSummary: workflow.freezeGateSummary ? { title:"只读发布候选冻结检查", line:workflow.freezeGateSummary.userFacingSummary && workflow.freezeGateSummary.userFacingSummary.resultLabel || "继续试点观察", redacted:true } : null,
      evidenceFreezePackSummary: workflow.evidenceFreezePackSummary ? { title:"证据冻结包", line:workflow.evidenceFreezePackSummary.userFacingSummary && workflow.evidenceFreezePackSummary.userFacingSummary.resultLabel || "继续试点观察", redacted:true } : null,
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
