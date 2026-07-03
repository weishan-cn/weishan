;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MANUAL_QA_SCENARIO_RUNNER_VERSION = "4.1.4";
  const RUNNER_NAME = "global_shopping_manual_qa_scenario_runner_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, manual_qa_scenario_runner_only:true };
  const REQUIRED_SCENARIOS = [
    "flight_readonly_search",
    "hotel_readonly_search",
    "product_readonly_search",
    "restricted_category_block",
    "feedback_draft_disabled",
    "no_transaction_boundary",
    "no_provider_boundary"
  ];
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish/i;
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function card(cardId, label, value) {
    return { cardId:text(cardId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "manual_qa_scenario_runner_only");
    return ALLOWED_MODES[mode] ? mode : "manual_qa_scenario_runner_only";
  }
  function baseScenarios() {
    return [
      {
        scenarioId:"flight_readonly_search",
        scenarioLabel:"Flight readonly search",
        inputExample:"帮我看下上海到东京的只读候选价",
        expectedVisibleSections:["候选价证据", "只读候选价", "费用归一化"],
        expectedBlockedCapabilities:["provider", "network", "payment"],
        manualReviewRequired:true
      },
      {
        scenarioId:"hotel_readonly_search",
        scenarioLabel:"Hotel readonly search",
        inputExample:"查看东京酒店只读候选结果",
        expectedVisibleSections:["Hotel 候选结果", "只读对比", "风险说明"],
        expectedBlockedCapabilities:["provider", "network", "order"],
        manualReviewRequired:true
      },
      {
        scenarioId:"product_readonly_search",
        scenarioLabel:"Product readonly search",
        inputExample:"查看相机全球购只读候选结果",
        expectedVisibleSections:["Product 候选结果", "官方价锚点", "费用归一化"],
        expectedBlockedCapabilities:["provider", "network", "checkout"],
        manualReviewRequired:true
      },
      {
        scenarioId:"restricted_category_block",
        scenarioLabel:"Restricted category block",
        inputExample:"帮我买处方药",
        expectedVisibleSections:["Restricted 场景", "用户边界确认", "Manual Review Required"],
        expectedBlockedCapabilities:["provider", "transaction"],
        manualReviewRequired:true
      },
      {
        scenarioId:"feedback_draft_disabled",
        scenarioLabel:"Feedback draft disabled",
        inputExample:"我要直接提交反馈给平台",
        expectedVisibleSections:["Feedback Review", "Manual Review Required"],
        expectedBlockedCapabilities:["feedback send", "upload", "external form"],
        manualReviewRequired:true
      },
      {
        scenarioId:"no_transaction_boundary",
        scenarioLabel:"No transaction boundary",
        inputExample:"现在直接帮我付款下单",
        expectedVisibleSections:["No-Transaction Evidence", "Locked Capabilities"],
        expectedBlockedCapabilities:["payment", "order", "ticketing"],
        manualReviewRequired:true
      },
      {
        scenarioId:"no_provider_boundary",
        scenarioLabel:"No provider boundary",
        inputExample:"直接接入真实 provider 返回价格",
        expectedVisibleSections:["No Provider", "Locked Capabilities"],
        expectedBlockedCapabilities:["provider", "network", "endpoint"],
        manualReviewRequired:true
      }
    ];
  }
  function blockedReasons(input, scenarios) {
    const safe = obj(input);
    const blocked = [];
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.rawUserTextPersistence === true || safe.rawUserText === true) blocked.push("raw user text persistence");
    if (safe.uploadScreenshot === true || safe.screenshotUpload === true) blocked.push("screenshot upload");
    if (safe.feedbackSent === true || safe.feedbackEnabled === true) blocked.push("feedback send");
    if (safe.externalForm === true || safe.externalFormUrl != null) blocked.push("external form");
    if (SECRET_VALUE_RE.test(JSON.stringify(safe))) blocked.push("secret leak");
    ["status", "summary", "title"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("auto release language");
    });
    toArray(scenarios).forEach(function (scenario) {
      const item = obj(scenario);
      if (item.provider === true || item.realProvider === true) blocked.push("provider");
      if (item.network === true || item.fetch === true) blocked.push("network");
      if (item.key === true || item.readApiKey === true) blocked.push("key");
      if (item.endpoint === true || item.generateEndpoint === true) blocked.push("endpoint");
      if (item.externalOpen === true || item.openExternal === true || item.windowOpen === true || item["window.open"] === true) blocked.push("external");
      if (item.payment === true || item.authorizePayment === true) blocked.push("payment");
      if (item.order === true || item.createOrder === true) blocked.push("order");
      if (item.ticketing === true || item.issueTicket === true) blocked.push("ticketing");
      if (item.rawUserTextPersistence === true || item.rawUserText === true) blocked.push("raw user text persistence");
      if (item.uploadScreenshot === true || item.screenshotUpload === true) blocked.push("screenshot upload");
      if (item.feedbackSent === true || item.feedbackEnabled === true) blocked.push("feedback send");
      if (item.externalForm === true || item.externalFormUrl != null) blocked.push("external form");
    });
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function normalizeScenario(input) {
    const safe = obj(input);
    return {
      scenarioId:text(safe.scenarioId),
      scenarioLabel:text(safe.scenarioLabel),
      inputExample:text(safe.inputExample),
      expectedVisibleSections:toArray(safe.expectedVisibleSections).map(function (item) { return text(item); }).filter(Boolean),
      expectedBlockedCapabilities:toArray(safe.expectedBlockedCapabilities).map(function (item) { return text(item); }).filter(Boolean),
      manualReviewRequired:safe.manualReviewRequired !== false,
      redacted:true
    };
  }

  function evaluateGlobalShoppingManualQaScenarioRunner(input) {
    const safe = obj(input);
    const scenarios = toArray(safe.scenarios).length ? toArray(safe.scenarios).map(normalizeScenario) : baseScenarios();
    const byId = {};
    scenarios.forEach(function (scenario) { byId[scenario.scenarioId] = scenario; });
    const missingRestricted = !byId.restricted_category_block;
    const missingNoTransaction = !byId.no_transaction_boundary;
    const missingNoProvider = !byId.no_provider_boundary;
    const missingAnyRequired = REQUIRED_SCENARIOS.some(function (id) { return !byId[id]; });
    const blocked = blockedReasons(safe, scenarios);
    const status = blocked.length
      ? "blocked"
      : (missingAnyRequired || missingRestricted || missingNoTransaction || missingNoProvider ? "needs_review" : "ready");
    return clone({
      runnerName:RUNNER_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_QA_SCENARIO_RUNNER_VERSION,
      runnerMode:safeMode(safe.runnerMode),
      status,
      title:"Manual QA Scenario Runner",
      scenarios:scenarios,
      scenarioCoverage:REQUIRED_SCENARIOS.filter(function (id) { return byId[id]; }),
      blockedCapabilities:blocked,
      manualReviewRequired:true,
      userFacingSummary:{
        title:"Manual QA Scenario Runner",
        resultLabel:status === "ready" ? "Manual QA Scenario Runner 已准备" : (status === "blocked" ? "Manual QA Scenario Runner 已阻断" : "Manual QA Scenario Runner 仍需复核"),
        caveat:"只生成人工 QA 场景清单，不执行外部动作、不上传截图、不创建订单。"
      },
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingManualQaScenarioRows(input) {
    const safe = evaluateGlobalShoppingManualQaScenarioRunner(input || {});
    return clone([
      row("manual_qa_scenario_runner", "Manual QA Scenario Runner", safe.userFacingSummary.resultLabel, safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("manual_qa_scenario_coverage", "Scenario Coverage", "Flight / Hotel / Product / Restricted / Feedback / No-Transaction / No-Provider 场景已覆盖", safe.status === "blocked" ? "blocked" : "warning"),
      row("manual_qa_scenario_review", "Manual Review Required", "下一步只能人工复核或继续测试", "warning")
    ].concat(safe.scenarios.map(function (scenario) {
      return row(
        "manual_qa_scenario_" + scenario.scenarioId,
        scenario.scenarioLabel,
        scenario.inputExample,
        scenario.manualReviewRequired ? "warning" : "pass"
      );
    })));
  }

  function buildGlobalShoppingManualQaScenarioCards(input) {
    const safe = evaluateGlobalShoppingManualQaScenarioRunner(input || {});
    return clone(safe.scenarios.map(function (scenario) {
      return card(scenario.scenarioId, scenario.scenarioLabel, scenario.expectedVisibleSections.join(" / "));
    }));
  }

  function buildGlobalShoppingManualQaScenarioRunnerAuditDraft(input) {
    const safe = evaluateGlobalShoppingManualQaScenarioRunner(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MANUAL_QA_SCENARIO_RUNNER_AUDIT_DRAFT",
      runnerName:RUNNER_NAME,
      appVersion:GLOBAL_SHOPPING_MANUAL_QA_SCENARIO_RUNNER_VERSION,
      status:safe.status,
      scenarioCount:safe.scenarios.length,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingManualQaScenarioRunner(runner) {
    const safe = evaluateGlobalShoppingManualQaScenarioRunner(runner || {});
    safe.rows = buildGlobalShoppingManualQaScenarioRows(safe);
    safe.cards = buildGlobalShoppingManualQaScenarioCards(safe);
    return safe;
  }

  function buildGlobalShoppingManualQaScenarioRunner(input) {
    try {
      return sanitizeGlobalShoppingManualQaScenarioRunner(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingManualQaScenarioRunner({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingManualQaScenarioRunner = {
    GLOBAL_SHOPPING_MANUAL_QA_SCENARIO_RUNNER_VERSION,
    RUNNER_NAME,
    buildGlobalShoppingManualQaScenarioRunner,
    evaluateGlobalShoppingManualQaScenarioRunner,
    buildGlobalShoppingManualQaScenarioRows,
    buildGlobalShoppingManualQaScenarioCards,
    buildGlobalShoppingManualQaScenarioRunnerAuditDraft,
    sanitizeGlobalShoppingManualQaScenarioRunner
  };
})();
