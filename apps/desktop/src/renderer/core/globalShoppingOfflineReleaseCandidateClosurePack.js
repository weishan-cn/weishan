;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_CLOSURE_PACK_VERSION = "4.0.2";
  const CLOSURE_PACK_NAME = "global_shopping_offline_release_candidate_closure_pack_v1";

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
  function safeMode(value) { return /^(disabled|rc_closure_pack_only|offline_mock|readonly)$/.test(text(value)) ? text(value) : "rc_closure_pack_only"; }
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
      safe.generateRealClosureFile === true ? "real_closure_file_detected" : "",
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

  function buildGlobalShoppingOfflineReleaseCandidateClosureSections(input) {
    const safe = obj(input);
    const providerDistributionFreezeConsoleSummary = resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole");
    const userFacingSafetyReceiptSummary = resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt");
    const providerDistributionReadinessViewModelSummary = resolveSummary(safe, "providerDistributionReadinessViewModelSummary", "WeishanGlobalShoppingProviderDistributionReadinessViewModel", "buildGlobalShoppingProviderDistributionReadinessViewModel");
    return clone([
      section("provider_distribution_freeze_console", "Provider Distribution Freeze Console", present(providerDistributionFreezeConsoleSummary) ? providerDistributionFreezeConsoleSummary.status : "needs_review", labelOf(providerDistributionFreezeConsoleSummary, "Provider Distribution Freeze Console 仍需复核"), "Distribution Freeze 不创建真实分发包、不冻结配置。"),
      section("user_facing_safety_receipt", "User-Facing Safety Receipt", present(userFacingSafetyReceiptSummary) ? userFacingSafetyReceiptSummary.status : "needs_review", labelOf(userFacingSafetyReceiptSummary, "User-Facing Safety Receipt 仍需复核"), "Safety Receipt 不生成真实回执文件。"),
      section("provider_distribution_readiness_view_model", "Provider Distribution Readiness Review", present(providerDistributionReadinessViewModelSummary) ? providerDistributionReadinessViewModelSummary.status : "needs_review", labelOf(providerDistributionReadinessViewModelSummary, "Provider Distribution Readiness Review 仍需复核"), "RC Closure Pack 不创建真实闭包文件。")
    ]);
  }

  function buildGlobalShoppingOfflineReleaseCandidateClosurePackRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.closureSections).length ? toArray(safe.closureSections) : buildGlobalShoppingOfflineReleaseCandidateClosureSections(safe);
    return clone([
      row("offline_release_candidate_closure_pack_status", "Offline Release Candidate Closure Pack", obj(safe.userFacingSummary).resultLabel || "Offline Release Candidate Closure Pack 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("offline_release_candidate_closure_pack_boundary", "RC Closure Pack 边界", "RC Closure Pack 不创建真实闭包文件。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingOfflineReleaseCandidateClosurePack(input) {
    const safe = obj(input);
    const closureSections = buildGlobalShoppingOfflineReleaseCandidateClosureSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = closureSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = closureSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      closurePackName:CLOSURE_PACK_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_CLOSURE_PACK_VERSION,
      status:status,
      closurePackMode:safeMode(safe.closurePackMode),
      closureBoundary:{
        rcClosurePackOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateRealClosureFile:false,
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
      closureSummary:{
        hasDistributionFreezeConsole:present(resolveSummary(safe, "providerDistributionFreezeConsoleSummary", "WeishanGlobalShoppingProviderDistributionFreezeConsole", "buildGlobalShoppingProviderDistributionFreezeConsole")),
        hasUserFacingSafetyReceipt:present(resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt")),
        hasDistributionReadinessReview:present(resolveSummary(safe, "providerDistributionReadinessViewModelSummary", "WeishanGlobalShoppingProviderDistributionReadinessViewModel", "buildGlobalShoppingProviderDistributionReadinessViewModel")),
        closureSectionCount:closureSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForNoProductionGuaranteeMatrix:status === "ready",
        humanDistributionClosureReviewRequired:true
      },
      closureSections:closureSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Offline Release Candidate Closure Pack",
        resultLabel:status === "ready" ? "Offline Release Candidate Closure Pack 已准备" : (status === "blocked" ? "Offline Release Candidate Closure Pack 已阻断" : "Offline Release Candidate Closure Pack 仍需复核"),
        caveat:"RC Closure Pack 不创建真实闭包文件。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingOfflineReleaseCandidateClosurePackRows(result);
    return clone(result);
  }

  function buildGlobalShoppingOfflineReleaseCandidateClosurePackAuditDraft(input) {
    const pack = buildGlobalShoppingOfflineReleaseCandidateClosurePack(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_CLOSURE_PACK_AUDIT_DRAFT",
      closurePackName:CLOSURE_PACK_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_CLOSURE_PACK_VERSION,
      status:pack.status,
      closureSectionCount:obj(pack.closureSummary).closureSectionCount || 0,
      blockedSectionCount:obj(pack.closureSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingOfflineReleaseCandidateClosurePack(pack) {
    return evaluateGlobalShoppingOfflineReleaseCandidateClosurePack(pack || {});
  }

  function buildGlobalShoppingOfflineReleaseCandidateClosurePack(input) {
    try {
      return evaluateGlobalShoppingOfflineReleaseCandidateClosurePack(input || {});
    } catch (_) {
      return evaluateGlobalShoppingOfflineReleaseCandidateClosurePack({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineReleaseCandidateClosurePack = {
    GLOBAL_SHOPPING_OFFLINE_RELEASE_CANDIDATE_CLOSURE_PACK_VERSION,
    CLOSURE_PACK_NAME,
    buildGlobalShoppingOfflineReleaseCandidateClosurePack,
    evaluateGlobalShoppingOfflineReleaseCandidateClosurePack,
    buildGlobalShoppingOfflineReleaseCandidateClosurePackRows,
    buildGlobalShoppingOfflineReleaseCandidateClosureSections,
    buildGlobalShoppingOfflineReleaseCandidateClosurePackAuditDraft,
    sanitizeGlobalShoppingOfflineReleaseCandidateClosurePack
  };
})();
