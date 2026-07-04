;(function () {
  "use strict";

  const GLOBAL_SHOPPING_SAFE_SEARCH_INTENT_MATRIX_VERSION = "4.1.8";
  const MATRIX_NAME = "global_shopping_safe_search_intent_matrix_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, safe_intent_matrix_only:true };
  const ALLOWED_CATEGORIES = { flight:true, hotel:true, product:true, restricted:true, unsupported:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|endpoint|providerClient|rawRequest|rawResponse|rawUserText/ig, "redacted")
      .trim();
  }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "safe_intent_matrix_only");
    return ALLOWED_MODES[mode] ? mode : "safe_intent_matrix_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function rule(ruleId, label, summary, status) {
    return { ruleId:text(ruleId), label:text(label), summary:text(summary), status:safeStatus(status), redacted:true };
  }
  function categoryOf(value) {
    const category = text(value || "unsupported").toLowerCase();
    return ALLOWED_CATEGORIES[category] ? category : "unsupported";
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.appVersion && text(safe.appVersion) !== GLOBAL_SHOPPING_SAFE_SEARCH_INTENT_MATRIX_VERSION) reasons.push("app_version_mismatch");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    if (safe.provider === true || safe.enableProvider === true || safe.productionProvider === true) reasons.push("provider_detected");
    if (safe.payment === true || safe.order === true || safe.ticketing === true || safe.booking === true || safe.checkout === true) reasons.push("transaction_detected");
    if (safe.external === true || safe.openExternal === true || safe.windowOpen === true) reasons.push("external_open_detected");
    return reasons;
  }

  function buildGlobalShoppingSafeSearchIntentRules(input) {
    const safe = obj(input);
    const category = categoryOf(safe.category);
    if (category === "restricted") {
      return clone([
        rule("restricted_category_blocked", "Restricted Category", text(safe.restrictedReason || "该请求涉及受限或高风险品类，已停止处理"), "blocked")
      ]);
    }
    if (category === "unsupported") {
      return clone([
        rule("unsupported_category_review", "Unsupported Category", "当前品类仍需人工澄清与复核", "needs_review")
      ]);
    }
    return clone([
      rule("readonly_only", "Read-Only Only", "只提供只读搜索计划与候选价整理，不付款、不下单、不出票", "ready"),
      rule("provider_zero_locked", "Provider-Zero Locked", "不接真实 provider，不联网，不打开外部平台", "ready")
    ]);
  }

  function buildGlobalShoppingSafeSearchIntentRows(input) {
    const safe = obj(input);
    const rules = Array.isArray(safe.rules) ? safe.rules : [];
    return clone([
      row("safe_search_intent_matrix_status", "Safe Search Intent Matrix", safe.status === "ready" ? "Safe Search Intent Matrix 已准备" : (safe.status === "blocked" ? "Safe Search Intent Matrix 已阻断" : "Safe Search Intent Matrix 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("safe_search_intent_matrix_category", "Category", text(safe.category || "unsupported"), safe.status === "blocked" ? "blocked" : "pass"),
      row("safe_search_intent_matrix_allowed", "Search Intent Allowed", safe.searchIntentAllowed === true ? "true" : "false", safe.searchIntentAllowed === true ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("safe_search_intent_matrix_readonly", "Read-Only Only", safe.readOnlyOnly === true ? "true" : "false", safe.readOnlyOnly === true ? "pass" : "blocked"),
      row("safe_search_intent_matrix_provider_zero", "Provider-Zero Locked", safe.providerZeroLocked === true ? "true" : "false", safe.providerZeroLocked === true ? "pass" : "blocked")
    ].concat(rules.map(function (item) {
      return row(item.ruleId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function buildGlobalShoppingSafeSearchIntentMatrixAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_SAFE_SEARCH_INTENT_MATRIX_AUDIT_DRAFT",
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_SAFE_SEARCH_INTENT_MATRIX_VERSION,
      status:safeStatus(safe.status),
      category:text(safe.category || "unsupported"),
      manualReviewRequired:true,
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

  function evaluateGlobalShoppingSafeSearchIntentMatrix(input) {
    const safe = obj(input);
    const category = categoryOf(safe.category);
    const directBlockedReasons = blockedReasons(safe);
    const rules = buildGlobalShoppingSafeSearchIntentRules({ category, restrictedReason:safe.restrictedReason });
    const blocked = directBlockedReasons.length > 0 || category === "restricted";
    const needsReview = category === "unsupported";
    const searchIntentAllowed = category === "flight" || category === "hotel" || category === "product";
    const status = blocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_SAFE_SEARCH_INTENT_MATRIX_VERSION,
      status,
      matrixMode:safeMode(safe.matrixMode),
      title:"Safe Search Intent Matrix",
      category,
      searchIntentAllowed,
      readOnlyOnly:category !== "restricted",
      restrictedReason:category === "restricted" ? text(safe.restrictedReason || "该请求涉及受限或高风险品类，已停止处理") : "",
      userClarificationNeeded:category === "unsupported",
      providerZeroLocked:category !== "restricted",
      rules,
      rows:buildGlobalShoppingSafeSearchIntentRows({
        status,
        category,
        searchIntentAllowed,
        readOnlyOnly:category !== "restricted",
        providerZeroLocked:category !== "restricted",
        rules
      }),
      manualReviewRequired:true,
      blockedReasons:directBlockedReasons.concat(category === "restricted" ? ["restricted_category_detected"] : []),
      auditDraft:buildGlobalShoppingSafeSearchIntentMatrixAuditDraft({ status, category }),
      userFacingSummary:{
        title:"Safe Search Intent Matrix",
        resultLabel:status === "ready" ? "Safe Search Intent Matrix 已准备" : (status === "blocked" ? "Safe Search Intent Matrix 已阻断" : "Safe Search Intent Matrix 仍需复核"),
        caveat:category === "restricted" ? "受限品类不会生成搜索计划。" : "当前只生成只读搜索计划，不会触发真实平台动作。"
      },
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

  function sanitizeGlobalShoppingSafeSearchIntentMatrix(summary) {
    return evaluateGlobalShoppingSafeSearchIntentMatrix(summary || {});
  }

  function buildGlobalShoppingSafeSearchIntentMatrix(input) {
    try {
      return evaluateGlobalShoppingSafeSearchIntentMatrix(input || {});
    } catch (_) {
      return evaluateGlobalShoppingSafeSearchIntentMatrix({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingSafeSearchIntentMatrix = {
    GLOBAL_SHOPPING_SAFE_SEARCH_INTENT_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingSafeSearchIntentMatrix,
    evaluateGlobalShoppingSafeSearchIntentMatrix,
    buildGlobalShoppingSafeSearchIntentRows,
    buildGlobalShoppingSafeSearchIntentRules,
    buildGlobalShoppingSafeSearchIntentMatrixAuditDraft,
    sanitizeGlobalShoppingSafeSearchIntentMatrix
  };
})();
