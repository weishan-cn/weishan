;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_REGRESSION_EVIDENCE_BOARD_VERSION = "4.2.3";
  const BOARD_NAME = "global_shopping_offline_regression_evidence_board_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, regression_evidence_board_only:true };
  const UNCHANGED_BOUNDARIES = ["provider", "network", "key", "endpoint", "external_open", "payment", "order", "ticketing", "release", "push", "launch", "feedback_submit", "upload", "issue_create", "task_create"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /boundaryExpanded|safetyBoundaryRelaxed|production_ready|ready_to_publish|auto_publish|auto_launch|enable_provider|enable_payment|enable_order|submit_feedback|upload_feedback|create_issue|create_task/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) { return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; }); }
  function row(rowId, label, value, status) { return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function rule(ruleId, label, passed) { return { ruleId:text(ruleId), label:text(label), passed:passed === true, redacted:true }; }
  function safeMode(value) {
    const mode = text(value || "regression_evidence_board_only");
    return ALLOWED_MODES[mode] ? mode : "regression_evidence_board_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (status === "manual_review_required") return "manual_review_required";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
  }
  function hasTruthyUrl(value) {
    const normalized = text(value);
    return normalized && normalized !== "null";
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
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (safe.feedbackSubmit === true || safe.feedbackSubmitEnabled === true) blocked.push("feedback submit");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.issueCreate === true || safe.createIssue === true || safe.issueCreateEnabled === true) blocked.push("issue create");
    if (safe.taskCreate === true || safe.createTask === true || safe.taskCreateEnabled === true) blocked.push("task create");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true) blocked.push("raw user text persistence");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    ["status", "summary", "title", "subtitle", "regressionEvidenceStatus"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe regression language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingOfflineRegressionEvidenceBoard(input) {
    const safe = obj(input);
    const publicBetaCandidateQaFreezeSummary = resolveSummary(safe, "publicBetaCandidateQaFreezeSummary", "WeishanGlobalShoppingPublicBetaCandidateQaFreeze", "buildGlobalShoppingPublicBetaCandidateQaFreeze");
    const trialFeedbackIntakeMockSummary = resolveSummary(safe, "trialFeedbackIntakeMockSummary", "WeishanGlobalShoppingTrialFeedbackIntakeMock", "buildGlobalShoppingTrialFeedbackIntakeMock");
    const offlineSafetyDeltaBoardSummary = resolveSummary(safe, "offlineSafetyDeltaBoardSummary", "WeishanGlobalShoppingOfflineSafetyDeltaBoard", "buildGlobalShoppingOfflineSafetyDeltaBoard");
    const noProviderProductionBoundarySummary = resolveSummary(safe, "noProviderProductionBoundarySummary", "WeishanGlobalShoppingNoProviderProductionBoundary", "buildGlobalShoppingNoProviderProductionBoundary");
    const noTransactionRegressionGuardSummary = resolveSummary(safe, "noTransactionRegressionGuardSummary", "WeishanGlobalShoppingNoTransactionRegressionGuard", "buildGlobalShoppingNoTransactionRegressionGuard");
    const summaries = [publicBetaCandidateQaFreezeSummary, trialFeedbackIntakeMockSummary, offlineSafetyDeltaBoardSummary, noProviderProductionBoundarySummary, noTransactionRegressionGuardSummary];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaCandidateQaFreezeSummary).status || obj(publicBetaCandidateQaFreezeSummary).qaFreezeStatus, "needs_review"),
      normalizeStatus(obj(trialFeedbackIntakeMockSummary).status || obj(trialFeedbackIntakeMockSummary).intakeStatus, "needs_review"),
      normalizeStatus(obj(offlineSafetyDeltaBoardSummary).status || obj(offlineSafetyDeltaBoardSummary).deltaStatus, "needs_review"),
      normalizeStatus(obj(noProviderProductionBoundarySummary).status || obj(noProviderProductionBoundarySummary).boundaryStatus, "needs_review"),
      normalizeStatus(obj(noTransactionRegressionGuardSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "manual_review_required" && status !== "ready"; });
    const regressionEvidenceStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const knownWarnings = unique([].concat(Array.isArray(safe.knownWarnings) ? safe.knownWarnings : []).concat(Array.isArray(obj(publicBetaCandidateQaFreezeSummary).knownWarnings) ? obj(publicBetaCandidateQaFreezeSummary).knownWarnings : []).filter(function (item) { return /secret scan WARN/i.test(text(item)); }));

    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_REGRESSION_EVIDENCE_BOARD_VERSION,
      boardMode:safeMode(safe.boardMode),
      regressionEvidenceStatus:regressionEvidenceStatus,
      status:regressionEvidenceStatus,
      regressionEvidenceRows:[
        row("offline_regression_provider", "Provider Boundary", "provider / network / key / endpoint 仍关闭", "warning"),
        row("offline_regression_transaction", "Regression Evidence", "外部打开 / 付款 / 下单 / 出票 / 反馈提交 / 上传 / issue/task 创建仍关闭", "warning")
      ],
      unchangedSafetyBoundaries:UNCHANGED_BOUNDARIES.slice(),
      blockedCapabilities:["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch", "feedback_submit", "upload", "issue_create", "task_create"],
      knownWarnings:knownWarnings,
      manualReviewRequired:true,
      publicBetaCandidateQaFreezeSummary:publicBetaCandidateQaFreezeSummary,
      trialFeedbackIntakeMockSummary:trialFeedbackIntakeMockSummary,
      offlineSafetyDeltaBoardSummary:offlineSafetyDeltaBoardSummary,
      noProviderProductionBoundarySummary:noProviderProductionBoundarySummary,
      noTransactionRegressionGuardSummary:noTransactionRegressionGuardSummary,
      blockedReasons:blocked,
      userFacingSummary:{
        title:"Offline Regression Evidence Board",
        resultLabel:regressionEvidenceStatus === "blocked" ? "Offline Regression Evidence Board 已阻断" : (regressionEvidenceStatus === "needs_review" ? "Offline Regression Evidence Board 仍需复核" : "Offline Regression Evidence Board 需人工复核"),
        caveat:"回归证据仅为只读展示，不生成文件"
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
      feedbackSubmitEnabled:false,
      uploadEnabled:false,
      issueCreateEnabled:false,
      taskCreateEnabled:false,
      redacted:true
    });
  }

  function buildGlobalShoppingOfflineRegressionEvidenceRows(input) {
    const safe = evaluateGlobalShoppingOfflineRegressionEvidenceBoard(input || {});
    return clone([
      row("offline_regression_evidence_board", "Offline Regression Evidence Board", safe.userFacingSummary.resultLabel, safe.regressionEvidenceStatus === "blocked" ? "blocked" : "warning"),
      row("offline_regression_scope", "Regression Evidence", safe.unchangedSafetyBoundaries.join(" / "), "warning"),
      row("offline_regression_manual", "Manual Review Required", "回归证据仅为只读展示，不生成文件", "warning")
    ]);
  }

  function buildGlobalShoppingOfflineRegressionEvidenceRules(input) {
    const safe = evaluateGlobalShoppingOfflineRegressionEvidenceBoard(input || {});
    return clone(UNCHANGED_BOUNDARIES.map(function (boundary) {
      return rule("unchanged_" + boundary, boundary + " 未开放", safe.unchangedSafetyBoundaries.indexOf(boundary) >= 0);
    }).concat([
      rule("feedback_submit_disabled", "feedbackSubmitEnabled 必须 false", safe.feedbackSubmitEnabled === false),
      rule("upload_disabled", "uploadEnabled 必须 false", safe.uploadEnabled === false),
      rule("issue_create_disabled", "issueCreateEnabled 必须 false", safe.issueCreateEnabled === false),
      rule("task_create_disabled", "taskCreateEnabled 必须 false", safe.taskCreateEnabled === false)
    ]));
  }

  function buildGlobalShoppingOfflineRegressionEvidenceBoardAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineRegressionEvidenceBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_REGRESSION_EVIDENCE_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_REGRESSION_EVIDENCE_BOARD_VERSION,
      regressionEvidenceStatus:safe.regressionEvidenceStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineRegressionEvidenceBoard(board) {
    const safe = evaluateGlobalShoppingOfflineRegressionEvidenceBoard(board || {});
    safe.rows = buildGlobalShoppingOfflineRegressionEvidenceRows(safe);
    safe.rules = buildGlobalShoppingOfflineRegressionEvidenceRules(safe);
    safe.externalUrl = null;
    safe.platformUrl = null;
    safe.providerUrl = null;
    safe.bookingUrl = null;
    safe.checkoutUrl = null;
    safe.paymentUrl = null;
    safe.orderUrl = null;
    safe.buyButtonEnabled = false;
    safe.checkoutButtonEnabled = false;
    safe.paymentButtonEnabled = false;
    safe.feedbackSubmitEnabled = false;
    safe.uploadEnabled = false;
    safe.issueCreateEnabled = false;
    safe.taskCreateEnabled = false;
    return safe;
  }

  function buildGlobalShoppingOfflineRegressionEvidenceBoard(input) {
    try {
      return sanitizeGlobalShoppingOfflineRegressionEvidenceBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineRegressionEvidenceBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineRegressionEvidenceBoard = {
    GLOBAL_SHOPPING_OFFLINE_REGRESSION_EVIDENCE_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingOfflineRegressionEvidenceBoard,
    evaluateGlobalShoppingOfflineRegressionEvidenceBoard,
    buildGlobalShoppingOfflineRegressionEvidenceRows,
    buildGlobalShoppingOfflineRegressionEvidenceRules,
    buildGlobalShoppingOfflineRegressionEvidenceBoardAuditDraft,
    sanitizeGlobalShoppingOfflineRegressionEvidenceBoard
  };
})();
