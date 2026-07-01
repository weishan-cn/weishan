;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PILOT_OPS_VIEW_MODEL_VERSION = "3.4.0";
  const VIEW_MODEL_NAME = "flight_workflow_pilot_ops_view_model_v1";
  const CAVEAT = "该页面只用于只读试点运营判断，不保存真实身份、不发送真实邀请、不提供交易能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim().replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) { return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label), value:text(value), redacted:true }; }
  function api(name) { return window[name] || {}; }
  function opsApi() { return window.WeishanFlightWorkflowReadOnlyPilotOpsSummary || {}; }
  function decisionApi() { return window.WeishanFlightWorkflowNextCohortDecisionBoard || {}; }
  function exitCriteriaApi() { return window.WeishanFlightWorkflowReadOnlyPilotExitCriteria || {}; }
  function launchCandidateApi() { return window.WeishanFlightWorkflowLaunchCandidateReadinessBoard || {}; }
  function buildOps(input) { const safe = obj(input); if (safe.pilotOpsSummary && typeof safe.pilotOpsSummary === "object") return safe.pilotOpsSummary; return typeof opsApi().buildFlightWorkflowReadOnlyPilotOpsSummary === "function" ? opsApi().buildFlightWorkflowReadOnlyPilotOpsSummary(safe) : {}; }
  function buildDecision(input) { const safe = obj(input); if (safe.nextCohortDecisionSummary && typeof safe.nextCohortDecisionSummary === "object") return safe.nextCohortDecisionSummary; return typeof decisionApi().buildFlightWorkflowNextCohortDecisionBoard === "function" ? decisionApi().buildFlightWorkflowNextCohortDecisionBoard(safe) : {}; }
  function buildExitCriteria(input) { const safe = obj(input); if (safe.pilotExitCriteriaSummary && typeof safe.pilotExitCriteriaSummary === "object") return safe.pilotExitCriteriaSummary; return typeof exitCriteriaApi().buildFlightWorkflowReadOnlyPilotExitCriteria === "function" ? exitCriteriaApi().buildFlightWorkflowReadOnlyPilotExitCriteria(safe) : {}; }
  function buildLaunchCandidate(input) { const safe = obj(input); if (safe.launchCandidateReadinessSummary && typeof safe.launchCandidateReadinessSummary === "object") return safe.launchCandidateReadinessSummary; return typeof launchCandidateApi().buildFlightWorkflowLaunchCandidateReadinessBoard === "function" ? launchCandidateApi().buildFlightWorkflowLaunchCandidateReadinessBoard(safe) : {}; }
  function buildFlightWorkflowPilotExitCriteriaRowsForView(input) {
    const criteria = buildExitCriteria(input || {});
    return toArray(criteria.rows).length ? clone(criteria.rows) : [
      row("ops_healthy", "试点运营", obj(criteria.exitHealth).opsHealthy ? "试点运行健康" : "继续试点观察", obj(criteria.exitHealth).opsHealthy ? "pass" : "warning"),
      row("launch_candidate", "发布候选", obj(criteria.exitHealth).readyForLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察", obj(criteria.exitHealth).readyForLaunchCandidate ? "pass" : "warning")
    ];
  }
  function buildFlightWorkflowLaunchCandidateRowsForView(input) {
    const board = buildLaunchCandidate(input || {});
    return toArray(board.rows).length ? clone(board.rows) : [
      row("pilot_exit_criteria", "试点退出条件", obj(board.launchCandidateReadiness).pilotExitCriteriaMet ? "试点退出条件已满足" : "继续试点观察", obj(board.launchCandidateReadiness).pilotExitCriteriaMet ? "pass" : "warning"),
      row("launch_candidate", "发布候选", obj(board.launchCandidateReadiness).safeForReadOnlyLaunchCandidate ? "可以进入只读发布候选" : "继续试点观察", obj(board.launchCandidateReadiness).safeForReadOnlyLaunchCandidate ? "pass" : (board.status === "blocked" ? "blocked" : "warning"))
    ];
  }
  function buildFlightWorkflowPilotOpsCards(input) {
    const ops = buildOps(input || {});
    const decision = buildDecision(input || {});
    const exitCriteria = buildExitCriteria(input || {});
    const launchCandidate = buildLaunchCandidate(input || {});
    const primaryRisk = obj(ops.primaryRisk);
    const support = obj(obj(ops.supportReadinessSummary).userFacingSummary);
    return clone([
      card("ops", "运营状态", obj(ops.userFacingSummary).resultLabel || "试点运行健康"),
      card("next_cohort", "下一批决策", obj(decision.userFacingSummary).resultLabel || obj(decision.decision).label || "继续当前批次"),
      card("risk", "主要风险", primaryRisk.label || "无主要风险"),
      card("support", "支持准备", support.resultLabel || (obj(ops.opsHealth).supportReady ? "支持准备" : "需要内部复核")),
      card("exit_criteria", "试点退出条件", obj(exitCriteria.userFacingSummary).resultLabel || "继续试点观察"),
      card("launch_candidate", "发布候选", obj(launchCandidate.userFacingSummary).resultLabel || "继续试点观察")
    ]);
  }
  function buildFlightWorkflowPilotOpsRows(input) {
    const ops = buildOps(input || {});
    const exitCriteria = buildExitCriteria(input || {});
    const launchCandidate = buildLaunchCandidate(input || {});
    return toArray(ops.rows).length ? clone(ops.rows) : [
      row("ops_status", "运营状态", obj(ops.userFacingSummary).resultLabel || "试点运行健康", ops.status === "blocked" ? "blocked" : "warning"),
      row("risk", "主要风险", obj(ops.primaryRisk).label || "无主要风险", obj(ops.primaryRisk).riskId === "none" ? "pass" : (ops.status === "blocked" ? "blocked" : "warning")),
      row("exit_criteria", "试点退出条件", obj(exitCriteria.userFacingSummary).resultLabel || "继续试点观察", exitCriteria.status === "met" ? "pass" : "warning"),
      row("launch_candidate", "发布候选", obj(launchCandidate.userFacingSummary).resultLabel || "继续试点观察", launchCandidate.status === "ready" ? "pass" : (launchCandidate.status === "blocked" ? "blocked" : "warning"))
    ];
  }
  function buildFlightWorkflowNextCohortDecisionRowsForView(input) {
    const decision = buildDecision(input || {});
    return toArray(decision.decisionRows).length ? clone(decision.decisionRows) : [
      row("decision", "决策", obj(decision.userFacingSummary).resultLabel || obj(decision.decision).label || "继续当前批次", decision.status === "blocked" ? "blocked" : "warning"),
      row("criteria", "关键条件", toArray(decision.unmetCriteria).length === 0 ? "全部满足" : toArray(decision.unmetCriteria).join("、"), toArray(decision.unmetCriteria).length === 0 ? "pass" : (decision.status === "blocked" ? "blocked" : "warning"))
    ];
  }
  function buildRiskRows(input) {
    const ops = buildOps(input || {});
    const decision = buildDecision(input || {});
    const exitCriteria = buildExitCriteria(input || {});
    const launchCandidate = buildLaunchCandidate(input || {});
    const primaryRisk = obj(ops.primaryRisk);
    return [
      row("primary_risk", "主要风险", primaryRisk.label || "无主要风险", primaryRisk.riskId === "none" ? "pass" : (ops.status === "blocked" || decision.status === "blocked" ? "blocked" : "warning")),
      row("safety", "安全回归", obj(obj(ops.safetyRegressionSummary).userFacingSummary).resultLabel || (obj(ops.opsHealth).safetySentinelPass ? "安全回归通过" : "已阻断"), obj(ops.opsHealth).safetySentinelPass ? "pass" : "blocked"),
      row("exit_criteria", "试点退出条件", obj(exitCriteria.userFacingSummary).resultLabel || "继续试点观察", exitCriteria.status === "met" ? "pass" : "warning"),
      row("launch_candidate", "发布候选", obj(launchCandidate.userFacingSummary).resultLabel || "继续试点观察", launchCandidate.status === "ready" ? "pass" : (launchCandidate.status === "blocked" ? "blocked" : "warning"))
    ];
  }
  function sanitizeFlightWorkflowPilotOpsViewModel(vm) {
    const safe = obj(vm);
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_PILOT_OPS_VIEW_MODEL_VERSION,
      status:text(safe.status || "needs_review"),
      title:"只读试点运营摘要",
      cards:toArray(safe.cards).map(function (item) { return card(item.cardId || "card", item.label || "", item.value || ""); }),
      opsRows:toArray(safe.opsRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      decisionRows:toArray(safe.decisionRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      riskRows:toArray(safe.riskRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      exitCriteriaRows:toArray(safe.exitCriteriaRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      launchCandidateRows:toArray(safe.launchCandidateRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      caveat:text(safe.caveat || CAVEAT),
      pilotOpsSummary:clone(safe.pilotOpsSummary || null),
      nextCohortDecisionSummary:clone(safe.nextCohortDecisionSummary || null),
      pilotExitCriteriaSummary:clone(safe.pilotExitCriteriaSummary || null),
      launchCandidateReadinessSummary:clone(safe.launchCandidateReadinessSummary || null),
      launchCandidateStatus:text(safe.launchCandidateStatus || ""),
      readyForLaunchCandidate:safe.readyForLaunchCandidate === true,
      launchCandidateNextStep:text(safe.launchCandidateNextStep || ""),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }
  function buildFlightWorkflowPilotOpsViewModel(input) {
    try {
      const ops = buildOps(input || {});
      const decision = buildDecision(input || {});
      const exitCriteria = buildExitCriteria(input || {});
      const launchCandidate = buildLaunchCandidate(input || {});
      const status = decision.status === "blocked" || ops.status === "blocked" ? "blocked" : (decision.status === "advance" || ops.status === "healthy" ? "healthy" : (decision.status === "pause" ? "pause_expansion" : (decision.status === "needs_review" ? "needs_review" : "continue_current_batch")));
      return sanitizeFlightWorkflowPilotOpsViewModel({
        status:status,
        title:"只读试点运营摘要",
        cards:buildFlightWorkflowPilotOpsCards(input || {}),
        opsRows:buildFlightWorkflowPilotOpsRows(input || {}),
        decisionRows:buildFlightWorkflowNextCohortDecisionRowsForView(input || {}),
        riskRows:buildRiskRows(input || {}),
        exitCriteriaRows:buildFlightWorkflowPilotExitCriteriaRowsForView(input || {}),
        launchCandidateRows:buildFlightWorkflowLaunchCandidateRowsForView(input || {}),
        caveat:CAVEAT,
        pilotOpsSummary:ops,
        nextCohortDecisionSummary:decision,
        pilotExitCriteriaSummary:exitCriteria,
        launchCandidateReadinessSummary:launchCandidate,
        launchCandidateStatus:launchCandidate.status,
        readyForLaunchCandidate:launchCandidate.launchCandidateReadiness && launchCandidate.launchCandidateReadiness.safeForReadOnlyLaunchCandidate === true,
        launchCandidateNextStep:launchCandidate.launchCandidateNextStep,
        redacted:true
      });
    } catch (error) {
      return sanitizeFlightWorkflowPilotOpsViewModel({ status:"failed_safe", title:"只读试点运营摘要", cards:[], opsRows:[], decisionRows:[], riskRows:[], exitCriteriaRows:[], launchCandidateRows:[], caveat:CAVEAT });
    }
  }
  function buildFlightWorkflowPilotOpsViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowPilotOpsViewModel(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_PILOT_OPS_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_PILOT_OPS_VIEW_MODEL_VERSION,
      status:vm.status,
      cardCount:vm.cards.length,
      opsRowCount:vm.opsRows.length,
      decisionRowCount:vm.decisionRows.length,
      riskRowCount:vm.riskRows.length,
      exitCriteriaRowCount:vm.exitCriteriaRows.length,
      launchCandidateRowCount:vm.launchCandidateRows.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }

  window.WeishanFlightWorkflowPilotOpsViewModel = {
    FLIGHT_WORKFLOW_PILOT_OPS_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildFlightWorkflowPilotOpsViewModel,
    buildFlightWorkflowPilotOpsCards,
    buildFlightWorkflowPilotOpsRows,
    buildFlightWorkflowNextCohortDecisionRowsForView,
    buildFlightWorkflowPilotExitCriteriaRowsForView,
    buildFlightWorkflowLaunchCandidateRowsForView,
    buildFlightWorkflowPilotOpsViewModelAuditDraft,
    sanitizeFlightWorkflowPilotOpsViewModel
  };
})();
