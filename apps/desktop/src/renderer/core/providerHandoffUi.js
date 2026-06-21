(function(){
  const PROVIDER_HANDOFF_UI_VERSION = "2.1.34";
  const SAFE_ACTIONS = ["manual_confirm", "copy_search_conditions", "external_search_manual", "provider_handoff_preview"];
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function isRestricted(input){ return input && (input.restricted === true || input.providerReadiness === "blocked" || input.bookingUrlSafety === "blocked"); }
  function buildCopyPayload(card, userPreference){
    const source = card || {};
    const preference = userPreference || {};
    const lines = [
      "搜索条件：" + text(source.title || preference.searchText || "请在官方平台手动核对"),
      "来源平台：" + text(source.providerName || "官方平台 / 可信平台"),
      "价格证据：" + text(source.priceDisplay || "暂无真实价格结果"),
      "税费库存：" + text(source.taxFeeSummary || "最终以平台页面为准") + "；" + text(source.inventoryReliability || "最终以平台页面为准"),
      "最终价格、库存、税费、行李和退改签以平台页面为准。",
      "weishan 不收款、不下单。"
    ];
    return lines.join("\n");
  }
  function buildProviderHandoffUi(input){
    const safe = input && typeof input === "object" ? input : {};
    const card = safe.card || {};
    const unsafeUrl = !!(card.bookingUrl || safe.bookingUrl || safe.paymentUrl || safe.checkoutUrl || safe.orderUrl);
    const actionType = SAFE_ACTIONS.includes(card.actionType) ? card.actionType : "manual_confirm";
    const blocked = isRestricted(safe) || unsafeUrl || /booking|payment|order|checkout|auto_purchase|identity_upload/.test(actionType);
    const copyPayload = buildCopyPayload(card, safe.userPreference || {});
    const result = {
      handoffDecision:blocked ? "blocked" : (actionType === "provider_handoff_preview" ? "manual_handoff" : "future_safe_link_disabled"),
      actionLabel:blocked ? "手动核对" : text(card.actionLabel || (actionType === "copy_search_conditions" ? "复制搜索条件" : "去平台确认")),
      actionType:blocked ? "manual_confirm" : actionType,
      showHandoffPanel:!blocked,
      autoOpen:false,
      bookingUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      copyPayload,
      finalPageDisclaimer:"最终价格、库存、税费、行李和退改签以平台页面为准。weishan 不付款、不下单。",
      audit:buildProviderHandoffUiAuditDraft({ handoffDecision:blocked ? "blocked" : "manual_handoff", actionLabel:card.actionLabel || "去平台确认", actionType, copyPayloadGeneratedCount:copyPayload ? 1 : 0 }),
      redacted:true
    };
    return clone(result);
  }
  function buildProviderHandoffUiAuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"PROVIDER_HANDOFF_UI_DRAFT",
      handoffDecision:text(safe.handoffDecision || "manual_handoff"),
      actionLabel:text(safe.actionLabel || "去平台确认"),
      actionType:text(safe.actionType || "provider_handoff_preview"),
      autoOpen:false,
      bookingUrlGeneratedCount:0,
      bookingUrlDisplayedCount:0,
      paymentAttemptCount:0,
      orderAttemptCount:0,
      identityUploadAttemptCount:0,
      copyPayloadGeneratedCount:Number(safe.copyPayloadGeneratedCount || 0),
      finalPageDisclaimerPresent:true,
      redacted:true
    });
  }
  function assertProviderHandoffUiSafe(result){
    const value = result || buildProviderHandoffUi({});
    if (value.autoOpen !== false) throw new Error("provider handoff must not auto open");
    if (value.bookingUrl !== null) throw new Error("provider handoff must not expose bookingUrl");
    if (value.payment !== false || value.order !== false || value.identityUpload !== false) throw new Error("provider handoff must disable payment/order/identity");
    if (/立即预订|去付款|下单|自动购买|上传证件|保存银行卡/.test(value.actionLabel || value.copyPayload || "")) throw new Error("provider handoff contains forbidden copy");
    const audit = value.audit || {};
    if (audit.autoOpen !== false || audit.bookingUrlGeneratedCount !== 0 || audit.bookingUrlDisplayedCount !== 0 || audit.paymentAttemptCount !== 0 || audit.orderAttemptCount !== 0 || audit.identityUploadAttemptCount !== 0) throw new Error("provider handoff audit counters unsafe");
    return true;
  }
  window.WeishanProviderHandoffUi = { PROVIDER_HANDOFF_UI_VERSION, buildProviderHandoffUi, buildProviderHandoffUiAuditDraft, assertProviderHandoffUiSafe };
})();

