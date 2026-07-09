;(function () {
  "use strict";

  const GLOBAL_SHOPPING_HANDOFF_ACCEPTANCE_WALKTHROUGH_VERSION = "4.2.7";
  const WALKTHROUGH_NAME = "global_shopping_handoff_acceptance_walkthrough_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
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
  function statusOf(summary) { return text(obj(summary).status || ""); }
  function resolveSummary(input, key, apiName, methodName, buildInput) {
    const safe = obj(input);
    if (Object.keys(obj(safe[key])).length) return obj(safe[key]);
    const summaryApi = window[apiName] || {};
    return typeof summaryApi[methodName] === "function" ? summaryApi[methodName](buildInput || safe) : {};
  }
  function step(stepId, label, summary, status) {
    return {
      stepId:text(stepId),
      label:text(label),
      summary:text(summary),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function buildGlobalShoppingHandoffAcceptanceWalkthroughSteps(input) {
    const safe = obj(input);
    const readOnlyHandoffPacketPreviewSummary = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", safe);
    const userActionBoundaryReceiptSummary = resolveSummary(safe, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", safe);
    const userConfirmationChecklistSummary = resolveSummary(safe, "userConfirmationChecklistSummary", "WeishanGlobalShoppingUserConfirmationChecklist", "buildGlobalShoppingUserConfirmationChecklist", safe);
    return clone([
      step("packet", "查看交接包", obj(obj(readOnlyHandoffPacketPreviewSummary).userFacingSummary).resultLabel || "交接包预览仍需复核", statusOf(readOnlyHandoffPacketPreviewSummary) === "ready" ? "pass" : (statusOf(readOnlyHandoffPacketPreviewSummary) === "blocked" ? "blocked" : "warning")),
      step("boundary", "确认行动边界", obj(obj(userActionBoundaryReceiptSummary).userFacingSummary).resultLabel || "边界回执仍需复核", statusOf(userActionBoundaryReceiptSummary) === "ready" ? "pass" : (statusOf(userActionBoundaryReceiptSummary) === "blocked" ? "blocked" : "warning")),
      step("checklist", "理解用户确认项", obj(obj(userConfirmationChecklistSummary).userFacingSummary).resultLabel || "用户确认清单仍需复核", statusOf(userConfirmationChecklistSummary) === "ready" ? "pass" : (statusOf(userConfirmationChecklistSummary) === "blocked" ? "blocked" : "warning")),
      step("manual_scope", "接受演练范围", "接受演练不保存用户确认", "pass"),
      step("final_truth", "最终依据", "平台页面才是最终依据", "pass")
    ]);
  }
  function sanitizeGlobalShoppingHandoffAcceptanceWalkthrough(input) {
    const safe = obj(input);
    const readOnlyHandoffPacketPreviewSummary = resolveSummary(safe, "readOnlyHandoffPacketPreviewSummary", "WeishanGlobalShoppingReadOnlyHandoffPacketPreview", "buildGlobalShoppingReadOnlyHandoffPacketPreview", safe);
    const userActionBoundaryReceiptSummary = resolveSummary(safe, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", safe);
    const userConfirmationChecklistSummary = resolveSummary(safe, "userConfirmationChecklistSummary", "WeishanGlobalShoppingUserConfirmationChecklist", "buildGlobalShoppingUserConfirmationChecklist", safe);
    const blocked = statusOf(readOnlyHandoffPacketPreviewSummary) === "blocked" ||
      statusOf(userActionBoundaryReceiptSummary) === "blocked" ||
      statusOf(userConfirmationChecklistSummary) === "blocked" ||
      safe.networkEnabled === true || safe.realEndpointDetected === true || safe.hasRealApiKey === true ||
      safe.rawResponseStored === true || safe.openExternal === true || safe.windowOpen === true ||
      safe.export === true || safe.download === true || safe.payment === true || safe.order === true || safe.ticketing === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl;
    const missing = !Object.keys(readOnlyHandoffPacketPreviewSummary).length ||
      !Object.keys(userActionBoundaryReceiptSummary).length ||
      !Object.keys(userConfirmationChecklistSummary).length;
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status))
      ? text(safe.status)
      : (blocked ? "blocked" : (missing || statusOf(readOnlyHandoffPacketPreviewSummary) !== "ready" || statusOf(userActionBoundaryReceiptSummary) !== "ready" || statusOf(userConfirmationChecklistSummary) !== "ready" ? "needs_review" : "ready"));
    return clone({
      walkthroughName:WALKTHROUGH_NAME,
      appVersion:GLOBAL_SHOPPING_HANDOFF_ACCEPTANCE_WALKTHROUGH_VERSION,
      status:status,
      title:"交接包接受演练",
      readOnlyHandoffPacketPreviewSummary:clone(readOnlyHandoffPacketPreviewSummary),
      userActionBoundaryReceiptSummary:clone(userActionBoundaryReceiptSummary),
      userConfirmationChecklistSummary:clone(userConfirmationChecklistSummary),
      walkthroughSteps:toArray(safe.walkthroughSteps).length ? toArray(safe.walkthroughSteps) : buildGlobalShoppingHandoffAcceptanceWalkthroughSteps(safe),
      userFacingSummary:{
        title:"交接包接受演练",
        resultLabel:status === "ready" ? "交接包接受演练已准备" : (status === "blocked" ? "交接包接受演练已阻断" : "交接包接受演练仍需复核"),
        caveat:"当前仅做交接内容接受演练，不打开平台，不保存确认结果，不构成订单、付款授权、电子签名或真实平台操作。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingHandoffAcceptanceWalkthrough(input) {
    try {
      return sanitizeGlobalShoppingHandoffAcceptanceWalkthrough(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingHandoffAcceptanceWalkthrough({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingHandoffAcceptanceWalkthroughAuditDraft(input) {
    const walkthrough = buildGlobalShoppingHandoffAcceptanceWalkthrough(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_HANDOFF_ACCEPTANCE_WALKTHROUGH_AUDIT_DRAFT",
      walkthroughName:WALKTHROUGH_NAME,
      appVersion:GLOBAL_SHOPPING_HANDOFF_ACCEPTANCE_WALKTHROUGH_VERSION,
      status:walkthrough.status,
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

  window.WeishanGlobalShoppingHandoffAcceptanceWalkthrough = {
    GLOBAL_SHOPPING_HANDOFF_ACCEPTANCE_WALKTHROUGH_VERSION,
    WALKTHROUGH_NAME,
    buildGlobalShoppingHandoffAcceptanceWalkthrough,
    buildGlobalShoppingHandoffAcceptanceWalkthroughSteps,
    buildGlobalShoppingHandoffAcceptanceWalkthroughAuditDraft,
    sanitizeGlobalShoppingHandoffAcceptanceWalkthrough
  };
})();
