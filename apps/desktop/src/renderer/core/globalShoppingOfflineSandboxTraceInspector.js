;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR_VERSION = "4.0.0";
  const INSPECTOR_NAME = "global_shopping_offline_sandbox_trace_inspector_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function section(sectionId, label, status, summary, caveat) {
    return {
      sectionId:text(sectionId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
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
    }, obj(overrides));
  }
  function normalize(summary) {
    const status = statusOf(summary);
    if (!present(summary)) return "needs_review";
    if (status === "blocked" || status === "failed_safe" || status === "fail") return "blocked";
    if (status === "ready" || status === "pass" || status === "clear" || status === "approved" || status === "allowed") return "pass";
    return "warning";
  }

  function buildGlobalShoppingOfflineSandboxTraceSections(input) {
    const safe = obj(input);
    const offlineMockSandboxSessionRunnerSummary = resolveSummary(safe, "offlineMockSandboxSessionRunnerSummary", "WeishanGlobalShoppingOfflineMockSandboxSessionRunner", "buildGlobalShoppingOfflineMockSandboxSessionRunner");
    const readOnlySandboxActivationReadinessCenterSummary = resolveSummary(safe, "readOnlySandboxActivationReadinessCenterSummary", "WeishanGlobalShoppingReadOnlySandboxActivationReadinessCenter", "buildGlobalShoppingReadOnlySandboxActivationReadinessCenter");
    const manualProviderActivationHandoffPacketSummary = resolveSummary(safe, "manualProviderActivationHandoffPacketSummary", "WeishanGlobalShoppingManualProviderActivationHandoffPacket", "buildGlobalShoppingManualProviderActivationHandoffPacket");
    return clone([
      section("offline_mock_runner", "离线 Mock Sandbox 会话运行器", normalize(offlineMockSandboxSessionRunnerSummary), labelOf(offlineMockSandboxSessionRunnerSummary, "离线 Mock 会话仍需复核"), "只检查离线 mock trace summary，不保存 raw trace。"),
      section("activation_readiness_center", "只读 Sandbox 激活准备中心", normalize(readOnlySandboxActivationReadinessCenterSummary), labelOf(readOnlySandboxActivationReadinessCenterSummary, "Sandbox 激活准备仍需复核"), "只检查准备状态，不激活 sandbox。"),
      section("manual_activation_handoff_packet", "人工 Provider 激活交接包", normalize(manualProviderActivationHandoffPacketSummary), labelOf(manualProviderActivationHandoffPacketSummary, "人工激活交接仍需复核"), "只检查脱敏 handoff summary，不创建任务。")
    ]);
  }

  function buildGlobalShoppingOfflineSandboxTraceRows(input) {
    const safe = obj(input);
    const evaluation = Array.isArray(safe.traceSections) ? {
      traceSections:safe.traceSections.slice(),
      traceSummary:obj(safe.traceSummary),
      status:text(safe.status || "needs_review"),
      userFacingSummary:obj(safe.userFacingSummary)
    } : evaluateGlobalShoppingOfflineSandboxTraceInspector(input);
    return clone([
      row("trace_inspector_status", "离线 Trace 检查状态", obj(evaluation.userFacingSummary).resultLabel || "离线 Trace 检查仍需复核", evaluation.status === "ready" ? "pass" : (evaluation.status === "blocked" ? "blocked" : "warning")),
      row("trace_mode", "Trace 检查模式", "trace_summary_only / offline_mock / dry_run", "pass"),
      row("trace_boundary", "检查边界", "只查看脱敏 trace summary，不保存 raw trace，不联网，不读取密钥。", "pass")
    ].concat(toArray(evaluation.traceSections).map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "pass" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineSandboxTraceInspector(input) {
    const safe = obj(input);
    const traceSections = buildGlobalShoppingOfflineSandboxTraceSections(safe);
    const blockedBoundary =
      safe.persistRawTrace === true ||
      safe.persistRawRequest === true ||
      safe.persistRawResponse === true ||
      safe.persistRawUserText === true ||
      safe.readApiKey === true ||
      safe.network === true ||
      safe.openExternal === true ||
      safe.windowOpen === true ||
      safe.openExternalNow === true ||
      safe.generateEndpoint === true ||
      safe.bookingUrl ||
      safe.checkoutUrl ||
      safe.paymentUrl ||
      safe.orderUrl;
    const blockedTraceSections = traceSections.filter(function (item) { return item.status === "blocked"; });
    const missingTraceSections = traceSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = blockedBoundary || blockedTraceSections.length ? "blocked" : (missingTraceSections.length ? "needs_review" : "ready");
    const traceSummary = {
      hasOfflineMockSandboxSessionRunner:traceSections[0].status === "pass",
      hasActivationReadinessCenter:traceSections[1].status === "pass",
      hasManualActivationHandoffPacket:traceSections[2].status === "pass",
      traceSectionCount:traceSections.length,
      missingTraceSectionCount:missingTraceSections.length,
      blockedTraceSectionCount:blockedTraceSections.length,
      readyForMockResultNormalization:status === "ready"
    };
    return clone({
      inspectorName:INSPECTOR_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR_VERSION,
      status:status,
      title:"离线 Sandbox Trace 检查器",
      traceBoundary:{
        inspectorId:"global-shopping-offline-sandbox-trace-inspector",
        inspectorMode:"trace_summary_only",
        traceSummaryOnly:true,
        offlineOnly:true,
        mockOnly:true,
        dryRunOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canPersistRawTrace:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false,
        canPersistRawUserText:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canOpenExternalNow:false,
        canGenerateEndpoint:false,
        canGenerateBookingUrl:false,
        canGenerateCheckoutUrl:false,
        canGeneratePaymentUrl:false,
        canGenerateOrderUrl:false
      },
      traceSummary:traceSummary,
      traceSections:traceSections,
      traceHealth:{
        noRawTracePersistence:safe.persistRawTrace !== true,
        noRawRequestPersistence:safe.persistRawRequest !== true,
        noRawResponsePersistence:safe.persistRawResponse !== true,
        noRawUserTextPersistence:safe.persistRawUserText !== true,
        noApiKeyRead:safe.readApiKey !== true,
        noNetworkCall:safe.network !== true,
        noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.openExternalNow !== true,
        noEndpointGeneration:safe.generateEndpoint !== true,
        noBookingCheckoutPaymentOrderUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
        noForbiddenClaims:true
      },
      rows:buildGlobalShoppingOfflineSandboxTraceRows({
        traceSections:traceSections,
        traceSummary:traceSummary,
        userFacingSummary:{
          resultLabel:status === "ready" ? "离线 Sandbox Trace 检查器已准备" : (status === "blocked" ? "离线 Trace 检查已阻断" : "离线 Trace 检查仍需复核")
        },
        status:status
      }),
      blockedReasons:[]
        .concat(blockedBoundary ? [
          safe.persistRawTrace === true ? "raw_trace_persistence_detected" : "",
          safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
          safe.persistRawResponse === true ? "raw_response_persistence_detected" : "",
          safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
          safe.readApiKey === true ? "api_key_read_detected" : "",
          safe.network === true ? "network_detected" : "",
          safe.openExternal === true || safe.windowOpen === true || safe.openExternalNow === true ? "external_open_detected" : "",
          safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
          safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : ""
        ].filter(Boolean) : [])
        .concat(blockedTraceSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"离线 Sandbox Trace 检查器",
        resultLabel:status === "ready" ? "离线 Sandbox Trace 检查器已准备" : (status === "blocked" ? "离线 Trace 检查已阻断" : "离线 Trace 检查仍需复核"),
        caveat:"该检查器只查看脱敏 trace summary，不保存 raw trace，不联网，不读取密钥。"
      },
      auditDraft:{
        eventType:"GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR_AUDIT_DRAFT",
        inspectorName:INSPECTOR_NAME,
        appVersion:GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR_VERSION,
        status:status,
        traceSectionCount:traceSummary.traceSectionCount || 0,
        blockedTraceSectionCount:traceSummary.blockedTraceSectionCount || 0,
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
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingOfflineSandboxTraceInspector(input) {
    try {
      return evaluateGlobalShoppingOfflineSandboxTraceInspector(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineSandboxTraceInspector({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingOfflineSandboxTraceInspectorAuditDraft(input) {
    const inspector = buildGlobalShoppingOfflineSandboxTraceInspector(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR_AUDIT_DRAFT",
      inspectorName:INSPECTOR_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR_VERSION,
      status:inspector.status,
      traceSectionCount:obj(inspector.traceSummary).traceSectionCount || 0,
      blockedTraceSectionCount:obj(inspector.traceSummary).blockedTraceSectionCount || 0,
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

  function sanitizeGlobalShoppingOfflineSandboxTraceInspector(inspector) {
    return evaluateGlobalShoppingOfflineSandboxTraceInspector(inspector || {});
  }

  window.WeishanGlobalShoppingOfflineSandboxTraceInspector = {
    GLOBAL_SHOPPING_OFFLINE_SANDBOX_TRACE_INSPECTOR_VERSION,
    INSPECTOR_NAME,
    buildGlobalShoppingOfflineSandboxTraceInspector,
    evaluateGlobalShoppingOfflineSandboxTraceInspector,
    buildGlobalShoppingOfflineSandboxTraceRows,
    buildGlobalShoppingOfflineSandboxTraceSections,
    buildGlobalShoppingOfflineSandboxTraceInspectorAuditDraft,
    sanitizeGlobalShoppingOfflineSandboxTraceInspector
  };
})();
