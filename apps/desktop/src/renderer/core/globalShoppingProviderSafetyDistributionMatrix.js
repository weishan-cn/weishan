;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SAFETY_DISTRIBUTION_MATRIX_VERSION = "4.2.6";
  const MATRIX_NAME = "global_shopping_provider_safety_distribution_matrix_v1";

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
  function safeMode(value) { return /^(disabled|distribution_matrix_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "distribution_matrix_only"; }
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
      safe.createRealDistribution === true ? "real_distribution_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderSafetyDistributionGates(input) {
    const safe = obj(input);
    const offlineDistributionReadinessCenterSummary = resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter");
    const noActivationEnforcementLedgerSummary = resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    const providerFinalSafetySealSummary = resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    return clone([
      gate("offline_distribution_readiness_center", "Offline Distribution Readiness Center", present(offlineDistributionReadinessCenterSummary) ? offlineDistributionReadinessCenterSummary.status : "needs_review", labelOf(offlineDistributionReadinessCenterSummary, "Offline Distribution Readiness Center 仍需复核"), "Distribution Readiness 不创建真实分发包。"),
      gate("no_activation_enforcement_ledger", "No-Activation Enforcement Ledger", present(noActivationEnforcementLedgerSummary) ? noActivationEnforcementLedgerSummary.status : "needs_review", labelOf(noActivationEnforcementLedgerSummary, "No-Activation Enforcement Ledger 仍需复核"), "No-Activation Enforcement 不执行真实阻断。"),
      gate("final_user_trust_summary", "Final User Trust Summary", present(finalUserTrustSummarySummary) ? finalUserTrustSummarySummary.status : "needs_review", labelOf(finalUserTrustSummarySummary, "Final User Trust Summary 仍需复核"), "User Trust Summary 不写文件、不保存用户原文。"),
      gate("provider_final_safety_seal", "Provider Final Safety Seal", present(providerFinalSafetySealSummary) ? providerFinalSafetySealSummary.status : "needs_review", labelOf(providerFinalSafetySealSummary, "Provider Final Safety Seal 仍需复核"), "Safety Matrix 不启用 provider、不激活 sandbox。"),
      gate("provider_activation_blocker_sentinel", "Provider Activation Blocker Sentinel", present(providerActivationBlockerSentinelSummary) ? providerActivationBlockerSentinelSummary.status : "needs_review", labelOf(providerActivationBlockerSentinelSummary, "Provider Activation Blocker Sentinel 仍需复核"), "Human distribution readiness review 仍需人工复核。")
    ]);
  }

  function buildGlobalShoppingProviderSafetyDistributionRows(input) {
    const safe = obj(input);
    const gates = toArray(safe.distributionGates).length ? toArray(safe.distributionGates) : buildGlobalShoppingProviderSafetyDistributionGates(safe);
    return clone([
      row("provider_safety_distribution_matrix_status", "Provider Safety Distribution Matrix", obj(safe.userFacingSummary).resultLabel || "Provider Safety Distribution Matrix 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_safety_distribution_matrix_boundary", "Safety Matrix 边界", "该 Matrix 只展示分发前安全矩阵，不创建真实分发、不修改配置、不联网。", "pass")
    ].concat(gates.map(function (item) {
      return row(item.gateId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderSafetyDistributionMatrix(input) {
    const safe = obj(input);
    const distributionGates = buildGlobalShoppingProviderSafetyDistributionGates(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedGates = distributionGates.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewGates = distributionGates.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedGates.length ? "blocked" : (needsReviewGates.length ? "needs_review" : "ready");
    const result = {
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SAFETY_DISTRIBUTION_MATRIX_VERSION,
      status:status,
      matrixMode:safeMode(safe.matrixMode),
      distributionBoundary:{
        distributionMatrixOnly:true,
        offlineMock:true,
        readOnly:true,
        canCreateRealDistribution:false,
        canWriteFile:false,
        canUpload:false,
        canDownload:false,
        canModifyRuntimeConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canActivateSandbox:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      distributionSummary:{
        hasDistributionReadinessCenter:present(resolveSummary(safe, "offlineDistributionReadinessCenterSummary", "WeishanGlobalShoppingOfflineDistributionReadinessCenter", "buildGlobalShoppingOfflineDistributionReadinessCenter")),
        hasEnforcementLedger:present(resolveSummary(safe, "noActivationEnforcementLedgerSummary", "WeishanGlobalShoppingNoActivationEnforcementLedger", "buildGlobalShoppingNoActivationEnforcementLedger")),
        hasTrustSummary:present(resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary")),
        hasFinalSafetySeal:present(resolveSummary(safe, "providerFinalSafetySealSummary", "WeishanGlobalShoppingProviderFinalSafetySeal", "buildGlobalShoppingProviderFinalSafetySeal")),
        hasActivationBlockerSentinel:present(resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel")),
        distributionGateCount:distributionGates.length,
        needsReviewGateCount:needsReviewGates.length,
        blockedGateCount:directBlockedReasons.length + blockedGates.length,
        readyForProviderDistributionReadinessViewModel:status === "ready",
        humanDistributionReadinessReviewRequired:true
      },
      distributionGates:distributionGates,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedGates.map(function (item) { return item.gateId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Safety Distribution Matrix",
        resultLabel:status === "ready" ? "Provider Safety Distribution Matrix 已准备" : (status === "blocked" ? "Provider Safety Distribution Matrix 已阻断" : "Provider Safety Distribution Matrix 仍需复核"),
        caveat:"该 Matrix 只展示分发前安全矩阵，不创建真实分发、不修改配置、不联网。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderSafetyDistributionRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderSafetyDistributionMatrixAuditDraft(input) {
    const matrix = buildGlobalShoppingProviderSafetyDistributionMatrix(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SAFETY_DISTRIBUTION_MATRIX_AUDIT_DRAFT",
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SAFETY_DISTRIBUTION_MATRIX_VERSION,
      status:matrix.status,
      distributionGateCount:obj(matrix.distributionSummary).distributionGateCount || 0,
      blockedGateCount:obj(matrix.distributionSummary).blockedGateCount || 0,
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

  function sanitizeGlobalShoppingProviderSafetyDistributionMatrix(matrix) {
    return evaluateGlobalShoppingProviderSafetyDistributionMatrix(matrix || {});
  }

  function buildGlobalShoppingProviderSafetyDistributionMatrix(input) {
    try {
      return evaluateGlobalShoppingProviderSafetyDistributionMatrix(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderSafetyDistributionMatrix({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderSafetyDistributionMatrix = {
    GLOBAL_SHOPPING_PROVIDER_SAFETY_DISTRIBUTION_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingProviderSafetyDistributionMatrix,
    evaluateGlobalShoppingProviderSafetyDistributionMatrix,
    buildGlobalShoppingProviderSafetyDistributionRows,
    buildGlobalShoppingProviderSafetyDistributionGates,
    buildGlobalShoppingProviderSafetyDistributionMatrixAuditDraft,
    sanitizeGlobalShoppingProviderSafetyDistributionMatrix
  };
})();
