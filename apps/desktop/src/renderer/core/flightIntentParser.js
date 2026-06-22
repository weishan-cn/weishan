(function(){
  const FLIGHT_INTENT_PARSER_VERSION = "2.1.47";
  const DATE_RE = /(\d{4}\s*[-/]\s*\d{1,2}\s*[-/]\s*\d{1,2}|\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天]?)/;
  const DESTINATION_STOP_RE = "(?:直达|直飞|不转机|不要中转|只看直飞|最便宜|最低价|低价|价格最低|商务舱|经济舱|头等舱|机票|飞机票|航空票|航班|$)";
  const DESTINATION_MODIFIER_RE = /(直达|直飞|不转机|不要中转|只看直飞|最便宜|最低价|低价|价格最低|商务舱|经济舱|头等舱|机票|飞机票|航空票|航班|的)+/g;
  const ORIGIN_PREFIX_RE = /^(帮我|请|想|我要|需要|找|买|购买|订|预定|预订|订票|买票|从|出发|低价|最便宜|最低价|价格最低|的)+/g;

  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function normalizeDate(value){
    const raw = text(value);
    const cn = raw.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);
    if (cn) return Number(cn[1]) + "月" + Number(cn[2]) + "日";
    return raw.replace(/\s+/g, " ");
  }
  function displayDate(value){
    return normalizeDate(value).replace(/^(\d{1,2})月(\d{1,2})日$/, "$1 月 $2 日");
  }
  function cleanCity(value, side){
    let next = text(value);
    if (side === "origin") next = next.replace(DATE_RE, "");
    next = next
      .replace(/^日/, "")
      .replace(ORIGIN_PREFIX_RE, "")
      .replace(DESTINATION_MODIFIER_RE, "")
      .replace(/(酒店|住宿|火车票|高铁票|邮轮|游轮|公务机|私人飞机|包机|商品|电商).*$/g, "")
      .replace(/[，。,.；;：:\s]+$/g, "")
      .trim();
    return next.slice(0, 40);
  }
  function parseRoute(rawInput){
    const normalized = text(rawInput)
      .replace(DATE_RE, "")
      .replace(/^(帮我|请|想|我要|需要|找|买|购买|订|预定|预订|订票|买票|从|出发)+/g, "")
      .trim();
    const strong = normalized.match(new RegExp("([\\u4e00-\\u9fa5A-Za-z]{2,24})\\s*(?:到|飞往|去)\\s*([\\u4e00-\\u9fa5A-Za-z]{2,40}?)" + DESTINATION_STOP_RE));
    if (strong) return strong;
    return normalized.match(new RegExp("([\\u4e00-\\u9fa5A-Za-z]{2,24})\\s*飞\\s*([\\u4e00-\\u9fa5A-Za-z]{2,40}?)" + DESTINATION_STOP_RE));
  }
  function parseFlightIntent(input){
    const rawInput = text(input);
    const dateMatch = rawInput.match(DATE_RE);
    const routeMatch = parseRoute(rawInput);
    const origin = routeMatch ? cleanCity(routeMatch[1], "origin") : "";
    const destination = routeMatch ? cleanCity(routeMatch[2], "destination") : "";
    const directOnly = /直达|直飞|不转机|不要中转|只看直飞/.test(rawInput);
    const sortPreference = /最便宜|最低价|低价|价格最低|便宜/.test(rawInput) ? "low_price" : "";
    const removedDestinationModifiers = [];
    const rawDestination = routeMatch ? text(routeMatch[2]) : "";
    ["直达", "直飞", "不转机", "不要中转", "只看直飞", "最便宜", "最低价", "低价", "价格最低", "商务舱", "经济舱", "头等舱"].forEach(function(word){
      if (rawDestination.includes(word) || rawInput.includes(word)) removedDestinationModifiers.push(word);
    });
    const destinationModifierLeakCount = /(直达|直飞|最便宜|最低价|低价|价格最低|商务舱|经济舱|头等舱)/.test(destination) ? 1 : 0;
    return clone({
      parserVersion:FLIGHT_INTENT_PARSER_VERSION,
      rawInputRedacted:"[REDACTED_USER_FLIGHT_QUERY]",
      origin,
      destination,
      departureDate:normalizeDate(dateMatch && dateMatch[1] || ""),
      departureDateDisplay:displayDate(dateMatch && dateMatch[1] || ""),
      directOnly,
      directPreferenceLabel:directOnly ? "直达优先" : "按条件筛选",
      sortPreference,
      sortPreferenceLabel:sortPreference === "low_price" ? "低价优先" : "按条件筛选",
      removedDestinationModifiers,
      cityParseClean:destinationModifierLeakCount === 0,
      destinationModifierLeakCount,
      audit:buildFlightIntentParserPolishAuditDraft({ rawInput:rawInput, origin:origin, destination:destination, directOnly:directOnly, sortPreference:sortPreference, removedDestinationModifiers:removedDestinationModifiers, destinationModifierLeakCount:destinationModifierLeakCount }),
      redacted:true
    });
  }
  function buildFlightIntentParserPolishAuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    const destination = text(safe.destination);
    const leak = Number(safe.destinationModifierLeakCount || (/(直达|直飞|最便宜|最低价|低价|价格最低)/.test(destination) ? 1 : 0));
    return clone({
      eventType:"FLIGHT_INTENT_PARSER_POLISH_DRAFT",
      rawInputRedacted:"[REDACTED_USER_FLIGHT_QUERY]",
      origin:text(safe.origin),
      destination,
      directOnly:safe.directOnly === true,
      sortPreference:text(safe.sortPreference),
      removedDestinationModifiers:Array.isArray(safe.removedDestinationModifiers) ? safe.removedDestinationModifiers : [],
      cityParseClean:leak === 0,
      destinationModifierLeakCount:leak,
      redacted:true
    });
  }
  function assertFlightIntentParserPolishSafe(result){
    const value = result || parseFlightIntent("");
    if (value.redacted !== true || !value.audit || value.audit.redacted !== true) throw new Error("flight intent parser audit must be redacted");
    if (/(直达|直飞|最便宜|最低价|低价|价格最低)/.test(value.destination || "")) throw new Error("destination contains modifier");
    if (/上海到/.test(value.origin || "")) throw new Error("origin contains route connector");
    return true;
  }

  window.WeishanFlightIntentParser = {
    FLIGHT_INTENT_PARSER_VERSION,
    parseFlightIntent,
    buildFlightIntentParserPolishAuditDraft,
    assertFlightIntentParserPolishSafe
  };
})();
