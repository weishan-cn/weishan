(function(){
  const MATRIX_VERSION = "2.0.52";
  const PHASE = "subplan_gate_matrix";
  const DEFAULT_MODE = "per_subplan_gate_matrix";

  const GATES = [
    "localLawCompliance",
    "providerOnboarding",
    "providerApproval",
    "readOnlyConnectorStub",
    "providerStubProfile",
    "secretStorage",
    "sandboxDryRun",
    "connectorGate",
    "integrationReadiness",
    "manualApprovalRunbook"
  ];

  const CONTRACT = {
    matrixVersion:MATRIX_VERSION,
    phase:PHASE,
    defaultMode:DEFAULT_MODE,
    matrixPolicy:{
      perSubPlanGateStatus:true,
      perSubPlanMissingFields:true,
      perSubPlanNextActions:true,
      noProviderAccess:true,
      noPriceDuringMatrix:true,
      noRedirectDuringMatrix:true,
      noCheckoutDuringMatrix:true
    },
    gates:GATES.slice(),
    capabilities:{
      canBuildGateMatrix:true,
      canShowMissingFields:true,
      canShowNextActions:true,
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

  const GATE_DEFAULTS = {
    localLawCompliance:"not_verified",
    providerOnboarding:"not_completed",
    providerApproval:"not_reviewed",
    readOnlyConnectorStub:"not_ready",
    providerStubProfile:"not_completed",
    secretStorage:"not_configured",
    sandboxDryRun:"not_run",
    connectorGate:"blocked",
    integrationReadiness:"not_ready",
    manualApprovalRunbook:"manual_approval_required"
  };

  const GATE_LABELS = {
    localLawCompliance:"当地法律未确认",
    providerOnboarding:"Provider Onboarding 未完成",
    providerApproval:"Provider Approval 未审查",
    readOnlyConnectorStub:"只读 Connector Stub 未准备",
    providerStubProfile:"候选 provider 档案未完成",
    secretStorage:"Secret Storage 未配置",
    sandboxDryRun:"Sandbox Dry Run 未运行",
    connectorGate:"Connector Gate 已阻断",
    integrationReadiness:"接入准备未完成",
    manualApprovalRunbook:"人工审批手册需要审批"
  };

  const CATEGORY_LABELS = {
    travel_plan:"复合旅行计划",
    product:"商品",
    ticket:"门票",
    local_service:"本地服务",
    serviceBooking:"本地服务",
    hotel:"酒店",
    flight:"机票",
    general_commerce:"全球采购"
  };

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function compact(items){
    return (Array.isArray(items) ? items : []).map((item) => String(item || "").trim()).filter(Boolean);
  }

  function unique(items){
    return compact(items).filter((item, index, arr) => arr.indexOf(item) === index);
  }

  function componentLabel(components){
    const labels = { flight:"机票", hotel:"酒店", ticket:"门票", product:"商品", local_service:"本地服务" };
    return compact(components).map((item) => labels[item] || item).join(" + ");
  }

  function safeCapabilities(){
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

  function categoryOf(subPlan){
    const type = subPlan && (subPlan.commerceType || subPlan.intentCategory) || "general_commerce";
    if (type === "serviceBooking") return "local_service";
    if (type === "multi_category_travel") return "travel_plan";
    return type;
  }

  function buildGateRowsForSubPlan(subPlan, providerHealth){
    const gates = Object.assign({}, GATE_DEFAULTS);
    if (providerHealth && providerHealth.gates) {
      for (const key of GATES) if (providerHealth.gates[key]) gates[key] = providerHealth.gates[key];
    }
    return GATES.map((key) => ({
      gate:key,
      status:gates[key],
      label:GATE_LABELS[key] || key
    }));
  }

  function gateObject(rows){
    const next = {};
    for (const row of rows || []) next[row.gate] = row.status;
    return next;
  }

  function recognizedFieldsForSubPlan(subPlan){
    const plan = subPlan || {};
    const category = categoryOf(plan);
    const fields = [];
    if (category === "travel_plan") {
      fields.push(componentLabel(plan.components));
      fields.push(plan.destination);
      fields.push(plan.timeHint);
      fields.push(plan.travelerHint);
      fields.push(plan.budgetHint);
      fields.push(plan.optimizationGoal);
    } else if (category === "product") {
      fields.push(plan.productHint);
      fields.push(plan.budgetHint);
      fields.push(plan.usageHint);
      fields.push(plan.optimizationGoal);
    } else if (category === "ticket") {
      fields.push(plan.ticketHint);
      fields.push(plan.destination);
      fields.push(plan.timeHint);
      fields.push(plan.budgetHint);
    } else if (category === "local_service") {
      fields.push(plan.serviceHint);
      fields.push(plan.destination);
      fields.push(plan.timeHint);
      fields.push(plan.budgetHint);
    } else {
      fields.push(plan.productHint || plan.ticketHint || plan.serviceHint || plan.categoryLabel);
      fields.push(plan.destination);
      fields.push(plan.timeHint);
      fields.push(plan.budgetHint);
    }
    return unique(fields);
  }

  function detectMissingFieldsForSubPlan(subPlan){
    const plan = subPlan || {};
    const category = categoryOf(plan);
    if (category === "travel_plan") {
      const missing = [];
      if (!plan.origin) missing.push("出发地");
      if (!plan.timeHint || /下个月|下周|周末|本周末/.test(plan.timeHint)) missing.push("具体出行日期");
      if (Array.isArray(plan.components) && plan.components.indexOf("hotel") >= 0) {
        missing.push("入住日期", "离店日期");
      }
      if (plan.travelerHint && /孩子|儿童|亲子/.test(plan.travelerHint)) missing.push("儿童年龄");
      if (!plan.destination) missing.push("目的地");
      if (!plan.budgetHint) missing.push("预算");
      return unique(missing);
    }
    if (category === "product") {
      const missing = [];
      if (!plan.budgetHint) missing.push("预算");
      if (!plan.productHint || /手机|华为手机|商品/.test(plan.productHint)) missing.push("型号或配置");
      if (!plan.usageHint && !/适合剪视频|剪视频/.test(plan.productHint || "")) missing.push("用途");
      if (/电脑|剪视频/.test((plan.productHint || "") + (plan.usageHint || ""))) {
        missing.push("品牌偏好", "性能要求");
      }
      missing.push("购买地区或收货地");
      missing.push("是否接受二手");
      return unique(missing);
    }
    if (category === "ticket") {
      const missing = [];
      if (!plan.destination) missing.push("城市");
      if (!plan.timeHint || /下个月|下周|周末|本周末/.test(plan.timeHint)) missing.push("日期");
      missing.push("场馆", "张数", "座位偏好");
      if (!plan.budgetHint) missing.push("预算");
      return unique(missing);
    }
    if (category === "local_service") {
      const missing = [];
      if (!plan.destination || plan.destination === "附近") missing.push("服务地点");
      if (!plan.timeHint) missing.push("预约时间");
      if (!plan.serviceHint) missing.push("服务类型细节");
      if (!plan.budgetHint) missing.push("预算");
      missing.push("是否需要上门");
      return unique(missing);
    }
    return unique(["收货地", "预算"]);
  }

  function actionForMissingField(field){
    const map = {
      出发地:"补充出发地",
      具体出行日期:"补充具体出行日期",
      入住日期:"补充入住 / 离店日期",
      离店日期:"补充入住 / 离店日期",
      儿童年龄:"确认儿童年龄",
      目的地:"确认目的地",
      品牌偏好:"补充品牌或性能要求",
      性能要求:"补充品牌或性能要求",
      购买地区或收货地:"补充收货地",
      收货地:"补充收货地",
      是否接受二手:"确认是否接受二手",
      型号或配置:"补充型号或配置",
      城市:"补充城市和日期",
      日期:"补充城市和日期",
      张数:"补充票数",
      座位偏好:"补充座位偏好",
      服务地点:"补充服务地点",
      预约时间:"补充预约时间",
      预算:"补充预算"
    };
    return map[field] || ("补充" + field);
  }

  function buildNextActionsForSubPlan(subPlan, gateRows, missingFields){
    const actions = unique((missingFields || []).map(actionForMissingField));
    if ((gateRows || []).some((row) => row.gate === "localLawCompliance" && row.status !== "verified")) actions.push("完成当地法律合规确认");
    if ((gateRows || []).some((row) => row.gate === "providerApproval" && row.status !== "approved")) actions.push("等待 provider 接入审批完成");
    return unique(actions);
  }

  function summarizeSubPlanReadiness(subPlan, gateRows, missingFields){
    return {
      status:"blocked",
      statusLabel:"已阻断",
      reason:(missingFields || []).length ? "信息未补齐，且真实 provider gate 未完成" : "真实 provider gate 未完成",
      gateSummary:(gateRows || []).map((row) => row.label).join("、")
    };
  }

  function normalizeSubPlans(splitResult){
    return Array.isArray(splitResult && splitResult.subPlans) ? splitResult.subPlans : [];
  }

  function buildSubPlanGateMatrix(splitResult, providerHealth){
    const subPlans = normalizeSubPlans(splitResult);
    const matrices = subPlans.map((plan, index) => {
      const gateRows = buildGateRowsForSubPlan(plan, providerHealth);
      const missingFields = detectMissingFieldsForSubPlan(plan);
      const nextActions = buildNextActionsForSubPlan(plan, gateRows, missingFields);
      const readiness = summarizeSubPlanReadiness(plan, gateRows, missingFields);
      return Object.assign({
        subPlanId:plan && plan.subPlanId || ("subplan-" + (index + 1)),
        title:plan && plan.title || "子计划",
        status:readiness.status,
        statusLabel:readiness.statusLabel,
        category:categoryOf(plan),
        categoryLabel:plan && plan.categoryLabel || CATEGORY_LABELS[categoryOf(plan)] || "全球采购",
        recognizedFields:recognizedFieldsForSubPlan(plan),
        missingFields,
        nextActions,
        gates:gateObject(gateRows),
        gateRows,
        gateSummary:readiness.gateSummary,
        reason:readiness.reason
      }, safeCapabilities());
    });
    return Object.assign({
      matrixVersion:MATRIX_VERSION,
      phase:PHASE,
      matrixMode:DEFAULT_MODE,
      overallStatus:"blocked",
      overallStatusLabel:"已阻断",
      subPlanCount:matrices.length,
      subPlanMatrices:matrices
    }, safeCapabilities());
  }

  function toSubPlanGateMatrixDisplayStatus(matrix){
    const safe = matrix || {};
    const rows = Array.isArray(safe.subPlanMatrices) ? safe.subPlanMatrices : [];
    return {
      title:"子计划闸门矩阵",
      subtitle:"每个子计划独立显示 gate、缺失信息和下一步动作。当前不会访问任何真实 provider。",
      overallStatusLabel:safe.overallStatus === "blocked" ? "已阻断" : "已阻断",
      subPlanCountLabel:String(safe.subPlanCount || rows.length || 0),
      providerAccessLabel:"否",
      priceLabel:"否",
      redirectLabel:"否",
      subPlans:rows.map((item) => ({
        title:item.title || "子计划",
        statusLabel:item.statusLabel || "已阻断",
        categoryLabel:item.categoryLabel || CATEGORY_LABELS[item.category] || "全球采购",
        recognizedFieldsLabel:unique(item.recognizedFields || []).join(" / ") || "待补充",
        missingFieldsLabel:unique(item.missingFields || []).join("、") || "待确认",
        nextActionsLabel:unique(item.nextActions || []).join("、") || "等待 provider 接入审批完成",
        gateStatusLabel:item.gateSummary || (Array.isArray(item.gateRows) ? item.gateRows.map((row) => row.label).join("、") : ""),
        providerAccessLabel:"否",
        priceLabel:"否",
        redirectLabel:"否"
      })),
      note:"该矩阵只用于整理子计划、缺失信息和下一步动作，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。"
    };
  }

  function getSubPlanGateMatrixContract(){
    return clone(CONTRACT);
  }

  window.WeishanCommerceSubPlanGateMatrix = {
    getSubPlanGateMatrixContract,
    buildSubPlanGateMatrix,
    buildGateRowsForSubPlan,
    detectMissingFieldsForSubPlan,
    buildNextActionsForSubPlan,
    summarizeSubPlanReadiness,
    toSubPlanGateMatrixDisplayStatus
  };
})();
