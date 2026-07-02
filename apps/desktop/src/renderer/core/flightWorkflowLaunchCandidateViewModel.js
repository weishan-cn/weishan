;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_VIEW_MODEL_VERSION = "4.0.1";
  const VIEW_MODEL_NAME = "flight_workflow_launch_candidate_view_model_v1";
  const CAVEAT = "该页面只用于只读发布候选判断，不保存真实身份、不发送真实邀请、不提供交易能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) { return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function api(name) { return window[name] || {}; }
  function exitCriteriaOf(input) {
    const safe = obj(input);
    if (safe.pilotExitCriteriaSummary) return safe.pilotExitCriteriaSummary;
    const loaded = api("WeishanFlightWorkflowReadOnlyPilotExitCriteria");
    return typeof loaded.buildFlightWorkflowReadOnlyPilotExitCriteria === "function" ? loaded.buildFlightWorkflowReadOnlyPilotExitCriteria(safe) : {};
  }
  function readinessBoardOf(input) {
    const safe = obj(input);
    if (safe.launchCandidateReadinessSummary) return safe.launchCandidateReadinessSummary;
    const loaded = api("WeishanFlightWorkflowLaunchCandidateReadinessBoard");
    return typeof loaded.buildFlightWorkflowLaunchCandidateReadinessBoard === "function" ? loaded.buildFlightWorkflowLaunchCandidateReadinessBoard(safe) : {};
  }
  function buildFlightWorkflowPilotExitCriteriaRowsForView(input) {
    const criteria = exitCriteriaOf(input || {});
    return toArray(criteria.rows).length ? clone(criteria.rows) : [
      row("ops_healthy", "试点运营", criteria.exitHealth && criteria.exitHealth.opsHealthy ? "试点运行健康" : "继续试点观察", criteria.exitHealth && criteria.exitHealth.opsHealthy ? "pass" : "warning"),
      row("launch_candidate", "发布候选", criteria.exitHealth && criteria.exitHealth.readyForLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察", criteria.exitHealth && criteria.exitHealth.readyForLaunchCandidate ? "pass" : "warning")
    ];
  }
  function buildFlightWorkflowLaunchCandidateRowsForView(input) {
    const board = readinessBoardOf(input || {});
    return toArray(board.rows).length ? clone(board.rows) : [
      row("pilot_exit_criteria", "试点退出条件", board.launchCandidateReadiness && board.launchCandidateReadiness.pilotExitCriteriaMet ? "试点退出条件已满足" : "继续试点观察", board.launchCandidateReadiness && board.launchCandidateReadiness.pilotExitCriteriaMet ? "pass" : "warning"),
      row("launch_candidate", "发布候选", board.launchCandidateReadiness && board.launchCandidateReadiness.safeForReadOnlyLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察", board.launchCandidateReadiness && board.launchCandidateReadiness.safeForReadOnlyLaunchCandidate ? "pass" : (board.status === "blocked" ? "blocked" : "warning"))
    ];
  }
  function buildRiskRows(input) {
    const criteria = exitCriteriaOf(input || {});
    const board = readinessBoardOf(input || {});
    return [
      row("safety", "安全红线", board.launchCandidateReadiness && board.launchCandidateReadiness.noSensitiveDataRisk && board.launchCandidateReadiness.noTradingRisk ? "安全红线正常" : "已阻断", board.launchCandidateReadiness && board.launchCandidateReadiness.noSensitiveDataRisk && board.launchCandidateReadiness.noTradingRisk ? "pass" : "blocked"),
      row("next_step", "下一步", board.launchCandidateNextStep || criteria.userFacingSummary && criteria.userFacingSummary.resultLabel || "继续试点观察", board.status === "ready" ? "pass" : (board.status === "blocked" ? "blocked" : "warning"))
    ];
  }
  function sanitizeFlightWorkflowLaunchCandidateViewModel(vm) {
    const safe = obj(vm);
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_VIEW_MODEL_VERSION,
      status:text(safe.status || "needs_review"),
      title:"只读发布候选准备",
      cards:toArray(safe.cards).map(function (item) { return card(item.cardId || "card", item.label || "", item.value || ""); }),
      exitCriteriaRows:toArray(safe.exitCriteriaRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      launchCandidateRows:toArray(safe.launchCandidateRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      riskRows:toArray(safe.riskRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      caveat:text(safe.caveat || CAVEAT),
      pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null),
      launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null),
      freezeGateSummary:clone(safe.freezeGateSummary || null),
      evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }
  function buildFlightWorkflowLaunchCandidateViewModel(input) {
    try {
      const exitCriteria = exitCriteriaOf(input || {});
      const board = readinessBoardOf(input || {});
      const status = board.status === "blocked" || exitCriteria.status === "blocked" ? "blocked" : (board.status === "ready" || exitCriteria.status === "met" ? "ready" : (board.status === "needs_review" ? "needs_review" : "continue_pilot"));
      return sanitizeFlightWorkflowLaunchCandidateViewModel({
        status:status,
        title:"只读发布候选准备",
        cards:buildFlightWorkflowLaunchCandidateCards(input || {}),
        exitCriteriaRows:buildFlightWorkflowPilotExitCriteriaRowsForView(input || {}),
        launchCandidateRows:buildFlightWorkflowLaunchCandidateRowsForView(input || {}),
        riskRows:buildRiskRows(input || {}),
        caveat:CAVEAT,
        pilotExitCriteriaSummary:exitCriteria,
        launchCandidateReadinessSummary:board,
        freezeGateSummary:clone(safe.freezeGateSummary || null),
        evidenceFreezePackSummary:clone(safe.evidenceFreezePackSummary || null),
        redacted:true
      });
    } catch (error) {
      return sanitizeFlightWorkflowLaunchCandidateViewModel({ status:"failed_safe", title:"只读发布候选准备", cards:[], exitCriteriaRows:[], launchCandidateRows:[], riskRows:[], caveat:CAVEAT });
    }
  }
  function buildFlightWorkflowLaunchCandidateCards(input) {
    const exitCriteria = exitCriteriaOf(input || {});
    const board = readinessBoardOf(input || {});
    return clone([
      card("exit_criteria", "试点退出条件", obj(exitCriteria.userFacingSummary).resultLabel || "继续试点观察"),
      card("launch_candidate", "发布候选", obj(board.userFacingSummary).resultLabel || "继续试点观察"),
      card("safety", "安全红线", board.launchCandidateReadiness && board.launchCandidateReadiness.noSensitiveDataRisk && board.launchCandidateReadiness.noTradingRisk ? "安全红线正常" : "已阻断"),
      card("next_step", "下一步", board.launchCandidateNextStep || "继续试点观察")
    ]);
  }
  function buildFlightWorkflowLaunchCandidateViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowLaunchCandidateViewModel(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_VIEW_MODEL_VERSION,
      status:vm.status,
      cardCount:vm.cards.length,
      exitCriteriaRowCount:vm.exitCriteriaRows.length,
      launchCandidateRowCount:vm.launchCandidateRows.length,
      riskRowCount:vm.riskRows.length,
      bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false,
      fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true
    });
  }

  window.WeishanFlightWorkflowLaunchCandidateViewModel = {
    FLIGHT_WORKFLOW_LAUNCH_CANDIDATE_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildFlightWorkflowLaunchCandidateViewModel,
    buildFlightWorkflowLaunchCandidateCards,
    buildFlightWorkflowPilotExitCriteriaRowsForView,
    buildFlightWorkflowLaunchCandidateRowsForView,
    buildFlightWorkflowLaunchCandidateViewModelAuditDraft,
    sanitizeFlightWorkflowLaunchCandidateViewModel
  };
})();
