;(function () {
  "use strict";

  const GLOBAL_SHOPPING_OFFLINE_ACCEPTANCE_SNAPSHOT_VERSION = "4.2.3";
  const SNAPSHOT_NAME = "global_shopping_offline_acceptance_snapshot_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, offline_acceptance_snapshot_only:true };
  const BLOCKED_TEXT_RE = /production_ready|auto_launch|auto_publish|ready_to_publish/i;
  const SECRET_VALUE_RE = /(?:token|secret|api[_ -]?key|password)\s*[:=]\s*[\w-]+/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "offline_acceptance_snapshot_only");
    return ALLOWED_MODES[mode] ? mode : "offline_acceptance_snapshot_only";
  }
  function normalizeStatus(value, fallback) {
    const status = text(value || fallback || "needs_review");
    if (/^(pass|ready)$/.test(status)) return "ready";
    if (/^(warn|warning)$/.test(status)) return "needs_review";
    if (status === "manual_review_required") return "ready";
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
    if (safe.snapshotPersistence === true || safe.persistSnapshot === true || safe.fileWrite === true || safe.writeFile === true) blocked.push("snapshot persistence");
    if (safe.export === true || safe.exportEnabled === true) blocked.push("export");
    if (safe.download === true || safe.downloadEnabled === true) blocked.push("download");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.release === true || safe.createRelease === true) blocked.push("release");
    if (safe.tag === true || safe.createTag === true) blocked.push("tag");
    if (safe.push === true || safe.pushEnabled === true) blocked.push("push");
    if (safe.gitMutation === true || safe.gitWrite === true || safe.gitReset === true) blocked.push("git mutation");
    if (safe.external === true || safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    if (SECRET_VALUE_RE.test(JSON.stringify(safe))) blocked.push("secret leak");
    ["status", "title", "summary"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("auto release language");
    });
    return blocked.filter(function (value, index, array) { return array.indexOf(value) === index; });
  }

  function evaluateGlobalShoppingOfflineAcceptanceSnapshot(input) {
    const safe = obj(input);
    const publicBetaFreezeEvidenceSummary = resolveSummary(safe, "publicBetaFreezeEvidenceSummary", "WeishanGlobalShoppingPublicBetaFreezeEvidenceSummary", "buildGlobalShoppingPublicBetaFreezeEvidenceSummary");
    const manualTrialIssueReviewBoardSummary = resolveSummary(safe, "manualTrialIssueReviewBoardSummary", "WeishanGlobalShoppingManualTrialIssueReviewBoard", "buildGlobalShoppingManualTrialIssueReviewBoard");
    const offlineReadinessReviewPanelSummary = resolveSummary(safe, "offlineReadinessReviewPanelSummary", "WeishanGlobalShoppingOfflineReadinessReviewPanel", "buildGlobalShoppingOfflineReadinessReviewPanel");
    const publicBetaAcceptanceBoardSummary = resolveSummary(safe, "publicBetaAcceptanceBoardSummary", "WeishanGlobalShoppingPublicBetaAcceptanceBoard", "buildGlobalShoppingPublicBetaAcceptanceBoard");
    const publicBetaStabilityAuditSummary = resolveSummary(safe, "publicBetaStabilityAuditSummary", "WeishanGlobalShoppingPublicBetaStabilityAudit", "buildGlobalShoppingPublicBetaStabilityAudit");
    const summaries = [
      publicBetaFreezeEvidenceSummary,
      manualTrialIssueReviewBoardSummary,
      offlineReadinessReviewPanelSummary,
      publicBetaAcceptanceBoardSummary,
      publicBetaStabilityAuditSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const upstreamBlocked = summaries.some(function (summary) {
      return normalizeStatus(obj(summary).status || obj(summary).freezeEvidenceStatus || obj(summary).issueReviewStatus || obj(summary).readinessStatus || obj(summary).acceptanceSnapshotStatus || "", "needs_review") === "blocked";
    });
    const upstreamNeedsReview = summaries.some(function (summary) {
      return normalizeStatus(obj(summary).status || obj(summary).freezeEvidenceStatus || obj(summary).issueReviewStatus || obj(summary).readinessStatus || obj(summary).acceptanceSnapshotStatus || "", "needs_review") !== "ready";
    });
    const blocked = blockedReasons(safe);
    const acceptanceSnapshotStatus = blocked.length || upstreamBlocked ? "blocked" : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    return clone({
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_ACCEPTANCE_SNAPSHOT_VERSION,
      snapshotMode:safeMode(safe.snapshotMode),
      acceptanceSnapshotStatus:acceptanceSnapshotStatus,
      status:acceptanceSnapshotStatus,
      acceptanceEvidence:text(obj(publicBetaAcceptanceBoardSummary.userFacingSummary).resultLabel || "Public Beta Acceptance Board 仍需复核"),
      readinessRows:[
        row("offline_acceptance_freeze_evidence", "Public Beta Freeze Evidence Summary", text(obj(publicBetaFreezeEvidenceSummary.userFacingSummary).resultLabel || "Public Beta Freeze Evidence Summary 仍需复核"), acceptanceSnapshotStatus === "blocked" ? "blocked" : "warning"),
        row("offline_acceptance_issue_review", "Manual Trial Issue Review Board", text(obj(manualTrialIssueReviewBoardSummary.userFacingSummary).resultLabel || "Manual Trial Issue Review Board 仍需复核"), acceptanceSnapshotStatus === "blocked" ? "blocked" : "warning"),
        row("offline_acceptance_snapshot", "Offline Acceptance Snapshot", acceptanceSnapshotStatus === "manual_review_required" ? "Offline Acceptance Snapshot 进入人工复核" : (acceptanceSnapshotStatus === "blocked" ? "Offline Acceptance Snapshot 已阻断" : "Offline Acceptance Snapshot 仍需复核"), acceptanceSnapshotStatus === "blocked" ? "blocked" : "warning")
      ],
      blockedCapabilities:blocked,
      knownLimitations:[
        "验收快照不写文件、不导出",
        "不创建 release",
        "不 push",
        "不启用 provider",
        "不启用交易"
      ],
      manualChecklist:[
        "确认冻结证据仍为只读摘要",
        "确认问题复核仍为离线视图",
        "确认验收快照不写文件、不导出",
        "仍需人工复核后再决定下一阶段"
      ],
      manualReviewRequired:true,
      publicBetaFreezeEvidenceSummary:publicBetaFreezeEvidenceSummary,
      manualTrialIssueReviewBoardSummary:manualTrialIssueReviewBoardSummary,
      offlineReadinessReviewPanelSummary:offlineReadinessReviewPanelSummary,
      publicBetaAcceptanceBoardSummary:publicBetaAcceptanceBoardSummary,
      publicBetaStabilityAuditSummary:publicBetaStabilityAuditSummary,
      userFacingSummary:{
        title:"Offline Acceptance Snapshot",
        resultLabel:acceptanceSnapshotStatus === "blocked" ? "Offline Acceptance Snapshot 已阻断" : (acceptanceSnapshotStatus === "needs_review" ? "Offline Acceptance Snapshot 仍需复核" : "Offline Acceptance Snapshot 进入人工复核"),
        caveat:"验收快照不写文件、不导出。"
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

  function buildGlobalShoppingOfflineAcceptanceSnapshotRows(input) {
    const safe = evaluateGlobalShoppingOfflineAcceptanceSnapshot(input || {});
    return clone(safe.readinessRows.concat([
      row("offline_acceptance_evidence", "Acceptance Snapshot", safe.acceptanceEvidence, safe.acceptanceSnapshotStatus === "blocked" ? "blocked" : "warning"),
      row("offline_acceptance_limitations", "Known Limitations", safe.knownLimitations.join(" / "), "warning"),
      row("offline_acceptance_manual", "Manual Review Required", "仍需人工复核后再决定下一阶段", "warning")
    ]));
  }

  function buildGlobalShoppingOfflineAcceptanceSnapshotSections(input) {
    const safe = evaluateGlobalShoppingOfflineAcceptanceSnapshot(input || {});
    return clone([
      { sectionId:"offline_acceptance_snapshot", label:"Offline Acceptance Snapshot", value:safe.userFacingSummary.resultLabel, redacted:true },
      { sectionId:"offline_acceptance_evidence", label:"Acceptance Snapshot", value:safe.acceptanceEvidence, redacted:true },
      { sectionId:"offline_acceptance_manual", label:"Manual Review Required", value:"仍需人工复核后再决定下一阶段", redacted:true }
    ]);
  }

  function buildGlobalShoppingOfflineAcceptanceSnapshotAuditDraft(input) {
    const safe = evaluateGlobalShoppingOfflineAcceptanceSnapshot(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_OFFLINE_ACCEPTANCE_SNAPSHOT_AUDIT_DRAFT",
      snapshotName:SNAPSHOT_NAME,
      appVersion:GLOBAL_SHOPPING_OFFLINE_ACCEPTANCE_SNAPSHOT_VERSION,
      acceptanceSnapshotStatus:safe.acceptanceSnapshotStatus,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingOfflineAcceptanceSnapshot(snapshot) {
    const safe = evaluateGlobalShoppingOfflineAcceptanceSnapshot(snapshot || {});
    safe.rows = buildGlobalShoppingOfflineAcceptanceSnapshotRows(safe);
    safe.sections = buildGlobalShoppingOfflineAcceptanceSnapshotSections(safe);
    return safe;
  }

  function buildGlobalShoppingOfflineAcceptanceSnapshot(input) {
    try {
      return sanitizeGlobalShoppingOfflineAcceptanceSnapshot(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingOfflineAcceptanceSnapshot({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingOfflineAcceptanceSnapshot = {
    GLOBAL_SHOPPING_OFFLINE_ACCEPTANCE_SNAPSHOT_VERSION,
    SNAPSHOT_NAME,
    buildGlobalShoppingOfflineAcceptanceSnapshot,
    evaluateGlobalShoppingOfflineAcceptanceSnapshot,
    buildGlobalShoppingOfflineAcceptanceSnapshotRows,
    buildGlobalShoppingOfflineAcceptanceSnapshotSections,
    buildGlobalShoppingOfflineAcceptanceSnapshotAuditDraft,
    sanitizeGlobalShoppingOfflineAcceptanceSnapshot
  };
})();
