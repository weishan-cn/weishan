;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_BETA_ACCEPTANCE_VIEW_MODEL_VERSION = "4.2.3";
  const VIEW_MODEL_NAME = "flight_workflow_beta_acceptance_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim().replace(/https?:\/\/\S+|token|key|secret|password/ig, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function packOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.betaAcceptancePack) return safe.betaAcceptancePack;
    const api = window.WeishanFlightWorkflowBetaAcceptancePack || {};
    return typeof api.buildFlightWorkflowBetaAcceptancePack === "function" ? api.buildFlightWorkflowBetaAcceptancePack(safe) : { status:"failed_safe", acceptanceSteps:[], forbiddenCapabilities:[], userFacingSummary:{ resultLabel:"暂不可验收", redacted:true }, redacted:true };
  }
  function testOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.guidedUserTestMode) return safe.guidedUserTestMode;
    const api = window.WeishanFlightWorkflowGuidedUserTestMode || {};
    return typeof api.buildFlightWorkflowGuidedUserTestMode === "function" ? api.buildFlightWorkflowGuidedUserTestMode(safe.guidedUserTestInput || {}) : { status:"not_started", steps:[], feedbackSummary:{}, userFacingSummary:{ resultLabel:"测试未开始", redacted:true }, redacted:true };
  }
  function feedbackOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.feedbackSanitizerSummary) return safe.feedbackSanitizerSummary;
    const api = window.WeishanFlightWorkflowBetaFeedbackSanitizer || {};
    return typeof api.sanitizeFlightWorkflowBetaFeedback === "function" ? api.sanitizeFlightWorkflowBetaFeedback(safe.feedback || {}) : { status:"ready", redactedFeedback:{}, redacted:true };
  }
  function buildFlightWorkflowBetaAcceptanceCards(input) {
    const pack = packOf(input || {});
    const test = testOf(input || {});
    return clone([
      { cardId:"acceptance", label:"验收状态", value:text(pack.userFacingSummary && pack.userFacingSummary.resultLabel || pack.status || "暂不可验收"), redacted:true },
      { cardId:"guided_test", label:"用户测试", value:text(test.userFacingSummary && test.userFacingSummary.resultLabel || test.status || "测试未开始"), redacted:true },
      { cardId:"safety", label:"安全限制", value:"不会付款、不会下单、不会出票", redacted:true }
    ]);
  }
  function buildFlightWorkflowBetaAcceptanceRows(input) {
    const pack = packOf(input || {});
    return clone(toArray(pack.acceptanceSteps).map(function (item) { return { rowId:text(item.stepId), label:text(item.label), value:text(item.status), message:text(item.message || ""), redacted:true }; }));
  }
  function buildFlightWorkflowBetaAcceptanceFeedbackView(input) {
    const feedback = feedbackOf(input || {});
    const summary = feedback.redactedFeedback || {};
    return clone([
      { rowId:"usability", label:"易用性", value:text(summary.usabilityRating || "未填写"), redacted:true },
      { rowId:"clarity", label:"清晰度", value:text(summary.clarityRating || "未填写"), redacted:true },
      { rowId:"safety_copy", label:"安全提示理解", value:summary.safetyCopyUnderstood === true ? "已理解" : (summary.safetyCopyUnderstood === false ? "未确认" : "未填写"), redacted:true },
      { rowId:"feedback", label:"测试反馈已脱敏", value:text(summary.redactedUserComment || "未填写"), redacted:true }
    ]);
  }
  function buildForbiddenCapabilityRows(input) {
    const pack = packOf(input || {});
    return clone(toArray(pack.forbiddenCapabilities).map(function (item, index) { return { rowId:"forbidden_" + index, label:text(item), value:"已禁用", redacted:true }; }));
  }
  function buildFlightWorkflowBetaAcceptanceViewModel(input) {
    const pack = packOf(input || {});
    const test = testOf(input || {});
    const feedback = feedbackOf(input || {});
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_BETA_ACCEPTANCE_VIEW_MODEL_VERSION,
      status:pack.status || "failed_safe",
      title:"只读 Beta 验收",
      cards:buildFlightWorkflowBetaAcceptanceCards({ betaAcceptancePack:pack, guidedUserTestMode:test }),
      rows:buildFlightWorkflowBetaAcceptanceRows({ betaAcceptancePack:pack }),
      feedbackRows:buildFlightWorkflowBetaAcceptanceFeedbackView({ feedbackSanitizerSummary:feedback }),
      forbiddenCapabilityRows:buildForbiddenCapabilityRows({ betaAcceptancePack:pack }),
      caveat:"当前仅验收只读候选证据流程，不代表真实票价、库存或可出票。",
      userTestTitle:"只读 Beta 用户测试",
      feedbackLabel:"填写测试反馈",
      safetyConfirmationLabel:"确认不会付款、下单或出票",
      safetyCopy:"测试过程不会付款、不会下单、不会出票。",
      safety:safety(),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      autoRefresh:false,
      payment:false,
      order:false,
      ticketing:false,
      identityUpload:false,
      credentialInput:false,
      rawResponseStored:false,
      rawUserTextStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      redacted:true
    });
  }
  function buildFlightWorkflowBetaAcceptanceViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowBetaAcceptanceViewModel(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_BETA_ACCEPTANCE_VIEW_MODEL_AUDIT_DRAFT", viewModelName:VIEW_MODEL_NAME, appVersion:FLIGHT_WORKFLOW_BETA_ACCEPTANCE_VIEW_MODEL_VERSION, status:vm.status, cardCount:vm.cards.length, rowCount:vm.rows.length, feedbackRowCount:vm.feedbackRows.length, bookingUrl:null, paymentUrl:null, orderUrl:null, rawUserTextStored:false, redacted:true });
  }
  window.WeishanFlightWorkflowBetaAcceptanceViewModel = { FLIGHT_WORKFLOW_BETA_ACCEPTANCE_VIEW_MODEL_VERSION, VIEW_MODEL_NAME, buildFlightWorkflowBetaAcceptanceViewModel, buildFlightWorkflowBetaAcceptanceCards, buildFlightWorkflowBetaAcceptanceRows, buildFlightWorkflowBetaAcceptanceFeedbackView, buildFlightWorkflowBetaAcceptanceViewModelAuditDraft };
})();
