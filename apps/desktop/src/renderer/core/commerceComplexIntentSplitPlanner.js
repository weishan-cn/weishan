(function(){
  const SPLIT_PLANNER_VERSION = "2.0.51";
  const PHASE = "complex_intent_split_planner";
  const DEFAULT_MODE = "split_complex_commerce_intent";

  const CONTRACT = {
    splitPlannerVersion:SPLIT_PLANNER_VERSION,
    phase:PHASE,
    defaultMode:DEFAULT_MODE,
    splitPolicy:{
      splitTravelAndProduct:true,
      splitTravelAndTicket:true,
      splitProductAndService:true,
      splitMultipleMajorCategories:true,
      keepSimpleIntentAsSinglePlan:true,
      noProviderAccessDuringSplit:true,
      noPriceDuringSplit:true,
      noRedirectDuringSplit:true
    },
    capabilities:{
      canSplitComplexIntent:true,
      canCreateTravelSubPlan:true,
      canCreateProductSubPlan:true,
      canCreateTicketSubPlan:true,
      canCreateLocalServiceSubPlan:true,
      canCreateHotelSubPlan:true,
      canCreateFlightSubPlan:true,
      canAccessProvider:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false
    },
    safety:{
      noRealEndpoint:true,
      noRealApiKey:true,
      noNetworkSearch:true,
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

  const CATEGORY_LABELS = {
    travel_plan:"复合旅行计划",
    product:"商品",
    ticket:"门票 / 票务",
    local_service:"本地服务",
    hotel:"酒店",
    flight:"机票",
    general_commerce:"全球采购"
  };

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeText(input){
    return String(input || "")
      .replace(/[，。；、！？（）【】]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hasAny(raw, patterns){
    const text = String(raw || "");
    return patterns.some((pattern) => pattern.test(text));
  }

  function detectDestination(raw, route){
    const routeDestination = route && route.destination || route && route.commerceAiIntentUnderstanding && route.commerceAiIntentUnderstanding.extractedConstraints && route.commerceAiIntentUnderstanding.extractedConstraints.destination || "";
    if (routeDestination) return routeDestination;
    const text = String(raw || "");
    const known = ["东京", "新加坡", "北京", "上海", "成都", "大阪", "巴黎", "首尔", "纽约", "伦敦"];
    const found = known.find((city) => text.indexOf(city) >= 0);
    if (found) return found;
    const goMatch = text.match(/去([A-Za-z\u4e00-\u9fa5]{2,12})/);
    if (goMatch) return goMatch[1];
    const routeMatch = text.match(/[A-Za-z\u4e00-\u9fa5]{2,12}到([A-Za-z\u4e00-\u9fa5]{2,12})/);
    return routeMatch ? routeMatch[1] : "";
  }

  function detectTimeHint(raw, route){
    const routed = route && route.timeHint || "";
    if (routed) return routed;
    const match = String(raw || "").match(/下个月|明天|周末|下周|本周末|\d{1,2}月\d{0,2}日?/);
    return match ? match[0] : "";
  }

  function detectTravelerHint(raw, route){
    const routed = route && route.travelerHint || "";
    if (routed) return routed;
    const match = String(raw || "").match(/带孩子|带老人|多人|家庭|一家|亲子/);
    return match ? match[0] : "";
  }

  function detectBudgetHint(raw, route){
    const routed = route && route.budgetHint || "";
    if (routed) return routed;
    const match = String(raw || "").match(/一万以内|预算[^\s，。；、]{0,12}|[一二三四五六七八九十百千万\d]+(?:元|块)?以内|多少钱以内/);
    return match ? match[0].replace(/^预算[:：]?/, "") : "";
  }

  function detectOptimizationGoal(raw, route){
    const text = String(raw || "");
    const routed = route && route.optimizationGoal || "";
    if (/性价比高/.test(text) || routed === "性价比高") return "性价比高";
    if (/性价比/.test(text) || routed === "性价比") return "性价比";
    if (/最便宜/.test(text) || routed === "最便宜") return "最便宜";
    return routed || "";
  }

  function detectProductHint(raw){
    const text = String(raw || "");
    if (/适合剪视频的电脑|剪视频的电脑/.test(text)) return "适合剪视频的电脑";
    if (/电脑|笔记本|MacBook/i.test(text)) return "电脑";
    if (/华为手机|手机|iPhone|买一个手机|买部手机/i.test(text)) return /华为手机/.test(text) ? "华为手机" : "手机";
    return "";
  }

  function detectUsageHint(raw){
    const text = String(raw || "");
    if (/剪视频/.test(text)) return "剪视频";
    if (/办公/.test(text)) return "办公";
    if (/游戏/.test(text)) return "游戏";
    return "";
  }

  function detectTicketHint(raw){
    const text = String(raw || "");
    if (/演唱会门票|演唱会/.test(text)) return "演唱会门票";
    if (/比赛票|比赛门票/.test(text)) return "比赛门票";
    if (/展会票|展会门票/.test(text)) return "展会票";
    if (/门票|票务|买票/.test(text)) return "门票";
    return "";
  }

  function detectLocalServiceHint(raw){
    const text = String(raw || "");
    if (/理发/.test(text)) return "理发";
    if (/洗车/.test(text)) return "洗车";
    if (/保洁/.test(text)) return "保洁";
    if (/预约/.test(text)) return "本地服务预约";
    return "";
  }

  function detectCategorySignals(raw, route){
    const text = String(raw || "");
    const categories = Array.isArray(route && route.categories) ? route.categories.slice() : [];
    const hasFlight = categories.indexOf("flight") >= 0 || hasAny(text, [/机票|飞机票|航班|flight/i]);
    const hasHotel = categories.indexOf("hotel") >= 0 || hasAny(text, [/酒店|住宿|hotel/i]);
    const hasTicket = categories.indexOf("ticket") >= 0 || hasAny(text, [/演唱会门票|门票|票务|买票|ticket/i]);
    const hasService = categories.indexOf("local_service") >= 0 || hasAny(text, [/预约|理发|洗车|保洁|本地服务/i]);
    const hasProduct = categories.indexOf("product") >= 0 || categories.indexOf("complex_product") >= 0 || hasAny(text, [/手机|电脑|笔记本|MacBook|iPhone|华为|商品|平板|耳机|相机|手表|家电/i]);
    const hasTravel = hasFlight || hasHotel || hasAny(text, [/旅行|旅游|出行|去东京|去[A-Za-z\u4e00-\u9fa5]{2,12}/i]);
    return { hasFlight, hasHotel, hasTicket, hasService, hasProduct, hasTravel };
  }

  function safeGateFields(){
    return {
      canAccessProvider:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false
    };
  }

  function createTravelSubPlan(input, extracted){
    const components = [];
    if (extracted.hasFlight !== false) components.push("flight");
    if (extracted.hasHotel !== false) components.push("hotel");
    if (!components.length) components.push("flight", "hotel");
    return Object.assign({
      subPlanId:"travel-1",
      title:"旅行计划",
      intentCategory:"multi_category_travel",
      commerceType:"travel_plan",
      components,
      destination:extracted.destination || "",
      timeHint:extracted.timeHint || "",
      travelerHint:extracted.travelerHint || "",
      budgetHint:extracted.budgetHint || "",
      optimizationGoal:extracted.optimizationGoal || ""
    }, safeGateFields());
  }

  function createProductSubPlan(input, extracted){
    return Object.assign({
      subPlanId:"product-1",
      title:"商品采购计划",
      intentCategory:"product",
      commerceType:"product",
      productHint:extracted.productHint || detectProductHint(input) || "商品",
      budgetHint:extracted.budgetHint || "",
      usageHint:extracted.usageHint || "",
      optimizationGoal:extracted.productOptimizationGoal || extracted.optimizationGoal || ""
    }, safeGateFields());
  }

  function createTicketSubPlan(input, extracted){
    return Object.assign({
      subPlanId:"ticket-1",
      title:"门票计划",
      intentCategory:"ticket",
      commerceType:"ticket",
      ticketHint:extracted.ticketHint || detectTicketHint(input) || "门票",
      destination:extracted.destination || "",
      timeHint:extracted.timeHint || "",
      budgetHint:extracted.budgetHint || "",
      optimizationGoal:extracted.optimizationGoal || ""
    }, safeGateFields());
  }

  function createLocalServiceSubPlan(input, extracted){
    return Object.assign({
      subPlanId:"local-service-1",
      title:"本地服务计划",
      intentCategory:"local_service",
      commerceType:"serviceBooking",
      serviceHint:extracted.serviceHint || detectLocalServiceHint(input) || "本地服务预约",
      destination:extracted.destination || "附近",
      timeHint:extracted.timeHint || "",
      budgetHint:extracted.budgetHint || ""
    }, safeGateFields());
  }

  function createSimpleSubPlan(input, route, extracted){
    const category = route && route.intentCategory || "general_commerce";
    const commerceType = route && route.commerceType || (category === "local_service" ? "serviceBooking" : category);
    const map = {
      product:["商品采购计划", "商品"],
      complex_product:["商品采购计划", "商品"],
      hotel:["酒店计划", "酒店"],
      flight:["机票计划", "机票"],
      ticket:["门票计划", "门票 / 票务"],
      local_service:["本地服务计划", "本地服务"],
      general_commerce:["全球采购计划", "全球采购"]
    };
    const labels = map[category] || map.general_commerce;
    return Object.assign({
      subPlanId:"single-1",
      title:labels[0],
      intentCategory:category,
      commerceType,
      categoryLabel:labels[1],
      productHint:detectProductHint(input),
      serviceHint:detectLocalServiceHint(input),
      ticketHint:detectTicketHint(input),
      destination:extracted.destination || "",
      timeHint:extracted.timeHint || "",
      budgetHint:extracted.budgetHint || "",
      optimizationGoal:extracted.optimizationGoal || "",
      components:category === "hotel" ? ["hotel"] : category === "flight" ? ["flight"] : []
    }, safeGateFields());
  }

  function extractCommon(input, localIntentRoute){
    const text = String(input || "");
    const signals = detectCategorySignals(text, localIntentRoute);
    const optimizationGoal = detectOptimizationGoal(text, localIntentRoute);
    return Object.assign({
      originalIntent:text,
      normalizedText:normalizeText(text),
      destination:detectDestination(text, localIntentRoute),
      timeHint:detectTimeHint(text, localIntentRoute),
      travelerHint:detectTravelerHint(text, localIntentRoute),
      budgetHint:detectBudgetHint(text, localIntentRoute),
      optimizationGoal,
      productOptimizationGoal:optimizationGoal === "性价比高" && /适合剪视频|剪视频|电脑/.test(text) ? "性价比" : optimizationGoal,
      productHint:detectProductHint(text),
      usageHint:detectUsageHint(text),
      ticketHint:detectTicketHint(text),
      serviceHint:detectLocalServiceHint(text)
    }, signals);
  }

  function detectComplexCommerceSplitNeeds(input, localIntentRoute){
    const extracted = extractCommon(input, localIntentRoute);
    const planGroups = [];
    if (extracted.hasTravel && (extracted.hasFlight || extracted.hasHotel)) planGroups.push("travel");
    if (extracted.hasProduct) planGroups.push("product");
    if (extracted.hasTicket) planGroups.push("ticket");
    if (extracted.hasService) planGroups.push("local_service");
    const unique = planGroups.filter((item, index) => planGroups.indexOf(item) === index);
    const shouldSplit = unique.length > 1;
    return {
      shouldSplit,
      splitReason:shouldSplit ? "multiple_major_categories" : "simple_single_intent",
      planGroups:unique.length ? unique : ["single"],
      extracted
    };
  }

  function normalizeCommerceSubPlans(subPlans){
    return (Array.isArray(subPlans) ? subPlans : []).map((plan, index) => {
      const fallbackId = "subplan-" + (index + 1);
      return Object.assign({}, safeGateFields(), plan || {}, {
        subPlanId:plan && plan.subPlanId || fallbackId
      });
    });
  }

  function splitComplexCommerceIntent(input, localIntentRoute){
    const decision = detectComplexCommerceSplitNeeds(input, localIntentRoute);
    const extracted = decision.extracted || extractCommon(input, localIntentRoute);
    let subPlans = [];
    if (decision.shouldSplit) {
      if (decision.planGroups.indexOf("travel") >= 0) subPlans.push(createTravelSubPlan(input, extracted));
      if (decision.planGroups.indexOf("product") >= 0) subPlans.push(createProductSubPlan(input, extracted));
      if (decision.planGroups.indexOf("ticket") >= 0) subPlans.push(createTicketSubPlan(input, extracted));
      if (decision.planGroups.indexOf("local_service") >= 0) subPlans.push(createLocalServiceSubPlan(input, extracted));
    } else {
      subPlans.push(createSimpleSubPlan(input, localIntentRoute, extracted));
    }
    return Object.assign({
      splitPlannerVersion:SPLIT_PLANNER_VERSION,
      phase:PHASE,
      splitMode:DEFAULT_MODE,
      shouldSplit:decision.shouldSplit,
      splitReason:decision.splitReason,
      splitReasonLabel:decision.shouldSplit ? "多类别复合需求" : "单一简单需求",
      originalIntent:String(input || ""),
      subPlans:normalizeCommerceSubPlans(subPlans)
    }, safeGateFields());
  }

  function componentLabel(components){
    const labels = { flight:"机票", hotel:"酒店", ticket:"门票", product:"商品", local_service:"本地服务" };
    return (Array.isArray(components) ? components : []).map((item) => labels[item] || item).filter(Boolean).join(" + ");
  }

  function displaySubPlan(plan){
    const safe = plan || {};
    return {
      title:safe.title || "子计划",
      categoryLabel:safe.categoryLabel || CATEGORY_LABELS[safe.commerceType] || CATEGORY_LABELS[safe.intentCategory] || "全球采购",
      componentsLabel:componentLabel(safe.components),
      destinationLabel:safe.destination || "",
      timeHintLabel:safe.timeHint || "",
      travelerHintLabel:safe.travelerHint || "",
      budgetHintLabel:safe.budgetHint || "",
      optimizationGoalLabel:safe.optimizationGoal || "",
      productHintLabel:safe.productHint || "",
      usageHintLabel:safe.usageHint || "",
      ticketHintLabel:safe.ticketHint || "",
      serviceHintLabel:safe.serviceHint || "",
      providerAccessLabel:"否",
      priceLabel:"否",
      redirectLabel:"否"
    };
  }

  function toComplexIntentSplitDisplayStatus(splitResult){
    const result = splitResult || {};
    const subPlans = normalizeCommerceSubPlans(result.subPlans || []);
    return {
      title:"复杂意图拆分计划",
      subtitle:"复合需求会先拆成多个独立子计划，每个子计划分别走安全 gate。当前不会访问任何真实 provider。",
      splitStatusLabel:result.shouldSplit === true ? "已拆分" : "无需拆分",
      splitReasonLabel:result.shouldSplit === true ? "多类别复合需求" : "单一简单需求",
      subPlanCountLabel:String(subPlans.length || 0),
      subPlans:subPlans.map(displaySubPlan),
      note:"该拆分只生成计划，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。"
    };
  }

  function getComplexIntentSplitPlannerContract(){
    return clone(CONTRACT);
  }

  window.WeishanCommerceComplexIntentSplitPlanner = {
    getComplexIntentSplitPlannerContract,
    detectComplexCommerceSplitNeeds,
    splitComplexCommerceIntent,
    createTravelSubPlan,
    createProductSubPlan,
    createTicketSubPlan,
    createLocalServiceSubPlan,
    normalizeCommerceSubPlans,
    toComplexIntentSplitDisplayStatus
  };
})();
