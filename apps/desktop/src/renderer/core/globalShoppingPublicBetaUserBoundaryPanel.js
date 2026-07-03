;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_BETA_USER_BOUNDARY_PANEL_VERSION = "4.1.2";
  const PANEL_NAME = "global_shopping_public_beta_user_boundary_panel_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, user_boundary_only:true };

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
    const mode = text(value || "user_boundary_only");
    return ALLOWED_MODES[mode] ? mode : "user_boundary_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, title, summary, status) {
    return { sectionId:text(sectionId), title:text(title), summary:text(summary), status:safeStatus(status), redacted:true };
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.appVersion && text(safe.appVersion) !== GLOBAL_SHOPPING_PUBLIC_BETA_USER_BOUNDARY_PANEL_VERSION) reasons.push("app_version_mismatch");
    if (safe.provider === true || safe.enableProvider === true || safe.productionProvider === true) reasons.push("provider_detected");
    if (safe.network === true || safe.endpoint === true || safe.providerClient === true) reasons.push("network_or_endpoint_detected");
    if (safe.openExternal === true || safe.windowOpen === true || safe.external === true) reasons.push("external_open_detected");
    if (safe.payment === true || safe.order === true || safe.ticketing === true || safe.booking === true || safe.checkout === true) reasons.push("transaction_detected");
    if (safe.persistRawProviderData === true || safe.persistRawUserText === true || safe.rawPersistence === true) reasons.push("raw_persistence_detected");
    if (safe.externalUrl != null || safe.platformUrl != null || safe.providerUrl != null) reasons.push("external_url_detected");
    if (safe.bookingUrl != null || safe.checkoutUrl != null || safe.paymentUrl != null || safe.orderUrl != null) reasons.push("transaction_url_detected");
    return reasons;
  }

  function buildGlobalShoppingPublicBetaUserBoundarySections() {
    return clone([
      section("candidate_prices_only", "候选价整理", "当前只整理候选价格与来源说明", "ready"),
      section("no_payment_or_order", "交易边界", "当前不提供付款、下单或出票能力", "ready"),
      section("no_sensitive_storage", "敏感信息边界", "不保存账号、证件或支付信息", "ready"),
      section("platform_realtime_truth", "平台实时页面", "价格以平台实时页面为准", "ready"),
      section("manual_platform_completion", "用户自行完成", "用户需在对应平台自行完成下单", "ready")
    ]);
  }

  function buildGlobalShoppingPublicBetaUserBoundaryRows(input) {
    const safe = obj(input);
    const sections = Array.isArray(safe.sections) ? safe.sections : [];
    return clone([
      row("public_beta_user_boundary_panel_status", "User Boundary Panel", safe.status === "ready" ? "User Boundary Panel 已准备" : (safe.status === "blocked" ? "User Boundary Panel 已阻断" : "User Boundary Panel 仍需复核"), safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_beta_user_boundary_manual_review", "Manual Review Required", safe.manualReviewRequired === true ? "仍需人工复核后再决定是否进入下一阶段" : "缺少人工复核边界", safe.manualReviewRequired === true ? "warning" : "blocked")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.title, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function buildGlobalShoppingPublicBetaUserBoundaryPanelAuditDraft(input) {
    const safe = obj(input);
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_BETA_USER_BOUNDARY_PANEL_AUDIT_DRAFT",
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_USER_BOUNDARY_PANEL_VERSION,
      status:safeStatus(safe.status),
      sectionCount:Array.isArray(safe.sections) ? safe.sections.length : 0,
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

  function evaluateGlobalShoppingPublicBetaUserBoundaryPanel(input) {
    const safe = obj(input);
    const directBlockedReasons = blockedReasons(safe);
    const sections = buildGlobalShoppingPublicBetaUserBoundarySections();
    const status = directBlockedReasons.length ? "blocked" : "ready";
    return clone({
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_BETA_USER_BOUNDARY_PANEL_VERSION,
      status,
      panelMode:safeMode(safe.panelMode),
      title:"User Boundary Panel",
      sections,
      rows:buildGlobalShoppingPublicBetaUserBoundaryRows({ status, sections, manualReviewRequired:true }),
      manualReviewRequired:true,
      blockedReasons:directBlockedReasons,
      auditDraft:buildGlobalShoppingPublicBetaUserBoundaryPanelAuditDraft({ status, sections }),
      userFacingSummary:{
        title:"User Boundary Panel",
        resultLabel:status === "ready" ? "User Boundary Panel 已准备" : "User Boundary Panel 已阻断",
        caveat:"只读范围内不会打开外部平台，也不会保存敏感信息。"
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

  function sanitizeGlobalShoppingPublicBetaUserBoundaryPanel(summary) {
    return evaluateGlobalShoppingPublicBetaUserBoundaryPanel(summary || {});
  }

  function buildGlobalShoppingPublicBetaUserBoundaryPanel(input) {
    try {
      return evaluateGlobalShoppingPublicBetaUserBoundaryPanel(input || {});
    } catch (_) {
      return evaluateGlobalShoppingPublicBetaUserBoundaryPanel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicBetaUserBoundaryPanel = {
    GLOBAL_SHOPPING_PUBLIC_BETA_USER_BOUNDARY_PANEL_VERSION,
    PANEL_NAME,
    buildGlobalShoppingPublicBetaUserBoundaryPanel,
    evaluateGlobalShoppingPublicBetaUserBoundaryPanel,
    buildGlobalShoppingPublicBetaUserBoundaryRows,
    buildGlobalShoppingPublicBetaUserBoundarySections,
    buildGlobalShoppingPublicBetaUserBoundaryPanelAuditDraft,
    sanitizeGlobalShoppingPublicBetaUserBoundaryPanel
  };
})();
