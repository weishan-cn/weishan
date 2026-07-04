;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFICIAL_ANCHOR_COMPARISON_VIEW_VERSION = "4.1.9";
  const VIEW_NAME = "global_shopping_official_anchor_comparison_view_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, official_anchor_only:true };
  const BLOCKED_COPY_RE = /官方可订|官方保证|官方背书|平台授权|guaranteed|authorized/i;

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
    const mode = text(value || "official_anchor_only");
    return ALLOWED_MODES[mode] ? mode : "official_anchor_only";
  }
  function buildAnchor(input) {
    const safe = obj(input);
    return {
      officialAnchorLabel:text(safe.officialAnchorLabel || "官方价锚点待补充"),
      officialAnchorPrice:number(safe.officialAnchorPrice),
      currency:text(safe.currency || ""),
      comparisonNote:text(safe.comparisonNote || "以平台实时页面为准"),
      sourceAndTime:text(safe.sourceAndTime || safe.evidenceTimestampLabel || "来源与时间待补充")
    };
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const reasons = [];
    if (safe.officialAnchorUrl != null) reasons.push("official_anchor_url_detected");
    if (safe.openExternal === true || safe.windowOpen === true) reasons.push("external_open_detected");
    if (BLOCKED_COPY_RE.test(JSON.stringify(safe))) reasons.push("official_endorsement_claim_detected");
    return reasons;
  }

  function evaluateGlobalShoppingOfficialAnchorComparisonView(input) {
    const safe = obj(input);
    const anchor = buildAnchor(safe);
    const blocked = blockedReasons(safe);
    const missing = !anchor.currency || anchor.officialAnchorPrice == null || anchor.officialAnchorLabel === "官方价锚点待补充";
    const status = blocked.length ? "blocked" : (missing ? "needs_review" : "ready");
    return clone({
      viewName:VIEW_NAME,
      appVersion:GLOBAL_SHOPPING_OFFICIAL_ANCHOR_COMPARISON_VIEW_VERSION,
      mode:safeMode(safe.mode),
      status,
      title:"Official Anchor Comparison View",
      officialAnchor:anchor,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"官方价锚点",
        resultLabel:status === "ready" ? "官方价锚点已准备" : (status === "blocked" ? "官方价锚点已阻断" : "官方价锚点仍需复核"),
        caveat:"只读对比参考，不代表官方背书。"
      },
      rows:buildGlobalShoppingOfficialAnchorRows({ status, officialAnchor:anchor }),
      sections:buildGlobalShoppingOfficialAnchorSections({ status, officialAnchor:anchor }),
      officialAnchorUrl:null,
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

  function buildGlobalShoppingOfficialAnchorRows(input) {
    const safe = obj(input);
    const anchor = safe.officialAnchor && typeof safe.officialAnchor === "object" ? safe.officialAnchor : buildAnchor(safe);
    const status = text(safe.status || "needs_review");
    const label = obj(safe.userFacingSummary).resultLabel || (status === "ready" ? "官方价锚点已准备" : (status === "blocked" ? "官方价锚点已阻断" : "官方价锚点仍需复核"));
    return clone([
      row("official_anchor_status", "官方价锚点", label, status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("official_anchor_label", "官方价锚点", anchor.officialAnchorLabel, anchor.officialAnchorLabel === "官方价锚点待补充" ? "warning" : "pass"),
      row("official_anchor_source", "来源与时间", anchor.sourceAndTime, /待补充/.test(anchor.sourceAndTime) ? "warning" : "pass"),
      row("official_anchor_note", "风险说明", anchor.comparisonNote || "以平台实时页面为准", "pass")
    ]);
  }

  function buildGlobalShoppingOfficialAnchorSections(input) {
    const safe = obj(input);
    const rows = buildGlobalShoppingOfficialAnchorRows(safe);
    return clone([
      section("official_anchor_core", "官方价锚点", rows.slice(0, 3)),
      section("official_anchor_disclosure", "只读披露", [rows[3]])
    ]);
  }

  function buildGlobalShoppingOfficialAnchorAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfficialAnchorComparisonView(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFICIAL_ANCHOR_COMPARISON_VIEW_AUDIT_DRAFT",
      viewName:VIEW_NAME,
      appVersion:GLOBAL_SHOPPING_OFFICIAL_ANCHOR_COMPARISON_VIEW_VERSION,
      status:safe.status,
      blockedReasonCount:safe.blockedReasons.length,
      officialAnchorUrl:null,
      externalUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfficialAnchorComparisonView(input) {
    return evaluateGlobalShoppingOfficialAnchorComparisonView(input || {});
  }

  window.WeishanGlobalShoppingOfficialAnchorComparisonView = {
    GLOBAL_SHOPPING_OFFICIAL_ANCHOR_COMPARISON_VIEW_VERSION,
    VIEW_NAME,
    buildGlobalShoppingOfficialAnchorComparisonView:sanitizeGlobalShoppingOfficialAnchorComparisonView,
    evaluateGlobalShoppingOfficialAnchorComparisonView,
    buildGlobalShoppingOfficialAnchorRows,
    buildGlobalShoppingOfficialAnchorSections,
    buildGlobalShoppingOfficialAnchorAuditDraft,
    sanitizeGlobalShoppingOfficialAnchorComparisonView
  };
})();
