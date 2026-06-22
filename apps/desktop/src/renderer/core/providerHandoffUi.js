(function(){
  const PROVIDER_HANDOFF_UI_VERSION = "2.1.54";
  const SAFE_ACTIONS = ["manual_confirm", "copy_search_conditions", "external_search_manual", "provider_handoff_preview"];
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function isRestricted(input){ return input && (input.restricted === true || input.providerReadiness === "blocked" || input.bookingUrlSafety === "blocked"); }
  function buildCopyPayload(card, userPreference){
    const source = card || {};
    const preference = userPreference || {};
    const fare = source.fareBreakdown || {};
    const rows = Array.isArray(fare.displayRows) ? fare.displayRows : [];
    function row(label){
      const found = rows.find((item) => item && item.label === label);
      return found ? found.value : "未单独提供 / 以平台页面为准";
    }
    const lines = [
      "搜索条件：" + text(source.title || preference.searchText || "请在官方平台手动核对"),
      "来源平台：" + text(source.providerName || "官方平台 / 可信平台"),
      "价格证据：" + text(source.priceTruthLabel || source.priceDisplay || "暂无真实价格结果"),
      "复制价格拆分摘要：",
      "票面价：" + row("票面价"),
      "燃油附加费：" + row("燃油附加费"),
      "机场建设费 / 民航发展基金：" + row("机场建设费 / 民航发展基金"),
      "平台服务费：" + row("平台服务费"),
      "税费：" + row("税费"),
      "其它附加费：" + row("其它附加费"),
      "优惠 / 补贴：" + row("优惠 / 补贴"),
      "最终应付总价：" + row("最终应付总价"),
      "请用户自行打开官方航空公司或可信平台，核对出发地 / 目的地 / 日期、是否直达、票面价、税费、附加费、最终应付总价、行李规则、退改签规则、余票 / 座位状态。",
      "weishan 不收款、不下单。"
    ];
    return lines.join("\n");
  }
  function buildCompactChecklist(){
    return [
      "核对出发地 / 目的地 / 日期",
      "核对是否直达",
      "核对票面价、税费和附加费",
      "核对最终应付总价",
      "核对行李、退改签、余票 / 座位状态"
    ];
  }
  function buildManualHandoffUxV2AuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"MANUAL_HANDOFF_UX_V2_DRAFT",
      handoffDecision:text(safe.handoffDecision || "manual_handoff"),
      compactChecklistVisible:safe.compactChecklistVisible !== false,
      longExplanationCollapsed:true,
      copySearchConditionsAvailable:safe.copySearchConditionsAvailable !== false,
      copyFareBreakdownAvailable:safe.copyFareBreakdownAvailable !== false,
      autoOpen:false,
      bookingUrlGeneratedCount:0,
      bookingUrlDisplayedCount:0,
      paymentAttemptCount:0,
      orderAttemptCount:0,
      identityUploadAttemptCount:0,
      redacted:true
    });
  }
  function buildManualHandoffUxV3AuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"MANUAL_HANDOFF_UX_V3_DRAFT",
      handoffDecision:text(safe.handoffDecision || "manual_handoff"),
      compact:true,
      checklistCollapsedByDefault:true,
      copySearchConditionsAvailable:safe.copySearchConditionsAvailable !== false,
      copyFareBreakdownAvailable:safe.copyFareBreakdownAvailable !== false,
      autoOpen:false,
      bookingUrlDisplayedCount:0,
      paymentActionDisplayedCount:0,
      orderActionDisplayedCount:0,
      identityUploadDisplayedCount:0,
      redacted:true
    });
  }
  function buildProviderHandoffUserSurface(input){
    const safe = input && typeof input === "object" ? input : {};
    const decision = buildProviderHandoffUi(safe);
    if (decision.handoffDecision === "blocked" || decision.showHandoffPanel === false) {
      return clone({ visible:false, title:"去平台确认", audit:buildManualHandoffUxV3AuditDraft({ handoffDecision:"blocked" }), redacted:true });
    }
    const card = safe.card || {};
    const fare = card.fareBreakdown || {};
    function row(label){
      const rows = Array.isArray(fare.displayRows) ? fare.displayRows : [];
      const found = rows.find((item) => item && item.label === label);
      return found ? found.value : "以平台页面为准";
    }
    return clone({
      visible:true,
      title:"去平台确认",
      intro:"当前不会自动打开平台，不会跳转预订页，不会付款或下单。",
      coreChecklist:[
        "路线：" + text(card.routeLine || card.title || "上海 → 成都").replace(/\s*·.*$/, ""),
        "日期：" + text(safe.dateDisplay || "7 月 15 日"),
        "最终应付总价：" + row("最终应付总价"),
        "票面价 / 税费 / 附加费：以卡片价格拆分为准",
        "燃油/机建费：以平台页面为准"
      ],
      actions:["复制搜索条件", "复制价格拆分摘要"],
      fullChecklistCollapsedByDefault:true,
      fullChecklist:[
        "核对出发地 / 目的地 / 日期",
        "核对是否直达",
        "核对票面价、税费和附加费",
        "核对最终应付总价",
        "核对行李、退改签、余票 / 座位状态",
        "核对平台域名",
        "不向未知平台提交身份证、护照或银行卡"
      ],
      manualExplanation:decision.manualExplanation,
      copyPayload:decision.copyPayload,
      audit:buildManualHandoffUxV3AuditDraft({ handoffDecision:decision.handoffDecision, copySearchConditionsAvailable:true, copyFareBreakdownAvailable:true }),
      redacted:true
    });
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
      compactChecklist:buildCompactChecklist(),
      manualExplanation:"请用户自行打开官方航空公司或可信平台核对；weishan 不自动打开、不跳转预订、不付款、不下单。",
      copySearchConditionsAvailable:!blocked,
      copyFareBreakdownAvailable:!blocked,
      longExplanationCollapsed:true,
      autoOpen:false,
      bookingUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      copyPayload,
      finalPageDisclaimer:"最终价格、库存、税费、行李和退改签以平台页面为准。weishan 不付款、不下单。",
      audit:buildProviderHandoffUiAuditDraft({ handoffDecision:blocked ? "blocked" : "manual_handoff", actionLabel:card.actionLabel || "去平台确认", actionType, copyPayloadGeneratedCount:copyPayload ? 1 : 0 }),
      manualHandoffUxV2Audit:buildManualHandoffUxV2AuditDraft({ handoffDecision:blocked ? "blocked" : "manual_handoff", compactChecklistVisible:!blocked, copySearchConditionsAvailable:!blocked, copyFareBreakdownAvailable:!blocked }),
      manualHandoffUxV3Audit:buildManualHandoffUxV3AuditDraft({ handoffDecision:blocked ? "blocked" : "manual_handoff", copySearchConditionsAvailable:!blocked, copyFareBreakdownAvailable:!blocked }),
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
    const v2Audit = value.manualHandoffUxV2Audit || {};
    if (audit.autoOpen !== false || audit.bookingUrlGeneratedCount !== 0 || audit.bookingUrlDisplayedCount !== 0 || audit.paymentAttemptCount !== 0 || audit.orderAttemptCount !== 0 || audit.identityUploadAttemptCount !== 0) throw new Error("provider handoff audit counters unsafe");
    if (v2Audit.eventType && (v2Audit.autoOpen !== false || v2Audit.bookingUrlDisplayedCount !== 0 || v2Audit.paymentAttemptCount !== 0 || v2Audit.orderAttemptCount !== 0 || v2Audit.identityUploadAttemptCount !== 0)) throw new Error("manual handoff ux v2 audit counters unsafe");
    return true;
  }
  window.WeishanProviderHandoffUi = { PROVIDER_HANDOFF_UI_VERSION, buildProviderHandoffUi, buildProviderHandoffUserSurface, buildProviderHandoffUiAuditDraft, buildManualHandoffUxV2AuditDraft, buildManualHandoffUxV3AuditDraft, assertProviderHandoffUiSafe };
})();
