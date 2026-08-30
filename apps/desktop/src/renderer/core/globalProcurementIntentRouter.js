(function(){
  const GLOBAL_PROCUREMENT_INTENT_ROUTER_VERSION = "4.2.8";

  const categoryLabels = {
    flight:"机票",
    hotel:"酒店",
    product:"商品",
    local_service:"本地服务",
    ticket_or_activity:"门票 / 活动",
    multi_category_plan:"多品类采购计划",
    restricted_or_blocked:"受限或阻断请求",
    unknown_procurement:"全球采购"
  };

  const restrictedRules = [
    { pattern:/枪|枪支|firearm|weapon|ammunition|弹药|爆炸物|炸药/i, reason:"weapons / firearms / ammunition / explosives" },
    { pattern:/处方药|管制药|毒品|controlled drug|prescription medicine/i, reason:"controlled drugs / prescription medicine without doctor" },
    { pattern:/赌博|博彩|赌场|开户注册|gambling|casino/i, reason:"gambling" },
    { pattern:/假货|盗版|赃物|counterfeit|stolen goods/i, reason:"counterfeit goods / stolen goods" },
    { pattern:/(?:上传.*(?:身份证|护照|银行卡).*(?:贷款|借款|信用贷|办贷款|credit|loan)|(?:身份证|护照|银行卡).*(?:贷款|借款|信用贷|办贷款|credit|loan)|(?:loan|credit).*(?:identity|passport|bank card))/i, reason:"identity upload / bank card submission / loan or credit with identity upload" },
    { pattern:/上传.*(?:身份证|护照|银行卡)|身份证.*(?:上传)|护照.*(?:预订|上传)|银行卡.*(?:提交|绑定)/i, reason:"identity upload / bank card submission" },
    { pattern:/付款|支付|下单|提交订单|checkout|payment|create order|order action/i, reason:"payment / checkout / order action" }
  ];

  function sanitize(text){
    return String(text || "")
      .replace(/(api[-_ ]?key|token|secret|password|authorization|bearer)\s*[:=：]\s*[^,\s;，。]+/gi, "$1=[redacted]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 260);
  }

  function text(value){
    return String(value || "").trim();
  }

  function firstMatch(text, regex){
    const match = String(text || "").match(regex);
    return match && match[1] ? sanitize(match[1]) : "";
  }

  function normalizeDate(text){
    const value = firstMatch(text, /(\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天]?|\d{4}\s*[-/]\s*\d{1,2}\s*[-/]\s*\d{1,2})/);
    const cn = value.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);
    if (cn) return Number(cn[1]) + " 月 " + Number(cn[2]) + " 日";
    return value;
  }

  function looksLikeCatalogProduct(text){
    const raw = String(text || "");
    const broadProcurement = /采购计划|采购方案|招标|供应商征集|企业服务|咨询方案|项目外包|批量询价|request\s+for\s+proposal|\bRFP\b/i.test(raw);
    const informationalQuestion = /附件|attached\s+file|检查.*(?:首页|界面|输入区|页面|布局)|首都|人口|天气|历史|文化|总统|总理|领导人|是谁|在哪里|是什么|能做什么|可以做什么|为什么|如何|怎么(?!买|购买|找|搜索|比价)|怎样(?!买|购买|找|搜索|比价)|介绍|旅游攻略|汇率|时区|capital|population|weather|history|culture|president|prime\s+minister|who\s+is|where\s+is|what\s+is|why\b|how\b/i.test(raw);
    if (broadProcurement || informationalQuestion) return false;
    const market = /(?:英国|阿根廷|荷兰|波兰|美国|日本|中国|United\s+Kingdom|\bUK\b|Argentina|Netherlands|Poland|Polska|United\s+States|\bUSA\b|Japan|China)/i;
    const shoppingSignal = /商品|电商|零售|价格|多少钱|买|购买|比价|找|搜索|查找|purchase|shopping|retail|price|compare|search/i.test(raw);
    const catalogShape = /(?:\b[A-Z0-9][A-Z0-9._-]{2,}\b|\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|lb|cm|mm|inch|英寸|克|千克|毫升|升|片|包|盒|瓶|罐)\b)/i.test(raw);
    const residual = raw
      .replace(new RegExp(market.source, "gi"), " ")
      .replace(/(?:请|帮我|麻烦|我要|我想|想要|需要|买|购买|找|搜索|查找|比较|比价|商品|价格|多少钱|purchase|shopping|retail|price|compare|search)/gi, " ")
      .replace(/[^\p{L}\p{N}]+/gu, "");
    return shoppingSignal || catalogShape || (market.test(raw) && residual.length >= 2);
  }

  function productQueryFor(text){
    const market = /(?:英国|阿根廷|荷兰|波兰|美国|日本|中国|United\s+Kingdom|\bUK\b|Argentina|Netherlands|Poland|Polska|United\s+States|\bUSA\b|Japan|China)/i;
    return sanitize(String(text || "")
      .replace(new RegExp(market.source, "gi"), " ")
      .replace(/^(?:请|帮我|麻烦|我要|我想|想要|需要|买|购买|找|搜索|查找|比较|比价)\s*/i, " ")
      .replace(/(?:商品|价格|多少钱)\s*$/i, " "));
  }

  function routeForText(text){
    const raw = String(text || "");
    const clean = sanitize(raw);
    const restricted = restrictedRules.find((rule) => rule.pattern.test(raw));
    if (restricted) {
      return "restricted_or_blocked";
    }
    const hasFlight = /机票|航班|飞机票|上海到成都|飞往|飞|flight/i.test(raw);
    const hasHotel = /酒店|住宿|民宿|住一晚|住两晚|住三晚|入住|附近住|订房|找房间|找酒店|hotel/i.test(raw);
    const hasService = /搬家公司|保洁|维修|服务|local service/i.test(raw);
    const hasTicket = /门票|迪士尼|演唱会|ticket|activity/i.test(raw);
    const hasProduct = !hasFlight && !hasHotel && !hasService && !hasTicket && looksLikeCatalogProduct(raw);
    const flags = [hasFlight, hasHotel, hasProduct, hasService, hasTicket].filter(Boolean).length;
    if (flags > 1 || /行程|规划|包括|多品类|采购计划/.test(raw)) return "multi_category_plan";
    if (hasFlight) return "flight";
    if (hasHotel) return "hotel";
    if (hasProduct) return "product";
    if (hasService) return "local_service";
    if (hasTicket) return "ticket_or_activity";
    return clean ? "unknown_procurement" : "unknown_procurement";
  }

  function categoryListFor(text, category){
    const raw = String(text || "");
    const list = [];
    if (category === "restricted_or_blocked") return ["restricted_or_blocked"];
    if (/机票|航班|飞机票|飞往|飞|flight/i.test(raw)) list.push("flight");
    if (/酒店|住宿|民宿|住一晚|住两晚|住三晚|入住|附近住|订房|找房间|找酒店|hotel/i.test(raw)) list.push("hotel");
    if (category === "product") list.push("product");
    if (/搬家公司|保洁|维修|服务|local service/i.test(raw)) list.push("local_service");
    if (/门票|迪士尼|演唱会|ticket|activity/i.test(raw)) list.push("ticket_or_activity");
    if (category === "multi_category_plan" && list.length === 0) return ["flight", "hotel", "local_service", "ticket_or_activity"];
    return list.length ? list : [category];
  }

  function stripRouteDatePrefix(text){
    const raw = String(text || "");
    return raw.replace(/^\s*(?:\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|后天|下周[一二三四五六日天]?|周[一二三四五六日天]?)\s*/, "");
  }

  function extractRoute(text){
    const raw = stripRouteDatePrefix(text);
    const route = raw.match(/([\u4e00-\u9fa5A-Za-z]{2,24})\s*(?:到|飞往|飞|去)\s*([\u4e00-\u9fa5A-Za-z]{2,24})/);
    return {
      origin:route ? sanitize(route[1]).replace(/^(日|从)/, "") : "",
      destination:route ? sanitize(route[2]).replace(/(最便宜|低价|机票|航班|飞机票).*$/, "").trim() : ""
    };
  }

  function routeGlobalProcurementIntent(input){
    const clean = sanitize(input);
    const category = routeForText(clean);
    const restricted = restrictedRules.find((rule) => rule.pattern.test(clean));
    const route = extractRoute(clean);
    const date = normalizeDate(clean);
    const categoryList = categoryListFor(clean, category);
    const classifier = window.WeishanGlobalShoppingIntentClassifier;
    const extractor = window.WeishanGlobalShoppingEntityExtractor;
    const classified = classifier && typeof classifier.buildGlobalShoppingIntentClassification === "function"
      ? classifier.buildGlobalShoppingIntentClassification({ rawUserInput:clean, text:clean, query:clean })
      : null;
    const extracted = extractor && typeof extractor.buildGlobalShoppingEntityExtraction === "function"
      ? extractor.buildGlobalShoppingEntityExtraction({ rawUserInput:clean, text:clean, query:clean, intentClassification:classified })
      : null;
    const entities = extracted && extracted.entities || classified && classified.entities || {};
    const sortPreference = /低价|最便宜|便宜/.test(clean) ? "低价优先" : "安全与可信来源优先";
    const missingInfoList = [];
    if (category === "flight" && !route.origin) missingInfoList.push("出发地");
    if (category === "flight" && !route.destination) missingInfoList.push("目的地");
    if ((category === "flight" || category === "hotel") && !date) missingInfoList.push(category === "hotel" ? "日期范围" : "日期");
    if (category === "product") {
      const explicitMarket = /(?:英国|阿根廷|荷兰|波兰|美国|日本|中国|United\s+Kingdom|\bUK\b|Argentina|Netherlands|Poland|Polska|United\s+States|\bUSA\b|Japan|China)/i.test(clean);
      if (/\biPhone\b/i.test(clean) && !/\biPhone\s*\d+/i.test(clean)) missingInfoList.push("型号");
      if (!explicitMarket && !text(entities.destinationCountry)) missingInfoList.push("购买地区", "收货地");
    }
    const blockedReason = restricted ? restricted.reason : "";
    return {
      routerVersion:GLOBAL_PROCUREMENT_INTENT_ROUTER_VERSION,
      phase:"global_procurement_intent_router",
      intentType:category === "restricted_or_blocked" ? "restricted_or_blocked" : "offline_procurement_planning",
      category,
      categoryLabel:categoryLabels[category] || categoryLabels.unknown_procurement,
      categoryList,
      origin:route.origin,
      destination:route.destination,
      date,
      dateRange:date,
      location:firstMatch(clean, /(?:附近|在|位于)([\u4e00-\u9fa5A-Za-z0-9\s]{2,30})/) || route.destination,
      productName:text(entities.model || entities.product || entities.productName || entities.brand || (category === "product" ? productQueryFor(clean) : "")),
      brand:text(entities.brand),
      model:text(entities.model),
      budget:Number.isFinite(Number(entities.budget)) ? Number(entities.budget) : null,
      currency:text(entities.currency),
      destinationCountry:text(entities.destinationCountry),
      comparisonMarkets:Array.isArray(entities.comparisonMarkets) ? entities.comparisonMarkets.filter(Boolean) : [],
      serviceName:firstMatch(clean, /(搬家公司|保洁|维修|本地服务)/),
      activityName:firstMatch(clean, /(东京迪士尼|演唱会|门票|活动)/),
      sortPreference,
      budgetPreference:firstMatch(clean, /(预算[^，。,.]{1,40}|一万以内|低价|最便宜|性价比高)/) || sortPreference,
      riskLevel:category === "restricted_or_blocked" ? "high" : "medium",
      blockedReason,
      missingInfoList,
      searchQueryDraft:clean,
      externalSearchOnly:category !== "restricted_or_blocked",
      redacted:true
    };
  }

  function assertGlobalProcurementIntentRouterSafe(intent){
    const safe = intent && intent.redacted === true && intent.externalSearchOnly !== false || intent && intent.category === "restricted_or_blocked";
    if (!safe) throw new Error("global procurement intent router must stay redacted and external-search-only");
    return true;
  }

  window.WeishanGlobalProcurementIntentRouter = {
    GLOBAL_PROCUREMENT_INTENT_ROUTER_VERSION,
    routeGlobalProcurementIntent,
    assertGlobalProcurementIntentRouterSafe
  };
})();
