(function(){
  const GLOBAL_PROCUREMENT_USER_FACING_RESULT_CARDS_VERSION = "4.2.8";

  function text(value){
    return String(value || "").trim();
  }

  function list(value){
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function unique(listValue){
    return Array.from(new Set(list(listValue)));
  }

  function normalizeDate(value){
    const raw = text(value);
    const match = raw.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);
    return match ? (Number(match[1]) + " 月 " + Number(match[2]) + " 日") : raw;
  }

  function labelForCategory(category){
    const map = {
      flight:"机票",
      hotel:"酒店",
      product:"商品",
      local_service:"本地服务",
      ticket_or_activity:"门票/活动",
      multi_category_plan:"多品类采购计划",
      restricted_or_blocked:"受限品类"
    };
    return map[category] || "全球采购";
  }

  function titleForCategory(category){
    const map = {
      flight:"机票搜索计划",
      hotel:"酒店筛选计划",
      product:"商品比较计划",
      local_service:"本地服务筛选计划",
      ticket_or_activity:"门票 / 活动购买计划",
      multi_category_plan:"多品类采购计划",
      restricted_or_blocked:"安全阻断"
    };
    return map[category] || "全球采购计划";
  }

  function defaultMissingInfo(category){
    const map = {
      flight:["人数", "舱位", "行李", "时间偏好"],
      hotel:["人数", "房型", "早餐", "取消政策"],
      product:["颜色", "版本", "保修", "发票", "新旧偏好"],
      local_service:["服务时间", "地址", "规模", "预算", "是否需要发票"],
      ticket_or_activity:["日期", "人数", "票种", "官方渠道偏好", "退改规则"]
    };
    return map[category] || [];
  }

  function currentStatus(category){
    const map = {
      flight:"等待可信价格源",
      hotel:"等待可信价格源",
      product:"等待可信价格源",
      local_service:"等待可信价格源",
      ticket_or_activity:"等待可信价格源",
      multi_category_plan:"等待可信价格源",
      restricted_or_blocked:"该请求涉及受限或高风险品类，已停止处理"
    };
    return map[category] || "仅整理搜索条件，暂无真实结果";
  }

  function confidenceLabel(category){
    if (category === "restricted_or_blocked") return "Blocked";
    return "离线采购模式";
  }

  function productCardState(category, fields){
    return {
      imagePlaceholder:(fields.productBrand || fields.productName || labelForCategory(category) || "Item").slice(0, 12),
      brand:fields.productBrand || "",
      model:fields.productModel || "",
      subtitle:fields.productDescriptor || labelForCategory(category),
      category:labelForCategory(category),
      budget:fields.budgetLabel || "",
      destination:fields.destinationCountry || "",
      confidence:confidenceLabel(category),
      updatedAt:"—",
      status:currentStatus(category)
    };
  }

  function providerTemplates(category, fields){
    const comparisonMarkets = Array.isArray(fields.comparisonMarkets) ? fields.comparisonMarkets : [];
    const destination = text(fields.destinationCountry);
    if (category === "product") {
      const cards = [];
      const push = function(name, country, official){
        cards.push({
          platformName:name,
          country:country,
          officialVerified:official === true,
          price:"—",
          availability:"等待数据",
          tax:"等待数据",
          shipping:"等待数据",
          landedCost:"等待数据",
          updatedAt:"—",
          confidence:"离线采购模式"
        });
      };
      if (comparisonMarkets.indexOf("Japan") >= 0 || comparisonMarkets.indexOf("JP") >= 0) {
        push("Rakuten", "Japan", false);
        push("Amazon Japan", "Japan", false);
        push("Yahoo Shopping", "Japan", false);
        push("Mercari", "Japan", false);
      }
      if (comparisonMarkets.indexOf("United States") >= 0 || comparisonMarkets.indexOf("US") >= 0 || destination === "United States") {
        push("Amazon US", "United States", false);
        push("BestBuy", "United States", false);
        push("B&H", "United States", false);
        push("Costco", "United States", false);
      }
      if (!cards.length) {
        push("Official Store", destination || "Global", true);
        push("Major Marketplace", destination || "Global", false);
      }
      return cards;
    }
    if (category === "hotel") {
      return [
        "Booking", "Agoda", "Expedia", "Rakuten Travel", "Trip.com", "Hotels.com"
      ].map((name) => ({
        platformName:name,
        country:destination || "Global",
        officialVerified:false,
        price:"—",
        availability:"等待数据",
        tax:"等待数据",
        shipping:"等待数据",
        landedCost:"等待数据",
        updatedAt:"—",
        confidence:"离线采购模式"
      }));
    }
    if (category === "flight") {
      return [
        "Google Flights", "Skyscanner", "Expedia", "Trip.com", "ANA", "JAL"
      ].map((name) => ({
        platformName:name,
        country:destination || "Global",
        officialVerified:/ANA|JAL/.test(name),
        price:"—",
        availability:"等待数据",
        tax:"等待数据",
        shipping:"等待数据",
        landedCost:"等待数据",
        updatedAt:"—",
        confidence:"离线采购模式"
      }));
    }
    return [];
  }

  function recommendationPanel(category, fields){
    if (category === "product") {
      return {
        title:"AI 采购建议",
        recommendation:"需求已整理完成，正在等待可信价格源。",
        reasons:["商品价格", "运费", "税费", "预计到手成本", "保修", "版本差异"],
        risks:["跨区保修限制", "版本差异需要人工确认", "最终价格以平台页面与结算页为准"],
        estimate:"等待可信价格源"
      };
    }
    return {
      title:"AI 采购建议",
      recommendation:"需求已整理完成，正在等待可信价格源。",
      reasons:["商品价格", "运费", "税费", "预计到手成本", "保修", "版本差异"],
      risks:["最终价格与规则以平台页面为准"],
      estimate:"等待可信价格源"
    };
  }

  function shoppingTimeline(category, fields){
    const hasProduct = !!text(fields.productName || fields.productModel || fields.productBrand);
    const hasDestination = !!text(fields.destinationCountry);
    const hasMarkets = Array.isArray(fields.comparisonMarkets) && fields.comparisonMarkets.length > 0;
    return {
      title:"采购计划",
      steps:[
        { id:"understand", label:"已理解需求", status:"completed" },
        { id:"model", label:"已识别商品", status:hasProduct ? "completed" : "current" },
        { id:"market", label:"已确定收货地", status:hasDestination || hasMarkets ? "completed" : "current" },
        { id:"price", label:"等待平台价格", status:"waiting" },
        { id:"cost", label:"等待成本计算", status:"waiting" },
        { id:"recommend", label:"等待 AI 推荐", status:"waiting" }
      ]
    };
  }

  function costSummary(){
    return {
      title:"预计到手成本",
      rows:[
        ["商品价格", "等待数据"],
        ["运费", "等待数据"],
        ["进口税 / 消费税", "等待数据"],
        ["平台或支付费用", "等待数据"],
        ["预计总成本", "等待数据"]
      ]
    };
  }

  function nextStepLines(category){
    const shared = {
      flight:["连接可信价格源", "查看官方商城", "继续人工比较"],
      hotel:["连接可信价格源", "查看官方商城", "继续人工比较"],
      product:["连接可信价格源", "查看官方商城", "继续人工比较"],
      local_service:["连接可信价格源", "查看官方商城", "继续人工比较"],
      ticket_or_activity:["连接可信价格源", "查看官方商城", "继续人工比较"],
      multi_category_plan:["连接可信价格源", "查看官方商城", "继续人工比较"],
      restricted_or_blocked:[]
    };
    return shared[category] || [];
  }

  function disabledLines(category){
    if (category === "restricted_or_blocked") {
      return [
        "安全限制",
        "已阻断动作：付款 / 下单 / 出票 / 上传证件或银行卡",
        "当前不继续整理购买路径",
        "当前不提供购买入口",
        "当前不提供外部搜索入口",
        "当前不提供复制搜索条件",
        "当前不提供规避建议",
        "weishan 不联网、不搜索、不下单、不付款、不保存身份证、护照或银行卡"
      ];
    }
    return [];
  }

  function copyActionsForCategory(category, fields){
    if (category === "restricted_or_blocked") return [];
    const map = {
      flight:[{
        kind:"flightPlan",
        label:"复制机票搜索条件",
        text:[
          "机票搜索条件",
          fields.origin ? "出发地：" + fields.origin : "",
          fields.destination ? "目的地：" + fields.destination : "",
          fields.date ? "日期：" + fields.date : "",
          fields.sortPreference ? "排序：" + fields.sortPreference : "",
          "注意：当前不会访问真实平台，不会返回实时价格，最终价格以真实平台为准。"
        ].filter(Boolean).join("\n")
      }],
      hotel:[{
        kind:"hotelPlan",
        label:"复制酒店搜索条件",
        text:[
          "酒店搜索条件",
          fields.location ? "位置：" + fields.location : "",
          fields.date ? "入住：" + fields.date : "",
          fields.duration ? "时长：" + fields.duration : "",
          "注意：当前不会访问真实平台，不会返回真实房价，最终价格以真实平台为准。"
        ].filter(Boolean).join("\n")
      }],
      product:[{
        kind:"productPlan",
        label:"复制商品比较条件",
        text:[
          "商品比较条件",
          fields.productName ? "商品：" + fields.productName : "",
          fields.regions ? "地区：" + fields.regions : "",
          fields.criteria ? "比较维度：" + fields.criteria : "",
          "注意：当前不会访问真实平台，不会返回真实价格，最终价格以真实平台为准。"
        ].filter(Boolean).join("\n")
      }],
      local_service:[{
        kind:"localServicePlan",
        label:"复制本地服务筛选条件",
        text:[
          "本地服务筛选条件",
          fields.location ? "地点：" + fields.location : "",
          fields.serviceName ? "服务：" + fields.serviceName : "",
          fields.criteria ? "评估维度：" + fields.criteria : "",
          "注意：当前不会访问真实平台，不会返回真实报价，最终结果以人工核对为准。"
        ].filter(Boolean).join("\n")
      }],
      ticket_or_activity:[{
        kind:"ticketActivityPlan",
        label:"复制门票/活动搜索条件",
        text:[
          "门票 / 活动搜索条件",
          fields.activityName ? "活动：" + fields.activityName : "",
          fields.date ? "日期：" + fields.date : "",
          fields.ticketPreference ? "偏好：" + fields.ticketPreference : "",
          "注意：当前不会访问真实平台，不会返回真实票价，最终价格以真实平台为准。"
        ].filter(Boolean).join("\n")
      }]
    };
    return map[category] || [];
  }

  function buildSubCards(detail){
    return list(detail && detail.subPlans).map((subPlan) => ({
      title:text(subPlan.title || "分项计划"),
      identifiedConditions:list(subPlan.identifiedConditions),
      missingInfo:list(subPlan.missingInfo),
      nextStepLines:list(subPlan.safeGuidance),
      disabledLines:list(subPlan.disabled)
    }));
  }

  function inferDuration(raw){
    const textValue = text(raw);
    if (/两晚|2\s*晚/.test(textValue)) return "两晚";
    if (/三晚|3\s*晚/.test(textValue)) return "三晚";
    return "";
  }

  function buildFields(intent, detail){
    const safeIntent = intent && typeof intent === "object" ? intent : {};
    const raw = text(safeIntent.searchQueryDraft);
    const regionMatches = raw.match(/美国|日本|中国|香港|英国|欧洲|韩国/g) || [];
    const budgetMatch = raw.match(/预算\s*(\d+(?:\.\d+)?)\s*(美元|美金|USD|usd|日元|円|JPY|jpy|人民币|元)?/);
    const budgetAmount = budgetMatch && budgetMatch[1] ? budgetMatch[1] : "";
    const budgetCurrency = budgetMatch && budgetMatch[2] ? budgetMatch[2] : "";
    const destinationLabelMap = {
      US:"United States",
      JP:"Japan",
      CN:"China",
      GB:"United Kingdom",
      KR:"South Korea",
      HK:"Hong Kong"
    };
    const comparisonMarkets = Array.isArray(safeIntent.comparisonMarkets) ? safeIntent.comparisonMarkets : [];
    const comparisonMarketLabels = comparisonMarkets.map((market) => destinationLabelMap[market] || market);
    const destinationCountry = text(safeIntent.destinationCountry);
    const destinationLabel = destinationLabelMap[destinationCountry] || destinationCountry;
    const composedProductName = [text(safeIntent.brand), text(safeIntent.model)].filter(Boolean).join(" ");
    return {
      origin:text(safeIntent.origin),
      destination:text(safeIntent.destination),
      date:normalizeDate(safeIntent.date || safeIntent.dateRange),
      sortPreference:text(safeIntent.sortPreference) || "低价优先",
      location:text(safeIntent.location || safeIntent.destination),
      duration:inferDuration(raw),
      productName:text(composedProductName || safeIntent.productName || [safeIntent.brand, safeIntent.model].filter(Boolean).join(" ")),
      productBrand:text(safeIntent.brand),
      productModel:text(safeIntent.model),
      regions:comparisonMarketLabels.length ? comparisonMarketLabels.join(" / ") : unique(regionMatches).join(" / "),
      comparisonMarkets:comparisonMarketLabels,
      destinationCountry:destinationLabel,
      budgetLabel:budgetAmount ? (budgetAmount + " " + (budgetCurrency ? budgetCurrency.toUpperCase().replace("美金", "USD").replace("美元", "USD").replace("JPY", "JPY").replace("円", "JPY").replace("元", "CNY").replace("人民币", "CNY") : "")).trim() : "",
      productDescriptor:inferProductDescriptor(raw),
      criteria:categoryCriteria(safeIntent.category),
      serviceName:text(safeIntent.serviceName),
      activityName:text(safeIntent.activityName),
      ticketPreference:"官方渠道、正规票务平台、退改规则"
    };
  }

  function categoryCriteria(category){
    const map = {
      product:"官方价格、物流、税费、保修、版本差异",
      local_service:"资质、口碑、距离、报价、合同、保险",
      flight:"低价优先",
      hotel:"位置、预算、早餐、取消政策",
      ticket_or_activity:"官方渠道、正规票务平台、退改规则"
    };
    return map[category] || "";
  }

  function inferProductDescriptor(raw){
    const value = text(raw);
    if (/降噪耳机|耳机|headphone/i.test(value)) return "降噪耳机";
    if (/相机|camera|EOS|X-T\d/i.test(value)) return "相机";
    if (/手机|iPhone|Galaxy|Pixel|SM-[A-Z0-9-]+/i.test(value)) return "手机";
    if (/电脑|笔记本|MacBook|ThinkPad|ROG/i.test(value)) return "电脑";
    if (/酒店|hotel/i.test(value)) return "酒店";
    if (/机票|flight/i.test(value)) return "机票";
    return "全球采购";
  }

  function normalizeMissingInfo(category, missingInfoList, fields){
    const items = list(missingInfoList);
    if (category !== "product") {
      return items.length ? items : defaultMissingInfo(category);
    }
    const normalized = [];
    items.forEach((item) => {
      const label = text(item);
      if (!label) return;
      if (/预算/.test(label)) {
        if (!fields.budgetLabel) normalized.push("预算");
        return;
      }
      if (/收货地/.test(label)) {
        if (!fields.destinationCountry) normalized.push("收货地");
        return;
      }
      if (/颜色|容量|版本/.test(label)) {
        normalized.push("颜色");
        normalized.push("容量");
        normalized.push("版本");
        return;
      }
      if (/新旧/.test(label)) {
        normalized.push("购买偏好");
        return;
      }
      if (/保修/.test(label)) {
        normalized.push("购买偏好");
        return;
      }
      if (/发票/.test(label)) {
        normalized.push("购买偏好");
        return;
      }
      normalized.push(label);
    });
    return unique(normalized.length ? normalized : ["颜色", "容量", "版本", "购买偏好"]);
  }

  function buildGlobalProcurementUserFacingResultCard(taskLike){
    const safeTask = taskLike && typeof taskLike === "object" ? taskLike : {};
    const intent = safeTask.globalProcurementIntent || safeTask.intent || safeTask;
    const detail = safeTask.globalProcurementDetailQuality || safeTask.detailQuality || null;
    const category = text(intent.category) || "unknown_procurement";
    const fields = buildFields(intent, detail);
    const quickApi = window.WeishanGlobalProcurementQuickSummary;
    const quickSummary = quickApi && typeof quickApi.buildGlobalProcurementQuickSummary === "function"
      ? quickApi.buildGlobalProcurementQuickSummary(intent)
      : "";
    const identifiedConditions = unique(detail && detail.identifiedConditions).filter(Boolean);
    const card = {
      cardVersion:GLOBAL_PROCUREMENT_USER_FACING_RESULT_CARDS_VERSION,
      phase:"global_procurement_user_facing_result_cards",
      category,
      categoryLabel:labelForCategory(category),
      title:titleForCategory(category),
      quickSummary,
      currentStatusLine:currentStatus(category),
      identifiedConditions,
      missingInfo:normalizeMissingInfo(category, detail && detail.missingInfoList, fields),
      nextStepLines:nextStepLines(category),
      disabledLines:disabledLines(category),
      planFields:{
        productName:fields.productName,
        productBrand:fields.productBrand,
        productModel:fields.productModel,
        budgetLabel:fields.budgetLabel,
        destinationCountry:fields.destinationCountry,
        comparisonMarkets:fields.comparisonMarkets,
        compareFocus:category === "product"
          ? ["官方价格", "物流", "税费", "保修", "版本差异"]
          : category === "flight"
            ? ["官方价格", "税费", "行李", "退改规则", "平台可信度"]
            : category === "hotel"
              ? ["房价", "税费", "服务费", "取消政策", "平台可信度"]
              : []
      },
      emptyPriceSummary:{
        title:"暂未连接可信实时价格源。",
        body:"Weishan 不会生成任何虚假价格。",
        future:["官方价格", "库存", "运费", "税费", "预计到手成本", "优惠券", "历史价格", "AI 推荐", "全部经过安全校验。"],
        reasonTitle:"为什么暂时没有价格？",
        reasonBody:"目前尚未连接可信实时价格源。Weishan 不会生成任何虚假价格。接入后只展示经过安全校验的数据。"
      },
      trustSummary:{
        level:"离线采购模式",
        reason:"尚未连接官方实时价格源。",
        note:"Weishan 不会生成估算价格。"
      },
      productCard:productCardState(category, fields),
      platformCards:providerTemplates(category, fields),
      recommendationPanel:recommendationPanel(category, fields),
      shoppingTimeline:shoppingTimeline(category, fields),
      costSummary:costSummary(),
      copyActions:copyActionsForCategory(category, fields),
      subCards:category === "multi_category_plan" ? buildSubCards(detail) : [],
      actionPolicy:"restricted_or_blocked" === category ? "copy disabled / external search disabled" : "copy enabled / manual review only",
      redacted:true
    };
    if (category === "multi_category_plan" && !card.copyActions.length) {
      const copyKinds = [];
      card.subCards.forEach((subCard) => {
        if (/机票/.test(subCard.title) && !copyKinds.includes("flight")) {
          copyKinds.push("flight");
          card.copyActions.push(copyActionsForCategory("flight", fields)[0]);
        }
        if (/酒店/.test(subCard.title) && !copyKinds.includes("hotel")) {
          copyKinds.push("hotel");
          card.copyActions.push(copyActionsForCategory("hotel", fields)[0]);
        }
        if (/门票|活动/.test(subCard.title) && !copyKinds.includes("ticket_or_activity")) {
          copyKinds.push("ticket_or_activity");
          card.copyActions.push(copyActionsForCategory("ticket_or_activity", fields)[0]);
        }
        if (/商品/.test(subCard.title) && !copyKinds.includes("product")) {
          copyKinds.push("product");
          card.copyActions.push(copyActionsForCategory("product", fields)[0]);
        }
        if (/服务/.test(subCard.title) && !copyKinds.includes("local_service")) {
          copyKinds.push("local_service");
          card.copyActions.push(copyActionsForCategory("local_service", fields)[0]);
        }
      });
    }
    return card;
  }

  function buildGlobalProcurementUserFacingRules(){
    return {
      rulesVersion:GLOBAL_PROCUREMENT_USER_FACING_RESULT_CARDS_VERSION,
      status:"user-facing summary only",
      realProvider:"disabled",
      realNetwork:"disabled",
      realPrice:"disabled",
      bookingUrl:"disabled",
      payment:"disabled",
      order:"disabled",
      identityUpload:"disabled",
      redacted:true,
      categoryCardList:[
        "flight_result_card",
        "hotel_result_card",
        "product_result_card",
        "local_service_result_card",
        "ticket_activity_result_card",
        "multi_category_result_card",
        "restricted_result_card"
      ],
      restrictedCardRules:[
        "受限品类只显示阻断卡片",
        "受限品类不显示普通价格空态",
        "受限品类不显示复制搜索条件",
        "受限品类不显示外部搜索入口"
      ],
      copyActionRules:[
        "正常品类按当前类别显示复制按钮",
        "不显示无关的旅行 / 电脑复制按钮",
        "multi_category_plan 只按真实子项显示复制按钮",
        "restricted_or_blocked 不显示复制按钮"
      ],
      historyLabelRules:[
        "flight -> 机票",
        "hotel -> 酒店",
        "product -> 商品",
        "local_service -> 本地服务",
        "ticket_or_activity -> 门票/活动",
        "multi_category_plan -> 多品类采购计划",
        "restricted_or_blocked -> 受限品类 / 已阻断"
      ]
    };
  }

  function deriveHistoryTypeLabel(taskLike){
    const safeTask = taskLike && typeof taskLike === "object" ? taskLike : {};
    const intent = safeTask.globalProcurementIntent || safeTask.meta && safeTask.meta.commerceLocalIntentRoute || {};
    const category = text(intent.category)
      || (safeTask.status === "blocked" && /受限|identity upload|weapons|firearms/i.test(String(safeTask.blockedReason || safeTask.outputSummary || "")) ? "restricted_or_blocked" : "")
      || ({
        flight:"flight",
        hotel:"hotel",
        ecommerce:"product",
        localService:"local_service",
        ticketOrActivity:"ticket_or_activity",
        generalProcurement:"multi_category_plan"
      }[safeTask.category] || safeTask.category || "");
    return labelForCategory(category);
  }

  function assertGlobalProcurementUserFacingResultCardsSafe(card){
    const safeCard = card && typeof card === "object" ? card : {};
    if (safeCard.category === "restricted_or_blocked" && list(safeCard.copyActions).length) {
      throw new Error("restricted procurement cards must not expose copy actions");
    }
    const combined = JSON.stringify(safeCard);
    if (/bookingUrl|checkoutUrl|paymentUrl|orderUrl/.test(combined)) {
      throw new Error("user-facing procurement cards must not expose transaction urls");
    }
    return true;
  }

  window.WeishanGlobalProcurementUserFacingResultCards = {
    GLOBAL_PROCUREMENT_USER_FACING_RESULT_CARDS_VERSION,
    buildGlobalProcurementUserFacingResultCard,
    buildGlobalProcurementUserFacingRules,
    deriveHistoryTypeLabel,
    labelForCategory,
    assertGlobalProcurementUserFacingResultCardsSafe
  };
})();
