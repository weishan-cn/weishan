;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_COMMERCE_SESSION_RECAP_CENTER_VERSION = "4.1.6";
  const CENTER_NAME = "global_shopping_read_only_commerce_session_recap_center_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function summaryLabel(summary, fallback) { return text(obj(obj(summary).userFacingSummary).resultLabel || obj(summary).title || fallback || ""); }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, title, status, summary, caveat) {
    return { sectionId:text(sectionId), title:text(title), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", summary:text(summary), caveat:text(caveat), redacted:true };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      export:false,
      upload:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
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
    }, obj(overrides));
  }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? api[methodName](buildInput || safe) : {};
  }

  function evaluateGlobalShoppingReadOnlyCommerceSessionRecapCenter(input) {
    const safe = obj(input);
    const externalPlatformExitRampPreviewSummary = resolveSummary(safe, "externalPlatformExitRampPreviewSummary", "WeishanGlobalShoppingExternalPlatformExitRampPreview", "buildGlobalShoppingExternalPlatformExitRampPreview", safe);
    const manualVisitSafetyBriefSummary = resolveSummary(safe, "manualVisitSafetyBriefSummary", "WeishanGlobalShoppingManualVisitSafetyBrief", "buildGlobalShoppingManualVisitSafetyBrief", safe);
    const readOnlySessionClosurePackSummary = resolveSummary(safe, "readOnlySessionClosurePackSummary", "WeishanGlobalShoppingReadOnlySessionClosurePack", "buildGlobalShoppingReadOnlySessionClosurePack", safe);
    const platformVisitPreparationViewModelSummary = resolveSummary(safe, "platformVisitPreparationViewModelSummary", "WeishanGlobalShoppingPlatformVisitPreparationViewModel", "buildGlobalShoppingPlatformVisitPreparationViewModel", safe);
    const finalUserSafetyChecklistSummary = resolveSummary(safe, "finalUserSafetyChecklistSummary", "WeishanGlobalShoppingFinalUserSafetyChecklist", "buildGlobalShoppingFinalUserSafetyChecklist", safe);
    const userFacingManualReviewFlowSummary = resolveSummary(safe, "userFacingManualReviewFlowSummary", "WeishanGlobalShoppingUserFacingManualReviewFlow", "buildGlobalShoppingUserFacingManualReviewFlow", safe);
    const safeNextActionPanelSummary = resolveSummary(safe, "safeNextActionPanelSummary", "WeishanGlobalShoppingSafeNextActionPanel", "buildGlobalShoppingSafeNextActionPanel", safe);
    const sandboxCandidateComparisonWorkbenchSummary = resolveSummary(safe, "sandboxCandidateComparisonWorkbenchSummary", "WeishanGlobalShoppingSandboxCandidateComparisonWorkbench", "buildGlobalShoppingSandboxCandidateComparisonWorkbench", safe);
    const providerEvidenceComparisonMatrixSummary = resolveSummary(safe, "providerEvidenceComparisonMatrixSummary", "WeishanGlobalShoppingProviderEvidenceComparisonMatrix", "buildGlobalShoppingProviderEvidenceComparisonMatrix", safe);
    const readOnlySourceTrustScoreSummary = resolveSummary(safe, "readOnlySourceTrustScoreSummary", "WeishanGlobalShoppingReadOnlySourceTrustScore", "buildGlobalShoppingReadOnlySourceTrustScore", safe);
    const readOnlyHandoffPacketPreviewSummary = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", safe);
    const userActionBoundaryReceiptSummary = resolveSummary(safe, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", safe);

    const blocked =
      safe.persistRecap === true || safe.export === true || safe.download === true || safe.upload === true || safe.fileWrite === true ||
      safe.contractClaim === true || safe.platformConfirmationClaim === true || safe.hasForbiddenClaim === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true || safe.paymentAuthorization === true;

    const recapSummary = {
      hasExitRampPreview:Object.keys(obj(externalPlatformExitRampPreviewSummary)).length > 0,
      hasManualVisitSafetyBrief:Object.keys(obj(manualVisitSafetyBriefSummary)).length > 0,
      hasSessionClosurePack:Object.keys(obj(readOnlySessionClosurePackSummary)).length > 0,
      hasPlatformVisitPreparation:Object.keys(obj(platformVisitPreparationViewModelSummary)).length > 0,
      hasFinalSafetyChecklist:Object.keys(obj(finalUserSafetyChecklistSummary)).length > 0,
      hasManualReviewFlow:Object.keys(obj(userFacingManualReviewFlowSummary)).length > 0,
      hasSafeNextActionPanel:Object.keys(obj(safeNextActionPanelSummary)).length > 0,
      hasCandidateComparison:Object.keys(obj(sandboxCandidateComparisonWorkbenchSummary)).length > 0,
      hasEvidenceMatrix:Object.keys(obj(providerEvidenceComparisonMatrixSummary)).length > 0,
      hasSourceTrustSummary:Object.keys(obj(readOnlySourceTrustScoreSummary)).length > 0,
      hasHandoffPacketSummary:Object.keys(obj(readOnlyHandoffPacketPreviewSummary)).length > 0,
      hasUserBoundarySummary:Object.keys(obj(userActionBoundaryReceiptSummary)).length > 0,
      recapSectionCount:6,
      blockedRiskCount:blocked ? 1 : 0,
      userOnlyActionCount:3,
      platformOnlyVerificationCount:2
    };
    const recapHealth = {
      noPersistence:safe.persistRecap !== true,
      noExportDownloadUpload:safe.export !== true && safe.download !== true && safe.upload !== true && safe.fileWrite !== true,
      noRealUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true,
      noCheckoutPaymentTicketingOrder:safe.payment !== true && safe.order !== true && safe.ticketing !== true,
      noPaymentAuthorization:safe.paymentAuthorization !== true,
      noContractClaim:safe.contractClaim !== true,
      noPlatformConfirmationClaim:safe.platformConfirmationClaim !== true,
      noForbiddenClaims:safe.hasForbiddenClaim !== true,
      platformFinalAuthorityVisible:safe.platformFinalAuthorityVisible !== false,
      userManualDecisionVisible:safe.userManualDecisionVisible !== false
    };
    const needsReview =
      !recapSummary.hasExitRampPreview || !recapSummary.hasManualVisitSafetyBrief || !recapSummary.hasSessionClosurePack ||
      !recapSummary.hasPlatformVisitPreparation || !recapSummary.hasFinalSafetyChecklist || !recapSummary.hasManualReviewFlow ||
      !recapSummary.hasSafeNextActionPanel || !recapSummary.hasCandidateComparison || !recapSummary.hasEvidenceMatrix ||
      !recapSummary.hasSourceTrustSummary || !recapSummary.hasHandoffPacketSummary || !recapSummary.hasUserBoundarySummary ||
      !recapHealth.platformFinalAuthorityVisible || !recapHealth.userManualDecisionVisible;

    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary,
      manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary,
      readOnlySessionClosurePackSummary:readOnlySessionClosurePackSummary,
      platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary,
      finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary,
      userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary,
      safeNextActionPanelSummary:safeNextActionPanelSummary,
      sandboxCandidateComparisonWorkbenchSummary:sandboxCandidateComparisonWorkbenchSummary,
      providerEvidenceComparisonMatrixSummary:providerEvidenceComparisonMatrixSummary,
      readOnlySourceTrustScoreSummary:readOnlySourceTrustScoreSummary,
      readOnlyHandoffPacketPreviewSummary:readOnlyHandoffPacketPreviewSummary,
      userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary,
      recapSummary:recapSummary,
      recapHealth:recapHealth,
      blockedReasons:blocked ? [
        safe.persistRecap === true ? "recap_persistence_detected" : "",
        safe.export === true || safe.download === true || safe.upload === true || safe.fileWrite === true ? "export_download_upload_detected" : "",
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "real_url_detected" : "",
        safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ? "external_open_detected" : "",
        safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_detected" : "",
        safe.paymentAuthorization === true ? "payment_authorization_detected" : "",
        safe.contractClaim === true ? "contract_claim_detected" : "",
        safe.platformConfirmationClaim === true ? "platform_confirmation_claim_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlyCommerceSessionRecapSections(input) {
    const evaluation = evaluateGlobalShoppingReadOnlyCommerceSessionRecapCenter(input);
    return clone([
      section("target_scope", "本次查找目标", "pass", "只回顾本次只读全球购复核链路，不代表真实平台结果。", "会话总结不保存、不导出。"),
      section("candidate_state", "候选与来源状态", statusOf(evaluation.readOnlySourceTrustScoreSummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.readOnlySourceTrustScoreSummary, "来源可信度仍需复核"), "当前候选仅基于只读证据。"),
      section("evidence_state", "证据与对比状态", statusOf(evaluation.providerEvidenceComparisonMatrixSummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.providerEvidenceComparisonMatrixSummary, "证据矩阵仍需复核"), "证据完整性不足时不应放大承诺。"),
      section("closure_state", "交接与关闭状态", statusOf(evaluation.readOnlySessionClosurePackSummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.readOnlySessionClosurePackSummary, "只读会话关闭包仍需复核"), "交接包不是合同、订单、付款授权或平台确认。"),
      section("boundary_state", "安全边界状态", evaluation.recapHealth.noRealUrl && evaluation.recapHealth.noExternalOpen ? "pass" : "warning", "不打开平台、不生成真实链接、不付款、不下单、不出票。", "用户仍需自行到平台完成最终核对和操作。"),
      section("next_step_boundary", "用户下一步边界", evaluation.recapHealth.userManualDecisionVisible ? "pass" : "warning", "离开 Weishan 后由用户自行判断并在平台自行完成后续动作。", "平台页面为最终依据。")
    ]);
  }

  function buildGlobalShoppingReadOnlyCommerceSessionRecapRows(input) {
    const evaluation = evaluateGlobalShoppingReadOnlyCommerceSessionRecapCenter(input);
    return clone([
      row("recap_title", "只读全球购会话总结", "当前只展示本次只读复核结果与边界", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("candidate_comparison", "候选对比", summaryLabel(evaluation.sandboxCandidateComparisonWorkbenchSummary, "候选对比仍需复核"), statusOf(evaluation.sandboxCandidateComparisonWorkbenchSummary) === "ready" ? "pass" : "warning"),
      row("evidence_matrix", "证据矩阵", summaryLabel(evaluation.providerEvidenceComparisonMatrixSummary, "证据矩阵仍需复核"), statusOf(evaluation.providerEvidenceComparisonMatrixSummary) === "ready" ? "pass" : "warning"),
      row("source_trust", "来源可信度", summaryLabel(evaluation.readOnlySourceTrustScoreSummary, "来源可信度仍需复核"), statusOf(evaluation.readOnlySourceTrustScoreSummary) === "ready" ? "pass" : "warning"),
      row("handoff_packet", "交接包状态", summaryLabel(evaluation.readOnlyHandoffPacketPreviewSummary, "交接包预览仍需复核"), statusOf(evaluation.readOnlyHandoffPacketPreviewSummary) === "ready" ? "pass" : "warning"),
      row("user_boundary", "用户下一步边界", summaryLabel(evaluation.userActionBoundaryReceiptSummary, "用户边界回执仍需复核"), statusOf(evaluation.userActionBoundaryReceiptSummary) === "ready" ? "pass" : "warning"),
      row("no_export", "会话总结不保存、不导出", "不保存、不导出、不下载、不上传、不写文件", evaluation.recapHealth.noPersistence && evaluation.recapHealth.noExportDownloadUpload ? "pass" : "warning"),
      row("no_trade", "交易动作边界", "不打开平台，不付款，不下单，不出票，不构成平台确认", evaluation.recapHealth.noRealUrl && evaluation.recapHealth.noExternalOpen && evaluation.recapHealth.noCheckoutPaymentTicketingOrder ? "pass" : "warning")
    ]);
  }

  function sanitizeGlobalShoppingReadOnlyCommerceSessionRecapCenter(center) {
    const safe = obj(center);
    const evaluation = evaluateGlobalShoppingReadOnlyCommerceSessionRecapCenter(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_COMMERCE_SESSION_RECAP_CENTER_VERSION,
      status:status,
      recapBoundary:{
        recapId:text(safe.recapId || "global-shopping-read-only-commerce-session-recap-center"),
        recapMode:/^(disabled|display_only|review_only|sandbox_ready)$/.test(text(safe.recapMode)) ? text(safe.recapMode) : "display_only",
        displayOnly:true,
        reviewOnly:true,
        readOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canPersistRecap:false,
        canExportRecap:false,
        canDownloadRecap:false,
        canUploadRecap:false,
        canGenerateRealUrl:false,
        canOpenExternalNow:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        canCreateOrder:false,
        canAuthorizePayment:false
      },
      recapSummary:clone(evaluation.recapSummary),
      recapSections:toArray(safe.recapSections).length ? toArray(safe.recapSections) : buildGlobalShoppingReadOnlyCommerceSessionRecapSections(safe),
      recapHealth:clone(evaluation.recapHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingReadOnlyCommerceSessionRecapRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"只读全球购会话总结",
        resultLabel:status === "ready" ? "会话总结已准备" : (status === "blocked" ? "会话总结已阻断" : "会话总结仍需复核"),
        caveat:"该总结只回顾本次只读复核，不保存、不导出、不打开平台，不构成订单、合同、付款授权或平台确认。",
        redacted:true
      },
      externalPlatformExitRampPreviewSummary:clone(evaluation.externalPlatformExitRampPreviewSummary),
      manualVisitSafetyBriefSummary:clone(evaluation.manualVisitSafetyBriefSummary),
      readOnlySessionClosurePackSummary:clone(evaluation.readOnlySessionClosurePackSummary),
      platformVisitPreparationViewModelSummary:clone(evaluation.platformVisitPreparationViewModelSummary),
      finalUserSafetyChecklistSummary:clone(evaluation.finalUserSafetyChecklistSummary),
      userFacingManualReviewFlowSummary:clone(evaluation.userFacingManualReviewFlowSummary),
      safeNextActionPanelSummary:clone(evaluation.safeNextActionPanelSummary),
      sandboxCandidateComparisonWorkbenchSummary:clone(evaluation.sandboxCandidateComparisonWorkbenchSummary),
      providerEvidenceComparisonMatrixSummary:clone(evaluation.providerEvidenceComparisonMatrixSummary),
      readOnlySourceTrustScoreSummary:clone(evaluation.readOnlySourceTrustScoreSummary),
      readOnlyHandoffPacketPreviewSummary:clone(evaluation.readOnlyHandoffPacketPreviewSummary),
      userActionBoundaryReceiptSummary:clone(evaluation.userActionBoundaryReceiptSummary),
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlyCommerceSessionRecapCenter(input) {
    try {
      return sanitizeGlobalShoppingReadOnlyCommerceSessionRecapCenter(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingReadOnlyCommerceSessionRecapCenter({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingReadOnlyCommerceSessionRecapCenterAuditDraft(input) {
    const center = buildGlobalShoppingReadOnlyCommerceSessionRecapCenter(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_COMMERCE_SESSION_RECAP_CENTER_AUDIT_DRAFT",
      centerName:CENTER_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_COMMERCE_SESSION_RECAP_CENTER_VERSION,
      status:center.status,
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

  window.WeishanGlobalShoppingReadOnlyCommerceSessionRecapCenter = {
    GLOBAL_SHOPPING_READ_ONLY_COMMERCE_SESSION_RECAP_CENTER_VERSION,
    CENTER_NAME,
    buildGlobalShoppingReadOnlyCommerceSessionRecapCenter,
    evaluateGlobalShoppingReadOnlyCommerceSessionRecapCenter,
    buildGlobalShoppingReadOnlyCommerceSessionRecapRows,
    buildGlobalShoppingReadOnlyCommerceSessionRecapSections,
    buildGlobalShoppingReadOnlyCommerceSessionRecapCenterAuditDraft,
    sanitizeGlobalShoppingReadOnlyCommerceSessionRecapCenter
  };
})();
