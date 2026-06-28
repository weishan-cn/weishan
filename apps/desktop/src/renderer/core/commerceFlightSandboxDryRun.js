;(function () {
  "use strict";

  const SANDBOX_DRY_RUN_VERSION = "2.1.93";
  const PHASE = "flight_sandbox_dry_run_shell";
  const DEFAULT_DRY_RUN_STATUS = "shell_only";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canRunDryRunShell: true,
      canValidateInputShape: true,
      canValidateRequestShape: true,
      canValidateResponseShape: true,
      canSimulateControlFlow: true,
      canUseFixtureOnly: true,
      canUseRealApiKey: false,
      canConnectRealEndpoint: false,
      canUseNetwork: false,
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

  function defaultBlockedCapabilities() {
    return [
      "canUseRealApiKey",
      "canConnectRealEndpoint",
      "canUseNetwork",
      "canReturnPrice",
      "canReturnBookingUrl",
      "canOpenBookingUrl",
      "canCreateOrder",
      "canPay",
      "canStoreIdentity",
      "canStorePassport",
      "canStoreBankCard"
    ];
  }

  function defaultSteps() {
    return [
      "validate_user_input",
      "build_request_shape",
      "validate_request_shape",
      "skip_network_call",
      "build_empty_response_shape",
      "validate_response_shape",
      "block_price_return",
      "block_booking_url_return",
      "block_order_creation",
      "block_payment"
    ];
  }

  function defaultDisplay() {
    return {
      summaryTitle: "Sandbox Dry Run",
      shellStatusLine: "Sandbox Dry Run：外壳已建立",
      currentStatusLine: "沙箱空跑外壳已建立，但未连接真实 provider。",
      reasonLine: "只允许验证输入、请求和响应结构，不连接真实 endpoint，不读取真实 API key，不返回真实价格，不生成预订链接。",
      stepsTitle: "Dry Run 步骤",
      capabilityTitle: "当前能力",
      blockedTitle: "阻断能力",
      stepLabels: [
        "validate_user_input：验证用户输入",
        "build_request_shape：构建请求形状",
        "validate_request_shape：校验请求形状",
        "skip_network_call：跳过网络调用",
        "build_empty_response_shape：构建空响应形状",
        "validate_response_shape：校验响应形状",
        "block_price_return：阻断价格返回",
        "block_booking_url_return：阻断 bookingUrl 返回",
        "block_order_creation：阻断下单创建",
        "block_payment：阻断付款"
      ],
      capabilityLines: [
        "可以运行沙箱空跑外壳",
        "可以校验输入形状",
        "可以校验请求形状",
        "可以校验响应形状",
        "可以模拟控制流",
        "只使用 fixture / 本地结构",
        "不能读取真实 API key",
        "不能连接真实 endpoint",
        "不能发起网络请求",
        "不能返回价格",
        "不能返回 bookingUrl",
        "不能打开预订页",
        "不能付款",
        "不能下单",
        "不能保存证件 / 银行卡"
      ],
      blockedCapabilityLines: [
        "真实 API key：已阻断",
        "真实 endpoint：已阻断",
        "真实网络请求：已阻断",
        "真实价格：已阻断",
        "bookingUrl：已阻断",
        "下单：已阻断",
        "付款：已阻断",
        "身份证 / 银行卡：已阻断"
      ]
    };
  }

  function normalizeFlightSandboxDryRunContract(contract) {
    const raw = contract && typeof contract === "object" ? contract : {};
    return clone({
      sandboxDryRunVersion: String(raw.sandboxDryRunVersion || SANDBOX_DRY_RUN_VERSION),
      phase: String(raw.phase || PHASE),
      dryRunStatus: String(raw.dryRunStatus || DEFAULT_DRY_RUN_STATUS),
      networkMode: String(raw.networkMode || "disabled"),
      apiKeyMode: String(raw.apiKeyMode || "disabled"),
      endpointMode: String(raw.endpointMode || "disabled"),
      providerMode: String(raw.providerMode || "disabled"),
      priceMode: String(raw.priceMode || "disabled"),
      bookingUrlMode: String(raw.bookingUrlMode || "disabled"),
      orderMode: String(raw.orderMode || "disabled"),
      paymentMode: String(raw.paymentMode || "disabled"),
      identityStorageMode: String(raw.identityStorageMode || "disabled"),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      blockedCapabilities: Array.isArray(raw.blockedCapabilities) ? raw.blockedCapabilities.slice() : defaultBlockedCapabilities(),
      steps: Array.isArray(raw.steps) ? raw.steps.slice() : defaultSteps(),
      display: Object.assign(defaultDisplay(), raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function getFlightSandboxDryRunContract(contract) {
    return normalizeFlightSandboxDryRunContract(contract);
  }

  function createFlightSandboxDryRunPlan(input) {
    const safe = normalizeFlightSandboxDryRunContract();
    const blockedCapabilities = Array.isArray(safe.blockedCapabilities) ? safe.blockedCapabilities.slice() : defaultBlockedCapabilities();
    return {
      input: clone(input && typeof input === "object" ? input : { text: String(input || "") }),
      status: "dry_run_plan_only",
      canExecuteNetwork: false,
      reason: "sandbox_dry_run_shell_no_network",
      steps: defaultSteps(),
      blockedCapabilities
    };
  }

  function runFlightSandboxDryRun(input) {
    const blockedCapabilities = defaultBlockedCapabilities();
    return {
      input: clone(input && typeof input === "object" ? input : { text: String(input || "") }),
      status: "dry_run_completed",
      mode: "shell_only",
      reason: "sandbox_dry_run_shell_completed_without_network",
      networkAttempted: false,
      apiKeyRead: false,
      endpointConnected: false,
      providerConnected: false,
      priceReturned: false,
      bookingUrlReturned: false,
      orderCreated: false,
      paymentStarted: false,
      identityStored: false,
      offers: [],
      blockedCapabilities
    };
  }

  function assertNoFlightSandboxNetworkUse(result) {
    const safe = result && typeof result === "object" ? result : {};
    const checks = [
      ["networkAttempted", safe.networkAttempted],
      ["apiKeyRead", safe.apiKeyRead],
      ["endpointConnected", safe.endpointConnected],
      ["providerConnected", safe.providerConnected],
      ["priceReturned", safe.priceReturned],
      ["bookingUrlReturned", safe.bookingUrlReturned],
      ["orderCreated", safe.orderCreated],
      ["paymentStarted", safe.paymentStarted],
      ["identityStored", safe.identityStored]
    ];
    const failed = checks.filter((item) => item[1] !== false);
    if (failed.length > 0) {
      throw new Error("Sandbox Dry Run must remain shell-only without network: " + failed.map((item) => item[0]).join(", "));
    }
    return true;
  }

  function describeFlightSandboxDryRunContract(contract) {
    const safe = normalizeFlightSandboxDryRunContract(contract);
    const display = safe.display || defaultDisplay();
    return {
      sandboxDryRunVersion: safe.sandboxDryRunVersion,
      phase: safe.phase,
      dryRunStatus: safe.dryRunStatus,
      summaryTitle: display.summaryTitle || "Sandbox Dry Run",
      shellStatusLine: display.shellStatusLine || "Sandbox Dry Run：外壳已建立",
      currentStatusLine: display.currentStatusLine || "沙箱空跑外壳已建立，但未连接真实 provider。",
      reasonLine: display.reasonLine || "只允许验证输入、请求和响应结构，不连接真实 endpoint，不读取真实 API key，不返回真实价格，不生成预订链接。",
      stepsTitle: display.stepsTitle || "Dry Run 步骤",
      capabilityTitle: display.capabilityTitle || "当前能力",
      blockedTitle: display.blockedTitle || "阻断能力",
      stepLabels: Array.isArray(display.stepLabels) ? display.stepLabels.slice() : defaultDisplay().stepLabels.slice(),
      capabilityLines: Array.isArray(display.capabilityLines) ? display.capabilityLines.slice() : defaultDisplay().capabilityLines.slice(),
      blockedCapabilityLines: Array.isArray(display.blockedCapabilityLines) ? display.blockedCapabilityLines.slice() : defaultDisplay().blockedCapabilityLines.slice()
    };
  }

  window.WeishanCommerceFlightSandboxDryRun = {
    SANDBOX_DRY_RUN_VERSION,
    PHASE,
    DEFAULT_DRY_RUN_STATUS,
    defaultCapabilities,
    defaultBlockedCapabilities,
    defaultSteps,
    defaultDisplay,
    flightSandboxDryRunContract: normalizeFlightSandboxDryRunContract(),
    getFlightSandboxDryRunContract,
    normalizeFlightSandboxDryRunContract,
    createFlightSandboxDryRunPlan,
    runFlightSandboxDryRun,
    assertNoFlightSandboxNetworkUse,
    describeFlightSandboxDryRunContract
  };
})();
