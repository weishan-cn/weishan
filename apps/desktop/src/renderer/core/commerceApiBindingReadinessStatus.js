;(function () {
  "use strict";

  const READINESS_VERSION = "2.1.35";
  const PHASE = "api_binding_readiness_status";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canShowReadinessStatus: true,
      canExplainWhyNotReady: true,
      canShowMissingRequirements: true,
      canShowNextStep: true,
      canReferenceProviderCatalog: true,
      canReferenceDisabledMockForm: true,
      canReferencePermissionChecklist: true,
      canInputApiKey: false,
      canSaveApiKey: false,
      canTestConnection: false,
      canConnectEndpoint: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false,
      canStorePassport: false,
      canStoreBankCard: false
    };
  }

  function normalizeApiBindingReadinessStatusContract(contract) {
    const raw = contract && typeof contract === "object" ? contract : {};
    return clone({
      readinessVersion: String(raw.readinessVersion || READINESS_VERSION),
      phase: String(raw.phase || PHASE),
      readinessStatus: String(raw.readinessStatus || "not_ready"),
      readinessMode: String(raw.readinessMode || "status_only"),
      realBindingMode: String(raw.realBindingMode || "disabled"),
      apiKeyInputMode: String(raw.apiKeyInputMode || "disabled"),
      apiKeyStorageMode: String(raw.apiKeyStorageMode || "disabled"),
      secureStorageMode: String(raw.secureStorageMode || "plan_established_not_implemented"),
      permissionChecklistMode: String(raw.permissionChecklistMode || "readonly_preview"),
      providerCatalogMode: String(raw.providerCatalogMode || "catalog_only"),
      mockFormMode: String(raw.mockFormMode || "disabled_preview"),
      providerReviewMode: String(raw.providerReviewMode || "not_started"),
      sandboxGateMode: String(raw.sandboxGateMode || "not_ready"),
      endpointConnectionMode: String(raw.endpointConnectionMode || "disabled"),
      networkMode: String(raw.networkMode || "disabled"),
      priceMode: String(raw.priceMode || "disabled_without_binding"),
      bookingUrlMode: String(raw.bookingUrlMode || "disabled_without_binding"),
      orderMode: String(raw.orderMode || "disabled"),
      paymentMode: String(raw.paymentMode || "disabled"),
      identityUploadMode: String(raw.identityUploadMode || "disabled"),
      identityStorageMode: String(raw.identityStorageMode || "disabled"),
      bankCardStorageMode: String(raw.bankCardStorageMode || "disabled"),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {})
    });
  }

  function buildApiBindingReadinessStatus() {
    return clone({
      status: "not_ready",
      canBindApi: false,
      currentStage: "pre_binding_safety",
      nextStep: "readonly_provider_result_schema_gate",
      summary: {
        userApi: "not_bound",
        providerCatalog: "available",
        apiBindingExplanation: "available",
        mockForm: "disabled_preview",
        permissionChecklist: "readonly_preview",
        secureKeyStorage: "plan_established_not_implemented",
        providerReview: "not_started",
        readonlySandbox: "not_ready",
        realPriceResult: "unavailable"
      },
      blockers: [
        "provider endpoint allowlist 闸门已建立，只读 provider sandbox gate：已建立，等待只读 provider result schema gate；只读 provider result schema gate：已建立，provider result source label gate：未建立",
        "API 绑定权限确认不能提交",
        "Provider 条款 / API 文档未人工审查",
        "只读沙箱连接闸门未完成",
        "endpoint 连接未启用",
        "网络请求未启用",
        "真实价格返回未启用",
        "bookingUrl 返回未启用",
        "付款 / 下单永久禁止或默认禁止",
        "身份资料上传禁止"
      ],
      capabilities: defaultCapabilities()
    });
  }

  function buildApiBindingReadinessSteps() {
    return clone([
      { stepId: "current_readonly_info", label: "平台目录 / 说明 / 禁用表单 / 权限清单", status: "available", canProceedNow: true, reason: "当前只能查看说明、目录、禁用表单和权限清单。" },
      { stepId: "key_redaction_and_log_leak_rules", label: "密钥脱敏与日志防泄露规则", status: "established", canProceedNow: false, reason: "规则层已建立，但仍不允许输入、保存、读取或测试真实 API key。" },
      { stepId: "key_delete_rotate_expiry_draft", label: "key 删除 / 轮换 / 过期机制", status: "established", canProceedNow: false, reason: "草案已建立，但真实删除、轮换、过期、吊销和恢复仍未开放。" },
      { stepId: "readonly_provider_sandbox_gate", label: "只读 provider sandbox gate", status: "established", canProceedNow: false, reason: "gate 已建立但真实 sandbox 仍未开放。" },
      { stepId: "readonly_provider_result_schema_gate", label: "只读 provider result schema gate", status: "next", canProceedNow: false, reason: "未完成 provider result source label gate 前不能返回真实价格。" },
      { stepId: "readonly_api_binding_draft", label: "只读 API 绑定草稿", status: "not_ready", canProceedNow: false, reason: "provider endpoint allowlist 闸门完成前不能进入草稿。" },
      { stepId: "provider_human_review", label: "Provider 人工审查", status: "not_ready", canProceedNow: false, reason: "Provider 条款和 API 文档尚未人工审查。" },
      { stepId: "readonly_sandbox_gate", label: "只读沙箱闸门", status: "not_ready", canProceedNow: false, reason: "只读沙箱连接闸门未完成。" },
      { stepId: "readonly_price_result", label: "只读价格结果", status: "not_ready", canProceedNow: false, reason: "未接入可信只读价格源。" },
      { stepId: "permanent_transaction_limits", label: "付款 / 下单 / 身份上传仍禁止", status: "permanent_limit", canProceedNow: false, reason: "weishan 不付款、不下单、不上传身份资料、不保存银行卡。" }
    ]);
  }

  function getApiBindingReadinessState() {
    return clone({
      status: "not_ready",
      canBindApi: false,
      canInputApiKey: false,
      canSaveApiKey: false,
      canTestConnection: false,
      canConnectEndpoint: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false,
      canStorePassport: false,
      canStoreBankCard: false
    });
  }

  function assertApiBindingReadinessSafe(options) {
    const raw = options && typeof options === "object" ? options : {};
    const status = raw.status && typeof raw.status === "object" ? raw.status : buildApiBindingReadinessStatus();
    const steps = Array.isArray(raw.steps) ? raw.steps : buildApiBindingReadinessSteps();
    const state = getApiBindingReadinessState();
    const violations = [];
    if (status.canBindApi !== false) violations.push("canBindApi");
    if (status.nextStep !== "readonly_provider_result_schema_gate") violations.push("nextStep");
    [
      "canInputApiKey",
      "canSaveApiKey",
      "canTestConnection",
      "canConnectEndpoint",
      "canUseNetwork",
      "canReturnPrice",
      "canReturnBookingUrl",
      "canCreateOrder",
      "canPay",
      "canUploadIdentity",
      "canStoreBankCard"
    ].forEach((key) => {
      if (state[key] !== false || status.capabilities && status.capabilities[key] !== false) violations.push(key);
    });
    const joined = JSON.stringify({ status, steps });
    if (/sk-[A-Za-z0-9]|api[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{8,}|https?:\/\/api\./i.test(joined)) {
      violations.push("secret_or_endpoint");
    }
    if (/可提交绑定|绑定确认已提交|connection_success|API 连接成功/i.test(joined)) {
      violations.push("submittable_binding_state");
    }
    if (violations.length) throw new Error("api_binding_readiness_violation:" + violations.join(","));
    return true;
  }

  function buildApiBindingReadinessDisplay() {
    const status = buildApiBindingReadinessStatus();
    const steps = buildApiBindingReadinessSteps();
    return clone({
      title: "API 绑定准备状态",
      conclusionLine: "当前还不能绑定真实 API。",
      secureStorageDesignGateLine: "安全存储设计闸门：关闭",
      localSecureStorageInterfaceDraftLine: "本机安全存储接口草案：已建立",
      keyInputLine: "key 输入：未开放",
      keySaveLine: "key 保存：未开放",
      keyReadLine: "key 读取：未开放",
      connectionTestLine: "测试连接：未开放",
      nextStepLine: "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate",
      nextStepDetail: "密钥脱敏与日志防泄露规则：已建立。key 删除 / 轮换 / 过期机制草案：已建立。当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。",
      statusLines: [
        "用户 API：未绑定",
        "平台目录：已建立",
        "API 绑定说明：已建立",
        "API 绑定表单：禁用预览",
        "API 绑定权限清单：只读预览",
        "安全密钥存储方案：方案已建立，尚未实现",
        "密钥脱敏与日志防泄露规则：已建立",
        "key 删除 / 轮换 / 过期机制草案：已建立",
        "真实 key 删除 / 轮换 / 过期：未开放",
        "Provider 人工审查：未开始",
        "只读沙箱连接：未准备",
        "真实价格结果：暂无"
      ],
      blockerTitle: "为什么还不能绑定：",
      routeTitle: "后续路线：",
      permanentTitle: "永久限制：",
      permanentLimits: [
        "weishan 不付款",
        "weishan 不下单",
        "weishan 不上传身份证、护照或银行卡",
        "weishan 不保存银行卡"
      ],
      status,
      steps,
      state: getApiBindingReadinessState()
    });
  }

  window.WeishanCommerceApiBindingReadinessStatus = {
    READINESS_VERSION,
    PHASE,
    commerceApiBindingReadinessStatusContract: normalizeApiBindingReadinessStatusContract(),
    normalizeApiBindingReadinessStatusContract,
    buildApiBindingReadinessStatus,
    buildApiBindingReadinessSteps,
    getApiBindingReadinessState,
    assertApiBindingReadinessSafe,
    buildApiBindingReadinessDisplay
  };
})();
