;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_VISIBLE_SAFETY_BOUNDARY_EXPLAINER_VERSION = "4.1.8";
  const EXPLAINER_NAME = "global_shopping_user_visible_safety_boundary_explainer_v1";

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
  function safeMode(value) { return /^(disabled|explainer_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "explainer_only"; }
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
      externalDocument:false,
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
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.provider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.lowestPriceClaim === true ? "lowest_price_claim_detected" : "",
      safe.finalPriceClaim === true ? "final_price_claim_detected" : "",
      safe.partnershipClaim === true ? "partnership_claim_detected" : "",
      safe.endorsementClaim === true ? "endorsement_claim_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingUserVisibleSafetyBoundarySections(input) {
    const safe = obj(input);
    const providerPublicTrustClosureCenterSummary = resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter");
    const offlineReleaseMemorySnapshotSummary = resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot");
    const noProviderExecutionFinalGuardSummary = resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard");
    const userFacingSafetyReceiptSummary = resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    return clone([
      section("provider_public_trust_closure_center", "Provider Public Trust Closure Center", present(providerPublicTrustClosureCenterSummary) ? providerPublicTrustClosureCenterSummary.status : "needs_review", labelOf(providerPublicTrustClosureCenterSummary, "Provider Public Trust Closure Center 仍需复核"), "Safety Boundary 不承诺最低价、最终价或官方背书。"),
      section("offline_release_memory_snapshot", "Offline Release Memory Snapshot", present(offlineReleaseMemorySnapshotSummary) ? offlineReleaseMemorySnapshotSummary.status : "needs_review", labelOf(offlineReleaseMemorySnapshotSummary, "Offline Release Memory Snapshot 仍需复核"), "Release Memory 不持久化记忆快照。"),
      section("no_provider_execution_final_guard", "No-Provider-Execution Final Guard", present(noProviderExecutionFinalGuardSummary) ? noProviderExecutionFinalGuardSummary.status : "needs_review", labelOf(noProviderExecutionFinalGuardSummary, "No-Provider-Execution Final Guard 仍需复核"), "No-Provider Guard 不执行真实阻断、不打开平台。"),
      section("user_facing_safety_receipt", "User-Facing Safety Receipt", present(userFacingSafetyReceiptSummary) ? userFacingSafetyReceiptSummary.status : "needs_review", labelOf(userFacingSafetyReceiptSummary, "User-Facing Safety Receipt 仍需复核"), "Safety Receipt 不生成真实回执文件。"),
      section("final_user_trust_summary", "Final User Trust Summary", present(finalUserTrustSummarySummary) ? finalUserTrustSummarySummary.status : "needs_review", labelOf(finalUserTrustSummarySummary, "Final User Trust Summary 仍需复核"), "Final User Trust Summary 不保存用户原文。")
    ]);
  }

  function buildGlobalShoppingUserVisibleSafetyBoundaryRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.explainerSections).length ? toArray(safe.explainerSections) : buildGlobalShoppingUserVisibleSafetyBoundarySections(safe);
    return clone([
      row("user_visible_safety_boundary_explainer_status", "User-Visible Safety Boundary Explainer", obj(safe.userFacingSummary).resultLabel || "User-Visible Safety Boundary Explainer 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("user_visible_safety_boundary_explainer_boundary", "Safety Boundary 边界", "Safety Boundary 不承诺最低价、最终价或官方背书。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingUserVisibleSafetyBoundaryExplainer(input) {
    const safe = obj(input);
    const explainerSections = buildGlobalShoppingUserVisibleSafetyBoundarySections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = explainerSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = explainerSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      explainerName:EXPLAINER_NAME,
      appVersion:GLOBAL_SHOPPING_USER_VISIBLE_SAFETY_BOUNDARY_EXPLAINER_VERSION,
      status:status,
      explainerMode:safeMode(safe.explainerMode),
      explainerBoundary:{
        explainerOnly:true,
        offlineMock:true,
        readOnly:true,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canWriteFile:false,
        canUpload:false,
        canDownload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canUseProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canClaimLowestPrice:false,
        canClaimFinalPrice:false,
        canClaimPartnership:false,
        canClaimEndorsement:false
      },
      explainerSummary:{
        hasProviderPublicTrustClosureCenter:present(resolveSummary(safe, "providerPublicTrustClosureCenterSummary", "WeishanGlobalShoppingProviderPublicTrustClosureCenter", "buildGlobalShoppingProviderPublicTrustClosureCenter")),
        hasOfflineReleaseMemorySnapshot:present(resolveSummary(safe, "offlineReleaseMemorySnapshotSummary", "WeishanGlobalShoppingOfflineReleaseMemorySnapshot", "buildGlobalShoppingOfflineReleaseMemorySnapshot")),
        hasNoProviderExecutionFinalGuard:present(resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard")),
        hasUserFacingSafetyReceipt:present(resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt")),
        hasFinalUserTrustSummary:present(resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary")),
        explainerSectionCount:explainerSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForProviderTrustClosureViewModel:status === "ready"
      },
      explainerSections:explainerSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"User-Visible Safety Boundary Explainer",
        resultLabel:status === "ready" ? "User-Visible Safety Boundary Explainer 已准备" : (status === "blocked" ? "User-Visible Safety Boundary Explainer 已阻断" : "User-Visible Safety Boundary Explainer 仍需复核"),
        caveat:"Safety Boundary 不承诺最低价、最终价或官方背书。"
      },
      safety:safety(),
      redacted:true
    };
    result.rows = buildGlobalShoppingUserVisibleSafetyBoundaryRows(result);
    return clone(result);
  }

  function buildGlobalShoppingUserVisibleSafetyBoundaryExplainerAuditDraft(input) {
    const explainer = buildGlobalShoppingUserVisibleSafetyBoundaryExplainer(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_USER_VISIBLE_SAFETY_BOUNDARY_EXPLAINER_AUDIT_DRAFT",
      explainerName:EXPLAINER_NAME,
      appVersion:GLOBAL_SHOPPING_USER_VISIBLE_SAFETY_BOUNDARY_EXPLAINER_VERSION,
      status:explainer.status,
      explainerSectionCount:obj(explainer.explainerSummary).explainerSectionCount || 0,
      blockedSectionCount:obj(explainer.explainerSummary).blockedSectionCount || 0,
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

  function sanitizeGlobalShoppingUserVisibleSafetyBoundaryExplainer(explainer) {
    return evaluateGlobalShoppingUserVisibleSafetyBoundaryExplainer(explainer || {});
  }

  function buildGlobalShoppingUserVisibleSafetyBoundaryExplainer(input) {
    try {
      return evaluateGlobalShoppingUserVisibleSafetyBoundaryExplainer(input || {});
    } catch (_) {
      return evaluateGlobalShoppingUserVisibleSafetyBoundaryExplainer({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer = {
    GLOBAL_SHOPPING_USER_VISIBLE_SAFETY_BOUNDARY_EXPLAINER_VERSION,
    EXPLAINER_NAME,
    buildGlobalShoppingUserVisibleSafetyBoundaryExplainer,
    evaluateGlobalShoppingUserVisibleSafetyBoundaryExplainer,
    buildGlobalShoppingUserVisibleSafetyBoundaryRows,
    buildGlobalShoppingUserVisibleSafetyBoundarySections,
    buildGlobalShoppingUserVisibleSafetyBoundaryExplainerAuditDraft,
    sanitizeGlobalShoppingUserVisibleSafetyBoundaryExplainer
  };
})();
