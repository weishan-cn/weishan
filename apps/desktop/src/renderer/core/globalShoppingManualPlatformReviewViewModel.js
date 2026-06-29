;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_VIEW_MODEL_VERSION = "2.2.7";
  const VIEW_MODEL_NAME = "global_shopping_manual_platform_review_view_model_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function safety(overrides) {
    return Object.assign({
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
    }, obj(overrides));
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = window[apiName] || {};
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](buildInput || safe) : {};
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function buildGlobalShoppingManualPlatformReviewCards(input) {
    const safe = obj(input);
    const manualPlatformReviewCockpitSummary = resolveSummary(safe, "manualPlatformReviewCockpitSummary", "WeishanGlobalShoppingManualPlatformReviewCockpit", "buildGlobalShoppingManualPlatformReviewCockpit", safe);
    const handoffAcceptanceWalkthroughSummary = resolveSummary(safe, "handoffAcceptanceWalkthroughSummary", "WeishanGlobalShoppingHandoffAcceptanceWalkthrough", "buildGlobalShoppingHandoffAcceptanceWalkthrough", safe);
    const platformRealityCheckBoardSummary = resolveSummary(safe, "platformRealityCheckBoardSummary", "WeishanGlobalShoppingPlatformRealityCheckBoard", "buildGlobalShoppingPlatformRealityCheckBoard", safe);
    return clone([
      card("cockpit", "手动复核驾驶舱", obj(obj(manualPlatformReviewCockpitSummary).userFacingSummary).resultLabel || "手动平台复核驾驶舱仍需复核"),
      card("walkthrough", "接受演练", obj(obj(handoffAcceptanceWalkthroughSummary).userFacingSummary).resultLabel || "交接包接受演练仍需复核"),
      card("reality_check", "平台复核清单", obj(obj(platformRealityCheckBoardSummary).userFacingSummary).resultLabel || "平台真实页面复核清单仍需复核"),
      card("boundary", "安全边界", "Weishan 不替用户做最终决定")
    ]);
  }
  function sanitizeGlobalShoppingManualPlatformReviewViewModel(input) {
    const safe = obj(input);
    const manualPlatformReviewCockpitSummary = resolveSummary(safe, "manualPlatformReviewCockpitSummary", "WeishanGlobalShoppingManualPlatformReviewCockpit", "buildGlobalShoppingManualPlatformReviewCockpit", safe);
    const handoffAcceptanceWalkthroughSummary = resolveSummary(safe, "handoffAcceptanceWalkthroughSummary", "WeishanGlobalShoppingHandoffAcceptanceWalkthrough", "buildGlobalShoppingHandoffAcceptanceWalkthrough", safe);
    const platformRealityCheckBoardSummary = resolveSummary(safe, "platformRealityCheckBoardSummary", "WeishanGlobalShoppingPlatformRealityCheckBoard", "buildGlobalShoppingPlatformRealityCheckBoard", safe);
    const blocked = statusOf(manualPlatformReviewCockpitSummary) === "blocked" ||
      statusOf(handoffAcceptanceWalkthroughSummary) === "blocked" ||
      statusOf(platformRealityCheckBoardSummary) === "blocked" ||
      safe.networkEnabled === true || safe.realEndpointDetected === true || safe.hasRealApiKey === true ||
      safe.rawResponseStored === true || safe.openExternal === true || safe.windowOpen === true ||
      safe.export === true || safe.download === true || safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const missing = !Object.keys(manualPlatformReviewCockpitSummary).length ||
      !Object.keys(handoffAcceptanceWalkthroughSummary).length ||
      !Object.keys(platformRealityCheckBoardSummary).length;
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status))
      ? text(safe.status)
      : (blocked ? "blocked" : (missing || statusOf(manualPlatformReviewCockpitSummary) !== "ready" || statusOf(handoffAcceptanceWalkthroughSummary) !== "ready" || statusOf(platformRealityCheckBoardSummary) !== "ready" ? "needs_review" : "ready"));
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_VIEW_MODEL_VERSION,
      status:status,
      title:"手动平台复核与现实检查",
      manualPlatformReviewCockpitSummary:clone(manualPlatformReviewCockpitSummary),
      handoffAcceptanceWalkthroughSummary:clone(handoffAcceptanceWalkthroughSummary),
      platformRealityCheckBoardSummary:clone(platformRealityCheckBoardSummary),
      cards:toArray(safe.cards).length ? toArray(safe.cards) : buildGlobalShoppingManualPlatformReviewCards(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        { rowId:"education_scope", label:"手动平台复核与现实检查", value:"当前只展示手动复核、接受演练和平台真实页面复核清单", status:"pass", redacted:true },
        { rowId:"no_persistence", label:"用户确认", value:"接受演练不保存用户确认", status:"pass", redacted:true },
        { rowId:"platform_truth", label:"平台依据", value:"平台页面才是最终依据", status:"pass", redacted:true },
        { rowId:"non_ordering", label:"交易边界", value:"手动复核不代表下单能力", status:"pass", redacted:true },
        { rowId:"human_decision", label:"最终决定", value:"Weishan 不替用户做最终决定", status:"pass", redacted:true },
        { rowId:"no_open", label:"外部平台", value:"不打开平台，不保存选择，不构成订单、付款授权或签名", status:"pass", redacted:true }
      ],
      userFacingSummary:{
        title:"手动平台复核与现实检查",
        resultLabel:status === "ready" ? "手动平台复核与现实检查已准备" : (status === "blocked" ? "手动平台复核与现实检查已阻断" : "手动平台复核与现实检查仍需复核"),
        caveat:"该视图只用于手动平台复核教育，不会打开真实平台，不会保存选择、确认、身份、支付或订单信息，也不构成付款授权、签名或交易能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingManualPlatformReviewViewModel(input) {
    try {
      return sanitizeGlobalShoppingManualPlatformReviewViewModel(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingManualPlatformReviewViewModel({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingManualPlatformReviewViewModelAuditDraft(input) {
    const viewModel = buildGlobalShoppingManualPlatformReviewViewModel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_VIEW_MODEL_VERSION,
      status:viewModel.status,
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

  window.WeishanGlobalShoppingManualPlatformReviewViewModel = {
    GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildGlobalShoppingManualPlatformReviewViewModel,
    buildGlobalShoppingManualPlatformReviewCards,
    buildGlobalShoppingManualPlatformReviewViewModelAuditDraft,
    sanitizeGlobalShoppingManualPlatformReviewViewModel
  };
})();
