;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_PROVIDER_SCENARIO_LAB_VERSION = "3.1.0";
  const LAB_NAME = "global_shopping_offline_provider_scenario_lab_v1";

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
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function scenarioCase(caseId, label, status, summary, caveat) {
    return {
      caseId:text(caseId),
      label:text(label),
      status:safeStatus(status),
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
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
  function blockedByCapability(input) {
    const safe = obj(input);
    return safe.network === true ||
      safe.readApiKey === true ||
      safe.realEndpoint === true ||
      safe.useRealEndpoint === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.openExternalNow === true ||
      safe.processRealProviderResponse === true ||
      safe.persistRawTrace === true ||
      safe.persistRawRequest === true ||
      safe.persistRawResponse === true ||
      safe.persistRawUserText === true ||
      safe.bookingUrl ||
      safe.checkoutUrl ||
      safe.paymentUrl ||
      safe.orderUrl ||
      safe.checkout === true ||
      safe.payment === true ||
      safe.order === true ||
      safe.ticketing === true;
  }
  function blockedReasonList(input) {
    const safe = obj(input);
    return [
      safe.network === true ? "network_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.realEndpoint === true || safe.useRealEndpoint === true ? "real_endpoint_detected" : "",
      safe.openExternal === true || safe.windowOpen === true || safe.openExternalNow === true ? "external_open_detected" : "",
      safe.processRealProviderResponse === true ? "real_provider_response_detected" : "",
      safe.persistRawTrace === true ? "raw_trace_persistence_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : "",
      safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_capability_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingOfflineProviderScenarioCases(input) {
    const safe = obj(input);
    const readinessWorkbench = resolveSummary(safe, "providerSandboxReadinessWorkbenchSummary", "WeishanGlobalShoppingProviderSandboxReadinessWorkbench", "buildGlobalShoppingProviderSandboxReadinessWorkbench");
    const offlineRunner = resolveSummary(safe, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    const resultNormalizer = resolveSummary(safe, "mockProviderResultNormalizerSummary", "WeishanGlobalShoppingMockProviderResultNormalizer", "buildGlobalShoppingMockProviderResultNormalizer");
    const blockerMatrix = resolveSummary(safe, "productionBlockerMatrixSummary", "WeishanGlobalShoppingProductionBlockerMatrix", "buildGlobalShoppingProductionBlockerMatrix");
    const list = [
      ["readiness_workbench", "Provider Sandbox Readiness Workbench", readinessWorkbench, "只检查 sandbox readiness，不激活 sandbox。"],
      ["offline_mock_runner", "Offline Mock Sandbox Session Runner", offlineRunner, "只运行 fixture/mock/dry_run 场景，不联网。"],
      ["mock_result_normalizer", "Mock Provider Result Normalizer", resultNormalizer, "只处理 mock 结果摘要，不处理真实 provider response。"],
      ["production_blocker_matrix", "Production Blocker Matrix", blockerMatrix, "只展示阻断条件，不启用 production provider。"]
    ];
    return clone(list.map(function (item) {
      const summary = obj(item[2]);
      const status = !present(summary) ? "needs_review" : (safeStatus(summary.status) === "failed_safe" ? "blocked" : safeStatus(summary.status));
      return scenarioCase(item[0], item[1], status, summaryLabel(summary, item[1] + " 仍需复核"), item[3]);
    }));
  }

  function evaluateGlobalShoppingOfflineProviderScenarioLab(input) {
    const safe = obj(input);
    const scenarioCases = buildGlobalShoppingOfflineProviderScenarioCases(safe);
    const blockedCases = scenarioCases.filter(function (item) { return item.status === "blocked"; });
    const reviewCases = scenarioCases.filter(function (item) { return item.status === "needs_review"; });
    const blockedReasons = blockedReasonList(safe).concat(blockedCases.map(function (item) { return item.caseId + "_blocked"; }));
    const status = blockedReasons.length ? "blocked" : (reviewCases.length ? "needs_review" : "ready");
    return clone({
      labName:LAB_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_SCENARIO_LAB_VERSION,
      status:status,
      scenarioBoundary:{
        labId:"global-shopping-offline-provider-scenario-lab",
        labMode:"offline_scenario_only",
        offlineOnly:true,
        scenarioOnly:true,
        fixtureOnly:true,
        dryRunOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canCallNetwork:false,
        canReadApiKey:false,
        canUseRealEndpoint:false,
        canOpenExternalNow:false,
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
      scenarioSummary:{
        hasReadinessWorkbench:scenarioCases[0].status !== "needs_review",
        hasOfflineMockSandboxSessionRunner:scenarioCases[1].status !== "needs_review",
        hasMockProviderResultNormalizer:scenarioCases[2].status !== "needs_review",
        hasProductionBlockerMatrix:scenarioCases[3].status !== "needs_review",
        scenarioCaseCount:scenarioCases.length,
        passedScenarioCount:scenarioCases.filter(function (item) { return item.status === "ready"; }).length,
        needsReviewScenarioCount:reviewCases.length,
        blockedScenarioCount:blockedCases.length + blockedReasonList(safe).length,
        readyForAdapterSdkSkeleton:status === "ready"
      },
      scenarioCases:scenarioCases,
      rows:buildGlobalShoppingOfflineProviderScenarioRows({
        scenarioCases:scenarioCases,
        status:status,
        userFacingSummary:{
          resultLabel:status === "ready" ? "离线场景实验室已准备" : (status === "blocked" ? "离线场景已阻断" : "离线场景仍需复核")
        }
      }),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"Offline Provider Scenario Lab",
        resultLabel:status === "ready" ? "离线场景实验室已准备" : (status === "blocked" ? "离线场景已阻断" : "离线场景仍需复核"),
        caveat:"该实验室只运行 fixture/mock/dry-run 场景，不联网，不读取密钥，不处理真实 provider response。"
      },
      safety:safety(),
      redacted:true
    });
  }

  function buildGlobalShoppingOfflineProviderScenarioRows(input) {
    const safe = obj(input);
    const scenarioCases = toArray(safe.scenarioCases).length ? toArray(safe.scenarioCases) : buildGlobalShoppingOfflineProviderScenarioCases(safe);
    const status = safeStatus(safe.status || evaluateGlobalShoppingOfflineProviderScenarioLab(safe).status);
    return clone([
      row("offline_scenario_status", "Offline Scenario Lab 状态", obj(safe.userFacingSummary).resultLabel || (status === "ready" ? "离线场景实验室已准备" : "离线场景仍需复核"), status === "ready" ? "pass" : (status === "blocked" ? "blocked" : "warning")),
      row("offline_scenario_boundary", "场景边界", "只运行 fixture/mock/dry_run 场景，不联网、不读密钥、不打开平台。", "pass"),
      row("offline_scenario_persistence", "持久化边界", "不保存 raw trace/request/response/user text，不生成交易 URL。", "pass")
    ].concat(scenarioCases.map(function (item) {
      return row(item.caseId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function runGlobalShoppingOfflineProviderScenarioLab(input) {
    const lab = buildGlobalShoppingOfflineProviderScenarioLab(input || {});
    return clone({
      labName:LAB_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_SCENARIO_LAB_VERSION,
      status:lab.status,
      scenarioSummary:lab.scenarioSummary,
      scenarioCases:lab.scenarioCases,
      rows:lab.rows,
      blockedReasons:lab.blockedReasons,
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
    });
  }

  function buildGlobalShoppingOfflineProviderScenarioLabAuditDraft(input) {
    const lab = buildGlobalShoppingOfflineProviderScenarioLab(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_PROVIDER_SCENARIO_LAB_AUDIT_DRAFT",
      labName:LAB_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_SCENARIO_LAB_VERSION,
      status:lab.status,
      scenarioCaseCount:obj(lab.scenarioSummary).scenarioCaseCount || 0,
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

  function sanitizeGlobalShoppingOfflineProviderScenarioLab(lab) {
    return evaluateGlobalShoppingOfflineProviderScenarioLab(lab || {});
  }

  function buildGlobalShoppingOfflineProviderScenarioLab(input) {
    try {
      return evaluateGlobalShoppingOfflineProviderScenarioLab(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineProviderScenarioLab({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineProviderScenarioLab = {
    GLOBAL_SHOPPING_OFFLINE_PROVIDER_SCENARIO_LAB_VERSION,
    LAB_NAME,
    buildGlobalShoppingOfflineProviderScenarioLab,
    evaluateGlobalShoppingOfflineProviderScenarioLab,
    runGlobalShoppingOfflineProviderScenarioLab,
    buildGlobalShoppingOfflineProviderScenarioRows,
    buildGlobalShoppingOfflineProviderScenarioCases,
    buildGlobalShoppingOfflineProviderScenarioLabAuditDraft,
    sanitizeGlobalShoppingOfflineProviderScenarioLab
  };
})();
