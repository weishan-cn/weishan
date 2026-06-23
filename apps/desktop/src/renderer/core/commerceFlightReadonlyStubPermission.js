;(function () {
  "use strict";

  const PERMISSION_VERSION = "2.1.62";
  const PHASE = "flight_readonly_stub_permission";
  const DEFAULT_OVERALL_STATUS = "not_granted";
  const DEFAULT_CURRENT_STAGE = "approval_required";
  const DEFAULT_PERMISSION_STATUS = "not_granted";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canDevelopReadonlyStub: false,
      canUseRealApiKey: false,
      canConnectRealEndpoint: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canOpenBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canStoreIdentity: false
    };
  }

  function defaultChecklist() {
    return {
      platformIdentityReview: false,
      officialDomainAllowlistReview: false,
      providerTermsReview: false,
      apiDocumentationReview: false,
      apiKeyStoragePlanReview: false,
      requestSchemaReview: false,
      responseSchemaReview: false,
      errorHandlingReview: false,
      timeoutRateLimitReview: false,
      finalStubDevApproval: false
    };
  }

  function defaultDisplay() {
    return {
      summaryTitle: "只读适配器开发许可",
      permissionStatusLine: "只读适配器开发许可：未授予",
      currentStatusLine: "当前状态：尚未授予只读适配器开发许可。",
      sandboxDryRunLine: "Sandbox Dry Run：外壳已建立，尚未批准真实沙箱连接。",
      currentStageLine: "当前阶段：需要人工批准",
      nextStepLine: "下一步：完成 provider 条款、API 文档、域名 allowlist、API key 存储方案和请求 / 响应结构审查",
      noticeLine: "只读适配器只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。",
      checklistTitle: "前置条件",
      capabilityTitle: "当前能力",
      checklistGroups: [
        {
          title: "前置条件",
          items: [
            ["平台身份确认", "未完成"],
            ["官方域名 / allowlist 审查", "未完成"],
            ["Provider 条款审查", "未完成"],
            ["API 文档审查", "未完成"],
            ["API key 安全存储方案", "未完成"],
            ["请求结构审查", "未完成"],
            ["响应结构审查", "未完成"],
            ["错误处理审查", "未完成"],
            ["超时 / 频率限制审查", "未完成"],
            ["人工批准开发只读 stub", "未完成"]
          ]
        }
      ],
      capabilityLines: [
        "不能开发真实 connector",
        "不能读取 API key",
        "不能连接 endpoint",
        "不能发起网络请求",
        "不能返回价格",
        "不能返回 bookingUrl",
        "不能打开预订页",
        "不能付款",
        "不能下单",
        "不能保存证件 / 银行卡"
      ]
    };
  }

  function normalizeFlightReadonlyStubPermission(permission) {
    const raw = permission && typeof permission === "object" ? permission : {};
    const checklist = Object.assign(defaultChecklist(), raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {});
    return clone({
      permissionVersion: String(raw.permissionVersion || PERMISSION_VERSION),
      phase: String(raw.phase || PHASE),
      providerCategory: String(raw.providerCategory || "flight"),
      providerId: String(raw.providerId || "flight-provider-disabled"),
      providerName: String(raw.providerName || "机票候选平台"),
      overallStatus: String(raw.overallStatus || DEFAULT_OVERALL_STATUS),
      currentStage: String(raw.currentStage || DEFAULT_CURRENT_STAGE),
      permissionStatus: String(raw.permissionStatus || DEFAULT_PERMISSION_STATUS),
      checklist,
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display: Object.assign(defaultDisplay(), raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function getFlightReadonlyStubPermission(permission) {
    return normalizeFlightReadonlyStubPermission(permission);
  }

  function describeFlightReadonlyStubPermission(permission) {
    const safe = normalizeFlightReadonlyStubPermission(permission);
    return {
      summaryTitle: safe.display.summaryTitle || "只读适配器开发许可",
      permissionStatusLine: safe.display.permissionStatusLine || "只读适配器开发许可：未授予",
      currentStatusLine: safe.display.currentStatusLine || "当前状态：尚未授予只读适配器开发许可。",
      sandboxDryRunLine: safe.display.sandboxDryRunLine || "Sandbox Dry Run：外壳已建立，尚未批准真实沙箱连接。",
      currentStageLine: safe.display.currentStageLine || "当前阶段：需要人工批准",
      nextStepLine: safe.display.nextStepLine || "下一步：完成 provider 条款、API 文档、域名 allowlist、API key 存储方案和请求 / 响应结构审查",
      noticeLine: safe.display.noticeLine || "只读适配器只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。",
      checklistTitle: safe.display.checklistTitle || "前置条件",
      capabilityTitle: safe.display.capabilityTitle || "当前能力",
      checklistGroups: Array.isArray(safe.display.checklistGroups) ? safe.display.checklistGroups.map((group) => ({
        title: String(group && group.title || ""),
        items: Array.isArray(group && group.items) ? group.items.map((item) => [String(item && item[0] || ""), String(item && item[1] || "")]) : []
      })) : defaultDisplay().checklistGroups,
      capabilityLines: Array.isArray(safe.display.capabilityLines) ? safe.display.capabilityLines.slice() : defaultDisplay().capabilityLines.slice()
    };
  }

  window.WeishanCommerceFlightReadonlyStubPermission = {
    PERMISSION_VERSION,
    PHASE,
    DEFAULT_OVERALL_STATUS,
    DEFAULT_CURRENT_STAGE,
    DEFAULT_PERMISSION_STATUS,
    defaultCapabilities,
    defaultChecklist,
    defaultDisplay,
    getFlightReadonlyStubPermission,
    normalizeFlightReadonlyStubPermission,
    describeFlightReadonlyStubPermission
  };
})();
