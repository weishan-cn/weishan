(function(){
  const ROUTER_VERSION = "2.0.49";
  const PHASE = "commerce_local_intent_router";
  const DEFAULT_MODE = "local_first";

  const CATEGORY_LABELS = {
    product:"商品",
    hotel:"酒店",
    flight:"机票",
    ticket:"门票 / 票务",
    local_service:"本地服务",
    general_commerce:"全球采购",
    unknown:"待确认"
  };

  const COMMERCE_TYPE_BY_CATEGORY = {
    product:"product",
    hotel:"hotel",
    flight:"flight",
    ticket:"ticket",
    local_service:"serviceBooking",
    general_commerce:"globalPurchase",
    unknown:"unknown"
  };

  const ROUTER_CONTRACT = {
    routerVersion:ROUTER_VERSION,
    phase:PHASE,
    defaultMode:DEFAULT_MODE,
    tokenPolicy:{
      simpleCommerceIntentUsesAi:false,
      localRuleFirst:true,
      aiFallbackAllowedForComplexIntent:true,
      aiFallbackRequiresExplicitNeed:true,
      neverUseAiForGateRendering:true,
      neverUseAiForStaticSafetyPanels:true
    },
    supportedCategories:{
      product:true,
      hotel:true,
      flight:true,
      ticket:true,
      localService:true,
      generalCommerce:true
    },
    capabilities:{
      canRouteWithoutAi:true,
      canRouteProduct:true,
      canRouteHotel:true,
      canRouteFlight:true,
      canRouteTicket:true,
      canRouteLocalService:true,
      canTriggerCommercePlan:true,
      canTriggerRealProviderSearch:false,
      canDisplayRealPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false
    },
    safety:{
      noAiTokenForSimpleIntent:true,
      noProviderNetworkSearch:true,
      noRealEndpoint:true,
      noRealApiKey:true,
      noRealResults:true,
      noRealPrice:true,
      noFakeDemoMockPrice:true,
      noRedirect:true,
      noCheckout:true,
      noPayment:true,
      noOrderSubmit:true,
      noIdentityStorage:true,
      noRawGpsStorage:true,
      noBypassLocalLaw:true
    }
  };

  const CATEGORY_RULES = [
    {
      category:"flight",
      confidence:"high",
      patterns:[/订机票|买机票|机票|飞机票|航班|往返|单程|airline|flight/i]
    },
    {
      category:"hotel",
      confidence:"high",
      patterns:[/订酒店|酒店|住宿|住一晚|入住|民宿|客栈|度假村|hotel|hostel/i]
    },
    {
      category:"ticket",
      confidence:"high",
      patterns:[/买门票|门票|票务|演唱会|音乐会|球赛|比赛票|展会票|电影票|景点票|ticket/i]
    },
    {
      category:"local_service",
      confidence:"high",
      patterns:[/预约|预订服务|附近服务|理发|洗车|修车|保洁|搬家|家政|维修|按摩|美甲|餐厅预订|订餐厅/i]
    },
    {
      category:"product",
      confidence:"high",
      patterns:[/买|购买|想买|帮我买|买一个|买台|买部|手机|电脑|笔记本|平板|耳机|相机|手表|家电|衣服|鞋|包|化妆品|护肤品|药品以外的普通商品|MacBook|iPhone/i]
    },
    {
      category:"general_commerce",
      confidence:"medium",
      patterns:[/全球采购|采购代理|比价|价格比较|平台比较|最便宜|性价比|采购/i]
    }
  ];

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeCommerceIntentText(input){
    return String(input || "")
      .replace(/[，。；、！？（）【】]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function categoryMatches(normalized){
    const matches = CATEGORY_RULES.map((rule) => {
      const matched = rule.patterns.some((pattern) => pattern.test(normalized));
      return matched ? { category:rule.category, confidence:rule.confidence } : null;
    }).filter(Boolean);
    const hasSpecificNonProduct = matches.some((item) => item.category !== "product" && item.category !== "general_commerce");
    const hasProduct = matches.some((item) => item.category === "product");
    const hasSpecificProductObject = /手机|电脑|笔记本|平板|耳机|相机|手表|家电|衣服|鞋|包|化妆品|护肤品|药品以外的普通商品|MacBook|iPhone|华为|苹果/i.test(normalized);
    if (hasSpecificNonProduct && hasProduct && !hasSpecificProductObject) {
      return matches.filter((item) => item.category !== "product");
    }
    return matches;
  }

  function hasComplexSignals(normalized, matches){
    const raw = String(normalized || "");
    const multiCategory = (matches || []).filter((item) => item.category !== "general_commerce").length > 1;
    const longChineseText = raw.replace(/[^\u4e00-\u9fa5]/g, "").length > 80;
    const explicitPlanning = /帮我规划|帮我比较方案|给我推荐理由|比较.*方案|推荐.*理由|尽量性价比|性价比高/i.test(raw);
    const itineraryOrPeople = /下个月|预算|一万以内|带孩子|多人|多城市|多个城市|酒店.*机票|机票.*酒店|日期|行程|用途/i.test(raw);
    return multiCategory || longChineseText || explicitPlanning || itineraryOrPeople;
  }

  function detectCommerceLocalIntent(input){
    const normalized = normalizeCommerceIntentText(input);
    const matches = categoryMatches(normalized);
    if (!normalized || matches.length === 0) {
      return {
        intentCategory:"unknown",
        commerceType:"unknown",
        confidence:"low",
        reason:"unknown_intent",
        normalizedText:normalized
      };
    }
    const complex = hasComplexSignals(normalized, matches);
    if (complex && matches.filter((item) => item.category !== "general_commerce").length > 1) {
      return {
        intentCategory:"general_commerce",
        commerceType:"globalPurchase",
        confidence:"medium",
        reason:"local_rule_match",
        normalizedText:normalized
      };
    }
    const selected = matches.find((item) => item.category !== "general_commerce") || matches[0];
    return {
      intentCategory:selected.category,
      commerceType:COMMERCE_TYPE_BY_CATEGORY[selected.category] || "globalPurchase",
      confidence:selected.confidence || "medium",
      reason:"local_rule_match",
      normalizedText:normalized
    };
  }

  function shouldUseAiForCommerceIntent(input){
    const normalized = normalizeCommerceIntentText(input);
    const matches = categoryMatches(normalized);
    if (!normalized || matches.length === 0) return true;
    return hasComplexSignals(normalized, matches) === true;
  }

  function routeCommerceIntentLocally(input){
    const detected = detectCommerceLocalIntent(input);
    const aiFallbackEligible = shouldUseAiForCommerceIntent(input);
    const canTriggerCommercePlan = detected.intentCategory !== "unknown";
    return Object.assign({
      routerVersion:ROUTER_VERSION,
      phase:PHASE,
      routeMode:DEFAULT_MODE,
      routedBy:"local_rules",
      aiUsed:false,
      aiFallbackEligible,
      canTriggerCommercePlan,
      canTriggerRealProviderSearch:false,
      canDisplayRealPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false
    }, detected);
  }

  function toCommerceLocalIntentDisplayStatus(route){
    const safeRoute = route || {};
    const category = safeRoute.intentCategory || "unknown";
    return {
      title:"本地意图识别",
      subtitle:"普通购物、酒店、机票、票务请求优先使用本地规则识别，减少 AI token 消耗。",
      routeModeLabel:"本地规则优先",
      aiUsedLabel:safeRoute.aiUsed === true ? "是" : "否",
      aiFallbackLabel:"仅复杂需求可选",
      categoryLabel:CATEGORY_LABELS[category] || "待确认",
      commercePlanLabel:safeRoute.canTriggerCommercePlan === false ? "否" : "是",
      providerSearchLabel:"否",
      priceLabel:"否",
      redirectLabel:"否"
    };
  }

  function explainCommerceLocalIntentRoute(input){
    const route = routeCommerceIntentLocally(input);
    const display = toCommerceLocalIntentDisplayStatus(route);
    return {
      route,
      display,
      summary:[
        "本地意图识别：" + display.categoryLabel,
        "路由方式：" + display.routeModeLabel,
        "是否使用 AI：" + display.aiUsedLabel,
        "AI fallback：" + display.aiFallbackLabel,
        "当前不会访问真实平台、不会返回价格、不会跳转购买或预订页面。"
      ].join("；")
    };
  }

  function getCommerceLocalIntentRouterContract(){
    return clone(ROUTER_CONTRACT);
  }

  window.WeishanCommerceLocalIntentRouter = {
    getCommerceLocalIntentRouterContract,
    normalizeCommerceIntentText,
    detectCommerceLocalIntent,
    routeCommerceIntentLocally,
    shouldUseAiForCommerceIntent,
    explainCommerceLocalIntentRoute,
    toCommerceLocalIntentDisplayStatus
  };
})();
