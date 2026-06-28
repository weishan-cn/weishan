;(function () {
  "use strict";

  const GLOBAL_SHOPPING_JUMP_TO_PLATFORM_HANDOFF_PREVIEW_VERSION = "2.1.91";
  const PREVIEW_NAME = "global_shopping_jump_to_platform_handoff_preview_v1";
  const FORBIDDEN_COPY_RE = /全网最低|最低价保证|已锁价|真实最终价|立即购买|直接下单|一键下单|一键出票/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId || "card"), label:text(label || ""), value:text(value || ""), redacted:true };
  }
  function deepLinkApi() { return window.WeishanGlobalShoppingExternalDeepLinkSafetyGate || {}; }
  function prefillApi() { return window.WeishanGlobalShoppingSearchParameterPrefillGate || {}; }
  function buildDeepLinkSummary(input) {
    const safe = obj(input);
    if (safe.externalDeepLinkSafetySummary && typeof safe.externalDeepLinkSafetySummary === "object") return safe.externalDeepLinkSafetySummary;
    return null;
  }
  function buildPrefillSummary(input) {
    const safe = obj(input);
    if (safe.searchParameterPrefillSummary && typeof safe.searchParameterPrefillSummary === "object") return safe.searchParameterPrefillSummary;
    return null;
  }
  function buildGlobalShoppingJumpHandoffCards(input) {
    const deepLink = buildDeepLinkSummary(input || {}) || {};
    const prefill = buildPrefillSummary(input || {}) || {};
    const allowed = obj(obj(prefill.prefillCandidate).allowedParameters);
    const filled = Object.keys(allowed).filter(function (key) { return allowed[key] != null && allowed[key] !== ""; }).length;
    return clone([
      card("platform", "目标平台", obj(deepLink.deepLinkCandidate).sourceName || "仍需复核"),
      card("prefill", "可带入搜索条件", filled ? String(filled) + " 项非敏感条件" : "none"),
      card("self_checkout", "平台自行下单", "用户需在平台自行确认价格、登录、填写资料并完成下单"),
      card("safety", "安全边界", "本轮仅展示只读跳转预览，不打开真实平台")
    ]);
  }
  function buildGlobalShoppingPrefillRowsForView(input) {
    const prefill = buildPrefillSummary(input || {}) || {};
    const allowed = obj(obj(prefill.prefillCandidate).allowedParameters);
    return clone(Object.keys(allowed).filter(function (key) {
      return allowed[key] != null && allowed[key] !== "";
    }).map(function (key) {
      return row("prefill_" + key, "可带入搜索条件", key + ": " + String(allowed[key]), "pass");
    }));
  }
  function buildGlobalShoppingJumpHandoffRows(input) {
    const deepLink = buildDeepLinkSummary(input || {}) || {};
    return clone([
      row("target_platform", "目标平台", obj(deepLink.deepLinkCandidate).sourceName || "仍需复核", obj(deepLink.deepLinkCandidate).sourceName ? "pass" : "warning"),
      row("source_type", "来源类型", obj(deepLink.deepLinkCandidate).sourceType || "仍需复核", obj(deepLink.deepLinkCandidate).sourceType ? "pass" : "warning"),
      row("allowed_domain", "允许域名", obj(deepLink.deepLinkCandidate).allowedDomain || "仍需复核", obj(deepLink.deepLinkCandidate).allowedDomain ? "pass" : "warning"),
      row("platform_checkout", "平台自行下单", "用户需在平台自行确认价格、登录、填写资料并完成下单", "pass"),
      row("preview_only", "预览边界", "本轮仅展示只读跳转预览，不打开真实平台", "pass")
    ]);
  }
  function disclosureRows() {
    return clone([
      row("non_sensitive_prefill", "Weishan 仅可携带非敏感搜索条件", "用户仍需在平台自行确认价格、填写必要资料并完成下单", "pass"),
      row("self_checkout", "平台自行下单", "用户需在平台自行确认价格、登录、填写资料并完成下单", "pass"),
      row("no_storage", "安全边界", "不保存平台账号 / 不保存证件银行卡 / 不保存支付凭证", "pass"),
      row("preview_only", "只读预览", "本轮仅展示只读跳转预览，不打开真实平台", "pass"),
      row("not_ordering", "能力边界", "跳转预览不代表下单能力", "pass")
    ]);
  }
  function sanitizeGlobalShoppingJumpToPlatformHandoffPreview(preview) {
    const safe = obj(preview);
    const deepLink = buildDeepLinkSummary(safe);
    const prefill = buildPrefillSummary(safe);
    const serial = JSON.stringify(safe);
    const blocked = obj(deepLink).status === "blocked"
      || obj(prefill).status === "blocked"
      || FORBIDDEN_COPY_RE.test(serial)
      || obj(safe).bookingUrl || obj(safe).checkoutUrl || obj(safe).paymentUrl || obj(safe).orderUrl
      || obj(safe).openExternal === true || obj(safe).windowOpen === true
      || obj(safe).payment === true || obj(safe).order === true || obj(safe).ticketing === true;
    const needsReview = !blocked && (!deepLink || !prefill || obj(deepLink).status === "needs_review" || obj(prefill).status === "needs_review");
    return clone({
      previewName:PREVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_JUMP_TO_PLATFORM_HANDOFF_PREVIEW_VERSION,
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      title:"跳转至平台查看",
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingJumpHandoffCards({ externalDeepLinkSafetySummary:deepLink, searchParameterPrefillSummary:prefill }),
      handoffRows:toArray(safe.handoffRows).length ? toArray(safe.handoffRows) : buildGlobalShoppingJumpHandoffRows({ externalDeepLinkSafetySummary:deepLink }),
      prefillRows:toArray(safe.prefillRows).length ? toArray(safe.prefillRows) : buildGlobalShoppingPrefillRowsForView({ searchParameterPrefillSummary:prefill }),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : disclosureRows(),
      caveat:"本轮仅展示只读跳转预览，不打开真实平台。未来用户需在平台自行确认价格、登录、填写资料并完成下单。",
      externalDeepLinkSafetySummary:clone(deepLink),
      searchParameterPrefillSummary:clone(prefill),
      safety:safety(),
      redacted:true
    });
  }
  function buildGlobalShoppingJumpToPlatformHandoffPreview(input) {
    try {
      return sanitizeGlobalShoppingJumpToPlatformHandoffPreview(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingJumpToPlatformHandoffPreview({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingJumpToPlatformHandoffPreviewAuditDraft(input) {
    const preview = buildGlobalShoppingJumpToPlatformHandoffPreview(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_JUMP_TO_PLATFORM_HANDOFF_PREVIEW_AUDIT_DRAFT",
      previewName:PREVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_JUMP_TO_PLATFORM_HANDOFF_PREVIEW_VERSION,
      status:preview.status,
      cardCount:preview.cards.length,
      handoffRowCount:preview.handoffRows.length,
      prefillRowCount:preview.prefillRows.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingJumpToPlatformHandoffPreview = {
    GLOBAL_SHOPPING_JUMP_TO_PLATFORM_HANDOFF_PREVIEW_VERSION,
    PREVIEW_NAME,
    buildGlobalShoppingJumpToPlatformHandoffPreview,
    buildGlobalShoppingJumpHandoffCards,
    buildGlobalShoppingJumpHandoffRows,
    buildGlobalShoppingPrefillRowsForView,
    buildGlobalShoppingJumpToPlatformHandoffPreviewAuditDraft,
    sanitizeGlobalShoppingJumpToPlatformHandoffPreview
  };
})();
