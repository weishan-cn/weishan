;(function () {
  "use strict";

  const GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_RAMP_PREVIEW_VERSION = "2.4.1";
  const PREVIEW_NAME = "global_shopping_external_platform_exit_ramp_preview_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function summaryLabel(summary, fallback) { return text(obj(obj(summary).userFacingSummary).resultLabel || fallback || ""); }
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
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      confirmationStored:false,
      signatureCapture:false,
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

  function evaluateGlobalShoppingExternalPlatformExitRampPreview(input) {
    const safe = obj(input);
    const manualPlatformVisitPreparationCenterSummary = resolveSummary(safe, "manualPlatformVisitPreparationCenterSummary", "WeishanGlobalShoppingManualPlatformVisitPreparationCenter", "buildGlobalShoppingManualPlatformVisitPreparationCenter", safe);
    const externalPlatformBoundaryBriefSummary = resolveSummary(safe, "externalPlatformBoundaryBriefSummary", "WeishanGlobalShoppingExternalPlatformBoundaryBrief", "buildGlobalShoppingExternalPlatformBoundaryBrief", safe);
    const finalUserSafetyChecklistSummary = resolveSummary(safe, "finalUserSafetyChecklistSummary", "WeishanGlobalShoppingFinalUserSafetyChecklist", "buildGlobalShoppingFinalUserSafetyChecklist", safe);
    const platformVisitPreparationViewModelSummary = resolveSummary(safe, "platformVisitPreparationViewModelSummary", "WeishanGlobalShoppingPlatformVisitPreparationViewModel", "buildGlobalShoppingPlatformVisitPreparationViewModel", safe);
    const userFacingManualReviewFlowSummary = resolveSummary(safe, "userFacingManualReviewFlowSummary", "WeishanGlobalShoppingUserFacingManualReviewFlow", "buildGlobalShoppingUserFacingManualReviewFlow", safe);
    const platformVerificationProgressTrackerSummary = resolveSummary(safe, "platformVerificationProgressTrackerSummary", "WeishanGlobalShoppingPlatformVerificationProgressTracker", "buildGlobalShoppingPlatformVerificationProgressTracker", safe);
    const safeNextActionPanelSummary = resolveSummary(safe, "safeNextActionPanelSummary", "WeishanGlobalShoppingSafeNextActionPanel", "buildGlobalShoppingSafeNextActionPanel", safe);
    const userManualReviewViewModelSummary = resolveSummary(safe, "userManualReviewViewModelSummary", "WeishanGlobalShoppingUserManualReviewViewModel", "buildGlobalShoppingUserManualReviewViewModel", safe);
    const missing = [
      manualPlatformVisitPreparationCenterSummary,
      externalPlatformBoundaryBriefSummary,
      finalUserSafetyChecklistSummary,
      platformVisitPreparationViewModelSummary,
      userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary,
      userManualReviewViewModelSummary
    ].some(function (summary) { return !Object.keys(obj(summary)).length; });
    const blocked =
      safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.generateLink === true || safe.persistUserChoice === true || safe.submitUserChoice === true ||
      safe.download === true || safe.export === true || safe.fileWrite === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.signatureCapture === true || safe.contractConfirmation === true || safe.paymentAuthorization === true ||
      safe.hasForbiddenClaim === true;
    const health = {
      hasManualVisitPreparation:statusOf(manualPlatformVisitPreparationCenterSummary) === "ready",
      hasBoundaryBrief:statusOf(externalPlatformBoundaryBriefSummary) === "ready",
      hasFinalChecklist:statusOf(finalUserSafetyChecklistSummary) === "ready",
      hasPreparationViewModel:statusOf(platformVisitPreparationViewModelSummary) === "ready",
      hasUserManualFlow:statusOf(userFacingManualReviewFlowSummary) === "ready",
      hasProgressTracker:statusOf(platformVerificationProgressTrackerSummary) === "ready",
      hasSafeNextActionPanel:statusOf(safeNextActionPanelSummary) === "ready",
      hasUserManualReviewViewModel:statusOf(userManualReviewViewModelSummary) === "ready",
      statesNoPlatformOpen:safe.statesNoPlatformOpen !== false,
      statesNoGeneratedLink:safe.statesNoGeneratedLink !== false,
      statesNoChoicePersistence:safe.statesNoChoicePersistence !== false,
      statesNoContractOrAuthorization:safe.statesNoContractOrAuthorization !== false,
      statesUserLeavesWeishan:safe.statesUserLeavesWeishan !== false,
      noRealUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true,
      noGeneratedLink:safe.generateLink !== true,
      noPersistence:safe.persistUserChoice !== true && safe.submitUserChoice !== true,
      noExportDownloadWrite:safe.download !== true && safe.export !== true && safe.fileWrite !== true,
      noContractOrAuthorization:safe.signatureCapture !== true && safe.contractConfirmation !== true && safe.paymentAuthorization !== true,
      noTransaction:safe.payment !== true && safe.order !== true && safe.ticketing !== true,
      noForbiddenClaims:safe.hasForbiddenClaim !== true
    };
    const needsReview = missing || !health.hasManualVisitPreparation || !health.hasBoundaryBrief || !health.hasFinalChecklist || !health.hasPreparationViewModel || !health.hasUserManualFlow || !health.hasProgressTracker || !health.hasSafeNextActionPanel || !health.hasUserManualReviewViewModel || !health.statesNoPlatformOpen || !health.statesNoGeneratedLink || !health.statesNoChoicePersistence || !health.statesNoContractOrAuthorization || !health.statesUserLeavesWeishan;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      manualPlatformVisitPreparationCenterSummary:manualPlatformVisitPreparationCenterSummary,
      externalPlatformBoundaryBriefSummary:externalPlatformBoundaryBriefSummary,
      finalUserSafetyChecklistSummary:finalUserSafetyChecklistSummary,
      platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary,
      userFacingManualReviewFlowSummary:userFacingManualReviewFlowSummary,
      platformVerificationProgressTrackerSummary:platformVerificationProgressTrackerSummary,
      safeNextActionPanelSummary:safeNextActionPanelSummary,
      userManualReviewViewModelSummary:userManualReviewViewModelSummary,
      exitRampHealth:health,
      blockedReasons:blocked ? [
        safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ? "external_open_detected" : "",
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "real_url_detected" : "",
        safe.generateLink === true ? "generated_link_detected" : "",
        safe.persistUserChoice === true || safe.submitUserChoice === true ? "choice_persistence_detected" : "",
        safe.download === true || safe.export === true || safe.fileWrite === true ? "export_download_write_detected" : "",
        safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_detected" : "",
        safe.signatureCapture === true || safe.contractConfirmation === true || safe.paymentAuthorization === true ? "contract_or_authorization_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingExternalPlatformExitRampPreviewSections(input) {
    const evaluation = evaluateGlobalShoppingExternalPlatformExitRampPreview(input);
    return clone([
      section("review_flow", "复核链路摘要", statusOf(evaluation.userManualReviewViewModelSummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.userManualReviewViewModelSummary, "用户手动复核与安全下一步仍需复核"), "退出坡道只复述已完成的只读教育链路。"),
      section("visit_preparation", "平台访问准备摘要", statusOf(evaluation.platformVisitPreparationViewModelSummary) === "ready" ? "pass" : "warning", summaryLabel(evaluation.platformVisitPreparationViewModelSummary, "平台访问准备与最终安全清单仍需复核"), "当前只展示离开 Weishan 前的最终说明。"),
      section("no_platform_open", "离开 Weishan 的方式", evaluation.exitRampHealth.statesNoPlatformOpen ? "pass" : "warning", "用户离开 Weishan 后自行前往平台，Weishan 不打开平台。", "不生成真实平台链接，不代替用户跳转。"),
      section("no_choice_persist", "选择与确认边界", evaluation.exitRampHealth.statesNoChoicePersistence ? "pass" : "warning", "不保存用户的离开确认、最终选择或签名。", "退出坡道不是订单、合同、付款授权或平台确认。")
    ]);
  }

  function buildGlobalShoppingExternalPlatformExitRampPreviewRows(input) {
    const evaluation = evaluateGlobalShoppingExternalPlatformExitRampPreview(input);
    return clone([
      row("exit_ramp_scope", "外部平台退出坡道预览", "当前只展示离开 Weishan 前的最终说明", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("review_flow", "用户手动复核与安全下一步", summaryLabel(evaluation.userManualReviewViewModelSummary, "用户手动复核与安全下一步仍需复核"), statusOf(evaluation.userManualReviewViewModelSummary) === "ready" ? "pass" : "warning"),
      row("visit_preparation", "平台访问准备与最终安全清单", summaryLabel(evaluation.platformVisitPreparationViewModelSummary, "平台访问准备与最终安全清单仍需复核"), statusOf(evaluation.platformVisitPreparationViewModelSummary) === "ready" ? "pass" : "warning"),
      row("no_open", "退出坡道不打开平台", "Weishan 不打开平台，不生成链接，由用户自行前往平台", evaluation.exitRampHealth.statesNoPlatformOpen ? "pass" : "warning"),
      row("no_save", "安全简报不保存确认", "不保存离开确认、最终选择或签名", evaluation.exitRampHealth.statesNoChoicePersistence ? "pass" : "warning"),
      row("no_contract", "关闭包不是合同、订单或付款授权", "离开 Weishan 前的最终说明不构成合同、订单、付款授权或平台确认", evaluation.exitRampHealth.statesNoContractOrAuthorization ? "pass" : "warning")
    ]);
  }

  function sanitizeGlobalShoppingExternalPlatformExitRampPreview(preview) {
    const safe = obj(preview);
    const evaluation = evaluateGlobalShoppingExternalPlatformExitRampPreview(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      previewName:PREVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_RAMP_PREVIEW_VERSION,
      status:status,
      exitRampMode:text(safe.exitRampMode || "display_only") || "display_only",
      sections:toArray(safe.sections).length ? toArray(safe.sections) : buildGlobalShoppingExternalPlatformExitRampPreviewSections(safe),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingExternalPlatformExitRampPreviewRows(safe),
      exitRampHealth:clone(evaluation.exitRampHealth),
      manualPlatformVisitPreparationCenterSummary:clone(evaluation.manualPlatformVisitPreparationCenterSummary),
      externalPlatformBoundaryBriefSummary:clone(evaluation.externalPlatformBoundaryBriefSummary),
      finalUserSafetyChecklistSummary:clone(evaluation.finalUserSafetyChecklistSummary),
      platformVisitPreparationViewModelSummary:clone(evaluation.platformVisitPreparationViewModelSummary),
      userFacingManualReviewFlowSummary:clone(evaluation.userFacingManualReviewFlowSummary),
      platformVerificationProgressTrackerSummary:clone(evaluation.platformVerificationProgressTrackerSummary),
      safeNextActionPanelSummary:clone(evaluation.safeNextActionPanelSummary),
      userManualReviewViewModelSummary:clone(evaluation.userManualReviewViewModelSummary),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"外部平台退出坡道预览",
        resultLabel:status === "ready" ? "外部平台退出坡道已准备" : (status === "blocked" ? "外部平台退出坡道已阻断" : "外部平台退出坡道仍需复核"),
        caveat:"当前只展示离开 Weishan 前的最终说明，不打开平台，不生成链接，不保存选择，不构成订单、付款授权或签名。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingExternalPlatformExitRampPreview(input) {
    try {
      return sanitizeGlobalShoppingExternalPlatformExitRampPreview(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingExternalPlatformExitRampPreview({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingExternalPlatformExitRampPreviewAuditDraft(input) {
    const preview = buildGlobalShoppingExternalPlatformExitRampPreview(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_RAMP_PREVIEW_AUDIT_DRAFT",
      previewName:PREVIEW_NAME,
      appVersion:GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_RAMP_PREVIEW_VERSION,
      status:preview.status,
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

  window.WeishanGlobalShoppingExternalPlatformExitRampPreview = {
    GLOBAL_SHOPPING_EXTERNAL_PLATFORM_EXIT_RAMP_PREVIEW_VERSION,
    PREVIEW_NAME,
    buildGlobalShoppingExternalPlatformExitRampPreview,
    evaluateGlobalShoppingExternalPlatformExitRampPreview,
    buildGlobalShoppingExternalPlatformExitRampPreviewSections,
    buildGlobalShoppingExternalPlatformExitRampPreviewRows,
    buildGlobalShoppingExternalPlatformExitRampPreviewAuditDraft,
    sanitizeGlobalShoppingExternalPlatformExitRampPreview
  };
})();
