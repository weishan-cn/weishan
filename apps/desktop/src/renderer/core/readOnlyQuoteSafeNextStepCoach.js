;(function () {
  "use strict";

  const READ_ONLY_QUOTE_SAFE_NEXT_STEP_COACH_VERSION = "4.2.1";
  const COACH_NAME = "read_only_quote_safe_next_step_coach_v1";
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function recommendation(input) {
    const safe = object(input);
    const status = text(object(safe.reconciliationSummary || safe.reconciliation).status || safe.status);
    const label = text(object(safe.confidenceLabelSummary || safe.confidence).confidenceLabel || safe.confidenceLabel);
    if (status === "blocked" || label === "不可继续") return "不可继续";
    if (status === "needs_recheck" || label === "需重新核对") return "重新核对平台页面";
    if (status === "no_platform_check" || label === "不可确认") return "前往平台确认";
    if (status === "matched" || label === "高一致") return "前往平台继续核对";
    return "重新核对平台页面";
  }
  function buildSafeNextStepActions(input) {
    const rec = recommendation(input);
    const blocked = rec === "不可继续";
    return [
      { actionId:"open_provider_confirmation", label:"前往平台确认", enabled:!blocked, requiresUserConfirmation:true },
      { actionId:"record_platform_check", label:"记录平台核对结果", enabled:!blocked },
      { actionId:"rerun_read_only_quotes", label:"重新运行只读报价", enabled:rec !== "前往平台继续核对" && !blocked }
    ];
  }
  function buildReadOnlyQuoteSafeNextStepCoach(input) {
    try {
      const rec = recommendation(input);
      return clone({ coachName:COACH_NAME, appVersion:READ_ONLY_QUOTE_SAFE_NEXT_STEP_COACH_VERSION, status:rec === "不可继续" ? "blocked" : "ready", recommendation:rec, allowedActions:buildSafeNextStepActions(input), forbiddenActions:["付款", "下单", "出票", "上传证件", "上传银行卡"], caveat:"所有价格、库存、税费和规则以平台页面为准。", redacted:true });
    } catch (_) {
      return clone({ coachName:COACH_NAME, appVersion:READ_ONLY_QUOTE_SAFE_NEXT_STEP_COACH_VERSION, status:"failed_safe", recommendation:"不可继续", allowedActions:buildSafeNextStepActions({ status:"blocked" }), forbiddenActions:["付款", "下单", "出票", "上传证件", "上传银行卡"], caveat:"所有价格、库存、税费和规则以平台页面为准。", redacted:true });
    }
  }
  function buildReadOnlyQuoteSafeNextStepCoachAuditDraft(input) {
    const model = buildReadOnlyQuoteSafeNextStepCoach(input);
    return clone({ eventType:"READ_ONLY_QUOTE_SAFE_NEXT_STEP_COACH_AUDIT_DRAFT", coachName:COACH_NAME, appVersion:READ_ONLY_QUOTE_SAFE_NEXT_STEP_COACH_VERSION, status:model.status, recommendation:model.recommendation, forbiddenActions:model.forbiddenActions, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
  }
  window.WeishanReadOnlyQuoteSafeNextStepCoach = { READ_ONLY_QUOTE_SAFE_NEXT_STEP_COACH_VERSION, COACH_NAME, buildReadOnlyQuoteSafeNextStepCoach, buildSafeNextStepActions, buildReadOnlyQuoteSafeNextStepCoachAuditDraft };
})();
