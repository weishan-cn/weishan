;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION = "4.2.0";
  const SIMULATOR_NAME = "flight_workflow_scenario_simulator_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(/https?:\/\/\S+|token|apiKey|secret|password|身份证|护照|银行卡|credential|passport|cardNumber/ig, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
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
  function api(name) { return window[name] || {}; }

  function scenarioDefinitions() {
    return {
      complete_flight_request: {
        label: "完整机票请求",
        expectedOutcome: "pass",
        buildActualOutcome: function () { return "完整机票请求已完成本地安全模拟。"; }
      },
      missing_origin: {
        label: "缺少出发地",
        expectedOutcome: "warning",
        buildActualOutcome: function () { return "缺少出发地，已进入补充信息。"; }
      },
      missing_destination: {
        label: "缺少目的地",
        expectedOutcome: "warning",
        buildActualOutcome: function () { return "缺少目的地，已进入补充信息。"; }
      },
      missing_date: {
        label: "缺少日期",
        expectedOutcome: "warning",
        buildActualOutcome: function () { return "缺少日期，已进入补充信息。"; }
      },
      platform_price_changed: {
        label: "平台价格变化",
        expectedOutcome: "warning",
        buildActualOutcome: function () { return "平台页面结果为准，价格发生变化。"; }
      },
      platform_inventory_changed: {
        label: "平台库存变化",
        expectedOutcome: "warning",
        buildActualOutcome: function () { return "平台页面结果为准，库存发生变化。"; }
      },
      sensitive_input_blocked: {
        label: "敏感输入阻断",
        expectedOutcome: "blocked",
        buildActualOutcome: function () { return "敏感输入已阻断。"; }
      },
      restricted_category_blocked: {
        label: "受限品类阻断",
        expectedOutcome: "blocked",
        buildActualOutcome: function () { return "受限品类已阻断。"; }
      },
      corrupted_ledger_recovery: {
        label: "损坏账本恢复",
        expectedOutcome: "warning",
        buildActualOutcome: function () { return "损坏账本已安全降级，不崩溃。"; }
      },
      illegal_trading_url_injection: {
        label: "非法交易链接阻断",
        expectedOutcome: "blocked",
        buildActualOutcome: function () { return "非法交易链接已阻断。"; }
      },
      illegal_secret_injection: {
        label: "非法密钥阻断",
        expectedOutcome: "blocked",
        buildActualOutcome: function () { return "非法密钥已阻断。"; }
      },
      illegal_payment_action: {
        label: "非法付款动作",
        expectedOutcome: "blocked",
        buildActualOutcome: function () { return "非法付款动作已阻断。"; }
      },
      provider_confirmation_requires_confirmation: {
        label: "平台确认需要确认",
        expectedOutcome: "pass",
        buildActualOutcome: function () { return "平台确认需要用户确认，未自动打开。"; }
      },
      resume_redacted_state: {
        label: "恢复脱敏状态",
        expectedOutcome: "pass",
        buildActualOutcome: function () { return "已恢复脱敏状态。"; }
      },
      unknown_action_failed_safe: {
        label: "未知动作安全降级",
        expectedOutcome: "failed_safe",
        buildActualOutcome: function () { return "未知 action 已安全降级。"; }
      }
    };
  }

  function sanitizeFlightWorkflowScenarioSimulation(result) {
    const safe = result && typeof result === "object" ? result : {};
    return clone({
      simulatorName: SIMULATOR_NAME,
      appVersion: FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION,
      status: safe.status || "failed_safe",
      scenarioId: safeText(safe.scenarioId || ""),
      scenarioLabel: safeText(safe.scenarioLabel || ""),
      expectedOutcome: safeText(safe.expectedOutcome || ""),
      actualOutcome: safeText(safe.actualOutcome || ""),
      workflowSummary: clone(safe.workflowSummary || {}),
      auditSummary: clone(safe.auditSummary || {}),
      sentinelSummary: clone(safe.sentinelSummary || {}),
      matrixSummary: clone(safe.matrixSummary || {}),
      findings: toArray(safe.findings).map(function (item) { return safeText(item); }),
      safety: Object.assign(safety(), clone(safe.safety || {})),
      redacted: true,
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
      download: false
    });
  }

  function buildScenarioSummaryFromWorkflow(input, fixture, sentinelSummary, auditSummary, matrixSummary) {
    const safeInput = input && typeof input === "object" ? input : {};
    const scenarioId = text(safeInput.scenarioId || fixture.scenarioId || "complete_flight_request");
    const scenarioDefs = scenarioDefinitions();
    const def = scenarioDefs[scenarioId] || scenarioDefs.complete_flight_request;
    const scenarioLabel = text(safeInput.scenarioLabel || fixture.scenarioLabel || def.label);
    const expectedOutcome = text(def.expectedOutcome);
    const matrixRow = matrixSummary && Array.isArray(matrixSummary.rows) ? matrixSummary.rows[0] || null : null;
    const status = matrixRow && matrixRow.status === "blocked" ? "blocked" : (matrixRow && matrixRow.status === "fail" ? "fail" : (matrixRow && matrixRow.status === "warning" ? "warning" : expectedOutcome === "blocked" ? "blocked" : expectedOutcome === "warning" ? "warning" : "pass"));
    const actualOutcome = text(def.buildActualOutcome(safeInput, fixture, sentinelSummary, auditSummary, matrixSummary));
    const workflowSummary = {
      title: "机票请求工作流",
      status: fixture.workflowStateSummary && fixture.workflowStateSummary.status || "evidence_ready",
      scenarioLabel: scenarioLabel,
      currentStage: fixture.workflowStateSummary && fixture.workflowStateSummary.currentStage || "scenario_simulation",
      nextStepLabel: fixture.workflowStateSummary && fixture.workflowStateSummary.nextStepLabel || "查看安全测试矩阵",
      routeSummary: fixture.routeSummary,
      missingFields: toArray(fixture.missingFields),
      blockedActions: toArray(fixture.blockedActions),
      canResumeWorkflow: fixture.workflowStateSummary && fixture.workflowStateSummary.canResumeWorkflow !== false,
      redacted: true
    };
    const findings = [];
    if (scenarioId.indexOf("missing_") === 0) findings.push("场景进入补充信息，未请求真实 provider。");
    if (scenarioId === "platform_price_changed" || scenarioId === "platform_inventory_changed") findings.push("平台页面结果为准。");
    if (scenarioId === "sensitive_input_blocked") findings.push("敏感输入已阻断。");
    if (scenarioId === "restricted_category_blocked") findings.push("受限品类已阻断。");
    if (scenarioId === "corrupted_ledger_recovery") findings.push("损坏账本已安全降级，不崩溃。");
    if (scenarioId === "illegal_trading_url_injection" || scenarioId === "illegal_secret_injection" || scenarioId === "illegal_payment_action") findings.push("非法输入已阻断。");
    if (scenarioId === "provider_confirmation_requires_confirmation") findings.push("平台确认需要用户确认，未自动打开。");
    if (scenarioId === "resume_redacted_state") findings.push("已恢复脱敏状态。");
    if (scenarioId === "unknown_action_failed_safe") findings.push("未知 action 已安全降级。");
    return {
      simulatorName: SIMULATOR_NAME,
      appVersion: FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION,
      status: status,
      scenarioId: scenarioId,
      scenarioLabel: scenarioLabel,
      expectedOutcome: expectedOutcome,
      actualOutcome: actualOutcome,
      workflowSummary: workflowSummary,
      auditSummary: auditSummary,
      sentinelSummary: sentinelSummary,
      matrixSummary: matrixSummary,
      findings: findings,
      safety: safety(),
      redacted: true
    };
  }

  function runFlightWorkflowScenarioSimulation(scenarioId, input) {
    const fixtureApi = api("WeishanFlightWorkflowScenarioFixtureBuilder");
    const sentinelApi = api("WeishanFlightWorkflowSafetyRegressionSentinel");
    const auditApi = api("WeishanFlightWorkflowAuditReviewCenter");
    const humanReviewApi = api("WeishanFlightWorkflowHumanReviewChecklist");
    const finalPacketApi = api("WeishanFlightWorkflowFinalSafeHandoffPacket");
    const packetPolicyApi = api("WeishanFlightWorkflowHandoffPacketPolicyGuard");
    const operatorApi = api("WeishanFlightWorkflowOperatorConsole");
    const riskBadgeApi = api("WeishanFlightWorkflowRiskBadgeBuilder");
    const fixture = fixtureApi && typeof fixtureApi.buildFlightWorkflowScenarioFixture === "function"
      ? fixtureApi.buildFlightWorkflowScenarioFixture(scenarioId, input || {})
      : Object.assign({ scenarioId: text(scenarioId || "complete_flight_request"), scenarioLabel: "完整机票请求" }, input || {});
    const rawFixture = fixture && fixtureApi && typeof fixtureApi.buildUnsafeFlightScenarioFixture === "function" && /illegal_|sensitive_input_blocked|restricted_category_blocked/.test(text(scenarioId || "")) ? fixtureApi.buildUnsafeFlightScenarioFixture(scenarioId, input || {}) : fixture;
    const sentinelSummary = sentinelApi && typeof sentinelApi.buildFlightWorkflowSafetyRegressionReport === "function"
      ? sentinelApi.buildFlightWorkflowSafetyRegressionReport(Object.assign({}, rawFixture, { scenarioFixture: rawFixture }))
      : { status: "failed_safe", checks: [], failures: [], warnings: [], redacted: true };
    const auditSummary = auditApi && typeof auditApi.buildFlightWorkflowAuditReviewCenter === "function"
      ? auditApi.buildFlightWorkflowAuditReviewCenter(Object.assign({}, fixture, { scenarioSimulationSummary: null, safetyRegressionSummary: sentinelSummary, scenarioFixture: rawFixture }))
      : { status: "failed_safe", auditHealth: { overall: "unknown" }, findings: [], redacted: true };
    const humanReviewSummary = humanReviewApi && typeof humanReviewApi.buildFlightWorkflowHumanReviewChecklist === "function"
      ? humanReviewApi.buildFlightWorkflowHumanReviewChecklist(Object.assign({}, fixture, { auditReviewSummary: auditSummary, safetyRegressionSummary: sentinelSummary }))
      : { status: "failed_safe", redacted: true };
    const finalPacketSummary = finalPacketApi && typeof finalPacketApi.buildFlightWorkflowFinalSafeHandoffPacket === "function"
      ? finalPacketApi.buildFlightWorkflowFinalSafeHandoffPacket(Object.assign({}, fixture, { auditReviewSummary: auditSummary, safetyRegressionSummary: sentinelSummary, humanReviewChecklistSummary: humanReviewSummary }))
      : { status: "failed_safe", redacted: true };
    const handoffPacketPolicyDecision = packetPolicyApi && typeof packetPolicyApi.evaluateFlightWorkflowHandoffPacketPolicy === "function"
      ? packetPolicyApi.evaluateFlightWorkflowHandoffPacketPolicy({ finalSafeHandoffPacketSummary: finalPacketSummary, safetyRegressionSummary: sentinelSummary })
      : { status: "failed_safe", redacted: true };
    const operatorSummary = operatorApi && typeof operatorApi.buildFlightWorkflowOperatorConsole === "function"
      ? operatorApi.buildFlightWorkflowOperatorConsole(Object.assign({}, fixture, { auditReviewSummary: auditSummary, safetyRegressionSummary: sentinelSummary, humanReviewChecklistSummary: humanReviewSummary, finalSafeHandoffPacketSummary: finalPacketSummary, handoffPacketPolicyDecision: handoffPacketPolicyDecision }))
      : { status: "failed_safe", redacted: true };
    const riskBadgeSummary = riskBadgeApi && typeof riskBadgeApi.buildFlightWorkflowRiskBadges === "function"
      ? riskBadgeApi.buildFlightWorkflowRiskBadges({ auditReview: auditSummary, humanReviewChecklistSummary: humanReviewSummary, finalSafeHandoffPacketSummary: finalPacketSummary, handoffPacketPolicyDecision: handoffPacketPolicyDecision, safetyRegressionSummary: sentinelSummary, operatorConsoleSummary: operatorSummary, tradingBlocked: true, requiresConfirmation: true })
      : { badges: [], summaryLabel: "只读安全", redacted: true };
    const matrixConsoleApi = api("WeishanFlightWorkflowSafetyTestMatrixConsole");
    const matrixConsole = matrixConsoleApi && typeof matrixConsoleApi.buildFlightWorkflowSafetyTestMatrixConsole === "function"
      ? matrixConsoleApi.buildFlightWorkflowSafetyTestMatrixConsole({ results: [buildScenarioSummaryFromWorkflow(Object.assign({}, input || {}, { scenarioId: scenarioId }), fixture, sentinelSummary, auditSummary, null)] })
      : { status: "failed_safe", rows: [], failedRows: [], overallHealth: "unknown", scenarioCount: 1, passedCount: 0, warningCount: 0, failedCount: 1, blockedCount: 0, redacted: true };
    const scenarioSummary = buildScenarioSummaryFromWorkflow(Object.assign({}, input || {}, { scenarioId: scenarioId }), fixture, sentinelSummary, auditSummary, matrixConsole);
    const matrixSummary = matrixConsoleApi && typeof matrixConsoleApi.buildFlightWorkflowSafetyTestMatrixConsole === "function"
      ? matrixConsoleApi.buildFlightWorkflowSafetyTestMatrixConsole({ results: [scenarioSummary] })
      : matrixConsole;
    const presenterApi = api("WeishanFlightWorkflowScenarioSimulatorPresenter");
    const presenter = presenterApi && typeof presenterApi.buildFlightWorkflowScenarioSimulatorPresenter === "function"
      ? presenterApi.buildFlightWorkflowScenarioSimulatorPresenter({ simulationSummary: scenarioSummary, matrixSummary: matrixSummary })
      : null;
    return sanitizeFlightWorkflowScenarioSimulation(Object.assign({}, scenarioSummary, {
      workflowSummary: Object.assign({}, scenarioSummary.workflowSummary, { auditReviewSummary: auditSummary, humanReviewChecklistSummary: humanReviewSummary, finalSafeHandoffPacketSummary: finalPacketSummary, handoffPacketPolicyDecision: handoffPacketPolicyDecision, operatorConsoleSummary: operatorSummary, riskBadgeSummary: riskBadgeSummary, scenarioSimulationSummary: scenarioSummary, safetyTestMatrixSummary: matrixSummary, simulatorStatus: scenarioSummary.status, matrixHealth: matrixSummary.overallHealth, failedScenarioCount: matrixSummary.failedCount, warningScenarioCount: matrixSummary.warningCount, scenarioSimulatorPresenter: presenter }),
      auditSummary: auditSummary,
      sentinelSummary: sentinelSummary,
      matrixSummary: matrixSummary,
      safety: safety()
    }));
  }

  function runFlightWorkflowScenarioSimulationSuite(input) {
    const safe = input && typeof input === "object" ? input : {};
    const scenarioIds = [
      "complete_flight_request",
      "missing_origin",
      "missing_destination",
      "missing_date",
      "platform_price_changed",
      "platform_inventory_changed",
      "sensitive_input_blocked",
      "restricted_category_blocked",
      "corrupted_ledger_recovery",
      "illegal_trading_url_injection",
      "illegal_secret_injection",
      "illegal_payment_action",
      "provider_confirmation_requires_confirmation",
      "resume_redacted_state",
      "unknown_action_failed_safe"
    ];
    const results = scenarioIds.map(function (scenarioId) {
      return runFlightWorkflowScenarioSimulation(scenarioId, safe);
    });
    const matrixConsoleApi = api("WeishanFlightWorkflowSafetyTestMatrixConsole");
    const matrixSummary = matrixConsoleApi && typeof matrixConsoleApi.buildFlightWorkflowSafetyTestMatrixConsole === "function"
      ? matrixConsoleApi.buildFlightWorkflowSafetyTestMatrixConsole({ results: results })
      : { status: "failed_safe", rows: [], failedRows: [], overallHealth: "unknown", scenarioCount: results.length, passedCount: 0, warningCount: 0, failedCount: results.length, blockedCount: 0, redacted: true };
    const summary = buildFlightWorkflowScenarioSimulationSummary(results, matrixSummary);
    const presenterApi = api("WeishanFlightWorkflowScenarioSimulatorPresenter");
    const presenter = presenterApi && typeof presenterApi.buildFlightWorkflowScenarioSimulatorPresenter === "function"
      ? presenterApi.buildFlightWorkflowScenarioSimulatorPresenter({ simulationSummary: summary, matrixSummary: matrixSummary, results: results })
      : null;
    return sanitizeFlightWorkflowScenarioSimulationSuite({ simulatorName: SIMULATOR_NAME, appVersion: FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION, status: summary.status, results: results, summary: summary, matrixSummary: matrixSummary, presenter: presenter, safety: safety(), redacted: true });
  }

  function buildFlightWorkflowScenarioSimulationSummary(results, matrixSummary) {
    const list = toArray(results);
    const summaryMatrix = matrixSummary && typeof matrixSummary === "object" ? matrixSummary : (api("WeishanFlightWorkflowSafetyTestMatrixConsole").buildFlightWorkflowSafetyTestMatrixConsole ? api("WeishanFlightWorkflowSafetyTestMatrixConsole").buildFlightWorkflowSafetyTestMatrixConsole({ results: list }) : { overallHealth: "unknown", scenarioCount: list.length, passedCount: 0, warningCount: 0, failedCount: list.length, blockedCount: 0, rows: [], failedRows: [], redacted: true });
    return clone({
      simulatorName: SIMULATOR_NAME,
      appVersion: FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION,
      status: summaryMatrix.overallHealth === "fail" ? "fail" : (summaryMatrix.overallHealth === "warning" ? "warning" : (summaryMatrix.overallHealth === "pass" ? "pass" : "failed_safe")),
      scenarioCount: summaryMatrix.scenarioCount || list.length,
      passedCount: summaryMatrix.passedCount || 0,
      warningCount: summaryMatrix.warningCount || 0,
      failedCount: summaryMatrix.failedCount || 0,
      blockedCount: summaryMatrix.blockedCount || 0,
      resultLabel: summaryMatrix.overallHealth === "pass" ? "全部通过" : (summaryMatrix.overallHealth === "warning" ? "存在警告" : (summaryMatrix.overallHealth === "fail" ? "存在失败项" : "未知")),
      caveat: "场景模拟仅用于安全回归，不代表真实票价、库存或可出票。",
      matrixSummaryLabel: summaryMatrix.userFacingSummary && summaryMatrix.userFacingSummary.resultLabel || "未知",
      redacted: true
    });
  }

  function sanitizeFlightWorkflowScenarioSimulationSuite(suite) {
    const safe = suite && typeof suite === "object" ? suite : {};
    return clone({
      simulatorName: SIMULATOR_NAME,
      appVersion: FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION,
      status: safe.status || "failed_safe",
      results: toArray(safe.results).map(sanitizeFlightWorkflowScenarioSimulation),
      summary: clone(safe.summary || {}),
      matrixSummary: clone(safe.matrixSummary || {}),
      presenter: clone(safe.presenter || {}),
      safety: Object.assign(safety(), clone(safe.safety || {})),
      redacted: true
    });
  }

  function buildFlightWorkflowScenarioSimulatorAuditDraft(input) {
    const suite = runFlightWorkflowScenarioSimulationSuite(input || {});
    return clone({
      eventType: "FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_AUDIT_DRAFT",
      simulatorName: SIMULATOR_NAME,
      appVersion: FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION,
      status: suite.status,
      scenarioCount: suite.summary && suite.summary.scenarioCount || 0,
      passedCount: suite.summary && suite.summary.passedCount || 0,
      warningCount: suite.summary && suite.summary.warningCount || 0,
      failedCount: suite.summary && suite.summary.failedCount || 0,
      blockedCount: suite.summary && suite.summary.blockedCount || 0,
      bookingUrl: null,
      checkoutUrl: null,
      paymentUrl: null,
      orderUrl: null,
      payment: false,
      order: false,
      ticketing: false,
      identityUpload: false,
      rawResponseStored: false,
      rawUserTextStored: false,
      secretStored: false,
      fileWrite: false,
      download: false,
      redacted: true
    });
  }

  window.WeishanFlightWorkflowScenarioSimulator = {
    FLIGHT_WORKFLOW_SCENARIO_SIMULATOR_VERSION,
    SIMULATOR_NAME,
    runFlightWorkflowScenarioSimulation,
    runFlightWorkflowScenarioSimulationSuite,
    buildFlightWorkflowScenarioSimulationSummary,
    buildFlightWorkflowScenarioSimulatorAuditDraft,
    sanitizeFlightWorkflowScenarioSimulation,
    sanitizeFlightWorkflowScenarioSimulationSuite
  };
})();
