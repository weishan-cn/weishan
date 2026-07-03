;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FEE_NORMALIZATION_VIEW_VERSION = "4.0.5";
  const VIEW_NAME = "global_shopping_fee_normalization_view_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, fee_normalization_only:true };
  const FORBIDDEN_COPY_RE = /最终成交价|真实最终价|已锁定|官方可订|官方保证|官方背书|平台授权/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, title, rows) {
    return { sectionId:text(sectionId), title:text(title), rows:Array.isArray(rows) ? rows.slice() : [], redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "fee_normalization_only");
    return ALLOWED_MODES[mode] ? mode : "fee_normalization_only";
  }
  function normalizeFees(input) {
    const safe = obj(input);
    return {
      currency:text(safe.currency || ""),
      normalizedPrice:number(safe.normalizedPrice),
      taxIncluded:safe.taxIncluded === true ? "含税" : (safe.taxIncluded === false ? "不含税" : "税费待补充"),
      shippingIncluded:safe.shippingIncluded === true ? "含运费" : (safe.shippingIncluded === false ? "不含运费" : "运费待补充"),
      serviceFeeIncluded:safe.serviceFeeIncluded === true ? "服务费已计入" : (safe.serviceFeeIncluded === false ? "服务费待补充" : "服务费说明待补充"),
      serviceFeeNote:text(safe.serviceFeeNote || "服务费说明待补充")
    };
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (FORBIDDEN_COPY_RE.test(JSON.stringify(safe))) reasons.push("forbidden_final_price_claim");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_or_provider_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    return reasons;
  }

  function evaluateGlobalShoppingFeeNormalizationView(input) {
    const safe = obj(input);
    const fees = normalizeFees(safe);
    const blocked = blockedReasons(safe);
    const missing = !fees.currency || fees.normalizedPrice == null || fees.taxIncluded === "税费待补充" || fees.shippingIncluded === "运费待补充" || fees.serviceFeeIncluded === "服务费说明待补充";
    const status = blocked.length ? "blocked" : (missing ? "needs_review" : "ready");
    return clone({
      viewName:VIEW_NAME,
      appVersion:GLOBAL_SHOPPING_FEE_NORMALIZATION_VIEW_VERSION,
      mode:safeMode(safe.mode),
      status,
      title:"Fee Normalization View",
      feeSummary:fees,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"费用归一化",
        resultLabel:status === "ready" ? "费用归一化已准备" : (status === "blocked" ? "费用归一化已阻断" : "费用归一化仍需复核"),
        caveat:"归一化价格仅用于辅助比较，不代表真实最终价。"
      },
      rows:buildGlobalShoppingFeeNormalizationRows({ status, feeSummary:fees }),
      sections:buildGlobalShoppingFeeNormalizationSections({ status, feeSummary:fees }),
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingFeeNormalizationRows(input) {
    const safe = obj(input);
    const fees = safe.feeSummary && typeof safe.feeSummary === "object" ? safe.feeSummary : normalizeFees(safe);
    const status = text(safe.status || "needs_review");
    const label = obj(safe.userFacingSummary).resultLabel || (status === "ready" ? "费用归一化已准备" : (status === "blocked" ? "费用归一化已阻断" : "费用归一化仍需复核"));
    return clone([
      row("fee_normalization_status", "费用归一化", label, status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("fee_normalization_tax", "含税/不含税", fees.taxIncluded, /待补充/.test(fees.taxIncluded) ? "warning" : "pass"),
      row("fee_normalization_shipping", "含运费/不含运费", fees.shippingIncluded, /待补充/.test(fees.shippingIncluded) ? "warning" : "pass"),
      row("fee_normalization_service_fee", "服务费说明", fees.serviceFeeNote, /待补充/.test(fees.serviceFeeNote) ? "warning" : "pass"),
      row("fee_normalization_caveat", "价格说明", "归一化价格仅用于辅助比较 / 不代表真实最终价 / 以平台实时页面为准", "pass")
    ]);
  }

  function buildGlobalShoppingFeeNormalizationSections(input) {
    const safe = obj(input);
    const rows = buildGlobalShoppingFeeNormalizationRows(safe);
    return clone([
      section("fee_normalization_breakdown", "费用归一化", rows.slice(0, 4)),
      section("fee_normalization_disclosure", "只读披露", [rows[4]])
    ]);
  }

  function buildGlobalShoppingFeeNormalizationAuditDraft(input) {
    const safe = evaluateGlobalShoppingFeeNormalizationView(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FEE_NORMALIZATION_VIEW_AUDIT_DRAFT",
      viewName:VIEW_NAME,
      appVersion:GLOBAL_SHOPPING_FEE_NORMALIZATION_VIEW_VERSION,
      status:safe.status,
      blockedReasonCount:safe.blockedReasons.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingFeeNormalizationView(input) {
    return evaluateGlobalShoppingFeeNormalizationView(input || {});
  }

  window.WeishanGlobalShoppingFeeNormalizationView = {
    GLOBAL_SHOPPING_FEE_NORMALIZATION_VIEW_VERSION,
    VIEW_NAME,
    buildGlobalShoppingFeeNormalizationView:sanitizeGlobalShoppingFeeNormalizationView,
    evaluateGlobalShoppingFeeNormalizationView,
    buildGlobalShoppingFeeNormalizationRows,
    buildGlobalShoppingFeeNormalizationSections,
    buildGlobalShoppingFeeNormalizationAuditDraft,
    sanitizeGlobalShoppingFeeNormalizationView
  };
})();
