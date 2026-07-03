;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_SESSION_CLOSURE_PACK_VERSION = "4.1.4";
  const PACK_NAME = "global_shopping_read_only_session_closure_pack_v1";

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

  function evaluateGlobalShoppingReadOnlySessionClosurePack(input) {
    const safe = obj(input);
    const externalPlatformExitRampPreviewSummary = resolveSummary(safe, "externalPlatformExitRampPreviewSummary", "WeishanGlobalShoppingExternalPlatformExitRampPreview", "buildGlobalShoppingExternalPlatformExitRampPreview", safe);
    const manualVisitSafetyBriefSummary = resolveSummary(safe, "manualVisitSafetyBriefSummary", "WeishanGlobalShoppingManualVisitSafetyBrief", "buildGlobalShoppingManualVisitSafetyBrief", safe);
    const platformVisitPreparationViewModelSummary = resolveSummary(safe, "platformVisitPreparationViewModelSummary", "WeishanGlobalShoppingPlatformVisitPreparationViewModel", "buildGlobalShoppingPlatformVisitPreparationViewModel", safe);
    const blocked =
      statusOf(externalPlatformExitRampPreviewSummary) === "blocked" ||
      statusOf(manualVisitSafetyBriefSummary) === "blocked" ||
      safe.export === true || safe.download === true || safe.fileWrite === true || safe.upload === true ||
      safe.confirmationStored === true || safe.signatureCapture === true || safe.contractConfirmation === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ||
      safe.hasForbiddenClaim === true;
    const health = {
      hasExitRampPreview:statusOf(externalPlatformExitRampPreviewSummary) === "ready",
      hasManualVisitSafetyBrief:statusOf(manualVisitSafetyBriefSummary) === "ready",
      hasVisitPreparationViewModel:statusOf(platformVisitPreparationViewModelSummary) === "ready",
      statesReadOnlyClosureShown:safe.statesReadOnlyClosureShown !== false,
      statesNotContractOrderPayment:safe.statesNotContractOrderPayment !== false,
      statesNoExportDownload:safe.statesNoExportDownload !== false,
      statesNoConfirmationPersistence:safe.statesNoConfirmationPersistence !== false,
      noExportDownloadWrite:!(safe.export === true || safe.download === true || safe.fileWrite === true || safe.upload === true),
      noConfirmationPersistence:safe.confirmationStored !== true && safe.signatureCapture !== true && safe.contractConfirmation !== true,
      noRealUrl:!(safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl),
      noTransaction:safe.payment !== true && safe.order !== true && safe.ticketing !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true,
      noForbiddenClaims:safe.hasForbiddenClaim !== true
    };
    const needsReview = !health.hasExitRampPreview || !health.hasManualVisitSafetyBrief || !health.hasVisitPreparationViewModel || !health.statesReadOnlyClosureShown || !health.statesNotContractOrderPayment || !health.statesNoExportDownload || !health.statesNoConfirmationPersistence;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      externalPlatformExitRampPreviewSummary:externalPlatformExitRampPreviewSummary,
      manualVisitSafetyBriefSummary:manualVisitSafetyBriefSummary,
      platformVisitPreparationViewModelSummary:platformVisitPreparationViewModelSummary,
      closureHealth:health,
      blockedReasons:blocked ? [
        statusOf(externalPlatformExitRampPreviewSummary) === "blocked" ? "exit_ramp_blocked" : "",
        statusOf(manualVisitSafetyBriefSummary) === "blocked" ? "safety_brief_blocked" : "",
        safe.export === true || safe.download === true || safe.fileWrite === true || safe.upload === true ? "export_download_write_detected" : "",
        safe.confirmationStored === true || safe.signatureCapture === true || safe.contractConfirmation === true ? "confirmation_persistence_detected" : "",
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "real_url_detected" : "",
        safe.payment === true || safe.order === true || safe.ticketing === true ? "transaction_detected" : "",
        safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true ? "external_open_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlySessionClosurePackRows(input) {
    const evaluation = evaluateGlobalShoppingReadOnlySessionClosurePack(input);
    return clone([
      row("closure_scope", "只读会话关闭包", "当前只展示离开 Weishan 前的最终说明", evaluation.status === "blocked" ? "blocked" : "pass"),
      row("exit_ramp", "退出坡道", summaryLabel(evaluation.externalPlatformExitRampPreviewSummary, "外部平台退出坡道仍需复核"), statusOf(evaluation.externalPlatformExitRampPreviewSummary) === "ready" ? "pass" : "warning"),
      row("safety_brief", "安全简报", summaryLabel(evaluation.manualVisitSafetyBriefSummary, "手动访问安全简报仍需复核"), statusOf(evaluation.manualVisitSafetyBriefSummary) === "ready" ? "pass" : "warning"),
      row("visit_preparation", "平台访问准备与最终安全清单", summaryLabel(evaluation.platformVisitPreparationViewModelSummary, "平台访问准备与最终安全清单仍需复核"), statusOf(evaluation.platformVisitPreparationViewModelSummary) === "ready" ? "pass" : "warning"),
      row("no_export", "会话关闭包不导出、不下载", "不导出、不下载、不写文件、不上传", evaluation.closureHealth.statesNoExportDownload ? "pass" : "warning"),
      row("not_contract", "关闭包不是合同、订单或付款授权", "只读会话关闭包不是合同、订单、付款授权、签名或平台确认", evaluation.closureHealth.statesNotContractOrderPayment ? "pass" : "warning")
    ]);
  }

  function sanitizeGlobalShoppingReadOnlySessionClosurePack(pack) {
    const safe = obj(pack);
    const evaluation = evaluateGlobalShoppingReadOnlySessionClosurePack(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SESSION_CLOSURE_PACK_VERSION,
      status:status,
      closureRows:toArray(safe.closureRows).length ? toArray(safe.closureRows) : buildGlobalShoppingReadOnlySessionClosurePackRows(safe),
      closureHealth:clone(evaluation.closureHealth),
      externalPlatformExitRampPreviewSummary:clone(evaluation.externalPlatformExitRampPreviewSummary),
      manualVisitSafetyBriefSummary:clone(evaluation.manualVisitSafetyBriefSummary),
      platformVisitPreparationViewModelSummary:clone(evaluation.platformVisitPreparationViewModelSummary),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"只读会话关闭包",
        resultLabel:status === "ready" ? "只读会话关闭包已准备" : (status === "blocked" ? "只读会话关闭包已阻断" : "只读会话关闭包仍需复核"),
        caveat:"只读会话关闭包只确认相关说明已展示，不导出、不下载、不写文件，不构成合同、订单、付款授权、签名或平台确认。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingReadOnlySessionClosurePack(input) {
    try {
      return sanitizeGlobalShoppingReadOnlySessionClosurePack(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingReadOnlySessionClosurePack({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingReadOnlySessionClosurePackAuditDraft(input) {
    const pack = buildGlobalShoppingReadOnlySessionClosurePack(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_SESSION_CLOSURE_PACK_AUDIT_DRAFT",
      packName:PACK_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_SESSION_CLOSURE_PACK_VERSION,
      status:pack.status,
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

  window.WeishanGlobalShoppingReadOnlySessionClosurePack = {
    GLOBAL_SHOPPING_READ_ONLY_SESSION_CLOSURE_PACK_VERSION,
    PACK_NAME,
    buildGlobalShoppingReadOnlySessionClosurePack,
    evaluateGlobalShoppingReadOnlySessionClosurePack,
    buildGlobalShoppingReadOnlySessionClosurePackRows,
    buildGlobalShoppingReadOnlySessionClosurePackAuditDraft,
    sanitizeGlobalShoppingReadOnlySessionClosurePack
  };
})();
