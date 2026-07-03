;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_READ_ONLY_TRIAL_MILESTONE_BOARD_VERSION = "4.1.6";
  const BOARD_NAME = "flight_workflow_read_only_trial_milestone_board_v1";
  const CAVEAT = "该里程碑板只追踪脱敏测试槽位，不保存真实身份、不发送真实邀请。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, invitationUrl:null, autoOpen:false, autoRefresh:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function tracker(input) { const safe = obj(input); return first(safe.cohortProgressSummary, safe.trackerSummary, safe.cohortProgressTrackerSummary); }
  function snapshot(input) { const safe = obj(input); return first(safe.pilotReadinessSnapshotSummary, safe.publicPilotReadinessSnapshotSummary, safe.snapshotSummary); }
  function onboarding(input) { const safe = obj(input); return first(safe.pilotOnboardingSummary, safe.pilotOnboardingGuard, safe.pilotOnboardingViewModel); }
  function consent(input) { const safe = obj(input); return first(safe.readOnlyConsentSummary, safe.consentFlowSummary, safe.userConsentSummary); }
  function playbook(input) { const safe = obj(input); return first(safe.supportPlaybookSummary, safe.supportPlaybookConsoleSummary, safe.playbookSummary); }
  function issueReview(input) { const safe = obj(input); return first(safe.issueReviewSummary, safe.issueReviewBoard, safe.publicPilotIssueReviewBoard); }
  function supportReadiness(input) { const safe = obj(input); return first(safe.supportReadinessSummary, safe.supportReadinessGate); }
  function issuePattern(input) { const safe = obj(input); return first(safe.issuePatternSummary, safe.issuePatternRadar, safe.issuePatternViewModelSummary); }
  function operator(input) { const safe = obj(input); return first(safe.operatorConsoleSummary, safe.operatorConsoleViewModel); }
  function invitationGate(input) { const safe = obj(input); return first(safe.pilotInvitationGateSummary, safe.readOnlyPilotInvitationGateSummary, safe.invitationGateSummary); }
  function testerCohort(input) { const safe = obj(input); return first(safe.testerCohortEnrollmentConsoleSummary, safe.testerCohortSummary, safe.cohortSummary); }
  function hasTradingUrl(value) { const safe = obj(value); return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl))); }
  function boardRows(items) { return clone(toArray(items).map(function (item) { return { milestoneId:text(item.milestoneId || "milestone"), label:text(item.label || ""), status:item.status === "blocked" ? "blocked" : (item.status === "complete" ? "pass" : "warning"), redacted:true }; })); }
  function evaluateFlightWorkflowReadOnlyTrialMilestoneBoard(input) {
    const safe = obj(input);
    const trackerSummary = tracker(safe);
    const snapshotSummary = snapshot(safe);
    const onboardingSummary = onboarding(safe);
    const consentSummary = consent(safe);
    const playbookSummary = playbook(safe);
    const issueReviewSummary = issueReview(safe);
    const supportSummary = supportReadiness(safe);
    const issuePatternSummary = issuePattern(safe);
    const operatorSummary = operator(safe);
    const gateSummary = invitationGate(safe);
    const cohortSummary = testerCohort(safe);
    const blockedRisk = safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true || hasTradingUrl(safe) || hasTradingUrl(trackerSummary) || hasTradingUrl(snapshotSummary) || hasTradingUrl(onboardingSummary) || hasTradingUrl(consentSummary) || hasTradingUrl(playbookSummary) || hasTradingUrl(issueReviewSummary) || hasTradingUrl(supportSummary) || hasTradingUrl(issuePatternSummary) || hasTradingUrl(operatorSummary) || hasTradingUrl(gateSummary) || hasTradingUrl(cohortSummary);
    let status = "needs_review";
    if (blockedRisk || snapshotSummary.status === "blocked" || onboardingSummary.status === "blocked" || consentSummary.status === "blocked" || playbookSummary.status === "blocked" || issueReviewSummary.status === "blocked" || supportSummary.status === "blocked" || issuePatternSummary.status === "blocked" || operatorSummary.status === "blocked" || gateSummary.status === "blocked") {
      status = "blocked";
    } else if (trackerSummary.safeToAdvanceNextCohort === true && snapshotSummary.status === "ready" && onboardingSummary.status === "allowed" && consentSummary.status === "accepted") {
      status = "ready";
    } else if (trackerSummary.status === "needs_more_testers" || trackerSummary.cohortProgressStatus === "needs_more_testers" || gateSummary.status === "waitlist") {
      status = "needs_more_testers";
    } else if (playbookSummary.status === "needs_review" || issueReviewSummary.status === "needs_review" || supportSummary.status === "needs_review" || issuePatternSummary.status === "needs_review" || operatorSummary.status === "warning") {
      status = "needs_review";
    }
    const milestones = [
      { milestoneId:"release_ready", label:"发布就绪确认", status:snapshotSummary.status === "ready" ? "complete" : (snapshotSummary.status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"pilot_entry_confirmed", label:"试点进入确认", status:onboardingSummary.status === "allowed" && consentSummary.status === "accepted" ? "complete" : (onboardingSummary.status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"batch_started", label:"测试批次启动", status:(obj(cohortSummary.cohort).totalCount || 0) > 0 ? "complete" : (status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"feedback_complete", label:"反馈收集完成", status:(obj(cohortSummary.cohort).feedbackReadyCount || 0) > 0 ? "complete" : (status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"issue_review_complete", label:"问题复核完成", status:issueReviewSummary.status === "ready" || supportSummary.status === "ready" ? "complete" : (issueReviewSummary.status === "blocked" || supportSummary.status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"next_batch_ready", label:"下一批测试准备", status:trackerSummary.safeToAdvanceNextCohort === true ? "complete" : (status === "blocked" ? "blocked" : "in_progress") }
    ];
    const completedCount = milestones.filter(function (item) { return item.status === "complete"; }).length;
    const blockedCount = milestones.filter(function (item) { return item.status === "blocked"; }).length;
    const pendingCount = milestones.length - completedCount - blockedCount;
    const safeToAdvanceNextCohort = status === "ready" && trackerSummary.safeToAdvanceNextCohort === true;
    const summary = {
      milestoneCount: milestones.length,
      completedCount: completedCount,
      pendingCount: pendingCount,
      blockedCount: blockedCount,
      latestMilestoneLabel: milestones[milestones.length - 1].label,
      nextBatchLabel: safeToAdvanceNextCohort ? "可以进入下一批只读测试" : (status === "needs_more_testers" ? "仍需更多测试者" : "仍需更多测试者"),
      safeToAdvanceNextCohort: safeToAdvanceNextCohort,
      milestones: milestones,
      redacted:true
    };
    return clone({
      status: status,
      trialMilestoneStatus: status,
      cohortProgressStatus: trackerSummary.cohortProgressStatus || trackerSummary.status || status,
      trialMilestoneSummary: summary,
      cohortProgressSummary: clone(trackerSummary),
      rolloutControlSummary: clone(safe.rolloutControlSummary || null),
      cohortHealthSummary: clone(safe.cohortHealthSummary || null),
      pilotOpsSummary: clone(safe.pilotOpsSummary || null),
      nextCohortDecisionSummary: clone(safe.nextCohortDecisionSummary || null),
      pilotOpsStatus: text(safe.pilotOpsStatus || ""),
      nextCohortDecisionStatus: text(safe.nextCohortDecisionStatus || ""),
      pilotOpsPrimaryRisk: clone(safe.pilotOpsPrimaryRisk || null),
      rolloutDecisionStatus: text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
      cohortHealthStatus: text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
      rolloutNextStep: text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
      safeToAdvanceNextCohort: safeToAdvanceNextCohort,
      rows: boardRows(milestones),
      userFacingSummary: { title:"只读试点里程碑", resultLabel: status === "ready" ? "可以进入下一批只读测试" : (status === "needs_more_testers" ? "仍需更多测试者" : (status === "blocked" ? "测试批次已阻断" : "仍需更多测试者")), caveat:CAVEAT, redacted:true },
      safety: safety(),
      redacted:true
    });
  }
  function sanitizeFlightWorkflowReadOnlyTrialMilestoneBoard(board) {
    const safe = obj(board);
    const status = /^(ready|needs_more_testers|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    return clone({
      boardName: BOARD_NAME,
      appVersion: FLIGHT_WORKFLOW_READ_ONLY_TRIAL_MILESTONE_BOARD_VERSION,
      status: status,
      trialMilestoneStatus: text(safe.trialMilestoneStatus || status),
      cohortProgressStatus: text(safe.cohortProgressStatus || status),
      trialMilestoneSummary: Object.assign({ milestoneCount:0, completedCount:0, pendingCount:0, blockedCount:0, latestMilestoneLabel:"下一批测试准备", nextBatchLabel:"仍需更多测试者", safeToAdvanceNextCohort:false, milestones:[], redacted:true }, obj(safe.trialMilestoneSummary)),
      cohortProgressSummary: clone(safe.cohortProgressSummary || null),
      rolloutControlSummary: clone(safe.rolloutControlSummary || null),
      cohortHealthSummary: clone(safe.cohortHealthSummary || null),
      rolloutDecisionStatus: text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
      cohortHealthStatus: text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
      rolloutNextStep: text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
      safeToAdvanceNextCohort: safe.safeToAdvanceNextCohort === true || obj(safe.trialMilestoneSummary).safeToAdvanceNextCohort === true,
      rows: Array.isArray(safe.rows) ? safe.rows.map(function (item) { return { milestoneId:text(item.milestoneId || "milestone"), label:text(item.label || ""), status:item.status === "blocked" ? "blocked" : (item.status === "pass" ? "pass" : "warning"), redacted:true }; }) : [],
      userFacingSummary: Object.assign({ title:"只读试点里程碑", resultLabel: status === "ready" ? "可以进入下一批只读测试" : (status === "needs_more_testers" ? "仍需更多测试者" : (status === "blocked" ? "测试批次已阻断" : "仍需更多测试者")), caveat:CAVEAT, redacted:true }, safe.userFacingSummary || {}),
      safety: Object.assign(safety(), safe.safety || {}),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      redacted:true
    });
  }
  function buildFlightWorkflowReadOnlyTrialMilestoneBoard(input) {
    try { return sanitizeFlightWorkflowReadOnlyTrialMilestoneBoard(evaluateFlightWorkflowReadOnlyTrialMilestoneBoard(input || {})); }
    catch (error) { return sanitizeFlightWorkflowReadOnlyTrialMilestoneBoard({ status:"failed_safe", trialMilestoneSummary:{}, cohortProgressSummary:{}, rows:[], safeToAdvanceNextCohort:false, userFacingSummary:{ title:"只读试点里程碑", resultLabel:"仍需更多测试者", caveat:CAVEAT, redacted:true } }); }
  }
  function buildFlightWorkflowReadOnlyTrialMilestoneBoardAuditDraft(input) {
    const board = buildFlightWorkflowReadOnlyTrialMilestoneBoard(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_READ_ONLY_TRIAL_MILESTONE_BOARD_AUDIT_DRAFT", boardName:BOARD_NAME, appVersion:FLIGHT_WORKFLOW_READ_ONLY_TRIAL_MILESTONE_BOARD_VERSION, status:board.status, trialMilestoneStatus:board.trialMilestoneStatus, cohortProgressStatus:board.cohortProgressStatus, pilotOpsStatus:board.pilotOpsStatus, nextCohortDecisionStatus:board.nextCohortDecisionStatus, safeToAdvanceNextCohort:board.safeToAdvanceNextCohort === true, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }
  window.WeishanFlightWorkflowReadOnlyTrialMilestoneBoard = { FLIGHT_WORKFLOW_READ_ONLY_TRIAL_MILESTONE_BOARD_VERSION, BOARD_NAME, buildFlightWorkflowReadOnlyTrialMilestoneBoard, evaluateFlightWorkflowReadOnlyTrialMilestoneBoard, buildFlightWorkflowReadOnlyTrialMilestoneBoardAuditDraft, sanitizeFlightWorkflowReadOnlyTrialMilestoneBoard };
})();
