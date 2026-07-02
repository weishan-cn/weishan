;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PILOT_ISSUE_REVIEW_VIEW_MODEL_VERSION = "4.0.0";
  const VIEW_MODEL_NAME = "flight_workflow_pilot_issue_review_view_model_v1";
  const CAVEAT = "问题复核只用于改进只读候选证据流程，不代表客服工单、交易请求或出票请求。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).replace(/token|apiKey|key|secret|password|credential|身份证|护照|银行卡|登录凭据|passport|cardNumber|https?:\/\/\S+/ig, "redacted").trim(); }
  function first() { for (let index = 0; index < arguments.length; index += 1) { const value = obj(arguments[index]); if (Object.keys(value).length) return value; } return {}; }
  function board(input) { const safe = obj(input); return first(safe.issueReviewBoard, safe.publicPilotIssueReviewBoard, safe.issueReviewSummary, safe.board); }
  function dashboard(input) { const safe = obj(input); return first(safe.supportTriageDashboard, safe.supportTriageSummary, safe.triageDashboard, safe.dashboard); }
  function statusFor(input) {
    const review = board(input);
    const triage = dashboard(input);
    if (review.status === "blocked" || triage.status === "blocked") return "blocked";
    if (review.status === "needs_review" || triage.status === "needs_internal_review") return "needs_review";
    if (review.status === "failed_safe" || triage.status === "failed_safe") return "failed_safe";
    return "ready";
  }
  function buildFlightWorkflowPilotIssueReviewCards(input) {
    const review = board(input);
    const triage = dashboard(input);
    const health = obj(review.issueHealth);
    const triageModel = obj(triage.triage);
    const status = statusFor(input);
    return clone([
      { cardId:"issue", label:"问题状态", value:status === "blocked" ? "问题已安全阻断" : (status === "needs_review" ? "需要内部复核" : "问题可用于改进参考") },
      { cardId:"triage", label:"分流建议", value:text(triageModel.label || obj(triage.userFacingSummary).resultLabel || "已有建议处理路径") },
      { cardId:"pilot", label:"试点影响", value:health.affectsPilotExpansion || triageModel.affectsPilotExpansion ? "问题影响试点扩大" : "暂不影响试点扩大" },
      { cardId:"safety", label:"安全限制", value:"已脱敏；不会提交客服工单或交易请求；不付款、不下单、不出票。" }
    ]);
  }
  function buildFlightWorkflowPilotIssueReviewRows(input) {
    const review = board(input);
    return clone((Array.isArray(review.rows) ? review.rows : []).map(function (row) { return { rowId:text(row.rowId), label:text(row.label), value:text(row.value), status:/^(pass|warning|blocked)$/.test(row.status) ? row.status : "pass" }; }));
  }
  function buildFlightWorkflowSupportTriageRowsForView(input) {
    const triage = dashboard(input);
    return clone((Array.isArray(triage.rows) ? triage.rows : []).map(function (row) { return { rowId:text(row.rowId), label:text(row.label), value:text(row.value), status:/^(pass|warning|blocked)$/.test(row.status) ? row.status : "pass" }; }));
  }
  function buildFlightWorkflowPilotIssueReviewViewModel(input) {
    try {
      const review = board(input);
      const triage = dashboard(input);
      return clone({ viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_PILOT_ISSUE_REVIEW_VIEW_MODEL_VERSION, status:statusFor(input || {}), title:"只读试点问题复核", cards:buildFlightWorkflowPilotIssueReviewCards(input || {}), issueRows:buildFlightWorkflowPilotIssueReviewRows(input || {}), triageRows:buildFlightWorkflowSupportTriageRowsForView(input || {}), findings:(Array.isArray(review.findings) ? review.findings : []).map(function (finding) { return { findingId:text(finding.findingId), severity:/^(info|warning|blocked)$/.test(finding.severity) ? finding.severity : "info", title:text(finding.title), message:text(finding.message) }; }), caveat:CAVEAT, userFacingSummary:{ title:"只读试点问题复核", resultLabel:text(obj(review.userFacingSummary).resultLabel || "问题可用于改进参考"), triageLabel:text(obj(triage.userFacingSummary).resultLabel || "已有建议处理路径"), caveat:CAVEAT }, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
    } catch (error) {
      return clone({ viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_PILOT_ISSUE_REVIEW_VIEW_MODEL_VERSION, status:"failed_safe", title:"只读试点问题复核", cards:[], issueRows:[], triageRows:[], findings:[], caveat:CAVEAT, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true });
    }
  }
  function buildFlightWorkflowPilotIssueReviewViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowPilotIssueReviewViewModel(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_PILOT_ISSUE_REVIEW_VIEW_MODEL_AUDIT_DRAFT", viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_PILOT_ISSUE_REVIEW_VIEW_MODEL_VERSION, status:vm.status, cardCount:vm.cards.length, issueRowCount:vm.issueRows.length, triageRowCount:vm.triageRows.length, findingCount:vm.findings.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true });
  }

  window.WeishanFlightWorkflowPilotIssueReviewViewModel = { FLIGHT_WORKFLOW_PILOT_ISSUE_REVIEW_VIEW_MODEL_VERSION, VIEW_MODEL_NAME, buildFlightWorkflowPilotIssueReviewViewModel, buildFlightWorkflowPilotIssueReviewCards, buildFlightWorkflowPilotIssueReviewRows, buildFlightWorkflowSupportTriageRowsForView, buildFlightWorkflowPilotIssueReviewViewModelAuditDraft };
})();
