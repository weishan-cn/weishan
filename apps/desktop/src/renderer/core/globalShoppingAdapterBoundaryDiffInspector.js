;(function () {
  "use strict";

  const GLOBAL_SHOPPING_ADAPTER_BOUNDARY_DIFF_INSPECTOR_VERSION = "4.1.3";
  const INSPECTOR_NAME = "global_shopping_adapter_boundary_diff_inspector_v1";

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
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
  function labelOf(summary, fallback) {
    const safe = obj(summary);
    return text(obj(safe.userFacingSummary).resultLabel || safe.title || fallback || "仍需复核");
  }
  function blockedReasons(input) {
    const safe = obj(input);
    return [
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.lockRuntimeConfig === true ? "runtime_config_lock_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.generateEndpoint === true ? "endpoint_generation_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.persistRawRequest === true ? "raw_request_persistence_detected" : "",
      safe.persistRawResponse === true ? "raw_response_persistence_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingAdapterBoundaryDiffSections(input) {
    const safe = obj(input);
    const boundaryLockSummary = resolveSummary(safe, "adapterBoundaryLockSummary", "WeishanGlobalShoppingAdapterBoundaryLock", "buildGlobalShoppingAdapterBoundaryLock");
    const activationReviewPacketSummary = resolveSummary(safe, "sandboxActivationReviewPacketSummary", "WeishanGlobalShoppingSandboxActivationReviewPacket", "buildGlobalShoppingSandboxActivationReviewPacket");
    const offlineReleaseGateSummary = resolveSummary(safe, "providerOfflineReleaseGateSummary", "WeishanGlobalShoppingProviderOfflineReleaseGate", "buildGlobalShoppingProviderOfflineReleaseGate");
    const adapterComplianceChecklistSummary = resolveSummary(safe, "providerAdapterComplianceChecklistSummary", "WeishanGlobalShoppingProviderAdapterComplianceChecklist", "buildGlobalShoppingProviderAdapterComplianceChecklist");
    const safetySentinelSummary = present(safe.safetySentinelSummary) ? obj(safe.safetySentinelSummary) : resolveSummary(safe, "safetyRegressionSummary", "WeishanFlightWorkflowSafetyRegressionSentinel", "buildFlightWorkflowSafetyRegressionReport");
    return clone([
      section("boundary_lock", "Adapter Boundary Lock", present(boundaryLockSummary) ? boundaryLockSummary.status : "needs_review", labelOf(boundaryLockSummary, "Adapter 边界锁仍需复核"), "只展示边界锁，不修改配置。"),
      section("activation_review_packet", "Sandbox Activation Review Packet", present(activationReviewPacketSummary) ? activationReviewPacketSummary.status : "needs_review", labelOf(activationReviewPacketSummary, "Sandbox 激活复核仍需复核"), "只展示激活复核，不激活 sandbox。"),
      section("offline_release_gate", "Provider Offline Release Gate", present(offlineReleaseGateSummary) ? offlineReleaseGateSummary.status : "needs_review", labelOf(offlineReleaseGateSummary, "离线发布闸门仍需复核"), "只展示离线发布闸门，不创建 release。"),
      section("adapter_compliance_checklist", "Provider Adapter Compliance Checklist", present(adapterComplianceChecklistSummary) ? adapterComplianceChecklistSummary.status : "needs_review", labelOf(adapterComplianceChecklistSummary, "Adapter 合规仍需复核"), "只展示合规清单，不创建 provider client。"),
      section("safety_sentinel", "Safety Sentinel", present(safetySentinelSummary) ? (safeStatus(safetySentinelSummary.status) === "pass" ? "ready" : safeStatus(safetySentinelSummary.status)) : "needs_review", labelOf(safetySentinelSummary, "安全回归仍需复核"), "只展示安全检查，不保存 raw request/response。")
    ]);
  }

  function buildGlobalShoppingAdapterBoundaryDiffRows(input) {
    const safe = obj(input);
    const diffSections = toArray(safe.diffSections).length ? toArray(safe.diffSections) : buildGlobalShoppingAdapterBoundaryDiffSections(safe);
    return clone([
      row("adapter_boundary_diff_inspector_status", "Adapter Boundary Diff Inspector 状态", obj(safe.userFacingSummary).resultLabel || "Adapter 边界差异仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("adapter_boundary_diff_inspector_boundary", "Adapter 边界差异边界", "该检查器只展示 adapter 边界差异，不修改配置，不启用或禁用 provider，不读取密钥。", "pass")
    ].concat(diffSections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingAdapterBoundaryDiffInspector(input) {
    const safe = obj(input);
    const diffSections = buildGlobalShoppingAdapterBoundaryDiffSections(safe);
    const directBlocks = blockedReasons(safe);
    const blockedSections = diffSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe"; });
    const reviewSections = diffSections.filter(function (item) { return item.status === "needs_review"; });
    const status = directBlocks.length || blockedSections.length ? "blocked" : (reviewSections.length ? "needs_review" : "ready");
    const result = {
      inspectorName:INSPECTOR_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_BOUNDARY_DIFF_INSPECTOR_VERSION,
      status:status,
      diffBoundary:{
        inspectorId:"global-shopping-adapter-boundary-diff-inspector",
        inspectorMode:"diff_only",
        diffOnly:true,
        readinessOnly:true,
        offlineOnly:true,
        mockOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canModifyRuntimeConfig:false,
        canLockRuntimeConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canCreateProviderClient:false,
        canGenerateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canPersistRawRequest:false,
        canPersistRawResponse:false
      },
      diffSummary:{
        hasBoundaryLock:diffSections[0].status !== "needs_review",
        hasActivationReviewPacket:diffSections[1].status !== "needs_review",
        hasOfflineReleaseGate:diffSections[2].status !== "needs_review",
        hasAdapterComplianceChecklist:diffSections[3].status !== "needs_review",
        hasSafetySentinel:diffSections[4].status !== "needs_review",
        diffSectionCount:diffSections.length,
        blockedDiffCount:blockedSections.length + directBlocks.length,
        needsReviewDiffCount:reviewSections.length,
        readyForOfflineReleaseViewModel:status === "ready",
        manualBoundaryDiffReviewRequired:true
      },
      diffSections:diffSections,
      rows:[],
      blockedReasons:directBlocks.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Adapter Boundary Diff Inspector",
        resultLabel:status === "ready" ? "Adapter 边界差异检查器已准备" : (status === "blocked" ? "Adapter 边界差异已阻断" : "Adapter 边界差异仍需复核"),
        caveat:"该检查器只展示 adapter 边界差异，不修改配置，不启用或禁用 provider，不读取密钥。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingAdapterBoundaryDiffRows(result);
    return clone(result);
  }

  function buildGlobalShoppingAdapterBoundaryDiffInspectorAuditDraft(input) {
    const inspector = buildGlobalShoppingAdapterBoundaryDiffInspector(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_ADAPTER_BOUNDARY_DIFF_INSPECTOR_AUDIT_DRAFT",
      inspectorName:INSPECTOR_NAME,
      appVersion:GLOBAL_SHOPPING_ADAPTER_BOUNDARY_DIFF_INSPECTOR_VERSION,
      status:inspector.status,
      diffSectionCount:obj(inspector.diffSummary).diffSectionCount || 0,
      blockedDiffCount:obj(inspector.diffSummary).blockedDiffCount || 0,
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

  function sanitizeGlobalShoppingAdapterBoundaryDiffInspector(inspector) {
    return evaluateGlobalShoppingAdapterBoundaryDiffInspector(inspector || {});
  }

  function buildGlobalShoppingAdapterBoundaryDiffInspector(input) {
    try {
      return evaluateGlobalShoppingAdapterBoundaryDiffInspector(input || {});
    } catch (_) {
      return evaluateGlobalShoppingAdapterBoundaryDiffInspector({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingAdapterBoundaryDiffInspector = {
    GLOBAL_SHOPPING_ADAPTER_BOUNDARY_DIFF_INSPECTOR_VERSION,
    INSPECTOR_NAME,
    buildGlobalShoppingAdapterBoundaryDiffInspector,
    evaluateGlobalShoppingAdapterBoundaryDiffInspector,
    buildGlobalShoppingAdapterBoundaryDiffRows,
    buildGlobalShoppingAdapterBoundaryDiffSections,
    buildGlobalShoppingAdapterBoundaryDiffInspectorAuditDraft,
    sanitizeGlobalShoppingAdapterBoundaryDiffInspector
  };
})();
