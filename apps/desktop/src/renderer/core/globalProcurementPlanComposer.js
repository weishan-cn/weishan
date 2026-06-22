(function(){
  const GLOBAL_PROCUREMENT_PLAN_COMPOSER_VERSION = "2.1.45";

  function cloneList(list){
    return Array.isArray(list) ? list.slice() : [];
  }

  function labelForCategory(category){
    const map = {
      flight:"机票",
      hotel:"酒店",
      product:"商品",
      local_service:"本地服务",
      ticket_or_activity:"门票 / 活动",
      multi_category_plan:"多品类采购计划",
      restricted_or_blocked:"受限品类",
      unknown_procurement:"全球采购"
    };
    return map[category] || map.unknown_procurement;
  }

  function buildExternalSearchEntries(intent){
    if (!intent || intent.category === "restricted_or_blocked") return [];
    const query = intent.searchQueryDraft || "";
    return [
      { label:"打开全网搜索", route:"trusted_web_search", query, userClickRequired:true },
      intent.category === "flight" ? { label:"打开 Google Flights 搜索", route:"google_flights", query, userClickRequired:true } : null,
      intent.category === "flight" ? { label:"打开 Trip.com / 携程搜索", route:"trip_com", query, userClickRequired:true } : null
    ].filter(Boolean);
  }

  function composeGlobalProcurementPlan(intent){
    const safeIntent = intent && typeof intent === "object" ? intent : {};
    const category = safeIntent.category || "unknown_procurement";
    const blocked = category === "restricted_or_blocked";
    const detailApi = window.WeishanGlobalProcurementDetailQualityComposer;
    const detailQuality = detailApi && typeof detailApi.composeGlobalProcurementDetailQuality === "function"
      ? detailApi.composeGlobalProcurementDetailQuality(safeIntent)
      : null;
    const categoryList = cloneList(safeIntent.categoryList || [category]);
    const missingInfoList = cloneList(safeIntent.missingInfoList);
    const planItems = categoryList.map((item) => ({
      category:item,
      categoryLabel:labelForCategory(item),
      currentStatus:blocked ? "blocked_by_local_policy" : "offline_planning_only",
      realProvider:"disabled",
      realNetwork:"disabled",
      realPrice:"disabled",
      availability:"disabled",
      bookingUrl:"disabled",
      payment:"disabled",
      order:"disabled",
      identityUpload:"disabled",
      nextStep:blocked ? "停止采购请求，不提供绕过路径" : "整理搜索条件，等待可信只读价格源接入"
    }));
    return {
      composerVersion:GLOBAL_PROCUREMENT_PLAN_COMPOSER_VERSION,
      phase:"global_procurement_plan_composer",
      title:"全球采购计划",
      status:blocked ? "blocked" : "offline_planning_only",
      currentStatus:blocked ? "该请求涉及受限或高风险品类，已阻断。" : "当前为离线采购规划，只整理条件，不接真实平台。",
      category,
      categoryLabel:labelForCategory(category),
      categoryList,
      querySummary:{
        origin:safeIntent.origin || "",
        destination:safeIntent.destination || "",
        date:safeIntent.date || "",
        dateRange:safeIntent.dateRange || "",
        location:safeIntent.location || "",
        activityName:safeIntent.activityName || "",
        productName:safeIntent.productName || "",
        serviceName:safeIntent.serviceName || "",
        sortPreference:safeIntent.sortPreference || "",
        budgetPreference:safeIntent.budgetPreference || ""
      },
      missingInfoList,
      externalSearchEntries:buildExternalSearchEntries(safeIntent),
      safetyRestrictions:[
        "不接真实平台",
        "不读取真实平台密钥",
        "不连接真实平台接口",
        "不发起真实网络请求",
        "不显示真实价格",
        "不显示任何非真实价格",
        "不生成 bookingUrl",
        "不预订 / 不付款 / 不下单",
        "不提交证件 / 银行卡"
      ],
      planItems,
      detailQuality,
      blockedReason:safeIntent.blockedReason || "",
      redacted:true
    };
  }

  function assertGlobalProcurementPlanSafe(plan){
    const entries = plan && Array.isArray(plan.externalSearchEntries) ? plan.externalSearchEntries : [];
    const items = plan && Array.isArray(plan.planItems) ? plan.planItems : [];
    if (plan && plan.category === "restricted_or_blocked" && entries.length > 0) {
      throw new Error("restricted global procurement plan must not expose external search entries");
    }
    const unsafe = items.find((item) => item.realNetwork !== "disabled" || item.realPrice !== "disabled" || item.bookingUrl !== "disabled" || item.payment !== "disabled" || item.order !== "disabled");
    if (unsafe) throw new Error("global procurement plan must keep provider capabilities disabled");
    return true;
  }

  window.WeishanGlobalProcurementPlanComposer = {
    GLOBAL_PROCUREMENT_PLAN_COMPOSER_VERSION,
    composeGlobalProcurementPlan,
    assertGlobalProcurementPlanSafe
  };
})();
