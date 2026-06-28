;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_COHORT_PROGRESS_VIEW_MODEL_VERSION = "2.1.94";
  const VIEW_MODEL_NAME = "flight_workflow_cohort_progress_view_model_v1";
  const CAVEAT = "该视图模型只用于只读试点进度追踪，不保存真实身份、不发送真实邀请。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|raw feedback|rawUserText/ig;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function trackerApi() { return window.WeishanFlightWorkflowPublicPilotCohortProgressTracker || {}; }
  function boardApi() { return window.WeishanFlightWorkflowReadOnlyTrialMilestoneBoard || {}; }
  function invitationGateApi() { return window.WeishanFlightWorkflowReadOnlyPilotInvitationGate || {}; }
  function cohortApi() { return window.WeishanFlightWorkflowTesterCohortEnrollmentConsole || {}; }
  function snapshotApi() { return window.WeishanFlightWorkflowPublicPilotReadinessSnapshot || {}; }
  function playbookApi() { return window.WeishanFlightWorkflowSupportPlaybookConsole || {}; }
  function consentApi() { return window.WeishanFlightWorkflowReadOnlyUserConsentFlow || {}; }
  function onboardingApi() { return window.WeishanFlightWorkflowPublicPilotOnboardingGuard || {}; }
  function tracker(input) { const safe = obj(input); return first(safe.cohortProgressSummary, safe.trackerSummary, typeof trackerApi().buildFlightWorkflowPublicPilotCohortProgressTracker === "function" ? trackerApi().buildFlightWorkflowPublicPilotCohortProgressTracker(safe) : null); }
  function board(input) { const safe = obj(input); return first(safe.trialMilestoneSummary, safe.boardSummary, typeof boardApi().buildFlightWorkflowReadOnlyTrialMilestoneBoard === "function" ? boardApi().buildFlightWorkflowReadOnlyTrialMilestoneBoard(safe) : null); }
  function invitationGate(input) { const safe = obj(input); return first(safe.pilotInvitationGateSummary, safe.readOnlyPilotInvitationGateSummary, safe.invitationGateSummary, typeof invitationGateApi().buildFlightWorkflowReadOnlyPilotInvitationGate === "function" ? invitationGateApi().buildFlightWorkflowReadOnlyPilotInvitationGate(safe) : null); }
  function cohort(input) { const safe = obj(input); return first(safe.testerCohortEnrollmentConsoleSummary, safe.testerCohortSummary, safe.cohortSummary, typeof cohortApi().buildFlightWorkflowTesterCohortEnrollmentConsole === "function" ? cohortApi().buildFlightWorkflowTesterCohortEnrollmentConsole(safe) : null); }
  function snapshot(input) { const safe = obj(input); return first(safe.pilotReadinessSnapshotSummary, safe.publicPilotReadinessSnapshotSummary, safe.snapshotSummary, typeof snapshotApi().buildFlightWorkflowPublicPilotReadinessSnapshot === "function" ? snapshotApi().buildFlightWorkflowPublicPilotReadinessSnapshot(safe) : null); }
  function playbook(input) { const safe = obj(input); return first(safe.supportPlaybookSummary, safe.supportPlaybookConsoleSummary, safe.playbookSummary, typeof playbookApi().buildFlightWorkflowSupportPlaybookConsole === "function" ? playbookApi().buildFlightWorkflowSupportPlaybookConsole(safe) : null); }
  function consent(input) { const safe = obj(input); return first(safe.readOnlyConsentSummary, safe.consentFlowSummary, safe.userConsentSummary, typeof consentApi().buildFlightWorkflowReadOnlyUserConsentFlow === "function" ? consentApi().buildFlightWorkflowReadOnlyUserConsentFlow(safe) : null); }
  function onboarding(input) { const safe = obj(input); return first(safe.pilotOnboardingSummary, safe.pilotOnboardingGuard, safe.pilotOnboardingViewModel, typeof onboardingApi().buildFlightWorkflowPublicPilotOnboardingGuard === "function" ? onboardingApi().buildFlightWorkflowPublicPilotOnboardingGuard(safe) : null); }
  function hasTradingUrl(value) { const safe = obj(value); return Boolean(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || (safe.safety && (safe.safety.bookingUrl || safe.safety.checkoutUrl || safe.safety.paymentUrl || safe.safety.orderUrl))); }
  function card(cardId, label, value) { return { cardId:cardId, label:text(label), value:text(value), redacted:true }; }
  function rows(input) {
    const safe = obj(input);
    const trackerSummary = tracker(safe);
    const boardSummary = board(safe);
    const progress = obj(trackerSummary.cohortProgressSummary);
    return clone([
      { rowId:"progress", label:"只读试点进度追踪", value:text(progress.progressLabel || trackerSummary.userFacingSummary && trackerSummary.userFacingSummary.resultLabel || "仍需更多测试者"), status: trackerSummary.cohortProgressStatus === "blocked" ? "blocked" : (trackerSummary.cohortProgressStatus === "ready" ? "pass" : "warning"), redacted:true },
      { rowId:"milestone", label:"只读试点里程碑", value:text(boardSummary.userFacingSummary && boardSummary.userFacingSummary.resultLabel || boardSummary.trialMilestoneStatus || "仍需更多测试者"), status: boardSummary.trialMilestoneStatus === "blocked" ? "blocked" : (boardSummary.trialMilestoneStatus === "ready" ? "pass" : "warning"), redacted:true },
      { rowId:"completion", label:"完成进度", value:text(String(progress.progressPercent || 0) + "%"), status: trackerSummary.safeToAdvanceNextCohort === true ? "pass" : "warning", redacted:true },
      { rowId:"question", label:"问题状态", value:text(boardSummary.trialMilestoneStatus || trackerSummary.cohortProgressStatus || "needs_more_testers"), status: boardSummary.trialMilestoneStatus === "blocked" ? "blocked" : "pass", redacted:true },
      { rowId:"next_batch", label:"下一批测试", value:text(boardSummary.safeToAdvanceNextCohort === true ? "可以进入下一批只读测试" : "仍需更多测试者"), status: boardSummary.safeToAdvanceNextCohort === true ? "pass" : "warning", redacted:true }
    ]);
  }
  function safeStatus(trackerSummary, boardSummary) {
    const trackerStatus = text(obj(trackerSummary).status || "needs_more_testers");
    const boardStatus = text(obj(boardSummary).status || "needs_review");
    if (trackerStatus === "blocked" || boardStatus === "blocked") return "blocked";
    if (trackerStatus === "ready" && boardStatus === "ready") return "ready";
    if (trackerStatus === "needs_review" || boardStatus === "needs_review") return "needs_review";
    return "needs_more_testers";
  }
  function buildFlightWorkflowCohortProgressViewModel(input) {
    try {
      const safe = obj(input);
      const trackerSummary = tracker(safe);
      const boardSummary = board(safe);
      const gateSummary = invitationGate(safe);
      const cohortSummary = cohort(safe);
      const snapshotSummary = snapshot(safe);
      const playbookSummary = playbook(safe);
      const consentSummary = consent(safe);
      const onboardingSummary = onboarding(safe);
      const status = safeStatus(trackerSummary, boardSummary);
      const progress = obj(trackerSummary.cohortProgressSummary);
      return sanitizeFlightWorkflowCohortProgressViewModel({
        viewModelName: VIEW_MODEL_NAME,
        appVersion: FLIGHT_WORKFLOW_COHORT_PROGRESS_VIEW_MODEL_VERSION,
        status: status,
        title: "只读试点进度追踪",
        cards: [
          card("progress", "只读试点进度追踪", obj(trackerSummary.userFacingSummary).resultLabel || progress.progressLabel || "仍需更多测试者"),
          card("batch", "测试批次进度", String(progress.consentedCount || 0) + "/" + String(progress.totalCount || obj(cohortSummary.cohort).totalCount || 0)),
          card("milestone", "只读试点里程碑", obj(boardSummary.userFacingSummary).resultLabel || boardSummary.trialMilestoneStatus || "仍需更多测试者"),
          card("next_batch", "下一批测试", obj(boardSummary.userFacingSummary).resultLabel || (boardSummary.safeToAdvanceNextCohort === true ? "可以进入下一批只读测试" : "仍需更多测试者"))
        ],
        rows: rows(safe),
        riskRows: [
          { rowId:"invitation_gate", label:"试点邀请", value:obj(gateSummary.userFacingSummary).resultLabel || gateSummary.status || "待邀请", status:text(gateSummary.status || "waitlist"), redacted:true },
          { rowId:"support_playbook", label:"支持准备", value:obj(playbookSummary.userFacingSummary).resultLabel || playbookSummary.status || "支持处理路径已准备", status:text(playbookSummary.status || "ready"), redacted:true },
          { rowId:"onboarding", label:"试点进入确认", value:obj(onboardingSummary.userFacingSummary).resultLabel || onboardingSummary.status || "需要确认只读范围", status:text(onboardingSummary.status || "needs_consent"), redacted:true },
          { rowId:"consent", label:"只读范围确认", value:obj(consentSummary.userFacingSummary).resultLabel || consentSummary.status || "仍有必选项未确认", status:text(consentSummary.status || "not_started"), redacted:true }
        ],
        trackerSummary: trackerSummary,
        boardSummary: boardSummary,
        cohortProgressSummary: progress,
        trialMilestoneSummary: obj(boardSummary.trialMilestoneSummary),
        rolloutControlSummary: clone(safe.rolloutControlSummary || null),
        cohortHealthSummary: clone(safe.cohortHealthSummary || null),
        rolloutDecisionStatus: text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
        cohortHealthStatus: text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
        rolloutNextStep: text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
        safeToAdvanceNextCohort: boardSummary.safeToAdvanceNextCohort === true || trackerSummary.safeToAdvanceNextCohort === true,
        invitationGateSummary: gateSummary,
        testerCohortEnrollmentConsoleSummary: cohortSummary,
        pilotReadinessSnapshotSummary: snapshotSummary,
        supportPlaybookSummary: playbookSummary,
        pilotOnboardingSummary: onboardingSummary,
        readOnlyConsentSummary: consentSummary,
        caveat: CAVEAT,
        redacted: true,
        trackerName: obj(trackerSummary).trackerName || "flight_workflow_public_pilot_cohort_progress_tracker_v1",
        boardName: obj(boardSummary).boardName || "flight_workflow_read_only_trial_milestone_board_v1"
      });
    } catch (error) {
      return sanitizeFlightWorkflowCohortProgressViewModel({ viewModelName: VIEW_MODEL_NAME, appVersion: FLIGHT_WORKFLOW_COHORT_PROGRESS_VIEW_MODEL_VERSION, status: "failed_safe", title: "只读试点进度追踪", cards: [], rows: [], riskRows: [], caveat: CAVEAT, redacted: true });
    }
  }
  function sanitizeFlightWorkflowCohortProgressViewModel(vm) {
    const safe = obj(vm);
    const status = /^(ready|needs_more_testers|needs_review|blocked|failed_safe)$/.test(safe.status) ? safe.status : "failed_safe";
    return clone({
      viewModelName: VIEW_MODEL_NAME,
      appVersion: FLIGHT_WORKFLOW_COHORT_PROGRESS_VIEW_MODEL_VERSION,
      status: status,
      title: "只读试点进度追踪",
      cards: Array.isArray(safe.cards) ? safe.cards.map(function (item) { return card(item.cardId || "card", item.label || "", item.value || ""); }) : [],
      rows: toArray(safe.rows),
      riskRows: toArray(safe.riskRows),
      trackerSummary: clone(safe.trackerSummary || null),
      boardSummary: clone(safe.boardSummary || null),
      cohortProgressSummary: clone(safe.cohortProgressSummary || null),
      trialMilestoneSummary: clone(safe.trialMilestoneSummary || null),
      rolloutControlSummary: clone(safe.rolloutControlSummary || null),
      cohortHealthSummary: clone(safe.cohortHealthSummary || null),
      rolloutDecisionStatus: text(safe.rolloutDecisionStatus || obj(safe.rolloutControlSummary).status || ""),
      cohortHealthStatus: text(safe.cohortHealthStatus || obj(safe.cohortHealthSummary).status || ""),
      rolloutNextStep: text(safe.rolloutNextStep || obj(obj(safe.rolloutControlSummary).decision).label || ""),
      safeToAdvanceNextCohort: safe.safeToAdvanceNextCohort === true,
      invitationGateSummary: clone(safe.invitationGateSummary || null),
      testerCohortEnrollmentConsoleSummary: clone(safe.testerCohortEnrollmentConsoleSummary || null),
      pilotReadinessSnapshotSummary: clone(safe.pilotReadinessSnapshotSummary || null),
      supportPlaybookSummary: clone(safe.supportPlaybookSummary || null),
      pilotOnboardingSummary: clone(safe.pilotOnboardingSummary || null),
      readOnlyConsentSummary: clone(safe.readOnlyConsentSummary || null),
      caveat: text(safe.caveat || CAVEAT),
      trackerName: text(safe.trackerName || "flight_workflow_public_pilot_cohort_progress_tracker_v1"),
      boardName: text(safe.boardName || "flight_workflow_read_only_trial_milestone_board_v1"),
      redacted: true
    });
  }
  function buildFlightWorkflowCohortProgressViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowCohortProgressViewModel(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_COHORT_PROGRESS_VIEW_MODEL_AUDIT_DRAFT", viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_COHORT_PROGRESS_VIEW_MODEL_VERSION, status:vm.status, cardCount:vm.cards.length, rowCount:vm.rows.length, safeToAdvanceNextCohort:vm.safeToAdvanceNextCohort === true, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }
  window.WeishanFlightWorkflowCohortProgressViewModel = { FLIGHT_WORKFLOW_COHORT_PROGRESS_VIEW_MODEL_VERSION, VIEW_MODEL_NAME, buildFlightWorkflowCohortProgressViewModel, buildFlightWorkflowCohortProgressRows:rows, buildFlightWorkflowCohortProgressViewModelAuditDraft, sanitizeFlightWorkflowCohortProgressViewModel };
})();
