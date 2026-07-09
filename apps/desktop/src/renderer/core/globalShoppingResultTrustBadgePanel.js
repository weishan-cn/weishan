;(function () {
  "use strict";

  const GLOBAL_SHOPPING_RESULT_TRUST_BADGE_PANEL_VERSION = "4.2.7";
  const PANEL_NAME = "global_shopping_result_trust_badge_panel_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, result_trust_badge_only:true };
  const FORBIDDEN_COPY_RE = /官方认证|平台授权|真实最低价|最终成交价|已接入 provider|可调用 provider|付款|下单|出票|order|payment|checkout/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "result_trust_badge_only");
    return ALLOWED_MODES[mode] ? mode : "result_trust_badge_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function badgeRule(ruleId, label, value) {
    return { ruleId:text(ruleId), label:text(label), value:value === true, redacted:true };
  }
  function detectBlockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (FORBIDDEN_COPY_RE.test(JSON.stringify(safe))) reasons.push("forbidden_claim_detected");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    return reasons;
  }

  function buildGlobalShoppingResultTrustBadgeRules(input) {
    const safe = obj(input);
    return clone([
      badgeRule("source_available", "sourceAvailable", safe.sourceAvailable === true),
      badgeRule("official_anchor_compared", "officialAnchorCompared", safe.officialAnchorCompared === true),
      badgeRule("fee_normalized", "feeNormalized", safe.feeNormalized === true),
      badgeRule("provider_zero", "providerZero", safe.providerZero === true),
      badgeRule("read_only", "readOnly", safe.readOnly === true),
      badgeRule("manual_review_required", "manualReviewRequired", safe.manualReviewRequired === true)
    ]);
  }

  function buildGlobalShoppingResultTrustBadgeRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    const rules = buildGlobalShoppingResultTrustBadgeRules(safe);
    return clone([
      row("result_trust_badge_status", "Result Trust Badge", status === "ready" ? "Result Trust Badge 已准备" : (status === "blocked" ? "Result Trust Badge 已阻断" : "Result Trust Badge 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning"))
    ].concat(rules.map(function (item) {
      return row(item.ruleId, item.label, item.value ? "true" : "false", item.value ? "pass" : "warning");
    })));
  }

  function evaluateGlobalShoppingResultTrustBadgePanel(input) {
    const safe = obj(input);
    const providerZero = safe.providerZero !== false;
    const readOnly = safe.readOnly !== false;
    const manualReviewRequired = safe.manualReviewRequired !== false;
    const sourceAvailable = safe.sourceAvailable === true;
    const officialAnchorCompared = safe.officialAnchorCompared === true;
    const feeNormalized = safe.feeNormalized === true;
    const blockedReasons = detectBlockedReasons(safe);
    const hardBlocked = blockedReasons.length > 0 || providerZero === false || readOnly === false || manualReviewRequired === false;
    const needsReview = !sourceAvailable || !officialAnchorCompared || !feeNormalized;
    const status = hardBlocked ? "blocked" : (needsReview ? "needs_review" : "ready");
    return clone({
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_RESULT_TRUST_BADGE_PANEL_VERSION,
      panelMode:safeMode(safe.panelMode),
      status,
      title:"Result Trust Badge",
      sourceAvailable,
      officialAnchorCompared,
      feeNormalized,
      providerZero,
      readOnly,
      manualReviewRequired,
      rows:buildGlobalShoppingResultTrustBadgeRows({
        status,
        sourceAvailable,
        officialAnchorCompared,
        feeNormalized,
        providerZero,
        readOnly,
        manualReviewRequired
      }),
      rules:buildGlobalShoppingResultTrustBadgeRules({
        sourceAvailable,
        officialAnchorCompared,
        feeNormalized,
        providerZero,
        readOnly,
        manualReviewRequired
      }),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Result Trust Badge",
        resultLabel:status === "ready" ? "Result Trust Badge 已准备" : (status === "blocked" ? "Result Trust Badge 已阻断" : "Result Trust Badge 仍需复核"),
        caveat:"当前只展示只读可信度标签，不代表官方认证、平台授权、真实最低价或最终成交价。"
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

  function buildGlobalShoppingResultTrustBadgePanelAuditDraft(input) {
    const safe = evaluateGlobalShoppingResultTrustBadgePanel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_RESULT_TRUST_BADGE_PANEL_AUDIT_DRAFT",
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_RESULT_TRUST_BADGE_PANEL_VERSION,
      status:safe.status,
      providerZero:safe.providerZero,
      readOnly:safe.readOnly,
      manualReviewRequired:safe.manualReviewRequired,
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

  function sanitizeGlobalShoppingResultTrustBadgePanel(panel) {
    return evaluateGlobalShoppingResultTrustBadgePanel(panel || {});
  }

  window.WeishanGlobalShoppingResultTrustBadgePanel = {
    GLOBAL_SHOPPING_RESULT_TRUST_BADGE_PANEL_VERSION,
    PANEL_NAME,
    buildGlobalShoppingResultTrustBadgePanel:sanitizeGlobalShoppingResultTrustBadgePanel,
    evaluateGlobalShoppingResultTrustBadgePanel,
    buildGlobalShoppingResultTrustBadgeRows,
    buildGlobalShoppingResultTrustBadgeRules,
    buildGlobalShoppingResultTrustBadgePanelAuditDraft,
    sanitizeGlobalShoppingResultTrustBadgePanel
  };
})();
