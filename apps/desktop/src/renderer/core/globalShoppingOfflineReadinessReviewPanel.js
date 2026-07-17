;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_READINESS_REVIEW_PANEL_VERSION = "4.2.8";
  const PANEL_NAME = "global_shopping_offline_readiness_review_panel_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, readiness_review_only:true };

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "readiness_review_only");
    return ALLOWED_MODES[mode] ? mode : "readiness_review_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|manual_review_required)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    return /^(ready|needs_review|blocked|failed_safe|manual_review_required)$/.test(status) ? status : "needs_review";
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
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.external === true || safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingOfflineReadinessReviewPanel(input) {
    const safe = obj(input);
    const qaFreezeGate = resolveSummary(safe, "publicBetaQaFreezeGateSummary", "WeishanGlobalShoppingPublicBetaQaFreezeGate", "buildGlobalShoppingPublicBetaQaFreezeGate");
    const manualTrialSummaryBoard = resolveSummary(safe, "manualTrialSummaryBoardSummary", "WeishanGlobalShoppingManualTrialSummaryBoard", "buildGlobalShoppingManualTrialSummaryBoard");
    const offlineTrialReleaseGate = resolveSummary(safe, "offlineTrialReleaseGateSummary", "WeishanGlobalShoppingOfflineTrialReleaseGate", "buildGlobalShoppingOfflineTrialReleaseGate");
    const manualLaunchHandoffPack = resolveSummary(safe, "manualLaunchHandoffPackSummary", "WeishanGlobalShoppingManualLaunchHandoffPack", "buildGlobalShoppingManualLaunchHandoffPack");
    const stabilityAudit = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const summaries = [qaFreezeGate, manualTrialSummaryBoard, offlineTrialReleaseGate, manualLaunchHandoffPack, stabilityAudit];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const upstreamBlocked = summaries.some(function (summary) { return normalizeStatus(obj(summary).status || obj(summary).freezeStatus || obj(summary).trialSummaryStatus || "", "needs_review") === "blocked"; });
    const upstreamNeedsReview = summaries.some(function (summary) {
      const normalized = normalizeStatus(obj(summary).status || obj(summary).freezeStatus || obj(summary).trialSummaryStatus || "", "needs_review");
      return normalized !== "ready" && normalized !== "manual_review_required";
    });
    const blocked = blockedReasons(safe);
    const readinessStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const readinessRows = [
      row("offline_readiness_qa_freeze", "Public Beta QA Freeze Gate", text(obj(qaFreezeGate.userFacingSummary).resultLabel || "Public Beta QA Freeze Gate 仍需复核"), readinessStatus === "blocked" ? "blocked" : "warning"),
      row("offline_readiness_trial_summary", "Manual Trial Summary Board", text(obj(manualTrialSummaryBoard.userFacingSummary).resultLabel || "Manual Trial Summary Board 仍需复核"), readinessStatus === "blocked" ? "blocked" : "warning"),
      row("offline_readiness_offline_gate", "Offline Trial Release Gate", text(obj(offlineTrialReleaseGate.userFacingSummary).resultLabel || "Offline Trial Release Gate 仍需复核"), readinessStatus === "blocked" ? "blocked" : "warning"),
      row("offline_readiness_handoff", "Manual Launch Handoff Pack", text(obj(manualLaunchHandoffPack.userFacingSummary).resultLabel || "Manual Launch Handoff Pack 仍需复核"), readinessStatus === "blocked" ? "blocked" : "warning"),
      row("offline_readiness_stability", "Public Beta Stability Audit", text(obj(stabilityAudit.userFacingSummary).resultLabel || "Public Beta Stability Audit 仍需复核"), readinessStatus === "blocked" ? "blocked" : "warning")
    ];
    return clone({
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_READINESS_REVIEW_PANEL_VERSION,
      panelMode:safeMode(safe.panelMode),
      readinessStatus:readinessStatus,
      status:readinessStatus,
      readinessRows:readinessRows,
      blockedCapabilities:blocked,
      knownLimitations:[
        "只做离线复核",
        "不自动通过",
        "不创建 release",
        "不启用 provider",
        "不启用交易"
      ],
      manualChecklist:[
        "确认冻结范围仍为只读 QA",
        "确认人工试用摘要已人工复核",
        "确认离线准备复核后再决定下一阶段"
      ],
      manualReviewRequired:true,
      publicBetaQaFreezeGateSummary:qaFreezeGate,
      manualTrialSummaryBoardSummary:manualTrialSummaryBoard,
      offlineTrialReleaseGateSummary:offlineTrialReleaseGate,
      manualLaunchHandoffPackSummary:manualLaunchHandoffPack,
      publicBetaStabilityAuditSummary:stabilityAudit,
      userFacingSummary:{
        title:"Offline Readiness Review Panel",
        resultLabel:readinessStatus === "blocked" ? "Offline Readiness Review Panel 已阻断" : (readinessStatus === "needs_review" ? "Offline Readiness Review Panel 仍需复核" : "Offline Readiness Review Panel 进入人工复核"),
        caveat:"只做离线准备复核，不自动通过。"
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

  function buildGlobalShoppingOfflineReadinessReviewRows(input) {
    const safe = evaluateGlobalShoppingOfflineReadinessReviewPanel(input || {});
    return clone(safe.readinessRows.concat([
      row("offline_readiness_limitations", "Known Limitations", safe.knownLimitations.join(" / "), "warning"),
      row("offline_readiness_checklist", "Manual Review Required", safe.manualChecklist.join(" / "), "warning")
    ]));
  }

  function buildGlobalShoppingOfflineReadinessReviewSections(input) {
    const safe = evaluateGlobalShoppingOfflineReadinessReviewPanel(input || {});
    return clone([
      { sectionId:"offline_readiness_panel", label:"Offline Readiness Review Panel", value:safe.userFacingSummary.resultLabel, redacted:true },
      { sectionId:"offline_readiness_limitations", label:"Known Limitations", value:safe.knownLimitations.join(" / "), redacted:true },
      { sectionId:"offline_readiness_manual", label:"Manual Review Required", value:"人工复核后再决定下一阶段", redacted:true }
    ]);
  }

  function buildGlobalShoppingOfflineReadinessReviewPanelAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineReadinessReviewPanel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_READINESS_REVIEW_PANEL_AUDIT_DRAFT",
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_READINESS_REVIEW_PANEL_VERSION,
      status:safe.status,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineReadinessReviewPanel(panel) {
    const safe = evaluateGlobalShoppingOfflineReadinessReviewPanel(panel || {});
    safe.rows = buildGlobalShoppingOfflineReadinessReviewRows(safe);
    safe.sections = buildGlobalShoppingOfflineReadinessReviewSections(safe);
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
    return safe;
  }

  function buildGlobalShoppingOfflineReadinessReviewPanel(input) {
    try {
      return sanitizeGlobalShoppingOfflineReadinessReviewPanel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineReadinessReviewPanel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineReadinessReviewPanel = {
    GLOBAL_SHOPPING_OFFLINE_READINESS_REVIEW_PANEL_VERSION,
    PANEL_NAME,
    buildGlobalShoppingOfflineReadinessReviewPanel,
    evaluateGlobalShoppingOfflineReadinessReviewPanel,
    buildGlobalShoppingOfflineReadinessReviewRows,
    buildGlobalShoppingOfflineReadinessReviewSections,
    buildGlobalShoppingOfflineReadinessReviewPanelAuditDraft,
    sanitizeGlobalShoppingOfflineReadinessReviewPanel
  };
})();
