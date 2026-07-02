;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_PROVIDER_READINESS_DECISION_MATRIX_VERSION = "4.0.2";
  const MATRIX_NAME = "global_shopping_offline_provider_readiness_decision_matrix_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawTrace|rawResponse|rawRequest|rawUserText|providerClient/ig, "redacted")
      .trim();
  }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function safeStatus(value) { return /^(ready|needs_review|blocked|failed_safe|pass|warning|fail)$/.test(text(value)) ? text(value) : "needs_review"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function matrixRow(matrixRowId, label, status, summary, caveat) {
    return { matrixRowId:text(matrixRowId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_mutation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createEndpoint === true ? "endpoint_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistDecision === true ? "decision_persistence_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingOfflineProviderReadinessDecisionMatrixRows(input) {
    const safe = obj(input);
    const finalOfflineLaunchReviewConsoleSummary = resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    const rows = [
      matrixRow("final_review_console", "Final Offline Launch Review Console", present(finalOfflineLaunchReviewConsoleSummary) ? finalOfflineLaunchReviewConsoleSummary.status : "needs_review", labelOf(finalOfflineLaunchReviewConsoleSummary, "Final Review Console 仍需复核"), "Decision Matrix 不保存真实决策。"),
      matrixRow("activation_blocker_sentinel", "Provider Activation Blocker Sentinel", present(providerActivationBlockerSentinelSummary) ? providerActivationBlockerSentinelSummary.status : "needs_review", labelOf(providerActivationBlockerSentinelSummary, "Activation Blockers 仍需复核"), "Activation Blocker 不修改配置、不启用 provider。"),
      matrixRow("release_evidence_summary", "Read-Only Release Evidence Summary", present(readOnlyReleaseEvidenceSummary) ? readOnlyReleaseEvidenceSummary.status : "needs_review", labelOf(readOnlyReleaseEvidenceSummary, "Evidence Summary 仍需复核"), "Evidence Summary 不写文件、不上传。")
    ];
    return clone(rows);
  }

  function buildGlobalShoppingOfflineProviderReadinessDecisionMatrixDecisionRows(input) {
    const safe = obj(input);
    const matrixRows = toArray(safe.matrixRows).length ? toArray(safe.matrixRows) : buildGlobalShoppingOfflineProviderReadinessDecisionMatrixRows(safe);
    return clone([
      row("offline_provider_readiness_decision_matrix_status", "Offline Provider Readiness Decision Matrix", obj(safe.userFacingSummary).resultLabel || "Offline Provider Readiness Decision Matrix 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_provider_readiness_decision_matrix_boundary", "Decision Matrix 边界", "该 Matrix 只展示离线 readiness 决策矩阵，不创建 release、不 push，不改 git，不启用 provider。", "pass")
    ].concat(matrixRows.map(function (item) {
      return row(item.matrixRowId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineProviderReadinessDecisionMatrix(input) {
    const safe = obj(input);
    const matrixRows = buildGlobalShoppingOfflineProviderReadinessDecisionMatrixRows(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedRows = matrixRows.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewRows = matrixRows.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedRows.length ? "blocked" : (needsReviewRows.length ? "needs_review" : "ready");
    const result = {
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_READINESS_DECISION_MATRIX_VERSION,
      status:status,
      matrixMode:"decision_matrix_only",
      matrixBoundary:{
        decisionMatrixOnly:true,
        offlineMock:true,
        readOnly:true,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canUseRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateEndpoint:false,
        canCreateProviderClient:false,
        canWriteFile:false,
        canDownload:false,
        canOpenExternalDocument:false,
        canPersistDecision:false
      },
      decisionSummary:{
        hasFinalReviewConsole:present(resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole")),
        hasActivationBlocker:present(resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel")),
        hasReleaseEvidenceSummary:present(resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary")),
        matrixRowCount:matrixRows.length,
        needsReviewRowCount:needsReviewRows.length,
        blockedRowCount:directBlockedReasons.length + blockedRows.length,
        readyForFinalReviewConsoleViewModel:status === "ready",
        manualDecisionMatrixReviewRequired:true
      },
      matrixRows:matrixRows,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedRows.map(function (item) { return item.matrixRowId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Provider Readiness Decision Matrix",
        resultLabel:status === "ready" ? "Offline Provider Readiness Decision Matrix 已准备" : (status === "blocked" ? "Offline Provider Readiness Decision Matrix 已阻断" : "Offline Provider Readiness Decision Matrix 仍需复核"),
        caveat:"该 Matrix 只展示离线 readiness 决策矩阵，不创建 release、不 push，不改 git，不启用 provider。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflineProviderReadinessDecisionMatrixDecisionRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflineProviderReadinessDecisionMatrixAuditDraft(input) {
    const matrix = buildGlobalShoppingOfflineProviderReadinessDecisionMatrix(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_PROVIDER_READINESS_DECISION_MATRIX_AUDIT_DRAFT",
      matrixName:MATRIX_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_PROVIDER_READINESS_DECISION_MATRIX_VERSION,
      status:matrix.status,
      matrixRowCount:obj(matrix.decisionSummary).matrixRowCount || 0,
      blockedRowCount:obj(matrix.decisionSummary).blockedRowCount || 0,
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

  function sanitizeGlobalShoppingOfflineProviderReadinessDecisionMatrix(matrix) {
    return evaluateGlobalShoppingOfflineProviderReadinessDecisionMatrix(matrix || {});
  }

  function buildGlobalShoppingOfflineProviderReadinessDecisionMatrix(input) {
    try {
      return evaluateGlobalShoppingOfflineProviderReadinessDecisionMatrix(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineProviderReadinessDecisionMatrix({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineProviderReadinessDecisionMatrix = {
    GLOBAL_SHOPPING_OFFLINE_PROVIDER_READINESS_DECISION_MATRIX_VERSION,
    MATRIX_NAME,
    buildGlobalShoppingOfflineProviderReadinessDecisionMatrix,
    evaluateGlobalShoppingOfflineProviderReadinessDecisionMatrix,
    buildGlobalShoppingOfflineProviderReadinessDecisionMatrixDecisionRows,
    buildGlobalShoppingOfflineProviderReadinessDecisionMatrixRows,
    buildGlobalShoppingOfflineProviderReadinessDecisionMatrixAuditDraft,
    sanitizeGlobalShoppingOfflineProviderReadinessDecisionMatrix
  };
})();
