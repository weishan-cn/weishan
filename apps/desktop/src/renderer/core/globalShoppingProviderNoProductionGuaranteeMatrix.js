;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_NO_PRODUCTION_GUARANTEE_MATRIX_VERSION = "4.2.1";
  const MATRIX_NAME = "global_shopping_provider_no_production_guarantee_matrix_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|providerClient|rawTrace|rawResponse|rawRequest|rawUserText/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function safeMode(value) { return /^(disabled|no_production_guarantee_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "no_production_guarantee_only"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function gate(gateId, label, status, summary, caveat) {
    return { gateId:text(gateId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety() {
    return {
      fileWrite:false,
      download:false,
      upload:false,
      mail:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      rawRequestStored:false,
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
      safe.switchProductionProvider === true ? "production_provider_switch_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderNoProductionGuaranteeGates(input) {
    const safe = obj(input);
    const providerDistributionFreezeConsoleSummary = resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole");
    const userFacingSafetyReceiptSummary = resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt");
    const offlineReleaseCandidateClosurePackSummary = resolveSummary(safe, "offlineReleaseCandidateClosurePackSummary", "WeishanGlobalShoppingOfflineReleaseCandidateClosurePack", "buildGlobalShoppingOfflineReleaseCandidateClosurePack");
    const providerSafetyDistributionMatrixSummary = resolveSummary(safe, "providerSafetyDistributionMatrixSummary", "WeishanGlobalShoppingProviderSafetyDistributionMatrix", "buildGlobalShoppingProviderSafetyDistributionMatrix");
    return clone([
      gate("provider_distribution_freeze_console", "Provider Distribution Freeze Console", present(providerDistributionFreezeConsoleSummary) ? providerDistributionFreezeConsoleSummary.status : "needs_review", labelOf(providerDistributionFreezeConsoleSummary, "Provider Distribution Freeze Console 仍需复核"), "Distribution Freeze 不创建真实分发包、不冻结配置。"),
      gate("user_facing_safety_receipt", "User-Facing Safety Receipt", present(userFacingSafetyReceiptSummary) ? userFacingSafetyReceiptSummary.status : "needs_review", labelOf(userFacingSafetyReceiptSummary, "User-Facing Safety Receipt 仍需复核"), "Safety Receipt 不生成真实回执文件。"),
      gate("offline_release_candidate_closure_pack", "Offline Release Candidate Closure Pack", present(offlineReleaseCandidateClosurePackSummary) ? offlineReleaseCandidateClosurePackSummary.status : "needs_review", labelOf(offlineReleaseCandidateClosurePackSummary, "Offline Release Candidate Closure Pack 仍需复核"), "RC Closure Pack 不创建真实闭包文件。"),
      gate("provider_safety_distribution_matrix", "Provider Safety Distribution Matrix", present(providerSafetyDistributionMatrixSummary) ? providerSafetyDistributionMatrixSummary.status : "needs_review", labelOf(providerSafetyDistributionMatrixSummary, "Provider Safety Distribution Matrix 仍需复核"), "No-Production Guarantee 不切换 production provider。")
    ]);
  }

  function buildGlobalShoppingProviderNoProductionGuaranteeMatrixRows(input) {
    const safe = obj(input);
    const gates = toArray(safe.noProductionGates).length ? toArray(safe.noProductionGates) : buildGlobalShoppingProviderNoProductionGuaranteeGates(safe);
    return clone([
      row("provider_no_production_guarantee_matrix_status", "Provider No-Production Guarantee Matrix", obj(safe.userFacingSummary).resultLabel || "Provider No-Production Guarantee Matrix 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_no_production_guarantee_matrix_boundary", "No-Production Guarantee 边界", "No-Production Guarantee 不切换 production provider。", "pass")
    ].concat(gates.map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderNoProductionGuaranteeMatrix(input) {
    const safe = obj(input);
    const noProductionGates = buildGlobalShoppingProviderNoProductionGuaranteeGates(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedGates = noProductionGates.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewGates = noProductionGates.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedGates.length ? "blocked" : (needsReviewGates.length ? "needs_review" : "ready");
    const result = {
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_NO_PRODUCTION_GUARANTEE_MATRIX_VERSION,
      status:status,
      matrixMode:safeMode(safe.matrixMode),
      noProductionBoundary:{
        noProductionGuaranteeOnly:true,
        offlineMock:true,
        readOnly:true,
        canSwitchProductionProvider:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canWriteFile:false,
        canUpload:false,
        canDownload:false,
        canSendMail:false,
        canActivateSandbox:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      noProductionSummary:{
        hasDistributionFreezeConsole:present(resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole")),
        hasUserFacingSafetyReceipt:present(resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt")),
        hasOfflineReleaseCandidateClosurePack:present(resolveSummary(safe, "offlineReleaseCandidateClosurePackSummary", "WeishanGlobalShoppingOfflineReleaseCandidateClosurePack", "buildGlobalShoppingOfflineReleaseCandidateClosurePack")),
        hasProviderSafetyDistributionMatrix:present(resolveSummary(safe, "providerSafetyDistributionMatrixSummary", "WeishanGlobalShoppingProviderSafetyDistributionMatrix", "buildGlobalShoppingProviderSafetyDistributionMatrix")),
        noProductionGateCount:noProductionGates.length,
        needsReviewGateCount:needsReviewGates.length,
        blockedGateCount:directBlockedReasons.length + blockedGates.length,
        readyForProviderDistributionClosureViewModel:status === "ready",
        humanDistributionClosureReviewRequired:true
      },
      noProductionGates:noProductionGates,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedGates.map(function (item) { return item.gateId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider No-Production Guarantee Matrix",
        resultLabel:status === "ready" ? "Provider No-Production Guarantee Matrix 已准备" : (status === "blocked" ? "Provider No-Production Guarantee Matrix 已阻断" : "Provider No-Production Guarantee Matrix 仍需复核"),
        caveat:"No-Production Guarantee 不切换 production provider。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderNoProductionGuaranteeMatrixRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderNoProductionGuaranteeMatrixAuditDraft(input) {
    const matrix = buildGlobalShoppingProviderNoProductionGuaranteeMatrix(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_NO_PRODUCTION_GUARANTEE_MATRIX_AUDIT_DRAFT",
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_NO_PRODUCTION_GUARANTEE_MATRIX_VERSION,
      status:matrix.status,
      noProductionGateCount:obj(matrix.noProductionSummary).noProductionGateCount || 0,
      blockedGateCount:obj(matrix.noProductionSummary).blockedGateCount || 0,
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
      rawRequestStored:false,
      secretStored:false,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingProviderNoProductionGuaranteeMatrix(matrix) {
    return evaluateGlobalShoppingProviderNoProductionGuaranteeMatrix(matrix || {});
  }

  function buildGlobalShoppingProviderNoProductionGuaranteeMatrix(input) {
    try {
      return evaluateGlobalShoppingProviderNoProductionGuaranteeMatrix(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderNoProductionGuaranteeMatrix({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderNoProductionGuaranteeMatrix = {
    GLOBAL_SHOPPING_PROVIDER_NO_PRODUCTION_GUARANTEE_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingProviderNoProductionGuaranteeMatrix,
    evaluateGlobalShoppingProviderNoProductionGuaranteeMatrix,
    buildGlobalShoppingProviderNoProductionGuaranteeMatrixRows,
    buildGlobalShoppingProviderNoProductionGuaranteeGates,
    buildGlobalShoppingProviderNoProductionGuaranteeMatrixAuditDraft,
    sanitizeGlobalShoppingProviderNoProductionGuaranteeMatrix
  };
})();
