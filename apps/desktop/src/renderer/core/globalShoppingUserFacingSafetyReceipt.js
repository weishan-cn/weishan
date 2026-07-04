;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_FACING_SAFETY_RECEIPT_VERSION = "4.1.9";
  const RECEIPT_NAME = "global_shopping_user_facing_safety_receipt_v1";

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
  function safeMode(value) { return /^(disabled|safety_receipt_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "safety_receipt_only"; }
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
      safe.generateRealReceiptFile === true ? "real_receipt_file_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.switchProductionProvider === true ? "production_provider_switch_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingUserFacingSafetyReceiptSections(input) {
    const safe = obj(input);
    const providerDistributionFreezeConsoleSummary = resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    const providerSafetyDistributionMatrixSummary = resolveSummary(safe, "providerSafetyDistributionMatrixSummary", "WeishanGlobalShoppingProviderSafetyDistributionMatrix", "buildGlobalShoppingProviderSafetyDistributionMatrix");
    const providerDistributionReadinessViewModelSummary = resolveSummary(safe, "providerDistributionReadinessViewModelSummary", "WeishanGlobalShoppingProviderDistributionReadinessViewModel", "buildGlobalShoppingProviderDistributionReadinessViewModel");
    return clone([
      section("provider_distribution_freeze_console", "Provider Distribution Freeze Console", present(providerDistributionFreezeConsoleSummary) ? providerDistributionFreezeConsoleSummary.status : "needs_review", labelOf(providerDistributionFreezeConsoleSummary, "Provider Distribution Freeze Console 仍需复核"), "Distribution Freeze 不创建真实分发包、不冻结配置。"),
      section("final_user_trust_summary", "Final User Trust Summary", present(finalUserTrustSummarySummary) ? finalUserTrustSummarySummary.status : "needs_review", labelOf(finalUserTrustSummarySummary, "Final User Trust Summary 仍需复核"), "Safety Receipt 不生成真实回执文件。"),
      section("provider_safety_distribution_matrix", "Provider Safety Distribution Matrix", present(providerSafetyDistributionMatrixSummary) ? providerSafetyDistributionMatrixSummary.status : "needs_review", labelOf(providerSafetyDistributionMatrixSummary, "Provider Safety Distribution Matrix 仍需复核"), "No-Production Guarantee 不切换 production provider。"),
      section("provider_distribution_readiness_view_model", "Provider Distribution Readiness Review", present(providerDistributionReadinessViewModelSummary) ? providerDistributionReadinessViewModelSummary.status : "needs_review", labelOf(providerDistributionReadinessViewModelSummary, "Provider Distribution Readiness Review 仍需复核"), "Human distribution closure review 仍需人工复核。")
    ]);
  }

  function buildGlobalShoppingUserFacingSafetyReceiptRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.receiptSections).length ? toArray(safe.receiptSections) : buildGlobalShoppingUserFacingSafetyReceiptSections(safe);
    return clone([
      row("user_facing_safety_receipt_status", "User-Facing Safety Receipt", obj(safe.userFacingSummary).resultLabel || "User-Facing Safety Receipt 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("user_facing_safety_receipt_boundary", "Safety Receipt 边界", "Safety Receipt 不生成真实回执文件。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingUserFacingSafetyReceipt(input) {
    const safe = obj(input);
    const receiptSections = buildGlobalShoppingUserFacingSafetyReceiptSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = receiptSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = receiptSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      receiptName:RECEIPT_NAME,
      appVersion:GLOBAL_SHOPPING_USER_FACING_SAFETY_RECEIPT_VERSION,
      status:status,
      receiptMode:safeMode(safe.receiptMode),
      receiptBoundary:{
        safetyReceiptOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateRealReceiptFile:false,
        canWriteFile:false,
        canUpload:false,
        canDownload:false,
        canSendMail:false,
        canEnableProvider:false,
        canSwitchProductionProvider:false,
        canActivateSandbox:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      receiptSummary:{
        hasDistributionFreezeConsole:present(resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole")),
        hasFinalUserTrustSummary:present(resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary")),
        hasProviderSafetyDistributionMatrix:present(resolveSummary(safe, "providerSafetyDistributionMatrixSummary", "WeishanGlobalShoppingProviderSafetyDistributionMatrix", "buildGlobalShoppingProviderSafetyDistributionMatrix")),
        hasDistributionReadinessReview:present(resolveSummary(safe, "providerDistributionReadinessViewModelSummary", "WeishanGlobalShoppingProviderDistributionReadinessViewModel", "buildGlobalShoppingProviderDistributionReadinessViewModel")),
        receiptSectionCount:receiptSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForOfflineReleaseCandidateClosurePack:status === "ready",
        humanDistributionClosureReviewRequired:true
      },
      receiptSections:receiptSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"User-Facing Safety Receipt",
        resultLabel:status === "ready" ? "User-Facing Safety Receipt 已准备" : (status === "blocked" ? "User-Facing Safety Receipt 已阻断" : "User-Facing Safety Receipt 仍需复核"),
        caveat:"Safety Receipt 不生成真实回执文件。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingUserFacingSafetyReceiptRows(result);
    return clone(result);
  }

  function buildGlobalShoppingUserFacingSafetyReceiptAuditDraft(input) {
    const receipt = buildGlobalShoppingUserFacingSafetyReceipt(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_USER_FACING_SAFETY_RECEIPT_AUDIT_DRAFT",
      receiptName:RECEIPT_NAME,
      appVersion:GLOBAL_SHOPPING_USER_FACING_SAFETY_RECEIPT_VERSION,
      status:receipt.status,
      receiptSectionCount:obj(receipt.receiptSummary).receiptSectionCount || 0,
      blockedSectionCount:obj(receipt.receiptSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingUserFacingSafetyReceipt(receipt) {
    return evaluateGlobalShoppingUserFacingSafetyReceipt(receipt || {});
  }

  function buildGlobalShoppingUserFacingSafetyReceipt(input) {
    try {
      return evaluateGlobalShoppingUserFacingSafetyReceipt(input || {});
    } catch (_) {
      return evaluateGlobalShoppingUserFacingSafetyReceipt({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingUserFacingSafetyReceipt = {
    GLOBAL_SHOPPING_USER_FACING_SAFETY_RECEIPT_VERSION,
    RECEIPT_NAME,
    buildGlobalShoppingUserFacingSafetyReceipt,
    evaluateGlobalShoppingUserFacingSafetyReceipt,
    buildGlobalShoppingUserFacingSafetyReceiptRows,
    buildGlobalShoppingUserFacingSafetyReceiptSections,
    buildGlobalShoppingUserFacingSafetyReceiptAuditDraft,
    sanitizeGlobalShoppingUserFacingSafetyReceipt
  };
})();
