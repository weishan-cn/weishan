;(function () {
  "use strict";

  const GATE_VERSION = "2.1.19";
  const GATE_NAME = "secure_storage_design_gate";
  const PHASE = "design_gate";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  const blockingReasons = [
    "安全密钥写入实现未完成",
    "安全密钥读取实现未完成",
    "删除 / 轮换机制未完成",
    "Keychain 适配未完成",
    "safeStorage 适配未完成",
    "加密本地存储未完成",
    "key 删除 / 轮换 / 过期机制草案已建立，但真实生命周期操作仍未开放",
    "provider endpoint allowlist 未完成",
    "只读 provider 沙箱未完成",
    "网络请求闸门未完成",
    "真实价格字段校验未完成",
    "bookingUrl 安全校验未完成",
    "人工安全审查未完成"
  ];

  const unlockChecklist = [
    "设计密钥数据结构",
    "设计本机安全写入接口",
    "设计本机安全读取接口",
    "设计删除 key 机制",
    "设计轮换 key 机制",
    "设计过期 key 机制",
    "设计 key 别名，不在 UI 显示明文",
    "设计日志脱敏",
    "设计 crash report 脱敏",
    "设计截图 / 复制限制提示",
    "设计只读 provider result schema gate",
    "设计 provider 沙箱只读连接",
    "设计价格字段校验",
    "设计 bookingUrl 域名校验",
    "完成安全审查后，才允许进入下一阶段"
  ];

  const implementationMilestones = [
    "v2.1.4：安全存储设计闸门，默认关闭",
    "v2.1.4：本机安全存储接口草案，已建立，但仍不写真实 key",
    "v2.1.4：密钥脱敏与日志防泄露规则，已建立，但仍不写真实 key",
    "v2.1.4：key 删除 / 轮换 / 过期机制草案",
    "v2.1.4：provider endpoint allowlist 闸门；只读 provider sandbox gate 已建立；下一步只读 provider result schema gate",
    "v2.1.4：只读沙箱连接闸门",
    "v2.1.4：人工确认后，才考虑真实只读 key 输入"
  ];

  const threatModel = [
    "key 明文泄露",
    "key 写入日志",
    "key 写入 crash report",
    "key 出现在截图",
    "key 被复制到剪贴板后泄露",
    "key 被误存到 .env",
    "key 被误存到 localStorage",
    "key 被误存到 sessionStorage",
    "恶意 endpoint 窃取 key",
    "非官方 provider 冒充",
    "provider 返回钓鱼 bookingUrl",
    "只读 key 被误当成写入 key",
    "用户误绑定付款 / 下单权限",
    "第三方 API 权限过宽"
  ];

  const auditRules = [
    "日志中永不记录完整 key",
    "日志中只允许显示 key alias",
    "允许显示后四位时，也必须经过显式脱敏函数",
    "crash report 不得包含 key / secret / token / endpoint auth header",
    "E2E 截图不得出现真实 key",
    "UI 不得展示明文 key",
    "复制按钮不得复制真实 key",
    "删除 key 必须有用户确认",
    "测试连接必须通过 gate，但当前版本仍禁用"
  ];

  const redactionRules = [
    "apiKey → [REDACTED_API_KEY]",
    "apiSecret → [REDACTED_API_SECRET]",
    "accessToken → [REDACTED_ACCESS_TOKEN]",
    "refreshToken → [REDACTED_REFRESH_TOKEN]",
    "authorization header → [REDACTED_AUTH_HEADER]",
    "endpoint credential query params → [REDACTED_CREDENTIAL_PARAMS]"
  ];

  function disabledCapabilities() {
    return {
      canShowGate: true,
      canShowGateStatus: true,
      canShowBlockingReasons: true,
      canShowUnlockChecklist: true,
      canShowImplementationMilestones: true,
      canShowThreatModel: true,
      canShowAuditRules: true,
      canShowRedactionRules: true,
      canInputApiKey: false,
      canSaveApiKey: false,
      canReadApiKey: false,
      canDeleteApiKey: false,
      canRotateApiKey: false,
      canUseKeychain: false,
      canUseSafeStorage: false,
      canWriteEncryptedLocalStore: false,
      canWriteEnv: false,
      canWriteLocalStorage: false,
      canWriteSessionStorage: false,
      canWriteLogs: false,
      canTestConnection: false,
      canConnectEndpoint: false,
      canUseNetwork: false,
      canRunProviderSandbox: false,
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

  function baseGate() {
    return {
      version: GATE_VERSION,
      gateName: GATE_NAME,
      gateStatus: "closed",
      phase: PHASE,
      realKeyStorageReady: false,
      localSecureStorageInterfaceDraft: "established",
      keyRedactionAndLogLeakRules: "established",
      nextRequiredStep: "readonly_provider_result_schema_gate",
      realImplementation: "disabled",
      keyInputReady: false,
      keyWriteReady: false,
      keyReadReady: false,
      keyDeleteReady: false,
      keyRotationReady: false,
      keychainReady: false,
      safeStorageReady: false,
      encryptedLocalStoreReady: false,
      auditLogReady: false,
      redactionReady: false,
      screenshotProtectionReady: false,
      crashReportProtectionReady: false,
      providerSandboxReady: false,
      endpointAllowlistReady: false,
      networkReady: false,
      priceReadinessReady: false,
      bookingUrlReadinessReady: false,
      capabilities: disabledCapabilities(),
      blockingReasons: blockingReasons.slice(),
      unlockChecklist: unlockChecklist.slice(),
      implementationMilestones: implementationMilestones.slice(),
      threatModel: threatModel.slice(),
      auditRules: auditRules.slice(),
      redactionRules: redactionRules.slice(),
      display: {
        title: "安全存储设计闸门",
        statusTitle: "当前状态",
        gateStatusLine: "闸门状态：关闭",
        phaseLine: "当前阶段：设计闸门",
        localInterfaceDraftLine: "本机安全存储接口草案：已建立",
        realImplementationLine: "真实实现：未启用",
        keyInputLine: "真实 API key 输入：未开放",
        keySaveLine: "真实 API key 保存：未开放",
        keyReadLine: "真实 API key 读取：未开放",
        connectionTestLine: "测试连接：未开放",
        providerSandboxLine: "provider 沙箱连接：未开放",
        priceLine: "真实价格返回：未开放",
        bookingUrlLine: "bookingUrl 返回：未开放",
        blockingTitle: "为什么还不能进入真实密钥阶段",
        unlockTitle: "解锁前检查清单",
        milestonesTitle: "实施里程碑",
        auditTitle: "审计规则",
        redactionTitle: "脱敏规则",
        nextStepTitle: "下一步",
        keyRedactionAndLogLeakRulesLine: "密钥脱敏与日志防泄露规则：已建立",
        keyLifecycleDraftLine: "key 删除 / 轮换 / 过期机制草案：已建立",
        keyLifecycleRealActionsLine: "真实删除 / 轮换 / 过期仍未开放",
        nextStepLine: "provider endpoint allowlist 闸门：已建立。只读 provider sandbox gate：已建立。下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate。当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。"
      }
    };
  }

  function buildSecureStorageDesignGate(input) {
    const raw = input && typeof input === "object" ? input : {};
    const gate = baseGate();
    return clone(Object.assign({}, gate, raw, {
      version: GATE_VERSION,
      gateName: GATE_NAME,
      gateStatus: "closed",
      phase: PHASE,
      capabilities: Object.assign(disabledCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}, disabledCapabilities()),
      blockingReasons: Array.isArray(raw.blockingReasons) ? raw.blockingReasons.slice() : gate.blockingReasons,
      unlockChecklist: Array.isArray(raw.unlockChecklist) ? raw.unlockChecklist.slice() : gate.unlockChecklist,
      implementationMilestones: Array.isArray(raw.implementationMilestones) ? raw.implementationMilestones.slice() : gate.implementationMilestones,
      threatModel: Array.isArray(raw.threatModel) ? raw.threatModel.slice() : gate.threatModel,
      auditRules: Array.isArray(raw.auditRules) ? raw.auditRules.slice() : gate.auditRules,
      redactionRules: Array.isArray(raw.redactionRules) ? raw.redactionRules.slice() : gate.redactionRules,
      display: Object.assign({}, gate.display, raw.display && typeof raw.display === "object" ? raw.display : {})
    }));
  }

  function getSecureStorageDesignGateState() {
    return clone({
      gateStatus: "closed",
      phase: PHASE,
      canProceedToKeyInput: false,
      canProceedToKeyStorage: false,
      canProceedToKeyRead: false,
      canProceedToConnectionTest: false,
      canProceedToProviderSandbox: false,
      canProceedToRealPrice: false,
      canProceedToBookingUrl: false,
      nextRequiredStep: "readonly_provider_result_schema_gate",
      currentUserActionRequired: false
    });
  }

  function evaluateSecureStorageDesignGate(input) {
    const gate = buildSecureStorageDesignGate(input);
    return clone({
      allowed: false,
      gateStatus: "closed",
      phase: PHASE,
      blockingReasons: gate.blockingReasons.slice(),
      nextRequiredStep: "readonly_provider_result_schema_gate",
      safetySummary: "安全存储设计闸门关闭；key 生命周期草案已建立，但当前版本不能输入、保存、读取、删除、轮换或测试真实 API key，不能连接 endpoint，不能联网，不能返回价格或 bookingUrl。"
    });
  }

  function assertSecureStorageDesignGateSafe(gateInput) {
    const gate = buildSecureStorageDesignGate(gateInput);
    const state = getSecureStorageDesignGateState();
    const violations = [];
    [
      ["gateStatus", gate.gateStatus, "closed"],
      ["phase", gate.phase, PHASE],
      ["canProceedToKeyInput", state.canProceedToKeyInput, false],
      ["canProceedToKeyStorage", state.canProceedToKeyStorage, false],
      ["canProceedToKeyRead", state.canProceedToKeyRead, false],
      ["canProceedToConnectionTest", state.canProceedToConnectionTest, false],
      ["canProceedToProviderSandbox", state.canProceedToProviderSandbox, false],
      ["canProceedToRealPrice", state.canProceedToRealPrice, false],
      ["canProceedToBookingUrl", state.canProceedToBookingUrl, false]
    ].forEach(([name, actual, expected]) => {
      if (actual !== expected) violations.push(name);
    });
    [
      "canInputApiKey",
      "canSaveApiKey",
      "canReadApiKey",
      "canUseKeychain",
      "canUseSafeStorage",
      "canWriteEnv",
      "canWriteLocalStorage",
      "canWriteSessionStorage",
      "canWriteLogs",
      "canTestConnection",
      "canConnectEndpoint",
      "canUseNetwork",
      "canReturnPrice",
      "canReturnBookingUrl",
      "canCreateOrder",
      "canPay",
      "canUploadIdentity",
      "canStoreBankCard"
    ].forEach((name) => {
      if (gate.capabilities[name] !== false) violations.push(name);
    });
    const serialized = JSON.stringify(gate);
    if (/sk-[A-Za-z0-9]|api[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{8,}|https?:\/\/api\./i.test(serialized)) {
      violations.push("secret_or_endpoint");
    }
    if (violations.length) throw new Error("secure_storage_design_gate_violation:" + violations.join(","));
    return true;
  }

  window.WeishanCommerceSecureStorageDesignGate = {
    GATE_VERSION,
    GATE_NAME,
    PHASE,
    commerceSecureStorageDesignGateContract: buildSecureStorageDesignGate(),
    buildSecureStorageDesignGate,
    getSecureStorageDesignGateState,
    evaluateSecureStorageDesignGate,
    assertSecureStorageDesignGateSafe
  };
})();
