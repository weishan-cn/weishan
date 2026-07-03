;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SUPPORT_FALLBACK_RECOMMENDATION_ENGINE_VERSION = "4.1.4";
  const ENGINE_NAME = "flight_workflow_support_fallback_recommendation_engine_v1";
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }; }
  function blockedActions() { return ["付款", "下单", "出票", "上传证件或银行卡", "输入登录凭据"]; }
  function issue(input) { const safe = input && typeof input === "object" ? input : {}; return safe.issueIntakeSummary || safe.safeIssueIntakeSummary || safe.issueIntake || {}; }
  function recFor(category, status) {
    if (status === "blocked") return { recommendationId:"blocked", label:"需要内部复核", message:"反馈包含敏感或交易字段，已阻断并进入内部复核。" };
    if (status === "redacted") return { recommendationId:"internal_review", label:"需要内部复核", message:"反馈已脱敏，仅用于内部复核。" };
    if (category === "candidate_unclear") return { recommendationId:"review_evidence", label:"建议重新查看候选证据", message:"请重新查看只读候选证据和来源说明。" };
    if (category === "platform_mismatch") return { recommendationId:"record_platform_check", label:"建议记录平台核对结果", message:"请只记录平台核对差异摘要，不打开或提交外部平台。" };
    if (category === "safety_copy_unclear") return { recommendationId:"review_safety_copy", label:"建议查看安全说明", message:"请查看安全说明和禁止能力。" };
    if (category === "consent_blocked") return { recommendationId:"retry_consent", label:"建议重新确认只读范围", message:"请重新确认只读范围，不代表交易授权。" };
    if (category === "feedback_error") return { recommendationId:"internal_review", label:"需要内部复核", message:"反馈填写异常，建议内部复核。" };
    return { recommendationId:"internal_review", label:"需要内部复核", message:"问题反馈只用于改进只读候选证据流程。" };
  }
  function evaluateFlightWorkflowSupportFallback(input) { const intake = issue(input); const status = intake.status === "blocked" ? "blocked" : (intake.status === "redacted" || intake.issueCategory === "unknown" || !intake.issueCategory ? "needs_review" : "ready"); const recommendation = recFor(intake.issueCategory || "unknown", intake.status || status); return clone({ status:status, recommendation:recommendation, redacted:true }); }
  function buildFlightWorkflowSupportFallbackActions(input) { const evaluation = evaluateFlightWorkflowSupportFallback(input || {}); return clone({ allowedActions:[evaluation.recommendation], blockedActions:blockedActions(), safety:safety(), redacted:true }); }
  function buildFlightWorkflowSupportFallbackRecommendation(input) { try { const evaluation = evaluateFlightWorkflowSupportFallback(input || {}); return clone({ engineName:ENGINE_NAME, appVersion:FLIGHT_WORKFLOW_SUPPORT_FALLBACK_RECOMMENDATION_ENGINE_VERSION, status:evaluation.status, recommendation:evaluation.recommendation, allowedActions:[], blockedActions:blockedActions(), safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true }); } catch (error) { return clone({ engineName:ENGINE_NAME, appVersion:FLIGHT_WORKFLOW_SUPPORT_FALLBACK_RECOMMENDATION_ENGINE_VERSION, status:"failed_safe", recommendation:recFor("unknown", "blocked"), allowedActions:[], blockedActions:blockedActions(), safety:safety(), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, redacted:true }); } }
  function buildFlightWorkflowSupportFallbackRecommendationAuditDraft(input) { const model = buildFlightWorkflowSupportFallbackRecommendation(input || {}); return clone({ eventType:"FLIGHT_WORKFLOW_SUPPORT_FALLBACK_RECOMMENDATION_AUDIT_DRAFT", engineName:ENGINE_NAME, appVersion:FLIGHT_WORKFLOW_SUPPORT_FALLBACK_RECOMMENDATION_ENGINE_VERSION, status:model.status, recommendationId:model.recommendation.recommendationId, blockedActions:model.blockedActions, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, rawUserTextStored:false, rawResponseStored:false, secretStored:false, fileWrite:false, download:false, autoOpen:false, autoRefresh:false, redacted:true }); }
  window.WeishanFlightWorkflowSupportFallbackRecommendationEngine = { FLIGHT_WORKFLOW_SUPPORT_FALLBACK_RECOMMENDATION_ENGINE_VERSION, ENGINE_NAME, buildFlightWorkflowSupportFallbackRecommendation, evaluateFlightWorkflowSupportFallback, buildFlightWorkflowSupportFallbackActions, buildFlightWorkflowSupportFallbackRecommendationAuditDraft };
})();
