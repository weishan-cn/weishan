(function(){
  const COMPACT_FLIGHT_RESULT_CARD_V1_VERSION = "2.1.68";
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function rowValue(fare, label){
    const rows = Array.isArray(fare && fare.displayRows) ? fare.displayRows : [];
    const found = rows.find(function(row){ return row && row.label === label; });
    return found ? text(found.value) : "未单独提供 / 以平台页面为准";
  }
  function buildCompactFlightResultCard(input){
    const safe = input && typeof input === "object" ? input : {};
    const fare = safe.fareBreakdown || {};
    const badgesApi = window.WeishanResultBadgeFormatter;
    const badgesResult = badgesApi && typeof badgesApi.formatResultBadges === "function"
      ? badgesApi.formatResultBadges(safe.badges || ["只读候选价", "平台最终为准", "未锁价", "不代表可出票"])
      : { badges:safe.badges || ["只读候选价", "平台最终为准", "未锁价", "不代表可出票"], displayText:"只读候选价｜平台最终为准｜未锁价｜不代表可出票", badgeSeparated:true };
    const routeLine = text(safe.routeLine || ((safe.origin || "上海") + " → " + (safe.destination || "成都")));
    const metaLine = text(safe.metaLine || [safe.dateDisplay || "7 月 15 日", safe.directPreference || "直达优先", safe.sortLabel || "低价优先"].filter(Boolean).join(" · "));
    const card = {
      cardVersion:"compact_flight_result_card_v1",
      moduleVersion:COMPACT_FLIGHT_RESULT_CARD_V1_VERSION,
      rank:Number(safe.rank || 1),
      routeLine,
      metaLine,
      primaryPrice:text(safe.primaryPrice || safe.priceDisplay || "¥1010"),
      priceTruthText:text(safe.priceTruthText || "只读候选价，不代表真实最低价"),
      fareSummary:text(safe.fareSummary || ("票面价 " + rowValue(fare, "票面价") + "｜税费 " + rowValue(fare, "税费") + "｜附加费 " + rowValue(fare, "其它附加费"))),
      feeCaveat:text(safe.feeCaveat || "燃油/机建费：以平台页面为准"),
      providerLine:text(safe.providerLine || ("Flight Provider Sandbox · 更新时间 " + text(safe.updatedAtDisplay || "2026-06-20 00:00"))),
      badges:badgesResult.badges,
      badgeDisplayText:badgesResult.displayText,
      actions:["刷新只读报价", "去平台确认", "复制搜索条件"],
      detailFareBreakdownCollapsedByDefault:true,
      detailRows:[
        ["票面价", rowValue(fare, "票面价")],
        ["燃油附加费", rowValue(fare, "燃油附加费")],
        ["机场建设费 / 民航发展基金", rowValue(fare, "机场建设费 / 民航发展基金")],
        ["平台服务费", rowValue(fare, "平台服务费")],
        ["税费", rowValue(fare, "税费")],
        ["其它附加费", rowValue(fare, "其它附加费")],
        ["优惠 / 补贴", rowValue(fare, "优惠 / 补贴")],
        ["最终应付总价", rowValue(fare, "最终应付总价")]
      ],
      debugFieldsHidden:true,
      bookingUrl:null,
      payment:false,
      order:false,
      identityUpload:false,
      autoOpen:false,
      autoRefresh:false,
      audit:buildCompactFlightResultCardAuditDraft({ badgeSeparated:badgesResult.badgeSeparated !== false }),
      redacted:true
    };
    return clone(card);
  }
  function buildCompactFlightResultCardAuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"COMPACT_FLIGHT_RESULT_CARD_V1_DRAFT",
      cardVersion:"compact_flight_result_card_v1",
      primaryPriceVisible:true,
      compactFareSummaryVisible:true,
      detailFareBreakdownCollapsedByDefault:true,
      badgeSeparated:safe.badgeSeparated !== false,
      bookingUrlDisplayedCount:0,
      paymentActionDisplayedCount:0,
      orderActionDisplayedCount:0,
      identityUploadDisplayedCount:0,
      redacted:true
    });
  }
  function assertCompactFlightResultCardSafe(card){
    const value = card || buildCompactFlightResultCard({});
    if (value.detailFareBreakdownCollapsedByDefault !== true) throw new Error("fare detail must be collapsed");
    if (!Array.isArray(value.badges) || String(value.badgeDisplayText || "").indexOf("只读候选价平台最终为准未锁价不代表可出票") >= 0) throw new Error("badges must not concatenate");
    if (value.bookingUrl !== null || value.payment !== false || value.order !== false || value.identityUpload !== false) throw new Error("compact card unsafe action state");
    if (!value.audit || value.audit.redacted !== true) throw new Error("compact card audit must be redacted");
    return true;
  }
  window.WeishanCompactFlightResultCardV1 = {
    COMPACT_FLIGHT_RESULT_CARD_V1_VERSION,
    buildCompactFlightResultCard,
    buildCompactFlightResultCardAuditDraft,
    assertCompactFlightResultCardSafe
  };
})();
