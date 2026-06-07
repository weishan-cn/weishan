(function(){
  const ROUTER_VERSION = "2.0.50";
  const PHASE = "commerce_local_intent_router";
  const DEFAULT_MODE = "local_first";
  const COMPLEX_FALLBACK_MODE = "local_first_with_ai_fallback";

  const CATEGORY_LABELS = {
    product:"商品",
    complex_product:"复杂商品采购",
    hotel:"酒店",
    flight:"机票",
    ticket:"门票 / 票务",
    local_service:"本地服务",
    multi_category_travel:"复合旅行计划",
    general_commerce:"全球采购",
    unknown:"待确认"
  };

  const COMMERCE_TYPE_BY_CATEGORY = {
    product:"product",
    complex_product:"product",
    hotel:"hotel",
    flight:"flight",
    ticket:"ticket",
    local_service:"serviceBooking",
    multi_category_travel:"travel_plan",
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
    const longChineseText = raw.replace(/[^\u4e00-\u9fa5]/g, "").length > 40 && /买|购买|订|预订|预约|机票|酒店|门票|服务|采购|比较|推荐|安排|规划/i.test(raw);
    const explicitPlanning = /比较|规划|安排|推荐|性价比|最便宜|同等质量|方案|预算|帮我比较|尽量性价比/i.test(raw);
    const timeHint = /下个月|明天|周末|下周|日期|时间|\d{1,2}月|\d{1,2}日/i.test(raw);
    const peopleHint = /带孩子|带老人|多人|家庭|一家|亲子/i.test(raw);
    const placeHint = /去东京|去新加坡|去北京|去上海|去成都|去大阪|去巴黎|成都到东京|成都到新加坡|目的地|到[A-Za-z\u4e00-\u9fa5]{2,12}/i.test(raw);
    const budgetHint = /预算|一万以内|[一二三四五六七八九十百千万\d]+(?:元|块|以内|预算)|多少钱以内/i.test(raw);
    const travelCombo = /酒店.*机票|机票.*酒店|酒店.*门票|门票.*酒店|机票.*活动|活动.*机票/i.test(raw);
    return multiCategory || travelCombo || longChineseText || explicitPlanning || ((timeHint || peopleHint || placeHint || budgetHint) && explicitPlanning);
  }

  function matchedCategories(matches){
    const seen = {};
    return (matches || [])
      .map((item) => item.category)
      .filter((category) => category && category !== "general_commerce")
      .filter((category) => {
        if (seen[category]) return false;
        seen[category] = true;
        return true;
      });
  }

  function detectDestination(raw){
    const text = String(raw || "");
    const known = ["东京", "新加坡", "北京", "上海", "成都", "大阪", "巴黎", "首尔", "纽约", "伦敦"];
    const found = known.find((city) => text.indexOf(city) >= 0);
    if (found) return found;
    const goMatch = text.match(/去([A-Za-z\u4e00-\u9fa5]{2,12})/);
    if (goMatch) return goMatch[1];
    const routeMatch = text.match(/[A-Za-z\u4e00-\u9fa5]{2,12}到([A-Za-z\u4e00-\u9fa5]{2,12})/);
    return routeMatch ? routeMatch[1] : "";
  }

  function detectTimeHint(raw){
    const text = String(raw || "");
    const match = text.match(/下个月|明天|周末|下周|本周末|\d{1,2}月\d{0,2}日?/);
    return match ? match[0] : "";
  }

  function detectTravelerHint(raw){
    const text = String(raw || "");
    const match = text.match(/带孩子|带老人|多人|家庭|一家|亲子/);
    return match ? match[0] : "";
  }

  function detectBudgetHint(raw){
    const text = String(raw || "");
    const match = text.match(/一万以内|预算[^\s，。；、]{0,12}|[一二三四五六七八九十百千万\d]+(?:元|块)?以内|多少钱以内/);
    return match ? match[0].replace(/^预算[:：]?/, "") : "";
  }

  function detectOptimizationGoal(raw){
    const text = String(raw || "");
    if (/性价比高|性价比/.test(text)) return "性价比高";
    if (/最便宜/.test(text)) return "最便宜";
    if (/同等质量/.test(text)) return "同等质量";
    if (/适合剪视频|剪视频/.test(text)) return "适合剪视频";
    return "";
  }

  function detectUseCaseHint(raw){
    const text = String(raw || "");
    const match = text.match(/适合剪视频|剪视频|办公|游戏|拍照|学习/);
    return match ? match[0] : "";
  }

  function createAiIntentUnderstanding(raw, categories, detected){
    const destination = detectDestination(raw);
    const timeHint = detectTimeHint(raw);
    const travelerHint = detectTravelerHint(raw);
    const budgetHint = detectBudgetHint(raw);
    const optimizationGoal = detectOptimizationGoal(raw);
    const useCaseHint = detectUseCaseHint(raw);
    const missingFields = [];
    if ((categories || []).indexOf("flight") >= 0 && !timeHint) missingFields.push("出行时间");
    if ((categories || []).indexOf("hotel") >= 0 && !destination) missingFields.push("入住目的地");
    return {
      aiUsed:false,
      aiFallbackEligible:true,
      aiFallbackRequired:true,
      aiRequired:true,
      scope:"intent_understanding_only",
      canAccessProvider:false,
      canSearchNetwork:false,
      canReturnPrice:false,
      canRedirect:false,
      categories:categories || [],
      extractedConstraints:{
        destination,
        timeHint,
        travelerHint,
        budgetHint,
        optimizationGoal,
        useCaseHint
      },
      missingFields,
      note:"复杂需求需要 AI 理解；本轮仅生成结构化计划字段，不访问 provider、不联网、不返回价格。"
    };
  }

  function complexCategoryFor(normalized, categories){
    const list = categories || [];
    if (list.indexOf("flight") >= 0 && list.indexOf("hotel") >= 0) return "multi_category_travel";
    if (list.indexOf("hotel") >= 0 && list.indexOf("ticket") >= 0) return "multi_category_travel";
    if (list.indexOf("product") >= 0 && /预算|性价比|同等质量|适合|用途|剪视频|比较/i.test(normalized)) return "complex_product";
    if (list.length > 1) return "general_commerce";
    return list[0] || "general_commerce";
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
    if (complex) {
      const categories = matchedCategories(matches);
      const intentCategory = complexCategoryFor(normalized, categories);
      return {
        intentCategory,
        commerceType:COMMERCE_TYPE_BY_CATEGORY[intentCategory] || "globalPurchase",
        confidence:"medium",
        reason:"local_rule_match",
        normalizedText:normalized,
        categories
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
    const aiFallbackRequired = aiFallbackEligible && detected.intentCategory !== "unknown";
    const canTriggerCommercePlan = detected.intentCategory !== "unknown";
    const categories = detected.categories || (detected.intentCategory !== "unknown" ? [detected.intentCategory] : []);
    const understanding = aiFallbackRequired ? createAiIntentUnderstanding(detected.normalizedText, categories, detected) : null;
    return Object.assign({
      routerVersion:ROUTER_VERSION,
      phase:PHASE,
      routeMode:aiFallbackRequired ? COMPLEX_FALLBACK_MODE : DEFAULT_MODE,
      routedBy:"local_rules",
      aiUsed:false,
      aiFallbackEligible,
      aiFallbackRequired,
      aiRequired:aiFallbackRequired,
      commerceAiIntentUnderstanding:understanding,
      categories,
      destination:understanding && understanding.extractedConstraints.destination || "",
      timeHint:understanding && understanding.extractedConstraints.timeHint || "",
      travelerHint:understanding && understanding.extractedConstraints.travelerHint || "",
      budgetHint:understanding && understanding.extractedConstraints.budgetHint || "",
      optimizationGoal:understanding && understanding.extractedConstraints.optimizationGoal || "",
      useCaseHint:understanding && understanding.extractedConstraints.useCaseHint || "",
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
    const complex = safeRoute.aiFallbackRequired === true || safeRoute.routeMode === COMPLEX_FALLBACK_MODE;
    const understanding = safeRoute.commerceAiIntentUnderstanding || {};
    const constraints = understanding.extractedConstraints || {};
    const categories = Array.isArray(safeRoute.categories) ? safeRoute.categories : [];
    const categoryNames = categories.map((item) => CATEGORY_LABELS[item] || item).filter(Boolean);
    return {
      title:"本地意图识别",
      subtitle:"普通购物、酒店、机票、票务请求优先使用本地规则识别，减少 AI token 消耗。",
      routeModeLabel:complex ? "本地规则优先 + AI fallback" : "本地规则优先",
      aiUsedLabel:complex ? "否，等待复杂理解" : "否",
      aiFallbackLabel:complex ? "复杂需求需要 AI 理解" : "仅复杂需求可选",
      categoryLabel:CATEGORY_LABELS[category] || "待确认",
      detectedCategoriesLabel:categoryNames.length ? categoryNames.join(" + ") : "待确认",
      destinationLabel:safeRoute.destination || constraints.destination || "待确认",
      timeHintLabel:safeRoute.timeHint || constraints.timeHint || "待确认",
      travelerHintLabel:safeRoute.travelerHint || constraints.travelerHint || "待确认",
      budgetHintLabel:safeRoute.budgetHint || constraints.budgetHint || "待确认",
      optimizationGoalLabel:safeRoute.optimizationGoal || constraints.optimizationGoal || "待确认",
      useCaseHintLabel:safeRoute.useCaseHint || constraints.useCaseHint || "",
      isComplex:complex,
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
