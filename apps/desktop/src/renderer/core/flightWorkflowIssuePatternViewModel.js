;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_ISSUE_PATTERN_VIEW_MODEL_VERSION = "4.1.3";
  const VIEW_MODEL_NAME = "flight_workflow_issue_pattern_view_model_v1";
  const CAVEAT = "问题趋势仅用于改进只读候选证据流程，不代表客服工单、交易请求或出票请求。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(/token|apiKey|key|secret|password|credential|身份证|护照|银行卡|登录凭据|passport|cardNumber|https?:\/\/\S+/ig, "redacted").trim(); }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function radar(input) { const safe = obj(input); return first(safe.issuePatternRadar, safe.issuePatternSummary, safe.publicPilotIssuePatternRadar, safe.radar); }
  function gate(input) { const safe = obj(input); return first(safe.supportReadinessGate, safe.supportReadinessSummary, safe.gate); }
  function statusFor(input) {
    const r = radar(input);
    const g = gate(input);
    if (r.status === "blocked" || g.status === "blocked") return "blocked";
    if (r.status === "needs_review" || g.status === "needs_review") return "needs_review";
    if (r.status === "failed_safe" || g.status === "failed_safe") return "failed_safe";
    if (g.status === "continue_small_pilot" || r.status === "insufficient_data") return "continue_small_pilot";
    return "ready";
  }
  function buildFlightWorkflowIssuePatternCards(input) {
    const r = radar(input);
    const g = gate(input);
    const health = obj(r.issuePatternHealth);
    const pattern = obj(r.patternSummary);
    const decision = obj(g.decision);
    return clone([
      { cardId:"issues", label:"问题数量", value:text(String(health.issueCount || 0)) },
      { cardId:"pattern", label:"主要问题趋势", value:text(pattern.dominantPattern || "none") },
      { cardId:"support", label:"支持准备", value:text(obj(g.userFacingSummary).resultLabel || decision.label || "继续小范围试点") },
      { cardId:"next_step", label:"下一步", value:text(decision.message || pattern.message || "继续观察只读试点反馈") }
    ]);
  }
  function buildFlightWorkflowIssuePatternRows(input) {
    const r = radar(input);
    return clone((Array.isArray(r.signals) ? r.signals : []).map(function (row) { return { rowId:text(row.signalId || row.rowId), label:text(row.label), value:text(row.value), status:/^(pass|warning|blocked)$/.test(row.status) ? row.status : "pass" }; }));
  }
  function buildFlightWorkflowSupportReadinessRows(input) {
    const g = gate(input);
    const criteria = obj(g.criteria);
    return clone(Object.keys(criteria).map(function (key) { return { rowId:text(key), label:text(key), value:criteria[key] === true ? "通过" : "待复核", status:criteria[key] === true ? "pass" : "warning" }; }));
  }
  function buildFlightWorkflowIssuePatternViewModel(input) {
    try {
      const r = radar(input);
      const g = gate(input);
      return clone({ viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_ISSUE_PATTERN_VIEW_MODEL_VERSION, status:statusFor(input || {}), title:"试点问题趋势雷达", cards:buildFlightWorkflowIssuePatternCards(input || {}), issuePatternRows:buildFlightWorkflowIssuePatternRows(input || {}), supportReadinessRows:buildFlightWorkflowSupportReadinessRows(input || {}), riskRows:(Array.isArray(g.riskNotes) ? g.riskNotes : []).map(function (note, index) { return { rowId:"risk_" + index, label:"风险说明", value:text(note), status:"warning" }; }), caveat:CAVEAT, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
    } catch (error) {
      return clone({ viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_ISSUE_PATTERN_VIEW_MODEL_VERSION, status:"failed_safe", title:"试点问题趋势雷达", cards:[], issuePatternRows:[], supportReadinessRows:[], riskRows:[], caveat:CAVEAT, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
    }
  }
  function buildFlightWorkflowIssuePatternViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowIssuePatternViewModel(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_ISSUE_PATTERN_VIEW_MODEL_AUDIT_DRAFT", viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_ISSUE_PATTERN_VIEW_MODEL_VERSION, status:vm.status, cardCount:vm.cards.length, issuePatternRowCount:vm.issuePatternRows.length, supportReadinessRowCount:vm.supportReadinessRows.length, riskRowCount:vm.riskRows.length, rawUserTextStored:false, rawResponseStored:false, secretStored:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }

  window.WeishanFlightWorkflowIssuePatternViewModel = { FLIGHT_WORKFLOW_ISSUE_PATTERN_VIEW_MODEL_VERSION, VIEW_MODEL_NAME, buildFlightWorkflowIssuePatternViewModel, buildFlightWorkflowIssuePatternCards, buildFlightWorkflowIssuePatternRows, buildFlightWorkflowSupportReadinessRows, buildFlightWorkflowIssuePatternViewModelAuditDraft };
})();
