;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_PILOT_SUPPORT_VIEW_MODEL_VERSION = "2.1.89";
  const VIEW_MODEL_NAME = "flight_workflow_pilot_support_view_model_v1";
  const CATEGORY_ROWS = [
    ["candidate_unclear", "看不懂候选证据"],
    ["platform_mismatch", "平台页面与候选证据不一致"],
    ["safety_copy_unclear", "安全说明不清楚"],
    ["consent_blocked", "只读范围确认无法完成"],
    ["feedback_error", "反馈填写异常"],
    ["other", "其它问题"]
  ];
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).replace(/https?:\/\/\S+|token|apiKey|key|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig, "redacted").trim(); }
  function safetyValue() { return "问题反馈已脱敏；不付款、不下单、不出票、不上传证件或银行卡。"; }
  function intake(input) { const safe = input && typeof input === "object" ? input : {}; return safe.issueIntakeSummary || safe.safeIssueIntakeSummary || safe.issueIntake || {}; }
  function fallback(input) { const safe = input && typeof input === "object" ? input : {}; return safe.supportFallbackSummary || safe.supportFallbackRecommendation || safe.supportFallback || {}; }
  function buildFlightWorkflowIssueCategoryRows() { return CATEGORY_ROWS.map(function (row) { return { rowId:row[0], label:row[1], value:row[1], redacted:true }; }); }
  function buildFlightWorkflowSupportRecommendationRows(input) { const rec = (fallback(input).recommendation || fallback(input).suggestedNextStep || {}); const rows = ["建议重新查看候选证据", "建议记录平台核对结果", "建议查看安全说明", "建议重新确认只读范围"].map(function (label, index) { return { rowId:"recommendation_" + index, label:label, value:label, active:rec.label === label, redacted:true }; }); return clone(rows); }
  function buildFlightWorkflowPilotSupportCards(input) { const issue = intake(input); const rec = fallback(input).recommendation || {}; const issueLabel = issue.issueSummary && issue.issueSummary.categoryLabel || issue.categoryLabel || "请选择问题类型"; const recLabel = rec.label || "需要内部复核"; return clone([{ cardId:"issue", label:"问题类型", value:text(issueLabel) }, { cardId:"recommendation", label:"建议处理", value:text(recLabel) }, { cardId:"safety", label:"安全限制", value:safetyValue() }]); }
  function buildFlightWorkflowPilotSupportViewModel(input) { try { const issue = intake(input); const rec = fallback(input); return clone({ viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_PILOT_SUPPORT_VIEW_MODEL_VERSION, status:issue.status || rec.status || "ready", title:"只读试点问题反馈", cards:buildFlightWorkflowPilotSupportCards(input || {}), issueRows:buildFlightWorkflowIssueCategoryRows(input || {}), recommendationRows:buildFlightWorkflowSupportRecommendationRows(input || {}), caveat:"问题反馈只用于改进只读候选证据流程，不代表客服工单、交易请求或出票请求。", safety:{ bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true }); } catch (error) { return clone({ viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_PILOT_SUPPORT_VIEW_MODEL_VERSION, status:"failed_safe", title:"只读试点问题反馈", cards:[], issueRows:[], recommendationRows:[], caveat:"问题反馈只用于改进只读候选证据流程，不代表客服工单、交易请求或出票请求。", bookingUrl:null, paymentUrl:null, orderUrl:null, redacted:true }); } }
  function buildFlightWorkflowPilotSupportViewModelAuditDraft(input) { const vm = buildFlightWorkflowPilotSupportViewModel(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_PILOT_SUPPORT_VIEW_MODEL_AUDIT_DRAFT", viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_PILOT_SUPPORT_VIEW_MODEL_VERSION, status:vm.status, cardCount:vm.cards.length, issueRowCount:vm.issueRows.length, recommendationRowCount:vm.recommendationRows.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, rawResponseStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }); }
  window.WeishanFlightWorkflowPilotSupportViewModel = { FLIGHT_WORKFLOW_PILOT_SUPPORT_VIEW_MODEL_VERSION, VIEW_MODEL_NAME, buildFlightWorkflowPilotSupportViewModel, buildFlightWorkflowPilotSupportCards, buildFlightWorkflowIssueCategoryRows, buildFlightWorkflowSupportRecommendationRows, buildFlightWorkflowPilotSupportViewModelAuditDraft };
})();
