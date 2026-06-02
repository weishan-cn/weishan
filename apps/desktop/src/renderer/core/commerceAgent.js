(function(){
  const COMMERCE_PLAN_KEY = "weishan:commerceAgent:lastPlan:v1";

  function nowIso(){
    return new Date().toISOString();
  }

  function sanitizeCommerceInput(text){
    return String(text || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|cookie|card\s*number|银行卡|身份证|护照)\s*[:=：]\s*[^,\s;，。]+/gi, "$1=[redacted]")
      .replace(/\b\d{13,19}\b/g, "[redacted-card]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);
  }

  function taskId(){
    return "commerceTask-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function getCommerceCategory(text){
    const raw = String(text || "");
    if (/酒店|民宿|住宿|Hotel/i.test(raw)) return "hotel";
    if (/机票|航班|飞机票|flight/i.test(raw)) return "flight";
    if (/火车票|高铁票|动车票|train/i.test(raw)) return "train";
    if (/OpenRouter|ChatGPT|API|SaaS|模型|model|订阅|会员/i.test(raw)) return "saas";
    if (/门票|演唱会|展览|票务|ticket/i.test(raw)) return "ticket";
    if (/预约|服务|保洁|维修|咨询|service/i.test(raw)) return "service";
    if (/域名|MacBook|电脑|手机|商品|电商|买|采购|purchase|shopping/i.test(raw)) return "product";
    return "globalProcurement";
  }

  function getCommerceSearchScope(category){
    const map = {
      hotel:["酒店聚合平台", "品牌官网", "本地旅行平台", "退款政策与税费说明"],
      flight:["航司官网", "机票聚合平台", "中转组合方案", "行李与退改规则"],
      train:["官方票务平台", "车次与席别范围", "中转与联程方案", "退改规则"],
      saas:["平台官网价格页", "模型网关价格页", "社区口碑与稳定性反馈", "地区与合规可用性说明"],
      ticket:["官方票务渠道", "授权代理平台", "二级市场风险提示", "退票与实名规则"],
      service:["服务平台", "商家官网", "评价与履约记录", "售后与取消政策"],
      product:["品牌官网", "主流电商平台", "跨境采购渠道", "保修与退换货政策"],
      globalProcurement:["全球采购平台", "品牌与官方渠道", "价格比较渠道", "风险与售后信息"]
    };
    return map[category] || map.globalProcurement;
  }

  function getCommerceDecisionCriteria(category){
    const base = ["价格", "评分", "信誉", "售后", "退改政策", "时效", "地区限制", "风险", "隐性费用"];
    if (category === "flight" || category === "train") return base.concat(["总耗时", "中转成本", "行李/席别规则"]);
    if (category === "hotel") return base.concat(["位置", "清洁度", "取消政策"]);
    if (category === "saas") return base.concat(["计费单位", "上下文/额度", "稳定性", "合规策略"]);
    return base;
  }

  function classifyCommerceIntent(text){
    const raw = String(text || "");
    const category = getCommerceCategory(raw);
    const purchaseWords = /全球采购|采购代理|自动采购|比价|价格比较|平台比较|最便宜方案|性价比最高|帮我买|帮我订|帮我比较|我想买|订下周|直接下单|下单|付款|采购|买|订|找最便宜|最便宜.*(?:机票|酒店|域名|方案|API|平台|商品)|OpenRouter.*价格|模型平台.*价格/i;
    const assistedSearchPurchase = /帮我找.*(?:机票|酒店|火车票|高铁票|航班|商品|MacBook|域名|ChatGPT API|API 方案|模型平台|采购渠道|最便宜|性价比)/i.test(raw);
    const directOrderRisk = /直接下单|下单并付款|提交订单|付款/i.test(raw);
    const categoryWords = /酒店|机票|火车票|高铁票|航班|电商|商品|SaaS|AI 模型|模型平台|API|门票|票务|服务预约|域名|MacBook|ChatGPT API|采购渠道/i;
    const isCommerceIntent = directOrderRisk || ((purchaseWords.test(raw) || assistedSearchPurchase) && (categoryWords.test(raw) || category !== "globalProcurement" || /全球采购|采购代理|自动采购|比价|平台比较|价格比较/i.test(raw)));
    return {
      isCommerceIntent,
      module:"commerceAgent",
      action:"commerceAgent.plan",
      category,
      realExecution:false,
      requiresUserConfirmation:true
    };
  }

  function normalizedFields(text, category){
    return {
      need:sanitizeCommerceInput(text),
      category,
      budget:"",
      region:"",
      timing:"",
      constraints:"同等条件下优先价格最低，同时保留风险与售后判断。"
    };
  }

  function createCommercePlan(text){
    const clean = sanitizeCommerceInput(text);
    const category = getCommerceCategory(clean);
    const searchScope = getCommerceSearchScope(category);
    const decisionCriteria = getCommerceDecisionCriteria(category);
    const highRisk = /直接下单|付款|支付|提交订单/i.test(clean);
    return {
      schemaVersion:"weishan.commerceAgent.plan.v1",
      taskId:taskId(),
      inputSummary:clean,
      category,
      intent:"search_compare_recommend_before_confirm",
      searchScope,
      normalizedFields:normalizedFields(clean, category),
      decisionCriteria,
      recommendationFormat:[
        "推荐方案名称",
        "预估价格与隐性费用",
        "优势与风险",
        "退改/售后条件",
        "执行前需要用户确认的事项"
      ],
      executionBoundary:[
        "当前只生成搜索与推荐计划。",
        "不真实访问外部网站。",
        "不下单、不付款、不提交订单。",
        "不保存敏感身份或支付信息。",
        "最终执行必须由用户确认。"
      ],
      riskLevel:highRisk ? "high" : "medium",
      realExecution:false,
      requiresUserConfirmation:true,
      createdAt:nowIso()
    };
  }

  function createCommerceHistoryPayload(action, payload){
    const plan = payload || {};
    return {
      schemaVersion:"weishan.task.v1",
      module:"commerceAgent",
      action:String(action || "commerceAgent.planCreated").replace(/^commerceAgent\./, ""),
      category:String(plan.category || ""),
      inputSummary:sanitizeCommerceInput(plan.inputSummary || ""),
      outputSummary:sanitizeCommerceInput(plan.outputSummary || "已生成全球采购搜索与推荐计划。"),
      searchScopeSummary:(Array.isArray(plan.searchScope) ? plan.searchScope : []).join(" / ").slice(0, 220),
      decisionCriteriaSummary:(Array.isArray(plan.decisionCriteria) ? plan.decisionCriteria : []).join(" / ").slice(0, 220),
      realExecution:false,
      requiresUserConfirmation:true,
      createdAt:plan.createdAt || nowIso()
    };
  }

  function storage(){
    try { return window.localStorage || null; } catch (_) { return null; }
  }

  function saveCommercePlan(plan){
    const s = storage();
    if (!s || !plan) return plan;
    try { s.setItem(COMMERCE_PLAN_KEY, JSON.stringify(plan)); } catch (_) {}
    return plan;
  }

  function getCommercePlan(){
    const s = storage();
    if (!s) return null;
    try {
      const raw = s.getItem(COMMERCE_PLAN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function clearCommercePlan(){
    const s = storage();
    try { if (s) s.removeItem(COMMERCE_PLAN_KEY); } catch (_) {}
  }

  window.WeishanCommerceAgent = {
    COMMERCE_PLAN_KEY,
    classifyCommerceIntent,
    createCommercePlan,
    createCommerceHistoryPayload,
    sanitizeCommerceInput,
    getCommerceCategory,
    getCommerceDecisionCriteria,
    getCommerceSearchScope,
    saveCommercePlan,
    getCommercePlan,
    clearCommercePlan
  };
})();
