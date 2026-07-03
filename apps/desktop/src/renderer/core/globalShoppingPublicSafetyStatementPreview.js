;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PUBLIC_SAFETY_STATEMENT_PREVIEW_VERSION = "4.1.2";
  const STATEMENT_NAME = "global_shopping_public_safety_statement_preview_v1";

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
  function safeMode(value) { return /^(disabled|statement_preview_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "statement_preview_only"; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, status, summary, caveat) {
    return { sectionId:text(sectionId), label:text(label), status:safeStatus(status), summary:text(summary), caveat:text(caveat), redacted:true };
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
      safe.generateRealPublicStatement === true ? "real_public_statement_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.lowestPriceClaim === true ? "lowest_price_claim_detected" : "",
      safe.finalPriceClaim === true ? "final_price_claim_detected" : "",
      safe.partnershipClaim === true ? "partnership_claim_detected" : "",
      safe.endorsementClaim === true ? "endorsement_claim_detected" : "",
      safe.providerClaim === true ? "provider_claim_detected" : "",
      safe.provider === true ? "provider_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingPublicSafetyStatementSections(input) {
    const safe = obj(input);
    const providerReadOnlyPublicReleaseCenterSummary = resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter");
    const finalNoProviderBoundaryReceiptSummary = resolveSummary(safe, "finalNoProviderBoundaryReceiptSummary", "WeishanGlobalShoppingFinalNoProviderBoundaryReceipt", "buildGlobalShoppingFinalNoProviderBoundaryReceipt");
    const userVisibleSafetyBoundaryExplainerSummary = resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer");
    const userFacingSafetyReceiptSummary = resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt");
    const finalUserTrustSummarySummary = resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary");
    return clone([
      section("provider_read_only_public_release_center", "Provider Read-Only Public Release Center", providerReadOnlyPublicReleaseCenterSummary.status, labelOf(providerReadOnlyPublicReleaseCenterSummary, "Provider Read-Only Public Release Center 仍需复核"), "Public Release 不创建真实公开发布。"),
      section("final_no_provider_boundary_receipt", "Final No-Provider Boundary Receipt", finalNoProviderBoundaryReceiptSummary.status, labelOf(finalNoProviderBoundaryReceiptSummary, "Final No-Provider Boundary Receipt 仍需复核"), "No-Provider Receipt 不生成真实回执、不打开平台。"),
      section("user_visible_safety_boundary_explainer", "User-Visible Safety Boundary Explainer", userVisibleSafetyBoundaryExplainerSummary.status, labelOf(userVisibleSafetyBoundaryExplainerSummary, "User-Visible Safety Boundary Explainer 仍需复核"), "Safety Boundary 不承诺最低价、最终价或官方背书。"),
      section("user_facing_safety_receipt", "User-Facing Safety Receipt", userFacingSafetyReceiptSummary.status, labelOf(userFacingSafetyReceiptSummary, "User-Facing Safety Receipt 仍需复核"), "Safety Receipt 不生成真实回执文件。"),
      section("final_user_trust_summary", "Final User Trust Summary", finalUserTrustSummarySummary.status, labelOf(finalUserTrustSummarySummary, "Final User Trust Summary 仍需复核"), "Public Statement 不承诺合作授权或官方背书。")
    ]);
  }

  function buildGlobalShoppingPublicSafetyStatementRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.statementSections).length ? toArray(safe.statementSections) : buildGlobalShoppingPublicSafetyStatementSections(safe);
    return clone([
      row("public_safety_statement_preview_status", "Public Safety Statement Preview", obj(safe.userFacingSummary).resultLabel || "Public Safety Statement Preview 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("public_safety_statement_preview_boundary", "Safety Statement 边界", "当前只展示 public safety statement preview。", "pass"),
      row("public_safety_statement_preview_guard", "只读说明", "不生成真实公开声明，不承诺最低价、最终价或官方背书。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingPublicSafetyStatementPreview(input) {
    const safe = obj(input);
    const statementSections = buildGlobalShoppingPublicSafetyStatementSections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = statementSections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = statementSections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      statementName:STATEMENT_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_SAFETY_STATEMENT_PREVIEW_VERSION,
      status:status,
      statementMode:safeMode(safe.statementMode),
      statementBoundary:{
        statementPreviewOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateRealPublicStatement:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canMakeLowestPriceClaim:false,
        canMakeFinalPriceClaim:false,
        canMakePartnershipClaim:false,
        canMakeEndorsementClaim:false,
        canMakeProviderClaim:false,
        canUseProvider:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false
      },
      statementSummary:{
        hasProviderReadOnlyPublicReleaseCenter:present(resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter")),
        hasFinalNoProviderBoundaryReceipt:present(resolveSummary(safe, "finalNoProviderBoundaryReceiptSummary", "WeishanGlobalShoppingFinalNoProviderBoundaryReceipt", "buildGlobalShoppingFinalNoProviderBoundaryReceipt")),
        hasUserVisibleSafetyBoundaryExplainer:present(resolveSummary(safe, "userVisibleSafetyBoundaryExplainerSummary", "WeishanGlobalShoppingUserVisibleSafetyBoundaryExplainer", "buildGlobalShoppingUserVisibleSafetyBoundaryExplainer")),
        hasUserFacingSafetyReceipt:present(resolveSummary(safe, "userFacingSafetyReceiptSummary", "WeishanGlobalShoppingUserFacingSafetyReceipt", "buildGlobalShoppingUserFacingSafetyReceipt")),
        hasFinalUserTrustSummary:present(resolveSummary(safe, "finalUserTrustSummarySummary", "WeishanGlobalShoppingFinalUserTrustSummary", "buildGlobalShoppingFinalUserTrustSummary")),
        statementSectionCount:statementSections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length
      },
      statementSections:statementSections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Public Safety Statement Preview",
        resultLabel:status === "ready" ? "Public Safety Statement Preview 已准备" : (status === "blocked" ? "Public Safety Statement Preview 已阻断" : "Public Safety Statement Preview 仍需复核"),
        caveat:"Safety Statement 不承诺最低价、最终价或官方背书。"
      },
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
    result.rows = buildGlobalShoppingPublicSafetyStatementRows(result);
    return clone(result);
  }

  function buildGlobalShoppingPublicSafetyStatementPreviewAuditDraft(input) {
    const statement = buildGlobalShoppingPublicSafetyStatementPreview(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PUBLIC_SAFETY_STATEMENT_PREVIEW_AUDIT_DRAFT",
      statementName:STATEMENT_NAME,
      appVersion:GLOBAL_SHOPPING_PUBLIC_SAFETY_STATEMENT_PREVIEW_VERSION,
      status:statement.status,
      statementSectionCount:obj(statement.statementSummary).statementSectionCount || 0,
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

  function sanitizeGlobalShoppingPublicSafetyStatementPreview(statement) {
    return evaluateGlobalShoppingPublicSafetyStatementPreview(statement || {});
  }

  function buildGlobalShoppingPublicSafetyStatementPreview(input) {
    try {
      return evaluateGlobalShoppingPublicSafetyStatementPreview(input || {});
    } catch (_) {
      return evaluateGlobalShoppingPublicSafetyStatementPreview({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingPublicSafetyStatementPreview = {
    GLOBAL_SHOPPING_PUBLIC_SAFETY_STATEMENT_PREVIEW_VERSION,
    STATEMENT_NAME,
    buildGlobalShoppingPublicSafetyStatementPreview,
    evaluateGlobalShoppingPublicSafetyStatementPreview,
    buildGlobalShoppingPublicSafetyStatementRows,
    buildGlobalShoppingPublicSafetyStatementSections,
    buildGlobalShoppingPublicSafetyStatementPreviewAuditDraft,
    sanitizeGlobalShoppingPublicSafetyStatementPreview
  };
})();
