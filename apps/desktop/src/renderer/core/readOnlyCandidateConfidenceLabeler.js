;(function () {
  "use strict";

  const READ_ONLY_CANDIDATE_CONFIDENCE_LABELER_VERSION = "4.0.8";
  const LABELER_NAME = "read_only_candidate_confidence_labeler_v1";
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function base(status, label, level, reasons) {
    return { labelerName:LABELER_NAME, appVersion:READ_ONLY_CANDIDATE_CONFIDENCE_LABELER_VERSION, status, confidenceLabel:label, confidenceLevel:level, reasons:reasons || [], warnings:["平台最终为准。", "未锁价，不代表可出票。"], canProceedToProviderConfirmation:status !== "blocked" && status !== "failed_safe", requiresUserConfirmation:true, canPayHere:false, canOrderHere:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true };
  }
  function buildReadOnlyCandidateConfidenceLabel(input) {
    try {
      const safe = object(input);
      const reconciliation = object(safe.reconciliationSummary || safe.reconciliation || safe.platformCheckReconciliation);
      const evidence = object(safe.manualPlatformCheckEvidence || safe.manualPlatformCheckSummary || safe.platformCheckEvidence);
      const delta = object(safe.platformCheckDelta || safe.platformCheckDeltaSummary);
      const safeHandoffReady = safe.safeHandoffReady === true || safe.safeProviderHandoffReady === true || object(safe.handoffChecklistSummary).status === "ready" || object(safe.handoffChecklist).status === "ready";
      if (evidence.sensitiveInputBlocked === true || text(evidence.status) === "blocked" || text(reconciliation.status) === "blocked") return clone(base("blocked", "不可确认", "unknown", ["敏感输入已阻断。"]));
      const status = text(reconciliation.status);
      if (status === "needs_recheck" || evidence.observedInventoryStatus === "changed" || evidence.observedInventoryStatus === "unavailable" || evidence.observedRulesChanged === true) return clone(base("ready", "需重新核对", "low", ["库存、币种、规则或价格变化需要重新核对。"]));
      if (status === "matched" || (safeHandoffReady && text(delta.deltaDirection) === "same")) return clone(base("ready", "高一致", "high", ["平台核对价与候选价一致。", "前往平台确认仍需用户二次确认。"]));
      if (status === "price_changed" || (text(delta.deltaDirection) === "up" || text(delta.deltaDirection) === "down")) return clone(base("ready", "有差异", "medium", ["平台页面结果与候选价存在差异。", "平台最终为准。"]));
      return clone(base("unknown", "不可确认", "unknown", ["尚未记录平台核对结果。"]));
    } catch (_) { return clone(base("failed_safe", "不可确认", "unknown", ["输入异常，已安全降级。"])); }
  }
  function explainReadOnlyCandidateConfidence(input) {
    const model = buildReadOnlyCandidateConfidenceLabel(input);
    return clone({ title:"候选价置信标签", label:model.confidenceLabel, level:model.confidenceLevel, line:model.reasons[0] || "不可确认", warnings:model.warnings, redacted:true });
  }
  function buildReadOnlyCandidateConfidenceAuditDraft(input) {
    const model = buildReadOnlyCandidateConfidenceLabel(input);
    return clone({ eventType:"READ_ONLY_CANDIDATE_CONFIDENCE_AUDIT_DRAFT", labelerName:LABELER_NAME, appVersion:READ_ONLY_CANDIDATE_CONFIDENCE_LABELER_VERSION, status:model.status, confidenceLabel:model.confidenceLabel, confidenceLevel:model.confidenceLevel, requiresUserConfirmation:true, canPayHere:false, canOrderHere:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true });
  }
  window.WeishanReadOnlyCandidateConfidenceLabeler = { READ_ONLY_CANDIDATE_CONFIDENCE_LABELER_VERSION, LABELER_NAME, buildReadOnlyCandidateConfidenceLabel, explainReadOnlyCandidateConfidence, buildReadOnlyCandidateConfidenceAuditDraft };
})();
