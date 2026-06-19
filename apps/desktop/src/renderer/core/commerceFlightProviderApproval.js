;(function () {
  "use strict";

  const APPROVAL_VERSION = "2.1.22";
  const PHASE = "flight_provider_approval";
  const DEFAULT_STATUS = "not_reviewed";
  const DEFAULT_ALLOWED_STAGE = "candidate_only";
  const DEFAULT_MANUAL_REVIEW_STATUS = "not_reviewed";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canUseApiKey: false,
      canUseNetworkApi: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canOpenBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canStoreIdentity: false,
      canStorePassport: false,
      canStoreBankCard: false
    };
  }

  function defaultSafety() {
    return {
      noRealEndpoint: true,
      noRealApiKey: true,
      noNetworkSearch: true,
      noRealResults: true,
      noRealPrice: true,
      noFakeDemoMockPrice: true,
      noBookingUrl: true,
      noRedirect: true,
      noCheckout: true,
      noPayment: true,
      noOrderSubmit: true,
      noIdentityStorage: true,
      noPassportStorage: true,
      noBankCardStorage: true
    };
  }

  function defaultChecklist() {
    return {
      platformIdentityReviewed: false,
      officialDomainAllowlistReviewed: false,
      providerTermsReviewed: false,
      localLawReviewed: false,
      apiDocsReviewed: false,
      apiKeyStorageReviewed: false,
      priceFieldReviewed: false,
      taxFeeBaggageFieldReviewed: false,
      bookingUrlReviewed: false,
      sandboxDryRunCompleted: false,
      finalHumanApproval: false
    };
  }

  function defaultAllowlistDomains() {
    return [
      "google.com",
      "google.com/travel/flights",
      "trip.com",
      "ctrip.com",
      "skyscanner.com",
      "kayak.com",
      "expedia.com",
      "booking.com",
      "airline-official-website.placeholder"
    ];
  }

  function defaultBlockedRules() {
    return [
      "短链接",
      "非 HTTPS",
      "拼写相似的仿冒域名",
      "AI 生成域名",
      "私聊付款",
      "先转账出票",
      "低价异常",
      "无主体信息",
      "和搜索意图无关",
      "成人 / 赌博 / 武器 / 毒品等高风险域名"
    ];
  }

  function defaultChecklistGroups() {
    return [
      {
        title: "候选与白名单",
        items: [
          ["候选平台", "已建档"],
          ["allowlist", "已要求"],
          ["未知域名", "阻断"],
          ["短链接", "阻断"],
          ["可疑域名", "阻断"]
        ]
      },
      {
        title: "平台审批",
        items: [
          ["平台身份审查", "未开始"],
          ["Provider 条款审查", "未开始"],
          ["人工审核", "未完成"],
          ["最终人工批准", "未完成"]
        ]
      },
      {
        title: "接口与价格",
        items: [
          ["API 文档审查", "未开始"],
          ["API key 存储审查", "未开始"],
          ["Endpoint 审查", "未开始"],
          ["价格字段审查", "未开始"],
          ["bookingUrl 审查", "未开始"]
        ]
      },
      {
        title: "安全与执行",
        items: [
          ["当地法律审查", "未开始"],
          ["税费 / 退改签字段审查", "未开始"],
          ["Sandbox Dry Run", "未开始"],
          ["只读价格源", "未启用"],
          ["bookingUrl", "未启用"],
          ["付款 / 下单", "不支持"]
        ]
      }
    ];
  }

  function normalizeFlightProviderApprovalStatus(status) {
    const raw = status && typeof status === "object" ? status : {};
    const checklist = Object.assign(defaultChecklist(), raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {});
    const allowlistDomains = Array.isArray(raw.allowlistDomains) && raw.allowlistDomains.length ? raw.allowlistDomains.slice() : defaultAllowlistDomains();
    const blockedRules = Array.isArray(raw.blockedRules) && raw.blockedRules.length ? raw.blockedRules.slice() : defaultBlockedRules();
    return clone({
      approvalVersion: String(raw.approvalVersion || APPROVAL_VERSION),
      phase: String(raw.phase || PHASE),
      providerCategory: String(raw.providerCategory || "flight"),
      providerId: String(raw.providerId || "flight-provider-disabled"),
      providerName: String(raw.providerName || "机票候选平台"),
      overallStatus: String(raw.overallStatus || DEFAULT_ALLOWED_STAGE),
      approvalStatus: String(raw.approvalStatus || DEFAULT_STATUS),
      currentAllowedStage: String(raw.currentAllowedStage || DEFAULT_ALLOWED_STAGE),
      trustStatus: String(raw.trustStatus || "candidate_only"),
      manualReviewStatus: String(raw.manualReviewStatus || DEFAULT_MANUAL_REVIEW_STATUS),
      allowlistDomains,
      blockedRules,
      checklist,
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety: Object.assign(defaultSafety(), raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      display: Object.assign({
        summaryTitle: "机票 Provider 接入审批",
        currentStatusLine: "当前状态：候选平台已建档，尚未批准接入只读价格源。",
        approvalStatusLine: "审批状态：未审查",
        readonlyStubPermissionLine: "只读适配器开发许可：未授予",
        readonlyStubAdapterLine: "已建立",
        sandboxDryRunLine: "Sandbox Dry Run：外壳已建立，尚未批准真实连接",
        readonlyStubPermissionStageLine: "当前阶段：需要人工批准",
        readonlyStubPermissionNextStepLine: "下一步：完成 provider 条款、API 文档、域名 allowlist、API key 存储方案和请求 / 响应结构审查",
        readOnlyPriceSourceLine: "只读价格源：未启用",
        realNetworkConnectionLine: "真实网络连接：未启用",
        realPriceReturnLine: "真实价格返回：未启用",
        bookingUrlStatusLine: "bookingUrl：未启用",
        tradeStatusLine: "付款 / 下单：不支持",
        candidatePlatformsLine: "候选平台：Google Flights / Trip.com / 携程 / Skyscanner / Kayak / Expedia",
        allowlistTitle: "默认允许域名白名单",
        blockedRulesTitle: "默认阻断规则",
        allowlistRequirementLine: "需要 allowlist",
        blockedRulesSummaryLine: "禁止未知域名 / 短链接 / 可疑域名",
        aiRiskLine: "AI 不能生成可疑 provider 域名",
        humanApprovalLine: "人工审核后才允许进入 provider approval",
        notesLine: "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
        checklistGroups: defaultChecklistGroups()
      }, raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function getFlightProviderApprovalStatus(status) {
    return normalizeFlightProviderApprovalStatus(status);
  }

  function describeFlightProviderApprovalStatus(status) {
    const safe = normalizeFlightProviderApprovalStatus(status);
    return {
      summaryTitle: safe.display.summaryTitle || "机票 Provider 接入审批",
      currentStatusLine: safe.display.currentStatusLine || "当前状态：候选平台已建档，尚未批准接入只读价格源。",
      approvalStatusLine: safe.display.approvalStatusLine || "审批状态：未审查",
      readonlyStubPermissionLine: safe.display.readonlyStubPermissionLine || "只读适配器开发许可：未授予",
      readonlyStubAdapterLine: safe.display.readonlyStubAdapterLine || "已建立",
      sandboxDryRunLine: safe.display.sandboxDryRunLine || "Sandbox Dry Run：外壳已建立，尚未批准真实连接",
      readonlyStubPermissionStageLine: safe.display.readonlyStubPermissionStageLine || "当前阶段：需要人工批准",
      readonlyStubPermissionNextStepLine: safe.display.readonlyStubPermissionNextStepLine || "下一步：完成 provider 条款、API 文档、域名 allowlist、API key 存储方案和请求 / 响应结构审查",
      readOnlyPriceSourceLine: safe.display.readOnlyPriceSourceLine || "只读价格源：未启用",
      realNetworkConnectionLine: safe.display.realNetworkConnectionLine || "真实网络连接：未启用",
      realPriceReturnLine: safe.display.realPriceReturnLine || "真实价格返回：未启用",
      bookingUrlStatusLine: safe.display.bookingUrlStatusLine || "bookingUrl：未启用",
      tradeStatusLine: safe.display.tradeStatusLine || "付款 / 下单：不支持",
      candidatePlatformsLine: safe.display.candidatePlatformsLine || "候选平台：Google Flights / Trip.com / 携程 / Skyscanner / Kayak / Expedia",
      allowlistTitle: safe.display.allowlistTitle || "默认允许域名白名单",
      blockedRulesTitle: safe.display.blockedRulesTitle || "默认阻断规则",
      allowlistRequirementLine: safe.display.allowlistRequirementLine || "需要 allowlist",
      blockedRulesSummaryLine: safe.display.blockedRulesSummaryLine || "禁止未知域名 / 短链接 / 可疑域名",
      aiRiskLine: safe.display.aiRiskLine || "AI 不能生成可疑 provider 域名",
      humanApprovalLine: safe.display.humanApprovalLine || "人工审核后才允许进入 provider approval",
      notesLine: safe.display.notesLine || "候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。",
      allowlistDomains: Array.isArray(safe.allowlistDomains) ? safe.allowlistDomains.slice() : [],
      blockedRules: Array.isArray(safe.blockedRules) ? safe.blockedRules.slice() : [],
      checklistGroups: Array.isArray(safe.display.checklistGroups) ? safe.display.checklistGroups.map((group) => ({
        title: String(group && group.title || ""),
        items: Array.isArray(group && group.items) ? group.items.map((item) => [String(item && item[0] || ""), String(item && item[1] || "")]) : []
      })) : defaultChecklistGroups()
    };
  }

  window.WeishanCommerceFlightProviderApproval = {
    APPROVAL_VERSION,
    PHASE,
    DEFAULT_STATUS,
    DEFAULT_ALLOWED_STAGE,
    DEFAULT_MANUAL_REVIEW_STATUS,
    defaultCapabilities,
    defaultSafety,
    defaultChecklist,
    defaultAllowlistDomains,
    defaultBlockedRules,
    defaultChecklistGroups,
    getFlightProviderApprovalStatus,
    normalizeFlightProviderApprovalStatus,
    describeFlightProviderApprovalStatus
  };
})();
