;(function () {
  "use strict";

  const GLOBAL_SHOPPING_READ_ONLY_PLATFORM_HANDOFF_SIMULATOR_VERSION = "2.2.8";
  const SIMULATOR_NAME = "global_shopping_read_only_platform_handoff_simulator_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function mode(value) {
    const next = text(value || "disabled");
    return /^(disabled|parameter_preview|dry_run|sandbox_ready)$/.test(next) ? next : "disabled";
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
  function recommendedCandidateId(input) {
    const comparison = obj(input.sandboxCandidateComparisonWorkbench || input.candidateComparisonSummary);
    return text(obj(comparison.recommendationSummary).recommendedCandidateId || "");
  }
  function resolvePack(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.redactedSearchParameterPackSummary)).length) return obj(safe.redactedSearchParameterPackSummary);
    const api = window.WeishanGlobalShoppingRedactedSearchParameterPack || {};
    return typeof api.buildGlobalShoppingRedactedSearchParameterPack === "function" ? api.buildGlobalShoppingRedactedSearchParameterPack(safe) : {};
  }
  function resolveChecklist(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.userConfirmationChecklistSummary)).length) return obj(safe.userConfirmationChecklistSummary);
    const api = window.WeishanGlobalShoppingUserConfirmationChecklist || {};
    return typeof api.buildGlobalShoppingUserConfirmationChecklist === "function" ? api.buildGlobalShoppingUserConfirmationChecklist(safe) : {};
  }
  function buildGlobalShoppingReadOnlyPlatformHandoffSimulationTimeline(input) {
    const safe = obj(input);
    const pack = resolvePack(safe);
    const checklist = resolveChecklist(safe);
    const hasRecommendedCandidate = !!recommendedCandidateId(safe);
    return clone([
      { stepId:"candidate_review", label:"复核候选与证据", status:statusOf(safe.sandboxDecisionReviewViewModel) === "ready" ? "pass" : "warning", actor:"weishan", summary:text(obj(obj(safe.sandboxDecisionReviewViewModel).userFacingSummary).resultLabel || obj(safe.sandboxDecisionReviewViewModel).title || "仍需完成候选复核"), caveat:"该步骤只复核脱敏 sandbox 候选，不代表真实价格或交易能力。", redacted:true },
      { stepId:"parameter_pack", label:"准备脱敏搜索参数", status:statusOf(pack) === "ready" ? "pass" : (statusOf(pack) === "blocked" ? "blocked" : "warning"), actor:"weishan", summary:text(obj(pack.userFacingSummary).resultLabel || "搜索参数包仍需复核"), caveat:"只携带非敏感搜索条件，不生成真实 URL。", redacted:true },
      { stepId:"simulation_preview", label:"展示交接模拟", status:hasRecommendedCandidate ? "pass" : "warning", actor:"weishan", summary:hasRecommendedCandidate ? "已准备推荐候选与交接说明。" : "仍需明确推荐候选。", caveat:"交接模拟不打开平台，不替用户填写敏感资料。", redacted:true },
      { stepId:"user_confirmation", label:"用户在平台自行确认", status:statusOf(checklist) === "ready" ? "pass" : (statusOf(checklist) === "blocked" ? "blocked" : "warning"), actor:"user", summary:text(obj(checklist.userFacingSummary).resultLabel || "用户确认清单仍需复核"), caveat:"用户必须自行确认实时价格、库存、账号、身份、支付与订单。", redacted:true },
      { stepId:"platform_execution", label:"平台执行最终动作", status:"warning", actor:"platform", summary:"平台页面和订单流程决定最终可订、支付和下单结果。", caveat:"Weishan 不执行登录、支付、下单或出票。", redacted:true }
    ]);
  }
  function buildGlobalShoppingReadOnlyPlatformHandoffSimulationRows(input) {
    const safe = obj(input);
    const pack = resolvePack(safe);
    const checklist = resolveChecklist(safe);
    const timeline = buildGlobalShoppingReadOnlyPlatformHandoffSimulationTimeline(safe);
    return clone([
      { rowId:"decision_review", label:"候选复核", value:text(obj(obj(safe.sandboxDecisionReviewViewModel).userFacingSummary).resultLabel || obj(safe.sandboxDecisionReviewViewModel).title || "仍需复核"), status:statusOf(safe.sandboxDecisionReviewViewModel) === "ready" ? "pass" : "warning", redacted:true },
      { rowId:"parameter_pack", label:"搜索参数包", value:text(obj(pack.userFacingSummary).resultLabel || "仍需复核"), status:statusOf(pack) === "ready" ? "pass" : (statusOf(pack) === "blocked" ? "blocked" : "warning"), redacted:true },
      { rowId:"user_checklist", label:"用户确认清单", value:text(obj(checklist.userFacingSummary).resultLabel || "仍需复核"), status:statusOf(checklist) === "ready" ? "pass" : (statusOf(checklist) === "blocked" ? "blocked" : "warning"), redacted:true },
      { rowId:"timeline", label:"模拟时间线", value:text(timeline.length + " 步"), status:timeline.length ? "pass" : "warning", redacted:true }
    ]);
  }
  function evaluateGlobalShoppingReadOnlyPlatformHandoffSimulation(input) {
    const safe = obj(input);
    const pack = resolvePack(safe);
    const checklist = resolveChecklist(safe);
    const candidateComparison = obj(safe.sandboxCandidateComparisonWorkbench || safe.candidateComparisonSummary);
    const evidenceMatrix = obj(safe.providerEvidenceComparisonMatrix || safe.evidenceMatrixSummary);
    const handoffDrill = obj(safe.readOnlyHandoffReadinessDrill || safe.handoffDrillSummary);
    const decisionReview = obj(safe.sandboxDecisionReviewViewModel || safe.decisionReviewSummary);
    const hasRecommendedCandidate = !!recommendedCandidateId(safe);
    const blockedReasons = [];
    if (safe.bookingUrl || safe.checkoutUrl || safe.paymentUrl || safe.orderUrl || safe.canGenerateRealUrl === true) blockedReasons.push("real_url_detected");
    if (safe.openExternal === true || safe.windowOpen === true || safe.autoOpen === true || safe.canOpenExternalNow === true) blockedReasons.push("external_open_detected");
    if (safe.download === true || safe.export === true || safe.canDownload === true || safe.canExport === true) blockedReasons.push("download_export_detected");
    if (safe.networkEnabled === true || safe.canCallNetwork === true) blockedReasons.push("network_detected");
    if (safe.identityIncluded === true || safe.realNameStored === true || safe.phoneStored === true || safe.emailStored === true) blockedReasons.push("identity_detected");
    if (safe.platformCredentialIncluded === true || safe.platformAccountIncluded === true || safe.platformPasswordIncluded === true) blockedReasons.push("platform_credential_detected");
    if (safe.paymentCredentialIncluded === true || safe.paymentCredentialStored === true) blockedReasons.push("payment_credential_detected");
    if (safe.checkout === true || safe.payment === true || safe.order === true || safe.ticketing === true || safe.canCheckout === true || safe.canPay === true || safe.canTicket === true) blockedReasons.push("transaction_capability_detected");
    if (safe.claimsAvailability === true) blockedReasons.push("availability_claim_detected");
    if (safe.claimsLockedPrice === true) blockedReasons.push("locked_price_claim_detected");
    if (safe.claimsBookability === true) blockedReasons.push("bookability_claim_detected");
    const simulationSummary = {
      hasDecisionReview:Object.keys(decisionReview).length > 0,
      hasCandidateComparison:Object.keys(candidateComparison).length > 0,
      hasEvidenceMatrix:Object.keys(evidenceMatrix).length > 0,
      hasHandoffDrill:Object.keys(handoffDrill).length > 0,
      hasRecommendedCandidate:hasRecommendedCandidate,
      allowedParameterCount:toArray(pack.allowedParameters).length,
      blockedParameterCount:toArray(pack.blockedParameters).length,
      missingParameterCount:toArray(pack.missingParameters).length,
      userMustConfirmCount:toArray(checklist.confirmationItems).length,
      platformOnlyActionCount:toArray(checklist.userOnlyActions).length
    };
    const handoffHealth = {
      noRealUrl:!safe.bookingUrl && !safe.checkoutUrl && !safe.paymentUrl && !safe.orderUrl && safe.canGenerateRealUrl !== true,
      noExternalOpen:safe.openExternal !== true && safe.windowOpen !== true && safe.autoOpen !== true && safe.canOpenExternalNow !== true,
      noDownloadExport:safe.download !== true && safe.export !== true && safe.canDownload !== true && safe.canExport !== true,
      noNetwork:safe.networkEnabled !== true && safe.canCallNetwork !== true,
      noIdentityCarry:safe.identityIncluded !== true && safe.realNameStored !== true && safe.phoneStored !== true && safe.emailStored !== true,
      noPlatformCredentialCarry:safe.platformCredentialIncluded !== true && safe.platformAccountIncluded !== true && safe.platformPasswordIncluded !== true,
      noPaymentCredentialCarry:safe.paymentCredentialIncluded !== true && safe.paymentCredentialStored !== true,
      noCheckoutPaymentTicketing:safe.checkout !== true && safe.payment !== true && safe.order !== true && safe.ticketing !== true && safe.canCheckout !== true && safe.canPay !== true && safe.canTicket !== true,
      noAvailabilityClaim:safe.claimsAvailability !== true,
      noLockedPriceClaim:safe.claimsLockedPrice !== true,
      noBookabilityClaim:safe.claimsBookability !== true
    };
    const needsReview = !simulationSummary.hasDecisionReview || !simulationSummary.hasCandidateComparison || !simulationSummary.hasEvidenceMatrix || !simulationSummary.hasHandoffDrill || !simulationSummary.hasRecommendedCandidate || simulationSummary.allowedParameterCount <= 0;
    const ready = !blockedReasons.length && !needsReview && statusOf(pack) === "ready" && statusOf(checklist) === "ready";
    return clone({
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PLATFORM_HANDOFF_SIMULATOR_VERSION,
      status:blockedReasons.length ? "blocked" : (ready ? "ready" : "needs_review"),
      simulatorBoundary:{
        simulationId:text(safe.simulationId || "platform_handoff_simulation_v2_2_3"),
        simulationMode:mode(safe.simulationMode || (ready ? "sandbox_ready" : (simulationSummary.allowedParameterCount ? "parameter_preview" : "disabled"))),
        readOnly:true,
        parameterPreviewOnly:true,
        sandboxOnly:true,
        redactedOnly:true,
        productionDisabled:true,
        canGenerateRealUrl:false,
        canOpenExternalNow:false,
        canDownload:false,
        canExport:false,
        canCallNetwork:false,
        canPersistSensitiveParams:false,
        canCarryIdentity:false,
        canCarryPlatformCredential:false,
        canCarryPaymentCredential:false,
        canCheckout:false,
        canPay:false,
        canTicket:false,
        doesNotClaimAvailability:true,
        doesNotClaimLockedPrice:true,
        doesNotClaimBookability:true
      },
      simulationSummary:simulationSummary,
      simulationTimeline:buildGlobalShoppingReadOnlyPlatformHandoffSimulationTimeline(safe),
      handoffHealth:handoffHealth,
      rows:buildGlobalShoppingReadOnlyPlatformHandoffSimulationRows(safe),
      blockedReasons:blockedReasons,
      userFacingSummary:{
        title:"只读平台交接模拟器",
        resultLabel:blockedReasons.length ? "交接模拟已阻断" : (ready ? "交接模拟已准备" : "交接模拟仍需复核"),
        caveat:"当前只模拟非敏感搜索参数交接，不生成真实链接，不打开平台，不填写身份、账号、证件、银行卡或支付信息。"
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function sanitizeGlobalShoppingReadOnlyPlatformHandoffSimulator(simulator) {
    const safe = obj(simulator);
    const evaluated = evaluateGlobalShoppingReadOnlyPlatformHandoffSimulation(safe);
    return clone({
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PLATFORM_HANDOFF_SIMULATOR_VERSION,
      status:/^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluated.status,
      simulatorBoundary:clone(evaluated.simulatorBoundary),
      simulationSummary:clone(evaluated.simulationSummary),
      simulationTimeline:clone(evaluated.simulationTimeline),
      handoffHealth:clone(evaluated.handoffHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : clone(evaluated.rows),
      blockedReasons:clone(evaluated.blockedReasons),
      userFacingSummary:clone(evaluated.userFacingSummary),
      safety:safety(safe.safety),
      redacted:true
    });
  }
  function buildGlobalShoppingReadOnlyPlatformHandoffSimulator(input) {
    try {
      return sanitizeGlobalShoppingReadOnlyPlatformHandoffSimulator(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingReadOnlyPlatformHandoffSimulator({ status:"failed_safe" });
    }
  }
  function buildGlobalShoppingReadOnlyPlatformHandoffSimulatorAuditDraft(input) {
    const simulator = buildGlobalShoppingReadOnlyPlatformHandoffSimulator(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_READ_ONLY_PLATFORM_HANDOFF_SIMULATOR_AUDIT_DRAFT",
      simulatorName:SIMULATOR_NAME,
      appVersion:GLOBAL_SHOPPING_READ_ONLY_PLATFORM_HANDOFF_SIMULATOR_VERSION,
      status:simulator.status,
      blockedReasonCount:simulator.blockedReasons.length,
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

  window.WeishanGlobalShoppingReadOnlyPlatformHandoffSimulator = {
    GLOBAL_SHOPPING_READ_ONLY_PLATFORM_HANDOFF_SIMULATOR_VERSION,
    SIMULATOR_NAME,
    buildGlobalShoppingReadOnlyPlatformHandoffSimulator,
    evaluateGlobalShoppingReadOnlyPlatformHandoffSimulation,
    buildGlobalShoppingReadOnlyPlatformHandoffSimulationRows,
    buildGlobalShoppingReadOnlyPlatformHandoffSimulationTimeline,
    buildGlobalShoppingReadOnlyPlatformHandoffSimulatorAuditDraft,
    sanitizeGlobalShoppingReadOnlyPlatformHandoffSimulator
  };
})();
