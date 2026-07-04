;(function () {
  "use strict";

  const GLOBAL_SHOPPING_FINAL_NO_PROVIDER_BOUNDARY_RECEIPT_VERSION = "4.2.3";
  const RECEIPT_NAME = "global_shopping_final_no_provider_boundary_receipt_v1";

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
  function safeMode(value) { return /^(disabled|receipt_only|readonly|offline_mock)$/.test(text(value)) ? text(value) : "receipt_only"; }
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
      safe.generateRealReceiptFile === true ? "real_receipt_file_detected" : "",
      safe.writeFile === true ? "file_write_detected" : "",
      safe.download === true ? "download_detected" : "",
      safe.upload === true ? "upload_detected" : "",
      safe.mail === true ? "mail_detected" : "",
      safe.openExternalDocument === true ? "external_document_detected" : "",
      safe.persistReceipt === true ? "receipt_persistence_detected" : "",
      safe.persistRawUserText === true ? "raw_user_text_persistence_detected" : "",
      safe.persistRawProviderData === true ? "raw_provider_persistence_detected" : "",
      safe.executeRealBlocking === true ? "real_blocking_execution_detected" : "",
      safe.mutateConfig === true ? "config_mutation_detected" : "",
      safe.enableProvider === true ? "provider_enable_detected" : "",
      safe.disableProvider === true ? "provider_disable_detected" : "",
      safe.providerClient === true ? "provider_client_detected" : "",
      safe.endpoint === true ? "endpoint_detected" : "",
      safe.readApiKey === true ? "api_key_read_detected" : "",
      safe.network === true ? "network_detected" : "",
      safe.createRelease === true ? "release_creation_detected" : "",
      safe.createTag === true ? "tag_creation_detected" : "",
      safe.push === true ? "push_detected" : "",
      safe.activateSandbox === true ? "sandbox_activation_detected" : "",
      safe.openExternal === true ? "open_external_detected" : "",
      safe.windowOpen === true ? "window_open_detected" : "",
      safe.booking === true ? "booking_detected" : "",
      safe.payment === true ? "payment_detected" : "",
      safe.order === true ? "order_detected" : "",
      safe.checkout === true ? "checkout_detected" : ""
    ].filter(Boolean);
  }

  function buildGlobalShoppingFinalNoProviderBoundarySections(input) {
    const safe = obj(input);
    const providerReadOnlyPublicReleaseCenterSummary = resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter");
    const trustClosureExportPreviewSummary = resolveSummary(safe, "trustClosureExportPreviewSummary", "WeishanGlobalShoppingTrustClosureExportPreview", "buildGlobalShoppingTrustClosureExportPreview");
    const noProviderExecutionFinalGuardSummary = resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard");
    const providerNoActivationGuaranteeBoardSummary = resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard");
    const safetySentinelSummary = obj(safe.safetySentinelSummary || safe.safetyRegressionSummary || {});
    return clone([
      section("provider_read_only_public_release_center", "Provider Read-Only Public Release Center", providerReadOnlyPublicReleaseCenterSummary.status, labelOf(providerReadOnlyPublicReleaseCenterSummary, "Provider Read-Only Public Release Center 仍需复核"), "Public Release 不创建真实公开发布。"),
      section("trust_closure_export_preview", "Trust Closure Export Preview", trustClosureExportPreviewSummary.status, labelOf(trustClosureExportPreviewSummary, "Trust Closure Export Preview 仍需复核"), "Export Preview 不生成真实导出文件。"),
      section("no_provider_execution_final_guard", "No-Provider-Execution Final Guard", noProviderExecutionFinalGuardSummary.status, labelOf(noProviderExecutionFinalGuardSummary, "No-Provider-Execution Final Guard 仍需复核"), "No-Provider Guard 不执行真实阻断。"),
      section("provider_no_activation_guarantee_board", "Provider No-Activation Guarantee Board", providerNoActivationGuaranteeBoardSummary.status, labelOf(providerNoActivationGuaranteeBoardSummary, "Provider No-Activation Guarantee Board 仍需复核"), "No-Activation Guarantee 不启用 provider。"),
      section("flight_workflow_safety_regression_sentinel", "Flight Workflow Safety Regression Sentinel", safetySentinelSummary.status, labelOf(safetySentinelSummary, "Flight Workflow Safety Regression Sentinel 仍需复核"), "Safety Sentinel 不打开平台、不联网。")
    ]);
  }

  function buildGlobalShoppingFinalNoProviderBoundaryRows(input) {
    const safe = obj(input);
    const sections = toArray(safe.boundarySections).length ? toArray(safe.boundarySections) : buildGlobalShoppingFinalNoProviderBoundarySections(safe);
    return clone([
      row("final_no_provider_boundary_receipt_status", "Final No-Provider Boundary Receipt", obj(safe.userFacingSummary).resultLabel || "Final No-Provider Boundary Receipt 仍需复核", safe.status === "ready" ? "pass" : (safe.status === "blocked" ? "blocked" : "warning")),
      row("final_no_provider_boundary_receipt_boundary", "No-Provider Receipt 边界", "当前只展示 final no-provider boundary receipt。", "pass"),
      row("final_no_provider_boundary_receipt_guard", "只读说明", "不生成真实回执文件，不写文件，不下载，不上传，不打开平台。", "pass")
    ].concat(sections.map(function (item) {
      return row(item.sectionId, item.label, item.summary, item.status === "ready" ? "pass" : (item.status === "blocked" || item.status === "failed_safe" || item.status === "fail" ? "blocked" : "warning"));
    })));
  }

  function evaluateGlobalShoppingFinalNoProviderBoundaryReceipt(input) {
    const safe = obj(input);
    const boundarySections = buildGlobalShoppingFinalNoProviderBoundarySections(safe);
    const directBlockedReasons = blockedReasons(safe);
    const blockedSections = boundarySections.filter(function (item) { return item.status === "blocked" || item.status === "failed_safe" || item.status === "fail"; });
    const needsReviewSections = boundarySections.filter(function (item) { return item.status === "needs_review" || item.status === "warning"; });
    const status = directBlockedReasons.length || blockedSections.length ? "blocked" : (needsReviewSections.length ? "needs_review" : "ready");
    const result = {
      receiptName:RECEIPT_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_NO_PROVIDER_BOUNDARY_RECEIPT_VERSION,
      status:status,
      receiptMode:safeMode(safe.receiptMode),
      noProviderBoundary:{
        receiptOnly:true,
        offlineMock:true,
        readOnly:true,
        canGenerateRealReceiptFile:false,
        canWriteFile:false,
        canDownload:false,
        canUpload:false,
        canSendMail:false,
        canOpenExternalDocument:false,
        canPersistReceipt:false,
        canStoreRawUserText:false,
        canStoreRawProviderData:false,
        canExecuteRealBlocking:false,
        canMutateConfig:false,
        canEnableProvider:false,
        canDisableProvider:false,
        canCreateProviderClient:false,
        canGenerateEndpoint:false,
        canReadApiKey:false,
        canCallNetwork:false,
        canCreateRelease:false,
        canCreateTag:false,
        canPush:false,
        canActivateSandbox:false,
        canOpenPlatform:false
      },
      receiptSummary:{
        hasProviderReadOnlyPublicReleaseCenter:present(resolveSummary(safe, "providerReadOnlyPublicReleaseCenterSummary", "WeishanGlobalShoppingProviderReadOnlyPublicReleaseCenter", "buildGlobalShoppingProviderReadOnlyPublicReleaseCenter")),
        hasTrustClosureExportPreview:present(resolveSummary(safe, "trustClosureExportPreviewSummary", "WeishanGlobalShoppingTrustClosureExportPreview", "buildGlobalShoppingTrustClosureExportPreview")),
        hasNoProviderExecutionFinalGuard:present(resolveSummary(safe, "noProviderExecutionFinalGuardSummary", "WeishanGlobalShoppingNoProviderExecutionFinalGuard", "buildGlobalShoppingNoProviderExecutionFinalGuard")),
        hasProviderNoActivationGuaranteeBoard:present(resolveSummary(safe, "providerNoActivationGuaranteeBoardSummary", "WeishanGlobalShoppingProviderNoActivationGuaranteeBoard", "buildGlobalShoppingProviderNoActivationGuaranteeBoard")),
        hasSafetySentinel:present(obj(safe.safetySentinelSummary || safe.safetyRegressionSummary || {})),
        boundarySectionCount:boundarySections.length,
        needsReviewSectionCount:needsReviewSections.length,
        blockedSectionCount:directBlockedReasons.length + blockedSections.length,
        readyForPublicSafetyStatementPreview:status === "ready"
      },
      boundarySections:boundarySections,
      rows:[],
      blockedReasons:directBlockedReasons.concat(blockedSections.map(function (item) { return item.sectionId + "_blocked"; })),
      userFacingSummary:{
        title:"Final No-Provider Boundary Receipt",
        resultLabel:status === "ready" ? "Final No-Provider Boundary Receipt 已准备" : (status === "blocked" ? "Final No-Provider Boundary Receipt 已阻断" : "Final No-Provider Boundary Receipt 仍需复核"),
        caveat:"No-Provider Receipt 不生成真实回执、不打开平台。"
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
    result.rows = buildGlobalShoppingFinalNoProviderBoundaryRows(result);
    return clone(result);
  }

  function buildGlobalShoppingFinalNoProviderBoundaryReceiptAuditDraft(input) {
    const receipt = buildGlobalShoppingFinalNoProviderBoundaryReceipt(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_FINAL_NO_PROVIDER_BOUNDARY_RECEIPT_AUDIT_DRAFT",
      receiptName:RECEIPT_NAME,
      appVersion:GLOBAL_SHOPPING_FINAL_NO_PROVIDER_BOUNDARY_RECEIPT_VERSION,
      status:receipt.status,
      boundarySectionCount:obj(receipt.receiptSummary).boundarySectionCount || 0,
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

  function sanitizeGlobalShoppingFinalNoProviderBoundaryReceipt(receipt) {
    return evaluateGlobalShoppingFinalNoProviderBoundaryReceipt(receipt || {});
  }

  function buildGlobalShoppingFinalNoProviderBoundaryReceipt(input) {
    try {
      return evaluateGlobalShoppingFinalNoProviderBoundaryReceipt(input || {});
    } catch (_) {
      return evaluateGlobalShoppingFinalNoProviderBoundaryReceipt({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingFinalNoProviderBoundaryReceipt = {
    GLOBAL_SHOPPING_FINAL_NO_PROVIDER_BOUNDARY_RECEIPT_VERSION,
    RECEIPT_NAME,
    buildGlobalShoppingFinalNoProviderBoundaryReceipt,
    evaluateGlobalShoppingFinalNoProviderBoundaryReceipt,
    buildGlobalShoppingFinalNoProviderBoundaryRows,
    buildGlobalShoppingFinalNoProviderBoundarySections,
    buildGlobalShoppingFinalNoProviderBoundaryReceiptAuditDraft,
    sanitizeGlobalShoppingFinalNoProviderBoundaryReceipt
  };
})();
