;(function () {
  "use strict";

  const SECURE_KEY_STORAGE_PLAN_VERSION = "2.0.91";
  const PHASE = "flight_secure_key_storage_plan";
  const DEFAULT_PLAN_STATUS = "plan_only";
  const DEFAULT_CURRENT_STAGE = "design_required";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canDescribePlan: true,
      canShowCurrentStage: true,
      canShowBlockedChannels: true,
      canShowFutureTargets: true,
      canUseMacOSKeychain: false,
      canUseElectronSafeStorage: false,
      canStorePlaintext: false,
      canStoreEnvFile: false,
      canStoreLocalStorage: false,
      canStoreSessionStorage: false,
      canStoreLogs: false,
      canUseNetwork: false,
      canConnectEndpoint: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canStoreIdentity: false
    };
  }

  function defaultBlockedChannels() {
    return [
      "明文",
      ".env",
      "localStorage",
      "sessionStorage",
      "日志",
      "query string",
      "error message"
    ];
  }

  function defaultChecklist() {
    return {
      macOSKeychainDesign: false,
      electronSafeStorageDesign: false,
      plaintextForbidden: false,
      envFileForbidden: false,
      localStorageForbidden: false,
      sessionStorageForbidden: false,
      logForbidden: false,
      finalHumanApproval: false
    };
  }

  function defaultDisplay() {
    return {
      summaryTitle: "安全密钥存储方案",
      planStatusLine: "安全密钥存储方案：计划中",
      currentStatusLine: "当前状态：仅计划，尚未实现真实安全密钥存储。",
      currentStageLine: "当前阶段：设计中",
      futureTargetsLine: "未来目标：macOS Keychain / Electron safeStorage",
      blockedChannelsTitle: "禁止渠道",
      blockedChannelsLine: "禁止：明文、.env、localStorage、sessionStorage、日志",
      nextStepLine: "下一步：设计安全密钥存储实现",
      safetyLine: "当前版本不读取真实 API key，不保存明文，不写入 .env / localStorage / sessionStorage / 日志。",
      capabilityTitle: "当前能力",
      checklistTitle: "前置条件",
      capabilityLines: [
        "不能读取真实 API key",
        "不能保存真实 API key",
        "不能连接 endpoint",
        "不能发起网络请求",
        "不能返回价格",
        "不能返回 bookingUrl",
        "不能付款",
        "不能下单",
        "不能保存身份证 / 护照 / 银行卡"
      ],
      checklistGroups: [
        {
          title: "前置条件",
          items: [
            ["macOS Keychain 方案", "未开始"],
            ["Electron safeStorage 方案", "未开始"],
            [".env / 明文", "禁止"],
            ["localStorage", "禁止"],
            ["sessionStorage", "禁止"],
            ["日志", "禁止"],
            ["人工批准", "未开始"]
          ]
        }
      ]
    };
  }

  function normalizeSecureKeyStoragePlan(plan) {
    const raw = plan && typeof plan === "object" ? plan : {};
    return clone({
      secureKeyStoragePlanVersion: String(raw.secureKeyStoragePlanVersion || SECURE_KEY_STORAGE_PLAN_VERSION),
      phase: String(raw.phase || PHASE),
      planStatus: String(raw.planStatus || DEFAULT_PLAN_STATUS),
      currentStage: String(raw.currentStage || DEFAULT_CURRENT_STAGE),
      storageMode: String(raw.storageMode || "secure_storage_required"),
      macOSKeychainMode: String(raw.macOSKeychainMode || "not_connected"),
      electronSafeStorageMode: String(raw.electronSafeStorageMode || "not_connected"),
      plaintextMode: String(raw.plaintextMode || "forbidden"),
      envFileMode: String(raw.envFileMode || "forbidden"),
      localStorageMode: String(raw.localStorageMode || "forbidden"),
      sessionStorageMode: String(raw.sessionStorageMode || "forbidden"),
      logMode: String(raw.logMode || "forbidden"),
      endpointMode: String(raw.endpointMode || "disabled"),
      networkMode: String(raw.networkMode || "disabled"),
      priceMode: String(raw.priceMode || "disabled"),
      bookingUrlMode: String(raw.bookingUrlMode || "disabled"),
      orderMode: String(raw.orderMode || "disabled"),
      paymentMode: String(raw.paymentMode || "disabled"),
      identityStorageMode: String(raw.identityStorageMode || "disabled"),
      storageTargets: Array.isArray(raw.storageTargets) ? raw.storageTargets.slice() : ["macOS Keychain", "Electron safeStorage"],
      blockedChannels: Array.isArray(raw.blockedChannels) ? raw.blockedChannels.slice() : defaultBlockedChannels(),
      checklist: Object.assign(defaultChecklist(), raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {}),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      display: Object.assign(defaultDisplay(), raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function getSecureKeyStoragePlanState(plan) {
    return normalizeSecureKeyStoragePlan(plan);
  }

  function buildSecureKeyStoragePlan(plan) {
    return normalizeSecureKeyStoragePlan(plan);
  }

  function buildSecureKeyStoragePlanReadinessSummary(plan) {
    const safe = normalizeSecureKeyStoragePlan(plan);
    const display = safe.display || defaultDisplay();
    return clone({
      title: display.summaryTitle || "安全密钥存储方案",
      planStatusLine: display.planStatusLine || "安全密钥存储方案：计划中",
      currentStatusLine: display.currentStatusLine || "当前状态：仅计划，尚未实现真实安全密钥存储。",
      currentStageLine: display.currentStageLine || "当前阶段：设计中",
      futureTargetsLine: display.futureTargetsLine || "未来目标：macOS Keychain / Electron safeStorage",
      blockedChannelsTitle: display.blockedChannelsTitle || "禁止渠道",
      blockedChannelsLine: display.blockedChannelsLine || "禁止：明文、.env、localStorage、sessionStorage、日志",
      nextStepLine: display.nextStepLine || "下一步：设计安全密钥存储实现",
      safetyLine: display.safetyLine || "当前版本不读取真实 API key，不保存明文，不写入 .env / localStorage / sessionStorage / 日志。",
      capabilityTitle: display.capabilityTitle || "当前能力",
      checklistTitle: display.checklistTitle || "前置条件",
      capabilityLines: Array.isArray(display.capabilityLines) ? display.capabilityLines.slice() : defaultDisplay().capabilityLines.slice(),
      checklistGroups: Array.isArray(display.checklistGroups) ? display.checklistGroups.map((group) => ({
        title: String(group && group.title || ""),
        items: Array.isArray(group && group.items) ? group.items.map((item) => [String(item && item[0] || ""), String(item && item[1] || "")]) : []
      })) : defaultDisplay().checklistGroups
    });
  }

  function describeSecureKeyStoragePlan(plan) {
    const safe = normalizeSecureKeyStoragePlan(plan);
    const summary = buildSecureKeyStoragePlanReadinessSummary(safe);
    return clone({
      secureKeyStoragePlanVersion: safe.secureKeyStoragePlanVersion,
      phase: safe.phase,
      planStatus: safe.planStatus,
      currentStage: safe.currentStage,
      storageMode: safe.storageMode,
      macOSKeychainMode: safe.macOSKeychainMode,
      electronSafeStorageMode: safe.electronSafeStorageMode,
      plaintextMode: safe.plaintextMode,
      envFileMode: safe.envFileMode,
      localStorageMode: safe.localStorageMode,
      sessionStorageMode: safe.sessionStorageMode,
      logMode: safe.logMode,
      endpointMode: safe.endpointMode,
      networkMode: safe.networkMode,
      priceMode: safe.priceMode,
      bookingUrlMode: safe.bookingUrlMode,
      orderMode: safe.orderMode,
      paymentMode: safe.paymentMode,
      identityStorageMode: safe.identityStorageMode,
      storageTargets: Array.isArray(safe.storageTargets) ? safe.storageTargets.slice() : ["macOS Keychain", "Electron safeStorage"],
      blockedChannels: Array.isArray(safe.blockedChannels) ? safe.blockedChannels.slice() : defaultBlockedChannels(),
      capabilities: clone(safe.capabilities),
      checklist: clone(safe.checklist),
      summary,
      display: Object.assign({}, safe.display, summary)
    });
  }

  function assertSecureKeyStoragePlanSafe(options) {
    const raw = options && typeof options === "object" ? options : {};
    const plan = normalizeSecureKeyStoragePlan(raw.plan || raw);
    const summary = raw.summary && typeof raw.summary === "object" ? raw.summary : buildSecureKeyStoragePlanReadinessSummary(plan);
    const issues = [];
    if (plan.planStatus !== DEFAULT_PLAN_STATUS) issues.push("planStatus");
    if (plan.currentStage !== DEFAULT_CURRENT_STAGE) issues.push("currentStage");
    [
      "canUseMacOSKeychain",
      "canUseElectronSafeStorage",
      "canStorePlaintext",
      "canStoreEnvFile",
      "canStoreLocalStorage",
      "canStoreSessionStorage",
      "canStoreLogs",
      "canUseNetwork",
      "canConnectEndpoint",
      "canReturnPrice",
      "canReturnBookingUrl",
      "canCreateOrder",
      "canPay",
      "canStoreIdentity"
    ].forEach((key) => {
      if (!plan.capabilities || plan.capabilities[key] !== false) issues.push(key);
    });
    const joined = JSON.stringify({ plan, summary });
    if (/sk-[A-Za-z0-9]|api[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{8,}|https?:\/\/api\./i.test(joined)) {
      issues.push("secret_or_endpoint");
    }
    if (/明文保存|写入\s*\.env|localStorage|sessionStorage|日志/.test(joined) && /true/.test(joined)) {
      issues.push("plaintext_channel");
    }
    if (issues.length) throw new Error("secure_key_storage_plan_violation:" + issues.join(","));
    return true;
  }

  window.WeishanCommerceSecureKeyStoragePlan = {
    SECURE_KEY_STORAGE_PLAN_VERSION,
    PHASE,
    DEFAULT_PLAN_STATUS,
    DEFAULT_CURRENT_STAGE,
    defaultCapabilities,
    defaultBlockedChannels,
    defaultChecklist,
    defaultDisplay,
    secureKeyStoragePlanContract: normalizeSecureKeyStoragePlan(),
    normalizeSecureKeyStoragePlan,
    getSecureKeyStoragePlanState,
    buildSecureKeyStoragePlan,
    buildSecureKeyStoragePlanReadinessSummary,
    describeSecureKeyStoragePlan,
    assertSecureKeyStoragePlanSafe
  };
})();
