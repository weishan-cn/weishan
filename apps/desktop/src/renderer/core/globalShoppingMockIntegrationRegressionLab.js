;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MOCK_INTEGRATION_REGRESSION_LAB_VERSION = "2.8.0";
  const LAB_NAME = "global_shopping_mock_integration_regression_lab_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function suite(suiteId, label, status, summary, caveat) {
    return { suiteId:text(suiteId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    };
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function summaryLabel(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasonList(input) {
    const safe = obj(input);
    return [
      safe.runRealProvider === true ? "real_provider_run_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.processRealProviderResponse === true ? "real_provider_response_detected" : "",
      safe.persistRawTrace === true ? "raw_trace_persistence_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.generateBookingUrl === true ? "booking_url_generation_detected" : "",
      safe.generateCheckoutUrl === true ? "checkout_url_generation_detected" : "",
      safe.generatePaymentUrl === true ? "payment_url_generation_detected" : "",
      safe.generateOrderUrl === true ? "order_url_generation_detected" : "",
      safe.createRegressionReportFile === true ? "regression_report_file_detected" : "",
      safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_capability_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingMockIntegrationRegressionSuites(input) {
    const safe = obj(input);
    const certificationCenter = resolveSummary(safe, "offlineProviderCertificationCenterSummary", "WeishanGlobalShoppingOfflineProviderCertificationCenter", "buildGlobalShoppingOfflineProviderCertificationCenter");
    const qaMatrix = resolveSummary(safe, "mockSandboxQaMatrixSummary", "WeishanGlobalShoppingMockSandboxQaMatrix", "buildGlobalShoppingMockSandboxQaMatrix");
    const offlineScenarioLab = resolveSummary(safe, "offlineProviderScenarioLabSummary", "WeishanGlobalShoppingOfflineProviderScenarioLab", "buildGlobalShoppingOfflineProviderScenarioLab");
    const offlineMockSandboxSessionRunner = resolveSummary(safe, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    const safetySentinel = present(safe.safetySentinelSummary) ? obj(safe.safetySentinelSummary) : obj(safe.safetyRegressionSummary);
    const list = [
      ["offline_provider_certification_center", "Offline Provider Certification Center", certificationCenter, "只消费离线认证结果，不创建真实认证。"],
      ["mock_sandbox_qa_matrix", "Mock Sandbox QA Matrix", qaMatrix, "只展示离线 QA 结果，不运行真实 provider。"],
      ["offline_provider_scenario_lab", "Offline Provider Scenario Lab", offlineScenarioLab, "只展示离线场景实验，不联网。"],
      ["offline_mock_sandbox_session_runner", "Offline Mock Sandbox Session Runner", offlineMockSandboxSessionRunner, "只运行离线 mock session，不处理真实 response。"],
      ["safety_sentinel", "Safety Sentinel", safetySentinel, "只复核安全红线，不保存 raw trace/request/response。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      let status = !present(summary) ? "needs_review" : safeStatus(summary.status);
      if (item[0] === "safety_sentinel") status = summary.status === "pass" ? "ready" : (summary.status === "fail" || summary.status === "failed_safe" ? "blocked" : "needs_review");
      else if (status === "failed_safe") status = "blocked";
      return suite(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function buildGlobalShoppingMockIntegrationRegressionRows(input) {
    const safe = obj(input);
    const regressionSuites = toArray(safe.regressionSuites).length ? toArray(safe.regressionSuites) : buildGlobalShoppingMockIntegrationRegressionSuites(safe);
    return clone([
      row("mock_integration_regression_lab_status", "Mock Integration Regression Lab 状态", obj(safe.userFacingSummary).resultLabel || "Mock 集成回归仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("mock_integration_regression_lab_boundary", "回归实验室边界", "当前只读、离线、mock，不运行真实 provider，不联网，不读取密钥，不生成报告文件。", "pass")
    ].concat(regressionSuites.map(function (item) {
      return row(item.suiteId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingMockIntegrationRegressionLab(input) {
    const safe = obj(input);
    const regressionSuites = buildGlobalShoppingMockIntegrationRegressionSuites(safe);
    const blockedReasons = blockedReasonList(safe).concat(regressionSuites.filter(function (item) { return item.status === "blocked"; }).map(function (item) { return item.suiteId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (regressionSuites.some(function (item) { return item.status === "needs_review"; }) ? "needs_review" : "ready");
    const lab = {
      labName:LAB_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_INTEGRATION_REGRESSION_LAB_VERSION,
      status:status,
      regressionBoundary:{
        labId:"global-shopping-mock-integration-regression-lab",
        labMode:"regression_only",
        regressionOnly:true,
        offlineOnly:true,
        mockOnly:true,
        dryRunOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canRunRealProvider:false,
        canCallNetwork:false,
        canReadApiKey:false,
        canProcessRealProviderResponse:false,
        canPersistRawTrace:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canPersistRawUserText:false,
        canGenerateBookingUrl:false,
        canGenerateCheckoutUrl:false,
        canGeneratePaymentUrl:false,
        canGenerateOrderUrl:false,
        canCreateRegressionReportFile:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      regressionSummary:{
        hasCertificationCenter:regressionSuites[0].status !== "needs_review",
        hasQaMatrix:regressionSuites[1].status !== "needs_review",
        hasOfflineScenarioLab:regressionSuites[2].status !== "needs_review",
        hasOfflineMockSandboxSessionRunner:regressionSuites[3].status !== "needs_review",
        hasSafetySentinel:regressionSuites[4].status !== "needs_review",
        regressionSuiteCount:regressionSuites.length,
        passedSuiteCount:regressionSuites.filter(function (item) { return item.status === "ready"; }).length,
        needsReviewSuiteCount:regressionSuites.filter(function (item) { return item.status === "needs_review"; }).length,
        blockedSuiteCount:regressionSuites.filter(function (item) { return item.status === "blocked"; }).length,
        readyForHumanApprovalEvidenceBinder:status === "ready"
      },
      regressionSuites:regressionSuites,
      rows:[],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Mock Integration Regression Lab",
        resultLabel:status === "ready" ? "Mock 集成回归实验室已准备" : (status === "blocked" ? "Mock 集成回归已阻断" : "Mock 集成回归仍需复核"),
        caveat:"该实验室只运行离线 mock regression，不运行真实 provider，不联网，不读取密钥，不生成报告文件。"
      },
      safety:safety(),
      redacted:true
    };
    lab.rows = buildGlobalShoppingMockIntegrationRegressionRows(lab);
    return clone(lab);
  }

  function runGlobalShoppingMockIntegrationRegressionLab(input) {
    return buildGlobalShoppingMockIntegrationRegressionLab(input || {});
  }

  function buildGlobalShoppingMockIntegrationRegressionLabAuditDraft(input) {
    const lab = buildGlobalShoppingMockIntegrationRegressionLab(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MOCK_INTEGRATION_REGRESSION_LAB_AUDIT_DRAFT",
      labName:LAB_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_INTEGRATION_REGRESSION_LAB_VERSION,
      status:lab.status,
      regressionSuiteCount:obj(lab.regressionSummary).regressionSuiteCount || 0,
      blockedReasonCount:toArray(lab.blockedReasons).length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingMockIntegrationRegressionLab(lab) {
    return evaluateGlobalShoppingMockIntegrationRegressionLab(lab || {});
  }

  function buildGlobalShoppingMockIntegrationRegressionLab(input) {
    try {
      return evaluateGlobalShoppingMockIntegrationRegressionLab(input || {});
    } catch (_) {
      return evaluateGlobalShoppingMockIntegrationRegressionLab({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingMockIntegrationRegressionLab = {
    GLOBAL_SHOPPING_MOCK_INTEGRATION_REGRESSION_LAB_VERSION,
    LAB_NAME,
    buildGlobalShoppingMockIntegrationRegressionLab,
    evaluateGlobalShoppingMockIntegrationRegressionLab,
    runGlobalShoppingMockIntegrationRegressionLab,
    buildGlobalShoppingMockIntegrationRegressionRows,
    buildGlobalShoppingMockIntegrationRegressionSuites,
    buildGlobalShoppingMockIntegrationRegressionLabAuditDraft,
    sanitizeGlobalShoppingMockIntegrationRegressionLab
  };
})();
