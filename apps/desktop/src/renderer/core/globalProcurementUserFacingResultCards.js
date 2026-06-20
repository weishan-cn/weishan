(function(){
  const GLOBAL_PROCUREMENT_USER_FACING_RESULT_CARDS_VERSION = "2.1.24";

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
      hotel:["人数", "房型", "预算", "早餐", "取消政策"],
      product:["预算", "颜色", "容量", "是否接受二手", "收货地"],
      local_service:["服务时间", "地址", "规模", "预算", "是否需要发票"],
      ticket_or_activity:["日期", "人数", "票种", "官方渠道偏好", "退改规则"]
    };
    return map[category] || [];
  }

  function currentStatus(category){
    const map = {
      flight:"仅整理搜索条件，暂无真实价格",
      hotel:"仅整理住宿筛选条件，暂无真实房价",
      product:"仅整理比较维度，暂无真实商品价格",
      local_service:"仅整理筛选条件，暂无真实服务报价",
      ticket_or_activity:"仅整理购票条件，暂无真实票价",
      multi_category_plan:"仅整理多品类采购条件，暂无真实价格结果",
      restricted_or_blocked:"该请求涉及受限或高风险品类，已停止处理"
    };
    return map[category] || "仅整理搜索条件，暂无真实结果";
  }

  function nextStepLines(category){
    const shared = {
      flight:["复制搜索条件，人工到官方渠道或可信平台核对"],
      hotel:["复制搜索条件，人工到官方渠道或可信平台核对"],
      product:["复制搜索条件，人工到官方渠道或可信平台核对"],
      local_service:["复制搜索条件，人工核对资质和评价"],
      ticket_or_activity:["复制搜索条件，人工到官方渠道或正规票务平台核对"],
      multi_category_plan:["按子项复制搜索条件，再分别到可信渠道人工核对"],
      restricted_or_blocked:[]
    };
    return shared[category] || [];
  }

  function disabledLines(category){
    if (category === "restricted_or_blocked") {
      return [
        "当前不继续整理购买路径",
        "当前不提供购买入口",
        "当前不提供外部搜索入口",
        "当前不提供复制搜索条件",
        "当前不提供规避建议",
        "weishan 不联网、不搜索、不下单、不付款、不保存身份证、护照或银行卡"
      ];
    }
    const map = {
      flight:["不返回价格", "不跳转预订", "不付款", "不下单"],
      hotel:["不返回房价", "不跳转预订", "不付款", "不下单", "不上传身份证或银行卡"],
      product:["不返回价格", "不付款", "不下单", "不保存银行卡"],
      local_service:["不代付", "不下单", "不提交身份资料"],
      ticket_or_activity:["不返回票价", "不生成跳转链接", "不付款", "不下单"],
      multi_category_plan:["不访问真实平台", "不返回真实价格", "不跳转购买或预订", "不付款", "不下单"]
    };
    return map[category] || ["不访问真实平台", "不返回真实价格", "不付款", "不下单"];
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
    return {
      origin:text(safeIntent.origin),
      destination:text(safeIntent.destination),
      date:normalizeDate(safeIntent.date || safeIntent.dateRange),
      sortPreference:text(safeIntent.sortPreference) || "低价优先",
      location:text(safeIntent.location || safeIntent.destination),
      duration:inferDuration(raw),
      productName:text(safeIntent.productName),
      regions:unique(regionMatches).join(" / "),
      criteria:categoryCriteria(safeIntent.category),
      serviceName:text(safeIntent.serviceName),
      activityName:text(safeIntent.activityName),
      ticketPreference:"官方渠道、正规票务平台、退改规则"
    };
  }

  function categoryCriteria(category){
    const map = {
      product:"正品、保修、物流、税费、退货、版本差异",
      local_service:"资质、口碑、距离、报价、合同、保险",
      flight:"低价优先",
      hotel:"位置、预算、早餐、取消政策",
      ticket_or_activity:"官方渠道、正规票务平台、退改规则"
    };
    return map[category] || "";
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
      missingInfo:list(detail && detail.missingInfoList).length ? list(detail && detail.missingInfoList) : defaultMissingInfo(category),
      nextStepLines:nextStepLines(category),
      disabledLines:disabledLines(category),
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
