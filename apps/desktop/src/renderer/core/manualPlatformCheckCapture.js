;(function () {
  "use strict";

  const MANUAL_PLATFORM_CHECK_CAPTURE_VERSION = "2.2.2";
  const EVIDENCE_NAME = "manual_platform_check_evidence_v1";
  const SENSITIVE_FIELDS = ["passport", "idCard", "bankCard", "cardNumber", "cvv", "password", "token", "apiKey", "secret", "session", "auth", "orderId", "paymentId", "bookingReference", "rawHtml", "screenshotPath"];
  const SENSITIVE_TEXT_RE = /passport|护照|身份证|identity|idcard|bankcard|银行卡|cardnumber|card\s*number|cvv|password|token|apikey|api[_-]?key|secret|session|auth|credential|login|orderid|paymentid|bookingreference|rawhtml|screenshot|sk-|pk-|live_/i;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function sensitive(input) { const safe = input && typeof input === "object" ? input : {}; return SENSITIVE_FIELDS.some(function (name) { return Object.prototype.hasOwnProperty.call(safe, name) && text(safe[name]) !== ""; }); }
  function sanitizeNote(value) { return text(value).replace(SENSITIVE_TEXT_RE, "[已阻断敏感字段]").slice(0, 240); }
  function buildManualPlatformCheckForm(input) { const safe = input && typeof input === "object" ? input : {}; return clone({ formName:"manual_platform_check_form_v1", appVersion:MANUAL_PLATFORM_CHECK_CAPTURE_VERSION, providerName:text(safe.providerName || "可信平台"), displayHost:text(safe.displayHost || ""), allowedFields:["observedCurrency", "observedTotalPrice", "observedBaseFare", "observedTaxesAndFees", "observedProviderFees", "observedInventoryStatus", "observedRulesChanged", "userNote"], forbiddenFields:SENSITIVE_FIELDS.slice(), upload:false, payment:false, order:false, identityUpload:false, redacted:true }); }
  function validateManualPlatformCheckInput(input) {
    try {
      const safe = input && typeof input === "object" ? input : {};
      const blocked = sensitive(safe) || SENSITIVE_TEXT_RE.test(text(safe.userNote || ""));
      if (blocked) return clone({ status:"blocked", sensitiveInputBlocked:true, reason:"sensitive input blocked", redacted:true });
      if (!text(safe.observedCurrency)) return clone({ status:"rejected", sensitiveInputBlocked:false, reason:"missing currency", redacted:true });
      if (number(safe.observedTotalPrice) == null) return clone({ status:"rejected", sensitiveInputBlocked:false, reason:"invalid observedTotalPrice", redacted:true });
      return clone({ status:"accepted", sensitiveInputBlocked:false, reason:"", redacted:true });
    } catch (_) { return clone({ status:"failed_safe", sensitiveInputBlocked:true, reason:"failed_safe", redacted:true }); }
  }
  function sanitizeManualPlatformCheckEvidence(input) {
    const safe = input && typeof input === "object" ? input : {};
    const validation = validateManualPlatformCheckInput(safe);
    return clone({
      evidenceName:EVIDENCE_NAME,
      appVersion:MANUAL_PLATFORM_CHECK_CAPTURE_VERSION,
      status:validation.status,
      providerName:text(safe.providerName || "可信平台"),
      displayHost:text(safe.displayHost || ""),
      observedCurrency:text(safe.observedCurrency || ""),
      observedTotalPrice:number(safe.observedTotalPrice),
      observedBreakdown:{ baseFare:number(safe.observedBaseFare), taxesAndFees:number(safe.observedTaxesAndFees), providerFees:number(safe.observedProviderFees), redacted:true },
      observedInventoryStatus:["available", "changed", "unavailable", "unknown"].includes(text(safe.observedInventoryStatus)) ? text(safe.observedInventoryStatus) : "unknown",
      observedRulesChanged:safe.observedRulesChanged === true || text(safe.observedRulesChanged) === "true",
      sanitizedUserNote:validation.status === "blocked" ? "[已阻断敏感字段]" : sanitizeNote(safe.userNote || ""),
      sensitiveInputBlocked:validation.sensitiveInputBlocked === true,
      confidenceLabel:"不可确认",
      confidenceLevel:"unknown",
      caveat:"该结果由用户手动记录，仅用于本地核对，不代表唯珊完成预订或付款。",
      safety:{ payment:false, order:false, identityUpload:false, rawHtmlStored:false, screenshotStored:false, secretStored:false, redacted:true },
      redacted:true
    });
  }
  function buildManualPlatformCheckEvidence(input) { return sanitizeManualPlatformCheckEvidence(input); }
  function buildManualPlatformCheckCaptureAuditDraft(input) { const evidence = buildManualPlatformCheckEvidence(input); return clone({ eventType:"MANUAL_PLATFORM_CHECK_CAPTURE_AUDIT_DRAFT", evidenceName:EVIDENCE_NAME, appVersion:MANUAL_PLATFORM_CHECK_CAPTURE_VERSION, status:evidence.status, sensitiveInputBlocked:evidence.sensitiveInputBlocked, rawHtmlStored:false, screenshotStored:false, secretStored:false, payment:false, order:false, identityUpload:false, redacted:true }); }
  window.WeishanManualPlatformCheckCapture = { MANUAL_PLATFORM_CHECK_CAPTURE_VERSION, EVIDENCE_NAME, buildManualPlatformCheckForm, validateManualPlatformCheckInput, buildManualPlatformCheckEvidence, sanitizeManualPlatformCheckEvidence, buildManualPlatformCheckCaptureAuditDraft };
})();
