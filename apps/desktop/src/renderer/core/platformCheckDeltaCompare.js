;(function () {
  "use strict";
  const PLATFORM_CHECK_DELTA_COMPARE_VERSION = "2.1.70";
  const COMPARE_NAME = "platform_check_delta_compare_v1";
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function compareCandidateWithManualPlatformCheck(candidate, evidence, options) {
    try {
      const c = candidate && typeof candidate === "object" ? candidate : {};
      const e = evidence && typeof evidence === "object" ? evidence : {};
      const candidateTotalPrice = number(c.totalPrice || c.selectedTotalPrice);
      const observedTotalPrice = e.status === "accepted" ? number(e.observedTotalPrice) : number(e.observedTotalPrice);
      if (candidateTotalPrice == null || observedTotalPrice == null || e.status && e.status !== "accepted") return clone(empty("not_available"));
      const deltaAmount = Number((observedTotalPrice - candidateTotalPrice).toFixed(2));
      const deltaDirection = deltaAmount > 0 ? "up" : (deltaAmount < 0 ? "down" : "same");
      const needsRecheck = e.observedInventoryStatus === "changed" || e.observedInventoryStatus === "unavailable" || e.observedRulesChanged === true;
      const confidenceLabel = needsRecheck ? "需重新核对" : (deltaDirection === "same" ? "高一致" : (Math.abs(deltaAmount) <= 50 && (c.currency || e.observedCurrency || "CNY") === "CNY" ? "有差异" : "需重新核对"));
      return clone(Object.assign(empty("compared"), { candidateTotalPrice, observedTotalPrice, deltaAmount, deltaDirection, inventoryStatus:e.observedInventoryStatus || "unknown", rulesChanged:e.observedRulesChanged === true, confidenceLabel, confidenceLevel:confidenceLabel === "高一致" ? "high" : (confidenceLabel === "有差异" ? "medium" : "low"), userFacingDeltaMessage:deltaDirection === "same" ? "平台核对价与候选价一致，平台最终为准" : "平台页面结果与候选价存在差异，平台最终为准" }));
    } catch (_) { return clone(empty("failed_safe")); }
  }
  function empty(status) { return { compareName:COMPARE_NAME, appVersion:PLATFORM_CHECK_DELTA_COMPARE_VERSION, status, scope:"manual_platform_check", claim:"仅比较本地候选价与用户手动记录的平台页面结果", candidateTotalPrice:null, observedTotalPrice:null, deltaAmount:null, deltaDirection:"unknown", inventoryStatus:"unknown", rulesChanged:false, confidenceLabel:"不可确认", confidenceLevel:"unknown", userFacingDeltaMessage:"暂无可比较的手动平台核对结果", warnings:["平台页面显示结果可能随库存、税费和规则变化。", "该对比不代表唯珊已锁价、出票或付款。"], canClaimFinalBookablePrice:false, canClaimPriceLocked:false, canClaimTicketAvailable:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true }; }
  function buildPlatformCheckDeltaSummary(delta, options) { const safe = delta && typeof delta === "object" ? delta : empty("not_available"); const line = safe.status === "compared" ? "平台核对差异：" + (safe.userFacingDeltaMessage || (safe.deltaDirection === "same" ? "候选价与手动记录平台价一致" : "平台页面结果与候选价存在差异，平台最终为准")) : "平台核对差异：暂无可比较的手动平台核对结果"; return clone({ title:"平台核对差异", line, status:safe.status || "not_available", deltaDirection:safe.deltaDirection || "unknown", confidenceLabel:safe.confidenceLabel || "不可确认", confidenceLevel:safe.confidenceLevel || "unknown", userFacingDeltaMessage:safe.userFacingDeltaMessage || "", warnings:safe.warnings || empty("not_available").warnings, canClaimFinalBookablePrice:false, canClaimPriceLocked:false, canClaimTicketAvailable:false, bookingUrl:null, redacted:true }); }
  function buildPlatformCheckDeltaCompareAuditDraft(input) { const safe = input && typeof input === "object" ? input : {}; const delta = compareCandidateWithManualPlatformCheck(safe.candidate, safe.evidence, safe.options || {}); return clone({ eventType:"PLATFORM_CHECK_DELTA_COMPARE_AUDIT_DRAFT", compareName:COMPARE_NAME, appVersion:PLATFORM_CHECK_DELTA_COMPARE_VERSION, status:delta.status, deltaDirection:delta.deltaDirection, canClaimFinalBookablePrice:false, canClaimPriceLocked:false, canClaimTicketAvailable:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true }); }
  window.WeishanPlatformCheckDeltaCompare = { PLATFORM_CHECK_DELTA_COMPARE_VERSION, COMPARE_NAME, compareCandidateWithManualPlatformCheck, buildPlatformCheckDeltaSummary, buildPlatformCheckDeltaCompareAuditDraft };
})();
