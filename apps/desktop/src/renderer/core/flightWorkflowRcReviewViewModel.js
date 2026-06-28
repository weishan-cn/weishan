;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RC_REVIEW_VIEW_MODEL_VERSION = "2.1.89";
  const VIEW_MODEL_NAME = "flight_workflow_rc_review_view_model_v1";
  const CAVEAT = "该页面只用于只读 RC 候选复核，不保存真实身份、不发送真实邀请、不提供交易能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) { return { rowId:text(rowId || "row"), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true }; }
  function api(name) { return window[name] || {}; }
  function reviewConsoleOf(input) {
    const safe = obj(input);
    if (safe.rcCandidateReviewSummary) return safe.rcCandidateReviewSummary;
    return typeof api("WeishanFlightWorkflowRcCandidateReviewConsole").buildFlightWorkflowRcCandidateReviewConsole === "function"
      ? api("WeishanFlightWorkflowRcCandidateReviewConsole").buildFlightWorkflowRcCandidateReviewConsole(safe)
      : {};
  }
  function checklistOf(input) {
    const safe = obj(input);
    if (safe.rcEvidenceReviewSummary) return safe.rcEvidenceReviewSummary;
    return typeof api("WeishanFlightWorkflowRcEvidenceReviewChecklist").buildFlightWorkflowRcEvidenceReviewChecklist === "function"
      ? api("WeishanFlightWorkflowRcEvidenceReviewChecklist").buildFlightWorkflowRcEvidenceReviewChecklist(safe)
      : {};
  }
  function regressionAuditOf(input) {
    const safe = obj(input);
    if (safe.rcRegressionAuditSummary) return safe.rcRegressionAuditSummary;
    return typeof api("WeishanFlightWorkflowRcRegressionAuditPack").buildFlightWorkflowRcRegressionAuditPack === "function"
      ? api("WeishanFlightWorkflowRcRegressionAuditPack").buildFlightWorkflowRcRegressionAuditPack(safe)
      : {};
  }
  function releaseRiskOf(input) {
    const safe = obj(input);
    if (safe.releaseRiskLedgerSummary) return safe.releaseRiskLedgerSummary;
    return typeof api("WeishanFlightWorkflowReadOnlyReleaseRiskLedger").buildFlightWorkflowReadOnlyReleaseRiskLedger === "function"
      ? api("WeishanFlightWorkflowReadOnlyReleaseRiskLedger").buildFlightWorkflowReadOnlyReleaseRiskLedger(safe)
      : {};
  }
  function buildFlightWorkflowRcReviewRows(input) {
    const review = reviewConsoleOf(input || {});
    return toArray(review.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); });
  }
  function buildFlightWorkflowRcEvidenceRowsForView(input) {
    const checklist = checklistOf(input || {});
    return toArray(checklist.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); });
  }
  function buildFlightWorkflowRcReviewCards(input) {
    const review = reviewConsoleOf(input || {});
    const checklist = checklistOf(input || {});
    const regressionAudit = regressionAuditOf(input || {});
    const releaseRisk = releaseRiskOf(input || {});
    return clone([
      card("candidate_review", "候选复核", obj(review.userFacingSummary).resultLabel || review.status || "证据仍需补充"),
      card("evidence_review", "证据复核", obj(checklist.userFacingSummary).resultLabel || checklist.status || "证据仍需补充"),
      card("safety", "安全红线", review.status === "blocked" || checklist.status === "blocked" || regressionAudit.status === "blocked" || releaseRisk.status === "blocked" ? "RC 复核已阻断" : "复核不代表交易能力"),
      card("next_step", "下一步", obj(releaseRisk.userFacingSummary).resultLabel || obj(regressionAudit.userFacingSummary).resultLabel || obj(review.reviewDecision).label || obj(review.userFacingSummary).resultLabel || "证据仍需补充")
    ]);
  }
  function sanitizeFlightWorkflowRcReviewViewModel(vm) {
    const safe = obj(vm);
    return clone({
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_REVIEW_VIEW_MODEL_VERSION,
      status:text(safe.status || "failed_safe"),
      title:"只读 RC 候选复核",
      cards:toArray(safe.cards).map(function (item) { return card(item.cardId || "card", item.label || "", item.value || ""); }),
      reviewRows:toArray(safe.reviewRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      evidenceRows:toArray(safe.evidenceRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      riskRows:toArray(safe.riskRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); }),
      caveat:text(safe.caveat || CAVEAT),
      rcCandidateReviewSummary:clone(safe.rcCandidateReviewSummary || null),
      rcEvidenceReviewSummary:clone(safe.rcEvidenceReviewSummary || null),
      rcRegressionAuditSummary:clone(safe.rcRegressionAuditSummary || null),
      releaseRiskLedgerSummary:clone(safe.releaseRiskLedgerSummary || null),
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }
  function buildFlightWorkflowRcReviewViewModel(input) {
    try {
      const review = reviewConsoleOf(input || {});
      const checklist = checklistOf(input || {});
      const regressionAudit = regressionAuditOf(input || {});
      const releaseRisk = releaseRiskOf(input || {});
      const status = review.status === "blocked" || checklist.status === "blocked"
        ? "blocked"
        : review.status === "ready_for_review" && checklist.status === "complete"
          ? "ready_for_review"
          : review.status === "needs_safety_review" || checklist.status === "needs_review"
            ? "needs_safety_review"
            : "evidence_incomplete";
      return sanitizeFlightWorkflowRcReviewViewModel({
        status:status,
        title:"只读 RC 候选复核",
        cards:buildFlightWorkflowRcReviewCards(input || {}),
        reviewRows:buildFlightWorkflowRcReviewRows(input || {}),
        evidenceRows:buildFlightWorkflowRcEvidenceRowsForView(input || {}),
        riskRows:[
          row("safety", "安全红线", review.status === "blocked" || checklist.status === "blocked" ? "RC 复核已阻断" : "复核不代表交易能力", review.status === "blocked" || checklist.status === "blocked" ? "blocked" : "pass"),
          row("regression_audit", "回归审计", obj(regressionAudit.userFacingSummary).resultLabel || regressionAudit.status || "仍需复核", regressionAudit.status === "passed" ? "pass" : (regressionAudit.status === "blocked" ? "blocked" : "warning")),
          row("release_risk", "发布风险", obj(releaseRisk.userFacingSummary).resultLabel || releaseRisk.status || "存在待复核风险", releaseRisk.status === "clear" ? "pass" : (releaseRisk.status === "blocked" ? "blocked" : "warning")),
          row("next_step", "下一步", obj(releaseRisk.userFacingSummary).resultLabel || obj(regressionAudit.userFacingSummary).resultLabel || obj(review.reviewDecision).label || obj(checklist.userFacingSummary).resultLabel || "证据仍需补充", status === "ready_for_review" && releaseRisk.status === "clear" ? "pass" : (review.status === "blocked" || checklist.status === "blocked" || releaseRisk.status === "blocked" ? "blocked" : "warning"))
        ],
        caveat:CAVEAT,
        rcCandidateReviewSummary:review,
        rcEvidenceReviewSummary:checklist,
        rcRegressionAuditSummary:regressionAudit,
        releaseRiskLedgerSummary:releaseRisk,
        redacted:true
      });
    } catch (error) {
      return sanitizeFlightWorkflowRcReviewViewModel({ status:"failed_safe", cards:[], reviewRows:[], evidenceRows:[], riskRows:[], caveat:CAVEAT });
    }
  }
  function buildFlightWorkflowRcReviewViewModelAuditDraft(input) {
    const vm = buildFlightWorkflowRcReviewViewModel(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_RC_REVIEW_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_REVIEW_VIEW_MODEL_VERSION,
      status:vm.status,
      cardCount:vm.cards.length,
      reviewRowCount:vm.reviewRows.length,
      evidenceRowCount:vm.evidenceRows.length,
      riskRowCount:vm.riskRows.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      fileWrite:false,
      download:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    });
  }

  window.WeishanFlightWorkflowRcReviewViewModel = {
    FLIGHT_WORKFLOW_RC_REVIEW_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildFlightWorkflowRcReviewViewModel,
    buildFlightWorkflowRcReviewCards,
    buildFlightWorkflowRcReviewRows,
    buildFlightWorkflowRcEvidenceRowsForView,
    buildFlightWorkflowRcReviewViewModelAuditDraft
  };
})();
