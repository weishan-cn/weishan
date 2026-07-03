;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_RC_REGRESSION_VIEW_MODEL_VERSION = "4.1.4";
  const VIEW_MODEL_NAME = "flight_workflow_rc_regression_view_model_v1";
  const CAVEAT = "该页面只用于只读 RC 回归审计，不保存真实身份、不发送真实邀请、不提供交易能力。";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|身份证|护照|银行卡|passport/ig, "redacted")
      .trim();
  }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function card(cardId, label, value) { return { cardId:text(cardId || "card"), label:text(label), value:text(value), redacted:true }; }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label),
      value:text(value),
      status:/^(pass|warning|blocked)$/.test(status) ? status : "warning",
      redacted:true
    };
  }
  function api(name) { return window[name] || {}; }
  function auditPackOf(input) {
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
  function buildFlightWorkflowRcRegressionRows(input) {
    const pack = auditPackOf(input || {});
    return toArray(pack.regressionRows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); });
  }
  function buildFlightWorkflowReleaseRiskRowsForView(input) {
    const ledger = releaseRiskOf(input || {});
    return toArray(ledger.rows).map(function (item) { return row(item.rowId || "row", item.label || "", item.value || "", item.status); });
  }
  function buildFlightWorkflowRcRegressionCards(input) {
    const pack = auditPackOf(input || {});
    const ledger = releaseRiskOf(input || {});
    return clone([
      card("regression_audit", "回归审计", obj(pack.userFacingSummary).resultLabel || pack.status || "仍需复核"),
      card("release_risk", "发布风险", obj(ledger.userFacingSummary).resultLabel || ledger.status || "存在待复核风险"),
      card("safety", "安全红线", pack.status === "blocked" || ledger.status === "blocked" ? "发布风险已阻断" : "回归不代表交易能力"),
      card("next_step", "下一步", ledger.status === "clear" ? "暂无阻断风险" : obj(ledger.userFacingSummary).resultLabel || "存在待复核风险")
    ]);
  }
  function buildFlightWorkflowRcRegressionViewModel(input) {
    try {
      const pack = auditPackOf(input || {});
      const ledger = releaseRiskOf(input || {});
      const status = pack.status === "blocked" || ledger.status === "blocked"
        ? "blocked"
        : ledger.status === "clear" && pack.status === "passed"
          ? "clear"
          : ledger.status === "open_risks"
            ? "open_risks"
            : "needs_review";
      return clone({
        viewModelName:VIEW_MODEL_NAME,
        appVersion:FLIGHT_WORKFLOW_RC_REGRESSION_VIEW_MODEL_VERSION,
        status:status,
        title:"只读 RC 回归审计",
        cards:buildFlightWorkflowRcRegressionCards(input || {}),
        regressionRows:buildFlightWorkflowRcRegressionRows(input || {}),
        riskRows:buildFlightWorkflowReleaseRiskRowsForView(input || {}),
        caveat:CAVEAT,
        rcRegressionAuditSummary:clone(pack),
        releaseRiskLedgerSummary:clone(ledger),
        rcCopyFinalizationSummary:clone(obj(input).rcCopyFinalizationSummary || pack.rcCopyFinalizationSummary || ledger.rcCopyFinalizationSummary || null),
        safetyDisclosureReviewSummary:clone(obj(input).safetyDisclosureReviewSummary || pack.safetyDisclosureReviewSummary || ledger.safetyDisclosureReviewSummary || null),
        rcCopyReviewStatus:text(obj(input).rcCopyReviewStatus || pack.rcCopyReviewStatus || ledger.rcCopyReviewStatus || ""),
        safetyDisclosureStatus:text(obj(input).safetyDisclosureStatus || pack.safetyDisclosureStatus || ledger.safetyDisclosureStatus || ""),
        safeToFinalizeUserFacingCopy:obj(input).safeToFinalizeUserFacingCopy === true || pack.safeToFinalizeUserFacingCopy === true || ledger.safeToFinalizeUserFacingCopy === true,
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
    } catch (error) {
      return clone({
        viewModelName:VIEW_MODEL_NAME,
        appVersion:FLIGHT_WORKFLOW_RC_REGRESSION_VIEW_MODEL_VERSION,
        status:"failed_safe",
        title:"只读 RC 回归审计",
        cards:[],
        regressionRows:[],
        riskRows:[],
        caveat:CAVEAT,
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
  }
  function buildFlightWorkflowRcRegressionViewModelAuditDraft(input) {
    const model = buildFlightWorkflowRcRegressionViewModel(input || {});
    return clone({
      eventType:"FLIGHT_WORKFLOW_RC_REGRESSION_VIEW_MODEL_AUDIT_DRAFT",
      viewModelName:VIEW_MODEL_NAME,
      appVersion:FLIGHT_WORKFLOW_RC_REGRESSION_VIEW_MODEL_VERSION,
      status:model.status,
      cardCount:model.cards.length,
      regressionRowCount:model.regressionRows.length,
      riskRowCount:model.riskRows.length,
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

  window.WeishanFlightWorkflowRcRegressionViewModel = {
    FLIGHT_WORKFLOW_RC_REGRESSION_VIEW_MODEL_VERSION,
    VIEW_MODEL_NAME,
    buildFlightWorkflowRcRegressionViewModel,
    buildFlightWorkflowRcRegressionCards,
    buildFlightWorkflowRcRegressionRows,
    buildFlightWorkflowReleaseRiskRowsForView,
    buildFlightWorkflowRcRegressionViewModelAuditDraft
  };
})();
