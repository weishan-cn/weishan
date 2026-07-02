;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER_VERSION = "4.0.0";
  const FIXTURE_BUILDER_NAME = "flight_workflow_scenario_fixture_builder_v1";
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig;
  const UNSAFE_TEXT_RE = /token|apiKey|secret|password|sk-|pk-|live_|prod_|身份证|护照|银行卡|https?:\/\//i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function defined(value, fallback) { return value === undefined || value === null ? fallback : value; }
  function safety() {
    return {
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      autoOpen: false,
      autoRefresh: false,
      payment: false,
      order: false,
      ticketing: false,
      identityUpload: false,
      credentialInput: false,
      rawResponseStored: false,
      rawUserTextStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      redacted: true
    };
  }

  function baseFixture(overrides) {
    const safe = overrides && typeof overrides === "object" ? overrides : {};
    const origin = text(defined(safe.origin, "上海"));
    const destination = text(defined(safe.destination, "成都"));
    const departureDate = text(defined(safe.departureDate, "2026-07-15"));
    const dateDisplay = text(defined(safe.dateDisplay, "7 月 15 日"));
    const routeSummary = text(defined(safe.routeSummary, origin + " → " + destination));
    const scenarioId = text(defined(safe.scenarioId, "complete_flight_request"));
    const scenarioLabel = text(defined(safe.scenarioLabel, "完整机票请求"));
    const userInputText = text(defined(safe.userInputText, origin + "到" + destination + "最便宜的直达机票"));
    const flightFields = {
      origin: origin,
      destination: destination,
      date: departureDate,
      dateDisplay: dateDisplay,
      directPreference: text(defined(safe.directPreference, "直达优先")),
      goal: text(defined(safe.goal, "低价优先")),
      restrictedCategory: safe.restrictedCategory === true
    };
    const selectedCandidate = Object.assign({
      quoteId: "scenario-q1",
      providerName: "Airline Official Sandbox Stub",
      responseShape: "airline_official_stub_quote",
      fareSource: "sandbox_read_only_import",
      currency: "CNY",
      baseFare: 860,
      taxesAndFees: 110,
      providerFees: 40,
      totalPrice: 1010,
      safeProviderHandoffReady: true,
      safeProviderHandoffUrl: null,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      identityUpload: false,
      redacted: true
    }, clone(safe.selectedCandidate || {}));
    const topCandidates = toArray(safe.topCandidates).length ? toArray(safe.topCandidates) : [selectedCandidate].map(function (candidate, index) {
      return Object.assign({}, candidate, { rank: index + 1, redacted: true });
    });
    const eventLedgerSummary = Object.assign({
      totalEvents: 3,
      lastActionId: "scenario_loaded",
      lastActionStatus: "executed_local",
      lastActionMessage: "场景已载入",
      recentEvents: [
        { eventType: "scenario_loaded", status: "ready", message: "场景已载入", redacted: true },
        { eventType: "scenario_validated", status: "ready", message: "本地场景校验完成", redacted: true },
        { eventType: "scenario_ready", status: "ready", message: "准备运行本地场景模拟", redacted: true }
      ],
      redacted: true
    }, clone(safe.eventLedgerSummary || {}));
    const actionQueueSummary = Object.assign({
      blockedActions: [],
      availableActions: [{ actionId: "run_read_only_quotes", label: "运行只读报价", enabled: true, requiresUserConfirmation: false, redacted: true }],
      redacted: true
    }, clone(safe.actionQueueSummary || {}));
    const workflowStateSummary = Object.assign({
      status: "evidence_ready",
      workflowId: text(safe.workflowId || "scenario-workflow-" + scenarioId),
      routeSummary: routeSummary,
      departureDate: departureDate,
      currentStage: "scenario_simulation",
      stageLabel: "场景模拟",
      nextStepLabel: "查看安全测试矩阵",
      canResumeWorkflow: true,
      redacted: true
    }, clone(safe.workflowStateSummary || {}));
    const manualPlatformCheckSummary = Object.assign({
      status: "accepted",
      providerName: "Airline Official Sandbox Stub",
      observedCurrency: "CNY",
      observedTotalPrice: 1010,
      observedInventoryStatus: "available",
      observedRulesChanged: false,
      userNote: "",
      safety: safety(),
      redacted: true
    }, clone(safe.manualPlatformCheckSummary || {}));
    const scenarioSimulationSummary = Object.assign({
      scenarioId: scenarioId,
      scenarioLabel: scenarioLabel,
      expectedOutcome: "pass",
      actualOutcome: "本地只读模拟已完成",
      status: "pass",
      findings: [],
      workflowSummary: null,
      auditSummary: null,
      sentinelSummary: null,
      matrixSummary: null,
      safety: safety(),
      redacted: true
    }, clone(safe.scenarioSimulationSummary || {}));
    return Object.assign({
      fixtureName: FIXTURE_BUILDER_NAME,
      appVersion: FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER_VERSION,
      scenarioId: scenarioId,
      scenarioLabel: scenarioLabel,
      routeSummary: routeSummary,
      origin: origin,
      destination: destination,
      departureDate: departureDate,
      dateDisplay: dateDisplay,
      directPreference: text(defined(safe.directPreference, "直达优先")),
      sortLabel: text(defined(safe.sortLabel, "低价优先")),
      userInputText: userInputText,
      userIntentText: userInputText,
      workflowUserMessage: text(defined(safe.workflowUserMessage, "")),
      flightFields: flightFields,
      topCandidates: topCandidates,
      selectedCandidate: selectedCandidate,
      missingFields: toArray(safe.missingFields).map(safeText),
      blockedActions: toArray(safe.blockedActions).map(safeText),
      clarificationQuestions: toArray(safe.clarificationQuestions).map(safeText),
      eventLedgerSummary: eventLedgerSummary,
      actionQueueSummary: actionQueueSummary,
      workflowStateSummary: workflowStateSummary,
      manualPlatformCheckSummary: manualPlatformCheckSummary,
      safety: safety(),
      scenarioSimulationSummary: scenarioSimulationSummary,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      ticketing: false,
      identityUpload: false,
      credentialInput: false,
      rawResponseStored: false,
      rawUserTextStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      redacted: true
    }, clone(safe.extra || {}));
  }

  function sanitizeFlightWorkflowScenarioFixture(fixture) {
    if (fixture == null || typeof fixture !== "object") return typeof fixture === "string" ? safeText(fixture) : fixture;
    const safe = fixture && typeof fixture === "object" ? fixture : {};
    const result = {};
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (/(bookingUrl|checkoutUrl|paymentUrl|orderUrl|token|apiKey|secret|password|rawProviderResponse|rawResponse|rawPayload|rawText|rawUserText|rawInput)/i.test(key)) return;
      if (typeof value === "string" && UNSAFE_TEXT_RE.test(value)) {
        result[key] = safeText(value);
        return;
      }
      if (Array.isArray(value)) {
        result[key] = value.map(function (item) {
          return sanitizeFlightWorkflowScenarioFixture(item);
        });
        return;
      }
      if (value && typeof value === "object") {
        result[key] = sanitizeFlightWorkflowScenarioFixture(value);
        return;
      }
      result[key] = value;
    });
    result.bookingUrl = null;
    result.checkoutUrl = null;
    result.paymentUrl = null;
    result.orderUrl = null;
    result.payment = false;
    result.order = false;
    result.ticketing = false;
    result.identityUpload = false;
    result.credentialInput = false;
    result.rawResponseStored = false;
    result.rawUserTextStored = false;
    result.secretStored = false;
    result.fileWrite = false;
    result.download = false;
    result.redacted = true;
    return clone(result);
  }

  function buildCompleteFlightScenarioFixture(overrides) {
    return sanitizeFlightWorkflowScenarioFixture(baseFixture(Object.assign({
      scenarioId: "complete_flight_request",
      scenarioLabel: "完整机票请求"
    }, overrides || {})));
  }

  function buildUnsafeFlightScenarioFixture(scenarioId, overrides) {
    const base = baseFixture(Object.assign({
      scenarioId: text(scenarioId || "illegal_trading_url_injection"),
      scenarioLabel: text((overrides || {}).scenarioLabel || "非法输入场景")
    }, overrides || {}));
    const unsafe = Object.assign({}, base, {
      bookingUrl: "https://blocked.example/book",
      checkoutUrl: "https://blocked.example/checkout",
      paymentUrl: "https://blocked.example/pay",
      orderUrl: "https://blocked.example/order",
      token: "sk-live-blocked",
      apiKey: "pk_live_blocked",
      secret: "SECRET",
      rawProviderResponse: { token: "sk-live-blocked", bookingUrl: "https://blocked.example/book" },
      rawUserText: "身份证 123456789012345678",
      rawText: "secret",
      rawInput: "token=blocked",
      payment: true,
      order: true,
      ticketing: true,
      identityUpload: true,
      credentialInput: true,
      rawResponseStored: true,
      rawUserTextStored: true,
      secretStored: true,
      fileWrite: true,
      download: true,
      autoOpen: true,
      autoRefresh: true
    });
    return sanitizeFlightWorkflowScenarioFixture(unsafe);
  }

  function buildFlightWorkflowScenarioFixture(scenarioId, overrides) {
    const id = text(scenarioId || "complete_flight_request");
    const safeOverrides = overrides && typeof overrides === "object" ? overrides : {};
    if (id === "complete_flight_request") return buildCompleteFlightScenarioFixture(safeOverrides);
    if (id === "missing_origin") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "缺少出发地", origin: "", missingFields: ["origin"], workflowUserMessage: "请补充出发地。" }));
    if (id === "missing_destination") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "缺少目的地", destination: "", missingFields: ["destination"], workflowUserMessage: "请补充目的地。" }));
    if (id === "missing_date") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "缺少日期", departureDate: "", dateDisplay: "", missingFields: ["departureDate"], workflowUserMessage: "请补充出发日期。" }));
    if (id === "platform_price_changed") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "平台价格变化", manualPlatformCheckSummary: Object.assign({}, baseFixture().manualPlatformCheckSummary, { observedTotalPrice: 1038, observedRulesChanged: true, observedInventoryStatus: "changed", userNote: "平台页面结果为准" }), workflowUserMessage: "平台页面结果为准。价格发生变化。" }));
    if (id === "platform_inventory_changed") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "平台库存变化", manualPlatformCheckSummary: Object.assign({}, baseFixture().manualPlatformCheckSummary, { observedInventoryStatus: "sold_out", observedRulesChanged: true, userNote: "平台库存发生变化" }), workflowUserMessage: "平台页面结果为准。库存发生变化。" }));
    if (id === "sensitive_input_blocked") return buildUnsafeFlightScenarioFixture(id, Object.assign({}, safeOverrides, { scenarioLabel: "敏感输入阻断", userInputText: "apiKey=SECRET 身份证 123456789012345678 银行卡 4111111111111111" }));
    if (id === "restricted_category_blocked") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "受限品类阻断", restrictedCategory: true, workflowStateSummary: Object.assign({}, baseFixture().workflowStateSummary, { status: "blocked", stageLabel: "受限品类阻断" }), blockedActions: ["付款", "下单", "出票"], userInputText: "帮我买枪", workflowUserMessage: "受限品类已阻断。" }));
    if (id === "corrupted_ledger_recovery") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "损坏账本恢复", eventLedgerSummary: Object.assign({}, baseFixture().eventLedgerSummary, { totalEvents: 0, recentEvents: [], lastActionId: "", lastActionStatus: "corrupted", lastActionMessage: "损坏账本已安全降级" }), workflowUserMessage: "损坏账本已安全降级，不崩溃。" }));
    if (id === "illegal_trading_url_injection") return buildUnsafeFlightScenarioFixture(id, Object.assign({}, safeOverrides, { scenarioLabel: "非法交易链接阻断" }));
    if (id === "illegal_secret_injection") return buildUnsafeFlightScenarioFixture(id, Object.assign({}, safeOverrides, { scenarioLabel: "非法密钥阻断", userInputText: "token=blocked secret=blocked" }));
    if (id === "illegal_payment_action") return buildUnsafeFlightScenarioFixture(id, Object.assign({}, safeOverrides, { scenarioLabel: "非法付款动作", payment: true, order: true, ticketing: true, autoOpen: false }));
    if (id === "provider_confirmation_requires_confirmation") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "平台确认需要确认", workflowUserMessage: "需要用户确认后再前往平台。", manualPlatformCheckSummary: Object.assign({}, baseFixture().manualPlatformCheckSummary, { observedRulesChanged: false }), selectedCandidate: Object.assign({}, baseFixture().selectedCandidate, { safeProviderHandoffUrl: "https://blocked.example/confirm" }) }));
    if (id === "resume_redacted_state") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "恢复脱敏状态", workflowUserMessage: "已恢复脱敏状态。", userInputText: "恢复最近一次脱敏状态" }));
    if (id === "unknown_action_failed_safe") return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: "未知动作安全降级", workflowUserMessage: "未知 action 已安全降级。" }));
    return buildCompleteFlightScenarioFixture(Object.assign({}, safeOverrides, { scenarioId: id, scenarioLabel: text(safeOverrides.scenarioLabel || id || "完整机票请求") }));
  }

  function buildFlightWorkflowScenarioFixtureBuilderAuditDraft(input) {
    const fixture = buildFlightWorkflowScenarioFixture(input && input.scenarioId || "complete_flight_request", input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER_AUDIT_DRAFT",
      fixtureBuilderName: FIXTURE_BUILDER_NAME,
      appVersion: FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER_VERSION,
      scenarioId: fixture.scenarioId,
      scenarioLabel: fixture.scenarioLabel,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      ticketing: false,
      identityUpload: false,
      credentialInput: false,
      rawResponseStored: false,
      rawUserTextStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      redacted: true
    });
  }

  window.WeishanFlightWorkflowScenarioFixtureBuilder = {
    FLIGHT_WORKFLOW_SCENARIO_FIXTURE_BUILDER_VERSION,
    FIXTURE_BUILDER_NAME,
    buildFlightWorkflowScenarioFixture,
    buildCompleteFlightScenarioFixture,
    buildUnsafeFlightScenarioFixture,
    sanitizeFlightWorkflowScenarioFixture,
    buildFlightWorkflowScenarioFixtureBuilderAuditDraft
  };
})();
