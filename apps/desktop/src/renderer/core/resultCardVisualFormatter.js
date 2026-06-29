(function(){
  const RESULT_CARD_VISUAL_FORMATTER_VERSION = "2.2.1";
  const HIDDEN_DEBUG_FIELDS = ["Cheapest Truth Guard", "not_ranked_as_real_cheapest", "canClaimCheapest", "canParticipateInCheapestRanking", "guardName", "internal enum", "rollbackDecision JSON", "audit draft", "raw schema", "raw provider payload"];
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function rowValue(fare, label){
    const rows = Array.isArray(fare && fare.displayRows) ? fare.displayRows : [];
    const found = rows.find((row) => row && row.label === label);
    return found ? text(found.value) : "未单独提供 / 以平台页面为准";
  }
  function compactFareBreakdown(fare){
    const safe = fare || {};
    const total = rowValue(safe, "最终应付总价");
    const base = rowValue(safe, "票面价");
    const taxes = rowValue(safe, "税费");
    const other = rowValue(safe, "其它附加费");
    const detailRows = ["票面价", "燃油附加费", "机场建设费 / 民航发展基金", "平台服务费", "税费", "其它附加费", "优惠 / 补贴", "最终应付总价"].map((label) => [label, rowValue(safe, label)]);
    return clone({
      primaryLine:"最终应付总价：" + total,
      summaryLine:"票面价 " + base + "｜税费 " + taxes + "｜附加费 " + other,
      caveatLine:"燃油/机建费：未单独提供，以平台页面为准",
      detailRows
    });
  }
  function buildResultCardVisualModel(input){
    const safe = input && typeof input === "object" ? input : {};
    const card = safe.card || {};
    const sortIntent = safe.sortIntent || {};
    const fare = safe.fareBreakdown || card.fareBreakdown || {};
    const compact = compactFareBreakdown(fare);
    const routeLine = text(card.title || ((sortIntent.origin || "上海") + " → " + (sortIntent.destination || "成都"))).replace(/\s*·.*$/, "");
    const metaLine = [sortIntent.dateDisplay || "7 月 15 日", sortIntent.directPreference || "直达优先", sortIntent.sortLabel || "低价优先"].filter(Boolean).join(" · ");
    const badges = window.WeishanResultBadgeFormatter && window.WeishanResultBadgeFormatter.formatResultBadges ? window.WeishanResultBadgeFormatter.formatResultBadges(card.badges || ["只读候选价", "平台最终为准", "未锁价", "不代表可出票"]) : { badges:card.badges || [], displayText:"", badgeSeparated:true };
    const model = {
      visualCardVersion:"result_card_visual_v1",
      formatterVersion:RESULT_CARD_VISUAL_FORMATTER_VERSION,
      routeLine,
      metaLine,
      primaryPrice:text(card.priceDisplay || "暂无真实价格结果"),
      priceSubtext:text(card.priceTruthLabel || "只读候选价，不代表真实最低价"),
      providerLine:"来源：" + text(card.providerName || "Flight Provider Sandbox"),
      updatedAtLine:"更新时间：" + text(card.updatedAt || "待人工核对").replace("T", " ").replace(/\.\d{3}Z$/, ""),
      fareSummaryLine:compact.summaryLine,
      compactFareBreakdown:compact,
      badges:badges.badges,
      badgeDisplayText:badges.displayText,
      actionButtons:["去平台确认", "复制搜索条件"],
      safetyLine:"weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。",
      hiddenDebugFields:HIDDEN_DEBUG_FIELDS.slice(),
      bookingUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      audit:buildResultCardVisualFormatterAuditDraft({ procurementCategory:safe.procurementCategory || "flight", cardCount:1, compactFareBreakdownEnabled:true, badgeSeparated:badges.badgeSeparated !== false }),
      redacted:true
    };
    return clone(model);
  }
  function buildResultCardVisualFormatterAuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"RESULT_CARD_VISUAL_FORMATTER_DRAFT",
      visualCardVersion:"result_card_visual_v1",
      procurementCategory:text(safe.procurementCategory || "flight"),
      cardCount:Number(safe.cardCount || 0),
      compactFareBreakdownEnabled:safe.compactFareBreakdownEnabled !== false,
      badgeSeparated:safe.badgeSeparated !== false,
      internalDebugFieldsHidden:true,
      bookingUrlDisplayedCount:0,
      paymentActionDisplayedCount:0,
      orderActionDisplayedCount:0,
      identityUploadDisplayedCount:0,
      redacted:true
    });
  }
  function assertResultCardVisualSafe(model){
    const value = model || buildResultCardVisualModel({});
    const serial = JSON.stringify(value);
    HIDDEN_DEBUG_FIELDS.forEach((field) => {
      if ((value.routeLine + value.metaLine + value.fareSummaryLine + value.badgeDisplayText).includes(field)) throw new Error("visual model leaked internal debug field");
    });
    if (value.bookingUrl !== null || value.payment !== false || value.order !== false || value.identityUpload !== false) throw new Error("visual model unsafe action state");
    if (/只读候选价平台最终为准未锁价不代表可出票/.test(serial)) throw new Error("visual model concatenated badges");
    if (!value.audit || value.audit.redacted !== true) throw new Error("visual audit must be redacted");
    return true;
  }
  window.WeishanResultCardVisualFormatter = { RESULT_CARD_VISUAL_FORMATTER_VERSION, buildResultCardVisualModel, buildResultCardVisualFormatterAuditDraft, assertResultCardVisualSafe };
})();
