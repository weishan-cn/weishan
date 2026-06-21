(function(){
  const GLOBAL_PROCUREMENT_DETAIL_QUALITY_COMPOSER_VERSION = "2.1.42";

  function text(value){
    return String(value || "").trim();
  }

  function unique(list){
    return Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));
  }

  function toCnNights(raw){
    const direct = String(raw || "").match(/(\d+)\s*晚/);
    if (direct) return Number(direct[1]) + " 晚";
    if (/一晚/.test(String(raw || ""))) return "1 晚";
    if (/两晚/.test(String(raw || ""))) return "2 晚";
    if (/三晚/.test(String(raw || ""))) return "3 晚";
    return "";
  }

  function detectRegions(raw){
    return unique((String(raw || "").match(/美国|日本|中国|香港|英国|欧洲|韩国/g) || []));
  }

  function deriveArea(raw){
    const match = String(raw || "").match(/([\u4e00-\u9fa5A-Za-z0-9]{2,20}(?:春熙路|天府广场|迪士尼|附近))/);
    return match ? text(match[1]) : "";
  }

  function detectCity(raw){
    const match = String(raw || "").match(/(上海|成都|北京|广州|深圳|杭州|东京|大阪|香港|重庆)/);
    return match ? text(match[1]) : "";
  }

  function categoryTitle(category){
    const map = {
      flight:"机票搜索计划",
      hotel:"酒店筛选计划",
      product:"商品比较计划",
      local_service:"本地服务筛选计划",
      ticket_or_activity:"门票 / 活动购买计划",
      multi_category_plan:"多品类采购计划",
      restricted_or_blocked:"受限品类采购请求"
    };
    return map[category] || "全球采购计划";
  }

  function emptyResultLine(category){
    const map = {
      flight:"暂无真实价格结果",
      hotel:"暂无真实房价结果",
      product:"暂无真实商品价格结果",
      local_service:"暂无真实服务报价",
      ticket_or_activity:"暂无真实票价结果",
      multi_category_plan:"暂无真实价格结果",
      restricted_or_blocked:"当前不提供购买入口"
    };
    return map[category] || "暂无真实价格结果";
  }

  function safetyLines(category){
    const base = [
      "不输入、保存或读取真实平台密钥",
      "不连接真实平台接口",
      "不测试真实网络访问",
      "不读取真实平台返回结果",
      "不显示真实价格",
      "不显示虚构价格或非真实报价",
      "不显示平台跳转链接",
      "不预订 / 不付款 / 不下单"
    ];
    if (category === "flight") return base.concat(["不保存证件"]);
    if (category === "hotel") return base.concat(["不向平台提交证件或银行卡"]);
    if (category === "product") return base.concat(["不提交银行卡或证件"]);
    if (category === "local_service") return base.concat(["不代付、不提交身份资料"]);
    if (category === "ticket_or_activity") return base.concat(["不生成平台跳转链接"]);
    if (category === "restricted_or_blocked") return [
      "当前不提供购买入口",
      "当前不提供外部搜索入口",
      "当前不提供规避建议",
      "不联网、不下单、不付款"
    ];
    return base;
  }

  function buildSubPlans(intent){
    const safeIntent = intent && typeof intent === "object" ? intent : {};
    const raw = text(safeIntent.searchQueryDraft);
    const date = text(safeIntent.date || safeIntent.dateRange);
    const routeOrigin = text(safeIntent.origin);
    const routeDestination = text(safeIntent.destination);
    const plans = [];
    if (/机票|flight|航班/.test(raw)) {
      plans.push({
        title:"机票",
        identifiedConditions:unique([
          routeOrigin ? "出发地：" + routeOrigin : "",
          routeDestination ? "目的地：" + routeDestination : "",
          date ? "出发日期：" + date : "",
          text(safeIntent.sortPreference) ? "排序：" + text(safeIntent.sortPreference) : ""
        ]),
        missingInfo:["人数", "舱位", "是否直飞", "是否托运行李", "时间偏好"],
        safeGuidance:["人工比较航空公司官网 / Google Flights / Trip.com / 携程", "确认退改签、行李、税费"],
        disabled:["真实价格：未开放", "bookingUrl：未开放", "付款 / 下单：禁止"]
      });
    }
    if (/酒店|住宿|民宿|住一晚|住两晚|住三晚|入住|附近住|订房|找房间|找酒店|hotel/.test(raw)) {
      plans.push({
        title:"酒店",
        identifiedConditions:unique([
          text(safeIntent.location) ? "城市 / 区域：" + text(safeIntent.location) : "",
          date ? "入住日期：" + date : "",
          toCnNights(raw) ? "住宿晚数：" + toCnNights(raw) : ""
        ]),
        missingInfo:["人数", "房型", "预算", "是否需要早餐", "是否需要停车", "是否接受预付"],
        safeGuidance:["人工比较官方酒店 / Booking / Google Hotels / Trip.com", "确认税费、取消政策、押金"],
        disabled:["真实房价：未开放", "bookingUrl：未开放", "付款 / 下单：禁止"]
      });
    }
    if (/当地交通/.test(raw)) {
      plans.push({
        title:"当地交通",
        identifiedConditions:unique([
          routeDestination ? "目的地：" + routeDestination : "",
          date ? "出行日期：" + date : ""
        ]),
        missingInfo:["交通方式偏好", "乘车人数", "预算", "是否需要儿童座椅", "是否接受换乘"],
        safeGuidance:["人工查看地图、官方交通渠道和正规平台", "确认班次、票种、换乘和实名要求"],
        disabled:["真实价格：未开放", "bookingUrl：未开放", "付款 / 下单：禁止"]
      });
    }
    if (/门票|迪士尼|演唱会|ticket|activity/.test(raw)) {
      plans.push({
        title:"门票 / 活动",
        identifiedConditions:unique([
          text(safeIntent.activityName) ? "活动 / 景点：" + text(safeIntent.activityName) : "",
          text(safeIntent.location) ? "城市 / 地点：" + text(safeIntent.location) : "",
          date ? "日期：" + date : ""
        ]),
        missingInfo:["日期", "人数", "票种", "官方渠道偏好", "退改规则"],
        safeGuidance:["优先人工查看官方渠道和正规票务平台", "确认退改规则、实名制要求、入园凭证"],
        disabled:["真实票价：未开放", "bookingUrl：未开放", "付款 / 下单：禁止"]
      });
    }
    if (/商品|iPhone|电脑|手机|product|MacBook/.test(raw)) {
      plans.push({
        title:"商品",
        identifiedConditions:unique([
          text(safeIntent.productName) ? "商品名称：" + text(safeIntent.productName) : "",
          detectRegions(raw).length ? "比较地区：" + detectRegions(raw).join(" / ") : ""
        ]),
        missingInfo:["预算", "颜色 / 容量 / 版本", "是否接受二手", "是否需要发票", "收货地"],
        safeGuidance:["人工比较官方渠道、授权店、Amazon、eBay、京东、淘宝等候选入口", "确认保修、税费、物流和版本差异"],
        disabled:["真实商品价格：未开放", "bookingUrl：未开放", "付款 / 下单：禁止"]
      });
    }
    return plans;
  }

  function composeDetail(intent){
    const safeIntent = intent && typeof intent === "object" ? intent : {};
    const category = safeIntent.category || "unknown_procurement";
    const raw = text(safeIntent.searchQueryDraft);
    const checklistApi = window.WeishanGlobalProcurementMissingInfoChecklist;
    const guidanceApi = window.WeishanGlobalProcurementSafeNextStepGuidance;
    const policyApi = window.WeishanGlobalProcurementExternalSearchPolicy;
    const checklist = checklistApi && checklistApi.buildGlobalProcurementMissingInfoChecklist ? checklistApi.buildGlobalProcurementMissingInfoChecklist(safeIntent) : { items:[] };
    const guidance = guidanceApi && guidanceApi.buildGlobalProcurementSafeNextStepGuidance ? guidanceApi.buildGlobalProcurementSafeNextStepGuidance(safeIntent) : { items:[] };
    const policy = policyApi && policyApi.buildGlobalProcurementExternalSearchPolicy ? policyApi.buildGlobalProcurementExternalSearchPolicy(safeIntent) : { allowExternalSearch:true, rules:[] };
    const identified = [];
    let demandSummary = raw || "等待用户补充采购条件";
    if (category === "flight") {
      identified.push(
        text(safeIntent.origin) ? "出发地：" + text(safeIntent.origin) : "",
        text(safeIntent.destination) ? "目的地：" + text(safeIntent.destination) : "",
        text(safeIntent.date) ? "出发日期：" + text(safeIntent.date) : "",
        text(safeIntent.sortPreference) ? "排序：" + text(safeIntent.sortPreference) : ""
      );
      demandSummary = "围绕机票条件做离线采购规划，先整理路线、日期和低价偏好，再由用户人工去可信渠道确认。";
    } else if (category === "hotel") {
      const area = deriveArea(raw);
      const city = text(safeIntent.destination || safeIntent.location) || detectCity(raw);
      identified.push(
        city ? "城市 / 区域：" + city : "",
        area ? "位置偏好：" + area : "",
        text(safeIntent.date || safeIntent.dateRange) ? "入住日期：" + text(safeIntent.date || safeIntent.dateRange) : "",
        toCnNights(raw) ? "住宿晚数：" + toCnNights(raw) : ""
      );
      demandSummary = "围绕酒店条件做离线采购规划，先明确位置、晚数和偏好，再由用户人工比较可信渠道。";
    } else if (category === "product") {
      const regions = detectRegions(raw);
      identified.push(
        text(safeIntent.productName) ? "商品名称：" + text(safeIntent.productName) : "",
        regions.length ? "比较地区：" + regions.join(" / ") : "",
        "比较维度：正品、保修、物流、税费、退货、版本差异"
      );
      demandSummary = "围绕商品跨区域购买条件做离线采购规划，只整理比较维度和缺失信息。";
    } else if (category === "local_service") {
      const city = text(safeIntent.location || safeIntent.destination) || detectCity(raw);
      identified.push(
        city ? "地点：" + city : "",
        text(safeIntent.serviceName) ? "服务类型：" + text(safeIntent.serviceName) : "",
        "评估维度：资质、口碑、距离、报价、合同、保险、售后"
      );
      demandSummary = "围绕本地服务筛选条件做离线规划，帮助用户人工核对资质、评价和合同风险。";
    } else if (category === "ticket_or_activity") {
      identified.push(
        text(safeIntent.activityName) ? "活动 / 景点名称：" + text(safeIntent.activityName) : "",
        text(safeIntent.location || safeIntent.destination) ? "城市 / 地点：" + text(safeIntent.location || safeIntent.destination) : "",
        text(safeIntent.date) ? "日期：" + text(safeIntent.date) : "日期：待补充",
        "偏好：官方渠道、可退改、正规平台、儿童/老人票、入园时间"
      );
      demandSummary = "围绕门票 / 活动做离线采购规划，只整理条件，不接真实票务平台。";
    } else if (category === "multi_category_plan") {
      identified.push(
        text(safeIntent.origin) ? "出发地：" + text(safeIntent.origin) : "",
        text(safeIntent.destination) ? "目的地：" + text(safeIntent.destination) : "",
        text(safeIntent.date) ? "关键日期：" + text(safeIntent.date) : "",
        "包含机票 / 酒店 / 当地交通 / 门票等分项"
      );
      demandSummary = "围绕多品类旅行 / 采购需求做离线总规划，把每一项要补充的信息和人工核对步骤放在同一屏。";
    } else if (category === "restricted_or_blocked") {
      identified.push("该请求涉及受限或高风险品类");
      if (text(safeIntent.blockedReason)) identified.push("阻断原因：" + text(safeIntent.blockedReason));
      demandSummary = "该请求触发受限品类或高风险行为规则，当前只给出阻断说明和安全边界。";
    }

    return {
      detailQualityVersion:GLOBAL_PROCUREMENT_DETAIL_QUALITY_COMPOSER_VERSION,
      phase:"global_procurement_detail_quality_composer",
      category,
      title:categoryTitle(category),
      emptyResultLine:emptyResultLine(category),
      demandSummary,
      currentStatusLine:category === "restricted_or_blocked"
        ? "该请求涉及受限或高风险品类，已停止处理。"
        : "当前为离线采购规划 / 只整理条件 / 不接真实平台。",
      categoryLine:"采购类型 / 类别：" + categoryTitle(category).replace("结果", "").replace("采购请求", ""),
      identifiedConditions:unique(identified),
      missingInfoList:unique(checklist.items || []),
      safeGuidanceList:unique(guidance.items || []),
      externalSearchPolicyLines:unique([
        policy.allowExternalSearch ? "外部搜索入口为人工入口，必须用户手动点击" : "当前不显示外部搜索入口",
        "外部搜索入口不是平台跳转链接",
        "不自动点击、不自动打开、不自动提交购买动作"
      ]),
      safetyBoundaryList:safetyLines(category),
      subPlans:category === "multi_category_plan" ? buildSubPlans(safeIntent) : [],
      redacted:true
    };
  }

  function assertGlobalProcurementDetailQualitySafe(detail){
    if (!detail || detail.redacted !== true) throw new Error("global procurement detail quality must stay redacted");
    const allText = JSON.stringify(detail);
    if (/bookingUrl[^"]*https?:/i.test(allText) || /checkoutUrl|paymentUrl|orderUrl/.test(allText)) {
      throw new Error("global procurement detail quality must not expose real booking or transaction urls");
    }
    return true;
  }

  window.WeishanGlobalProcurementDetailQualityComposer = {
    GLOBAL_PROCUREMENT_DETAIL_QUALITY_COMPOSER_VERSION,
    composeGlobalProcurementDetailQuality:composeDetail,
    assertGlobalProcurementDetailQualitySafe
  };
})();
