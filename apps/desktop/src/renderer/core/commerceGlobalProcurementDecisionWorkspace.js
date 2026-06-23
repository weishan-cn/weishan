;(function () {
  "use strict";

  const DECISION_WORKSPACE_VERSION = "2.1.57";
  const PHASE = "global_procurement_decision_workspace";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value || "").trim();
  }

  function list(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function unique(value) {
    return Array.from(new Set(list(value).map((item) => text(item)).filter(Boolean)));
  }

  function defaultComparisonDimensions() {
    return [
      "价格 / 总到手价",
      "来源可信度",
      "更新时间",
      "结果类型",
      "bookingUrl 安全性",
      "安全边界"
    ];
  }

  function defaultCandidateSchema() {
    return [
      "providerId",
      "providerName",
      "sourceType",
      "sourceUrlHost",
      "title",
      "currency",
      "price",
      "updatedAt",
      "readonlyEvidence",
      "redacted: true"
    ];
  }

  function defaultRecommendationTemplate() {
    return [
      "平台名称",
      "价格",
      "更新时间",
      "可信度",
      "点击跳转外部平台 / 官网",
      "必要安全提示"
    ];
  }

  function defaultExecutionBoundary() {
    return [
      "不连接真实 provider",
      "不读取 API key",
      "不连接 endpoint",
      "不发起网络请求",
      "不显示真实价格",
      "不生成 bookingUrl",
      "不付款",
      "不下单",
      "不保存身份证 / 银行卡"
    ];
  }

  function defaultRiskNotice() {
    return [
      "未接入真实 provider 时只做采购决策整理，不做真实结果展示",
      "禁止把 draft 当真实结果",
      "禁止输出不真实报价或估算价格",
      "禁止展示 raw provider payload"
    ];
  }

  function defaultNextSteps() {
    return [
      "先完成 sandbox gate",
      "再完成 endpoint allowlist gate",
      "再完成 key 生命周期",
      "再完成脱敏规则",
      "再完成本机安全存储",
      "再完成 API 绑定准备状态"
    ];
  }

  function defaultLinkage() {
    return [
      "sandbox gate",
      "endpoint allowlist gate",
      "key 生命周期",
      "脱敏规则",
      "本机安全存储",
      "API 绑定准备状态"
    ];
  }

  function defaultCapabilities() {
    return {
      canShowWorkspace: true,
      canShowCurrentStatus: true,
      canShowComparisonDimensions: true,
      canShowDecisionRule: true,
      canShowCandidateSchema: true,
      canShowRecommendationTemplate: true,
      canShowExecutionBoundary: true,
      canShowRiskNotice: true,
      canShowNextSteps: true,
      canShowLinkage: true,
      canUseRealProvider: false,
      canUseNetwork: false,
      canReadApiKey: false,
      canUseEndpoint: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canStoreIdentity: false
    };
  }

  function defaultDisplay() {
    return {
      summaryTitle: "全球采购决策工作台",
      statusLine: "决策工作台：已建立",
      currentStatusLine: "当前状态：只整理采购决策，不连接真实 provider。",
      decisionRuleLine: "decisionRule：默认优先真实、可信、可验证的结果；当前仅做离线决策整理。",
      comparisonDimensionsLine: "comparisonDimensions：价格 / 总到手价、来源可信度、更新时间、结果类型、bookingUrl 安全性、安全边界。",
      candidateSchemaLine: "candidateSchema：providerId / providerName / sourceType / sourceUrlHost / title / currency / price / updatedAt / readonlyEvidence。",
      recommendationTemplateLine: "recommendationTemplate：平台名称 / 价格 / 更新时间 / 可信度 / 点击跳转外部平台 / 必要安全提示。",
      executionBoundaryLine: "executionBoundary：不连接真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不显示真实价格，不生成 bookingUrl，不付款，不下单，不保存身份证 / 银行卡。",
      riskNoticeLine: "riskNotice：禁止不真实报价，禁止 raw payload，禁止把 draft 当真实结果。",
      nextStepsLine: "nextSteps：先完成 sandbox gate，再完成 endpoint allowlist gate，再完成 key 生命周期，再完成脱敏规则，再完成本机安全存储，再完成 API 绑定准备状态。",
      linkageLine: "linkage：sandbox gate / endpoint allowlist gate / key 生命周期 / 脱敏规则 / 本机安全存储 / API 绑定准备状态。",
      redactedLine: "redacted: true"
    };
  }

  function normalizeGlobalProcurementDecisionWorkspace(workspace) {
    const raw = workspace && typeof workspace === "object" ? workspace : {};
    const display = Object.assign(defaultDisplay(), raw.display && typeof raw.display === "object" ? raw.display : {});
    const summary = raw.summary && typeof raw.summary === "object" ? raw.summary : {};
    return clone({
      decisionWorkspaceVersion: String(raw.decisionWorkspaceVersion || DECISION_WORKSPACE_VERSION),
      phase: String(raw.phase || PHASE),
      workspaceStatus: String(raw.workspaceStatus || "workspace_only"),
      gateStatus: String(raw.gateStatus || "closed"),
      mode: String(raw.mode || "offline_decision_only"),
      summary: Object.assign({
        title: display.summaryTitle || "全球采购决策工作台",
        statusLine: display.statusLine || "决策工作台：已建立",
        currentStatusLine: display.currentStatusLine || "当前状态：只整理采购决策，不连接真实 provider.",
        redacted: true
      }, summary),
      comparisonDimensions: unique(raw.comparisonDimensions).length ? unique(raw.comparisonDimensions) : defaultComparisonDimensions(),
      decisionRule: text(raw.decisionRule || "默认优先真实、可信、可验证的结果；当前仅做离线决策整理。"),
      candidateSchema: unique(raw.candidateSchema).length ? unique(raw.candidateSchema) : defaultCandidateSchema(),
      recommendationTemplate: unique(raw.recommendationTemplate).length ? unique(raw.recommendationTemplate) : defaultRecommendationTemplate(),
      executionBoundary: unique(raw.executionBoundary).length ? unique(raw.executionBoundary) : defaultExecutionBoundary(),
      riskNotice: unique(raw.riskNotice).length ? unique(raw.riskNotice) : defaultRiskNotice(),
      nextSteps: unique(raw.nextSteps).length ? unique(raw.nextSteps) : defaultNextSteps(),
      linkage: unique(raw.linkage).length ? unique(raw.linkage) : defaultLinkage(),
      auditDraft: Object.assign({
        eventType: "GLOBAL_PROCUREMENT_DECISION_WORKSPACE_DRAFT",
        decision: "offline_decision_only",
        redacted: true
      }, raw.auditDraft && typeof raw.auditDraft === "object" ? raw.auditDraft : {}),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display,
      redacted: true
    });
  }

  function buildGlobalProcurementDecisionWorkspace(workspace) {
    return normalizeGlobalProcurementDecisionWorkspace(workspace);
  }

  function summarizeGlobalProcurementDecisionWorkspace(workspace) {
    const safe = normalizeGlobalProcurementDecisionWorkspace(workspace);
    const display = safe.display || defaultDisplay();
    return clone({
      title: display.summaryTitle || "全球采购决策工作台",
      statusLine: display.statusLine || "决策工作台：已建立",
      currentStatusLine: display.currentStatusLine || "当前状态：只整理采购决策，不连接真实 provider。",
      comparisonDimensionsLine: display.comparisonDimensionsLine || "comparisonDimensions：价格 / 总到手价、来源可信度、更新时间、结果类型、bookingUrl 安全性、安全边界。",
      decisionRuleLine: display.decisionRuleLine || "decisionRule：默认优先真实、可信、可验证的结果；当前仅做离线决策整理。",
      candidateSchemaLine: display.candidateSchemaLine || "candidateSchema：providerId / providerName / sourceType / sourceUrlHost / title / currency / price / updatedAt / readonlyEvidence。",
      recommendationTemplateLine: display.recommendationTemplateLine || "recommendationTemplate：平台名称 / 价格 / 更新时间 / 可信度 / 点击跳转外部平台 / 必要安全提示。",
      executionBoundaryLine: display.executionBoundaryLine || "executionBoundary：不连接真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不显示真实价格，不生成 bookingUrl，不付款，不下单，不保存身份证 / 银行卡。",
      riskNoticeLine: display.riskNoticeLine || "riskNotice：禁止不真实报价，禁止 raw payload，禁止把 draft 当真实结果。",
      nextStepsLine: display.nextStepsLine || "nextSteps：先完成 sandbox gate，再完成 endpoint allowlist gate，再完成 key 生命周期，再完成脱敏规则，再完成本机安全存储，再完成 API 绑定准备状态。",
      linkageLine: display.linkageLine || "linkage：sandbox gate / endpoint allowlist gate / key 生命周期 / 脱敏规则 / 本机安全存储 / API 绑定准备状态。",
      redactedLine: display.redactedLine || "redacted: true",
      redacted: true
    });
  }

  function assertGlobalProcurementDecisionWorkspaceSafe(workspace) {
    const safe = normalizeGlobalProcurementDecisionWorkspace(workspace);
    const caps = safe.capabilities || {};
    if (safe.gateStatus !== "closed") throw new Error("global procurement decision workspace must stay closed");
    if (safe.workspaceStatus !== "workspace_only") throw new Error("global procurement decision workspace must stay workspace only");
    if (safe.mode !== "offline_decision_only") throw new Error("global procurement decision workspace must stay offline decision only");
    if (safe.redacted !== true) throw new Error("global procurement decision workspace must stay redacted");
    [
      "canUseRealProvider",
      "canUseNetwork",
      "canReadApiKey",
      "canUseEndpoint",
      "canReturnPrice",
      "canReturnBookingUrl",
      "canCreateOrder",
      "canPay",
      "canStoreIdentity"
    ].forEach((key) => {
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    return true;
  }

  window.WeishanGlobalProcurementDecisionWorkspace = {
    DECISION_WORKSPACE_VERSION,
    PHASE,
    normalizeGlobalProcurementDecisionWorkspace,
    buildGlobalProcurementDecisionWorkspace,
    summarizeGlobalProcurementDecisionWorkspace,
    assertGlobalProcurementDecisionWorkspaceSafe
  };
})();
