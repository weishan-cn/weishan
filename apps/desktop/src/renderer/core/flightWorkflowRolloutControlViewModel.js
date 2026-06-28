;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_ROLLOUT_CONTROL_VIEW_MODEL_VERSION = "2.1.85";
  const VIEW_MODEL_NAME = "flight_workflow_rollout_control_view_model_v1";
  const CAVEAT = "该页面只管理只读试点流程，不保存真实身份、不发送真实邀请、不提供交易能力。";
  const SENSITIVE_RE = /https?:\/\/\S+|(?:token|apiKey|key|secret|password|credential|cardNumber)\s*[:=]?\s*\S+|身份证|护照|银行卡|passport|真实姓名|手机号|邮箱/ig;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(SENSITIVE_RE, "redacted").trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function card(cardId, label, value) { return { cardId, label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) { return { rowId, label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rolloutApi() { return window.WeishanFlightWorkflowReadOnlyPilotRolloutControlCenter || {}; }
  function cohortApi() { return window.WeishanFlightWorkflowCohortHealthDashboard || {}; }
  function pilotOpsApi() { return window.WeishanFlightWorkflowReadOnlyPilotOpsSummary || {}; }
  function decisionApi() { return window.WeishanFlightWorkflowNextCohortDecisionBoard || {}; }
  function buildRollout(input) { const safe = obj(input); if (safe.rolloutControlSummary && typeof safe.rolloutControlSummary === "object") return safe.rolloutControlSummary; const api = rolloutApi(); return typeof api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter === "function" ? api.buildFlightWorkflowReadOnlyPilotRolloutControlCenter(safe) : {}; }
  function buildCohort(input) { const safe = obj(input); if (safe.cohortHealthSummary && typeof safe.cohortHealthSummary === "object") return safe.cohortHealthSummary; const api = cohortApi(); return typeof api.buildFlightWorkflowCohortHealthDashboard === "function" ? api.buildFlightWorkflowCohortHealthDashboard(safe) : {}; }
  function buildPilotOps(input) { const safe = obj(input); if (safe.pilotOpsSummary && typeof safe.pilotOpsSummary === "object") return safe.pilotOpsSummary; const api = pilotOpsApi(); return typeof api.buildFlightWorkflowReadOnlyPilotOpsSummary === "function" ? api.buildFlightWorkflowReadOnlyPilotOpsSummary(safe) : {}; }
  function buildDecision(input) { const safe = obj(input); if (safe.nextCohortDecisionSummary && typeof safe.nextCohortDecisionSummary === "object") return safe.nextCohortDecisionSummary; const api = decisionApi(); return typeof api.buildFlightWorkflowNextCohortDecisionBoard === "function" ? api.buildFlightWorkflowNextCohortDecisionBoard(safe) : {}; }
  function buildFlightWorkflowRolloutControlCards(input) {
    const rollout = buildRollout(input || {});
    const cohort = buildCohort(input || {});
    const pilotOps = buildPilotOps(input || {});
    const nextDecision = buildDecision(input || {});
    const rolloutDecision = obj(rollout.decision);
    const cohortSummary = obj(cohort.userFacingSummary);
    return clone([
      card("rollout", "发布控制", rolloutDecision.label || obj(rollout.userFacingSummary).resultLabel || "继续当前小范围试点"),
      card("cohort_health", "批次健康", cohortSummary.resultLabel || "批次进行中"),
      card("pilot_ops", "试点运营摘要", obj(pilotOps.userFacingSummary).resultLabel || "试点运行健康"),
      card("next_cohort", "下一批决策", obj(nextDecision.userFacingSummary).resultLabel || obj(nextDecision.decision).label || "继续当前批次"),
      card("issues", "问题风险", rollout.status === "pause_expansion" ? "暂停扩大测试" : rollout.status === "blocked" ? "已阻断" : "发布控制正常"),
      card("next_step", "下一步", nextDecision.decision && nextDecision.decision.safeToAdvanceNextCohort ? "可以进入下一批只读测试" : (nextDecision.decision && nextDecision.decision.label) || "继续当前小范围试点")
    ]);
  }
  function buildFlightWorkflowRolloutControlRows(input) {
    const rollout = buildRollout(input || {});
    return toArray(rollout.rows).length ? clone(rollout.rows) : [row("rollout", "发布控制", obj(rollout.decision).label || "继续当前小范围试点", rollout.status === "blocked" ? "blocked" : rollout.status === "ready" ? "pass" : "warning")];
  }
  function buildFlightWorkflowCohortHealthRowsForView(input) {
    const cohort = buildCohort(input || {});
    return toArray(cohort.rows).length ? clone(cohort.rows) : [row("cohort_health", "批次健康", obj(cohort.userFacingSummary).resultLabel || "批次进行中", cohort.status === "blocked" ? "blocked" : cohort.status === "healthy" ? "pass" : "warning")];
  }
  function sanitizeFlightWorkflowRolloutControlViewModel(vm) {
    const safe = obj(vm);
    return clone({ viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_ROLLOUT_CONTROL_VIEW_MODEL_VERSION, status:text(safe.status || "needs_review"), title:"只读试点发布控制中心", cards:toArray(safe.cards).map(function (item) { return card(item.cardId || "card", item.label || "", item.value || ""); }), rolloutRows:toArray(safe.rolloutRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }), cohortHealthRows:toArray(safe.cohortHealthRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }), riskRows:toArray(safe.riskRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }), caveat:text(safe.caveat || CAVEAT), rolloutControlSummary:clone(safe.rolloutControlSummary || null), cohortHealthSummary:clone(safe.cohortHealthSummary || null), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }
  function buildFlightWorkflowRolloutControlViewModel(input) {
    try {
      const rollout = buildRollout(input || {});
      const cohort = buildCohort(input || {});
      const status = rollout.status === "blocked" || cohort.status === "blocked" ? "blocked" : rollout.status === "ready" && cohort.status === "healthy" ? "ready" : rollout.status === "pause_expansion" ? "pause_expansion" : "needs_review";
      return sanitizeFlightWorkflowRolloutControlViewModel({ status, cards:buildFlightWorkflowRolloutControlCards(input || {}), rolloutRows:buildFlightWorkflowRolloutControlRows(input || {}), cohortHealthRows:buildFlightWorkflowCohortHealthRowsForView(input || {}), riskRows:[row("identity", "真实身份", "不保存真实身份", "pass"), row("invite", "真实邀请", "不发送真实邀请", "pass"), row("trading", "交易能力", "不提供交易能力", "pass")], caveat:CAVEAT, rolloutControlSummary:rollout, cohortHealthSummary:cohort, redacted:true });
    } catch (error) {
      return sanitizeFlightWorkflowRolloutControlViewModel({ status:"failed_safe", cards:[], rolloutRows:[], cohortHealthRows:[], riskRows:[], caveat:CAVEAT });
    }
  }
  function buildFlightWorkflowRolloutControlViewModelAuditDraft(input) { const vm = buildFlightWorkflowRolloutControlViewModel(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_ROLLOUT_CONTROL_VIEW_MODEL_AUDIT_DRAFT", viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_ROLLOUT_CONTROL_VIEW_MODEL_VERSION, status:vm.status, cardCount:vm.cards.length, rolloutRowCount:vm.rolloutRows.length, cohortHealthRowCount:vm.cohortHealthRows.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }); }

  window.WeishanFlightWorkflowRolloutControlViewModel = { FLIGHT_WORKFLOW_ROLLOUT_CONTROL_VIEW_MODEL_VERSION, VIEW_MODEL_NAME, buildFlightWorkflowRolloutControlViewModel, buildFlightWorkflowRolloutControlCards, buildFlightWorkflowRolloutControlRows, buildFlightWorkflowCohortHealthRowsForView, buildFlightWorkflowRolloutControlViewModelAuditDraft, sanitizeFlightWorkflowRolloutControlViewModel };
})();
