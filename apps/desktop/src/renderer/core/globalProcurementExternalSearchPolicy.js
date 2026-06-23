(function(){
  const GLOBAL_PROCUREMENT_EXTERNAL_SEARCH_POLICY_VERSION = "2.1.71";

  function buildGlobalProcurementExternalSearchPolicy(intent){
    const safeIntent = intent && typeof intent === "object" ? intent : {};
    const blocked = safeIntent.category === "restricted_or_blocked";
    return {
      policyVersion:GLOBAL_PROCUREMENT_EXTERNAL_SEARCH_POLICY_VERSION,
      phase:"global_procurement_external_search_policy",
      category:safeIntent.category || "unknown_procurement",
      title:"全球采购外部搜索入口规则",
      status:"manual external search only",
      autoClick:"disabled",
      bookingUrl:"disabled",
      realProvider:"disabled",
      realNetwork:"disabled",
      redacted:true,
      allowExternalSearch:!blocked,
      rules:[
        "外部搜索入口只能由用户手动点击",
        "外部搜索入口不是 bookingUrl",
        "外部搜索入口不代表 weishan 推荐或担保",
        "外部搜索入口不自动打开",
        "外部搜索入口不自动提交购买动作",
        "外部搜索入口不传递真实平台密钥",
        "外部搜索入口不传递证件 / 银行卡",
        "受限品类不显示外部搜索入口",
        "高风险品类不显示外部搜索入口",
        "未知合法性不显示购买入口"
      ]
    };
  }

  function assertGlobalProcurementExternalSearchPolicySafe(policy){
    if (!policy || policy.status !== "manual external search only" || policy.autoClick !== "disabled" || policy.bookingUrl !== "disabled") {
      throw new Error("global procurement external search policy must stay manual-only and booking-url-disabled");
    }
    if (policy.realProvider !== "disabled" || policy.realNetwork !== "disabled" || policy.redacted !== true) {
      throw new Error("global procurement external search policy must keep provider and network disabled");
    }
    return true;
  }

  window.WeishanGlobalProcurementExternalSearchPolicy = {
    GLOBAL_PROCUREMENT_EXTERNAL_SEARCH_POLICY_VERSION,
    buildGlobalProcurementExternalSearchPolicy,
    assertGlobalProcurementExternalSearchPolicySafe
  };
})();
