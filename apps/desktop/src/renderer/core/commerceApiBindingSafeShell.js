;(function () {
  "use strict";

  const SHELL_VERSION = "2.1.3";
  const PHASE = "api_binding_safe_shell";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canShowApiBindingEntry: true,
      canExplainApiPermissions: true,
      canShowBindingStatus: true,
      canValidateProviderLabelShape: true,
      canValidatePermissionTierShape: true,
      canSaveRealApiKey: false,
      canReadRealApiKey: false,
      canStorePlaintextApiKey: false,
      canConnectEndpoint: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canOpenBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false,
      canStoreBankCard: false
    };
  }

  function normalizeApiBindingSafeShellContract(contract) {
    const raw = contract && typeof contract === "object" ? contract : {};
    return clone({
      shellVersion: String(raw.shellVersion || SHELL_VERSION),
      phase: String(raw.phase || PHASE),
      shellStatus: String(raw.shellStatus || "safe_shell_only"),
      bindingStatus: String(raw.bindingStatus || "not_bound"),
      storageMode: String(raw.storageMode || "disabled"),
      realApiKeyStorage: String(raw.realApiKeyStorage || "disabled"),
      apiKeyPlaintextStorage: String(raw.apiKeyPlaintextStorage || "forbidden"),
      endpointConnectionMode: String(raw.endpointConnectionMode || "disabled"),
      networkMode: String(raw.networkMode || "disabled"),
      priceMode: String(raw.priceMode || "disabled"),
      bookingUrlMode: String(raw.bookingUrlMode || "disabled"),
      orderMode: String(raw.orderMode || "disabled"),
      paymentMode: String(raw.paymentMode || "disabled"),
      identityUploadMode: String(raw.identityUploadMode || "disabled"),
      identityStorageMode: String(raw.identityStorageMode || "disabled"),
      bankCardStorageMode: String(raw.bankCardStorageMode || "disabled"),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {})
    });
  }

  function getApiBindingSafeShellState(state) {
    const raw = state && typeof state === "object" ? state : {};
    if (raw.status === "bound_readonly_fixture" && (raw.__fixture === true || raw.providerType === "readonly_fixture" || raw.apiPermissionTier === "readonly_fixture")) {
      return clone({
        shellVersion: SHELL_VERSION,
        phase: PHASE,
        status: "bound_readonly_fixture",
        userApi: "bound_readonly_fixture",
        providerName: String(raw.providerName || "Trip.com API fixture"),
        providerType: "readonly_fixture",
        apiPermissionTier: "readonly_fixture",
        canReadPrice: true,
        canWrite: false,
        canCreateOrder: false,
        canPay: false,
        canUploadIdentity: false,
        canStoreIdentity: false,
        canStoreBankCard: false,
        storageMode: "fixture_only",
        endpointConnectionMode: "disabled",
        networkMode: "disabled"
      });
    }
    return clone({
      shellVersion: SHELL_VERSION,
      phase: PHASE,
      status: "not_bound",
      userApi: "not_bound",
      providerName: null,
      providerType: null,
      apiPermissionTier: "none",
      canReadPrice: false,
      canWrite: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false,
      canStoreBankCard: false,
      storageMode: "disabled",
      endpointConnectionMode: "disabled",
      networkMode: "disabled"
    });
  }

  function buildApiBindingPermissionTiers() {
    return clone([
      {
        tierId: "readonly_api",
        title: "只读 API",
        allowed: ["搜索", "读取价格", "读取库存", "分析结果"],
        forbidden: ["写入", "下单", "付款", "上传身份资料", "保存银行卡"],
        enabled: false
      },
      {
        tierId: "write_api",
        title: "写入 API",
        allowed: [],
        forbidden: ["默认禁止"],
        enabled: false
      },
      {
        tierId: "order_api",
        title: "下单 API",
        allowed: [],
        forbidden: ["默认禁止"],
        enabled: false
      },
      {
        tierId: "payment_api",
        title: "支付 API",
        allowed: [],
        forbidden: ["禁止"],
        enabled: false
      },
      {
        tierId: "identity_upload",
        title: "身份资料上传",
        allowed: [],
        forbidden: ["禁止"],
        enabled: false
      },
      {
        tierId: "bank_card_storage",
        title: "银行卡保存",
        allowed: [],
        forbidden: ["禁止"],
        enabled: false
      }
    ]);
  }

  function resolveApiBindingMode(options) {
    const raw = options && typeof options === "object" ? options : {};
    const shellState = getApiBindingSafeShellState(raw.shellState);
    if (shellState.status === "bound_readonly_fixture" && shellState.canReadPrice === true) {
      return clone({
        mode: "readonly_fixture_bound",
        userApi: "bound_readonly_fixture",
        searchPriority: "user_api_readonly_first",
        providerName: shellState.providerName || "Trip.com API fixture",
        canUseUserApi: true,
        canShowPrice: true,
        canShowBookingUrl: true,
        canCreateOrder: false,
        canPay: false,
        canUploadIdentity: false,
        canStoreIdentity: false,
        canStoreBankCard: false,
        message: "已绑定只读 fixture，仅用于结构测试，不允许付款、下单或上传身份资料。"
      });
    }
    return clone({
      mode: "not_bound",
      userApi: "not_bound",
      searchPriority: "candidate_provider_fallback",
      canUseUserApi: false,
      canShowPrice: false,
      canShowBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false,
      canStoreBankCard: false,
      message: "用户 API 未绑定，当前使用 weishan 候选平台和外部搜索入口。"
    });
  }

  function assertApiBindingSafeShellNoSecrets(shellState) {
    const safe = getApiBindingSafeShellState(shellState);
    const checks = [
      ["real API key", safe.canReadRealApiKey === true || safe.canSaveRealApiKey === true],
      ["plaintext API key", safe.canStorePlaintextApiKey === true],
      ["endpoint", safe.endpointConnectionMode !== "disabled"],
      ["network", safe.networkMode !== "disabled"],
      ["order", safe.canCreateOrder === true],
      ["payment", safe.canPay === true],
      ["identity upload", safe.canUploadIdentity === true],
      ["identity storage", safe.canStoreIdentity === true],
      ["bank card storage", safe.canStoreBankCard === true]
    ];
    const violation = checks.find((item) => item[1]);
    if (violation) throw new Error("api_binding_safe_shell_violation:" + violation[0]);
    return true;
  }

  function buildApiBindingSafeShellDisplay(shellState) {
    const safe = getApiBindingSafeShellState(shellState);
    const mode = resolveApiBindingMode({ shellState: safe });
    return clone({
      title: "API 绑定状态",
      userApiLine: safe.status === "bound_readonly_fixture" ? "用户 API：只读 fixture 已绑定" : "用户 API：未绑定",
      candidateProviderLine: "weishan 候选平台：可用",
      realPriceLine: mode.canShowPrice ? "真实价格结果：只读 fixture 结构可用" : "真实价格结果：暂无",
      currentStatusLine: safe.status === "bound_readonly_fixture" ? "当前状态：只读 fixture 仅用于测试。" : "当前状态：用户 API 未绑定。",
      bindFutureLine: "绑定 API 后，可优先使用用户授权平台的只读价格结果。",
      readonlyScopeLine: "API 只用于搜索、读取价格、读取库存、分析结果。",
      externalConfirmLine: "点击价格后跳转到外部平台或官网确认。",
      secureStorageDesignGateLine: "API 绑定必须先通过安全存储设计闸门",
      localSecureStorageInterfaceDraftLine: "已建立本机安全存储接口草案",
      keyRedactionAndLogLeakRulesLine: "已建立密钥脱敏与日志防泄露规则",
      keyLifecycleDraftLine: "已建立 key 删除 / 轮换 / 过期机制草案",
      keyLifecycleRealActionsLine: "真实删除 / 轮换 / 过期仍未开放",
      providerEndpointAllowlistGateLine: "下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate",
      gateStatusLine: "当前闸门关闭",
      keyStorageLine: "当前不能保存真实 API key",
      safetyLines: [
        "绑定 API 不代表允许付款",
        "绑定 API 不代表允许下单",
        "绑定 API 不代表允许提交身份证、护照或银行卡",
        "只读 API：允许搜索 / 返回价格",
        "写入 API：默认禁止",
        "下单 API：默认禁止",
        "支付 API：禁止",
        "身份资料上传：禁止",
        "银行卡保存：禁止"
      ],
      mode
    });
  }

  window.WeishanCommerceApiBindingSafeShell = {
    SHELL_VERSION,
    PHASE,
    commerceApiBindingSafeShellContract: normalizeApiBindingSafeShellContract(),
    normalizeApiBindingSafeShellContract,
    getApiBindingSafeShellState,
    buildApiBindingPermissionTiers,
    resolveApiBindingMode,
    assertApiBindingSafeShellNoSecrets,
    buildApiBindingSafeShellDisplay
  };
})();
