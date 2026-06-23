;(function () {
  "use strict";

  const PLATFORM_CHECK_RECONCILIATION_CENTER_VERSION = "2.1.61";
  const RECONCILIATION_NAME = "platform_check_reconciliation_center_v1";
  const SENSITIVE_RE = /token|api[_-]?key|secret|password|passport|idcard|identity|bank|card|cvv|auth|credential|orderid|paymentid|rawhtml|screenshot|sk-|pk-|live_/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function safeNote(value) { return text(value).replace(SENSITIVE_RE, "[已阻断敏感字段]").slice(0, 180); }
  function safety() {
    return { userFacingRealPriceEnabled:false, showableAsRealPrice:false, canReplaceMainResultCard:false, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, payment:false, order:false, identityUpload:false, rawResponseStored:false, rawUrlStored:false, secretStored:false, redacted:true };
  }
  function selectedSummary(candidate) {
    const safe = object(candidate);
    return { quoteId:text(safe.quoteId || safe.selectedQuoteId), providerName:text(safe.providerName || safe.selectedProviderName || "只读候选"), currency:text(safe.currency || "CNY"), totalPrice:number(safe.totalPrice || safe.selectedTotalPrice), baseFare:number(safe.baseFare), taxesAndFees:number(safe.taxesAndFees), providerFees:number(safe.providerFees) };
  }
  function platformSummary(evidence) {
    const safe = object(evidence);
    const available = safe.status === "accepted" || number(safe.observedTotalPrice) != null;
    return { available, observedCurrency:text(safe.observedCurrency || safe.currency), observedTotalPrice:number(safe.observedTotalPrice), observedInventoryStatus:text(safe.observedInventoryStatus || "unknown"), observedRulesChanged:safe.observedRulesChanged === true, sanitizedUserNote:safe.sensitiveInputBlocked ? "[已阻断敏感字段]" : safeNote(safe.sanitizedUserNote || safe.userNote) };
  }
  function receiptSummary(receipt) {
    const safe = object(receipt);
    return { available:!!(safe.receiptName || safe.providerName || safe.displayHost), providerName:text(safe.providerName), displayHost:text(safe.displayHost), userConfirmed:safe.userConfirmed === true, rawUrlStored:false };
  }
  function deltaSummary(candidate, platform, delta) {
    const d = object(delta);
    const candidateTotalPrice = number(d.candidateTotalPrice) != null ? number(d.candidateTotalPrice) : number(candidate.totalPrice);
    const observedTotalPrice = number(d.observedTotalPrice) != null ? number(d.observedTotalPrice) : number(platform.observedTotalPrice);
    const deltaAmount = candidateTotalPrice != null && observedTotalPrice != null ? Number((observedTotalPrice - candidateTotalPrice).toFixed(2)) : null;
    return { status:text(d.status || (deltaAmount == null ? "not_available" : "compared")), candidateTotalPrice, observedTotalPrice, deltaAmount, deltaDirection:deltaAmount == null ? "unknown" : (deltaAmount > 0 ? "up" : (deltaAmount < 0 ? "down" : "same")), platformFinal:true };
  }
  function resultFor(status) {
    const map = {
      matched:["高一致", "high", "可前往平台继续核对", "候选价与平台手动核对结果一致，仍以平台页面为准。"],
      price_changed:["有差异", "medium", "建议重新核对平台页面", "平台页面结果与候选价存在差异，平台最终为准。"],
      needs_recheck:["需重新核对", "low", "建议重新核对平台页面", "平台页面结果需要重新核对，平台最终为准。"],
      no_platform_check:["不可确认", "unknown", "可前往平台继续核对", "尚未记录平台核对结果，无法确认候选价一致性。"],
      blocked:["不可确认", "unknown", "不可继续", "敏感输入已阻断，未更新平台核对结果。"],
      failed_safe:["不可确认", "unknown", "不可继续", "输入异常，已安全降级。"]
    };
    const row = map[status] || map.failed_safe;
    return { confidenceLabel:row[0], confidenceLevel:row[1], nextStep:row[2], userFacingMessage:row[3], safetyWarnings:["价格、库存、税费和规则以平台页面为准。", "该核对结果不代表唯珊已锁价、出票或付款。"] };
  }
  function statusFor(candidate, platform, delta, evidence) {
    if (object(evidence).sensitiveInputBlocked === true || text(object(evidence).status) === "blocked") return "blocked";
    if (!platform.available) return "no_platform_check";
    if (!candidate || candidate.totalPrice == null || platform.observedTotalPrice == null) return "failed_safe";
    if (text(platform.observedCurrency || candidate.currency) && text(candidate.currency) && text(platform.observedCurrency).toUpperCase() !== text(candidate.currency).toUpperCase()) return "needs_recheck";
    if (platform.observedInventoryStatus === "changed" || platform.observedInventoryStatus === "unavailable" || platform.observedRulesChanged === true) return "needs_recheck";
    const amount = Math.abs(number(delta.deltaAmount) || 0);
    if (amount === 0) return "matched";
    if (amount <= 50 && text(candidate.currency).toUpperCase() === "CNY") return "price_changed";
    return "needs_recheck";
  }
  function evaluatePlatformCheckReconciliation(input) {
    try {
      const safe = object(input);
      const candidate = selectedSummary(safe.selectedCandidate || safe.candidate || safe.priceQuote);
      const platform = platformSummary(safe.manualPlatformCheckEvidence || safe.manualPlatformCheckSummary || safe.platformCheckEvidence);
      const delta = deltaSummary(candidate, platform, safe.platformCheckDelta || safe.platformCheckDeltaSummary);
      const status = statusFor(candidate, platform, delta, safe.manualPlatformCheckEvidence || safe.manualPlatformCheckSummary || {});
      return clone({ reconciliationName:RECONCILIATION_NAME, appVersion:PLATFORM_CHECK_RECONCILIATION_CENTER_VERSION, status, selectedCandidateSummary:candidate, platformCheckSummary:platform, deltaSummary:delta, receiptSummary:receiptSummary(safe.handoffReceipt || safe.handoffReceiptSummary), reconciliationResult:resultFor(status), safety:safety(), redacted:true });
    } catch (_) {
      return clone({ reconciliationName:RECONCILIATION_NAME, appVersion:PLATFORM_CHECK_RECONCILIATION_CENTER_VERSION, status:"failed_safe", selectedCandidateSummary:selectedSummary({}), platformCheckSummary:platformSummary({}), deltaSummary:deltaSummary({}, {}, {}), receiptSummary:receiptSummary({}), reconciliationResult:resultFor("failed_safe"), safety:safety(), redacted:true });
    }
  }
  function buildPlatformCheckReconciliationCenter(input) { return evaluatePlatformCheckReconciliation(input); }
  function sanitizePlatformCheckReconciliation(input) { const model = evaluatePlatformCheckReconciliation(input); model.bookingUrl = null; model.checkoutUrl = null; model.paymentUrl = null; model.orderUrl = null; model.secretStored = false; model.rawUrlStored = false; return clone(model); }
  function buildPlatformCheckReconciliationSummary(input) {
    const model = evaluatePlatformCheckReconciliation(input);
    return clone({ title:"平台核对汇总", status:model.status, confidenceLabel:model.reconciliationResult.confidenceLabel, confidenceLevel:model.reconciliationResult.confidenceLevel, nextStep:model.reconciliationResult.nextStep, line:model.reconciliationResult.userFacingMessage, platformFinal:true, warnings:model.reconciliationResult.safetyWarnings, bookingUrl:null, secretStored:false, redacted:true });
  }
  function buildPlatformCheckReconciliationAuditDraft(input) {
    const model = evaluatePlatformCheckReconciliation(input);
    return clone({ eventType:"PLATFORM_CHECK_RECONCILIATION_AUDIT_DRAFT", reconciliationName:RECONCILIATION_NAME, appVersion:PLATFORM_CHECK_RECONCILIATION_CENTER_VERSION, status:model.status, confidenceLabel:model.reconciliationResult.confidenceLabel, nextStep:model.reconciliationResult.nextStep, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, rawResponseStored:false, rawUrlStored:false, secretStored:false, redacted:true });
  }

  window.WeishanPlatformCheckReconciliationCenter = { PLATFORM_CHECK_RECONCILIATION_CENTER_VERSION, RECONCILIATION_NAME, buildPlatformCheckReconciliationCenter, evaluatePlatformCheckReconciliation, buildPlatformCheckReconciliationSummary, buildPlatformCheckReconciliationAuditDraft, sanitizePlatformCheckReconciliation };
})();
