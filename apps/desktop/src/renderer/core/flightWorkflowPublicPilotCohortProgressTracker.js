;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PUBLIC_PILOT_COHORT_PROGRESS_TRACKER_VERSION = "4.1.5";
  const TRACKER_NAME = "flight_workflow_public_pilot_cohort_progress_tracker_v1";
  const CAVEAT = "该追踪器只用于只读试点批次进度追踪，不保存真实身份、联系方式、证件、支付或外部平台链接。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, realIdentityStored:false, invitationUrl:null, autoOpen:false, autoRefresh:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function hasTradingUrl(value) { const safe = obj(value); return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl))); }
  function invitationGate(input) { const safe = obj(input); return first(safe.pilotInvitationGateSummary, safe.readOnlyPilotInvitationGateSummary, safe.invitationGateSummary); }
  function testerCohort(input) { const safe = obj(input); return first(safe.testerCohortEnrollmentConsoleSummary, safe.testerCohortSummary, safe.cohortSummary); }
  function snapshot(input) { const safe = obj(input); return first(safe.pilotReadinessSnapshotSummary, safe.publicPilotReadinessSnapshotSummary, safe.snapshotSummary); }
  function playbook(input) { const safe = obj(input); return first(safe.supportPlaybookSummary, safe.supportPlaybookConsoleSummary, safe.playbookSummary); }
  function onboarding(input) { const safe = obj(input); return first(safe.pilotOnboardingSummary, safe.pilotOnboardingGuard, safe.pilotOnboardingViewModel); }
  function consent(input) { const safe = obj(input); return first(safe.readOnlyConsentSummary, safe.consentFlowSummary, safe.userConsentSummary); }
  function supportReadiness(input) { const safe = obj(input); return first(safe.supportReadinessSummary, safe.supportReadinessGate); }
  function issuePattern(input) { const safe = obj(input); return first(safe.issuePatternSummary, safe.issuePatternRadar, safe.issuePatternViewModelSummary); }
  function operator(input) { const safe = obj(input); return first(safe.operatorConsoleSummary, safe.operatorConsoleViewModel); }
  function buildRows(input) {
    const safe = obj(input);
    const tracker = evaluateFlightWorkflowPublicPilotCohortProgressTracker(safe);
    const progress = obj(tracker.cohortProgressSummary);
    const milestone = obj(tracker.trialMilestoneSummary);
    return clone([
      { rowId:"progress", label:"完成进度", value:text(progress.progressLabel || tracker.userFacingSummary && tracker.userFacingSummary.resultLabel || "仍需更多测试者"), status: tracker.cohortProgressStatus === "blocked" ? "blocked" : (tracker.cohortProgressStatus === "ready" ? "pass" : "warning"), redacted:true },
      { rowId:"status", label:"问题状态", value:text(tracker.cohortProgressStatus || "needs_more_testers"), status: tracker.cohortProgressStatus === "blocked" ? "blocked" : "pass", redacted:true },
      { rowId:"next_batch", label:"下一批测试", value:text(milestone.nextBatchLabel || (tracker.safeToAdvanceNextCohort ? "可以进入下一批只读测试" : "仍需更多测试者")), status: tracker.safeToAdvanceNextCohort ? "pass" : (tracker.cohortProgressStatus === "blocked" ? "blocked" : "warning"), redacted:true }
    ]);
  }
  function evaluateFlightWorkflowPublicPilotCohortProgressTracker(input) {
    const safe = obj(input);
    const gate = invitationGate(safe);
    const cohortSummary = testerCohort(safe);
    const snapshotSummary = snapshot(safe);
    const playbookSummary = playbook(safe);
    const onboardingSummary = onboarding(safe);
    const consentSummary = consent(safe);
    const supportSummary = supportReadiness(safe);
    const patternSummary = issuePattern(safe);
    const operatorSummary = operator(safe);
    const rows = toArray(cohortSummary.rows).length ? toArray(cohortSummary.rows) : buildRows(safe);
    const cohort = obj(cohortSummary.cohort);
    const counts = {
      totalCount: Number(cohort.totalCount || rows.length || 0),
      invitedCount: Number(cohort.invitedCount || rows.filter(function (row) { return row.invitationStatus === "invited" || row.invitationStatus === "eligible"; }).length),
      consentedCount: Number(cohort.consentedCount || rows.filter(function (row) { return row.consentStatus === "accepted" || row.consentStatus === "confirmed"; }).length),
      feedbackReadyCount: Number(cohort.feedbackReadyCount || rows.filter(function (row) { return row.feedbackStatus === "ready"; }).length),
      blockedCount: Number(cohort.blockedCount || rows.filter(function (row) { return row.status === "blocked"; }).length)
    };
    const blockedRisk = safe.rawUserTextStored === true || safe.rawResponseStored === true || safe.secretStored === true || hasTradingUrl(safe) || hasTradingUrl(gate) || hasTradingUrl(cohortSummary) || hasTradingUrl(snapshotSummary) || hasTradingUrl(playbookSummary) || hasTradingUrl(onboardingSummary) || hasTradingUrl(consentSummary) || hasTradingUrl(supportSummary) || hasTradingUrl(patternSummary) || hasTradingUrl(operatorSummary);
    let status = "needs_more_testers";
    if (blockedRisk || gate.status === "blocked" || snapshotSummary.status === "blocked" || playbookSummary.status === "blocked" || onboardingSummary.status === "blocked" || consentSummary.status === "blocked" || supportSummary.status === "blocked" || patternSummary.status === "blocked" || operatorSummary.status === "blocked") {
      status = "blocked";
    } else if (patternSummary.status === "needs_review" || playbookSummary.status === "needs_review" || supportSummary.status === "needs_review" || onboardingSummary.status === "needs_consent" || gate.status === "needs_support_review") {
      status = "needs_review";
    } else if (counts.totalCount < 3 || counts.invitedCount < 2 || counts.consentedCount < 2 || gate.status === "waitlist") {
      status = "needs_more_testers";
    } else {
      status = "ready";
    }
    const safeToAdvanceNextCohort = status === "ready" && counts.blockedCount === 0 && snapshotSummary.status !== "blocked" && playbookSummary.status !== "blocked" && supportSummary.status !== "blocked" && patternSummary.status !== "blocked";
    const progressPercent = counts.totalCount > 0 ? Math.max(0, Math.min(100, Math.round((Math.min(counts.consentedCount, counts.totalCount) / counts.totalCount) * 100))) : 0;
    const progressLabel = status === "ready" ? "测试批次进度正常" : (status === "blocked" ? "测试批次已阻断" : (status === "needs_review" ? "测试批次仍在进行" : "仍需更多测试者"));
    const tracker = {
      cohortId: text(cohort.cohortId || "tester-cohort-001"),
      totalCount: counts.totalCount,
      invitedCount: counts.invitedCount,
      consentedCount: counts.consentedCount,
      feedbackReadyCount: counts.feedbackReadyCount,
      blockedCount: counts.blockedCount,
      progressPercent: progressPercent,
      progressLabel: progressLabel,
      nextStepLabel: safeToAdvanceNextCohort ? "下一批测试已准备" : (status === "needs_review" ? "仍需复核后再继续" : "仍需更多测试者"),
      safeToAdvanceNextCohort: safeToAdvanceNextCohort,
      redacted: true
    };
    const milestones = [
      { milestoneId:"release_ready", label:"发布就绪确认", status:snapshotSummary.status === "ready" ? "complete" : (snapshotSummary.status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"pilot_entry_confirmed", label:"试点进入确认", status:onboardingSummary.status === "allowed" && consentSummary.status === "accepted" ? "complete" : (onboardingSummary.status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"batch_started", label:"测试批次启动", status:counts.totalCount > 0 ? "complete" : (status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"feedback_complete", label:"反馈收集完成", status:counts.feedbackReadyCount > 0 ? "complete" : (status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"issue_review_complete", label:"问题复核完成", status:patternSummary.status === "ready" || supportSummary.status === "ready" ? "complete" : (patternSummary.status === "blocked" || supportSummary.status === "blocked" ? "blocked" : "in_progress") },
      { milestoneId:"next_batch_ready", label:"下一批测试准备", status:safeToAdvanceNextCohort ? "complete" : (status === "blocked" ? "blocked" : "in_progress") }
    ];
    const completedCount = milestones.filter(function (item) { return item.status === "complete"; }).length;
    const blockedCount = milestones.filter(function (item) { return item.status === "blocked"; }).length;
    const pendingCount = milestones.length - completedCount - blockedCount;
    const trialMilestoneSummary = {
      milestoneCount: milestones.length,
      completedCount: completedCount,
      pendingCount: pendingCount,
      blockedCount: blockedCount,
      latestMilestoneLabel: milestones[milestones.length - 1].label,
      nextBatchLabel: safeToAdvanceNextCohort ? "可以进入下一批只读测试" : "仍需更多测试者",
      safeToAdvanceNextCohort: safeToAdvanceNextCohort,
      milestones: milestones,
      redacted: true
    };
    return clone({
      status: status,
      cohortProgressStatus: status,
      trialMilestoneStatus: status,
      cohortProgressSummary: tracker,
      trialMilestoneSummary: trialMilestoneSummary,
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
      userFacingSummary: { title:"只读试点进度追踪", resultLabel: progressLabel, caveat:CAVEAT, redacted:true },
      safety: safety(),
      rows: rows,
      redacted: true
    });
  }
  function sanitizeFlightWorkflowPublicPilotCohortProgressTracker(tracker) {
    const safe = obj(tracker);
    const status = /^(ready|needs_more_testers|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    const cohortProgressSummary = obj(safe.cohortProgressSummary);
    const trialMilestoneSummary = obj(safe.trialMilestoneSummary);
    return clone({
      trackerName: TRACKER_NAME,
      appVersion: FLIGHT_WORKFLOW_PUBLIC_PILOT_COHORT_PROGRESS_TRACKER_VERSION,
      status: status,
      cohortProgressStatus: text(safe.cohortProgressStatus || status),
      trialMilestoneStatus: text(safe.trialMilestoneStatus || status),
      cohortProgressSummary: Object.assign({ cohortId:"tester-cohort-001", totalCount:0, invitedCount:0, consentedCount:0, feedbackReadyCount:0, blockedCount:0, progressPercent:0, progressLabel:"仍需更多测试者", nextStepLabel:"仍需更多测试者", safeToAdvanceNextCohort:false, redacted:true }, cohortProgressSummary),
      trialMilestoneSummary: Object.assign({ milestoneCount:0, completedCount:0, pendingCount:0, blockedCount:0, latestMilestoneLabel:"下一批测试准备", nextBatchLabel:"仍需更多测试者", safeToAdvanceNextCohort:false, milestones:[], redacted:true }, trialMilestoneSummary),
      rolloutControlSummary: clone(safe.rolloutControlSummary || null),
      cohortHealthSummary: clone(safe.cohortHealthSummary || null),
      rolloutDecisionStatus: text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
      cohortHealthStatus: text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
      rolloutNextStep: text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
      safeToAdvanceNextCohort: safe.safeToAdvanceNextCohort === true || cohortProgressSummary.safeToAdvanceNextCohort === true || trialMilestoneSummary.safeToAdvanceNextCohort === true,
      rows: Array.isArray(safe.rows) ? safe.rows.map(function (item) { return { rowId:text(item.rowId || "row"), label:text(item.label || ""), value:text(item.value || ""), status:item.status === "blocked" ? "blocked" : (item.status === "warning" ? "warning" : "pass"), redacted:true }; }) : [],
      userFacingSummary: Object.assign({ title:"只读试点进度追踪", resultLabel: status === "ready" ? "测试批次进度正常" : (status === "needs_more_testers" ? "仍需更多测试者" : status === "needs_review" ? "测试批次仍在进行" : status === "blocked" ? "测试批次已阻断" : "仍需更多测试者"), caveat:CAVEAT, redacted:true }, safe.userFacingSummary || {}),
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
  function buildFlightWorkflowPublicPilotCohortProgressTracker(input) {
    try {
      const evaluation = evaluateFlightWorkflowPublicPilotCohortProgressTracker(input || {});
      return sanitizeFlightWorkflowPublicPilotCohortProgressTracker(Object.assign({}, evaluation, { pilotOpsSummary:evaluation.pilotOpsSummary, nextCohortDecisionSummary:evaluation.nextCohortDecisionSummary, pilotOpsStatus:evaluation.pilotOpsStatus, nextCohortDecisionStatus:evaluation.nextCohortDecisionStatus, pilotOpsPrimaryRisk:evaluation.pilotOpsPrimaryRisk }));
    } catch (error) {
      return sanitizeFlightWorkflowPublicPilotCohortProgressTracker({ status:"failed_safe", cohortProgressSummary:{}, trialMilestoneSummary:{}, rows:[], safeToAdvanceNextCohort:false, userFacingSummary:{ title:"只读试点进度追踪", resultLabel:"仍需更多测试者", caveat:CAVEAT, redacted:true } });
    }
  }
  function buildFlightWorkflowPublicPilotCohortProgressTrackerAuditDraft(input) {
    const tracker = buildFlightWorkflowPublicPilotCohortProgressTracker(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_PUBLIC_PILOT_COHORT_PROGRESS_TRACKER_AUDIT_DRAFT", trackerName:TRACKER_NAME, appVersion:FLIGHT_WORKFLOW_PUBLIC_PILOT_COHORT_PROGRESS_TRACKER_VERSION, status:tracker.status, cohortProgressStatus:tracker.cohortProgressStatus, trialMilestoneStatus:tracker.trialMilestoneStatus, pilotOpsStatus:tracker.pilotOpsStatus, nextCohortDecisionStatus:tracker.nextCohortDecisionStatus, safeToAdvanceNextCohort:tracker.safeToAdvanceNextCohort === true, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }
  window.WeishanFlightWorkflowPublicPilotCohortProgressTracker = { FLIGHT_WORKFLOW_PUBLIC_PILOT_COHORT_PROGRESS_TRACKER_VERSION, TRACKER_NAME, buildFlightWorkflowPublicPilotCohortProgressTracker, evaluateFlightWorkflowPublicPilotCohortProgressTracker, buildFlightWorkflowPublicPilotCohortProgressTrackerRows:buildRows, buildFlightWorkflowPublicPilotCohortProgressTrackerAuditDraft, sanitizeFlightWorkflowPublicPilotCohortProgressTracker };
})();
