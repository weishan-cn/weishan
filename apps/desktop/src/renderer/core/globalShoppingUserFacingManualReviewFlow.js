;(function () {
  "use strict";

  const GLOBAL_SHOPPING_USER_FACING_MANUAL_REVIEW_FLOW_VERSION = "4.1.8";
  const FLOW_NAME = "global_shopping_user_facing_manual_review_flow_v1";

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

  function evaluateGlobalShoppingUserFacingManualReviewFlow(input) {
    const safe = obj(input);
    const manualPlatformReviewCockpitSummary = resolveSummary(safe, "manualPlatformReviewCockpitSummary", "WeishanGlobalShoppingManualPlatformReviewCockpit", "buildGlobalShoppingManualPlatformReviewCockpit", safe);
    const handoffAcceptanceWalkthroughSummary = resolveSummary(safe, "handoffAcceptanceWalkthroughSummary", "WeishanGlobalShoppingHandoffAcceptanceWalkthrough", "buildGlobalShoppingHandoffAcceptanceWalkthrough", safe);
    const platformRealityCheckBoardSummary = resolveSummary(safe, "platformRealityCheckBoardSummary", "WeishanGlobalShoppingPlatformRealityCheckBoard", "buildGlobalShoppingPlatformRealityCheckBoard", safe);
    const handoffPacketViewModelSummary = resolveSummary(safe, "handoffPacketViewModelSummary", "WeishanGlobalShoppingHandoffPacketViewModel", "buildGlobalShoppingHandoffPacketViewModel", safe);
    const platformPreflightSafetyGateSummary = resolveSummary(safe, "platformPreflightSafetyGateSummary", "WeishanGlobalShoppingPlatformPreflightSafetyGate", "buildGlobalShoppingPlatformPreflightSafetyGate", safe);
    const userActionBoundaryReceiptSummary = resolveSummary(safe, "userActionBoundaryReceiptSummary", "WeishanGlobalShoppingUserActionBoundaryReceipt", "buildGlobalShoppingUserActionBoundaryReceipt", safe);

    const missing = !Object.keys(manualPlatformReviewCockpitSummary).length ||
      !Object.keys(handoffAcceptanceWalkthroughSummary).length ||
      !Object.keys(platformRealityCheckBoardSummary).length ||
      !Object.keys(handoffPacketViewModelSummary).length ||
      !Object.keys(platformPreflightSafetyGateSummary).length ||
      !Object.keys(userActionBoundaryReceiptSummary).length;

    const blocked = safe.progressStored === true || safe.progressSubmitted === true ||
      safe.userChoiceStored === true || safe.userChoiceSubmitted === true ||
      safe.openExternal === true || safe.windowOpen === true || safe.export === true || safe.download === true ||
      safe.payment === true || safe.order === true || safe.ticketing === true || safe.paymentAuthorization === true ||
      safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ||
      safe.hasForbiddenClaim === true;

    const ready = !missing &&
      statusOf(manualPlatformReviewCockpitSummary) === "ready" &&
      statusOf(handoffAcceptanceWalkthroughSummary) === "ready" &&
      statusOf(platformRealityCheckBoardSummary) === "ready" &&
      statusOf(handoffPacketViewModelSummary) === "ready" &&
      statusOf(platformPreflightSafetyGateSummary) === "clear" &&
      statusOf(userActionBoundaryReceiptSummary) === "ready";

    return clone({
      status:blocked ? "blocked" : (ready ? "ready" : "needs_review"),
      manualPlatformReviewCockpitSummary:manualPlatformReviewCockpitSummary,
      handoffAcceptanceWalkthroughSummary:handoffAcceptanceWalkthroughSummary,
      platformRealityCheckBoardSummary:platformRealityCheckBoardSummary,
      handoffPacketViewModelSummary:handoffPacketViewModelSummary,
      platformPreflightSafetyGateSummary:platformPreflightSafetyGateSummary,
      userActionBoundaryReceiptSummary:userActionBoundaryReceiptSummary,
      blockedReasons:blocked ? [
        safe.progressStored === true || safe.userChoiceStored === true ? "persistence_detected" : "",
        safe.progressSubmitted === true || safe.userChoiceSubmitted === true ? "submission_detected" : "",
        safe.openExternal === true || safe.windowOpen === true ? "external_open_detected" : "",
        safe.export === true || safe.download === true ? "download_export_detected" : "",
        safe.payment === true || safe.order === true || safe.ticketing === true || safe.paymentAuthorization === true ? "transaction_detected" : "",
        safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl ? "transaction_url_detected" : "",
        safe.hasForbiddenClaim === true ? "forbidden_claim_detected" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingUserFacingManualReviewFlowSteps(input) {
    const evaluation = evaluateGlobalShoppingUserFacingManualReviewFlow(input);
    return clone([
      step("candidate_evidence", "查看候选来源与证据", obj(obj(evaluation.manualPlatformReviewCockpitSummary).userFacingSummary).resultLabel || "手动平台复核驾驶舱仍需复核", statusOf(evaluation.manualPlatformReviewCockpitSummary) === "ready" ? "pass" : (statusOf(evaluation.manualPlatformReviewCockpitSummary) === "blocked" ? "blocked" : "warning")),
      step("handoff_packet", "查看交接包与安全预检", obj(obj(evaluation.handoffPacketViewModelSummary).userFacingSummary).resultLabel || "只读交接包与安全预检仍需复核", statusOf(evaluation.handoffPacketViewModelSummary) === "ready" ? "pass" : (statusOf(evaluation.handoffPacketViewModelSummary) === "blocked" ? "blocked" : "warning")),
      step("acceptance_walkthrough", "理解接受演练与边界说明", obj(obj(evaluation.handoffAcceptanceWalkthroughSummary).userFacingSummary).resultLabel || "交接包接受演练仍需复核", statusOf(evaluation.handoffAcceptanceWalkthroughSummary) === "ready" ? "pass" : (statusOf(evaluation.handoffAcceptanceWalkthroughSummary) === "blocked" ? "blocked" : "warning")),
      step("reality_check", "查看平台复核清单", obj(obj(evaluation.platformRealityCheckBoardSummary).userFacingSummary).resultLabel || "平台真实页面复核清单仍需复核", statusOf(evaluation.platformRealityCheckBoardSummary) === "ready" ? "pass" : (statusOf(evaluation.platformRealityCheckBoardSummary) === "blocked" ? "blocked" : "warning")),
      step("user_only_action", "用户自行完成最终平台判断", "用户必须自行完成最终平台判断", "pass"),
      step("safe_next_step", "查看安全下一步", "下一步只用于复核提醒，不打开平台", "pass")
    ]);
  }

  function buildGlobalShoppingUserFacingManualReviewFlowRows(input) {
    return clone(buildGlobalShoppingUserFacingManualReviewFlowSteps(input).map(function (item) {
      return {
        rowId:item.stepId,
        label:item.label,
        value:item.summary,
        status:item.status,
        redacted:true
      };
    }));
  }

  function sanitizeGlobalShoppingUserFacingManualReviewFlow(flow) {
    const safe = obj(flow);
    const evaluation = evaluateGlobalShoppingUserFacingManualReviewFlow(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      flowName:FLOW_NAME,
      appVersion:GLOBAL_SHOPPING_USER_FACING_MANUAL_REVIEW_FLOW_VERSION,
      status:status,
      title:"用户手动复核流程",
      manualPlatformReviewCockpitSummary:clone(evaluation.manualPlatformReviewCockpitSummary),
      handoffAcceptanceWalkthroughSummary:clone(evaluation.handoffAcceptanceWalkthroughSummary),
      platformRealityCheckBoardSummary:clone(evaluation.platformRealityCheckBoardSummary),
      handoffPacketViewModelSummary:clone(evaluation.handoffPacketViewModelSummary),
      platformPreflightSafetyGateSummary:clone(evaluation.platformPreflightSafetyGateSummary),
      userActionBoundaryReceiptSummary:clone(evaluation.userActionBoundaryReceiptSummary),
      flowSteps:toArray(safe.flowSteps).length ? toArray(safe.flowSteps) : buildGlobalShoppingUserFacingManualReviewFlowSteps(safe),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingUserFacingManualReviewFlowRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"用户手动复核流程",
        resultLabel:status === "ready" ? "用户手动复核流程已准备" : (status === "blocked" ? "用户手动复核流程已阻断" : "用户手动复核流程仍需复核"),
        caveat:"当前只展示用户复核步骤，不打开平台，不保存选择，不构成订单、付款授权或签名。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingUserFacingManualReviewFlow(input) {
    try {
      return sanitizeGlobalShoppingUserFacingManualReviewFlow(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingUserFacingManualReviewFlow({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingUserFacingManualReviewFlowAuditDraft(input) {
    const flow = buildGlobalShoppingUserFacingManualReviewFlow(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_USER_FACING_MANUAL_REVIEW_FLOW_AUDIT_DRAFT",
      flowName:FLOW_NAME,
      appVersion:GLOBAL_SHOPPING_USER_FACING_MANUAL_REVIEW_FLOW_VERSION,
      status:flow.status,
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

  window.WeishanGlobalShoppingUserFacingManualReviewFlow = {
    GLOBAL_SHOPPING_USER_FACING_MANUAL_REVIEW_FLOW_VERSION,
    FLOW_NAME,
    buildGlobalShoppingUserFacingManualReviewFlow,
    evaluateGlobalShoppingUserFacingManualReviewFlow,
    buildGlobalShoppingUserFacingManualReviewFlowSteps,
    buildGlobalShoppingUserFacingManualReviewFlowRows,
    buildGlobalShoppingUserFacingManualReviewFlowAuditDraft,
    sanitizeGlobalShoppingUserFacingManualReviewFlow
  };
})();
