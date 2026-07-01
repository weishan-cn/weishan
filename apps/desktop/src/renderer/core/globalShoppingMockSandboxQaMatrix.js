;(function () {
  "use strict";

  const GLOBAL_SHOPPING_MOCK_SANDBOX_QA_MATRIX_VERSION = "3.8.0";
  const MATRIX_NAME = "global_shopping_mock_sandbox_qa_matrix_v1";

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
  function category(categoryId, label, status, summary, caveat) {
    return { categoryId:text(categoryId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.runRealProvider === true ? "real_provider_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.processRealProviderResponse === true ? "real_provider_response_detected" : "",
      safe.persistRawTrace === true ? "raw_trace_persistence_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : "",
      safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_capability_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingMockSandboxQaCategories(input) {
    const safe = obj(input);
    const contractKit = resolveSummary(safe, "offlineProviderAdapterContractKitSummary", "WeishanGlobalShoppingOfflineProviderAdapterContractKit", "buildGlobalShoppingOfflineProviderAdapterContractKit");
    const scenarioLab = resolveSummary(safe, "offlineProviderScenarioLabSummary", "WeishanGlobalShoppingOfflineProviderScenarioLab", "buildGlobalShoppingOfflineProviderScenarioLab");
    const offlineRunner = resolveSummary(safe, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    const resultNormalizer = resolveSummary(safe, "mockProviderResultNormalizerSummary", "WeishanGlobalShoppingMockProviderResultNormalizer", "buildGlobalShoppingMockProviderResultNormalizer");
    const safetySentinel = resolveSummary(safe, "safetySentinelSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport");
    const list = [
      ["adapter_contract_kit", "Offline Provider Adapter Contract Kit", contractKit, "只检查离线 adapter 合同，不生成真实 SDK。"],
      ["offline_scenario_lab", "Offline Provider Scenario Lab", scenarioLab, "只检查离线 mock 场景，不联网。"],
      ["offline_mock_runner", "Offline Mock Sandbox Session Runner", offlineRunner, "只检查离线 mock session runner。"],
      ["mock_result_normalizer", "Mock Provider Result Normalizer", resultNormalizer, "只检查 mock 结果摘要，不处理真实 response。"],
      ["safety_sentinel", "Safety Sentinel", safetySentinel, "只检查安全红线，不保存 raw trace/request/response/user text。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      let status = !present(summary) ? "needs_review" : (safeStatus(summary.status) === "failed_safe" ? "blocked" : safeStatus(summary.status));
      if (item[0] === "safety_sentinel" && present(summary)) status = summary.status === "pass" ? "ready" : (summary.status === "warning" ? "needs_review" : "blocked");
      return category(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function buildGlobalShoppingMockSandboxQaRows(input) {
    const safe = obj(input);
    const qaCategories = toArray(safe.qaCategories).length ? toArray(safe.qaCategories) : buildGlobalShoppingMockSandboxQaCategories(safe);
    return clone([
      row("mock_sandbox_qa_matrix_status", "Mock Sandbox QA Matrix 状态", obj(safe.userFacingSummary).resultLabel || "Mock Sandbox QA 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("mock_sandbox_qa_matrix_boundary", "QA 矩阵边界", "当前只读、离线、mock，不运行真实 provider，不联网，不读取密钥。", "pass")
    ].concat(qaCategories.map(function (item) {
      return row(item.categoryId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingMockSandboxQaMatrix(input) {
    const safe = obj(input);
    const qaCategories = buildGlobalShoppingMockSandboxQaCategories(safe);
    const blockedReasons = blockedReasonList(safe).concat(qaCategories.filter(function (item) { return item.status === "blocked"; }).map(function (item) { return item.categoryId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (qaCategories.some(function (item) { return item.status === "needs_review"; }) ? "needs_review" : "ready");
    const matrix = {
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_SANDBOX_QA_MATRIX_VERSION,
      status:status,
      qaBoundary:{
        matrixId:"global-shopping-mock-sandbox-qa-matrix",
        matrixMode:"qa_matrix_only",
        qaMatrixOnly:true,
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
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false
      },
      qaSummary:{
        hasAdapterContractKit:qaCategories[0].status !== "needs_review",
        hasOfflineScenarioLab:qaCategories[1].status !== "needs_review",
        hasOfflineMockSandboxSessionRunner:qaCategories[2].status !== "needs_review",
        hasMockProviderResultNormalizer:qaCategories[3].status !== "needs_review",
        hasSafetySentinel:qaCategories[4].status !== "needs_review",
        qaCategoryCount:qaCategories.length,
        passedCategoryCount:qaCategories.filter(function (item) { return item.status === "ready"; }).length,
        needsReviewCategoryCount:qaCategories.filter(function (item) { return item.status === "needs_review"; }).length,
        blockedCategoryCount:qaCategories.filter(function (item) { return item.status === "blocked"; }).length,
        readyForHumanActivationRunbook:status === "ready"
      },
      qaCategories:qaCategories,
      rows:[],
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Mock Sandbox QA Matrix",
        resultLabel:status === "ready" ? "Mock Sandbox QA 矩阵已准备" : (status === "blocked" ? "Mock Sandbox QA 已阻断" : "Mock Sandbox QA 仍需复核"),
        caveat:"该 QA 矩阵只覆盖离线 mock sandbox，不运行真实 provider，不联网，不读取密钥。"
      },
      safety:safety(),
      redacted:true
    };
    matrix.rows = buildGlobalShoppingMockSandboxQaRows(matrix);
    return clone(matrix);
  }

  function buildGlobalShoppingMockSandboxQaMatrixAuditDraft(input) {
    const matrix = buildGlobalShoppingMockSandboxQaMatrix(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_MOCK_SANDBOX_QA_MATRIX_AUDIT_DRAFT",
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_MOCK_SANDBOX_QA_MATRIX_VERSION,
      status:matrix.status,
      qaCategoryCount:obj(matrix.qaSummary).qaCategoryCount || 0,
      blockedReasonCount:toArray(matrix.blockedReasons).length,
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

  function sanitizeGlobalShoppingMockSandboxQaMatrix(matrix) {
    return evaluateGlobalShoppingMockSandboxQaMatrix(matrix || {});
  }

  function buildGlobalShoppingMockSandboxQaMatrix(input) {
    try {
      return evaluateGlobalShoppingMockSandboxQaMatrix(input || {});
    } catch (_) {
      return evaluateGlobalShoppingMockSandboxQaMatrix({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingMockSandboxQaMatrix = {
    GLOBAL_SHOPPING_MOCK_SANDBOX_QA_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingMockSandboxQaMatrix,
    evaluateGlobalShoppingMockSandboxQaMatrix,
    buildGlobalShoppingMockSandboxQaRows,
    buildGlobalShoppingMockSandboxQaCategories,
    buildGlobalShoppingMockSandboxQaMatrixAuditDraft,
    sanitizeGlobalShoppingMockSandboxQaMatrix
  };
})();
