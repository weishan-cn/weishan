;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_VERSION = "4.1.2";
  const PACK_NAME = "flight_workflow_beta_acceptance_pack_v1";
  const FORBIDDEN_CLAIM_RE = /全网最低|最低价保证|已锁价|可出票|真实最终价|立即购买|直接下单|一键出票/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function api(name) { return window[name] || {}; }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe);
    if (!value || typeof value !== "object") return typeof value === "string" ? value.replace(/https?:\/\/\S+|token|key|secret|password/ig, "redacted") : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      if (/(bookingUrl|checkoutUrl|paymentUrl|orderUrl|token|key|secret|password|rawProviderResponse|rawResponse|rawUserText|credential)/i.test(name)) return;
      result[name] = stripUnsafe(value[name]);
    });
    return result;
  }
  function releaseOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.releaseReadinessSummary) return safe.releaseReadinessSummary;
    const releaseApi = api("WeishanFlightWorkflowReleaseReadinessDashboard");
    return typeof releaseApi.buildFlightWorkflowReleaseReadinessDashboard === "function" ? releaseApi.buildFlightWorkflowReleaseReadinessDashboard(Object.assign({ releaseVersion:FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_VERSION }, safe)) : { status:"failed_safe", safeForUserFacingBeta:false, redacted:true };
  }
  function operatorOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.operatorConsoleSummary) return safe.operatorConsoleSummary;
    const operatorApi = api("WeishanFlightWorkflowOperatorConsole");
    return typeof operatorApi.buildFlightWorkflowOperatorConsole === "function" ? operatorApi.buildFlightWorkflowOperatorConsole(safe) : { status:"failed_safe", redacted:true };
  }
  function matrixOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    return safe.safetyTestMatrixSummary || safe.matrixSummary || { status:safe.matrixStatus || "pass", overallHealth:safe.matrixOverallHealth || "pass", failedCount:Number(safe.matrixFailedCount || 0), blockedCount:Number(safe.matrixBlockedCount || 0), redacted:true };
  }
  function reviewOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.humanReviewChecklistSummary || { status:safe.humanReviewStatus || "ready", redacted:true }; }
  function packetOf(input) { const safe = input && typeof input === "object" ? input : {}; return safe.finalSafeHandoffPacketSummary || { status:safe.finalHandoffStatus || "ready", redacted:true }; }
  function copyOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.userSafetyCopySummary || safe.copyValidationStatus || safe.forbiddenCapabilitySummary) return safe;
    const copyApi = api("WeishanFlightWorkflowUserSafetyCopyRegistry");
    return typeof copyApi.buildFlightWorkflowUserSafetyCopyRegistry === "function" ? copyApi.buildFlightWorkflowUserSafetyCopyRegistry(safe.userFacingSafetyCopyContext || {}) : { status:"pass", copyValidationStatus:"pass", userSafetyCopySummary:{ status:"pass", redacted:true }, forbiddenCapabilitySummary:{ forbiddenCapabilities:forbiddenCapabilities(), redacted:true }, redacted:true };
  }
  function forbiddenCapabilities() { return ["付款", "下单", "出票", "上传证件或银行卡", "保存密钥", "真实 provider 默认启用"]; }
  function hasForbiddenClaim(input, copy) {
    const source = JSON.stringify(stripUnsafe(input && typeof input === "object" ? input : {}));
    return copy && (copy.status === "blocked" || copy.copyValidationStatus === "blocked") || FORBIDDEN_CLAIM_RE.test(source || "");
  }
  function evaluateFlightWorkflowBetaAcceptanceReadiness(input) {
    const safe = input && typeof input === "object" ? input : {};
    const release = releaseOf(safe);
    const operator = operatorOf(safe);
    const matrix = matrixOf(safe);
    const review = reviewOf(safe);
    const packet = packetOf(safe);
    const copy = copyOf(safe);
    const matrixFail = matrix.status === "fail" || matrix.status === "failed_safe" || matrix.overallHealth === "fail" || Number(matrix.failedCount || 0) > 0 || Number(matrix.blockedCount || 0) > 0;
    const releaseBlocked = release.status === "blocked" || release.status === "failed_safe" || release.releaseReady === false && release.safeForUserFacingBeta === false && safe.releaseReadinessBlocked === true;
    const forbiddenClaim = hasForbiddenClaim(safe, copy);
    const humanReviewNeedsReview = review.status === "needs_review" || review.status === "warning";
    const finalHandoffReady = packet.status === "ready";
    const result = {
      releaseReadinessReady:release.status === "ready" || release.releaseReady === true || release.safeForUserFacingBeta === true,
      operatorConsoleReady:operator.status === "ready" || operator.status === "warning",
      scenarioMatrixReady:!matrixFail,
      safetyCopyReady:!forbiddenClaim && (copy.copyValidationStatus === "pass" || copy.status === "pass" || copy.status === "ready"),
      humanReviewReady:review.status === "ready",
      finalHandoffPacketReady:finalHandoffReady,
      safeForGuidedUserTest:false,
      releaseBlocked:releaseBlocked,
      matrixFail:matrixFail,
      forbiddenClaim:forbiddenClaim,
      humanReviewNeedsReview:humanReviewNeedsReview,
      redacted:true
    };
    result.safeForGuidedUserTest = result.releaseReadinessReady && result.operatorConsoleReady && result.scenarioMatrixReady && result.safetyCopyReady && result.humanReviewReady && result.finalHandoffPacketReady;
    return clone(result);
  }
  function statusFor(readiness) {
    if (readiness.releaseBlocked || readiness.matrixFail || readiness.forbiddenClaim) return "blocked";
    if (readiness.humanReviewNeedsReview || readiness.finalHandoffPacketReady !== true || readiness.operatorConsoleReady !== true) return "needs_review";
    return readiness.safeForGuidedUserTest ? "ready" : "needs_review";
  }
  function buildFlightWorkflowBetaAcceptanceSteps(input) {
    const readiness = evaluateFlightWorkflowBetaAcceptanceReadiness(input || {});
    const blocked = statusFor(readiness) === "blocked";
    const status = blocked ? "blocked" : "pending";
    return clone([
      { stepId:"enter_flight_request", label:"输入机票需求", status:status, message:blocked ? "当前验收被阻断" : "填写普通机票需求", redacted:true },
      { stepId:"review_candidate_evidence", label:"查看候选证据", status:status, message:"仅查看只读候选证据", redacted:true },
      { stepId:"review_safety_notice", label:"确认安全提示", status:status, message:"确认不会付款、不会下单、不会出票", redacted:true },
      { stepId:"review_human_checklist", label:"完成人工复核", status:readiness.humanReviewReady ? "pending" : "blocked", message:readiness.humanReviewReady ? "人工复核可进行" : "人工复核仍需完成", redacted:true },
      { stepId:"simulate_platform_confirmation", label:"模拟平台确认前检查", status:readiness.finalHandoffPacketReady ? status : "blocked", message:"只模拟，不打开外部平台", redacted:true },
      { stepId:"submit_test_feedback", label:"填写测试反馈", status:status, message:"仅记录脱敏反馈摘要", redacted:true }
    ]);
  }
  function sanitizeFlightWorkflowBetaAcceptancePack(pack) {
    const safe = pack && typeof pack === "object" ? pack : {};
    return clone(Object.assign({
      packName:PACK_NAME,
      appVersion:FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_VERSION,
      status:text(safe.status || "failed_safe"),
      acceptanceReadiness:stripUnsafe(safe.acceptanceReadiness || evaluateFlightWorkflowBetaAcceptanceReadiness({})),
      acceptanceSteps:toArray(safe.acceptanceSteps),
      userFacingSummary:Object.assign({ title:"只读 Beta 验收包", resultLabel:"暂不可验收", caveat:"该验收只覆盖只读候选证据流程，不代表真实票价、库存或可出票。", redacted:true }, stripUnsafe(safe.userFacingSummary || {})),
      forbiddenCapabilities:toArray(safe.forbiddenCapabilities).length ? toArray(safe.forbiddenCapabilities) : forbiddenCapabilities(),
      safety:safety(),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      autoOpen:false,
      autoRefresh:false,
      payment:false,
      order:false,
      ticketing:false,
      identityUpload:false,
      credentialInput:false,
      rawResponseStored:false,
      rawUserTextStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      redacted:true
    }, stripUnsafe({ releaseReadinessSummary:safe.releaseReadinessSummary, operatorConsoleSummary:safe.operatorConsoleSummary, scenarioMatrixSummary:safe.scenarioMatrixSummary, humanReviewChecklistSummary:safe.humanReviewChecklistSummary, finalSafeHandoffPacketSummary:safe.finalSafeHandoffPacketSummary, userSafetyCopySummary:safe.userSafetyCopySummary, feedbackReviewSummary:safe.feedbackReviewSummary, acceptanceSessionSummary:safe.acceptanceSessionSummary, acceptanceReviewStatus:safe.acceptanceReviewStatus, betaFeedbackHealth:safe.betaFeedbackHealth, nextAcceptanceStep:safe.nextAcceptanceStep, betaCohortSummary:safe.betaCohortSummary, feedbackTrendSummary:safe.feedbackTrendSummary, cohortReviewStatus:safe.cohortReviewStatus, betaExpansionReadiness:safe.betaExpansionReadiness, betaCohortRecommendation:safe.betaCohortRecommendation })));
  }
  function buildFlightWorkflowBetaAcceptancePack(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowBetaAcceptancePack({ status:"failed_safe", acceptanceSteps:buildFlightWorkflowBetaAcceptanceSteps({ releaseReadinessBlocked:true }), acceptanceReadiness:evaluateFlightWorkflowBetaAcceptanceReadiness({ releaseReadinessBlocked:true }) });
      const readiness = evaluateFlightWorkflowBetaAcceptanceReadiness(input);
      const status = statusFor(readiness);
      const label = status === "ready" ? "可以开始用户验收" : (status === "needs_review" ? "仍需复核" : "暂不可验收");
      return sanitizeFlightWorkflowBetaAcceptancePack({ packName:PACK_NAME, appVersion:FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_VERSION, status:status, acceptanceReadiness:readiness, acceptanceSteps:buildFlightWorkflowBetaAcceptanceSteps(input), userFacingSummary:{ title:"只读 Beta 验收包", resultLabel:label, caveat:"该验收只覆盖只读候选证据流程，不代表真实票价、库存或可出票。", redacted:true }, forbiddenCapabilities:forbiddenCapabilities(), releaseReadinessSummary:releaseOf(input), operatorConsoleSummary:operatorOf(input), scenarioMatrixSummary:matrixOf(input), humanReviewChecklistSummary:reviewOf(input), finalSafeHandoffPacketSummary:packetOf(input), userSafetyCopySummary:copyOf(input), feedbackReviewSummary:input.feedbackReviewSummary, acceptanceSessionSummary:input.acceptanceSessionSummary, acceptanceReviewStatus:input.acceptanceReviewStatus || status, betaFeedbackHealth:input.betaFeedbackHealth || input.feedbackReviewSummary && input.feedbackReviewSummary.feedbackHealth, nextAcceptanceStep:input.nextAcceptanceStep || label, betaCohortSummary:input.betaCohortSummary, feedbackTrendSummary:input.feedbackTrendSummary, cohortReviewStatus:input.cohortReviewStatus, betaExpansionReadiness:input.betaExpansionReadiness, betaCohortRecommendation:input.betaCohortRecommendation, safety:safety(), redacted:true });
    } catch (error) {
      return sanitizeFlightWorkflowBetaAcceptancePack({ status:"failed_safe", acceptanceSteps:[], acceptanceReadiness:{ safeForGuidedUserTest:false, redacted:true } });
    }
  }
  function buildFlightWorkflowBetaAcceptancePackAuditDraft(input) {
    const pack = buildFlightWorkflowBetaAcceptancePack(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_AUDIT_DRAFT", packName:PACK_NAME, appVersion:FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_VERSION, status:pack.status, safeForGuidedUserTest:pack.acceptanceReadiness.safeForGuidedUserTest === true, stepCount:pack.acceptanceSteps.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }

  window.WeishanFlightWorkflowBetaAcceptancePack = { FLIGHT_WORKFLOW_BETA_ACCEPTANCE_PACK_VERSION, PACK_NAME, buildFlightWorkflowBetaAcceptancePack, evaluateFlightWorkflowBetaAcceptanceReadiness, buildFlightWorkflowBetaAcceptanceSteps, buildFlightWorkflowBetaAcceptancePackAuditDraft, sanitizeFlightWorkflowBetaAcceptancePack };
})();
