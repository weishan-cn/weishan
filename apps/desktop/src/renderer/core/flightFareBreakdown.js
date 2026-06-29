(function(){
  const FLIGHT_FARE_BREAKDOWN_VERSION = "2.2.2";
  const UNKNOWN_FINAL_PAGE = "未单独提供 / 以平台页面为准";
  const WITHHELD_PRICE_LABEL = "价格暂不展示";
  const ALLOWED_PRICE_TYPES = ["production_price", "limited_beta_price", "sandbox_test_price", "unknown"];

  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function numberOrNull(value){
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function priceType(value){
    const raw = text(value || "unknown");
    return ALLOWED_PRICE_TYPES.includes(raw) ? raw : "unknown";
  }
  function completeness(value){
    const raw = text(value || "unknown");
    return ["complete", "partial", "unknown"].includes(raw) ? raw : "unknown";
  }
  function completenessLabel(value){
    const raw = completeness(value);
    if (raw === "complete") return "完整";
    if (raw === "partial") return "部分完整 / 以平台页面为准";
    return "未单独提供 / 以平台页面为准";
  }
  function money(value, currency){
    const n = numberOrNull(value);
    if (n === null) return UNKNOWN_FINAL_PAGE;
    const prefix = currency === "CNY" ? "¥" : text(currency || "CNY") + " ";
    return prefix + String(n);
  }
  function nullableMoney(value, currency){
    const n = numberOrNull(value);
    if (n === null) return UNKNOWN_FINAL_PAGE;
    return money(n, currency);
  }
  function normalizeFlightFareBreakdown(input){
    const safe = input && typeof input === "object" ? input : {};
    const currency = text(safe.currency || "CNY") || "CNY";
    const result = {
      fareBreakdownVersion:"flight_fare_breakdown_v1",
      currency,
      baseFare:numberOrNull(safe.baseFare),
      fuelSurcharge:numberOrNull(safe.fuelSurcharge),
      airportConstructionFee:numberOrNull(safe.airportConstructionFee),
      civilAviationDevelopmentFund:numberOrNull(safe.civilAviationDevelopmentFund),
      platformServiceFee:numberOrNull(safe.platformServiceFee),
      taxes:numberOrNull(safe.taxes),
      otherFees:numberOrNull(safe.otherFees),
      discount:numberOrNull(safe.discount),
      subsidy:numberOrNull(safe.subsidy),
      totalPayable:numberOrNull(safe.totalPayable),
      taxFeeCompleteness:completeness(safe.taxFeeCompleteness),
      providerPriceLabel:text(safe.providerPriceLabel || "只读候选价 / 平台最终为准"),
      providerPriceType:priceType(safe.providerPriceType),
      finalPageDisclaimer:text(safe.finalPageDisclaimer || "最终以平台页面为准"),
      redacted:true
    };
    result.priceWithheld = result.totalPayable === null;
    result.priceDisplay = result.priceWithheld ? WITHHELD_PRICE_LABEL : money(result.totalPayable, currency);
    result.displayRows = buildFlightFareBreakdownRows(result);
    result.compactFareBreakdown = buildCompactFlightFareBreakdown(result);
    result.audit = buildFlightFareBreakdownAuditDraft(result);
    return clone(result);
  }
  function buildFlightFareBreakdownRows(fare){
    const safe = fare && typeof fare === "object" ? fare : {};
    const currency = text(safe.currency || "CNY") || "CNY";
    return [
      { label:"最终应付总价", value:safe.totalPayable === null || safe.totalPayable === undefined ? WITHHELD_PRICE_LABEL : money(safe.totalPayable, currency) },
      { label:"票面价", value:nullableMoney(safe.baseFare, currency) },
      { label:"燃油附加费", value:nullableMoney(safe.fuelSurcharge, currency) },
      { label:"机场建设费 / 民航发展基金", value:nullableMoney(safe.airportConstructionFee !== null && safe.airportConstructionFee !== undefined ? safe.airportConstructionFee : safe.civilAviationDevelopmentFund, currency) },
      { label:"平台服务费", value:nullableMoney(safe.platformServiceFee, currency) },
      { label:"税费", value:nullableMoney(safe.taxes, currency) },
      { label:"其它附加费", value:nullableMoney(safe.otherFees, currency) },
      { label:"优惠 / 补贴", value:safe.discount === null && safe.subsidy === null ? "未提供" : nullableMoney((numberOrNull(safe.discount) || 0) + (numberOrNull(safe.subsidy) || 0), currency) },
      { label:"税费完整性", value:completenessLabel(safe.taxFeeCompleteness) }
    ];
  }
  function rowValue(rows, label){
    const found = rows.find((row) => row && row.label === label);
    return found ? found.value : UNKNOWN_FINAL_PAGE;
  }
  function buildCompactFlightFareBreakdown(fare){
    const safe = fare && typeof fare === "object" ? fare : {};
    const rows = Array.isArray(safe.displayRows) ? safe.displayRows : buildFlightFareBreakdownRows(safe);
    const total = rowValue(rows, "最终应付总价");
    const base = rowValue(rows, "票面价");
    const taxes = rowValue(rows, "税费");
    const other = rowValue(rows, "其它附加费");
    return clone({
      primaryLine:"最终应付总价：" + total,
      summaryLine:"票面价 " + base + "｜税费 " + taxes + "｜附加费 " + other,
      caveatLine:"燃油/机建费：未单独提供，以平台页面为准",
      detailRows:["票面价", "燃油附加费", "机场建设费 / 民航发展基金", "平台服务费", "税费", "其它附加费", "优惠 / 补贴", "最终应付总价"].map((label) => [label, rowValue(rows, label)])
    });
  }
  function buildFareCardUxCleanupAuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"FARE_CARD_UX_CLEANUP_DRAFT",
      fareBreakdownColonFormatApplied:true,
      duplicateTotalPayableRemoved:true,
      internalEnumHiddenFromUserSurface:true,
      finalPageDisclaimerDuplicateCount:Number(safe.finalPageDisclaimerDuplicateCount || 1),
      userFacingSafetyHintCount:Number(safe.userFacingSafetyHintCount || 1),
      noPriceMessageCount:Number(safe.noPriceMessageCount || 1),
      redacted:true
    });
  }
  function buildFlightFareBreakdownAuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"FLIGHT_FARE_BREAKDOWN_DRAFT",
      fareBreakdownVersion:text(safe.fareBreakdownVersion || "flight_fare_breakdown_v1"),
      providerCategory:"flight",
      providerId:text(safe.providerId || "flight_provider_sandbox"),
      currency:text(safe.currency || "CNY"),
      baseFarePresent:numberOrNull(safe.baseFare) !== null,
      fuelSurchargePresent:numberOrNull(safe.fuelSurcharge) !== null,
      airportConstructionFeePresent:numberOrNull(safe.airportConstructionFee) !== null || numberOrNull(safe.civilAviationDevelopmentFund) !== null,
      platformServiceFeePresent:numberOrNull(safe.platformServiceFee) !== null,
      taxesPresent:numberOrNull(safe.taxes) !== null,
      otherFeesPresent:numberOrNull(safe.otherFees) !== null,
      discountPresent:numberOrNull(safe.discount) !== null || numberOrNull(safe.subsidy) !== null,
      totalPayablePresent:numberOrNull(safe.totalPayable) !== null,
      taxFeeCompleteness:completeness(safe.taxFeeCompleteness),
      providerPriceType:priceType(safe.providerPriceType),
      redacted:true
    });
  }
  function assertFlightFareBreakdownSafe(fare){
    const value = fare || normalizeFlightFareBreakdown({});
    if (value.redacted !== true) throw new Error("flight fare breakdown must be redacted");
    if (value.totalPayable === null && value.priceWithheld !== true) throw new Error("missing totalPayable must withhold price");
    if (value.totalPayable === null && /¥\s*\d+/.test(value.priceDisplay || "")) throw new Error("withheld fare must not display numeric price");
    if (/fake|mock|demo|AI\s*估价|estimated\s*price|保证最低价|锁价/i.test(JSON.stringify(value))) throw new Error("flight fare breakdown contains forbidden price copy");
    return true;
  }

  window.WeishanFlightFareBreakdown = {
    FLIGHT_FARE_BREAKDOWN_VERSION,
    UNKNOWN_FINAL_PAGE,
    normalizeFlightFareBreakdown,
    buildFlightFareBreakdownRows,
    buildCompactFlightFareBreakdown,
    buildFlightFareBreakdownAuditDraft,
    buildFareCardUxCleanupAuditDraft,
    assertFlightFareBreakdownSafe
  };
})();
