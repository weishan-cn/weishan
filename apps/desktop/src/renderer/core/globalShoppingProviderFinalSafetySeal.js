;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_SEAL_VERSION = "4.2.0";
  const SEAL_NAME = "global_shopping_provider_final_safety_seal_v1";

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
  function safeMode(value) { return /^(disabled|seal_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "seal_only"; }
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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
      evidenceStored:false,
      decisionStored:false,
      receiptStored:false,
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
      safe.writeSealFile === true ? "seal_file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.sendEmail === true ? "email_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistRealSeal === true ? "real_seal_persistence_detected" : "",
      safe.persistDecision === true ? "decision_persistence_detected" : "",
      safe.persistReceipt === true ? "receipt_persistence_detected" : "",
      safe.persistEvidence === true ? "evidence_persistence_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.modifyGit === true ? "git_mutation_detected" : "",
      safe.modifyRuntimeConfig === true ? "runtime_config_mutation_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.startRealProvider === true ? "real_provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createEndpoint === true ? "endpoint_detected" : "",
      safe.createProviderClient === true ? "provider_client_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingProviderFinalSafetySealSections(input) {
    const safe = obj(input);
    const finalOfflineLaunchReviewConsoleSummary = resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole");
    const providerActivationBlockerSentinelSummary = resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel");
    const readOnlyReleaseEvidenceSummary = resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary");
    const offlineProviderReadinessDecisionMatrixSummary = resolveSummary(safe, "offlineProviderReadinessDecisionMatrixSummary", "WeishanGlobalShoppingOfflineProviderReadinessDecisionMatrix", "buildGlobalShoppingOfflineProviderReadinessDecisionMatrix");
    const providerFinalReviewConsoleViewModelSummary = resolveSummary(safe, "providerFinalReviewConsoleViewModelSummary", "WeishanGlobalShoppingProviderFinalReviewConsoleViewModel", "buildGlobalShoppingProviderFinalReviewConsoleViewModel");
    return clone([
      section("final_offline_launch_review_console", "Final Offline Launch Review Console", present(finalOfflineLaunchReviewConsoleSummary) ? finalOfflineLaunchReviewConsoleSummary.status : "needs_review", labelOf(finalOfflineLaunchReviewConsoleSummary, "Final Review Console 仍需复核"), "Safety Seal 不生成真实证书、不写文件。"),
      section("provider_activation_blocker_sentinel", "Provider Activation Blocker Sentinel", present(providerActivationBlockerSentinelSummary) ? providerActivationBlockerSentinelSummary.status : "needs_review", labelOf(providerActivationBlockerSentinelSummary, "Activation Blockers 仍需复核"), "No-Activation Guarantee 不修改配置、不执行真实阻断。"),
      section("read_only_release_evidence_summary", "Read-Only Release Evidence Summary", present(readOnlyReleaseEvidenceSummary) ? readOnlyReleaseEvidenceSummary.status : "needs_review", labelOf(readOnlyReleaseEvidenceSummary, "Evidence Summary 仍需复核"), "Readiness Certificate 不持久化证书。"),
      section("offline_provider_readiness_decision_matrix", "Offline Provider Readiness Decision Matrix", present(offlineProviderReadinessDecisionMatrixSummary) ? offlineProviderReadinessDecisionMatrixSummary.status : "needs_review", labelOf(offlineProviderReadinessDecisionMatrixSummary, "Decision Matrix 仍需复核"), "Activation War Room 不激活 sandbox、不启用 provider。"),
      section("provider_final_review_console_view_model", "Provider Final Review Console", present(providerFinalReviewConsoleViewModelSummary) ? providerFinalReviewConsoleViewModelSummary.status : "needs_review", labelOf(providerFinalReviewConsoleViewModelSummary, "Final Review 视图仍需复核"), "Human final safety review 仍需人工复核。")
    ]);
  }

  function buildGlobalShoppingProviderFinalSafetySealRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.sealSections).length ? toArray(safe.sealSections) : buildGlobalShoppingProviderFinalSafetySealSections(safe);
    return clone([
      row("provider_final_safety_seal_status", "Provider Final Safety Seal", obj(safe.userFacingSummary).resultLabel || "Provider Final Safety Seal 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("provider_final_safety_seal_boundary", "Safety Seal 边界", "该 Seal 只展示最终安全封条，不生成真实证书、不写文件、不创建 release/tag、不 push。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingProviderFinalSafetySeal(input) {
    const safe = obj(input);
    const sealSections = buildGlobalShoppingProviderFinalSafetySealSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = sealSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = sealSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      sealName:SEAL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_SEAL_VERSION,
      status:status,
      sealMode:safeMode(safe.sealMode),
      sealBoundary:{
        sealOnly:true,
        offlineMock:true,
        readOnly:true,
        canWriteSealFile:false,
        canDownload:false,
        canUpload:false,
        canSendEmail:false,
        canOpenExternalDocument:false,
        canPersistRealSeal:false,
        canPersistDecision:false,
        canPersistReceipt:false,
        canPersistEvidence:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canModifyGit:false,
        canModifyRuntimeConfig:false,
        canActivateSandbox:false,
        canUseRealProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateEndpoint:false,
        canCreateProviderClient:false,
        canEnableProvider:false,
        canDisableProvider:false
      },
      sealSummary:{
        hasFinalReviewConsole:present(resolveSummary(safe, "finalOfflineLaunchReviewConsoleSummary", "WeishanGlobalShoppingFinalOfflineLaunchReviewConsole", "buildGlobalShoppingFinalOfflineLaunchReviewConsole")),
        hasActivationBlockerSentinel:present(resolveSummary(safe, "providerActivationBlockerSentinelSummary", "WeishanGlobalShoppingProviderActivationBlockerSentinel", "buildGlobalShoppingProviderActivationBlockerSentinel")),
        hasReleaseEvidenceSummary:present(resolveSummary(safe, "readOnlyReleaseEvidenceSummary", "WeishanGlobalShoppingReadOnlyReleaseEvidenceSummary", "buildGlobalShoppingReadOnlyReleaseEvidenceSummary")),
        hasDecisionMatrix:present(resolveSummary(safe, "offlineProviderReadinessDecisionMatrixSummary", "WeishanGlobalShoppingOfflineProviderReadinessDecisionMatrix", "buildGlobalShoppingOfflineProviderReadinessDecisionMatrix")),
        hasFinalReviewViewModel:present(resolveSummary(safe, "providerFinalReviewConsoleViewModelSummary", "WeishanGlobalShoppingProviderFinalReviewConsoleViewModel", "buildGlobalShoppingProviderFinalReviewConsoleViewModel")),
        sealSectionCount:sealSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForOfflineActivationWarRoom:status === "ready",
        humanFinalSafetyReviewRequired:true
      },
      sealSections:sealSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Provider Final Safety Seal",
        resultLabel:status === "ready" ? "Provider Final Safety Seal 已准备" : (status === "blocked" ? "Provider Final Safety Seal 已阻断" : "Provider Final Safety Seal 仍需复核"),
        caveat:"该 Seal 只展示最终安全封条，不生成真实证书、不写文件、不创建 release/tag、不 push。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingProviderFinalSafetySealRows(result);
    return clone(result);
  }

  function buildGlobalShoppingProviderFinalSafetySealAuditDraft(input) {
    const seal = buildGlobalShoppingProviderFinalSafetySeal(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_SEAL_AUDIT_DRAFT",
      sealName:SEAL_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_SEAL_VERSION,
      status:seal.status,
      sealSectionCount:obj(seal.sealSummary).sealSectionCount || 0,
      blockedSectionCount:obj(seal.sealSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingProviderFinalSafetySeal(seal) {
    return evaluateGlobalShoppingProviderFinalSafetySeal(seal || {});
  }

  function buildGlobalShoppingProviderFinalSafetySeal(input) {
    try {
      return evaluateGlobalShoppingProviderFinalSafetySeal(input || {});
    } catch (_) {
      return evaluateGlobalShoppingProviderFinalSafetySeal({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingProviderFinalSafetySeal = {
    GLOBAL_SHOPPING_PROVIDER_FINAL_SAFETY_SEAL_VERSION,
    SEAL_NAME,
    buildGlobalShoppingProviderFinalSafetySeal,
    evaluateGlobalShoppingProviderFinalSafetySeal,
    buildGlobalShoppingProviderFinalSafetySealRows,
    buildGlobalShoppingProviderFinalSafetySealSections,
    buildGlobalShoppingProviderFinalSafetySealAuditDraft,
    sanitizeGlobalShoppingProviderFinalSafetySeal
  };
})();
