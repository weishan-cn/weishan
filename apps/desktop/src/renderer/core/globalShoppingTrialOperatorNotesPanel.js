;(function () {
  "use strict";

  const GLOBAL_SHOPPING_TRIAL_OPERATOR_NOTES_PANEL_VERSION = "4.2.7";
  const PANEL_NAME = "global_shopping_trial_operator_notes_panel_v1";
  const ALLOWED_MODES = { disabled:true, readonly:true, offline_mock:true, trial_operator_notes_only:true };
  const ALLOWED_NEXT_ACTIONS = ["continue_testing", "improve_copy", "expand_offline_scenarios", "manual_review_required", "blocked"];
  const SECRET_NAME_RE = /(^|[^a-z])(token|secret|api[_ -]?key|password)([^a-z]|$)/i;
  const BLOCKED_TEXT_RE = /production_ready|auto_release|auto_launch|auto_publish|ready_to_publish|enable_provider|enable_payment|enable_order/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function present(value) { return Object.keys(obj(value)).length > 0; }
  function unique(values) {
    return values.filter(Boolean).filter(function (value, index, array) { return array.indexOf(value) === index; });
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
  }
  function section(sectionId, label, value) {
    return { sectionId:text(sectionId), label:text(label), value:text(value), redacted:true };
  }
  function safeMode(value) {
    const mode = text(value || "trial_operator_notes_only");
    return ALLOWED_MODES[mode] ? mode : "trial_operator_notes_only";
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
    if (safe.notesPersistence === true || safe.persisted === true) blocked.push("notes persistence");
    if (safe.taskCreate === true || safe.createTask === true) blocked.push("task create");
    if (safe.issueCreate === true || safe.createIssue === true) blocked.push("issue create");
    if (safe.fileWrite === true || safe.writeFile === true) blocked.push("file write");
    if (safe.upload === true || safe.uploadEnabled === true) blocked.push("upload");
    if (safe.mail === true || safe.sendMail === true || safe.email === true) blocked.push("mail");
    if (safe.externalOpen === true || safe.openExternal === true || safe.windowOpen === true || safe["window.open"] === true) blocked.push("external");
    if (safe.rawUserTextPersistence === true || safe.savedRawUserText === true) blocked.push("raw user text persistence");
    if (safe.provider === true || safe.realProvider === true || safe.productionProvider === true || safe.enableProvider === true) blocked.push("provider");
    if (safe.network === true || safe.fetch === true || safe.request === true) blocked.push("network");
    if (safe.key === true || safe.readApiKey === true || safe.credentialRead === true) blocked.push("key");
    if (safe.endpoint === true || safe.generateEndpoint === true) blocked.push("endpoint");
    if (safe.payment === true || safe.authorizePayment === true || safe.enablePayment === true) blocked.push("payment");
    if (safe.order === true || safe.createOrder === true || safe.submitOrder === true || safe.enableOrder === true) blocked.push("order");
    if (safe.ticketing === true || safe.issueTicket === true) blocked.push("ticketing");
    ["status", "title", "summary", "subtitle", "notesStatus", "nextManualAction"].forEach(function (key) {
      if (BLOCKED_TEXT_RE.test(text(safe[key]))) blocked.push("unsafe publish language");
    });
    Object.keys(safe).forEach(function (key) {
      const value = safe[key];
      if (SECRET_NAME_RE.test(key) && value !== false && value != null && text(value) !== "" && text(value).toLowerCase() !== "null") blocked.push("secret");
      if (/Url$/.test(key) && /(external|platform|provider|booking|checkout|payment|order)/i.test(key) && hasTruthyUrl(value)) blocked.push("url capability");
    });
    return unique(blocked);
  }

  function evaluateGlobalShoppingTrialOperatorNotesPanel(input) {
    const safe = obj(input);
    const publicBetaCandidateEvidenceReviewSummary = resolveSummary(safe, "publicBetaCandidateEvidenceReviewSummary", "WeishanGlobalShoppingPublicBetaCandidateEvidenceReview", "buildGlobalShoppingPublicBetaCandidateEvidenceReview");
    const finalTrialHandoffConsoleSummary = resolveSummary(safe, "finalTrialHandoffConsoleSummary", "WeishanGlobalShoppingFinalTrialHandoffConsole", "buildGlobalShoppingFinalTrialHandoffConsole");
    const manualNextPhaseDossierSummary = resolveSummary(safe, "manualNextPhaseDossierSummary", "WeishanGlobalShoppingManualNextPhaseDossier", "buildGlobalShoppingManualNextPhaseDossier");
    const offlineNextStepPlanningBoardSummary = resolveSummary(safe, "offlineNextStepPlanningBoardSummary", "WeishanGlobalShoppingOfflineNextStepPlanningBoard", "buildGlobalShoppingOfflineNextStepPlanningBoard");
    const summaries = [
      publicBetaCandidateEvidenceReviewSummary,
      finalTrialHandoffConsoleSummary,
      manualNextPhaseDossierSummary,
      offlineNextStepPlanningBoardSummary
    ];
    const missingRequired = summaries.some(function (summary) { return !present(summary); });
    const statuses = [
      normalizeStatus(obj(publicBetaCandidateEvidenceReviewSummary).evidenceReviewStatus || obj(publicBetaCandidateEvidenceReviewSummary).status, "needs_review"),
      normalizeStatus(obj(finalTrialHandoffConsoleSummary).handoffStatus || obj(finalTrialHandoffConsoleSummary).status, "needs_review"),
      normalizeStatus(obj(manualNextPhaseDossierSummary).dossierStatus || obj(manualNextPhaseDossierSummary).status, "needs_review"),
      normalizeStatus(obj(offlineNextStepPlanningBoardSummary).planningStatus || obj(offlineNextStepPlanningBoardSummary).status, "needs_review")
    ];
    const blocked = blockedReasons(safe);
    const upstreamBlocked = statuses.some(function (status) { return status === "blocked"; });
    const upstreamNeedsReview = statuses.some(function (status) { return status !== "ready" && status !== "manual_review_required"; });
    const notesStatus = blocked.length || upstreamBlocked
      ? "blocked"
      : (missingRequired || upstreamNeedsReview ? "needs_review" : "manual_review_required");
    const nextManualAction = notesStatus === "blocked"
      ? "blocked"
      : (safe.nextManualAction && ALLOWED_NEXT_ACTIONS.indexOf(text(safe.nextManualAction)) >= 0 ? text(safe.nextManualAction) : "manual_review_required");

    return clone({
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_TRIAL_OPERATOR_NOTES_PANEL_VERSION,
      panelMode:safeMode(safe.panelMode),
      notesStatus:notesStatus,
      status:notesStatus,
      operatorNotes:[
        "运营备注不保存、不上传、不创建任务",
        "当前仍处于只读候选复核阶段"
      ],
      testerNotes:[
        "继续离线验证，不发送真实反馈",
        "不保存用户原文，不创建 issue"
      ],
      knownLimitations:[
        "不写文件、不上传、不发邮件",
        "不打开外部平台、不创建任务、不创建 issue"
      ],
      manualChecklist:[
        "确认候选证据仅为只读复核，不写文件",
        "确认运营备注不保存、不上传、不创建任务",
        "确认安全边界未扩大"
      ],
      blockedCapabilities:["provider", "network", "external_open", "payment", "order", "ticketing", "release", "push", "launch"],
      nextManualAction:nextManualAction,
      manualReviewRequired:true,
      publicBetaCandidateEvidenceReviewSummary:publicBetaCandidateEvidenceReviewSummary,
      finalTrialHandoffConsoleSummary:finalTrialHandoffConsoleSummary,
      manualNextPhaseDossierSummary:manualNextPhaseDossierSummary,
      offlineNextStepPlanningBoardSummary:offlineNextStepPlanningBoardSummary,
      userFacingSummary:{
        title:"Trial Operator Notes Panel",
        resultLabel:notesStatus === "blocked" ? "Trial Operator Notes Panel 已阻断" : (notesStatus === "needs_review" ? "Trial Operator Notes Panel 仍需复核" : "Trial Operator Notes Panel 需人工复核"),
        caveat:"运营备注不保存、不上传、不创建任务"
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

  function buildGlobalShoppingTrialOperatorNotesRows(input) {
    const safe = evaluateGlobalShoppingTrialOperatorNotesPanel(input || {});
    return clone([
      row("trial_operator_notes_panel", "Trial Operator Notes Panel", safe.userFacingSummary.resultLabel, safe.notesStatus === "blocked" ? "blocked" : "warning"),
      row("trial_operator_notes", "Operator Notes", safe.operatorNotes.join(" / "), "warning"),
      row("trial_tester_notes", "Tester Notes", safe.testerNotes.join(" / "), "warning"),
      row("trial_next_manual_action", "Next Manual Action", safe.nextManualAction, safe.notesStatus === "blocked" ? "blocked" : "warning"),
      row("trial_operator_manual_review", "Manual Review Required", "运营备注不保存、不上传、不创建任务", "warning")
    ]);
  }

  function buildGlobalShoppingTrialOperatorNotesSections(input) {
    const safe = evaluateGlobalShoppingTrialOperatorNotesPanel(input || {});
    return clone([
      section("trial_operator_notes_panel", "Trial Operator Notes Panel", safe.userFacingSummary.resultLabel),
      section("operator_notes", "Operator Notes", safe.operatorNotes.join(" / ")),
      section("tester_notes", "Operator Notes", safe.testerNotes.join(" / ")),
      section("manual_review_required", "Manual Review Required", "运营备注不保存、不上传、不创建任务")
    ]);
  }

  function buildGlobalShoppingTrialOperatorNotesPanelAuditDraft(input) {
    const safe = evaluateGlobalShoppingTrialOperatorNotesPanel(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_TRIAL_OPERATOR_NOTES_PANEL_AUDIT_DRAFT",
      panelName:PANEL_NAME,
      appVersion:GLOBAL_SHOPPING_TRIAL_OPERATOR_NOTES_PANEL_VERSION,
      notesStatus:safe.notesStatus,
      nextManualAction:safe.nextManualAction,
      manualReviewRequired:true,
      redacted:true
    });
  }

  function sanitizeGlobalShoppingTrialOperatorNotesPanel(panel) {
    const safe = evaluateGlobalShoppingTrialOperatorNotesPanel(panel || {});
    safe.rows = buildGlobalShoppingTrialOperatorNotesRows(safe);
    safe.sections = buildGlobalShoppingTrialOperatorNotesSections(safe);
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

  function buildGlobalShoppingTrialOperatorNotesPanel(input) {
    try {
      return sanitizeGlobalShoppingTrialOperatorNotesPanel(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingTrialOperatorNotesPanel({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingTrialOperatorNotesPanel = {
    GLOBAL_SHOPPING_TRIAL_OPERATOR_NOTES_PANEL_VERSION,
    PANEL_NAME,
    buildGlobalShoppingTrialOperatorNotesPanel,
    evaluateGlobalShoppingTrialOperatorNotesPanel,
    buildGlobalShoppingTrialOperatorNotesRows,
    buildGlobalShoppingTrialOperatorNotesSections,
    buildGlobalShoppingTrialOperatorNotesPanelAuditDraft,
    sanitizeGlobalShoppingTrialOperatorNotesPanel
  };
})();
