;(function () {
  "use strict";

  const GLOBAL_SHOPPING_VISUAL_TRIAL_GUIDE_VERSION = "4.1.6";
  const GUIDE_NAME = "global_shopping_visual_trial_guide_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, visual_trial_guide_only:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safeStatus(value) {
    const status = text(value || "needs_review");
    return /^(ready|needs_review|blocked|failed_safe)$/.test(status) ? status : "needs_review";
  }
  function safeMode(value) {
    const mode = text(value || "visual_trial_guide_only");
    return ALLOWED_MODES[mode] ? mode : "visual_trial_guide_only";
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function step(stepId, label, ready) {
    return { stepId:text(stepId), label:text(label), ready:ready === true, redacted:true };
  }
  function blocked(input) {
    const safe = obj(input);
    return safe.screenshotUpload === true
      || safe.upload === true
      || safe.externalOpen === true
      || safe.openExternal === true
      || safe.windowOpen === true
      || safe.provider === true
      || safe.providerCall === true
      || safe.payment === true
      || safe.order === true
      || safe.ticketing === true;
  }

  function buildGlobalShoppingVisualTrialGuideSteps(input) {
    const safe = obj(input);
    return clone([
      step("flight_readonly_journey", "flight readonly journey", safe.flightReadonlyJourney !== false),
      step("hotel_readonly_journey", "hotel readonly journey", safe.hotelReadonlyJourney !== false),
      step("product_readonly_journey", "product readonly journey", safe.productReadonlyJourney !== false),
      step("restricted_category_block", "restricted category block", safe.restrictedCategoryBlock === true),
      step("no_transaction_buttons", "no transaction buttons", safe.noTransactionButtons === false),
      step("privacy_boundary", "privacy boundary", safe.privacyBoundary !== false)
    ]);
  }

  function buildGlobalShoppingVisualTrialGuideRows(input) {
    const safe = obj(input);
    const status = safeStatus(safe.status);
    return clone([
      row("visual_trial_guide_status", "Visual Trial Guide", status === "ready" ? "Visual Trial Guide 已准备" : (status === "blocked" ? "Visual Trial Guide 已阻断" : "Visual Trial Guide 仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("visual_trial_guide_paths", "Readonly Capabilities", "flight / hotel / product 只读路径可人工检查", "pass"),
      row("visual_trial_guide_restricted", "Restricted Category", safe.restrictedCategoryBlock === true ? "restricted category block 已准备" : "restricted category block 仍需复核", safe.restrictedCategoryBlock === true ? "pass" : "warning"),
      row("visual_trial_guide_privacy", "Privacy Boundary", "不会保存账号、证件或支付信息", "pass"),
      row("visual_trial_guide_rc", "RC Candidate Boundary", "仍然不接真实 provider、不联网、不启用交易", "warning")
    ]);
  }

  function evaluateGlobalShoppingVisualTrialGuide(input) {
    const safe = obj(input);
    const ready = safe.flightReadonlyJourney !== false
      && safe.hotelReadonlyJourney !== false
      && safe.productReadonlyJourney !== false
      && safe.restrictedCategoryBlock === true;
    const status = blocked(safe) ? "blocked" : (ready ? "ready" : "needs_review");
    return clone({
      guideName:GUIDE_NAME,
      appVersion:GLOBAL_SHOPPING_VISUAL_TRIAL_GUIDE_VERSION,
      guideMode:safeMode(safe.guideMode),
      status,
      title:"Visual Trial Guide",
      steps:buildGlobalShoppingVisualTrialGuideSteps(safe),
      rows:buildGlobalShoppingVisualTrialGuideRows({ status, restrictedCategoryBlock:safe.restrictedCategoryBlock }),
      manualReviewRequired:true,
      userFacingSummary:{
        title:"Visual Trial Guide",
        resultLabel:status === "ready" ? "Visual Trial Guide 已准备" : (status === "blocked" ? "Visual Trial Guide 已阻断" : "Visual Trial Guide 仍需复核"),
        caveat:"只做人工检查，不创建 release、不 push，不截图、不上传、不打开外部平台；仍然不接真实 provider、不联网、不启用交易。"
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

  function buildGlobalShoppingVisualTrialGuideAuditDraft(input) {
    const safe = evaluateGlobalShoppingVisualTrialGuide(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_VISUAL_TRIAL_GUIDE_AUDIT_DRAFT",
      guideName:GUIDE_NAME,
      appVersion:GLOBAL_SHOPPING_VISUAL_TRIAL_GUIDE_VERSION,
      status:safe.status,
      stepCount:toArray(safe.steps).length,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingVisualTrialGuide(guide) {
    return evaluateGlobalShoppingVisualTrialGuide(guide || {});
  }

  function buildGlobalShoppingVisualTrialGuide(input) {
    try {
      return sanitizeGlobalShoppingVisualTrialGuide(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingVisualTrialGuide({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingVisualTrialGuide = {
    GLOBAL_SHOPPING_VISUAL_TRIAL_GUIDE_VERSION,
    GUIDE_NAME,
    buildGlobalShoppingVisualTrialGuide,
    evaluateGlobalShoppingVisualTrialGuide,
    buildGlobalShoppingVisualTrialGuideRows,
    buildGlobalShoppingVisualTrialGuideSteps,
    buildGlobalShoppingVisualTrialGuideAuditDraft,
    sanitizeGlobalShoppingVisualTrialGuide
  };
})();
