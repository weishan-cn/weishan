;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION = "4.2.6";
  const DASHBOARD_NAME = "flight_workflow_release_readiness_dashboard_v1";
  const FORBIDDEN_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证号|护照号|银行卡号|credential|passport|cardNumber/ig;
  const FORBIDDEN_CLAIM_RE = /全网最低|最低价保证|已锁价|立即购买|直接下单|一键出票|真实最终价/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(FORBIDDEN_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function api(name) { return window[name] || {}; }
  function stripUnsafe(value) {
    if (Array.isArray(value)) return value.map(stripUnsafe);
    if (!value || typeof value !== "object") return typeof value === "string" ? safeText(value) : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      if (/(bookingUrl|checkoutUrl|paymentUrl|orderUrl|token|apiKey|key|secret|password|rawProviderResponse|rawResponse|rawUserText|credential)/i.test(name)) return;
      result[name] = stripUnsafe(value[name]);
    });
    return result;
  }
  function defaultMatrix() { return { status:"failed_safe", overallHealth:"unknown", scenarioCount:0, passedCount:0, warningCount:0, failedCount:0, blockedCount:0, failedRows:[], userFacingSummary:{ resultLabel:"未知", redacted:true }, safety:safety(), redacted:true }; }
  function copyRegistryOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.userSafetyCopySummary && safe.copyValidationStatus) return safe;
    const copyApi = api("WeishanFlightWorkflowUserSafetyCopyRegistry");
    return typeof copyApi.buildFlightWorkflowUserSafetyCopyRegistry === "function" ? copyApi.buildFlightWorkflowUserSafetyCopyRegistry(safe.userFacingSafetyCopyContext || {}) : { status:"failed_safe", copyValidationStatus:"failed_safe", userSafetyCopySummary:{ title:"安全文案已统一", status:"failed_safe", redacted:true }, forbiddenCapabilitySummary:{ forbiddenCapabilities:["付款", "下单", "出票", "证件银行卡上传", "真实 provider 请求"], redacted:true }, redacted:true };
  }
  function simulatorOf(input) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.scenarioSimulationSuite) return safe.scenarioSimulationSuite;
    if (safe.simulationSuite) return safe.simulationSuite;
    const simulatorApi = api("WeishanFlightWorkflowScenarioSimulator");
    return typeof simulatorApi.runFlightWorkflowScenarioSimulationSuite === "function" ? simulatorApi.runFlightWorkflowScenarioSimulationSuite(safe) : { status:"failed_safe", summary:{ scenarioCount:0, warningCount:0, failedCount:1, blockedCount:0 }, results:[], safety:safety(), redacted:true };
  }
  function matrixOf(input, simulator) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.safetyTestMatrixSummary) return safe.safetyTestMatrixSummary;
    if (safe.matrixSummary) return safe.matrixSummary;
    if (simulator && simulator.matrixSummary) return simulator.matrixSummary;
    const matrixApi = api("WeishanFlightWorkflowSafetyTestMatrixConsole");
    return typeof matrixApi.buildFlightWorkflowSafetyTestMatrixConsole === "function" ? matrixApi.buildFlightWorkflowSafetyTestMatrixConsole({ results:simulator && simulator.results || safe.results || [] }) : defaultMatrix();
  }
  function sentinelOf(input, matrix) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.safetyRegressionSummary) return safe.safetyRegressionSummary;
    if (safe.sentinelReport) return safe.sentinelReport;
    const sentinelApi = api("WeishanFlightWorkflowSafetyRegressionSentinel");
    const sentinelInput = { matrixStatus:matrix && matrix.status || "unknown", matrixFailedCount:matrix && matrix.failedCount || 0, matrixBlockedCount:matrix && matrix.blockedCount || 0, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true };
    return typeof sentinelApi.buildFlightWorkflowSafetyRegressionReport === "function" ? sentinelApi.buildFlightWorkflowSafetyRegressionReport(sentinelInput) : { status:"failed_safe", checks:[], failures:[], warnings:[], safety:safety(), redacted:true };
  }
  function auditOf(input, sentinel) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.auditReviewSummary) return safe.auditReviewSummary;
    if (safe.auditReviewCenter) return safe.auditReviewCenter;
    const auditApi = api("WeishanFlightWorkflowAuditReviewCenter");
    return typeof auditApi.buildFlightWorkflowAuditReviewCenter === "function" ? auditApi.buildFlightWorkflowAuditReviewCenter(Object.assign({}, safe, { safetyRegressionSummary:sentinel })) : { status:"failed_safe", auditHealth:{ overall:"unknown" }, userFacingSummary:{ resultLabel:"未知", redacted:true }, safety:safety(), redacted:true };
  }
  function humanReviewOf(input, audit, sentinel) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.humanReviewChecklistSummary) return safe.humanReviewChecklistSummary;
    const reviewApi = api("WeishanFlightWorkflowHumanReviewChecklist");
    return typeof reviewApi.buildFlightWorkflowHumanReviewChecklist === "function" ? reviewApi.buildFlightWorkflowHumanReviewChecklist(Object.assign({}, safe, { auditReviewSummary:audit, safetyRegressionSummary:sentinel })) : { status:"needs_review", redacted:true };
  }
  function finalPacketOf(input, audit, review, sentinel) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.finalSafeHandoffPacketSummary) return safe.finalSafeHandoffPacketSummary;
    const packetApi = api("WeishanFlightWorkflowFinalSafeHandoffPacket");
    return typeof packetApi.buildFlightWorkflowFinalSafeHandoffPacket === "function" ? packetApi.buildFlightWorkflowFinalSafeHandoffPacket(Object.assign({}, safe, { auditReviewSummary:audit, humanReviewChecklistSummary:review, safetyRegressionSummary:sentinel })) : { status:"needs_review", redacted:true };
  }
  function betaSummaryOf(readiness, input) {
    const safe = input && typeof input === "object" ? input : {};
    const guided = safe.guidedUserTestSummary || safe.guidedUserTestMode || null;
    const feedback = safe.feedbackSanitizerSummary || null;
    return { betaAcceptanceSummary:{ status:readiness.safeForUserFacingBeta ? "ready" : readiness.status, resultLabel:readiness.safeForUserFacingBeta ? "可以开始用户验收" : (readiness.status === "warning" ? "仍需复核" : "暂不可验收"), safeForGuidedUserTest:readiness.safeForUserFacingBeta === true, redacted:true }, guidedUserTestSummary:stripUnsafe(guided || { status:"not_started", resultLabel:"测试未开始", redacted:true }), feedbackSanitizerSummary:stripUnsafe(feedback || { status:"ready", resultLabel:"测试反馈已脱敏", redacted:true }), betaAcceptanceReady:readiness.safeForUserFacingBeta === true, guidedUserTestStatus:safeText(guided && guided.status || "not_started") };
  }
  function exportPreviewOf(input, audit) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.safeSessionExportPreview) return safe.safeSessionExportPreview;
    const exportApi = api("WeishanFlightWorkflowSafeSessionExportPreview");
    return typeof exportApi.buildFlightWorkflowSafeSessionExportPreview === "function" ? exportApi.buildFlightWorkflowSafeSessionExportPreview(Object.assign({}, safe, { auditReviewSummary:audit })) : { status:"ready", canWriteFile:false, download:false, safety:safety(), redacted:true };
  }
  function operatorOf(input, audit, review, packet, sentinel) {
    const safe = input && typeof input === "object" ? input : {};
    if (safe.operatorConsoleSummary) return safe.operatorConsoleSummary;
    const operatorApi = api("WeishanFlightWorkflowOperatorConsole");
    return typeof operatorApi.buildFlightWorkflowOperatorConsole === "function" ? operatorApi.buildFlightWorkflowOperatorConsole(Object.assign({}, safe, { auditReviewSummary:audit, humanReviewChecklistSummary:review, finalSafeHandoffPacketSummary:packet, safetyRegressionSummary:sentinel })) : { status:"failed_safe", readiness:{}, userFacingSummary:{ resultLabel:"未知", redacted:true }, safety:safety(), redacted:true };
  }
  function hasForbiddenClaim(input, copyRegistry) {
    const safe = input && typeof input === "object" ? input : {};
    const source = JSON.stringify(stripUnsafe(safe.userFacingSafetyCopy || safe.userFacingSummary || safe.copyDraft || {}));
    const registryBlocked = copyRegistry && (copyRegistry.status === "blocked" || copyRegistry.copyValidationStatus === "blocked");
    return registryBlocked || FORBIDDEN_CLAIM_RE.test(source || "");
  }
  function evaluateFlightWorkflowReleaseReadiness(input) {
    const safe = input && typeof input === "object" ? input : {};
    const copyRegistry = copyRegistryOf(safe);
    const simulator = simulatorOf(safe);
    const matrix = matrixOf(safe, simulator);
    const sentinel = sentinelOf(safe, matrix);
    const audit = auditOf(safe, sentinel);
    const review = humanReviewOf(safe, audit, sentinel);
    const packet = finalPacketOf(safe, audit, review, sentinel);
    const exportPreview = exportPreviewOf(safe, audit);
    const operator = operatorOf(safe, audit, review, packet, sentinel);
    const matrixFail = matrix.status === "fail" || matrix.status === "failed_safe" || matrix.overallHealth === "fail" || Number(matrix.failedCount || 0) > 0 || Number(matrix.blockedCount || 0) > 0;
    const matrixWarning = matrix.status === "warning" || matrix.overallHealth === "warning" || Number(matrix.warningCount || 0) > 0 || simulator.status === "warning";
    const sentinelFail = sentinel.status === "fail" || sentinel.status === "failed_safe";
    const auditBlocked = audit.status === "blocked" || audit.auditHealth && audit.auditHealth.overall === "blocked";
    const humanReviewWarning = review.status === "needs_review" || review.status === "warning";
    const packetBlocked = packet.status === "blocked";
    const forbiddenClaim = hasForbiddenClaim(safe, copyRegistry);
    const blocked = sentinelFail || matrixFail || forbiddenClaim || auditBlocked || packetBlocked;
    const warning = !blocked && (humanReviewWarning || matrixWarning || operator.status === "warning" || packet.status === "needs_review");
    const status = blocked ? "blocked" : (warning ? "warning" : "ready");
    return clone({ status:status, releaseReady:status === "ready", safeForUserFacingBeta:status === "ready", sentinelFail:sentinelFail, matrixFail:matrixFail, forbiddenClaim:forbiddenClaim, auditBlocked:auditBlocked, humanReviewNeedsReview:humanReviewWarning, scenarioMatrixWarning:matrixWarning, matrixPass:!matrixFail, operatorReady:operator.status === "ready", copyValidationStatus:copyRegistry.copyValidationStatus || copyRegistry.status || "failed_safe", scenarioCount:Number(matrix.scenarioCount || simulator.summary && simulator.summary.scenarioCount || 0), failedCount:Number(matrix.failedCount || 0), blockedCount:Number(matrix.blockedCount || 0), warningCount:Number(matrix.warningCount || 0), exportPreviewReady:exportPreview.status === "ready" || exportPreview.status === "preview_ready", redacted:true });
  }
  function buildReleaseReadinessCards(input) {
    const readiness = evaluateFlightWorkflowReleaseReadiness(input || {});
    function card(cardId, label, status, detail) { return { cardId:cardId, label:safeText(label), status:status, value:status === "ready" ? "发布就绪" : (status === "warning" ? "仍需复核" : "暂不可验收"), detail:safeText(detail), redacted:true }; }
    return clone([
      card("release_status", "发布状态", readiness.status, readiness.safeForUserFacingBeta ? "可以进入只读 Beta 验收" : "存在需要注意的项目"),
      card("safety_boundary", "安全红线", readiness.status === "blocked" ? "blocked" : "ready", "当前仍是只读候选证据流程"),
      card("safety_matrix", "安全矩阵", readiness.matrixFail ? "blocked" : (readiness.scenarioMatrixWarning ? "warning" : "ready"), String(readiness.scenarioCount) + " 个本地安全场景"),
      card("user_copy", "安全文案已统一", readiness.copyValidationStatus === "pass" ? "ready" : "blocked", "只读、安全、平台为准")
    ]);
  }
  function buildForbiddenCapabilities(copyRegistry) {
    const fromRegistry = copyRegistry && copyRegistry.forbiddenCapabilitySummary && copyRegistry.forbiddenCapabilitySummary.forbiddenCapabilities;
    return toArray(fromRegistry).length ? toArray(fromRegistry).map(safeText) : ["付款", "下单", "出票", "证件银行卡上传", "自动打开交易页", "真实 provider 请求", "写文件或下载"];
  }
  function buildFlightWorkflowReleaseReadinessDashboard(input) {
    try {
      if (!input || typeof input !== "object" || Array.isArray(input)) return sanitizeFlightWorkflowReleaseReadinessDashboard({ status:"failed_safe", releaseReady:false, safeForUserFacingBeta:false, betaAcceptanceReady:false, guidedUserTestStatus:"not_started", readiness:{ status:"failed_safe", safeForUserFacingBeta:false, redacted:true }, cards:[], checklistRows:[], forbiddenCapabilities:buildForbiddenCapabilities(null), safety:safety(), redacted:true });
      const safe = input;
      const copyRegistry = copyRegistryOf(safe);
      const simulator = simulatorOf(safe);
      const matrix = matrixOf(safe, simulator);
      const sentinel = sentinelOf(safe, matrix);
      const audit = auditOf(safe, sentinel);
      const review = humanReviewOf(safe, audit, sentinel);
      const packet = finalPacketOf(safe, audit, review, sentinel);
      const exportPreview = exportPreviewOf(safe, audit);
      const operator = operatorOf(safe, audit, review, packet, sentinel);
      const readiness = evaluateFlightWorkflowReleaseReadiness(Object.assign({}, safe, { scenarioSimulationSuite:simulator, matrixSummary:matrix, safetyRegressionSummary:sentinel, auditReviewSummary:audit, humanReviewChecklistSummary:review, finalSafeHandoffPacketSummary:packet, safeSessionExportPreview:exportPreview, operatorConsoleSummary:operator }));
      const resultLabel = readiness.safeForUserFacingBeta ? "可以进入只读 Beta 验收" : (readiness.status === "warning" ? "存在需要注意的项目" : "暂不可验收");
      const betaFields = betaSummaryOf(readiness, safe);
      return sanitizeFlightWorkflowReleaseReadinessDashboard(Object.assign({ dashboardName:DASHBOARD_NAME, appVersion:FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION, releaseVersion:safeText(safe.releaseVersion || FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION), status:readiness.status, releaseReady:readiness.releaseReady, safeForUserFacingBeta:readiness.safeForUserFacingBeta, readiness:readiness, releaseReadinessSummary:readiness, operatorConsoleSummary:stripUnsafe(operator), safetyRegressionSummary:stripUnsafe(sentinel), scenarioSimulationSummary:stripUnsafe(simulator.summary || simulator), safetyTestMatrixSummary:stripUnsafe(matrix), auditReviewSummary:stripUnsafe(audit), humanReviewChecklistSummary:stripUnsafe(review), finalSafeHandoffPacketSummary:stripUnsafe(packet), safeSessionExportPreview:stripUnsafe(exportPreview), betaExpansionGateSummary:stripUnsafe(safe.betaExpansionGateSummary || null), publicPilotChecklistSummary:stripUnsafe(safe.publicPilotChecklistSummary || null), pilotReadinessSummary:stripUnsafe(safe.pilotReadinessSummary || null), safeForSmallPublicPilot:safe.safeForSmallPublicPilot === true, pilotNextStep:safeText(safe.pilotNextStep || ""), pilotOnboardingSummary:stripUnsafe(safe.pilotOnboardingSummary || null), readOnlyConsentSummary:stripUnsafe(safe.readOnlyConsentSummary || null), pilotOnboardingViewModel:stripUnsafe(safe.pilotOnboardingViewModel || null), pilotEntryStatus:safeText(safe.pilotEntryStatus || ""), canEnterReadOnlyPilot:safe.canEnterReadOnlyPilot === true, pilotConsentRequired:safe.pilotConsentRequired === true, userSafetyCopySummary:stripUnsafe(copyRegistry.userSafetyCopySummary || copyRegistry), forbiddenCapabilitySummary:stripUnsafe(copyRegistry.forbiddenCapabilitySummary || {}), copyValidationStatus:readiness.copyValidationStatus, userFacingBetaReadiness:readiness.safeForUserFacingBeta ? "ready" : readiness.status, forbiddenCapabilities:buildForbiddenCapabilities(copyRegistry), cards:buildReleaseReadinessCards(Object.assign({}, safe, { scenarioSimulationSuite:simulator, matrixSummary:matrix, safetyRegressionSummary:sentinel, auditReviewSummary:audit, humanReviewChecklistSummary:review, finalSafeHandoffPacketSummary:packet, safeSessionExportPreview:exportPreview, operatorConsoleSummary:operator })), checklistRows:[{ checkId:"sentinel", label:"安全回归", passed:!readiness.sentinelFail, value:readiness.sentinelFail ? "已阻断" : "通过", redacted:true }, { checkId:"matrix", label:"安全矩阵", passed:!readiness.matrixFail, value:readiness.matrixFail ? "已阻断" : "通过", redacted:true }, { checkId:"audit", label:"用户复核摘要", passed:!readiness.auditBlocked, value:readiness.auditBlocked ? "已阻断" : (readiness.humanReviewNeedsReview ? "仍需复核" : "通过"), redacted:true }, { checkId:"copy", label:"安全文案已统一", passed:!readiness.forbiddenClaim, value:readiness.forbiddenClaim ? "已阻断" : "通过", redacted:true }], userFacingSummary:{ title:"机票工作流发布就绪总览", resultLabel:resultLabel, caveat:"当前仍是只读候选证据流程。不代表真实票价、库存或可出票。唯珊不会付款、不会下单、不会出票。唯珊不会上传证件、银行卡或登录凭据。", primarySafetyCopy:"安全红线保持关闭；价格、库存、税费和规则以平台页面为准。", redacted:true }, nextReleaseAction:{ actionId:readiness.safeForUserFacingBeta ? "manual_read_only_beta_acceptance" : "review_release_readiness", label:readiness.safeForUserFacingBeta ? "可以进入只读 Beta 验收" : "处理发布阻断项", enabled:true, requiresUserConfirmation:false, redacted:true }, safety:safety(), redacted:true }, betaFields));
    } catch (error) {
      return sanitizeFlightWorkflowReleaseReadinessDashboard({ status:"failed_safe", releaseReady:false, safeForUserFacingBeta:false, readiness:{ status:"failed_safe", safeForUserFacingBeta:false, redacted:true }, cards:[], checklistRows:[], forbiddenCapabilities:buildForbiddenCapabilities(null), safety:safety(), redacted:true });
    }
  }
  function sanitizeFlightWorkflowReleaseReadinessDashboard(input) {
    const safe = input && typeof input === "object" ? input : {};
    return clone(Object.assign({ dashboardName:DASHBOARD_NAME, appVersion:FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION, releaseVersion:safeText(safe.releaseVersion || FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION), status:safeText(safe.status || "failed_safe"), releaseReady:safe.releaseReady === true, safeForUserFacingBeta:safe.safeForUserFacingBeta === true, readiness:clone(safe.readiness || { status:"failed_safe", safeForUserFacingBeta:false, redacted:true }), cards:toArray(safe.cards), checklistRows:toArray(safe.checklistRows), forbiddenCapabilities:toArray(safe.forbiddenCapabilities).map(safeText), userFacingSummary:Object.assign({ title:"机票工作流发布就绪总览", resultLabel:"暂不可验收", caveat:"当前仍是只读候选证据流程。不代表真实票价、库存或可出票。唯珊不会付款、不会下单、不会出票。唯珊不会上传证件、银行卡或登录凭据。", primarySafetyCopy:"安全红线保持关闭；价格、库存、税费和规则以平台页面为准。", redacted:true }, stripUnsafe(safe.userFacingSummary || {})), nextReleaseAction:Object.assign({ actionId:"review_release_readiness", label:"处理发布阻断项", enabled:false, requiresUserConfirmation:false, redacted:true }, stripUnsafe(safe.nextReleaseAction || {})), safety:Object.assign(safety(), stripUnsafe(safe.safety || {})), bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }, stripUnsafe({ releaseReadinessSummary:safe.releaseReadinessSummary, operatorConsoleSummary:safe.operatorConsoleSummary, safetyRegressionSummary:safe.safetyRegressionSummary, scenarioSimulationSummary:safe.scenarioSimulationSummary, safetyTestMatrixSummary:safe.safetyTestMatrixSummary, auditReviewSummary:safe.auditReviewSummary, humanReviewChecklistSummary:safe.humanReviewChecklistSummary, finalSafeHandoffPacketSummary:safe.finalSafeHandoffPacketSummary, safeSessionExportPreview:safe.safeSessionExportPreview, betaExpansionGateSummary:safe.betaExpansionGateSummary || null, publicPilotChecklistSummary:safe.publicPilotChecklistSummary || null, pilotReadinessSummary:safe.pilotReadinessSummary || null, safeForSmallPublicPilot:safe.safeForSmallPublicPilot === true, pilotNextStep:safe.pilotNextStep || "", pilotOnboardingSummary:safe.pilotOnboardingSummary || null, readOnlyConsentSummary:safe.readOnlyConsentSummary || null, pilotOnboardingViewModel:safe.pilotOnboardingViewModel || null, pilotEntryStatus:safe.pilotEntryStatus || "", canEnterReadOnlyPilot:safe.canEnterReadOnlyPilot === true, pilotConsentRequired:safe.pilotConsentRequired === true, userSafetyCopySummary:safe.userSafetyCopySummary, forbiddenCapabilitySummary:safe.forbiddenCapabilitySummary, copyValidationStatus:safe.copyValidationStatus || "failed_safe", userFacingBetaReadiness:safe.userFacingBetaReadiness || safe.status || "failed_safe", betaAcceptanceSummary:safe.betaAcceptanceSummary || null, guidedUserTestSummary:safe.guidedUserTestSummary || null, feedbackSanitizerSummary:safe.feedbackSanitizerSummary || null, betaAcceptanceReady:safe.betaAcceptanceReady === true, guidedUserTestStatus:safe.guidedUserTestStatus || "not_started" })));
  }
  function buildFlightWorkflowReleaseReadinessDashboardAuditDraft(input) {
    const dashboard = buildFlightWorkflowReleaseReadinessDashboard(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_AUDIT_DRAFT", dashboardName:DASHBOARD_NAME, appVersion:FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION, releaseVersion:dashboard.releaseVersion, status:dashboard.status, safeForUserFacingBeta:dashboard.safeForUserFacingBeta, cardCount:dashboard.cards.length, checklistCount:dashboard.checklistRows.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }

  window.WeishanFlightWorkflowReleaseReadinessDashboard = { FLIGHT_WORKFLOW_RELEASE_READINESS_DASHBOARD_VERSION, DASHBOARD_NAME, evaluateFlightWorkflowReleaseReadiness, buildReleaseReadinessCards, buildFlightWorkflowReleaseReadinessDashboard, sanitizeFlightWorkflowReleaseReadinessDashboard, buildFlightWorkflowReleaseReadinessDashboardAuditDraft };
})();
