;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_FEEDBACK_REVIEW_BOARD_VERSION = "4.1.7";
  const BOARD_NAME = "global_shopping_offline_feedback_review_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, offline_feedback_review_only:true };
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "offline_feedback_review_only");
    return ALLOWED_MODES[mode] ? mode : "offline_feedback_review_only";
  }
  function resolveSummary(input, key, apiName, methodName) {
    const safe = obj(input);
    if (present(safe[key])) return obj(safe[key]);
    const api = window[apiName] || {};
    return typeof api[methodName] === "function" ? obj(api[methodName](safe)) : {};
  }
  function blockedReasons(input) {
    const safe = obj(input);
    const blocked = [];
    if (safe.feedbackSent === true || safe.feedbackEnabled === true) blocked.push("feedback sent");
    if (safe.uploadEnabled === true || safe.upload === true || safe.uploaded === true) blocked.push("uploaded");
    if (safe.emailEnabled === true || safe.email === true || safe.mail === true || safe.sendMail === true) blocked.push("email");
    if (safe.externalForm === true || safe.externalFormUrl != null) blocked.push("external form");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true || safe.rawUserText === true) blocked.push("raw user text saved");
    if (safe.feedbackTaskCreated === true || safe.createFeedbackTask === true) blocked.push("feedback task created");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (SECRET_VALUE_RE.test(JSON.stringify(safe))) blocked.push("secret leak");
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingOfflineFeedbackReviewBoard(input) {
    const safe = obj(input);
    const trialFeedbackSafetyGateSummary = resolveSummary(safe, "trialFeedbackSafetyGateSummary", "WeishanGlobalShoppingTrialFeedbackSafetyGate", "buildGlobalShoppingTrialFeedbackSafetyGate");
    const safeFeedbackDraftPanelSummary = resolveSummary(safe, "safeFeedbackDraftPanelSummary", "WeishanGlobalShoppingSafeFeedbackDraftPanel", "buildGlobalShoppingSafeFeedbackDraftPanel");
    const publicBetaFeedbackPlaceholderSummary = resolveSummary(safe, "publicBetaFeedbackPlaceholderSummary", "WeishanGlobalShoppingPublicBetaFeedbackPlaceholder", "buildGlobalShoppingPublicBetaFeedbackPlaceholder");
    const manualQaScenarioRunnerSummary = resolveSummary(safe, "manualQaScenarioRunnerSummary", "WeishanGlobalShoppingManualQaScenarioRunner", "buildGlobalShoppingManualQaScenarioRunner");
    const blocked = blockedReasons(safe);
    const upstreamBlocked = [
      trialFeedbackSafetyGateSummary,
      safeFeedbackDraftPanelSummary,
      publicBetaFeedbackPlaceholderSummary,
      manualQaScenarioRunnerSummary
    ].some(function (summary) {
      return /^(blocked|failed_safe)$/.test(text(obj(summary).status || ""));
    });
    const status = blocked.length || upstreamBlocked ? "blocked" : "ready";
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_FEEDBACK_REVIEW_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      status,
      title:"Offline Feedback Review Board",
      feedbackEnabled:false,
      uploadEnabled:false,
      emailEnabled:false,
      externalFormUrl:null,
      rawUserTextPersistence:false,
      manualReviewRequired:true,
      trialFeedbackSafetyGateSummary:trialFeedbackSafetyGateSummary,
      safeFeedbackDraftPanelSummary:safeFeedbackDraftPanelSummary,
      publicBetaFeedbackPlaceholderSummary:publicBetaFeedbackPlaceholderSummary,
      manualQaScenarioRunnerSummary:manualQaScenarioRunnerSummary,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"Offline Feedback Review Board",
        resultLabel:status === "blocked" ? "Offline Feedback Review Board 已阻断" : "Offline Feedback Review Board 已准备",
        caveat:"反馈仍保持关闭，不发送、不上传、不保存用户原文。"
      },
      externalUrl:null,
      platformUrl:null,
      providerUrl:null,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      buyButtonEnabled:false,
      checkoutButtonEnabled:false,
      paymentButtonEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingOfflineFeedbackReviewRows(input) {
    const safe = evaluateGlobalShoppingOfflineFeedbackReviewBoard(input || {});
    return clone([
      row("offline_feedback_review_board", "Offline Feedback Review Board", safe.userFacingSummary.resultLabel, safe.status === "blocked" ? "blocked" : "pass"),
      row("offline_feedback_review_switches", "Feedback Review", "feedbackEnabled:false / uploadEnabled:false / emailEnabled:false", "pass"),
      row("offline_feedback_review_boundary", "Feedback Boundary", "反馈仍保持关闭，不发送、不上传、不保存用户原文", "warning"),
      row("offline_feedback_review_external_form", "External Form", "externalFormUrl:null", "pass"),
      row("offline_feedback_review_manual_review", "Manual Review Required", "下一步只能人工复核或继续测试", "warning")
    ]);
  }

  function buildGlobalShoppingOfflineFeedbackReviewSections(input) {
    const safe = evaluateGlobalShoppingOfflineFeedbackReviewBoard(input || {});
    return clone([
      section("offline_feedback_review_summary", "Offline Feedback Review Board", safe.userFacingSummary.resultLabel),
      section("offline_feedback_review_feedback", "Feedback Review", "反馈仍保持关闭，不发送、不上传、不保存用户原文"),
      section("offline_feedback_review_boundary", "Locked Capabilities", "不自动发布、不接 provider、不启用交易")
    ]);
  }

  function buildGlobalShoppingOfflineFeedbackReviewBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineFeedbackReviewBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_FEEDBACK_REVIEW_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_FEEDBACK_REVIEW_BOARD_VERSION,
      status:safe.status,
      feedbackEnabled:false,
      uploadEnabled:false,
      emailEnabled:false,
      rawUserTextPersistence:false,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineFeedbackReviewBoard(board) {
    const safe = evaluateGlobalShoppingOfflineFeedbackReviewBoard(board || {});
    safe.rows = buildGlobalShoppingOfflineFeedbackReviewRows(safe);
    safe.sections = buildGlobalShoppingOfflineFeedbackReviewSections(safe);
    return safe;
  }

  function buildGlobalShoppingOfflineFeedbackReviewBoard(input) {
    try {
      return sanitizeGlobalShoppingOfflineFeedbackReviewBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineFeedbackReviewBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineFeedbackReviewBoard = {
    GLOBAL_SHOPPING_OFFLINE_FEEDBACK_REVIEW_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingOfflineFeedbackReviewBoard,
    evaluateGlobalShoppingOfflineFeedbackReviewBoard,
    buildGlobalShoppingOfflineFeedbackReviewRows,
    buildGlobalShoppingOfflineFeedbackReviewSections,
    buildGlobalShoppingOfflineFeedbackReviewBoardAuditDraft,
    sanitizeGlobalShoppingOfflineFeedbackReviewBoard
  };
})();
