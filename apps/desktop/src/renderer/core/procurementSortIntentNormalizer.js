(function(){
  const PROCUREMENT_SORT_INTENT_NORMALIZER_VERSION = "2.1.47";
  const DIRECT_RE = /直达|直飞|不转机|不中转|不要中转|只看直飞/;
  const LOW_PRICE_RE = /最便宜|最低价|价格低|低价优先|便宜/;
  const FAST_RE = /最快|时间短|耗时短|少耗时/;
  const FLEX_RE = /退改灵活|可退改|退票灵活|改签灵活/;
  const MODIFIER_RE = /(最便宜|最低价|价格低|低价优先|便宜|直达|直飞|不转机|不中转|不要中转|只看直飞|最快|时间短|耗时短|少耗时|退改灵活|可退改|退票灵活|改签灵活|机票|航班|飞机票)/g;
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function displayDate(value){
    const raw = text(value);
    const match = raw.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
    return match ? Number(match[1]) + " 月 " + Number(match[2]) + " 日" : raw;
  }
  function compactDate(value){
    const raw = text(value);
    const match = raw.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
    return match ? Number(match[1]) + "月" + Number(match[2]) + "日" : raw;
  }
  function cleanPlace(value){ return text(value).replace(MODIFIER_RE, "").replace(/[，。,.、；;：:\s]+$/g, "").trim(); }
  function inferSort(raw){
    const value = text(raw);
    if (LOW_PRICE_RE.test(value)) return { sortPreference:"low_price", sortLabel:"低价优先" };
    if (FAST_RE.test(value)) return { sortPreference:"shortest_duration", sortLabel:"时间优先" };
    if (FLEX_RE.test(value)) return { sortPreference:"flexible_refund", sortLabel:"退改灵活优先" };
    return { sortPreference:"safe_trusted", sortLabel:"安全与可信来源优先" };
  }
  function normalizeProcurementSortIntent(input){
    const safe = input && typeof input === "object" ? input : { rawUserInput:input };
    const raw = text(safe.rawUserInput || safe.input || safe.text || "");
    const parser = window.WeishanFlightIntentParser && typeof window.WeishanFlightIntentParser.parseFlightIntent === "function" ? window.WeishanFlightIntentParser.parseFlightIntent(raw) : {};
    const sort = inferSort(raw + " " + text(safe.sortPreference || safe.sortLabel || ""));
    const directOnly = safe.directOnly === true || parser.directOnly === true || DIRECT_RE.test(raw);
    const origin = cleanPlace(safe.origin || parser.origin || "上海");
    const destination = cleanPlace(safe.destination || parser.destination || "成都");
    const departureDate = compactDate(safe.departureDate || safe.date || parser.departureDate || parser.date || "7月15日");
    const dateDisplay = displayDate(safe.dateDisplay || departureDate);
    return clone({
      sortIntentVersion:PROCUREMENT_SORT_INTENT_NORMALIZER_VERSION,
      origin,
      destination,
      departureDate,
      dateDisplay,
      directOnly,
      directPreference:directOnly ? "直达优先" : "按条件筛选",
      sortPreference:sort.sortPreference,
      sortLabel:sort.sortLabel,
      redacted:true,
      audit:buildProcurementSortIntentAuditDraft({ rawUserInput:raw, origin, destination, directOnly, sortPreference:sort.sortPreference, sortLabel:sort.sortLabel })
    });
  }
  function buildProcurementSortIntentAuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"PROCUREMENT_SORT_INTENT_NORMALIZER_DRAFT",
      sortIntentVersion:PROCUREMENT_SORT_INTENT_NORMALIZER_VERSION,
      directOnly:safe.directOnly === true,
      sortPreference:text(safe.sortPreference || "safe_trusted"),
      sortLabel:text(safe.sortLabel || "安全与可信来源优先"),
      destinationModifierLeakCount:MODIFIER_RE.test(text(safe.destination || "")) ? 1 : 0,
      redacted:true
    });
  }
  function assertProcurementSortIntentSafe(result){
    const value = result || normalizeProcurementSortIntent({});
    if (value.redacted !== true || !value.audit || value.audit.redacted !== true) throw new Error("sort intent audit must be redacted");
    if (MODIFIER_RE.test(value.destination || "")) throw new Error("destination must not contain sort/direct modifiers");
    if (LOW_PRICE_RE.test(value.rawUserInput || "") && value.sortPreference !== "low_price") throw new Error("low price intent must normalize to low_price");
    return true;
  }
  window.WeishanProcurementSortIntentNormalizer = { PROCUREMENT_SORT_INTENT_NORMALIZER_VERSION, normalizeProcurementSortIntent, buildProcurementSortIntentAuditDraft, assertProcurementSortIntentSafe };
})();
