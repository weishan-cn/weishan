(function(){
  const GLOBAL_PROCUREMENT_SAFE_NEXT_STEP_GUIDANCE_VERSION = "4.2.4";

  function unique(list){
    return Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));
  }

  function baseGuidance(){
    return [
      "复制搜索条件",
      "人工打开官方渠道",
      "人工比较平台政策",
      "核对退改规则",
      "核对税费和附加费",
      "核对商家资质",
      "核对评价和售后",
      "核对是否需要实名制",
      "不给未知平台提交证件或银行卡",
      "不让 weishan 代付款",
      "不让 weishan 下单",
      "不让 weishan 保存证件或银行卡"
    ];
  }

  function categoryGuidance(category){
    const map = {
      flight:[
        "人工比较航空公司官网 / Google Flights / Trip.com / 携程",
        "确认退改签、行李、税费"
      ],
      hotel:[
        "人工比较官方酒店 / Booking / Google Hotels / Trip.com",
        "确认税费、取消政策、押金"
      ],
      product:[
        "人工比较官方渠道、授权店、Amazon、eBay、京东、淘宝等候选入口",
        "确认保修、税费、物流和版本差异"
      ],
      local_service:[
        "人工查看地图、本地服务平台、资质证照、评价",
        "确认合同、保险、售后"
      ],
      ticket_or_activity:[
        "优先人工查看官方渠道和正规票务平台",
        "确认退改规则、实名制要求、入园凭证"
      ],
      multi_category_plan:[
        "按优先级逐项人工确认机票、酒店、当地交通和门票",
        "先确认关键日期和预算，再拆分执行"
      ],
      restricted_or_blocked:[
        "当前不继续整理购买路径",
        "当前不提供购买入口",
        "当前不提供外部搜索入口",
        "当前不提供复制搜索条件",
        "当前不提供规避建议"
      ]
    };
    if (category === "restricted_or_blocked") return unique(map.restricted_or_blocked || []);
    return unique((map[category] || []).concat(baseGuidance()));
  }

  function buildGlobalProcurementSafeNextStepGuidance(intent){
    const safeIntent = intent && typeof intent === "object" ? intent : {};
    const category = safeIntent.category || "unknown_procurement";
    return {
      guidanceVersion:GLOBAL_PROCUREMENT_SAFE_NEXT_STEP_GUIDANCE_VERSION,
      phase:"global_procurement_safe_next_step_guidance",
      category,
      title:"全球采购安全下一步建议",
      status:"safe guidance only",
      mode:"no transaction",
      realProvider:"disabled",
      realNetwork:"disabled",
      payment:"disabled",
      order:"disabled",
      redacted:true,
      items:categoryGuidance(category)
    };
  }

  function assertGlobalProcurementSafeNextStepGuidanceSafe(guidance){
    if (!guidance || guidance.status !== "safe guidance only" || guidance.mode !== "no transaction") {
      throw new Error("global procurement safe next-step guidance must stay safe-guidance-only");
    }
    if (guidance.realProvider !== "disabled" || guidance.realNetwork !== "disabled" || guidance.payment !== "disabled" || guidance.order !== "disabled" || guidance.redacted !== true) {
      throw new Error("global procurement safe next-step guidance must keep provider, network, payment, and order disabled");
    }
    return true;
  }

  window.WeishanGlobalProcurementSafeNextStepGuidance = {
    GLOBAL_PROCUREMENT_SAFE_NEXT_STEP_GUIDANCE_VERSION,
    buildGlobalProcurementSafeNextStepGuidance,
    assertGlobalProcurementSafeNextStepGuidanceSafe
  };
})();
