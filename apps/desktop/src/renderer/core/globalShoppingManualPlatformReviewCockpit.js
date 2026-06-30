;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_COCKPIT_VERSION = "2.3.9";
  const COCKPIT_NAME = "global_shopping_manual_platform_review_cockpit_v1";

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
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function buildGlobalShoppingManualPlatformReviewCockpitRows(input) {
    const safe = obj(input);
    const handoffPacketViewModelSummary = resolveSummary(safe, "handoffPacketViewModelSummary", "WeishanGlobalShoppingHandoffPacketViewModel", "buildGlobalShoppingHandoffPacketViewModel", safe);
    const platformHandoffSimulationViewModelSummary = resolveSummary(safe, "platformHandoffSimulationViewModelSummary", "WeishanGlobalShoppingPlatformHandoffSimulationViewModel", "buildGlobalShoppingPlatformHandoffSimulationViewModel", safe);
    const readOnlyHandoffPacketPreviewSummary = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", safe);
    return clone([
      row("handoff_packet", "只读交接包与安全预检", obj(handoffPacketViewModelSummary).title || "只读交接包与安全预检", statusOf(handoffPacketViewModelSummary) === "ready" ? "pass" : (statusOf(handoffPacketViewModelSummary) === "blocked" ? "blocked" : "warning")),
      row("handoff_simulation", "只读平台交接模拟", obj(platformHandoffSimulationViewModelSummary).title || "只读平台交接模拟", statusOf(platformHandoffSimulationViewModelSummary) === "ready" ? "pass" : (statusOf(platformHandoffSimulationViewModelSummary) === "blocked" ? "blocked" : "warning")),
      row("packet_preview", "只读交接包预览", obj(obj(readOnlyHandoffPacketPreviewSummary).userFacingSummary).resultLabel || "交接包预览仍需复核", statusOf(readOnlyHandoffPacketPreviewSummary) === "ready" ? "pass" : (statusOf(readOnlyHandoffPacketPreviewSummary) === "blocked" ? "blocked" : "warning")),
      row("boundary", "手动复核边界", "手动复核不代表下单能力", "pass"),
      row("platform_truth", "最终依据", "平台页面才是最终依据", "pass")
    ]);
  }
  function sanitizeGlobalShoppingManualPlatformReviewCockpit(input) {
    const safe = obj(input);
    const handoffPacketViewModelSummary = resolveSummary(safe, "handoffPacketViewModelSummary", "WeishanGlobalShoppingHandoffPacketViewModel", "buildGlobalShoppingHandoffPacketViewModel", safe);
    const platformHandoffSimulationViewModelSummary = resolveSummary(safe, "platformHandoffSimulationViewModelSummary", "WeishanGlobalShoppingPlatformHandoffSimulationViewModel", "buildGlobalShoppingPlatformHandoffSimulationViewModel", safe);
    const readOnlyHandoffPacketPreviewSummary = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", safe);
    const blocked = statusOf(handoffPacketViewModelSummary) === "blocked" ||
      statusOf(platformHandoffSimulationViewModelSummary) === "blocked" ||
      statusOf(readOnlyHandoffPacketPreviewSummary) === "blocked" ||
      safe.networkEnabled === true || safe.realEndpointDetected === true || safe.hasRealApiKey === true ||
      safe.rawResponseStored === true || safe.openExternal === true || safe.windowOpen === true ||
      safe.export === true || safe.download === true || safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const missing = !Object.keys(handoffPacketViewModelSummary).length ||
      !Object.keys(platformHandoffSimulationViewModelSummary).length ||
      !Object.keys(readOnlyHandoffPacketPreviewSummary).length;
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status))
      ? text(safe.status)
      : (blocked ? "blocked" : (missing || statusOf(handoffPacketViewModelSummary) !== "ready" || statusOf(platformHandoffSimulationViewModelSummary) !== "ready" || statusOf(readOnlyHandoffPacketPreviewSummary) !== "ready" ? "needs_review" : "ready"));
    return clone({
      cockpitName:COCKPIT_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_COCKPIT_VERSION,
      status:status,
      title:"手动平台复核驾驶舱",
      handoffPacketViewModelSummary:clone(handoffPacketViewModelSummary),
      platformHandoffSimulationViewModelSummary:clone(platformHandoffSimulationViewModelSummary),
      readOnlyHandoffPacketPreviewSummary:clone(readOnlyHandoffPacketPreviewSummary),
      reviewRows:toArray(safe.reviewRows).length ? toArray(safe.reviewRows) : buildGlobalShoppingManualPlatformReviewCockpitRows(safe),
      disclosureRows:toArray(safe.disclosureRows).length ? toArray(safe.disclosureRows) : [
        row("local_only", "展示范围", "当前只展示手动复核、接受演练和平台真实页面复核清单", "pass"),
        row("no_open", "平台打开", "不打开平台，不保存选择，不构成订单、付款授权或签名", "pass"),
        row("manual_only", "用户责任", "Weishan 不替用户做最终决定", "pass")
      ],
      userFacingSummary:{
        title:"手动平台复核驾驶舱",
        resultLabel:status === "ready" ? "手动平台复核驾驶舱已准备" : (status === "blocked" ? "手动平台复核驾驶舱已阻断" : "手动平台复核驾驶舱仍需复核"),
        caveat:"当前仅整理手动平台复核所需的只读交接信息，不打开外部平台，不保存用户选择，不代表交易、付款、下单或出票能力。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingManualPlatformReviewCockpit(input) {
    try {
      return sanitizeGlobalShoppingManualPlatformReviewCockpit(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingManualPlatformReviewCockpit({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingManualPlatformReviewCockpitAuditDraft(input) {
    const cockpit = buildGlobalShoppingManualPlatformReviewCockpit(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_COCKPIT_AUDIT_DRAFT",
      cockpitName:COCKPIT_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_COCKPIT_VERSION,
      status:cockpit.status,
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

  window.WeishanGlobalShoppingManualPlatformReviewCockpit = {
    GLOBAL_SHOPPING_MANUAL_PLATFORM_REVIEW_COCKPIT_VERSION,
    COCKPIT_NAME,
    buildGlobalShoppingManualPlatformReviewCockpit,
    buildGlobalShoppingManualPlatformReviewCockpitRows,
    buildGlobalShoppingManualPlatformReviewCockpitAuditDraft,
    sanitizeGlobalShoppingManualPlatformReviewCockpit
  };
})();
